// Sett UI — the shared building blocks of the Sett page components
// (SettPageDetails, SettPageParticulieren, SettPageBedrijven): fonts, design
// tokens, section styles, buttons, callouts, image slots and the "voordelen"
// carousel. Paste this file into Framer as a code file named exactly
// "SettUI" — the page files import it.
//
// Layout responds to the component's own width (CSS container queries), so the
// breakpoints behave the same on the Framer canvas as on the live site.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { ControlType, RenderTarget } from "framer"

// ---------------------------------------------------------------- tokens
// the Sett palette (navy, near-white, green, amber, purple/lilac, blue)
export const T = {
    ink: "#060C1A",
    page: "#060C1A",
    light: "#F6F6F6",
    card: "#0B1224",
    lime: "#8DFF66", // "Bestel jouw Sett"
    green: "#2B8CFF", // "Bel direct"
    lime2: "#8DFF66",
    purple: "#9A6CE9",
    lilac: "#C0A8F0",
    blue: "#2583F0",
    sun: "#FFB92B",
    phone: "tel:+31332104140",
}

export type Img = { src?: string; srcSet?: string; alt?: string } | undefined
export type Slot = { key: string; file: string; title: string; alt: string }

// the property controls for a page's image slots: one per picture, titled with
// the file to drop in (from sett-website-assets.zip)
export function imageControls(slots: Slot[]) {
    const out: Record<string, any> = {}
    slots.forEach((s) => {
        out[s.key] = { type: ControlType.ResponsiveImage, title: s.title, description: s.file }
    })
    return out
}

// ---------------------------------------------------------------- styles
const FONTS = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap"

