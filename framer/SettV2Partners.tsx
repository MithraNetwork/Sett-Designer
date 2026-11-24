// Sett V2 Partners — the partner page opener: big type with a photo beside it, then
// "who we're looking for" and a card per partner role, each with who it suits best.

import * as React from "react"
import { useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Arrow, V, Img, merge, or, linkTo } from "./SettV2Kit.tsx"

type Role = { title?: string; body?: string; ideal?: string; accent?: string }
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
    photo?: Img
    photoTag?: string
    label?: string
    heading?: string
    intro?: string
    idealLabel?: string
    roles?: Role[]
    style?: React.CSSProperties
}
const DEFAULTS: Role[] = [
    { title: "Installatiepartners", body: "Jij kent de daken, meterkasten en klanten. Wij brengen de energiehub die jouw aanbod compleet maakt.", ideal: "Installateurs die opslag, laadinfra en slim energiemanagement willen toevoegen.", accent: V.lime },
    { title: "Projectontwikkelaars", body: "Maak van energie een onderscheidend onderdeel van je gebiedsontwikkeling, vanaf de eerste parkeerplaats.", ideal: "Ontwikkelaars die capaciteit, waarde en toekomstbestendigheid willen combineren.", accent: V.sun },
    { title: "Energieadviseurs", body: "Je analyse is het begin. Samen maken we de stap naar een oplossing die op locatie werkt.", ideal: "Adviseurs die een concreet antwoord zoeken op netcongestie en flexibiliteit.", accent: V.purpleLight },
]

