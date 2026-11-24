// The V2 pages as data: which section components, in which order, with which
// copy and assets. Read by the studio preview (v2.html) and by the Framer plugin
// (copied in by its sync script), so the two always match.
//   "@file:<name>"   a GLB in framer/ (uploaded as a project file by the plugin)
//   "@image:<name>"  a PNG in framer/assets/ (uploaded as a project image)
const A = (f) => "@image:" + f
const G = (f) => "@file:" + f
const S = (name) => ({ model: G("sett-scroll-" + name), poster: A("card-" + name) }) // a live card scene
const L = (name) => ({ model: G("sett-scroll-" + name), poster: A(name) }) // a live full scene
//   "@photo:<name>"  a JPG in framer/assets/photo/ (a real photo or a video poster, uploaded as an image)
//   "@video:<name>"  an MP4 in framer/assets/photo/ (uploaded as a project file)
const F = (name) => "@photo:" + name
const M = (name) => "@video:" + name
const FILM = (name) => ({ video: M(name), poster: F(name + "-poster") })
//   "@url:<alt>|<url>"  an image already on Framer's image server (the team photos from sett.nl), used as it is
const U = (alt, url) => "@url:" + alt + "|" + url

// the real photos and footage (Pexels licence: free to use, no attribution
// required), with their alt texts
export { BLOG_CTA, minutesOf, toCard }

export const PHOTOS = {
  "foto-rijtjes-zon": "Rijtjeshuizen met zonnepanelen op het dak onder een blauwe lucht",
  "foto-daken-zon": "Pannendaken met zonnepanelen in een woonwijk",
  "foto-laden-straat": "Een elektrische auto laadt aan een laadpaal langs een straat in Amsterdam",
  "foto-laden-thuis": "Een blauwe elektrische auto laadt thuis aan een wandlader",
  "foto-stekker": "Close-up van een laadstekker in een elektrische auto",
  "foto-straat-fietsen": "Een Amsterdamse straat met bakstenen huizen en geparkeerde fietsen",
  "foto-masten-zonsondergang": "Hoogspanningsmasten tegen een rode zonsondergang",
  "foto-mast-schemer": "Een hoogspanningsmast in de schemering",
  "foto-bedrijfshal": "Een moderne bedrijfshal onder een blauwe lucht",
  "foto-installateur": "Een installateur legt zonnepanelen op een dak",
  "foto-avond-ramen": "Een bakstenen woongebouw 's avonds met verlichte ramen",
  "foto-carport-zon": "Auto's geparkeerd onder een carport met zonnepanelen",
  "video-huis-zon-poster": "Een huis met zonnepanelen van bovenaf gezien",
  "video-mast-wolken-poster": "Wolken trekken over een hoogspanningsmast",
  "video-lijnen-zonsondergang-poster": "Hoogspanningslijnen tegen een gouden avondlucht",
  "video-stekker-poster": "Iemand steekt een laadstekker in een elektrische auto",
  "video-straat-avond-poster": "Een Amsterdamse straat in de avond met fietsers",
  "foto-huis-zon": "Een bakstenen huis met zonnepanelen op het dak op een zonnige dag",
  "foto-avond-huis": "Een bakstenen rijtjeshuis in de schemering, met licht aan achter de ramen",
  "foto-bedrijventerrein": "Luchtfoto van een bedrijventerrein met zonnepanelen op de daken van de hallen",
  "video-rijtjes-zon-poster": "Rijtjeshuizen met zonnepanelen en tuinen, van bovenaf gezien",
  "video-huis-zon-dak-poster": "Een vrijstaand huis met een dak vol zonnepanelen, van bovenaf gezien",
  "video-woonstraat-poster": "Een zonnige straat in Harlingen met bomen en geparkeerde auto's langs de stoep",
  "foto-woonstraat": "Een woonstraat in Amsterdam met geparkeerde auto's, een brede stoep en groen",
}

const VD_ARBITRAGE = { label: "Voordeel 04", title: "Energie verhandelen. Koop als het goedkoop is, gebruik als het duur is.", body: "Energieprijzen schommelen door de dag. Sett koopt stroom op als de prijs laag is, slaat die op in de accu en gebruikt of verkoopt die als de prijs hoog is. Dat heet energie-arbitrage. Voor jou betekent het dat je accu niet alleen een buffer is, maar ook een asset die rendement maakt.", risk: "Wie geen opslag heeft, betaalt altijd de marktprijs op het moment van verbruik. In periodes van hoge prijzen loopt dat snel op.", ...S("voordeel-arbitrage") }
const VD_DELEN = { label: "Voordeel 05", title: "Energie delen op het industrieterrein.", body: "Sett maakt het mogelijk om energie te delen met andere bedrijven op hetzelfde terrein. Heeft een buurman op een bepaald moment meer nodig dan jij? Dan lever jij die energie en verdien je eraan. Zijn jullie samen eigenaar van meerdere Sett units? Dan balanceren die automatisch.", risk: "Een industrieterrein zonder gedeelde opslag is een verzameling bedrijven die allemaal apart onderhandelen met dezelfde volle netbeheerder. Samen sta je sterker en betaal je minder.", ...S("voordeel-delen") }

// the details page's card lists, written out in full: Framer fills every field a
// list item leaves out with its own placeholder (#09F blue, "" or 0), so nothing
// here may rely on a component's built-in defaults
const PROBLEMEN = [
  { label: "Probleem 01 · Overdag", title: "Te veel zon. Omvormers schakelen uit.", body: "Op een zonnige dag kan het net de stroom niet aan. Een lokale energiehub slaat die zonnestroom op, vangt pieken op en houdt de ruimte boven de grond vrij.", color: "#1E1A17", ink: "#FFB92B", ...S("probleem-overdag") },
  { label: "Probleem 02 · Avond", title: "Iedereen thuis. Auto's aan de paal.", body: "Tussen 17:00 en 20:00 komt de piek: koken, verwarmen, laden. Laadpalen worden teruggeregeld of uitgezet tijdens spitsuren – precies wanneer mensen juist willen laden.", color: "#1F0748", ink: "#BF9CFF", ...S("probleem-avond") },
  { label: "Probleem 03 · 2027", title: "Werkgevers krijgen een extra heffing.", body: "Per 2027 betalen werkgevers een extra heffing op niet-elektrische auto's van de zaak. De druk op laadinfrastructuur wordt exponentieel groter terwijl het net niet meegroeit.", color: "#061224", ink: "#2B8CFF", ...S("probleem-2027") },
]
const CIJFERS = [
  { value: 96, unit: "kWh", label: "Batterijopslag", line: "Genoeg voor ongeveer twee weken stroom van een gemiddeld huishouden.*", color: "#8DFF66", ...L("cijfer-96kwh") },
  { value: 22, unit: "kW", label: "EV-laders", line: "Een lege gezinsauto in zo'n drie uur weer vol.*", color: "#C0A8F0", ...L("cijfer-22kw") },
  { value: 50, unit: "kW", label: "Output per Sett", line: "Meer bij meer boxen. Vermogen voor machines, laadpalen en buren.", color: "#FFB92B", ...L("cijfer-50kw") },
  { value: 0, unit: "m²", label: "Ruimte bovengronds", line: "Alleen een laadpaal en een deksel in de bestrating.", color: "#DFE4F4", ...L("cijfer-0m2") },
]
const DOELGROEPEN = [
  { tag: "Particulier", title: "Je huis draait op je eigen zon.", points: "Altijd stroom, ook in de spits\nGrip op je rekening\nGeen saldering", link: "/particulieren", linkLabel: "Meer informatie", color: "#8DFF66", ...S("doelgroep-particulier") },
  { tag: "Ondernemer", title: "Meer vermogen, minder net.", points: "Extra capaciteit zonder verzwaring\nGeen wachtlijst\nLagere kosten door Peak Shaving\nDoorwerken bij netuitval", link: "/bedrijven", linkLabel: "Meer informatie", color: "#C0A8F0", ...S("doelgroep-ondernemer") },
  { tag: "Overheid", title: "Klimaatdoelen halen.", points: "Netcongestie direct oplossen\nKlimaat en laaddoelen halen\nLaadinfra waar het net het niet redt.\nSchaalbaar over gemeente / provincie", link: "/gemeenten", linkLabel: "Meer informatie", color: "#FFB92B", ...S("doelgroep-overheid") },
  { tag: "Werkgever", title: "Je wagenpark elektrificeren, altijd geladen.", points: "Laden zonder beperking\nKlaar voor 2027-heffing\nÉén systeem op alle locaties", color: "#2B8CFF", ...S("doelgroep-werkgever") },
]
const JAREN = [
  { year: "2026", title: "Nu.", body: "Gemeenten zoeken actief naar lokale netbalancering. Netbeheerders kondigen aan dat plaatsing van nieuwe laadpalen vaak geen aansluitmogelijkheid meer heeft.", image: A("tijdlijn-2026") },
  { year: "2027", title: "Werkgeversheffing.", body: "Per 2027 extra heffing op niet-elektrische zakenauto's. De druk op laadinfra stijgt zichtbaar.", image: A("tijdlijn-2027") },
  { year: "2030", title: "Klimaatdoelen.", body: "Gemeenten moeten aantoonbaar lokale energietransitie-infrastructuur hebben. Zonder opslag wordt dit niet gehaald.", image: A("tijdlijn-2030") },
]

