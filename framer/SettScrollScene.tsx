// Sett Scroll Scene — a section render that comes alive: the same diorama as
// its PNG, live in 3D, moving with the page scroll. The PNG shows first (and
// stays for phones, reduced motion and while loading); the 3D fades in on top.
// Each sett-scroll-*.glb carries its PNG's exact camera, lights and contact
// shadow, plus what moves:
//   twist  the diorama turns a few degrees either way as it passes through
//   lift   the Sett unit lowers into its pit
//   grow   bars and charts rise from their base
//   drive  a car or van rolls into its place
//   bob    arrows float up and down
//   sun    the sun swings round: shadows sweep across
//   dusk   evening falls: the windows light up
// and every energy line pulses like on the homepage.
//
// Framing "Kaart" is the full-bleed version for boxed images: zoomed in on the
// scene, filling any box (cropped like object-fit: cover), pushing in further
// as it scrolls. Use the card-*.png as its image then.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import * as THREE from "https://esm.sh/three@0.185.1"
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js"
import { glTrack } from "./SettGL.tsx"

type Img = { src?: string; srcSet?: string; alt?: string } | undefined
interface Props {
    model?: string
    poster?: Img
    // the poster's alt text when the image has none (set by the section, e.g. the card's title)
    alt?: string
    framing?: "scene" | "card"
    effect?: "auto" | "twist" | "none"
    strength?: number
    pulse?: boolean
    mobile3D?: boolean
    /** 0–1 scroll progress from the parent (e.g. a sticky card); by default the scene measures its own */
    progress?: number
    style?: React.CSSProperties
}
type LightData = { color: number; intensity: number; position: number[]; target: number[] }
type Meta = {
    aspect: number
    camera: { position: number[]; quaternion: number[]; fov: number; near: number; far: number; view: null | { fullWidth: number; fullHeight: number; offsetX: number; offsetY: number; width: number; height: number } }
    lights: Record<"key" | "rim" | "bounce" | "view", LightData> & { hemi: { color: number; ground: number; intensity: number } }
    points?: { position: number[]; color: number; intensity: number; distance: number }[]
    shadow: { opacity: number; visible: boolean; y: number; size: number; camera: { left: number; right: number; top: number; bottom: number; near: number; far: number } }
    exposure: number
    sky: string[]
    centre: number[]
    scroll: { twist?: number; lift?: number; grow?: boolean; drive?: number; bob?: number; sun?: number; dusk?: boolean; card?: { zoom?: number; focus?: number[]; dolly?: number; zoomEnd?: number; focusEnd?: number[] } }
}

// the homepage's flowing line: brightness waves travelling along the tube
const ENERGY_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const ENERGY_FRAG = `
uniform vec3 uColor; uniform float uTime; uniform float uPulses;
varying vec2 vUv;
void main(){
    float pulse = pow(0.5 + 0.5 * sin(vUv.x * uPulses - uTime * 2.6), 3.0);
    gl_FragColor = vec4(uColor * (0.9 + 0.45 * pulse), 0.62 + 0.38 * pulse);
}`

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => {
    const t = clamp01(x)
    return t * t * (3 - 2 * t)
}
const UP = new THREE.Vector3(0, 1, 0)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 533
 */
