// Sett V2 Contact — the contact page's opening: big type and the two ways in (call,
// or the form below), a live 3D scene beside it, then three cards (bel, mail, kom
// langs) and the company details, each copied with a tap.

import * as React from "react"
import { useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Near, Poster, Arrow, V, Img, or, linkTo } from "./SettV2Kit.tsx"
import SettScrollScene from "./SettScrollScene.tsx"

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
    model?: string
    poster?: Img
    phone?: string
    phoneLink?: string
    email?: string
    address?: string
    routeLink?: string
    details?: string
    metaLeft?: string
    metaRight?: string
    style?: React.CSSProperties
}
const CSS = `
.v2c2{ padding:clamp(120px, 16vh, 170px) 0 110px; overflow:hidden; }
.v2c2-meta{ display:flex; justify-content:space-between; gap:24px; margin-bottom:clamp(28px, 5vh, 56px); color:rgba(223,228,244,.6); }
.v2c2-top{ display:grid; grid-template-columns:1.05fr .95fr; gap:40px; align-items:center; }
.v2c2-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2c2-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2c2 .v2-display{ max-width:8ch; font-size:clamp(52px, 9cqi, 150px); }
.v2c2-lead{ margin-top:clamp(18px, 3vh, 28px); max-width:520px; }
.v2c2-btns{ display:flex; gap:12px; flex-wrap:wrap; margin-top:30px; }
.v2c2-scene{ position:relative; aspect-ratio:1 / 1; width:100%; }
.v2c2-cards{ display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; margin-top:clamp(40px, 7vh, 80px); }
.v2c2-card{ position:relative; display:flex; flex-direction:column; gap:14px; padding:28px 28px 26px; border-radius:26px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); transition:transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s; color:inherit; text-decoration:none; }
.v2c2-card:hover{ transform:translateY(-4px); box-shadow:inset 0 0 0 1px rgba(223,228,244,.16), 0 20px 50px rgba(0,0,0,.3); }
.v2c2-card .lbl{ display:inline-flex; align-items:center; gap:10px; }
.v2c2-card .lbl i{ width:10px; height:10px; border-radius:99px; display:inline-block; }
.v2c2-card b{ font-weight:800; font-size:clamp(22px, 2.2cqi, 32px); letter-spacing:-.02em; line-height:1.15; white-space:pre-line; }
.v2c2-card .go{ margin-top:auto; display:inline-flex; align-items:center; gap:10px; font-weight:700; font-size:15px; color:rgba(223,228,244,.8); }
.v2c2-card:hover .go{ color:#fff; }
.v2c2-card .go .arr{ transition:transform .35s cubic-bezier(.2,.8,.2,1); }
.v2c2-card:hover .go .arr{ transform:translateX(4px); }
.v2c2-details{ display:flex; flex-wrap:wrap; gap:10px 28px; margin-top:28px; padding-top:22px; border-top:1px solid rgba(223,228,244,.1); }
.v2c2-details button{ all:unset; cursor:pointer; display:inline-flex; gap:10px; align-items:baseline; font-size:14px; color:rgba(223,228,244,.7); }
.v2c2-details button:hover{ color:#fff; }
.v2c2-details button span{ font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:rgba(223,228,244,.6); }
.v2c2-details button em{ font-style:normal; font:500 11px "Sett Mono","Geist Mono",monospace; color:${V.lime}; opacity:0; transition:opacity .2s; }
.v2c2-details button.done em{ opacity:1; }
@container (max-width: 900px){
  .v2c2-top{ grid-template-columns:1fr; }
  .v2c2-scene{ aspect-ratio:4 / 3; margin-top:10px; }
  .v2c2-cards{ grid-template-columns:1fr; }
  .v2c2-meta > :nth-child(n+2){ display:none; }
}
`
const Card = ({ href, label, value, go, color, external }: { href: string; label: string; value: string; go: string; color: string; external?: boolean }) => (
    <a className="v2c2-card" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
        <span className="lbl v2-mono v2-muted">
            <i style={{ background: color }} />
            {label}
        </span>
        {/* a house number like 18-021 never breaks at its hyphen */}
        <b>{value.replace(/(\d)-(\d)/g, "$1\u2011$2")}</b>
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
export default function SettV2Contact(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const [copied, setCopied] = useState(-1)
    const phone = or(p.phone, "+31 (0) 33 210 41 40")
    const email = or(p.email, "info@sett.nl")
    const address = or(p.address, "Hogebrinkerweg 18-021\n3871 KN Hoevelaken")
    const route = or(p.routeLink, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address.replace(/\n/g, ", ")))
    const details = (or(p.details, "KvK | 96683147\nBtw | NL867713653B01\nBank | NL76 ADYB 1000 0203 75") || "")
        .split(/\n/)
        .map((l) => l.split("|").map((x) => x.trim()))
        .filter((x) => x[0] && x[1])
    const copy = (i: number, v: string) => {
        try {
            navigator.clipboard?.writeText(v.replace(/\s+/g, " "))
        } catch {
            /* no clipboard: the value is on screen anyway */
        }
        setCopied(i)
        setTimeout(() => setCopied((c) => (c === i ? -1 : c)), 1600)
    }
    return (
        <section className="v2 v2c2" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-grid" style={{ zIndex: 0 }} />
            <div className="v2-wrap">
                <div className="v2c2-meta v2-mono">
                    <span>{or(p.metaLeft, "Sett · contact")}</span>
                    <span>{or(p.metaRight, "52.17° N · 5.46° E · Hoevelaken")}</span>
                </div>
                <div className="v2c2-top">
                    <div ref={head}>
                        <div className="v2c2-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Contact")}</div>
                        <h1 className="v2-display">
                            <Lines text={or(p.headline, "Laten we|praten.")} />
                        </h1>
                        <p className="v2c2-lead v2-lead v2-fade">{or(p.lead, "Wil je meer weten over Sett? Geef ons een belletje of plan direct je afspraak in.")}</p>
                        <div className="v2c2-btns v2-fade">
                            {p.primary !== "" && (
                                <a className="v2-btn lime" href={linkTo(p.primaryLink, p.primaryLinkHash, "tel:+31332104140")}>
                                    {p.primary ?? "Bel direct"} <Arrow />
                                </a>
                            )}
                            {p.secondary !== "" && (
                                <a className="v2-btn line" href={linkTo(p.secondaryLink, p.secondaryLinkHash, "#formulier")}>
                                    {p.secondary ?? "Plan een afspraak"}
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="v2c2-scene">
                        {p.model ? (
                            <Near placeholder={<Poster img={p.poster} fit="contain" />}>
                                <SettScrollScene model={p.model} poster={p.poster} framing="scene" mobile3D={false} />
                            </Near>
                        ) : (
                            <Poster img={p.poster} fit="contain" />
                        )}
                    </div>
                </div>
                <div className="v2c2-cards">
                    <Card href={or(p.phoneLink, "tel:+31332104140")} label="Bel" value={phone} go="Bel direct" color={V.lime} />
                    <Card href={"mailto:" + email} label="Mail" value={email} go="Stuur een mail" color={V.blueLight} />
                    <Card href={route} label="Kom langs" value={address} go="Route plannen" color={V.sun} external />
                </div>
                {details.length > 0 && (
                    <div className="v2c2-details">
                        {details.map(([k, v], i) => (
                            <button key={k} type="button" className={copied === i ? "done" : ""} onClick={() => copy(i, v)} title={"Kopieer " + k}>
                                <span>{k}</span>
                                {v}
                                <em>gekopieerd</em>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

SettV2Contact.displayName = "Sett V2 · Contact"

addPropertyControls(SettV2Contact, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Contact" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Laten we|praten." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Wil je meer weten over Sett? Geef ons een belletje of plan direct je afspraak in." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bel direct" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link" },
    primaryLinkHash: { type: ControlType.String, title: "Knop 1 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Plan een afspraak" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", description: "Standaard #formulier (het formulier lager op de pagina)." },
    secondaryLinkHash: { type: ControlType.String, title: "Knop 2 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    model: { type: ControlType.File, title: "3D-scène", allowedFileTypes: ["glb"] },
    poster: { type: ControlType.ResponsiveImage, title: "Afbeelding" },
    phone: { type: ControlType.String, title: "Telefoon" },
    phoneLink: { type: ControlType.Link, title: "Telefoon link" },
    email: { type: ControlType.String, title: "E-mail" },
    address: { type: ControlType.String, title: "Adres", displayTextArea: true },
    routeLink: { type: ControlType.Link, title: "Route link", description: "Leeg: Google Maps met het adres." },
    details: { type: ControlType.String, title: "Bedrijfsgegevens", displayTextArea: true, description: "Eén per regel: Label | waarde. Tik om te kopiëren." },
    metaLeft: { type: ControlType.String, title: "Meta links", defaultValue: "Sett · contact" },
    metaRight: { type: ControlType.String, title: "Meta rechts", defaultValue: "52.17° N · 5.46° E · Hoevelaken" },
})