// the Q&A, as on sett.nl/qa (30-06-2026), with the typos corrected. A question without an answer isn't shown
const VRAGEN = [
  {"q": "Wat kost Sett?", "a": "Ondanks dat we niets liever willen dan deze vraag nu beantwoorden, kunnen we nog niet de exacte verkoopprijs communiceren. We verwachten de prijs eind augustus 2026 bekend te kunnen maken! De verkoopprijs is sterk afhankelijk van het aantal orders dat we kunnen toezeggen bij onze partner. Natuurlijk spelen er meer factoren mee, zoals transportkosten (rekening houdend met de situatie rondom de Straat van Hormuz), grondstofprijzen en de (daar is 'ie weer) huidige geopolitieke status. Het overweldigende aantal reacties en nog meer het aantal aanvragen, maakt dat we opnieuw met onze partner om de tafel gaan! We mikken op een consumentvriendelijke en marktconforme verkoopprijs!", "cat": "Prijs & levering"},
  {"q": "Is Sett inclusief de stalen bak?", "a": "Yes, Sett is een alles-in-1-oplossing. Inclusief de stalen bak, software, blusinstallatie, omvormer en AC.", "cat": "Prijs & levering"},
  {"q": "Hoe veilig is Sett?", "a": "Sett is uitgerust met een eigen blusinstallatie. Via een noodluik kan de brandweer, in geval van brand, Sett binnen enkele minuten blussen.", "cat": "Veiligheid"},
  {"q": "Wat is de terugverdientijd van Sett?", "a": "Dat ligt natuurlijk aan een hoop verschillende factoren! Een terechte vraag maar op dit moment lastig te beantwoorden. Je moet Sett meer zien als een eigen energiehub. Altijd stroom, altijd laden en bij overschot verhandelen.", "cat": "Prijs & levering"},
  {"q": "Hoe gaat Sett om met wateroverlast? Bijv. bij veel regenval.", "a": "De deksel die op de stalen bak ligt sluit Sett helemaal netjes af, waardoor Sett helemaal waterdicht is.", "cat": "Water & grond"},
  {"q": "Hoe gaat Sett om met grondwater?", "a": "De deksel die op de stalen bak ligt sluit Sett helemaal netjes af, waardoor Sett helemaal waterdicht is.", "cat": "Water & grond"},
  {"q": "Is Sett 100% waterdicht?", "a": "De deksel die op de stalen bak ligt sluit Sett helemaal netjes af, waardoor Sett helemaal waterdicht is.", "cat": "Water & grond"},
  {"q": "Waarom Sett als je EV's kunt inzetten als energiehub?", "a": "Op het moment dat jouw zonnepanelen energie opwekken, is je auto vaak niet thuis. Sett ligt klaar om al die mooie energie op te slaan.", "cat": "Techniek & energie"},
  {"q": "Is Sett PGS 37.2 gecertificeerd?", "a": "Sett houdt rekening met PGS. Elk compartiment is uitgevoerd met een aerosol-blusinstallatie. Sett heeft een toegangsluik speciaal voor de brandweer. We voeren op dit moment gesprekken met veiligheidsregio's en de brandweer.", "cat": "Veiligheid"},
  {"q": "Kan Sett alleen onder je oprit geïnstalleerd worden?", "a": "Nee, je kunt Sett op iedere plek plaatsen, zolang dat onder de grond mogelijk is en je auto in de buurt van de laadpaal kan komen.", "cat": "Installatie"},
  {"q": "Ik heb geen eigen oprit, kan ik Sett aanschaffen?", "a": "Dat heeft helaas geen zin. We zoeken het contact met verschillende gemeenten om Sett te plaatsen onder publieke parkeerplaatsen.", "cat": "Installatie"},
  {"q": "Hoe gaat Sett om met opdrijven bij hoge grondwaterstand?", "a": "Daar heeft Sett geen last van gezien het gewicht van de totale installatie.", "cat": "Water & grond"},
  {"q": "Waar komt de naam Sett vandaan?", "a": "Eigenlijk een lang verhaal... maar toch leuk om hier even te delen! Sett betekent vertaald van het Engels naar het Nederlands: dassenburcht. Een das leeft onder de grond en bewaart daar zijn energie. Een hol is een kamer. Dat verwijst naar de compartimenten in Sett. :)", "cat": "Over Sett"},
  {"q": "Is er een kleinere variant van Sett?", "a": "We onderzoeken of we een kleinere variant van Sett kunnen maken. Voor nu ligt de focus volledig op de Sett variant met 96 kWh.", "cat": "Prijs & levering"},
  {"q": "Hoe gaat Sett geïnstalleerd worden?", "a": "Op dit moment voeren we gesprekken met verschillende infra-partners. Ons doel is om de installatie all-in aan te bieden, verzorgd door gecertificeerde partners. Partner worden? Neem contact met ons op!", "cat": "Installatie"},
  {"q": "Moet ik de installatie van Sett zelf uitvoeren of regelen?", "a": "Op dit moment voeren we gesprekken met verschillende infra-partners. Ons doel is om de installatie all-in aan te bieden, verzorgd door gecertificeerde partners. Partner worden? Neem contact met ons op!", "cat": "Installatie"},
  {"q": "Hoe gaat Sett om met thermal runaway?", "a": "Alle thermal-runaway-tests zijn inmiddels uitgevoerd en Sett is met vlag en wimpel geslaagd. En dus gecertificeerd! Fosfaat in de batterij is heel veilig! Verder zijn er nog tal van andere veiligheidsvoorzieningen aanwezig! Denk aan actieve monitoring per cel, BMS-bescherming tegen overladen en nog veel meer! Iedere accu zit in een eigen compartiment, incl. aerosolblusser.", "cat": "Veiligheid"},
  {"q": "Kan je vanuit Sett (batterij) direct DC laden? Zonder omvormer?", "a": "", "cat": "Techniek & energie"},
  {"q": "Hoe gaat Sett om met regenwater dat in de bak loopt?", "a": "Sett is volledig waterproof!", "cat": "Water & grond"},
  {"q": "Is Sett inclusief software en app?", "a": "Yes, Sett komt met software voor de besturing van de installatie. Denk aan de in- en verkoop van energie en bijvoorbeeld het forecasten van die momenten. Natuurlijk kan je al je benodigde inzichten volgen via onze app.", "cat": "Prijs & levering"},
  {"q": "Kan Sett ook geleverd worden in andere landen dan Nederland?", "a": "We zijn natuurlijk heel ambitieus! Inmiddels is het aantal aanvragen de 1000 gepasseerd en leggen we de focus op Nederland!", "cat": "Prijs & levering"},
  {"q": "Hoe gaat Sett om met vorst?", "a": "Een beetje bibberen betekent wat minder capaciteit. Sett heeft een eigen verwarmings- en koelingssysteem in huis.", "cat": "Water & grond"},
  {"q": "Hoe kan Sett onderhouden worden?", "a": "De verwachting is dat Sett zonder problemen 20+ jaar onder de grond kan werken. Is er iets kapot? Dan kan Sett bereikt worden via een onderhoudsluik.", "cat": "Installatie"},
  {"q": "Hoe gaat Sett om met het tracé dat vaak onder de oprit ligt?", "a": "Oeiiii... dat is een goede! En tegelijk iets waar we niet op of onder kunnen installeren. We moeten er dus omheen werken. Sett kan dus prima wat naar links of rechts geïnstalleerd worden en hoeft niet per se precies onder je oprit geplaatst te worden.", "cat": "Installatie"},
  {"q": "Wat is de levertijd van Sett?", "a": "De eerste testversies zijn goedgekeurd en worden as we speak gecertificeerd. We verwachten de eerste batches met Setts eind 2026.", "cat": "Prijs & levering"},
  {"q": "Wordt Sett geïnstalleerd voor de meterkast?", "a": "Yes, Sett wordt tussen net en meterkast geïnstalleerd.", "cat": "Installatie"},
  {"q": "Hoe is de brandveiligheid gewaarborgd?", "a": "We zijn in gesprek met verschillende veiligheidsregio's en de brandweer. Sett ligt er natuurlijk beter bij dan de eerste en beste thuisbatterij op een zolderkamer. Alle thermal-runaway-tests zijn inmiddels uitgevoerd en Sett is met vlag en wimpel geslaagd. En dus gecertificeerd! Fosfaat in de batterij is heel veilig! Verder zijn er nog tal van andere veiligheidsvoorzieningen aanwezig! Denk aan actieve monitoring per cel, BMS-bescherming tegen overladen en nog veel meer! Iedere accu zit in een eigen compartiment, incl. aerosolblusser.", "cat": "Veiligheid"},
  {"q": "Onderzoeken jullie ook oplossingen voor VvE?", "a": "Als het object buitenparkeerplaatsen heeft, kan Sett geschakeld worden zodat je met meerdere Setts het appartementencomplex kunt bedienen.", "cat": "Installatie"},
  {"q": "Hoe kan Sett bijdragen aan het energietekort op de Nederlandse markt?", "a": "Sett kan helpen om netcongestie te voorkomen of energietekort tegen te gaan op het net. Door de slimme manier van laden en ontladen leveren we terug aan het net op het moment dat er krapte is.", "cat": "Techniek & energie"},
  {"q": "Hoe lang gaat de batterij mee zonder significant capaciteitsverlies?", "a": "Natuurlijk moet de praktijk dit gaan uitwijzen maar in onze simulaties gaat Sett zonder problemen meer dan 20 jaar mee!", "cat": "Techniek & energie"},
  {"q": "Hoe gaat de verzekeringsmaatschappij om met Sett?", "a": "We voeren het gesprek met meerdere verzekeraars. Voor nu kan je zelf het gesprek aangaan met je verzekeraar. Sett is in dit opzicht vergelijkbaar met een thuisbatterij, maar veiliger.", "cat": "Veiligheid"},
  {"q": "Zit Sett in een betonnen bak?", "a": "Nope, Sett zit in een gegalvaniseerde stalen bak! Inclusief coating voor de heftigste omstandigheden!", "cat": "Water & grond"},
]

