// Sett V2 Legal — a legal page (algemene voorwaarden, privacyverklaring) in Sett's style:
// a dark head with the title and the date, then the text on paper with a table of contents
// that stays in view, a download of the same text as a PDF, and the company's details.
// A section's text: a blank line starts a paragraph, "- " a list item; in a list item the
// words before the first colon are set in bold. E-mail addresses, the phone number and
// web addresses become links; "privacyverklaring" and "Cookie-instellingen" too.

import * as React from "react"
import { useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, V, or } from "./SettV2Kit.tsx"

type Section = { title?: string; body?: string }
interface Props {
    eyebrow?: string
    title?: string
    updated?: string
    intro?: string
    sections?: Section[]
    pdf?: string
    pdfLabel?: string
    id?: string
    style?: React.CSSProperties
}

const CSS = `
.v2lg-head{ background:${V.ink}; color:#F4F6FB; padding:clamp(140px, 22vh, 220px) 0 clamp(56px, 9vh, 96px); }
.v2lg-eyebrow{ display:inline-flex; align-items:center; gap:10px; font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.14em; text-transform:uppercase; color:${V.lime}; margin-bottom:22px; }
.v2lg-eyebrow::before{ content:""; width:7px; height:7px; border-radius:50%; background:${V.lime}; }
.v2lg-head h1{ font-weight:800; font-size:clamp(44px, 7cqi, 104px); line-height:.95; letter-spacing:-.035em; margin:0; }
.v2lg-meta{ display:flex; flex-wrap:wrap; align-items:center; gap:14px 28px; margin-top:clamp(28px, 4vh, 44px); }
.v2lg-meta p{ margin:0; max-width:620px; font-size:clamp(17px, 1.35cqi, 20px); line-height:1.55; color:rgba(223,228,244,.78); flex:1 1 380px; }
.v2lg-date{ font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:rgba(223,228,244,.6); }
.v2lg-pdf{ display:inline-flex; align-items:center; gap:10px; height:48px; padding:0 22px; border-radius:999px; background:${V.lime}; color:${V.ink}; font-weight:700; font-size:15px; text-decoration:none; white-space:nowrap; }
.v2lg-pdf:hover{ filter:brightness(1.06); }
.v2lg-pdf svg{ width:18px; height:18px; }
.v2lg-body{ background:${V.paper}; color:${V.paperInk}; padding:clamp(56px, 9vh, 104px) 0 clamp(80px, 12vh, 140px); }
.v2lg-grid{ display:grid; grid-template-columns:minmax(200px, 280px) minmax(0, 720px); gap:clamp(40px, 6cqi, 112px); align-items:start; }
.v2lg-toc{ position:sticky; top:110px; font-size:14px; }
.v2lg-toc b{ display:block; font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.14em; text-transform:uppercase; color:${V.paperMuted}; margin-bottom:14px; }
.v2lg-toc ol{ list-style:none; margin:0; padding:0; display:grid; gap:2px; border-left:1px solid rgba(11,14,26,.1); }
.v2lg-toc a{ display:flex; gap:10px; padding:7px 0 7px 16px; margin-left:-1px; border-left:2px solid transparent; color:${V.paperMuted}; text-decoration:none; line-height:1.35; }
.v2lg-toc a:hover{ color:${V.paperInk}; border-left-color:${V.paperInk}; }
.v2lg-toc a i{ font:600 11px "Sett Mono","Geist Mono",monospace; font-style:normal; padding-top:2px; opacity:.6; }
.v2lg-text section{ padding:0 0 clamp(36px, 5vh, 52px); scroll-margin-top:110px; }
.v2lg-text section + section{ border-top:1px solid rgba(11,14,26,.08); padding-top:clamp(32px, 4.5vh, 48px); }
.v2lg-text h2{ display:flex; align-items:baseline; gap:14px; font-weight:800; font-size:clamp(22px, 1.9cqi, 28px); line-height:1.2; letter-spacing:-.015em; margin:0 0 16px; }
.v2lg-text h2 i{ font:600 12px "Sett Mono","Geist Mono",monospace; font-style:normal; letter-spacing:.08em; color:${V.paperMuted}; flex:none; }
.v2lg-text p, .v2lg-text li{ font-size:17px; line-height:1.7; color:#2B2F3A; }
.v2lg-text p{ margin:0 0 14px; }
.v2lg-text ul{ margin:0 0 14px; padding:0; list-style:none; display:grid; gap:8px; }
.v2lg-text li{ position:relative; padding-left:22px; }
.v2lg-text li::before{ content:""; position:absolute; left:2px; top:.72em; width:7px; height:7px; border-radius:50%; background:${V.lime}; box-shadow:0 0 0 1.5px rgba(11,14,26,.18); }
.v2lg-text li b{ color:${V.paperInk}; }
.v2lg-text a{ color:${V.paperInk}; text-decoration:underline; text-decoration-thickness:1.5px; text-underline-offset:3px; text-decoration-color:rgba(11,14,26,.3); }
.v2lg-text a:hover{ text-decoration-color:${V.paperInk}; }
.v2lg-id{ margin-top:clamp(24px, 4vh, 40px); padding:22px 24px; border-radius:18px; background:#fff; box-shadow:0 0 0 1px rgba(11,14,26,.06); font:500 13px/1.6 "Sett Mono","Geist Mono",monospace; color:${V.paperMuted}; }
@container (max-width: 900px){
  .v2lg-grid{ grid-template-columns:1fr; }
  .v2lg-toc{ position:static; }
  .v2lg-toc ol{ grid-template-columns:1fr 1fr; border-left:0; gap:0 16px; }
  .v2lg-toc a{ padding-left:0; border-left:0; margin-left:0; }
}
@container (max-width: 560px){ .v2lg-toc ol{ grid-template-columns:1fr; } }
`

