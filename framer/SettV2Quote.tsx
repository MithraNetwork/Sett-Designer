// Sett V2 Quote — the pre-order page: put your Sett together, leave your details and
// ask for a quote. Nothing is bought or paid here. The request (every choice plus the
// contact details) is posted as JSON to a webhook (Make, Zapier, n8n… which can pass
// it on to Pipedrive). Until a webhook is filled in, or when it can't be reached,
// the request opens as a ready-to-send e-mail instead, so nothing gets lost.
// Links like /pre-order?laden=2&batch=eerste&voor=bedrijf preselect the choices.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, Lines, useReveal, onCanvas, V, Img, or } from "./SettV2Kit.tsx"

interface Props {
    eyebrow?: string
    headline?: string
    lead?: string
    badges?: string
    model?: string
    price?: string
    priceFrom?: string
    priceAmount?: string
    priceNote?: string
    image1?: Img
    image2?: Img
    reasons?: string
    batchNote?: string
    webhook?: string
    email?: string
    phone?: string
    phoneLink?: string
    privacyLink?: string
    btwLink?: string
    button?: string
    successTitle?: string
    successBody?: string
    anchor?: string
    style?: React.CSSProperties
}

type Who = "particulier" | "bedrijf" | "organisatie"
type Form = {
    voor: Who
    laadpalen: 1 | 2
    redenen: string[]
    installatie: "zelf" | "sett"
    moment: "eerste" | "kleiner"
    naam: string
    bedrijf: string
    email: string
    telefoon: string
    postcode: string
    huisnummer: string
    opmerking: string
    akkoord: boolean
    website: string // honeypot: people never see it, bots fill it in
}
const WHO: [Who, string, string][] = [
    ["particulier", "Voor mijn woning", "Onder je oprit of parkeerplek"],
    ["bedrijf", "Voor mijn bedrijf", "Op je terrein of parkeerplaats"],
    ["organisatie", "Gemeente of organisatie", "Voor een wijk, VvE of openbare ruimte"],
]
const LABEL = {
    voor: { particulier: "Woning", bedrijf: "Bedrijf", organisatie: "Gemeente / organisatie" },
    installatie: { zelf: "Regel ik zelf", sett: "Door Sett" },
    moment: { eerste: "Eerste Setts (plaatsing Q1 2027)", kleiner: "Kleinere variant" },
}
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean)