// the blog: the articles live in the Framer CMS collection "Blog" (the plugin reads them);
// this example goes into a new collection as a draft, and fills the studio preview
export const BLOG_VOORBEELD = [
  { slug: "voorbeeld-waarom-sett-onder-de-grond", title: "Voorbeeld: waarom Sett onder de grond gaat", excerpt: "Een batterijkast op de stoep, een laadpaal ernaast en nog een kastje voor de omvormer. Wij stopten het allemaal onder de parkeerplek. Dit is waarom.", date: "2026-10-14", category: "Achtergrond",
    html: "<p>Dit is een voorbeeldartikel: zo ziet een artikel uit de CMS eruit op de site. Pas het aan of maak een nieuw artikel aan in de collectie Blog.</p><h2>Het net zit vol</h2><p>Netbeheerders kunnen de vraag niet bijbenen. Wie zonnepanelen heeft, ziet de omvormer op zonnige dagen uitschakelen. Wie een laadpaal wil, hoort dat er geen ruimte is op de aansluiting. Een eigen buffer lost dat lokaal op.</p><h2>Waarom onder de grond?</h2><p>Een batterij hoort niet in de weg te staan. Sett ligt onder je oprit of parkeerplek: 96 kWh opslag, tot 50 kW vermogen en laders voor je auto, zonder dat je er bovengronds iets van ziet.</p><ul><li>Geen kast op de stoep of in de garage</li><li>Stabiele temperatuur, dus een langere levensduur</li><li>Ruimte voor laden en verbruik op het drukste moment</li></ul><blockquote>Energie hoort onder de grond.</blockquote><p>De eerste productiebatch staat gepland voor november 2026. Op de <a href=\"/roadmap\">roadmap</a> zie je waar we staan.</p>" },
  { slug: "voorbeeld-netcongestie-uitgelegd", title: "Voorbeeld: netcongestie in twee minuten", excerpt: "Overdag te veel zon, 's avonds iedereen tegelijk. Wat netcongestie is en wat een buffer onder je terrein doet.", date: "2026-09-30", category: "Uitleg", html: "<p>Voorbeeldtekst.</p>" },
  { slug: "voorbeeld-eerste-batch", title: "Voorbeeld: zo gaat het met de eerste batch", excerpt: "Een update over productie, transport en de eerste installaties in Nederland.", date: "2026-09-12", category: "Updates", html: "<p>Voorbeeldtekst.</p>" },
]
const minutesOf = (html) => Math.max(1, Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200))
const toCard = (b) => ({ title: b.title, excerpt: b.excerpt, date: b.date, category: b.category, link: "/blog/" + b.slug, minutes: minutesOf(b.html) })
const BLOG_CTA = ["SettV2CTA", { eyebrow: "Benieuwd wat Sett voor jou doet?", headline: "Laten we|praten.", body: "Plan een korte videocall met ons team, of bel direct. We denken graag mee over jouw situatie.", primary: "Plan een afspraak", primaryLink: "/contact#afspraak", secondary: "Bel direct", secondaryLink: "tel:+31332104140", meeting: "", quote: "" }]

