import { Redis } from "@upstash/redis";
import { createHash, timingSafeEqual } from "node:crypto";

// Schlüssel in der Datenbank
export const K = {
  songs: "lied:songs",   // Hash: id -> Liedwunsch
  keys: "lied:keys",     // Hash: normalisierter Titel|Interpret -> id (gegen Doppelte)
  votes: "lied:votes",   // Hash: id -> Anzahl Stimmen
  played: "lied:played", // Set: ids, die der DJ schon gespielt hat
};


export const MAX_SONGS = 1500;

// Datenschutz: Die ganze Liste löscht sich automatisch so viele Tage
// nach dem letzten Wunsch oder der letzten Stimme.
export const RETENTION_DAYS = 30;

export function keepFor(pipeline) {
  const seconds = RETENTION_DAYS * 24 * 60 * 60;
  for (const key of Object.values(K)) pipeline.expire(key, seconds);
  return pipeline;
}

// Vercel/Upstash benennt die Zugangsdaten je nach Weg und Präfix unterschiedlich
// (KV_REST_API_URL, UPSTASH_REDIS_REST_URL, STORAGE_KV_REST_API_URL ...).
function findCredentials() {
  const env = process.env;
  const fixed = [
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ];
  for (const [u, t] of fixed) if (env[u] && env[t]) return { url: env[u], token: env[t] };
  for (const name of Object.keys(env)) {
    if (/(_REST_API_URL|REDIS_REST_URL)$/.test(name)) {
      const tokenName = name.replace(/_URL$/, "_TOKEN");
      if (env[tokenName]) return { url: env[name], token: env[tokenName] };
    }
  }
  return {};
}

let client;
export function redis() {
  if (client) return client;
  const { url, token } = findCredentials();
  if (!url || !token) {
    const e = new Error("NO_DB");
    e.code = "NO_DB";
    throw e;
  }
  client = new Redis({ url, token });
  return client;
}

export function body(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export function clean(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ")      // "(Remastered 2011)" usw. ignorieren
    .replace(/\b(feat|ft)\b.*$/g, " ")
    .replace(/[^a-z0-9ß]+/g, " ")
    .trim();
}

export function validId(id) {
  return typeof id === "string" && /^s[a-z0-9]{6,30}$/.test(id);
}

// DJ-Passwort: steht in Vercel als Umgebungsvariable DJ_PASSWORT
export function djPassword() {
  return process.env.DJ_PASSWORT || process.env.DJ_PASSWORD || process.env.ADMIN_KEY || "";
}
export function isDj(key) {
  const expected = djPassword();
  if (!expected || typeof key !== "string" || !key) return false;
  const a = createHash("sha256").update(key.trim()).digest();
  const b = createHash("sha256").update(expected.trim()).digest();
  return timingSafeEqual(a, b);
}

export function newId() {
  return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Einen Wunsch eintragen. Gibt es das Lied schon, zählt eine Stimme dazu.
export async function addSong(r, { title, artist = "", name = "", note = "" }) {
  const key = normalize(title) + "|" + normalize(artist);
  const id = newId();
  const isNew = await r.hsetnx(K.keys, key, id);
  if (!isNew) {
    const existing = String(await r.hget(K.keys, key));
    if (await r.hexists(K.songs, existing)) {
      const votes = await r.hincrby(K.votes, existing, 1);
      await keepFor(r.pipeline()).exec();
      return { status: "duplicate", id: existing, votes };
    }
    await r.hset(K.keys, { [key]: id }); // verwaister Eintrag, neu anlegen
  }
  const song = { id, title, artist, name, note, key, createdAt: Date.now() };
  await keepFor(r.pipeline().hset(K.songs, { [id]: song }).hset(K.votes, { [id]: 1 })).exec();
  return { status: "created", id, votes: 1 };
}

export async function listAll() {
  const r = redis();
  const [songs, votes, played] = await r
    .pipeline()
    .hgetall(K.songs)
    .hgetall(K.votes)
    .smembers(K.played)
    .exec();
  const playedSet = new Set(played || []);
  const list = Object.values(songs || {})
    .filter((s) => s && typeof s === "object" && s.id)
    .map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist || "",
      name: s.name || "",
      note: s.note || "",
      createdAt: s.createdAt || 0,
      votes: Number((votes || {})[s.id] || 0),
      played: playedSet.has(s.id),
    }))
    .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);
  return { songs: list };
}

export function fail(res, err) {
  if (err && err.code === "NO_DB") {
    return res.status(500).json({
      error: "Die Datenbank ist noch nicht verbunden. Bitte in Vercel unter Storage eine Upstash-Redis-Datenbank mit dem Projekt verknüpfen.",
    });
  }
  console.error(err);
  return res.status(500).json({ error: "Da ist etwas schiefgelaufen. Bitte gleich nochmal versuchen." });
}