const CSS = `
.sx{ container-type:inline-size; width:100%; overflow:hidden; background:var(--sx-bg,#060C1A); color:#fff;
  font-family:Outfit,"Outfit Placeholder",system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased; }
.sx *{ box-sizing:border-box; }
.sx h1,.sx h2,.sx h3,.sx h4,.sx p,.sx ul{ margin:0; padding:0; }
.sx ul{ list-style:none; }
.sx a{ color:inherit; text-decoration:none; }
.sx img{ max-width:100%; }
.sx-wrap{ width:100%; max-width:1200px; margin:0 auto; padding:0 48px; position:relative; }
.sx-sec{ position:relative; padding:128px 0; }
.sx-sec.tight{ padding:88px 0; }
.sx-light{ background:${T.light}; color:${T.ink}; }
.sx-center{ text-align:center; }
.sx-center .sx-lead, .sx-center .sx-body{ margin-left:auto; margin-right:auto; }
.sx-stack{ display:flex; flex-direction:column; gap:22px; align-items:flex-start; }
.sx-center .sx-stack, .sx-stack.center{ align-items:center; }
.sx-h1{ font-weight:800; font-size:clamp(38px,5.4cqi,78px); line-height:1.02; letter-spacing:-0.015em; }
.sx-h2{ font-weight:800; font-size:clamp(30px,3.7cqi,54px); line-height:1.04; letter-spacing:-0.012em; }
.sx-h3{ font-weight:800; font-size:clamp(22px,2.1cqi,30px); line-height:1.12; letter-spacing:-0.005em; }
.sx-pre{ font-weight:500; font-size:clamp(20px,2.2cqi,30px); line-height:1.15; color:rgba(255,255,255,.55); }
.sx-lead{ font-size:clamp(17px,1.45cqi,21px); line-height:1.55; color:rgba(255,255,255,.7); max-width:760px; }
.sx-lead strong{ color:#fff; font-weight:700; }
.sx-body{ font-size:17px; line-height:1.65; color:rgba(255,255,255,.7); max-width:680px; }
.sx-body strong{ color:#fff; }
.sx-light .sx-lead, .sx-light .sx-body{ color:rgba(3,5,14,.62); }
.sx-light .sx-lead strong{ color:${T.ink}; }
.sx-mono{ font-family:"Geist Mono",ui-monospace,SFMono-Regular,monospace; }
.sx-pill{ display:inline-flex; align-items:center; gap:8px; padding:11px 18px; border-radius:999px; background:rgba(223, 228, 244, 0.16);
  color:rgba(255,255,255,.85); font:600 13px/1.35 "Geist Mono",ui-monospace,monospace; letter-spacing:.04em; text-transform:uppercase; max-width:100%; }
.sx-pill.long{ border-radius:16px; }
.sx-pill.blue{ background:rgba(37, 131, 240,.6); color:#fff; }
.sx-pill.lime{ background:rgba(141, 255, 102,.2); color:${T.lime2}; }
.sx-callout{ display:flex; gap:12px; align-items:flex-start; padding:16px 22px; border-radius:22px; background:rgba(37, 131, 240,.2);
  color:#2B8CFF; font-weight:700; font-size:16px; line-height:1.45; max-width:760px; }
.sx-callout svg{ flex:none; margin-top:1px; }
.sx-btns{ display:flex; flex-wrap:wrap; gap:12px; }
.sx-center .sx-btns{ justify-content:center; }
.sx-btn{ display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:48px; padding:0 22px; border-radius:999px;
  font-weight:800; font-size:16px; line-height:1.1; cursor:pointer; transition:transform .2s ease, filter .2s ease; }
.sx-btn:hover{ transform:translateY(-1px); filter:brightness(1.06); }
.sx-btn.lime{ background:${T.lime}; color:${T.ink}; }
.sx-btn.green{ background:${T.green}; color:#fff; }
.sx-btn.lime2{ background:${T.lime2}; color:#060C1A; }
.sx-btn.purple{ background:${T.purple}; color:#060C1A; }
.sx-btn.blue{ background:${T.blue}; color:#fff; }
.sx-btn.ghost{ background:rgba(255,255,255,.1); color:#fff; }
.sx-checks{ display:flex; flex-direction:column; gap:14px; }
.sx-checks li{ display:flex; gap:12px; align-items:flex-start; font-size:17px; line-height:1.45; color:rgba(255,255,255,.86); }
.sx-checks svg{ flex:none; margin-top:2px; }
.sx-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:center; }
.sx-grid2.flip > :first-child{ order:2; }
.sx-card{ background:${T.card}; border-radius:24px; padding:40px; }
.sx-media{ position:relative; width:100%; }
.sx-media img{ display:block; width:100%; height:auto; }
.sx-ph{ width:100%; display:flex; flex-direction:column; gap:6px; align-items:center; justify-content:center; text-align:center; padding:18px;
  border:1.5px dashed rgba(255,255,255,.22); border-radius:20px; color:rgba(255,255,255,.5); font:500 13px/1.4 "Geist Mono",ui-monospace,monospace; }
.sx-ph b{ color:rgba(255,255,255,.8); font-weight:600; }
.sx-light .sx-ph, .sx-ph.dark{ border-color:rgba(3,5,14,.2); color:rgba(3,5,14,.45); }
.sx-light .sx-ph b, .sx-ph.dark b{ color:rgba(3,5,14,.75); }
.sx-rule{ height:1px; background:rgba(255,255,255,.12); }

/* hero with the 3D scene behind it */
.sx-hero{ position:relative; min-height:max(700px, min(100vh, 1040px)); display:flex; align-items:center; overflow:hidden; }
.sx-hero-3d{ position:absolute; inset:0; }
/* seals the scene's bottom edge into the page (no sub-pixel seam) */
.sx-hero-3d::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:96px; z-index:4; pointer-events:none;
  background:linear-gradient(to bottom, rgba(6, 12, 26,0), var(--sx-bg,#060C1A) 92%); }
.sx-hero-copy{ position:relative; z-index:2; padding-top:140px; padding-bottom:140px; pointer-events:none; }
.sx-hero-copy > div{ max-width:min(860px, 64%); pointer-events:auto; }
.sx-hero .sx-h1{ font-size:clamp(34px,3.9cqi,60px); line-height:1.04; text-shadow:0 2px 24px rgba(6, 12, 26,.25); }
.sx-hero .sx-lead{ color:rgba(255,255,255,.88); max-width:580px; text-shadow:0 1px 14px rgba(6, 12, 26,.35); }

/* voordelen carousel */
.sx-vd-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:32px; margin-bottom:44px; }
.sx-vd-nav{ display:flex; gap:10px; flex:none; }
.sx-vd-nav button{ width:52px; height:52px; border-radius:999px; border:0; background:rgba(255,255,255,.1); color:#fff; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:background .2s; }
.sx-vd-nav button:hover{ background:rgba(255,255,255,.2); }
.sx-vd-nav button:disabled{ opacity:.35; cursor:default; }
.sx-vd-track{ display:grid; grid-auto-flow:column; grid-auto-columns:min(560px, 84%); gap:20px; overflow-x:auto; scroll-snap-type:x mandatory;
  scrollbar-width:none; padding:0 max(48px, calc((100cqi - 1200px) / 2 + 48px)); scroll-padding:0 max(48px, calc((100cqi - 1200px) / 2 + 48px));
  cursor:grab; overscroll-behavior-x:contain; }
.sx-vd-track::-webkit-scrollbar{ display:none; }
.sx-vd-track.drag{ cursor:grabbing; scroll-snap-type:none; }
.sx-vd-track.drag *{ pointer-events:none; user-select:none; }
.sx-vd-card{ scroll-snap-align:start; background:${T.card}; border-radius:24px; padding:32px; display:flex; flex-direction:column; gap:18px; }
.sx-vd-card .sx-media{ background:rgba(255,255,255,.035); border-radius:18px; padding:14px; }
.sx-vd-card .sx-media img{ aspect-ratio:3/2; object-fit:contain; }
.sx-vd-card .sx-ph{ aspect-ratio:3/2; }
.sx-vd-label{ font:600 13px/1 "Geist Mono",ui-monospace,monospace; letter-spacing:.06em; text-transform:uppercase; }
.sx-vd-card .sx-body{ font-size:16px; }
.sx-vd-risk{ margin-top:auto; padding:18px 20px; border-radius:18px; background:rgba(37, 131, 240, 0.28); color:#fff; font-size:15px; line-height:1.5; }
.sx-vd-risk strong{ font-weight:800; }
.sx-hint{ display:inline-flex; margin-top:28px; padding:10px 16px; border-radius:999px; background:rgba(255,255,255,.08); color:rgba(255,255,255,.7); font-size:14px; font-weight:600; }

/* scroll reveal (only once the page script runs, never on the Framer canvas) */
.sx-js .rv{ opacity:0; transform:translateY(26px); transition:opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.sx-js .rv.in{ opacity:1; transform:none; }
.sx-js .rv.d1{ transition-delay:.08s; } .sx-js .rv.d2{ transition-delay:.16s; } .sx-js .rv.d3{ transition-delay:.24s; }
@media (prefers-reduced-motion: reduce){ .sx-js .rv{ opacity:1; transform:none; transition:none; } }

@container (max-width: 1000px){
  .sx-grid2{ gap:48px; }
  .sx-hero-copy > div{ max-width:min(640px, 72%); }
}
@container (max-width: 809px){
  .sx-wrap{ padding:0 22px; }
  .sx-sec{ padding:84px 0; }
  .sx-sec.tight{ padding:64px 0; }
  .sx-grid2{ grid-template-columns:1fr; gap:36px; }
  .sx-grid2.flip > :first-child{ order:0; }
  .sx-card{ padding:28px 22px; border-radius:20px; }
  .sx-hero{ min-height:0; align-items:flex-start; }
  .sx-hero-3d{ position:relative; inset:auto; width:100%; height:440px; order:2; margin-top:-40px; }
  .sx-hero-3d::before{ content:""; position:absolute; left:0; right:0; top:-1px; height:110px; z-index:4; pointer-events:none;
    background:linear-gradient(to top, rgba(6, 12, 26,0), var(--sx-bg,#060C1A) 92%); }
  .sx-hero{ flex-direction:column; }
  .sx-hero-copy{ padding-top:120px; padding-bottom:12px; }
  .sx-hero-copy > div{ max-width:none; }
  .sx-vd-head{ flex-direction:column; align-items:flex-start; }
  .sx-vd-nav{ display:none; }
  .sx-vd-track{ grid-auto-columns:86%; padding:0 22px; scroll-padding:0 22px; }
  .sx-vd-card{ padding:22px; }
}
`

