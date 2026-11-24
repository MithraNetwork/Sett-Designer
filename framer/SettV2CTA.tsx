// Sett V2 CTA — the close: a perspective grid behind a big masked headline, the
// buttons (one of them to the meeting scheduler on /contact), an optional quote beneath.
// The grid is drawn as SVG in the code: nothing to load, nothing to compile.

import * as React from "react"
import { useId, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Arrow, V, or, linkTo } from "./SettV2Kit.tsx"

interface Props {
    eyebrow?: string
    headline?: string
    body?: string
    primary?: string
    primaryLink?: string
    primaryLinkHash?: string
    secondary?: string
    secondaryLink?: string
    secondaryLinkHash?: string
    meeting?: string
    meetingLink?: string
    quote?: string
    source?: string
    mood?: "flow" | "congest" | "night"
    style?: React.CSSProperties
}
const CSS = `
.v2z{ position:relative; overflow:hidden; }
.v2z-art{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.v2z-glow{ position:absolute; inset:0; pointer-events:none; background:radial-gradient(60% 45% at 72% 62%, color-mix(in srgb, var(--tone) 16%, transparent), transparent 70%); }
.v2z-in{ position:relative; z-index:2; padding-top:180px; padding-bottom:120px; }
.v2z-btns{ display:flex; gap:12px; flex-wrap:wrap; margin-top:40px; }
.v2z-quote{ margin-top:140px; display:grid; grid-template-columns:1fr 1.4fr; gap:40px; border-top:1px solid rgba(255,255,255,.14); padding-top:34px; }
.v2z-quote p{ font-size:clamp(22px, 2.2cqi, 34px); line-height:1.3; font-weight:500; letter-spacing:-0.01em; }
@container (max-width: 900px){ .v2z-quote{ grid-template-columns:1fr; } .v2z-in{ padding-top:130px; padding-bottom:90px; } }
`
const TONES = { flow: V.lime, congest: V.sun, night: V.purpleLight }

// a floor grid running to the horizon: lines from a vanishing point, rows closer
// together towards the back, fading out into the dark
function GridArt({ tone }: { tone: string }) {
    const id = useId().replace(/:/g, "")
    const W = 1600, H = 900, hz = 380, vx = 1060
    const cols: string[] = []
    for (let i = -24; i <= 24; i++) cols.push(`M${vx} ${hz} L${vx + i * 150} ${H + 400}`)
    const rows: number[] = []
    for (let k = 1; k <= 18; k++) rows.push(hz + Math.pow(k / 18, 2.2) * (H + 400 - hz))
    return (
        <svg className="v2z-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
                <linearGradient id={id + "f"} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0.36" stopColor="#fff" stopOpacity="0" />
                    <stop offset="0.62" stopColor="#fff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#fff" stopOpacity="1" />
                </linearGradient>
                <mask id={id + "m"}>
                    <rect width={W} height={H} fill={`url(#${id}f)`} />
                </mask>
            </defs>
            <g mask={`url(#${id}m)`} stroke={tone} fill="none" strokeOpacity="0.42" strokeWidth="1">
                {cols.map((d, i) => (
                    <path key={i} d={d} />
                ))}
                {rows.map((y, i) => (
                    <line key={i} x1="0" x2={W} y1={y} y2={y} />
                ))}
            </g>
            <line x1="0" x2={W} y1={hz} y2={hz} stroke={tone} strokeOpacity="0.18" />
        </svg>
    )
}

export default function SettV2CTA(props: Props) {
    const p = props
    const ref = useRef<HTMLDivElement>(null)
    useReveal(ref)
    return (
        <section className="v2 v2z" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2z-glow" style={{ ["--tone" as string]: TONES[or(p.mood, "flow")] ?? V.lime } as React.CSSProperties} />
            <GridArt tone={TONES[or(p.mood, "flow")] ?? V.lime} />
            <div className="v2-grid" style={{ zIndex: 1 }} />
            <div ref={ref} className="v2z-in v2-wrap">
                <div className="v2-mono v2-fade" style={{ color: V.lime, marginBottom: 26 }}>
                    {or(p.eyebrow, "Laat hier je gegevens achter")}
                </div>
                <h2 className="v2-display" style={{ maxWidth: "12ch" }}>
                    <Lines text={or(p.headline, "De eerste|onzichtbare|energiehub|van Nederland.")} />
                </h2>
                <p className="v2-lead v2-fade" style={{ marginTop: 30 }}>
                    {or(p.body, "Wij zijn op zoek naar particulieren, ondernemers en gemeenten die netontlastende laadinfrastructuur willen neerzetten zonder de openbare ruimte op te offeren.")}
                </p>
                <div className="v2z-btns v2-fade">
                    <a className="v2-btn lime" href={linkTo(p.primaryLink, p.primaryLinkHash, "/particulieren")}>
                        {or(p.primary, "Particulieren")} <Arrow />
                    </a>
                    <a className="v2-btn line" href={linkTo(p.secondaryLink, p.secondaryLinkHash, "/bedrijven")}>
                        {or(p.secondary, "Bedrijven")} <Arrow />
                    </a>
                    {p.meeting !== "" && (
                        <a className="v2-btn line" href={or(p.meetingLink, "/contact#afspraak")}>
                            {p.meeting ?? "Plan een afspraak"} <Arrow />
                        </a>
                    )}
                </div>
                {p.quote !== "" && (
                    <div className="v2z-quote v2-fade">
                        <span className="v2-mono v2-muted">{or(p.source, "Het bredere energietransitie-gesprek, 2026")}</span>
                        <p>{p.quote ?? "“Elke wethouder Energie heeft nú een netcongestie-probleem. Maar bouwen naast een laadpaal is niet meer de oplossing: we moeten slimmer bouwen, niet méér.”"}</p>
                    </div>
                )}
            </div>
        </section>
    )
}
SettV2CTA.displayName = "Sett V2 · Afsluiter"
addPropertyControls(SettV2CTA, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Laat hier je gegevens achter" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| of nieuwe regel breekt de regel.", defaultValue: "De eerste|onzichtbare|energiehub|van Nederland." },
    body: { type: ControlType.String, title: "Tekst", displayTextArea: true, defaultValue: "Wij zijn op zoek naar particulieren, ondernemers en gemeenten die netontlastende laadinfrastructuur willen neerzetten zonder de openbare ruimte op te offeren." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Particulieren" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/particulieren" },
    primaryLinkHash: { type: ControlType.String, title: "Knop 1 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Bedrijven" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", defaultValue: "/bedrijven" },
    secondaryLinkHash: { type: ControlType.String, title: "Knop 2 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    meeting: { type: ControlType.String, title: "Knop 3", defaultValue: "Plan een afspraak", description: "Naar de afspraakplanner. Leeg: geen derde knop." },
    meetingLink: { type: ControlType.Link, title: "Knop 3 link", defaultValue: "/contact#afspraak" },
    quote: { type: ControlType.String, title: "Quote", displayTextArea: true, defaultValue: "“Elke wethouder Energie heeft nú een netcongestie-probleem. Maar bouwen naast een laadpaal is niet meer de oplossing: we moeten slimmer bouwen, niet méér.”" },
    source: { type: ControlType.String, title: "Bron", defaultValue: "Het bredere energietransitie-gesprek, 2026" },
    mood: { type: ControlType.Enum, title: "Kleur grid", options: ["flow", "congest", "night"], optionTitles: ["Groen", "Amber", "Paars"], defaultValue: "flow" },
})
