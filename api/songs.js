import { K, MAX_SONGS, redis, body, clean, addSong, listSongs, fail } from "../lib/db.js";

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
      const out = await addSong(r, { title, artist, name, note });
      return res.status(out.status === "created" ? 201 : 200).json(out);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  } catch (err) {
    return fail(res, err);
  }
}
