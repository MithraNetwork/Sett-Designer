// Sett Footer — the site's footer: the logo with a short line and the buttons, four columns
// of links (Sett voor, Over Sett, Hulp & contact, Juridisch), the address and contact
// details, and a bottom line with the company details. Dark, in the V2 style.
// Links are one per line in the property panel: "Label | /link".
// "Cookie-instellingen" (#cookies) opens the cookie notice again.

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Arrow, V, or } from "./SettV2Kit.tsx"
import { LOGO_D } from "./SettNav.tsx"

type Column = { title?: string; links?: string }
interface Props {
    line?: string
    primary?: string
    primaryLink?: string
    secondary?: string
    secondaryLink?: string
    columns?: Column[]
    address?: string
    email?: string
    phone?: string
    company?: string
    linkedin?: string
    instagram?: string
    style?: React.CSSProperties
}

const COLUMNS: Column[] = [
    { title: "Sett voor", links: "Particulieren | /particulieren\nBedrijven | /bedrijven\nGemeenten | /gemeenten\nWat is Sett? | /details\nBestel jouw Sett | /pre-order" },
    { title: "Over Sett", links: "Over ons | /over\nIn de media | /bnr\nPartners | /partners\nRoadmap | /roadmap\nBlog | /blog" },
    { title: "Hulp & contact", links: "Q&A | /qa\nContact | /contact\nPlan een afspraak | /contact#afspraak" },
    { title: "Juridisch", links: "Algemene voorwaarden | /voorwaarden\nPrivacyverklaring | /privacy\nCookie-instellingen | #cookies" },
]

const CSS = `
.sf{ background:${V.ink}; color:#F4F6FB; padding:clamp(64px, 10vh, 112px) 0 28px; border-top:1px solid rgba(223,228,244,.08); }
.sf a{ text-decoration:none; }
.sf a:not(.v2-btn){ color:inherit; }
.sf-top{ display:grid; grid-template-columns:minmax(260px, 1fr) minmax(0, 2.2fr); gap:clamp(40px, 6cqi, 96px); }
.sf-brand svg{ width:132px; height:auto; display:block; }
.sf-brand p{ margin:22px 0 26px; max-width:340px; font-size:17px; line-height:1.55; color:rgba(223,228,244,.72); }
.sf-btns{ display:flex; flex-wrap:wrap; gap:10px; }
.sf-cols{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:32px clamp(20px, 3cqi, 40px); }
.sf-col b{ display:block; font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.14em; text-transform:uppercase; color:${V.lime}; margin-bottom:18px; }
.sf-col ul{ list-style:none; margin:0; padding:0; display:grid; gap:11px; }
.sf-col a{ font-size:15px; line-height:1.35; color:rgba(223,228,244,.78); transition:color .2s; }
.sf-col a:hover{ color:#fff; }
.sf-contact{ display:flex; flex-wrap:wrap; gap:14px 48px; margin-top:clamp(48px, 7vh, 72px); padding-top:28px; border-top:1px solid rgba(223,228,244,.1); font-size:15px; color:rgba(223,228,244,.78); }
.sf-contact div{ display:flex; flex-direction:column; gap:4px; }
.sf-contact span{ font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.14em; text-transform:uppercase; color:rgba(223,228,244,.45); margin-bottom:4px; }
.sf-contact a:hover{ color:#fff; }
.sf-social{ margin-left:auto; display:flex; gap:10px; align-items:flex-end; }
.sf-social a{ width:40px; height:40px; border-radius:50%; display:grid; place-items:center; box-shadow:inset 0 0 0 1.5px rgba(223,228,244,.2); color:rgba(223,228,244,.8); }
.sf-social a:hover{ color:#fff; box-shadow:inset 0 0 0 1.5px rgba(223,228,244,.5); }
.sf-social svg{ width:17px; height:17px; }
.sf-bottom{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px 24px; margin-top:28px; font:500 12px/1.6 "Sett Mono","Geist Mono",monospace; letter-spacing:.04em; color:rgba(223,228,244,.45); }
@container (max-width: 1000px){
  .sf-top{ grid-template-columns:1fr; }
  .sf-cols{ grid-template-columns:repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 520px){
  .sf-social{ margin-left:0; }
}
`

