// Sett V2 — the shared kit for the V2 section components (SettV2Hero,
// SettV2Statement, SettV2DayCycle, …). Paste into Framer as a code file named
// exactly "SettV2Kit"; every V2 section imports it.
//
// The idea: the site as a cross-section of the street. Above ground ("boven
// het maaiveld") the congested grid, the two peaks, the problem; below it
// the Sett, glowing lime in the dark. Architectural level marks (±0,00 maaiveld,
// −0,70 m) and mono labels carry the drawing-board feel.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { RenderTarget } from "framer"
import { SettFonts } from "./SettFonts.tsx"

// the Sett palette: night navy and near-white, with amber (sun, daytime),
// purple/lilac (evening), blue (the grid, 2027) and bright green (the Sett, stored energy)
export const V = {
    ink: "#060C1A",
    ink2: "#0B1224",
    line: "rgba(223,228,244,0.08)",
    text: "#DFE4F4",
    paper: "#F6F6F6",
    paperInk: "#0B0E1A",
    paperMuted: "#5C5C5E",
    // the accent: buttons, highlights, the Sett's energy
    lime: "#8DFF66",
    green: "#8DFF66",
    lime2: "#8DFF66",
    purple: "#9A6CE9",
    purpleLight: "#BF9CFF",
    lilac: "#C0A8F0",
    blue: "#2583F0",
    blueLight: "#2B8CFF",
    sun: "#FFB92B",
    sunLight: "#F8B82E",
    // warnings (peaks, limits) use the sun amber; the palette has no red
    red: "#FFB92B",
    grey: "#D0D0D0",
    grey2: "#363636",
    // card tones: [dark background, dark ink, light background, light ink]
    cardSun: ["#1E1A17", "#FFB92B", "#FCF0D7", "#C98A0C"],
    cardPurple: ["#1F0748", "#BF9CFF", "#EADEF8", "#9A6CE9"],
    cardBlue: ["#061224", "#2B8CFF", "#E2EDFD", "#2583F0"],
    // for small purple text on a light background (the palette purple is about 3:1 there)
    purpleInk: "#6B3FD1",
    phone: "tel:+31332104140",
}

