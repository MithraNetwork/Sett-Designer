// Sett V2 Roadmap — the way to the first batch: big type with the app beside it, then the
// planning as a timeline (months across, a bar per milestone). The page works out where we
// are itself: a "Vandaag" line, and each milestone marked done, running now or still to
// come, from today's date. On phones the timeline becomes a list.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Arrow, V, Img, merge, or } from "./SettV2Kit.tsx"

type Row = { title?: string; when?: string; start?: string; end?: string; color?: string }
interface Props {
    eyebrow?: string
    headline?: string
    lead?: string
    note?: string
    image?: Img
    label?: string
    heading?: string
    intro?: string
    from?: string
    to?: string
    rows?: Row[]
    today?: string
    button?: string
    months?: boolean
    link?: string
    style?: React.CSSProperties
}
const DEFAULTS: Row[] = [
    { title: "Orders verzamelen", when: "Nu", start: "2026-08-01", end: "2027-03-31", color: V.lime },
    { title: "Productie eerste Setts", when: "Gestart", start: "2026-11-01", end: "2027-03-31", color: V.blueLight },
    { title: "Transport naar Nederland", when: "Na productie", start: "2027-01-01", end: "2027-03-31", color: V.lilac },
    { title: "Plaatsing eerste Setts", when: "Q1 2027", start: "2027-01-01", end: "2027-03-31", color: V.sun },
]
const MONTHS = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
const day = (s?: string) => {
    const t = Date.parse((s || "") + "T12:00:00")
    return isNaN(t) ? NaN : t
}

