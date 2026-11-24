// Sett V2 Film — a real-world moment between the renders: a looping video (or a
// photo) that opens from a card to the full screen as you scroll, graded towards
// the palette (night navy, the sun's amber or the evening's purple), with one
// big line of type over it.

import * as React from "react"
import { useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, useProgress, Loop, ease, range, V, Img, or } from "./SettV2Kit.tsx"

type Tint = "nacht" | "zon" | "avond" | "geen"
interface Props {
    video?: string
    poster?: Img
    label?: string
    text?: string
    note?: string
    tint?: Tint
    speed?: number
    credit?: string
    style?: React.CSSProperties
}
const TINTS: Record<Tint, string> = { nacht: V.blue, zon: V.sun, avond: V.purple, geen: "transparent" }

const CSS = `
.v2f-stage{ position:sticky; top:0; height:100vh; min-height:560px; overflow:hidden; }
.v2f-media{ position:absolute; inset:0; will-change:clip-path; }
.v2f-media > *{ transform-origin:50% 50%; }
.v2f-tint{ position:absolute; inset:0; mix-blend-mode:soft-light; opacity:.55; pointer-events:none; }
.v2f-shade{ position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(180deg, rgba(6,12,26,.35) 0%, rgba(6,12,26,0) 30%, rgba(6,12,26,.25) 55%, rgba(6,12,26,.86) 100%); }
.v2f-copy{ position:absolute; left:0; right:0; bottom:clamp(56px, 11vh, 110px); z-index:2; }
.v2f-copy .v2-h2{ max-width:17ch; text-shadow:0 2px 30px rgba(6,12,26,.35); }
.v2f-note{ margin-top:22px; max-width:560px; color:rgba(223,228,244,.86); }
.v2f-label{ display:inline-flex; align-items:center; gap:10px; margin-bottom:20px; padding:9px 15px; border-radius:999px; color:#F4F6FB; background:rgba(6,12,26,.55); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
.v2f-label::before{ content:""; width:8px; height:8px; border-radius:99px; background:var(--accent); box-shadow:0 0 16px var(--accent); }
.v2f-credit{ position:absolute; right:22px; bottom:18px; z-index:2; font:500 10px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:rgba(223,228,244,.65); }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Film(props: Props) {
    const p = props
    const root = useRef<HTMLDivElement>(null)
    const copy = useRef<HTMLDivElement>(null)
    useReveal(copy)
    const t = useProgress(root, "pin")
    // from a card in the middle to the full screen, then it holds
    const e = ease(range(t, 0, 0.55))
    const lerp = (a: number, b: number) => a + (b - a) * e
    const clip = `inset(${lerp(14, 0)}% ${lerp(9, 0)}% ${lerp(14, 0)}% ${lerp(9, 0)}% round ${lerp(32, 0)}px)`
    const tint = TINTS[or(p.tint, "nacht")] ?? TINTS.nacht
    const accent = p.tint === "zon" ? V.sun : p.tint === "avond" ? V.purpleLight : p.tint === "geen" ? V.lime : V.blueLight
    return (
        <section ref={root} className="v2" style={{ height: "190vh", ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2f-stage">
                <div className="v2f-media" style={{ clipPath: clip, WebkitClipPath: clip }}>
                    <Loop src={p.video} poster={p.poster} speed={p.speed ?? 1} style={{ transform: `scale(${1.12 - 0.12 * e})` }} />
                    <div className="v2f-tint" style={{ background: tint }} />
                    <div className="v2f-shade" style={{ opacity: 0.55 + 0.45 * e }} />
                </div>
                <div ref={copy} className="v2f-copy v2-wrap" style={{ opacity: ease(range(t, 0.18, 0.42)), transform: `translateY(${(1 - ease(range(t, 0.18, 0.5))) * 40}px)` }}>
                    {p.label !== "" && (
                        <div className="v2f-label v2-mono" style={{ ["--accent" as string]: accent } as React.CSSProperties}>
                            {p.label ?? "Het net, vandaag"}
                        </div>
                    )}
                    <p className="v2-h2">
                        <Lines text={or(p.text, "Elke avond vraagt|heel Nederland|tegelijk om stroom.")} />
                    </p>
                    {p.note && <p className="v2f-note v2-lead">{p.note}</p>}
                </div>
                {p.credit !== "" && <span className="v2f-credit">{p.credit ?? "Beeld: Pexels"}</span>}
            </div>
        </section>
    )
}

SettV2Film.displayName = "Sett V2 · Film"

addPropertyControls(SettV2Film, {
    video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"] },
    poster: { type: ControlType.ResponsiveImage, title: "Poster / foto", description: "Het stilstaande beeld, of het beeld zonder video." },
    label: { type: ControlType.String, title: "Label", defaultValue: "Het net, vandaag" },
    text: { type: ControlType.String, title: "Tekst", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Elke avond vraagt|heel Nederland|tegelijk om stroom." },
    note: { type: ControlType.String, title: "Toelichting", displayTextArea: true },
    speed: { type: ControlType.Number, title: "Snelheid", min: 0.25, max: 2, step: 0.05, defaultValue: 1, displayStepper: true, description: "Afspeelsnelheid van de video (0,5 = half zo snel)." },
    tint: { type: ControlType.Enum, title: "Kleurtoon", options: ["nacht", "zon", "avond", "geen"], optionTitles: ["Nacht (blauw)", "Zon (amber)", "Avond (paars)", "Geen"], defaultValue: "nacht" },
    credit: { type: ControlType.String, title: "Beeldcredit", defaultValue: "Beeld: Pexels" },
})
