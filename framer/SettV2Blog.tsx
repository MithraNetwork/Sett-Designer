// Sett V2 Blog — the blog overview: the newest article large, the rest as cards, with a
// filter per category. The articles come from the Framer CMS collection "Blog": the
// plugin reads them and fills this list on "Alles bijwerken" (code can't read the CMS
// itself), so a new or changed article shows up after updating and publishing.

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Arrow, V, Img, or } from "./SettV2Kit.tsx"

export type Post = { title?: string; excerpt?: string; date?: string; category?: string; image?: Img; link?: string; minutes?: number }
interface Props {
    eyebrow?: string
    headline?: string
    lead?: string
    allLabel?: string
    readLabel?: string
    emptyTitle?: string
    emptyBody?: string
    emptyButton?: string
    emptyLink?: string
    posts?: Post[]
    style?: React.CSSProperties
}

// "14 okt 2026", the same on the server and in the browser
// the articles that are published right now: the site's sitemap lists every live page, and
// an article put back to draft drops out of it at once (the lists themselves are filled by
// the plugin from the CMS, so they only learn of it at its next run). Read once per visit,
// in the browser; until then, on the server and where there's no sitemap, every article counts
let liveOnce: Promise<Set<string> | null> | null = null
const pathOf = (u?: string) => {
    try {
        return new URL(u || "", "https://www.sett.nl").pathname.replace(/\/+$/, "")
    } catch {
        return ""
    }
}
export function useLive(): Set<string> | null {
    const [live, setLive] = useState<Set<string> | null>(null)
    useEffect(() => {
        if (typeof window === "undefined" || typeof fetch !== "function") return
        liveOnce ??= fetch("/sitemap.xml")
            .then((r) => (r.ok ? r.text() : ""))
            .then((t) => {
                const s = new Set([...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathOf(m[1].trim())))
                return s.size ? s : null
            })
            .catch(() => null)
        let on = true
        liveOnce.then((s) => on && setLive(s))
        return () => {
            on = false
        }
    }, [])
    return live
}
// a blog article's link that isn't in the sitemap: left out (other links always stay)
export const isLive = (live: Set<string> | null, link?: string) => !live || !/^\/blog\/./.test(pathOf(link)) || live.has(pathOf(link))

export const dateNL = (s?: string) => {
    const t = Date.parse((s || "").slice(0, 10) + "T12:00:00Z")
    return isNaN(t) ? "" : new Date(t).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}
export const meta = (p: Post) => [p.category, dateNL(p.date), p.minutes ? p.minutes + " min lezen" : ""].filter(Boolean).join(" · ")
const TINTS = [V.lime, V.sun, V.blueLight, V.purpleLight, V.lilac]

