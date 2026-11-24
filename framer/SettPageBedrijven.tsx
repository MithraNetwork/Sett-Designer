// Sett — /bedrijven, the whole page body (between the site's nav and footer).
// Needs the code files SettUI and SettHero3D in the same Framer project.
// Drop sett-hero-bedrijven.glb on "Hero scene" and each PNG from
// sett-website-assets.zip on its image slot (the slot says which file).

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { Page, Media, Pill, Callout, Checks, OrderButtons, Voordelen, imageControls, Icon, T, Img, Slot } from "./SettUI.tsx"
import SettHero3D from "./SettHero3D.tsx"

const SLOTS: Slot[] = [
    { key: "imgWachtlijst", file: "wachtlijst.png", title: "Het probleem · Wachtlijst", alt: "Zandloper: wachtlijsten voor netaansluiting tot drie jaar" },
    { key: "imgBuffer", file: "bedrijven-hero.png", title: "Wat Sett doet · Terrein", alt: "Bedrijventerrein met twee Sett-units onder de parkeerplaatsen" },
    { key: "imgVermogen", file: "voordeel-vermogen.png", title: "Voordeel 01 · Vermogen", alt: "Extra vermogen boven de netlimiet vanuit de accu" },
    { key: "imgNetuitval", file: "voordeel-netuitval.png", title: "Voordeel 02 · Netuitval", alt: "Bij netuitval blijft het bedrijf met Sett als enige verlicht" },
    { key: "imgPeak", file: "voordeel-peakshaving.png", title: "Voordeel 03 · Peak Shaving", alt: "Verbruikspiek boven de limiet, opgevangen door Sett" },
    { key: "imgArbitrage", file: "voordeel-arbitrage.png", title: "Voordeel 04 · Arbitrage", alt: "Stroomprijs door de dag: inkopen in het dal, gebruiken op de piek" },
    { key: "imgDelen", file: "voordeel-delen.png", title: "Voordeel 05 · Delen", alt: "Sett die energie deelt tussen bedrijven op het terrein" },
]
const S = Object.fromEntries(SLOTS.map((s) => [s.key, s])) as Record<string, Slot>