// ---------------------------------------------------------------- juridisch
// the terms and the privacy statement, rewritten for Sett from Mithra's (mithra.network/
// voorwaarden and /privacy). One source for the pages (/voorwaarden, /privacy) and the PDFs
// (studio/legal.html renders them; studio/legal/make-pdf.mjs prints them).
// A section's text: a blank line starts a paragraph, "- " a list item; in a list item, the
// words before the first colon are set in bold
const SETT_ID = "Sett · Hogebrinkerweg 18-021, 3871 KN Hoevelaken · KvK 96683147 · btw NL867713653B01"
export const LEGAL = {
  voorwaarden: {
    file: "sett-algemene-voorwaarden",
    eyebrow: "Juridisch",
    title: "Algemene voorwaarden",
    updated: "9 november 2026",
    intro: "Deze voorwaarden gelden als je Sett bestelt, gebruikt of contact met ons hebt. We hebben ze zo kort en duidelijk mogelijk gehouden.",
    id: SETT_ID,
    sections: [
      { title: "Toepasselijkheid", body: "Deze algemene voorwaarden gelden voor alle aanbiedingen, offertes, bestellingen, overeenkomsten en diensten van Sett, en voor het gebruik van sett.nl, de Sett-software en de app. Door een offerte te tekenen of Sett te gebruiken, ga je akkoord met deze voorwaarden." },
      { title: "Bestellen en offerte", body: "Een bestelling via sett.nl is vrijblijvend: je betaalt nu niets. Na je bestelling nemen we contact met je op en maken we een offerte op maat.\n\nDe overeenkomst komt pas tot stand als je de offerte tekent. In de offerte staan de prijs, je configuratie, wat er bij de plaatsing hoort en het verwachte plaatsingsmoment. Prijzen op sett.nl zijn exclusief btw, plaatsing en installatie, tenzij anders vermeld." },
      { title: "Software, app en monitoring", body: "Sett komt met software voor de besturing van het systeem, zoals het opslaan, gebruiken en verhandelen van energie, en met een app waarin je je inzichten volgt.\n\n- Beschikbaarheid: we streven naar een zo hoog mogelijke beschikbaarheid, maar kunnen ononderbroken dienstverlening niet garanderen vanwege de aard van internet- en telecommunicatie-infrastructuur.\n- Onderhoud: we mogen diensten tijdelijk onderbreken voor gepland onderhoud. Waar mogelijk laten we dat vooraf weten." },
      { title: "Jouw data", body: "- Eigendom: alle data die jouw Sett genereert, blijft van jou.\n- Licentie: je geeft Sett een beperkte, niet-exclusieve licentie om deze data te verwerken, uitsluitend om de diensten te leveren en te verbeteren.\n- Anonimisering: we kunnen geanonimiseerde, samengevoegde data gebruiken voor statistiek en om het net te helpen ontlasten.\n\nHoe we met persoonsgegevens omgaan, lees je in onze privacyverklaring." },
      { title: "Levering, plaatsing en installatie", body: "Bij levering gaat het risico van verlies of beschadiging van de hardware over op jou.\n\nLaat je Sett door ons of onze partners plaatsen, dan staat in de offerte wat daaronder valt. Regel je de installatie zelf, dan ben jij verantwoordelijk voor een juiste installatie en voor de omstandigheden op de locatie, zoals de aansluiting en de fysieke beveiliging, tenzij we iets anders hebben afgesproken." },
      { title: "Betaling", body: "Je betaalt volgens de getekende offerte of het afgesproken abonnement. Betalingen die niet binnen 30 dagen na de factuurdatum binnen zijn, zijn onderhevig aan de wettelijke rente. We kunnen de dienstverlening dan ook opschorten." },
      { title: "Aansprakelijkheid", body: "- Indirecte schade: Sett is niet aansprakelijk voor indirecte schade, zoals gederfde winst, dataverlies of bedrijfsonderbreking.\n- Maximum: onze totale aansprakelijkheid is beperkt tot het bedrag dat je voor de betreffende dienst hebt betaald in de 6 maanden voor de gebeurtenis die de schade veroorzaakte.\n\nDeze beperkingen laten je wettelijke rechten als consument onverlet." },
      { title: "Intellectueel eigendom", body: "Alle software, algoritmen en het merk Sett blijven het intellectueel eigendom van Sett of haar licentiegevers. Het is niet toegestaan onze software te reverse-engineeren of te decompileren." },
      { title: "Toepasselijk recht", body: "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Sett is gevestigd." },
      { title: "Contact", body: "Vragen over deze voorwaarden? Mail naar info@sett.nl of bel +31 33 210 4140." },
    ],
  },
  privacy: {
    file: "sett-privacyverklaring",
    eyebrow: "Juridisch",
    title: "Privacyverklaring",
    updated: "9 november 2026",
    intro: "Hier lees je welke persoonsgegevens Sett verwerkt, waarom we dat doen en welke rechten je hebt.",
    id: SETT_ID,
    sections: [
      { title: "Wie zijn wij?", body: "Sett is een ondergrondse energiehub: een thuisbatterij met laadpaal onder je oprit of parkeerplek, voor huishoudens, bedrijven en gemeenten. Sett is verantwoordelijk voor de verwerking van je persoonsgegevens zoals in deze privacyverklaring staat.\n\n- Naam: Sett\n- Adres: Hogebrinkerweg 18-021, 3871 KN Hoevelaken\n- KvK: 96683147\n- Contact: info@sett.nl of +31 33 210 4140" },
      { title: "Welke persoonsgegevens verwerken wij?", body: "We verwerken alleen gegevens die je zelf aan ons geeft, die we via onze website ontvangen of die je Sett genereert:\n\n- Contactgegevens: naam, e-mailadres en telefoonnummer.\n- Adresgegevens: je postcode en, voor de offerte en plaatsing, je adres.\n- Bedrijfs- of organisatiegegevens: bedrijfsnaam of gemeente en je functie, als je namens een organisatie contact opneemt.\n- Je keuzes en vragen: wat je invult in het bestelformulier, een contactformulier of de afspraakplanner, en wat je ons schrijft.\n- Gegevens van je Sett: als je een Sett hebt, verwerken we gegevens over opwek, opslag en gebruik om het systeem te besturen en te bewaken.\n- Technische gegevens: IP-adres, browsertype en bezoekgegevens, via cookies en alleen met je toestemming als ze niet noodzakelijk zijn." },
      { title: "Waarom verwerken wij je gegevens?", body: "- Contact: om te reageren op je bestelling, vraag of afspraak.\n- Offerte en levering: om je een offerte te maken en je Sett te leveren, te plaatsen en te onderhouden.\n- Besturing en monitoring: om je Sett te laten werken en de werking te bewaken.\n- Verbetering van de website en marketing: om te begrijpen hoe bezoekers onze website gebruiken, met je toestemming.\n- Wettelijke verplichtingen: voor zover dat nodig is om aan wet- en regelgeving te voldoen." },
      { title: "Op welke grondslag?", body: "We verwerken je gegevens op basis van een of meer van deze grondslagen uit de AVG:\n\n- Toestemming: als je een formulier invult of cookies accepteert.\n- Uitvoering van een overeenkomst: als we een offerte maken of je Sett leveren en onderhouden.\n- Gerechtvaardigd belang: voor zakelijke communicatie en om onze website te verbeteren.\n- Wettelijke verplichting: als dat van toepassing is." },
      { title: "Hoe lang bewaren wij je gegevens?", body: "We bewaren je gegevens niet langer dan nodig is voor het doel waarvoor we ze hebben verzameld:\n\n- Contactgegevens van een aanvraag: tot maximaal 24 maanden na het laatste contact, tenzij je eerder vraagt om verwijdering.\n- Klantgegevens: zolang de overeenkomst loopt, plus de wettelijke bewaartermijnen, zoals 7 jaar voor de financiële administratie.\n- Website- en cookiegegevens: zoals beschreven bij Cookies." },
      { title: "Met wie delen wij je gegevens?", body: "We verkopen je gegevens nooit en delen ze alleen met:\n\n- Verwerkers: leveranciers die in onze opdracht gegevens verwerken, zoals onze CRM- en formulierenleverancier, onze e-mailleverancier en de hosting van onze website. Met hen sluiten we een verwerkersovereenkomst.\n- Installatiepartners: als je Sett door een partner wordt geplaatst, alleen de gegevens die daarvoor nodig zijn.\n- Advertentiepartners: alleen met je toestemming via de cookie-instellingen, en dan alleen om te meten hoe onze campagnes werken.\n- Bevoegde autoriteiten: als we daartoe wettelijk verplicht zijn." },
      { title: "Doorgifte buiten de EU", body: "Sommige leveranciers verwerken gegevens buiten de Europese Unie. Dan zorgen we voor passende waarborgen, zoals de modelcontracten van de Europese Commissie of een adequaatheidsbesluit." },
      { title: "Hoe beveiligen wij je gegevens?", body: "We nemen passende technische en organisatorische maatregelen om je gegevens te beschermen tegen verlies of onrechtmatige verwerking, zoals versleutelde verbindingen (HTTPS), toegangsbeheer en een beperkte groep medewerkers met toegang." },
      { title: "Welke rechten heb je?", body: "Op grond van de AVG heb je deze rechten:\n\n- Inzage: je mag opvragen welke gegevens we van je verwerken.\n- Rectificatie: je mag onjuiste gegevens laten corrigeren.\n- Verwijdering: je kunt vragen je gegevens te verwijderen.\n- Beperking: je kunt vragen de verwerking tijdelijk stop te zetten.\n- Bezwaar: je kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang.\n- Dataportabiliteit: je kunt je gegevens in een gestructureerde vorm opvragen of laten overdragen.\n- Toestemming intrekken: verwerken we je gegevens op basis van toestemming, dan kun je die altijd intrekken.\n\nWil je een van deze rechten gebruiken? Mail naar info@sett.nl. We reageren binnen 30 dagen." },
      { title: "Cookies", body: "Sett.nl gebruikt noodzakelijke cookies om de site te laten werken. Met je toestemming gebruiken we ook analytische cookies, om de site te verbeteren, en marketingcookies, om je relevante informatie te laten zien.\n\nJe kiest zelf in de cookiemelding wat je toestaat, en je kunt je keuze altijd wijzigen via Cookie-instellingen onderaan de site." },
      { title: "Klacht indienen", body: "Vind je dat we niet goed met je persoonsgegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens:\n\n- Website: autoriteitpersoonsgegevens.nl\n- Postadres: Postbus 93374, 2509 AJ Den Haag\n\nWe stellen het op prijs als je eerst contact met ons opneemt, zodat we je vraag of zorg zelf kunnen oplossen." },
      { title: "Wijzigingen", body: "We kunnen deze privacyverklaring aanpassen. Wijzigingen publiceren we op deze pagina, met een nieuwe datum bovenaan." },
      { title: "Contact", body: "Vragen over deze privacyverklaring of over hoe we met je gegevens omgaan? Mail naar info@sett.nl of bel +31 33 210 4140." },
    ],
  },
}
const legalPage = (k) => [["SettV2Legal", { ...LEGAL[k], pdf: "@pdf:" + LEGAL[k].file }]]