export const CARD_CSS = `
.v2bl-card{ display:flex; flex-direction:column; gap:16px; color:inherit; text-decoration:none; }
.v2bl-pic{ position:relative; aspect-ratio:16 / 10; border-radius:22px; overflow:hidden; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); }
.v2bl-pic img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .8s cubic-bezier(.2,.8,.1,1); }
.v2bl-card:hover .v2bl-pic img{ transform:scale(1.04); }
.v2bl-pic .ph{ position:absolute; inset:0; background:radial-gradient(70% 80% at 20% 10%, color-mix(in srgb, var(--t) 28%, transparent), transparent 70%), linear-gradient(135deg, ${V.ink2}, #10183a); }
.v2bl-pic .ph::after{ content:"sett"; position:absolute; right:18px; bottom:12px; font-weight:900; font-size:clamp(28px, 4cqi, 54px); letter-spacing:-.05em; color:rgba(223,228,244,.08); }
.v2bl-meta{ color:rgba(223,228,244,.6); }
.v2bl-card h3{ font-weight:800; font-size:clamp(21px, 1.8cqi, 26px); letter-spacing:-.02em; line-height:1.15; transition:color .25s; }
.v2bl-card:hover h3{ color:${V.lime}; }
.v2bl-card p{ font-size:16px; line-height:1.55; color:rgba(223,228,244,.72); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
`
const CSS = `
.v2bl{ padding:clamp(120px, 16vh, 170px) 0 clamp(90px, 12vh, 140px); }
.v2bl-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2bl-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2bl .v2-display{ font-size:clamp(46px, 7cqi, 120px); }
.v2bl-lead{ margin-top:clamp(18px, 3vh, 28px); }
.v2bl-chips{ display:flex; flex-wrap:wrap; gap:8px; margin-top:clamp(36px, 6vh, 56px); }
.v2bl-chips button{ border:0; cursor:pointer; height:40px; padding:0 16px; border-radius:999px; background:rgba(223,228,244,.07); color:rgba(223,228,244,.8); font:600 15px "Sett Outfit",Outfit,system-ui; transition:background .2s, color .2s; }
.v2bl-chips button:hover{ background:rgba(223,228,244,.14); color:#fff; }
.v2bl-chips button.on{ background:${V.lime}; color:${V.ink}; }
.v2bl-feat{ display:grid; grid-template-columns:minmax(0, 1.2fr) minmax(0, 1fr); gap:clamp(24px, 4cqi, 56px); align-items:center; margin-top:clamp(28px, 5vh, 44px); color:inherit; text-decoration:none; }
.v2bl-feat .v2bl-pic{ aspect-ratio:16 / 10; border-radius:28px; }
.v2bl-feat h2{ font-weight:800; font-size:clamp(30px, 3.6cqi, 56px); letter-spacing:-.03em; line-height:1.02; margin-top:14px; transition:color .25s; }
.v2bl-feat:hover h2{ color:${V.lime}; }
.v2bl-feat p{ margin-top:16px; font-size:clamp(17px, 1.4cqi, 20px); line-height:1.5; color:rgba(223,228,244,.75); }
.v2bl-feat .go{ margin-top:22px; display:inline-flex; align-items:center; gap:10px; font-weight:700; color:#fff; }
.v2bl-grid{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:clamp(24px, 3cqi, 40px) clamp(18px, 2cqi, 28px); margin-top:clamp(48px, 8vh, 80px); padding-top:clamp(36px, 6vh, 56px); border-top:1px solid rgba(223,228,244,.1); }
.v2bl-empty{ margin-top:clamp(36px, 6vh, 56px); padding:clamp(28px, 4cqi, 48px); border-radius:28px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); max-width:720px; }
.v2bl-empty h2{ font-weight:800; font-size:clamp(24px, 2.4cqi, 34px); letter-spacing:-.02em; }
.v2bl-empty p{ margin:12px 0 24px; color:rgba(223,228,244,.72); font-size:17px; line-height:1.5; }
${CARD_CSS}
@container (max-width: 1000px){ .v2bl-grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } .v2bl-feat{ grid-template-columns:1fr; } }
@container (max-width: 640px){ .v2bl-grid{ grid-template-columns:1fr; } }
`