interface Props {
    heroModel?: string
    heroMotion?: boolean
    grain?: number
    imgWachtlijst?: Img
    imgBuffer?: Img
    imgVermogen?: Img
    imgNetuitval?: Img
    imgPeak?: Img
    imgArbitrage?: Img
    imgDelen?: Img
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettPageBedrijven(props: Props) {
    const p = props
    return (
        <Page style={p.style}>
            {/* ---------------------------------------------------------- hero */}
            <section className="sx-hero">
                <div className="sx-hero-3d">
                    <SettHero3D modelUrl={p.heroModel} vibe="blauwUur" subject="right" motion={p.heroMotion !== false} grain={p.grain ?? 0.15} fadeColor="#060C1A" scrim={0.6} bottomFade={0.7} />
                </div>
                <div className="sx-wrap sx-hero-copy">
                    <div className="sx-stack rv">
                        <h1 className="sx-h1">Jij wilt gewoon je bedrijf draaien. Niet wachten op het net.</h1>
                        <Pill tone="lime">Voor ondernemers op het industrieterrein</Pill>
                        <p className="sx-lead">Netbeheerders zijn druk. Wachtlijsten lopen op tot drie jaar. Ondertussen betaal je piektarieven op het drukste moment van de dag en staat je uitbreiding op pauze.</p>
                        <p className="sx-lead">Dit is geen tijdelijk probleem. De netcapaciteit in Nederland is voor de komende tien jaar al ingepland. Wie nu wacht, wacht lang.</p>
                        <OrderButtons />
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- het probleem */}
            <section className="sx-sec">
                <div className="sx-wrap sx-grid2">
                    <div className="sx-stack rv">
                        <Pill>Het probleem</Pill>
                        <h2 className="sx-h2">Het net groeit niet mee met jouw bedrijf.</h2>
                        <p className="sx-body">
                            Op het industrieterrein zie je het elke dag. Ondernemers die willen groeien maar vastlopen omdat er geen aansluitcapaciteit meer is. Machines die niet op volle capaciteit draaien. Verduurzamingsplannen die jaren stilliggen op een wachtlijst. Sett geeft je jouw eigen energiebuffer. Zodat jij bepaalt wanneer je verbruikt, wat je opslaat en wat je verkoopt.
                        </p>
                        <Callout>Bedrijven die nu niets doen, betalen over vijf jaar nog steeds piektarieven en de heffingen die er inmiddels bij zijn gekomen.</Callout>
                    </div>
                    <Media className="rv d1" image={p.imgWachtlijst} slot={S.imgWachtlijst} ratio="6 / 7" style={{ maxWidth: 460, justifySelf: "center" }} />
                </div>
            </section>

            {/* ---------------------------------------------------------- wat sett doet */}
            <section className="sx-sec">
                <div className="sx-wrap">
                    <div className="sx-grid2" style={{ alignItems: "start" }}>
                        <div className="sx-stack rv">
                            <Pill>Wat Sett doet</Pill>
                            <h2 className="sx-h2">Een eigen energiebuffer, onder je parkeerplaats, volledig van jou.</h2>
                        </div>
                        <div className="sx-stack rv d1">
                            <p className="sx-body">Sett is een complete energiehub die onder een standaard parkeerplaats past. Overdag sla je goedkope of zelfopgewekte stroom op. Op het drukste moment lever je die terug aan je machines, laadpalen of buren op het terrein.</p>
                            <p className="sx-body">Geen grote verbouwing. Geen jarenlang wachten. We installeren Sett in goed overleg, op het tempo dat jij aangeeft.</p>
                            <Checks
                                items={["Meer vermogen zonder zware netverzwaring", "Altijd stroom, ook bij netuitval", "Lagere kosten door Peak Shaving", "Energie verhandelen en delen op het terrein", "Doordraaien terwijl de rest stilstaat"]}
                            />
                        </div>
                    </div>
                    <Media className="rv d2" image={p.imgBuffer} slot={S.imgBuffer} style={{ marginTop: 56 }} />
                </div>
            </section>

            {/* ---------------------------------------------------------- samenwerken */}
            <section className="sx-sec tight">
                <div className="sx-wrap sx-center">
                    <div className="sx-stack center rv">
                        <Pill>Hoe we samenwerken</Pill>
                        <h2 className="sx-h2">We beginnen met een gesprek. Daarna gaan we bouwen.</h2>
                        <p className="sx-lead">
                            Sett is geen product dat je koopt en daarna zelf uitzoekt. We starten met een gesprek over jouw situatie, jouw aansluiting en wat je wil bereiken. Dan rekenen we de businesscase door, kiezen we samen de locatie en plannen we de installatie zodat je bedrijf niet een dag stilstaat. Na de installatie monitoren we het systeem continu. Jij ziet via een dashboard wat het oplevert.
                        </p>
                        <Callout>Wie wacht tot de krapte groter is, heeft minder keuze in locaties en minder installatiecapaciteit beschikbaar.</Callout>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- eerste stap + businesscase */}
            <section className="sx-sec tight">
                <div className="sx-wrap sx-grid2" style={{ alignItems: "stretch", gap: 20 }}>
                    <div className="sx-card sx-stack rv" style={{ background: "linear-gradient(160deg, rgba(154, 108, 233,.28), rgba(37, 131, 240,.14) 60%, #0B1224)" }}>
                        <Pill>Klaar voor de eerste stap?</Pill>
                        <h2 className="sx-h3" style={{ fontSize: "clamp(26px, 2.6cqi, 38px)" }}>
                            Een gesprek kost je een uur. Een netcongestionprobleem kost je jaren.
                        </h2>
                        <p className="sx-body">We plannen graag een kennismakingsgesprek in. Geen verplichtingen, wel een helder beeld van wat Sett voor jouw bedrijf kan betekenen.</p>
                        <div className="sx-btns" style={{ marginTop: "auto" }}>
                            <a className="sx-btn green" href={T.phone}>
                                Bel direct {Icon.phone}
                            </a>
                            <a className="sx-btn ghost" href="/contact">
                                Contact
                            </a>
                        </div>
                    </div>
                    <div className="sx-card sx-stack rv d1">
                        <Pill tone="lime">Wat Sett doet</Pill>
                        <h2 className="sx-h3" style={{ fontSize: "clamp(26px, 2.6cqi, 38px)" }}>
                            De businesscase
                        </h2>
                        <Checks items={["Geen subsidie nodig voor de businesscase", "Meerdere inkomstenstromen: Peak Shaving, arbitrage en levering aan buren", "Schaalbaar: begin met een unit en breid uit naar het hele terrein"]} color={T.lime2} />
                        <div className="sx-btns" style={{ marginTop: "auto" }}>
                            <a className="sx-btn lime" href="/pre-order">
                                Bestel jouw Sett
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- voordelen */}
            <Voordelen
                eyebrow="Wat Sett voor jou doet"
                title="Vijf voordelen die je energiepositie fundamenteel veranderen."
                lead="Elk voordeel staat op zichzelf. Samen maken ze jouw bedrijf onafhankelijker, goedkoper in gebruik en klaar voor de komende tien jaar op het industrieterrein."
                accent={T.lilac}
                items={[
                    {
                        label: "Voordeel 01",
                        title: "Meer vermogen. Zonder drie jaar te wachten.",
                        body: "Een netaansluiting verzwaren duurt gemiddeld drie jaar. Sett geeft je die extra capaciteit nu. De accu werkt als buffer naast je huidige aansluiting. Machines en laadpalen krijgen meer vermogen zonder dat je aansluiting officieel wordt uitgebreid. Je betaalt voor je eigen buffer, niet voor een zwaarder net.",
                        risk: "Bedrijven op de wachtlijst voor een zwaardere aansluiting staan gemiddeld drie jaar stil op uitbreiding. Dat is veel verloren omzet en concurrentievoordeel.",
                        image: p.imgVermogen,
                        slot: S.imgVermogen,
                    },
                    {
                        label: "Voordeel 02",
                        title: "Altijd stroom. Ook als het net uitvalt.",
                        body: "Bij netuitval schakelt Sett automatisch over op de eigen accu. Jij draait gewoon door. Geen productieverlies, geen machines die koud worden, geen klanten die wachten. De accu heeft genoeg capaciteit om je bedrijf uren draaiende te houden terwijl de rest van het terrein stilstaat.",
                        risk: "Een dag productieverlies door netuitval kost een gemiddeld industriebedrijf meer dan een volledige maandtermijn aan energiekosten. En netuitval komt vaker voor naarmate het net voller raakt.",
                        image: p.imgNetuitval,
                        slot: S.imgNetuitval,
                    },
                    {
                        label: "Voordeel 03",
                        title: "Lagere energiekosten door Peak Shaving.",
                        body: "Energiecontracten voor bedrijven werken met een capaciteitstarief. Hoe hoger je piekverbruik, hoe meer je betaalt. Sett detecteert wanneer jouw verbruik richting de piek loopt en springt bij vanuit de accu. Zo blijf je onder je pieklimiet en bespaar je structureel op je vaste energiekosten, maand na maand.",
                        risk: "Zonder Peak Shaving betaal je elke maand voor de duurste minuut van je verbruik. Dat tarief bepaalt je rekening, niet je gemiddeld verbruik.",
                        image: p.imgPeak,
                        slot: S.imgPeak,
                    },
                    {
                        label: "Voordeel 04",
                        title: "Energie verhandelen. Koop als het goedkoop is, gebruik als het duur is.",
                        body: "Energieprijzen schommelen door de dag. Sett koopt stroom op als de prijs laag is, slaat die op in de accu en gebruikt of verkoopt die als de prijs hoog is. Dat heet energie-arbitrage. Voor jou betekent het dat je accu niet alleen een buffer is, maar ook een asset die rendement maakt. We kijken samen welke strategie het beste past bij jouw verbruikspatroon.",
                        risk: "Bedrijven zonder opslag betalen altijd de marktprijs op het moment van verbruik. In periodes van hoge prijzen loopt dat snel op.",
                        image: p.imgArbitrage,
                        slot: S.imgArbitrage,
                    },
                    {
                        label: "Voordeel 05",
                        title: "Energie delen op het industrieterrein.",
                        body: "Sett maakt het mogelijk om energie te delen met andere bedrijven op hetzelfde terrein. Heeft een buurman op een bepaald moment meer nodig dan jij? Dan lever jij die energie en verdien je eraan. Zijn jullie samen eigenaar van meerdere Sett units? Dan balanceren die automatisch. Dit is de toekomst van het industrieterrein: een lokaal energienet waar bedrijven samen sterker zijn dan afzonderlijk.",
                        risk: "Een industrieterrein zonder gedeelde opslag is een verzameling bedrijven die allemaal apart onderhandelen met dezelfde volle netbeheerder. Samen sta je sterker en betaal je minder.",
                        image: p.imgDelen,
                        slot: S.imgDelen,
                    },
                ]}
            />
        </Page>
    )
}

SettPageBedrijven.displayName = "Sett · Pagina Bedrijven"

addPropertyControls(SettPageBedrijven, {
    heroModel: { type: ControlType.File, title: "Hero scene", allowedFileTypes: ["glb"], description: "sett-hero-bedrijven.glb" },
    heroMotion: { type: ControlType.Boolean, title: "Hero motion", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    grain: { type: ControlType.Number, title: "Hero grain", min: 0, max: 1, step: 0.01, defaultValue: 0.15 },
    ...imageControls(SLOTS),
})
