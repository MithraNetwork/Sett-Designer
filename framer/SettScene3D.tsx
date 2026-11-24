// Sett 3D Scene — Framer Code Component
// Ported from the standalone Three.js page. Same scene, same behavior
// (5 camera views, the light↔dark toggle sweeping through all 5 moods,
// window glow, trees, car+cable) minus the mouse-wheel-drives-lighting
// binding, which doesn't belong inside a scrollable Framer page.
//
// SETUP — read this before dragging the component onto your canvas:
// 1. In Framer, open the Assets panel and drag in your three model files:
//      sett-v8.obj, sett-v8.mtl, tesla-y2.stl
//    (or whatever your house/car files are named — the loader doesn't
//    care about filenames, only which prop you point at which file).
// 2. Select this component on the canvas, open its property panel, and
//    set "House OBJ", "House MTL", and "Car STL" to those three files.
// 3. That's it — the component fills whatever frame you put it in.
//
// The page's text content lives in the property panel, not in the canvas:
// "Page heading" / "Page summary" go into the markup as a hidden H1 + summary
// (and into a <noscript> fallback together with all six chapters) so search
// engines and text-only agents can read a page that is otherwise one WebGL
// canvas. Keep them filled in.
//
// If Framer's file picker balks at .obj/.mtl/.stl (some Framer versions
// restrict the File control to a fixed allow-list), host the three files
// anywhere with a public URL (your own server, a bucket, GitHub raw, …)
// and switch the three ControlType.File entries below to ControlType.String,
// then paste the URLs into the property panel instead.

