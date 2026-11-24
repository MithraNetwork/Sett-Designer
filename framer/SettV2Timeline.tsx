// Sett V2 Timeline — "De tijd dringt": pinned, the page scrolls sideways
// through the years. Giant outlined numerals fill in as each year arrives.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, useProgress, Poster, clamp01, ease, V, Img, merge, or } from "./SettV2Kit.tsx"

type Year = { year?: string; title?: string; body?: string; image?: Img }
interface Props {
    heading?: string
    years?: Year[]
    style?: React.CSSProperties
}
const DEFAULTS: Year[] = [
    { year: "2026", title: "Nu.", body: "Gemeenten zoeken actief naar lokale netbalancering. Netbeheerders kondigen aan dat plaatsing van nieuwe laadpalen vaak geen aansluitmogelijkheid meer heeft." },
    { year: "2027", title: "Werkgeversheffing.", body: "Per 2027 extra heffing op niet-elektrische zakenauto’s. De druk op laadinfra stijgt zichtbaar." },
    { year: "2030", title: "Klimaatdoelen.", body: "Gemeenten moeten aantoonbaar lokale energietransitie-infrastructuur hebben. Zonder opslag wordt dit niet gehaald." },
]

const CSS = `
.v2t-stage{ position:sticky; top:0; height:100vh; min-height:560px; overflow:hidden; display:flex; flex-direction:column; }
/* heading, the sliding years and the rail in plain order, so they can never overlap */
.v2t-top{ position:relative; padding-top:clamp(92px, 14vh, 124px); display:flex; justify-content:space-between; align-items:baseline; gap:16px; }
.v2t-mid{ position:relative; flex:1; min-height:0; display:flex; align-items:center; }
.v2t-track{ display:flex; will-change:transform; }
.v2t-panel{ flex:none; padding:0 56px; display:grid; grid-template-columns:1.15fr .85fr; gap:40px; align-items:center; opacity:.28; transition:opacity .5s; }
.v2t-panel.on{ opacity:1; }
.v2t-year{ font-weight:900; letter-spacing:-0.07em; line-height:.78; font-size:clamp(78px, min(17cqi, 26vh), 300px); color:transparent; -webkit-text-stroke:2px rgba(255,255,255,.28);
  transition:color .6s, -webkit-text-stroke-color .6s; }
.v2t-panel.on .v2t-year{ color:${V.lime}; -webkit-text-stroke-color:${V.lime}; }
.v2t-media{ position:relative; aspect-ratio:1; max-width:min(420px, 46vh); width:100%; }
.v2t-rail{ position:relative; margin:0 56px clamp(40px, 7vh, 64px); height:2px; background:rgba(255,255,255,.12); flex:none; }
.v2t-rail i{ position:absolute; left:0; top:0; bottom:0; background:${V.lime}; }
.v2t-rail b{ position:absolute; top:-26px; transform:translateX(-50%); font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; color:rgba(255,255,255,.5); }
.v2t-rail b:first-of-type{ transform:none; }
.v2t-rail b:last-of-type{ transform:translateX(-100%); }
@container (max-width: 900px){
  .v2t-panel{ grid-template-columns:1fr; gap:18px; padding:0 22px; }
  .v2t-media{ max-width:min(220px, 30vh); }
  .v2t-rail{ margin:0 22px 36px; }
  .v2t-panel .v2-lead{ font-size:16px; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Timeline(props: Props) {
    const p = props
    const years = (p.years && p.years.length ? p.years : DEFAULTS).map((y, i) => merge(DEFAULTS[i % DEFAULTS.length], y))
    const root = useRef<HTMLDivElement>(null)
    const t = useProgress(root, "pin")
    // the panels are sized from the section's own width (not the window's), so they line up in Framer too
    const stage = useRef<HTMLDivElement>(null)
    const [w, setW] = useState(1200)
    useEffect(() => {
        const el = stage.current
        if (!el) return
        const ro = new ResizeObserver(() => setW(el.clientWidth || 1200))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const panelW = w < 900 ? w : Math.min(w * 0.82, 1300)
    const n = years.length
    // rest on each year, then glide to the next
    const raw = clamp01(t) * (n - 1)
    const seg = Math.min(n - 2, Math.floor(raw))
    const at = n > 1 ? seg + ease((raw - seg - 0.25) / 0.5) : 0
    const active = Math.round(at)
    return (
        <section ref={root} className="v2" style={{ height: n * 90 + 40 + "vh", ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div ref={stage} className="v2t-stage">
                <div className="v2-grain" />
                <div className="v2t-top v2-wrap">
                    <h2 className="v2-h3">{or(p.heading, "De tijd dringt.")}</h2>
                    <span className="v2-mono v2-muted">
                        {years[active]?.year} · {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                    </span>
                </div>
                <div className="v2t-mid">
                <div className="v2t-track" style={{ transform: `translateX(${(w - panelW) / 2 - at * panelW}px)` }}>
                    {years.map((y, i) => (
                        <div key={i} className={"v2t-panel" + (i === active ? " on" : "")} style={{ width: panelW }}>
                            <div>
                                <div className="v2t-year">{y.year}</div>
                                <h3 className="v2-h3" style={{ marginTop: 26 }}>
                                    {y.title}
                                </h3>
                                <p className="v2-lead" style={{ marginTop: 14 }}>
                                    {y.body}
                                </p>
                            </div>
                            <div className="v2t-media">
                                <Poster img={y.image} fit="contain" />
                            </div>
                        </div>
                    ))}
                </div>
                </div>
                <div className="v2t-rail">
                    <i style={{ width: t * 100 + "%" }} />
                    {years.map((y, i) => (
                        <b key={i} style={{ left: (n > 1 ? i / (n - 1) : 0) * 100 + "%", color: i <= active ? V.lime : undefined }}>
                            {y.year}
                        </b>
                    ))}
                </div>
            </div>
        </section>
    )
}

SettV2Timeline.displayName = "Sett V2 · Tijdlijn"

addPropertyControls(SettV2Timeline, {
    heading: { type: ControlType.String, title: "Kop", defaultValue: "De tijd dringt." },
    years: {
        type: ControlType.Array,
        title: "Jaren",
        maxCount: 6,
        control: { type: ControlType.Object, controls: { year: { type: ControlType.String, title: "Jaar" }, title: { type: ControlType.String, title: "Titel" }, body: { type: ControlType.String, title: "Tekst", displayTextArea: true }, image: { type: ControlType.ResponsiveImage, title: "Beeld" } } },
    },
})
