import { K, MAX_SONGS, redis, body, clean, normalize, newId, listSongs, fail } from "../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      return res.status(200).json({ songs: await listSongs() });
    }

    if (req.method === "POST") {
      const b = body(req);
      if (b.website) return res.status(201).json({ status: "created" }); // Spam-Falle

      const title = clean(b.title, 120);
      const artist = clean(b.artist, 120);
      const name = clean(b.name, 60);
      const note = clean(b.note, 200);
      if (!title) return res.status(400).json({ error: "Bitte gib einen Liedtitel ein." });

      const r = redis();
      if ((await r.hlen(K.songs)) >= MAX_SONGS) {
        return res.status(429).json({ error: "Die Wunschliste ist voll." });
      }

      const key = normalize(title) + "|" + normalize(artist);
      const id = newId();
      const isNew = await r.hsetnx(K.keys, key, id);

      if (!isNew) {
        // Gleiches Lied schon gewünscht: Stimme dazuzählen statt doppelt eintragen
        const existing = String(await r.hget(K.keys, key));
        if (await r.hexists(K.songs, existing)) {
          const votes = await r.hincrby(K.votes, existing, 1);
          return res.status(200).json({ status: "duplicate", id: existing, votes });
        }
        await r.hset(K.keys, { [key]: id }); // verwaister Eintrag, neu anlegen
      }

      const song = { id, title, artist, name, note, key, createdAt: Date.now() };
      await r.pipeline().hset(K.songs, { [id]: song }).hset(K.votes, { [id]: 1 }).exec();
      return res.status(201).json({ status: "created", id, votes: 1 });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  } catch (err) {
    return fail(res, err);
  }
}
