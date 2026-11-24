// Sett V2 Compare — "Dus bouw je naast iedere laadpaal een batterijkast? Of ga je
// onder de grond?" as one picture: the same street rendered twice from the same
// camera, a battery cabinet beside each pole on one, the Sett under the parking
// strip on the other. A divider wipes between them; it sweeps across by itself
// as the section scrolls through, until you drag it (or use the arrow keys).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onScrollFrame, passProgress, onCanvas, ease, range, V, Img, or } from "./SettV2Kit.tsx"

interface Props {
    eyebrow?: string
    heading?: string
    before?: Img
    after?: Img
    beforeLabel?: string
    afterLabel?: string
    beforeFacts?: string
    afterFacts?: string
    hint?: string
    style?: React.CSSProperties
}
const CSS = `
.v2v{ padding:150px 0 140px; overflow:hidden; }
.v2v-head{ display:flex; flex-direction:column; gap:18px; margin-bottom:56px; }
.v2v-head .v2-h2{ max-width:16ch; }
.v2v-stage{ position:relative; width:100%; aspect-ratio:16/9; max-height:78vh; border-radius:32px; overflow:hidden; touch-action:pan-y; cursor:ew-resize; user-select:none; -webkit-user-select:none;
  background:radial-gradient(60% 70% at 72% 18%, #FCF0D7 0%, rgba(252,240,215,0) 70%), linear-gradient(180deg, #E2EDFD 0%, #EEF1F8 55%, #F6F6F6 100%); }
.v2v-stage img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 58%; pointer-events:none; transform:scale(1.14); transform-origin:50% 62%; }
.v2v-top{ position:absolute; inset:0; will-change:clip-path; }
.v2v-bar{ position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:${V.lime}; box-shadow:0 0 24px rgba(223,255,0,.6); z-index:3; }
.v2v-knob{ position:absolute; top:50%; left:50%; width:58px; height:58px; margin:-29px 0 0 -29px; border-radius:99px; background:${V.lime}; color:${V.ink};
  display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,.28); font:700 16px "Sett Outfit",Outfit, system-ui; outline:none; }
.v2v-knob:focus-visible{ box-shadow:0 0 0 4px rgba(255,255,255,.9), 0 10px 30px rgba(0,0,0,.28); }
.v2v-tag{ position:absolute; top:24px; z-index:2; padding:10px 16px; border-radius:99px; font-family:"Sett Mono","Geist Mono",monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; transition:opacity .3s; }
.v2v-tag.l{ left:24px; background:rgba(6,12,26,.8); color:${V.text}; }
.v2v-tag.r{ right:24px; background:${V.lime}; color:${V.ink}; }
.v2v-facts{ display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:34px; }
.v2v-facts h3{ font-weight:800; font-size:22px; letter-spacing:-.01em; margin-bottom:14px; display:flex; align-items:center; gap:12px; }
.v2v-facts h3 i{ width:10px; height:10px; border-radius:99px; display:inline-block; }
.v2v-facts li{ padding:12px 0; border-top:1px solid rgba(255,255,255,.12); font-size:17px; line-height:1.45; color:rgba(255,255,255,.7); transition:color .3s; }
.v2v-facts .on li{ color:#fff; }
.v2v-hint{ margin-top:22px; }
@container (max-width: 809px){
  .v2v{ padding:110px 0 100px; }
  .v2v-stage{ aspect-ratio:1/1; border-radius:24px; }
  .v2v-stage img{ transform:scale(1.08); transform-origin:50% 60%; }
  .v2v-facts{ grid-template-columns:1fr; gap:24px; }
  .v2v-tag{ top:16px; font-size:11px; }
  .v2v-tag.l{ left:16px; } .v2v-tag.r{ right:16px; }
}
`
const src = (i: Img) => (i && i.src) || ""

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Compare(props: Props) {
    const p = props
    const root = useRef<HTMLDivElement>(null)
    const head = useRef<HTMLDivElement>(null)
    const stage = useRef<HTMLDivElement>(null)
    useReveal(head)
    // 0..1 from the left: the cabinet street shows left of the divider
    const [pos, setPos] = useState(0.78)
    const [held, setHeld] = useState(false)
    const heldRef = useRef(false)
    heldRef.current = held
    useEffect(() => {
        const el = root.current
        if (!el || onCanvas()) return
        return onScrollFrame(() => {
            if (heldRef.current) return
            // sweeps from the cabinets to the Sett while the picture crosses the screen
            setPos(0.78 - 0.58 * ease(range(passProgress(el), 0.3, 0.62)))
        })
    }, [])
    const fromEvent = (e: React.PointerEvent) => {
        const r = stage.current!.getBoundingClientRect()
        setPos(Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width)))
    }
    const drag = useRef(false)
    const onDown = (e: React.PointerEvent) => {
        drag.current = true
        setHeld(true)
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        fromEvent(e)
    }
    const onKey = (e: React.KeyboardEvent) => {
        const step = e.shiftKey ? 0.1 : 0.03
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault()
            setHeld(true)
            setPos((x) => Math.min(0.98, Math.max(0.02, x + (e.key === "ArrowLeft" ? -step : step))))
        }
    }
    const lines = (s: string) => s.split(/\n|\|/).map((x) => x.trim()).filter(Boolean)
    const clip = `inset(0 ${(1 - pos) * 100}% 0 0)`
    const leftOn = pos > 0.5
    return (
        <section ref={root} className="v2 v2v" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div ref={head} className="v2v-head">
                    <div className="v2-mono v2-fade" style={{ color: V.lime }}>
                        {or(p.eyebrow, "Dus bouw je naast iedere laadpaal een batterijkast?")}
                    </div>
                    <h2 className="v2-h2">
                        <Lines text={or(p.heading, "Of ga je onder|de grond?")} />
                    </h2>
                </div>
                <div
                    ref={stage}
                    className="v2v-stage"
                    onPointerDown={onDown}
                    onPointerMove={(e) => drag.current && fromEvent(e)}
                    onPointerUp={() => (drag.current = false)}
                    onPointerCancel={() => (drag.current = false)}
                >
                    {src(p.after) && <img src={src(p.after)} srcSet={p.after?.srcSet} alt={p.after?.alt ?? "Dezelfde straat met Sett onder de parkeerstrook: alleen de laadpalen staan boven de grond"} draggable={false} />}
                    <div className="v2v-top" style={{ clipPath: clip, WebkitClipPath: clip }}>
                        {src(p.before) && <img src={src(p.before)} srcSet={p.before?.srcSet} alt={p.before?.alt ?? "Een straat met naast elke laadpaal een batterijkast op de stoep"} draggable={false} />}
                    </div>
                    <span className="v2v-tag l" style={{ opacity: pos > 0.16 ? 1 : 0 }}>
                        {or(p.beforeLabel, "Batterijkast")}
                    </span>
                    <span className="v2v-tag r" style={{ opacity: pos < 0.84 ? 1 : 0 }}>
                        {or(p.afterLabel, "Sett, ondergronds")}
                    </span>
                    <div className="v2v-bar" style={{ left: pos * 100 + "%" }}>
                        <div className="v2v-knob" role="slider" tabIndex={0} aria-label="Vergelijk batterijkast en Sett" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos * 100)} onKeyDown={onKey}>
                            ‹ ›
                        </div>
                    </div>
                </div>
                <div className="v2v-facts">
                    <div className={leftOn ? "on" : ""}>
                        <h3>
                            <i style={{ background: V.grey }} />
                            {or(p.beforeLabel, "Batterijkast")}
                        </h3>
                        <ul>
                            {lines(or(p.beforeFacts, "Een kast op de stoep bij elke laadpaal|Zichtbaar in het straatbeeld, ruimte die je kwijt bent")).map((l) => (
                                <li key={l}>{l}</li>
                            ))}
                        </ul>
                    </div>
                    <div className={leftOn ? "" : "on"}>
                        <h3>
                            <i style={{ background: V.lime }} />
                            {or(p.afterLabel, "Sett, ondergronds")}
                        </h3>
                        <ul>
                            {lines(or(p.afterFacts, "0 m² bovengronds: alleen de laadpaal staat op de stoep|De auto parkeert erboven")).map((l) => (
                                <li key={l}>{l}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="v2v-hint v2-mono v2-muted">{or(p.hint, "Sleep de lijn om te vergelijken")}</div>
            </div>
        </section>
    )
}

SettV2Compare.displayName = "Sett V2 · Vergelijk"

addPropertyControls(SettV2Compare, {
    eyebrow: { type: ControlType.String, title: "Voor-kop", defaultValue: "Dus bouw je naast iedere laadpaal een batterijkast?" },
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Of ga je onder|de grond?" },
    before: { type: ControlType.ResponsiveImage, title: "Links (kast)" },
    after: { type: ControlType.ResponsiveImage, title: "Rechts (Sett)" },
    beforeLabel: { type: ControlType.String, title: "Label links", defaultValue: "Batterijkast" },
    afterLabel: { type: ControlType.String, title: "Label rechts", defaultValue: "Sett, ondergronds" },
    beforeFacts: { type: ControlType.String, title: "Punten links", displayTextArea: true, description: "Eén per regel.", defaultValue: "Een kast op de stoep bij elke laadpaal|Zichtbaar in het straatbeeld, ruimte die je kwijt bent" },
    afterFacts: { type: ControlType.String, title: "Punten rechts", displayTextArea: true, description: "Eén per regel.", defaultValue: "0 m² bovengronds: alleen de laadpaal staat op de stoep|De auto parkeert erboven" },
    hint: { type: ControlType.String, title: "Hint", defaultValue: "Sleep de lijn om te vergelijken" },
})
