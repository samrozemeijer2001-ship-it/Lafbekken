# Lafbekken (winkelversie, in opbouw)

Dit is de basis voor de App Store- en Play Store-versie. Ten opzichte van de
privéversie is dit nieuw:

- **Strafwoorden**: de groep kiest bij het eerste spel hoe een kleine en een
  grote straf heet (standaard *kleine straf / grote straf*, of *slok / atje*,
  *strafpunt / superstraf*, of zelf typen). Later aan te passen via het
  tandwiel op het startscherm of *Instellingen* in het menu. Alle
  kaartteksten worden automatisch omgezet. Woorden worden per taal bewaard.
- **18+-check**: bij elk nieuw spel vult degene met de telefoon zijn
  geboortejaar in. Onder de 18 kan er niet gespeeld worden.
- **Nederlands en Engels**: wisselknop NL/EN op het startscherm. Alle teksten
  staan in `js/i18n.js`. De Engelse kaarten staan in `js/cards-en.js`
  (conceptset, nog te keuren). Elke taal heeft zijn eigen kaartenset en eigen
  aanpassingen.
- **Winkeltekst**: geen drank in de app-omschrijving; de kaartsoort 'drinken'
  heet nu 'Straffen'.

Nog niet in deze versie: accounts, betaalde pakketten, kaarteditor achter
betaling en advertenties. Die volgen in de volgende stappen.

---


Drankspel voor één telefoon. Iedereen kiest om de beurt **LAF** (veilig) of **LEF** (alles of niets). Dit is de privéversie om zelf mee te spelen: geen accounts, geen server, alles staat op je telefoon.

## Bestanden

| Bestand | Wat staat erin |
|---|---|
| `index.html` | De pagina zelf. De schermen worden door JavaScript gemaakt. |
| `style.css` | Alle vormgeving: fonts, knoppen, schermen, animaties. |
| `js/config.js` | **Kansen, kleuren per level, statuslabels en teksten.** Hier pas je de spelbalans aan. |
| `js/cards.js` | De standaardkaarten (124 stuks), met uitleg per veld bovenin. |
| `js/faces.js` | De gezichtjes en hun knipper- en rondkijkanimatie. |
| `js/store.js` | Opslaan op de telefoon (localStorage). |
| `js/manage.js` | Het scherm *Kaarten beheren*. |
| `js/app.js` | De spellogica en alle schermen. |
| `sw.js` | Service worker: zorgt dat de app ook offline opent. |
| `manifest.webmanifest`, `icons/` | Nodig om de app op je beginscherm te zetten. |
| `fonts/` | Barlow Condensed en Rubik, lokaal (licentie: SIL OFL, zie de txt-bestanden). |

## Lokaal openen

Dubbelklikken op `index.html` werkt, maar dan doet de offline-functie niet mee. Beter via een kleine webserver:

```
cd laffaard-app
python3 -m http.server 8000
```

Open daarna `http://localhost:8000` in je browser.

## Online zetten met GitHub Pages (zonder terminal)

1. Ga naar [github.com](https://github.com), log in en klik rechtsboven op **+ → New repository**.
2. Geef hem een naam, bijvoorbeeld `laffaard`. Kies **Private** als alleen jij de code mag zien. Gratis GitHub Pages werkt alleen met een **Public** repository. Met een betaald account (Pro) kan het ook privé. De app-link zelf is altijd openbaar voor wie hem kent.
3. Klik op **Create repository** en daarna op **uploading an existing file**.
4. Pak de zip uit en sleep **de inhoud** van de map (dus `index.html`, `style.css`, de mappen `js`, `fonts`, `icons` enzovoort) in het uploadvak. Zorg dat `index.html` bovenaan in de repository staat, niet in een submap.
5. Klik op **Commit changes**.
6. Ga naar **Settings → Pages**. Kies bij *Source* **Deploy from a branch**, bij *Branch* **main** en map **/ (root)**. Klik op **Save**.
7. Na een minuut of twee staat bovenaan die pagina je link, zoiets als `https://jouwnaam.github.io/laffaard/`.

Later iets aanpassen? Upload het gewijzigde bestand opnieuw via **Add file → Upload files**. Verhoog dan ook in `sw.js` de regel `const VERSION = "v1";` naar `"v2"` (enzovoort), zodat telefoons de nieuwe versie ophalen.

## Op je beginscherm zetten

**iPhone (Safari):** open de link → tik op het deelicoon (vierkantje met pijl) → **Zet op beginscherm** → **Voeg toe**.

**Android (Chrome):** open de link → menu (drie puntjes) → **App installeren** of **Toevoegen aan startscherm**.

De app opent daarna schermvullend, zonder adresbalk.

## Opslag en offline

- Je **kaarten** (ook eigen en aangepaste) en het **lopende spel** worden op de telefoon zelf bewaard. Sluit je de app halverwege, dan kun je via *Verder spelen* door.
- Er is geen account of synchronisatie: op een andere telefoon of in een andere browser begin je met de standaardkaarten.
- Wis je de websitegegevens van je browser, dan ben je je eigen kaarten kwijt.
- Na het eerste bezoek werkt alles **offline**: spelen, kaarten beheren en terugdraaien. Alleen updates ophalen heeft internet nodig.
- *Standaardkaarten herstellen* (onderaan *Kaarten beheren*) wist al je aanpassingen.

## Waar pas je wat aan?

- **Kansen** (`js/config.js`): `SAFE_BAD_CHANCE` (kans op slecht bij LAF per level), `RISK_WIN_CHANCE` (50% bij LEF), `DOUBLE_CHANCE` en `DOUBLE_MIN_HEAT` (dubbel of niks), `RISK_TYPE_CHANCES` (hoe vaak welke kaartsoort komt bij LEF).
- **Kleuren** (`js/config.js`): `LEVEL_COLORS` (per kant en level: achtergrond en inkt), `MOOD_END` (de kleur waar level 5 tot en met 10 naartoe groeit), `PLAYER_COLORS`. Basiskleuren van knoppen en het keuzescherm staan bovenin `style.css`.
- **Kaarten:** het makkelijkst in de app via *Kaarten beheren*. De standaardset staat in `js/cards.js`.
- **Timing:** `HOLD_MS` (hoe lang de doorgeefknop ingedrukt moet worden), `UNDO_DEPTH` (hoeveel beurten je terug kunt).

## Spelregels in het kort

- **LAF:** je safe-streak gaat omhoog, je heat één omlaag. Hoe vaker achter elkaar, hoe groter de kans op een slechte uitkomst (15, 30, 60, 80%).
- **LEF:** je heat gaat omhoog, je safe-streak terug naar 0. Altijd 50/50, maar de inzet stijgt.
- Straffen gaan tot level 4. De sfeer en kleuren groeien door tot level 10.
- **Dubbel of niks:** na een gewonnen LEF vanaf heat 3 is er 10% kans op de keuze. Kies je dubbel, dan krijg je bij winst een dubbele beloning (bij heat 4 deel je twee atjes uit aan twee verschillende mensen). Bij verlies neem je zelf een atje.
- **Regels** blijven als sticker op het keuzescherm staan tot de volgende beurt van wie de kaart trok, of zo lang als de kaart zegt.
- **Powers** werken op vertrouwen: tik op *gebruikt* als je ze inzet.
- **Forces** blokkeren bij de volgende beurt één kant.

Speel verantwoord.
