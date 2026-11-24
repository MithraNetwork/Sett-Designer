// Sett V2 Confirm — the page after ordering: "you're in", what happens next, and how to
// reach Sett (call, mail, or book a call right away). The place in the batch is optional:
// a link like /bestelling-bevestigd?nummer=12 shows "12 of 30", lights up that spot, and
// otherwise the page simply says you're in batch 1 (never a loose placeholder). With the
// batch left empty it is a plain thank-you page (as on /bedankt).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onCanvas, Arrow, V, or } from "./SettV2Kit.tsx"

interface Props {
    eyebrow?: string
    headline?: string
    lead?: string
    numberLine?: string
    total?: number
    batch?: string
    param?: string
    stepsTitle?: string
    steps?: string
    primary?: string
    primaryLink?: string
    secondary?: string
    secondaryLink?: string
    contactTitle?: string
    phone?: string
    phoneLink?: string
    email?: string
    meeting?: string
    meetingLink?: string
    style?: React.CSSProperties
}

const CSS = `
.v2b{ padding:clamp(130px, 18vh, 190px) 0 clamp(80px, 11vh, 130px); overflow:hidden; }
.v2b-glow{ position:absolute; inset:0; pointer-events:none; background:radial-gradient(50% 45% at 18% 20%, rgba(141,255,102,.10), transparent 70%); }
.v2b-top{ position:relative; display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(0, .9fr); gap:clamp(32px, 5cqi, 80px); align-items:start; }
.v2b-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2b-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2b .v2-display{ font-size:clamp(48px, 7.6cqi, 128px); }
.v2b-lead{ margin-top:clamp(18px, 3vh, 28px); }
.v2b-btns{ display:flex; gap:12px; flex-wrap:wrap; margin-top:34px; }

/* the batch: 30 spots, yours lit up */
.v2b-batch{ margin-top:30px; padding:18px 20px; border-radius:20px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); max-width:560px; }
.v2b-batch .row{ display:flex; justify-content:space-between; gap:12px; color:rgba(223,228,244,.65); margin-bottom:14px; }
.v2b-batch .row b{ color:${V.lime}; font-weight:600; }
.v2b-dots{ display:grid; grid-template-columns:repeat(15, 1fr); gap:6px; }
.v2b-dots i{ aspect-ratio:1; border-radius:99px; background:rgba(223,228,244,.12); }
.v2b-dots i.taken{ background:rgba(141,255,102,.35); }
.v2b-dots i.you{ background:${V.lime}; box-shadow:0 0 0 3px rgba(141,255,102,.25), 0 0 16px ${V.lime}; }

/* what happens next */
.v2b-next{ padding:clamp(24px, 2.4cqi, 34px); border-radius:28px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); }
.v2b-next h2{ font-weight:800; font-size:clamp(22px, 2cqi, 28px); letter-spacing:-.02em; margin-bottom:20px; }
.v2b-next ol{ display:flex; flex-direction:column; gap:18px; counter-reset:n; }
.v2b-next li{ display:grid; grid-template-columns:34px 1fr; gap:14px; align-items:start; font-size:17px; line-height:1.5; color:rgba(223,228,244,.8); counter-increment:n; }
.v2b-next li::before{ content:counter(n); display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:99px; background:rgba(141,255,102,.14); color:${V.lime}; font:700 13px "Sett Mono","Geist Mono",monospace; }

/* contact */
.v2b-contact{ position:relative; margin-top:clamp(56px, 9vh, 100px); }
.v2b-contact > .v2-mono{ display:flex; align-items:center; gap:14px; color:rgba(223,228,244,.6); margin-bottom:18px; }
.v2b-contact > .v2-mono::after{ content:""; flex:1; height:1px; background:rgba(223,228,244,.12); }
.v2b-cards{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; }
.v2b-card{ display:flex; flex-direction:column; gap:14px; padding:26px 26px 24px; border-radius:26px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); color:inherit; text-decoration:none; transition:transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s; }
.v2b-card:hover{ transform:translateY(-4px); box-shadow:inset 0 0 0 1px rgba(223,228,244,.16), 0 20px 50px rgba(0,0,0,.3); }
.v2b-card .lbl{ display:inline-flex; align-items:center; gap:10px; color:rgba(223,228,244,.6); }
.v2b-card .lbl i{ width:10px; height:10px; border-radius:99px; display:inline-block; }
.v2b-card b{ font-weight:800; font-size:clamp(20px, 2cqi, 28px); letter-spacing:-.02em; line-height:1.15; overflow-wrap:anywhere; }
.v2b-card .go{ margin-top:auto; display:inline-flex; align-items:center; gap:10px; font-weight:700; font-size:15px; color:rgba(223,228,244,.8); }
.v2b-card:hover .go{ color:#fff; }
.v2b-card .go .arr{ transition:transform .35s cubic-bezier(.2,.8,.2,1); }
.v2b-card:hover .go .arr{ transform:translateX(4px); }
.v2b-card.main{ background:${V.lime}; color:${V.ink}; box-shadow:none; }
.v2b-card.main .lbl, .v2b-card.main .go{ color:rgba(6,12,26,.7); }
.v2b-card.main:hover .go{ color:${V.ink}; }
@container (max-width: 1000px){ .v2b-top{ grid-template-columns:1fr; } }
@container (max-width: 809px){
  .v2b-cards{ grid-template-columns:1fr; }
  .v2b-dots{ grid-template-columns:repeat(10, 1fr); }
  .v2b-btns .v2-btn{ flex:1 1 auto; justify-content:center; }
}
`

