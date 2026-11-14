# Liedwünsche zum 60. Geburtstag

Eine Webseite, auf der Gäste per Handy Liedwünsche für den Abend eintragen und mit „Ich auch“ für die Wünsche anderer stimmen. Die beliebtesten Lieder stehen oben. Der DJ öffnet denselben Link, liest die Liste und spielt die Lieder in seinem eigenen Programm. Bei jedem Wunsch gibt es einen kleinen Link „In Spotify suchen“.

Die Seite läuft kostenlos auf Vercel. Die Wünsche liegen in einer Upstash-Redis-Datenbank, deren kostenloser Tarif für eine Feier reicht.

## Was drin ist

| Datei | Wozu |
| --- | --- |
| `config.js` | Name, Datum, Ort und Begrüßungstext. **Nur diese Datei musst du anpassen.** |
| `index.html` | Die Seite |
| `styles.css` | Aussehen |
| `api/` | Speichern und Abstimmen |
| `lib/db.js` | Datenbankanbindung |

## Einrichten (ca. 10 Minuten, am besten am Laptop)

1. **Texte anpassen:** In `config.js` den Namen, das Datum und den Ort eintragen.
2. **Auf GitHub hochladen:** Auf github.com ein neues Repository anlegen (z. B. `liedwuensche-60`, gern privat). Dann „uploading an existing file“ wählen und den **Inhalt** dieses Ordners hineinziehen (die Ordner `api` und `lib` müssen mit hoch). Mit „Commit changes“ bestätigen.
3. **Mit Vercel verbinden:** Auf vercel.com mit dem GitHub-Konto anmelden, „Add New… → Project“, das Repository auswählen. Framework-Preset: **Other**, dann „Deploy“.
4. **Datenbank anschließen:** Im Vercel-Projekt auf den Reiter **Storage** → „Create Database“ → **Upstash for Redis** (kostenloser Plan) → mit diesem Projekt verbinden. Vercel trägt die Zugangsdaten automatisch ein.
5. **Neu veröffentlichen:** Reiter **Deployments** → beim obersten Eintrag „…“ → **Redeploy**. Erst danach kennt die Seite die Datenbank.
6. **Testen:** Den Vercel-Link (z. B. `liedwuensche-60.vercel.app`) öffnen und einen Testwunsch eintragen.
7. **Vor der Feier aufräumen:** Testeinträge löschst du im Upstash-Dashboard (Vercel → Storage → Datenbank öffnen → „Data Browser“). Wenn du die drei Einträge `lied:songs`, `lied:keys` und `lied:votes` löschst, ist die Liste wieder leer.

Tipp: In Vercel unter Settings → Domains kannst du die Adresse kürzer machen, z. B. `gabi60.vercel.app`, falls sie noch frei ist.

## Ohne GitHub

Wer Node.js installiert hat, kann im Ordner einfach `npx vercel` ausführen und den Fragen folgen. Danach Schritte 4 und 5 im Vercel-Dashboard.

## Gut zu wissen

* Gleiche Lieder werden zusammengefasst. „Griechischer Wein“ und „griechischer wein“ zählen als ein Wunsch, die zweite Eingabe wird als Stimme gewertet.
* Die Liste aktualisiert sich alle 20 Sekunden von selbst.
* Abstimmen ist pro Gerät begrenzt (im Browser gespeichert). Wer es darauf anlegt, kann mit einem zweiten Browser doppelt stimmen. Für eine Geburtstagsfeier reicht das.
* Über die Seite kann niemand etwas löschen. Das geht nur im Upstash-Dashboard (siehe Schritt 7).
* Maximal 1500 Wünsche, lange Titel und Namen werden gekürzt, ein verstecktes Feld hält einfache Spam-Bots ab.
