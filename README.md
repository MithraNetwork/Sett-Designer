# Sett Designer

De Sett-studio: 3D-scènes, renders en presentatieslides in de stijl van [sett.nl](https://www.sett.nl), plus een voorvertoning van de pagina's van de site.

## Starten

Je hebt [Node.js](https://nodejs.org) 18 of nieuwer nodig, en internet (React en three.js komen van een CDN; de componenten bundelt de server met esbuild via `npx`).

```bash
node studio/server.mjs
```

Open daarna http://localhost:8936/studio/.

## Wat zit erin

De startpagina (http://localhost:8936/studio/) leidt naar de drie onderdelen:

| Onderdeel | Wat je ermee doet |
|---|---|
| [**Slides**](studio/slide.html) | Kies een scène (de slide-scènes, de pagina-hero's of een van de dioramas), kadreer hem (formaat, licht, zoom, draai, hoogte, slepen om te verschuiven), zet zwevende labels met icoon en kleur, en download een PNG op twee keer het formaat. Alles wordt per scène in je browser onthouden. |
| [**Interactieve Sett-box**](studio/box.html) | De Sett 96 om rond te draaien en open te klappen, met uitleg bij de onderdelen. |
| [**Assetbibliotheek**](studio/assets.html) | Alle kant-en-klare beelden uit `framer/assets/`: scène-renders, kaartbeelden, foto's, video's en documenten, om te bekijken en te downloaden. Een nieuwe render staat er meteen in. |

Onder **Werkplaats**, voor wie aan de site bouwt:

| Pagina | Wat je ermee doet |
|---|---|
| [`studio/renders.html`](studio/renders.html) | Maakt de PNG-renders en de 3D-bestanden (GLB) van alle scènes uit [`studio/scenes.js`](studio/scenes.js) en [`studio/heroes.js`](studio/heroes.js). |
| [`studio/v2.html`](studio/v2.html) | Voorvertoning van de V2-pagina's van de site, met de inhoud uit [`studio/v2-content.js`](studio/v2-content.js). |
| [`studio/legal.html`](studio/legal.html) | De algemene voorwaarden en de privacyverklaring als A4; `node studio/legal/make-pdf.mjs` maakt er PDF's van. |
| [`studio/screenshots.html`](studio/screenshots.html) | Screenshots van alle pagina's; `node studio/screenshots/shoot.mjs desktop` en `python3 studio/screenshots/stitch.py` maken ze. |

## Mappen

- `studio/`: de studio zelf: de server, de scènes (`core.js`, `scenes.js`, `heroes.js`, `scroll.js`) en de pagina's.
- `framer/`: de Framer-componenten van de site (`.tsx`), de 3D-scènes (`.glb`) en de beelden in `framer/assets/`. De studio gebruikt dezelfde componenten als de site, zodat wat je hier ziet gelijk is aan sett.nl.
- `sett-v9.obj`, `sett-v9.mtl`, `tesla-y2.stl`: het Sett-model en de auto waar de scènes van gemaakt worden.

Opslaan vanuit de studio (renders, GLB's, PDF's) schrijft naar `framer/` en `framer/assets/`.
