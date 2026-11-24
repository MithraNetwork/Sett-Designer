// Sett — /details, the whole page body (between the site's nav and footer),
// with the interactive Sett inspector in the specs section.
// Needs the code files SettUI and SettBox3D in the same Framer project.
// Drop sett-box.glb on "Inspector model" and each PNG from
// sett-website-assets.zip on its image slot (the slot says which file).

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { Page, Media, Icon, imageControls, T, Img, Slot } from "./SettUI.tsx"
import SettBox3D from "./SettBox3D.tsx"

const SLOTS: Slot[] = [
    { key: "imgPieken", file: "twee-pieken.png", title: "Twee pieken", alt: "Stroomverbruik door de dag met een piek overdag en een piek in de avond" },
    { key: "imgOverdag", file: "probleem-overdag.png", title: "Probleem 01 · Overdag", alt: "Zonnige dag: de omvormer schakelt uit omdat het net vol is" },
    { key: "imgAvond", file: "probleem-avond.png", title: "Probleem 02 · Avond", alt: "Avondpiek: iedereen thuis en auto's aan de laadpaal" },
    { key: "img2027", file: "probleem-2027.png", title: "Probleem 03 · 2027", alt: "Bedrijfsparkeerplaats met elektrische bedrijfswagens" },
    { key: "imgBatterijkast", file: "keuze-batterijkast.png", title: "Keuze · Batterijkast", alt: "Een batterijkast naast de laadpaal, boven de grond" },
    { key: "imgOndergronds", file: "keuze-ondergronds.png", title: "Keuze · Ondergronds", alt: "Sett onder de grond, de auto parkeert erboven" },
    { key: "img96", file: "cijfer-96kwh.png", title: "Cijfer · 96 kWh", alt: "96 kWh batterijopslag" },
    { key: "img22", file: "cijfer-22kw.png", title: "Cijfer · 22 kW", alt: "22 kW EV-laders" },
    { key: "img50", file: "cijfer-50kw.png", title: "Cijfer · 50 kW", alt: "50 kW output per Sett" },
    { key: "img0", file: "cijfer-0m2.png", title: "Cijfer · 0 m²", alt: "0 m² ruimte bovengronds" },
    { key: "imgParticulier", file: "doelgroep-particulier.png", title: "01 · Particulier", alt: "Woning met zonnepanelen en Sett onder de oprit" },
    { key: "imgOndernemer", file: "doelgroep-ondernemer.png", title: "02 · Ondernemer", alt: "Bedrijfspand met Sett en laadpalen" },
    { key: "imgOverheid", file: "doelgroep-overheid.png", title: "03 · Overheid", alt: "Straat met rijtjeshuizen en Setts onder de openbare parkeerplaatsen" },
    { key: "imgWerkgever", file: "doelgroep-werkgever.png", title: "04 · Werkgever", alt: "Kantoorparkeerplaats met een geëlektrificeerd wagenpark" },
    { key: "img2026", file: "tijdlijn-2026.png", title: "Tijdlijn · 2026", alt: "2026: geen aansluiting voor nieuwe laadpalen" },
    { key: "imgT2027", file: "tijdlijn-2027.png", title: "Tijdlijn · 2027", alt: "2027: werkgeversheffing" },
    { key: "img2030", file: "tijdlijn-2030.png", title: "Tijdlijn · 2030", alt: "2030: klimaatdoelen" },
    { key: "imgHub", file: "onzichtbare-energiehub.png", title: "CTA · Onzichtbare energiehub", alt: "De eerste onzichtbare energiehub van Nederland" },
]
const S = Object.fromEntries(SLOTS.map((s) => [s.key, s])) as Record<string, Slot>

