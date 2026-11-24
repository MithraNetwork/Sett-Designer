// Sett Hero 3D — Framer Code Component
//
// A lightweight 3D page header for /particulieren and /bedrijven: one static
// scene (a GLB exported by the render studio), lit in the page's colour mood
// and kept alive by small movements — a slow camera drift that leans a little
// toward the pointer, pulses running along the energy lines, batteries that
// breathe, trees that sway. No post-processing and the shadows are rendered
// once, so it costs a fraction of the homepage scene.
//
// SETUP: drag `sett-hero-particulieren.glb` or `sett-hero-bedrijven.glb` into
// Framer's Assets panel, pick it under "Scene (GLB)", choose the matching
// vibe, and place the page's headline and copy on top of the component.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

import * as THREE from "https://esm.sh/three@0.185.1"
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js"
import { glTrack } from "./SettGL.tsx"

THREE.Cache.enabled = true

type VibeKey = "zonnig" | "blauwUur" | "goudenUur" | "paarseAvond" | "groeneNacht" | "ochtend"
interface Vibe {
    sky: [string, string, string] // top, middle, horizon
    glow: { x: number; y: number; color: string; size: number }
    hemi: [number, number, number]
    key: [number, number, number, number] // colour, intensity, azimuth offset from the camera (deg), elevation (deg)
    rim: [number, number, number, number]
    view: number
    exposure: number
    ground: string
    surfaces: Record<string, string>
    flow: string
    solar: string
    night: number // 0 = daylight, 1 = windows, workshop and batteries lit
    shadow: number
    camera: { az: number; el: number }
}

// the two moods, taken from each page's photography: a sunny afternoon in a
// garden for particulieren, blue hour on the business park for bedrijven. The
// Sett and the energy lines keep the homepage's colours in both
const VIBES: Record<VibeKey, Vibe> = {
    zonnig: {
        sky: ["#77AEE6", "#BBDAF4", "#F6E6C9"],
        glow: { x: 0.84, y: 0.1, color: "rgba(255,238,200,0.95)", size: 0.42 },
        // the objects get the homepage's daylight (neutral warm white), so the Sett
        // and everything else read in the homepage's colours; the sunny mood comes
        // from the sky, the sun glow and the long, low shadows
        hemi: [0xf6f5f2, 0xcdb98d, 1.25],
        key: [0xfff7e6, 2.5, 58, 34],
        rim: [0xfff1de, 0.5, 205, 28],
        view: 0.35,
        exposure: 0.95,
        ground: "#C9D4B8",
        surfaces: { lawn: "#C9D4B8", paving: "#D6CFC2", pavement: "#D9D6CF", road: "#8E9199", pathway: "#BCB8AE" },
        flow: "#8DFF66",
        solar: "#FFB92B",
        night: 0,
        shadow: 0.34,
        // from the driveway side: the car and the Sett up front, the house behind
        // them on the right, the garden under the headline
        camera: { az: -30, el: 17 },
    },
    blauwUur: {
        sky: ["#07112E", "#15295A", "#3C5B9C"],
        glow: { x: 0.8, y: 0.08, color: "rgba(150,182,255,0.4)", size: 0.5 },
        hemi: [0x8ea9ea, 0x1a2240, 1.55],
        key: [0xc9daff, 1.75, -58, 40],
        rim: [0x7fa2ff, 1.5, 160, 28],
        view: 0.7,
        exposure: 1.12,
        ground: "#465066",
        surfaces: { lawn: "#56664E", yardPaving: "#6D7383", marking: "#C9D2E6" },
        flow: "#8DFF66",
        solar: "#FFB92B",
        night: 1,
        shadow: 0.45,
        // from the workshop end: the open door, the van and the Sett on the right,
        // the office end under the headline
        camera: { az: -26, el: 17 },
    },
    // the street at sunset: a low warm sun, amber in the sky, the windows coming on
    goudenUur: {
        sky: ["#1B1436", "#6B3A4A", "#E79A4E"],
        glow: { x: 0.82, y: 0.12, color: "rgba(255,190,110,0.75)", size: 0.5 },
        hemi: [0xffd9b0, 0x3a2a30, 1.35],
        key: [0xffb46b, 2.3, -50, 18],
        rim: [0xff9a5a, 1.2, 160, 22],
        view: 0.55,
        exposure: 1.05,
        ground: "#5A4A4E",
        surfaces: { lawn: "#6B6A48", yardPaving: "#7A6E6C", marking: "#F2DCC4" },
        flow: "#8DFF66",
        solar: "#FFB92B",
        night: 0.6,
        shadow: 0.42,
        camera: { az: -26, el: 17 },
    },
    // dusk in the palette's purple
    paarseAvond: {
        sky: ["#0B0620", "#2A1257", "#7C55D6"],
        glow: { x: 0.8, y: 0.08, color: "rgba(191,156,255,0.5)", size: 0.5 },
        hemi: [0xb9a2f0, 0x1d1235, 1.5],
        key: [0xd8c6ff, 1.7, -58, 36],
        rim: [0x9a6ce9, 1.6, 160, 28],
        view: 0.7,
        exposure: 1.1,
        ground: "#4A3F66",
        surfaces: { lawn: "#4E5A50", yardPaving: "#6E6888", marking: "#DCD2F2" },
        flow: "#8DFF66",
        solar: "#FFB92B",
        night: 1,
        shadow: 0.45,
        camera: { az: -26, el: 17 },
    },
    // a deep green night, in the Sett's green
    groeneNacht: {
        sky: ["#03110F", "#0B3A33", "#2E8A64"],
        glow: { x: 0.8, y: 0.08, color: "rgba(141,255,102,0.35)", size: 0.5 },
        hemi: [0x9fe8c8, 0x0f2a24, 1.45],
        key: [0xd2ffe8, 1.6, -58, 38],
        rim: [0x5fe0a0, 1.4, 160, 28],
        view: 0.7,
        exposure: 1.1,
        ground: "#3C5650",
        surfaces: { lawn: "#4C6A4A", yardPaving: "#5F7470", marking: "#CDEBDD" },
        flow: "#8DFF66",
        solar: "#FFB92B",
        night: 1,
        shadow: 0.45,
        camera: { az: -26, el: 17 },
    },
    // a bright, soft morning: pale sky, light paving
    ochtend: {
        sky: ["#BFD6EE", "#E4ECF3", "#FBEBD3"],
        glow: { x: 0.84, y: 0.1, color: "rgba(255,244,220,0.9)", size: 0.45 },
        hemi: [0xf6f5f2, 0xc9c2b0, 1.3],
        key: [0xfff4e0, 2.4, 58, 32],
        rim: [0xfff1de, 0.5, 205, 28],
        view: 0.35,
        exposure: 0.95,
        ground: "#C8CEC0",
        surfaces: { lawn: "#C9D4B8", yardPaving: "#CFCBC3", marking: "#FFFFFF" },
        flow: "#8DFF66",
        solar: "#FFB92B",
        night: 0,
        shadow: 0.34,
        camera: { az: -26, el: 17 },
    },
}