export default function SettScrollScene(props: Props) {
    const hostRef = useRef<HTMLDivElement>(null)
    const [ready, setReady] = useState(false)
    const [aspect, setAspect] = useState<number | null>(null)
    const live = useRef(props)
    live.current = props
    const card = props.framing === "card"

    useEffect(() => {
        const url = props.model
        const host = hostRef.current
        if (!url || !host) return
        const onCanvas = RenderTarget.current() === RenderTarget.canvas
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const narrow = window.innerWidth <= 760
        // phones keep the PNG unless asked (saves battery and data)
        if (!onCanvas && narrow && live.current.mobile3D !== true) return
        let cancelled = false, raf = 0

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
        const gl = glTrack(renderer) // so the renderer can go completely when this unmounts
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap
        renderer.setClearColor(0x000000, 0)
        const canvas = renderer.domElement
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block"
        canvas.setAttribute("aria-hidden", "true")
        host.appendChild(canvas)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(28, 1, 1, 60000)
        const pivot = new THREE.Group()
        scene.add(pivot)
        const energy: THREE.ShaderMaterial[] = []
        const windows: { m: THREE.MeshStandardMaterial; full: number }[] = []
        const lights: { l: THREE.Light; base: number }[] = []
        let meta: Meta | null = null
        let key: THREE.DirectionalLight | null = null, keyBase = new THREE.Vector3(), keyTarget = new THREE.Vector3()
        let lift: THREE.Object3D | null = null, liftBase = 0
        const grows: { o: THREE.Object3D; y: number; floor: number; s: number }[] = []
        const bobs: { o: THREE.Object3D; y: number; phase: number }[] = []
        let drive: { o: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 } | null = null
        let region = { fw: 1000, fh: 1000, cx: 500, cy: 500, w: 1000, h: 1000 }
        let env: THREE.WebGLRenderTarget | null = null
        let t0 = performance.now(), lastP = -1, lastT = 0, visible = true, cw = 1, ch = 1

        new GLTFLoader().load(
            url,
            (gltf) => {
                if (cancelled) return
                const root = gltf.scene
                root.traverse((o) => {
                    if (!meta && o.userData && o.userData.sett) meta = o.userData.sett as Meta
                })
                if (!meta) {
                    console.warn("SettScrollScene: no scene data in", url)
                    return
                }
                const M = meta
                if (!card) setAspect(M.aspect)
                // camera, exactly as the PNG; its region of the frame (or all of it)
                camera.fov = M.camera.fov
                camera.near = M.camera.near
                camera.far = M.camera.far
                camera.position.fromArray(M.camera.position)
                camera.quaternion.fromArray(M.camera.quaternion)
                camera.aspect = M.aspect
                const v = M.camera.view
                region = v ? { fw: v.fullWidth, fh: v.fullHeight, cx: v.offsetX + v.width / 2, cy: v.offsetY + v.height / 2, w: v.width, h: v.height } : { fw: 1000 * M.aspect, fh: 1000, cx: 500 * M.aspect, cy: 500, w: 1000 * M.aspect, h: 1000 }
                // lights
                const L = M.lights
                const hemi = new THREE.HemisphereLight(L.hemi.color, L.hemi.ground, L.hemi.intensity)
                scene.add(hemi)
                lights.push({ l: hemi, base: hemi.intensity })
                const dir = (d: LightData, shadow = false) => {
                    const l = new THREE.DirectionalLight(d.color, d.intensity)
                    l.position.fromArray(d.position)
                    l.target.position.fromArray(d.target)
                    scene.add(l, l.target)
                    lights.push({ l, base: l.intensity })
                    if (shadow) {
                        l.castShadow = true
                        l.shadow.mapSize.set(2048, 2048)
                        l.shadow.bias = -0.0002
                        l.shadow.normalBias = 0.6
                        l.shadow.radius = 5
                        Object.assign(l.shadow.camera, M.shadow.camera)
                        l.shadow.camera.updateProjectionMatrix()
                    }
                    return l
                }
                key = dir(L.key, true)
                keyBase = key.position.clone()
                keyTarget = key.target.position.clone()
                dir(L.rim)
                dir(L.bounce)
                dir(L.view)
                for (const p of M.points ?? []) {
                    const pl = new THREE.PointLight(p.color, p.intensity, p.distance, 0)
                    pl.position.fromArray(p.position)
                    scene.add(pl)
                }
                renderer.toneMappingExposure = M.exposure
                // the studio's soft sky reflections
                const c = document.createElement("canvas")
                c.width = 128
                c.height = 64
                const ctx = c.getContext("2d")!
                const g = ctx.createLinearGradient(0, 0, 0, 64)
                M.sky.forEach((col, i) => g.addColorStop([0, 0.35, 0.65, 1][i] ?? 1, col))
                ctx.fillStyle = g
                ctx.fillRect(0, 0, 128, 64)
                const tex = new THREE.CanvasTexture(c)
                tex.mapping = THREE.EquirectangularReflectionMapping
                tex.colorSpace = THREE.SRGBColorSpace
                const pm = new THREE.PMREMGenerator(renderer)
                env = pm.fromEquirectangular(tex)
                tex.dispose()
                pm.dispose()
                scene.environment = env.texture
                scene.environmentIntensity = 0.3
                // shadow catcher
                if (M.shadow.visible) {
                    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: M.shadow.opacity }))
                    catcher.rotation.x = -Math.PI / 2
                    catcher.position.set(M.centre[0], M.shadow.y, M.centre[2])
                    catcher.scale.set(M.shadow.size, M.shadow.size, 1)
                    catcher.receiveShadow = true
                    scene.add(catcher)
                }
                // the diorama, turning about its own centre
                pivot.position.set(M.centre[0], 0, M.centre[2])
                root.position.set(-M.centre[0], 0, -M.centre[2])
                pivot.add(root)
                root.updateMatrixWorld(true)
                let bobIndex = 0
                root.traverse((o: any) => {
                    if (o.name === "scroll_lift") lift = o
                    if (o.name === "scroll_drive") drive = { o, base: o.position.clone(), dir: new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion).setY(0).normalize() }
                    if (o.name === "scroll_grow") {
                        // grow from the part's own base, whatever its origin
                        const b = new THREE.Box3().setFromObject(o)
                        const floorLocal = o.parent ? o.parent.worldToLocal(new THREE.Vector3(0, b.min.y, 0)).y : b.min.y
                        grows.push({ o, y: o.position.y, floor: floorLocal, s: o.scale.y })
                    }
                    if (/^scroll_bob/.test(o.name)) bobs.push({ o, y: o.position.y, phase: bobIndex++ * Math.PI })
                    if (!o.isMesh) return
                    const m = o.material
                    const name = (m && m.name) || ""
                    if (name === "contact_shadow") {
                        o.material = new THREE.MeshBasicMaterial({ map: m.map, color: 0x000000, transparent: true, opacity: m.opacity, depthWrite: false })
                        o.renderOrder = -1
                        return
                    }
                    const tube = o.userData && o.userData.length > 0 && o.geometry.attributes.uv && !o.geometry.attributes.color
                    if (tube && m && m.isMeshBasicMaterial) {
                        const sm = new THREE.ShaderMaterial({
                            uniforms: { uColor: { value: m.color.clone() }, uTime: { value: 0 }, uPulses: { value: Math.max(6, Math.round(o.userData.length / 55)) } },
                            vertexShader: ENERGY_VERT,
                            fragmentShader: ENERGY_FRAG,
                            transparent: true,
                            depthWrite: false,
                            side: THREE.DoubleSide,
                            toneMapped: false,
                        })
                        o.material = sm
                        o.renderOrder = 3
                        energy.push(sm)
                        return
                    }
                    if (m && m.isMeshStandardMaterial && m.emissiveIntensity > 0.05 && /window/i.test(name)) windows.push({ m, full: m.emissiveIntensity })
                    const glow = m && m.isMeshBasicMaterial
                    o.castShadow = !glow && !(m && m.transparent)
                    o.receiveShadow = !glow
                })
                if (lift) liftBase = (lift as THREE.Object3D).position.y - (M.scroll.lift ?? 0) // the PNG shows it raised: its resting place is below
                resize()
                t0 = performance.now()
                draw(true)
                setReady(true)
            },
            undefined,
            (e) => console.warn("SettScrollScene: model failed to load", e)
        )

        // scroll progress: 0 as the frame enters at the bottom, 1 as it leaves at the top
        const progress = () => {
            const given = live.current.progress
            if (typeof given === "number" && isFinite(given)) return clamp01(given)
            const r = host.getBoundingClientRect()
            const vh = window.innerHeight || 1
            return clamp01((vh - r.top) / (vh + r.height))
        }
        // the part of the frame to show: the PNG's region, or zoomed in for a
        // card, then cropped to the box (object-fit: cover)
        function frameFor(p: number) {
            if (!meta) return
            const C = meta.scroll.card
            let { cx, cy, w, h } = region
            if (card && C) {
                // an optional end framing: from focus/zoom to focusEnd/zoomEnd over the scroll
                // (e.g. from the roof to the solar panels); otherwise a plain dolly in
                const e = ease((p - 0.1) / 0.8) * (live.current.strength ?? 1)
                const f0 = C.focus ?? [0, 0], f1 = C.focusEnd ?? f0
                cx += (f0[0] + (f1[0] - f0[0]) * e) * w
                cy += (f0[1] + (f1[1] - f0[1]) * e) * h
                const z0 = C.zoom ?? 1.3
                const z = C.zoomEnd ? z0 + (C.zoomEnd - z0) * e : z0 * (1 + (C.dolly ?? 0.12) * e)
                w /= z
                h /= z
            }
            const a = cw / ch
            if (w / h > a) w = h * a
            else h = w / a
            camera.setViewOffset(region.fw, region.fh, cx - w / 2, cy - h / 2, w, h)
            camera.updateProjectionMatrix()
        }
        function pose(p: number) {
            if (!meta) return
            const P = live.current
            const k = P.strength ?? 1
            const eff = P.effect ?? "auto"
            const s = meta.scroll || {}
            const on = eff !== "none"
            const twist = !on ? 0 : eff === "twist" ? (s.twist ?? 10) : (s.twist ?? 0)
            pivot.rotation.y = THREE.MathUtils.degToRad(twist * k) * (p - 0.5) * 2
            if (lift) (lift as THREE.Object3D).position.y = liftBase + (on ? (s.lift ?? 0) * (1 - ease((p - 0.22) / 0.4)) : 0)
            for (const g of grows) {
                const f = on ? 0.06 + 0.94 * ease((p - 0.12) / 0.42) : 1
                g.o.scale.y = g.s * f
                g.o.position.y = g.floor + (g.y - g.floor) * f
            }
            for (const b of bobs) b.o.position.y = b.y + (on ? (s.bob ?? 0) * k * Math.sin(p * Math.PI * 3 + b.phase) : 0)
            if (drive) {
                const d = drive as { o: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 }
                const back = on ? (s.drive ?? 0) * k * (1 - ease((p - 0.18) / 0.42)) : 0
                d.o.position.copy(d.base).addScaledVector(d.dir, -back)
            }
            if (key && s.sun && on) {
                // the sun swings round the scene: shadows sweep across
                const a = THREE.MathUtils.degToRad(s.sun * k) * (p - 0.5) * 2
                key.position.copy(keyBase).sub(keyTarget).applyAxisAngle(UP, a).add(keyTarget)
            }
            if (s.dusk) {
                // evening falls: a touch brighter at first, the windows come on
                const e = on ? ease((p - 0.15) / 0.5) : 1
                for (const w of windows) w.m.emissiveIntensity = w.full * e
                for (const l of lights) l.l.intensity = l.base * (1.25 - 0.25 * e)
            }
            frameFor(p)
        }
        function draw(force = false) {
            if (!meta) return
            const now = performance.now()
            const P = live.current
            const pulses = P.pulse !== false && !reduced && !onCanvas && energy.length > 0
            const p = onCanvas || reduced ? 0.5 : progress()
            const moved = Math.abs(p - lastP) > 0.0005
            // redraw on scroll, and at ~30 fps while lines pulse and it's on screen
            if (!force && !moved && !(pulses && visible && now - lastT > 33)) return
            lastP = p
            lastT = now
            pose(p)
            // the pulse time loops (seamless, after 100 periods): a growing shader time loses precision
            energy.forEach((m) => (m.uniforms.uTime.value = pulses ? ((now - t0) / 1000) % ((2 * Math.PI) / 2.6 * 100) : 0))
            renderer.render(scene, camera)
        }
        function resize() {
            cw = host.clientWidth
            ch = host.clientHeight
            if (!cw || !ch) return
            renderer.setSize(cw, ch, false)
            draw(true)
        }
        const ro = new ResizeObserver(resize)
        ro.observe(host)
        const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { rootMargin: "100px" })
        io.observe(host)
        const loop = () => {
            raf = requestAnimationFrame(loop)
            if (visible && !document.hidden) draw()
        }
        if (!onCanvas) loop()

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            if (env) env.dispose()
            gl.release(scene)
            setReady(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.model, card])

    const img = props.poster
    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", aspectRatio: !card && aspect ? String(aspect) : undefined, ...props.style }}>
            {img && img.src ? (
                <img src={img.src} srcSet={img.srcSet} alt={img.alt || props.alt || ""} sizes="(max-width: 809px) 100vw, 60vw" loading="lazy" decoding="async" onLoad={(e) => card || aspect || setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: card ? "cover" : "contain", opacity: ready ? 0 : 1, transition: "opacity 0.6s ease 0.1s" }} />
            ) : !props.model ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed rgba(128,128,128,.4)", borderRadius: 16, color: "rgba(128,128,128,.9)", font: "500 13px/1.4 ui-monospace, monospace", textAlign: "center", padding: 16 }}>
                    Kies een sett-scroll-*.glb bij “Scene”
                    <br />
                    en de bijbehorende PNG bij “Afbeelding”
                </div>
            ) : null}
            <div ref={hostRef} style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }} />
        </div>
    )
}