// in the inspector's hotspot order, so the numbers match its markers
const SPECS: [string, string][] = [
    ["Accu capaciteit", "96 kWh LiFePO4"],
    ["Max load", "50 kW (meer bij meer boxen)"],
    ["Netaansluiting", "tot 3×50A (klein)"],
    ["Laadpunten", "2× 11 kW of 1× 22 kW"],
    ["Koeling", "Actief en passief (koelribben)"],
    ["Brandveiligheid", "Aerosol per compartiment"],
    ["Bewaking", "Load · temp · vocht · 4G"],
    ["Afmetingen", "4 × 1,5 × 0,7 m"],
    ["Materiaal", "S235-staal, verzinkt en gecoat"],
    ["Levensduur", "20+ jaar"],
]

// page-specific styles, on top of SettUI's
const CSS = `
.sd-probs{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:56px; }
.sd-prob{ border-radius:28px; padding:36px; display:flex; flex-direction:column; gap:14px; overflow:hidden; }
.sd-prob.wide{ grid-column:1 / -1; display:grid; grid-template-columns:1.05fr 1fr; gap:40px; align-items:center; }
.sd-prob .sd-label{ font:600 15px/1 "Geist Mono",ui-monospace,monospace; }
.sd-prob h3{ font-weight:800; font-size:clamp(26px,2.6cqi,36px); line-height:1.05; }
.sd-prob p{ font-size:18px; line-height:1.45; }
.sd-prob .sx-media img{ aspect-ratio:4/3; object-fit:contain; }
.sd-peaks{ max-width:980px; margin:72px auto 0; }
.sd-quote{ font-weight:700; font-size:clamp(18px,1.6cqi,22px); color:#C98A0C; text-align:center; margin-top:10px; }
.sd-vs{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:56px; }
.sd-vs > div{ border-radius:24px; padding:22px; background:rgba(255,255,255,.04); position:relative; }
.sd-vs > div.win{ background:rgba(141, 255, 102,.07); box-shadow:inset 0 0 0 1.5px rgba(141, 255, 102,.45); }
.sd-vs .sx-media img{ aspect-ratio:6/5; object-fit:contain; }
.sd-vs .no{ opacity:.55; filter:saturate(.6); }
.sd-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:24px; margin-top:64px; }
.sd-stat{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:6px; }
.sd-stat .sx-media{ max-width:240px; }
.sd-stat .sx-media img{ aspect-ratio:1/1; object-fit:contain; }
.sd-stat b{ font-weight:700; font-size:clamp(34px,3.4cqi,48px); line-height:1; margin-top:6px; }
.sd-stat span{ font-size:20px; color:#999; }
.sd-groups{ display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-top:64px; align-items:start; }
.sd-group{ background:#0B1224; border-radius:6px; padding:20px 20px 26px; display:flex; flex-direction:column; gap:16px; }
.sd-group .sx-media{ border-radius:12px; overflow:hidden; background:rgba(255,255,255,.03); }
.sd-group .sx-media img{ aspect-ratio:4/3; object-fit:contain; }
.sd-group .sd-tag{ font:600 15px/1 "Geist Mono",ui-monospace,monospace; padding-bottom:14px; border-bottom:4px dotted currentColor; }
.sd-group .sd-tag span{ color:#fff; }
.sd-group h3{ font-weight:900; font-size:20px; line-height:1.25; }
.sd-group ul{ display:flex; flex-direction:column; gap:6px; }
.sd-group li{ font-size:15px; line-height:1.4; color:#aaa; padding-left:16px; position:relative; }
.sd-group li::before{ content:"·"; position:absolute; left:2px; color:#777; }
.sd-group .sx-btn{ align-self:flex-start; min-height:42px; padding:0 18px; font-size:15px; }
.sd-time{ position:relative; display:grid; grid-template-columns:repeat(3,1fr); gap:36px; margin-top:64px; }
.sd-time::before{ content:""; position:absolute; left:0; right:0; top:calc(var(--sd-img-h, 190px) + 18px); border-top:5px dotted ${T.lime2}; opacity:.9; }
.sd-year{ display:flex; flex-direction:column; gap:10px; }
.sd-year .sx-media{ height:var(--sd-img-h, 190px); }
.sd-year .sx-media img{ height:100%; object-fit:contain; object-position:left bottom; }
.sd-year .sx-ph{ height:100%; }
.sd-year b{ font-weight:800; font-size:30px; margin-top:26px; }
.sd-year p{ font-size:16px; line-height:1.5; color:rgba(255,255,255,.8); max-width:340px; }
.sd-specs{ display:grid; grid-template-columns:1.5fr 1fr; gap:40px; align-items:center; margin-top:48px; }
.sd-inspector{ position:relative; height:clamp(420px, 46cqi, 640px); border-radius:28px; overflow:hidden;
  background:radial-gradient(90% 80% at 50% 45%, rgba(37, 131, 240,.14), rgba(6, 12, 26,0) 70%); }
.sd-inspector .sd-noModel{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px;
  font:500 14px/1.5 "Geist Mono",ui-monospace,monospace; color:rgba(255,255,255,.55); border:1.5px dashed rgba(255,255,255,.2); border-radius:28px; }
.sd-table{ display:flex; flex-direction:column; }
.sd-row{ display:flex; justify-content:space-between; gap:18px; padding:13px 0; border-bottom:1px solid rgba(255,255,255,.09); }
.sd-row strong{ color:${T.lilac}; font-weight:700; font-size:16px; display:flex; align-items:center; gap:10px; }
.sd-row i{ font:600 11px/20px "Geist Mono",ui-monospace,monospace; font-style:normal; width:20px; height:20px; border-radius:99px; text-align:center;
  color:#fff; background:rgba(141, 255, 102,.16); box-shadow:inset 0 0 0 1.5px rgba(141, 255, 102,.6); flex:none; }
.sd-row span{ color:${T.lilac}; font:400 14px/1.4 "Geist Mono",ui-monospace,monospace; text-align:right; }
.sd-cta{ border-radius:28px; background:radial-gradient(120% 90% at 50% 0%, rgba(141, 255, 102,.12), rgba(6, 12, 26,0) 60%), #0B1224; padding:72px 48px 0; overflow:hidden; }
.sd-cta .sx-media{ max-width:900px; margin:40px auto 0; }
.sd-quoteBlock{ max-width:680px; margin:0 auto; text-align:center; }
.sd-quoteBlock p{ font-size:clamp(19px,1.7cqi,23px); line-height:1.45; }
.sd-quoteBlock span{ display:block; margin-top:26px; color:#999; font-size:19px; }
@container (max-width: 1000px){
  .sd-groups{ grid-template-columns:1fr 1fr; }
  .sd-specs{ grid-template-columns:1fr; }
}
@container (max-width: 809px){
  .sd-probs, .sd-vs{ grid-template-columns:1fr; }
  .sd-prob.wide{ grid-template-columns:1fr; gap:20px; }
  .sd-prob{ padding:26px 22px; border-radius:22px; }
  .sd-stats{ grid-template-columns:1fr 1fr; row-gap:40px; }
  .sd-time{ grid-template-columns:1fr; gap:48px; }
  .sd-time::before{ display:none; }
  .sd-year b{ margin-top:10px; }
  .sd-cta{ padding:48px 22px 0; }
}
@container (max-width: 520px){
  .sd-groups{ grid-template-columns:1fr; }
}
`

