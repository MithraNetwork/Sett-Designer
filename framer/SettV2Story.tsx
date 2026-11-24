// Sett V2 Story — the "vijf voordelen" as a sticky split: the text stays put on
// one side and changes with whichever live scene is passing on the other.
// Each scene mounts only near the screen.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Near, Poster, onScrollFrame, onCanvas, V, Img, or } from "./SettV2Kit.tsx"
import SettScrollScene from "./SettScrollScene.tsx"

type Item = { label?: string; title?: string; body?: string; risk?: string; model?: string; poster?: Img }
interface Props {
    eyebrow?: string
    heading?: string
    intro?: string
    items?: Item[]
    accent?: string
    style?: React.CSSProperties
}

const CSS = `
.v2y{ padding:150px 0 80px; }
.v2y-head{ display:grid; grid-template-columns:1.2fr .8fr; gap:40px; align-items:end; margin-bottom:80px; }
.v2y-body{ display:grid; grid-template-columns:.9fr 1.1fr; gap:64px; }
.v2y-text{ position:sticky; top:14vh; height:72vh; display:flex; flex-direction:column; justify-content:center; }
.v2y-count{ font-weight:900; letter-spacing:-0.06em; line-height:.8; font-size:clamp(90px, 10cqi, 170px); }
.v2y-count small{ font-size:.3em; letter-spacing:0; color:rgba(255,255,255,.6); margin-left:.2em; }
.v2y-item{ transition:opacity .45s, transform .6s cubic-bezier(.2,.8,.2,1); }
.v2y-risk{ margin-top:24px; padding:18px 20px; border-radius:18px; background:${V.cardBlue[0]}; color:${V.cardBlue[1]}; box-shadow:inset 0 0 0 1px rgba(43,140,255,.25); font-size:15px; line-height:1.5; }
.v2y-media{ display:flex; flex-direction:column; gap:12vh; padding:6vh 0 14vh; }
.v2y-card{ position:relative; aspect-ratio:16/11; border-radius:32px; overflow:hidden; background:${V.ink2}; transition:transform .6s, opacity .6s; }
.v2y-dots{ display:flex; gap:8px; margin-top:34px; }
.v2y-dots i{ width:28px; height:3px; border-radius:2px; background:rgba(255,255,255,.18); transition:background .3s; }
@container (max-width: 900px){
  .v2y-head, .v2y-body{ grid-template-columns:1fr; }
  .v2y-text{ position:relative; top:auto; height:auto; }
  .v2y-media{ gap:40px; padding:0; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Story(props: Props) {
    const p = props
    const items = p.items && p.items.length ? p.items : [{ label: "Voordeel 01", title: "Titel", body: "Tekst", risk: "Risico" }]
    const accent = or(p.accent, V.lime2)
    const refs = useRef<(HTMLDivElement | null)[]>([])
    const [active, setActive] = useState(0)
    useEffect(() => {
        if (onCanvas()) return
        return onScrollFrame(() => {
            const mid = window.innerHeight / 2
            let best = 0, bd = Infinity
            refs.current.forEach((el, i) => {
                if (!el) return
                const r = el.getBoundingClientRect()
                const d = Math.abs(r.top + r.height / 2 - mid)
                if (d < bd) (bd = d), (best = i)
            })
            setActive((a) => (a === best ? a : best))
        })
    }, [items.length])
    const cur = items[active] ?? items[0]
    return (
        <section className="v2 v2y" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2y-head">
                    <h2 className="v2-h2" style={{ maxWidth: "14ch" }}>
                        {or(p.heading, "Vijf voordelen die je energiepositie fundamenteel veranderen.")}
                    </h2>
                    <div>
                        <div className="v2-mono" style={{ color: accent, marginBottom: 14 }}>
                            {or(p.eyebrow, "Wat Sett voor jou doet")}
                        </div>
                        <p className="v2-lead">{or(p.intro, "")}</p>
                    </div>
                </div>
                <div className="v2y-body">
                    <div className="v2y-text">
                        <div className="v2y-count" style={{ color: accent }}>
                            {String(active + 1).padStart(2, "0")}
                            <small>/ {String(items.length).padStart(2, "0")}</small>
                        </div>
                        <div key={active} className="v2y-item" style={{ marginTop: 28 }}>
                            <div className="v2-mono v2-muted">{cur.label}</div>
                            <h3 className="v2-h3" style={{ margin: "14px 0 16px" }}>
                                {cur.title}
                            </h3>
                            <p className="v2-body">{cur.body}</p>
                            {cur.risk && (
                                <p className="v2y-risk">
                                    <b>Zonder buffer: </b>
                                    {cur.risk}
                                </p>
                            )}
                        </div>
                        <div className="v2y-dots" aria-hidden="true">
                            {items.map((_, i) => (
                                <i key={i} style={{ background: i === active ? accent : undefined }} />
                            ))}
                        </div>
                    </div>
                    <div className="v2y-media">
                        {items.map((it, i) => (
                            <div key={i} ref={(el) => (refs.current[i] = el)} className="v2y-card" style={{ opacity: i === active ? 1 : 0.45, transform: `scale(${i === active ? 1 : 0.94})` }}>
                                {it.model ? (
                                    <Near margin={400} placeholder={<Poster img={it.poster} alt={"Illustratie: " + (it.title || "")} />}>
                                        <SettScrollScene model={it.model} poster={it.poster} alt={"Illustratie: " + (it.title || "")} framing="card" mobile3D={false} />
                                    </Near>
                                ) : (
                                    <Poster img={it.poster} alt={"Illustratie: " + (it.title || "")} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2Story.displayName = "Sett V2 · Voordelen"

addPropertyControls(SettV2Story, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Wat Sett voor jou doet" },
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, defaultValue: "Vijf voordelen die je energiepositie fundamenteel veranderen." },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "" },
    accent: { type: ControlType.Color, title: "Accent" },
    items: {
        type: ControlType.Array,
        title: "Voordelen",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                title: { type: ControlType.String, title: "Titel", displayTextArea: true },
                body: { type: ControlType.String, title: "Tekst", displayTextArea: true },
                risk: { type: ControlType.String, title: "Zonder buffer", displayTextArea: true },
                model: { type: ControlType.File, title: "3D (sett-scroll)", allowedFileTypes: ["glb"] },
                poster: { type: ControlType.ResponsiveImage, title: "Beeld (card-…png)" },
            },
        },
    },
})
