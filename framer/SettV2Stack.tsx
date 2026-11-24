// Sett V2 Stack — cards that stack as you scroll: each slides up over the one
// before, which sinks back and dims. Text on one side, a full-bleed live 3D
// scene (SettScrollScene, card framing) on the other. Used for the three
// problems on /details, and any other set of 2–5 cards.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Near, Poster, onScrollFrame, onCanvas, clamp01, V, Img, merge, or } from "./SettV2Kit.tsx"
import SettScrollScene from "./SettScrollScene.tsx"

type Card = { label?: string; title?: string; body?: string; color?: string; ink?: string; model?: string; poster?: Img }
interface Props {
    label?: string
    heading?: string
    cards?: Card[]
    style?: React.CSSProperties
}

const DEFAULTS: Card[] = [
    { label: "Probleem 01 · Overdag", title: "Te veel zon. Omvormers schakelen uit.", body: "Op een zonnige dag kan het net de stroom niet aan. Een lokale energiehub slaat die zonnestroom op, vangt pieken op en houdt de ruimte boven de grond vrij.", color: V.cardSun[0], ink: V.cardSun[1] },
    { label: "Probleem 02 · Avond", title: "Iedereen thuis. Auto’s aan de paal.", body: "Tussen 17:00 en 20:00 komt de piek: koken, verwarmen, laden. Laadpalen worden teruggeregeld of uitgezet tijdens spitsuren – precies wanneer mensen juist willen laden.", color: V.cardPurple[0], ink: V.cardPurple[1] },
    { label: "Probleem 03 · 2027", title: "Werkgevers krijgen een extra heffing.", body: "Per 2027 betalen werkgevers een extra heffing op niet-elektrische auto’s van de zaak. De druk op laadinfrastructuur wordt exponentieel groter terwijl het net niet meegroeit.", color: V.cardBlue[0], ink: V.cardBlue[1] },
]

