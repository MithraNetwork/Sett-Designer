// Sett V2 Related — "Meer artikelen" under a blog article: the three newest articles
// besides the one you're on (read from the address). On the CMS page /blog/:slug; the
// plugin keeps its list up to date from the collection "Blog" on "Alles bijwerken".

import * as React from "react"
import { useEffect, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Arrow, or } from "./SettV2Kit.tsx"
import { Card, CARD_CSS, POST_CONTROLS, useLive, isLive, type Post } from "./SettV2Blog.tsx"

interface Props {
    title?: string
    allLabel?: string
    allLink?: string
    posts?: Post[]
    style?: React.CSSProperties
}

const CSS = `
.v2rl{ padding:clamp(40px, 7vh, 80px) 0 clamp(80px, 11vh, 120px); }
.v2rl-in{ padding-top:clamp(36px, 6vh, 56px); border-top:1px solid rgba(223,228,244,.1); }
.v2rl-head{ display:flex; justify-content:space-between; align-items:baseline; gap:16px; flex-wrap:wrap; margin-bottom:28px; }
.v2rl-head h2{ font-weight:800; font-size:clamp(26px, 2.6cqi, 40px); letter-spacing:-.02em; }
.v2rl-head a{ display:inline-flex; align-items:center; gap:10px; font-weight:700; color:rgba(223,228,244,.8); }
.v2rl-head a:hover{ color:#fff; }
.v2rl-grid{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:clamp(18px, 2cqi, 28px); }
${CARD_CSS}
@container (max-width: 1000px){ .v2rl-grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@container (max-width: 640px){ .v2rl-grid{ grid-template-columns:1fr; } }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Related(props: Props) {
    const p = props
    const [here, setHere] = useState("")
    useEffect(() => setHere(typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") : ""), [])
    const live = useLive()
    const posts = (p.posts || [])
        .filter((x) => (x.title || "").trim() && (x.link || "").replace(/\/+$/, "") !== here && isLive(live, x.link))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 3)
    if (!posts.length) return null
    return (
        <section className="v2 v2rl" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div className="v2rl-in">
                    <div className="v2rl-head">
                        <h2>{or(p.title, "Meer artikelen")}</h2>
                        <a href={or(p.allLink, "/blog")}>
                            {or(p.allLabel, "Alle artikelen")} <Arrow />
                        </a>
                    </div>
                    <div className="v2rl-grid">
                        {posts.map((x, i) => (
                            <Card key={x.link || i} p={x} i={i + 1} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2Related.displayName = "Sett V2 · Meer artikelen"

addPropertyControls(SettV2Related, {
    title: { type: ControlType.String, title: "Kop", defaultValue: "Meer artikelen" },
    allLabel: { type: ControlType.String, title: "Alle-tekst", defaultValue: "Alle artikelen" },
    allLink: { type: ControlType.Link, title: "Alle-link", defaultValue: "/blog" },
    posts: POST_CONTROLS as never,
})