// Framer hands a list item's unset fields over as its own placeholders ("" for
// text, 0 for numbers, #09F blue for colours). merge() keeps a default wherever
// the value is one of those, so a card the plugin (or you) filled only partly
// still gets its copy and colours.
const FRAMER_BLUE = /^(#09f|#0099ff|rgba?\(0, ?153, ?255(, ?1)?\))$/i
export function unset(v: unknown) {
    return v === undefined || v === null || v === "" || (typeof v === "string" && FRAMER_BLUE.test(v.trim()))
}
// a single property: its value, or the default when Framer left it unset
export const or = <T,>(v: T | undefined | null, d: T): T => (unset(v) ? d : (v as T))
// a button's address: its link, plus the spot on that page from its own anker field
// (Framer's link field drops anything after a #). An anker without a link: this page
export const linkTo = (link: string | undefined, hash: string | undefined, d: string): string => {
    const h = (hash || "").trim().replace(/^#/, "")
    return h ? (unset(link) ? "" : (link as string).split("#")[0]) + "#" + h : or(link, d)
}
export function merge<T extends Record<string, any>>(d: T, v: Partial<T> | undefined): T {
    const out: Record<string, any> = { ...d }
    if (v) for (const k of Object.keys(v)) if (!unset((v as any)[k])) out[k] = (v as any)[k]
    return out as T
}


// film grain as an inline SVG turbulence tile
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

// isolation on .v2: a section's own layers (sticky cards, overlays) stay inside it, so
// they can never cover the site menu, whatever z-index they use
const CSS = `
.v2{ container-type:inline-size; isolation:isolate; position:relative; width:100%; color:#F4F6FB; background:${V.ink};
  font-family:"Sett Outfit",Outfit,"Outfit Placeholder",system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.v2 *{ box-sizing:border-box; }
.v2 h1,.v2 h2,.v2 h3,.v2 p,.v2 ul,.v2 ol{ margin:0; padding:0; }
.v2 ul,.v2 ol{ list-style:none; }
.v2 a{ color:inherit; text-decoration:none; }
.v2.paper{ background:${V.paper}; color:${V.paperInk}; }
.v2-wrap{ width:100%; max-width:1320px; margin:0 auto; padding:0 56px; position:relative; }
.v2-mono{ font-family:"Sett Mono","Geist Mono",ui-monospace,monospace; font-size:12px; letter-spacing:.12em; text-transform:uppercase; }
.v2-muted{ color:rgba(223,228,244,.56); }
.paper .v2-muted{ color:${V.paperMuted}; }
.v2-display{ font-weight:900; letter-spacing:-0.045em; line-height:.9; font-size:clamp(52px, 9.6cqi, 176px); }
.v2-h2{ font-weight:800; letter-spacing:-0.035em; line-height:.95; font-size:clamp(40px, 6.2cqi, 108px); }
.v2-h3{ font-weight:800; letter-spacing:-0.02em; line-height:1.02; font-size:clamp(26px, 2.8cqi, 44px); }
.v2-lead{ font-weight:400; font-size:clamp(18px, 1.55cqi, 24px); line-height:1.45; color:rgba(223,228,244,.78); max-width:640px; }
.paper .v2-lead{ color:${V.paperMuted}; }
.v2-body{ font-size:17px; line-height:1.6; color:rgba(223,228,244,.7); }
.paper .v2-body{ color:${V.paperMuted}; }
.v2-grain{ position:absolute; inset:0; pointer-events:none; background-image:${GRAIN}; opacity:.07; mix-blend-mode:overlay; }
.v2-grid{ position:absolute; inset:0; pointer-events:none;
  background-image:linear-gradient(to right, ${V.line} 1px, transparent 1px); background-size:calc(100% / 12) 100%; opacity:.6; }
.v2-btn{ display:inline-flex; align-items:center; gap:12px; height:56px; padding:0 26px; border-radius:999px; font-weight:800; font-size:17px;
  transition:transform .35s cubic-bezier(.2,.8,.2,1), background .25s, color .25s; will-change:transform; }
.v2-btn:hover{ transform:translateY(-2px) scale(1.02); }
.v2-btn.lime{ background:${V.lime}; color:${V.ink}; }
.v2-btn.line{ box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35); color:#fff; }
.v2-btn.line:hover{ background:#fff; color:#000; }
.paper .v2-btn.line{ box-shadow:inset 0 0 0 1.5px rgba(11,14,26,.35); color:${V.paperInk}; }
.v2-btn .arr{ display:inline-block; transition:transform .35s cubic-bezier(.2,.8,.2,1); }
.v2-btn:hover .arr{ transform:translateX(4px); }
/* the level mark: a hairline with an architectural label */
.v2-level{ display:flex; align-items:center; gap:14px; color:rgba(255,255,255,.5); }
.v2-level::before{ content:""; width:10px; height:10px; border:1.5px solid currentColor; transform:rotate(45deg); flex:none; }
.v2-level::after{ content:""; height:1px; background:currentColor; flex:1; opacity:.5; }
.paper .v2-level{ color:rgba(11,14,26,.45); }
/* mask reveal for lines of display type */
/* the masks leave room for descenders and accents (g, j, p, í) at line-height .9 */
.v2-lines > span{ display:block; overflow:hidden; padding:.08em 0 .2em; margin:-.08em 0 -.2em; }
.v2-lines > span > span{ display:block; transform:translateY(118%); transition:transform 1.1s cubic-bezier(.2,.8,.1,1); }
.v2-in .v2-lines > span > span{ transform:none; }
.v2-lines > span:nth-child(2) > span{ transition-delay:.08s } .v2-lines > span:nth-child(3) > span{ transition-delay:.16s }
.v2-lines > span:nth-child(4) > span{ transition-delay:.24s } .v2-lines > span:nth-child(5) > span{ transition-delay:.32s }
.v2-fade{ opacity:0; transform:translateY(18px); transition:opacity 1s ease .35s, transform 1s cubic-bezier(.2,.8,.1,1) .35s; }
.v2-in .v2-fade{ opacity:1; transform:none; }
.v2-static .v2-lines > span > span, .v2-static .v2-fade{ transform:none !important; opacity:1 !important; transition:none !important; }
@container (max-width: 809px){
  .v2-wrap{ padding:0 22px; }
  .v2-grid{ background-size:calc(100% / 4) 100%; }
  .v2-btn{ height:50px; padding:0 20px; font-size:16px; }
}
@media (prefers-reduced-motion: reduce){
  .v2-lines > span > span, .v2-fade{ transform:none !important; opacity:1 !important; transition:none !important; }
}
`

// every kit rule gets zero specificity (:where), so a section's own rules win
// no matter in which order the sections' stylesheets end up on the page
const KIT = CSS.replace(/(^|[{}])\s*([^{}@]+?)\s*\{/g, (m, before, sel) => before + " :where(" + sel + "){")

// the CSS goes in as raw HTML: on the server React escapes quotes in a <style>'s text
// (font-family:"…" becomes &quot;…&quot;), which the browser can't read, so until the page
// came alive the text showed in a fallback font and then jumped. Every Sett component does this
export function V2Style() {
    return (
        <>
            <SettFonts />
            <style dangerouslySetInnerHTML={{ __html: KIT }} />
        </>
    )
}

export const onCanvas = () => {
    try {
        return RenderTarget.current() === RenderTarget.canvas
    } catch {
        return false
    }
}
export const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

// one shared scroll/resize ticker for every section (rAF-throttled)
const subs = new Set<() => void>()
let ticking = false
function tick() {
    ticking = false
    subs.forEach((f) => f())
}
function schedule() {
    if (!ticking) {
        ticking = true
        requestAnimationFrame(tick)
    }
}
if (typeof window !== "undefined") {
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
}
export function onScrollFrame(f: () => void) {
    subs.add(f)
    schedule()
    return () => void subs.delete(f)
}

// progress of a tall (pinned) section: 0 when its top reaches the top of the
// screen, 1 when its bottom reaches the bottom
export function pinProgress(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const travel = r.height - window.innerHeight
    return travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : r.top < 0 ? 1 : 0
}
// progress of any block through the screen: 0 entering at the bottom, 1 leaving at the top
export function passProgress(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    return Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
}

export function useProgress(ref: React.RefObject<HTMLElement>, kind: "pin" | "pass" = "pin", fixed = 0) {
    const [p, setP] = useState(fixed)
    useEffect(() => {
        if (onCanvas()) return
        const el = ref.current
        if (!el) return
        return onScrollFrame(() => setP((kind === "pin" ? pinProgress : passProgress)(el)))
    }, [kind])
    return p
}

// adds "v2-in" once the element is on screen (the mask reveals key off it)
export function useReveal(ref: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (onCanvas() || reducedMotion()) {
            el.classList.add("v2-in", "v2-static")
            return
        }
        const io = new IntersectionObserver((e) => e[0].isIntersecting && (el.classList.add("v2-in"), io.disconnect()), { threshold: 0.15 })
        io.observe(el)
        return () => io.disconnect()
    }, [])
}

// display type split into masked lines ("\n" or "|" breaks a line)
export function Lines({ text, className = "", style }: { text: string; className?: string; style?: React.CSSProperties }) {
    const parts = text.split(/\n|\|/)
    return (
        <span className={"v2-lines " + className} style={{ display: "block", ...style }}>
            {parts.map((l, i) => (
                <span key={i}>
                    {/* the space keeps the lines apart as words (the page's text reads "Niet wachten op het net.") */}
                    <span>{l.trim() + (i < parts.length - 1 ? " " : "")}</span>
                </span>
            ))}
        </span>
    )
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const ease = (x: number) => {
    const t = clamp01(x)
    return t * t * (3 - 2 * t)
}
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

// mounts its children only near the viewport (and unmounts them far away), so
// a page can hold many live 3D scenes without running out of WebGL contexts
export function Near({ children, margin = 700, placeholder = null, style }: { children: React.ReactNode; margin?: number; placeholder?: React.ReactNode; style?: React.CSSProperties }) {
    const ref = useRef<HTMLDivElement>(null)
    const [near, setNear] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (onCanvas()) {
            setNear(true)
            return
        }
        const io = new IntersectionObserver((e) => setNear(e[0].isIntersecting), { rootMargin: margin + "px 0px" })
        io.observe(el)
        return () => io.disconnect()
    }, [margin])
    return (
        <div ref={ref} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
            {near ? children : placeholder}
        </div>
    )
}

