// Sett V2 Switch — "Eén hub. Voor iedereen die meer wil dan het net geeft."
// Four audiences as a big list; hover or tap one and the scene, colour and
// details switch to it. Only the active live scene runs (one WebGL context).

import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Poster, Arrow, V, Img, merge, or } from "./SettV2Kit.tsx"
import SettScrollScene from "./SettScrollScene.tsx"

type Item = { tag?: string; title?: string; points?: string; link?: string; linkLabel?: string; color?: string; model?: string; poster?: Img }
interface Props {
    heading?: string
    intro?: string
    items?: Item[]
    style?: React.CSSProperties
}
const DEFAULTS: Item[] = [
    { tag: "Particulier", title: "Je huis draait op je eigen zon.", points: "Altijd stroom, ook in de spits\nGrip op je rekening\nGeen saldering", link: "/particulieren", linkLabel: "Meer informatie", color: V.green },
    { tag: "Ondernemer", title: "Meer vermogen, minder net.", points: "Extra capaciteit zonder verzwaring\nGeen wachtlijst\nLagere kosten door Peak Shaving\nDoorwerken bij netuitval", link: "/bedrijven", linkLabel: "Meer informatie", color: V.lilac },
    { tag: "Overheid", title: "Klimaatdoelen halen.", points: "Netcongestie direct oplossen\nKlimaat en laaddoelen halen\nLaadinfra waar het net het niet redt.\nSchaalbaar over gemeente / provincie", color: V.sun },
    { tag: "Werkgever", title: "Je wagenpark elektrificeren, altijd geladen.", points: "Laden zonder beperking\nKlaar voor 2027-heffing\nÉén systeem op alle locaties", color: V.blueLight },
]

const CSS = `
.v2w{ padding:150px 0; }
.v2w-head{ display:grid; grid-template-columns:1.2fr .8fr; gap:40px; align-items:end; margin-bottom:70px; }
.v2w-body{ display:grid; grid-template-columns:.95fr 1.05fr; gap:48px; align-items:stretch; }
.v2w-list button{ all:unset; box-sizing:border-box; cursor:pointer; display:grid; grid-template-columns:1fr; align-items:center; gap:18px; width:100%;
  padding:22px 0; border-top:1px solid rgba(255,255,255,.1); transition:color .3s; }
.v2w-list button:last-child{ border-bottom:1px solid rgba(255,255,255,.1); }
.v2w-list .t{ font-weight:900; letter-spacing:-0.04em; line-height:.95; font-size:clamp(36px, 5cqi, 84px); color:rgba(255,255,255,.42); transition:color .35s, transform .5s cubic-bezier(.2,.8,.2,1); }
.v2w-list button.on .t, .v2w-list button:hover .t{ color:var(--c); transform:translateX(10px); }
.v2w-panel{ position:relative; border-radius:32px; overflow:hidden; min-height:620px; background:${V.ink2}; }
.v2w-media{ position:absolute; inset:0; }
.v2w-media > div{ position:absolute; inset:0; transition:opacity .6s; }
.v2w-info{ position:absolute; left:0; right:0; bottom:0; padding:34px; background:linear-gradient(transparent, rgba(6,12,26,.92) 38%); }
.v2w-info ul{ display:flex; flex-wrap:wrap; gap:8px; margin:16px 0 22px; }
.v2w-info li{ padding:8px 14px; border-radius:999px; background:rgba(255,255,255,.1); font-size:14px; }
@container (max-width: 900px){
  .v2w-head, .v2w-body{ grid-template-columns:1fr; }
  .v2w-panel{ min-height:520px; }
  .v2w-list .t{ font-size:40px; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Switch(props: Props) {
    const p = props
    const items = (p.items && p.items.length ? p.items : DEFAULTS).map((it, i) => merge(DEFAULTS[i % DEFAULTS.length], it))
    const [on, setOn] = useState(0)
    const cur = items[on]
    return (
        <section className="v2 v2w" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2w-head">
                    <h2 className="v2-h2" style={{ maxWidth: "13ch" }}>
                        {or(p.heading, "Eén hub. Voor iedereen die meer wil dan het net geeft.")}
                    </h2>
                    <p className="v2-lead">{or(p.intro, "Of je nu thuis laadt, een pand wilt verzwaren, een wijk wilt ontlasten of een wagenpark elektrificeert: Sett geeft je een sterkere aansluiting en de regie over je eigen stroom. Achter je eigen meter, zonder te wachten op de netbeheerder.")}</p>
                </div>
                <div className="v2w-body">
                    <div className="v2w-list" role="tablist">
                        {items.map((it, i) => (
                            <button key={i} type="button" role="tab" aria-selected={on === i} className={on === i ? "on" : ""} style={{ ["--c" as any]: it.color }} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)}>
                                <span className="t">{it.tag}</span>
                            </button>
                        ))}
                    </div>
                    <div className="v2w-panel" role="tabpanel">
                        <div className="v2w-media">
                            {items.map((it, i) => (
                                <div key={i} style={{ opacity: on === i ? 1 : 0 }}>
                                    <Poster img={it.poster} />
                                </div>
                            ))}
                            {cur.model && (
                                <div key={"live" + on}>
                                    <SettScrollScene model={cur.model} poster={cur.poster} framing="card" mobile3D={false} />
                                </div>
                            )}
                        </div>
                        <div className="v2w-info">
                            <span className="v2-mono" style={{ color: cur.color }}>
                                {cur.tag}
                            </span>
                            <h3 className="v2-h3" style={{ marginTop: 12 }}>
                                {cur.title}
                            </h3>
                            <ul>
                                {(cur.points ?? "").split("\n").filter(Boolean).map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                            {cur.link && (
                                <a className="v2-btn" href={cur.link} style={{ background: cur.color, color: V.ink }}>
                                    {cur.linkLabel || "Meer informatie"} <Arrow />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2Switch.displayName = "Sett V2 · Doelgroepen"

addPropertyControls(SettV2Switch, {
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, defaultValue: "Eén hub. Voor iedereen die meer wil dan het net geeft." },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Of je nu thuis laadt, een pand wilt verzwaren, een wijk wilt ontlasten of een wagenpark elektrificeert: Sett geeft je een sterkere aansluiting en de regie over je eigen stroom. Achter je eigen meter, zonder te wachten op de netbeheerder." },
    items: {
        type: ControlType.Array,
        title: "Doelgroepen",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                tag: { type: ControlType.String, title: "Naam" },
                title: { type: ControlType.String, title: "Titel" },
                points: { type: ControlType.String, title: "Punten", displayTextArea: true, description: "Eén per regel." },
                link: { type: ControlType.Link, title: "Link" },
                linkLabel: { type: ControlType.String, title: "Knoptekst" },
                color: { type: ControlType.Color, title: "Kleur", defaultValue: V.green },
                model: { type: ControlType.File, title: "3D (sett-scroll)", allowedFileTypes: ["glb"] },
                poster: { type: ControlType.ResponsiveImage, title: "Beeld (card-…png)" },
            },
        },
    },
})
