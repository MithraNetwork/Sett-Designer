// Sett V2 Hero — the 3D street full screen (SettHero3D, the same scene, light and
// opening as the V1 pages), with the V2 type over it: the headline rising out of
// its line masks, drawing-board labels and a "±0,00 maaiveld" level line. As
// you scroll away the scene settles back and the copy lifts off; no pinning.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onScrollFrame, onCanvas, ease, clamp01, Arrow, V, or, linkTo } from "./SettV2Kit.tsx"
import SettHero3D from "./SettHero3D.tsx"

interface Props {
    eyebrow?: string
    headline?: string
    lead?: string
    primary?: string
    primaryLink?: string
    primaryLinkHash?: string
    secondary?: string
    secondaryLink?: string
    secondaryLinkHash?: string
    heroModel?: string
    vibe?: "zonnig" | "blauwUur" | "goudenUur" | "paarseAvond" | "groeneNacht" | "ochtend"
    subject?: "right" | "center" | "left"
    zoom?: number
    scrim?: number
    metaLeft?: string
    metaMid?: string
    metaRight?: string
    level?: string
    style?: React.CSSProperties
}

const CSS = `
.v2h{ position:relative; overflow:hidden; }
.v2h-stage{ position:relative; height:100vh; min-height:560px; max-height:1100px; }
.v2h-scene{ position:absolute; inset:0; transform-origin:62% 60%; will-change:transform; }
.v2h-empty{ position:absolute; inset:0; background:radial-gradient(70% 60% at 70% 40%, ${V.ink2}, ${V.ink}); }
.v2h-meta{ position:absolute; left:0; right:0; top:clamp(88px, 15vh, 118px); display:flex; justify-content:space-between; gap:24px; z-index:3; color:rgba(255,255,255,.72); }
.v2h-copy{ position:absolute; left:0; right:0; bottom:clamp(70px, 14vh, 128px); z-index:3; }
.v2h-copy .v2-display{ max-width:9ch; font-size:clamp(42px, min(7.6cqi, 12vh), 136px); text-shadow:0 2px 30px rgba(0,0,0,.18); }
.v2h-row{ display:flex; flex-direction:column; align-items:flex-start; gap:clamp(14px, 3vh, 26px); margin-top:clamp(16px, 3.4vh, 30px); }
.v2h-row .v2-lead{ max-width:540px; color:rgba(255,255,255,.9); }
.v2h-btns{ display:flex; gap:12px; flex-wrap:wrap; }
.v2h-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2h-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2h-level{ position:absolute; left:0; right:0; bottom:44px; z-index:3; }
.v2h-level .v2-level{ color:rgba(255,255,255,.62); }
.v2h-cue{ position:absolute; right:56px; bottom:70px; z-index:3; display:flex; align-items:center; gap:10px; color:rgba(255,255,255,.62); }
.v2h-cue i{ display:block; width:1px; height:44px; background:linear-gradient(#fff, transparent); animation:v2cue 2.2s ease-in-out infinite; transform-origin:top; }
@keyframes v2cue{ 0%{ transform:scaleY(0); opacity:1 } 60%{ transform:scaleY(1); opacity:1 } 100%{ transform:scaleY(1); opacity:0 } }
@media (max-height: 640px){ .v2h-row .v2-lead{ display:none; } }
@container (max-width: 809px){
  .v2h-stage{ min-height:620px; }
  /* the scene up, so the copy sits on the dark fade rather than on the house */
  .v2h-scene{ inset:-20% 0 20% 0; }
  .v2h-meta{ top:96px; }
  .v2h-meta > :nth-child(n+2){ display:none; }
  .v2h-copy{ bottom:96px; }
  .v2h-cue{ display:none; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Hero(props: Props) {
    const p = props
    const root = useRef<HTMLDivElement>(null)
    const copy = useRef<HTMLDivElement>(null)
    useReveal(copy)
    // 0 at the top of the page, 1 once the hero has scrolled out
    const [t, setT] = useState(0)
    useEffect(() => {
        const el = root.current
        if (!el || onCanvas()) return
        return onScrollFrame(() => {
            const r = el.getBoundingClientRect()
            setT(clamp01(-r.top / Math.max(1, r.height)))
        })
    }, [])
    const lift = ease(t * 1.6)
    // the two original moods keep the sky they had on their pages; the others bring their own
    const vibe = or(p.vibe, "zonnig")
    const sky = vibe === "zonnig" ? ["#4A99F1", "#FCF0D7"] : vibe === "blauwUur" ? [V.ink, V.cardPurple[0]] : null
    return (
        <section ref={root} className="v2 v2h" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2h-stage">
                <div className="v2h-scene" style={{ transform: `translateY(${t * 22}%) scale(${1 + t * 0.08})` }}>
                    {p.heroModel ? (
                        <SettHero3D modelUrl={p.heroModel} vibe={vibe} flowColor={V.green} solarColor={V.sun} skyTop={sky?.[0]} skyHorizon={sky?.[1]} subject={or(p.subject, "right")} zoom={p.zoom || 1} motion motionAmount={1} grain={0.15} scrim={p.scrim ?? 0.6} bottomFade={0.7} fadeColor={V.ink} />
                    ) : (
                        <div className="v2h-empty" />
                    )}
                </div>
                <div className="v2h-meta v2-wrap v2-mono" style={{ opacity: 1 - lift }}>
                    <span>{or(p.metaLeft, "Sett · energiehub onder de grond")}</span>
                    <span>{or(p.metaMid, "52.17° N · 5.46° E")}</span>
                    <span>{or(p.metaRight, "Hoevelaken, NL")}</span>
                </div>
                <div ref={copy} className="v2h-copy v2-wrap" style={{ transform: `translateY(${-lift * 110}px)`, opacity: 1 - lift }}>
                    {p.eyebrow && <div className="v2h-eyebrow v2-mono v2-fade">{p.eyebrow}</div>}
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "Energie hoort|onder de grond.")} />
                    </h1>
                    <div className="v2h-row v2-fade">
                        <p className="v2-lead">{or(p.lead, "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt.")}</p>
                        <div className="v2h-btns">
                            {p.primary !== "" && (
                                <a className="v2-btn lime" href={linkTo(p.primaryLink, p.primaryLinkHash, "/pre-order")}>
                                    {p.primary ?? "Bestel jouw Sett"} <Arrow />
                                </a>
                            )}
                            {p.secondary !== "" && (
                                <a className="v2-btn line" href={linkTo(p.secondaryLink, p.secondaryLinkHash, V.phone)}>
                                    {p.secondary ?? "Bel direct"}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="v2h-level v2-wrap" style={{ opacity: 1 - lift }}>
                    <div className="v2-level v2-mono">{or(p.level, "±0,00 maaiveld")}</div>
                </div>
                <div className="v2h-cue v2-mono" style={{ opacity: 1 - lift }}>
                    Scroll <i />
                </div>
            </div>
        </section>
    )
}

SettV2Hero.displayName = "Sett V2 · Hero"

addPropertyControls(SettV2Hero, {
    eyebrow: { type: ControlType.String, title: "Label" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, defaultValue: "Energie hoort|onder de grond.", description: "Een | of nieuwe regel breekt de regel." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bestel jouw Sett" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/pre-order" },
    primaryLinkHash: { type: ControlType.String, title: "Knop 1 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Bel direct" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", defaultValue: V.phone },
    secondaryLinkHash: { type: ControlType.String, title: "Knop 2 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    heroModel: { type: ControlType.File, title: "3D-scène", allowedFileTypes: ["glb"] },
    vibe: { type: ControlType.Enum, title: "Licht", options: ["zonnig", "blauwUur", "goudenUur", "paarseAvond", "groeneNacht", "ochtend"], optionTitles: ["Zonnig", "Blauw uur", "Gouden uur", "Paarse avond", "Groene nacht", "Ochtend"], defaultValue: "zonnig" },
    subject: { type: ControlType.Enum, title: "Sett", options: ["right", "center", "left"], optionTitles: ["Rechts", "Midden", "Links"], defaultValue: "right" },
    zoom: { type: ControlType.Number, title: "Zoom", min: 0.6, max: 1.8, step: 0.05, defaultValue: 1, description: "Groter of kleiner in beeld, bijvoorbeeld voor een brede scène." },
    scrim: { type: ControlType.Number, title: "Tekstschaduw", min: 0, max: 1, step: 0.05, defaultValue: 0.6 },
    metaLeft: { type: ControlType.String, title: "Meta links", defaultValue: "Sett · energiehub onder de grond" },
    metaMid: { type: ControlType.String, title: "Meta midden", defaultValue: "52.17° N · 5.46° E" },
    metaRight: { type: ControlType.String, title: "Meta rechts", defaultValue: "Hoevelaken, NL" },
    level: { type: ControlType.String, title: "Peillijn", defaultValue: "±0,00 maaiveld" },
})