interface Props {
    modelUrl?: string
    vibe?: VibeKey
    subject?: "right" | "center" | "left"
    zoom?: number
    turn?: number
    // the camera higher (+) or lower (−) than the mood's, in degrees
    tilt?: number
    // the scene moved across the frame, as a fraction of its width (x) and height (y; + is down)
    panX?: number
    panY?: number
    motion?: boolean
    motionAmount?: number
    // render sharpness: the screen's pixel ratio, capped (1.5) unless set (the studio's 4K slides)
    pixelRatio?: number
    // keep the drawn frame readable (the studio saves it as a PNG); off on the site
    preserve?: boolean
    grain?: number
    scrim?: number
    bottomFade?: number
    fadeColor?: string
    flowColor?: string
    solarColor?: string
    // the grid's power (wind, the mast): lines named energy_grid…
    gridColor?: string
    skyTop?: string
    skyHorizon?: string
    skyMid?: string
    glowColor?: string
    style?: React.CSSProperties
}

// Framer can hand an unset colour over as its placeholder blue (#09F): treat that as empty
const pick = (v: string | undefined, d: string) => (!v || /^(#09f|#0099ff|rgba?\(0, ?153, ?255(, ?1)?\))$/i.test(v.trim()) ? d : v)

// energy tubes, exactly as the homepage draws a flowing line: slightly see-through,
// with soft brightness waves travelling along it (one every ~55 units)
const ENERGY_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const ENERGY_FRAG = `
uniform vec3 uColor; uniform float uTime; uniform float uPulses; uniform float uAlpha;
varying vec2 vUv;
void main(){
    float pulse = 0.5 + 0.5 * sin(vUv.x * uPulses - uTime * 2.6);
    pulse = pow(pulse, 3.0);
    gl_FragColor = vec4(uColor * (0.9 + 0.45 * pulse), uAlpha * (0.62 + 0.38 * pulse));
}`

// the homepage's screen grain (three's FilmPass, amount 0.15), done as one overlay
// quad instead of a post-processing chain: blended as dst + dst·s, so each pixel
// gets exactly FilmPass's base·(1 + amount·(0.1 + noise)). Noise cells are CSS
// pixels, as on the homepage (which renders its grain at a 1× pixel ratio), and
// empty (transparent) pixels stay empty, so the CSS sky behind is untouched
// shader time stays small: a growing time loses precision on the GPU after an hour or
// so (the grain turns into blocks). The pulse loops after 100 of its own periods, seamless
const PULSE_LOOP = (2 * Math.PI) / 2.6 * 100
const GRAIN_VERT = `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`
const GRAIN_FRAG = `
#include <common>
uniform float uAmount; uniform float uTime; uniform float uCell; uniform vec2 uRes;
void main(){
    vec2 uv = floor(gl_FragCoord.xy / uCell) / uRes;
    float noise = rand(fract(uv + uTime));
    gl_FragColor = vec4(vec3(uAmount * clamp(0.1 + noise, 0.0, 1.0)), 1.0);
}`

function hexToRgb(h: string) {
    const c = new THREE.Color(h)
    return Math.round(c.r * 255) + "," + Math.round(c.g * 255) + "," + Math.round(c.b * 255)
}

export default function SettHero3D(props: Props) {
    const vibeKey: VibeKey = props.vibe && props.vibe in VIBES ? props.vibe : "zonnig"
    const vibe = VIBES[vibeKey]
    const [ready, setReady] = useState(false)
    const hostRef = useRef<HTMLDivElement>(null)
    // live options, read by the render loop without rebuilding the scene
    const live = {
        vibe,
        subject: props.subject || "right",
        zoom: props.zoom ?? 1,
        turn: props.turn ?? 0,
        tilt: props.tilt ?? 0,
        panX: props.panX ?? 0,
        panY: props.panY ?? 0,
        motion: props.motion !== false,
        motionAmount: props.motionAmount ?? 1,
        grain: props.grain ?? 0.15,
        flow: pick(props.flowColor, vibe.flow),
        solar: pick(props.solarColor, vibe.solar),
        grid: pick(props.gridColor, "#4FA3FF"),
    }
    const liveRef = useRef(live)
    liveRef.current = live
    const apiRef = useRef<null | { restyle: () => void; reframe: () => void }>(null)

    useEffect(() => {
        const url = props.modelUrl
        if (!url) return
        const host = hostRef.current!
        let cancelled = false
        let raf = 0
        let needs = true

        const narrow = window.innerWidth <= 760
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power", preserveDrawingBuffer: !!props.preserve })
        const gl = glTrack(renderer) // so the renderer can go completely when this unmounts
        renderer.setPixelRatio(props.pixelRatio || Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap
        // nothing that casts a shadow moves, so the shadow map is drawn once
        renderer.shadowMap.autoUpdate = false
        renderer.setClearColor(0x000000, 0)
        const canvas = renderer.domElement
        canvas.style.cssText = "display:block;width:100%;height:100%"
        canvas.setAttribute("aria-hidden", "true")
        host.appendChild(canvas)
        // grain overlay (skipped on phones, like the homepage's lite mode)
        const grainMat = new THREE.ShaderMaterial({
            vertexShader: GRAIN_VERT,
            fragmentShader: GRAIN_FRAG,
            uniforms: { uAmount: { value: 0 }, uTime: { value: 0 }, uCell: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.DstColorFactor,
            blendDst: THREE.OneFactor,
            blendSrcAlpha: THREE.ZeroFactor,
            blendDstAlpha: THREE.OneFactor,
            depthTest: false,
            depthWrite: false,
        })
        const grainQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), grainMat)
        grainQuad.frustumCulled = false
        const grainScene = new THREE.Scene()
        grainScene.add(grainQuad)
        const grainCam = new THREE.Camera()

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(30, 1, 5, 40000)
        const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
        const key = new THREE.DirectionalLight(0xffffff, 1)
        key.castShadow = true
        key.shadow.mapSize.set(narrow ? 1024 : 2048, narrow ? 1024 : 2048)
        key.shadow.bias = -0.0003
        key.shadow.normalBias = 0.8
        key.shadow.radius = 4
        const rim = new THREE.DirectionalLight(0xffffff, 1)
        const view = new THREE.DirectionalLight(0xfff2da, 1)
        scene.add(hemi, key, key.target, rim, rim.target, view, view.target)
        const extras: THREE.Light[] = []

        // the ground: a wide disc that fades out into the sky gradient behind it
        const FADE = 1024
        const fade = document.createElement("canvas")
        fade.width = fade.height = FADE
        const fctx = fade.getContext("2d")!
        const fg = fctx.createRadialGradient(FADE / 2, FADE / 2, FADE * 0.12, FADE / 2, FADE / 2, FADE / 2)
        fg.addColorStop(0, "#fff")
        fg.addColorStop(0.55, "#fff")
        fg.addColorStop(1, "#000")
        fctx.fillStyle = fg
        fctx.fillRect(0, 0, FADE, FADE)
        const fadeTex = new THREE.CanvasTexture(fade)
        const groundMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(vibe.ground), roughness: 1, metalness: 0, alphaMap: fadeTex, transparent: true, depthWrite: false })
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -3
        ground.receiveShadow = true
        ground.renderOrder = -1
        scene.add(ground)

        // ---------------------------------------------------------------- materials
        const flat: THREE.MeshStandardMaterial[] = []
        const byName: Record<string, THREE.Material[]> = {}
        const energy: THREE.ShaderMaterial[] = []
        const glows: THREE.MeshBasicMaterial[] = []
        const rings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = []
        function remember(name: string, m: THREE.Material) {
            ;(byName[name] = byName[name] || []).push(m)
        }
        function convert(src: any, mesh: THREE.Mesh): THREE.Material {
            const name: string = src.name || ""
            if (/^energy_/.test(name) && !/_(bead|cable|dot|ring)$/.test(name) && (mesh.geometry as THREE.BufferGeometry).attributes.uv) {
                const len = (mesh.userData && mesh.userData.length) || 600
                const m = new THREE.ShaderMaterial({
                    uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 }, uPulses: { value: Math.max(6, Math.round(len / 55)) }, uAlpha: { value: 0.9 } },
                    vertexShader: ENERGY_VERT,
                    fragmentShader: ENERGY_FRAG,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    toneMapped: false,
                })
                m.userData.kind = /solar/.test(name) ? "solar" : /grid/.test(name) ? "grid" : "flow"
                mesh.renderOrder = 3
                mesh.castShadow = false
                energy.push(m)
                return m
            }
            if (/^energy_/.test(name)) {
                // the origin marker: a bead, and a ring that pings outward
                const ringy = /_ring$/.test(name)
                const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(), toneMapped: false, transparent: ringy, opacity: ringy ? 0 : 1, side: THREE.DoubleSide, depthWrite: !ringy })
                m.userData.kind = /solar/.test(name) ? "solar" : /grid/.test(name) ? "grid" : "flow"
                mesh.renderOrder = 4
                mesh.castShadow = false
                if (ringy) rings.push({ mesh, mat: m })
                glows.push(m)
                return m
            }
            const m = new THREE.MeshStandardMaterial({
                color: src.color ? src.color.clone() : new THREE.Color("#cccccc"),
                roughness: 1,
                metalness: 0,
                flatShading: true,
                // windows glow; glass (a shop window) you look through
                transparent: name === "windows" || name === "glass",
                opacity: name === "windows" ? 0.9 : name === "glass" ? 0.16 : 1,
                depthWrite: name !== "glass",
            })
            m.name = name
            // status lights and screens keep their own colour (no tone mapping: they'd go white)
            if (name === "serverLed" || name === "screenLight") m.toneMapped = false
            m.userData.base = m.color.clone()
            if (src.emissive) m.userData.emissive = src.emissive.clone()
            m.userData.emissiveIntensity = src.emissiveIntensity || 0
            flat.push(m)
            remember(name, m)
            return m
        }
        function restyle() {
            const L = liveRef.current, V = L.vibe
            hemi.color.setHex(V.hemi[0])
            hemi.groundColor.setHex(V.hemi[1])
            hemi.intensity = V.hemi[2]
            key.color.setHex(V.key[0])
            key.intensity = V.key[1]
            rim.color.setHex(V.rim[0])
            rim.intensity = V.rim[1]
            view.intensity = V.view
            renderer.toneMappingExposure = V.exposure
            groundMat.color.set(V.ground)
            flat.forEach((m) => {
                const s = V.surfaces[m.name]
                m.color.copy(s ? new THREE.Color(s) : m.userData.base)
                // night: glass glows warm, the workshop and tail lights come on
                if (m.name === "windows") {
                    m.emissive.set("#ffd6a3")
                    m.emissiveIntensity = V.night * 0.9
                    m.color.set(V.night ? "#6d6457" : "#4A4A4A")
                } else if (m.name === "serverLed" || m.name === "screenLight") {
                    // a server's status lights: always on, brighter in the dark
                    m.emissive.copy(m.userData.emissive || new THREE.Color("#7CFF6A"))
                    m.emissiveIntensity = (m.userData.emissiveIntensity || 1.5) * (0.6 + 0.4 * V.night)
                } else if (m.name === "interiorLight" || m.name === "taillight" || m.name === "wallLamp") {
                    m.emissive.copy(m.userData.emissive || new THREE.Color("#ffffff"))
                    m.emissiveIntensity = (m.userData.emissiveIntensity || 1) * (0.35 + 0.65 * V.night)
                } else if (m.name === "interior" || m.name === "interiorDark" || m.name === "interiorFloor") {
                    // the workshop reads lit from inside at blue hour
                    m.emissive.set("#ffbf7a")
                    m.emissiveIntensity = 0.12 * V.night
                }
            })
            energy.forEach((m) => m.uniforms.uColor.value.set(m.userData.kind === "solar" ? L.solar : m.userData.kind === "grid" ? L.grid : L.flow))
            glows.forEach((m) => m.color.set(m.userData.kind === "solar" ? L.solar : m.userData.kind === "grid" ? L.grid : L.flow))
            extras.forEach((l) => (l.intensity = (l.userData.base || 1) * V.night))
            renderer.shadowMap.needsUpdate = true
            needs = true
        }

        // ---------------------------------------------------------------- scene
        let root: THREE.Object3D | null = null
        const focus = new THREE.Box3()
        const sway: { obj: THREE.Object3D; phase: number; amp: number }[] = []
        const batteries: THREE.MeshStandardMaterial[] = []
        new GLTFLoader().load(
            url,
            (gltf: any) => {
                if (cancelled) return
                root = gltf.scene
                const r = root!
                // a scroll scene's baked contact shadow: this component casts its own (taken out,
                // so it doesn't count for the framing either)
                const baked: any[] = []
                r.traverse((o: any) => o.isMesh && o.name === "contact_shadow" && baked.push(o))
                baked.forEach((o) => o.parent && o.parent.remove(o))
                r.traverse((o: any) => {
                    if (o.isMesh) {
                        o.castShadow = true
                        o.receiveShadow = true
                        o.material = Array.isArray(o.material) ? o.material.map((mm: any) => convert(mm, o)) : convert(o.material, o)
                        // the energy lines and the ground plates shouldn't cast
                        const nm = (Array.isArray(o.material) ? o.material[0] : o.material).name || ""
                        if (!(o.material instanceof THREE.MeshStandardMaterial) || /lawn|paving|pavement|road|yardPaving|marking|pathway|glass/.test(nm)) o.castShadow = false
                    }
                    if (/^tree_/.test(o.name)) sway.push({ obj: o, phase: Math.random() * Math.PI * 2, amp: 0.012 + Math.random() * 0.01 })
                })
                ;(byName.battery || []).concat(byName.batteryBlocks || []).forEach((m) => batteries.push(m as THREE.MeshStandardMaterial))
                scene.add(r)
                r.updateMatrixWorld(true)
                // the exported framing box, else everything
                let fr: any = null
                r.traverse((o: any) => {
                    if (!fr && o.userData && o.userData.frame) fr = o.userData.frame
                })
                if (fr) focus.set(new THREE.Vector3().fromArray(fr.min), new THREE.Vector3().fromArray(fr.max))
                else focus.setFromObject(r)
                // warm lamps in the workshop and a green pool over the Sett, for the dark mood
                r.traverse((o: any) => {
                    if (!o.isMesh) return
                    const nm = (Array.isArray(o.material) ? o.material[0] : o.material).name || ""
                    if (nm === "wallLamp") {
                        // a floodlight: a warm pool on the yard in front of it
                        const p = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
                        const l = new THREE.PointLight(0xffd29a, 1, 720, 0)
                        l.position.copy(p).add(new THREE.Vector3(0, -30, -110))
                        l.userData.base = 0.9
                        scene.add(l)
                        extras.push(l)
                    }
                    if (nm === "serverGlow") {
                        // the glow of a server rack's lights: an invisible marker becomes a
                        // small coloured light, the only light in a dark server room
                        const p = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
                        const src = Array.isArray(o.material) ? o.material[0] : o.material
                        const l = new THREE.PointLight(src.color ? src.color.getHex() : 0x5cffb0, 1, 320, 0)
                        l.position.copy(p)
                        l.userData.base = 1.8
                        o.visible = false
                        scene.add(l)
                        extras.push(l)
                    }
                    if (nm === "interiorLight") {
                        const p = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
                        const l = new THREE.PointLight(0xffc98a, 1, 620, 0)
                        l.position.copy(p).add(new THREE.Vector3(0, -40, -60))
                        l.userData.base = 1.3
                        scene.add(l)
                        extras.push(l)
                    }
                })
                const bb = new THREE.Box3()
                r.traverse((o: any) => {
                    if (o.isMesh && /^accu/.test(o.name)) bb.union(new THREE.Box3().setFromObject(o))
                })
                if (!bb.isEmpty()) {
                    const l = new THREE.PointLight(0x39e089, 1, 420, 0)
                    l.position.copy(bb.getCenter(new THREE.Vector3())).add(new THREE.Vector3(0, 90, 0))
                    l.userData.base = 1.2
                    scene.add(l)
                    extras.push(l)
                }
                const size = focus.getSize(new THREE.Vector3()).length()
                const S = size * 5
                ground.scale.set(S, S, 1)
                ground.position.x = (focus.min.x + focus.max.x) / 2
                ground.position.z = (focus.min.z + focus.max.z) / 2
                // the disc lies just under the paving, which puts it above the
                // inside of each Sett's pit: being transparent it draws last and
                // would veil the unit. Cut the pits out of its alpha.
                const toPx = (wx: number, wz: number) => [((wx - ground.position.x) / S + 0.5) * FADE, ((wz - ground.position.z) / S + 0.5) * FADE]
                r.traverse((o: any) => {
                    if (!o.isMesh || !/^BAK/.test(o.name)) return
                    const b = new THREE.Box3().setFromObject(o)
                    const a = toPx(b.min.x - 8, b.min.z - 8), c = toPx(b.max.x + 8, b.max.z + 8)
                    fctx.fillStyle = "#000"
                    fctx.fillRect(Math.floor(Math.min(a[0], c[0])), Math.floor(Math.min(a[1], c[1])), Math.ceil(Math.abs(c[0] - a[0])) + 1, Math.ceil(Math.abs(c[1] - a[1])) + 1)
                })
                fadeTex.needsUpdate = true
                restyle()
                frame()
                placeLights()
                setReady(true)
            },
            undefined,
            (err: any) => console.error("SettHero3D: could not load the scene", err)
        )

        // ---------------------------------------------------------------- camera
        const target = new THREE.Vector3()
        let dist = 3000
        let baseAz = 0, baseEl = 0
        function camDir(az: number, el: number) {
            const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el)
            return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e))
        }
        // fit the framing box, then slide it to the requested side of the frame,
        // leaving the bottom clear for the page's wave
        function frame() {
            if (focus.isEmpty()) return
            const L = liveRef.current
            const w = host.clientWidth || 1, h = host.clientHeight || 1
            const aspect = w / h
            camera.aspect = aspect
            camera.updateProjectionMatrix()
            baseAz = L.vibe.camera.az + L.turn
            baseEl = Math.max(3, L.vibe.camera.el + L.tilt)
            const portrait = aspect < 1
            const side = portrait ? 0 : L.subject === "right" ? 1 : L.subject === "left" ? -1 : 0
            // how much of the frame the subject may take
            const fillW = portrait ? 0.92 : side ? 0.56 : 0.8
            const fillH = portrait ? 0.5 : 0.66
            const corners: THREE.Vector3[] = []
            for (let i = 0; i < 8; i++) corners.push(new THREE.Vector3(i & 1 ? focus.max.x : focus.min.x, i & 2 ? focus.max.y : focus.min.y, i & 4 ? focus.max.z : focus.min.z))
            const dir = camDir(baseAz, baseEl)
            const c = focus.getCenter(new THREE.Vector3())
            target.copy(c)
            dist = focus.getSize(new THREE.Vector3()).length() * 1.2
            for (let it = 0; it < 12; it++) {
                camera.position.copy(target).addScaledVector(dir, dist)
                camera.lookAt(target)
                camera.updateMatrixWorld(true)
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
                corners.forEach((p) => {
                    const q = p.clone().project(camera)
                    x0 = Math.min(x0, q.x)
                    x1 = Math.max(x1, q.x)
                    y0 = Math.min(y0, q.y)
                    y1 = Math.max(y1, q.y)
                })
                const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist, halfW = halfH * aspect
                const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
                const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
                // where the subject's centre should land, in NDC
                const wantX = side * (1 - fillW) * 0.98
                const wantY = portrait ? -0.3 : -0.06
                target.addScaledVector(right, ((x0 + x1) / 2 - wantX) * halfW).addScaledVector(up, ((y0 + y1) / 2 - wantY) * halfH)
                const s = Math.max((x1 - x0) / 2 / fillW, (y1 - y0) / 2 / fillH)
                dist *= 0.4 + 0.6 * s
            }
            dist /= L.zoom || 1
            // panned: the aim point moves the other way, by that part of the frame
            if (L.panX || L.panY) {
                camera.position.copy(target).addScaledVector(dir, dist)
                camera.lookAt(target)
                camera.updateMatrixWorld(true)
                const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist, hw = hh * aspect
                const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
                const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
                target.addScaledVector(right, -L.panX * 2 * hw).addScaledVector(up, L.panY * 2 * hh)
            }
            needs = true
        }
        function placeLights() {
            const size = focus.getSize(new THREE.Vector3()).length()
            const V = liveRef.current.vibe
            const at = (azOff: number, el: number) => camDir(baseAz + azOff, el).multiplyScalar(size * 1.4).add(target)
            key.position.copy(at(V.key[2], V.key[3]))
            key.target.position.copy(target)
            rim.position.copy(at(V.rim[2], V.rim[3]))
            rim.target.position.copy(target)
            const sc = key.shadow.camera as THREE.OrthographicCamera
            const half = size * 0.9
            sc.left = sc.bottom = -half
            sc.right = sc.top = half
            sc.near = size * 0.1
            sc.far = size * 3.2
            sc.updateProjectionMatrix()
            renderer.shadowMap.needsUpdate = true
        }
        function resize() {
            const w = host.clientWidth, h = host.clientHeight
            if (!w || !h) return
            renderer.setSize(w, h, false)
            grainMat.uniforms.uCell.value = renderer.getPixelRatio()
            grainMat.uniforms.uRes.value.set(w, h)
            frame()
            placeLights()
        }
        const ro = new ResizeObserver(resize)
        ro.observe(host)
        resize()

        // the camera leans a touch toward the pointer (desktop only)
        const lean = { x: 0, y: 0, tx: 0, ty: 0 }
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            lean.tx = (e.clientX / window.innerWidth) * 2 - 1
            lean.ty = (e.clientY / window.innerHeight) * 2 - 1
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        let onScreen = true
        const io = new IntersectionObserver((en) => (onScreen = en[0].isIntersecting))
        io.observe(host)

        // ---------------------------------------------------------------- loop
        const t0 = performance.now()
        let last = 0
        function tick() {
            raf = requestAnimationFrame(tick)
            if (!onScreen || document.hidden || !root) return
            const now = performance.now()
            // 30 fps is plenty for motion this slow
            if (now - last < 32) return
            last = now
            const L = liveRef.current
            const t = (now - t0) / 1000
            const amp = L.motion && !reduced ? L.motionAmount : 0
            lean.x += (lean.tx - lean.x) * 0.05
            lean.y += (lean.ty - lean.y) * 0.05
            const az = baseAz + amp * (Math.sin((t / 18) * Math.PI * 2) * 2.6 + lean.x * 2.2)
            const el = baseEl + amp * (Math.sin((t / 26) * Math.PI * 2) * 0.7 - lean.y * 1.1)
            camera.position.copy(target).addScaledVector(camDir(az, el), dist)
            camera.lookAt(target)
            view.position.copy(camera.position)
            view.target.position.copy(target)
            energy.forEach((m) => (m.uniforms.uTime.value = amp ? t % PULSE_LOOP : 0))
            const ping = amp ? (t % 1.6) / 1.6 : 0.35
            rings.forEach((r) => {
                r.mesh.quaternion.copy(camera.quaternion)
                if (r.mesh.parent) r.mesh.quaternion.premultiply(r.mesh.parent.getWorldQuaternion(new THREE.Quaternion()).invert())
                r.mesh.scale.setScalar(1 + 2.6 * ping)
                r.mat.opacity = 0.7 * (1 - ping)
            })
            const breathe = 0.5 + 0.5 * Math.sin(t * 1.6)
            batteries.forEach((m) => {
                m.emissive.copy(m.color)
                m.emissiveIntensity = 0.35 * L.vibe.night * (amp ? 0.75 + 0.5 * breathe : 1)
            })
            sway.forEach((s) => {
                s.obj.rotation.z = amp * s.amp * Math.sin(t * 0.9 + s.phase)
                s.obj.rotation.x = amp * s.amp * 0.6 * Math.sin(t * 0.7 + s.phase * 1.3)
            })
            renderer.render(scene, camera)
            const grain = narrow ? 0 : Math.max(0, Math.min(1, L.grain))
            if (grain > 0) {
                grainMat.uniforms.uAmount.value = grain
                grainMat.uniforms.uTime.value = amp ? t % 10 : 0
                renderer.autoClear = false
                renderer.render(grainScene, grainCam)
                renderer.autoClear = true
            }
            needs = false
        }
        tick()
        apiRef.current = {
            restyle,
            reframe: () => {
                frame()
                placeLights()
            },
        }

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            window.removeEventListener("pointermove", onMove)
            fadeTex.dispose()
            gl.release(scene, grainScene)
            apiRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.modelUrl])

    // mood, colours and framing apply live
    useEffect(() => {
        apiRef.current?.restyle()
    }, [vibeKey, live.flow, live.solar])
    useEffect(() => {
        apiRef.current?.reframe()
    }, [vibeKey, live.subject, live.zoom, live.turn, live.tilt, live.panX, live.panY])

    const sky = [pick(props.skyTop, vibe.sky[0]), pick(props.skyMid, vibe.sky[1]), pick(props.skyHorizon, vibe.sky[2])]
    const scrim = props.scrim ?? 0.5
    const bottomFade = props.bottomFade ?? 0.45
    const fadeRgb = hexToRgb(props.fadeColor || "#0D1130")
    const g = { ...vibe.glow, color: props.glowColor || vibe.glow.color }
    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: `radial-gradient(${Math.round(g.size * 100)}% ${Math.round(g.size * 120)}% at ${g.x * 100}% ${g.y * 100}%, ${g.color}, rgba(255,255,255,0) 70%), linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 45%, ${sky[2]} 78%)`, ...props.style }}>
            {!props.modelUrl ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: "14px/1.5 system-ui", textAlign: "center", padding: 24 }}>
                    Kies sett-hero-particulieren.glb of sett-hero-bedrijven.glb bij “Scene (GLB)”.
                </div>
            ) : (
                <div ref={hostRef} style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 0.9s ease" }} />
            )}
            {/* legibility for the headline on the left, and a fade into the page's wave */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(90deg, rgba(${fadeRgb},${(0.78 * scrim).toFixed(3)}) 0%, rgba(${fadeRgb},${(0.5 * scrim).toFixed(3)}) 32%, rgba(${fadeRgb},0) 64%), linear-gradient(180deg, rgba(${fadeRgb},${(0.35 * scrim).toFixed(3)}) 0%, rgba(${fadeRgb},0) 20%)` }} />
            <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${Math.round(10 + bottomFade * 40)}%`, pointerEvents: "none", background: `linear-gradient(0deg, rgba(${fadeRgb},${Math.min(1, bottomFade * 1.6).toFixed(3)}) 0%, rgba(${fadeRgb},0) 100%)` }} />
        </div>
    )
}

