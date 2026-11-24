// Sett V2 Day Cycle — "een dag op het net". The section pins and scrolling
// runs the clock through a day, twice: first without Sett (midday solar pushed
// into a full grid, the evening peak bought at full price), then with Sett (the
// surplus fills the battery, the evening runs on it). A live clock, the sun on
// its arc, a battery gauge and running totals follow the cursor. Tap the
// toggle to compare at any time. Numbers come from a small illustrative model.
//   mode "huis":    a home with solar panels and an EV
//   mode "bedrijf": a business with a grid limit — the Sett shaves the peaks

import * as React from "react"
import { useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, useProgress, range, V, or } from "./SettV2Kit.tsx"

type Mode = "huis" | "bedrijf"
interface Props {
    mode?: Mode
    label?: string
    title?: string
    intro?: string
    without?: string
    withSett?: string
    footnote?: string
    style?: React.CSSProperties
}

const N = 241 // 0.1 h steps over 24 h
const gauss = (x: number, m: number, s: number) => Math.exp(-(((x - m) / s) ** 2))
function model(mode: Mode) {
    const home = mode === "huis"
    const cap = 96 // kWh
    const limit = home ? 99 : 38 // kW grid limit (bedrijf)
    const solar: number[] = [], demand: number[] = []
    for (let i = 0; i < N; i++) {
        const h = i / 10
        const s = h > 6 && h < 20.5 ? Math.pow(Math.sin((Math.PI * (h - 6)) / 14.5), 1.6) : 0
        if (home) {
            solar.push(4.6 * s)
            demand.push(0.35 + 0.9 * gauss(h, 7.6, 1.1) + 0.4 * gauss(h, 12.5, 1.5) + 2.6 * gauss(h, 18.6, 1.4) + 1.3 * gauss(h, 20.6, 1.2))
        } else {
            solar.push(34 * s)
            // a working day: a morning start-up peak, a lunch dip, machines and chargers at the end of the day
            demand.push(8 + 34 * gauss(h, 9.3, 1.4) + 26 * gauss(h, 14.6, 1.6) + 28 * gauss(h, 17.1, 1.0) - 12 * gauss(h, 12.4, 0.8) + (h > 7 && h < 18.5 ? 12 : 0))
        }
    }
    // without Sett: whatever solar can't use goes to the grid, the rest comes from it
    const exp0 = solar.map((s, i) => Math.max(0, s - demand[i]))
    const imp0 = solar.map((s, i) => Math.max(0, demand[i] - s))
    // with Sett: surplus charges the battery; shortfall (above the limit for a business) comes out of it
    const exp1: number[] = [], imp1: number[] = [], chg: number[] = [], dis: number[] = [], soc: number[] = []
    let e = cap * 0.35
    for (let i = 0; i < N; i++) {
        const dt = 0.1
        const net = demand[i] - solar[i]
        let c = 0, d = 0, im = 0, ex = 0
        if (net < 0) {
            c = Math.min(-net, (cap - e) / dt, 50)
            ex = -net - c
        } else {
            const want = home ? net : Math.max(0, net - limit * 0.62)
            d = Math.min(want, e / dt, 50)
            im = net - d
        }
        e += (c - d) * dt
        chg.push(c)
        dis.push(d)
        imp1.push(im)
        exp1.push(ex)
        soc.push(e / cap)
    }
    const cum = (a: number[]) => a.reduce<number[]>((o, v, i) => (o.push((o[i - 1] ?? 0) + v * 0.1), o), [])
    // what counts as "peak": the evening for a home, above the limit for a business
    const peak = (imp: number[]) => imp.map((v, i) => (home ? (i >= 170 && i <= 220 ? v : 0) : Math.max(0, v - limit * 0.62)))
    return { home, limit, solar, demand, exp0, imp0, exp1, imp1, chg, dis, soc, cExp0: cum(exp0), cExp1: cum(exp1), cPeak0: cum(peak(imp0)), cPeak1: cum(peak(imp1)), cOwn: cum(dis), max: home ? 6 : 80 }
}

