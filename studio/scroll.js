// The renders that also ship as live, scroll-driven 3D (SettScrollScene in
// Framer). Each is exported as framer/sett-scroll-<name>.glb with the exact
// camera, lights and contact shadow of its PNG, so the two cross-fade cleanly.
//
// Effects (all driven by how far the image has scrolled through the screen):
//   twist: degrees the diorama turns either way as it passes through
//   lift:  the part named "scroll_lift" is lowered into place by this many units
//   grow:  the part(s) named "scroll_grow" rise from their base
//   drive: the vehicle named "scroll_drive" rolls into place over this distance
//   bob:   the parts named "scroll_bob…" float up and down by this many units
//   sun:   the key light swings this many degrees round: shadows sweep across
//   dusk:  evening falls: windows light up, the light warms and dims
// Energy lines pulse in every scene (the homepage's flow shader).
//
// card: the scene as a full-bleed image in a card (framing "card" in Framer):
//   zoom  how far the camera moves in on the PNG's framing (1 = as rendered)
//   focus where it looks, as a shift of the frame centre ([x, y] × frame size)
//   dolly how much further it pushes in over the scroll
// Card scenes also get a card-<name>.png poster, rendered in that framing.
export const SCROLL = {
    // /details
    "twee-pieken": { grow: true },
    // opens on the roof, then closes in on the solar panels
    "probleem-overdag": { sun: 50, card: { zoom: 2.3, focus: [-0.07, -0.24], zoomEnd: 3.6, focusEnd: [-0.13, -0.27] } },
    "probleem-avond": { dusk: true, card: { zoom: 1.5, focus: [0.02, -0.02], dolly: 0.16 } },
    "probleem-2027": { drive: 420, card: { zoom: 1.35, focus: [0, 0.04], dolly: 0.14 } },
    "keuze-batterijkast": { drive: 380, card: { zoom: 1.55, focus: [0.06, -0.16], dolly: 0.12 } },
    "keuze-ondergronds": { twist: 14, drive: 360, card: { zoom: 1.2, focus: [0, 0], dolly: 0.12 } },
    "cijfer-96kwh": { twist: 28 },
    "cijfer-22kw": { twist: 28 },
    "cijfer-50kw": { twist: 28 },
    "cijfer-0m2": { twist: 28 },
    "doelgroep-particulier": { twist: 10, card: { zoom: 1.45, focus: [0, -0.02], dolly: 0.16 } },
    "doelgroep-ondernemer": { twist: 10, card: { zoom: 1.4, focus: [0, 0], dolly: 0.16 } },
    "doelgroep-overheid": { twist: 8, card: { zoom: 1.35, focus: [0, 0], dolly: 0.16 } },
    "doelgroep-werkgever": { twist: 10, card: { zoom: 1.35, focus: [0, 0.02], dolly: 0.16 } },
    "onzichtbare-energiehub": { twist: 8, card: { zoom: 1.35, focus: [0, 0], dolly: 0.14 } },
    installatie: { lift: 170 },
    // /particulieren
    "salderen-stopt": { grow: true, card: { zoom: 1.15, focus: [0, 0.02], dolly: 0.1 } },
    onafhankelijk: { twist: 10, card: { zoom: 1.45, focus: [0, -0.02], dolly: 0.16 } },
    "grip-op-rekening": { grow: true, card: { zoom: 1.2, focus: [0, 0.02], dolly: 0.1 } },
    "voordeel-arbitrage": { grow: true, bob: 26, card: { zoom: 1.15, focus: [0, 0], dolly: 0.1 } },
    "voordeel-delen": { twist: 8, card: { zoom: 1.4, focus: [0, 0], dolly: 0.16 } },
    // /gemeenten
    "gemeente-laadplein": { twist: 8, card: { zoom: 1.3, focus: [0, 0], dolly: 0.14 } },
    "gemeente-nieuwbouw": { twist: 8, card: { zoom: 1.3, focus: [0, 0], dolly: 0.14 } },
    "gemeente-sporthal": { sun: 40, card: { zoom: 1.3, focus: [0, 0], dolly: 0.14 } },
    "gemeente-wijk": { twist: 6, card: { zoom: 1.25, focus: [0, 0], dolly: 0.12 } },
    // /bedrijven
    "bedrijven-hero": { twist: 8 },
    "voordeel-vermogen": { grow: true, card: { zoom: 1.02, focus: [0, -0.05], dolly: 0.08 } },
    "voordeel-netuitval": { twist: 6, card: { zoom: 1.4, focus: [0, 0], dolly: 0.16 } },
    "voordeel-peakshaving": { grow: true, card: { zoom: 1.15, focus: [0, 0], dolly: 0.1 } },
}
// the card framing's output aspect (cards crop it further, like object-fit: cover)
export const CARD = { width: 2400, height: 1600 }
