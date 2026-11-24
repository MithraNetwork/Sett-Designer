// Sett V2 Case — the businesscase as a solid lime slab: one big claim, the
// checklist, the button. Deliberately loud after the dark sections.

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Arrow, V, or } from "./SettV2Kit.tsx"

interface Props {
    eyebrow?: string
    claim?: string
    body?: string
    points?: string
    button?: string
    link?: string
    background?: string
    style?: React.CSSProperties
}
const CSS = `
.v2c{ padding:40px 0 120px; }
.v2c-slab{ border-radius:40px; padding:72px; color:${V.ink}; display:grid; grid-template-columns:1.1fr .9fr; gap:56px; position:relative; overflow:hidden; }
.v2c-claim{ font-weight:900; letter-spacing:-0.05em; line-height:.88; font-size:clamp(48px, 7cqi, 120px); }
.v2c-list li{ display:flex; gap:14px; align-items:flex-start; padding:16px 0; border-top:1.5px solid rgba(0,0,0,.14); font-size:19px; line-height:1.4; font-weight:600; }
.v2c-list li::before{ content:"✓"; font-weight:900; }
.v2c-btn{ background:${V.ink}; color:${V.lime}; margin-top:30px; }
@container (max-width: 900px){ .v2c-slab{ grid-template-columns:1fr; padding:34px 24px; border-radius:28px; } }
`
export default function SettV2Case(props: Props) {
    const p = props
    const points = (or(p.points, "Geen subsidie nodig voor de businesscase\nVolledig gebruik van de stroom die je zelf opwekt\nBescherming tegen verdere afbouw van de salderingsregeling\nAltijd stroom, ook bij netuitval\nStabiele en lagere energierekening, maand na maand")).split("\n").filter(Boolean)
    return (
        <section className="v2 v2c" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2c-slab" style={{ background: or(p.background, V.lime) }}>
                    <div>
                        <div className="v2-mono" style={{ marginBottom: 20 }}>
                            {or(p.eyebrow, "De businesscase")}
                        </div>
                        <p className="v2c-claim">{or(p.claim, "Geen subsidie nodig.")}</p>
                        <p style={{ fontSize: 19, lineHeight: 1.5, marginTop: 26, maxWidth: 520 }}>{or(p.body, "We rekenen de businesscase graag door voor jouw situatie. Hoeveel panelen heb je? Wat is je verbruik? Hoe zit je contract in elkaar? Op basis daarvan krijg je een eerlijk beeld.")}</p>
                        <a className="v2-btn v2c-btn" href={or(p.link, "/contact")}>
                            {or(p.button, "Bereken wat Sett voor mij oplevert")} <Arrow />
                        </a>
                    </div>
                    <ul className="v2c-list">
                        {points.map((t) => (
                            <li key={t}>{t}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
SettV2Case.displayName = "Sett V2 · Businesscase"
addPropertyControls(SettV2Case, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "De businesscase" },
    claim: { type: ControlType.String, title: "Claim", displayTextArea: true, defaultValue: "Geen subsidie nodig." },
    body: { type: ControlType.String, title: "Tekst", displayTextArea: true, defaultValue: "We rekenen de businesscase graag door voor jouw situatie. Hoeveel panelen heb je? Wat is je verbruik? Hoe zit je contract in elkaar? Op basis daarvan krijg je een eerlijk beeld." },
    points: { type: ControlType.String, title: "Punten", displayTextArea: true, description: "Eén per regel.", defaultValue: "Geen subsidie nodig voor de businesscase\nVolledig gebruik van de stroom die je zelf opwekt\nBescherming tegen verdere afbouw van de salderingsregeling\nAltijd stroom, ook bij netuitval\nStabiele en lagere energierekening, maand na maand" },
    button: { type: ControlType.String, title: "Knop", defaultValue: "Bereken wat Sett voor mij oplevert" },
    link: { type: ControlType.Link, title: "Knop link", defaultValue: "/contact" },
    background: { type: ControlType.Color, title: "Kleur" },
})
