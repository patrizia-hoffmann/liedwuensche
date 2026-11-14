import { addSong } from "./db.js";

// Einmaliger Import. Läuft genau einmal pro Datenbank.
const SEED_FLAG = "lied:seeded-2026-11-14-b";

const SONGS = [
  ["Eine neue Liebe ist wie ein neues Leben", "Jürgen Marcus"],
  ["Bergbauernbuam", "Melissa Naschenweng"],
];

export async function seedOnce(r) {
  const first = await r.set(SEED_FLAG, "1", { nx: true });
  if (first !== "OK") return;
  for (const [title, artist] of SONGS) await addSong(r, { title, artist });
}
