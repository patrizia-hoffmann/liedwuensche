import { pickList, redis, keepFor, body, validId, isDj, djPassword, fail } from "../lib/db.js";

// Nur für den DJ (mit Passwort):
//   { key, check: true }        -> Passwort prüfen
//   { key, id, played: bool }   -> Lied als gespielt markieren oder zurücknehmen
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }
  if (!djPassword()) {
    return res.status(500).json({ error: "Es ist noch kein DJ-Passwort eingerichtet (DJ_PASSWORT in Vercel)." });
  }
  const { key, id, played, check, list } = body(req);
  const L = pickList(list);
  if (!isDj(key)) return res.status(401).json({ error: "Falsches Passwort" });
  if (check) return res.status(200).json({ ok: true });

  try {
    if (!validId(id)) return res.status(400).json({ error: "Ungültiger Wunsch" });
    const r = redis();
    if (!(await r.hexists(L.songs, id))) {
      return res.status(404).json({ error: "Diesen Wunsch gibt es nicht mehr." });
    }
    const p = r.pipeline();
    played === false ? p.srem(L.played, id) : p.sadd(L.played, id);
    await keepFor(p).exec();
    return res.status(200).json({ id, played: played !== false });
  } catch (err) {
    return fail(res, err);
  }
}
