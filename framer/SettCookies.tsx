// Sett cookie notice: a small card at the bottom right of the screen, on the first visit,
// until the visitor chooses. "Alles accepteren", "Alleen noodzakelijk", or per type
// under "Instellingen". The choice is kept in the browser (localStorage) for a year.
// It is passed on to Google Consent Mode (gtag / GTM dataLayer, when the site has one)
// and announced as a "sett:consent" event, so tracking can wait for it. A link to
// "#cookies" anywhere on the site opens the settings again.
// SettNav shows it on every page; it can also be placed on its own.

import * as React from "react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { SettFonts } from "./SettFonts.tsx"

export type Consent = { v: 1; analytics: boolean; marketing: boolean; at: string }
const KEY = "sett-cookies"
const YEAR = 365 * 24 * 3600 * 1000

export function readConsent(): Consent | null {
    try {
        const c = JSON.parse(localStorage.getItem(KEY) || "null") as Consent | null
        return c && c.v === 1 && Date.now() - Date.parse(c.at) < YEAR ? c : null
    } catch {
        return null
    }
}
// tells Google Consent Mode and anything listening what was chosen
function announce(c: Consent) {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] }
    const g = (b: boolean) => (b ? "granted" : "denied")
    const state = { analytics_storage: g(c.analytics), ad_storage: g(c.marketing), ad_user_data: g(c.marketing), ad_personalization: g(c.marketing) }
    if (typeof w.gtag === "function") w.gtag("consent", "update", state)
    else if (Array.isArray(w.dataLayer)) w.dataLayer.push(["consent", "update", state])
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: "sett_consent", analytics: c.analytics, marketing: c.marketing })
    window.dispatchEvent(new CustomEvent("sett:consent", { detail: c }))
}

export interface CookieText {
    title?: string
    body?: string
    privacyLink?: string
    accept?: string
    reject?: string
}
const DEF = {
    title: "Cookies op sett.nl",
    body: "We gebruiken noodzakelijke cookies om de site te laten werken. Met jouw toestemming gebruiken we ook analytische en marketingcookies, om de site te verbeteren en je relevante informatie te laten zien.",
    privacyLink: "/privacy",
    accept: "Alles accepteren",
    reject: "Alleen noodzakelijk",
}
const or = (v: string | undefined, d: string) => (v === undefined || v === null || v === "" ? d : v)

const CSS = `
.sck{ position:fixed; right:16px; bottom:16px; z-index:2147482000; width:min(420px, calc(100vw - 32px)); max-height:calc(100vh - 32px); overflow:auto;
  padding:20px; border-radius:22px; background:#0B1224; color:#F4F6FB; box-shadow:0 24px 70px rgba(0,0,0,.45), inset 0 0 0 1px rgba(223,228,244,.12);
  font:400 15px/1.5 "Sett Outfit",Outfit,"Outfit Placeholder",system-ui,sans-serif; -webkit-font-smoothing:antialiased; box-sizing:border-box;
  opacity:0; transform:translateY(16px); transition:opacity .35s ease, transform .45s cubic-bezier(.2,.8,.1,1); }
.sck *{ box-sizing:border-box; }
.sck.in{ opacity:1; transform:none; }
.sck h2{ margin:0 0 6px; font-weight:800; font-size:19px; letter-spacing:-.01em; display:flex; align-items:center; gap:10px; }
.sck h2::before{ content:""; width:8px; height:8px; border-radius:99px; background:#8DFF66; box-shadow:0 0 14px #8DFF66; flex:none; }
.sck p{ margin:0; color:rgba(223,228,244,.78); }
.sck a{ color:#F4F6FB; text-decoration:underline; text-underline-offset:3px; }
.sck-btns{ display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
.sck button{ font:700 15px "Sett Outfit",Outfit, system-ui; border:0; cursor:pointer; height:44px; padding:0 18px; border-radius:999px; transition:background .2s, color .2s, transform .2s; }
.sck button:focus-visible{ outline:2px solid #8DFF66; outline-offset:2px; }
.sck .yes{ background:#8DFF66; color:#060C1A; flex:1 1 auto; }
.sck .no{ background:transparent; color:#F4F6FB; box-shadow:inset 0 0 0 1.5px rgba(223,228,244,.35); flex:1 1 auto; }
.sck .no:hover{ background:#F4F6FB; color:#060C1A; }
.sck .more{ background:none; height:auto; padding:6px 0; color:rgba(223,228,244,.75); text-decoration:underline; text-underline-offset:3px; font-weight:600; }
.sck-types{ margin-top:14px; display:flex; flex-direction:column; gap:8px; }
.sck-type{ display:flex; gap:12px; align-items:flex-start; padding:12px 14px; border-radius:14px; background:rgba(223,228,244,.05); cursor:pointer; }
.sck-type b{ display:block; font-weight:700; font-size:15px; }
.sck-type small{ display:block; color:rgba(223,228,244,.65); font-size:13px; line-height:1.45; }
.sck-type input{ flex:none; width:20px; height:20px; margin:2px 0 0; accent-color:#8DFF66; }
.sck-type.locked{ cursor:default; }
@media (max-width: 520px){ .sck{ left:10px; right:10px; bottom:10px; width:auto; padding:18px; } }
@media (prefers-reduced-motion: reduce){ .sck{ transition:none; } }
`

