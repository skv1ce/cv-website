# cv-website

Meine persönliche Bewerbungs-Website für eine Ausbildung zum **Fachinformatiker für Systemintegration** in Hamburg.

**Live ansehen:** https://skv1ce.github.io/cv-website/

## Funktionen

- Zweisprachig (Deutsch / Englisch), die gewählte Sprache wird gespeichert
- Responsives Layout für Smartphone, Tablet und Desktop
- Projekte: Laptop-Wartung mit Vorher/Nachher-Slider, Wallpaper-Design, eigene Lern-App
- Interaktives Terminal (`help`, `projekte`, `ping hamburg` …)
- Lebenslauf als PDF zum Herunterladen (öffentliche Version ohne Adresse und Telefonnummer)
- Profilfoto, dessen Rand in Partikel zerfällt – unter der Maus setzt es sich zusammen und wird farbig
- Menü fürs Handy, Fortschrittslinie beim Scrollen, eigene 404-Seite, Vorschaubild für LinkedIn
- Lebenslauf auf Deutsch und Englisch – der Link folgt der gewählten Sprache
- Funktioniert offline (Service Worker) und lässt sich wie eine App installieren
- Sicherheit: Content-Security-Policy, keine Tracker, keine Dritt-Anbieter, E-Mail-Adresse nicht im HTML
- Druckversion: sauber in Schwarz auf Weiß (für Recruiter, die Seiten ausdrucken)
- Echte Fotos, Bilder ohne Metadaten (kein GPS)
- Eigenes Design, ohne Frameworks oder Vorlagen
- Datenschutz: Schriften liegen auf der Seite selbst, keine Anfragen an Google oder andere Dritte
- Veröffentlicht mit GitHub Pages

## Aufbau

```
index.html                  Inhalt (DE + EN)
404.html                    Seite für falsche Adressen
css/style.css               Gestaltung
js/main.js                  Sprache, Terminal, Slider, Partikel-Animationen
fonts/                      Geist, Geist Mono, Instrument Serif (SIL Open Font License)
img/                        Profilfoto, Vorschaubild (og.png), Projektfotos (WebP)
Lebenslauf_Bohdan_Krasokha.pdf   Lebenslauf DE (öffentliche Version)
CV_Bohdan_Krasokha_EN.pdf        Lebenslauf EN (öffentliche Version)
lebenslauf.txt / cv.txt          Lebenslauf als Text (für curl)
bohdan-krasokha.vcf              Kontaktkarte
manifest.webmanifest, sw.js      App-Installation und Offline-Modus
```

## Für Neugierige

- Terminal: `subnet 192.168.10.0/26` (echter Subnetz-Rechner), `sysinfo`, `ls`, `cat lebenslauf.txt`, `cd projekte`, `sha256sum lebenslauf.pdf`
- Lebenslauf direkt im Terminal: `curl https://skv1ce.github.io/cv-website/lebenslauf.txt`
- Browser-Konsole (F12): `hire()`
- Tastatur: `/` springt ins Terminal, `?` zeigt die Kürzel – und ein Klassiker aus den 80ern

## Technik

HTML, CSS, JavaScript – ohne Bibliotheken.

## Lokal starten

Repository klonen und im Ordner einen kleinen Webserver starten, z. B. `python -m http.server`, dann http://localhost:8000 öffnen.
(Direktes Öffnen von `index.html` funktioniert auch, nur lädt der Browser die Schriften dann nicht.)
