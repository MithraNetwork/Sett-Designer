// Sett V2 FAQ — the Q&A page: a big header, a search box and topic chips that filter
// as you type, and the questions as a numbered accordion. A question without an
// answer is left out. The page also carries the questions as FAQ structured data
// (schema.org FAQPage), so search engines can show them.

import * as React from "react"
import { useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Arrow, V, or, linkTo } from "./SettV2Kit.tsx"

type Item = { q?: string; a?: string; cat?: string }
interface Props {
    eyebrow?: string
    headline?: string
    intro?: string
    updated?: string
    items?: Item[]
    allLabel?: string
    searchLabel?: string
    askTitle?: string
    askBody?: string
    askButton?: string
    askLink?: string
    askLinkHash?: string
    style?: React.CSSProperties
}
const CAT_COLORS = [V.lime, V.sun, V.blueLight, V.purpleLight, V.lilac, V.grey]
const CSS = `
.v2a{ padding:clamp(120px, 16vh, 170px) 0 120px; }
.v2a-head{ display:grid; grid-template-columns:1.1fr .9fr; gap:40px; align-items:end; margin-bottom:clamp(40px, 7vh, 72px); }
.v2a-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2a-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2a .v2-display{ max-width:9ch; font-size:clamp(50px, 8.4cqi, 140px); }
.v2a-updated{ margin-top:18px; }
.v2a-grid{ display:grid; grid-template-columns:320px 1fr; gap:48px; align-items:start; }
.v2a-side{ position:sticky; top:110px; display:flex; flex-direction:column; gap:18px; }
.v2a-search{ position:relative; }
.v2a-search input{ width:100%; height:52px; border-radius:999px; border:0; padding:0 20px 0 48px; font:500 16px "Sett Outfit",Outfit, system-ui; color:#F4F6FB; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.14); outline:none; }
.v2a-search input:focus{ box-shadow:inset 0 0 0 2px ${V.lime}; }
.v2a-search input::placeholder{ color:rgba(223,228,244,.45); }
.v2a-search svg{ position:absolute; left:18px; top:50%; transform:translateY(-50%); opacity:.55; }
.v2a-cats{ display:flex; flex-wrap:wrap; gap:8px; }
.v2a-cats button{ display:inline-flex; align-items:center; gap:8px; height:38px; padding:0 14px; border-radius:999px; border:0; cursor:pointer; font:600 14px "Sett Outfit",Outfit, system-ui; color:rgba(223,228,244,.8); background:rgba(223,228,244,.07); transition:background .2s, color .2s; }
.v2a-cats button i{ width:8px; height:8px; border-radius:99px; display:inline-block; }
.v2a-cats button small{ font:600 11px "Sett Mono","Geist Mono",monospace; opacity:.75; }
.v2a-cats button.on{ background:#F4F6FB; color:${V.ink}; }
.v2a-ask{ margin-top:10px; padding:24px; border-radius:24px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); display:flex; flex-direction:column; gap:12px; }
.v2a-ask b{ font-weight:800; font-size:22px; letter-spacing:-.01em; }
.v2a-list{ display:flex; flex-direction:column; }
.v2a-item{ border-top:1px solid rgba(223,228,244,.1); }
.v2a-item:last-child{ border-bottom:1px solid rgba(223,228,244,.1); }
.v2a-h{ margin:0; padding:0; font:inherit; letter-spacing:inherit; }
.v2a-q{ all:unset; box-sizing:border-box; width:100%; cursor:pointer; display:grid; grid-template-columns:48px 1fr 36px; gap:14px; align-items:center; padding:24px 0; }
.v2a-q:focus-visible{ outline:2px solid ${V.lime}; outline-offset:4px; border-radius:8px; }
.v2a-q .n{ font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.08em; color:rgba(223,228,244,.6); }
.v2a-q .t{ font-weight:700; font-size:clamp(18px, 1.7cqi, 24px); line-height:1.3; letter-spacing:-.01em; color:#F4F6FB; transition:color .2s; }
.v2a-q:hover .t{ color:${V.lime}; }
.v2a-q .pm{ position:relative; width:36px; height:36px; border-radius:99px; background:rgba(223,228,244,.08); transition:background .25s, transform .35s cubic-bezier(.2,.8,.2,1); }
.v2a-q .pm::before, .v2a-q .pm::after{ content:""; position:absolute; left:50%; top:50%; width:14px; height:2px; margin:-1px 0 0 -7px; border-radius:2px; background:#F4F6FB; transition:transform .35s cubic-bezier(.2,.8,.2,1), background .25s; }
.v2a-q .pm::after{ transform:rotate(90deg); }
.v2a-item.open .pm{ background:${V.lime}; transform:rotate(180deg); }
.v2a-item.open .pm::before, .v2a-item.open .pm::after{ background:${V.ink}; }
.v2a-item.open .pm::after{ transform:rotate(0deg); }
.v2a-a{ display:grid; grid-template-rows:0fr; transition:grid-template-rows .4s cubic-bezier(.2,.8,.2,1); }
.v2a-item.open .v2a-a{ grid-template-rows:1fr; }
.v2a-a > div{ overflow:hidden; }
.v2a-a p{ padding:0 50px 28px 62px; font-size:17px; line-height:1.65; color:rgba(223,228,244,.78); white-space:pre-line; max-width:760px; }
.v2a-a .cat{ display:inline-flex; align-items:center; gap:8px; margin:0 0 26px 62px; }
.v2a-a .cat i{ width:8px; height:8px; border-radius:99px; display:inline-block; }
.v2a-none{ padding:40px 0; color:rgba(223,228,244,.6); font-size:17px; }
.v2a-none button{ all:unset; cursor:pointer; color:${V.lime}; text-decoration:underline; }
mark{ background:rgba(141,255,102,.28); color:inherit; border-radius:3px; padding:0 2px; }
@container (max-width: 900px){
  .v2a-head{ grid-template-columns:1fr; gap:18px; }
  .v2a-grid{ grid-template-columns:1fr; gap:28px; }
  .v2a-side{ position:relative; top:auto; }
  .v2a-ask{ display:none; }
  .v2a-q{ grid-template-columns:34px 1fr 32px; gap:10px; padding:20px 0; }
  .v2a-a p{ padding:0 0 24px 44px; font-size:16px; }
  .v2a-a .cat{ margin-left:44px; }
}
`
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
// highlights the search words in a text
function hl(text: string, words: string[]) {
    if (!words.length) return text
    const re = new RegExp("(" + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi")
    return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2FAQ(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const items = (p.items || []).map((it) => ({ q: (it.q || "").trim(), a: (it.a || "").trim(), cat: (it.cat || "").trim() })).filter((it) => it.q && it.a)
    const cats = useMemo(() => [...new Set(items.map((i) => i.cat).filter(Boolean))], [items.map((i) => i.cat).join("|")])
    const [cat, setCat] = useState("")
    const [query, setQuery] = useState("")
    const [open, setOpen] = useState<number>(0)
    const words = norm(query).split(/\s+/).filter((w) => w.length > 1)
    const shown = items
        .map((it, i) => ({ ...it, i }))
        .filter((it) => (!cat || it.cat === cat) && words.every((w) => norm(it.q + " " + it.a).includes(w)))
    const color = (c: string) => CAT_COLORS[Math.max(0, cats.indexOf(c)) % CAT_COLORS.length]
    // schema.org FAQPage, so search engines can show the questions
    const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })) })
    return (
        <section className="v2 v2a" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />}
            <div className="v2-wrap">
                <div ref={head} className="v2a-head">
                    <div>
                        <div className="v2a-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Q&A")}</div>
                        <h1 className="v2-display">
                            <Lines text={or(p.headline, "Alles wat je|wilt weten.")} />
                        </h1>
                    </div>
                    <div className="v2-fade">
                        <p className="v2-lead">{or(p.intro, "Alle vragen die voorbijgekomen zijn in onze LinkedIn-post vind je hier.")}</p>
                        {p.updated !== "" && <div className="v2a-updated v2-mono v2-muted">{p.updated ?? "Laatst bijgewerkt op 30-06-2026"}</div>}
                    </div>
                </div>
                <div className="v2a-grid">
                    <aside className="v2a-side">
                        <label className="v2a-search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={or(p.searchLabel, "Zoek een vraag, bijv. grondwater")} aria-label={or(p.searchLabel, "Zoek een vraag")} />
                        </label>
                        {cats.length > 1 && (
                            <div className="v2a-cats" role="group" aria-label="Onderwerpen">
                                <button type="button" className={!cat ? "on" : ""} onClick={() => setCat("")}>
                                    {or(p.allLabel, "Alles")} <small>{items.length}</small>
                                </button>
                                {cats.map((c) => (
                                    <button key={c} type="button" className={cat === c ? "on" : ""} onClick={() => setCat(cat === c ? "" : c)}>
                                        <i style={{ background: color(c) }} />
                                        {c} <small>{items.filter((i) => i.cat === c).length}</small>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="v2a-ask">
                            <b>{or(p.askTitle, "Heb je een nieuwe vraag?")}</b>
                            <p className="v2-body">{or(p.askBody, "Stuur je vraag in en we nemen zo snel mogelijk contact met je op.")}</p>
                            <a className="v2-btn lime" href={linkTo(p.askLink, p.askLinkHash, "#formulier")}>
                                {or(p.askButton, "Stel je vraag")} <Arrow />
                            </a>
                        </div>
                    </aside>
                    <div className="v2a-list">
                        {shown.length === 0 && (
                            <p className="v2a-none">
                                Geen vraag gevonden voor “{query || cat}”.{" "}
                                <button type="button" onClick={() => (setQuery(""), setCat(""))}>
                                    Toon alle vragen
                                </button>
                            </p>
                        )}
                        {shown.map((it, k) => {
                            const isOpen = open === it.i || (words.length > 0 && k < 3)
                            return (
                                <div key={it.i} className={"v2a-item" + (isOpen ? " open" : "")}>
                                    <h3 className="v2a-h">
                                        <button type="button" className="v2a-q" aria-expanded={isOpen} aria-controls={"v2a-" + it.i} onClick={() => setOpen(open === it.i ? -1 : it.i)}>
                                            <span className="n">{String(it.i + 1).padStart(2, "0")}</span>
                                            <span className="t">{hl(it.q, words)}</span>
                                            <span className="pm" aria-hidden="true" />
                                        </button>
                                    </h3>
                                    <div className="v2a-a" id={"v2a-" + it.i} role="region">
                                        <div>
                                            <p>{hl(it.a, words)}</p>
                                            {it.cat && (
                                                <span className="cat v2-mono v2-muted">
                                                    <i style={{ background: color(it.cat) }} />
                                                    {it.cat}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2FAQ.displayName = "Sett V2 · Q&A"

addPropertyControls(SettV2FAQ, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Q&A" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Alles wat je|wilt weten." },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Alle vragen die voorbijgekomen zijn in onze LinkedIn-post vind je hier." },
    updated: { type: ControlType.String, title: "Bijgewerkt", description: "Bijv. Laatst bijgewerkt op 30-06-2026. Leeg: niet tonen.", defaultValue: "Laatst bijgewerkt op 30-06-2026" },
    items: {
        type: ControlType.Array,
        title: "Vragen",
        maxCount: 80,
        control: {
            type: ControlType.Object,
            controls: {
                q: { type: ControlType.String, title: "Vraag" },
                a: { type: ControlType.String, title: "Antwoord", displayTextArea: true },
                cat: { type: ControlType.String, title: "Onderwerp", description: "Vragen met hetzelfde onderwerp vormen samen een filter." },
            },
        },
    },
    allLabel: { type: ControlType.String, title: "Filter alles", defaultValue: "Alles" },
    searchLabel: { type: ControlType.String, title: "Zoektekst", defaultValue: "Zoek een vraag, bijv. grondwater" },
    askTitle: { type: ControlType.String, title: "Vraag-kaart titel", defaultValue: "Heb je een nieuwe vraag?" },
    askBody: { type: ControlType.String, title: "Vraag-kaart tekst", displayTextArea: true, defaultValue: "Stuur je vraag in en we nemen zo snel mogelijk contact met je op." },
    askButton: { type: ControlType.String, title: "Vraag-kaart knop", defaultValue: "Stel je vraag" },
    askLink: { type: ControlType.Link, title: "Vraag-kaart link", description: "Standaard #formulier." },
    askLinkHash: { type: ControlType.String, title: "Vraag-kaart anker", placeholder: "#formulier", description: "Een plek op de pagina, bijv. #formulier, achter de link. Zonder link: op deze pagina." },
})
