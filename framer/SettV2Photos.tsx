// Sett V2 Photos — "in het echt": an editorial mosaic of real photographs (a tile
// can also be a short looping video) between the renders, one large on the left
// and two stacked on the right, each drifting slightly with the scroll and
// captioned with a palette-coloured tag.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onScrollFrame, passProgress, onCanvas, Loop, V, Img, or } from "./SettV2Kit.tsx"

type Item = { image?: Img; video?: string; tag?: string; caption?: string; color?: string; focus?: string }
interface Props {
    eyebrow?: string
    heading?: string
    intro?: string
    items?: Item[]
    theme?: "dark" | "paper"
    credit?: string
    style?: React.CSSProperties
}
const CSS = `
.v2o{ padding:140px 0 130px; }
.v2o-head{ display:grid; grid-template-columns:1.1fr .9fr; gap:48px; align-items:end; margin-bottom:56px; }
.v2o-head .v2-h2{ max-width:14ch; }
.v2o-grid{ display:grid; grid-template-columns:repeat(12, 1fr); gap:18px; }
.v2o-tile{ position:relative; overflow:hidden; border-radius:28px; background:${V.ink2}; }
.v2o-tile:nth-child(1){ grid-column:1 / span 7; grid-row:span 2; min-height:640px; }
.v2o-tile:nth-child(2), .v2o-tile:nth-child(3){ grid-column:8 / span 5; min-height:311px; }
.v2o-tile:nth-child(n+4){ grid-column:span 4; min-height:340px; }
.v2o-media{ position:absolute; inset:-8% 0; will-change:transform; }
.v2o-media img, .v2o-media video{ filter:saturate(.92) contrast(1.03); transition:transform 1.2s cubic-bezier(.2,.8,.2,1); }
.v2o-tile:hover .v2o-media img, .v2o-tile:hover .v2o-media video{ transform:scale(1.04); }
.v2o-cap{ position:absolute; left:0; right:0; bottom:0; padding:60px 26px 24px; background:linear-gradient(180deg, rgba(6,12,26,0), rgba(6,12,26,.82)); color:#F4F6FB; }
.v2o-tag{ display:inline-flex; align-items:center; gap:8px; margin-bottom:10px; }
.v2o-tag i{ width:8px; height:8px; border-radius:99px; display:inline-block; }
.v2o-cap p{ font-weight:700; font-size:clamp(18px, 1.6cqi, 24px); line-height:1.25; letter-spacing:-.01em; max-width:30ch; }
.v2o-credit{ margin-top:18px; }
@container (max-width: 900px){
  .v2o{ padding:100px 0 90px; }
  .v2o-head{ grid-template-columns:1fr; gap:20px; margin-bottom:36px; }
  .v2o-grid{ grid-template-columns:1fr; gap:14px; }
  .v2o-tile:nth-child(n){ grid-column:auto; grid-row:auto; min-height:0; aspect-ratio:4 / 3; }
  .v2o-tile:nth-child(1){ aspect-ratio:4 / 5; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Photos(props: Props) {
    const p = props
    const paper = p.theme === "paper"
    const items = (p.items && p.items.length ? p.items : []).slice(0, 6)
    const root = useRef<HTMLDivElement>(null)
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const [k, setK] = useState(0.5)
    useEffect(() => {
        const el = root.current
        if (!el || onCanvas()) return
        return onScrollFrame(() => setK(passProgress(el)))
    }, [])
    return (
        <section ref={root} className={"v2 v2o" + (paper ? " paper" : "")} style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div ref={head} className="v2o-head">
                    <div>
                        <div className="v2-mono v2-fade" style={{ color: paper ? V.purpleInk : V.lime, marginBottom: 18 }}>
                            {or(p.eyebrow, "In het echt")}
                        </div>
                        <h2 className="v2-h2">
                            <Lines text={or(p.heading, "Zo ziet de straat|er nu uit.")} />
                        </h2>
                    </div>
                    {p.intro && <p className="v2-lead v2-fade">{p.intro}</p>}
                </div>
                <div className="v2o-grid">
                    {items.map((it, i) => (
                        <figure key={i} className="v2o-tile" style={{ margin: 0 }}>
                            {/* each tile drifts a little against the scroll, the big one least */}
                            <div className="v2o-media" style={{ transform: `translateY(${(k - 0.5) * (i === 0 ? -6 : -10)}%)` }}>
                                <Loop src={it.video || undefined} poster={it.image} style={{ objectPosition: or(it.focus, "50% 50%") }} />
                            </div>
                            {(it.tag || it.caption) && (
                                <figcaption className="v2o-cap">
                                    {it.tag && (
                                        <span className="v2o-tag v2-mono">
                                            <i style={{ background: or(it.color, V.lime) }} />
                                            {it.tag}
                                        </span>
                                    )}
                                    {it.caption && <p>{it.caption}</p>}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                </div>
                {p.credit !== "" && <p className="v2o-credit v2-mono v2-muted" style={{ fontSize: 10 }}>{p.credit ?? "Foto’s en video: Pexels"}</p>}
            </div>
        </section>
    )
}

SettV2Photos.displayName = "Sett V2 · Foto's"

addPropertyControls(SettV2Photos, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "In het echt" },
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Zo ziet de straat|er nu uit." },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true },
    items: {
        type: ControlType.Array,
        title: "Beelden",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Foto" },
                video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"], description: "Optioneel: speelt in plaats van de foto." },
                tag: { type: ControlType.String, title: "Label" },
                caption: { type: ControlType.String, title: "Onderschrift", displayTextArea: true },
                color: { type: ControlType.Color, title: "Labelkleur", defaultValue: V.lime },
                focus: { type: ControlType.String, title: "Focuspunt", defaultValue: "50% 50%", description: "Welk deel in beeld blijft, bijv. 50% 80% (onderaan)." },
            },
        },
    },
    theme: { type: ControlType.Enum, title: "Thema", options: ["dark", "paper"], optionTitles: ["Donker", "Licht"], defaultValue: "dark" },
    credit: { type: ControlType.String, title: "Beeldcredit", defaultValue: "Foto’s en video: Pexels" },
})