export type Img = { src?: string; srcSet?: string; alt?: string } | undefined
// alt: used when the image itself has no alt text (e.g. the card's title)
export function Poster({ img, fit = "cover", style, alt }: { img: Img; fit?: "cover" | "contain"; style?: React.CSSProperties; alt?: string }) {
    if (!img || !img.src) return <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.04)", ...style }} />
    return <img src={img.src} srcSet={img.srcSet} alt={img.alt || alt || ""} loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, ...style }} />
}

export const Arrow = () => (
    <span className="arr" aria-hidden="true">
        →
    </span>
)

// a muted looping video (real footage): loads only once it is about a screen away
// (until then, and on the Framer canvas or with reduced motion, its poster shows), and
// plays only while on screen
export function Loop({ src, poster, speed = 1, style }: { src?: string; poster?: Img; speed?: number; style?: React.CSSProperties }) {
    const ref = useRef<HTMLVideoElement>(null)
    const [still] = useState(() => onCanvas() || reducedMotion())
    const [near, setNear] = useState(false)
    useEffect(() => {
        const v = ref.current
        if (!v || still) return
        // slower (or faster) footage; browsers reset the rate on each new source, so set it again once it loads
        const rate = Math.min(4, Math.max(0.1, speed || 1))
        const setRate = () => ((v.defaultPlaybackRate = rate), (v.playbackRate = rate))
        setRate()
        v.addEventListener("loadedmetadata", setRate)
        const ahead = new IntersectionObserver((e) => e[0].isIntersecting && (setNear(true), ahead.disconnect()), { rootMargin: "100% 0px" })
        ahead.observe(v)
        const io = new IntersectionObserver(
            (e) => {
                if (e[0].isIntersecting) v.play().catch(() => {})
                else v.pause()
            },
            { rootMargin: "200px 0px" }
        )
        io.observe(v)
        return () => {
            ahead.disconnect()
            io.disconnect()
            v.removeEventListener("loadedmetadata", setRate)
        }
    }, [src, still, speed])
    // once the source is set, start it if it is already on screen
    useEffect(() => {
        const v = ref.current
        if (!v || !near) return
        const r = v.getBoundingClientRect()
        if (r.bottom > -200 && r.top < innerHeight + 200) v.play().catch(() => {})
    }, [near])
    const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }
    if (!src || still) return <Poster img={poster} style={style} />
    return <video ref={ref} src={near ? src : undefined} poster={poster?.src} muted loop playsInline preload={near ? "auto" : "none"} aria-hidden="true" style={fill} />
}