const W = 1000, H = 440, PADL = 40, PADB = 34
// in and out of the Sett: one fill, the palette green of the legend and the battery bar
const GREEN = "rgba(141,255,102,.78)"
const X = (i: number) => PADL + ((W - PADL) * i) / (N - 1)
function area(top: number[], bottom: number[] | null, max: number) {
    const Y = (v: number) => H - PADB - ((H - PADB - 10) * v) / max
    let d = `M${X(0)},${Y(bottom ? bottom[0] : 0)}`
    for (let i = 0; i < N; i++) d += `L${X(i).toFixed(1)},${Y((bottom ? bottom[i] : 0) + top[i]).toFixed(1)}`
    for (let i = N - 1; i >= 0; i--) d += `L${X(i).toFixed(1)},${Y(bottom ? bottom[i] : 0).toFixed(1)}`
    return d + "Z"
}
function line(v: number[], max: number) {
    const Y = (x: number) => H - PADB - ((H - PADB - 10) * x) / max
    return v.map((x, i) => (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(x).toFixed(1)).join("")
}

const CSS = `
.v2d-stage{ position:sticky; top:0; height:100vh; min-height:560px; display:flex; flex-direction:column; justify-content:center; padding:clamp(72px, 13vh, 96px) 0 clamp(16px, 4vh, 40px); }
.v2d-head{ display:grid; grid-template-columns:1.3fr .7fr; gap:40px; align-items:end; margin-bottom:clamp(10px, 2.6vh, 26px); }
.v2d-clock{ font-weight:900; font-size:clamp(44px, min(7cqi, 13vh), 120px); letter-spacing:-0.05em; line-height:.85; font-variant-numeric:tabular-nums; text-align:right; }
.v2d-toggle{ display:inline-flex; padding:5px; border-radius:999px; background:rgba(11,14,26,.07); gap:4px; margin-top:clamp(10px, 2.4vh, 22px); }
.v2d-toggle button{ border:0; background:transparent; padding:11px 18px; border-radius:999px; font:700 15px "Sett Outfit",Outfit,system-ui; color:rgba(11,14,26,.6); cursor:pointer; transition:background .3s, color .3s; }
.v2d-toggle button.on{ background:${V.paperInk}; color:#fff; }
.v2d-body{ display:grid; grid-template-columns:1fr 260px; gap:32px; align-items:stretch; }
.v2d-chart{ position:relative; }
.v2d-chart svg{ display:block; width:100%; height:auto; max-height:min(46vh, calc(100vh - 450px)); min-height:140px; overflow:visible; }
.v2d-kpis{ display:flex; flex-direction:column; gap:14px; }
.v2d-kpi{ border-top:1px solid rgba(11,14,26,.14); padding-top:12px; }
.v2d-kpi b{ display:block; font-weight:800; font-size:34px; letter-spacing:-0.03em; font-variant-numeric:tabular-nums; }
.v2d-legend{ display:flex; flex-wrap:wrap; gap:18px; margin-top:16px; }
.v2d-legend span{ display:inline-flex; align-items:center; gap:8px; }
.v2d-legend i{ width:12px; height:12px; border-radius:3px; display:inline-block; }
.v2d-batt{ height:12px; border-radius:99px; background:rgba(11,14,26,.08); overflow:hidden; margin-top:8px; }
.v2d-batt i{ display:block; height:100%; background:${V.green}; border-radius:99px; transition:width .15s linear; }
.v2d-foot{ margin-top:18px; }
.v2d-sit{ text-align:right; margin-top:10px; }
@media (max-height: 720px){ .v2d-kpis{ gap:8px; } .v2d-kpi{ padding-top:8px; } .v2d-kpi b{ font-size:26px; } .v2d-foot{ margin-top:10px; } }
@container (max-width: 1000px){ .v2d-body{ grid-template-columns:1fr; } .v2d-kpis{ flex-direction:row; flex-wrap:wrap; } .v2d-kpi{ flex:1 1 140px; } }
@container (max-width: 809px){ .v2d-head{ grid-template-columns:1fr; gap:8px; } .v2d-clock, .v2d-sit{ text-align:left; } .v2d-stage{ padding-top:72px; padding-bottom:12px; } .v2d-kpis{ gap:8px 14px; } .v2d-kpi{ padding-top:8px; } .v2d-kpi b{ font-size:24px; } .v2d-legend{ gap:10px 14px; margin-top:10px; } .v2d-foot{ margin-top:10px; } }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2DayCycle(props: Props) {
    const p = props
    const mode: Mode = or(p.mode, "huis")
    const M = useMemo(() => model(mode), [mode])
    const root = useRef<HTMLDivElement>(null)
    const t = useProgress(root, "pin", 0.75)
    const [manual, setManual] = useState<null | boolean>(null)
    // two passes through the day: without, then with Sett
    const auto = t >= 0.5
    const withSett = manual ?? auto
    const pass = manual === null ? (t < 0.5 ? range(t, 0.02, 0.46) : range(t, 0.54, 0.98)) : range(t, 0.02, 0.98)
    const hour = 5 + pass * 18.5 // 05:00 → 23:30
    const idx = Math.max(0, Math.min(N - 1, Math.round(hour * 10)))
    const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 6) * 10
    const clock = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0")
    const cx = X(idx)
    const max = M.max
    const Y = (v: number) => H - PADB - ((H - PADB - 10) * v) / max
    // the sun (or moon) on an arc over the chart
    const day = hour > 6 && hour < 20.5
    const sunA = Math.PI * (1 - Math.min(1, Math.max(0, (hour - 6) / 14.5)))
    const sunX = PADL + (W - PADL) * (0.5 + 0.46 * Math.cos(sunA)), sunY = 70 - 52 * Math.sin(sunA)
    const exported = (withSett ? M.cExp1 : M.cExp0)[idx]
    const peak = (withSett ? M.cPeak1 : M.cPeak0)[idx]
    const own = withSett ? M.cOwn[idx] : 0
    const fmt = (v: number) => (v >= 100 ? Math.round(v) : v.toFixed(1)).toString().replace(".", ",") + " kWh"
    const clipW = cx - PADL
    const ticks = [6, 9, 12, 15, 18, 21]
    return (
        <section ref={root} className="v2 paper" style={{ height: "340vh", ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2d-stage">
                <div className="v2-wrap">
                    <div className="v2d-head">
                        <div>
                            <div className="v2-mono v2-muted" style={{ marginBottom: 16 }}>
                                {or(p.label, "Een dag op het net")} · {withSett ? "2 / 2" : "1 / 2"}
                            </div>
                            <h2 className="v2-h2" style={{ fontSize: "clamp(26px, min(3.6cqi, 6.4vh), 58px)", maxWidth: "20ch" }}>
                                {withSett ? or(p.withSett, "Met Sett: de zon van vanmiddag, vanavond in je stopcontact.") : or(p.without, "Zonder Sett: twee pieken, en jij betaalt allebei.")}
                            </h2>
                            <div className="v2d-toggle" role="group" aria-label="Vergelijk">
                                <button type="button" className={!withSett ? "on" : ""} onClick={() => setManual(false)}>
                                    Zonder Sett
                                </button>
                                <button type="button" className={withSett ? "on" : ""} onClick={() => setManual(true)}>
                                    Met Sett
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="v2d-clock" aria-live="off">
                                {clock}
                            </div>
                            <p className="v2-body v2d-sit">
                                {p.intro ?? (M.home ? "Een huis met zonnepanelen en een elektrische auto." : "Een bedrijfspand op het industrieterrein, met een beperkte aansluiting.")}
                            </p>
                        </div>
                    </div>
                    <div className="v2d-body">
                        <div className="v2d-chart">
                            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Stroom door de dag">
                                <defs>
                                    <clipPath id={"v2dclip" + mode}>
                                        <rect x={PADL} y={-100} width={Math.max(0, clipW)} height={H + 200} />
                                    </clipPath>
                                    <pattern id={"v2dhatch" + mode} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                        <rect width="8" height="8" fill="rgba(43,140,255,.14)" />
                                        <line x1="0" y1="0" x2="0" y2="8" stroke={V.blue} strokeWidth="3" />
                                    </pattern>
                                </defs>
                                {/* hour grid */}
                                {ticks.map((h) => (
                                    <g key={h}>
                                        <line x1={X(h * 10)} x2={X(h * 10)} y1={10} y2={H - PADB} stroke="rgba(11,14,26,.08)" />
                                        <text x={X(h * 10)} y={H - 10} textAnchor="middle" fontFamily="Sett Mono, Geist Mono, monospace" fontSize="12" fill="rgba(11,14,26,.5)">
                                            {String(h).padStart(2, "0")}:00
                                        </text>
                                    </g>
                                ))}
                                <line x1={PADL} x2={W} y1={H - PADB} y2={H - PADB} stroke="rgba(11,14,26,.3)" />
                                {!M.home && (
                                    <g>
                                        <path d={line(M.solar.map((s) => s + M.limit * 0.62), max)} fill="none" stroke={V.blue} strokeDasharray="6 6" strokeWidth="2" />
                                        <text x={PADL + 6} y={Y(M.limit * 0.62) - 8} textAnchor="start" fontFamily="Sett Mono, Geist Mono, monospace" fontSize="12" fill={V.blue}>
                                            NETLIMIET + JE EIGEN ZON
                                        </text>
                                    </g>
                                )}
                                <g clipPath={`url(#v2dclip${mode})`}>
                                    {/* solar and demand */}
                                    <path d={area(M.solar, null, max)} fill="rgba(255,185,43,.35)" />
                                    <path d={line(M.solar, max)} fill="none" stroke={V.sun} strokeWidth="3" />
                                    {/* without: surplus into the full grid, evening bought in; with: into and out of the Sett */}
                                    <path d={area(withSett ? M.chg : M.exp0, M.demand.map((d, i) => Math.min(d, M.solar[i])), max)} fill={withSett ? GREEN : `url(#v2dhatch${mode})`} style={{ transition: "fill .4s" }} />
                                    <path d={area(
                                        withSett ? M.dis : M.imp0.map((v, i) => (M.home ? (i >= 170 && i <= 220 ? v : 0) : Math.max(0, v - M.limit * 0.62))),
                                        // (a home's purple is the evening peak only, 17:00–22:00, as its total counts)
                                        // with: the gap the battery fills; without: a home's evening import, a business's use above connection + sun
                                        withSett ? M.demand.map((d, i) => d - M.dis[i]) : M.imp0.map((v, i) => (M.home ? M.solar[i] : Math.min(M.demand[i], M.solar[i] + M.limit * 0.62))),
                                        max
                                    )} fill={withSett ? GREEN : "rgba(154,108,233,.55)"} style={{ transition: "fill .4s" }} />
                                    <path d={line(M.demand, max)} fill="none" stroke={V.paperInk} strokeWidth="2.5" />
                                </g>
                                {/* the time cursor */}
                                <line x1={cx} x2={cx} y1={10} y2={H - PADB} stroke={V.paperInk} strokeWidth="1.5" />
                                <circle cx={cx} cy={Y(M.demand[idx])} r="6" fill={V.paperInk} />
                                {/* sun / moon */}
                                <g transform={`translate(${day ? sunX : cx},${day ? sunY : 40})`}>
                                    {day ? <circle r="14" fill={V.sun} /> : <path d="M6 -12a13 13 0 1 0 6 23a10 10 0 1 1 -6 -23z" fill={V.paperInk} />}
                                </g>
                            </svg>
                            <div className="v2d-legend v2-mono v2-muted">
                                <span>
                                    <i style={{ background: V.sun }} />
                                    Zonnestroom
                                </span>
                                <span>
                                    <i style={{ background: V.paperInk }} />
                                    Verbruik
                                </span>
                                {withSett ? (
                                    <span>
                                        <i style={{ background: V.green }} />
                                        In / uit je Sett
                                    </span>
                                ) : (
                                    <>
                                        <span>
                                            <i style={{ background: V.blue }} />
                                            {M.home ? "Terug naar een vol net" : "Terug naar het net"}
                                        </span>
                                        <span>
                                            <i style={{ background: V.purple }} />
                                            {M.home ? "Duur ingekocht in de avondpiek" : "Boven je netlimiet"}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="v2d-kpis">
                            <div className="v2d-kpi">
                                <span className="v2-mono v2-muted">Teruggeleverd</span>
                                <b style={{ color: withSett ? V.paperInk : V.blue }}>{fmt(exported)}</b>
                            </div>
                            <div className="v2d-kpi">
                                <span className="v2-mono v2-muted">{M.home ? "Ingekocht in de piek" : "Boven de limiet"}</span>
                                <b style={{ color: withSett ? V.paperInk : V.purple }}>{fmt(peak)}</b>
                            </div>
                            <div className="v2d-kpi">
                                <span className="v2-mono v2-muted">Uit je eigen Sett</span>
                                <b style={{ color: V.paperInk }}>{fmt(own)}</b>
                            </div>
                            <div className="v2d-kpi">
                                <span className="v2-mono v2-muted">Sett · 96 kWh</span>
                                <div className="v2d-batt">
                                    <i style={{ width: (withSett ? M.soc[idx] : 0) * 100 + "%" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="v2d-foot v2-mono v2-muted" style={{ fontSize: 11 }}>
                        {or(p.footnote, "Illustratief rekenvoorbeeld, geen meetdata. We rekenen jouw situatie graag door.")}
                    </p>
                </div>
            </div>
        </section>
    )
}

SettV2DayCycle.displayName = "Sett V2 · Dag op het net"

addPropertyControls(SettV2DayCycle, {
    mode: { type: ControlType.Enum, title: "Situatie", options: ["huis", "bedrijf"], optionTitles: ["Huis", "Bedrijf"], defaultValue: "huis" },
    label: { type: ControlType.String, title: "Label", defaultValue: "Een dag op het net" },
    without: { type: ControlType.String, title: "Kop zonder", displayTextArea: true, defaultValue: "Zonder Sett: twee pieken, en jij betaalt allebei." },
    withSett: { type: ControlType.String, title: "Kop met", displayTextArea: true, defaultValue: "Met Sett: de zon van vanmiddag, vanavond in je stopcontact." },
    intro: { type: ControlType.String, title: "Situatie tekst", displayTextArea: true },
    footnote: { type: ControlType.String, title: "Voetnoot", displayTextArea: true, defaultValue: "Illustratief rekenvoorbeeld, geen meetdata. We rekenen jouw situatie graag door." },
})
