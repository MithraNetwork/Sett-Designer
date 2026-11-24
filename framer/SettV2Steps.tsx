// Sett V2 Steps — how it goes, as numbered steps on a line that draws itself as
// you scroll; optionally a live scene (e.g. the Sett lowering into its pit).

import * as React from "react"
import { useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, useProgress, Near, Poster, range, V, Img, Arrow, or } from "./SettV2Kit.tsx"
import SettScrollScene from "./SettScrollScene.tsx"

type Step = { title?: string; body?: string }
interface Props {
    eyebrow?: string
    heading?: string
    intro?: string
    steps?: Step[]
    note?: string
    button?: string
    link?: string
    model?: string
    poster?: Img
    theme?: "dark" | "paper"
    style?: React.CSSProperties
}
const DEFAULTS: Step[] = [
    { title: "Kennismaken", body: "Een kort gesprek over jouw situatie, je aansluiting en wat je wil bereiken." },
    { title: "Doorrekenen", body: "We rekenen de businesscase door en kiezen samen de locatie." },
    { title: "Installeren", body: "Gewoon onder je oprit of parkeerplaats. Geen grote verbouwing, geen weken gedoe." },
    { title: "Monitoren", body: "Via een dashboard zie je precies wat je opwekt, opslaat en verbruikt." },
]
const CSS = `
.v2p{ padding:150px 0; }
.v2p-grid{ display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start; }
.v2p-steps{ position:relative; margin-top:56px; padding-left:64px; }
.v2p-steps::before{ content:""; position:absolute; left:19px; top:8px; bottom:8px; width:2px; background:rgba(128,128,128,.25); }
.v2p-fill{ position:absolute; left:19px; top:8px; width:2px; background:${V.lime}; }
.paper .v2p-fill{ background:${V.green}; }
.v2p-step{ position:relative; padding-bottom:44px; transition:opacity .4s; }
.v2p-step b{ position:absolute; left:-64px; top:0; width:40px; height:40px; border-radius:99px; display:flex; align-items:center; justify-content:center;
  font:700 14px "Sett Mono","Geist Mono",monospace; background:${V.ink2}; border:1.5px solid rgba(128,128,128,.4); transition:background .4s, color .4s, border-color .4s; }
.paper .v2p-step b{ background:${V.paper}; }
.v2p-step.on b{ background:${V.lime}; color:${V.ink}; border-color:${V.lime}; }
.paper .v2p-step.on b{ background:${V.ink}; border-color:${V.ink}; color:${V.lime}; }
.v2p-media{ position:sticky; top:14vh; aspect-ratio:4/5; border-radius:32px; overflow:hidden; background:rgba(128,128,128,.08); }
@container (max-width: 900px){ .v2p-grid{ grid-template-columns:1fr; } .v2p-media{ position:relative; top:auto; aspect-ratio:4/3; } }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Steps(props: Props) {
    const p = props
    const steps = p.steps && p.steps.length ? p.steps : DEFAULTS
    const root = useRef<HTMLDivElement>(null)
    const t = useProgress(root, "pass", 1)
    const k = range(t, 0.2, 0.7)
    const on = Math.floor(k * steps.length + 0.0001)
    const paper = p.theme === "paper"
    return (
        <section ref={root} className={"v2 v2p" + (paper ? " paper" : "")} style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap v2p-grid">
                <div>
                    <div className="v2-mono" style={{ color: paper ? V.purpleInk : V.lime, marginBottom: 16 }}>
                        {or(p.eyebrow, "Hoe we het samen aanpakken")}
                    </div>
                    <h2 className="v2-h2" style={{ maxWidth: "12ch" }}>
                        {or(p.heading, "Wij kijken eerst of het past. Dan bouwen we het.")}
                    </h2>
                    {p.intro && (
                        <p className="v2-lead" style={{ marginTop: 22 }}>
                            {p.intro}
                        </p>
                    )}
                    <div className="v2p-steps">
                        <div className="v2p-fill" style={{ height: `calc((100% - 16px) * ${k})` }} />
                        {steps.map((s, i) => (
                            <div key={i} className={"v2p-step" + (i <= on ? " on" : "")} style={{ opacity: i <= on ? 1 : 0.45 }}>
                                <b>{String(i + 1).padStart(2, "0")}</b>
                                <h3 className="v2-h3" style={{ fontSize: "clamp(24px, 2.2cqi, 34px)" }}>
                                    {s.title}
                                </h3>
                                <p className="v2-body" style={{ marginTop: 8, maxWidth: 460 }}>
                                    {s.body}
                                </p>
                            </div>
                        ))}
                    </div>
                    {p.note && (
                        <p className="v2-body" style={{ marginTop: 8, padding: "16px 20px", borderRadius: 18, background: paper ? V.cardBlue[2] : V.cardBlue[0], color: paper ? V.cardBlue[3] : V.cardBlue[1], fontWeight: 700 }}>
                            {p.note}
                        </p>
                    )}
                    {p.button && (
                        <a className="v2-btn lime" href={or(p.link, "/pre-order")} style={{ marginTop: 28 }}>
                            {p.button} <Arrow />
                        </a>
                    )}
                </div>
                <div className="v2p-media">
                    {p.model ? (
                        <Near placeholder={<Poster img={p.poster} fit="contain" alt={"Illustratie: " + (p.heading || "")} />}>
                            <SettScrollScene model={p.model} poster={p.poster} alt={"Illustratie: " + (p.heading || "")} mobile3D={false} />
                        </Near>
                    ) : (
                        <Poster img={p.poster} fit="contain" alt={"Illustratie: " + (p.heading || "")} />
                    )}
                </div>
            </div>
        </section>
    )
}
SettV2Steps.displayName = "Sett V2 · Stappen"
addPropertyControls(SettV2Steps, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Hoe we het samen aanpakken" },
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, defaultValue: "Wij kijken eerst of het past. Dan bouwen we het." },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true },
    steps: { type: ControlType.Array, title: "Stappen", maxCount: 6, control: { type: ControlType.Object, controls: { title: { type: ControlType.String, title: "Titel" }, body: { type: ControlType.String, title: "Tekst", displayTextArea: true } } } },
    note: { type: ControlType.String, title: "Callout", displayTextArea: true },
    button: { type: ControlType.String, title: "Knop" },
    link: { type: ControlType.Link, title: "Knop link", defaultValue: "/pre-order" },
    model: { type: ControlType.File, title: "3D (sett-scroll)", allowedFileTypes: ["glb"] },
    poster: { type: ControlType.ResponsiveImage, title: "Beeld" },
    theme: { type: ControlType.Enum, title: "Thema", options: ["dark", "paper"], optionTitles: ["Donker", "Papier"], defaultValue: "dark" },
})
