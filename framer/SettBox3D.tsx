// Sett Box 3D — Framer Code Component
//
// The Sett unit on its own, as an interactive element: drag to turn it, tap
// the button (or the unit) to lift the modules out of the enclosure, and tap
// a numbered hotspot for the spec behind it.
//
// SETUP: drag `sett-box.glb` (next to this file, exported by the render
// studio: the unit + charge pole only, ~100 KB) into Framer's Assets panel and
// pick it in the "Model (GLB)" property. Everything else has a default.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

import * as THREE from "https://esm.sh/three@0.185.1"
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "https://esm.sh/three@0.185.1/examples/jsm/controls/OrbitControls.js"

// the same file is fetched once per page, however often the component mounts
THREE.Cache.enabled = true

type Anchor = "batteries" | "blocks" | "inverter" | "cooling" | "partition" | "pole" | "vent" | "enclosure" | "ribs" | "corner"
interface Hotspot {
    anchor: Anchor
    title: string
    value: string
}

// the spec table on sett.nl/details, one hotspot per row
const HOTSPOT_DEFAULTS: Hotspot[] = [
    { anchor: "batteries", title: "Accu capaciteit", value: "96 kWh LiFePO4" },
    { anchor: "blocks", title: "Max load", value: "50 kW (meer bij meer boxen)" },
    { anchor: "inverter", title: "Netaansluiting", value: "tot 3×50A (klein)" },
    { anchor: "pole", title: "Laadpunten", value: "2× 11 kW of 1× 22 kW" },
    { anchor: "cooling", title: "Koeling", value: "Actief en passief (koelribben)" },
    { anchor: "partition", title: "Brandveiligheid", value: "Aerosol per compartiment" },
    { anchor: "vent", title: "Bewaking", value: "Load · temp · vocht · 4G" },
    { anchor: "corner", title: "Afmetingen", value: "4 × 1,5 × 0,7 m" },
    { anchor: "enclosure", title: "Materiaal", value: "S235-staal, verzinkt en gecoat" },
    { anchor: "ribs", title: "Levensduur", value: "20+ jaar" },
]
const ANCHORS: Anchor[] = ["batteries", "blocks", "inverter", "cooling", "partition", "pole", "vent", "enclosure", "ribs", "corner"]
const ANCHOR_TITLES = ["Accu's", "Batterijblokken", "Omvormers", "Koeling", "Tussenschot", "Laadpaal", "Ventilatie / sensoren", "Behuizing (zijkant)", "Koelribben", "Hoek (afmetingen)"]

// the live homepage hero's colours (its Framer settings), so the box matches it
const COLORS = {
    bin: "#95A3C2",
    ribs: "#95A3C2",
    battery: "#25CF77",
    blocks: "#2544CF",
    inverter: "#95A3C2",
    cooling: "#525252",
    pole: "#363D52",
    logo: "#FFFFFF",
    accent: "#25CF77",
}

interface Props {
    modelUrl?: string
    autoRotate?: boolean
    startExploded?: boolean
    showHotspots?: "exploded" | "always" | "never"
    hotspots?: Hotspot[]
    showButton?: boolean
    exploreLabel?: string
    closeLabel?: string
    buttonColor?: string
    buttonTextColor?: string
    elevation?: number
    zoom?: number
    chargePulse?: boolean
    binColor?: string
    ribColor?: string
    batteryColor?: string
    blockColor?: string
    inverterColor?: string
    coolingColor?: string
    poleColor?: string
    logoColor?: string
    accentColor?: string
    onToggle?: (exploded: boolean) => void
    // render sharpness (the studio's PNGs), and keeping the drawn frame readable for them
    pixelRatio?: number
    preserve?: boolean
    style?: React.CSSProperties
}

// how far each group of parts lifts out of the enclosure when exploded
// (model units ≈ cm). Stacked modules get a little extra so the layers part.
const LIFT: [RegExp, number, number][] = [
    [/^accu/, 120, 30],
    [/^Block_large/, 88, 24],
    [/^Inverter/, 46, 0],
    [/^Cooling/, 96, 0],
]