export const V2 = {
  // ================================================================ /details
  details: [
    ["SettV2Xray", { model: G("sett-box"), eyebrow: "Wat is Sett?", headline: "Energie hoort|onder de grond.", lead: "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt. Voor particulier, ondernemer, overheid en werkgever.", primary: "Bestel jouw Sett", primaryLink: "/pre-order", secondary: "Bel direct", secondaryLink: "tel:+31332104140" }],
    ["SettV2Numbers", { items: CIJFERS }],
    ["SettV2Compare", { before: A("vergelijk-kast"), after: A("vergelijk-sett") }],
    ["SettV2Statement", { label: "Het probleem", text: "Er zijn twee pieken op het net en beiden worden elke dag groter.", highlight: "twee pieken, groter", note: "Overdag te veel zon, 's avonds iedereen tegelijk. Het net zit ertussen, en het groeit niet mee." }],
    ["SettV2DayCycle", { mode: "huis" }],
    ["SettV2Stack", { cards: PROBLEMEN }],
    ["SettV2Switch", { items: DOELGROEPEN }],
    ["SettV2Timeline", { years: JAREN }],
    ["SettV2CTA", {}],
  ],

  // ================================================================ /pre-order
  // a quote request, not a purchase: nothing is paid on this page
  preorder: [
    ["SettV2Quote", { image1: A("sett-config-1-laadpaal"), image2: A("sett-config-2-laadpalen"), webhook: "" }],
    ["SettV2Steps", { eyebrow: "Na je aanvraag", heading: "Van aanvraag tot Sett onder je oprit.", intro: "Je aanvraag is vrijblijvend. Pas als je de offerte tekent, bestel je.", steps: [
      { title: "Het gesprek", body: "We bellen je over je plek, je aansluiting, je panelen en je verbruik." },
      { title: "De locatie", body: "We bekijken samen waar Sett komt en hoe hij geïnstalleerd wordt." },
      { title: "Je offerte", body: "Een offerte op maat, met de installatie erbij als je dat wilt." },
      { title: "Productie en plaatsing", body: "Teken je, dan plannen we je Sett in. De eerste productiebatch is in Q4 2026." },
    ], note: "", button: "", poster: A("sett-96-exploded"), theme: "paper" }],
    ["SettV2CTA", { eyebrow: "Nog vragen?", headline: "Eerst even|overleggen?", body: "In de Q&A staan de antwoorden op de meest gestelde vragen. Of bel ons, dan denken we met je mee.", primary: "Bekijk de Q&A", primaryLink: "/qa", secondary: "Bel direct", secondaryLink: "tel:+31332104140", quote: "" }],
  ],
  // ================================================================ /partners
  partners: [
    ["SettV2Partners", { photo: U("Installateur werkt aan zonnepanelen op een dak", "https://framerusercontent.com/images/eWMmjfPJ3mJkd00q6TVbejRmR6Y.jpg"), primaryLink: "#formulier" }],
    // the business form from /contact (Pipedrive can't tag partner leads: swap in a partner form here when there is one)
    ["SettV2Form", { formUrl: "https://webforms.pipedrive.com/f/crZYg4X28wbnBNBQMIqB8KkkucUcU00qjd65kUPQdgrTlFPqO4aB53MkAJWs43YgXp", anchor: "formulier", theme: "dark", eyebrow: "Partner worden", heading: "Bouw met|ons mee.", body: "Vertel ons wie je bent en wat je doet. We nemen zo snel mogelijk contact met je op voor een kennismaking.", points: "Installateurs, grondwerkers en e-installateurs\nProjectontwikkelaars en energieadviseurs\nSamen netcongestie tegengaan" }],
    ["SettV2CTA", { eyebrow: "Partner worden", headline: "Word jij|partner van|Sett?", body: "Samen maken we energieopslag bereikbaar voor meer mensen, plekken en ondernemers. Laat je gegevens achter, dan plannen we een kennismaking.", primary: "Word partner van Sett", primaryLink: "#formulier", secondary: "Bel direct", secondaryLink: "tel:+31332104140", quote: "" }],
  ],
  // ================================================================ /roadmap
  roadmap: [
    ["SettV2Roadmap", { image: U("De Sett-app op een telefoon: zonnestroom, de accu op 68% en het verbruik van het huis", "https://framerusercontent.com/images/ApnMykf3Dxs5bTaLS0IEMucFbY.png"), button: "" }],
    ["SettV2CTA", { eyebrow: "Eerste batch · beperkt beschikbaar", headline: "Zorg dat je|de eerste bent.", body: "Reserveer jouw plek in de eerste batch en ontvang als eerste updates over productie, levering en installatie.", primary: "Pre-order jouw Sett", primaryLink: "/pre-order", secondary: "Bel direct", secondaryLink: "tel:+31332104140", quote: "" }],
  ],
  // ================================================================ /blog
  // the overview; the plugin replaces these example posts with the articles from the CMS
  blog: [
    ["SettV2Blog", { posts: BLOG_VOORBEELD.map(toCard) }],
    BLOG_CTA,
  ],
  // ================================================================ /blog/<slug> (studio preview of one article)
  artikel: [
    ["SettV2Article", { ...(({ slug, ...b }) => b)(BLOG_VOORBEELD[0]), minutes: minutesOf(BLOG_VOORBEELD[0].html), more: BLOG_VOORBEELD.slice(1).map(toCard) }],
    BLOG_CTA,
  ],
  // ================================================================ /bedankt
  // the general thank-you page (after a form): what happens next, contact and booking a call
  bedankt: [
    ["SettV2Confirm", { eyebrow: "Bericht ontvangen", headline: "Bedankt!", lead: "We hebben je bericht ontvangen en nemen zo snel mogelijk persoonlijk contact met je op.", batch: "", stepsTitle: "Wat er nu gebeurt", steps: "Je bericht komt direct bij ons team binnen\nWe nemen zo snel mogelijk contact met je op\nLiever niet wachten? Plan zelf alvast een gesprek in", primary: "Terug naar home", primaryLink: "/", secondary: "Bekijk de Q&A", secondaryLink: "/qa" }],
    ["SettV2Scheduler", { url: "https://mihtra.pipedrive.com/scheduler/drZMw8hb/maak-online-kennis-met-sett", theme: "paper", eyebrow: "Plan een afspraak", heading: "Liever direct|een gesprek?", body: "Kies zelf een moment voor een korte videocall met Sett. Dan nemen we je vraag meteen samen door." }],
  ],
  // ================================================================ /bestelling-bevestigd
  // after ordering: you're in, what's next, contact and booking a call (the page stays noindex in Framer)
  bevestigd: [
    ["SettV2Confirm", {}],
    ["SettV2Scheduler", { url: "https://mihtra.pipedrive.com/scheduler/drZMw8hb/maak-online-kennis-met-sett", theme: "paper", eyebrow: "Plan een afspraak", heading: "Maak alvast|kennis.", body: "Wil je niet wachten tot we bellen? Kies zelf een moment voor een korte videocall. We nemen je reservering en je situatie samen door." }],
  ],
  // ================================================================ /contact
  contact: [
    ["SettV2Contact", { model: G("sett-scroll-onzichtbare-energiehub"), poster: A("onzichtbare-energiehub"), eyebrow: "Contact", headline: "Laten we|praten.", lead: "Wil je meer weten over Sett? Geef ons een belletje of plan direct je afspraak in.", primary: "Bel direct", primaryLink: "tel:+31332104140", secondary: "Plan een afspraak", secondaryLink: "#afspraak", phone: "+31 (0) 33 210 41 40", phoneLink: "tel:+31332104140", email: "info@sett.nl", address: "Hogebrinkerweg 18-021\n3871 KN Hoevelaken", details: "KvK | 96683147\nBtw | NL867713653B01\nBank | NL76 ADYB 1000 0203 75" }],
    ["SettV2Scheduler", { url: "https://mihtra.pipedrive.com/scheduler/drZMw8hb/maak-online-kennis-met-sett", theme: "paper" }],
    ["SettV2Form", { formUrl: "https://webforms.pipedrive.com/f/5VEeAprXnbH50j5abLntLgotF6OZoohYSSjbDiVWZ1cX6Ef2Ol2PIdznJ0DurD8VrR", formUrl2: "https://webforms.pipedrive.com/f/crZYg4X28wbnBNBQMIqB8KkkucUcU00qjd65kUPQdgrTlFPqO4aB53MkAJWs43YgXp", tab1: "Ik ben particulier", tab2: "Ik ben ondernemer", anchor: "formulier", theme: "dark", eyebrow: "Of stuur een bericht", heading: "Vertel ons|wat je zoekt.", body: "Kies of je voor je woning of voor je bedrijf komt, laat je gegevens achter en we nemen contact met je op.", points: "Voor je woning: een eerlijk rekenvoorbeeld\nVoor je bedrijf: de businesscase, doorgerekend" }],
  ],
  // ================================================================ /qa
  qa: [
    ["SettV2FAQ", { eyebrow: "Q&A", headline: "Alles wat je|wilt weten.", intro: "Alle vragen die voorbijgekomen zijn in onze LinkedIn-post vind je hier.", updated: "Laatst bijgewerkt op 30-06-2026", items: VRAGEN, askTitle: "Heb je een nieuwe vraag?", askBody: "Stuur je vraag in en we nemen zo snel mogelijk contact met je op.", askButton: "Stel je vraag", askLink: "#formulier" }],
    ["SettV2Form", { formUrl: "https://webforms.pipedrive.com/f/5VEeAprXnbH50j5abLntLgotF6OZoohYSSjbDiVWZ1cX6Ef2Ol2PIdznJ0DurD8VrR", formUrl2: "https://webforms.pipedrive.com/f/crZYg4X28wbnBNBQMIqB8KkkucUcU00qjd65kUPQdgrTlFPqO4aB53MkAJWs43YgXp", tab1: "Ik ben particulier", tab2: "Ik ben ondernemer", anchor: "formulier", theme: "dark", eyebrow: "Heb je een nieuwe vraag?", heading: "Stel je|vraag.", body: "Stuur je vraag in en we nemen zo snel mogelijk contact met je op.", points: "" }],
  ],
  // ================================================================ /over
  over: [
    ["SettV2Team", { eyebrow: "Over ons", headline: "Wij bouwen aan|een mooie en slimme|energieoplossing.", lead: "", label: "Het team", metaLeft: "Sett — over ons", metaRight: "Hoevelaken, NL", members: [
      { name: "Wietse", role: "Founder & Lead Architect", photo: U("Foto van Wietse", "https://framerusercontent.com/images/hUfgC8wq7XjpCdxc6hZvU8f3w4.png"), link: "https://www.linkedin.com/in/wwind/" },
      { name: "Tristan", role: "Head of Design & UX", photo: U("Foto van Tristan", "https://framerusercontent.com/images/IpZtifHaWVnQy5mlATTHDDr0ak.png"), link: "https://www.linkedin.com/in/tristanvandekamp/" },
      { name: "Ken", role: "Founder & Sales", photo: U("Foto van Ken", "https://framerusercontent.com/images/hsX7OWi0pV2kwwz3IOlNafLsOk.png"), link: "https://www.linkedin.com/in/kenvdhorst/" },
      { name: "Robert", role: "COO", photo: U("Foto van Robert", "https://framerusercontent.com/images/vg3W3yg51jbXk95jKYIpNTnLZA.png"), link: "https://www.linkedin.com/in/kiuru1/" },
      { name: "Kevin", role: "Senior Software Engineer", photo: U("Foto van Kevin", "https://framerusercontent.com/images/HGx2yCPyuyh3sAqKFkwfsHai4.png"), link: "https://www.linkedin.com/in/kevinkoobs/" },
      { name: "Satish", role: "Senior Software Engineer", photo: U("Foto van Satish", "https://framerusercontent.com/images/WWx48UlmoZktiNUiWrwGMwqEeI.png"), link: "https://www.linkedin.com/in/technotip/" },
      { name: "Bianca", role: "Office Manager", photo: U("Foto van Bianca", "https://framerusercontent.com/images/8qMUiOl9HfMeEZCq9t119dPb9BE.png"), link: "https://www.linkedin.com/in/bianca-oost-533a27237/" },
    ] }],
    ["SettV2CTA", { eyebrow: "Klaar voor een pilot?", headline: "De eerste|onzichtbare|energiehub|van Nederland.", body: "Wij zijn op zoek naar particulieren, ondernemers en gemeenten die netontlastende laadinfrastructuur willen neerzetten zonder de openbare ruimte op te offeren. Laat hier je gegevens achter.", primary: "Particulieren", primaryLink: "/particulieren", secondary: "Bedrijven", secondaryLink: "/bedrijven", quote: "" }],
  ],
  // ================================================================ /particulieren
  particulieren: [
    ["SettV2Hero", { eyebrow: "Sett voor particulieren", headline: "Jouw zonnepanelen|werken hard.", lead: "Het zou zonde zijn als het net dat voor je verpest. De stroom die jij opwekt, bewaar jij. En jij beslist wanneer je hem gebruikt.", heroModel: G("sett-hero-particulieren"), vibe: "zonnig", metaLeft: "Sett — voor particulieren" }],
    ["SettV2Form", { formUrl: "https://webforms.pipedrive.com/f/5VEeAprXnbH50j5abLntLgotF6OZoohYSSjbDiVWZ1cX6Ef2Ol2PIdznJ0DurD8VrR", anchor: "formulier", theme: "dark", eyebrow: "Bestel jouw Sett", heading: "Jouw Sett,|doorgerekend.", body: "Vul het formulier in, dan nemen we contact met je op voor een eerlijk rekenvoorbeeld voor jouw woning.", points: "Een kort gesprek over je woning, je panelen en je verbruik\nWe rekenen door wat Sett voor jou oplevert" }],
    ["SettV2Film", { ...FILM("video-huis-zon-dak"), tint: "zon", label: "Overdag", text: "Je dak levert.|Maar waar gaat|die stroom heen?", note: "Zonder opslag gaat je overschot overdag het net op, en koop je 's avonds dezelfde stroom weer terug.", credit: "Beeld: Pexels" }],
    ["SettV2Statement", { label: "De salderingsregeling verdwijnt", level: "Per 2027", text: "Salderen stopt. Wie dan geen eigen opslag heeft, levert stroom goedkoop terug en koopt diezelfde stroom die avond duur in.", highlight: "salderen, stopt, duur", theme: "paper", note: "Zonder opslag lever je straks stroom bijna gratis terug en koop je die 's avonds voor de volle prijs. Dat verschil betaal je elke maand." }],
    ["SettV2DayCycle", { mode: "huis" }],
    ["SettV2Statement", { label: "Onafhankelijkheid", level: "Elke avond, na zonsondergang", text: "Mensen met zonnepanelen denken dat ze onafhankelijk zijn. Maar elke avond ben je gewoon weer klant bij het energiebedrijf.", highlight: "elke avond, klant", accent: "#8DFF66", note: "Sett verandert dat. En als het net uitvalt? Dan heb jij gewoon stroom. De rest van de straat misschien niet." }],
    ["SettV2Story", { eyebrow: "Wat Sett voor jou doet", heading: "Vijf voordelen die je energiepositie fundamenteel veranderen.", intro: "Elk voordeel staat op zichzelf. Samen maken ze je huishouden onafhankelijker, goedkoper in gebruik en klaar voor de komende tien jaar.", accent: "#8DFF66", items: [
      { label: "Voordeel 01", title: "De salderingsregeling verdwijnt. Jouw voordeel niet.", body: "De salderingsregeling wordt elk jaar verder afgebouwd. Jij levert stroom goedkoop terug en koopt diezelfde stroom die avond duur in. Sett keert dat om: de stroom die jij overdag opwekt, bewaart Sett voor het moment dat jij hem nodig hebt.", risk: "Zonder opslag verdampt het voordeel van je zonnepanelen elk jaar een beetje meer.", ...S("salderen-stopt") },
      { label: "Voordeel 02", title: "Echte onafhankelijkheid. Niet alleen op papier.", body: "Je slaat overdag op wat je panelen produceren en verbruikt dat die avond thuis. Bij netuitval schakelt Sett automatisch over op de accu. Jij hebt gewoon licht en jij kunt gewoon laden.", risk: "Een woning met alleen zonnepanelen is afhankelijk van het net zodra de zon ondergaat. Dat is 12 tot 16 uur per dag.", ...S("onafhankelijk") },
      { label: "Voordeel 03", title: "Grip op je rekening. Elke maand.", body: "Met Sett koop je stroom in op het moment dat de prijs laag staat, sla je hem op en verbruik je hem als de prijs hoog is. Het resultaat is een rekening die stabieler is en structureel lager uitvalt.", risk: "Wie volledig afhankelijk is van het net, betaalt altijd de marktprijs. In de avondspits is dat bijna nooit de laagste prijs van de dag.", ...S("grip-op-rekening") },
      VD_ARBITRAGE,
      VD_DELEN,
    ] }],
    ["SettV2Photos", { eyebrow: "Jouw dag", heading: "Je dak, je auto,|je avond.", intro: "", theme: "dark", credit: "Foto's: Pexels", items: [
      { image: F("foto-huis-zon"), video: "", tag: "Overdag", caption: "Je panelen wekken op terwijl jij aan het werk bent.", color: "#FFB92B", focus: "50% 30%" },
      { image: F("foto-laden-thuis"), video: "", tag: "Thuiskomen", caption: "De auto aan de lader, net als de avondpiek begint.", color: "#BF9CFF", focus: "35% 60%" },
      { image: F("foto-avond-huis"), video: "", tag: "'s Avonds", caption: "Koken, verwarmen, licht aan: uit je eigen Sett, niet uit het net.", color: "#8DFF66", focus: "50% 58%" },
    ] }],
    ["SettV2Steps", { eyebrow: "Hoe we het samen aanpakken", heading: "Wij kijken eerst of het past. Dan bouwen we het.", steps: [
      { title: "Een kort gesprek", body: "Over jouw woning, je panelen en je verbruik." },
      { title: "Doorrekenen", body: "We rekenen door wat Sett voor jou oplevert." },
      { title: "Onder je oprit", body: "Past het? Dan plannen we de installatie. Geen grote verbouwing, geen weken gedoe." },
      { title: "Je dashboard", body: "Daarna zie je precies wat je opwekt, opslaat en verbruikt." },
    ], note: "Wie wacht tot de krapte groter is, heeft minder keuze in locaties en minder installatiecapaciteit beschikbaar.", button: "Bestel jouw Sett", link: "/pre-order", ...L("installatie") }],
    ["SettV2CTA", { eyebrow: "Bestel jouw Sett", headline: "Bewaar je|eigen zon.", body: "Sett 96 is er vanaf € 39.999 excl. btw. Vraag vrijblijvend een offerte aan en kom op de lijst voor de eerste productiebatch, of bel ons voor een eerlijk rekenvoorbeeld.", primary: "Bestel jouw Sett", primaryLink: "/pre-order", secondary: "Bel direct", secondaryLink: "tel:+31332104140", quote: "" }],
  ],
  // ================================================================ /gemeenten
  gemeenten: [
    ["SettV2Hero", { eyebrow: "Sett voor gemeenten", headline: "Laden in|elke wijk.", lead: "Bewoners willen laden, nieuwbouwwijken moeten van het gas af. Maar het net in de wijk zit vol. Sett zet laadplekken en energieopslag onder de parkeerplek, en houdt de straat vrij.", primary: "Plan een kennismaking", primaryLink: "#formulier", secondary: "Bel direct", secondaryLink: "tel:+31332104140", heroModel: G("sett-hero-gemeenten"), vibe: "goudenUur", metaLeft: "Sett — voor gemeenten" }],
    ["SettV2Form", { formUrl: "https://webforms.pipedrive.com/f/czGjp4cWMmq5xDFMUTXCO41lANSZ94AMlycnlTpjyFt8vav8qIUxODNvDzVmKVl1Gr", anchor: "formulier", theme: "dark", eyebrow: "Voor gemeenten en gebiedsontwikkelaars", heading: "Plan een|kennismaking.", body: "Vertel ons over je wijk, je laadopgave of je bouwproject. We nemen contact op en kijken samen waar Sett het verschil maakt.", points: "Geen verplichtingen\nSamen de locaties en de netsituatie bekijken\nEen voorstel voor een pilot in jouw gemeente" }],
    ["SettV2Statement", { label: "Het probleem", level: "Laadopgave · elke wijk, elk jaar meer", text: "De vraag naar publieke laadpunten groeit elk jaar. Het net in de wijk groeit niet mee.", highlight: "groeit, niet, mee", accent: "#FFB92B", note: "Netbeheerders kunnen nieuwe laadpunten steeds vaker niet meer aansluiten. Wie als gemeente wacht op netverzwaring, loopt achter op zijn laaddoelen." }],
    ["SettV2Film", { ...FILM("video-woonstraat"), tint: "zon", label: "In de wijk", text: "Elke straat|staat vol|auto's.", note: "Steeds meer bewoners rijden elektrisch, en de meesten hebben geen eigen oprit. Ze laden langs de straat, 's avonds allemaal tegelijk. Sett vangt die piek op, onder de parkeerplek.", credit: "Beeld: Pexels" }],
    ["SettV2Stack", { heading: "Een energiehub onder de straat.", label: "Wat Sett doet", cards: [
      { label: "Wat Sett doet", title: "Onder de parkeerplek, niet op de stoep.", body: "Accu, omvormer en laadaansluiting zitten in een stalen bak onder een publieke parkeerplek. Boven de grond staat alleen een laadpaal. Geen batterijkasten op de stoep, geen extra trafohuisje, geen ruimte die de wijk kwijtraakt.", color: "#FFF1D6", ink: "#8A5A00", ...L("doelgroep-overheid"), poster: A("card-doelgroep-overheid") },
    ] }],
    ["SettV2Story", { eyebrow: "Wat Sett voor je gemeente doet", heading: "Vijf manieren waarop Sett je laad- en klimaatopgave versnelt.", intro: "Voor bestaande wijken waar het net vol zit en voor nieuwbouwprojecten die vanaf de eerste dag klaar moeten zijn voor elektrisch rijden.", accent: "#FFB92B", items: [
      { label: "Voordeel 01", title: "Publieke laadplekken, ook waar het net vol zit.", body: "Sett slaat overdag stroom op en levert die op het moment dat bewoners laden. Zo komen er laadplekken bij op plekken waar een gewone laadpaal geen aansluiting meer krijgt.", risk: "Zonder buffer staat de uitrol van laadpunten stil tot het net verzwaard is. Dat kan jaren duren.", ...S("gemeente-laadplein") },
      { label: "Voordeel 02", title: "Nieuwbouwwijken: laden en opslag vanaf dag één.", body: "Neem Sett mee in het ontwerp van de wijk. De energiehubs gaan de grond in met de rest van de infrastructuur, zodat bewoners vanaf de oplevering kunnen laden en hun zonnestroom lokaal benut wordt.", risk: "Een wijk die wordt opgeleverd zonder netcapaciteit voor laden, moet later alsnog de straat open. Dat is duurder en vervelender voor bewoners.", ...S("gemeente-nieuwbouw") },
      { label: "Voordeel 03", title: "De openbare ruimte blijft van de wijk.", body: "Alles zit onder de grond. Geen kasten op de stoep, geen extra obstakels, geen gesprek met bewoners over weer een grijze kast voor hun deur. Alleen een laadpaal en een deksel in de bestrating.", risk: "Bovengrondse batterijkasten en trafohuisjes kosten ruimte en roepen weerstand op in de buurt.", ...S("keuze-ondergronds") },
      { label: "Voordeel 04", title: "Netcongestie in de wijk ontlasten.", body: "Sett vangt de zonnepiek overdag op en de laadpiek 's avonds. Daarmee ontlast het niet alleen de laadpalen, maar het hele lokale net. Omvormers van bewoners hoeven minder vaak uit te schakelen.", risk: "Op zonnige dagen schakelen omvormers in de wijk uit, en 's avonds worden laadpalen teruggeregeld. Beide problemen groeien.", ...S("gemeente-sporthal") },
      { label: "Voordeel 05", title: "Schaalbaar over wijk, gemeente en provincie.", body: "Begin met een pilot op een paar parkeerplekken. Werkt het? Dan schalen we op. Meerdere Setts in een wijk werken samen en balanceren onderling, en via één dashboard zie je wat ze opleveren.", risk: "Losse oplossingen per locatie zijn lastig te beheren en lastig op te schalen.", ...S("gemeente-wijk") },
    ] }],
    ["SettV2Photos", { eyebrow: "In de wijk", heading: "De straat blijft|de straat.", intro: "Sett gaat onder de parkeerplek. De bomen, de stoep en het straatbeeld blijven zoals ze zijn.", theme: "dark", credit: "Foto's: Pexels", items: [
      { image: F("foto-laden-straat"), video: "", tag: "Publiek laden", caption: "Een laadplek langs de straat, ook waar het net vol zit.", color: "#FFB92B", focus: "50% 55%" },
      { image: F("video-rijtjes-zon-poster"), video: M("video-rijtjes-zon"), tag: "Nieuwbouw", caption: "Zon op de daken, de buffer onder de parkeerplekken van de wijk.", color: "#8DFF66", focus: "50% 50%" },
      { image: F("foto-woonstraat"), video: "", tag: "Openbare ruimte", caption: "Geen kasten op de stoep. Alleen een deksel in de bestrating.", color: "#BF9CFF", focus: "50% 62%" },
    ] }],
    ["SettV2Steps", { eyebrow: "Hoe we samenwerken", heading: "We beginnen klein. Daarna schalen we op.", steps: [
      { title: "De verkenning", body: "Samen kijken we naar je laadopgave, de netsituatie en geschikte locaties in de wijk." },
      { title: "De pilot", body: "Een paar Setts onder publieke parkeerplekken, of meegenomen in een nieuwbouwproject." },
      { title: "De uitrol", body: "Werkt het? Dan plannen we de volgende wijken, samen met netbeheerder en gebiedsontwikkelaar." },
      { title: "Monitoring", body: "Wij bewaken de systemen continu. Jij ziet via een dashboard wat ze opleveren voor de wijk." },
    ], note: "Gemeenten die nu een pilot starten, hebben de meeste keuze in locaties en installatiecapaciteit.", ...L("doelgroep-overheid"), poster: A("card-doelgroep-overheid"), theme: "paper" }],
    ["SettV2CTA", { eyebrow: "Een pilot in jouw gemeente?", headline: "Laden in de wijk|begint met|een gesprek.", body: "We plannen graag een kennismaking met je team: geen verplichtingen, wel een helder beeld van wat Sett voor je wijken en bouwprojecten kan betekenen.", primary: "Plan een afspraak", primaryLink: "/contact#afspraak", secondary: "Bel direct", secondaryLink: "tel:+31332104140", meeting: "", quote: "", mood: "congest" }],
  ],
  // ================================================================ /voorwaarden and /privacy
  voorwaarden: legalPage("voorwaarden"),
  privacy: legalPage("privacy"),
  // ================================================================ /bedrijven
  bedrijven: [
    ["SettV2Hero", { eyebrow: "Voor ondernemers op het industrieterrein", headline: "Niet wachten|op het net.", lead: "Netbeheerders zijn druk. Wachtlijsten lopen op tot drie jaar. Ondertussen betaal je piektarieven en staat je uitbreiding op pauze.", heroModel: G("sett-hero-bedrijven"), vibe: "blauwUur", metaLeft: "Sett — voor bedrijven" }],
    ["SettV2Form", { formUrl: "https://webforms.pipedrive.com/f/crZYg4X28wbnBNBQMIqB8KkkucUcU00qjd65kUPQdgrTlFPqO4aB53MkAJWs43YgXp", anchor: "formulier", theme: "dark", eyebrow: "Klaar voor de eerste stap?", heading: "Plan een|kennismaking.", body: "Vertel ons over je bedrijf en je aansluiting. We nemen contact met je op en maken samen een helder beeld van wat Sett voor jou kan betekenen.", points: "Geen verplichtingen\nDe businesscase, doorgerekend\nSamen de locatie kiezen" }],
    ["SettV2Statement", { label: "Het probleem", level: "Netcapaciteit · tien jaar vooruit ingepland", text: "Het net groeit niet mee met jouw bedrijf. Wachtlijsten lopen op tot drie jaar.", highlight: "groeit, niet, mee, drie, jaar", accent: "#FFB92B", note: "Dit is geen tijdelijk probleem. De netcapaciteit in Nederland is voor de komende tien jaar al ingepland. Wie nu wacht, wacht lang." }],
    ["SettV2Film", { ...FILM("video-mast-wolken"), tint: "nacht", label: "Netcongestie", text: "Het net zit vol.|Jouw buffer|niet.", note: "De netcapaciteit is voor de komende tien jaar al ingepland. Een eigen buffer onder je terrein geeft je vermogen zonder wachtlijst.", credit: "Beeld: Pexels" }],
    ["SettV2DayCycle", { mode: "bedrijf", label: "Een werkdag op het net", without: "Zonder Sett: elke piek boven je limiet betaal je, maand na maand.", withSett: "Met Sett: de piek komt uit je eigen buffer." }],
    ["SettV2Stack", { heading: "Een eigen energiebuffer.", label: "Wat Sett doet", cards: [
      { label: "Wat Sett doet", title: "Onder je parkeerplaats, volledig van jou.", body: "Overdag sla je goedkope of zelfopgewekte stroom op. Op het drukste moment lever je die terug aan je machines, laadpalen of buren op het terrein. Geen grote verbouwing, geen jarenlang wachten.", color: "#EADEF8", ink: "#6B3FD1", ...L("bedrijven-hero"), poster: A("bedrijven-hero") },
    ] }],
    ["SettV2Story", { eyebrow: "Wat Sett voor jou doet", heading: "Vijf voordelen die je energiepositie fundamenteel veranderen.", intro: "Elk voordeel staat op zichzelf. Samen maken ze jouw bedrijf onafhankelijker, goedkoper in gebruik en klaar voor de komende tien jaar op het industrieterrein.", accent: "#C0A8F0", items: [
      { label: "Voordeel 01", title: "Meer vermogen. Zonder drie jaar te wachten.", body: "Een netaansluiting verzwaren duurt gemiddeld drie jaar. Sett geeft je die extra capaciteit nu. De accu werkt als buffer naast je huidige aansluiting.", risk: "Bedrijven op de wachtlijst staan gemiddeld drie jaar stil op uitbreiding. Dat is veel verloren omzet en concurrentievoordeel.", ...S("voordeel-vermogen") },
      { label: "Voordeel 02", title: "Altijd stroom. Ook als het net uitvalt.", body: "Bij netuitval schakelt Sett automatisch over op de eigen accu. Geen productieverlies, geen machines die koud worden, geen klanten die wachten.", risk: "Een dag productieverlies door netuitval kost een gemiddeld industriebedrijf meer dan een volledige maandtermijn aan energiekosten.", ...S("voordeel-netuitval") },
      { label: "Voordeel 03", title: "Lagere energiekosten door Peak Shaving.", body: "Sett detecteert wanneer jouw verbruik richting de piek loopt en springt bij vanuit de accu. Zo blijf je onder je pieklimiet en bespaar je structureel op je vaste energiekosten.", risk: "Zonder Peak Shaving betaal je elke maand voor de duurste minuut van je verbruik.", ...S("voordeel-peakshaving") },
      VD_ARBITRAGE,
      VD_DELEN,
    ] }],
    ["SettV2Steps", { eyebrow: "Hoe we samenwerken", heading: "We beginnen met een gesprek. Daarna gaan we bouwen.", steps: [
      { title: "Het gesprek", body: "Over jouw situatie, jouw aansluiting en wat je wil bereiken." },
      { title: "De businesscase", body: "We rekenen hem door en kiezen samen de locatie." },
      { title: "De installatie", body: "Gepland zodat je bedrijf niet een dag stilstaat." },
      { title: "Monitoring", body: "Wij bewaken het systeem continu. Jij ziet via een dashboard wat het oplevert." },
    ], note: "Wie wacht tot de krapte groter is, heeft minder keuze in locaties en minder installatiecapaciteit beschikbaar.", ...L("doelgroep-ondernemer"), theme: "paper" }],
    ["SettV2Photos", { eyebrow: "Jouw terrein", heading: "Ruimte die je|al hebt.", intro: "Sett gaat onder je parkeerplaats. Je hal, je dak en je laadplein blijven zoals ze zijn.", theme: "dark", credit: "Foto's: Pexels", items: [
      { image: F("foto-bedrijfshal"), video: "", tag: "De hal", caption: "Machines die vermogen vragen, precies op het drukste moment.", color: "#2B8CFF", focus: "40% 70%" },
      { image: F("foto-bedrijventerrein"), video: "", tag: "Het bedrijventerrein", caption: "Zon op de daken, de buffer onder de parkeerplaats.", color: "#FFB92B", focus: "45% 55%" },
      { image: F("foto-masten-zonsondergang"), video: "", tag: "De aansluiting", caption: "Verzwaren duurt jaren. Een eigen buffer niet.", color: "#BF9CFF", focus: "50% 60%" },
    ] }],
    ["SettV2CTA", { eyebrow: "Klaar voor de eerste stap?", headline: "Een gesprek kost|je een uur.", body: "Netcongestie kost je jaren. We plannen graag een kennismakingsgesprek in: geen verplichtingen, wel een helder beeld van wat Sett voor jouw bedrijf kan betekenen.", primary: "Bel direct", primaryLink: "tel:+31332104140", secondary: "Contact", secondaryLink: "/contact", quote: "", mood: "night" }],
  ],
}
