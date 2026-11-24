// Sett V2 Form — a Pipedrive web form in a white card (the form itself is white),
// with a short heading beside it. The Pipedrive embed is a <div> plus a loader
// <script>; React doesn't run scripts written as markup, so the component builds
// the container and injects the loader itself. On the Framer canvas (where
// external scripts don't run) it shows a placeholder.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onCanvas, V, or } from "./SettV2Kit.tsx"

interface Props {
    formUrl?: string
    formUrl2?: string
    tab1?: string
    tab2?: string
    eyebrow?: string
    heading?: string
    body?: string
    points?: string
    theme?: "dark" | "paper"
    anchor?: string
    style?: React.CSSProperties
}
const LOADER = "https://webforms.pipedrive.com/f/loader"
const CSS = `
.v2q{ padding:130px 0 120px; }
.v2q-grid{ display:grid; grid-template-columns:.85fr 1.15fr; gap:56px; align-items:start; }
.v2q-copy{ position:sticky; top:120px; }
.v2q-copy .v2-h2{ max-width:12ch; margin:18px 0 22px; }
.v2q-points{ margin-top:28px; display:flex; flex-direction:column; gap:12px; }
.v2q-points li{ display:flex; gap:12px; align-items:flex-start; font-size:17px; line-height:1.45; }
.v2q-points li::before{ content:""; flex:none; width:10px; height:10px; margin-top:7px; border-radius:99px; background:${V.lime}; box-shadow:0 0 12px rgba(141,255,102,.6); }
.paper .v2q-points li::before{ background:${V.purple}; box-shadow:none; }
.v2q-card{ background:#FFFFFF; border-radius:28px; padding:clamp(18px, 3cqi, 40px); box-shadow:0 30px 80px rgba(0,0,0,.28); min-height:420px; color:#0B0E1A; }
.paper .v2q-card{ box-shadow:0 20px 60px rgba(11,14,26,.10), inset 0 0 0 1px rgba(11,14,26,.06); }
.v2q-card iframe{ width:100% !important; border:0; }
.v2q-tabs{ display:inline-flex; gap:4px; padding:5px; margin-bottom:18px; border-radius:999px; background:#F1F2F5; }
.v2q-tabs button{ border:0; background:transparent; padding:11px 18px; border-radius:999px; font:700 15px "Sett Outfit",Outfit, system-ui; color:rgba(11,14,26,.6); cursor:pointer; transition:background .25s, color .25s; }
.v2q-tabs button.on{ background:#0B0E1A; color:#fff; }
.v2q-hold{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; min-height:360px; border:2px dashed rgba(11,14,26,.14); border-radius:18px; color:rgba(11,14,26,.55); font:600 14px "Sett Outfit",Outfit, system-ui; text-align:center; padding:24px; }
.v2q-hold b{ font:700 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:rgba(11,14,26,.45); }
@container (max-width: 900px){
  .v2q{ padding:96px 0 90px; }
  .v2q-grid{ grid-template-columns:1fr; gap:32px; }
  .v2q-copy{ position:relative; top:auto; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Form(props: Props) {
    const p = props
    const paper = p.theme === "paper"
    const head = useRef<HTMLDivElement>(null)
    const slot = useRef<HTMLDivElement>(null)
    useReveal(head)
    const canvas = onCanvas()
    // one form, or two behind a switch (e.g. particulier / ondernemer)
    const urls = [(p.formUrl || "").trim(), (p.formUrl2 || "").trim()].filter(Boolean)
    const [which, setWhich] = useState(0)
    const url = urls[Math.min(which, urls.length - 1)] || ""
    // Pipedrive's form pulls in its app and reCAPTCHA (a few MB), so not while the page opens.
    // A form right under the hero loads at the first scroll, or 2 s after the page has loaded
    // (so it's ready by the time you get there); one further down once it's half a screen away
    const [near, setNear] = useState(false)
    useEffect(() => {
        const el = slot.current
        if (!el || canvas || near) return
        const close = el.getBoundingClientRect().top + window.scrollY < window.innerHeight * 1.5
        let t = 0
        const go = () => setNear(true)
        const idle = () => (t = window.setTimeout(go, 2000))
        const io = new IntersectionObserver((e) => e[0].isIntersecting && go(), { rootMargin: close ? "0px 0px -1px 0px" : "50% 0px" })
        io.observe(el)
        if (close) {
            if (document.readyState === "complete") idle()
            else window.addEventListener("load", idle)
        }
        return () => {
            io.disconnect()
            clearTimeout(t)
            window.removeEventListener("load", idle)
        }
    }, [canvas, near])
    useEffect(() => {
        const el = slot.current
        if (!el || canvas || !url || !near) return
        // Pipedrive's own embed: the container with the form's address, then its loader
        // (a fresh <script> each time, so the form also appears after a page change)
        el.innerHTML = ""
        const box = document.createElement("div")
        box.className = "pipedriveWebForms"
        box.setAttribute("data-pd-webforms", url)
        el.appendChild(box)
        const s = document.createElement("script")
        s.src = LOADER
        s.async = true
        box.appendChild(s)
        return () => void (el.innerHTML = "")
    }, [url, canvas, near])
    return (
        <section id={p.anchor || undefined} className={"v2 v2q" + (paper ? " paper" : "")} style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2q-grid">
                    <div ref={head} className="v2q-copy">
                        <div className="v2-mono v2-fade" style={{ color: paper ? V.purpleInk : V.lime }}>
                            {or(p.eyebrow, "Contact")}
                        </div>
                        <h2 className="v2-h2">
                            <Lines text={or(p.heading, "Laat je|gegevens achter.")} />
                        </h2>
                        {p.body && <p className="v2-lead v2-fade">{p.body}</p>}
                        {p.points && (
                            <ul className="v2q-points v2-fade">
                                {p.points
                                    .split(/\n/)
                                    .map((l) => l.trim())
                                    .filter(Boolean)
                                    .map((l) => (
                                        <li key={l}>{l}</li>
                                    ))}
                            </ul>
                        )}
                    </div>
                    <div className="v2q-card">
                        {urls.length > 1 && (
                            <div className="v2q-tabs" role="tablist" aria-label="Kies je formulier">
                                {[p.tab1 || "Ik ben particulier", p.tab2 || "Ik ben ondernemer"].map((t, i) => (
                                    <button key={t} type="button" role="tab" aria-selected={which === i} className={which === i ? "on" : ""} onClick={() => setWhich(i)}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                        {canvas || !url ? (
                            <div className="v2q-hold">
                                <b>Pipedrive-formulier</b>
                                {url ? "Het formulier laadt in de preview en op de live site." : "Vul het formulieradres in (Formulier-URL)."}
                            </div>
                        ) : (
                            <div ref={slot} />
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2Form.displayName = "Sett V2 · Formulier"

addPropertyControls(SettV2Form, {
    formUrl: { type: ControlType.String, title: "Formulier-URL", description: "Het data-pd-webforms adres uit de Pipedrive-embedcode (https://webforms.pipedrive.com/f/…)." },
    formUrl2: { type: ControlType.String, title: "Tweede formulier", description: "Optioneel: dan komt er een schakelaar boven het formulier." },
    tab1: { type: ControlType.String, title: "Schakelaar 1", defaultValue: "Ik ben particulier", hidden: (p: Props) => !p.formUrl2 },
    tab2: { type: ControlType.String, title: "Schakelaar 2", defaultValue: "Ik ben ondernemer", hidden: (p: Props) => !p.formUrl2 },
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Contact" },
    heading: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Laat je|gegevens achter." },
    body: { type: ControlType.String, title: "Tekst", displayTextArea: true },
    points: { type: ControlType.String, title: "Punten", displayTextArea: true, description: "Eén per regel." },
    theme: { type: ControlType.Enum, title: "Thema", options: ["dark", "paper"], optionTitles: ["Donker", "Licht"], defaultValue: "dark" },
    anchor: { type: ControlType.String, title: "Anker-id", description: "Bijv. formulier, zodat een knop naar #formulier kan linken." },
})