import * as React from "react"
import { useEffect, useId, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

// pinned to the current latest (0.185.1) — verified against the real
// published package (constructors, SSAOPass.OUTPUT, loader signatures) before
// porting; the color-management API changed since r128 (see renderer setup
// below: outputColorSpace instead of outputEncoding, physicallyCorrectLights
// is gone entirely — physically-correct lighting is just how it works now)
import * as THREE from "https://esm.sh/three@0.185.1"
import { OrbitControls } from "https://esm.sh/three@0.185.1/examples/jsm/controls/OrbitControls.js"
import { OBJLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/OBJLoader.js"
import { MTLLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/MTLLoader.js"
import { STLLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/STLLoader.js"
import { EffectComposer } from "https://esm.sh/three@0.185.1/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "https://esm.sh/three@0.185.1/examples/jsm/postprocessing/RenderPass.js"
import { SSAOPass } from "https://esm.sh/three@0.185.1/examples/jsm/postprocessing/SSAOPass.js"
import { ShaderPass } from "https://esm.sh/three@0.185.1/examples/jsm/postprocessing/ShaderPass.js"
import { FXAAShader } from "https://esm.sh/three@0.185.1/examples/jsm/shaders/FXAAShader.js"
import { FilmPass } from "https://esm.sh/three@0.185.1/examples/jsm/postprocessing/FilmPass.js"

// every colorable group in the scene. Each maps to a property-panel color;
// see COLOR_ROLES below for which model parts land in which bucket
type ColorRole =
    | "walls"
    | "frame"
    | "windows"
    | "door"
    | "pathway"
    | "settBin"
    | "battery"
    | "batteryBlocks"
    | "inverter"
    | "cooling"
    | "chargePole"
    | "solarPanels"
    | "car"
    | "treeLeaves"
    | "treeTrunk"
    | "bushes"
    | "wireframe"
    | "energyLine"
    | "energyDay"
    | "energyGrid"
    | "gridTower"
    | "logo"
type Colors = Record<ColorRole, string>

interface Props extends Colors {
    objUrl: string
    mtlUrl: string
    carUrl: string
    wireframeMode: boolean
    wireframeDetail: number
    grainAmount: number
    storyMode: boolean
    textSide?: "left" | "right"
    quality?: "high" | "balanced" | "low"
    mobileLite?: boolean
    solarLineAlways?: boolean
    moreInfoLabel?: string
    moreInfoLink?: string
    moreInfoNewTab?: boolean
    moreInfoColor?: string
    moreInfoTextColor?: string
    preOrder?: boolean
    preOrderLabel?: string
    preOrderLink?: string
    preOrderNewTab?: boolean
    preOrderColor?: string
    preOrderTextColor?: string
    seoBlock?: boolean
    seoHeading?: string
    seoIntro?: string
    sceneAlt?: string
    onDarkChange?: (dark: boolean) => void
    onMoreInfo?: () => void
    onPreOrder?: () => void
    style?: React.CSSProperties
    // storyTitle1..6 / storyBody1..6 — per-chapter copy, see STORY_TEXT_DEFAULTS
    // chapterLabel1..6 — the chapter bar's labels, see STORY_DEFS[].label
    [key: string]: any
}

const COLOR_ROLE_LIST: ColorRole[] = [
    "walls", "frame", "windows", "door", "pathway", "settBin", "battery", "batteryBlocks",
    "inverter", "cooling", "chargePole", "solarPanels", "car", "treeLeaves", "treeTrunk", "bushes", "wireframe", "energyLine", "energyDay", "energyGrid", "gridTower", "logo",
]

// the scroll story: six stops, each a camera view + time of day (index into
// LIGHT_PRESETS: 0 Ochtend, 1 Middag, 2 Avond, 3 Nacht) + the state of the
// three energy lines. By day the flow is panels→batteries (`dayReveal` is how
// far along it has got, `dayFade` its opacity); after dark it's
// batteries→house and batteries→car instead, and the day line fades out.
// "eave" is resolved to an arc-length fraction once the line exists.
// Chapter 0 is the opening shot the scene loads into; only the grid feed
// flows there. `gridReveal` is the pylon→Sett line: on by day, dotted-out at
// night when the house line (dotted by day) takes over — "off-grid".
// `charge` is the batteries' level: grey at Start, tinting to green as the
// day goes on, full once it's dark. `dayStart` is where the solar line's flow
// begins: 0 = from the panels; at dusk it moves to 1, draining the flow off
// the roof and into the battery.
const STORY_DEFS = [
    { key: "start", label: "Start", view: "hero", day: 0, dayReveal: 0, dayStart: 0, houseReveal: 0, carReveal: 0, gridStart: 0, charge: 0 },
    { key: "solar", label: "Zon", view: "solar", day: 0, dayReveal: "eave", dayStart: 0, houseReveal: 0, carReveal: 0, gridStart: 0, charge: 0.3 },
    { key: "battery", label: "Opslag", view: "open", day: 1, dayReveal: 1, dayStart: 0, houseReveal: 0, carReveal: 0, gridStart: 0, charge: 0.65 },
    { key: "night", label: "Nacht", view: "hero", day: 3, dayReveal: 1, dayStart: 1, houseReveal: 1, carReveal: 0, gridStart: 1, charge: 1 },
    { key: "charge", label: "Laden", view: "charge", day: 3, dayReveal: 1, dayStart: 1, houseReveal: 1, carReveal: 1, gridStart: 1, charge: 1 },
    { key: "overview", label: "Overzicht", view: "top", day: 3, dayReveal: 1, dayStart: 1, houseReveal: 1, carReveal: 1, gridStart: 1, charge: 1 },
]

// one icon per chapter, for the narrow-screen nav where the labels don't fit
function chapterIcon(key: string) {
    var st = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    if (key === "solar")
        return (
            <svg viewBox="0 0 24 24" {...st}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
            </svg>
        )
    if (key === "battery")
        return (
            <svg viewBox="0 0 24 24" {...st}>
                <rect x="2.5" y="8" width="16" height="9" rx="2.5" />
                <path d="M21 11.2v2.6" />
                <path d="M6 11.5v2M10 11.5v2M14 11.5v2" />
            </svg>
        )
    if (key === "night")
        return (
            <svg viewBox="0 0 24 24" {...st}>
                <path d="M20 14.6A8.6 8.6 0 0 1 9.4 4a7.2 7.2 0 1 0 10.6 10.6z" />
            </svg>
        )
    if (key === "charge")
        return (
            <svg viewBox="0 0 24 24" {...st}>
                <path d="M13.2 2.5 6.4 13.1h4.7l-1 8.4 6.9-10.9h-4.6z" />
            </svg>
        )
    if (key === "overview")
        return (
            <svg viewBox="0 0 24 24" {...st}>
                <rect x="3" y="3" width="7.2" height="7.2" rx="1.6" />
                <rect x="13.8" y="3" width="7.2" height="7.2" rx="1.6" />
                <rect x="3" y="13.8" width="7.2" height="7.2" rx="1.6" />
                <rect x="13.8" y="13.8" width="7.2" height="7.2" rx="1.6" />
            </svg>
        )
    return (
        <svg viewBox="0 0 24 24" {...st}>
            <path d="M3.8 11.2 12 4.6l8.2 6.6V20a.8.8 0 0 1-.8.8h-4.6v-5.6H9.2v5.6H4.6a.8.8 0 0 1-.8-.8z" />
        </svg>
    )
}

// per-chapter copy; the property panel can override every one of these
const STORY_TEXT_DEFAULTS = [
    { title: "Het net is vol. Maar de grond is leeg.", body: "Sett is de thuisbatterij die ondergronds gaat: zonne-energie opslaan, het huis voeden en de auto laden, zonder het net te belasten." },
    { title: "Overdag vangt het dak zonne-energie op.", body: "De zonnepanelen leveren meer dan het huis op dat moment gebruikt. Dat overschot gaat niet het volle net op: het gaat de grond in." },
    { title: "Opgeslagen in de Sett, onder de grond.", body: "De ondergrondse batterij neemt de zonnestroom op. Onzichtbaar, en zonder een vierkante meter openbare ruimte te kosten." },
    { title: "’s Avonds komt de energie terug.", body: "Zodra de zon weg is, voedt de Sett het huis. Geen piek op het net, geen lege batterij." },
    { title: "Laden zonder het net te belasten.", body: "De auto laadt ’s nachts rechtstreeks uit de Sett: de laadpaal vraagt niets extra van het net." },
    { title: "Eén systeem. Zon, opslag en laden.", body: "Overdag opladen met de zon, ’s nachts terugleveren aan huis en auto. Eén oplossing voor netcongestie die niemand ziet en geen openbare ruimte kost." },
]

// the two call-to-action buttons (pre-order above, more-info below); every
// value here is overridable from the property panel
const CTA_DEFAULTS = {
    moreInfoLabel: "Meer informatie",
    moreInfoColor: "#4265FF",
    moreInfoTextColor: "#FFFFFF",
    preOrderLabel: "Bestellen",
    preOrderColor: "#25CF77",
    preOrderTextColor: "#FFFFFF",
}

// crawlable copy: the scene carries this message visually, so the same thing is
// written out in the markup for search engines, screen readers and text-only
// agents (every string is editable from the property panel)
const SEO_DEFAULTS = {
    heading: "Sett: de thuisbatterij die ondergronds gaat",
    intro:
        "Sett slaat zonne-energie ondergronds op en voedt je huis zodra de zon weg is. ’s Nachts laadt Sett je auto, zonder het stroomnet te belasten en zonder een vierkante meter openbare ruimte te kosten.",
    alt: "3D-weergave van een woning met zonnepanelen, een ondergrondse Sett-thuisbatterij in de tuin en een laadpaal met een elektrische auto.",
}

// once the loader has run in this tab the model is cached (by the browser and by
// THREE.Cache below), so coming back to the page gets a short loader, not the full
// first-visit one
const LOADER_SEEN_KEY = "sett3d:loaded"

// keep fetched model files in memory for the lifetime of the page: Framer routes
// between pages without a reload, so returning to the hero re-mounts this
// component — with the cache on, that skips the network entirely
THREE.Cache.enabled = true

// the no-JS fallback has to be handed to <noscript> as a raw string: React
// drops JSX children inside a noscript on the client, and the HTML parser
// treats that element's content as text anyway (it is only parsed as markup
// when scripting is off, which is exactly when it should show)
function escHtml(v: string) {
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// the sett mark (viewBox 0 0 615 564) — the preloader traces its outline and
// fills it as the model downloads
const SETT_MARK =
    "M149.773 308.113C139.705 327.729 154.469 350.73 177.119 350.73H273.912C285.414 350.736 294.276 360.522 292.804 371.553L269.181 547.135C267.945 556.324 259.849 563.2 250.266 563.2H107.227C96.6933 563.2 88.1513 554.941 88.1513 544.756V312.22C88.1513 302.033 79.6093 293.776 69.0759 293.776H19.0754C8.54578 293.771 0 285.515 0 275.332V182.39C0 172.205 8.54578 163.949 19.0754 163.945H69.0759C79.6093 163.945 88.1513 155.688 88.1513 145.501V18.4443C88.1513 8.2578 96.6933 0 107.227 0H277.269C291.427 0 300.648 14.3881 294.353 26.6488L149.773 308.113ZM507.177 0C517.711 0 526.253 8.2578 526.253 18.4443V145.501C526.253 155.688 534.791 163.945 545.328 163.945H595.325C605.858 163.951 614.4 172.207 614.4 182.39V275.332C614.4 285.515 605.858 293.77 595.325 293.776H545.328C534.791 293.776 526.253 302.033 526.253 312.22V544.756C526.253 554.941 517.711 563.2 507.177 563.2H353.624C339.706 563.2 330.474 549.26 336.296 537.039L466.604 263.443C475.913 243.895 461.14 221.592 438.887 221.584H340.939C329.249 221.583 320.311 211.5 322.085 200.329L351.419 15.6446C352.849 6.6447 360.857 0 370.273 0H507.177Z"

const ENERGY_VERT = `
    uniform float uReveal;
    uniform float uStart;
    uniform float uShrink;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        // the un-revealed (dotted) part is drawn thinner by pulling the tube wall inward
        float dotted = max(step(uReveal, uv.x), 1.0 - step(uStart, uv.x));
        vec3 p = position - normal * (uShrink * dotted);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
`
// uv.x on a TubeGeometry is the arc-length fraction along the path, so the
// reveal cut-off and the travelling pulse both key straight off it
const ENERGY_FRAG = `
    uniform vec3 uColor;
    uniform float uReveal; // flow ends here (arc-length fraction)
    uniform float uStart;  // flow begins here — raised to drain a line from its source end
    uniform float uFade;
    uniform float uTime;
    uniform float uAlpha;
    uniform float uPulses; // how many pulse waves fit along the line
    uniform float uDots;   // 1 = the un-revealed part shows as grey static dashes instead of nothing
    uniform float uDashes; // dash count along the line
    varying vec2 vUv;
    void main() {
        if (uFade <= 0.001) discard;
        if (vUv.x > uReveal || vUv.x < uStart) {
            if (uDots < 0.5) discard;
            if (fract(vUv.x * uDashes) > 0.45) discard;
            gl_FragColor = vec4(vec3(0.62), 0.55 * uFade); // inactive: neutral grey dots
            return;
        }
        // active: a coloured line with soft brightness pulses travelling along it
        float tip = smoothstep(uReveal, uReveal - 0.03, vUv.x) * smoothstep(uStart, uStart + 0.03, vUv.x);
        float pulse = 0.5 + 0.5 * sin(vUv.x * uPulses - uTime * 2.6);
        pulse = pow(pulse, 3.0);
        float a = uAlpha * uFade * (0.62 + 0.38 * pulse) * tip;
        gl_FragColor = vec4(uColor * (0.9 + 0.45 * pulse), a);
    }
`

// Framer hands colors over as CSS strings (hex, rgb(), or rgba()). THREE.Color
// reads hex/rgb fine but warns and drops alpha on rgba(), so strip that first
function cssToColor(css: string | undefined, fallback: string): THREE.Color {
    var s = (css || fallback).trim()
    var m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (m) return new THREE.Color(Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255)
    var c = new THREE.Color()
    try {
        c.set(s as any)
    } catch (e) {
        c.set(fallback as any)
    }
    return c
}

// defaults match the sett brand palette as set up in the Framer property panel
const COLOR_DEFAULTS: Colors = {
    walls: "#DCDEE3",
    frame: "#95A3C2",
    windows: "#4A4A4A",
    door: "#6B6C6E",
    pathway: "#BCB8AE",
    settBin: "#95A3C2",
    battery: "#25CF77",
    batteryBlocks: "#25CF77",
    inverter: "#95A3C2",
    cooling: "#525252",
    chargePole: "#25CF77",
    solarPanels: "#95A3C2",
    car: "#696969",
    treeLeaves: "#A1A1A1",
    treeTrunk: "#B0B0B0",
    bushes: "#A1A1A1",
    wireframe: "#bfe4ff",
    energyLine: "#25CF77",
    energyDay: "#E9B44C",
    energyGrid: "#4F7BF2",
    gridTower: "#7A7D85",
    logo: "#FFFFFF",
}

export default function SettScene3D(props: Props) {
    const { objUrl, mtlUrl, carUrl, wireframeMode, wireframeDetail, grainAmount, style } = props
    const storyMode = props.storyMode !== false
    const textSide = props.textSide === "right" ? "right" : "left"
    // render budget: pixel-ratio cap, shadow-map size, SSAO sample count (or no SSAO at all)
    const quality: "high" | "balanced" | "low" = props.quality === "high" || props.quality === "low" ? props.quality : "balanced"
    const solarLineAlways = !!props.solarLineAlways
    const mobileLite = props.mobileLite !== false
    const moreInfoLabel = String(props.moreInfoLabel || "").trim() || CTA_DEFAULTS.moreInfoLabel
    const preOrder = props.preOrder !== false
    const preOrderLabel = String(props.preOrderLabel || "").trim() || CTA_DEFAULTS.preOrderLabel
    // with a link set the button is a real <a> (so Framer's page router,
    // middle-click and "open in new tab" all behave); without one it stays a
    // <button> that only fires its event handler
    const preOrderLink = String(props.preOrderLink || "").trim()
    const preOrderNewTab = !!props.preOrderNewTab
    const moreInfoLink = String(props.moreInfoLink || "").trim()
    const moreInfoNewTab = !!props.moreInfoNewTab
    const moreInfoStyle = {
        background: props.moreInfoColor || CTA_DEFAULTS.moreInfoColor,
        color: props.moreInfoTextColor || CTA_DEFAULTS.moreInfoTextColor,
    }
    const preOrderStyle = {
        background: props.preOrderColor || CTA_DEFAULTS.preOrderColor,
        color: props.preOrderTextColor || CTA_DEFAULTS.preOrderTextColor,
    }
    const seoHeading = String(props.seoHeading || "").trim() || SEO_DEFAULTS.heading
    const seoIntro = String(props.seoIntro || "").trim() || SEO_DEFAULTS.intro
    const sceneAlt = String(props.sceneAlt || "").trim() || SEO_DEFAULTS.alt
    // kept in refs so swapping a handler never rebuilds the scene
    const onDarkRef = useRef(props.onDarkChange)
    onDarkRef.current = props.onDarkChange
    const onMoreInfoRef = useRef(props.onMoreInfo)
    onMoreInfoRef.current = props.onMoreInfo
    const onPreOrderRef = useRef(props.onPreOrder)
    onPreOrderRef.current = props.onPreOrder
    function fireMoreInfo() {
        if (onMoreInfoRef.current) onMoreInfoRef.current()
    }
    // fires on the link too, so an analytics action still runs before the page change
    function firePreOrder() {
        if (onPreOrderRef.current) onPreOrderRef.current()
    }
    const storyTextRef = useRef<HTMLDivElement>(null)
    // 3D-anchored popups
    const offgridRef = useRef<HTMLDivElement>(null)
    const houseBadgeRef = useRef<HTMLDivElement>(null)
    const carBadgeRef = useRef<HTMLDivElement>(null)
    const settBadgeRef = useRef<HTMLDivElement>(null)
    const carSocRef = useRef<HTMLSpanElement>(null)
    const carSocFillRef = useRef<SVGRectElement>(null)
    const settChargeRef = useRef<HTMLDivElement>(null)
    const settSocRef = useRef<HTMLSpanElement>(null)
    const settSocFillRef = useRef<SVGRectElement>(null)
    const scrollHintRef = useRef<HTMLDivElement>(null)
    const ctaWrapRef = useRef<HTMLDivElement>(null)

    // colors + grain are applied live (see the second effect below) instead of
    // rebuilding the whole scene — a 12MB OBJ reload per color-picker drag
    // would make the property panel unusable
    const colorsRef = useRef<Colors>(COLOR_DEFAULTS)
    const currentColors: Colors = { ...COLOR_DEFAULTS }
    COLOR_ROLE_LIST.forEach(function (k) {
        if ((props as any)[k]) currentColors[k] = (props as any)[k]
    })
    colorsRef.current = currentColors
    const sceneApiRef = useRef<null | { setColors: (c: Colors) => void; setGrain: (g: number) => void; fitHeadings: () => void }>(null)

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const canvasHostRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef<HTMLDivElement>(null)
    const loadingTextRef = useRef<HTMLSpanElement>(null)
    const markFillRef = useRef<SVGRectElement>(null)
    // the clip that reveals the solid fill needs an id, and a Framer page can hold
    // more than one instance of this component — so keep it per-instance
    const markClipId = "s3d-mark-clip-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const viewbarRef = useRef<HTMLDivElement>(null)
    const navPillRef = useRef<HTMLSpanElement>(null)
    const daytoggleRef = useRef<HTMLButtonElement>(null)
    const daytoggleKnobRef = useRef<HTMLSpanElement>(null)
    const daytoggleLabelRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!objUrl || !mtlUrl || !carUrl) return // property panel not filled in yet — nothing to load

        var stageWrap = stageRef.current!
        var stage = canvasHostRef.current!
        var loadingEl = loadingRef.current!
        // preloader: the mark's outline inks in from grey to black as the OBJ arrives
        // and fills solid from the bottom, eased so a fast load can't flash past
        // before you've seen it — but it must not hold up a load that has nothing
        // left to wait for. Once the model is in, the fill finishes at the quicker
        // rate, and on a second visit in the same session (the model is in the
        // browser's cache and in THREE's own by then) the whole thing is brief.
        var seenLoader = false
        try {
            seenLoader = window.sessionStorage.getItem(LOADER_SEEN_KEY) === "1"
        } catch (e) {}
        var FILL_MS = seenLoader ? 450 : 2100 // 0 → 100% while the model is still coming
        var FILL_MS_READY = seenLoader ? 300 : 1000 // …and once it has arrived
        var loadTarget = 0
        var loadShown = 0
        var loadDeterminate = false
        var modelReady = false
        var revealScene: null | (() => void) = null
        var MARK_H = 564 // the mark's viewBox height — the fill window's full travel
        function applyLoadFill(p: number) {
            // outline: grey #c9ccd3 → black #12141a
            var ir = Math.round(201 + (18 - 201) * p)
            var ig = Math.round(204 + (20 - 204) * p)
            var ib = Math.round(211 + (26 - 211) * p)
            loadingEl.style.setProperty("--mark-ink", "rgb(" + ir + "," + ig + "," + ib + ")")
            // solid black rising from the bottom over the 10% silhouette
            if (markFillRef.current) {
                var h = MARK_H * p
                markFillRef.current.setAttribute("y", String(MARK_H - h))
                markFillRef.current.setAttribute("height", String(h))
            }
            if (loadingTextRef.current) loadingTextRef.current.textContent = "Sett laden\u2026 " + Math.round(p * 100) + "%"
        }
        function setLoadProgress(p: number) {
            loadDeterminate = true
            loadTarget = Math.max(loadTarget, Math.max(0, Math.min(1, p)))
        }
        applyLoadFill(0)
        // the loader owns the viewport, so the page must not scroll behind it —
        // otherwise a flick of the wheel lands the visitor in the next section
        // before the scene has even appeared. overflow:hidden takes care of the
        // scrollbar and the default keyboard/wheel behaviour, and the captured
        // input handlers cover what it can't: iOS Safari's touch scrolling, and a
        // page whose real scroller is some element other than the viewport.
        var scrollLocked = false
        function blockScrollInput(e: Event) {
            e.preventDefault()
        }
        var SCROLL_KEYS = [" ", "Spacebar", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]
        function blockScrollKeys(e: KeyboardEvent) {
            var el = e.target as HTMLElement | null
            // never swallow typing (a nav search field, say) — only scroll keys
            if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
            if (SCROLL_KEYS.indexOf(e.key) >= 0) e.preventDefault()
        }
        function lockPageScroll() {
            if (scrollLocked) return
            scrollLocked = true
            var docEl = document.documentElement
            // pad out the width the scrollbar was taking, or the page jumps sideways
            var barW = window.innerWidth - docEl.clientWidth
            docEl.setAttribute("data-sett-loading", "1") // a hook for the site's own CSS
            docEl.style.overflow = "hidden"
            if (barW > 0) docEl.style.paddingRight = barW + "px"
            window.addEventListener("wheel", blockScrollInput, { passive: false, capture: true })
            window.addEventListener("touchmove", blockScrollInput, { passive: false, capture: true })
            window.addEventListener("keydown", blockScrollKeys, true)
        }
        function unlockPageScroll() {
            if (!scrollLocked) return
            scrollLocked = false
            var docEl = document.documentElement
            docEl.removeAttribute("data-sett-loading")
            docEl.style.overflow = ""
            docEl.style.paddingRight = ""
            window.removeEventListener("wheel", blockScrollInput, true)
            window.removeEventListener("touchmove", blockScrollInput, true)
            window.removeEventListener("keydown", blockScrollKeys, true)
        }
        lockPageScroll()
        // safety valve: a stalled download must never leave the page locked
        var scrollLockTimeout = window.setTimeout(unlockPageScroll, 15000)
        var lastFillMs = performance.now()
        var loadTimer = window.setInterval(function () {
            // paced by wall-clock, not per tick: a background tab throttles timers to
            // ~1/s, and stepping per tick would stretch the fill out to a minute
            var nowMs2 = performance.now()
            var dtFill = nowMs2 - lastFillMs
            lastFillMs = nowMs2
            // without byte counts there is nothing to track, so creep toward 70%
            if (!loadDeterminate && !modelReady) loadTarget = Math.min(0.7, loadTarget + dtFill / 6000)
            if (loadShown < loadTarget) loadShown = Math.min(loadTarget, loadShown + dtFill / (modelReady ? FILL_MS_READY : FILL_MS))
            applyLoadFill(loadShown)
            if (modelReady && loadShown >= 0.999) {
                window.clearInterval(loadTimer)
                if (revealScene) revealScene()
            }
        }, 16)
        var viewbar = viewbarRef.current!
        var navPill = navPillRef.current
        // the white pill behind the active chapter is one element that slides,
        // instead of a background hopping from button to button
        function syncNavPill(immediate?: boolean) {
            if (!navPill) return
            var btn = viewbar.querySelector("button.active") as HTMLElement | null
            if (!btn) {
                navPill.style.opacity = "0"
                return
            }
            var vr = viewbar.getBoundingClientRect()
            var br = btn.getBoundingClientRect()
            // absolutely positioned children start at the padding box, so the
            // measured offset has to lose the border as well
            var cs = window.getComputedStyle(viewbar)
            var bl = parseFloat(cs.borderLeftWidth) || 0
            var bt = parseFloat(cs.borderTopWidth) || 0
            if (immediate) navPill.style.transition = "none"
            navPill.style.opacity = "1"
            navPill.style.width = br.width + "px"
            navPill.style.height = br.height + "px"
            navPill.style.transform = "translate(" + (br.left - vr.left - bl) + "px," + (br.top - vr.top - bt) + "px)"
            if (immediate) {
                void navPill.offsetWidth // flush, so the next move animates from here
                navPill.style.transition = ""
            }
        }
        var ctaWrapEl = ctaWrapRef.current // the call-to-action stack (story mode only)
        // the day toggle isn't rendered in story mode (the story drives time
        // of day), so everything touching it below is guarded
        var daytoggle = daytoggleRef.current
        var daytoggleKnob = daytoggleKnobRef.current
        var daytoggleLabel = daytoggleLabelRef.current
        var heroEl = rootRef.current!

        var cancelled = false
        var rafId = 0

        // One decision, taken once at setup: on a phone the scene renders down a
        // cheaper path — 1× pixel ratio, no ambient occlusion, no multisampling,
        // no grain pass, a small shadow map and half as many environment
        // rebuilds. That is most of the per-pixel cost of a frame, and a phone
        // GPU feels all of it. The effect doesn't re-run on resize, so the mode
        // is whatever the page was opened at.
        var liteMode = mobileLite && window.innerWidth <= 760
        var renderQuality: "high" | "balanced" | "low" = liteMode ? "low" : quality

        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        // the pixel-ratio cap is the single biggest lever on fill-rate cost:
        // every post pass (SSAO, FXAA, grain) runs per rendered pixel
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, renderQuality === "high" ? 2 : renderQuality === "balanced" ? 1.5 : 1))
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap // PCFSoftShadowMap is deprecated in this version and silently falls back to this anyway
        renderer.outputColorSpace = THREE.SRGBColorSpace
        // physicallyCorrectLights was removed — physically-correct lighting
        // is simply how it works now, no toggle needed
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.35
        renderer.setClearColor(0x000000, 0)
        stage.appendChild(renderer.domElement)

        var scene = new THREE.Scene()
        var camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000)

        // render-on-demand: with rotate/zoom off, nothing in this scene actually
        // changes outside of a view transition, a toggle sweep, or a resize —
        // redrawing this at 60fps forever burns cycles for nothing
        var needsRender = true
        function requestRender() {
            needsRender = true
        }

        var pmrem = new THREE.PMREMGenerator(renderer)
        pmrem.compileEquirectangularShader()

        var keyLight = new THREE.DirectionalLight(0xffffff, 1)
        keyLight.castShadow = true
        var shadowRes = liteMode ? 512 : renderQuality === "high" ? 2048 : 1024
        keyLight.shadow.mapSize.set(shadowRes, shadowRes)
        keyLight.shadow.bias = -0.0004
        keyLight.shadow.radius = 6
        scene.add(keyLight)
        var rimLight = new THREE.DirectionalLight(0xffffff, 1)
        scene.add(rimLight)
        var bounceLight = new THREE.DirectionalLight(0xffffff, 1)
        scene.add(bounceLight)
        var fillLight = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
        scene.add(fillLight)
        // follows the camera so orbiting never swings a face into total black
        var viewLight = new THREE.DirectionalLight(0xfff2da, 1)
        scene.add(viewLight)
        scene.add(viewLight.target)

        // interior light spill: window glass materials (filled in once the model
        // loads) and a point light inside the house, both driven by windowGlow on
        // each LIGHT_PRESET — off in daylight, warm and lit after dark
        var windowMaterials: THREE.MeshBasicMaterial[] = []
        var houseLight = new THREE.PointLight(0xffcb8a, 0, 1)
        scene.add(houseLight)
        // after dark the Sett unit is the hero, so a cool spotlight picks it
        // out of the navy. decay 0 = no distance falloff, so intensity acts as
        // plain irradiance instead of needing a six-figure candela value to
        // reach across the scene. Aimed at the bin once the model loads.
        var settLight = new THREE.SpotLight(0xe8eeff, 0, 0, Math.PI / 7, 0.6, 0)
        scene.add(settLight)
        scene.add(settLight.target)
        var _winGlowColor = new THREE.Color()
        // multiplies ssaoPass's kernelRadius/min/maxDistance in animate() — full
        // strength (1) reads as moody grime at night, but smudges a bright sky
        var aoStrength = 1

        // wireframeMode: the house shell, trees and bushes turn into thin
        // blueprint-style outlines; the Sett unit, solar panels and the car
        // stay fully rendered so they read as the actual "product" against a
        // schematic backdrop. One shared unlit line material — unlit so the
        // line color stays consistent across every LIGHT_PRESET instead of
        // getting lit (and sometimes washed out or near-invisible) like a
        // normal PBR material with `wireframe:true` would.
        //
        // EdgesGeometry instead of material-level wireframe:true — the latter
        // draws every triangle edge, including the diagonal split down every
        // triangulated quad, which reads as visual noise rather than the
        // building's actual edges. EdgesGeometry only keeps edges where the
        // angle between adjacent faces exceeds a threshold, so flat panels
        // stay clean. wireframeDetail (0-100, from the property panel) maps
        // to that threshold: 0 = only sharp corners, 100 = almost every edge
        // materials grouped by color role so the property-panel colors can be
        // pushed onto them live. Trees/bushes carry a per-material lightness
        // offset (varL) so a single picked green still reads as several trees
        var roleMaterials: Record<string, { mat: THREE.Material; varL: number }[]> = {}
        function registerMat(role: ColorRole, mat: THREE.Material, varL?: number) {
            ;(roleMaterials[role] = roleMaterials[role] || []).push({ mat: mat, varL: varL || 0 })
        }
        function roleColor(role: ColorRole, varL?: number) {
            var c = cssToColor(colorsRef.current[role], COLOR_DEFAULTS[role])
            if (varL) c.offsetHSL(0, 0, varL)
            return c
        }
        // the flat, matte, low-poly look: no metalness, full roughness so
        // there are no specular hotspots, flatShading so curved surfaces
        // (the car, tree blobs) show their facets instead of smoothing over
        function flatMat(role: ColorRole, opts?: { opacity?: number; varL?: number }) {
            var mat = new THREE.MeshStandardMaterial({
                color: roleColor(role, opts && opts.varL),
                roughness: 1,
                metalness: 0,
                flatShading: true,
                transparent: !!(opts && opts.opacity != null && opts.opacity < 1),
                opacity: opts && opts.opacity != null ? opts.opacity : 1,
            })
            registerMat(role, mat, opts && opts.varL)
            return mat
        }

        var wireframeEdgeMat = wireframeMode ? new THREE.LineBasicMaterial({ color: roleColor("wireframe"), transparent: true, opacity: 0.55 }) : null
        if (wireframeEdgeMat) registerMat("wireframe", wireframeEdgeMat)
        var wireframeThresholdAngle = THREE.MathUtils.lerp(80, 1, Math.min(1, Math.max(0, (wireframeDetail ?? 50) / 100)))
        function applyWireframe(mesh: THREE.Mesh) {
            if (!wireframeEdgeMat) return
            var edges = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry, wireframeThresholdAngle)
            var lines = new THREE.LineSegments(edges, wireframeEdgeMat)
            // added as a SIBLING with the same local transform, not a child —
            // three.js skips a whole subtree once it hits an invisible parent,
            // so a `mesh.visible=false` + lines-as-child would silently hide
            // the lines too. Copying the mesh's local transform onto lines
            // and hanging it off the same parent keeps the world position
            // correct without that trap, and the original mesh is removed
            // outright rather than just hidden, since nothing needs it anymore
            lines.position.copy(mesh.position)
            lines.rotation.copy(mesh.rotation)
            lines.scale.copy(mesh.scale)
            lines.name = mesh.name // getObjectByName lookups (walls box for the energy line route) still resolve
            if (mesh.parent) {
                mesh.parent.add(lines)
                mesh.parent.remove(mesh)
            }
        }

        var ground = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.ShadowMaterial({ opacity: 0.45 }))
        ;(ground.material as any).userData.isShadowCatcher = true // swapped for the blueprint grid once the model loads — see setTimeOfDay
        ground.rotation.x = -Math.PI / 2
        ground.receiveShadow = true
        scene.add(ground)

        // ---------- day → evening: every knob gathered per moment of the day
        // so the transition between them is a single lerp per property ----------
        var DAY = {
            sky: ["#ffffff", "#f6f5f2", "#eae6de", "#dcd4c4"],
            glow: { inner: "rgba(255,248,222,0.98)", mid: "rgba(255,238,190,0.5)", outer: "rgba(255,238,190,0)", shadow: "rgba(255,230,160,0.3)" },
            sunSize: 95, sunPos: [0.78, 0.14],
            key: { color: 0xfff7e6, intensity: 1.5 },
            rim: { color: 0xfff1de, intensity: 0.5 },
            bounce: { color: 0xe9dac0, intensity: 0.5 },
            hemi: { sky: 0xf6f5f2, ground: 0xcdb98d, intensity: 1.6 },
            view: 0.55,
            exposure: 0.9,
            groundOpacity: 0.3,
            scrim: [24, 20, 16],
            keyDir: { x: 1.6, y: 3.2, z: -1.4 },
            rimDir: { x: -2, y: 1.4, z: 2 },
            windowGlow: { color: 0xffdcae, intensity: 0 },
            aoStrength: 0.5,
            settLight: 0, // spotlight on the buried unit — see settLight below; only lit once it's dark
        }
        var EVENING = {
            // navy, not black — the site's dark background is a deep blue
            sky: ["#0b0f2a", "#101538", "#171d44", "#1f2652"],
            glow: { inner: "rgba(230,226,214,0.95)", mid: "rgba(190,205,255,0.3)", outer: "rgba(190,205,255,0)", shadow: "rgba(160,190,255,0.16)" },
            sunSize: 70, sunPos: [0.8, 0.2],
            key: { color: 0xfff2da, intensity: 1.1 },
            rim: { color: 0x8fa6ff, intensity: 1.2 },
            bounce: { color: 0x4c5aa8, intensity: 0.35 },
            hemi: { sky: 0xc3cdff, ground: 0x11152a, intensity: 2.0 },
            view: 1.7,
            exposure: 1.05,
            groundOpacity: 0.45,
            scrim: [8, 11, 28],
            keyDir: { x: -0.33, y: 1.6, z: 2.1 },
            rimDir: { x: 0.25, y: 1.8, z: -2.82 },
            windowGlow: { color: 0xffdcae, intensity: 0.5 },
            aoStrength: 1,
            settLight: 1.0,
        }
        var MORNING = {
            sky: ["#ffffff", "#f9f8f4", "#f2ede0", "#e8dcc4"],
            glow: { inner: "rgba(255,250,235,0.9)", mid: "rgba(255,235,200,0.4)", outer: "rgba(255,235,200,0)", shadow: "rgba(255,225,180,0.25)" },
            sunSize: 80, sunPos: [0.25, 0.18],
            key: { color: 0xfff4e0, intensity: 1.33 },
            rim: { color: 0xcfe0ff, intensity: 0.6 },
            bounce: { color: 0xd9c9b0, intensity: 0.4 },
            hemi: { sky: 0xf3f0e6, ground: 0xc9b896, intensity: 1.55 },
            view: 0.5,
            exposure: 0.9,
            groundOpacity: 0.28,
            scrim: [20, 22, 26],
            keyDir: { x: -1.66, y: 1.8, z: -1.33 },
            rimDir: { x: 2.32, y: 1.2, z: 1.62 },
            windowGlow: { color: 0xffdcae, intensity: 0 },
            aoStrength: 0.45,
            settLight: 0,
        }
        var NIGHT = {
            // a deep navy night sky with a pale moon up in the corner, matching
            // the homepage mock — pure black flattened everything into a void
            sky: ["#0d1130", "#111640", "#171d4a", "#1e2558"],
            glow: { inner: "rgba(222,219,207,0.98)", mid: "rgba(170,195,255,0.28)", outer: "rgba(170,195,255,0)", shadow: "rgba(150,180,255,0.2)" },
            sunSize: 75, sunPos: [0.82, 0.1],
            // the dark presets need a far stronger hemisphere fill than a
            // linear scale-down of the day values gives: ACES crushes the low
            // end, and on flat diffuse materials the fill IS the visible light
            // (the key sits behind the house at night). The old saturated rim
            // was also what turned every wall electric blue — kept, but tamed
            key: { color: 0xcdd8ff, intensity: 0.9 },
            rim: { color: 0x5a76ff, intensity: 1.0 },
            bounce: { color: 0x1c2454, intensity: 0.25 },
            hemi: { sky: 0x8f97b4, ground: 0x1c2238, intensity: 2.4 },
            view: 2.1,
            exposure: 1.15,
            groundOpacity: 0.55,
            scrim: [4, 5, 14],
            keyDir: { x: -1.98, y: 2.4, z: 0.77 },
            rimDir: { x: 2.56, y: 2.0, z: -1.2 },
            // was 1.3 in saturated orange — read as flat neon squares. Paler
            // and at ~half opacity so it's a lived-in warmth, not a light box
            windowGlow: { color: 0xffdcae, intensity: 0.6 },
            aoStrength: 1.1,
            settLight: 1.2,
        }
        // ordered chronologically — dayProgress sweeps across all of them, and
        // the daytoggle animates straight across on each click
        var LIGHT_PRESETS = [
            { key: "morning", label: "Ochtend", cfg: MORNING },
            { key: "day", label: "Middag", cfg: DAY },
            { key: "evening", label: "Avond", cfg: EVENING },
            { key: "night", label: "Nacht", cfg: NIGHT },
        ]

        function lerp(a: number, b: number, t: number) {
            return a + (b - a) * t
        }
        function lerpColor(target: THREE.Color, a: number, b: number, t: number) {
            return target.copy(new THREE.Color(a)).lerp(new THREE.Color(b), t)
        }
        function lerpCss(a: string, b: string, t: number) {
            function parse(s: string) {
                if (s.charAt(0) === "#") {
                    var n = parseInt(s.slice(1), 16)
                    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
                }
                var m = s.match(/[\d.]+/g)!.map(Number)
                return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]
            }
            var ca = parse(a),
                cb = parse(b)
            return (
                "rgba(" +
                Math.round(lerp(ca[0], cb[0], t)) +
                "," +
                Math.round(lerp(ca[1], cb[1], t)) +
                "," +
                Math.round(lerp(ca[2], cb[2], t)) +
                "," +
                lerp(ca[3], cb[3], t).toFixed(3) +
                ")"
            )
        }

        var envRT: THREE.WebGLRenderTarget | null = null
        var envBucket = -1
        var DAY_MAX = LIGHT_PRESETS.length - 1
        function lightSegment(t: number) {
            var i = Math.max(0, Math.min(DAY_MAX - 1, Math.floor(t)))
            return { a: LIGHT_PRESETS[i].cfg, b: LIGHT_PRESETS[i + 1].cfg, frac: t - i }
        }
        function buildEnvAt(t: number) {
            var seg = lightSegment(t),
                a = seg.a,
                b = seg.b,
                frac = seg.frac
            var w = 128,
                h = 64
            var c = document.createElement("canvas")
            c.width = w
            c.height = h
            var ctx = c.getContext("2d")!
            var sky = ctx.createLinearGradient(0, 0, 0, h)
            ;[0, 0.32, 0.58, 0.76, 1].forEach(function (stop, i) {
                var idx = Math.min(i, 3)
                sky.addColorStop(stop, lerpCss(a.sky[idx], b.sky[idx], frac))
            })
            ctx.fillStyle = sky
            ctx.fillRect(0, 0, w, h)

            var sx = lerp(a.sunPos[0], b.sunPos[0], frac) * w
            var sy = lerp(a.sunPos[1], b.sunPos[1], frac) * h
            var sr = lerp(a.sunSize, b.sunSize, frac) * (w / 512)
            var glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
            glow.addColorStop(0, lerpCss(a.glow.inner, b.glow.inner, frac))
            glow.addColorStop(0.35, lerpCss(a.glow.mid, b.glow.mid, frac))
            glow.addColorStop(1, lerpCss(a.glow.outer, b.glow.outer, frac))
            ctx.fillStyle = glow
            ctx.fillRect(0, 0, w, h)

            var tex = new THREE.CanvasTexture(c)
            tex.mapping = THREE.EquirectangularReflectionMapping
            tex.colorSpace = THREE.SRGBColorSpace
            var rt = pmrem.fromEquirectangular(tex)
            tex.dispose()
            if (envRT) envRT.dispose()
            envRT = rt
            scene.environment = rt.texture
            // the sky env map used to be near-invisible on the old glossy PBR
            // materials, but on fully-diffuse flat materials it lands as a big
            // extra ambient term and blows the light walls out to white — cap it
            scene.environmentIntensity = 0.3
        }

        var dayProgress = 0
        // in story mode the house only lights up once the power flow has
        // actually reached the wall (then stays on); off-story it follows the preset
        var houseLit = storyMode ? 0 : 1
        var houseLitTarget = houseLit
        // the scene's light/dark state, published three ways so the page around it
        // can follow: a data attribute on <html> (CSS), a window event (script),
        // and the onDarkChange prop (Framer actions)
        var darkNow = false
        function emitDark(next: boolean) {
            if (next === darkNow) return
            darkNow = next
            try {
                document.documentElement.setAttribute("data-sett-theme", next ? "dark" : "light")
                window.dispatchEvent(new CustomEvent("sett3d:theme", { detail: { dark: next, dayProgress: dayProgress } }))
            } catch (e) {}
            var cb = onDarkRef.current
            if (typeof cb === "function") cb(next)
        }
        try {
            document.documentElement.setAttribute("data-sett-theme", "light")
        } catch (e) {}

        function setTimeOfDay(t: number) {
            t = Math.max(0, Math.min(DAY_MAX, t))
            dayProgress = t
            var seg = lightSegment(t),
                a = seg.a,
                b = seg.b,
                frac = seg.frac

            lerpColor(keyLight.color, a.key.color, b.key.color, frac)
            keyLight.intensity = lerp(a.key.intensity, b.key.intensity, frac)
            keyLight.position.set(
                radiusBase * lerp(a.keyDir.x, b.keyDir.x, frac),
                radiusBase * lerp(a.keyDir.y, b.keyDir.y, frac),
                radiusBase * lerp(a.keyDir.z, b.keyDir.z, frac)
            )
            lerpColor(rimLight.color, a.rim.color, b.rim.color, frac)
            rimLight.intensity = lerp(a.rim.intensity, b.rim.intensity, frac)
            rimLight.position.set(
                radiusBase * lerp(a.rimDir.x, b.rimDir.x, frac),
                radiusBase * lerp(a.rimDir.y, b.rimDir.y, frac),
                radiusBase * lerp(a.rimDir.z, b.rimDir.z, frac)
            )
            lerpColor(bounceLight.color, a.bounce.color, b.bounce.color, frac)
            bounceLight.intensity = lerp(a.bounce.intensity, b.bounce.intensity, frac)
            lerpColor(fillLight.color, a.hemi.sky, b.hemi.sky, frac)
            lerpColor((fillLight as any).groundColor, a.hemi.ground, b.hemi.ground, frac)
            fillLight.intensity = lerp(a.hemi.intensity, b.hemi.intensity, frac)
            viewLight.intensity = lerp(a.view, b.view, frac)
            renderer.toneMappingExposure = lerp(a.exposure, b.exposure, frac)
            if ((ground.material as any).userData.isShadowCatcher)
                (ground.material as THREE.Material as any).opacity = lerp(a.groundOpacity, b.groundOpacity, frac)

            heroEl.style.setProperty("--sky-0", lerpCss(a.sky[0], b.sky[0], frac))
            heroEl.style.setProperty("--sky-1", lerpCss(a.sky[1], b.sky[1], frac))
            heroEl.style.setProperty("--sky-2", lerpCss(a.sky[2], b.sky[2], frac))
            heroEl.style.setProperty("--sky-3", lerpCss(a.sky[3], b.sky[3], frac))
            heroEl.style.setProperty("--glow-inner", lerpCss(a.glow.inner, b.glow.inner, frac))
            heroEl.style.setProperty("--glow-mid", lerpCss(a.glow.mid, b.glow.mid, frac))
            heroEl.style.setProperty("--glow-outer", lerpCss(a.glow.outer, b.glow.outer, frac))
            heroEl.style.setProperty("--glow-shadow", lerpCss(a.glow.shadow, b.glow.shadow, frac))
            heroEl.style.setProperty(
                "--scrim-rgb",
                Math.round(lerp(a.scrim[0], b.scrim[0], frac)) +
                    "," +
                    Math.round(lerp(a.scrim[1], b.scrim[1], frac)) +
                    "," +
                    Math.round(lerp(a.scrim[2], b.scrim[2], frac))
            )
            // story copy flips to dark ink on the bright daytime skies and back
            // to light ink at night, keyed off the current sky's luminance
            var skyNow = lerpCss(a.sky[0], b.sky[0], frac).match(/[\d.]+/g)!.map(Number)
            var lum = (0.2126 * skyNow[0] + 0.7152 * skyNow[1] + 0.0722 * skyNow[2]) / 255
            var toDark = smoothstep(Math.max(0, Math.min(1, (lum - 0.35) / 0.3)))
            if (dayProgress > 2.25) emitDark(true)
            else if (dayProgress < 2.0) emitDark(false)
            heroEl.style.setProperty("--story-ink", lerpCss("#f4f5f9", "#141a33", toDark))
            heroEl.style.setProperty("--story-ink-dim", lerpCss("#c3c9dc", "#4a5270", toDark))
            // frosted panel behind the copy: navy glass at night, white glass by day.
            // The night navy is kept a step lighter than the night sky itself, or the
            // panel disappears into the background instead of framing the copy.
            heroEl.style.setProperty(
                "--story-panel",
                "rgba(" + Math.round(lerp(32, 255, toDark)) + "," + Math.round(lerp(42, 255, toDark)) + "," + Math.round(lerp(78, 255, toDark)) + "," + lerp(0.52, 0.58, toDark).toFixed(2) + ")"
            )
            _winGlowColor.copy(new THREE.Color(a.windowGlow.color)).lerp(new THREE.Color(b.windowGlow.color), frac)
            var winGlowIntensity = lerp(a.windowGlow.intensity, b.windowGlow.intensity, frac) * houseLit
            windowMaterials.forEach(function (m) {
                m.color.copy(_winGlowColor)
                m.opacity = Math.min(1, winGlowIntensity)
            })
            houseLight.color.copy(_winGlowColor)
            // wireframeMode: no interior light spilling out of a blueprint house
            houseLight.intensity = wireframeMode ? 0 : winGlowIntensity * 1.4
            settLight.intensity = lerp(a.settLight, b.settLight, frac) * 2.0

            aoStrength = lerp(a.aoStrength, b.aoStrength, frac)

            // each rebuild is a PMREM convolution; half as many of them on a phone
            var bucket = Math.round(t * (liteMode ? 6 : 12))
            if (bucket !== envBucket) {
                envBucket = bucket
                buildEnvAt(t)
            }
            syncDaytoggle()
            requestRender()
        }

        var controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.enablePan = false
        controls.enableRotate = false // camera only moves via the preset view chips
        controls.enableZoom = false // kept locked — capturing wheel for zoom would fight page scroll in an embed
        // in story mode the camera is driven by the scroll, and the controls'
        // touch handlers would otherwise swallow the page's touch scrolling
        controls.enabled = !storyMode

        // ---------- post-processing: SSAO for grounded contact shadows ----------
        // WebGLRenderTarget no longer takes an "encoding" option — intermediate
        // targets just stay in linear space, and outputColorSpace on the
        // renderer itself handles the final conversion
        var composerTarget = new THREE.WebGLRenderTarget(1, 1, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
        })
        composerTarget.samples = renderQuality === "low" ? 0 : 2
        var composer = new EffectComposer(renderer, composerTarget)
        composer.setPixelRatio(renderer.getPixelRatio())
        var renderPass = new RenderPass(scene, camera)
        composer.addPass(renderPass)
        // SSAO is the expensive pass (it re-renders the scene for depth and
        // normals, then samples a kernel per pixel): 32 samples on high, 16 on
        // balanced, skipped entirely on low
        var ssaoPass: SSAOPass | null = renderQuality === "low" ? null : new SSAOPass(scene, camera, 1, 1, renderQuality === "high" ? 32 : 16)
        if (ssaoPass) {
            ssaoPass.output = SSAOPass.OUTPUT.Default
            composer.addPass(ssaoPass)
        }
        var fxaaPass = new ShaderPass(FXAAShader)
        composer.addPass(fxaaPass)
        // Sketchfab-style screen grain: a full-frame noise pass, AFTER FXAA so
        // the anti-aliasing doesn't blur the grain back into mush. This is
        // the "texture" that style actually has — it lives on the screen, not
        // on the surfaces, which is why bump maps never got close to it
        var filmPass = new FilmPass(Math.max(0, Math.min(1, grainAmount ?? 0.22)), false)
        if (liteMode) {
            // the grain is a whole extra full-screen pass and all but invisible on
            // a phone, so it goes — which makes FXAA the pass that hits the screen
            fxaaPass.renderToScreen = true
        } else {
            filmPass.renderToScreen = true
            composer.addPass(filmPass)
        }

        // A mobile browser collapsing its toolbar mid-scroll changes the viewport
        // height in a stream of small steps. Resizing the renderer and its post
        // targets on each one is what makes the scene flicker, so height-only
        // changes wait for the stream to settle; the canvas is CSS-stretched in the
        // meantime, which resamples the last frame instead of dropping it. A width
        // change is a real layout change (rotation, window drag) and applies at once.
        var resizeTimer = 0
        var lastResizeW = 0
        var lastResizeH = 0
        function resize() {
            var w = stageWrap.clientWidth,
                h = stageWrap.clientHeight
            if (!w || !h) return
            window.clearTimeout(resizeTimer)
            // a collapsing toolbar is a small height-only change (~5-15%); anything
            // larger is a real layout change and must not wait
            var small = w === lastResizeW && lastResizeH > 0 && Math.abs(h - lastResizeH) < lastResizeH * 0.25
            if (small) resizeTimer = window.setTimeout(applyResize, 220)
            else applyResize()
        }
        function applyResize() {
            var w = stageWrap.clientWidth,
                h = stageWrap.clientHeight
            if (!w || !h) return
            lastResizeW = w
            lastResizeH = h
            renderer.setSize(w, h)
            composer.setSize(w, h)
            var pr = renderer.getPixelRatio()
            if (ssaoPass) ssaoPass.setSize(w * pr, h * pr)
            ;(fxaaPass.material.uniforms as any)["resolution"].value.set(1 / (w * pr), 1 / (h * pr))
            camera.aspect = w / h
            camera.setViewOffset(w, h, 0, 0, w, h)
            camera.updateProjectionMatrix()
            // keep the JS breakpoint on the viewport, matching the CSS media query
            var narrowNow = window.innerWidth <= 760
            // a tall, narrow frame sees much less width at a given distance, so the
            // pull-back follows the aspect (capped, or the scene would get tiny)
            var scaleNow = narrowNow ? Math.min(2, 1.15 / Math.max(0.45, Math.min(1, w / h))) : 1
            var scaleChanged = scaleNow !== viewDistScale
            isNarrow = narrowNow
            viewDistScale = scaleNow
            badgeSizesDirty = true
            // the copy is lifted by exactly the height of the button stack below it
            if (ctaWrapEl) heroEl.style.setProperty("--cta-h", ctaWrapEl.offsetHeight + "px")
            fitStoryHeadings() // the panel's width just changed, so re-fit the titles
            // the copy sits directly above the nav, so it needs the nav's height
            heroEl.style.setProperty("--viewbar-h", viewbar.offsetHeight + "px")
            syncNavPill(true) // button widths just changed; re-place it without a slide
            if (scaleChanged && storyReady && STORY && STORY.length) setStoryProgress(storyProgress)
            requestRender()
        }

        var resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(stageWrap)
        // the copy's lift follows the button stack's real height, so it also has to
        // survive the pre-order button being switched off (a re-render, not a resize)
        var ctaSizeObserver: ResizeObserver | null = null
        if (ctaWrapEl) {
            ctaSizeObserver = new ResizeObserver(function () {
                heroEl.style.setProperty("--cta-h", ctaWrapEl!.offsetHeight + "px")
            })
            ctaSizeObserver.observe(ctaWrapEl)
        }
        syncTrackPinning() // before the first resize: unpinned, the stage is as tall as the whole scroll track
        resize()
        // don't burn frames on the pulse while the scene is scrolled out of view
        var onScreen = true
        var visObserver = new IntersectionObserver(function (entries) {
            onScreen = entries[0].isIntersecting
            if (onScreen) requestRender()
        })
        visObserver.observe(stageWrap)

        // ---------- camera preset math ----------
        function sphericalToOffset(radius: number, phi: number, theta: number) {
            var sinPhiR = radius * Math.sin(phi)
            return new THREE.Vector3(sinPhiR * Math.sin(theta), radius * Math.cos(phi), sinPhiR * Math.cos(theta))
        }
        function easeInOutCubic(t: number) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        }

        var camAnim: null | { fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number; duration: number } = null
        function animateCameraTo(pos: THREE.Vector3, target: THREE.Vector3, duration?: number) {
            camAnim = {
                fromPos: camera.position.clone(),
                toPos: pos.clone(),
                fromTarget: controls.target.clone(),
                toTarget: target.clone(),
                start: performance.now(),
                duration: duration || 700,
            }
            requestRender()
        }

        var DEG = Math.PI / 180
        var radiusBase = 1 // set once the model loads
        // on a narrow screen every preset view backs off, so more of the scene fits
        var isNarrow = false
        var viewDistScale = 1
        var badgeSizesDirty = true
        var VIEWS: Record<string, { phi: number; theta: number; dist: number; target: THREE.Vector3 }> = {
            hero: { phi: 64 * DEG, theta: 150 * DEG, dist: 2.1, target: new THREE.Vector3(-60, 10, -70) },
            open: { phi: 38 * DEG, theta: 195 * DEG, dist: 0.95, target: new THREE.Vector3(-300, -190, -270) },
            charger: { phi: 70 * DEG, theta: 150 * DEG, dist: 0.55, target: new THREE.Vector3(-400, -160, -230) },
            top: { phi: 12 * DEG, theta: 210 * DEG, dist: 2.3, target: new THREE.Vector3(-110, 0, 20) },
        }
        function applyView(key: string, duration?: number) {
            var v = VIEWS[key]
            if (!v) return
            var dist = v.dist * radiusBase * viewDistScale
            var pos = v.target.clone().add(sphericalToOffset(dist, v.phi, v.theta))
            animateCameraTo(pos, v.target, duration || 900)
            Array.prototype.forEach.call(viewbar.querySelectorAll("button"), function (b: HTMLButtonElement) {
                b.classList.toggle("active", b.dataset.view === key)
            })
            syncNavPill()
        }
        function onViewbarClick(e: Event) {
            var target = e.target as HTMLElement
            var chapterBtn = target.closest("button[data-chapter]") as HTMLButtonElement | null
            if (chapterBtn) {
                goToChapter(Number(chapterBtn.dataset.chapter))
                return
            }
            var btn = target.closest("button[data-view]") as HTMLButtonElement | null
            if (!btn) return
            applyView(btn.dataset.view!, 900)
        }
        viewbar.addEventListener("click", onViewbarClick)
        function onControlsStart() {
            Array.prototype.forEach.call(viewbar.querySelectorAll("button"), function (b: HTMLButtonElement) {
                b.classList.remove("active")
            })
            syncNavPill()
        }
        controls.addEventListener("start", onControlsStart)

        function syncDaytoggle() {
            if (!daytoggleKnob || !daytoggleLabel) return
            var nearest = Math.round(dayProgress)
            var frac = DAY_MAX > 0 ? nearest / DAY_MAX : 0
            var trackW = 72,
                knobW = 22,
                pad = 3
            daytoggleKnob.style.left = pad + frac * (trackW - knobW - pad * 2) + "px"
            daytoggleLabel.textContent = LIGHT_PRESETS[nearest].label
        }

        var dayAnim: null | { from: number; to: number; start: number; duration: number } = null
        function animateTimeOfDayTo(target: number, duration?: number) {
            dayAnim = { from: dayProgress, to: target, start: performance.now(), duration: duration || 900 }
            requestRender()
        }
        var daytoggleDark = dayProgress > DAY_MAX / 2
        function onDaytoggleClick() {
            daytoggleDark = !daytoggleDark
            var target = daytoggleDark ? DAY_MAX : 0
            var duration = Math.max(700, Math.abs(target - dayProgress) * 700)
            animateTimeOfDayTo(target, duration)
        }
        if (daytoggle) daytoggle.addEventListener("click", onDaytoggleClick)

        // ---------- scroll story ----------
        // STORY gets its `reveal` fractions once the energy line is built (in
        // the model-load callback); until then setStoryProgress is a no-op
        type Chapter = { key: string; label: string; view: string; day: number; dayReveal: number; dayStart: number; houseReveal: number; carReveal: number; gridStart: number; charge: number }
        var lastDayStart = 0
        // the batteries' charge: their colour tints from grey to the battery
        // colour as the level rises; the Sett popup's battery icon fills with it
        var BATTERY_GREY = new THREE.Color("#8b8f99")
        var batteryFill: null | { mats: THREE.MeshStandardMaterial[]; green: THREE.Color; charge: number } = null
        function applyBatteryCharge() {
            if (!batteryFill) return
            var bf = batteryFill
            bf.mats.forEach(function (m) {
                m.color.copy(BATTERY_GREY).lerp(bf.green, bf.charge)
            })
        }
        var STORY: Chapter[] = []
        var storyProgress = 0 // 0 … STORY.length-1, fractional between chapters
        var storyAnim: null | { from: number; to: number; start: number; duration: number } = null
        // the three energy lines and the two origin dots, built once the model
        // loads. Shared Color objects so the pickers recolor them live: gold
        // for the daytime solar→battery line, green for everything after dark.
        type EnergyLine = { uniforms: any; core: THREE.Mesh }
        var energyColor = roleColor("energyLine")
        var energyDayColor = roleColor("energyDay")
        var energyGridColor = roleColor("energyGrid")
        var energyLines: { day: EnergyLine | null; house: EnergyLine | null; car: EnergyLine | null; grid: EnergyLine | null } = { day: null, house: null, car: null, grid: null }
        // popups anchored to 3D points, projected to the screen every frame;
        // each decides its own visibility from the current story state
        type Badge = { el: HTMLElement; anchor: THREE.Vector3; show: () => number; w?: number; h?: number; x?: number; y?: number; vis?: number }
        var badges: Badge[] = []
        var lastHouseReveal = 0,
            lastCarReveal = 0
        var carSoc = 18 // the car's state of charge (%), climbs while it's charging
        var prevBadgeMs = 0
        var dischargeMs = 0 // when the Sett started feeding the house (its badge counts down from then)
        var energyDots: { day: THREE.Group | null; night: THREE.Group | null } = { day: null, night: null }
        var energyActive = false
        function setLine(l: EnergyLine | null, reveal: number, fade: number, start?: number) {
            if (!l) return
            l.uniforms.uReveal.value = reveal
            l.uniforms.uFade.value = fade
            l.uniforms.uStart.value = start || 0
        }
        function setDot(d: THREE.Group | null, opacity: number) {
            if (!d) return
            d.visible = opacity > 0.01
            d.userData.o = opacity
            ;((d.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity
        }
        // there is no opening move: the scene is staged on chapter 0 behind the
        // preloader and the story goes live the moment that clears
        var storyReady = false
        var storyTextEl = storyTextRef.current
        // Chapter titles are set from the property panel, so their length is not
        // known here: measure each one and scale the type down until it sits on a
        // single line. Base sizes are read back from the stylesheet, so desktop and
        // mobile both work, and a title that already fits is left alone.
        // A title that would have to shrink past HEADING_MIN_RATIO of its design
        // size keeps that size and wraps instead — one line is not worth type this
        // small.
        var HEADING_MIN_RATIO = 0.7
        var HEADING_MIN_PX = 16
        function fitStoryHeadings() {
            if (!storyTextEl) return
            Array.prototype.forEach.call(storyTextEl.querySelectorAll("h2"), function (h: HTMLElement) {
                var block = h.parentElement
                if (!block) return
                h.style.fontSize = "" // back to the stylesheet's size before measuring
                h.style.whiteSpace = ""
                var bs = window.getComputedStyle(block)
                var avail = block.clientWidth - (parseFloat(bs.paddingLeft) || 0) - (parseFloat(bs.paddingRight) || 0)
                if (avail <= 0) return
                var base = parseFloat(window.getComputedStyle(h).fontSize)
                // scrollWidth is the full single-line width, even when it overflows
                if (h.scrollWidth <= avail) return
                var floor = Math.max(HEADING_MIN_PX, base * HEADING_MIN_RATIO)
                var size = base * (avail / h.scrollWidth)
                if (size < floor) {
                    h.style.whiteSpace = "normal" // too long for one line at a decent size
                    return
                }
                h.style.fontSize = size.toFixed(2) + "px"
                // kerning and rounding mean the first estimate can land a hair over
                for (var pass = 0; pass < 2 && h.scrollWidth > avail; pass++) {
                    size = Math.max(floor, size * (avail / h.scrollWidth))
                    h.style.fontSize = size.toFixed(2) + "px"
                }
                if (h.scrollWidth > avail + 1) {
                    h.style.fontSize = ""
                    h.style.whiteSpace = "normal"
                }
            })
        }
        // the webfont lands after first paint and every glyph is a different width,
        // so measure again once it is actually in
        if ((document as any).fonts && (document as any).fonts.ready) {
            ;(document as any).fonts.ready.then(function () {
                if (!cancelled) fitStoryHeadings()
            })
        }
        function smoothstep(t: number) {
            return t * t * (3 - 2 * t)
        }
        function viewPose(key: string) {
            var v = VIEWS[key] || VIEWS.hero
            var dist = v.dist * radiusBase * viewDistScale
            return { pos: v.target.clone().add(sphericalToOffset(dist, v.phi, v.theta)), target: v.target.clone() }
        }
        function setStoryProgress(p: number) {
            if (!STORY.length) return
            var last = STORY.length - 1
            p = Math.max(0, Math.min(last, p))
            storyProgress = p
            var i = Math.min(last - 1, Math.floor(p))
            // eased within each segment so the camera actually settles on a
            // chapter instead of drifting straight through it
            var t = smoothstep(p - i)
            var A = STORY[i],
                B = STORY[i + 1]
            var pa = viewPose(A.view),
                pb = viewPose(B.view)
            camera.position.lerpVectors(pa.pos, pb.pos, t)
            controls.target.lerpVectors(pa.target, pb.target, t)
            setTimeOfDay(lerp(A.day, B.day, t))
            var dayReveal = lerp(A.dayReveal, B.dayReveal, t)
            var dayStart = lerp(A.dayStart, B.dayStart, t)
            lastDayStart = dayStart
            var houseReveal = lerp(A.houseReveal, B.houseReveal, t)
            var carReveal = lerp(A.carReveal, B.carReveal, t)
            var gridStart = lerp(A.gridStart, B.gridStart, t) // the grid feed drains from the pylon end at dusk, like the solar line
            setLine(energyLines.day, dayReveal, 1, dayStart)
            setLine(energyLines.house, houseReveal, 1)
            setLine(energyLines.car, carReveal, 1)
            setLine(energyLines.grid, 1, 1, gridStart)
            houseLitTarget = houseReveal >= 0.999 ? 1 : 0
            lastHouseReveal = houseReveal
            lastCarReveal = carReveal
            if (batteryFill) {
                batteryFill.charge = lerp(A.charge, B.charge, t)
                applyBatteryCharge()
            }
            // the origin dot sits wherever the current flow starts: on the
            // panels by day, on the batteries once the night lines take over
            setDot(energyDots.day, dayReveal > 0 ? Math.max(0, 1 - dayStart * 3) : 0) // gone as soon as the drain begins
            setDot(energyDots.night, Math.min(1, houseReveal * 4))
            energyActive = dayReveal > dayStart || houseReveal > 0 || carReveal > 0 || gridStart < 1
            // chapter copy: fully in within ±0.22 of a stop, gone by ±0.58
            if (storyTextEl) {
                Array.prototype.forEach.call(storyTextEl.children, function (el: HTMLElement, i: number) {
                    var d = Math.abs(p - i)
                    var o = 1 - smoothstep(Math.max(0, Math.min(1, (d - 0.22) / 0.36)))
                    el.style.opacity = String(o)
                    el.style.transform = "translateY(" + ((1 - o) * 14).toFixed(1) + "px)"
                })
            }
            applyEndCta()
            var active = Math.round(p)
            Array.prototype.forEach.call(viewbar.querySelectorAll("button[data-chapter]"), function (b: HTMLButtonElement) {
                b.classList.toggle("active", Number(b.dataset.chapter) === active)
            })
            syncNavPill()
            requestRender()
        }
        // the scroll track is whichever element actually spans the scroll
        // distance: this component's own root if it's been given a tall frame
        // (then we pin the stage ourselves), otherwise the nearest tall
        // ancestor — Framer's "make a tall section, set the layer to Sticky"
        // setup — in which case Framer is doing the pinning
        function findTrack(): { el: HTMLElement; self: boolean } | null {
            var vh = window.innerHeight
            if (heroEl.getBoundingClientRect().height > vh * 1.5) return { el: heroEl, self: true }
            var p = heroEl.parentElement
            for (var k = 0; k < 8 && p; k++) {
                if (p.getBoundingClientRect().height > vh * 1.5) return { el: p, self: false }
                p = p.parentElement
            }
            return null
        }
        function syncTrackPinning() {
            var tr = storyMode ? findTrack() : null
            stageWrap.classList.toggle("pinned", !!(tr && tr.self))
        }
        // the last slice of the track doesn't advance the story — it holds on the
        // final chapter, so the closing scene (and its buttons) stay put for a
        // moment instead of only existing at the very last pixel of the track
        var STORY_END_HOLD = 0.88
        function scrollProgress(): number | null {
            var tr = findTrack()
            if (!tr) return null
            var r = tr.el.getBoundingClientRect()
            var span = r.height - window.innerHeight
            if (span <= 0) return null
            var frac = Math.max(0, Math.min(1, -r.top / span))
            return Math.min(1, frac / STORY_END_HOLD) * (STORY.length - 1)
        }
        // the buttons pop up as the last chapter arrives — not at the bottom of the
        // track, where a visitor who stops scrolling would never see them. Off at a
        // lower threshold than on, so a jittery scroll can't flicker them.
        var ctaOn = false
        function applyEndCta() {
            if (!ctaWrapEl || STORY.length < 2) return
            var on = storyProgress >= STORY.length - 1 - (ctaOn ? 0.42 : 0.3)
            if (on === ctaOn) return
            ctaOn = on
            // the copy lifts by exactly the stack's height, re-measured the moment
            // it appears — the pre-order button can be switched off in the panel,
            // and that is a re-render, not a resize
            if (on && ctaWrapEl) heroEl.style.setProperty("--cta-h", ctaWrapEl.offsetHeight + "px")
            heroEl.classList.toggle("cta-on", on)
        }
        function onScroll() {
            if (!storyMode || !STORY.length || !storyReady) return
            var p = scrollProgress()
            if (p == null) return
            if (!storyArmed) {
                if (Math.abs(window.scrollY - scrollAtStart) < 2) return // resize/layout jitter, not a real scroll
                storyArmed = true
                dismissHint()
                // first real scroll: glide from Start to where the page is now — but
                // only if that is nearby. A big gap means the page moved on its own
                // (scroll restoration, an anchor jump), and gliding through four
                // chapters to catch up would look like a glitch, so snap instead.
                if (Math.abs(p - storyProgress) > 0.35) {
                    storyAnim = null
                    setStoryProgress(p)
                } else {
                    storyAnim = { from: storyProgress, to: p, start: performance.now(), duration: 900 }
                }
                requestRender()
                return
            }
            storyAnim = null
            setStoryProgress(p)
        }
        function onWindowResize() {
            syncTrackPinning()
            // parked on Start (or between chapters) the scroll handler bails, so
            // re-apply the current position to pick up a new view distance
            if (storyArmed) onScroll()
            else if (storyReady && STORY && STORY.length) setStoryProgress(storyProgress)
        }
        if (storyMode) {
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onWindowResize)
        }
        // the scroll cue retires as soon as the visitor scrolls or picks a chapter
        function dismissHint() {
            if (scrollHintRef.current) scrollHintRef.current.classList.add("used")
        }
        function goToChapter(idx: number) {
            dismissHint()
            storyArmed = true
            var tr = findTrack()
            if (tr) {
                var r = tr.el.getBoundingClientRect()
                var span = r.height - window.innerHeight
                if (span > 0) {
                    var top = window.scrollY + r.top + (idx / (STORY.length - 1)) * STORY_END_HOLD * span
                    window.scrollTo({ top: top, behavior: "smooth" })
                    return
                }
            }
            // no scroll track (e.g. the component sits in a normal-height
            // frame) — just animate straight to the chapter instead
            storyAnim = { from: storyProgress, to: idx, start: performance.now(), duration: 1400 }
            requestRender()
        }

        // the story stays parked on chapter 0 until the visitor actually scrolls
        // (or clicks a chapter) — whatever the page's scroll position happens to
        // be when the scene appears is treated as the baseline
        var storyArmed = false
        var scrollAtStart = 0
        function startStory() {
            storyReady = true
            heroEl.classList.add("story-ready")
            scrollAtStart = window.scrollY
            // the page can already be scrolled when the scene appears — a reload, a
            // restored position on the way back from another page, or a hero that
            // isn't the first thing on the page. Take that position as the starting
            // point instead of parking on Start; otherwise the next flick of the
            // wheel (either direction) glides the whole story to wherever the page
            // already was.
            fitStoryHeadings()
            var p0 = scrollProgress()
            storyArmed = !!(p0 && p0 > 0.02)
            setStoryProgress(storyArmed ? (p0 as number) : 0)
            syncNavPill(true) // placed, not animated, before the bar fades in
            viewbar.classList.add("ready")
            requestRender()
        }

        setTimeOfDay(1) // start the scene in bright daylight (LIGHT_PRESETS[1] = Middag)

        var lastFrame = 0
        function animate() {
            rafId = requestAnimationFrame(animate)
            if (!needsRender || !onScreen) return
            if (camAnim) {
                var t = (performance.now() - camAnim.start) / camAnim.duration
                if (t >= 1) {
                    camera.position.copy(camAnim.toPos)
                    controls.target.copy(camAnim.toTarget)
                    camAnim = null
                } else {
                    var e = easeInOutCubic(t)
                    camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, e)
                    controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, e)
                }
            }
            if (dayAnim) {
                var dt = (performance.now() - dayAnim.start) / dayAnim.duration
                if (dt >= 1) {
                    setTimeOfDay(dayAnim.to)
                    dayAnim = null
                } else {
                    setTimeOfDay(lerp(dayAnim.from, dayAnim.to, easeInOutCubic(dt)))
                }
            }
            if (storyAnim) {
                var st = (performance.now() - storyAnim.start) / storyAnim.duration
                if (st >= 1) {
                    setStoryProgress(storyAnim.to)
                    storyAnim = null
                } else {
                    setStoryProgress(lerp(storyAnim.from, storyAnim.to, easeInOutCubic(st)))
                }
            }
            // the energy line's pulse travels, so keep frames coming while any
            // of it is showing — the only thing in the scene that animates on its own
            var pulsing = false
            if (energyActive) {
                var now = performance.now() / 1000
                // the pulse's time loops after 100 of its own periods (seamless): a shader
                // time that keeps growing loses precision on the GPU after a while
                var pulseT = now % ((2 * Math.PI / 2.6) * 100)
                ;[energyLines.day, energyLines.house, energyLines.car, energyLines.grid].forEach(function (l) {
                    if (l) l.uniforms.uTime.value = pulseT
                })
                // origin markers: a small bead plus a camera-facing "ping" ring that
                // expands and fades every 1.6s
                var ping = (now % 1.6) / 1.6
                ;[energyDots.day, energyDots.night].forEach(function (d) {
                    if (!d || !d.visible) return
                    var ring = d.children[1] as THREE.Mesh
                    ring.quaternion.copy(camera.quaternion)
                    ring.scale.setScalar(1 + 2.6 * ping)
                    ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - ping) * (d.userData.o || 0)
                })
                pulsing = true
            }
            // house lights: switch on (softly) the moment the flow reaches the wall
            var litAnim = false
            if (Math.abs(houseLit - houseLitTarget) > 0.002) {
                houseLit += (houseLitTarget - houseLit) * 0.08
                if (Math.abs(houseLit - houseLitTarget) <= 0.002) houseLit = houseLitTarget
                setTimeOfDay(dayProgress)
                litAnim = true
            }
            // when the slow pulse is the only thing moving, 30fps is plenty —
            // halves the steady-state cost of the story scene
            var idlePulse = pulsing && !camAnim && !dayAnim && !storyAnim && !litAnim
            var nowMs = performance.now()
            if (idlePulse && nowMs - lastFrame < 31) return
            lastFrame = nowMs
            viewLight.position.copy(camera.position)
            viewLight.target.position.copy(controls.target)
            var camDist = camera.position.distanceTo(controls.target)
            if (ssaoPass) {
                ssaoPass.kernelRadius = camDist * 0.05 * aoStrength
                ssaoPass.minDistance = camDist * 0.00025 * aoStrength
                ssaoPass.maxDistance = camDist * 0.018 * aoStrength
            }
            controls.update()
            // popups: fade per their own rule, and track their 3D anchor on screen
            if (badges.length) {
                camera.updateMatrixWorld()
                var sw = stageWrap.clientWidth,
                    sh = stageWrap.clientHeight
                badges.forEach(function (b) {
                    var so = Math.max(0, Math.min(1, b.show()))
                    b.el.style.opacity = so.toFixed(3)
                    b.vis = so
                    // measured only when the layout changed — reading offsetWidth every
                    // frame for every badge would force a layout on each one
                    if (badgeSizesDirty) {
                        b.w = b.el.offsetWidth
                        b.h = b.el.offsetHeight
                    }
                    // always reproject — a badge fading out mid camera-move must keep tracking its anchor
                    var pv = b.anchor.clone().project(camera)
                    var bx = (pv.x * 0.5 + 0.5) * sw
                    var by = (-pv.y * 0.5 + 0.5) * sh
                    // narrow screens: draw them in toward the middle, where there's room
                    if (isNarrow) bx += (sw / 2 - bx) * 0.4
                    var halfW = (b.w || 120) / 2 + 8
                    b.x = Math.max(halfW, Math.min(sw - halfW, bx))
                    b.y = Math.max((b.h || 32) + 8, Math.min(sh - 8, by))
                })
                // centring on a narrow screen bunches them up, so lift any that would
                // stack on top of each other (nearest the camera keeps its spot)
                if (isNarrow) {
                    var stack = badges
                        .filter(function (b) {
                            return (b.vis || 0) > 0.01
                        })
                        .sort(function (b1, b2) {
                            return (b2.y || 0) - (b1.y || 0)
                        })
                    for (var si2 = 1; si2 < stack.length; si2++) {
                        var me = stack[si2]
                        for (var sj = 0; sj < si2; sj++) {
                            var other = stack[sj]
                            var gapNeeded = (me.h || 32) + 6
                            var overlapX = Math.abs((me.x || 0) - (other.x || 0)) < ((me.w || 120) + (other.w || 120)) / 2 - 6
                            if (overlapX && Math.abs((me.y || 0) - (other.y || 0)) < gapNeeded) me.y = (other.y || 0) - gapNeeded
                        }
                        me.y = Math.max((me.h || 32) + 8, me.y || 0)
                    }
                }
                badges.forEach(function (b) {
                    b.el.style.transform = "translate(" + (b.x || 0).toFixed(1) + "px," + (b.y || 0).toFixed(1) + "px) translate(-50%,-100%)"
                })
                badgeSizesDirty = false
                // the car's state of charge climbs 3.5%/s (wall-clock, so throttled
                // frames don't slow it) from the moment charging starts; resets otherwise
                if (lastCarReveal >= 0.999) {
                    if (!prevBadgeMs) prevBadgeMs = nowMs
                    carSoc = Math.min(100, 18 + ((nowMs - prevBadgeMs) / 1000) * 3.5)
                } else {
                    prevBadgeMs = 0
                    carSoc = 18
                }
                if (carSocRef.current) carSocRef.current.textContent = Math.round(carSoc) + "%"
                if (carSocFillRef.current) carSocFillRef.current.setAttribute("width", (14 * carSoc) / 100 + "")
                // the Sett's battery icon: fills with the story's charge by day; once the
                // house draws from it (Stroom leveren) it discharges slowly, in orange
                var bc = batteryFill ? batteryFill.charge : 0
                if (houseLit > 0.05) {
                    if (!dischargeMs) dischargeMs = nowMs
                    bc = Math.max(0.22, bc - ((nowMs - dischargeMs) / 1000) * 0.016)
                    if (settChargeRef.current) settChargeRef.current.classList.add("discharging")
                } else {
                    dischargeMs = 0
                    if (settChargeRef.current) settChargeRef.current.classList.remove("discharging")
                }
                if (settSocRef.current) settSocRef.current.textContent = Math.round(bc * 100) + "%"
                if (settSocFillRef.current) settSocFillRef.current.setAttribute("width", Math.max(0, 28 * bc) + "")
            }
            composer.render()
            // FilmPass adds to its time every frame, and its noise is fract(uv + time):
            // after an hour or so that number is too big for the GPU and the grain turns
            // into big blocks. The noise is random anyway, so the time can loop
            if (filmPass.uniforms && filmPass.uniforms.time) filmPass.uniforms.time.value %= 10
            needsRender = !!camAnim || !!dayAnim || !!storyAnim || pulsing || litAnim
        }
        animate()

        // ---------- load the model ----------
        function makeBlueprintTexture(size?: number) {
            size = size || 512
            var c = document.createElement("canvas")
            c.width = c.height = size
            var ctx = c.getContext("2d")!
            ctx.clearRect(0, 0, size, size)
            var cell = size / 5
            ctx.strokeStyle = "rgba(190,228,255,0.72)"
            ctx.lineWidth = 4
            for (var i = 0; i <= 5; i++) {
                var p = Math.round(i * cell) + 0.5
                ctx.beginPath()
                ctx.moveTo(p, 0)
                ctx.lineTo(p, size)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(0, p)
                ctx.lineTo(size, p)
                ctx.stroke()
            }
            ctx.strokeStyle = "rgba(215,238,255,0.95)"
            ctx.lineWidth = 6
            ctx.strokeRect(3, 3, size - 6, size - 6)
            var tex = new THREE.CanvasTexture(c)
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            tex.colorSpace = THREE.SRGBColorSpace
            return tex
        }

        function makeTree() {
            var g = new THREE.Group()
            var trunkMat = flatMat("treeTrunk", { varL: (Math.random() - 0.5) * 0.06 })
            var trunkH = 170 + Math.random() * 70
            var trunk = new THREE.Mesh(new THREE.CylinderGeometry(9, 15, trunkH, 7), trunkMat)
            trunk.position.y = trunkH / 2
            trunk.castShadow = true
            trunk.receiveShadow = true
            g.add(trunk)
            applyWireframe(trunk)

            var leafMat = flatMat("treeLeaves", { varL: (Math.random() - 0.5) * 0.12 })
            var blobs = 3 + Math.floor(Math.random() * 2)
            for (var i = 0; i < blobs; i++) {
                var r = 85 + Math.random() * 55
                var blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafMat)
                blob.position.set((Math.random() - 0.5) * 90, trunkH + 55 + Math.random() * 70, (Math.random() - 0.5) * 90)
                blob.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
                blob.castShadow = true
                blob.receiveShadow = true
                g.add(blob)
                applyWireframe(blob)
            }
            var s = 0.85 + Math.random() * 0.4
            g.scale.setScalar(s)
            return g
        }

        function makeBush() {
            var g = new THREE.Group()
            var leafMat = flatMat("bushes", { varL: (Math.random() - 0.5) * 0.12 })
            var blobs = 2 + Math.floor(Math.random() * 2)
            for (var i = 0; i < blobs; i++) {
                var r = 26 + Math.random() * 16
                var blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafMat)
                blob.position.set((Math.random() - 0.5) * 34, r * 0.75, (Math.random() - 0.5) * 24)
                blob.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
                blob.castShadow = true
                blob.receiveShadow = true
                g.add(blob)
                applyWireframe(blob)
            }
            var s = 0.85 + Math.random() * 0.45
            g.scale.setScalar(s)
            return g
        }

        // which color bucket each of the OBJ's material UUIDs belongs to (the
        // v8 export's UUIDs — remapped by cross-referencing object names).
        // Windows are the only translucent group.
        var COLOR_ROLES: Record<string, { role: ColorRole; opacity?: number }> = {
            "64cf2b98_b8ba_4696_a38d_3abca160387b": { role: "walls" },
            "0d87a634_b0d3_4573_9a82_9b68d7842470": { role: "windows", opacity: 0.7 },
            "75ec9432_2e95_40c5_b8fb_ca6bd5ec44c5": { role: "cooling" },
            "30d7bcb5_4718_4144_b020_2c89ed81373b": { role: "battery" },
            "5057c406_4e83_4e64_ba7f_d7ff92e8acd2": { role: "batteryBlocks" },
            "0a4a8f49_1025_49a9_9063_91684161ea60": { role: "inverter" },
            "903547b3_6aa0_4bdc_8aff_838ad89aba3a": { role: "frame" },
            "e329b636_bbad_4d93_86b9_2e0616a8309e": { role: "pathway" },
            "5a4c3c35_a8be_4a11_8a50_5f21d4566a5a": { role: "door" },
            "d8f9f241_567a_4d83_8ddd_b5249e57a768": { role: "chargePole" },
            // sett-v9 export (decimated) — same parts, regenerated material ids
            "b909650e_271a_4e01_93e9_05e53b619e79": { role: "walls" },
            "c170e513_0b2e_446b_9a5e_fb3586334a9d": { role: "windows", opacity: 0.7 },
            "b761d7c1_962e_451b_9711_6e31527a6303": { role: "cooling" },
            "23eb4583_2034_450f_84b7_5f0ef82c2a7d": { role: "battery" },
            "b75eb569_5d23_4cc4_8576_c88eacc1589c": { role: "batteryBlocks" },
            "1fc193e7_0e1d_4046_9a0e_688cb6d88e91": { role: "inverter" },
            "c6a399f0_84dd_4c64_ba55_f0694a0361a8": { role: "frame" },
            "8ef818db_74f9_4118_bb9a_b1bdd1c048cc": { role: "pathway" },
            "e877d95c_e584_45b3_9567_104540b31256": { role: "door" },
            "c3bd5488_83c5_4daf_abb6_4651b18d8926": { role: "chargePole" },
        }

        var modelRoot: THREE.Object3D | null = null
        var mtlLoader = new MTLLoader()
        mtlLoader.load(
            mtlUrl,
            function (materials: any) {
                if (cancelled) return
                materials.preload()
                var objLoader = new OBJLoader()
                objLoader.setMaterials(materials)
                objLoader.load(
                    objUrl,
                    function (obj: THREE.Object3D) {
                        if (cancelled) return
                        modelRoot = obj

                        modelRoot.rotation.x = -Math.PI / 2
                        modelRoot.updateMatrixWorld(true)

                        var SOLAR_PANEL_RE = /^Extruded\.0(1[1-8]|27|28)$/
                        var DIRT_RE = /^BAK_met_RIBS$/
                        // parts that have no usemtl of their own in the OBJ inherit whatever
                        // came before them — which changes between exports (v9 hands two of
                        // the bin's ribs the battery material). Pin them by name instead.
                        var NAME_ROLES: [RegExp, ColorRole][] = [
                            [/^Extruded\.00[1-8]$/, "settBin"], // the bin's ribs
                            [/^(schot|Panel_side)$/, "settBin"], // partitions + side panel
                            [/^Pipe\.002$/, "inverter"], // charge cable
                            [/^Extruded\.0(09|10)$/, "inverter"], // socket + plug head
                        ]
                        function nameRole(name: string): ColorRole | null {
                            for (var nr = 0; nr < NAME_ROLES.length; nr++) if (NAME_ROLES[nr][0].test(name)) return NAME_ROLES[nr][1]
                            return null
                        }
                        // everything that's physically part of the buried Sett
                        // unit (its enclosure, batteries, inverter, cooling,
                        // charge pole/cable) — stays fully rendered in
                        // wireframeMode even though the house shell around it
                        // doesn't. BAK_met_RIBS is covered by DIRT_RE already.
                        // (Extruded.009/010 are the cable socket and plug head)
                        var SETT_NAME_RE = /^(accu(\.\d+)?|Block_large_0[1-4]|Inverter_0[12]|Cooling|Charge_pole|Exhaust|Pipe\.002|schot|Panel_side|Extruded\.0(09|10))$/
                        // catches generic "Extruded.NNN" parts that belong to
                        // the Sett unit by material even though their name
                        // alone doesn't say so (e.g. Extruded.010 is wired
                        // into the inverter/cable material)
                        var SETT_MATERIAL_KEYS: Record<string, true> = {
                            "75ec9432_2e95_40c5_b8fb_ca6bd5ec44c5": true, // cooling
                            "30d7bcb5_4718_4144_b020_2c89ed81373b": true, // accu
                            "5057c406_4e83_4e64_ba7f_d7ff92e8acd2": true, // block_large
                            "0a4a8f49_1025_49a9_9063_91684161ea60": true, // inverter / cable
                            "d8f9f241_567a_4d83_8ddd_b5249e57a768": true, // charge pole / exhaust
                            // v9 ids
                            "b761d7c1_962e_451b_9711_6e31527a6303": true,
                            "23eb4583_2034_450f_84b7_5f0ef82c2a7d": true,
                            "b75eb569_5d23_4cc4_8576_c88eacc1589c": true,
                            "1fc193e7_0e1d_4046_9a0e_688cb6d88e91": true,
                            "c3bd5488_83c5_4daf_abb6_4651b18d8926": true,
                        }

                        // collected rather than converted in place — applyWireframe
                        // re-parents each mesh's replacement onto its parent's
                        // children array, and mutating that array while
                        // modelRoot.traverse() is still walking it (a live,
                        // recursive iteration) risks skipping siblings
                        var toWireframe: THREE.Mesh[] = []
                        // waypoint anchors for the energy line's route
                        var panelMeshes: THREE.Object3D[] = []
                        var batteryMeshes: THREE.Object3D[] = []
                        var houseMeshes: THREE.Mesh[] = [] // for finding the roof ridge
                        windowMaterials = []
                        modelRoot.traverse(function (child: any) {
                            if (!child.isMesh) return
                            var mats = Array.isArray(child.material) ? child.material : [child.material]
                            child.castShadow = true
                            child.receiveShadow = true
                            var isPanel = SOLAR_PANEL_RE.test(child.name)
                            var isDirt = DIRT_RE.test(child.name)
                            var isSett = isDirt || SETT_NAME_RE.test(child.name) || !!(mats[0] && SETT_MATERIAL_KEYS[mats[0].name])
                            if (isPanel) panelMeshes.push(child)
                            if (/^accu/.test(child.name)) batteryMeshes.push(child)
                            if (!isPanel && !isSett) houseMeshes.push(child)
                            // wireframeMode: only the Sett unit and solar panels
                            // keep their real material — the house shell (walls,
                            // windows, door, roof frame, pathway) turns into the
                            // shared blueprint-style wireframe instead
                            if (wireframeEdgeMat && !isPanel && !isSett) {
                                toWireframe.push(child)
                                return
                            }
                            mats.forEach(function (mat: any, i: number) {
                                // panels and the buried bin are matched by object
                                // name (their OBJ materials are inherited/wrong);
                                // everything else by material UUID, defaulting to
                                // the panel color for anything unrecognised
                                var byName = nameRole(child.name)
                                var spec = isPanel
                                    ? { role: "solarPanels" as ColorRole }
                                    : isDirt
                                      ? { role: "settBin" as ColorRole }
                                      : byName
                                        ? { role: byName }
                                        : (mat && COLOR_ROLES[mat.name]) || { role: "solarPanels" as ColorRole }
                                var m = flatMat(spec.role, { opacity: spec.opacity })
                                if (Array.isArray(child.material)) child.material[i] = m
                                else child.material = m
                            })
                        })
                        toWireframe.forEach(function (mesh) {
                            applyWireframe(mesh)
                        })

                        // the "sett" wordmark is embossed straight into the Charge_pole
                        // mesh, not a separate object. Split it out by geometry so it can
                        // take its own colour: the pole's front facia is the y-plane that
                        // spans (nearly) the full height; the letters are the most
                        // populous plane in front of it. Every triangle above the facia
                        // inside the letters' footprint — tops and side walls — goes into
                        // a second material group.
                        var logoSplit: null | { mesh: THREE.Mesh; center: THREE.Vector3; size: THREE.Vector3 } = null
                        var poleMesh = modelRoot.getObjectByName("Charge_pole") as THREE.Mesh | undefined
                        if (poleMesh && (poleMesh as any).isMesh && !Array.isArray(poleMesh.material)) {
                            var pg = poleMesh.geometry as THREE.BufferGeometry
                            if (pg.index) pg = poleMesh.geometry = pg.toNonIndexed()
                            var pp0 = pg.attributes.position
                            var maxY = -Infinity
                            for (var vi = 0; vi < pp0.count; vi++) maxY = Math.max(maxY, pp0.getY(vi))
                            var planes: Record<string, { y: number; n: number; minX: number; maxX: number; minZ: number; maxZ: number }> = {}
                            for (var vj = 0; vj < pp0.count; vj++) {
                                var py = pp0.getY(vj)
                                if (py < maxY - 4) continue
                                var key = py.toFixed(2)
                                var pl = planes[key] || (planes[key] = { y: py, n: 0, minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity })
                                pl.n++
                                pl.minX = Math.min(pl.minX, pp0.getX(vj))
                                pl.maxX = Math.max(pl.maxX, pp0.getX(vj))
                                pl.minZ = Math.min(pl.minZ, pp0.getZ(vj))
                                pl.maxZ = Math.max(pl.maxZ, pp0.getZ(vj))
                            }
                            var list = Object.keys(planes).map(function (k) {
                                return planes[k]
                            })
                            var facia = list.slice().sort(function (a, b) {
                                return b.maxZ - b.minZ - (a.maxZ - a.minZ)
                            })[0]
                            var letters = list
                                .filter(function (p) {
                                    return p !== facia && p.y > facia.y
                                })
                                .sort(function (a, b) {
                                    return b.n - a.n
                                })[0]
                            if (facia && letters && letters.n > 100) {
                                var zx0 = letters.minX - 0.6,
                                    zx1 = letters.maxX + 0.6,
                                    zz0 = letters.minZ - 0.6,
                                    zz1 = letters.maxZ + 0.6
                                var triCount = pp0.count / 3
                                var logoTris: number[] = [],
                                    restTris: number[] = []
                                var lmin = new THREE.Vector3(Infinity, Infinity, Infinity),
                                    lmax = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
                                for (var ti = 0; ti < triCount; ti++) {
                                    var a0 = ti * 3
                                    var cx = (pp0.getX(a0) + pp0.getX(a0 + 1) + pp0.getX(a0 + 2)) / 3
                                    var cy = (pp0.getY(a0) + pp0.getY(a0 + 1) + pp0.getY(a0 + 2)) / 3
                                    var cz = (pp0.getZ(a0) + pp0.getZ(a0 + 1) + pp0.getZ(a0 + 2)) / 3
                                    if (cy > facia.y + 0.05 && cx > zx0 && cx < zx1 && cz > zz0 && cz < zz1) {
                                        logoTris.push(ti)
                                        for (var c3 = 0; c3 < 3; c3++) {
                                            lmin.min(new THREE.Vector3(pp0.getX(a0 + c3), pp0.getY(a0 + c3), pp0.getZ(a0 + c3)))
                                            lmax.max(new THREE.Vector3(pp0.getX(a0 + c3), pp0.getY(a0 + c3), pp0.getZ(a0 + c3)))
                                        }
                                    } else restTris.push(ti)
                                }
                                if (logoTris.length > 20) {
                                    var idx = new Uint32Array(pp0.count)
                                    var w = 0
                                    restTris.concat(logoTris).forEach(function (t) {
                                        idx[w++] = t * 3
                                        idx[w++] = t * 3 + 1
                                        idx[w++] = t * 3 + 2
                                    })
                                    pg.setIndex(new THREE.BufferAttribute(idx, 1))
                                    pg.clearGroups()
                                    pg.addGroup(0, restTris.length * 3, 0)
                                    pg.addGroup(restTris.length * 3, logoTris.length * 3, 1)
                                    poleMesh.material = [poleMesh.material as THREE.Material, flatMat("logo")]
                                    logoSplit = { mesh: poleMesh, center: lmin.clone().add(lmax).multiplyScalar(0.5), size: lmax.clone().sub(lmin) }
                                }
                            }
                        }

                        var box = new THREE.Box3().setFromObject(modelRoot)
                        var size = new THREE.Vector3(),
                            center = new THREE.Vector3()
                        box.getSize(size)
                        box.getCenter(center)
                        modelRoot.position.sub(center)
                        modelRoot.updateMatrixWorld(true)
                        var gradeRef = modelRoot.getObjectByName("Pathway") || modelRoot.getObjectByName("Vloer")
                        var gradeY = gradeRef ? new THREE.Box3().setFromObject(gradeRef).min.y - 0.001 : -size.y / 2 - 0.001
                        ground.position.y = gradeY

                        var vloerRef = modelRoot.getObjectByName("Vloer")
                        if (vloerRef) {
                            var vloerCenter = new THREE.Box3().setFromObject(vloerRef).getCenter(new THREE.Vector3())
                            houseLight.position.set(vloerCenter.x, gradeY + 150, vloerCenter.z)
                        }

                        // in wireframeMode the house is a blueprint, not a lit
                        // building — skip the glow panes entirely (and houseLight
                        // gets zeroed in setTimeOfDay below) rather than leaving
                        // warm light glowing out of a schematic
                        if (!wireframeMode) {
                            var WINDOW_NAMES = ["Raam_boven_midden", "Raam_boven_links", "Raam_boven_rechts", "Raam_beneden_links", "Raan_beneden_rechts"]
                            WINDOW_NAMES.forEach(function (name) {
                                var frame = modelRoot!.getObjectByName(name)
                                if (!frame) return
                                var winBox = new THREE.Box3().setFromObject(frame)
                                var winSize = winBox.getSize(new THREE.Vector3())
                                var winCenter = winBox.getCenter(new THREE.Vector3())
                                var paneMat = new THREE.MeshBasicMaterial({
                                    color: 0xffdcae,
                                    transparent: true,
                                    opacity: 0,
                                    depthWrite: false,
                                    side: THREE.DoubleSide,
                                    // skip tone mapping so the pane shows the exact
                                    // pale color picked, instead of ACES pushing an
                                    // unlit full-brightness surface into hot orange
                                    toneMapped: false,
                                })
                                var pane = new THREE.Mesh(new THREE.PlaneGeometry(winSize.x * 0.94, winSize.y * 0.94), paneMat)
                                pane.position.copy(winCenter)
                                pane.renderOrder = 2
                                scene.add(pane)
                                windowMaterials.push(paneMat)
                            })
                        }

                        var groundRadius = Math.max(size.x, size.z) * 28
                        var binRef = modelRoot.getObjectByName("BAK_met_RIBS")
                        var groundShape = new THREE.Shape()
                        groundShape.absarc(0, 0, groundRadius, 0, Math.PI * 2, false)
                        if (binRef) {
                            var binBox = new THREE.Box3().setFromObject(binRef)
                            var margin = 2
                            var hx0 = binBox.min.x - margin,
                                hx1 = binBox.max.x + margin
                            var hy0 = -(binBox.max.z + margin),
                                hy1 = -(binBox.min.z - margin)
                            var hole = new THREE.Path()
                            hole.moveTo(hx0, hy0)
                            hole.lineTo(hx1, hy0)
                            hole.lineTo(hx1, hy1)
                            hole.lineTo(hx0, hy1)
                            hole.lineTo(hx0, hy0)
                            groundShape.holes.push(hole)
                        }
                        ground.geometry.dispose()
                        ground.geometry = new THREE.ShapeGeometry(groundShape, 96)
                        var blueprintTex = makeBlueprintTexture(512)
                        ground.material = new THREE.MeshStandardMaterial({
                            map: blueprintTex,
                            transparent: true,
                            roughness: 0.9,
                            emissive: 0x8fd6ff,
                            emissiveMap: blueprintTex,
                            emissiveIntensity: 0.5,
                            depthWrite: false,
                        } as any)
                        var blueprintRepeat = groundRadius / 1000
                        blueprintTex.repeat.set(blueprintRepeat, blueprintRepeat)
                        ground.renderOrder = 1

                        // the car is placed against the charge cable's plug rather than at a
                        // fixed spot: the plug's exact position shifts between model exports
                        // (v9's cable is decimated), so measure it and close the gap. Both the
                        // car and the cable end arrive asynchronously — whichever is last calls it.
                        var carGroup: THREE.Group | null = null
                        var carPlug: THREE.Vector3 | null = null
                        var carAligned = false
                        var carAnchor = new THREE.Vector3(-472, gradeY + 190, -301)
                        var carAxis = new THREE.Vector3(Math.sin(0.08), 0, Math.cos(0.08))
                        var carObstacles: { x: number; z: number; r: number }[] = []
                        function alignCarToPlug() {
                            if (carAligned || !carGroup || !carPlug) return
                            carAligned = true
                            carGroup.updateMatrixWorld(true)
                            var cbox = new THREE.Box3().setFromObject(carGroup)
                            var toCar = cbox.getCenter(new THREE.Vector3()).sub(carPlug)
                            toCar.y = 0
                            if (toCar.lengthSq() < 1) return
                            toCar.normalize()
                            // cast from well outside the car, through the plug, so the result is
                            // signed: positive = a gap to close, negative = the plug is inside the body
                            var back = 400
                            var hits = new THREE.Raycaster(carPlug.clone().addScaledVector(toCar, -back), toCar, 0, back + 900).intersectObject(carGroup, true)
                            if (!hits.length) return
                            var gap = hits[0].distance - back
                            var slack = 2 // the plug head's tip touching the body, not sunk into it
                            if (Math.abs(gap - slack) < 0.5 || Math.abs(gap) > 260) return // already right, or a bad hit — leave it be
                            carGroup.position.addScaledVector(toCar, -(gap - slack))
                            carAnchor.set(carGroup.position.x, gradeY + 190, carGroup.position.z)
                            carObstacles.forEach(function (o, i) {
                                var d = i === 0 ? -115 : 115
                                o.x = carGroup!.position.x + carAxis.x * d
                                o.z = carGroup!.position.z + carAxis.z * d
                            })
                            requestRender()
                        }

                        var stlLoader = new STLLoader()
                        stlLoader.load(carUrl, function (geometry: THREE.BufferGeometry) {
                            if (cancelled) return
                            var footprintAngle = THREE.MathUtils.degToRad(149.62008156248243)
                            var rawLength = new THREE.Vector3(Math.cos(footprintAngle), Math.sin(footprintAngle), 0)
                            var rawWidth = new THREE.Vector3(Math.cos(footprintAngle + Math.PI / 2), Math.sin(footprintAngle + Math.PI / 2), 0)
                            var rawUp = new THREE.Vector3(0, 0, 1)
                            var alignMatrix = new THREE.Matrix4().makeBasis(rawWidth, rawUp, rawLength).transpose()
                            geometry.applyMatrix4(alignMatrix)
                            geometry.computeVertexNormals()

                            // flatShading here is what gives the scan its low-poly
                            // faceted look instead of a smoothed-over blob
                            var carMat = flatMat("car")
                            var carObj = new THREE.Mesh(geometry, carMat)
                            carObj.castShadow = true
                            carObj.receiveShadow = true
                            var carBox = new THREE.Box3().setFromObject(carObj)
                            var carCenter = new THREE.Vector3()
                            carBox.getCenter(carCenter)
                            carObj.position.set(-carCenter.x, -carBox.min.y, -carCenter.z)

                            carGroup = new THREE.Group()
                            carGroup.add(carObj)
                            var carLength = carBox.max.z - carBox.min.z
                            carGroup.scale.setScalar(460 / carLength)
                            carGroup.position.set(-472, gradeY, -301)
                            carGroup.rotation.y = 0.08
                            scene.add(carGroup)
                            alignCarToPlug()
                            requestRender()
                        })

                        // ground-level footprints the energy lines have to route around
                        // (xz circles): tree trunks, bushes, the car (two discs along its
                        // length; it's placed at a known spot), later the charge pole
                        var obstacles: { x: number; z: number; r: number }[] = []
                        ;[
                            [-650, 250],
                            [-650, 650],
                            [660, 680],
                            [-180, 1010],
                        ].forEach(function (p) {
                            var tree = makeTree()
                            tree.position.set(p[0], gradeY, p[1])
                            tree.rotation.y = Math.random() * Math.PI * 2
                            scene.add(tree)
                            obstacles.push({ x: p[0], z: p[1], r: 48 })
                        })

                        ;[-280, -195, -110, 175, 260, 340].forEach(function (x) {
                            var bush = makeBush()
                            bush.position.set(x, gradeY, 95)
                            bush.rotation.y = Math.random() * Math.PI * 2
                            scene.add(bush)
                            obstacles.push({ x: x, z: 95, r: 72 })
                        })
                        ;[-115, 115].forEach(function (d) {
                            var co = { x: -472 + carAxis.x * d, z: -301 + carAxis.z * d, r: 140 }
                            obstacles.push(co)
                            carObstacles.push(co)
                        })

                        var radius = Math.max(size.length() * 0.5, 0.0001)
                        radiusBase = radius
                        var fitDist = radius / Math.sin(((camera.fov * Math.PI) / 180) / 2)
                        camera.near = fitDist / 100
                        camera.far = fitDist * 100
                        camera.updateProjectionMatrix()
                        controls.minDistance = fitDist / 50
                        controls.maxDistance = fitDist * 6

                        keyLight.target.position.set(0, 0, 0)
                        scene.add(keyLight.target)
                        keyLight.shadow.camera.left = -radius * 1.6
                        ;(keyLight.shadow.camera as any).right = radius * 1.6
                        ;(keyLight.shadow.camera as any).top = radius * 1.6
                        ;(keyLight.shadow.camera as any).bottom = -radius * 1.6
                        keyLight.shadow.camera.near = 0.01
                        keyLight.shadow.camera.far = radius * 8
                        keyLight.shadow.camera.updateProjectionMatrix()
                        bounceLight.position.set(-radius * 0.6, -radius * 1.5, radius * 0.4)
                        bounceLight.target.position.set(0, radius * 0.3, 0)
                        scene.add(bounceLight.target)
                        houseLight.distance = radius * 1.4
                        houseLight.decay = 2
                        // spotlight hung high above the buried unit, offset toward
                        // the camera side so it rakes across the bin rather than
                        // flattening it from straight overhead
                        if (binRef) {
                            var settCenter = new THREE.Box3().setFromObject(binRef).getCenter(new THREE.Vector3())
                            settLight.position.set(settCenter.x + radius * 0.35, gradeY + radius * 1.1, settCenter.z + radius * 0.35)
                            settLight.target.position.copy(settCenter)
                        }
                        setTimeOfDay(dayProgress)

                        if (ssaoPass) {
                            ssaoPass.kernelRadius = radius * 0.045
                            ssaoPass.minDistance = radius * 0.0005
                            ssaoPass.maxDistance = radius * 0.03
                        }
                        scene.add(modelRoot)

                        // ---------- energy line + story ----------
                        function unionBox(objs: THREE.Object3D[]) {
                            var b = new THREE.Box3()
                            objs.forEach(function (o) {
                                b.union(new THREE.Box3().setFromObject(o))
                            })
                            return b
                        }
                        var panelBox = panelMeshes.length ? unionBox(panelMeshes) : new THREE.Box3().setFromObject(modelRoot!)
                        var panelCenter = panelBox.getCenter(new THREE.Vector3())
                        // a close-up on the roof; only definable once we know where the panels are
                        VIEWS.solar = { phi: 48 * DEG, theta: 150 * DEG, dist: 1.15, target: panelCenter.clone() }

                        var wallObjs = [modelRoot!.getObjectByName("Muren_boven"), modelRoot!.getObjectByName("Muren_beneden")].filter(Boolean) as THREE.Object3D[]
                        var wallsBox = wallObjs.length ? unionBox(wallObjs) : new THREE.Box3().setFromObject(modelRoot!)
                        var binCenter = binRef ? new THREE.Box3().setFromObject(binRef).getCenter(new THREE.Vector3()) : new THREE.Vector3()
                        var binBox2 = binRef ? new THREE.Box3().setFromObject(binRef) : wallsBox.clone()
                        var battBox = batteryMeshes.length ? unionBox(batteryMeshes) : binBox2.clone()
                        var battCenter = battBox.getCenter(new THREE.Vector3())
                        // charging batteries: grey at the start of the story, tinting to the
                        // battery colour as the charge level rises
                        if (storyMode && batteryMeshes.length) {
                            var chargeMats: THREE.MeshStandardMaterial[] = []
                            batteryMeshes.forEach(function (bm: any) {
                                if (!Array.isArray(bm.material)) chargeMats.push(bm.material as THREE.MeshStandardMaterial)
                            })
                            batteryFill = { mats: chargeMats, green: roleColor("battery"), charge: 0 }
                            applyBatteryCharge()
                        }
                        var invRef = modelRoot!.getObjectByName("Inverter_01")
                        var invBox = invRef ? new THREE.Box3().setFromObject(invRef) : battBox.clone()
                        var invCenter = invBox.getCenter(new THREE.Vector3())
                        var poleRef = modelRoot!.getObjectByName("Charge_pole")
                        var poleBox = poleRef ? new THREE.Box3().setFromObject(poleRef) : invBox.clone()
                        var poleTop = new THREE.Vector3((poleBox.min.x + poleBox.max.x) / 2, poleBox.max.y + 12, (poleBox.min.z + poleBox.max.z) / 2)
                        // the cable's free end = the Pipe.002 vertex farthest from the pole top
                        var cableEnd = poleTop.clone().add(new THREE.Vector3(-60, -60, -60))
                        var pipe = modelRoot!.getObjectByName("Pipe.002") as THREE.Mesh | undefined
                        if (pipe && (pipe as any).geometry) {
                            pipe.updateMatrixWorld(true)
                            var pp = (pipe.geometry as THREE.BufferGeometry).attributes.position
                            var far = -1
                            var v = new THREE.Vector3()
                            for (var pi = 0; pi < pp.count; pi++) {
                                v.fromBufferAttribute(pp as any, pi).applyMatrix4(pipe.matrixWorld)
                                var d = v.distanceTo(poleTop)
                                if (d > far) {
                                    far = d
                                    cableEnd.copy(v)
                                }
                            }
                        }
                        // the story's charging shot: the existing "charger" view is a
                        // macro on the car that leaves the pole out of frame, so this one
                        // sits between pole and cable end and takes both in with the car
                        var chargeMid = poleTop.clone().add(cableEnd).multiplyScalar(0.5)
                        chargeMid.y = poleBox.min.y + 80
                        VIEWS.charge = { phi: 56 * DEG, theta: 165 * DEG, dist: 0.85, target: chargeMid }
                        // the closing overview: less top-down, from further south, centred on the Sett
                        VIEWS.top = { phi: 30 * DEG, theta: 210 * DEG, dist: 1.9, target: binCenter.clone().setY(gradeY + 20) }
                        // ROUTES — every waypoint keeps clearance from the geometry so
                        // the lines run over/alongside things instead of through them.
                        // DAY: above the panels → clear of the roof edge → down the
                        // outside of the wall → across the gap to the bin → over the open
                        // bin → straight down onto the batteries.
                        // NIGHT-HOUSE: batteries → up out of the bin → back across → the wall.
                        // NIGHT-CAR: batteries → up out of the bin → to where the cable
                        // leaves the pole → along the real cable geometry → the plug.
                        var ex = Math.max(wallsBox.min.x, Math.min(wallsBox.max.x, binCenter.x))
                        var ez = Math.max(wallsBox.min.z, Math.min(wallsBox.max.z, binCenter.z))
                        var out = new THREE.Vector3(binCenter.x - ex, 0, binCenter.z - ez)
                        if (out.lengthSq() < 1) out.set(0, 0, 1)
                        out.normalize()
                        var roofY = wallsBox.max.y
                        var roofEdge = new THREE.Vector3(ex, roofY + 14, ez).addScaledVector(out, 55)
                        var eave = new THREE.Vector3(ex, roofY - 40, ez).addScaledVector(out, 42)
                        // the bin edge nearest the wall, and how much room there is between
                        var binNearX = Math.max(binBox2.min.x, Math.min(binBox2.max.x, ex))
                        var binNearZ = Math.max(binBox2.min.z, Math.min(binBox2.max.z, ez))
                        var gap = Math.hypot(binNearX - ex, binNearZ - ez)
                        var foot = new THREE.Vector3(ex, gradeY + 14, ez).addScaledVector(out, Math.max(20, Math.min(60, gap * 0.5)))
                        var hover = gradeY + 34 // cruising height above the open bin
                        var groundH = Math.max(gradeY + 14, binBox2.max.y + 8) // "over the ground" height: clears the bin's rim
                        var binEntry = new THREE.Vector3(binNearX, hover, binNearZ)
                        var battTop = new THREE.Vector3(battCenter.x, battBox.max.y + 10, battCenter.z)
                        var battAbove = new THREE.Vector3(battCenter.x, hover, battCenter.z)
                        var panelStart = panelCenter.clone().add(new THREE.Vector3(0, 28, 0))
                        // corners get chamfered before the spline goes through them, so
                        // the curve hugs the polyline (small, predictable rounding)
                        // instead of overshooting into whatever is next to a sharp turn
                        function rounded(pts: THREE.Vector3[], r?: number) {
                            r = r || 14
                            if (pts.length < 3) return pts.slice()
                            var res: THREE.Vector3[] = [pts[0]]
                            for (var ri = 1; ri < pts.length - 1; ri++) {
                                var P = pts[ri],
                                    A = pts[ri - 1],
                                    B = pts[ri + 1]
                                var ka = Math.min(0.4, r / Math.max(1, P.distanceTo(A)))
                                var kb = Math.min(0.4, r / Math.max(1, P.distanceTo(B)))
                                res.push(P.clone().lerp(A, ka), P.clone().lerp(B, kb))
                            }
                            res.push(pts[pts.length - 1])
                            return res
                        }

                        // the charging line follows the real cable: walk the Pipe.002
                        // mesh from the pole end, repeatedly averaging the not-yet-visited
                        // vertices within reach — with the ones behind already used up,
                        // each centroid lands a step further along, tracing the centreline
                        function cableCenterline(mesh: THREE.Mesh, from: THREE.Vector3): THREE.Vector3[] {
                            var pos = (mesh.geometry as THREE.BufferGeometry).attributes.position
                            var pts: THREE.Vector3[] = []
                            for (var k = 0; k < pos.count; k++) pts.push(new THREE.Vector3().fromBufferAttribute(pos as any, k).applyMatrix4(mesh.matrixWorld))
                            var bb = new THREE.Box3().setFromPoints(pts)
                            var R = Math.max(12, bb.getSize(new THREE.Vector3()).length() * 0.05)
                            var visited = new Uint8Array(pts.length)
                            var c = pts[0]
                            var nd = Infinity
                            pts.forEach(function (q) {
                                var d = q.distanceToSquared(from)
                                if (d < nd) {
                                    nd = d
                                    c = q
                                }
                            })
                            var out2: THREE.Vector3[] = [c.clone()]
                            for (var guard = 0; guard < 400; guard++) {
                                var sum = new THREE.Vector3(),
                                    n = 0
                                for (var k2 = 0; k2 < pts.length; k2++) {
                                    if (!visited[k2] && pts[k2].distanceToSquared(c) < R * R) {
                                        sum.add(pts[k2])
                                        n++
                                        visited[k2] = 1
                                    }
                                }
                                if (!n) {
                                    // a gap in the vertex distribution — look twice as far, once
                                    for (var k3 = 0; k3 < pts.length; k3++) {
                                        if (!visited[k3] && pts[k3].distanceToSquared(c) < 4 * R * R) {
                                            sum.add(pts[k3])
                                            n++
                                            visited[k3] = 1
                                        }
                                    }
                                    if (!n) break
                                }
                                c = sum.multiplyScalar(1 / n)
                                out2.push(c.clone())
                            }
                            return out2
                        }
                        // the walk ends where the cable's vertices end (the plug); no
                        // "farthest vertex" fix-up — that vertex can sit elsewhere on a
                        // curled end and would draw a tail back from the plug
                        var cablePts = pipe && (pipe as any).geometry ? cableCenterline(pipe, poleTop) : [poleTop.clone(), cableEnd.clone()]
                        // park the car against the plug head at the cable's car-side end.
                        // (cableEnd is the OTHER end — the cable's droop by the pole — so it
                        // sits near the ground and can't be used as the plug.)
                        var plugRef = modelRoot!.getObjectByName("Extruded.010")
                        carPlug = plugRef ? new THREE.Box3().setFromObject(plugRef).getCenter(new THREE.Vector3()) : cablePts[cablePts.length - 1].clone()
                        alignCarToPlug()

                        // ---- lean cable: the exported Pipe.002 is ~36k vertices (70% of the
                        // whole model). Rebuild it as a tube along the extracted centreline
                        // with the same radius and material, then drop the original.
                        var cableRadius = radius * 0.003
                        if (pipe && (pipe as any).geometry && cablePts.length > 3) {
                            var ppos = (pipe.geometry as THREE.BufferGeometry).attributes.position
                            var world: THREE.Vector3[] = []
                            for (var wq = 0; wq < ppos.count; wq++) world.push(new THREE.Vector3().fromBufferAttribute(ppos as any, wq).applyMatrix4(pipe.matrixWorld))
                            // radius = distance from interior centreline points to the surface (median of a few)
                            var rs: number[] = []
                            var step = Math.max(1, Math.floor((cablePts.length - 2) / 6))
                            for (var s = 1; s < cablePts.length - 1; s += step) {
                                var md = Infinity
                                for (var q = 0; q < world.length; q++) md = Math.min(md, world[q].distanceToSquared(cablePts[s]))
                                rs.push(Math.sqrt(md))
                            }
                            rs.sort(function (a, b) {
                                return a - b
                            })
                            if (rs.length && rs[Math.floor(rs.length / 2)] > 0.2) cableRadius = rs[Math.floor(rs.length / 2)]
                            cableRadius *= 2.6 // the exported cable is on the thin side; beef it up
                            var leanCable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts, false, "centripetal", 0.5), 64, cableRadius, 10, false), pipe.material)
                            leanCable.castShadow = true
                            leanCable.receiveShadow = true
                            leanCable.name = "Pipe.lean"
                            scene.add(leanCable) // centreline is in world space
                            if (pipe.parent) pipe.parent.remove(pipe)
                            ;(pipe.geometry as THREE.BufferGeometry).dispose()
                        }

                        // ---- car route: from the bin, up the pole's outside like a conduit
                        // (the side facing the bin), around the corner at socket height,
                        // into the socket, then along the cable to the plug
                        var cableStart = cablePts[0]
                        var poleC = new THREE.Vector3((poleBox.min.x + poleBox.max.x) / 2, 0, (poleBox.min.z + poleBox.max.z) / 2)
                        var phx = (poleBox.max.x - poleBox.min.x) / 2,
                            phz = (poleBox.max.z - poleBox.min.z) / 2
                        function halfAlong(d: THREE.Vector3) {
                            return Math.abs(d.x) * phx + Math.abs(d.z) * phz
                        }
                        var faceN = new THREE.Vector3(cableStart.x - poleC.x, 0, cableStart.z - poleC.z)
                        if (faceN.lengthSq() < 1e-6) faceN.copy(out)
                        faceN.normalize()
                        var toBin = new THREE.Vector3(binCenter.x - poleC.x, 0, binCenter.z - poleC.z)
                        toBin.addScaledVector(faceN, -toBin.dot(faceN))
                        if (toBin.lengthSq() < 1e-6) toBin.set(faceN.z, 0, -faceN.x)
                        toBin.normalize()
                        var sideOff = halfAlong(toBin) + 7
                        var sideBase = poleC.clone().addScaledVector(toBin, sideOff).setY(gradeY + 12)
                        // into the post at its foot, up inside it (hidden by the pole
                        // itself), then straight out through the face at the socket
                        var poleIn = poleC.clone().setY(gradeY + 12)
                        var poleUp = poleC.clone().setY(cableStart.y)
                        var binExit = new THREE.Vector3(
                            Math.max(binBox2.min.x, Math.min(binBox2.max.x, sideBase.x)),
                            hover,
                            Math.max(binBox2.min.z, Math.min(binBox2.max.z, sideBase.z))
                        )

                        // ---- house route: into the wall beside the front door at ground
                        // level, approaching along the pathway so it stays clear of the
                        // planting along the wall
                        var doorRef = modelRoot!.getObjectByName("Deur")
                        var doorBox = doorRef ? new THREE.Box3().setFromObject(doorRef) : null
                        var wallsCenter = wallsBox.getCenter(new THREE.Vector3())
                        var houseEntry: THREE.Vector3[]
                        if (doorBox) {
                            var dc = doorBox.getCenter(new THREE.Vector3())
                            var ds = doorBox.getSize(new THREE.Vector3())
                            // the door is thin along its wall's normal axis
                            var alongX = ds.x < ds.z
                            var doorN = alongX ? new THREE.Vector3(Math.sign(dc.x - wallsCenter.x) || 1, 0, 0) : new THREE.Vector3(0, 0, Math.sign(dc.z - wallsCenter.z) || 1)
                            var lateral = alongX ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
                            var toBinSide = Math.sign(new THREE.Vector3(binCenter.x - dc.x, 0, binCenter.z - dc.z).dot(lateral)) || 1
                            lateral.multiplyScalar(toBinSide)
                            var doorHalfW = (alongX ? ds.z : ds.x) / 2
                            // the entry sits just inside the wall so the visible end is flush
                            // with it, and the last leg comes in straight along the wall normal
                            var doorSide = dc.clone().addScaledVector(lateral, doorHalfW + 24).addScaledVector(doorN, -4).setY(groundH)
                            houseEntry = [doorSide]
                        } else {
                            houseEntry = [new THREE.Vector3(ex, groundH, ez).addScaledVector(out, -4)]
                        }
                        // the house's axes, for clean corners parallel to its walls
                        var axA = doorBox ? doorN.clone() : out.clone()
                        var axB = new THREE.Vector3(-axA.z, 0, axA.x)
                        var houseRect = { x0: wallsBox.min.x - 30, x1: wallsBox.max.x + 30, z0: wallsBox.min.z - 30, z1: wallsBox.max.z + 30 }
                        function blocked(a: THREE.Vector3, b: THREE.Vector3) {
                            var n = Math.max(2, Math.ceil(a.distanceTo(b) / 8))
                            var p = new THREE.Vector3()
                            for (var i = 0; i <= n; i++) {
                                p.lerpVectors(a, b, i / n)
                                for (var oi = 0; oi < obstacles.length; oi++) {
                                    var o = obstacles[oi]
                                    if ((p.x - o.x) * (p.x - o.x) + (p.z - o.z) * (p.z - o.z) < o.r * o.r) return true
                                }
                                if (p.x > houseRect.x0 && p.x < houseRect.x1 && p.z > houseRect.z0 && p.z < houseRect.z1) return true
                            }
                            return false
                        }
                        // ground route S→E at a fixed height: the straight run if it's clear,
                        // otherwise an L (one clean corner, legs along the house's axes) or a
                        // Z (two corners) — first candidate that clears every obstacle wins
                        function planGround(S: THREE.Vector3, E: THREE.Vector3, preferFinalAlongA: boolean) {
                            var d = E.clone().sub(S)
                            var dA = d.dot(axA),
                                dB = d.dot(axB)
                            var direct = [S, E]
                            var viaA = [S, S.clone().addScaledVector(axA, dA), E] // first along A, final leg along B
                            var viaB = [S, S.clone().addScaledVector(axB, dB), E] // first along B, final leg along A
                            var cands = preferFinalAlongA ? [viaB, direct, viaA] : [direct, viaA, viaB]
                            ;[0.5, 0.3, 0.7].forEach(function (f) {
                                var m1 = S.clone().addScaledVector(axA, dA * f)
                                cands.push([S, m1, m1.clone().addScaledVector(axB, dB), E])
                                var n1 = S.clone().addScaledVector(axB, dB * f)
                                cands.push([S, n1, n1.clone().addScaledVector(axA, dA), E])
                            })
                            for (var ci = 0; ci < cands.length; ci++) {
                                var ok = true
                                for (var si2 = 0; si2 < cands[ci].length - 1; si2++) {
                                    if (blocked(cands[ci][si2], cands[ci][si2 + 1])) {
                                        ok = false
                                        break
                                    }
                                }
                                if (ok) return cands[ci]
                            }
                            return direct
                        }

                        // ---- grid: a simple lattice pylon behind-right of the house (as
                        // seen from the hero camera), with a power line sagging down to the
                        // Sett's inverter
                        var hv = VIEWS.hero
                        var hoff = sphericalToOffset(1, hv.phi, hv.theta)
                        var viewDir = new THREE.Vector3(-hoff.x, 0, -hoff.z).normalize()
                        var rightV = new THREE.Vector3(-viewDir.z, 0, viewDir.x)
                        var towerPos = hv.target.clone().addScaledVector(viewDir, radius * 2.7).addScaledVector(rightV, radius * 1.15).setY(gradeY)
                        var towerH = (wallsBox.max.y - gradeY) * 0.95 // small on purpose: reads as far away, and fits under the horizon line of the hero shot
                        var toBinDir = new THREE.Vector3(binCenter.x - towerPos.x, 0, binCenter.z - towerPos.z).normalize()
                        var armDir = new THREE.Vector3(-toBinDir.z, 0, toBinDir.x)
                        var towerMat = flatMat("gridTower")
                        var tower = new THREE.Group()
                        function bar(a: THREE.Vector3, b: THREE.Vector3, r: number) {
                            var len = a.distanceTo(b)
                            if (len < 0.01) return
                            var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), towerMat)
                            m.position.copy(a).add(b).multiplyScalar(0.5)
                            m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
                            m.castShadow = true
                            tower.add(m)
                        }
                        var legR = towerH * 0.007,
                            baseHalf = towerH * 0.13,
                            topHalf = towerH * 0.04
                        var cornerSigns = [
                            [1, 1],
                            [1, -1],
                            [-1, -1],
                            [-1, 1],
                        ]
                        function ring(h: number, half: number) {
                            return cornerSigns.map(function (c) {
                                return towerPos.clone().add(new THREE.Vector3(0, h, 0)).addScaledVector(toBinDir, c[0] * half).addScaledVector(armDir, c[1] * half)
                            })
                        }
                        var ringBottom = ring(0, baseHalf),
                            ringTop = ring(towerH * 0.92, topHalf)
                        for (var li = 0; li < 4; li++) bar(ringBottom[li], ringTop[li], legR)
                        ;[0.16, 0.36, 0.56, 0.74, 0.92].forEach(function (f) {
                            var rr = ring(towerH * f, lerp(baseHalf, topHalf, f / 0.92))
                            for (var bi = 0; bi < 4; bi++) bar(rr[bi], rr[(bi + 1) % 4], legR * 0.7)
                        })
                        var apex = towerPos.clone().add(new THREE.Vector3(0, towerH, 0))
                        for (var ai = 0; ai < 4; ai++) bar(ringTop[ai], apex, legR * 0.7)
                        var armTip: THREE.Vector3 | null = null
                        ;[0.66, 0.82].forEach(function (f, idx) {
                            var c = towerPos.clone().add(new THREE.Vector3(0, towerH * f, 0))
                            var L = towerH * (idx === 0 ? 0.26 : 0.21)
                            bar(c.clone().addScaledVector(armDir, -L), c.clone().addScaledVector(armDir, L), legR * 0.9)
                            ;[-1, 1].forEach(function (s) {
                                var tip = c.clone().addScaledVector(armDir, s * L * 0.9)
                                var ins = new THREE.Mesh(new THREE.CylinderGeometry(legR * 1.7, legR * 1.7, towerH * 0.035, 6), towerMat)
                                ins.position.copy(tip).add(new THREE.Vector3(0, -towerH * 0.0175, 0))
                                ins.castShadow = true
                                tower.add(ins)
                                // the wire hangs from the lower arm, camera-right side
                                if (idx === 0 && s * armDir.dot(rightV) > 0) armTip = tip.clone().add(new THREE.Vector3(0, -towerH * 0.035, 0))
                            })
                        })
                        scene.add(tower)
                        obstacles.push({ x: poleC.x, z: poleC.z, r: Math.max(phx, phz) + 22 })

                        function makeCurve(pts: THREE.Vector3[]) {
                            return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5)
                        }
                        // over the roof's contour: up to the ridge (its highest vertices,
                        // reduced to a segment), along the ridge to above the bay where the
                        // line steps off, then down to the edge. Every leg joins two points
                        // that sit above the roof, so on a convex roof no leg cuts through it.
                        var ridgeY = new THREE.Box3().setFromObject(modelRoot!).max.y
                        var ridgeBox = new THREE.Box3()
                        var rv = new THREE.Vector3()
                        houseMeshes.forEach(function (hm) {
                            var pa = (hm.geometry as THREE.BufferGeometry).attributes.position
                            if (!pa) return
                            for (var ri2 = 0; ri2 < pa.count; ri2++) {
                                rv.fromBufferAttribute(pa as any, ri2)
                                modelRoot!.localToWorld(rv)
                                if (rv.y > ridgeY - 4) ridgeBox.expandByPoint(rv)
                            }
                        })
                        var dayPts: THREE.Vector3[] = [panelStart]
                        if (!ridgeBox.isEmpty()) {
                            var rsz = ridgeBox.getSize(new THREE.Vector3()),
                                rc = ridgeBox.getCenter(new THREE.Vector3())
                            var ridgeAlongX = rsz.x >= rsz.z
                            var rA = ridgeAlongX ? new THREE.Vector3(ridgeBox.min.x, ridgeY, rc.z) : new THREE.Vector3(rc.x, ridgeY, ridgeBox.min.z)
                            var rB = ridgeAlongX ? new THREE.Vector3(ridgeBox.max.x, ridgeY, rc.z) : new THREE.Vector3(rc.x, ridgeY, ridgeBox.max.z)
                            var rAB = rB.clone().sub(rA)
                            function onRidge(p: THREE.Vector3) {
                                var tt = rAB.lengthSq() > 1 ? Math.max(0, Math.min(1, p.clone().sub(rA).dot(rAB) / rAB.lengthSq())) : 0
                                return rA.clone().addScaledVector(rAB, tt).add(new THREE.Vector3(0, 18, 0))
                            }
                            var apexNear = onRidge(panelStart)
                            var apexFar = onRidge(new THREE.Vector3(ex, ridgeY, ez))
                            dayPts.push(apexNear)
                            if (apexNear.distanceTo(apexFar) > 20) dayPts.push(apexFar)
                        }
                        dayPts.push(roofEdge, eave, foot, binEntry, battAbove, battTop)
                        var dayCurve = makeCurve(rounded(dayPts, 12))
                        // house: up out of the batteries to ground level, out of the bin
                        // toward the pathway, then along the pathway's edge (the side facing
                        // the Sett) straight to the wall at the door
                        var houseEnd = houseEntry[0]
                        var battGround = new THREE.Vector3(battTop.x, groundH, battTop.z)
                        var pathRef = modelRoot!.getObjectByName("Pathway")
                        var housePts: THREE.Vector3[]
                        if (doorBox && pathRef) {
                            var pathBox = new THREE.Box3().setFromObject(pathRef)
                            var pathC = pathBox.getCenter(new THREE.Vector3())
                            var pathS = pathBox.getSize(new THREE.Vector3())
                            var dc2 = doorBox.getCenter(new THREE.Vector3())
                            var pathHalfLat = Math.abs(lateral.x) * pathS.x / 2 + Math.abs(lateral.z) * pathS.z / 2
                            var pathLen = Math.abs(axA.x) * pathS.x + Math.abs(axA.z) * pathS.z
                            // the edge line: lateral offset of the pathway side nearest the bin, plus a small gap
                            var edgeLat = new THREE.Vector3(pathC.x - dc2.x, 0, pathC.z - dc2.z).dot(lateral) + pathHalfLat + 14
                            var sBin = Math.max(50, Math.min(pathLen - 10, new THREE.Vector3(battGround.x - dc2.x, 0, battGround.z - dc2.z).dot(axA)))
                            var edgeNear = dc2.clone().addScaledVector(lateral, edgeLat).addScaledVector(axA, sBin).setY(groundH)
                            var edgeWall = dc2.clone().addScaledVector(lateral, edgeLat).addScaledVector(axA, -4).setY(groundH)
                            var binExitPath = new THREE.Vector3(
                                Math.max(binBox2.min.x, Math.min(binBox2.max.x, edgeNear.x)),
                                groundH,
                                Math.max(binBox2.min.z, Math.min(binBox2.max.z, edgeNear.z))
                            )
                            housePts = [battTop, battGround, binExitPath, edgeNear, edgeWall]
                            houseEnd = edgeWall
                        } else {
                            var houseEndOut = houseEnd.clone().addScaledVector(axA, 44)
                            housePts = [battTop].concat(planGround(battGround, houseEndOut, true), [houseEnd])
                        }
                        var houseCurve = makeCurve(rounded(housePts, 10))
                        // grid: from the arm straight down to the ground, over the ground
                        // (around whatever is in the way) to the charge pole, past it into the
                        // bin at that corner, then down onto the inverter
                        var invRef2 = modelRoot!.getObjectByName("Inverter_01")
                        var invBox2 = invRef2 ? new THREE.Box3().setFromObject(invRef2) : battBox.clone()
                        var invC = invBox2.getCenter(new THREE.Vector3())
                        var invTop = new THREE.Vector3(invC.x, invBox2.max.y + 8, invC.z)
                        var invGround = new THREE.Vector3(invC.x, groundH, invC.z)
                        var wireFrom = armTip || apex
                        var towerFoot = new THREE.Vector3(wireFrom.x, groundH, wireFrom.z)
                        var towardTower = new THREE.Vector3(towerPos.x - poleC.x, 0, towerPos.z - poleC.z).normalize()
                        var poleSide = poleC.clone().addScaledVector(towardTower, halfAlong(towardTower) + 26).setY(groundH)
                        var binCornerPole = new THREE.Vector3(
                            Math.max(binBox2.min.x, Math.min(binBox2.max.x, poleSide.x)),
                            groundH,
                            Math.max(binBox2.min.z, Math.min(binBox2.max.z, poleSide.z))
                        )
                        // a few clean bends on the way rather than one straight run: side-step
                        // along the house's axes, twice, then finish. Falls back to the planner
                        // if any leg would hit something.
                        var gd = poleSide.clone().sub(towerFoot)
                        var gA = gd.dot(axA),
                            gB = gd.dot(axB)
                        var sgn = gB >= 0 ? 1 : -1
                        var lat = Math.max(Math.abs(gB) * 0.6, 0.28 * Math.abs(gA))
                        // five corners: side-step, run, step back, run, step to the final lane, run
                        var b1 = sgn * lat,
                            b2 = -sgn * lat * 0.8,
                            b3 = gB - b1 - b2
                        var m1 = towerFoot.clone().addScaledVector(axB, b1)
                        var m2 = m1.clone().addScaledVector(axA, gA * 0.25)
                        var m3 = m2.clone().addScaledVector(axB, b2)
                        var m4 = m3.clone().addScaledVector(axA, gA * 0.3)
                        var m5 = m4.clone().addScaledVector(axB, b3)
                        var meander = [towerFoot, m1, m2, m3, m4, m5, poleSide]
                        var meanderOk = true
                        for (var mi = 0; mi < meander.length - 1; mi++) if (blocked(meander[mi], meander[mi + 1])) meanderOk = false
                        if (!meanderOk) {
                            // simpler three-corner version before giving up to the planner
                            var o1 = Math.abs(gB) > 0.25 * Math.abs(gA) ? gB * 0.55 : sgn * 0.3 * Math.abs(gA)
                            var n1 = towerFoot.clone().addScaledVector(axB, o1)
                            var n2 = n1.clone().addScaledVector(axA, gA * 0.5)
                            var n3 = n2.clone().addScaledVector(axB, gB - o1)
                            meander = [towerFoot, n1, n2, n3, poleSide]
                            meanderOk = true
                            for (var mj = 0; mj < meander.length - 1; mj++) if (blocked(meander[mj], meander[mj + 1])) meanderOk = false
                        }
                        var gridGround = meanderOk ? meander : planGround(towerFoot, poleSide, false)
                        var gridCurve = makeCurve(rounded([wireFrom].concat(gridGround, [binCornerPole, invGround, invTop]), 10))

                        // ---- popups
                        badges = []
                        // off-grid sits on the powerline's ground run, a few bends in from the tower
                        var gridFar = gridGround.length >= 6 ? gridGround[3].clone() : gridGround.length >= 4 ? gridGround[2].clone() : gridGround[0].clone().lerp(gridGround[gridGround.length - 1], 0.5)
                        if (offgridRef.current) badges.push({ el: offgridRef.current, anchor: gridFar.add(new THREE.Vector3(0, 70, 0)), show: function () { return smoothstep(Math.max(0, Math.min(1, (dayProgress - 2.15) / 0.55))) } })
                        if (houseBadgeRef.current) badges.push({ el: houseBadgeRef.current, anchor: houseEnd.clone().add(new THREE.Vector3(0, 150, 0)).addScaledVector(axA, 20), show: function () { return houseLit } })
                        if (carBadgeRef.current) badges.push({ el: carBadgeRef.current, anchor: carAnchor, show: function () { return lastCarReveal >= 0.999 ? 1 : 0 } })
                        // the Sett shows its charge while it's filling by day, and "Stroom
                        // leveren" once the house actually starts drawing from it
                        var settAnchor = binCenter.clone().setY(gradeY + 95)
                        // the charge readout shows while charging by day (it stops as soon as the
                        // solar line starts draining) and again, discharging, once the house draws power
                        if (settChargeRef.current) badges.push({ el: settChargeRef.current, anchor: settAnchor, show: function () { return houseLit > 0.05 || (batteryFill && batteryFill.charge > 0.01 && lastDayStart < 0.01) ? 1 : 0 } })
                        if (settBadgeRef.current) badges.push({ el: settBadgeRef.current, anchor: settAnchor.clone().add(new THREE.Vector3(0, 58, 0)), show: function () { return houseLit } })
                        var carCurve = makeCurve(rounded([battTop, battAbove, binExit, sideBase, poleIn, poleUp, cableStart], 8).concat(cablePts.slice(1)))

                        // arc-length fraction of the roof edge on the day line — that's
                        // how far the Zon chapter lets it flow. getSpacedPoints is uniform
                        // in arc length, so the nearest sample index IS the fraction
                        var spaced = dayCurve.getSpacedPoints(400)
                        var best = 0,
                            bd = Infinity
                        for (var si = 0; si < spaced.length; si++) {
                            var dd = spaced[si].distanceToSquared(roofEdge)
                            if (dd < bd) {
                                bd = dd
                                best = si
                            }
                        }
                        var eaveFrac = best / (spaced.length - 1)
                        STORY = STORY_DEFS.map(function (s) {
                            return {
                                key: s.key,
                                label: s.label,
                                view: s.view,
                                day: s.day,
                                dayReveal: s.dayReveal === "eave" ? eaveFrac : (s.dayReveal as number),
                                dayStart: s.dayStart,
                                houseReveal: s.houseReveal,
                                carReveal: s.carReveal,
                                gridStart: s.gridStart,
                                charge: s.charge,
                            }
                        })

                        // one thin tube per line; the shader's travelling modulation is
                        // the whole effect — no halo pass
                        function makeEnergyLine(curve: THREE.Curve<THREE.Vector3>, color: THREE.Color, tubeRadius?: number, dotted?: boolean): EnergyLine {
                            var r = tubeRadius || radius * 0.0032
                            var len = curve.getLength()
                            var uniforms = {
                                uColor: { value: color },
                                uReveal: { value: 0 },
                                uStart: { value: 0 },
                                uFade: { value: 1 },
                                uTime: { value: 0 },
                                uAlpha: { value: 0.9 },
                                uPulses: { value: Math.max(6, Math.round(len / 55)) }, // one wave every ~55 units, so the pace matches on short and long lines
                                uDots: { value: dotted ? 1 : 0 },
                                uDashes: { value: Math.max(8, Math.round(len / 16)) },
                                uShrink: { value: r * 0.55 }, // dotted part renders at ~45% of the tube radius
                            }
                            var core = new THREE.Mesh(
                                new THREE.TubeGeometry(curve, 240, r, 6, false),
                                new THREE.ShaderMaterial({
                                    uniforms: uniforms,
                                    vertexShader: ENERGY_VERT,
                                    fragmentShader: ENERGY_FRAG,
                                    transparent: true,
                                    depthWrite: false,
                                    side: THREE.DoubleSide,
                                    toneMapped: false,
                                } as any)
                            )
                            core.renderOrder = 3
                            if (storyMode) scene.add(core)
                            return { uniforms: uniforms, core: core }
                        }
                        energyLines.day = makeEnergyLine(dayCurve, energyDayColor, undefined, solarLineAlways) // dotted when idle if "always show" is on
                        energyLines.house = makeEnergyLine(houseCurve, energyColor, undefined, true) // dotted by day
                        energyLines.grid = makeEnergyLine(gridCurve, energyGridColor, undefined, true) // dotted at night
                        // the car line wraps the cable, so it needs to be a little wider than it
                        energyLines.car = makeEnergyLine(carCurve, energyColor, Math.max(radius * 0.0032, cableRadius * 1.3))

                        // origin markers: a small bead plus a "ping" ring (billboarded and
                        // animated in animate()) in the line's colour
                        function makeDot(at: THREE.Vector3, role: ColorRole) {
                            var g = new THREE.Group()
                            var beadMat = new THREE.MeshBasicMaterial({ color: roleColor(role), toneMapped: false, transparent: true, opacity: 1 })
                            var ringMat = new THREE.MeshBasicMaterial({ color: roleColor(role), toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
                            registerMat(role, beadMat)
                            registerMat(role, ringMat)
                            var bead = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.0045, 16, 12), beadMat)
                            var ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.0075, radius * 0.0095, 40), ringMat)
                            bead.renderOrder = 4
                            ring.renderOrder = 4
                            g.add(bead)
                            g.add(ring)
                            g.position.copy(at)
                            g.visible = false
                            if (storyMode) scene.add(g)
                            return g
                        }
                        energyDots.day = makeDot(panelStart, "energyDay")
                        energyDots.night = makeDot(battTop, "energyLine")

                        if (storyMode) {
                            syncTrackPinning()
                            // park on chapter 0 behind the preloader, so the scene simply
                            // cross-fades in on Start — no opening camera move
                            var openPose = viewPose(STORY[0].view)
                            camera.position.copy(openPose.pos)
                            controls.target.copy(openPose.target)
                            setTimeOfDay(STORY[0].day)
                            requestRender()
                        }
                        controls.update()

                        // everything is staged behind the (opaque) preloader; the ticker
                        // calls this once the fill tops out
                        revealScene = function () {
                            window.clearTimeout(scrollLockTimeout)
                            unlockPageScroll()
                            try {
                                window.sessionStorage.setItem(LOADER_SEEN_KEY, "1")
                            } catch (e) {}
                            loadingEl.style.opacity = "0"
                            setTimeout(function () {
                                loadingEl.style.display = "none"
                            }, 950)
                            if (storyMode) {
                                startStory() // already parked on chapter 0
                            } else {
                                applyView("hero", 0)
                                viewbar.classList.add("ready")
                            }
                            if (daytoggle) daytoggle.classList.add("ready")
                            requestRender()
                        }
                        modelReady = true
                        loadTarget = 1
                    },
                    function (ev: ProgressEvent) {
                        if (ev.lengthComputable) setLoadProgress((ev.loaded / ev.total) * 0.96)
                    },
                    function (err: any) {
                        if (cancelled) return
                        window.clearInterval(loadTimer)
                        unlockPageScroll() // never leave the page stuck on a failed load
                        loadingTextRef.current!.textContent = "Kon model niet laden"
                        console.error(err)
                    }
                )
            },
            undefined,
            function (err: any) {
                if (cancelled) return
                window.clearInterval(loadTimer)
                unlockPageScroll()
                loadingTextRef.current!.textContent = "Kon materialen niet laden"
                console.error(err)
            }
        )

        // hooks for the live-update effect below
        sceneApiRef.current = {
            setColors: function (colors: Colors) {
                colorsRef.current = colors
                Object.keys(roleMaterials).forEach(function (role) {
                    roleMaterials[role].forEach(function (entry) {
                        var c = cssToColor(colors[role as ColorRole], COLOR_DEFAULTS[role as ColorRole])
                        if (entry.varL) c.offsetHSL(0, 0, entry.varL)
                        ;(entry.mat as any).color.copy(c)
                    })
                })
                // shared by the lines' uColor uniforms; the dots go through roleMaterials
                energyColor.copy(cssToColor(colors.energyLine, COLOR_DEFAULTS.energyLine))
                energyDayColor.copy(cssToColor(colors.energyDay, COLOR_DEFAULTS.energyDay))
                energyGridColor.copy(cssToColor(colors.energyGrid, COLOR_DEFAULTS.energyGrid))
                if (batteryFill) {
                    batteryFill.green.copy(cssToColor(colors.battery, COLOR_DEFAULTS.battery))
                    applyBatteryCharge() // roleMaterials just set the plain colour; re-apply the grey→green tint
                }
                requestRender()
            },
            setGrain: function (g: number) {
                ;(filmPass.uniforms as any).intensity.value = Math.max(0, Math.min(1, g))
                requestRender()
            },
            fitHeadings: fitStoryHeadings,
        }

        return function cleanup() {
            cancelled = true
            sceneApiRef.current = null
            cancelAnimationFrame(rafId)
            window.clearInterval(loadTimer)
            window.clearTimeout(scrollLockTimeout)
            unlockPageScroll()
            window.clearTimeout(resizeTimer)
            resizeObserver.disconnect()
            if (ctaSizeObserver) ctaSizeObserver.disconnect()
            visObserver.disconnect()
            try {
                document.documentElement.removeAttribute("data-sett-theme")
            } catch (e) {}
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onWindowResize)
            viewbar.removeEventListener("click", onViewbarClick)
            if (daytoggle) daytoggle.removeEventListener("click", onDaytoggleClick)
            controls.removeEventListener("start", onControlsStart)
            controls.dispose()
            scene.traverse(function (obj: any) {
                if (obj.geometry) obj.geometry.dispose()
                if (obj.material) {
                    var mats = Array.isArray(obj.material) ? obj.material : [obj.material]
                    mats.forEach(function (m: THREE.Material) {
                        for (var key in m) {
                            var v = (m as any)[key]
                            if (v && v.isTexture) v.dispose()
                        }
                        m.dispose()
                    })
                }
            })
            composer.dispose?.()
            renderer.dispose()
            if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objUrl, mtlUrl, carUrl, wireframeMode, wireframeDetail, storyMode, quality, mobileLite, solarLineAlways])

    // colors and grain re-apply onto the already-built scene without a rebuild
    useEffect(() => {
        sceneApiRef.current?.setColors(colorsRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, COLOR_ROLE_LIST.map(function (k) { return (props as any)[k] }))
    useEffect(() => {
        sceneApiRef.current?.setGrain(grainAmount ?? 0.22)
    }, [grainAmount])
    // a title edited in the property panel is new text to measure
    useEffect(() => {
        sceneApiRef.current?.fitHeadings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, STORY_DEFS.map(function (_s, i) { return props["storyTitle" + (i + 1)] }))

    var missingAssets = !objUrl || !mtlUrl || !carUrl

    // a cart, not a bag: the bag's lid-and-handle silhouette reads as a bin at
    // this size, wheels never do
    var preOrderIcon = (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.9 3h2.3a1.1 1.1 0 0 1 1.07.86l2.5 10.9a1.1 1.1 0 0 0 1.07.85h9.9" />
            <path d="M6.35 6.2h14.6a1 1 0 0 1 .97 1.26l-1.42 5.3a1.1 1.1 0 0 1-1.06.82H8.5" />
            <circle cx="9.9" cy="19.9" r="1.75" />
            <circle cx="18" cy="19.9" r="1.75" />
        </svg>
    )
    var moreInfoIcon = (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h14M12.5 6.5 19 12l-6.5 5.5" />
        </svg>
    )

    // scripting off: the canvas never arrives, so the whole story is written out
    var noscriptHtml =
        '<div class="s3d-noscript"><div class="s3d-noscript-doc"><h1>' +
        escHtml(seoHeading) +
        "</h1><p>" +
        escHtml(seoIntro) +
        "</p><ol>" +
        STORY_DEFS.map(function (s, i) {
            return (
                "<li><h2>" +
                escHtml(props["storyTitle" + (i + 1)] || STORY_TEXT_DEFAULTS[i].title) +
                "</h2><p>" +
                escHtml(props["storyBody" + (i + 1)] || STORY_TEXT_DEFAULTS[i].body) +
                "</p></li>"
            )
        }).join("") +
        "</ol></div></div>"

    return (
        <div
            ref={rootRef}
            className={"s3d-hero" + (storyMode ? " story" : "")}
            style={{
                position: "relative",
                // in story mode the stage may need to stick inside a tall root,
                // and sticky can't work under an overflow:hidden ancestor
                overflow: storyMode ? "visible" : "hidden",
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .s3d-hero{
          --sky-0:#ffffff; --sky-1:#f6f5f2; --sky-2:#eae6de; --sky-3:#dcd4c4;
          --glow-inner:rgba(255,248,222,0.98); --glow-mid:rgba(255,238,190,0.75);
          --glow-outer:rgba(255,238,190,0); --glow-shadow:rgba(255,230,160,0.45);
          --scrim-rgb:24,20,16; --ink:#f4f5f9; --ink-dim:#97a0c2; --green:#7de35b;
          --s3d-mobile-radius:18px; /* shared by the mobile nav and the copy panel */
          /* the line the copy panel and the button stack both sit on; the mobile
             block at the end of this sheet moves it up above the icon nav */
          --story-base:max(96px, 11%);
          /* Outfit, matching the rest of the site (the import is a no-op if the site already loads it) */
          font-family: "Outfit", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
        }
        /* the sky/moon lives on the stage (not the root) so it stays in the
           pinned viewport when the root is a tall scroll track */
        .s3d-stage{
          position:absolute; inset:0; z-index:5; pointer-events:none; overflow:hidden;
          background:
            radial-gradient(950px 950px at 88% -6%, var(--glow-inner) 0%, var(--glow-mid) 18%, var(--glow-outer) 50%),
            var(--sky-0);
        }
        /* inset:auto first — it would otherwise reset the top:0 the sticky needs */
        /* dvh follows mobile browsers' collapsing toolbars; vh is the fallback */
        .s3d-stage.pinned{ position:sticky; inset:auto; top:0; height:100vh; height:100dvh; }
        /* per-chapter copy; opacity/offset are driven from setStoryProgress.
           Lower-left corner, sitting above the chapter bar; held back until the
           preloader has cleared so no copy shows over it */
        .s3d-story-text{
          position:absolute; bottom:var(--story-base); left:5%; width:min(460px, 46%); height:0;
          z-index:16; pointer-events:none; opacity:0;
          transition:opacity 0.7s ease, bottom 0.55s cubic-bezier(0.2, 0.8, 0.25, 1);
        }
        .s3d-hero.story-ready .s3d-story-text{ opacity:1; }
        /* the last chapter: the copy makes room for the buttons underneath it */
        .s3d-hero.cta-on .s3d-story-text{ bottom:calc(var(--story-base) + var(--cta-h, 120px) + 14px); }
        .s3d-story-text.right{ left:auto; right:5%; text-align:right; }
        /* frosted panel so the copy reads on any part of the scene */
        .s3d-story-block{
          position:absolute; left:0; right:0; bottom:0; box-sizing:border-box;
          padding:22px 26px 24px; border-radius:16px;
          background:var(--story-panel, rgba(32,42,78,0.52));
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          opacity:0; will-change:opacity, transform; transition:background 0.4s ease;
        }
        /* the chapter title stays on one line: fitStoryHeadings() below measures it
           and scales the type down until it fits the panel (and only lets it wrap
           again if even the smallest size wouldn't) */
        .s3d-story-block h2{
          margin:0 0 12px; font-size:clamp(24px, 3vw, 40px); line-height:1.08; font-weight:800;
          letter-spacing:-0.015em; white-space:nowrap;
          color:var(--story-ink, #f4f5f9); transition:color 0.4s ease;
        }
        .s3d-story-block p{
          margin:0; font-size:clamp(14px, 1.15vw, 17px); line-height:1.6;
          color:var(--story-ink-dim, #c3c9dc); transition:color 0.4s ease;
        }
        /* "Now off-grid" badge — positioned from JS (projected above the Sett) */
        /* 3D-anchored popups — positioned from JS every frame */
        .s3d-badge{
          position:absolute; left:0; top:0; z-index:14; pointer-events:none; opacity:0;
          display:flex; align-items:center; gap:8px; white-space:nowrap;
          padding:9px 15px 9px 11px; border-radius:999px;
          color:#ffffff; font-size:13px; font-weight:700; letter-spacing:0.01em;
          border:1px solid rgba(255,255,255,0.28);
          -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
          box-shadow:0 8px 28px rgba(0,0,0,0.3); will-change:transform, opacity;
          transition:opacity 0.35s ease;
        }
        .s3d-badge svg{ width:15px; height:15px; display:block; flex:none; }
        .s3d-badge.red{ background:rgba(232,64,64,0.45); }
        .s3d-badge.red svg{ animation:s3d-badge-pulse 1.6s ease-in-out infinite; }
        .s3d-badge.orange{ background:rgba(245,138,36,0.58); }
        .s3d-badge.green{ background:rgba(37,207,119,0.52); }
        .s3d-badge.dark{ background:rgba(14,18,48,0.62); }
        .s3d-badge.dark svg{ color:#25CF77; }
        .s3d-badge.big{ padding:10px 18px 10px 12px; font-size:15px; gap:10px; }
        .s3d-badge.big svg{ width:40px; height:22px; }
        .s3d-badge.dark.discharging svg{ color:#F58A24; }
        /* scroll cue (touch screens only), shown once the scene is up and gone as
           soon as the visitor scrolls or taps a chapter */
        .s3d-scrollhint{
          position:absolute; left:50%; bottom:64px; transform:translateX(-50%); z-index:16; pointer-events:none;
          display:none; align-items:center; gap:8px;
          padding:7px 15px 7px 11px; border-radius:999px;
          background:rgba(8,11,28,0.55); border:1px solid rgba(255,255,255,0.14);
          -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
          box-shadow:0 8px 24px rgba(6,10,30,0.22);
          font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
          color:#f4f5f9; opacity:0; transition:opacity 0.5s ease 0.6s;
        }
        .s3d-scrollhint span{ display:block; animation:s3d-nudge 1.5s ease-in-out infinite; }
        .s3d-scrollhint svg{ width:18px; height:18px; display:block; }
        @keyframes s3d-nudge{ 0%,100%{ transform:translateY(-2px); } 50%{ transform:translateY(3px); } }
        .s3d-hero.story-ready .s3d-scrollhint{ opacity:0.9; }
        .s3d-hero.story-ready .s3d-scrollhint.used{ opacity:0; transition-delay:0s; }
        @media (max-width: 760px) and (pointer: coarse){ .s3d-scrollhint{ display:flex; } }
        @keyframes s3d-badge-pulse{ 0%,100%{ opacity:1; } 50%{ opacity:0.55; } }
        /* story mode: the scene never takes pointer input, so touch scrolling passes straight through */
        .s3d-hero.story .s3d-stage canvas{ pointer-events:none; touch-action:auto; }

        .s3d-stage canvas{ pointer-events:auto; touch-action:none; display:block; width:100% !important; height:100% !important; outline:none; }
        .s3d-stage .s3d-viewbar{ pointer-events:auto; }
        .s3d-stage .s3d-daytoggle{ pointer-events:auto; }
        .s3d-canvashost{ position:absolute; inset:0; }
        /* preloader: covers the stage on the morning sky, battery + bar follow the download,
           then fades out over the opening view */
        /* preloader: the sett mark over the morning sky — its outline traces itself
           while the fill rises with the download, then the whole thing cross-fades
           into the opening shot */
        .s3d-loading{
          position:absolute; inset:0; z-index:20; display:flex; align-items:center; justify-content:center;
          background:radial-gradient(900px 900px at 88% -6%, var(--glow-inner) 0%, var(--glow-mid) 18%, var(--glow-outer) 50%), var(--sky-0);
          color:#6b7280; font-size:11px; font-weight:600; letter-spacing:0.08em;
          opacity:1; transition:opacity 0.9s ease;
        }
        .s3d-loader{ display:flex; flex-direction:column; align-items:center; gap:20px; }
        .s3d-mark{ width:clamp(62px, 8vw, 96px); height:auto; display:block; overflow:visible; }
        /* the outline is the whole mark — no fill. Its ink is set from JS as the
           download lands, going grey → black; the transition keeps it smooth when a
           throttled tab delivers the progress in coarse jumps */
        /* the mark reads as a faint 10% black silhouette that fills solid black
           from the bottom up as the model arrives, with the outline inking in on
           top of it */
        .s3d-mark-base{ fill:rgba(0,0,0,0.1); }
        .s3d-mark-fill{ fill:#000000; }
        .s3d-mark-line{
          fill:none; stroke:var(--mark-ink, #c9ccd3); stroke-width:12; stroke-linejoin:round;
          transition:stroke 0.3s linear;
        }
        /* a soft gleam that travels the outline and fades out at each end of its run.
           The dash pattern restarts per subpath and the mark's two glyphs are ~1780
           user units each, so one short dash + a long gap puts a single gleam on each
           glyph and the loop closes cleanly after one subpath length. (Real user
           units, not fractions: Chrome does not apply a path's pathLength
           normalisation to a CSS stroke-dasharray.) */
        .s3d-mark-shine{
          fill:none; stroke:#ffffff; stroke-width:16; stroke-linejoin:round; stroke-linecap:round;
          stroke-dasharray:150 1630; filter:blur(2px);
          animation:s3d-shine 2.8s linear infinite;
        }
        @keyframes s3d-shine{
          0%{ stroke-dashoffset:0; opacity:0; }
          18%{ opacity:0.9; }
          82%{ opacity:0.9; }
          100%{ stroke-dashoffset:-1780; opacity:0; }
        }
        /* the call-to-action stack: pre-order on top, more-info below. It sits on
           the copy's own baseline, directly under the panel (which lifts by
           --cta-h to make room), and pops up on the last chapter — right where
           the reader is already looking. pointer-events is inherited, so
           pointer-events:none on the wrapper disarms the buttons while they are
           still faded out. */
        .s3d-ctas{
          position:absolute; bottom:var(--story-base); left:5%; z-index:16;
          display:flex; flex-direction:column; align-items:flex-start; gap:10px;
          pointer-events:none;
        }
        .s3d-ctas.right{ left:auto; right:5%; align-items:flex-end; }
        .s3d-hero.cta-on .s3d-ctas{ pointer-events:auto; }
        .s3d-cta{
          position:relative; overflow:hidden; /* keeps the hover sheen inside the pill */
          box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; gap:9px;
          padding:0.95rem 1.5rem; border:none; border-radius:999px;
          font-family:inherit; font-size:15px; font-weight:700; letter-spacing:0.01em;
          white-space:nowrap; cursor:pointer; text-decoration:none;
          box-shadow:0 10px 30px rgba(6,10,30,0.28);
          opacity:0; transform:translateY(14px);
          transition:opacity 0.45s ease, transform 0.5s cubic-bezier(0.2, 0.8, 0.25, 1),
                     box-shadow 0.45s ease, filter 0.2s ease;
        }
        .s3d-hero.cta-on .s3d-cta{ opacity:1; transform:none; }
        .s3d-hero.cta-on .s3d-cta.info{ transition-delay:0.07s; } /* the two pop in one after the other */
        .s3d-cta svg{ width:17px; height:17px; display:block; flex:none; }
        /* the light that sweeps across on hover; parked off the left edge */
        .s3d-cta::after{
          content:""; position:absolute; top:0; bottom:0; left:0; width:40%;
          background:linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform:translateX(-150%); pointer-events:none;
        }
        /* hover only where there is a real pointer — on a touch screen :hover
           sticks after a tap, and the press state below is the right feedback */
        @media (hover: hover){
          .s3d-cta svg{ transition:transform 0.35s cubic-bezier(0.2, 0.8, 0.25, 1); }
          .s3d-cta::after{ transition:transform 0.75s cubic-bezier(0.3, 0.7, 0.3, 1); }
          .s3d-cta:hover::after{ transform:translateX(350%); }
          /* the lift is quick going in (this rule's own timing) and settles back
             slowly on the way out (the base transition above) */
          .s3d-hero.cta-on .s3d-cta:hover{
            transform:translateY(-2px);
            box-shadow:0 18px 38px rgba(6,10,30,0.4);
            filter:brightness(1.07);
            transition:transform 0.22s cubic-bezier(0.2, 0.8, 0.25, 1), box-shadow 0.22s ease, filter 0.2s ease;
          }
          .s3d-cta.info:hover svg{ transform:translateX(4px); } /* the arrow leads the way */
          .s3d-cta.preorder:hover svg{ animation:s3d-cta-cart 0.6s cubic-bezier(0.3, 0.7, 0.3, 1); } /* the cart rolls forward */
        }
        @keyframes s3d-cta-cart{
          0%{ transform:translateX(0); }
          22%{ transform:translateX(-2px); }
          62%{ transform:translateX(3px); }
          100%{ transform:translateX(0); }
        }
        /* pressed: overrides the hover lift (same specificity, declared later) */
        .s3d-hero.cta-on .s3d-cta:active{ transform:translateY(1px); transition:transform 0.08s ease; }
        .s3d-viewbar{
          position:absolute; left:50%; bottom:34px; transform:translateX(-50%);
          z-index:15; display:flex; gap:6px; padding:6px;
          background:rgba(8,11,28,0.55); backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,0.08); border-radius:999px;
          opacity:0; transition:opacity 0.5s ease 0.3s;
        }
        .s3d-viewbar.ready{ opacity:1; }
        /* the active marker: one pill that slides between the buttons */
        .s3d-viewbar-pill{
          position:absolute; left:0; top:0; width:0; height:0; border-radius:999px;
          background:#ffffff; opacity:0; pointer-events:none;
          transition:transform 0.42s cubic-bezier(0.2, 0.8, 0.25, 1),
                     width 0.42s cubic-bezier(0.2, 0.8, 0.25, 1),
                     height 0.2s ease, opacity 0.2s ease;
        }
        .s3d-viewbar button{
          position:relative; z-index:1; /* above the sliding pill */
          font-family:inherit; font-size:12px; font-weight:600; color:var(--ink-dim);
          background:none; border:none; border-radius:999px; padding:8px 14px; cursor:pointer;
          transition:background 0.15s ease, color 0.25s ease;
        }
        .s3d-viewbar button:hover{ color:var(--ink); background:rgba(255,255,255,0.06); }
        .s3d-chip-icon{ display:none; }
        .s3d-chip-icon svg{ width:22px; height:22px; display:block; }
        .s3d-viewbar button.active{ color:#101632; }
        .s3d-viewbar button.active:hover{ background:none; }
        .s3d-daytoggle{
          position:absolute; left:50%; bottom:78px; transform:translateX(-50%);
          z-index:15; display:flex; align-items:center; gap:10px;
          padding:5px 16px 5px 5px;
          background:rgba(8,11,28,0.45); backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,0.08); border-radius:999px;
          font-family:inherit; cursor:pointer;
          opacity:0; transition:opacity 0.5s ease 0.3s;
        }
        .s3d-daytoggle.ready{ opacity:1; }
        .s3d-daytoggle-track{
          position:relative; width:72px; height:28px; border-radius:999px; flex-shrink:0;
          background:linear-gradient(90deg, #fdf6e3 0%, #ffcf7a 32%, #ff9d5c 54%, #2a2f55 76%, #0a0c1c 100%);
          box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18);
        }
        .s3d-daytoggle-knob{
          position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%;
          background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.45);
          transition:left 0.3s ease;
        }
        .s3d-daytoggle-label{ font-size:12px; font-weight:600; color:var(--ink); min-width:66px; text-align:left; }
        /* the page's heading and summary in plain markup. The scene says the same
           thing visually, so this is exposed to crawlers, screen readers and
           text-only agents instead of being painted a second time. */
        .s3d-seo{
          position:absolute; width:1px; height:1px; margin:-1px; padding:0;
          overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); border:0; white-space:nowrap;
        }
        /* scripting off: the canvas never arrives, so the story is written out.
           It covers the stage (and the preloader, which JS would have cleared)
           and scrolls on its own — nothing else on the page is alive */
        .s3d-noscript{
          position:fixed; inset:0; z-index:40; overflow:auto;
          background:var(--sky-0, #ffffff);
        }
        .s3d-noscript-doc{
          box-sizing:border-box; max-width:760px; margin:0 auto; padding:10vh 24px 72px;
          color:#2b2f3a; font-size:15px; line-height:1.6;
        }
        .s3d-noscript h1, .s3d-noscript .s3d-ns-title{ font-weight:700; font-size:clamp(26px, 4vw, 42px); line-height:1.1; margin:0 0 14px; letter-spacing:-0.015em; }
        .s3d-noscript-doc > p{ margin:0 0 28px; font-size:17px; }
        .s3d-noscript ol{ margin:0; padding:0 0 0 20px; }
        .s3d-noscript li{ margin:0 0 18px; }
        .s3d-noscript h2{ font-size:19px; margin:0 0 4px; line-height:1.25; }
        .s3d-noscript li p{ margin:0; }
        .s3d-missing{
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          text-align:center; padding:24px; color:#5b5142; font-size:13px; line-height:1.5;
          background:#f2ede0;
        }
        /* mobile: the nav becomes icons, and the copy sits right above it sharing its
           width and corner radius; badges shrink and pull toward the middle (in JS) */
        @media (max-width: 760px){
          .s3d-viewbar{
            bottom:16px; gap:0; padding:5px; width:min(92vw, 460px); max-width:none; box-sizing:border-box;
            border-radius:var(--s3d-mobile-radius); justify-content:space-between;
          }
          .s3d-viewbar button{ flex:1; padding:10px 0; border-radius:calc(var(--s3d-mobile-radius) - 5px); display:flex; justify-content:center; }
          .s3d-viewbar-pill{ border-radius:calc(var(--s3d-mobile-radius) - 5px); }
          .s3d-chip-label{ display:none; }
          .s3d-chip-icon{ display:block; }
          .s3d-story-text, .s3d-story-text.right{
            left:50%; right:auto; transform:translateX(-50%); width:min(92vw, 460px); text-align:center;
          }
          .s3d-story-block{ padding:16px 18px 18px; border-radius:var(--s3d-mobile-radius); }
          .s3d-story-block h2{ font-size:20px; margin-bottom:8px; }
          .s3d-story-block p{ font-size:13px; line-height:1.5; }
          .s3d-badge{ font-size:11px; padding:6px 11px 6px 9px; gap:6px; }
          .s3d-badge svg{ width:12px; height:12px; }
          .s3d-badge.big{ font-size:12px; padding:7px 12px 7px 9px; }
          .s3d-badge.big svg{ width:28px; height:16px; }
          .s3d-scrollhint{ top:14px; bottom:auto; }
          /* the copy and the buttons share the slot right above the icon nav,
             stacked: buttons on that line, copy lifted above them */
          .s3d-hero{ --story-base:calc(16px + var(--viewbar-h, 52px) + 12px); }
          .s3d-ctas, .s3d-ctas.right{
            left:50%; right:auto; transform:translateX(-50%); align-items:center;
          }
        }
      `}</style>

            {props.seoBlock === false ? null : (
                <div className="s3d-seo">
                    <h1>{seoHeading}</h1>
                    <p>{seoIntro}</p>
                </div>
            )}
            <noscript dangerouslySetInnerHTML={{ __html: noscriptHtml.replace(/<h1>/g, '<p class="s3d-ns-title">').replace(/<\/h1>/g, "</p>") }} />
            {missingAssets ? (
                <div className="s3d-missing">
                    Set the House OBJ, House MTL, and Car STL properties (upload the
                    files via Framer's Assets panel) to load the scene.
                </div>
            ) : (
                <div className="s3d-stage" ref={stageRef}>
                    <div className="s3d-canvashost" ref={canvasHostRef} role="img" aria-label={sceneAlt} />
                    <div className="s3d-loading" ref={loadingRef}>
                        <div className="s3d-loader">
                            <svg className="s3d-mark" viewBox="0 0 615 564" aria-hidden="true">
                                <defs>
                                    {/* the fill window: grows up from the baseline as the model arrives */}
                                    <clipPath id={markClipId}>
                                        <rect ref={markFillRef} x="0" y="564" width="615" height="0" />
                                    </clipPath>
                                </defs>
                                <path className="s3d-mark-base" d={SETT_MARK} />
                                <path className="s3d-mark-fill" d={SETT_MARK} clipPath={"url(#" + markClipId + ")"} />
                                <path className="s3d-mark-line" d={SETT_MARK} />
                                <path className="s3d-mark-shine" d={SETT_MARK} />
                            </svg>
                            <span ref={loadingTextRef}>Sett laden…</span>
                        </div>
                    </div>
                    {storyMode && (
                        <>
                            <div className="s3d-badge red" ref={offgridRef}>
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
                                </svg>
                                Off-grid
                            </div>
                            <div className="s3d-badge dark big" ref={settChargeRef}>
                                <svg viewBox="0 0 40 22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <rect x="1" y="1" width="34" height="20" rx="4" />
                                    <path d="M37.5 7.5v7" strokeLinecap="round" />
                                    <rect ref={settSocFillRef} x="4" y="4" width="0" height="14" rx="1.5" fill="currentColor" stroke="none" />
                                </svg>
                                <span ref={settSocRef}>0%</span>
                            </div>
                            <div className="s3d-badge orange" ref={houseBadgeRef}>
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 3 2.5 11.5h2.8V21h5.2v-6h3v6h5.2v-9.5h2.8L12 3z" />
                                </svg>
                                Koken, Wassen &amp; Tv Kijken
                            </div>
                            <div className="s3d-badge dark" ref={carBadgeRef}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <rect x="2" y="7" width="18" height="10" rx="2" />
                                    <path d="M21 10.5v3" strokeLinecap="round" />
                                    <rect ref={carSocFillRef} x="4" y="9" width="2.5" height="6" rx="0.6" fill="currentColor" stroke="none" />
                                </svg>
                                Laden · <span ref={carSocRef}>18%</span>
                            </div>
                            <div className="s3d-scrollhint" ref={scrollHintRef} aria-hidden="true">
                                <span>
                                    {/* a hand with a scroll arrow beside it, nudging up and down */}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11.6 11.2V5.5a1.75 1.75 0 0 1 3.5 0v5.2" />
                                        <path d="M15.1 11.4a1.65 1.65 0 0 1 3.3 0v1.1" />
                                        <path d="M18.4 12.8a1.65 1.65 0 0 1 3.3 0v2.9c0 3.2-2.3 5.4-5.5 5.4h-1.1c-2 0-3.3-.8-4.2-2.3l-3-4.8a1.75 1.75 0 0 1 2.9-1.9l1.2 1.8" />
                                        <path d="M3.6 6.8v9.4" />
                                        <path d="M1.7 14.3 3.6 16.4l1.9-2.1" />
                                    </svg>
                                </span>
                                scroll
                            </div>
                            <div className="s3d-badge green" ref={settBadgeRef}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <path d="M12 3v9" />
                                    <path d="M6.6 6.6a7.6 7.6 0 1 0 10.8 0" />
                                </svg>
                                Stroom leveren
                            </div>
                        </>
                    )}
                    {storyMode && (
                        <section className={"s3d-story-text " + textSide} ref={storyTextRef} aria-label={seoHeading}>
                            {STORY_DEFS.map(function (s, i) {
                                return (
                                    <article className="s3d-story-block" key={s.key} data-chapter={i}>
                                        <h2>{props["storyTitle" + (i + 1)] || STORY_TEXT_DEFAULTS[i].title}</h2>
                                        <p>{props["storyBody" + (i + 1)] || STORY_TEXT_DEFAULTS[i].body}</p>
                                    </article>
                                )
                            })}
                        </section>
                    )}
                    {storyMode && (
                        <div className={"s3d-ctas " + textSide} ref={ctaWrapRef}>
                            {preOrder &&
                                (preOrderLink ? (
                                    <a
                                        className="s3d-cta preorder"
                                        style={preOrderStyle}
                                        onClick={firePreOrder}
                                        href={preOrderLink}
                                        target={preOrderNewTab ? "_blank" : undefined}
                                        rel={preOrderNewTab ? "noopener noreferrer" : undefined}
                                    >
                                        {preOrderIcon}
                                        {preOrderLabel}
                                    </a>
                                ) : (
                                    <button type="button" className="s3d-cta preorder" style={preOrderStyle} onClick={firePreOrder}>
                                        {preOrderIcon}
                                        {preOrderLabel}
                                    </button>
                                ))}
                            {moreInfoLink ? (
                                <a
                                    className="s3d-cta info"
                                    style={moreInfoStyle}
                                    onClick={fireMoreInfo}
                                    href={moreInfoLink}
                                    target={moreInfoNewTab ? "_blank" : undefined}
                                    rel={moreInfoNewTab ? "noopener noreferrer" : undefined}
                                >
                                    {moreInfoLabel}
                                    {moreInfoIcon}
                                </a>
                            ) : (
                                <button type="button" className="s3d-cta info" style={moreInfoStyle} onClick={fireMoreInfo}>
                                    {moreInfoLabel}
                                    {moreInfoIcon}
                                </button>
                            )}
                        </div>
                    )}
                    <div className="s3d-viewbar" ref={viewbarRef}>
                        <span className="s3d-viewbar-pill" ref={navPillRef} aria-hidden="true" />
                        {storyMode ? (
                            STORY_DEFS.map(function (s, i) {
                                var label = String(props["chapterLabel" + (i + 1)] || "").trim() || s.label
                                return (
                                    <button type="button" data-chapter={i} key={s.key} className={i === 0 ? "active" : ""} aria-label={label} title={label}>
                                        <span className="s3d-chip-icon" aria-hidden="true">
                                            {chapterIcon(s.key)}
                                        </span>
                                        <span className="s3d-chip-label">{label}</span>
                                    </button>
                                )
                            })
                        ) : (
                            <>
                                <button type="button" data-view="hero" className="active">
                                    Overzicht
                                </button>
                                <button type="button" data-view="open">
                                    Batterijen
                                </button>
                                <button type="button" data-view="charger">
                                    Laadpalen
                                </button>
                                <button type="button" data-view="top">
                                    Bovenaanzicht
                                </button>
                            </>
                        )}
                    </div>
                    {!storyMode && (
                        <button type="button" className="s3d-daytoggle" ref={daytoggleRef} aria-label="Tijdstip wisselen">
                            <span className="s3d-daytoggle-track">
                                <span className="s3d-daytoggle-knob" ref={daytoggleKnobRef} />
                            </span>
                            <span className="s3d-daytoggle-label" ref={daytoggleLabelRef}>
                                Middag
                            </span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

SettScene3D.displayName = "Sett 3D Scene"

addPropertyControls(SettScene3D, {
    objUrl: {
        type: ControlType.File,
        title: "House OBJ",
        allowedFileTypes: ["obj"],
    },
    mtlUrl: {
        type: ControlType.File,
        title: "House MTL",
        allowedFileTypes: ["mtl"],
    },
    carUrl: {
        type: ControlType.File,
        title: "Car STL",
        allowedFileTypes: ["stl"],
    },
    wireframeMode: {
        type: ControlType.Boolean,
        title: "Wireframe house",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "House shell, trees and bushes render as a blueprint-style wireframe. The Sett unit, solar panels and the car stay fully rendered.",
    },
    wireframeDetail: {
        type: ControlType.Number,
        title: "Wireframe detail",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        displayStepper: true,
        hidden: (props: Props) => !props.wireframeMode,
        description: "How many lines the wireframe shows — 0 keeps only sharp corners, 100 traces almost every edge.",
    },
    storyMode: {
        type: ControlType.Boolean,
        title: "Scroll story",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Loads straight into the Start view, then tells the energy story on scroll: Zon → Opslag → Nacht → Laden → Overzicht. Give the component a tall frame (500–600vh) or place it in a tall section set to Sticky. Off = free camera views + day/night toggle.",
    },
    mobileLite: {
        type: ControlType.Boolean,
        title: "Mobile lite",
        defaultValue: true,
        enabledTitle: "Lite",
        disabledTitle: "Full",
        description:
            "On screens narrower than 760px, render the cheap way: 1× pixel ratio, no ambient occlusion or multisampling, no grain, a small shadow map and half as many environment updates. Decided when the page loads, so it doesn't switch on rotation.",
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["high", "balanced", "low"],
        optionTitles: ["High", "Balanced", "Low"],
        defaultValue: "balanced",
        description: "How the scene renders on a desktop screen. Balanced caps the pixel ratio at 1.5× and halves the ambient-occlusion samples; Low drops ambient occlusion entirely and renders at 1×. Phones follow \"Mobile lite\" above instead.",
    },
    solarLineAlways: {
        type: ControlType.Boolean,
        title: "Solar line always",
        defaultValue: false,
        enabledTitle: "Shown",
        disabledTitle: "Hidden",
        description: "Keep the sun → battery line visible as grey dots when no solar is flowing (at Start and after dark).",
        hidden: (props: Props) => props.storyMode === false,
    },
    onDarkChange: {
        type: ControlType.EventHandler,
        title: "On dark change",
        description:
            "Fires when the scene turns dark and again when it turns light. The component also sets data-sett-theme=\"dark\" on <html> (style your nav with html[data-sett-theme=\"dark\"] .nav {…}) and dispatches a window \"sett3d:theme\" event with { dark, dayProgress }.",
    },
    onMoreInfo: {
        type: ControlType.EventHandler,
        title: "On more info",
        description:
            "Fires when the more-info button is clicked (also when it has a link, so an analytics action still runs before the page change). Both buttons pop up under the copy panel when the closing chapter arrives.",
        hidden: (props: Props) => props.storyMode === false,
    },
    moreInfoLabel: {
        type: ControlType.String,
        title: "More-info label",
        defaultValue: CTA_DEFAULTS.moreInfoLabel,
        hidden: (props: Props) => props.storyMode === false,
    },
    // if your Framer version has no Link control, switch this to ControlType.String
    // and paste the path (e.g. /over-sett) instead of picking a page
    moreInfoLink: {
        type: ControlType.Link,
        title: "More-info link",
        description: "Pick the page the more-info button opens. Leave it empty to handle the click with the On more info action instead (e.g. to open your menu overlay).",
        hidden: (props: Props) => props.storyMode === false,
    },
    moreInfoNewTab: {
        type: ControlType.Boolean,
        title: "Open in new tab",
        defaultValue: false,
        enabledTitle: "New tab",
        disabledTitle: "Same tab",
        hidden: (props: Props) => props.storyMode === false || !props.moreInfoLink,
    },
    moreInfoColor: {
        type: ControlType.Color,
        title: "More-info fill",
        defaultValue: CTA_DEFAULTS.moreInfoColor,
        hidden: (props: Props) => props.storyMode === false,
    },
    moreInfoTextColor: {
        type: ControlType.Color,
        title: "More-info text",
        defaultValue: CTA_DEFAULTS.moreInfoTextColor,
        hidden: (props: Props) => props.storyMode === false,
    },
    preOrder: {
        type: ControlType.Boolean,
        title: "Pre-order button",
        defaultValue: true,
        enabledTitle: "Shown",
        disabledTitle: "Hidden",
        description: "Sits directly above the more-info button, under the copy panel on the closing chapter.",
        hidden: (props: Props) => props.storyMode === false,
    },
    onPreOrder: {
        type: ControlType.EventHandler,
        title: "On pre-order",
        description: "Fires when the pre-order button is clicked.",
        hidden: (props: Props) => props.storyMode === false || props.preOrder === false,
    },
    preOrderLabel: {
        type: ControlType.String,
        title: "Pre-order label",
        defaultValue: CTA_DEFAULTS.preOrderLabel,
        hidden: (props: Props) => props.storyMode === false || props.preOrder === false,
    },
    // if your Framer version has no Link control, switch this to ControlType.String
    // and paste the path (e.g. /pre-order) instead of picking a page
    preOrderLink: {
        type: ControlType.Link,
        title: "Pre-order link",
        description: "Pick the page the pre-order button opens. Leave it empty to handle the click with the On pre-order action instead.",
        hidden: (props: Props) => props.storyMode === false || props.preOrder === false,
    },
    preOrderNewTab: {
        type: ControlType.Boolean,
        title: "Open in new tab",
        defaultValue: false,
        enabledTitle: "New tab",
        disabledTitle: "Same tab",
        hidden: (props: Props) => props.storyMode === false || props.preOrder === false || !props.preOrderLink,
    },
    preOrderColor: {
        type: ControlType.Color,
        title: "Pre-order fill",
        defaultValue: CTA_DEFAULTS.preOrderColor,
        hidden: (props: Props) => props.storyMode === false || props.preOrder === false,
    },
    preOrderTextColor: {
        type: ControlType.Color,
        title: "Pre-order text",
        defaultValue: CTA_DEFAULTS.preOrderTextColor,
        hidden: (props: Props) => props.storyMode === false || props.preOrder === false,
    },
    seoBlock: {
        type: ControlType.Boolean,
        title: "Hidden H1",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Puts the heading + summary below in the markup (visually hidden) so search engines and text agents can read the page. Turn off if the page already has its own H1.",
    },
    seoHeading: {
        type: ControlType.String,
        title: "Page heading",
        defaultValue: SEO_DEFAULTS.heading,
        description: "The page's H1, and the label of the story section.",
    },
    seoIntro: {
        type: ControlType.String,
        title: "Page summary",
        defaultValue: SEO_DEFAULTS.intro,
        displayTextArea: true,
    },
    sceneAlt: {
        type: ControlType.String,
        title: "Scene description",
        defaultValue: SEO_DEFAULTS.alt,
        displayTextArea: true,
        description: "Alt text for the 3D canvas — read out by screen readers.",
    },
    chapterLabel1: { type: ControlType.String, title: "Nav 1", defaultValue: STORY_DEFS[0].label, hidden: (props: Props) => props.storyMode === false },
    chapterLabel2: { type: ControlType.String, title: "Nav 2", defaultValue: STORY_DEFS[1].label, hidden: (props: Props) => props.storyMode === false },
    chapterLabel3: { type: ControlType.String, title: "Nav 3", defaultValue: STORY_DEFS[2].label, hidden: (props: Props) => props.storyMode === false },
    chapterLabel4: { type: ControlType.String, title: "Nav 4", defaultValue: STORY_DEFS[3].label, hidden: (props: Props) => props.storyMode === false },
    chapterLabel5: { type: ControlType.String, title: "Nav 5", defaultValue: STORY_DEFS[4].label, hidden: (props: Props) => props.storyMode === false },
    chapterLabel6: { type: ControlType.String, title: "Nav 6", defaultValue: STORY_DEFS[5].label, hidden: (props: Props) => props.storyMode === false },
    energyDay: { type: ControlType.Color, title: "Energy (sun → battery)", defaultValue: COLOR_DEFAULTS.energyDay, hidden: (props: Props) => props.storyMode === false },
    energyLine: { type: ControlType.Color, title: "Energy (battery → house/car)", defaultValue: COLOR_DEFAULTS.energyLine, hidden: (props: Props) => props.storyMode === false },
    energyGrid: { type: ControlType.Color, title: "Energy (grid → Sett)", defaultValue: COLOR_DEFAULTS.energyGrid, hidden: (props: Props) => props.storyMode === false },
    gridTower: { type: ControlType.Color, title: "Grid tower", defaultValue: COLOR_DEFAULTS.gridTower, hidden: (props: Props) => props.storyMode === false },
    logo: { type: ControlType.Color, title: "Sett logo", defaultValue: COLOR_DEFAULTS.logo },
    textSide: {
        type: ControlType.Enum,
        title: "Text side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        hidden: (props: Props) => props.storyMode === false,
    },
    storyTitle1: { type: ControlType.String, title: "1 Start — title", defaultValue: STORY_TEXT_DEFAULTS[0].title, hidden: (props: Props) => props.storyMode === false },
    storyBody1: { type: ControlType.String, title: "1 Start — text", defaultValue: STORY_TEXT_DEFAULTS[0].body, displayTextArea: true, hidden: (props: Props) => props.storyMode === false },
    storyTitle2: { type: ControlType.String, title: "2 Zon — title", defaultValue: STORY_TEXT_DEFAULTS[1].title, hidden: (props: Props) => props.storyMode === false },
    storyBody2: { type: ControlType.String, title: "2 Zon — text", defaultValue: STORY_TEXT_DEFAULTS[1].body, displayTextArea: true, hidden: (props: Props) => props.storyMode === false },
    storyTitle3: { type: ControlType.String, title: "3 Opslag — title", defaultValue: STORY_TEXT_DEFAULTS[2].title, hidden: (props: Props) => props.storyMode === false },
    storyBody3: { type: ControlType.String, title: "3 Opslag — text", defaultValue: STORY_TEXT_DEFAULTS[2].body, displayTextArea: true, hidden: (props: Props) => props.storyMode === false },
    storyTitle4: { type: ControlType.String, title: "4 Nacht — title", defaultValue: STORY_TEXT_DEFAULTS[3].title, hidden: (props: Props) => props.storyMode === false },
    storyBody4: { type: ControlType.String, title: "4 Nacht — text", defaultValue: STORY_TEXT_DEFAULTS[3].body, displayTextArea: true, hidden: (props: Props) => props.storyMode === false },
    storyTitle5: { type: ControlType.String, title: "5 Laden — title", defaultValue: STORY_TEXT_DEFAULTS[4].title, hidden: (props: Props) => props.storyMode === false },
    storyBody5: { type: ControlType.String, title: "5 Laden — text", defaultValue: STORY_TEXT_DEFAULTS[4].body, displayTextArea: true, hidden: (props: Props) => props.storyMode === false },
    storyTitle6: { type: ControlType.String, title: "6 Overzicht — title", defaultValue: STORY_TEXT_DEFAULTS[5].title, hidden: (props: Props) => props.storyMode === false },
    storyBody6: { type: ControlType.String, title: "6 Overzicht — text", defaultValue: STORY_TEXT_DEFAULTS[5].body, displayTextArea: true, hidden: (props: Props) => props.storyMode === false },
    grainAmount: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.22,
        description: "Sketchfab-style screen grain. 0 turns it off.",
    },
    walls: { type: ControlType.Color, title: "Walls", defaultValue: COLOR_DEFAULTS.walls },
    frame: { type: ControlType.Color, title: "Roof / frame", defaultValue: COLOR_DEFAULTS.frame },
    windows: { type: ControlType.Color, title: "Windows", defaultValue: COLOR_DEFAULTS.windows },
    door: { type: ControlType.Color, title: "Door", defaultValue: COLOR_DEFAULTS.door },
    pathway: { type: ControlType.Color, title: "Pathway", defaultValue: COLOR_DEFAULTS.pathway },
    settBin: { type: ControlType.Color, title: "Sett bin", defaultValue: COLOR_DEFAULTS.settBin },
    battery: { type: ControlType.Color, title: "Batteries (accu)", defaultValue: COLOR_DEFAULTS.battery },
    batteryBlocks: { type: ControlType.Color, title: "Battery blocks", defaultValue: COLOR_DEFAULTS.batteryBlocks },
    inverter: { type: ControlType.Color, title: "Inverter / cable", defaultValue: COLOR_DEFAULTS.inverter },
    cooling: { type: ControlType.Color, title: "Cooling", defaultValue: COLOR_DEFAULTS.cooling },
    chargePole: { type: ControlType.Color, title: "Charge pole", defaultValue: COLOR_DEFAULTS.chargePole },
    solarPanels: { type: ControlType.Color, title: "Solar panels", defaultValue: COLOR_DEFAULTS.solarPanels },
    car: { type: ControlType.Color, title: "Car", defaultValue: COLOR_DEFAULTS.car },
    treeLeaves: { type: ControlType.Color, title: "Tree leaves", defaultValue: COLOR_DEFAULTS.treeLeaves },
    treeTrunk: { type: ControlType.Color, title: "Tree trunks", defaultValue: COLOR_DEFAULTS.treeTrunk },
    bushes: { type: ControlType.Color, title: "Bushes", defaultValue: COLOR_DEFAULTS.bushes },
    wireframe: {
        type: ControlType.Color,
        title: "Wireframe lines",
        defaultValue: COLOR_DEFAULTS.wireframe,
        hidden: (props: Props) => !props.wireframeMode,
    },
})
