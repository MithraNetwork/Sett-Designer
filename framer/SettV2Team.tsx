// Sett V2 Team — the "Over ons" opening: big type, then the people behind Sett as
// cards (photo, name, role, LinkedIn), revealed one after another as they come in.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onCanvas, reducedMotion, V, Img, or } from "./SettV2Kit.tsx"

type Member = { name?: string; role?: string; photo?: Img; link?: string }
interface Props {
    eyebrow?: string
    headline?: string
    lead?: string
    label?: string
    members?: Member[]
    metaLeft?: string
    metaRight?: string
    style?: React.CSSProperties
}
const RINGS = [V.lime, V.sun, V.blueLight, V.purpleLight, V.lilac]
const CSS = `
.v2t2{ padding:clamp(120px, 16vh, 170px) 0 120px; }
.v2t2-meta{ display:flex; justify-content:space-between; gap:24px; margin-bottom:clamp(28px, 5vh, 56px); color:rgba(223,228,244,.6); }
.v2t2-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2t2-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2t2 .v2-display{ max-width:13ch; font-size:clamp(34px, 7.4cqi, 124px); }
.v2t2-lead{ margin-top:clamp(18px, 3vh, 28px); max-width:600px; }
.v2t2-label{ margin:clamp(56px, 9vh, 96px) 0 22px; display:flex; align-items:center; gap:14px; color:rgba(223,228,244,.55); }
.v2t2-label::after{ content:""; flex:1; height:1px; background:rgba(223,228,244,.12); }
.v2t2-grid{ display:grid; grid-template-columns:repeat(4, 1fr); gap:18px; }
.v2t2-card{ position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:18px; padding:26px 24px 24px; border-radius:26px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08);
  opacity:0; transform:translateY(24px); transition:opacity .7s ease, transform .8s cubic-bezier(.2,.8,.1,1), box-shadow .3s; }
.v2t2.in .v2t2-card{ opacity:1; transform:none; }
.v2t2-card:hover{ box-shadow:inset 0 0 0 1px rgba(223,228,244,.18), 0 20px 50px rgba(0,0,0,.3); }
.v2t2-photo{ position:relative; width:96px; height:96px; border-radius:99px; overflow:hidden; background:rgba(223,228,244,.08); flex:none; }
.v2t2-photo::after{ content:""; position:absolute; inset:0; border-radius:99px; box-shadow:inset 0 0 0 3px var(--ring); opacity:.0; transition:opacity .3s; }
.v2t2-card:hover .v2t2-photo::after{ opacity:1; }
.v2t2-photo img{ width:100%; height:100%; object-fit:cover; display:block; }
.v2t2-photo span{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:34px; color:var(--ring); }
.v2t2-card b{ font-weight:800; font-size:clamp(22px, 2cqi, 28px); letter-spacing:-.02em; line-height:1.1; }
.v2t2-card .role{ font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:rgba(223,228,244,.55); line-height:1.5; margin-top:-10px; }
.v2t2-in{ margin-top:auto; display:inline-flex; align-items:center; gap:8px; height:38px; padding:0 14px; border-radius:999px; background:rgba(223,228,244,.08); color:#F4F6FB; font:700 14px "Sett Outfit",Outfit, system-ui; text-decoration:none; transition:background .25s, color .25s; }
.v2t2-in:hover{ background:#F4F6FB; color:${V.ink}; }
@container (max-width: 1100px){ .v2t2-grid{ grid-template-columns:repeat(3, 1fr); } }
@container (max-width: 800px){ .v2t2-grid{ grid-template-columns:repeat(2, 1fr); } .v2t2-meta > :nth-child(n+2){ display:none; } }
@container (max-width: 480px){
  .v2t2-grid{ grid-template-columns:1fr 1fr; gap:10px; }
  .v2t2-card{ gap:12px; padding:16px 14px 14px; border-radius:20px; }
  .v2t2-photo{ width:64px; height:64px; }
  .v2t2-card b{ font-size:19px; }
  .v2t2-card .role{ font-size:10px; margin-top:-6px; }
  .v2t2-in{ height:34px; padding:0 12px; font-size:13px; }
}
`
const LinkedIn = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z" />
    </svg>
)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Team(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    const root = useRef<HTMLDivElement>(null)
    useReveal(head)
    const [shown, setShown] = useState(false)
    useEffect(() => {
        const el = root.current
        if (!el) return
        if (onCanvas() || reducedMotion()) return setShown(true)
        const io = new IntersectionObserver((e) => e[0].isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.08 })
        io.observe(el)
        return () => io.disconnect()
    }, [])
    const members = (p.members || []).filter((m) => (m.name || "").trim())
    return (
        <section className={"v2 v2t2" + (shown ? " in" : "")} style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2t2-meta v2-mono">
                    <span>{or(p.metaLeft, "Sett · over ons")}</span>
                    <span>{or(p.metaRight, "Hoevelaken, NL")}</span>
                </div>
                <div ref={head}>
                    <div className="v2t2-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Over ons")}</div>
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "Wij bouwen aan|een mooie en slimme|energieoplossing.")} />
                    </h1>
                    {p.lead && <p className="v2t2-lead v2-lead v2-fade">{p.lead}</p>}
                </div>
                <div className="v2t2-label v2-mono">
                    {or(p.label, "Het team")} · {members.length}
                </div>
                <div ref={root} className="v2t2-grid">
                    {members.map((m, i) => {
                        const ring = RINGS[i % RINGS.length]
                        return (
                            <div key={i} className="v2t2-card" style={{ transitionDelay: i * 70 + "ms", ["--ring" as string]: ring } as React.CSSProperties}>
                                <div className="v2t2-photo">
                                    {m.photo?.src ? <img src={m.photo.src} srcSet={m.photo.srcSet} alt={m.photo.alt || "Foto van " + m.name} loading="lazy" /> : <span>{(m.name || "?").slice(0, 1)}</span>}
                                </div>
                                <div>
                                    <b>{m.name}</b>
                                </div>
                                {m.role && <span className="role">{m.role}</span>}
                                {m.link && (
                                    <a className="v2t2-in" href={m.link} target="_blank" rel="noopener noreferrer" aria-label={"LinkedIn van " + m.name}>
                                        <LinkedIn /> LinkedIn
                                    </a>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

SettV2Team.displayName = "Sett V2 · Team"

addPropertyControls(SettV2Team, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Over ons" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Wij bouwen aan|een mooie en slimme|energieoplossing." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true },
    label: { type: ControlType.String, title: "Teamlabel", defaultValue: "Het team" },
    members: {
        type: ControlType.Array,
        title: "Team",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Naam" },
                role: { type: ControlType.String, title: "Rol" },
                photo: { type: ControlType.ResponsiveImage, title: "Foto" },
                link: { type: ControlType.Link, title: "LinkedIn" },
            },
        },
    },
    metaLeft: { type: ControlType.String, title: "Meta links", defaultValue: "Sett · over ons" },
    metaRight: { type: ControlType.String, title: "Meta rechts", defaultValue: "Hoevelaken, NL" },
})
