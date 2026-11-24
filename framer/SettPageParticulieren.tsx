// Sett — /particulieren, the whole page body (between the site's nav and footer).
// Needs the code files SettUI and SettHero3D in the same Framer project.
// Drop sett-hero-particulieren.glb on "Hero scene" and each PNG from
// sett-website-assets.zip on its image slot (the slot says which file).

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { Page, Media, Pill, Callout, Checks, OrderButtons, Voordelen, imageControls, T, Img, Slot } from "./SettUI.tsx"
import SettHero3D from "./SettHero3D.tsx"

const SLOTS: Slot[] = [
    { key: "imgSalderen", file: "salderen-stopt.png", title: "Salderen stopt", alt: "Zonnestroom die overdag wordt opgeslagen in plaats van goedkoop teruggeleverd" },
    { key: "imgOnafhankelijk", file: "onafhankelijk.png", title: "Onafhankelijk", alt: "Woning met zonnepanelen, Sett onder de oprit en een geladen auto" },
    { key: "imgGrip", file: "grip-op-rekening.png", title: "Grip op je rekening", alt: "Stabiele energiekosten, maand na maand" },
    { key: "imgInstallatie", file: "installatie.png", title: "Installatie", alt: "Sett wordt onder de oprit geplaatst" },
    { key: "imgArbitrage", file: "voordeel-arbitrage.png", title: "Voordeel 04 · Arbitrage", alt: "Stroomprijs door de dag: inkopen in het dal, gebruiken op de piek" },
    { key: "imgDelen", file: "voordeel-delen.png", title: "Voordeel 05 · Delen", alt: "Sett die energie deelt tussen gebouwen" },
]
const S = Object.fromEntries(SLOTS.map((s) => [s.key, s])) as Record<string, Slot>

