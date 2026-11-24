// Sett V2 Anatomie — the /details opener: the Sett itself from the first frame,
// drawn as a technical wireframe (the homepage's blueprint blue) with its inside
// in the homepage scene's colours. The section pins and the scroll runs four acts:
//   1 de Sett     the unit, big, beside the headline; its dimensions drawn on,
//                 the ground a see-through blueprint plane at ±0,00 with the
//                 pit and −0,70 m marked under it
//   2 röntgen     the steel shell fades to wireframe: the inside shows
//   3 open        battery, modules, inverter and cooling lift out, each named
//   4 specs       the camera turns; the ten specs light up one by one, pinned
//                 to their part
// Model: sett-box.glb (the unit and its charging post, as SettBox3D).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import * as THREE from "https://esm.sh/three@0.185.1"
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js"
import { glTrack } from "./SettGL.tsx"
import { V2Style, Lines, useReveal, pinProgress, onScrollFrame, onCanvas, reducedMotion, ease, range, Arrow, V, or } from "./SettV2Kit.tsx"

type Spec = { title?: string; value?: string }
interface Props {
    model?: string
    eyebrow?: string
    headline?: string
    lead?: string
    primary?: string
    primaryLink?: string
    secondary?: string
    secondaryLink?: string
    shellLine?: string
    partsLine?: string
    specsLine?: string
    specs?: Spec[]
    style?: React.CSSProperties
}
const SPECS: Spec[] = [
    { title: "Accu capaciteit", value: "96 kWh LiFePO4" },
    { title: "Max load", value: "50 kW (meer bij meer boxen)" },
    { title: "Netaansluiting", value: "tot 3×50A (klein)" },
    { title: "Laadpunten", value: "2× 11 kW of 1× 22 kW" },
    { title: "Koeling", value: "Actief en passief (koelribben)" },
    { title: "Brandveiligheid", value: "Aerosol per compartiment" },
    { title: "Bewaking", value: "Load · temp · vocht · 4G" },
    { title: "Afmetingen", value: "4 × 1,5 × 0,7 m" },
    { title: "Materiaal", value: "S235-staal, verzinkt en gecoat" },
    { title: "Levensduur", value: "20+ jaar" },
]
// where each spec is pinned, in the order above
const ANCHOR_ORDER = ["batteries", "blocks", "inverter", "pole", "cooling", "partition", "vent", "corner", "enclosure", "ribs"]
// the parts named while the unit is open
const PARTS: [string, string][] = [
    ["batteries", "Accu · LiFePO4"],
    ["blocks", "Batterijmodules"],
    ["inverter", "Omvormer"],
    ["cooling", "Koeling"],
    ["pole", "Laadpaal"],
]
// the live homepage scene's colours for the unit
const COLORS: Record<string, string> = { settBin: "#95A3C2", frame: "#95A3C2", battery: "#25CF77", batteryBlocks: "#2544CF", inverter: "#95A3C2", cooling: "#525252", chargePole: "#363D52", logo: "#FFFFFF" }
const SHELL = /^(settBin|frame)$/
// the homepage's blueprint line colour
const WIRE = "#BFE4FF"
const LIFT: [RegExp, number, number][] = [
    [/^accu/, 120, 30],
    [/^Block_large/, 88, 24],
    [/^Inverter/, 46, 0],
    [/^Cooling/, 96, 0],
]

