// Sett V2 Article — one blog article: category, date and reading time, the title, the
// summary, the image, then the text in a calm reading column, and three more articles at
// the end. On the CMS page /blog/:slug its fields are connected to the collection "Blog"
// (the text itself is Framer's own formatted-text layer under it, connected to "Inhoud";
// without "Tekst (HTML)" this shows the head only). "Meer artikelen" leaves out the article
// you're on. The page also tells search engines it is an article (schema.org).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import * as Framer from "framer"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, Arrow, V, Img, or } from "./SettV2Kit.tsx"
import { Card, CARD_CSS, dateNL, meta, POST_CONTROLS, useLive, isLive, type Post } from "./SettV2Blog.tsx"

type Full = Post & { slug?: string; html?: string }
interface Props {
    posts?: Full[]
    title?: string
    excerpt?: string
    date?: string | Date
    category?: string
    minutes?: number
    image?: Img
    html?: string
    url?: string
    backLabel?: string
    backLink?: string
    moreTitle?: string
    more?: Post[]
    style?: React.CSSProperties
}

const CSS = `
.v2ar{ padding:clamp(120px, 16vh, 160px) 0 clamp(80px, 11vh, 130px); }
.v2ar-head{ max-width:920px; }
.v2ar-back{ display:flex; width:fit-content; align-items:center; gap:8px; color:rgba(223,228,244,.7); font-weight:600; font-size:15px; margin-bottom:28px; }
.v2ar-back:hover{ color:#fff; }
.v2ar-meta{ display:inline-flex; align-items:center; gap:10px; color:${V.lime}; }
.v2ar-meta::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2ar h1{ margin-top:18px; font-weight:900; letter-spacing:-.04em; line-height:.98; font-size:clamp(40px, 5.6cqi, 92px); }
.v2ar-lead{ margin-top:22px; }
.v2ar-pic{ position:relative; margin-top:clamp(36px, 6vh, 60px); aspect-ratio:16 / 8; border-radius:30px; overflow:hidden; background:${V.ink2}; }
.v2ar-pic img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }

/* the article text: a calm reading column */
.v2ar-body{ max-width:720px; margin:clamp(40px, 7vh, 72px) auto 0; font-size:clamp(18px, 1.3cqi, 20px); line-height:1.75; color:rgba(223,228,244,.86); }
.v2ar-body > * + *{ margin-top:1.1em; }
.v2ar-body h1, .v2ar-body h2{ margin-top:1.8em; font-weight:800; font-size:clamp(26px, 2.4cqi, 34px); line-height:1.15; letter-spacing:-.02em; color:#fff; }
.v2ar-body h3, .v2ar-body h4{ margin-top:1.6em; font-weight:800; font-size:clamp(21px, 1.8cqi, 24px); line-height:1.25; color:#fff; }
.v2ar-body a{ color:${V.lime}; text-decoration:underline; text-underline-offset:3px; }
.v2ar-body strong, .v2ar-body b{ color:#fff; font-weight:700; }
.v2ar-body ul, .v2ar-body ol{ padding-left:1.3em; }
.v2ar-body ul{ list-style:disc; } .v2ar-body ol{ list-style:decimal; }
.v2ar-body li + li{ margin-top:.4em; }
.v2ar-body li::marker{ color:${V.lime}; }
.v2ar-body blockquote{ margin-left:0; padding:6px 0 6px 22px; border-left:3px solid ${V.lime}; font-size:1.12em; color:#fff; }
.v2ar-body img{ display:block; max-width:100%; height:auto; border-radius:20px; }
.v2ar-body figure{ margin:1.6em 0; }
.v2ar-body figcaption{ margin-top:8px; font-size:14px; color:rgba(223,228,244,.55); }
.v2ar-body hr{ border:0; height:1px; background:rgba(223,228,244,.14); margin:2em 0; }
.v2ar-body code{ font-family:"Sett Mono","Geist Mono",monospace; font-size:.88em; padding:2px 6px; border-radius:6px; background:rgba(223,228,244,.08); }
.v2ar-body pre{ overflow:auto; padding:16px 18px; border-radius:16px; background:${V.ink2}; }
.v2ar-body pre code{ padding:0; background:none; }
.v2ar-body table{ width:100%; border-collapse:collapse; font-size:.9em; }
.v2ar-body th, .v2ar-body td{ text-align:left; padding:10px 12px; border-bottom:1px solid rgba(223,228,244,.12); }

.v2ar-more{ margin-top:clamp(70px, 11vh, 120px); padding-top:clamp(36px, 6vh, 56px); border-top:1px solid rgba(223,228,244,.1); }
.v2ar-more-head{ display:flex; justify-content:space-between; align-items:baseline; gap:16px; flex-wrap:wrap; margin-bottom:28px; }
.v2ar-more-head h2{ font-weight:800; font-size:clamp(26px, 2.6cqi, 40px); letter-spacing:-.02em; }
.v2ar-more-head a{ display:inline-flex; align-items:center; gap:10px; font-weight:700; color:rgba(223,228,244,.8); }
.v2ar-more-head a:hover{ color:#fff; }
.v2ar-grid{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:clamp(18px, 2cqi, 28px); }
${CARD_CSS}
@container (max-width: 1000px){ .v2ar-grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@container (max-width: 640px){ .v2ar-grid{ grid-template-columns:1fr; } .v2ar-pic{ aspect-ratio:4 / 3; border-radius:22px; } }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
// the CMS page's slug: from Framer's router (known on the server too, so the article is in
// the page's HTML), else from the address once the page runs. Framer names the address's
// variable after the slug field's id (/blog/:lveQGCZ5U), so its value is taken whatever its
// name, preferring one that is a known article
const useRouterSafe: () => { currentPathVariables?: Record<string, string> } | null = ((Framer as unknown as { useRouter?: () => never }).useRouter as never) || (() => null)
function useSlug(known: string[]) {
    let fromRouter = ""
    try {
        const vars = Object.values(useRouterSafe()?.currentPathVariables || {}).filter((v): v is string => typeof v === "string" && !!v)
        fromRouter = vars.find((v) => known.includes(v)) || vars[0] || ""
    } catch {
        /* no router here */
    }
    const [fromUrl, setFromUrl] = useState("")
    useEffect(() => {
        if (!fromRouter && typeof window !== "undefined") setFromUrl(decodeURIComponent(window.location.pathname.replace(/\/+$/, "").split("/").pop() || ""))
    }, [fromRouter])
    return fromRouter || fromUrl
}

// a date from the CMS (an ISO date-time) or typed (jjjj-mm-dd), as jjjj-mm-dd
const toDay = (v?: string | Date) => (v instanceof Date ? v.toISOString() : String(v || "")).slice(0, 10)

export default function SettV2Article(props: Props) {
    // on the CMS page: the article for this address, from the list the plugin keeps; fields
    // connected to the CMS (or typed in) go first
    const slugOf = (x: Full) => x.slug || (x.link || "").replace(/\/+$/, "").split("/").pop() || ""
    const slug = useSlug((props.posts || []).map(slugOf))
    const found = (props.posts || []).find((x) => x.slug === slug || (x.link || "").replace(/\/+$/, "").split("/").pop() === slug)
    const pick = <K extends keyof Props>(k: K, v: unknown) => (props[k] !== undefined && props[k] !== "" && props[k] !== null ? props[k] : v) as Props[K]
    const p: Props = { ...props, title: pick("title", found?.title), excerpt: pick("excerpt", found?.excerpt), date: pick("date", found?.date), category: pick("category", found?.category), minutes: pick("minutes", found?.minutes), image: props.image?.src ? props.image : found?.image, html: pick("html", found?.html), url: pick("url", found?.link ? "https://www.sett.nl" + found.link : undefined) }
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const date = toDay(p.date)
    const post: Post = { title: p.title, date, category: p.category, minutes: p.minutes }
    // the others: leave out the article on this address (known once the page runs)
    const [here, setHere] = useState("")
    useEffect(() => setHere(typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") : ""), [])
    const live = useLive()
    const more = (p.more || []).filter((x) => (x.title || "").trim() && (x.link || "").replace(/\/+$/, "") !== here && isLive(live, x.link)).slice(0, 3)
    // for search engines: this page is an article
    const ld = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: p.title || "",
        description: p.excerpt || "",
        datePublished: date || undefined,
        image: p.image?.src ? [p.image.src] : undefined,
        mainEntityOfPage: p.url || undefined,
        author: { "@type": "Organization", name: "Sett" },
        publisher: { "@type": "Organization", name: "Sett", url: "https://www.sett.nl" },
    }).replace(/</g, "\\u003c")
    // and where it sits: Home › Blog › this article (the menu leaves blog articles to this)
    const trail = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.sett.nl/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.sett.nl/blog" },
            { "@type": "ListItem", position: 3, name: p.title || "", item: p.url || undefined },
        ],
    }).replace(/</g, "\\u003c")
    return (
        <section className="v2 v2ar" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            {p.title && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />}
            {p.title && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: trail }} />}
            <div className="v2-wrap">
                <div ref={head} className="v2ar-head">
                    <a className="v2ar-back" href={or(p.backLink, "/blog")}>
                        ← {or(p.backLabel, "Alle artikelen")}
                    </a>
                    <div className="v2ar-meta v2-mono v2-fade">{meta(post) || dateNL(date)}</div>
                    <h1>
                        <Lines text={or(p.title, "Artikel")} />
                    </h1>
                    {p.excerpt && <p className="v2ar-lead v2-lead v2-fade">{p.excerpt}</p>}
                </div>
                {p.image?.src && (
                    <div className="v2ar-pic">
                        <img src={p.image.src} srcSet={p.image.srcSet} alt={p.image.alt || p.title || ""} />
                    </div>
                )}
                {p.html && <div className="v2ar-body" dangerouslySetInnerHTML={{ __html: p.html }} />}

                {more.length > 0 && (
                    <div className="v2ar-more">
                        <div className="v2ar-more-head">
                            <h2>{or(p.moreTitle, "Meer artikelen")}</h2>
                            <a href={or(p.backLink, "/blog")}>
                                {or(p.backLabel, "Alle artikelen")} <Arrow />
                            </a>
                        </div>
                        <div className="v2ar-grid">
                            {more.map((x, i) => (
                                <Card key={x.link || i} p={x} i={i + 1} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

SettV2Article.displayName = "Sett V2 · Artikel"

addPropertyControls(SettV2Article, {
    posts: {
        type: ControlType.Array,
        title: "Artikelen",
        maxCount: 500,
        description: "Gevuld door de plugin uit de CMS-collectie Blog. Op de CMS-pagina toont dit het artikel van het adres.",
        control: {
            type: ControlType.Object,
            controls: {
                slug: { type: ControlType.String, title: "Slug" },
                title: { type: ControlType.String, title: "Titel" },
                excerpt: { type: ControlType.String, title: "Samenvatting", displayTextArea: true },
                date: { type: ControlType.String, title: "Datum" },
                category: { type: ControlType.String, title: "Categorie" },
                image: { type: ControlType.ResponsiveImage, title: "Afbeelding" },
                html: { type: ControlType.String, title: "Tekst (HTML)", displayTextArea: true },
                link: { type: ControlType.String, title: "Link" },
                minutes: { type: ControlType.Number, title: "Leestijd", min: 0, max: 120 },
            },
        },
    } as never,
    title: { type: ControlType.String, title: "Titel" },
    excerpt: { type: ControlType.String, title: "Samenvatting", displayTextArea: true },
    date: { type: ControlType.Date, title: "Datum" },
    category: { type: ControlType.String, title: "Categorie" },
    minutes: { type: ControlType.Number, title: "Leestijd", min: 0, max: 120 },
    image: { type: ControlType.ResponsiveImage, title: "Afbeelding" },
    html: { type: ControlType.String, title: "Tekst (HTML)", displayTextArea: true, description: "Leeg op de CMS-pagina: daar staat de tekst als opgemaakte tekst onder deze kop." },
    url: { type: ControlType.String, title: "Adres", description: "Voor zoekmachines, bv. https://www.sett.nl/blog/…" },
    backLabel: { type: ControlType.String, title: "Terug-tekst", defaultValue: "Alle artikelen" },
    backLink: { type: ControlType.Link, title: "Terug-link", defaultValue: "/blog" },
    moreTitle: { type: ControlType.String, title: "Meer-kop", defaultValue: "Meer artikelen" },
    more: { ...POST_CONTROLS, title: "Meer artikelen", maxCount: 3 } as never,
})
