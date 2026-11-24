// Sett V2 Descent — the street, then what's under it. The same sunny 3D street
// as the page heroes (sett-hero-particulieren.glb, same light and sky); the
// section pins and scrolling runs four chapters:
//   1 straat         the street and the headline
//   2 onder de grond the camera swings round and sinks to ground level; a
//                    section cut sweeps through the driveway, the soil layers
//                    show, the sky fades out: we're below the surface
//   3 binnenin       the Sett opens up, its key specs tagged one by one
//   4 terug          the ground closes, the sky returns: "Bovengronds: alleen
//                    een laadpaal."

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import * as THREE from "https://esm.sh/three@0.185.1"
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js"
import { glTrack } from "./SettGL.tsx"
import { V2Style, Lines, useReveal, pinProgress, onScrollFrame, onCanvas, ease, range, Arrow, V, or } from "./SettV2Kit.tsx"

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
    underLabel?: string
    underTitle?: string
    insideTitle?: string
    specs?: Spec[]
    endTitle?: string
    style?: React.CSSProperties
}
const SPECS: Spec[] = [
    { title: "Accu capaciteit", value: "96 kWh LiFePO4" },
    { title: "Max load", value: "50 kW (meer bij meer boxen)" },
    { title: "Laadpunten", value: "2× 11 kW of 1× 22 kW" },
    { title: "Netaansluiting", value: "tot 3×50A (klein)" },
    { title: "Afmetingen", value: "4 × 1,5 × 0,7 m" },
]
const ANCHORS = ["batteries", "blocks", "pole", "inverter", "bin"]
const SURFACES: Record<string, string> = { lawn: "#C9D4B8", paving: "#D6CFC2", pavement: "#D9D6CF", road: "#8E9199", pathway: "#BCB8AE" }
const GROUND = /^(lawn|paving|pavement|road|pathway)$/
const LIFT: [RegExp, number, number][] = [
    [/^accu/, 120, 30],
    [/^Block_large/, 88, 24],
    [/^Inverter/, 46, 0],
    [/^Cooling/, 96, 0],
]
// the soil under the street, top down: paving bed, sand, clay
const STRATA: [number, number, string][] = [
    [-3.5, -14, "#8C8577"],
    [-14, -74, "#D8C39A"],
    [-74, -190, "#A57B57"],
]
const SETT_PART = /^(BAK|accu|Block_large|Inverter|Cooling|schot|Exhaust)/
const ENERGY_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const ENERGY_FRAG = `uniform vec3 uColor; uniform float uTime; uniform float uPulses; varying vec2 vUv;
void main(){ float pulse = pow(0.5 + 0.5 * sin(vUv.x * uPulses - uTime * 2.6), 3.0); gl_FragColor = vec4(uColor * (0.9 + 0.45 * pulse), 0.62 + 0.38 * pulse); }`