const Card = ({ href, label, value, go, color, main }: { href: string; label: string; value: string; go: string; color: string; main?: boolean }) => (
    <a className={"v2b-card" + (main ? " main" : "")} href={href}>
        <span className="lbl v2-mono">
            <i style={{ background: main ? V.ink : color }} />
            {label}
        </span>
        <b>{value}</b>
        <span className="go">
            {go} <Arrow />
        </span>
    </a>
)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Confirm(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const total = typeof p.total === "number" && p.total > 0 ? Math.round(p.total) : 30
    // the place in the batch, from the link (?nummer=12); read after loading, so the page
    // the server sends is the same for everyone
    const [n, setN] = useState<number | null>(null)
    useEffect(() => {
        if (typeof window === "undefined" || onCanvas()) return
        const v = parseInt(new URLSearchParams(window.location.search).get(or(p.param, "nummer")) || "", 10)
        if (v >= 1 && v <= total && p.batch !== "") setN(v)
    }, [p.param, total, p.batch])
    const batch = p.batch ?? "batch 1"
    const lead = or(p.lead, "We nemen binnen 5 werkdagen persoonlijk contact op om je situatie door te nemen. Check ook je mail: daar staat je bevestiging.")
    const first = !batch ? "" : n ? or(p.numberLine, "Je staat op {n} van de {total} in {batch}.").replace("{n}", String(n)).replace("{total}", String(total)).replace("{batch}", batch) : "Je zit in " + batch + "."
    const steps = (p.steps ?? "Check je mail: daar staat je bevestiging\nWe bellen je binnen 5 werkdagen voor een persoonlijk gesprek\nSamen kijken we naar je plek, je aansluiting en de planning")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    const phone = or(p.phone, "+31 (0) 33 210 41 40")
    const email = or(p.email, "info@sett.nl")
    return (
        <section className="v2 v2b" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2b-glow" />
            <div className="v2-wrap">
                <div ref={head} className="v2b-top">
                    <div>
                        <div className="v2b-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Reservering ontvangen")}</div>
                        <h1 className="v2-display">
                            <Lines text={or(p.headline, "Je bent|erbij.")} />
                        </h1>
                        <p className="v2b-lead v2-lead v2-fade">
                            {first ? first + " " : ""}
                            {lead}
                        </p>
                        {n && (
                            <div className="v2b-batch v2-fade" aria-label={"Plek " + n + " van " + total}>
                                <div className="row v2-mono">
                                    <span>{batch}</span>
                                    <b>
                                        Jouw plek: {n} / {total}
                                    </b>
                                </div>
                                <div className="v2b-dots">
                                    {Array.from({ length: total }, (_, i) => (
                                        <i key={i} className={i + 1 === n ? "you" : i + 1 < n ? "taken" : ""} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="v2b-btns v2-fade">
                            <a className="v2-btn lime" href={or(p.primaryLink, "/roadmap")}>
                                {or(p.primary, "Bekijk de roadmap")} <Arrow />
                            </a>
                            {p.secondary !== "" && (
                                <a className="v2-btn line" href={or(p.secondaryLink, "#afspraak")}>
                                    {p.secondary ?? "Plan alvast een gesprek"}
                                </a>
                            )}
                        </div>
                    </div>
                    {steps.length > 0 && (
                        <div className="v2b-next v2-fade">
                            <h2>{or(p.stepsTitle, "Wat er nu gebeurt")}</h2>
                            <ol>
                                {steps.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                <div className="v2b-contact">
                    <div className="v2-mono">{or(p.contactTitle, "Vragen? Neem contact op")}</div>
                    <div className="v2b-cards">
                        <Card href={or(p.phoneLink, V.phone)} label="Bel" value={phone} go="Bel direct" color={V.lime} />
                        <Card href={"mailto:" + email} label="Mail" value={email} go="Stuur een mail" color={V.blueLight} />
                        <Card href={or(p.meetingLink, "#afspraak")} label="Afspraak" value={or(p.meeting, "Plan een online kennismaking")} go="Kies een moment" color={V.sun} main />
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2Confirm.displayName = "Sett V2 · Bevestiging"

addPropertyControls(SettV2Confirm, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Reservering ontvangen" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Je bent|erbij." },
    lead: { type: ControlType.String, title: "Tekst", displayTextArea: true, defaultValue: "We nemen binnen 5 werkdagen persoonlijk contact op om je situatie door te nemen. Check ook je mail: daar staat je bevestiging." },
    numberLine: { type: ControlType.String, title: "Met nummer", description: "Als de link een nummer meegeeft (?nummer=12). {n}, {total} en {batch} worden ingevuld.", defaultValue: "Je staat op {n} van de {total} in {batch}." },
    total: { type: ControlType.Number, title: "Plekken", min: 1, max: 200, step: 1, defaultValue: 30 },
    batch: { type: ControlType.String, title: "Batch", defaultValue: "batch 1", description: "Leeg: geen batch en geen nummer (een gewone bedankpagina)." },
    param: { type: ControlType.String, title: "Link-parameter", defaultValue: "nummer", description: "De naam in de link: /bestelling-bevestigd?nummer=12" },
    stepsTitle: { type: ControlType.String, title: "Stappen-kop", defaultValue: "Wat er nu gebeurt" },
    steps: { type: ControlType.String, title: "Stappen", displayTextArea: true, description: "Eén per regel. Leeg: geen stappen.", defaultValue: "Check je mail: daar staat je bevestiging\nWe bellen je binnen 5 werkdagen voor een persoonlijk gesprek\nSamen kijken we naar je plek, je aansluiting en de planning" },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bekijk de roadmap" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/roadmap" },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Plan alvast een gesprek", description: "Leeg: geen tweede knop." },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", defaultValue: "#afspraak" },
    contactTitle: { type: ControlType.String, title: "Contact-kop", defaultValue: "Vragen? Neem contact op" },
    phone: { type: ControlType.String, title: "Telefoon", defaultValue: "+31 (0) 33 210 41 40" },
    phoneLink: { type: ControlType.Link, title: "Telefoonlink", defaultValue: "tel:+31332104140" },
    email: { type: ControlType.String, title: "E-mail", defaultValue: "info@sett.nl" },
    meeting: { type: ControlType.String, title: "Afspraak", defaultValue: "Plan een online kennismaking" },
    meetingLink: { type: ControlType.Link, title: "Afspraak-link", defaultValue: "#afspraak", description: "Standaard naar de afspraakplanner op deze pagina." },
})