const CSS = `
.v2r{ padding:clamp(120px, 16vh, 170px) 0 0; overflow:hidden; }
.v2r-top{ display:grid; grid-template-columns:minmax(0, 1.25fr) minmax(0, .75fr); gap:clamp(32px, 5cqi, 80px); align-items:center; }
.v2r-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2r-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2r .v2-display{ font-size:clamp(46px, 7cqi, 120px); }
.v2r-lead{ margin-top:clamp(18px, 3vh, 28px); }
.v2r-note{ margin-top:26px; display:flex; gap:12px; align-items:flex-start; max-width:560px; padding:14px 18px; border-radius:16px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); font-size:15px; line-height:1.5; color:rgba(223,228,244,.75); }
.v2r-note::before{ content:""; flex:none; width:8px; height:8px; margin-top:7px; border-radius:99px; background:${V.lime}; }
.v2r-phone{ position:relative; justify-self:center; width:min(100%, 330px); }
.v2r-phone::before{ content:""; position:absolute; inset:10% -20% 0; background:radial-gradient(closest-side, rgba(141,255,102,.22), transparent); filter:blur(10px); }
.v2r-phone img{ position:relative; display:block; width:100%; height:auto; transform:rotate(-4deg) translateY(30px); opacity:0; transition:transform 1.4s cubic-bezier(.2,.8,.1,1) .2s, opacity 1s ease .2s; }
.v2-in .v2r-phone img{ transform:rotate(-4deg); opacity:1; }

/* the planning, on a light band */
.v2r-plan{ margin-top:clamp(70px, 11vh, 130px); padding:clamp(70px, 10vh, 120px) 0; background:${V.paper}; color:${V.paperInk}; }
.v2r-plan .v2-mono.lbl{ color:${V.purpleInk}; display:block; margin-bottom:14px; }
.v2r-plan .v2-h2{ font-size:clamp(34px, 4.6cqi, 72px); max-width:16ch; }
.v2r-plan .v2-lead{ margin-top:16px; color:${V.paperMuted}; }
.v2r-chart{ position:relative; margin-top:clamp(36px, 6vh, 56px); padding:clamp(18px, 2cqi, 28px) clamp(18px, 2cqi, 28px) clamp(36px, 3cqi, 44px); border-radius:26px; background:#fff; box-shadow:0 20px 60px rgba(11,14,26,.08), inset 0 0 0 1px rgba(11,14,26,.06); }
.v2r-grid{ position:relative; display:grid; grid-template-columns:minmax(150px, 220px) 1fr; }
.v2r-months{ position:relative; height:34px; border-bottom:1px solid rgba(11,14,26,.08); }
.v2r-months span{ position:absolute; top:6px; transform:translateX(-50%); font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:${V.paperMuted}; white-space:nowrap; }
.v2r-name{ display:flex; flex-direction:column; justify-content:center; gap:3px; min-height:62px; padding-right:16px; border-bottom:1px solid rgba(11,14,26,.06); font-weight:700; font-size:16px; line-height:1.2; }
.v2r-name small{ font:600 10px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:${V.paperMuted}; }
.v2r-name small.now{ color:#1F7A0A; }
.v2r-lane{ position:relative; min-height:62px; border-bottom:1px solid rgba(11,14,26,.06); }
.v2r-bar{ position:absolute; top:50%; height:30px; transform:translateY(-50%); min-width:30px; border-radius:999px; display:flex; align-items:center; justify-content:center; padding:0 12px; overflow:hidden;
  font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.04em; color:${V.ink}; white-space:nowrap; box-shadow:inset 0 0 0 1px rgba(11,14,26,.06); }
.v2r-bar.done{ opacity:.45; }
.v2r-bar.now{ box-shadow:0 0 0 3px rgba(141,255,102,.35), inset 0 0 0 1px rgba(11,14,26,.1); }
.v2r-today{ position:absolute; top:28px; bottom:0; width:2px; margin-left:-1px; background:${V.ink}; pointer-events:none; }
.v2r-today b{ position:absolute; bottom:-24px; left:50%; transform:translateX(-50%); padding:3px 8px; border-radius:99px; background:${V.ink}; color:#fff; font:600 10px "Sett Mono","Geist Mono",monospace; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
.v2r-btns{ display:flex; gap:12px; flex-wrap:wrap; margin-top:30px; }
.v2r-plan .v2-btn.line{ box-shadow:inset 0 0 0 1.5px rgba(11,14,26,.35); color:${V.paperInk}; }

/* phones: a list instead of a timeline */
.v2r-list{ display:none; }
@container (max-width: 1000px){ .v2r-top{ grid-template-columns:1fr; } .v2r-phone{ width:min(56%, 230px); } }
@container (max-width: 700px){
  .v2r-grid{ display:none; }
  .v2r-list{ display:flex; flex-direction:column; gap:0; position:relative; padding-left:28px; }
  .v2r-list::before{ content:""; position:absolute; left:9px; top:10px; bottom:10px; width:2px; background:rgba(11,14,26,.1); }
  .v2r-item{ position:relative; padding:12px 0 18px; }
  .v2r-item::before{ content:""; position:absolute; left:-25px; top:16px; width:14px; height:14px; border-radius:99px; background:var(--c); box-shadow:0 0 0 3px #fff, inset 0 0 0 1px rgba(11,14,26,.1); }
  .v2r-item.done{ opacity:.5; }
  .v2r-item b{ display:block; font-weight:700; font-size:17px; }
  .v2r-item span{ display:block; margin-top:3px; font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.08em; text-transform:uppercase; color:${V.paperMuted}; }
  .v2r-item span.now{ color:#1F7A0A; }
  .v2r-btns .v2-btn{ flex:1 1 auto; justify-content:center; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Roadmap(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    const plan = useRef<HTMLDivElement>(null)
    useReveal(head)
    useReveal(plan)
    const rows = (p.rows && p.rows.length ? p.rows : DEFAULTS).map((r, i) => merge(DEFAULTS[i % DEFAULTS.length], r))
    // the time axis: from the first of the "from" month to the end of the "to" month
    const a = day(or(p.from, "2026-08-01")), b0 = day(or(p.to, "2027-03-31"))
    const b = isNaN(b0) || b0 <= a ? a + 240 * 864e5 : b0 + 864e5
    const at = (t: number) => Math.min(100, Math.max(0, ((t - a) / (b - a)) * 100))
    const ticks: { x: number; label: string }[] = []
    if (!isNaN(a)) {
        const d = new Date(a)
        d.setDate(1)
        for (let i = 0; i < 24; i++) {
            const t = d.getTime()
            if (t >= b) break
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
            const year = d.getMonth() === 0 && i > 0 ? " ’" + String(d.getFullYear()).slice(2) : ""
            ticks.push({ x: (at(t) + at(Math.min(next, b))) / 2, label: MONTHS[d.getMonth()] + year })
            d.setMonth(d.getMonth() + 1)
        }
    }
    // today: after loading (so the page the server sends is the same for everyone); a fixed date can be set
    const [now, setNow] = useState<number | null>(null)
    useEffect(() => setNow(day(p.today) || Date.now()), [p.today])
    const state = (r: Row) => {
        if (now === null) return ""
        const s = day(r.start), e = day(r.end) + 864e5
        return now >= e ? "done" : now >= s ? "now" : ""
    }
    const status = (r: Row) => (state(r) === "done" ? "Klaar" : state(r) === "now" ? "Loopt nu" : "")
    const todayX = now !== null && now >= a && now <= b ? at(now) : null
    return (
        <section className="v2 v2r" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div ref={head} className="v2-wrap v2r-top">
                <div>
                    <div className="v2r-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Roadmap")}</div>
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "De weg naar|de eerste batch|Setts.")} />
                    </h1>
                    <p className="v2r-lead v2-lead v2-fade">{or(p.lead, "We verzamelen nu orders en de eerste Setts komen eraan. We mikken op plaatsing in Q1 2027. Hier zie je waar we staan en welke stap nu loopt.")}</p>
                    {p.note !== "" && <p className="v2r-note v2-fade">{p.note ?? "Dit is onze huidige planning. Data en fases kunnen nog veranderen terwijl we opschalen."}</p>}
                </div>
                {p.image?.src && (
                    <div className="v2r-phone">
                        <img src={p.image.src} srcSet={p.image.srcSet} alt={p.image.alt || "De Sett-app op een telefoon"} loading="eager" />
                    </div>
                )}
            </div>

            <div ref={plan} className="v2r-plan">
                <div className="v2-wrap">
                    <span className="v2-mono lbl v2-fade">{or(p.label, "Fase 1 · Van bestelling tot plaatsing")}</span>
                    <h2 className="v2-h2">
                        <Lines text={or(p.heading, "De eerste Sett|op weg naar Nederland.")} />
                    </h2>
                    <p className="v2-lead v2-fade">{or(p.intro, "De planning hieronder geeft een helder beeld van de mijlpalen die we nu samen doorlopen.")}</p>

                    <div className="v2r-chart v2-fade">
                        <div className="v2r-grid">
                            <div />
                            <div className="v2r-months">
                                {p.months !== false && ticks.map((t, i) => (
                                    <span key={i} style={{ left: t.x + "%" }}>
                                        {t.label}
                                    </span>
                                ))}
                            </div>
                            {rows.map((r, i) => (
                                <React.Fragment key={i}>
                                    <div className="v2r-name">
                                        {r.title}
                                        {status(r) && <small className={state(r)}>{status(r)}</small>}
                                    </div>
                                    <div className="v2r-lane">
                                        <div className={"v2r-bar " + state(r)} style={{ left: at(day(r.start)) + "%", width: Math.max(0, at(day(r.end) + 864e5) - at(day(r.start))) + "%", background: r.color }} title={r.when}>
                                            {r.when}
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                        <TodayLine x={todayX} />
                        <ol className="v2r-list">
                            {rows.map((r, i) => (
                                <li key={i} className={"v2r-item " + state(r)} style={{ ["--c" as string]: r.color } as React.CSSProperties}>
                                    <b>{r.title}</b>
                                    <span className={state(r)}>
                                        {r.when}
                                        {status(r) && " · " + status(r)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {p.button !== "" && (
                        <div className="v2r-btns v2-fade">
                            <a className="v2-btn lime" href={or(p.link, "/pre-order")}>
                                {p.button ?? "Bestel jouw Sett"} <Arrow />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

// the "today" line sits over the timeline's lanes: placed after layout, from the lanes' own box
function TodayLine({ x }: { x: number | null }) {
    const ref = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState<{ left: number; width: number; top: number; height: number } | null>(null)
    useEffect(() => {
        const el = ref.current?.parentElement
        if (!el) return
        const measure = () => {
            const lanes = el.querySelectorAll<HTMLElement>(".v2r-lane")
            const months = el.querySelector<HTMLElement>(".v2r-months")
            if (!lanes.length || !months || !months.offsetWidth) return setBox(null)
            const pr = el.getBoundingClientRect(), mr = months.getBoundingClientRect(), last = lanes[lanes.length - 1].getBoundingClientRect()
            setBox({ left: mr.left - pr.left, width: mr.width, top: mr.bottom - pr.top, height: last.bottom - mr.bottom })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return (
        <div ref={ref} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {x !== null && box && (
                <div className="v2r-today" style={{ left: box.left + (box.width * x) / 100, top: box.top, height: box.height }}>
                    <b>Vandaag</b>
                </div>
            )}
        </div>
    )
}

SettV2Roadmap.displayName = "Sett V2 · Roadmap"

addPropertyControls(SettV2Roadmap, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Roadmap" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "De weg naar|de eerste batch|Setts." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "We verzamelen nu orders en de eerste Setts komen eraan. We mikken op plaatsing in Q1 2027. Hier zie je waar we staan en welke stap nu loopt." },
    note: { type: ControlType.String, title: "Notitie", displayTextArea: true, description: "Leeg: geen notitie.", defaultValue: "Dit is onze huidige planning. Data en fases kunnen nog veranderen terwijl we opschalen." },
    image: { type: ControlType.ResponsiveImage, title: "Beeld" },
    label: { type: ControlType.String, title: "Label planning", defaultValue: "Fase 1 · Van bestelling tot plaatsing" },
    heading: { type: ControlType.String, title: "Kop planning", displayTextArea: true, defaultValue: "De eerste Sett|op weg naar Nederland." },
    intro: { type: ControlType.String, title: "Tekst planning", displayTextArea: true, defaultValue: "De planning hieronder geeft een helder beeld van de mijlpalen die we nu samen doorlopen." },
    from: { type: ControlType.String, title: "Tijdlijn van", defaultValue: "2026-08-01", description: "Datum (jjjj-mm-dd)." },
    to: { type: ControlType.String, title: "Tijdlijn tot", defaultValue: "2027-03-31", description: "Datum (jjjj-mm-dd)." },
    rows: {
        type: ControlType.Array,
        title: "Mijlpalen",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Titel" },
                when: { type: ControlType.String, title: "Wanneer (tekst)" },
                start: { type: ControlType.String, title: "Start", description: "jjjj-mm-dd" },
                end: { type: ControlType.String, title: "Einde", description: "jjjj-mm-dd" },
                color: { type: ControlType.Color, title: "Kleur" },
            },
        },
    },
    today: { type: ControlType.String, title: "Vandaag", description: "Leeg: de echte datum. Of een vaste datum (jjjj-mm-dd) om te testen." },
    button: { type: ControlType.String, title: "Knop", defaultValue: "Bestel jouw Sett", description: "Leeg: geen knop." },
    months: { type: ControlType.Boolean, title: "Maanden", defaultValue: true, enabledTitle: "Tonen", disabledTitle: "Verbergen", description: "De maandlabels boven de tijdlijn." },
    link: { type: ControlType.Link, title: "Knop link", defaultValue: "/pre-order" },
})
