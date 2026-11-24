// Sett V2 Marquee — two rows of big words sliding in opposite directions,
// speeding up and leaning with the scroll.

import * as React from "react"
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, onCanvas, reducedMotion, V, or } from "./SettV2Kit.tsx"

interface Props {
    rowA?: string
    rowB?: string
    color?: string
    background?: string
    style?: React.CSSProperties
}
const CSS = `
.v2m{ padding:56px 0; overflow:hidden; }
.v2m-row{ display:flex; white-space:nowrap; will-change:transform; }
.v2m-row span{ font-weight:900; letter-spacing:-0.04em; font-size:clamp(46px, 7.5cqi, 128px); line-height:1.08; padding-right:.5em; }
.v2m-row span i{ display:inline-block; width:.26em; height:.26em; border-radius:99px; margin:0 .45em .16em; vertical-align:middle; }
.v2m-row.b span{ color:transparent; -webkit-text-stroke:1.5px rgba(255,255,255,.4); }
`
export default function SettV2Marquee(props: Props) {
    const p = props
    const a = useRef<HTMLDivElement>(null), b = useRef<HTMLDivElement>(null)
    const color = or(p.color, V.lime)
    useEffect(() => {
        if (onCanvas() || reducedMotion()) return
        let x = 0, v = 0, lastY = window.scrollY, raf = 0
        const loop = () => {
            raf = requestAnimationFrame(loop)
            const y = window.scrollY
            v += (y - lastY - v) * 0.1
            lastY = y
            x += 0.6 + Math.abs(v) * 0.25
            const skew = Math.max(-8, Math.min(8, v * 0.18))
            const wa = a.current ? a.current.scrollWidth / 2 : 1
            if (a.current) a.current.style.transform = `translateX(${-(x % wa)}px) skewX(${-skew}deg)`
            if (b.current) b.current.style.transform = `translateX(${-wa + (x % wa)}px) skewX(${skew}deg)`
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [])
    const words = (s: string) => s.split("·").map((w) => w.trim()).filter(Boolean)
    const A = words(or(p.rowA, "Netcongestie · Peak shaving · Salderen stopt · Energie delen · Wachtlijst"))
    const B = words(or(p.rowB, "96 kWh · 22 kW · 50 kW · 0 m² · Onder de grond · Achter je eigen meter"))
    const line = (list: string[], dot: string) =>
        [0, 1].map((k) => (
            <span key={k}>
                {list.map((w, i) => (
                    <React.Fragment key={i}>
                        {w}
                        <i style={{ background: dot }} />
                    </React.Fragment>
                ))}
            </span>
        ))
    return (
        <section className="v2 v2m" style={{ background: or(p.background, V.ink), ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div ref={a} className="v2m-row" style={{ color }}>
                {line(A, "#fff")}
            </div>
            <div ref={b} className="v2m-row b">
                {line(B, color)}
            </div>
        </section>
    )
}
SettV2Marquee.displayName = "Sett V2 · Woordband"
addPropertyControls(SettV2Marquee, {
    rowA: { type: ControlType.String, title: "Rij 1", displayTextArea: true, description: "Woorden gescheiden door ·", defaultValue: "Netcongestie · Peak shaving · Salderen stopt · Energie delen · Wachtlijst" },
    rowB: { type: ControlType.String, title: "Rij 2", displayTextArea: true, defaultValue: "96 kWh · 22 kW · 50 kW · 0 m² · Onder de grond · Achter je eigen meter" },
    color: { type: ControlType.Color, title: "Kleur" },
    background: { type: ControlType.Color, title: "Achtergrond" },
})