// ---------------------------------------------------------------- page shell
// fonts + styles + the reveal script, around a page's sections
export function Page({ children, bg = T.page, style }: { children: React.ReactNode; bg?: string; style?: React.CSSProperties }) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const root = ref.current
        if (!root) return
        const onCanvas = RenderTarget.current() === RenderTarget.canvas
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (onCanvas || reduced || typeof IntersectionObserver === "undefined") return
        root.classList.add("sx-js")
        const io = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("in")
                        io.unobserve(e.target)
                    }
                }),
            { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        )
        root.querySelectorAll(".rv").forEach((el) => io.observe(el))
        return () => io.disconnect()
    }, [])
    return (
        <div ref={ref} className="sx" style={{ ["--sx-bg" as any]: bg, ...style }}>
            <link rel="stylesheet" href={FONTS} />
            <style>{CSS}</style>
            {children}
        </div>
    )
}

// ---------------------------------------------------------------- pieces
export function Media({ image, slot, ratio = "3 / 2", dark, className, style, eager }: { image: Img; slot: Slot; ratio?: string; dark?: boolean; className?: string; style?: React.CSSProperties; eager?: boolean }) {
    if (image && image.src)
        return (
            <div className={"sx-media " + (className || "")} style={style}>
                <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 809px) 100vw, 50vw" alt={image.alt || slot.alt} loading={eager ? "eager" : "lazy"} decoding="async" />
            </div>
        )
    // empty slot: says which file goes here
    return (
        <div className={"sx-media " + (className || "")} style={style}>
            <div className={"sx-ph" + (dark ? " dark" : "")} style={{ aspectRatio: ratio }}>
                <b>{slot.title}</b>
                <span>{slot.file}</span>
            </div>
        </div>
    )
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: "blue" | "lime" }) {
    const long = typeof children === "string" && children.length > 42 // wraps: a squarer pill
    return <span className={"sx-pill" + (tone ? " " + tone : "") + (long ? " long" : "")}>{children}</span>
}