const CSS = `
.v2o{ padding:clamp(120px, 16vh, 170px) 0 120px; scroll-margin-top:80px; }
.v2o-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2o-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2o .v2-display{ font-size:clamp(44px, 7.4cqi, 124px); max-width:12ch; }
.v2o-lead{ margin-top:clamp(18px, 3vh, 28px); }
/* the price, large, right under the intro */
.v2o-price{ margin-top:clamp(26px, 4vh, 40px); display:flex; flex-direction:column; gap:6px; }
.v2o-price .from{ color:rgba(223,228,244,.6); }
.v2o-price .amount{ display:flex; align-items:baseline; flex-wrap:wrap; gap:6px 16px; }
.v2o-price b{ font-weight:900; font-size:clamp(38px, 4.4cqi, 68px); line-height:.95; letter-spacing:-.045em; color:${V.lime}; }
.v2o-price span.note{ font-weight:600; font-size:clamp(16px, 1.3cqi, 20px); color:rgba(223,228,244,.75); }
.v2o-badges{ display:flex; flex-wrap:wrap; gap:8px; margin-top:26px; }
.v2o-badges span{ display:inline-flex; align-items:center; gap:8px; height:36px; padding:0 14px; border-radius:999px; background:rgba(223,228,244,.07); font-weight:600; font-size:15px; color:#F4F6FB; }
.v2o-badges span::before{ content:""; width:14px; height:14px; flex:none; background:${V.lime};
  -webkit-mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 12.5l5 5L20 6.5' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/contain no-repeat;
          mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 12.5l5 5L20 6.5' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/contain no-repeat; }

.v2o-grid{ display:grid; grid-template-columns:minmax(0, 1.25fr) minmax(0, .9fr); gap:clamp(28px, 4cqi, 64px); align-items:start; margin-top:clamp(48px, 8vh, 88px); }
.v2o-form{ display:flex; flex-direction:column; gap:14px; min-width:0; }
.v2o-step{ border:0; margin:0; padding:clamp(20px, 2.4cqi, 32px); border-radius:26px; background:${V.ink2}; box-shadow:inset 0 0 0 1px rgba(223,228,244,.08); min-width:0; }
.v2o-step legend{ float:left; width:100%; padding:0; margin-bottom:6px; display:flex; align-items:baseline; gap:12px; font-weight:800; font-size:clamp(21px, 1.9cqi, 26px); letter-spacing:-.02em; line-height:1.15; }
.v2o-step legend i{ font:600 12px "Sett Mono","Geist Mono",monospace; font-style:normal; letter-spacing:.1em; color:${V.lime}; flex:none; transform:translateY(-2px); }
.v2o-hint{ clear:both; font-size:15px; line-height:1.5; color:rgba(223,228,244,.6); margin-bottom:16px; max-width:560px; }
.v2o-step legend + .v2o-opts, .v2o-step legend + .v2o-fields{ clear:both; margin-top:16px; }

.v2o-opts{ display:grid; grid-template-columns:repeat(var(--n, 2), minmax(0, 1fr)); gap:10px; }
.v2o-opt{ position:relative; display:flex; flex-direction:column; gap:4px; padding:16px 44px 16px 16px; border-radius:18px; cursor:pointer;
  background:rgba(223,228,244,.04); box-shadow:inset 0 0 0 1px rgba(223,228,244,.12); transition:box-shadow .2s, background .2s; }
.v2o-opt:hover{ background:rgba(223,228,244,.07); }
.v2o-opt b{ font-weight:700; font-size:17px; line-height:1.25; }
.v2o-opt small{ font-size:14px; line-height:1.4; color:rgba(223,228,244,.58); }
.v2o-opt::after{ content:""; position:absolute; top:16px; right:14px; width:20px; height:20px; border-radius:99px; box-shadow:inset 0 0 0 1.5px rgba(223,228,244,.3); transition:background .2s, box-shadow .2s; }
.v2o-opt.on{ background:rgba(141,255,102,.07); box-shadow:inset 0 0 0 1.5px ${V.lime}; }
.v2o-opt.on::after{ background:${V.lime} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6 12.5l4 4L18 8' fill='none' stroke='%23060C1A' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/14px no-repeat; box-shadow:none; }
.v2o-opt.box::after{ border-radius:6px; }
.v2o-opt:has(input:focus-visible){ outline:2px solid ${V.lime}; outline-offset:3px; }
.v2o-sr{ position:absolute; opacity:0; width:1px; height:1px; pointer-events:none; }

.v2o-fields{ display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:12px; }
.v2o-field{ display:flex; flex-direction:column; gap:7px; grid-column:span 6; min-width:0; }
.v2o-field.half{ grid-column:span 3; } .v2o-field.third{ grid-column:span 2; } .v2o-field.two3{ grid-column:span 4; }
.v2o-field span{ font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:rgba(223,228,244,.6); }
.v2o-field span em{ font-style:normal; text-transform:none; letter-spacing:0; color:rgba(223,228,244,.6); }
.v2o-field input, .v2o-field textarea{ width:100%; min-width:0; height:52px; padding:0 16px; border:0; border-radius:14px; background:rgba(223,228,244,.06); box-shadow:inset 0 0 0 1px rgba(223,228,244,.14);
  color:#F4F6FB; font:500 17px "Sett Outfit",Outfit, system-ui; outline:none; transition:box-shadow .2s, background .2s; }
.v2o-field textarea{ height:auto; min-height:96px; padding:14px 16px; resize:vertical; line-height:1.45; }
.v2o-field input::placeholder, .v2o-field textarea::placeholder{ color:rgba(223,228,244,.45); }
.v2o-field input:focus, .v2o-field textarea:focus{ background:rgba(223,228,244,.09); box-shadow:inset 0 0 0 1.5px ${V.lime}; }
.v2o-field.bad input{ box-shadow:inset 0 0 0 1.5px ${V.sun}; }
.v2o-field .err{ font:500 13px "Sett Outfit",Outfit, system-ui; letter-spacing:0; text-transform:none; color:${V.sun}; }
.v2o-trap{ position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
.v2o-check{ display:flex; gap:12px; align-items:flex-start; margin-top:16px; font-size:15px; line-height:1.5; color:rgba(223,228,244,.75); cursor:pointer; }
.v2o-check input{ flex:none; width:20px; height:20px; margin:1px 0 0; accent-color:${V.lime}; }
.v2o-check a, .v2o-note a{ text-decoration:underline; text-underline-offset:3px; }
.v2o-check.bad{ color:${V.sun}; }

.v2o-send{ display:flex; flex-direction:column; gap:12px; align-items:flex-start; margin-top:8px; }
.v2o-send .v2-btn{ border:0; cursor:pointer; font-family:"Sett Outfit",Outfit, system-ui; }
.v2o-send .v2-btn[disabled]{ opacity:.6; cursor:progress; }
.v2o-send p{ font-size:14px; color:rgba(223,228,244,.55); line-height:1.5; }
.v2o-alert{ padding:14px 16px; border-radius:14px; background:rgba(255,185,43,.1); color:#FFD98A; font-size:15px; line-height:1.5; }
.v2o-alert button{ all:unset; cursor:pointer; text-decoration:underline; text-underline-offset:3px; font-weight:700; }

/* the summary: a light card, sticky beside the form */
.v2o-side{ position:sticky; top:100px; min-width:0; }
.v2o-sum{ border-radius:28px; background:${V.paper}; color:${V.paperInk}; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,.3); }
.v2o-pic{ position:relative; aspect-ratio:4 / 3; background:linear-gradient(180deg, #FFFFFF, #ECEDF0); }
.v2o-pic img{ transition:opacity .45s ease; }
.v2o-pic .tag{ position:absolute; left:18px; top:18px; padding:6px 10px; border-radius:99px; background:#fff; font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.1em; text-transform:uppercase; box-shadow:0 4px 14px rgba(11,14,26,.08); }
.v2o-sum-in{ padding:22px 24px 24px; }
.v2o-sum h3{ font-weight:800; font-size:26px; letter-spacing:-.02em; }
.v2o-sum .price{ margin-top:2px; font-size:16px; color:${V.paperMuted}; }
.v2o-rows{ margin:18px 0 0; border-top:1px solid rgba(11,14,26,.1); }
.v2o-rows div{ display:flex; justify-content:space-between; gap:16px; padding:10px 0; border-bottom:1px solid rgba(11,14,26,.08); font-size:15px; }
.v2o-rows dt{ color:${V.paperMuted}; flex:none; }
.v2o-rows dd{ margin:0; font-weight:600; text-align:right; min-width:0; }
.v2o-pay{ display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding:14px 16px; border-radius:16px; background:#E6F9DD; }
.v2o-pay span{ font-weight:600; font-size:15px; }
.v2o-pay b{ font-weight:900; font-size:26px; letter-spacing:-.02em; }
.v2o-note{ margin-top:14px; font-size:13px; line-height:1.5; color:${V.paperMuted}; }
.v2o-sum .v2-btn{ width:100%; justify-content:center; margin-top:18px; background:${V.paperInk}; color:#fff; border:0; cursor:pointer; font-family:"Sett Outfit",Outfit, system-ui; }
.v2o-sum .v2-btn[disabled]{ opacity:.6; cursor:progress; }
.v2o-call{ display:block; margin-top:12px; text-align:center; font-size:14px; color:${V.paperMuted}; text-decoration:underline !important; text-underline-offset:3px; }

/* after sending */
.v2o-done{ padding:clamp(24px, 3cqi, 40px); border-radius:26px; background:${V.ink2}; box-shadow:inset 0 0 0 1.5px ${V.lime}; }
.v2o-done .ok{ display:flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:99px; background:${V.lime}; color:${V.ink}; margin-bottom:22px; }
.v2o-done h2{ font-weight:800; font-size:clamp(30px, 3.4cqi, 48px); letter-spacing:-.03em; line-height:1.02; }
.v2o-done p{ margin-top:14px; font-size:18px; line-height:1.5; color:rgba(223,228,244,.75); max-width:560px; }
.v2o-done ol{ margin-top:26px; display:flex; flex-direction:column; gap:12px; counter-reset:n; }
.v2o-done li{ display:flex; gap:14px; align-items:flex-start; font-size:16px; line-height:1.45; counter-increment:n; }
.v2o-done li::before{ content:counter(n); flex:none; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:99px; background:rgba(141,255,102,.14); color:${V.lime}; font:700 13px "Sett Mono","Geist Mono",monospace; }
.v2o-done .again{ all:unset; cursor:pointer; margin-top:24px; display:inline-block; font-size:15px; color:rgba(223,228,244,.6); text-decoration:underline; text-underline-offset:3px; }

@container (max-width: 1000px){
  .v2o-grid{ grid-template-columns:1fr; }
  /* one column: the summary follows the form as the last check, with the send button in it */
  .v2o-side{ position:relative; top:auto; }
  .v2o-sum{ display:grid; grid-template-columns:minmax(0, .9fr) minmax(0, 1.1fr); }
  .v2o-pic{ aspect-ratio:auto; min-height:100%; }
  .v2o-send .v2-btn{ display:none; }
  .v2o-grid{ gap:14px; }
}
@container (max-width: 640px){
  .v2o-opts{ grid-template-columns:1fr; }
  .v2o-field.half, .v2o-field.third, .v2o-field.two3{ grid-column:span 6; }
  .v2o-field.pc{ grid-column:span 3; } .v2o-field.nr{ grid-column:span 3; }
  .v2o-sum{ display:block; }
  .v2o-pic{ aspect-ratio:16 / 10; }
  .v2o-step{ border-radius:22px; }
  .v2o-send .v2-btn{ width:100%; justify-content:center; }
}
`