SettHero3D.displayName = "Sett Hero 3D"

addPropertyControls(SettHero3D, {
    modelUrl: { type: ControlType.File, title: "Scene (GLB)", allowedFileTypes: ["glb"] },
    vibe: {
        type: ControlType.Enum,
        title: "Vibe",
        options: ["zonnig", "blauwUur", "goudenUur", "paarseAvond", "groeneNacht", "ochtend"],
        optionTitles: ["Zonnig — Particulieren", "Blauw uur — Bedrijven", "Gouden uur", "Paarse avond", "Groene nacht", "Ochtend"],
        defaultValue: "zonnig",
    },
    subject: { type: ControlType.Enum, title: "Scene side", options: ["right", "center", "left"], optionTitles: ["Right", "Center", "Left"], defaultValue: "right", description: "Where the scene sits on wide screens; the headline goes on the other side. Portrait screens always centre it low." },
    zoom: { type: ControlType.Number, title: "Zoom", min: 0.6, max: 1.8, step: 0.05, defaultValue: 1 },
    turn: { type: ControlType.Number, title: "Turn", min: -40, max: 40, step: 1, unit: "°", defaultValue: 0 },
    motion: { type: ControlType.Boolean, title: "Motion", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Camera drift, pointer lean, energy pulses, tree sway. Off (or reduced-motion) keeps the scene still." },
    motionAmount: { type: ControlType.Number, title: "Motion amount", min: 0, max: 2, step: 0.1, defaultValue: 1, hidden: (p: Props) => p.motion === false },
    grain: { type: ControlType.Number, title: "Grain", min: 0, max: 1, step: 0.01, defaultValue: 0.15, description: "Screen grain, as on the homepage (0.15). 0 turns it off; phones skip it, like the homepage does." },
    scrim: { type: ControlType.Number, title: "Text scrim", min: 0, max: 1, step: 0.05, defaultValue: 0.5, description: "Darkens the headline side for white text." },
    bottomFade: { type: ControlType.Number, title: "Bottom fade", min: 0, max: 1, step: 0.05, defaultValue: 0.45 },
    fadeColor: { type: ControlType.Color, title: "Fade colour", defaultValue: "#0D1130" },
    flowColor: { type: ControlType.Color, title: "Energy colour", description: "Leave empty for the palette green (#8DFF66)." },
    solarColor: { type: ControlType.Color, title: "Solar colour", description: "Leave empty for the palette amber (#FFB92B)." },
    skyTop: { type: ControlType.Color, title: "Sky top", description: "Leave empty for the vibe's sky." },
    skyHorizon: { type: ControlType.Color, title: "Sky horizon", description: "Leave empty for the vibe's sky." },
    skyMid: { type: ControlType.Color, title: "Sky middle", description: "Leave empty for the vibe's sky." },
    glowColor: { type: ControlType.Color, title: "Glow", description: "Leave empty for the vibe's glow." },
})