const CSS = `
.v2e-stage{ position:sticky; top:0; height:100vh; min-height:560px; overflow:hidden; }
.v2e-sky{ position:absolute; inset:0; background:radial-gradient(42% 50% at 84% 10%, rgba(252,240,215,.95), rgba(255,255,255,0) 70%), linear-gradient(180deg, #4A99F1 0%, #BBDAF4 45%, #FCF0D7 78%); }
.v2e-dark{ position:absolute; inset:0; background:radial-gradient(80% 60% at 50% 60%, ${V.ink2}, ${V.ink} 70%); }
.v2e-canvas{ position:absolute; inset:0; }
.v2e-scrim{ position:absolute; inset:0; pointer-events:none; background:linear-gradient(90deg, rgba(6,12,26,.62) 0%, rgba(6,12,26,.34) 34%, rgba(6,12,26,0) 62%); }
.v2e-fade{ position:absolute; left:0; right:0; bottom:0; height:22%; pointer-events:none; background:linear-gradient(0deg, ${V.ink}, rgba(6,12,26,0)); }
.v2e-hero{ position:absolute; left:0; right:0; bottom:clamp(64px, 13vh, 118px); z-index:3; }
.v2e-hero .v2-display{ max-width:9ch; font-size:clamp(42px, min(7.6cqi, 12vh), 136px); text-shadow:0 2px 30px rgba(0,0,0,.18); }
.v2e-row{ display:flex; flex-direction:column; align-items:flex-start; gap:clamp(14px, 3vh, 24px); margin-top:clamp(16px, 3.4vh, 28px); }
.v2e-btns{ display:flex; gap:12px; flex-wrap:wrap; }
.v2e-eyebrow{ display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:${V.lime}; }
.v2e-eyebrow::before{ content:""; width:8px; height:8px; border-radius:99px; background:${V.lime}; box-shadow:0 0 18px ${V.lime}; }
.v2e-meta{ position:absolute; left:0; right:0; top:clamp(88px, 15vh, 118px); z-index:3; display:flex; justify-content:space-between; }
.v2e-ch{ position:absolute; left:0; right:0; z-index:3; pointer-events:none; }
.v2e-ch.top{ top:clamp(90px, 16vh, 120px); }
.v2e-ch.bottom{ bottom:110px; }
.v2e-ch .v2-h2{ max-width:15ch; text-shadow:0 2px 24px rgba(0,0,0,.35); font-size:clamp(30px, min(4.4cqi, 8vh), 76px); }
.v2e-specs{ position:absolute; right:56px; bottom:96px; z-index:3; width:min(380px, 34vw); pointer-events:none; padding:10px 22px; border-radius:22px; background:rgba(6,12,26,.74); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
.v2e-specs li:last-child{ border-bottom:0; }
.v2e-specs li{ display:flex; justify-content:space-between; gap:14px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.12); transition:opacity .35s, color .35s; }
.v2e-specs li b{ font-weight:700; font-size:15px; }
.v2e-specs li span{ font-family:"Sett Mono","Geist Mono",monospace; font-size:12px; color:rgba(255,255,255,.72); text-align:right; }
.v2e-tag{ position:absolute; z-index:3; transform:translate(-50%,-50%); pointer-events:none; transition:opacity .3s; }
.v2e-tag i{ display:block; width:12px; height:12px; border-radius:99px; background:${V.lime}; box-shadow:0 0 0 6px rgba(223,255,0,.2), 0 0 22px ${V.lime}; }
.v2e-tag em{ position:absolute; left:20px; top:-7px; white-space:nowrap; font:600 12px "Sett Mono","Geist Mono",monospace; font-style:normal; letter-spacing:.08em; text-transform:uppercase; color:${V.lime}; text-shadow:0 1px 8px rgba(0,0,0,.6); }
.v2e-level{ position:absolute; z-index:3; left:0; right:0; pointer-events:none; }
.v2e-level .v2-level{ color:${V.lime}; }
.v2e-steps{ position:absolute; left:56px; bottom:44px; z-index:3; display:flex; gap:22px; }
.v2e-steps span{ font:600 11px "Sett Mono","Geist Mono",monospace; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.6); display:flex; flex-direction:column; gap:8px; }
.v2e-steps span i{ display:block; width:64px; height:2px; background:rgba(255,255,255,.2); }
.v2e-steps span i b{ display:block; height:100%; background:${V.lime}; }
@media (max-height: 640px){ .v2e-hero .v2-lead{ display:none; } }
@container (max-width: 900px){
  .v2e-meta > :nth-child(n+2), .v2e-steps{ display:none; }
  .v2e-specs{ left:22px; right:22px; width:auto; bottom:90px; }
  .v2e-specs li:not(.on){ display:none; }
  .v2e-tag em{ display:none; }
  .v2e-hero{ bottom:80px; }
}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettV2Descent(props: Props) {
    const p = props
    const specs = (p.specs && p.specs.length ? p.specs : SPECS).slice(0, 5)
    const root = useRef<HTMLDivElement>(null)
    const host = useRef<HTMLDivElement>(null)
    const hero = useRef<HTMLDivElement>(null)
    const levelRef = useRef<HTMLDivElement>(null)
    const tagsRef = useRef<(HTMLDivElement | null)[]>([])
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
        let cancelled = false, raf = 0, ready = false
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        const gl = glTrack(renderer) // so the renderer can go completely when this unmounts
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.95
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap
        renderer.localClippingEnabled = true
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.cssText = "display:block;width:100%;height:100%"
        box.appendChild(renderer.domElement)
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(30, 1, 5, 40000)
        scene.add(new THREE.HemisphereLight(0xf6f5f2, 0xcdb98d, 1.25))
        const key = new THREE.DirectionalLight(0xfff7e6, 2.5)
        key.castShadow = true
        key.shadow.mapSize.set(2048, 2048)
        key.shadow.bias = -0.0003
        key.shadow.normalBias = 0.8
        key.shadow.radius = 4
        const rim = new THREE.DirectionalLight(0xfff1de, 0.5)
        const fill = new THREE.DirectionalLight(0xfff2da, 0.35)
        scene.add(key, key.target, rim, rim.target, fill, fill.target)
        const cut = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
        const clipped: THREE.Material[] = []
        const energy: THREE.ShaderMaterial[] = []
        const lifters: { o: THREE.Object3D; lift: number }[] = []
        const anchors: Record<string, { p: THREE.Vector3; lift: number }> = {}
        const focus = new THREE.Box3()
        let sett = new THREE.Box3()
        const soil: THREE.Mesh[] = []
        let cutX = 0
        const t0 = performance.now()

        new GLTFLoader().load(url, (gltf: any) => {
            if (cancelled) return
            const r = gltf.scene
            r.updateMatrixWorld(true)
            r.traverse((o: any) => {
                if (o.userData && o.userData.frame && focus.isEmpty()) focus.set(new THREE.Vector3().fromArray(o.userData.frame.min), new THREE.Vector3().fromArray(o.userData.frame.max))
                if (!o.isMesh) return
                const m = o.material
                const name = (m && m.name) || ""
                if (/^energy_/.test(name)) {
                    const col = new THREE.Color(/solar/.test(name) ? V.sun : V.green)
                    if (!/_(bead|cable|dot|ring)$/.test(name) && o.geometry.attributes.uv) {
                        const sm = new THREE.ShaderMaterial({ uniforms: { uColor: { value: col }, uTime: { value: 0 }, uPulses: { value: Math.max(6, Math.round(((o.userData && o.userData.length) || 600) / 55)) } }, vertexShader: ENERGY_VERT, fragmentShader: ENERGY_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, clipping: true, clippingPlanes: [cut] })
                        o.material = sm
                        energy.push(sm)
                    } else o.material = new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: /_ring$/.test(name), opacity: /_ring$/.test(name) ? 0 : 1, clippingPlanes: [cut] })
                    o.castShadow = false
                    o.renderOrder = 3
                    return
                }
                const nm = new THREE.MeshStandardMaterial({ color: SURFACES[name] ? new THREE.Color(SURFACES[name]) : m.color ? m.color.clone() : new THREE.Color("#ccc"), roughness: 1, metalness: 0, flatShading: true, transparent: name === "windows", opacity: name === "windows" ? 0.9 : 1 })
                nm.name = name
                // the section cuts through everything but the Sett itself
                if (!SETT_PART.test(o.name)) {
                    nm.clippingPlanes = [cut]
                    nm.side = THREE.DoubleSide
                    clipped.push(nm)
                }
                o.castShadow = !GROUND.test(name)
                o.receiveShadow = true
                o.material = nm
                const L = LIFT.find((l) => l[0].test(o.name))
                if (L) {
                    const bb = new THREE.Box3().setFromObject(o)
                    lifters.push({ o, lift: L[1] + (bb.min.y > -50 ? L[2] : 0) })
                }
                if (SETT_PART.test(o.name)) sett.union(new THREE.Box3().setFromObject(o))
            })
            scene.add(r)
            if (focus.isEmpty()) focus.setFromObject(r)
            const u = (re: RegExp) => {
                const b = new THREE.Box3()
                r.traverse((o: any) => o.isMesh && re.test(o.name) && b.union(new THREE.Box3().setFromObject(o)))
                return b
            }
            const top = (b: THREE.Box3) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2)
            const pole = new THREE.Box3()
            r.traverse((o: any) => o.isMesh && o.material.name === "chargePole" && pole.union(new THREE.Box3().setFromObject(o)))
            anchors.batteries = { p: top(u(/^accu/)), lift: 150 }
            anchors.blocks = { p: top(u(/^Block_large/)), lift: 112 }
            anchors.inverter = { p: top(u(/^Inverter/)), lift: 46 }
            anchors.pole = { p: new THREE.Vector3((pole.min.x + pole.max.x) / 2, pole.min.y + (pole.max.y - pole.min.y) * 0.75, (pole.min.z + pole.max.z) / 2), lift: 0 }
            anchors.bin = { p: new THREE.Vector3(sett.max.x, sett.min.y + 20, (sett.min.z + sett.max.z) / 2), lift: 0 }
            // the ground: a big fading disc, and the soil in layers below it (both cut too)
            const c = sett.getCenter(new THREE.Vector3())
            const span = focus.getSize(new THREE.Vector3())
            const fade = document.createElement("canvas")
            fade.width = fade.height = 512
            const fx = fade.getContext("2d")!
            const gr = fx.createRadialGradient(256, 256, 60, 256, 256, 256)
            gr.addColorStop(0, "#fff")
            gr.addColorStop(0.5, "#fff")
            gr.addColorStop(1, "#000")
            fx.fillStyle = gr
            fx.fillRect(0, 0, 512, 512)
            const S = Math.max(span.x, span.z) * 5
            // keep the disc off the pit, or it veils the unit
            const toPx = (wx: number, wz: number) => [((wx - c.x) / S + 0.5) * 512, ((wz - c.z) / S + 0.5) * 512]
            const a = toPx(sett.min.x - 8, sett.min.z - 8), b2 = toPx(sett.max.x + 8, sett.max.z + 8)
            fx.fillStyle = "#000"
            fx.fillRect(Math.min(a[0], b2[0]), Math.min(a[1], b2[1]), Math.abs(b2[0] - a[0]) + 1, Math.abs(b2[1] - a[1]) + 1)
            const gm = new THREE.MeshStandardMaterial({ color: SURFACES.lawn, roughness: 1, alphaMap: new THREE.CanvasTexture(fade), transparent: true, clippingPlanes: [cut] })
            clipped.push(gm)
            const disc = new THREE.Mesh(new THREE.PlaneGeometry(S, S), gm)
            disc.rotation.x = -Math.PI / 2
            disc.position.set(c.x, -3, c.z)
            disc.receiveShadow = true
            disc.renderOrder = -1
            scene.add(disc)
            // the soil, as it shows on the section face: layers round the unit's pit
            // (the face lies on the Sett's long side, x = sett.max.x; nothing is in front)
            cutX = sett.max.x + 1
            const Dz = span.z * 0.55, back = cutX - span.x * 0.9
            const px0 = sett.min.x - 2, pz0 = sett.min.z - 2, pz1 = sett.max.z + 2
            const piece = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: string) => {
                if (x1 - x0 < 1 || y0 - y1 < 1 || z1 - z0 < 1) return
                const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y0 - y1, z1 - z0), new THREE.MeshStandardMaterial({ color: col, roughness: 1, flatShading: true }))
                m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
                m.receiveShadow = true
                m.visible = false
                soil.push(m)
                scene.add(m)
            }
            for (const [y0, y1, col] of STRATA) {
                // behind the pit: whole layers
                piece(back, px0, y0, y1, c.z - Dz, c.z + Dz, col)
                if (y1 >= sett.min.y - 1) {
                    // beside the pit
                    piece(px0, cutX, y0, y1, c.z - Dz, pz0, col)
                    piece(px0, cutX, y0, y1, pz1, c.z + Dz, col)
                } else {
                    // beside and under it
                    piece(px0, cutX, Math.min(y0, sett.min.y), y1, c.z - Dz, c.z + Dz, col)
                    piece(px0, cutX, y0, sett.min.y, c.z - Dz, pz0, col)
                    piece(px0, cutX, y0, sett.min.y, pz1, c.z + Dz, col)
                }
            }
            ready = true
            resize()
        })

        // ---------------------------------------------------------------- camera path
        const dirOf = (az: number, el: number) => {
            const A = THREE.MathUtils.degToRad(az), E = THREE.MathUtils.degToRad(el)
            return new THREE.Vector3(Math.sin(A) * Math.cos(E), Math.sin(E), -Math.cos(A) * Math.cos(E))
        }
        type Key = { az: number; el: number; dist: number; tx: number; ty: number; tz: number }
        const lerpKey = (a: Key, b: Key, k: number): Key => ({ az: a.az + (b.az - a.az) * k, el: a.el + (b.el - a.el) * k, dist: a.dist + (b.dist - a.dist) * k, tx: a.tx + (b.tx - a.tx) * k, ty: a.ty + (b.ty - a.ty) * k, tz: a.tz + (b.tz - a.tz) * k })
        let w0 = 1, h0 = 1
        // fits a box into the frame the way SettHero3D does: the box's projected
        // centre lands at (wantX, wantY) in NDC and it fills fillW × fillH of the frame
        function fit(box: THREE.Box3, az: number, el: number, fillW: number, fillH: number, wantX: number, wantY: number): Key {
            const corners: THREE.Vector3[] = []
            for (let i = 0; i < 8; i++) corners.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z))
            const dir = dirOf(az, el)
            const target = box.getCenter(new THREE.Vector3())
            let dist = box.getSize(new THREE.Vector3()).length() * 1.2
            camera.clearViewOffset()
            camera.aspect = w0 / h0
            camera.updateProjectionMatrix()
            for (let it = 0; it < 14; it++) {
                camera.position.copy(target).addScaledVector(dir, dist)
                camera.lookAt(target)
                camera.updateMatrixWorld(true)
                let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
                corners.forEach((c) => {
                    const q = c.clone().project(camera)
                    x0 = Math.min(x0, q.x)
                    x1 = Math.max(x1, q.x)
                    y0 = Math.min(y0, q.y)
                    y1 = Math.max(y1, q.y)
                })
                const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist, halfW = halfH * camera.aspect
                const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
                const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
                target.addScaledVector(right, ((x0 + x1) / 2 - wantX) * halfW).addScaledVector(up, ((y0 + y1) / 2 - wantY) * halfH)
                dist *= 0.4 + 0.6 * Math.max((x1 - x0) / 2 / fillW, (y1 - y0) / 2 / fillH)
            }
            return { az, el, dist, tx: target.x, ty: target.y, tz: target.z }
        }
        let K: { street: Key; under: Key; inside: Key } | null = null
        function keys() {
            if (K) return K
            const portrait = w0 < h0
            // 1 the street, framed as the page heroes frame it (the scene right of the headline)
            const street = portrait ? fit(focus, -30, 17, 0.92, 0.42, 0, 0.3) : fit(focus, -30, 17, 0.56, 0.66, 0.43, -0.06)
            // 2 at ground level, looking at the cut: the unit in its pit with soil round it
            const pit = sett.clone().expandByVector(new THREE.Vector3(0, 0, 200))
            pit.min.y = -190
            pit.max.y = 120
            const under = portrait ? fit(sett.clone().expandByVector(new THREE.Vector3(0, 0, 40)).union(new THREE.Box3(new THREE.Vector3(sett.min.x, -190, sett.min.z), new THREE.Vector3(sett.max.x, 120, sett.max.z))), 72, 6, 1.2, 0.36, 0, 0.02) : fit(pit, 72, 6, 0.5, 0.56, 0.22, -0.12)
            // 3 a little higher, over the opened unit (room for the lifted parts)
            const open = sett.clone()
            open.max.y += 160
            const inside = portrait ? fit(open, 58, 26, 1.1, 0.4, 0, 0) : fit(open, 58, 26, 0.44, 0.55, -0.16, -0.08)
            return (K = { street, under, inside })
        }
        const tmp = new THREE.Vector3()
        function draw(now: number) {
            if (!ready) return
            const k = reduced ? 0 : tRef.current
            const K = keys()
            const dive = ease(range(k, 0.14, 0.4))
            const open = ease(range(k, 0.5, 0.66))
            const rise = ease(range(k, 0.84, 1))
            let cam = lerpKey(K.street, K.under, dive)
            cam = lerpKey(cam, K.inside, ease(range(k, 0.46, 0.64)))
            cam = lerpKey(cam, K.street, rise)
            const dir = dirOf(cam.az, cam.el)
            const target = new THREE.Vector3(cam.tx, cam.ty, cam.tz)
            camera.position.copy(target).addScaledVector(dir, cam.dist)
            camera.lookAt(target)
            // the section: a vertical plane that sweeps in from the camera side and
            // stops on the Sett's long side; what's in front of it is cut away
            const cutK = ease(range(k, 0.2, 0.42)) * (1 - rise)
            cut.set(new THREE.Vector3(-1, 0, 0), THREE.MathUtils.lerp(focus.max.x + 1200, cutX, cutK))
            soil.forEach((m) => (m.visible = cutK > 0.001))
            const sc = sett.getCenter(new THREE.Vector3())
            lifters.forEach((l) => (l.o.position.y = l.lift * open * (1 - rise)))
            // lights stay with the camera, like the heroes
            const size = focus.getSize(new THREE.Vector3()).length()
            key.position.copy(target).addScaledVector(dirOf(cam.az + 58, 34), size * 1.4)
            key.target.position.copy(target)
            rim.position.copy(target).addScaledVector(dirOf(cam.az + 205, 28), size * 1.4)
            rim.target.position.copy(target)
            fill.position.copy(camera.position)
            fill.target.position.copy(target)
            const shc = key.shadow.camera as THREE.OrthographicCamera
            shc.left = shc.bottom = -size * 0.9
            shc.right = shc.top = size * 0.9
            shc.near = size * 0.1
            shc.far = size * 3.2
            shc.updateProjectionMatrix()
            // the pulse time loops (seamless, after 100 periods): a growing shader time loses precision
            energy.forEach((m) => (m.uniforms.uTime.value = reduced ? 0 : ((now - t0) / 1000) % ((2 * Math.PI) / 2.6 * 100)))
            renderer.render(scene, camera)
            // spec tags in chapter 3; the level mark in chapter 2
            const active = k < 0.64 || k > 0.84 ? -1 : Math.min(specs.length - 1, Math.floor(range(k, 0.64, 0.84) * specs.length))
            tagsRef.current.forEach((el, i) => {
                if (!el) return
                const a = anchors[ANCHORS[i]]
                if (!a) return
                tmp.copy(a.p)
                tmp.y += a.lift * open * (1 - rise)
                tmp.project(camera)
                el.style.left = ((tmp.x + 1) / 2) * w0 + "px"
                el.style.top = ((1 - tmp.y) / 2) * h0 + "px"
                el.style.opacity = String(active === i ? 1 : 0)
            })
            if (levelRef.current) {
                tmp.set(sc.x, 0, sc.z).project(camera)
                levelRef.current.style.top = ((1 - tmp.y) / 2) * h0 + "px"
                levelRef.current.style.opacity = String(ease(range(k, 0.32, 0.4)) * (1 - ease(range(k, 0.48, 0.54))))
            }
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

    // the overlays follow the same chapters
    const heroOut = ease(range(t, 0.1, 0.2))
    const under = ease(range(t, 0.2, 0.36)) * (1 - ease(range(t, 0.86, 0.98)))
    const ch2 = ease(range(t, 0.3, 0.38)) * (1 - ease(range(t, 0.48, 0.54)))
    const ch3 = ease(range(t, 0.58, 0.64)) * (1 - ease(range(t, 0.82, 0.86)))
    const ch4 = ease(range(t, 0.92, 0.99))
    const active = t < 0.64 || t > 0.84 ? -1 : Math.min(specs.length - 1, Math.floor(range(t, 0.64, 0.84) * specs.length))
    const chapters = [range(t, 0, 0.2), range(t, 0.2, 0.5), range(t, 0.5, 0.86), range(t, 0.86, 1)]
    return (
        <section ref={root} className="v2" style={{ height: "520vh", ...p.style }}>
            <V2Style />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="v2e-stage">
                <div className="v2e-sky" />
                <div className="v2e-dark" style={{ opacity: under }} />
                <div ref={host} className="v2e-canvas" />
                <div className="v2e-scrim" style={{ opacity: (1 - heroOut) * (1 - under) + under * 0.5 }} />
                <div className="v2e-fade" />
                <div className="v2e-meta v2-wrap v2-mono" style={{ opacity: 1 - heroOut, color: "rgba(255,255,255,.75)" }}>
                    <span>Sett — energiehub onder de grond</span>
                    <span>52.17° N · 5.46° E</span>
                    <span>Hoevelaken, NL</span>
                </div>
                <div ref={hero} className="v2e-hero v2-wrap" style={{ opacity: 1 - heroOut, transform: `translateY(${-heroOut * 90}px)` }}>
                    <div className="v2e-eyebrow v2-mono v2-fade">{or(p.eyebrow, "Wat is Sett?")}</div>
                    <h1 className="v2-display">
                        <Lines text={or(p.headline, "Energie hoort|onder de grond.")} />
                    </h1>
                    <div className="v2e-row v2-fade">
                        <p className="v2-lead" style={{ maxWidth: 540, color: "rgba(255,255,255,.9)" }}>
                            {or(p.lead, "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt.")}
                        </p>
                        <div className="v2e-btns">
                            <a className="v2-btn lime" href={or(p.primaryLink, "/pre-order")}>
                                {or(p.primary, "Bestel jouw Sett")} <Arrow />
                            </a>
                            <a className="v2-btn line" href={or(p.secondaryLink, V.phone)}>
                                {or(p.secondary, "Bel direct")}
                            </a>
                        </div>
                    </div>
                </div>
                <div ref={levelRef} className="v2e-level v2-wrap" style={{ opacity: 0 }}>
                    <div className="v2-level v2-mono">±0,00 maaiveld · de oprit</div>
                </div>
                <div className="v2e-ch top v2-wrap" style={{ opacity: ch2, transform: `translateY(${(1 - ch2) * 30}px)` }}>
                    <div className="v2-mono" style={{ color: V.lime, marginBottom: 16 }}>
                        {or(p.underLabel, "−0,70 m · onder het maaiveld")}
                    </div>
                    <p className="v2-h2">{or(p.underTitle, "Een complete energiehub, onder je eigen parkeerplek.")}</p>
                </div>
                <div className="v2e-ch top v2-wrap" style={{ opacity: ch3, transform: `translateY(${(1 - ch3) * 30}px)` }}>
                    <div className="v2-mono" style={{ color: V.lime, marginBottom: 16 }}>
                        Binnenin
                    </div>
                    <p className="v2-h2">{or(p.insideTitle, "96 kWh in een stalen bak van 4 × 1,5 × 0,7\u00a0m.")}</p>
                </div>
                <ol className="v2e-specs" style={{ opacity: ch3 }}>
                    {specs.map((s, i) => (
                        <li key={i} className={active === i ? "on" : ""} style={{ opacity: active === i ? 1 : 0.4, color: active === i ? V.lime : V.text }}>
                            <b>{s.title}</b>
                            <span>{s.value}</span>
                        </li>
                    ))}
                </ol>
                {specs.map((s, i) => (
                    <div key={i} ref={(e) => (tagsRef.current[i] = e)} className="v2e-tag" style={{ opacity: 0 }}>
                        <i />
                        <em>{s.title}</em>
                    </div>
                ))}
                <div className="v2e-ch bottom v2-wrap" style={{ opacity: ch4, transform: `translateY(${(1 - ch4) * 30}px)` }}>
                    <div className="v2-mono" style={{ color: V.lime, marginBottom: 16 }}>
                        0 m² · bovengronds
                    </div>
                    <p className="v2-h2">{or(p.endTitle, "Bovengronds: alleen een laadpaal.")}</p>
                </div>
                <div className="v2e-steps" aria-hidden="true" style={{ opacity: heroOut }}>
                    {["Straat", "Onder de grond", "Binnenin", "Terug"].map((n, i) => (
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

SettV2Descent.displayName = "Sett V2 · Onder de straat"

addPropertyControls(SettV2Descent, {
    model: { type: ControlType.File, title: "3D-straat", allowedFileTypes: ["glb"], description: "sett-hero-particulieren.glb" },
    eyebrow: { type: ControlType.String, title: "Label", defaultValue: "Wat is Sett?" },
    headline: { type: ControlType.String, title: "Kop", displayTextArea: true, description: "| breekt de regel.", defaultValue: "Energie hoort|onder de grond." },
    lead: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Sett is een complete energiehub onder je eigen parkeerplek: een accu die overdag zonnestroom opslaat en teruggeeft op het moment dat jíj ’m nodig hebt." },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bestel jouw Sett" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link", defaultValue: "/pre-order" },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Bel direct" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link", defaultValue: V.phone },
    underLabel: { type: ControlType.String, title: "Hfst 2 label", defaultValue: "−0,70 m · onder het maaiveld" },
    underTitle: { type: ControlType.String, title: "Hfst 2 tekst", displayTextArea: true, defaultValue: "Een complete energiehub, onder je eigen parkeerplek." },
    insideTitle: { type: ControlType.String, title: "Hfst 3 tekst", displayTextArea: true, defaultValue: "96 kWh in een stalen bak van 4 × 1,5 × 0,7\u00a0m." },
    specs: { type: ControlType.Array, title: "Specs", maxCount: 5, control: { type: ControlType.Object, controls: { title: { type: ControlType.String, title: "Naam" }, value: { type: ControlType.String, title: "Waarde" } } } },
    endTitle: { type: ControlType.String, title: "Slottekst", displayTextArea: true, defaultValue: "Bovengronds: alleen een laadpaal." },
})