export function Callout({ children }: { children: React.ReactNode }) {
    return (
        <p className="sx-callout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="16.6" r="1.3" fill="currentColor" />
            </svg>
            <span>{children}</span>
        </p>
    )
}

export function Checks({ items, color = T.green }: { items: string[]; color?: string }) {
    return (
        <ul className="sx-checks">
            {items.map((t) => (
                <li key={t}>
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="11" fill={color} opacity="0.18" />
                        <path d="M7 12.4l3.2 3.1L17 8.8" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{t}</span>
                </li>
            ))}
        </ul>
    )
}

export const Icon = {
    phone: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    ),
    user: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    building: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 21V8l9-5 9 5v13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M7 21v-8h10v8M7 17h10" stroke="currentColor" strokeWidth="2" />
        </svg>
    ),
    arrow: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    back: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
}

// the site's two header actions, reused as section CTAs
export function OrderButtons({ order = "Bestel jouw Sett", call = "Bel direct" }: { order?: string; call?: string }) {
    return (
        <div className="sx-btns">
            <a className="sx-btn lime" href="/pre-order">
                {order}
            </a>
            <a className="sx-btn green" href={T.phone}>
                {call} {Icon.phone}
            </a>
        </div>
    )
}

// ---------------------------------------------------------------- voordelen
export type Voordeel = { label: string; title: string; body: string; risk: string; image: Img; slot: Slot }

export function Voordelen({ eyebrow, title, lead, items, accent = T.lime2, hint = "Houd ingedrukt en sleep om alle voordelen te bekijken" }: { eyebrow: string; title: string; lead: string; items: Voordeel[]; accent?: string; hint?: string }) {
    const track = useRef<HTMLDivElement>(null)
    const [edge, setEdge] = useState({ start: true, end: false })
    const update = () => {
        const t = track.current
        if (!t) return
        setEdge({ start: t.scrollLeft < 8, end: t.scrollLeft + t.clientWidth > t.scrollWidth - 8 })
    }
    const step = (dir: number) => {
        const t = track.current
        if (!t) return
        const card = t.querySelector(".sx-vd-card") as HTMLElement | null
        t.scrollBy({ left: dir * ((card ? card.offsetWidth : 400) + 20), behavior: "smooth" })
    }
    // mouse: press and drag to scroll (touch scrolls natively)
    useEffect(() => {
        const t = track.current
        if (!t) return
        let down = false, x0 = 0, s0 = 0, moved = false
        const onDown = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || e.button !== 0) return
            down = true
            moved = false
            x0 = e.clientX
            s0 = t.scrollLeft
        }
        const onMove = (e: PointerEvent) => {
            if (!down) return
            const dx = e.clientX - x0
            if (!moved && Math.abs(dx) > 4) {
                moved = true
                t.classList.add("drag")
            }
            if (moved) t.scrollLeft = s0 - dx
        }
        const onUp = () => {
            if (!down) return
            down = false
            if (moved) {
                t.classList.remove("drag")
                // settle on the nearest card
                const card = t.querySelector(".sx-vd-card") as HTMLElement | null
                const w = (card ? card.offsetWidth : 400) + 20
                t.scrollTo({ left: Math.round(t.scrollLeft / w) * w, behavior: "smooth" })
            }
        }
        t.addEventListener("pointerdown", onDown)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        t.addEventListener("scroll", update, { passive: true })
        update()
        return () => {
            t.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            t.removeEventListener("scroll", update)
        }
    }, [])
    return (
        <section className="sx-sec">
            <div className="sx-wrap">
                <div className="sx-vd-head rv">
                    <div className="sx-stack">
                        <Pill>{eyebrow}</Pill>
                        <h2 className="sx-h2">{title}</h2>
                        <p className="sx-lead">{lead}</p>
                    </div>
                    <div className="sx-vd-nav">
                        <button type="button" aria-label="Vorige" onClick={() => step(-1)} disabled={edge.start}>
                            {Icon.back}
                        </button>
                        <button type="button" aria-label="Volgende" onClick={() => step(1)} disabled={edge.end}>
                            {Icon.arrow}
                        </button>
                    </div>
                </div>
            </div>
            <div className="sx-vd-track rv d1" ref={track}>
                {items.map((v) => (
                    <article className="sx-vd-card" key={v.label}>
                        <Media image={v.image} slot={v.slot} />
                        <span className="sx-vd-label" style={{ color: accent }}>
                            {v.label}
                        </span>
                        <h3 className="sx-h3">{v.title}</h3>
                        <p className="sx-body">{v.body}</p>
                        <p className="sx-vd-risk">
                            <strong>Als je niets doet: </strong>
                            {v.risk}
                        </p>
                    </article>
                ))}
            </div>
            <div className="sx-wrap">
                <span className="sx-hint">{hint}</span>
            </div>
        </section>
    )
}
