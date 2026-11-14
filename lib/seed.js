import { addSong } from "./db.js";

// Einmaliger Import der ersten Wünsche. Läuft genau einmal pro Datenbank.
const SEED_FLAG = "lied:seeded-2026-11-14";

const SONGS = [
  ["Glory to the Brave", "HammerFall"],
  ["Bayern", "Die Toten Hosen"],
  ["Siebzehn Jahr, blondes Haar", "Udo Jürgens"],
  ["Der Kommissar", "Falco"],
  ["You Never Can Tell", "Chuck Berry", "Der Tanzsong aus Pulp Fiction"],
  ["Uptown Funk", "Mark Ronson feat. Bruno Mars"],
  ["You Can't Hurry Love", ""],
  ["Girls Just Want to Have Fun", "Cyndi Lauper"],
  ["Babacar", "France Gall"],
  ["Special Star", "Mango Groove"],
  ["Love's Theme", "Love Unlimited Orchestra"],
  ["Sex Bomb", "Tom Jones"],
  ["Pump It Up", "Danzel"],
  ["Night Fever", "Bee Gees"],
  ["Never Can Say Goodbye", "Gloria Gaynor", "Die Discoversion"],
  ["Bad Boy", "Gloria Estefan"],
  ["Die Sonne und du", "Udo Jürgens"],
  ["Santa Maria", "Roland Kaiser"],
  ["Atemlos durch die Nacht", "Helene Fischer"],
  ["Warum hast du nicht nein gesagt", "Maite Kelly & Roland Kaiser"],
];

export async function seedOnce(r) {
  const first = await r.set(SEED_FLAG, "1", { nx: true });
  if (first !== "OK") return;
  for (const [title, artist, note = ""] of SONGS) {
    await addSong(r, { title, artist, note });
  }
}
