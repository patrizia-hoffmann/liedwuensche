# Liedwünsche zu Silvias 60. Geburtstag

Eine Webseite, auf der Gäste per Handy Liedwünsche für den Abend eintragen und mit einem Herz die Wünsche anderer liken. Die beliebtesten Lieder stehen oben. Der DJ öffnet denselben Link, liest die Liste und spielt die Lieder in seinem eigenen Programm. Bei jedem Wunsch gibt es einen kleinen Link „auf spotify suchen“.

Die Seite läuft kostenlos auf Vercel. Die Wünsche liegen in einer Upstash-Redis-Datenbank, deren kostenloser Tarif für eine Feier reicht.

## Was drin ist

| Datei | Wozu |
| --- | --- |
| `config.js` | Name, Datum, Ort und wer für den Datenschutzhinweis verantwortlich ist. **Nur diese Datei musst du anpassen.** |
| `index.html` | Die Seite |
| `styles.css` | Aussehen |
| `api/` | Speichern, Liken, „gespielt“ (nur DJ) und Glückwünsche |
| `lib/db.js` | Datenbankanbindung und automatische Löschfrist |
| `fonts/` | Schrift Bricolage Grotesque (SIL Open Font License), liegt auf dem eigenen Server |

## Einrichten (ca. 10 Minuten, am besten am Laptop)

1. **Texte anpassen:** In `config.js` Datum, Ort und bei `responsible` deinen Namen mit einer Kontaktmöglichkeit eintragen.
2. **Auf GitHub hochladen:** Auf github.com ein neues Repository anlegen (z. B. `liedwuensche-60`, gern privat). Dann „uploading an existing file“ wählen und den **Inhalt** dieses Ordners hineinziehen (die Ordner `api` und `lib` müssen mit hoch). Mit „Commit changes“ bestätigen.
3. **Mit Vercel verbinden:** Auf vercel.com mit dem GitHub-Konto anmelden, „Add New… → Project“, das Repository auswählen. Framework-Preset: **Other**, dann „Deploy“.
4. **Datenbank anschließen:** Im Vercel-Projekt auf den Reiter **Storage** → „Create Database“ → **Upstash for Redis** (kostenloser Plan) → mit diesem Projekt verbinden. Vercel trägt die Zugangsdaten automatisch ein.
5. **Neu veröffentlichen:** Reiter **Deployments** → beim obersten Eintrag „…“ → **Redeploy**. Erst danach kennt die Seite die Datenbank.
6. **Testen:** Den Vercel-Link (z. B. `liedwuensche-60.vercel.app`) öffnen und einen Testwunsch eintragen.
7. **Vor der Feier aufräumen:** Testeinträge löschst du im Upstash-Dashboard (Vercel → Storage → Datenbank öffnen → „Data Browser“). Wenn du die drei Einträge `lied:songs`, `lied:keys` und `lied:votes` löschst, ist die Liste wieder leer.

Tipp: In Vercel unter Settings → Domains kannst du die Adresse kürzer machen, z. B. `gabi60.vercel.app`, falls sie noch frei ist.

## DJ-Passwort

Der DJ meldet sich unten auf der Seite über „dj-login“ an und kann dann Lieder als gespielt markieren. Gespielte Lieder rutschen für alle in „lief schon“.

Das Passwort ist schon eingerichtet. Im Code steht nur seine SHA-256-Prüfsumme (`DJ_PASSWORD_SHA256` in `lib/db.js`), nicht das Passwort selbst. Wer es ändern will, setzt in Vercel die Umgebungsvariable `DJ_PASSWORT`, die hat dann Vorrang.

## Glückwünsche

Oben auf der Seite gibt es den Button „silvia gratulieren“. Ein Tipp zählt einen Glückwunsch und lässt Konfetti fliegen. Danach kann man noch eine Nachricht schreiben. Die Nachrichten stehen unten auf der Seite.

## Karaoke

Eigener Bereich mit eigenem Formular („wer will singen?“) und eigenen Likes. Bei jedem Song gibt es einen Link zur Karaoke-Version auf YouTube. Der DJ kann Songs als „gesungen“ abhaken.

## Liste für rekordbox, Spotify & Co.

Im DJ-Modus kopiert „offene wünsche kopieren“ alle noch nicht gespielten Wünsche als Text (`Interpret - Titel`, nach Likes sortiert). Den Text fügt man z. B. bei TuneMyMusic oder Soundiiz ein und erstellt daraus eine Playlist bei einem Streamingdienst, den rekordbox 7 anbindet (z. B. Spotify, TIDAL, Apple Music, Beatport, SoundCloud). Die Playlist taucht dann in rekordbox auf.

## Ohne GitHub

Wer Node.js installiert hat, kann im Ordner einfach `npx vercel` ausführen und den Fragen folgen. Danach Schritte 4 und 5 im Vercel-Dashboard.

## Datenschutz

* Keine Cookies, kein Tracking, keine Google-Fonts, keine Einbettungen fremder Dienste. Die Seite lädt nur Dateien vom eigenen Server.
* Gespeichert werden nur Titel, Interpret und freiwillig Name und Widmung. Keine IP-Adressen in der Datenbank.
* Die Liste löscht sich 30 Tage nach dem letzten Wunsch oder der letzten Stimme von selbst (`RETENTION_DAYS` in `lib/db.js`).
* Die Seite läuft in Frankfurt (`regions` in `vercel.json`). Bei der Upstash-Datenbank sollte die Region ebenfalls in der EU liegen (z. B. Frankfurt, `eu-central-1`). Das siehst du in Vercel unter Storage → Datenbank → Settings.
* Suchmaschinen werden gebeten, die Seite nicht aufzunehmen (`noindex`).
* Auf der Seite gibt es unten einen aufklappbaren Datenschutzhinweis.

## Gut zu wissen

* Gleiche Lieder werden zusammengefasst. „Griechischer Wein“ und „griechischer wein“ zählen als ein Wunsch, die zweite Eingabe wird als Stimme gewertet.
* Die Liste aktualisiert sich alle 20 Sekunden von selbst.
* Abstimmen ist pro Gerät begrenzt (im Browser gespeichert). Wer es darauf anlegt, kann mit einem zweiten Browser doppelt stimmen. Für eine Geburtstagsfeier reicht das.
* Über die Seite kann niemand etwas löschen. Das geht nur im Upstash-Dashboard (siehe Schritt 7).
* Maximal 1500 Wünsche, lange Titel und Namen werden gekürzt, ein verstecktes Feld hält einfache Spam-Bots ab.