// one article card (also used by "Meer artikelen"); renders nothing without an article
export function Card({ p, i = 0 }: { p?: Post; i?: number }) {
    if (!p) return null
    return (
        <a className="v2bl-card" href={p.link || "#"}>
            <div className="v2bl-pic" style={{ ["--t" as string]: TINTS[i % TINTS.length] } as React.CSSProperties}>
                {p.image?.src ? <img src={p.image.src} srcSet={p.image.srcSet} alt={p.image.alt || p.title || ""} loading="lazy" /> : <div className="ph" />}
            </div>
            <span className="v2bl-meta v2-mono">{meta(p)}</span>
            <h3>{p.title}</h3>
            {p.excerpt && <p>{p.excerpt}</p>}
        </a>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Blog(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const live = useLive()
    const posts = useMemo(() => (p.posts || []).filter((x) => (x.title || "").trim() && isLive(live, x.link)).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [p.posts, live])
    const cats = useMemo(() => [...new Set(posts.map((x) => (x.category || "").trim()).filter(Boolean))], [posts])
    const [cat, setCat] = useState("")
    const shown = cat ? posts.filter((x) => x.category === cat) : posts
    const [first, ...rest] = shown
    return (
        <section className="v2 v2bl" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div ref={head}>
                    <div className="v2bl-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Blog")}</div>
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "Nieuws en|achtergronden.")} />
                    </h1>
                    <p className="v2bl-lead v2-lead v2-fade">{or(p.lead, "Updates van het team, uitleg over energieopslag en netcongestie, en hoe het gaat met de eerste batch Setts.")}</p>
                </div>

                {!posts.length ? (
                    <div className="v2bl-empty">
                        <h2>{or(p.emptyTitle, "Binnenkort de eerste artikelen.")}</h2>
                        <p>{or(p.emptyBody, "We schrijven hier over Sett, energieopslag en de weg naar de eerste batch. Wil je niet wachten? Plan een gesprek met ons team.")}</p>
                        <a className="v2-btn lime" href={or(p.emptyLink, "/contact#afspraak")}>
                            {or(p.emptyButton, "Plan een gesprek")} <Arrow />
                        </a>
                    </div>
                ) : (
                    <>
                        {cats.length > 1 && (
                            <div className="v2bl-chips" role="group" aria-label="Categorie">
                                <button type="button" className={cat ? "" : "on"} onClick={() => setCat("")}>
                                    {or(p.allLabel, "Alles")}
                                </button>
                                {cats.map((c) => (
                                    <button key={c} type="button" className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                        {first && (
                            <a className="v2bl-feat" href={first.link || "#"}>
                                <div className="v2bl-pic" style={{ ["--t" as string]: TINTS[0] } as React.CSSProperties}>
                                    {first.image?.src ? <img src={first.image.src} srcSet={first.image.srcSet} alt={first.image.alt || first.title || ""} /> : <div className="ph" />}
                                </div>
                                <div>
                                    <span className="v2bl-meta v2-mono">{meta(first)}</span>
                                    <h2>{first.title}</h2>
                                    {first.excerpt && <p>{first.excerpt}</p>}
                                    <span className="go">
                                        {or(p.readLabel, "Lees het artikel")} <Arrow />
                                    </span>
                                </div>
                            </a>
                        )}
                        {rest.length > 0 && (
                            <div className="v2bl-grid">
                                {rest.map((x, i) => (
                                    <Card key={x.link || i} p={x} i={i + 1} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}

SettV2Blog.displayName = "Sett V2 · Blog"

export const POST_CONTROLS = {
    type: ControlType.Array,
    title: "Artikelen",
    maxCount: 200,
    description: "Gevuld door de plugin uit de CMS-collectie Blog (Alles bijwerken).",
    control: {
        type: ControlType.Object,
        controls: {
            title: { type: ControlType.String, title: "Titel" },
            excerpt: { type: ControlType.String, title: "Samenvatting", displayTextArea: true },
            date: { type: ControlType.String, title: "Datum" },
            category: { type: ControlType.String, title: "Categorie" },
            image: { type: ControlType.ResponsiveImage, title: "Afbeelding" },
            link: { type: ControlType.String, title: "Link", description: "Bv. /blog/mijn-artikel" },
            minutes: { type: ControlType.Number, title: "Leestijd", min: 0, max: 120 },
        },
    },
} as const

addPropertyControls(SettV2Blog, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Blog" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Nieuws en|achtergronden." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Updates van het team, uitleg over energieopslag en netcongestie, en hoe het gaat met de eerste batch Setts." },
    allLabel: { type: ControlType.String, title: "Filter alles", defaultValue: "Alles" },
    readLabel: { type: ControlType.String, title: "Lees verder", defaultValue: "Lees het artikel" },
    emptyTitle: { type: ControlType.String, title: "Leeg: kop", defaultValue: "Binnenkort de eerste artikelen." },
    emptyBody: { type: ControlType.String, title: "Leeg: tekst", displayTextArea: true, defaultValue: "We schrijven hier over Sett, energieopslag en de weg naar de eerste batch. Wil je niet wachten? Plan een gesprek met ons team." },
    emptyButton: { type: ControlType.String, title: "Leeg: knop", defaultValue: "Plan een gesprek" },
    emptyLink: { type: ControlType.Link, title: "Leeg: knop link", defaultValue: "/contact#afspraak" },
    posts: POST_CONTROLS as never,
})
