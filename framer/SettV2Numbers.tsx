// Sett V2 Numbers — the four numbers at poster size, counting up as they come
// into view, each with a line that makes it tangible, and a small live scene.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Near, Poster, onCanvas, reducedMotion, V, Img, merge, or } from "./SettV2Kit.tsx"
import SettScrollScene from "./SettScrollScene.tsx"

type Item = { value?: number; unit?: string; label?: string; line?: string; color?: string; model?: string; poster?: Img }
interface Props {
    label?: string
    heading?: string
    intro?: string
    items?: Item[]
    note?: string
    style?: React.CSSProperties
}
const DEFAULTS: Item[] = [
    { value: 96, unit: "kWh", label: "Batterijopslag", line: "Genoeg voor ongeveer twee weken stroom van een gemiddeld huishouden.*", color: V.green },
    { value: 22, unit: "kW", label: "EV-laders", line: "Een lege gezinsauto in zo’n drie uur weer vol.*", color: V.lilac },
    { value: 50, unit: "kW", label: "Output per Sett", line: "Meer bij meer boxen. Vermogen voor machines, laadpalen en buren.", color: V.sun },
    { value: 0, unit: "m²", label: "Ruimte bovengronds", line: "Alleen een laadpaal en een deksel in de bestrating.", color: V.text },
]

const CSS = `
.v2n{ padding:160px 0; }
.v2n-head{ display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:end; margin-bottom:90px; }
.v2n-row{ display:grid; grid-template-columns:1.1fr .9fr 220px; gap:40px; align-items:center; padding:36px 0; border-top:1px solid rgba(255,255,255,.1); }
.v2n-row:last-child{ border-bottom:1px solid rgba(255,255,255,.1); }
.v2n-big{ font-weight:900; letter-spacing:-0.06em; line-height:.8; font-size:clamp(90px, 13cqi, 230px); font-variant-numeric:tabular-nums; white-space:nowrap; }
.v2n-big small{ font-size:.34em; letter-spacing:-0.03em; margin-left:.12em; font-weight:800; }
.v2n-media{ position:relative; width:220px; aspect-ratio:1; }
.v2n-note{ margin-top:28px; font-size:11px; }
@container (max-width: 900px){
  .v2n-head{ grid-template-columns:1fr; }
  .v2n-row{ grid-template-columns:1fr; gap:14px; }
  .v2n-media{ width:160px; }
}
`

function Count({ to, run }: { to: number; run: boolean }) {
    const [v, setV] = useState(run ? 0 : to)
    useEffect(() => {
        if (!run) return setV(to)
        let raf = 0
        const t0 = performance.now()
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / 1400)
            setV(Math.round(to * (1 - Math.pow(1 - k, 3))))
            if (k < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [run, to])
    return <>{v}</>
}

function Row({ it }: { it: Item }) {
    const ref = useRef<HTMLDivElement>(null)
    const [seen, setSeen] = useState(false)
    const animate = !onCanvas() && !reducedMotion()
    useEffect(() => {
        if (!animate) return
        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver((e) => e[0].isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.4 })
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return (
        <div ref={ref} className="v2n-row">
            <div className="v2n-big" style={{ color: it.color }}>
                {animate ? seen ? <Count to={it.value ?? 0} run /> : 0 : it.value}
                <small>{it.unit}</small>
            </div>
            <div>
                <div className="v2-mono v2-muted" style={{ marginBottom: 12 }}>
                    {it.label}
                </div>
                <p className="v2-lead" style={{ color: V.text }}>
                    {it.line}
                </p>
            </div>
            <div className="v2n-media">
                {it.model ? (
                    <Near placeholder={<Poster img={it.poster} fit="contain" />}>
                        <SettScrollScene model={it.model} poster={it.poster} mobile3D={false} />
                    </Near>
                ) : (
                    <Poster img={it.poster} fit="contain" />
                )}
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Numbers(props: Props) {
    const p = props
    const items = (p.items && p.items.length ? p.items : DEFAULTS).map((it, i) => merge(DEFAULTS[i % DEFAULTS.length], it))
    return (
        <section className="v2 v2n" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2n-head">
                    <h2 className="v2-h2">{or(p.heading, "De cijfers.")}</h2>
                    <div>
                        <div className="v2-mono" style={{ color: V.lime, marginBottom: 14 }}>
                            {or(p.label, "−0,70 m · onder het maaiveld")}
                        </div>
                        <p className="v2-lead">{or(p.intro, "De zeldzame situatie waarin gemeente, bewoner én werkgever hetzelfde willen, en die oplossing hoeft alleen nog onzichtbaar te zijn.")}</p>
                    </div>
                </div>
                {items.map((it, i) => (
                    <Row key={i} it={it} />
                ))}
                <p className="v2n-note v2-mono v2-muted">{or(p.note, "* Indicatief: bij ±2.500 kWh per jaar per huishouden en een accu van ±60 kWh in de auto.")}</p>
            </div>
        </section>
    )
}

SettV2Numbers.displayName = "Sett V2 · Cijfers"

addPropertyControls(SettV2Numbers, {
    heading: { type: ControlType.String, title: "Kop", defaultValue: "De cijfers." },
    label: { type: ControlType.String, title: "Label", defaultValue: "−0,70 m · onder het maaiveld" },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "De zeldzame situatie waarin gemeente, bewoner én werkgever hetzelfde willen, en die oplossing hoeft alleen nog onzichtbaar te zijn." },
    items: {
        type: ControlType.Array,
        title: "Cijfers",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                value: { type: ControlType.Number, title: "Getal", min: 0, max: 9999 },
                unit: { type: ControlType.String, title: "Eenheid" },
                label: { type: ControlType.String, title: "Label" },
                line: { type: ControlType.String, title: "Zin", displayTextArea: true },
                color: { type: ControlType.Color, title: "Kleur", defaultValue: V.green },
                model: { type: ControlType.File, title: "3D (sett-scroll)", allowedFileTypes: ["glb"] },
                poster: { type: ControlType.ResponsiveImage, title: "Beeld" },
            },
        },
    },
    note: { type: ControlType.String, title: "Voetnoot", displayTextArea: true, defaultValue: "* Indicatief: bij ±2.500 kWh per jaar per huishouden en een accu van ±60 kWh in de auto." },
})
