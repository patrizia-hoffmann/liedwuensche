import { Redis } from "@upstash/redis";

// Schlüssel in der Datenbank
export const K = {
  songs: "lied:songs",   // Hash: id -> Liedwunsch
  keys: "lied:keys",     // Hash: normalisierter Titel|Interpret -> id (gegen Doppelte)
  votes: "lied:votes",   // Hash: id -> Anzahl Stimmen
};

export const MAX_SONGS = 1500;

let client;
export function redis() {
  if (client) return client;
  // Vercel/Upstash setzt je nach Weg unterschiedliche Variablennamen
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
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

export function newId() {
  return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function listSongs() {
  const r = redis();
  const [songs, votes] = await r.pipeline().hgetall(K.songs).hgetall(K.votes).exec();
  return Object.values(songs || {})
    .filter((s) => s && typeof s === "object" && s.id)
    .map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist || "",
      name: s.name || "",
      note: s.note || "",
      createdAt: s.createdAt || 0,
      votes: Number((votes || {})[s.id] || 0),
    }))
    .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);
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