const CSS = `
.v2x-stage{ position:sticky; top:0; height:100vh; min-height:560px; overflow:hidden;
  background:radial-gradient(70% 70% at 68% 45%, #0E1A33 0%, ${V.ink} 70%); }
.v2x-canvas{ position:absolute; inset:0; }
.v2x-hero{ position:absolute; left:0; right:0; bottom:clamp(64px, 13vh, 118px); z-index:3; }
.v2x-hero .v2-display{ max-width:9ch; font-size:clamp(42px, min(7.6cqi, 12vh), 136px); }
.v2x-row{ display:flex; flex-direction:column; align-items:flex-start; gap:clamp(14px, 3vh, 24px); margin-top:clamp(16px, 3.4vh, 28px); }
.v2x-row .v2-lead{ max-width:520px; }
.v2x-btns{ display:flex; gap:12px; flex-wrap:wrap; }
.v2x-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2x-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2x-meta{ position:absolute; left:0; right:0; top:clamp(88px, 15vh, 118px); z-index:3; display:flex; justify-content:space-between; color:rgba(191,228,255,.62); }
.v2x-line{ position:absolute; left:0; right:0; top:clamp(96px, 17vh, 150px); z-index:3; pointer-events:none; }
.v2x-line .v2-h2{ max-width:13ch; font-size:clamp(30px, min(4.6cqi, 8.5vh), 80px); }
.v2x-line .v2-mono{ color:${V.lime}; margin-bottom:16px; }
.v2x-specs{ position:absolute; right:56px; top:50%; transform:translateY(-50%); z-index:3; width:min(360px, 32vw); pointer-events:none;
  padding:10px 22px; border-radius:22px; background:rgba(6,12,26,.72); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); box-shadow:inset 0 0 0 1px rgba(191,228,255,.12); }
.v2x-specs li{ display:flex; justify-content:space-between; gap:14px; padding:9px 0; border-bottom:1px solid rgba(191,228,255,.1); transition:opacity .35s, color .35s; }
.v2x-specs li:last-child{ border-bottom:0; }
.v2x-specs li b{ font-weight:700; font-size:15px; }
.v2x-specs li span{ font-family:"Sett Mono","Geist Mono",monospace; font-size:12px; text-align:right; color:rgba(223,228,244,.72); }
.v2x-tag{ position:absolute; z-index:3; transform:translate(-50%,-50%); pointer-events:none; transition:opacity .3s; }
.v2x-tag i{ display:block; width:12px; height:12px; border-radius:99px; background:${V.lime}; box-shadow:0 0 0 6px rgba(141,255,102,.18), 0 0 22px ${V.lime}; }
.v2x-tag em{ position:absolute; left:20px; top:-7px; white-space:nowrap; font:600 12px "Sett Mono","Geist Mono",monospace; font-style:normal; letter-spacing:.08em; text-transform:uppercase; color:${V.lime}; text-shadow:0 1px 8px rgba(6,12,26,.9); }
.v2x-dim{ position:absolute; z-index:2; transform:translate(-50%,-50%); pointer-events:none; font:600 12px "Sett Mono","Geist Mono",monospace; letter-spacing:.08em; color:${WIRE};
  padding:3px 8px; border-radius:6px; background:rgba(6,12,26,.7); white-space:nowrap; }
.v2x-steps{ position:absolute; left:56px; bottom:44px; z-index:3; display:flex; gap:22px; }
.v2x-steps span{ font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.12em; text-transform:uppercase; color:rgba(223,228,244,.6); display:flex; flex-direction:column; gap:8px; }
.v2x-steps span i{ display:block; width:64px; height:2px; background:rgba(223,228,244,.18); }
.v2x-steps span i b{ display:block; height:100%; background:${V.lime}; }
@media (max-height: 640px){ .v2x-hero .v2-lead{ display:none; } }
@container (max-width: 900px){
  .v2x-meta > :nth-child(n+2), .v2x-steps{ display:none; }
  .v2x-specs{ left:22px; right:22px; top:auto; bottom:84px; transform:none; width:auto; }
  .v2x-specs li:not(.on){ display:none; }
  .v2x-tag em{ display:none; }
  .v2x-dim.lvl{ display:none; }
  .v2x-hero{ bottom:72px; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Xray(props: Props) {
    const p = props
    const specs = (p.specs && p.specs.length ? p.specs : SPECS).slice(0, 10)
    const root = useRef<HTMLDivElement>(null)
    const host = useRef<HTMLDivElement>(null)
    const hero = useRef<HTMLDivElement>(null)
    const tagsRef = useRef<(HTMLDivElement | null)[]>([])
    const partsRef = useRef<(HTMLDivElement | null)[]>([])
    const dimsRef = useRef<(HTMLDivElement | null)[]>([])
    useReveal(hero)
    const [t, setT] = useState(0)
    const tRef = useRef(0)
    tRef.current = t
    useEffect(() => {
        const el = root.current
        if (!el || onCanvas()) return
        return onScrollFrame(() => setT(pinProgress(el)))
    }, [])

    useEffect(() => {
        const url = p.model
        const box = host.current
        if (!url || !box) return
        let cancelled = false, ready = false, raf = 0
        const still = onCanvas() || reducedMotion()
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        const gl = glTrack(renderer) // so the renderer can go completely when this unmounts
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.02
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.cssText = "display:block;width:100%;height:100%"
        box.appendChild(renderer.domElement)
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(28, 1, 5, 30000)
        scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a2240, 1.35))
        const key = new THREE.DirectionalLight(0xfff4e2, 2.2)
        key.castShadow = true
        key.shadow.mapSize.set(2048, 2048)
        key.shadow.bias = -0.0003
        key.shadow.normalBias = 0.5
        key.shadow.radius = 4
        const rim = new THREE.DirectionalLight(0xb8c8ff, 0.9)
        scene.add(key, key.target, rim)
        const model = new THREE.Group()
        scene.add(model)
        const lifters: { mesh: THREE.Object3D; lift: number }[] = []
        const anchors: Record<string, { p: THREE.Vector3; lift: number }> = {}
        const shellMats: THREE.MeshStandardMaterial[] = []
        const edgeMats: { m: THREE.LineBasicMaterial; shell: boolean }[] = []
        const overlay: { m: THREE.LineBasicMaterial | THREE.MeshBasicMaterial; base: number; phase: "ground" | "dims" }[] = []
        let bin = new THREE.Box3(), unit = new THREE.Box3(), open = new THREE.Box3()
        const dimPts: THREE.Vector3[] = []
        let levelTop = new THREE.Vector3()
        const t0 = performance.now()

        new GLTFLoader().load(url, (gltf: any) => {
            if (cancelled) return
            const meshes: THREE.Mesh[] = []
            gltf.scene.traverse((o: any) => o.isMesh && meshes.push(o))
            gltf.scene.updateMatrixWorld(true)
            const union = (test: (m: THREE.Mesh) => boolean) => {
                const b = new THREE.Box3()
                meshes.forEach((m) => test(m) && b.union(new THREE.Box3().setFromObject(m)))
                return b
            }
            meshes.forEach((m: any) => {
                const role = (Array.isArray(m.material) ? m.material[0] : m.material)?.name || "settBin"
                m.userData.role = role
                const shell = SHELL.test(role)
                const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(COLORS[role] || COLORS.settBin), roughness: 0.9, metalness: 0, flatShading: true, transparent: shell })
                if (shell) shellMats.push(mat)
                m.material = mat
                m.castShadow = m.receiveShadow = true
                // the blueprint: every part's hard edges, in the homepage's wireframe blue
                const lm = new THREE.LineBasicMaterial({ color: WIRE, transparent: true, opacity: 0.3, depthWrite: false })
                edgeMats.push({ m: lm, shell })
                const lines = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 24), lm)
                lines.renderOrder = 2
                m.add(lines)
                const L = LIFT.find((l) => l[0].test(m.name))
                if (L) {
                    const bb = new THREE.Box3().setFromObject(m)
                    lifters.push({ mesh: m, lift: L[1] + (bb.min.y > -50 ? L[2] : 0) })
                }
            })
            model.add(gltf.scene)
            bin = union((m) => /^BAK/.test(m.name))
            unit = new THREE.Box3().setFromObject(model)
            open = unit.clone()
            open.max.y += 170
            const top = (b: THREE.Box3) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2)
            const lifted = (re: RegExp) => lifters.find((l) => re.test(l.mesh.name))?.lift ?? 0
            const pole = union((m) => m.userData.role === "chargePole")
            const part = union((m) => /^schot/.test(m.name))
            anchors.batteries = { p: top(union((m) => /^accu/.test(m.name))), lift: 150 }
            anchors.blocks = { p: top(union((m) => /^Block_large/.test(m.name))), lift: 112 }
            anchors.inverter = { p: top(union((m) => /^Inverter/.test(m.name))), lift: lifted(/^Inverter/) }
            anchors.cooling = { p: top(union((m) => /^Cooling/.test(m.name))), lift: lifted(/^Cooling/) }
            anchors.partition = { p: new THREE.Vector3((part.min.x + part.max.x) / 2, part.max.y, part.max.z - 2), lift: 0 }
            anchors.pole = { p: new THREE.Vector3((pole.min.x + pole.max.x) / 2, pole.min.y + (pole.max.y - pole.min.y) * 0.72, pole.max.z), lift: 0 }
            anchors.vent = { p: top(union((m) => /^Exhaust/.test(m.name))), lift: 0 }
            anchors.corner = { p: new THREE.Vector3(bin.max.x, bin.max.y, bin.max.z), lift: 0 }
            anchors.enclosure = { p: new THREE.Vector3(bin.max.x, (bin.min.y + bin.max.y) / 2, (bin.min.z + bin.max.z) / 2 + 90), lift: 0 }
            anchors.ribs = { p: new THREE.Vector3(bin.min.x - 6, (bin.min.y + bin.max.y) / 2, (bin.min.z + bin.max.z) / 2 - 60), lift: 0 }

            const c = bin.getCenter(new THREE.Vector3())
            const size = unit.getSize(new THREE.Vector3()).length()
            const gy = bin.max.y + 0.5 // ±0,00: the unit's lid is flush with the paving
            // the ground as a blueprint: a see-through plane with a fading grid, the pit cut out
            const G = 1024
            const cv = document.createElement("canvas")
            cv.width = cv.height = G
            const cx = cv.getContext("2d")!
            const S = size * 3.2
            const px = (w: number) => (w / S) * G
            cx.strokeStyle = "rgba(191,228,255,0.55)"
            cx.lineWidth = 1.2
            for (let i = 0; i <= G; i += px(50)) {
                cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i, G); cx.stroke()
                cx.beginPath(); cx.moveTo(0, i); cx.lineTo(G, i); cx.stroke()
            }
            cx.globalCompositeOperation = "destination-in"
            const rg = cx.createRadialGradient(G / 2, G / 2, G * 0.08, G / 2, G / 2, G / 2)
            rg.addColorStop(0, "rgba(0,0,0,1)")
            rg.addColorStop(1, "rgba(0,0,0,0)")
            cx.fillStyle = rg
            cx.fillRect(0, 0, G, G)
            const shape = new THREE.Shape()
            shape.moveTo(-S / 2, -S / 2); shape.lineTo(S / 2, -S / 2); shape.lineTo(S / 2, S / 2); shape.lineTo(-S / 2, S / 2); shape.lineTo(-S / 2, -S / 2)
            const hole = new THREE.Path()
            hole.moveTo(bin.min.x - c.x - 2, bin.min.z - c.z - 2); hole.lineTo(bin.max.x - c.x + 2, bin.min.z - c.z - 2); hole.lineTo(bin.max.x - c.x + 2, bin.max.z - c.z + 2); hole.lineTo(bin.min.x - c.x - 2, bin.max.z - c.z + 2)
            // no hole: the grid runs over the unit, so it reads as under the surface
            void hole
            const gGeo = new THREE.ShapeGeometry(shape)
            gGeo.rotateX(Math.PI / 2)
            const uv = gGeo.attributes.uv
            for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + S / 2) / S, (uv.getY(i) + S / 2) / S)
            const gridMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, side: THREE.DoubleSide })
            overlay.push({ m: gridMat, base: 0.9, phase: "ground" })
            const grid = new THREE.Mesh(gGeo, gridMat)
            grid.position.set(c.x, gy, c.z)
            scene.add(grid)
            // a faint surface over it, so what's below reads as below
            const fillMat = new THREE.MeshBasicMaterial({ color: "#16284A", transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })
            overlay.push({ m: fillMat, base: 0.35, phase: "ground" })
            const fill = new THREE.Mesh(gGeo, fillMat)
            fill.position.set(c.x, gy - 0.3, c.z)
            scene.add(fill)
            // the pit, as a section outline under the surface
            const pitGeo = new THREE.BoxGeometry(bin.max.x - bin.min.x + 30, gy - bin.min.y + 24, bin.max.z - bin.min.z + 30)
            const pitMat = new THREE.LineBasicMaterial({ color: WIRE, transparent: true, opacity: 0.5, depthWrite: false })
            overlay.push({ m: pitMat, base: 0.5, phase: "ground" })
            const pit = new THREE.LineSegments(new THREE.EdgesGeometry(pitGeo), pitMat)
            pit.position.set(c.x, (gy + bin.min.y - 24) / 2, c.z)
            scene.add(pit)
            // dimension lines along three edges of the bin, with end ticks
            const off = 36
            const A = new THREE.Vector3(bin.min.x - off, bin.min.y, bin.min.z), B = new THREE.Vector3(bin.min.x - off, bin.min.y, bin.max.z) // length (z)
            const C2 = new THREE.Vector3(bin.min.x, bin.min.y, bin.max.z + off), D = new THREE.Vector3(bin.max.x, bin.min.y, bin.max.z + off) // width (x)
            const E = new THREE.Vector3(bin.max.x + off, bin.min.y, bin.max.z + off), F = new THREE.Vector3(bin.max.x + off, gy, bin.max.z + off) // depth (y)
            const seg: number[] = []
            const tick = 10
            ;[[A, B, "x"], [C2, D, "z"], [E, F, "x"]].forEach(([a, b, ax]: any) => {
                seg.push(a.x, a.y, a.z, b.x, b.y, b.z)
                for (const q of [a, b]) {
                    if (ax === "x") seg.push(q.x - tick, q.y, q.z, q.x + tick, q.y, q.z)
                    else seg.push(q.x, q.y, q.z - tick, q.x, q.y, q.z + tick)
                }
            })
            const dg = new THREE.BufferGeometry()
            dg.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3))
            const dimMat = new THREE.LineBasicMaterial({ color: WIRE, transparent: true, opacity: 0.9, depthWrite: false })
            overlay.push({ m: dimMat, base: 0.9, phase: "dims" })
            const dims = new THREE.LineSegments(dg, dimMat)
            dims.renderOrder = 3
            scene.add(dims)
            dimPts.push(A.clone().lerp(B, 0.5), C2.clone().lerp(D, 0.5), E.clone().lerp(F, 0.5))
            levelTop = new THREE.Vector3(bin.min.x - 160, gy, bin.min.z - 120)
            // light and shadows sized to the unit
            key.position.set(c.x - size * 0.6, c.y + size * 1.4, c.z - size * 0.8)
            key.target.position.copy(c)
            const sc = key.shadow.camera as THREE.OrthographicCamera
            sc.left = sc.bottom = -size
            sc.right = sc.top = size
            sc.near = 10
            sc.far = size * 5
            sc.updateProjectionMatrix()
            rim.position.set(c.x + size, c.y + size * 0.5, c.z + size)
            ready = true
            resize()
        })

        // ---------------------------------------------------------------- camera
        type Key = { az: number; el: number; dist: number; tx: number; ty: number; tz: number }
        const dirOf = (az: number, el: number) => {
            const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el)
            return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e))
        }
        const mix = (a: Key, b: Key, k: number): Key => ({ az: a.az + (b.az - a.az) * k, el: a.el + (b.el - a.el) * k, dist: a.dist + (b.dist - a.dist) * k, tx: a.tx + (b.tx - a.tx) * k, ty: a.ty + (b.ty - a.ty) * k, tz: a.tz + (b.tz - a.tz) * k })
        let w0 = 1, h0 = 1
        // a box fitted into part of the frame: its centre at (wantX, wantY) in NDC
        function fit(b: THREE.Box3, az: number, el: number, fillW: number, fillH: number, wantX: number, wantY: number): Key {
            const corners: THREE.Vector3[] = []
            for (let i = 0; i < 8; i++) corners.push(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z))
            const dir = dirOf(az, el)
            const target = b.getCenter(new THREE.Vector3())
            let dist = b.getSize(new THREE.Vector3()).length() * 1.4
            camera.aspect = w0 / h0
            camera.updateProjectionMatrix()
            for (let it = 0; it < 14; it++) {
                camera.position.copy(target).addScaledVector(dir, dist)
                camera.lookAt(target)
                camera.updateMatrixWorld(true)
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
                corners.forEach((q) => {
                    const r = q.clone().project(camera)
                    x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x); y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y)
                })
                const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist, halfW = halfH * camera.aspect
                const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
                const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
                target.addScaledVector(right, ((x0 + x1) / 2 - wantX) * halfW).addScaledVector(up, ((y0 + y1) / 2 - wantY) * halfH)
                dist *= 0.4 + 0.6 * Math.max((x1 - x0) / 2 / fillW, (y1 - y0) / 2 / fillH)
            }
            return { az, el, dist, tx: target.x, ty: target.y, tz: target.z }
        }
        let K: Record<"hero" | "shell" | "open" | "specs" | "side", Key> | null = null
        let fitSpec: [number, number, number, number] = [0.52, 0.77, -0.36, -0.04]
        function keys() {
            if (K) return K
            const portrait = w0 < h0
            // the pit is part of the unit's picture: from the lid down to below the bin
            const withPit = unit.clone()
            withPit.min.y = Math.min(withPit.min.y, bin.min.y - 30)
            K = portrait
                ? { hero: fit(withPit, 220, 24, 0.86, 0.3, 0, 0.36), shell: fit(withPit, 210, 30, 0.9, 0.36, 0, 0.2), open: fit(open, 202, 22, 0.94, 0.4, 0, 0.18), specs: fit(open, 150, 20, 0.96, 0.4, 0, 0.26), side: fit(open, 112, 14, 0.98, 0.42, 0, 0.26) }
                : { hero: fit(withPit, 220, 24, 0.6, 0.66, 0.36, 0.0), shell: fit(withPit, 210, 30, 0.62, 0.62, 0.3, -0.12), open: fit(open, 202, 22, 0.64, 0.72, 0.3, -0.1), specs: fit(open, 150, 20, 0.52, 0.76, -0.36, -0.04), side: fit(open, 112, 14, 0.52, 0.78, -0.36, -0.04) }
            fitSpec = portrait ? [0.96, 0.4, 0, 0.26] : [0.52, 0.77, -0.36, -0.04]
            return K
        }
        const tmp = new THREE.Vector3()
        const place = (el: HTMLElement | null, pnt: THREE.Vector3, op: number) => {
            if (!el) return
            tmp.copy(pnt).project(camera)
            el.style.left = ((tmp.x + 1) / 2) * w0 + "px"
            el.style.top = ((1 - tmp.y) / 2) * h0 + "px"
            el.style.opacity = String(tmp.z < 1 ? op : 0)
        }
        function draw(now: number) {
            if (!ready) return
            const k = still ? 0 : tRef.current
            const Kk = keys()
            // acts: .00–.12 de Sett · .12–.34 röntgen · .36–.58 open · .62–1 specs
            const xr = ease(range(k, 0.12, 0.32))
            const ex = ease(range(k, 0.36, 0.56))
            const turn = ease(range(k, 0.6, 0.72))
            let cam = mix(Kk.hero, Kk.shell, xr)
            cam = mix(cam, Kk.open, ex)
            // the specs: the unit keeps turning towards its side, framed afresh each
            // frame so it holds its place left of the spec list the whole way round
            if (turn > 0) {
                const sk = ease(range(k, 0.72, 1))
                const S0 = Kk.specs, S1 = Kk.side
                const live = fit(open, S0.az + (S1.az - S0.az) * sk, S0.el + (S1.el - S0.el) * sk, fitSpec[0], fitSpec[1], fitSpec[2], fitSpec[3])
                cam = mix(cam, live, turn)
            }
            // a slow sway while the unit is on show
            const sway = still ? 0 : Math.sin((now - t0) / 4200) * 5 * (1 - 0.7 * ex)
            const dir = dirOf(cam.az + sway, cam.el)
            const target = new THREE.Vector3(cam.tx, cam.ty, cam.tz)
            camera.position.copy(target).addScaledVector(dir, cam.dist)
            camera.lookAt(target)
            camera.updateMatrixWorld(true)
            // the shell goes to wireframe; the blueprint lines brighten on it
            shellMats.forEach((m) => {
                m.opacity = 1 - 0.9 * xr
                m.depthWrite = m.opacity > 0.6
            })
            edgeMats.forEach((e) => (e.m.opacity = e.shell ? 0.3 + 0.6 * xr : 0.18 + 0.2 * xr * (1 - ex)))
            // ground grid and pit stay; the dimension lines belong to the first look
            const dimsOn = 1 - ease(range(k, 0.3, 0.4))
            overlay.forEach((o) => (o.m.opacity = o.base * (o.phase === "dims" ? dimsOn : 1 - 0.45 * ex)))
            lifters.forEach((l) => (l.mesh.position.y = l.lift * ex))
            renderer.render(scene, camera)
            // HTML labels: dimensions, then part names, then the spec pins
            dimsRef.current.slice(0, 3).forEach((el, i) => place(el, dimPts[i], dimsOn))
            place(dimsRef.current[3], levelTop, dimsOn)
            const partsOn = ease(range(k, 0.46, 0.52)) * (1 - ease(range(k, 0.6, 0.64)))
            partsRef.current.forEach((el, i) => {
                const a = anchors[PARTS[i]?.[0]]
                if (a) place(el, tmp.copy(a.p).setY(a.p.y + a.lift * ex).clone(), partsOn)
            })
            const active = k < 0.7 ? -1 : Math.min(specs.length - 1, Math.floor(range(k, 0.7, 0.99) * specs.length))
            tagsRef.current.forEach((el, i) => {
                const a = anchors[ANCHOR_ORDER[i]]
                if (a) place(el, tmp.copy(a.p).setY(a.p.y + a.lift * ex).clone(), active === i ? 1 : k > 0.7 ? 0.28 : 0)
                el?.classList.toggle("on", active === i)
            })
        }
        function resize() {
            w0 = box!.clientWidth
            h0 = box!.clientHeight
            if (!w0 || !h0) return
            renderer.setSize(w0, h0, false)
            camera.aspect = w0 / h0
            camera.updateProjectionMatrix()
            K = null
            draw(performance.now())
        }
        const ro = new ResizeObserver(resize)
        ro.observe(box)
        let visible = true, last = 0
        const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting))
        io.observe(box)
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop)
            if (!visible || document.hidden || now - last < 30) return
            last = now
            draw(now)
        }
        raf = requestAnimationFrame(loop)
        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            gl.release(scene)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.model])

    const heroOut = ease(range(t, 0.08, 0.16))
    const shellIn = ease(range(t, 0.2, 0.26)) * (1 - ease(range(t, 0.34, 0.38)))
    const partsIn = ease(range(t, 0.46, 0.52)) * (1 - ease(range(t, 0.6, 0.64)))
    const specsIn = ease(range(t, 0.66, 0.72))
    const active = t < 0.7 ? -1 : Math.min(specs.length - 1, Math.floor(range(t, 0.7, 0.99) * specs.length))
    const chapters = [range(t, 0, 0.12), range(t, 0.12, 0.34), range(t, 0.34, 0.6), range(t, 0.6, 1)]
    const dims = ["4 m", "1,5 m", "0,7 m diep", "±0,00 maaiveld"]
    return (
        <section ref={root} className="v2" style={{ height: "540vh", ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2x-stage">
                <div className="v2-grain" />
                <div ref={host} className="v2x-canvas" />
                {dims.map((d, i) => (
                    <div key={d} ref={(e) => (dimsRef.current[i] = e)} className={"v2x-dim" + (i === 3 ? " lvl" : "")} style={{ opacity: 0 }}>
                        {d}
                    </div>
                ))}
                {PARTS.map(([, name], i) => (
                    <div key={name} ref={(e) => (partsRef.current[i] = e)} className="v2x-tag" style={{ opacity: 0 }}>
                        <i />
                        <em>{name}</em>
                    </div>
                ))}
                {specs.map((s, i) => (
                    <div key={i} ref={(e) => (tagsRef.current[i] = e)} className="v2x-tag" style={{ opacity: 0 }}>
                        <i />
                        {active === i && <em>{s.title}</em>}
                    </div>
                ))}
                <div className="v2x-meta v2-wrap v2-mono" style={{ opacity: 1 - heroOut }}>
                    <span>Sett 96 — technische tekening</span>
                    <span>4 × 1,5 × 0,7 m</span>
                    <span>Blad 01 / 04</span>
                </div>
                <div ref={hero} className="v2x-hero v2-wrap" style={{ opacity: 1 - heroOut, transform: `translateY(${-heroOut * 80}px)`, pointerEvents: heroOut > 0.5 ? "none" : undefined }}>
                    <div className="v2x-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Wat is Sett?")}</div>
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "Energie hoort|onder de grond.")} />
                    </h1>
                    <div className="v2x-row v2-fade">
                        <p className="v2-lead">{or(p.lead, "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt.")}</p>
                        <div className="v2x-btns">
                            {p.primary !== "" && (
                                <a className="v2-btn lime" href={or(p.primaryLink, "/pre-order")}>
                                    {p.primary ?? "Bestel jouw Sett"} <Arrow />
                                </a>
                            )}
                            {p.secondary !== "" && (
                                <a className="v2-btn line" href={or(p.secondaryLink, V.phone)}>
                                    {p.secondary ?? "Bel direct"}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="v2x-line v2-wrap" style={{ opacity: shellIn, transform: `translateY(${(1 - shellIn) * 24}px)` }}>
                    <div className="v2-mono">Röntgen</div>
                    <p className="v2-h2">{or(p.shellLine, "Eén stalen bak. Een complete energiehub.")}</p>
                </div>
                <div className="v2x-line v2-wrap" style={{ opacity: partsIn, transform: `translateY(${(1 - partsIn) * 24}px)` }}>
                    <div className="v2-mono">Binnenin</div>
                    <p className="v2-h2">{or(p.partsLine, "Accu, omvormer, koeling: alles zit erin.")}</p>
                </div>
                <div className="v2x-line v2-wrap" style={{ opacity: specsIn * (active < 0 ? 1 : 1), transform: `translateY(${(1 - specsIn) * 24}px)` }}>
                    <div className="v2-mono">Specificaties</div>
                    <p className="v2-h2" style={{ maxWidth: "9ch" }}>{or(p.specsLine, "Sett 96, in cijfers.")}</p>
                </div>
                <ol className="v2x-specs" style={{ opacity: specsIn }}>
                    {specs.map((s, i) => (
                        <li key={i} className={active === i ? "on" : ""} style={{ opacity: active === i ? 1 : 0.4, color: active === i ? V.lime : V.text }}>
                            <b>{s.title}</b>
                            <span>{s.value}</span>
                        </li>
                    ))}
                </ol>
                <div className="v2x-steps" aria-hidden="true" style={{ opacity: heroOut }}>
                    {["De Sett", "Röntgen", "Binnenin", "Specs"].map((n, i) => (
                        <span key={n}>
                            <i>
                                <b style={{ width: chapters[i] * 100 + "%" }} />
                            </i>
                            {n}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

SettV2Xray.displayName = "Sett V2 · Anatomie"

addPropertyControls(SettV2Xray, {
    model: { type: ControlType.File, title: "Model", allowedFileTypes: ["glb"], description: "sett-box.glb" },
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Wat is Sett?" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Energie hoort|onder de grond." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bestel jouw Sett" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/pre-order" },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Bel direct" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", defaultValue: V.phone },
    shellLine: { type: ControlType.String, title: "Tekst röntgen", displayTextArea: true, defaultValue: "Eén stalen bak. Een complete energiehub." },
    partsLine: { type: ControlType.String, title: "Tekst binnenin", displayTextArea: true, defaultValue: "Accu, omvormer, koeling: alles zit erin." },
    specsLine: { type: ControlType.String, title: "Tekst specs", displayTextArea: true, defaultValue: "Sett 96, in cijfers." },
    specs: {
        type: ControlType.Array,
        title: "Specificaties",
        maxCount: 10,
        control: { type: ControlType.Object, controls: { title: { type: ControlType.String, title: "Naam" }, value: { type: ControlType.String, title: "Waarde" } } },
    },
})