const GROUPS = [
    { n: "01", who: "Particulier", color: T.lime2, title: "Je huis draait op je eigen zon.", items: ["Altijd stroom, ook in de spits", "Grip op je rekening", "Geen saldering"], href: "/particulieren", btn: "lime2", icon: Icon.user, img: "imgParticulier" },
    { n: "02", who: "Ondernemer", color: T.lilac, title: "Meer vermogen, minder net.", items: ["Extra capaciteit zonder verzwaring", "Geen wachtlijst", "Lagere kosten door Peak Shaving", "Doorwerken bij netuitval"], href: "/bedrijven", btn: "purple", icon: Icon.building, img: "imgOndernemer" },
    { n: "03", who: "Overheid", color: T.sun, title: "Klimaatdoelen halen.", items: ["Netcongestie direct oplossen", "Klimaat en laaddoelen halen", "Laadinfra waar het net het niet redt.", "Schaalbaar over gemeente / provincie"], img: "imgOverheid" },
    { n: "04", who: "Werkgever", color: "#2B8CFF", title: "Je wagenpark elektrificeren, altijd geladen.", items: ["Laden zonder beperking", "Klaar voor 2027-heffing", "één systeem op alle locaties"], img: "imgWerkgever" },
]

interface Props {
    boxModel?: string
    boxAutoRotate?: boolean
    boxStartOpened?: boolean
    [key: string]: any
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettPageDetails(props: Props) {
    const p = props
    const img = (k: string) => p[k] as Img
    return (
        <Page style={p.style}>
            <style>{CSS}</style>

            {/* ---------------------------------------------------------- intro, pieken, problemen (light) */}
            <section className="sx-sec sx-light" style={{ paddingTop: 170 }}>
                <div className="sx-wrap">
                    <div className="sx-center sx-stack center rv">
                        <h1 className="sx-h2" style={{ color: "#060C1A" }}>
                            Lees hier meer over de Sett
                        </h1>
                        <p className="sx-lead" style={{ maxWidth: 820 }}>
                            <strong>Sett is een complete energiehub onder je eigen parkeerplek, een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ‘m nodig hebt.</strong>
                        </p>
                        <p className="sx-body" style={{ maxWidth: 700 }}>
                            Zo krijg je een sterkere aansluiting en de volledige regie over je stroom, zonder te wachten op de netbeheerder. Voor particulier, ondernemer, overheid en werkgever.
                        </p>
                    </div>
                    <div className="sd-peaks rv d1">
                        <Media image={img("imgPieken")} slot={S.imgPieken} ratio="2 / 1" />
                        <p className="sd-quote">“Er zijn twee pieken op het net en beiden worden elke dag groter.”</p>
                    </div>
                    <div className="sd-probs">
                        <article className="sd-prob wide rv" style={{ background: "#FCF0D7", color: "#C98A0C" }}>
                            <div className="sx-stack" style={{ gap: 14 }}>
                                <span className="sd-label">Probleem 01 · Overdag</span>
                                <h3>Te veel zon. Omvormers schakelen uit.</h3>
                                <p>Een lokale energiehub die zonnestroom opslaat, pieken opvangt en ruimte boven de grond vrijhoudt.</p>
                            </div>
                            <Media image={img("imgOverdag")} slot={S.imgOverdag} ratio="4 / 3" dark />
                        </article>
                        <article className="sd-prob rv" style={{ background: "#EADEF8", color: "#9A6CE9" }}>
                            <Media image={img("imgAvond")} slot={S.imgAvond} ratio="4 / 3" dark />
                            <span className="sd-label">Probleem 02 · Avond</span>
                            <h3>Iedereen thuis. Auto's aan de paal.</h3>
                            <p>Tussen 17:00 en 20:00 komt de piek: koken, verwarmen, laden. Laadpalen worden teruggeregeld of uitgezet tijdens spitsuren – precies wanneer mensen juist willen laden.</p>
                        </article>
                        <article className="sd-prob rv d1" style={{ background: "#E2EDFD", color: "#2583F0" }}>
                            <Media image={img("img2027")} slot={S.img2027} ratio="4 / 3" dark />
                            <span className="sd-label">Probleem 03 · 2027</span>
                            <h3>Werkgevers krijgen een extra heffing.</h3>
                            <p>Per 2027 betalen werkgevers een extra heffing op niet-elektrische auto's van de zaak. De druk op laadinfrastructuur wordt exponentieel groter terwijl het net niet meegroeit.</p>
                        </article>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- batterijkast of ondergronds */}
            <section className="sx-sec" style={{ background: "#060C1A" }}>
                <div className="sx-wrap">
                    <div className="sx-stack rv">
                        <p className="sx-pre">Dus bouw je naast iedere laadpaal een batterijkast?</p>
                        <h2 className="sx-h2">Of ga je onder de grond?</h2>
                    </div>
                    <div className="sd-vs">
                        <div className="rv">
                            <Media className="no" image={img("imgBatterijkast")} slot={S.imgBatterijkast} ratio="6 / 5" />
                        </div>
                        <div className="win rv d1">
                            <Media image={img("imgOndergronds")} slot={S.imgOndergronds} ratio="6 / 5" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- de cijfers */}
            <section className="sx-sec" style={{ borderTop: "1px solid rgba(255,255,255,.1)", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                <div className="sx-wrap sx-center">
                    <div className="sx-stack center rv">
                        <h2 className="sx-h2">De cijfers</h2>
                        <p className="sx-lead">De zeldzame situatie waarin gemeente, bewoner én werkgever hetzelfde willen, en die oplossing hoeft alleen nog onzichtbaar te zijn.</p>
                    </div>
                    <div className="sd-stats">
                        {[
                            ["img96", "96 kWh", "Batterijopslag", "#8DFF66"],
                            ["img22", "22 kW", "EV-laders", T.lilac],
                            ["img50", "50 kW", "Output per Sett", T.sun],
                            ["img0", "0 m²", "Ruimte bovengronds", "#FFFFFF"],
                        ].map(([k, n, l, c], i) => (
                            <div className={"sd-stat rv d" + i} key={k}>
                                <Media image={img(k)} slot={S[k]} ratio="1 / 1" />
                                <b style={{ color: c }}>{n}</b>
                                <span>{l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- doelgroepen */}
            <section className="sx-sec">
                <div className="sx-wrap">
                    <div className="sx-center sx-stack center rv">
                        <h2 className="sx-h2" style={{ maxWidth: 780 }}>
                            Eén hub. Voor iedereen die meer wil dan het net geeft.
                        </h2>
                        <p className="sx-lead" style={{ maxWidth: 1040 }}>
                            Of je nu thuis laadt, een pand wilt verzwaren, een wijk wilt ontlasten of een wagenpark elektrificeert, SETT geeft je een sterkere aansluiting en de regie over je eigen stroom. Achter je eigen meter, zonder te wachten op de netbeheerder.
                        </p>
                    </div>
                    <div className="sd-groups">
                        {GROUPS.map((g, i) => (
                            <article className={"sd-group rv d" + i} key={g.n}>
                                <Media image={img(g.img)} slot={S[g.img]} ratio="4 / 3" />
                                <p className="sd-tag" style={{ color: g.color }}>
                                    <span>
                                        {g.n} · {g.who}
                                    </span>
                                </p>
                                <h3>{g.title}</h3>
                                <ul>
                                    {g.items.map((t) => (
                                        <li key={t}>{t}</li>
                                    ))}
                                </ul>
                                {g.href && (
                                    <a className={"sx-btn " + g.btn} href={g.href}>
                                        Meer informatie {g.icon}
                                    </a>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- de tijd dringt */}
            <section className="sx-sec" style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
                <div className="sx-wrap">
                    <h2 className="sx-h2 sx-center rv">De tijd dringt</h2>
                    <div className="sd-time">
                        {[
                            ["img2026", "2026", "Nu. Gemeenten zoeken actief naar lokale netbalancering. Netbeheerders kondigen aan dat plaatsing van nieuwe laadpalen vaak geen aansluitmogelijkheid meer heeft."],
                            ["imgT2027", "2027", "Werkgeversheffing. Per 2027 extra heffing op niet-elektrische zakenauto's. De druk op laadinfra stijgt zichtbaar."],
                            ["img2030", "2030", "Klimaatdoelen. Gemeenten moeten aantoonbaar lokale energietransitie-infrastructuur hebben. Zonder opslag wordt dit niet gehaald."],
                        ].map(([k, y, t], i) => (
                            <div className={"sd-year rv d" + i} key={y}>
                                <Media image={img(k)} slot={S[k]} ratio="auto" />
                                <b>{y}</b>
                                <p>{t}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- specs + inspector */}
            <section className="sx-sec" style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
                <div className="sx-wrap">
                    <div className="sx-center sx-stack center rv">
                        <p className="sx-pre">Sett is je energiehub</p>
                        <h2 className="sx-h2">Neem je energievoorziening in eigen hand.</h2>
                        <p className="sx-lead">Gecertificeerde LiFePO4-accu's. Stalen bak (thermisch verzinkt). Hieronder de cijfers waar alles op gebouwd is.</p>
                    </div>
                    <div className="sd-specs">
                        <div className="sd-inspector rv">
                            {p.boxModel ? (
                                <SettBox3D modelUrl={p.boxModel} autoRotate={p.boxAutoRotate !== false} startExploded={p.boxStartOpened === true} zoom={0.8} />
                            ) : (
                                <div className="sd-noModel">
                                    Sett inspector
                                    <br />
                                    Kies sett-box.glb bij “Inspector model”
                                </div>
                            )}
                        </div>
                        <div className="sd-table rv d1">
                            {SPECS.map(([k, v], i) => (
                                <div className="sd-row" key={k}>
                                    <strong>
                                        <i>{i + 1}</i>
                                        {k}
                                    </strong>
                                    <span>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- cta */}
            <section className="sx-sec tight">
                <div className="sx-wrap">
                    <div className="sd-cta sx-center rv">
                        <div className="sx-stack center">
                            <h2 className="sx-h2" style={{ maxWidth: 620 }}>
                                De eerste <span style={{ color: T.lime2 }}>onzichtbare</span> energiehub van Nederland.
                            </h2>
                            <p className="sx-lead" style={{ maxWidth: 640 }}>
                                Wij zijn op zoek naar particulieren, ondernemers en gemeenten die netontlastende laadinfrastructuur willen neerzetten zonder de openbare ruimte op te offeren.
                            </p>
                            <p style={{ fontSize: 19, marginTop: 6 }}>Laat hier je gegevens achter…</p>
                            <div className="sx-btns">
                                <a className="sx-btn lime2" href="/particulieren">
                                    Particulieren {Icon.user}
                                </a>
                                <a className="sx-btn purple" href="/bedrijven">
                                    Bedrijven {Icon.building}
                                </a>
                            </div>
                        </div>
                        <Media image={img("imgHub")} slot={S.imgHub} ratio="16 / 9" />
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- quote */}
            <section className="sx-sec tight" style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
                <div className="sx-wrap">
                    <blockquote className="sd-quoteBlock rv" style={{ margin: "0 auto" }}>
                        <p>“Elke wethouder Energie heeft nú een netcongestie-probleem. Maar bouwen naast een laadpaal is niet meer de oplossing: we moeten slimmer bouwen, niet méér.”</p>
                        <span>Het bredere energietransitie-gesprek, 2026</span>
                    </blockquote>
                </div>
            </section>
        </Page>
    )
}

SettPageDetails.displayName = "Sett · Pagina Details"

addPropertyControls(SettPageDetails, {
    boxModel: { type: ControlType.File, title: "Inspector model", allowedFileTypes: ["glb"], description: "sett-box.glb" },
    boxAutoRotate: { type: ControlType.Boolean, title: "Inspector rotate", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    boxStartOpened: { type: ControlType.Boolean, title: "Inspector opened", defaultValue: false, enabledTitle: "Opened", disabledTitle: "Closed" },
    ...imageControls(SLOTS),
})