const CSS = `
.v2k{ padding:140px 0 60px; }
.v2k-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:40px; margin-bottom:64px; }
.v2k-card{ position:sticky; min-height:min(78vh, 720px); border-radius:36px; overflow:hidden; display:grid; grid-template-columns:.9fr 1.1fr;
  transform-origin:50% 0; will-change:transform; box-shadow:0 -30px 80px rgba(0,0,0,.25); }
.v2k-card + .v2k-card{ margin-top:18vh; }
.v2k-text{ padding:clamp(28px, 6vh, 56px); display:flex; flex-direction:column; justify-content:space-between; gap:28px; }
.v2k-num{ font-weight:900; font-size:clamp(64px, min(11cqi, 17vh), 190px); line-height:.8; letter-spacing:-0.06em; opacity:.16; }
.v2k-media{ min-height:300px; }
.v2k-media{ position:relative; }
.v2k-dim{ position:absolute; inset:0; background:${V.ink}; pointer-events:none; }
@container (max-width: 900px){
  .v2k-card{ grid-template-columns:1fr; grid-template-rows:auto minmax(38vh, 1fr); min-height:min(86vh, 820px); }
  .v2k-text{ padding:28px; }
  .v2k-num{ display:none; }
  .v2k-head{ flex-direction:column; align-items:flex-start; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Stack(props: Props) {
    const p = props
    const cards = (p.cards && p.cards.length ? p.cards : DEFAULTS).map((c, i) => merge(DEFAULTS[i % DEFAULTS.length], c))
    const refs = useRef<(HTMLDivElement | null)[]>([])
    const [cover, setCover] = useState<number[]>(cards.map(() => 0))
    // each card's own scroll progress for its scene: 0 → .35 while it slides up into
    // place, .35 → 1 while the next card comes up over it (the card itself is sticky,
    // so its scene can't measure this from its own position)
    const [prog, setProg] = useState<number[]>(cards.map(() => 0))
    // how far each card is covered by the next one (0 → 1)
    useEffect(() => {
        if (onCanvas()) return
        return onScrollFrame(() => {
            const out = cards.map((_, i) => {
                const next = refs.current[i + 1], me = refs.current[i]
                if (!next || !me) return 0
                const a = me.getBoundingClientRect(), b = next.getBoundingClientRect()
                return clamp01((a.bottom - b.top) / a.height)
            })
            setCover((prev) => (prev.every((v, i) => Math.abs(v - out[i]) < 0.002) ? prev : out))
            const vh = window.innerHeight || 1
            const pr = cards.map((_, i) => {
                const me = refs.current[i], next = refs.current[i + 1]
                if (!me) return 0
                const a = me.getBoundingClientRect()
                const stickTop = parseFloat(getComputedStyle(me).top) || 0
                const enter = clamp01((vh - a.top) / Math.max(1, vh - stickTop))
                let after = 0
                if (next) {
                    const b = next.getBoundingClientRect()
                    const nextStick = parseFloat(getComputedStyle(next).top) || 0
                    after = clamp01((vh - b.top) / Math.max(1, vh - nextStick))
                } else after = clamp01((stickTop - a.top) / (a.height * 0.6))
                return 0.35 * enter + 0.65 * after
            })
            setProg((prev) => (prev.every((v, i) => Math.abs(v - pr[i]) < 0.002) ? prev : pr))
        })
    }, [cards.length])
    return (
        <section className="v2 v2k" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2k-head">
                    <h2 className="v2-h2" style={{ maxWidth: "12ch" }}>
                        {or(p.heading, "Twee pieken. Drie problemen.")}
                    </h2>
                    <span className="v2-mono v2-muted">{or(p.label, "Boven het maaiveld")}</span>
                </div>
                {cards.map((c, i) => {
                    const k = cover[i] ?? 0
                    return (
                        <div key={i} ref={(el) => (refs.current[i] = el)} className="v2k-card" style={{ top: `calc(11vh + ${i * 26}px)`, background: c.color, color: c.ink, transform: `scale(${1 - k * 0.06})`, zIndex: i + 1 }}>
                            <div className="v2k-text">
                                <span className="v2-mono">{c.label}</span>
                                <div>
                                    <div className="v2k-num">{String(i + 1).padStart(2, "0")}</div>
                                    <h3 className="v2-h3" style={{ fontSize: "clamp(28px, min(3.6cqi, 7vh), 60px)", margin: "14px 0 18px" }}>
                                        {c.title}
                                    </h3>
                                    <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 440 }}>{c.body}</p>
                                </div>
                            </div>
                            <div className="v2k-media">
                                {c.model ? (
                                    <Near placeholder={<Poster img={c.poster} />}>
                                        <SettScrollScene model={c.model} poster={c.poster} framing="card" mobile3D={false} progress={prog[i]} />
                                    </Near>
                                ) : (
                                    <Poster img={c.poster} />
                                )}
                            </div>
                            <div className="v2k-dim" style={{ opacity: k * 0.35 }} />
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

SettV2Stack.displayName = "Sett V2 · Kaartenstapel"

addPropertyControls(SettV2Stack, {
    heading: { type: ControlType.String, title: "Kop", defaultValue: "Twee pieken. Drie problemen." },
    label: { type: ControlType.String, title: "Label", defaultValue: "Boven het maaiveld" },
    cards: {
        type: ControlType.Array,
        title: "Kaarten",
        maxCount: 5,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                title: { type: ControlType.String, title: "Titel" },
                body: { type: ControlType.String, title: "Tekst", displayTextArea: true },
                color: { type: ControlType.Color, title: "Kleur", defaultValue: V.cardSun[0] },
                ink: { type: ControlType.Color, title: "Tekstkleur", defaultValue: V.cardSun[1] },
                model: { type: ControlType.File, title: "3D (sett-scroll)", allowedFileTypes: ["glb"] },
                poster: { type: ControlType.ResponsiveImage, title: "Beeld (card-…png)" },
            },
        },
    },
})