SettScrollScene.displayName = "Sett Scroll Scene"

addPropertyControls(SettScrollScene, {
    model: { type: ControlType.File, title: "Scene", allowedFileTypes: ["glb"], description: "sett-scroll-….glb" },
    poster: { type: ControlType.ResponsiveImage, title: "Afbeelding", description: "The matching PNG (card-… for Kaart): shown while loading, on phones and with reduced motion." },
    framing: { type: ControlType.Enum, title: "Framing", options: ["scene", "card"], optionTitles: ["Hele scène", "Kaart (vol, ingezoomd)"], defaultValue: "scene", displaySegmentedControl: true },
    effect: { type: ControlType.Enum, title: "Effect", options: ["auto", "twist", "none"], optionTitles: ["Uit de scène", "Draaien", "Geen"], defaultValue: "auto" },
    strength: { type: ControlType.Number, title: "Sterkte", min: 0, max: 2, step: 0.1, defaultValue: 1 },
    pulse: { type: ControlType.Boolean, title: "Energielijnen", defaultValue: true, enabledTitle: "Pulseren", disabledTitle: "Stil" },
    mobile3D: { type: ControlType.Boolean, title: "3D op telefoon", defaultValue: false, enabledTitle: "Aan", disabledTitle: "PNG" },
})