const CSS = `
.v2p{ padding:clamp(120px, 16vh, 170px) 0 clamp(90px, 12vh, 140px); }
.v2p-top{ display:grid; grid-template-columns:minmax(0, 1.05fr) minmax(0, .95fr); gap:clamp(32px, 5cqi, 80px); align-items:center; }
.v2p-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2p-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2p .v2-display{ font-size:clamp(40px, 4.8cqi, 88px); }
.v2p-lead{ margin-top:clamp(18px, 3vh, 28px); }
.v2p-btns{ display:flex; gap:12px; flex-wrap:wrap; margin-top:34px; }
.v2p-photo{ position:relative; aspect-ratio:4 / 5; border-radius:30px; overflow:hidden; background:${V.ink2}; box-shadow:0 30px 80px rgba(0,0,0,.35); }
.v2p-photo img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transform:scale(1.06); transition:transform 1.6s cubic-bezier(.2,.8,.1,1); }
.v2-in .v2p-photo img{ transform:none; }
.v2p-photo::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, transparent 55%, rgba(6,12,26,.55)); pointer-events:none; }
.v2p-tag{ position:absolute; left:18px; bottom:18px; z-index:1; display:inline-flex; align-items:center; gap:8px; padding:9px 14px; border-radius:999px; background:rgba(6,12,26,.72); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); color:#F4F6FB; }
.v2p-tag::before{ content:""; width:7px; height:7px; border-radius:99px; background:${V.lime}; }

.v2p-who{ margin-top:clamp(90px, 14vh, 150px); display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:clamp(24px, 4cqi, 64px); align-items:end; }
.v2p-who .v2-mono{ color:${V.lime}; margin-bottom:16px; display:block; }
.v2p-who .v2-h2{ font-size:clamp(34px, 4.4cqi, 72px); max-width:14ch; }
.v2p-roles{ margin-top:clamp(36px, 6vh, 56px); display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; }
.v2p-role{ position:relative; display:flex; flex-direction:column; gap:14px; padding:clamp(24px, 2.4cqi, 34px); border-radius:26px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08);
  opacity:0; transform:translateY(24px); transition:opacity .7s ease, transform .8s cubic-bezier(.2,.8,.1,1); }
.v2-in .v2p-role{ opacity:1; transform:none; }
.v2p-role .n{ font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; color:var(--accent); }
.v2p-role h3{ font-weight:800; font-size:clamp(24px, 2.2cqi, 32px); letter-spacing:-.02em; line-height:1.08; overflow-wrap:anywhere; }
.v2p-role p{ font-size:17px; line-height:1.55; color:rgba(223,228,244,.75); }
.v2p-ideal{ margin-top:auto; padding:16px 18px; border-radius:16px; background:color-mix(in srgb, var(--accent) 10%, transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent); }
.v2p-ideal span{ display:block; font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); margin-bottom:6px; }
.v2p-ideal p{ font-size:15px; line-height:1.5; color:#F4F6FB; }
@container (max-width: 1000px){
  .v2p-roles{ grid-template-columns:1fr; }
  .v2p-role{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); column-gap:28px; align-items:start; }
  .v2p-role .n, .v2p-role h3, .v2p-role > p{ grid-column:1; }
  .v2p-ideal{ grid-column:2; grid-row:1 / span 3; margin-top:0; }
}
@container (max-width: 809px){
  .v2p-top{ grid-template-columns:1fr; }
  .v2p-photo{ aspect-ratio:4 / 3; border-radius:24px; }
  .v2p-who{ grid-template-columns:1fr; gap:16px; }
  .v2p-role{ display:flex; }
  .v2p-ideal{ margin-top:6px; }
  .v2p-btns .v2-btn{ flex:1 1 auto; justify-content:center; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Partners(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    const cards = useRef<HTMLDivElement>(null)
    const who = useRef<HTMLDivElement>(null)
    useReveal(head)
    useReveal(who)
    useReveal(cards)
    const roles = (p.roles && p.roles.length ? p.roles : DEFAULTS).map((r, i) => merge(DEFAULTS[i % DEFAULTS.length], r))
    return (
        <section className="v2 v2p" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div ref={head} className="v2p-top">
                    <div>
                        <div className="v2p-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Samenwerken met Sett")}</div>
                        <h1 className="v2-display">
                            <Lines text={or(p.headline, "Samen maken we|energieopslag|mogelijk.")} />
                        </h1>
                        <p className="v2p-lead v2-lead v2-fade">{or(p.lead, "Sett werkt met partners die klanten verder willen helpen dan alleen een aansluiting. Van advies tot aanleg: we maken ruimte voor energie die wél vooruit kan.")}</p>
                        <div className="v2p-btns v2-fade">
                            <a className="v2-btn lime" href={linkTo(p.primaryLink, p.primaryLinkHash, "/contact#formulier")}>
                                {or(p.primary, "Plan een kennismaking")} <Arrow />
                            </a>
                            {p.secondary !== "" && (
                                <a className="v2-btn line" href={linkTo(p.secondaryLink, p.secondaryLinkHash, V.phone)}>
                                    {p.secondary ?? "Bel direct"}
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="v2p-photo v2-fade">
                        {p.photo?.src && <img src={p.photo.src} srcSet={p.photo.srcSet} alt={p.photo.alt || ""} loading="eager" />}
                        {p.photoTag !== "" && <span className="v2p-tag v2-mono">{p.photoTag ?? "Samen bouwen"}</span>}
                    </div>
                </div>

                <div ref={who} className="v2p-who">
                    <div>
                        <span className="v2-mono v2-fade">{or(p.label, "Voor wie wil bouwen")}</span>
                        <h2 className="v2-h2">
                            <Lines text={or(p.heading, "We zoeken partners|om Sett te installeren|in Nederland.")} />
                        </h2>
                    </div>
                    <p className="v2-lead v2-fade">{or(p.intro, "Van grondwerkers tot e-installateurs en branchespecialisten. Wil je samen bouwen aan het succes van Sett en netcongestie tegengaan? Laat je gegevens achter en we nemen zo snel mogelijk contact op.")}</p>
                </div>

                <div ref={cards} className="v2p-roles">
                    {roles.map((r, i) => (
                        <article key={i} className="v2p-role" style={{ ["--accent" as string]: r.accent, transitionDelay: i * 90 + "ms" } as React.CSSProperties}>
                            <span className="n">{String(i + 1).padStart(2, "0")}</span>
                            <h3>{r.title}</h3>
                            <p>{r.body}</p>
                            {r.ideal && (
                                <div className="v2p-ideal">
                                    <span>{or(p.idealLabel, "Ideaal voor")}</span>
                                    <p>{r.ideal}</p>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

SettV2Partners.displayName = "Sett V2 · Partners"

addPropertyControls(SettV2Partners, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Samenwerken met Sett" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Samen maken we|energieopslag|mogelijk." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Sett werkt met partners die klanten verder willen helpen dan alleen een aansluiting. Van advies tot aanleg: we maken ruimte voor energie die wél vooruit kan." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Plan een kennismaking" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/contact#formulier" },
    primaryLinkHash: { type: ControlType.String, title: "Knop 1 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    secondary: { type: ControlType.String, title: "Knop 2", description: "Leeg: geen tweede knop.", defaultValue: "Bel direct" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", defaultValue: "tel:+31332104140" },
    secondaryLinkHash: { type: ControlType.String, title: "Knop 2 anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
    photo: { type: ControlType.ResponsiveImage, title: "Foto" },
    photoTag: { type: ControlType.String, title: "Fotolabel", description: "Leeg: geen label.", defaultValue: "Samen bouwen" },
    label: { type: ControlType.String, title: "Label rollen", defaultValue: "Voor wie wil bouwen" },
    heading: { type: ControlType.String, title: "Kop rollen", displayTextArea: true, defaultValue: "We zoeken partners|om Sett te installeren|in Nederland." },
    intro: { type: ControlType.String, title: "Tekst rollen", displayTextArea: true, defaultValue: "Van grondwerkers tot e-installateurs en branchespecialisten. Wil je samen bouwen aan het succes van Sett en netcongestie tegengaan? Laat je gegevens achter en we nemen zo snel mogelijk contact op." },
    idealLabel: { type: ControlType.String, title: "Ideaal-label", defaultValue: "Ideaal voor" },
    roles: {
        type: ControlType.Array,
        title: "Rollen",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Titel" },
                body: { type: ControlType.String, title: "Tekst", displayTextArea: true },
                ideal: { type: ControlType.String, title: "Ideaal voor", displayTextArea: true },
                accent: { type: ControlType.Color, title: "Accent" },
            },
        },
    },
})
