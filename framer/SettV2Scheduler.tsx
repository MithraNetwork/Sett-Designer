// Sett V2 Scheduler — the Pipedrive meeting scheduler in a card, with a short heading
// beside it: visitors pick a day and time for an online call themselves. The scheduler
// scrolls inside its own frame, so the frame has a fixed height (taller on phones,
// where Pipedrive lists the days under each other).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, V, or } from "./SettV2Kit.tsx"

interface Props {
    url?: string
    eyebrow?: string
    heading?: string
    body?: string
    points?: string
    theme?: "dark" | "paper"
    frameHeight?: number
    frameHeightPhone?: number
    anchor?: string
    style?: React.CSSProperties
}
const URL = "https://mihtra.pipedrive.com/scheduler/drZMw8hb/maak-online-kennis-met-sett"
const CSS = `
.v2s{ padding:130px 0 120px; scroll-margin-top:80px; }
/* the scheduler gets the room: from about 720px wide Pipedrive shows a compact week row instead of a long list */
.v2s-grid{ display:grid; grid-template-columns:minmax(0, .62fr) minmax(0, 1.38fr); gap:48px; align-items:start; }
.v2s-copy{ position:sticky; top:120px; }
.v2s-copy .v2-h2{ max-width:12ch; margin:18px 0 22px; font-size:clamp(40px, 4.6cqi, 76px); }
.v2s-points{ margin-top:28px; display:flex; flex-direction:column; gap:12px; }
.v2s-points li{ display:flex; gap:12px; align-items:flex-start; font-size:17px; line-height:1.45; }
.v2s-points li::before{ content:""; flex:none; width:10px; height:10px; margin-top:7px; border-radius:99px; background:${V.lime}; box-shadow:0 0 12px rgba(141,255,102,.6); }
.paper .v2s-points li::before{ background:${V.purple}; box-shadow:none; }
.v2s-card{ max-width:800px; width:100%; justify-self:end; padding:10px; border-radius:28px; background:#FFFFFF; box-shadow:0 30px 80px rgba(0,0,0,.28); }
.paper .v2s-card{ box-shadow:0 20px 60px rgba(11,14,26,.10), inset 0 0 0 1px rgba(11,14,26,.06); }
.v2s-card iframe{ display:block; width:100%; border:0; border-radius:20px; background:#F5F6F8; }
@container (max-width: 900px){
  .v2s{ padding:96px 0 90px; }
  .v2s-grid{ grid-template-columns:1fr; gap:32px; }
  .v2s-copy{ position:relative; top:auto; }
  .v2s-card{ justify-self:stretch; max-width:none; }
}
@container (max-width: 640px){
  .v2s-card{ padding:6px; border-radius:22px; }
  .v2s-card iframe{ border-radius:17px; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Scheduler(props: Props) {
    const p = props
    const paper = p.theme === "paper"
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    // the frame's height, set on the iframe itself: taller when the section is phone-narrow.
    // (Not named "height": Framer hands its own layout height to a prop by that name.)
    const root = useRef<HTMLElement>(null)
    const [narrow, setNarrow] = useState(false)
    useEffect(() => {
        const el = root.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => setNarrow(el.clientWidth <= 640))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const num = (v: unknown, d: number) => (typeof v === "number" && v >= 300 ? v : d)
    const frameH = narrow ? num(p.frameHeightPhone, 860) : num(p.frameHeight, 700)
    const points = (p.points ?? "Een online call van 30 minuten\nJij kiest de dag en het tijdstip\nVrijblijvend kennismaken met Sett")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    return (
        <section ref={root} id={or(p.anchor, "afspraak")} className={"v2 v2s" + (paper ? " paper" : "")} style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap v2s-grid">
                <div ref={head} className="v2s-copy">
                    <div className="v2-mono v2-fade" style={{ color: paper ? V.purpleInk : V.lime }}>
                        {or(p.eyebrow, "Plan een afspraak")}
                    </div>
                    <h2 className="v2-h2">
                        <Lines text={or(p.heading, "Maak online|kennis.")} />
                    </h2>
                    <p className="v2-lead v2-fade">{or(p.body, "Kies een moment dat jou uitkomt voor een korte videocall met Sett. We kijken samen naar jouw situatie en beantwoorden je vragen.")}</p>
                    {points.length > 0 && (
                        <ul className="v2s-points v2-fade">
                            {points.map((t, i) => (
                                <li key={i}>{t}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="v2s-card">
                    <iframe src={or(p.url, URL)} title="Plan een online kennismaking met Sett" loading="lazy" allowFullScreen height={frameH} style={{ height: frameH }} />
                </div>
            </div>
        </section>
    )
}

SettV2Scheduler.displayName = "Sett V2 · Afspraakplanner"

addPropertyControls(SettV2Scheduler, {
    url: { type: ControlType.Link, title: "Planner", description: "De link van de Pipedrive-afspraakplanner (src van de iframe).", defaultValue: URL },
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Plan een afspraak" },
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Maak online|kennis." },
    body: { type: ControlType.String, title: "Tekst", displayTextArea: true, defaultValue: "Kies een moment dat jou uitkomt voor een korte videocall met Sett. We kijken samen naar jouw situatie en beantwoorden je vragen." },
    points: { type: ControlType.String, title: "Punten", displayTextArea: true, description: "Eén per regel. Leeg: geen punten.", defaultValue: "Een online call van 30 minuten\nJij kiest de dag en het tijdstip\nVrijblijvend kennismaken met Sett" },
    theme: { type: ControlType.Enum, title: "Thema", options: ["dark", "paper"], optionTitles: ["Donker", "Papier"], defaultValue: "paper" },
    frameHeight: { type: ControlType.Number, title: "Hoogte", min: 480, max: 1400, step: 20, unit: "px", defaultValue: 700 },
    frameHeightPhone: { type: ControlType.Number, title: "Hoogte mobiel", min: 480, max: 1600, step: 20, unit: "px", defaultValue: 860 },
    anchor: { type: ControlType.String, title: "Anker", defaultValue: "afspraak", description: "Link ernaartoe met #afspraak." },
})