export function CookieBanner({ text = {}, preview = false }: { text?: CookieText; preview?: boolean }) {
    const [open, setOpen] = useState(false)
    const [shown, setShown] = useState(false)
    const [more, setMore] = useState(false)
    const [analytics, setAnalytics] = useState(false)
    const [marketing, setMarketing] = useState(false)
    const [host, setHost] = useState<HTMLElement | null>(null)

    useEffect(() => {
        if (typeof document === "undefined") return
        setHost(document.body)
        const saved = readConsent()
        if (saved) {
            announce(saved)
            setAnalytics(saved.analytics)
            setMarketing(saved.marketing)
        } else setOpen(true)
        // "#cookies" links (in the footer, the privacy text) open the settings again
        const reopen = () => {
            const c = readConsent()
            setAnalytics(!!c?.analytics)
            setMarketing(!!c?.marketing)
            setMore(true)
            setOpen(true)
        }
        const onClick = (e: MouseEvent) => {
            const a = (e.target as Element | null)?.closest?.("a[href$='#cookies'], a[href$='#cookie-instellingen']")
            if (a) (e.preventDefault(), reopen())
        }
        document.addEventListener("click", onClick)
        ;(window as unknown as { settCookies?: { open: () => void } }).settCookies = { open: reopen }
        return () => document.removeEventListener("click", onClick)
    }, [])
    // fade in after mounting, fade out before unmounting
    useEffect(() => {
        if (!open) return
        const t = requestAnimationFrame(() => setShown(true))
        return () => cancelAnimationFrame(t)
    }, [open])

    const save = (a: boolean, m: boolean) => {
        const c: Consent = { v: 1, analytics: a, marketing: m, at: new Date().toISOString() }
        try {
            localStorage.setItem(KEY, JSON.stringify(c))
        } catch {
            /* private mode: the choice holds for this visit */
        }
        announce(c)
        setShown(false)
        setTimeout(() => (setOpen(false), setMore(false)), 350)
    }

    if (!host || (!open && !preview)) return null
    const card = (
        <div className={"sck" + (shown || preview ? " in" : "")} role="dialog" aria-modal="false" aria-labelledby="sck-title" style={preview ? { position: "absolute" } : undefined}>
            <SettFonts />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <h2 id="sck-title">{or(text.title, DEF.title)}</h2>
            <p>
                {or(text.body, DEF.body)}{" "}
                <a href={or(text.privacyLink, DEF.privacyLink)} target="_blank" rel="noopener noreferrer">
                    Privacyverklaring
                </a>
            </p>
            {more && (
                <div className="sck-types">
                    <label className="sck-type locked">
                        <input type="checkbox" checked disabled />
                        <span>
                            <b>Noodzakelijk</b>
                            <small>Voor het werken van de site, zoals deze keuze onthouden. Altijd aan.</small>
                        </span>
                    </label>
                    <label className="sck-type">
                        <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                        <span>
                            <b>Analytisch</b>
                            <small>Anoniem meten hoe de site gebruikt wordt, zodat we hem kunnen verbeteren.</small>
                        </span>
                    </label>
                    <label className="sck-type">
                        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                        <span>
                            <b>Marketing</b>
                            <small>Relevante advertenties en het meten van campagnes.</small>
                        </span>
                    </label>
                </div>
            )}
            <div className="sck-btns">
                <button className="yes" type="button" onClick={() => save(true, true)}>
                    {or(text.accept, DEF.accept)}
                </button>
                {more ? (
                    <button className="no" type="button" onClick={() => save(analytics, marketing)}>
                        Keuze opslaan
                    </button>
                ) : (
                    <button className="no" type="button" onClick={() => save(false, false)}>
                        {or(text.reject, DEF.reject)}
                    </button>
                )}
                {!more && (
                    <button className="more" type="button" onClick={() => setMore(true)}>
                        Instellingen
                    </button>
                )}
            </div>
        </div>
    )
    return preview ? card : createPortal(card, host)
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 452
 * @framerIntrinsicHeight 260
 */
export default function SettCookies(props: CookieText & { style?: React.CSSProperties }) {
    // on the Framer canvas: show the card where it was placed, so it can be checked
    const canvas = (() => {
        try {
            return RenderTarget.current() === RenderTarget.canvas
        } catch {
            return false
        }
    })()
    return (
        <div style={{ position: "relative", width: "100%", height: "100%", ...props.style }}>
            <CookieBanner text={props} preview={canvas} />
        </div>
    )
}

SettCookies.displayName = "Sett · Cookiemelding"

addPropertyControls(SettCookies, {
    title: { type: ControlType.String, title: "Titel", defaultValue: DEF.title },
    body: { type: ControlType.String, title: "Tekst", displayTextArea: true, defaultValue: DEF.body },
    privacyLink: { type: ControlType.Link, title: "Privacy", defaultValue: DEF.privacyLink },
    accept: { type: ControlType.String, title: "Accepteren", defaultValue: DEF.accept },
    reject: { type: ControlType.String, title: "Weigeren", defaultValue: DEF.reject },
})