function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function SettBox3D(props: Props) {
    const modelUrl = props.modelUrl
    const hotspots = (props.hotspots && props.hotspots.length ? props.hotspots : HOTSPOT_DEFAULTS).filter((h) => h && h.title)
    const showHotspots = props.showHotspots || "exploded"
    const [exploded, setExploded] = useState(!!props.startExploded)
    const [openIdx, setOpenIdx] = useState(-1)
    const [ready, setReady] = useState(false)

    const hostRef = useRef<HTMLDivElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const dotRefs = useRef<(HTMLDivElement | null)[]>([])
    // live values the render loop reads without re-running the effect
    const explodedRef = useRef(exploded)
    explodedRef.current = exploded
    const openRef = useRef(openIdx)
    openRef.current = openIdx
    const hotspotsRef = useRef(hotspots)
    hotspotsRef.current = hotspots
    const showRef = useRef(showHotspots)
    showRef.current = showHotspots
    const onToggleRef = useRef(props.onToggle)
    onToggleRef.current = props.onToggle
    const apiRef = useRef<null | { kick: () => void; recolor: () => void; toggle: () => void }>(null)
    const colors = {
        bin: props.binColor || COLORS.bin,
        ribs: props.ribColor || COLORS.ribs,
        battery: props.batteryColor || COLORS.battery,
        blocks: props.blockColor || COLORS.blocks,
        inverter: props.inverterColor || COLORS.inverter,
        cooling: props.coolingColor || COLORS.cooling,
        pole: props.poleColor || COLORS.pole,
        logo: props.logoColor || COLORS.logo,
        accent: props.accentColor || COLORS.accent,
    }
    const colorsRef = useRef(colors)
    colorsRef.current = colors
    const opts = { autoRotate: props.autoRotate !== false, chargePulse: props.chargePulse !== false, elevation: props.elevation ?? 30, zoom: props.zoom ?? 1, button: props.showButton !== false }
    const optsRef = useRef(opts)
    optsRef.current = opts

    useEffect(() => {
        if (!modelUrl) return
        const host = hostRef.current!
        const rootEl = rootRef.current!
        let cancelled = false
        let raf = 0
        let needs = true // render on demand: set whenever something visible changed

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!props.preserve })
        const narrow = window.innerWidth <= 760
        renderer.setPixelRatio(props.pixelRatio || Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.95
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFShadowMap
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(26, 1, 1, 20000)

        // the studio's daylight: warm key from the camera's right, soft hemisphere,
        // a light that rides with the camera so no face ever goes black
        const hemi = new THREE.HemisphereLight(0xf6f5f2, 0xcdb98d, 1.15)
        const key = new THREE.DirectionalLight(0xfff4e2, 2.3)
        key.castShadow = true
        key.shadow.mapSize.set(2048, 2048)
        key.shadow.bias = -0.0003
        key.shadow.normalBias = 0.5
        key.shadow.radius = 5
        const rim = new THREE.DirectionalLight(0xfff1de, 0.55)
        const view = new THREE.DirectionalLight(0xfff2da, 0.4)
        scene.add(hemi, key, key.target, rim, rim.target, view, view.target)

        // floor: the key light's shadow, plus a soft painted contact shadow
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.18 }))
        floor.rotation.x = -Math.PI / 2
        floor.position.y = -74.5
        floor.receiveShadow = true
        scene.add(floor)
        const blobCanvas = document.createElement("canvas")
        blobCanvas.width = blobCanvas.height = 256
        const bctx = blobCanvas.getContext("2d")!
        const grd = bctx.createRadialGradient(128, 128, 10, 128, 128, 128)
        grd.addColorStop(0, "rgba(0,0,0,0.42)")
        grd.addColorStop(0.55, "rgba(0,0,0,0.16)")
        grd.addColorStop(1, "rgba(0,0,0,0)")
        bctx.fillStyle = grd
        bctx.fillRect(0, 0, 256, 256)
        const blobTex = new THREE.CanvasTexture(blobCanvas)
        const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }))
        blob.rotation.x = -Math.PI / 2
        blob.position.y = -74.2
        blob.scale.set(330, 560, 1)
        blob.renderOrder = -1
        scene.add(blob)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableZoom = false // the page scrolls; the wheel is not ours
        controls.enablePan = false
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.rotateSpeed = 0.7
        controls.autoRotateSpeed = 0.9
        // a touch drag turns the unit sideways; a vertical swipe stays a page scroll
        renderer.domElement.style.touchAction = "pan-y"

        // ---------------------------------------------------------------- materials
        const mats: Record<string, THREE.MeshStandardMaterial> = {}
        const roleColor = (role: string) => {
            const c = colorsRef.current
            return (
                ({
                    settBin: c.bin,
                    frame: c.ribs,
                    battery: c.battery,
                    batteryBlocks: c.blocks,
                    inverter: c.inverter,
                    cooling: c.cooling,
                    chargePole: c.pole,
                    logo: c.logo,
                } as Record<string, string>)[role] || c.bin
            )
        }
        function matFor(role: string) {
            if (!mats[role]) {
                mats[role] = new THREE.MeshStandardMaterial({ color: new THREE.Color(roleColor(role)), roughness: 1, metalness: 0, flatShading: true })
            }
            return mats[role]
        }
        function recolor() {
            Object.keys(mats).forEach((r) => mats[r].color.set(roleColor(r)))
            needs = true
        }

        // ---------------------------------------------------------------- model
        const model = new THREE.Group()
        scene.add(model)
        const lifters: { mesh: THREE.Object3D; lift: number }[] = []
        const anchorBase: Partial<Record<Anchor, { p: THREE.Vector3; lift: () => number }>> = {}
        let restBox = new THREE.Box3()
        let openBox = new THREE.Box3()
        let explodeT = explodedRef.current ? 1 : 0
        // the open/close move runs on wall-clock time, so a dropped frame or a
        // throttled tab never slows it down — it just lands where it should be
        let explodeGoal = explodeT
        let explodeFrom = explodeT
        let explodeStart = 0
        const EXPLODE_MS = 900

        new GLTFLoader().load(
            modelUrl,
            (gltf: any) => {
                if (cancelled) return
                const meshes: THREE.Mesh[] = []
                gltf.scene.traverse((o: any) => o.isMesh && meshes.push(o))
                const union = (re: RegExp) => {
                    const b = new THREE.Box3()
                    meshes.forEach((m) => re.test(m.name) && b.union(new THREE.Box3().setFromObject(m)))
                    return b
                }
                gltf.scene.updateMatrixWorld(true)
                meshes.forEach((m) => {
                    const ms = Array.isArray(m.material) ? m.material : [m.material]
                    const next = ms.map((mm: any) => matFor(mm.name || "settBin"))
                    m.material = Array.isArray(m.material) ? next : next[0]
                    m.castShadow = true
                    m.receiveShadow = true
                    const L = LIFT.find((l) => l[0].test(m.name))
                    if (L) {
                        const bb = new THREE.Box3().setFromObject(m)
                        lifters.push({ mesh: m, lift: L[1] + (bb.min.y > -50 ? L[2] : 0) })
                    }
                })
                model.add(gltf.scene)

                // hotspot anchors, in the model's frame; the ones on moving parts
                // travel with them
                const bin = union(/^BAK/)
                const top = (b: THREE.Box3) => new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2)
                const liftOf = (re: RegExp) => () => {
                    const l = lifters.find((q) => re.test(q.mesh.name))
                    return l ? l.lift : 0
                }
                const pole = new THREE.Box3()
                meshes.forEach((m) => {
                    const ms = Array.isArray(m.material) ? m.material : [m.material]
                    if (ms.some((mm: any) => mm === mats.chargePole || mm === mats.logo) && !/^Exhaust/.test(m.name)) pole.union(new THREE.Box3().setFromObject(m))
                })
                const partition = union(/^schot/)
                anchorBase.batteries = { p: top(union(/^accu/)), lift: () => 150 }
                anchorBase.blocks = { p: top(union(/^Block_large/)), lift: () => 112 }
                anchorBase.inverter = { p: top(union(/^Inverter/)), lift: liftOf(/^Inverter/) }
                anchorBase.cooling = { p: top(union(/^Cooling/)), lift: liftOf(/^Cooling/) }
                anchorBase.partition = { p: new THREE.Vector3((partition.min.x + partition.max.x) / 2, partition.max.y, partition.min.z + 2), lift: () => 0 }
                anchorBase.pole = { p: new THREE.Vector3((pole.min.x + pole.max.x) / 2, pole.min.y + (pole.max.y - pole.min.y) * 0.72, pole.min.z), lift: () => 0 }
                anchorBase.vent = { p: top(union(/^Exhaust/)), lift: () => 0 }
                anchorBase.enclosure = { p: new THREE.Vector3(bin.min.x, (bin.min.y + bin.max.y) / 2, (bin.min.z + bin.max.z) / 2 - 90), lift: () => 0 }
                anchorBase.ribs = { p: new THREE.Vector3(bin.max.x + 6, (bin.min.y + bin.max.y) / 2, (bin.min.z + bin.max.z) / 2 + 60), lift: () => 0 }
                anchorBase.corner = { p: new THREE.Vector3(bin.min.x, bin.max.y, bin.min.z), lift: () => 0 }

                // framing: the resting unit and the exploded one (for a smooth pull-back)
                restBox = new THREE.Box3().setFromObject(model)
                applyExplode(1)
                model.updateMatrixWorld(true)
                openBox = new THREE.Box3().setFromObject(model)
                applyExplode(explodeT)
                const size = restBox.getSize(new THREE.Vector3())
                blob.scale.set(size.x * 1.6, size.z * 1.4, 1)
                blob.position.set((restBox.min.x + restBox.max.x) / 2, restBox.min.y + 0.3, (restBox.min.z + restBox.max.z) / 2)
                floor.position.y = restBox.min.y
                frame(true)
                setReady(true)
                needs = true
            },
            undefined,
            (err: any) => console.error("SettBox3D: could not load model", err)
        )

        function applyExplode(t: number) {
            const e = ease(t)
            lifters.forEach((l) => (l.mesh.position.y = l.lift * e))
        }

        // ---------------------------------------------------------------- camera
        let fitDist = 1000
        const fitTarget = new THREE.Vector3()
        function fitFor(box: THREE.Box3) {
            const s = new THREE.Sphere()
            box.getBoundingSphere(s)
            const aspect = camera.aspect
            const vFov = THREE.MathUtils.degToRad(camera.fov) / 2
            const hFov = Math.atan(Math.tan(vFov) * aspect)
            const d = s.radius / Math.sin(Math.min(vFov, hFov))
            // the bounding sphere of a long, low box is generous: pull in a little
            const dist = (d * 0.8) / (optsRef.current.zoom || 1)
            // with the button showing, aim a little low so the unit sits above it
            const c = s.center.clone()
            if (optsRef.current.button) c.y -= Math.tan(vFov) * dist * 0.16
            return { d: dist, c }
        }
        function frame(snap: boolean) {
            if (restBox.isEmpty()) return
            const e = ease(explodeT)
            const a = fitFor(restBox), b = fitFor(openBox)
            fitDist = THREE.MathUtils.lerp(a.d, b.d, e)
            fitTarget.lerpVectors(a.c, b.c, e)
            if (snap) {
                const el = THREE.MathUtils.degToRad(optsRef.current.elevation)
                const az = THREE.MathUtils.degToRad(52)
                controls.target.copy(fitTarget)
                camera.position.copy(fitTarget).add(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(fitDist))
            } else {
                // keep the current orbit angle, move to the new distance and centre
                const dir = camera.position.clone().sub(controls.target).normalize()
                controls.target.copy(fitTarget)
                camera.position.copy(fitTarget).addScaledVector(dir, fitDist)
            }
            // a fixed-ish tilt: the unit reads best from above, and a locked polar
            // angle is what keeps vertical touch swipes free for scrolling
            const polar = Math.PI / 2 - THREE.MathUtils.degToRad(optsRef.current.elevation)
            controls.minPolarAngle = Math.max(0.15, polar - 0.35)
            controls.maxPolarAngle = Math.min(Math.PI / 2 - 0.05, polar + 0.2)
            if (narrow) controls.minPolarAngle = controls.maxPolarAngle = polar
            controls.update()
        }
        function resize() {
            const w = host.clientWidth, h = host.clientHeight
            if (!w || !h) return
            renderer.setSize(w, h, false)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            frame(false)
            needs = true
        }
        const ro = new ResizeObserver(resize)
        ro.observe(host)
        resize()

        // ---------------------------------------------------------------- interaction
        let lastInteract = -1e9
        controls.addEventListener("start", () => {
            lastInteract = performance.now()
            controls.autoRotate = false
        })
        controls.addEventListener("change", () => (needs = true))
        controls.addEventListener("end", () => (lastInteract = performance.now()))
        // a tap on the unit (not a drag) toggles the exploded view
        let down: { x: number; y: number } | null = null
        const raycaster = new THREE.Raycaster()
        const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
        const onUp = (e: PointerEvent) => {
            if (!down) return
            const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
            down = null
            if (moved > 6) return
            const r = renderer.domElement.getBoundingClientRect()
            raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera)
            if (raycaster.intersectObject(model, true).length) toggle()
        }
        renderer.domElement.addEventListener("pointerdown", onDown)
        renderer.domElement.addEventListener("pointerup", onUp)
        function toggle() {
            const next = !explodedRef.current
            setExploded(next)
            if (onToggleRef.current) onToggleRef.current(next)
        }

        let onScreen = true
        const io = new IntersectionObserver((en) => {
            onScreen = en[0].isIntersecting
            if (onScreen) needs = true
        })
        io.observe(host)

        // ---------------------------------------------------------------- loop
        const tmp = new THREE.Vector3()
        const camDir = new THREE.Vector3()
        function tick() {
            raf = requestAnimationFrame(tick)
            if (!onScreen || document.hidden) return
            const now = performance.now()
            const o = optsRef.current

            // explode / collapse
            const goal = explodedRef.current ? 1 : 0
            if (goal !== explodeGoal) {
                explodeGoal = goal
                explodeFrom = explodeT
                explodeStart = now
            }
            if (explodeT !== explodeGoal) {
                const span = Math.abs(explodeGoal - explodeFrom) * EXPLODE_MS
                const k = span > 0 ? Math.min(1, (now - explodeStart) / span) : 1
                explodeT = k >= 1 ? explodeGoal : explodeFrom + (explodeGoal - explodeFrom) * k
                applyExplode(explodeT)
                frame(false)
                needs = true
            }
            // idle turntable, back a few seconds after the last drag
            const wantSpin = o.autoRotate && now - lastInteract > 3500 && openRef.current < 0
            if (controls.autoRotate !== wantSpin) controls.autoRotate = wantSpin
            if (controls.autoRotate) needs = true
            // the batteries breathe a little green while "charging"
            if (o.chargePulse && mats.battery) {
                const k = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(now / 700))
                mats.battery.emissive.set(colorsRef.current.battery)
                mats.battery.emissiveIntensity = k
                if (mats.batteryBlocks) {
                    mats.batteryBlocks.emissive.set(colorsRef.current.blocks)
                    mats.batteryBlocks.emissiveIntensity = k * 0.8
                }
                needs = true
            }
            if (controls.update()) needs = true
            if (!needs) return
            needs = false

            // lights ride with the camera
            const t = controls.target
            camDir.copy(camera.position).sub(t).normalize()
            const az = Math.atan2(camDir.x, -camDir.z)
            const at = (off: number, el: number) => {
                const a = az + THREE.MathUtils.degToRad(off), e = THREE.MathUtils.degToRad(el)
                return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).multiplyScalar(1500).add(t)
            }
            key.position.copy(at(62, 50))
            key.target.position.copy(t)
            rim.position.copy(at(200, 30))
            rim.target.position.copy(t)
            view.position.copy(camera.position)
            view.target.position.copy(t)
            const sc = key.shadow.camera as THREE.OrthographicCamera
            sc.left = sc.bottom = -520
            sc.right = sc.top = 520
            sc.near = 200
            sc.far = 4000
            sc.updateProjectionMatrix()

            renderer.render(scene, camera)
            placeHotspots()
        }

        // project each anchor to the screen; fade the ones behind the unit
        function placeHotspots() {
            const hs = hotspotsRef.current
            const w = host.clientWidth, h = host.clientHeight
            const mode = showRef.current
            const vis = mode === "never" ? 0 : mode === "always" ? 1 : ease(explodeT)
            model.updateMatrixWorld(true)
            hs.forEach((spot, i) => {
                const el = dotRefs.current[i]
                const base = anchorBase[spot.anchor]
                if (!el || !base) return
                tmp.copy(base.p)
                tmp.y += base.lift() * ease(explodeT)
                model.localToWorld(tmp)
                const world = tmp.clone()
                tmp.project(camera)
                const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h
                // occluded? a ray from the camera that hits the unit well before the anchor
                const dir = world.clone().sub(camera.position)
                const dist = dir.length()
                raycaster.set(camera.position, dir.normalize())
                raycaster.far = dist
                const hit = raycaster.intersectObject(model, true)[0]
                const hidden = hit && hit.distance < dist - 14
                const o = vis * (hidden ? 0.28 : 1)
                el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)"
                el.style.opacity = o.toFixed(3)
                el.style.pointerEvents = vis > 0.5 ? "auto" : "none"
                el.dataset.side = x > w * 0.62 ? "left" : "right"
                el.dataset.vside = y < h * 0.22 ? "below" : "above"
            })
        }
        tick()

        apiRef.current = {
            kick: () => {
                frame(false)
                needs = true
            },
            recolor,
            toggle,
        }

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            renderer.domElement.removeEventListener("pointerdown", onDown)
            renderer.domElement.removeEventListener("pointerup", onUp)
            controls.dispose()
            scene.traverse((o: any) => {
                if (o.geometry) o.geometry.dispose()
            })
            Object.values(mats).forEach((m) => m.dispose())
            blobTex.dispose()
            renderer.dispose()
            if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement)
            apiRef.current = null
        }
        // rebuilding on these alone: colours, labels and options apply live
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelUrl])

    // live updates without a reload
    useEffect(() => {
        apiRef.current?.recolor()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colors.bin, colors.ribs, colors.battery, colors.blocks, colors.inverter, colors.cooling, colors.pole, colors.logo])
    useEffect(() => {
        apiRef.current?.kick()
        if (!exploded && showHotspots === "exploded") setOpenIdx(-1)
    }, [exploded, openIdx, showHotspots, hotspots.length, props.elevation, props.zoom, props.showButton])

    const btnStyle: React.CSSProperties = { background: props.buttonColor || "#4265FF", color: props.buttonTextColor || "#FFFFFF" }
    const exploreLabel = (props.exploreLabel || "").trim() || "Bekijk de binnenkant"
    const closeLabel = (props.closeLabel || "").trim() || "Sluiten"

    return (
        <div ref={rootRef} className="sbx" style={{ position: "relative", width: "100%", height: "100%", ...props.style, ["--sbx-accent" as any]: colors.accent }}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            {!modelUrl ? (
                <div className="sbx-missing">Kies het bestand sett-box.glb bij “Model (GLB)” in het eigenschappenpaneel.</div>
            ) : (
                <>
                    <div ref={hostRef} className={"sbx-canvas" + (ready ? " ready" : "")} role="img" aria-label="Interactief 3D-model van de Sett: de ondergrondse energiehub met accu's, omvormers, koeling en laadpaal." />
                    {!ready && <div className="sbx-loading" aria-hidden="true" />}
                    <div className="sbx-hotspots">
                        {hotspots.map((h, i) => (
                            <div
                                key={i + h.anchor}
                                ref={(el) => (dotRefs.current[i] = el)}
                                className={"sbx-spot" + (openIdx === i ? " open" : "")}
                                style={{ opacity: 0 }}
                            >
                                <button type="button" className="sbx-dot" aria-expanded={openIdx === i} aria-label={h.title + ": " + h.value} onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
                                    {i + 1}
                                </button>
                                <div className="sbx-card" role="note">
                                    <span className="sbx-card-title">{h.title}</span>
                                    <span className="sbx-card-value">{h.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {props.showButton !== false && (
                        <button type="button" className={"sbx-toggle" + (ready ? " ready" : "")} style={btnStyle} onClick={() => apiRef.current?.toggle()} aria-pressed={exploded}>
                            {exploded ? closeLabel : exploreLabel}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {exploded ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" />}
                            </svg>
                        </button>
                    )}
                    {/* the specs as plain markup, for screen readers and search engines */}
                    <dl className="sbx-sr">
                        {hotspots.map((h, i) => (
                            <React.Fragment key={i}>
                                <dt>{h.title}</dt>
                                <dd>{h.value}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </>
            )}
        </div>
    )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
.sbx{ font-family:"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif; overflow:visible; }
.sbx-canvas{ position:absolute; inset:0; opacity:0; transition:opacity .6s ease; cursor:grab; }
.sbx-canvas:active{ cursor:grabbing; }
.sbx-canvas.ready{ opacity:1; }
.sbx-loading{ position:absolute; left:50%; top:50%; width:34px; height:34px; margin:-17px 0 0 -17px; border-radius:50%;
  border:3px solid rgba(17,18,18,0.1); border-top-color:var(--sbx-accent); animation:sbx-spin .9s linear infinite; }
@keyframes sbx-spin{ to{ transform:rotate(360deg); } }
.sbx-hotspots{ position:absolute; inset:0; pointer-events:none; overflow:visible; }
.sbx-spot{ position:absolute; left:0; top:0; width:0; height:0; transition:opacity .25s ease; will-change:transform, opacity; }
.sbx-dot{ position:absolute; left:-15px; top:-15px; width:30px; height:30px; border-radius:50%; border:0; padding:0; cursor:pointer;
  background:#ffffff; color:#111212; font:700 13px/30px inherit; font-family:inherit; text-align:center;
  box-shadow:0 0 0 3px var(--sbx-accent), 0 6px 18px rgba(6,10,30,0.25); transition:transform .2s ease, background .2s ease, color .2s ease; }
.sbx-dot::after{ content:""; position:absolute; inset:-3px; border-radius:50%; box-shadow:0 0 0 3px var(--sbx-accent); opacity:0; animation:sbx-ping 2.4s ease-out infinite; pointer-events:none; }
@keyframes sbx-ping{ 0%{ transform:scale(1); opacity:.55; } 80%,100%{ transform:scale(1.9); opacity:0; } }
.sbx-dot:hover{ transform:scale(1.08); }
.sbx-spot.open .sbx-dot{ background:var(--sbx-accent); color:#ffffff; }
.sbx-spot.open .sbx-dot::after{ animation:none; }
.sbx-card{ position:absolute; left:24px; bottom:12px; min-width:190px; max-width:250px; padding:12px 14px 13px; border-radius:14px;
  background:rgba(255,255,255,0.97); box-shadow:0 12px 34px rgba(6,10,30,0.18); color:#111212;
  display:flex; flex-direction:column; gap:3px; opacity:0; transform:translateY(6px); transition:opacity .2s ease, transform .2s ease; pointer-events:none; }
.sbx-spot[data-side="left"] .sbx-card{ left:auto; right:24px; }
.sbx-spot[data-vside="below"] .sbx-card{ bottom:auto; top:12px; }
.sbx-spot.open{ z-index:3; }
.sbx-spot.open .sbx-card{ opacity:1; transform:none; pointer-events:auto; }
.sbx-card-title{ font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#6b6f78; }
.sbx-card-value{ font-size:16px; font-weight:700; line-height:1.3; }
.sbx-toggle{ position:absolute; left:50%; bottom:6%; transform:translateX(-50%) translateY(8px); z-index:4;
  display:inline-flex; align-items:center; gap:9px; padding:.9rem 1.5rem; border:0; border-radius:999px;
  font:700 15px/1 inherit; font-family:inherit; letter-spacing:.01em; white-space:nowrap; cursor:pointer;
  box-shadow:0 10px 30px rgba(6,10,30,0.22); opacity:0; transition:opacity .5s ease .2s, transform .5s ease .2s, filter .2s ease; }
.sbx-toggle.ready{ opacity:1; transform:translateX(-50%); }
.sbx-toggle svg{ width:17px; height:17px; display:block; }
@media (hover:hover){ .sbx-toggle:hover{ filter:brightness(1.07); } }
.sbx-sr{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); border:0; }
.sbx-missing{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; text-align:center; padding:24px;
  color:#5b5142; font-size:13px; line-height:1.5; background:#f2ede0; border-radius:16px; }
@media (max-width:760px){
  .sbx-dot{ left:-13px; top:-13px; width:26px; height:26px; font-size:12px; line-height:26px; }
  .sbx-card{ min-width:160px; max-width:210px; padding:10px 12px 11px; }
  .sbx-card-value{ font-size:14px; }
  .sbx-toggle{ font-size:14px; padding:.85rem 1.3rem; }
}
`

SettBox3D.displayName = "Sett Box 3D"

addPropertyControls(SettBox3D, {
    modelUrl: { type: ControlType.File, title: "Model (GLB)", allowedFileTypes: ["glb"] },
    autoRotate: { type: ControlType.Boolean, title: "Auto-rotate", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Turns slowly when idle; pauses while a visitor drags or reads a hotspot." },
    startExploded: { type: ControlType.Boolean, title: "Start opened", defaultValue: false, enabledTitle: "Opened", disabledTitle: "Closed" },
    showHotspots: {
        type: ControlType.Enum,
        title: "Hotspots",
        options: ["exploded", "always", "never"],
        optionTitles: ["When opened", "Always", "Never"],
        defaultValue: "exploded",
    },
    hotspots: {
        type: ControlType.Array,
        title: "Specs",
        control: {
            type: ControlType.Object,
            controls: {
                anchor: { type: ControlType.Enum, title: "Part", options: ANCHORS, optionTitles: ANCHOR_TITLES, defaultValue: "batteries" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Spec" },
                value: { type: ControlType.String, title: "Value", defaultValue: "" },
            },
        },
        defaultValue: HOTSPOT_DEFAULTS,
        hidden: (p: Props) => p.showHotspots === "never",
    },
    showButton: { type: ControlType.Boolean, title: "Open button", defaultValue: true, enabledTitle: "Shown", disabledTitle: "Hidden", description: "Tapping the unit itself also opens and closes it." },
    exploreLabel: { type: ControlType.String, title: "Open label", defaultValue: "Bekijk de binnenkant", hidden: (p: Props) => p.showButton === false },
    closeLabel: { type: ControlType.String, title: "Close label", defaultValue: "Sluiten", hidden: (p: Props) => p.showButton === false },
    buttonColor: { type: ControlType.Color, title: "Button fill", defaultValue: "#4265FF", hidden: (p: Props) => p.showButton === false },
    buttonTextColor: { type: ControlType.Color, title: "Button text", defaultValue: "#FFFFFF", hidden: (p: Props) => p.showButton === false },
    onToggle: { type: ControlType.EventHandler, title: "On open/close" },
    elevation: { type: ControlType.Number, title: "Camera tilt", min: 12, max: 70, step: 1, unit: "°", defaultValue: 30 },
    zoom: { type: ControlType.Number, title: "Zoom", min: 0.6, max: 1.6, step: 0.05, defaultValue: 1 },
    chargePulse: { type: ControlType.Boolean, title: "Charge glow", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    accentColor: { type: ControlType.Color, title: "Hotspot accent", defaultValue: COLORS.accent },
    binColor: { type: ControlType.Color, title: "Enclosure", defaultValue: COLORS.bin },
    ribColor: { type: ControlType.Color, title: "Cooling ribs", defaultValue: COLORS.ribs },
    batteryColor: { type: ControlType.Color, title: "Batteries", defaultValue: COLORS.battery },
    blockColor: { type: ControlType.Color, title: "Battery blocks", defaultValue: COLORS.blocks },
    inverterColor: { type: ControlType.Color, title: "Inverters", defaultValue: COLORS.inverter },
    coolingColor: { type: ControlType.Color, title: "Cooling unit", defaultValue: COLORS.cooling },
    poleColor: { type: ControlType.Color, title: "Charge pole", defaultValue: COLORS.pole },
    logoColor: { type: ControlType.Color, title: "Logo", defaultValue: COLORS.logo },
})
