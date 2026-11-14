import { pickList, redis, keepFor, body, validId, fail } from "../lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt" });
  }
  try {
    const { id, undo, list } = body(req);
    const L = pickList(list);
    if (!validId(id)) return res.status(400).json({ error: "Ungültiger Wunsch" });

    const r = redis();
    if (!(await r.hexists(L.songs, id))) {
      return res.status(404).json({ error: "Diesen Wunsch gibt es nicht mehr." });
    }
    let votes = await r.hincrby(L.votes, id, undo ? -1 : 1);
    if (votes < 0) {
      await r.hset(L.votes, { [id]: 0 });
      votes = 0;
    }
    await keepFor(r.pipeline()).exec();
    return res.status(200).json({ id, votes });
  } catch (err) {
    return fail(res, err);
  }
}