interface Props {
    heroModel?: string
    heroMotion?: boolean
    grain?: number
    imgSalderen?: Img
    imgOnafhankelijk?: Img
    imgGrip?: Img
    imgInstallatie?: Img
    imgArbitrage?: Img
    imgDelen?: Img
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettPageParticulieren(props: Props) {
    const p = props
    return (
        <Page style={p.style}>
            {/* ---------------------------------------------------------- hero */}
            <section className="sx-hero">
                <div className="sx-hero-3d">
                    <SettHero3D modelUrl={p.heroModel} vibe="zonnig" subject="right" motion={p.heroMotion !== false} grain={p.grain ?? 0.15} fadeColor="#060C1A" scrim={0.6} bottomFade={0.7} />
                </div>
                <div className="sx-wrap sx-hero-copy">
                    <div className="sx-stack rv">
                        <h1 className="sx-h1">Jouw zonnepanelen werken hard. Het zou zonde zijn als het net dat voor je verpest.</h1>
                        <Pill tone="blue">Sett voor particulieren</Pill>
                        <p className="sx-lead">
                            Je hebt geïnvesteerd in zonnepanelen. Op een mooie zonnige dag schakelt je omvormer zichzelf uit, omdat het net de stroom niet aankan. En als je die avond laadt, kookt en verwarmt, betaal je gewoon de volle prijs aan het energiebedrijf. Sett verandert dat. De stroom die jij opwekt, bewaar jij. En jij beslist wanneer je hem gebruikt.
                        </p>
                        <OrderButtons />
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------- salderen */}
            <section className="sx-sec">
                <div className="sx-wrap sx-grid2">
                    <div className="sx-stack rv">
                        <Pill>De salderingsregeling verdwijnt. En dat kost je meer dan je denkt.</Pill>
                        <h2 className="sx-h2">Salderen stopt.</h2>
                        <p className="sx-lead">
                            <strong>Nu lever je stroom terug en krijg je daarvoor bijna evenveel als je betaalt bij aankoop. Salderen stopt per 2027. Wie dan geen eigen opslag heeft, levert stroom goedkoop terug en koopt diezelfde stroom die avond duur in. Dat is precies het omgekeerde van wat je wil.</strong>
                        </p>
                        <Callout>Zonder opslag lever je over drie jaar stroom bijna gratis terug en koop je die die avond voor de volle prijs. Dat verschil betaal je elke maand.</Callout>
                    </div>
                    <Media className="rv d1" image={p.imgSalderen} slot={S.imgSalderen} />
                </div>
            </section>

            {/* ---------------------------------------------------------- onafhankelijk */}
            <section className="sx-sec">
                <div className="sx-wrap sx-grid2 flip">
                    <div className="sx-stack rv">
                        <Pill>Onafhankelijkheid</Pill>
                        <h2 className="sx-h2">Eindelijk echt onafhankelijk van het energiebedrijf.</h2>
                        <p className="sx-body">
                            Mensen met zonnepanelen denken dat ze onafhankelijk zijn. Maar elke avond, als de zon ondergaat, ben je gewoon klant bij het energiebedrijf. Sett verandert dat. Overdag sla je de stroom op die je panelen produceren. Als je thuiskomt, gebruik je die. Jij bepaalt het tempo, niet de netbeheerder.
                        </p>
                        <p className="sx-body">En als het net uitvalt? Dan heb jij gewoon stroom. De rest van de straat misschien niet.</p>
                        <Callout>Sla de stroom van je panelen op in de batterij van Sett. Laad tot 2 EV's.</Callout>
                    </div>
                    <Media className="rv d1" image={p.imgOnafhankelijk} slot={S.imgOnafhankelijk} />
                </div>
            </section>

            {/* ---------------------------------------------------------- grip */}
            <section className="sx-sec">
                <div className="sx-wrap sx-grid2">
                    <div className="sx-stack rv">
                        <Pill>Grip op je energierekening</Pill>
                        <h2 className="sx-h2">Elke maand minder verrassing op je energierekening.</h2>
                        <p className="sx-body">
                            Energieprijzen schommelen. Wie afhankelijk is van het net, merkt elke schommeling direct. Sett ontkoppelt je van die grillen. Je verbruikt wat je zelf hebt opgeslagen en koopt alleen bij als het echt nodig is, bij voorkeur op het moment dat de prijs laag staat. Dat geeft rust. Elke maand opnieuw.
                        </p>
                        <Callout>Wie wacht tot de krapte groter is, heeft minder keuze in locaties en minder installatiecapaciteit beschikbaar.</Callout>
                    </div>
                    <Media className="rv d1" image={p.imgGrip} slot={S.imgGrip} />
                </div>
            </section>

            {/* ---------------------------------------------------------- aanpak */}
            <section className="sx-sec">
                <div className="sx-wrap sx-grid2 flip">
                    <div className="sx-stack rv">
                        <Pill>Hoe we het samen aanpakken</Pill>
                        <h2 className="sx-h2">Wij kijken eerst of het past. Dan bouwen we het.</h2>
                        <p className="sx-body">
                            We starten met een kort gesprek over jouw woning, je panelen en je verbruik. Dan rekenen we door wat Sett voor jou oplevert. Past het? Dan plannen we de installatie, gewoon onder je oprit. Geen grote verbouwing, geen weken gedoe. Daarna zie je via een dashboard precies wat je opwekt, opslaat en verbruikt.
                        </p>
                        <div className="sx-btns">
                            <a className="sx-btn lime" href="/pre-order">
                                Bestel jouw Sett
                            </a>
                        </div>
                    </div>
                    <Media className="rv d1" image={p.imgInstallatie} slot={S.imgInstallatie} ratio="4 / 3" />
                </div>
            </section>

            {/* ---------------------------------------------------------- businesscase */}
            <section className="sx-sec tight">
                <div className="sx-wrap">
                    <div className="sx-card sx-grid2 rv" style={{ alignItems: "start" }}>
                        <div className="sx-stack">
                            <Pill tone="lime">De businesscase voor particulieren</Pill>
                            <h2 className="sx-h2">De businesscase voor particulieren</h2>
                            <p className="sx-body">We rekenen de businesscase graag door voor jouw situatie. Hoeveel panelen heb je? Wat is je verbruik? Hoe zit je contract in elkaar? Op basis daarvan krijg je een eerlijk beeld.</p>
                        </div>
                        <div className="sx-stack">
                            <Checks
                                items={[
                                    "Geen subsidie nodig voor de businesscase",
                                    "Volledig gebruik van de stroom die je zelf opwekt",
                                    "Bescherming tegen verdere afbouw van de salderingsregeling",
                                    "Altijd stroom, ook bij netuitval",
                                    "Stabiele en lagere energierekening, maand na maand",
                                ]}
                            />
                            <a className="sx-btn lime2" href="/contact">
                                Bereken wat Sett voor mijn situatie oplevert
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
                accent={T.lime2}
                items={[
                    {
                        label: "Voordeel 01",
                        title: "De salderingsregeling verdwijnt. Jouw voordeel niet.",
                        body: "De salderingsregeling wordt elk jaar verder afgebouwd en is in 2031 volledig weg. Wie geen opslag heeft, merkt dat direct in zijn rekening. Jij levert stroom goedkoop terug en koopt diezelfde stroom die avond duur in. Sett keert dat om. De stroom die jij overdag opwekt, bewaart Sett voor het moment dat jij hem nodig hebt. Zo profiteer je volledig van je panelen, ook als de saldering weg is.",
                        risk: "Zonder opslag verdampt het voordeel van je zonnepanelen elk jaar een beetje meer. In 2031 is dat voordeel voor een groot deel weg als je niet zelf opslaat.",
                        image: p.imgSalderen,
                        slot: S.imgSalderen,
                    },
                    {
                        label: "Voordeel 02",
                        title: "Echte onafhankelijkheid. Niet alleen op papier.",
                        body: "Zonnepanelen geven je overdag stroom. Maar die avond, als je laadt, kookt en de verwarming aanstaat, ben je gewoon klant bij het energiebedrijf. Sett vult die leegte op. Je slaat overdag op wat je panelen produceren en verbruikt dat die avond thuis. Bij netuitval schakelt Sett automatisch over op de accu. Jij hebt gewoon licht en jij kunt gewoon laden.",
                        risk: "Een woning met alleen zonnepanelen is afhankelijk van het net zodra de zon ondergaat. Dat is 12 tot 16 uur per dag afhankelijkheid, ook al heb je panelen op je dak.",
                        image: p.imgOnafhankelijk,
                        slot: S.imgOnafhankelijk,
                    },
                    {
                        label: "Voordeel 03",
                        title: "Grip op je rekening. Elke maand.",
                        body: "Energieprijzen schommelen. Wie geen opslag heeft, volgt elke schommeling mee. Met Sett koop je stroom in op het moment dat de prijs laag staat, sla je hem op en verbruik je hem als de prijs hoog is. Dat heet energie-arbitrage. Het resultaat is een rekening die stabieler is en structureel lager uitvalt dan zonder opslag.",
                        risk: "Wie volledig afhankelijk is van het net, betaalt altijd de marktprijs op het moment van verbruik. In de avondspits is dat bijna nooit de laagste prijs van de dag.",
                        image: p.imgGrip,
                        slot: S.imgGrip,
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

SettPageParticulieren.displayName = "Sett · Pagina Particulieren"

addPropertyControls(SettPageParticulieren, {
    heroModel: { type: ControlType.File, title: "Hero scene", allowedFileTypes: ["glb"], description: "sett-hero-particulieren.glb" },
    heroMotion: { type: ControlType.Boolean, title: "Hero motion", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    grain: { type: ControlType.Number, title: "Hero grain", min: 0, max: 1, step: 0.01, defaultValue: 0.15 },
    ...imageControls(SLOTS),
})