// links in running text: e-mail, phone, web addresses, and the two references to other pages
const LINKS: [RegExp, (m: string) => string][] = [
    [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/, (m) => "mailto:" + m],
    [/\+31 33 210 4140/, () => "tel:+31332104140"],
    // (not sett.nl itself: the site's own name in the text)
    [/(?<![\w@.-])(?:https?:\/\/)?(?:www\.)?(?!sett\.nl)[a-z0-9-]+\.(?:nl|network|com|eu)(?:\/[\w\-/]*)?/i, (m) => (/^https?:/.test(m) ? m : "https://" + m)],
    [/\bprivacyverklaring\b/, () => "/privacy"],
    [/\bCookie-instellingen\b/, () => "#cookies"],
]
function linked(text: string, self: string): React.ReactNode[] {
    const out: React.ReactNode[] = []
    let rest = text
    let k = 0
    while (rest) {
        let best: { at: number; len: number; href: string } | null = null
        for (const [re, href] of LINKS) {
            const m = re.exec(rest)
            if (m && (!best || m.index < best.at)) best = { at: m.index, len: m[0].length, href: href(m[0]) }
        }
        if (!best) {
            out.push(rest)
            break
        }
        if (best.at) out.push(rest.slice(0, best.at))
        const word = rest.slice(best.at, best.at + best.len)
        // a page doesn't link to itself (the privacy statement mentioning itself)
        if (best.href === self) out.push(word)
        else {
            const ext = /^https?:/.test(best.href)
            out.push(
                <a key={k++} href={best.href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {word}
                </a>
            )
        }
        rest = rest.slice(best.at + best.len)
    }
    return out
}

// a section's text as paragraphs and lists
function Body({ text, self }: { text: string; self: string }) {
    const blocks: { list: boolean; lines: string[] }[] = []
    for (const line of text.split("\n")) {
        const t = line.trim()
        if (!t) {
            blocks.push({ list: false, lines: [] })
            continue
        }
        const list = /^- /.test(t)
        const last = blocks[blocks.length - 1]
        if (last && last.list === list && (list || !last.lines.length)) last.lines.push(list ? t.slice(2) : t)
        else blocks.push({ list, lines: [list ? t.slice(2) : t] })
    }
    return (
        <>
            {blocks
                .filter((b) => b.lines.length)
                .map((b, i) =>
                    b.list ? (
                        <ul key={i}>
                            {b.lines.map((l, j) => {
                                const c = l.indexOf(": ")
                                return c > 0 && c < 48 ? (
                                    <li key={j}>
                                        <b>{l.slice(0, c)}:</b> {linked(l.slice(c + 2), self)}
                                    </li>
                                ) : (
                                    <li key={j}>{linked(l, self)}</li>
                                )
                            })}
                        </ul>
                    ) : (
                        <p key={i}>{linked(b.lines.join(" "), self)}</p>
                    )
                )}
        </>
    )
}

const slug = (s: string, i: number) => "artikel-" + (i + 1) + "-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Legal(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const title = or(p.title, "Algemene voorwaarden")
    const sections = (p.sections || []).filter((s) => (s.title || "").trim() || (s.body || "").trim())
    const self = /privacy/i.test(title) ? "/privacy" : ""
    return (
        <section className="v2 v2lg" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2lg-head">
                <div className="v2-wrap" ref={head}>
                    <div className="v2lg-eyebrow v2-fade">{or(p.eyebrow, "Juridisch")}</div>
                    <h1>
                        <Lines text={title} />
                    </h1>
                    <div className="v2lg-meta v2-fade">
                        {p.intro && <p>{p.intro}</p>}
                        <span className="v2lg-date">Laatst bijgewerkt: {or(p.updated, "")}</span>
                        {p.pdf && (
                            <a className="v2lg-pdf" href={p.pdf} target="_blank" rel="noopener noreferrer" download>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
                                </svg>
                                {or(p.pdfLabel, "Download als PDF")}
                            </a>
                        )}
                    </div>
                </div>
            </div>
            <div className="v2lg-body">
                <div className="v2-wrap v2lg-grid">
                    {sections.length > 1 ? (
                        <nav className="v2lg-toc" aria-label="Inhoud">
                            <b>Inhoud</b>
                            <ol>
                                {sections.map((s, i) => (
                                    <li key={i}>
                                        <a href={"#" + slug(s.title || "", i)}>
                                            <i>{String(i + 1).padStart(2, "0")}</i>
                                            {s.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    ) : (
                        <div />
                    )}
                    <div className="v2lg-text">
                        {sections.map((s, i) => (
                            <section key={i} id={slug(s.title || "", i)}>
                                <h2>
                                    <i>{String(i + 1).padStart(2, "0")}</i>
                                    {s.title}
                                </h2>
                                <Body text={s.body || ""} self={self} />
                            </section>
                        ))}
                        {p.id && <div className="v2lg-id">{p.id}</div>}
                    </div>
                </div>
            </div>
        </section>
    )
}

SettV2Legal.displayName = "Sett V2 · Juridisch"

addPropertyControls(SettV2Legal, {
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Juridisch" },
    title: { type: ControlType.String, title: "Titel", defaultValue: "Algemene voorwaarden" },
    updated: { type: ControlType.String, title: "Bijgewerkt", placeholder: "9 november 2026" },
    intro: { type: ControlType.String, title: "Intro", displayTextArea: true },
    pdf: { type: ControlType.File, title: "PDF", allowedFileTypes: ["pdf"] },
    pdfLabel: { type: ControlType.String, title: "PDF-knop", defaultValue: "Download als PDF" },
    sections: {
        type: ControlType.Array,
        title: "Artikelen",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Kop" },
                body: { type: ControlType.String, title: "Tekst", displayTextArea: true, description: "Lege regel: nieuwe alinea. \"- \" aan het begin: opsomming." },
            },
        },
    },
    id: { type: ControlType.String, title: "Bedrijfsgegevens", displayTextArea: true },
} as never)
