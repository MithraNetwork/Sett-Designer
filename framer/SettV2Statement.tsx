// Sett V2 Statement — one big sentence, pinned, that fills in word by word as
// you scroll. Chosen words light up in an accent colour.

import * as React from "react"
import { useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { V2Style, useProgress, range, V, or } from "./SettV2Kit.tsx"

interface Props {
    label?: string
    text?: string
    highlight?: string
    accent?: string
    note?: string
    theme?: "dark" | "paper"
    level?: string
    style?: React.CSSProperties
}

const CSS = `
.v2s-stage{ position:sticky; top:0; height:100vh; display:flex; flex-direction:column; justify-content:center; }
.v2s-text{ font-weight:800; letter-spacing:-0.035em; line-height:1.02; font-size:clamp(34px, 5.4cqi, 96px); max-width:18ch; }
.v2s-text span{ transition:color .25s linear, opacity .25s linear; }
.v2s-top{ display:flex; justify-content:space-between; gap:20px; margin-bottom:48px; }
.v2s-note{ margin-top:48px; max-width:560px; }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Statement(props: Props) {
    const p = props
    const root = useRef<HTMLDivElement>(null)
    const t = useProgress(root, "pin", 1)
    const words = (or(p.text, "Er zijn twee pieken op het net en beiden worden elke dag groter.")).split(/\s+/)
    const hi = new Set((or(p.highlight, "twee pieken, groter")).split(",").flatMap((s) => s.trim().toLowerCase().split(/\s+/)).filter(Boolean))
    const paper = p.theme === "paper"
    const accent = or(p.accent, paper ? V.purple : V.lime)
    const dim = paper ? "rgba(11,14,26,.14)" : "rgba(255,255,255,.14)"
    const full = paper ? V.paperInk : "#fff"
    const f = range(t, 0.08, 0.78) * words.length
    return (
        <section ref={root} className={"v2" + (paper ? " paper" : "")} style={{ height: "210vh", ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2s-stage">
                <div className="v2-wrap">
                    <div className="v2s-top v2-mono v2-muted">
                        <span>{or(p.label, "Het probleem")}</span>
                        <span>{or(p.level, "+ 0,00 → + 8,50 m · boven het maaiveld")}</span>
                    </div>
                    <p className="v2s-text">
                        {words.map((w, i) => {
                            const on = Math.min(1, Math.max(0, f - i))
                            const key = w.toLowerCase().replace(/[^\p{L}\d]/gu, "")
                            const color = on > 0.5 ? (hi.has(key) ? accent : full) : dim
                            return (
                                <span key={i} style={{ color }}>
                                    {w + " "}
                                </span>
                            )
                        })}
                    </p>
                    {p.note && <p className="v2s-note v2-lead">{p.note}</p>}
                </div>
            </div>
        </section>
    )
}

SettV2Statement.displayName = "Sett V2 · Statement"

addPropertyControls(SettV2Statement, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Het probleem" },
    text: { type: ControlType.String, title: "Zin", displayTextArea: true, defaultValue: "Er zijn twee pieken op het net en beiden worden elke dag groter." },
    highlight: { type: ControlType.String, title: "Accentwoorden", defaultValue: "twee pieken, groter", description: "Komma-gescheiden." },
    accent: { type: ControlType.Color, title: "Accent" },
    note: { type: ControlType.String, title: "Toelichting", displayTextArea: true },
    theme: { type: ControlType.Enum, title: "Thema", options: ["dark", "paper"], optionTitles: ["Donker", "Papier"], defaultValue: "dark" },
    level: { type: ControlType.String, title: "Peil", defaultValue: "+ 0,00 → + 8,50 m · boven het maaiveld" },
})
