import { K, MAX_NOTES, redis, keepFor, body, clean, fail } from "../lib/db.js";

// Glückwünsche für das Geburtstagskind:
//   { kind: "cheer" }                      -> Zähler +1
//   { kind: "note", name, text }           -> Nachricht speichern
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }
  try {
    const b = body(req);
    if (b.website) return res.status(200).json({ ok: true }); // Spam-Falle
    const r = redis();

    if (b.kind === "cheer") {
      const count = await r.incr(K.cheers);
      await keepFor(r.pipeline()).exec();
      return res.status(200).json({ count });
    }

    if (b.kind === "note") {
      const text = clean(b.text, 280);
      const name = clean(b.name, 60);
      if (!text) return res.status(400).json({ error: "Schreib ein paar Worte." });
      await keepFor(
        r.pipeline().lpush(K.notes, { name, text, createdAt: Date.now() }).ltrim(K.notes, 0, MAX_NOTES - 1)
      ).exec();
      return res.status(201).json({ ok: true });
    }

    return res.status(400).json({ error: "Unbekannte Aktion" });
  } catch (err) {
    return fail(res, err);
  }
}