const Check = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Quote(props: Props) {
    const p = props
    const head = useRef<HTMLDivElement>(null)
    useReveal(head)
    const reasons = lines(or(p.reasons, "Virtuele verzwaring\nPeak shaving\nEigen opgewekte energie opslaan\nEigen auto('s) laden"))
    const model = or(p.model, "Sett 96")
    const mail = or(p.email, "info@sett.nl")
    const formId = "v2o-" + or(p.anchor, "aanvraag")

    const [f, setF] = useState<Form>({ voor: "particulier", laadpalen: 1, redenen: [], installatie: "zelf", moment: "eerste", naam: "", bedrijf: "", email: "", telefoon: "", postcode: "", huisnummer: "", opmerking: "", akkoord: false, website: "" })
    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
    const [bad, setBad] = useState<Partial<Record<keyof Form, string>>>({})
    const [state, setState] = useState<"edit" | "sending" | "sent" | "mailed">("edit")
    const [failed, setFailed] = useState(false)
    const top = useRef<HTMLDivElement>(null)

    // choices from the link (?laden=2&batch=eerste&voor=bedrijf), as the old pre-order page used them
    useEffect(() => {
        if (typeof window === "undefined" || onCanvas()) return
        const q = new URLSearchParams(window.location.search)
        const laden = (q.get("laden") || "").trim()[0]
        const batch = (q.get("batch") || "").toLowerCase()
        const voor = (q.get("voor") || "").toLowerCase() as Who
        setF((x) => ({
            ...x,
            laadpalen: laden === "2" ? 2 : laden === "1" ? 1 : x.laadpalen,
            moment: /klein/.test(batch) ? "kleiner" : /eerst/.test(batch) ? "eerste" : x.moment,
            voor: WHO.some((w) => w[0] === voor) ? voor : x.voor,
        }))
    }, [])

    const business = f.voor !== "particulier"
    const payload = () => ({
        type: "offerteaanvraag",
        model,
        voor: LABEL.voor[f.voor],
        laadpalen: f.laadpalen,
        redenen: f.redenen,
        installatie: LABEL.installatie[f.installatie],
        moment: LABEL.moment[f.moment],
        naam: f.naam.trim(),
        bedrijf: business ? f.bedrijf.trim() : "",
        email: f.email.trim(),
        telefoon: f.telefoon.trim(),
        postcode: f.postcode.trim().toUpperCase().replace(/^(\d{4})\s*([A-Z]{2})$/, "$1 $2"),
        huisnummer: f.huisnummer.trim(),
        opmerking: f.opmerking.trim(),
        pagina: typeof window !== "undefined" ? window.location.href : "",
        verstuurd: new Date().toISOString(),
    })
    const mailto = () => {
        const d = payload()
        const body = [
            "Hallo Sett,",
            "",
            "Ik wil graag een offerte voor een " + model + ".",
            "",
            "Voor: " + d.voor,
            "Laadpalen: " + d.laadpalen,
            "Waarom Sett: " + (d.redenen.join(", ") || "-"),
            "Installatie: " + d.installatie,
            "Wanneer: " + d.moment,
            "",
            "Naam: " + d.naam,
            ...(d.bedrijf ? ["Bedrijf / organisatie: " + d.bedrijf] : []),
            "E-mail: " + d.email,
            "Telefoon: " + d.telefoon,
            "Adres: " + d.postcode + " " + d.huisnummer,
            ...(d.opmerking ? ["", "Opmerking: " + d.opmerking] : []),
        ].join("\n")
        return "mailto:" + mail + "?subject=" + encodeURIComponent("Offerteaanvraag " + model + " — " + d.naam) + "&body=" + encodeURIComponent(body)
    }

    const check = () => {
        const e: Partial<Record<keyof Form, string>> = {}
        if (f.naam.trim().length < 2) e.naam = "Vul je naam in"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Vul een geldig e-mailadres in"
        if (f.telefoon.replace(/[^\d]/g, "").length < 9) e.telefoon = "Vul je telefoonnummer in"
        if (!/^\d{4}\s?[a-z]{2}$/i.test(f.postcode.trim())) e.postcode = "Bijv. 3871 KN"
        if (!f.huisnummer.trim()) e.huisnummer = "Vul je huisnummer in"
        if (business && !f.bedrijf.trim()) e.bedrijf = "Vul de naam in"
        if (!f.akkoord) e.akkoord = "Nodig om contact met je op te nemen"
        setBad(e)
        return e
    }

    const send = async (ev?: React.FormEvent) => {
        ev?.preventDefault()
        if (state === "sending") return
        const e = check()
        const first = Object.keys(e)[0]
        if (first) {
            const el = document.getElementById(formId + "-" + first)
            el?.scrollIntoView({ behavior: "smooth", block: "center" })
            ;(el as HTMLInputElement | null)?.focus?.({ preventScroll: true })
            return
        }
        if (f.website) return setState("sent") // a bot: act as if it worked
        const hook = (p.webhook || "").trim()
        if (!/^https:\/\//.test(hook)) {
            window.location.href = mailto()
            setState("mailed")
            return top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        setState("sending")
        setFailed(false)
        const body = JSON.stringify(payload())
        try {
            let ok = false
            try {
                const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body })
                ok = r.ok
            } catch {
                // the webhook doesn't allow JSON from other sites (CORS): send it as plain text,
                // which needs no permission (the answer can't be read, but the request arrives)
                await fetch(hook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body })
                ok = true
            }
            if (!ok) throw new Error("webhook")
            setState("sent")
            top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        } catch {
            setState("edit")
            setFailed(true)
        }
    }

    const toggle = (r: string) => set("redenen", f.redenen.includes(r) ? f.redenen.filter((x) => x !== r) : [...f.redenen, r])
    const field = (k: keyof Form, label: string, cls: string, input: React.InputHTMLAttributes<HTMLInputElement>, optional = false) => (
        <label className={"v2o-field " + cls + (bad[k] ? " bad" : "")}>
            <span>
                {label} {optional && <em>(optioneel)</em>}
            </span>
            <input id={formId + "-" + k} value={String(f[k])} onChange={(e) => (set(k, e.target.value as never), bad[k] && setBad((b) => ({ ...b, [k]: undefined })))} aria-invalid={!!bad[k]} {...input} />
            {bad[k] && <span className="err">{bad[k]}</span>}
        </label>
    )
    const radio = <K extends "voor" | "laadpalen" | "installatie" | "moment">(k: K, v: Form[K], title: string, sub?: string) => (
        <label key={String(v)} className={"v2o-opt" + (f[k] === v ? " on" : "")}>
            <input className="v2o-sr" type="radio" name={formId + "-" + k} checked={f[k] === v} onChange={() => set(k, v)} />
            <b>{title}</b>
            {sub && <small>{sub}</small>}
        </label>
    )

    const sending = state === "sending"
    const img = f.laadpalen === 2 ? p.image2 : p.image1
    const summary = (
        <aside className="v2o-side" aria-label="Jouw aanvraag">
            <div className="v2o-sum">
                <div className="v2o-pic">
                    {[p.image1, p.image2].map((im, i) =>
                        im?.src ? <img key={i} src={im.src} srcSet={im.srcSet} alt={im.alt || model + " met " + (i + 1) + (i ? " laadpalen" : " laadpaal")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: img === im ? 1 : 0 }} /> : null
                    )}
                    <span className="tag">{f.laadpalen === 2 ? "2 laadpalen" : "1 laadpaal"}</span>
                </div>
                <div className="v2o-sum-in">
                    <h3>{model}</h3>
                    <p className="price">{or(p.price, "Vanaf € 39.999 excl. btw")}</p>
                    <dl className="v2o-rows">
                        <div><dt>Voor</dt><dd>{LABEL.voor[f.voor]}</dd></div>
                        <div><dt>Laadpalen</dt><dd>{f.laadpalen} (inbegrepen)</dd></div>
                        <div><dt>Installatie</dt><dd>{LABEL.installatie[f.installatie]}</dd></div>
                        <div><dt>Wanneer</dt><dd>{LABEL.moment[f.moment]}</dd></div>
                    </dl>
                    <div className="v2o-pay">
                        <span>Nu te betalen</span>
                        <b>€ 0</b>
                    </div>
                    <p className="v2o-note">
                        Je bestelt vrijblijvend en betaalt nu niets. Prijzen zijn exclusief btw, plaatsing en installatie.
                        {f.voor === "particulier" && (
                            <>
                                {" "}Particulier? Voor een thuisbatterij kun je mogelijk btw terugvragen:{" "}
                                <a href={or(p.btwLink, "https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/content/thuisbatterij-btw")} target="_blank" rel="noopener noreferrer">
                                    Belastingdienst
                                </a>
                                .
                            </>
                        )}
                    </p>
                    {state === "edit" || sending ? (
                        <button className="v2-btn" type="submit" form={formId} disabled={sending}>
                            {sending ? "Versturen…" : or(p.button, "Vraag offerte aan")} <span className="arr" aria-hidden="true">→</span>
                        </button>
                    ) : null}
                    <a className="v2o-call" href={or(p.phoneLink, V.phone)}>
                        Liever bellen? {or(p.phone, "+31 (0) 33 210 41 40")}
                    </a>
                </div>
            </div>
        </aside>
    )

    return (
        <section id={or(p.anchor, "aanvraag")} className="v2 v2o" style={p.style}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2-wrap">
                <div ref={head}>
                    <div className="v2o-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Bestellen · eerste Setts")}</div>
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "Vraag jouw|Sett aan.")} />
                    </h1>
                    <p className="v2o-lead v2-lead v2-fade">{or(p.lead, "Stel je Sett samen en laat je gegevens achter. Je betaalt nu niets: we nemen contact met je op en maken een offerte op maat, inclusief de installatie als je dat wilt.")}</p>
                    {p.priceAmount !== "" && (
                        <div className="v2o-price v2-fade">
                            <span className="from v2-mono">{or(p.priceFrom, model + " · vanaf")}</span>
                            <div className="amount">
                                <b>{p.priceAmount ?? "€ 39.999"}</b>
                                <span className="note">{or(p.priceNote, "excl. btw")}</span>
                            </div>
                        </div>
                    )}
                    <div className="v2o-badges v2-fade">
                        {lines(or(p.badges, "€ 0 aanbetaling\nVrijblijvend\nOfferte op maat")).map((b, i) => (
                            <span key={i}>{b}</span>
                        ))}
                    </div>
                </div>

                <div ref={top} className="v2o-grid" style={{ scrollMarginTop: 90 }}>
                    {state === "sent" || state === "mailed" ? (
                        <div className="v2o-done" role="status">
                            <div className="ok">
                                <Check />
                            </div>
                            {state === "sent" ? (
                                <>
                                    <h2>{or(p.successTitle, "Bedankt, je aanvraag is binnen.")}</h2>
                                    <p>{or(p.successBody, "We nemen zo snel mogelijk contact met je op om je situatie door te nemen. Daarna ontvang je een offerte op maat.")}</p>
                                </>
                            ) : (
                                <>
                                    <h2>Je aanvraag staat klaar in je mail.</h2>
                                    <p>
                                        Je mailprogramma is geopend met je aanvraag erin. Druk daar op verzenden. Geen mail geopend? Mail naar <a href={"mailto:" + mail} style={{ textDecoration: "underline" }}>{mail}</a> of bel{" "}
                                        <a href={or(p.phoneLink, V.phone)} style={{ textDecoration: "underline" }}>{or(p.phone, "+31 (0) 33 210 41 40")}</a>.
                                    </p>
                                </>
                            )}
                            <ol>
                                <li>We bellen je voor een kort gesprek over je plek, je aansluiting en je verbruik.</li>
                                <li>We kijken samen naar de locatie en de installatie.</li>
                                <li>Je ontvangt een offerte op maat. Pas als je die tekent, bestel je.</li>
                            </ol>
                            {state === "mailed" && (
                                <button className="again" type="button" onClick={() => (window.location.href = mailto())}>
                                    Mail opnieuw openen
                                </button>
                            )}
                        </div>
                    ) : (
                        <form id={formId} className="v2o-form" onSubmit={send} noValidate>
                            <fieldset className="v2o-step">
                                <legend><i>01</i>Voor wie is Sett?</legend>
                                <div className="v2o-opts" style={{ ["--n" as string]: 3 } as React.CSSProperties}>
                                    {WHO.map(([v, t, s]) => (
                                        radio("voor", v, t, s)
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="v2o-step">
                                <legend><i>02</i>Hoeveel laadpalen wil je?</legend>
                                <div className="v2o-opts">
                                    {radio("laadpalen", 1 as const, "1 laadpaal", "Inbegrepen")}
                                    {radio("laadpalen", 2 as const, "2 laadpalen", "Inbegrepen")}
                                </div>
                            </fieldset>

                            <fieldset className="v2o-step">
                                <legend><i>03</i>Waarom kies je voor Sett?</legend>
                                <p className="v2o-hint">Kies wat voor jou telt, meerdere mag.</p>
                                <div className="v2o-opts">
                                    {reasons.map((r) => (
                                        <label key={r} className={"v2o-opt box" + (f.redenen.includes(r) ? " on" : "")}>
                                            <input className="v2o-sr" type="checkbox" checked={f.redenen.includes(r)} onChange={() => toggle(r)} />
                                            <b>{r}</b>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="v2o-step">
                                <legend><i>04</i>Wie installeert Sett?</legend>
                                <p className="v2o-hint">De prijs van Sett is exclusief installatie. Een goede hovenier, grondwerker en e-installateur kunnen Sett ook voor je plaatsen.</p>
                                <div className="v2o-opts">
                                    {radio("installatie", "zelf" as const, "Ik regel de installatie zelf", "Met je eigen hovenier, grondwerker en e-installateur.")}
                                    {radio("installatie", "sett" as const, "Sett installeert voor mij", "We nemen de installatie mee in je offerte.")}
                                </div>
                            </fieldset>

                            <fieldset className="v2o-step">
                                <legend><i>05</i>Wanneer wil je Sett?</legend>
                                <div className="v2o-opts">
                                    {radio("moment", "eerste" as const, "Zo snel mogelijk, een " + model, or(p.batchNote, "Je hoort bij de eerste Setts. We mikken op plaatsing in Q1 2027."))}
                                    {radio("moment", "kleiner" as const, "Ik wacht op een kleinere variant", "Je hoort als eerste wanneer een kleinere Sett er is.")}
                                </div>
                            </fieldset>

                            <fieldset className="v2o-step">
                                <legend><i>06</i>Jouw gegevens</legend>
                                <p className="v2o-hint">Zodat we je kunnen bellen en je plek kunnen bekijken.</p>
                                <div className="v2o-fields">
                                    {field("naam", "Naam", business ? "half" : "", { autoComplete: "name", placeholder: "Voor- en achternaam" })}
                                    {business && field("bedrijf", f.voor === "bedrijf" ? "Bedrijfsnaam" : "Organisatie", "half", { autoComplete: "organization" })}
                                    {field("email", "E-mail", "half", { type: "email", autoComplete: "email", inputMode: "email", placeholder: "naam@voorbeeld.nl" })}
                                    {field("telefoon", "Telefoon", "half", { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "06 12345678" })}
                                    {field("postcode", "Postcode", "third pc", { autoComplete: "postal-code", placeholder: "3871 KN", maxLength: 7 })}
                                    {field("huisnummer", "Huisnummer", "third nr", { placeholder: "18" })}
                                    <label className="v2o-field">
                                        <span>
                                            Opmerking <em>(optioneel)</em>
                                        </span>
                                        <textarea value={f.opmerking} onChange={(e) => set("opmerking", e.target.value)} placeholder="Bijv. je zonnepanelen, je aansluiting of je plannen" rows={3} />
                                    </label>
                                    <label className="v2o-trap" aria-hidden="true">
                                        Website <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
                                    </label>
                                </div>
                                <label className={"v2o-check" + (bad.akkoord ? " bad" : "")}>
                                    <input id={formId + "-akkoord"} type="checkbox" checked={f.akkoord} onChange={(e) => (set("akkoord", e.target.checked), setBad((b) => ({ ...b, akkoord: undefined })))} />
                                    <span>
                                        Sett mag mijn gegevens gebruiken om contact met mij op te nemen over deze bestelling (
                                        <a href={or(p.privacyLink, "/privacy")} target="_blank" rel="noopener noreferrer">
                                            privacyverklaring
                                        </a>
                                        ).
                                    </span>
                                </label>
                            </fieldset>

                            <div className="v2o-send">
                                {failed && (
                                    <div className="v2o-alert" role="alert">
                                        Versturen lukte niet. Probeer het nog eens, of{" "}
                                        <button type="button" onClick={() => ((window.location.href = mailto()), setState("mailed"))}>
                                            stuur je aanvraag per mail
                                        </button>
                                        .
                                    </div>
                                )}
                                <button className="v2-btn lime" type="submit" disabled={sending}>
                                    {sending ? "Versturen…" : or(p.button, "Vraag offerte aan")} <span className="arr" aria-hidden="true">→</span>
                                </button>
                                <p>Vrijblijvend: je bestelling is pas definitief als je de offerte tekent.</p>
                            </div>
                        </form>
                    )}
                    {summary}
                </div>
            </div>
        </section>
    )
}

SettV2Quote.displayName = "Sett V2 · Offerte"

addPropertyControls(SettV2Quote, {
    webhook: { type: ControlType.String, title: "Webhook", placeholder: "https://hook.eu1.make.com/…", description: "Waar aanvragen heen gaan (JSON). Leeg: de aanvraag opent als e-mail naar het adres hieronder." },
    email: { type: ControlType.String, title: "E-mail", defaultValue: "info@sett.nl" },
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Bestellen · eerste Setts" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Vraag jouw|Sett aan." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Stel je Sett samen en laat je gegevens achter. Je betaalt nu niets: we nemen contact met je op en maken een offerte op maat, inclusief de installatie als je dat wilt." },
    badges: { type: ControlType.String, title: "Punten", displayTextArea: true, description: "Eén per regel.", defaultValue: "€ 0 aanbetaling\nVrijblijvend\nOfferte op maat" },
    model: { type: ControlType.String, title: "Model", defaultValue: "Sett 96" },
    price: { type: ControlType.String, title: "Prijs (kaart)", defaultValue: "Vanaf € 39.999 excl. btw", description: "In de samenvatting rechts." },
    priceFrom: { type: ControlType.String, title: "Prijs: label", defaultValue: "Sett 96 · vanaf" },
    priceAmount: { type: ControlType.String, title: "Prijs: bedrag", defaultValue: "€ 39.999", description: "Groot bovenaan. Leeg: niet tonen." },
    priceNote: { type: ControlType.String, title: "Prijs: toevoeging", defaultValue: "excl. btw" },
    image1: { type: ControlType.ResponsiveImage, title: "Beeld 1 laadpaal" },
    image2: { type: ControlType.ResponsiveImage, title: "Beeld 2 laadpalen" },
    reasons: { type: ControlType.String, title: "Redenen", displayTextArea: true, description: "Eén per regel.", defaultValue: "Virtuele verzwaring\nPeak shaving\nEigen opgewekte energie opslaan\nEigen auto('s) laden" },
    batchNote: { type: ControlType.String, title: "Batch", displayTextArea: true, defaultValue: "Je hoort bij de eerste Setts. We mikken op plaatsing in Q1 2027." },
    button: { type: ControlType.String, title: "Knop", defaultValue: "Vraag offerte aan" },
    successTitle: { type: ControlType.String, title: "Bedankt", defaultValue: "Bedankt, je aanvraag is binnen." },
    successBody: { type: ControlType.String, title: "Bedankt-tekst", displayTextArea: true, defaultValue: "We nemen zo snel mogelijk contact met je op om je situatie door te nemen. Daarna ontvang je een offerte op maat." },
    phone: { type: ControlType.String, title: "Telefoon", defaultValue: "+31 (0) 33 210 41 40" },
    phoneLink: { type: ControlType.Link, title: "Telefoonlink", defaultValue: "tel:+31332104140" },
    privacyLink: { type: ControlType.Link, title: "Privacy", defaultValue: "/privacy" },
    btwLink: { type: ControlType.Link, title: "Btw-info", defaultValue: "https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/content/thuisbatterij-btw" },
    anchor: { type: ControlType.String, title: "Anker", defaultValue: "aanvraag" },
})