const lines = (s?: string) =>
    (s || "")
        .split("\n")
        .map((l) => l.split("|").map((x) => x.trim()))
        .filter((x) => x[0])
        .map(([label, link]) => ({ label, link: link || "#" }))

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettFooter(props: Props) {
    const p = props
    const columns = (p.columns && p.columns.length ? p.columns : COLUMNS).map((c, i) => ({ title: or(c.title, COLUMNS[i]?.title ?? ""), links: lines(or(c.links, COLUMNS[i]?.links ?? "")) }))
    const email = or(p.email, "info@sett.nl")
    const phone = or(p.phone, "+31 33 210 4140")
    const address = or(p.address, "Hogebrinkerweg 18-021\n3871 KN Hoevelaken")
    const year = new Date().getFullYear()
    return (
        <footer className="v2 sf" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="sf-top">
                    <div className="sf-brand">
                        <a href="/" aria-label="Sett, naar de homepage">
                            <svg viewBox="0 0 130 66.338" role="img" aria-label="Sett, energietransitie all sett">
                                <path d={LOGO_D} fill="#FFFFFF" />
                            </svg>
                        </a>
                        <p>{or(p.line, "De ondergrondse energiehub: opslag en laden onder je parkeerplek, zonder het net te belasten.")}</p>
                        <div className="sf-btns">
                            {p.primary !== "" && (
                                <a className="v2-btn lime" href={or(p.primaryLink, "/pre-order")}>
                                    {p.primary ?? "Bestel jouw Sett"} <Arrow />
                                </a>
                            )}
                            {p.secondary !== "" && (
                                <a className="v2-btn line" href={or(p.secondaryLink, "/contact#afspraak")}>
                                    {p.secondary ?? "Plan een afspraak"}
                                </a>
                            )}
                        </div>
                    </div>
                    <nav className="sf-cols" aria-label="Footer">
                        {columns.map((c, i) => (
                            <div className="sf-col" key={i}>
                                <b>{c.title}</b>
                                <ul>
                                    {c.links.map((l, j) => (
                                        <li key={j}>
                                            <a href={l.link}>{l.label}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>
                <div className="sf-contact">
                    <div>
                        <span>Adres</span>
                        {address.split("\n").map((l, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <br />}
                                {l}
                            </React.Fragment>
                        ))}
                    </div>
                    <div>
                        <span>Mail</span>
                        <a href={"mailto:" + email}>{email}</a>
                    </div>
                    <div>
                        <span>Bel</span>
                        <a href={"tel:" + phone.replace(/[^\d+]/g, "")}>{phone}</a>
                    </div>
                    {(p.linkedin || p.instagram) && (
                        <div className="sf-social">
                            {p.linkedin && (
                                <a href={p.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Sett op LinkedIn">
                                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.77 2.55 4.77 5.86v5.59h-4v-4.96c0-1.18-.02-2.7-1.7-2.7-1.7 0-1.96 1.28-1.96 2.61v5.05h-4v-11Z" />
                                    </svg>
                                </a>
                            )}
                            {p.instagram && (
                                <a href={p.instagram} target="_blank" rel="noopener noreferrer" aria-label="Sett op Instagram">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <rect x="3" y="3" width="18" height="18" rx="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <div className="sf-bottom">
                    <span>© {year} Sett</span>
                    <span>{or(p.company, "KvK 96683147 · btw NL867713653B01")}</span>
                </div>
            </div>
        </footer>
    )
}

SettFooter.displayName = "Sett · Footer"

addPropertyControls(SettFooter, {
    line: { type: ControlType.String, title: "Tekst", displayTextArea: true, defaultValue: "De ondergrondse energiehub: opslag en laden onder je parkeerplek, zonder het net te belasten." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bestel jouw Sett", description: "Leeg: geen knop." },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/pre-order" },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Plan een afspraak", description: "Leeg: geen knop." },
    secondaryLink: { type: ControlType.String, title: "Knop 2 link", defaultValue: "/contact#afspraak" },
    columns: {
        type: ControlType.Array,
        title: "Kolommen",
        maxCount: 5,
        defaultValue: COLUMNS,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Kop" },
                links: { type: ControlType.String, title: "Links", displayTextArea: true, description: "Eén per regel: Tekst | /link" },
            },
        },
    },
    address: { type: ControlType.String, title: "Adres", displayTextArea: true, defaultValue: "Hogebrinkerweg 18-021\n3871 KN Hoevelaken" },
    email: { type: ControlType.String, title: "Mail", defaultValue: "info@sett.nl" },
    phone: { type: ControlType.String, title: "Telefoon", defaultValue: "+31 33 210 4140" },
    company: { type: ControlType.String, title: "Bedrijfsgegevens", defaultValue: "KvK 96683147 · btw NL867713653B01" },
    linkedin: { type: ControlType.String, title: "LinkedIn", placeholder: "https://www.linkedin.com/company/…", description: "Leeg: geen icoon." },
    instagram: { type: ControlType.String, title: "Instagram", placeholder: "https://www.instagram.com/…", description: "Leeg: geen icoon." },
} as never)
