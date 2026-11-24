// Sett render studio — compositions. One entry per website asset.
//
// Coordinates are in the model's units (≈ 1 cm). The home set (house + Sett +
// charge pole + path + car) is positioned with the Sett's top-centre at the
// origin; W() converts the model's own coordinates into that frame, which is
// how the energy-line routes below are written.

import { THREE, C, GRADE, P, settBox, chargePole, house, rowHouses, car, van, homeSet, tree, bush, pylon, factory, office, batteryCabinet, slab, cutawaySlab, box, bayLines, energyLine, ring, areaChart, bars, limitPlane, bolt, hourglass, pedestal, arrow, rng, v, mat, glowMat, shade, roleMaterial } from "./core.js"

// ---------------------------------------------------------------- helpers
const W = (x, y, z) => v(x - P.settCenter.x, y - GRADE, z - P.settCenter.z)
const Wl = (pts) => pts.map((p) => W(p[0], p[1], p[2]))
// the Sett's footprint (bin + ribs) around a given centre, for cutting pits
function binHole(cx = 0, cz = 0, { pad = 2, rotated = false } = {}) {
    const b = P.settBox, c = P.settCenter
    let hx0 = b.min.x - c.x - pad, hx1 = b.max.x - c.x + pad, hz0 = b.min.z - c.z - pad, hz1 = b.max.z - c.z + pad
    if (rotated) [hx0, hx1, hz0, hz1] = [hz0, hz1, -hx1, -hx0] // a quarter turn (rotation.y = π/2)
    return { x0: cx + hx0, x1: cx + hx1, z0: cz + hz0, z1: cz + hz1 }
}
function at(obj, x, y, z, ry = 0) {
    obj.position.set(x, y, z)
    obj.rotation.y = ry
    return obj
}
const DARK_WINDOWS = mat("#1E2235")
const LIT_WINDOWS = new THREE.MeshStandardMaterial({ color: "#ffe6c2", emissive: "#ffc98a", emissiveIntensity: 1.4, roughness: 1, metalness: 0 })

// energy routes over the home set, in the model's own coordinates
const ROUTE = {
    // over the panels, down the front of the house, along the path, into the Sett
    solar: [[372, 612, 505], [372, 612, 433], [372, 322, 433], [372, 322, 376], [372, 80, 376], [372, 80, 250], [0, 80, 250], [0, 82, 120], [0, 82, -10], [-47, 82, -10], [-47, 72, -10]],
    // the same start, but on to the grid (no storage): past the Sett, along the path to the pylon
    solarToGrid: (tip) => [[372, 612, 505], [372, 612, 433], [372, 322, 433], [372, 322, 376], [372, 80, 376], [372, 80, 330], [-740, 80, 330], [-740, 80, tip.z], [tip.x, 80, tip.z], [tip.x, tip.y, tip.z]],
    // out of the batteries, round the vent, along the path to the front door
    house: [[43, 72, -12], [43, 82, -12], [82, 82, -12], [82, 82, 240], [244, 82, 240], [244, 82, 392], [303, 82, 392], [303, 96, 402]],
    // out of the batteries to the foot of the charge pole
    car: [[-47, 72, -12], [-47, 82, -12], [-39, 82, 150], [-39, 78, 173]],
}
// a pylon in the home diorama's front-right corner, and its wire tip in model coords
function homePylon(S, g, h = 640) {
    const pos = W(-790, GRADE, 1080)
    const t = at(pylon(h), pos.x, 0, pos.z, 0.5)
    g.add(t)
    t.updateMatrixWorld(true)
    const tip = t.userData.tips[0].clone().applyMatrix4(t.matrixWorld)
    // back into model coordinates, which is what ROUTE speaks
    return { tower: t, tip: new THREE.Vector3(tip.x + P.settCenter.x, tip.y + GRADE, tip.z + P.settCenter.z) }
}
// the homepage world as a diorama: a lawn slab, a paved driveway, the pit
function homeDiorama(opts = {}) {
    const g = new THREE.Group()
    const set = homeSet(opts)
    g.add(set)
    const holes = opts.sett === false ? [] : [binHole()]
    const wide = opts.pylon ? 300 : 0 // room for the pylon, back and to the screen-right
    // sized for the homepage's layout: its four trees reach to the back and the right
    g.add(slab({ w: 1900 + wide, d: 2150 + wide, x: 250 - wide / 2, z: 400 + wide / 2, depth: 80, radius: 80, top: C.grass, side: C.groundSide, holes }))
    g.add(slab({ w: 780, d: 820, x: -250, z: -170, depth: 3, bevel: 0, radius: 30, top: C.paving, side: C.paving, holes, y: 0.8 }))
    g.userData.set = set
    return g
}
// make the charge cable itself carry the flow
function glowCable(g, color = C.green) {
    g.traverse((o) => o.isMesh && /^Pipe\.002/.test(o.name) && (o.material = glowMat(color)))
}
// a Tesla or the cargo van, both in the homepage's grey clay, nose along +z
const vehicle = (kind = "car") => (kind === "van" ? van() : car())
// a parking bay: car (or van) in the bay, pole at its head (the pole's face points -z, at the car)
function bayWithCar(g, x, z, { pole = true, ry = 0, kind = "car" } = {}) {
    const veh = at(vehicle(kind), x, 0, z, ry)
    g.add(veh)
    if (pole) g.add(at(chargePole(), x + 68, 0, z + 300))
    return veh
}
// a Sett laid crosswise (its long side toward the camera)
function settAcross(x, z, o = {}) {
    return at(settBox(o), x, 0, z, Math.PI / 2)
}
function shadowCatch(o) {
    o.traverse((m) => m.isMesh && ((m.castShadow = true), (m.receiveShadow = true)))
    return o
}


// ---------------------------------------------------------------- gemeenten
// a sports hall: a long, tall box with a plinth, a band of high windows, a glazed
// entrance under a canopy and rows of solar panels on its flat roof. Front at -z
function sportsHall({ w = 1500, d = 900, h = 440, rows = 4, cols = 9 } = {}) {
    const g = new THREE.Group()
    g.name = "building"
    const add = (m, x, y, z) => (m.position.set(x, y, z), g.add(m), m)
    add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(C.walls)), 0, h / 2, 0)
    add(new THREE.Mesh(new THREE.BoxGeometry(w + 4, 70, d + 4), mat(shade(C.walls, -0.08))), 0, 35, 0)
    const win = roleMaterial("windows")
    add(new THREE.Mesh(new THREE.BoxGeometry(w * 0.84, h * 0.17, 4), win), 0, h * 0.74, -d / 2 - 2)
    add(new THREE.Mesh(new THREE.BoxGeometry(4, h * 0.17, d * 0.8), win), -w / 2 - 2, h * 0.74, 0)
    // the entrance, a third in from the left, and its canopy
    const ex = -w * 0.3
    add(new THREE.Mesh(new THREE.BoxGeometry(280, 210, 4), win), ex, 105, -d / 2 - 2)
    add(new THREE.Mesh(new THREE.BoxGeometry(380, 14, 150), mat(C.frame)), ex, 230, -d / 2 - 75)
    add(new THREE.Mesh(new THREE.BoxGeometry(w + 14, 16, d + 14), mat(C.frame)), 0, h + 8, 0)
    // solar panels in rows, tilted toward the camera side
    const pw = (w * 0.86) / cols, pd = (d * 0.8) / rows
    for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.9, 5, pd * 0.62), roleMaterial("solarPanels"))
            p.rotation.x = -0.22
            add(p, -w * 0.43 + pw * (j + 0.5), h + 30, -d * 0.4 + pd * (i + 0.5))
        }
    shadowCatch(g)
    g.userData.entrance = v(ex, 0, -d / 2)
    g.userData.size = { w, d, h }
    return g
}
// the houses' doors in world space (after the terrace is placed and turned)
function doorsOf(row) {
    row.updateMatrixWorld(true)
    return row.userData.doors.map((d) => row.localToWorld(d.clone()))
}
// an energy line from a Sett's batteries to a point, round the corner of the strip
function feed(g, x, z, to, { via = null, color = C.energyLine } = {}) {
    const mid = via ?? (z + to.z) / 2
    g.add(energyLine([v(x, 8, z), v(x, 8, mid), v(to.x, 8, mid), v(to.x, 8, to.z), v(to.x, 40, to.z + Math.sign(to.z - mid) * 6)], color))
}
// ---------------------------------------------------------------- scenes
export const SCENES = [
    // ================================================================ product
    {
        name: "sett-96-product",
        section: "Pre-order · Sett 96 (product shot)",
        shot: { width: 2400, height: 1600, az: 38, el: 30, fov: 26, pad: 0.1 },
        build(S) {
            S.add(settBox())
        },
    },
    {
        name: "sett-96-exploded",
        section: "Details · Sett is je energiehub (specs)",
        shot: { width: 2400, height: 1800, az: 64, el: 30, fov: 26, pad: 0.08 },
        build(S) {
            const g = settBox({ withPole: false })
            const lift = [
                [/^accu/, 120],
                [/^Block_large/, 88],
                [/^Inverter/, 46],
                [/^Cooling/, 96],
            ]
            const guides = []
            g.traverse((o) => {
                if (!o.isMesh) return
                const L = lift.find((l) => l[0].test(o.name))
                if (!L) return
                // stagger stacked modules so each one is legible
                const bb = o.geometry.boundingBox
                const extra = /^accu/.test(o.name) && bb.min.y > 20 ? 30 : /^Block_large/.test(o.name) && bb.min.y > 20 ? 24 : 0
                o.position.y += L[1] + extra
                guides.push({ x: (bb.min.x + bb.max.x) / 2, z: (bb.min.z + bb.max.z) / 2, y0: bb.max.y, y1: bb.min.y + L[1] + extra })
            })
            S.add(g)
            // hairline guides from each part down to where it sits
            const inner = g.children[0]
            const gm = glowMat("#AEB6C8")
            guides.forEach((q) => {
                if (q.y1 - q.y0 < 8) return
                const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, q.y1 - q.y0, 6), gm)
                c.position.set(q.x, (q.y0 + q.y1) / 2, q.z)
                c.userData.noFrame = true
                inner.add(c)
            })
        },
    },
    {
        name: "sett-config-1-laadpaal",
        section: "Pre-order · configuratie: 1 laadpaal",
        shot: { width: 1600, height: 1200, az: 34, el: 30, fov: 26, pad: 0.1 },
        build(S) {
            S.add(settBox({ poles: 1 }))
            S.add(slab({ w: 400, d: 580, x: 0, z: 14, depth: 40, radius: 30, top: C.paving, side: C.groundSide, holes: [binHole()] }))
        },
    },
    {
        name: "sett-config-2-laadpalen",
        section: "Pre-order · configuratie: 2 laadpalen",
        shot: { width: 1600, height: 1200, az: 34, el: 30, fov: 26, pad: 0.1 },
        build(S) {
            S.add(settBox({ poles: 2 }))
            S.add(slab({ w: 400, d: 580, x: 0, z: 14, depth: 40, radius: 30, top: C.paving, side: C.groundSide, holes: [binHole()] }))
        },
    },

    // ================================================================ /details
    {
        name: "twee-pieken",
        section: "Details · “Er zijn twee pieken op het net”",
        shot: { shadowFloor: false,  width: 2400, height: 1200, az: 196, el: 16, fov: 24, pad: 0.06 },
        build(S) {
            const f = (u) => 0.1 + 0.08 * Math.exp(-(((u - 0.3) / 0.06) ** 2)) + 0.72 * Math.exp(-(((u - 0.52) / 0.085) ** 2)) + 0.86 * Math.exp(-(((u - 0.79) / 0.055) ** 2))
            const chart = areaChart({
                f,
                w: 1500,
                h: 460,
                depth: 150,
                bands: [
                    { from: 0, to: 0.655, color: C.sun },
                    { from: 0.655, to: 1, color: C.purple },
                ],
            })
            chart.name = "scroll_grow" // rises on scroll in the live version
            S.add(chart)
            S.add(box(1600, 10, 240, C.cream, { r: 5, y: -10 }))
        },
    },
    {
        name: "probleem-overdag",
        section: "Details · Probleem 01 — Te veel zon, omvormers schakelen uit",
        shot: { width: 2400, height: 1600, az: 34, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = homeDiorama({ sett: false, carOn: false, pylon: true })
            const { tip } = homePylon(S, g)
            // zonnestroom op weg naar het net — dat vol zit
            g.add(energyLine(Wl(ROUTE.solarToGrid(tip)), C.energyDay, { colorEnd: C.red, r: 3.6 }))
            const warn = ring(46, C.red, 3.2)
            warn.position.set(tip.x - P.settCenter.x, 1.2, tip.z - P.settCenter.z)
            g.add(warn)
            S.add(g)
        },
    },
    {
        name: "probleem-avond",
        section: "Details · Probleem 02 — Iedereen thuis, auto's aan de paal",
        light: "dusk",
        dark: true,
        shot: { width: 2400, height: 1600, az: 34, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = homeDiorama({ sett: false, cable: true, pylon: true })
            const { tip } = homePylon(S, g)
            const toHouse = [[tip.x, tip.y, tip.z], [tip.x, 80, tip.z], [-740, 80, tip.z], [-740, 80, 330], [372, 80, 330], [372, 80, 392], [303, 80, 392], [303, 96, 402]]
            const toPole = [[tip.x, tip.y, tip.z], [tip.x, 86, tip.z], [-752, 86, tip.z], [-752, 86, 150], [-39, 86, 150], [-39, 80, 173]]
            g.add(energyLine(Wl(toHouse), C.energyGrid, { colorEnd: C.red, r: 3.6 }))
            g.add(energyLine(Wl(toPole), C.energyGrid, { colorEnd: C.red, r: 3.6 }))
            glowCable(g, C.red)
            S.add(g)
        },
    },
    {
        name: "probleem-2027",
        section: "Details · Probleem 03 — Werkgevers krijgen een extra heffing",
        shot: { width: 2400, height: 1600, az: 30, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = new THREE.Group()
            g.add(slab({ w: 1500, d: 1500, x: 0, z: 250, depth: 70, radius: 70, top: C.asphalt, side: C.groundSide }))
            // bays a van wide (300)
            const fleet = ["van", "car", "car", "van"]
            ;[-450, -150, 150, 450].forEach((x, i) => {
                const veh = bayWithCar(g, x - 20, 0, { kind: fleet[i] })
                if (i === 3) veh.name = "scroll_drive" // drives into its bay in the live version
                bayLines(g, { x, z: 20, w: 300, d: 580 })
            })
            g.add(at(office({ w: 1100, d: 300, floors: 3 }), 0, 0, 680))
            S.add(g)
        },
    },
    {
        name: "keuze-batterijkast",
        section: "Details · “Dus bouw je naast iedere laadpaal een batterijkast?”",
        shot: { width: 1800, height: 1500, az: 32, el: 26, fov: 28, pad: 0.08 },
        build(S) {
            const g = new THREE.Group()
            g.add(slab({ w: 860, d: 800, x: 20, z: 60, depth: 60, radius: 50, top: C.paving, side: C.groundSide }))
            const parked = at(car(), -170, 0, -20)
            parked.name = "scroll_drive"
            g.add(parked)
            g.add(at(chargePole(), 20, 0, 300))
            g.add(at(batteryCabinet(), 200, 0, 300, 0))
            bayLines(g, { x: -170, z: -10, w: 280, d: 560 })
            S.add(g)
        },
    },
    {
        name: "keuze-ondergronds",
        section: "Details · “Of ga je onder de grond?”",
        shot: { width: 1800, height: 1500, az: 20, el: 15, fov: 24, pad: 0.07 },
        build(S) {
            const g = new THREE.Group()
            g.add(settAcross(0, 0))
            const hole = binHole(0, 0, { rotated: true, pad: 0 })
            const front = hole.z0, depth = 190, w = 820, d = 600
            const sl = cutawaySlab({ w, d, depth, radius: 50, cut: { x0: hole.x0, x1: hole.x1, z: hole.z1 - (front + d / 2) }, top: C.paving, side: C.soil })
            sl.position.z = front + d / 2
            g.add(sl)
            // the lid: flush with the paving, the unit under it
            const lid = box(hole.x1 - hole.x0, 4, hole.z1 - hole.z0, shade(C.paving, -0.02), { y: -4 })
            lid.position.set((hole.x0 + hole.x1) / 2, -4, (hole.z0 + hole.z1) / 2)
            g.add(lid)
            // soil under the unit, and the layers on the cut face: paving, sand, clay
            const under = box(hole.x1 - hole.x0, depth - 74, hole.z1 - hole.z0, C.soil, { y: -depth })
            under.position.set((hole.x0 + hole.x1) / 2, under.position.y, (hole.z0 + hole.z1) / 2)
            g.add(under)
            const face = (h, y, color) => {
                const b = box(w - 2, h, 2, color, { y })
                b.position.z = front - 0.8
                g.add(b)
            }
            face(depth * 0.4, -depth, C.soilDeep)
            const pave = box(w - 2, 10, 2, shade(C.paving, -0.06), { y: -10 })
            pave.position.z = front - 0.8
            g.add(pave)
            const onLid = at(car(), -78, 0, 0, Math.PI / 2)
            onLid.name = "scroll_drive" // drives onto the lid in the live version
            g.add(onLid)
            S.add(g)
        },
    },
    // ---- de cijfers
    {
        name: "cijfer-96kwh",
        section: "Details · De cijfers — 96 kWh batterijopslag",
        shot: { shadowFloor: false,  width: 1200, height: 1200, az: 36, el: 26, fov: 26, pad: 0.14 },
        build(S) {
            const g = new THREE.Group()
            const accu = P.parts["accu"], blk = P.parts["Block_large_01"]
            const place = (src, x, y, z) => {
                const m = src.clone()
                const bb = src.geometry.boundingBox
                m.position.set(x - (bb.min.x + bb.max.x) / 2, y - bb.min.y, z - (bb.min.z + bb.max.z) / 2)
                g.add(m)
                return bb
            }
            // two big blocks at the bottom, six modules stacked on top
            const bb = blk.geometry.boundingBox, bw = bb.max.x - bb.min.x + 8, bh = bb.max.y - bb.min.y
            ;[-1, 1].forEach((s, i) => [-1, 1].forEach((t) => place(blk, s * bw * 0.5, 0, t * 46)))
            const ab = accu.geometry.boundingBox, aw = ab.max.x - ab.min.x + 6, ah = ab.max.y - ab.min.y
            ;[-1, 0, 1].forEach((i) => [-1, 1].forEach((t) => place(accu, i * aw, bh + 4, t * 38)))
            ;[-0.5, 0.5].forEach((i) => place(accu, i * aw, bh + ah + 8, 0))
            S.add(g)
        },
    },
    {
        name: "cijfer-22kw",
        section: "Details · De cijfers — 22 kW EV-laders",
        shot: { shadowFloor: false,  width: 1200, height: 1200, az: 24, el: 12, fov: 24, pad: 0.12 },
        build(S) {
            S.add(chargePole())
            S.add(box(150, 8, 150, C.paving, { r: 4, y: -8 }))
        },
    },
    {
        name: "cijfer-50kw",
        section: "Details · De cijfers — 50 kW output per Sett",
        shot: { shadowFloor: false,  width: 1200, height: 1200, az: 28, el: 14, fov: 24, pad: 0.16 },
        build(S) {
            const b = bolt({ size: 420, depth: 80, color: "#FFA000", glow: 0.12 }) // lit, this reads as the page's amber (#FFB92B)
            b.rotation.set(0, -0.5, 0.08)
            b.updateMatrixWorld(true)
            b.position.y = -new THREE.Box3().setFromObject(b).min.y
            S.add(b)
        },
    },
    {
        name: "cijfer-0m2",
        section: "Details · De cijfers — 0 m² ruimte bovengronds",
        shot: { width: 1200, height: 1200, az: 34, el: 30, fov: 26, pad: 0.12 },
        build(S) {
            const g = new THREE.Group()
            g.add(slab({ w: 440, d: 640, depth: 50, radius: 34, top: C.paving, side: C.groundSide }))
            // the lid: flush with the paving, visible only by its seam
            const hole = binHole()
            const lw = hole.x1 - hole.x0, ld = hole.z1 - hole.z0
            const seam = mat(shade(C.paving, -0.3))
            ;[[lw, 2, 0, hole.z0], [lw, 2, 0, hole.z1], [2, ld, hole.x0, 0], [2, ld, hole.x1, 0]].forEach((e) => {
                const b = new THREE.Mesh(new THREE.BoxGeometry(e[0] > 2 ? e[0] : 4, 0.6, e[1] > 2 ? e[1] : 4), seam)
                b.position.set(e[0] > 2 ? (hole.x0 + hole.x1) / 2 : e[2], 0.35, e[1] > 2 ? (hole.z0 + hole.z1) / 2 : e[3])
                g.add(b)
            })
            const lid = new THREE.Mesh(new THREE.BoxGeometry(lw - 6, 0.5, ld - 6), mat(shade(C.paving, 0.015)))
            lid.position.set((hole.x0 + hole.x1) / 2, 0.3, (hole.z0 + hole.z1) / 2)
            lid.receiveShadow = true
            g.add(lid)
            const pole = settBox({ withPole: true })
            pole.traverse((o) => o.isMesh && !/^(Charge_pole|Extruded\.009|Exhaust)/.test(o.name) && (o.visible = false))
            g.add(pole)
            S.add(g)
        },
    },
    // ---- doelgroepen
    {
        name: "doelgroep-particulier",
        section: "Details · 01 Particulier — Je huis draait op je eigen zon",
        shot: { width: 1600, height: 1200, az: 34, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = homeDiorama()
            g.add(energyLine(Wl(ROUTE.solar), C.energyDay))
            g.add(energyLine(Wl(ROUTE.house), C.energyLine))
            S.add(g)
        },
    },
    {
        name: "doelgroep-ondernemer",
        section: "Details · 02 Ondernemer — Meer vermogen, minder net",
        shot: { width: 1600, height: 1200, az: 32, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = new THREE.Group()
            const hub = at(settBox(), -250, 0, -210)
            g.add(hub)
            g.add(slab({ w: 1700, d: 1500, x: 0, z: 200, depth: 70, radius: 70, top: C.asphalt, side: C.groundSide, holes: [binHole(-250, -210)] }))
            g.add(at(factory({ w: 1000, d: 440, h: 230, teeth: 5 }), 60, 0, 560))
            g.add(at(van(), -500, 0, -230))
            bayWithCar(g, 250, -300)
            bayLines(g, { x: 270, z: -280, w: 270, d: 560 })
            const r = rng(21)
            ;[[-760, -380], [760, -420]].forEach((p) => g.add(at(tree(r, 0.9), p[0], 0, p[1])))
            g.add(energyLine([v(-210, 8, -30), v(-210, 8, 250), v(-120, 8, 250), v(-120, 8, 334)], C.energyLine))
            S.add(g)
        },
    },
    {
        name: "doelgroep-overheid",
        section: "Details · 03 Overheid — Klimaatdoelen halen, netcongestie oplossen",
        shot: { width: 1600, height: 1200, az: 30, el: 32, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [-520, 520]
            hubs.forEach((x) => g.add(settAcross(x, -420)))
            g.add(slab({ w: 2700, d: 2000, x: 0, z: 150, depth: 80, radius: 90, top: C.grass, side: C.groundSide, holes: hubs.map((x) => binHole(x, -420, { rotated: true })) }))
            // the street's shared parking strip
            g.add(slab({ w: 2500, d: 560, x: 0, z: -470, depth: 3, bevel: 0, radius: 26, top: C.asphalt, side: C.asphalt, y: 0.8, holes: hubs.map((x) => binHole(x, -420, { rotated: true })) }))
            // a terrace of six row houses behind their front gardens
            const r = rng(5)
            const row = at(rowHouses({ n: 6, r }), 0, 0, 520)
            g.add(row)
            const doors = row.userData.doors.map((d) => d.clone().add(row.position))
            ;[-990, 0, 990].forEach((x, i) => g.add(at(car(), x, 0, -470, Math.PI / 2 + (i - 1) * 0.03)))
            // street trees on the pavement, between the parked cars
            ;[-1250, -760, 760, 1250].forEach((x) => g.add(at(tree(r, 0.8), x, 0, -60)))
            // each Sett feeds the house whose door is nearest, up its garden path
            hubs.forEach((x) => {
                const d = doors.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a))
                g.add(energyLine([v(x, 8, -310), v(x, 8, -150), v(d.x, 8, -150), v(d.x, 8, d.z - 30), v(d.x, 40, d.z - 6)], C.energyLine))
            })
            S.add(g)
        },
    },
    // ================================================================ V2 compare slider
    // the same street, the same camera, twice: the charge poles with a battery
    // cabinet on the pavement beside each, and the poles with a Sett under the
    // parking strip (only its lid shows). The slider in SettV2Compare wipes
    // from one to the other, so the two must line up exactly.
    ...[
        ["vergelijk-kast", false],
        ["vergelijk-sett", true],
    ].map(([name, sett]) => ({
        name,
        section: "V2 · Vergelijk: batterijkast of ondergronds (" + (sett ? "Sett" : "batterijkast") + ")",
        shot: { width: 2400, height: 1350, az: 28, el: 24, fov: 26, pad: 0.04 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [-520, 520]
            const holes = sett ? hubs.map((x) => binHole(x, -420, { rotated: true })) : []
            if (sett) hubs.forEach((x) => g.add(settAcross(x, -420, { withPole: false })))
            g.add(slab({ w: 2700, d: 2000, x: 0, z: 150, depth: 80, radius: 90, top: C.grass, side: C.groundSide, holes }))
            g.add(slab({ w: 2500, d: 560, x: 0, z: -470, depth: 3, bevel: 0, radius: 26, top: C.asphalt, side: C.asphalt, y: 0.8, holes }))
            const r = rng(5)
            g.add(at(rowHouses({ n: 6, r }), 0, 0, 520))
            ;[-990, 0, 990].forEach((x, i) => g.add(at(car(), x, 0, -470, Math.PI / 2 + (i - 1) * 0.03)))
            ;[-1250, -760, 760, 1250].forEach((x) => g.add(at(tree(r, 0.8), x, 0, -60)))
            // a pole on the kerb by each hub; without Sett, a cabinet beside it
            hubs.forEach((x) => {
                g.add(at(chargePole(), x - 60, 0, -150))
                if (!sett) g.add(at(batteryCabinet(), x + 120, 0, -130))
            })
            S.add(g)
        },
    })),
    {
        name: "doelgroep-werkgever",
        section: "Details · 04 Werkgever — Je wagenpark elektrificeren",
        shot: { width: 1600, height: 1200, az: 30, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = new THREE.Group()
            const hubX = 0, hubZ = -470
            g.add(settAcross(hubX, hubZ))
            g.add(slab({ w: 1600, d: 1650, x: 0, z: 160, depth: 70, radius: 70, top: C.asphalt, side: C.groundSide, holes: [binHole(hubX, hubZ, { rotated: true })] }))
            const fleet = ["car", "van", "van", "car"]
            ;[-450, -150, 150, 450].forEach((x, i) => {
                bayWithCar(g, x - 20, -40, { kind: fleet[i] })
                bayLines(g, { x, z: -20, w: 300, d: 580 })
            })
            g.add(at(office({ w: 1200, d: 320, floors: 4 }), 0, 0, 700))
            // round the end bay, behind the row, to the first bay's pole
            g.add(energyLine([v(-190, 8, -470), v(-650, 8, -470), v(-650, 8, 320), v(-402, 8, 320), v(-402, 8, 280)], C.energyLine))
            S.add(g)
        },
    },
    // ---- tijdlijn
    {
        name: "tijdlijn-2026",
        section: "Details · De tijd dringt — 2026 Nu: geen aansluiting voor nieuwe laadpalen",
        shot: { width: 1200, height: 1200, az: 32, el: 22, fov: 26, pad: 0.1 },
        build(S) {
            const g = new THREE.Group()
            g.add(pedestal({ w: 760, h: 110, d: 760, color: C.skyBlue }))
            const t = at(pylon(560), -150, 110, 120, 0.4)
            g.add(t)
            g.add(at(chargePole(), 190, 110, -140))
            t.updateMatrixWorld(true)
            const tip = t.userData.tips[1].clone().applyMatrix4(t.matrixWorld)
            g.add(energyLine([tip, v(tip.x, 118, tip.z), v(tip.x, 118, -60), v(170, 118, -60), v(170, 118, -150)], C.energyGrid, { colorEnd: C.red }))
            const warn = ring(32, C.red, 2.6)
            warn.position.set(190, 111.5, -140)
            g.add(warn)
            S.add(g)
        },
    },
    {
        name: "tijdlijn-2027",
        section: "Details · De tijd dringt — 2027 Werkgeversheffing",
        shot: { width: 1200, height: 1200, az: 32, el: 22, fov: 26, pad: 0.1 },
        build(S) {
            const g = new THREE.Group()
            g.add(pedestal({ w: 760, h: 110, d: 760, color: C.lavender }))
            g.add(at(car(), -40, 110, -40, 0.04))
            g.add(at(chargePole(), 150, 110, 250))
            S.add(g)
        },
    },
    {
        name: "tijdlijn-2030",
        section: "Details · De tijd dringt — 2030 Klimaatdoelen",
        shot: { width: 1200, height: 1200, az: 32, el: 26, fov: 26, pad: 0.1 },
        build(S) {
            const g = new THREE.Group()
            // the unit set into the pedestal: a slab with the pit cut into it
            g.add(slab({ w: 760, d: 760, depth: 104, bevel: 6, radius: 22, top: "#E3F6D9", side: "#CFEBC0", holes: [binHole(-40, -40)], y: 110 }))
            g.add(at(settBox(), -40, 110, -40))
            const floor = box(250, 10, 440, "#CFEBC0", { y: 110 - 84 })
            floor.position.set(-40, floor.position.y, -40)
            g.add(floor)
            const r = rng(9)
            g.add(at(tree(r, 0.7), 230, 110, 200))
            g.add(at(bush(r, 1), 230, 110, -250))
            S.add(g)
        },
    },
    {
        name: "onzichtbare-energiehub",
        section: "Details · CTA — De eerste onzichtbare energiehub van Nederland",
        light: "night",
        dark: true,
        shot: { width: 2400, height: 1600, az: 36, el: 34, fov: 28, pad: 0.06 },
        build(S) {
            const g = homeDiorama()
            g.add(energyLine(Wl(ROUTE.house), C.energyLine))
            g.add(energyLine(Wl(ROUTE.car), C.energyLine))
            glowCable(g)
            S.add(g)
            S.point(v(0, 90, 0), 0x8dff66, 2.6, 560)
            S.point(W(300, 200, 330), 0xffcf99, 1.2, 520)
        },
    },

    // ================================================================ /particulieren
    {
        name: "particulieren-hero",
        section: "Particulieren · Jouw zonnepanelen werken hard",
        shot: { width: 2400, height: 1600, az: 40, el: 32, fov: 28, pad: 0.06 },
        build(S) {
            const g = homeDiorama({ carOn: true })
            g.add(energyLine(Wl(ROUTE.solar), C.energyDay))
            S.add(g)
        },
    },
    {
        name: "salderen-stopt",
        section: "Particulieren · Salderen stopt (voordeel 01)",
        shot: { shadowFloor: false,  width: 2000, height: 1400, az: 204, el: 18, fov: 24, pad: 0.08 },
        build(S) {
            const b = bars([1, 0.86, 0.7, 0.54, 0.38, 0.22, 0.06], { w: 110, gap: 40, depth: 110, h: 440, colors: [C.sun], r: 12 })
            b.name = "scroll_grow"
            S.add(b)
            S.add(box(b.userData.total + 120, 10, 230, C.cream, { r: 5, y: -10 }))
        },
    },
    {
        name: "onafhankelijk",
        section: "Particulieren · Onafhankelijkheid (voordeel 02)",
        light: "night",
        dark: true,
        shot: { width: 2400, height: 1600, az: 34, el: 30, fov: 28, pad: 0.06 },
        build(S) {
            const g = homeDiorama({ pylon: true })
            const { tip } = homePylon(S, g)
            g.add(energyLine(Wl(ROUTE.house), C.energyLine))
            // the grid connection sits idle: a grey dashed line
            const idle = [[tip.x, tip.y, tip.z], [tip.x, 80, tip.z], [-740, 80, tip.z], [-740, 80, 300], [150, 80, 300], [150, 80, -140], [118, 80, -140]]
            g.add(energyLine(Wl(idle), "#5A6283", { dashed: true, r: 2.6 }))
            S.add(g)
            S.point(v(0, 90, 0), 0x8dff66, 2.4, 520)
            S.point(W(300, 200, 330), 0xffcf99, 1.2, 520)
        },
    },
    {
        name: "grip-op-rekening",
        section: "Particulieren · Grip op je energierekening (voordeel 03)",
        shot: { shadowFloor: false,  width: 2400, height: 1200, az: 194, el: 16, fov: 24, pad: 0.06 },
        build(S) {
            const r = rng(4)
            const spikes = Array.from({ length: 41 }, () => r())
            const jag = (u) => {
                const x = u * 40, i = Math.floor(x), t = x - i
                return 0.28 + 0.62 * THREE.MathUtils.lerp(spikes[i], spikes[i + 1] ?? spikes[i], t)
            }
            const calm = 0.36
            const f = (u) => {
                const k = THREE.MathUtils.smoothstep(u, 0.46, 0.58)
                return THREE.MathUtils.lerp(jag(u * 2 < 1 ? u : u), calm, k)
            }
            S.add(
                Object.assign(areaChart({
                    f,
                    w: 1500,
                    h: 420,
                    depth: 140,
                    samples: 320,
                    bands: [
                        { from: 0, to: 0.52, color: C.purple },
                        { from: 0.52, to: 1, color: C.green },
                    ],
                }), { name: "scroll_grow" })
            )
            S.add(box(1600, 10, 230, C.cream, { r: 5, y: -10 }))
        },
    },
    {
        name: "installatie",
        section: "Particulieren · Hoe we het samen aanpakken — gewoon onder je oprit",
        shot: { width: 2000, height: 1500, az: 36, el: 30, fov: 28, pad: 0.08 },
        build(S) {
            const g = new THREE.Group()
            const hole = binHole()
            g.add(slab({ w: 1000, d: 1100, x: -60, z: 60, depth: 110, radius: 60, top: C.paving, side: C.soil, holes: [hole] }))
            const floor = box(hole.x1 - hole.x0, 30, hole.z1 - hole.z0, C.soilDeep, { y: -110 })
            floor.position.set((hole.x0 + hole.x1) / 2, -110 + 30 / 2 - 74 + 110 - 30, (hole.z0 + hole.z1) / 2)
            floor.position.y = -74 - 15
            g.add(floor)
            const unit = settBox()
            unit.name = "scroll_lift" // lowered into the pit on scroll in the live version
            unit.position.y = 170
            g.add(unit)
            g.add(at(car(), -390, 0, 80, 0.03))
            S.add(g)
        },
    },

    // ================================================================ /bedrijven
    {
        name: "bedrijven-hero",
        section: "Bedrijven · Jij wilt ondernemen. Niet wachten op het net.",
        shot: { width: 2400, height: 1600, az: 32, el: 30, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [[-570, -300], [570, -300]]
            hubs.forEach((h) => g.add(settAcross(h[0], h[1])))
            g.add(slab({ w: 2800, d: 1900, x: 0, z: 200, depth: 80, radius: 90, top: C.asphalt, side: C.groundSide, holes: hubs.map((h) => binHole(h[0], h[1], { rotated: true })) }))
            g.add(at(factory({ w: 900, d: 460, h: 240, teeth: 5 }), -560, 0, 560))
            g.add(at(factory({ w: 760, d: 460, h: 280, teeth: 4, roof: shade(C.frame, -0.04) }), 440, 0, 560))
                        // parked along the row between the units: van | Sett | Tesla | Sett | van
            g.add(at(van(), -1090, 0, -300, Math.PI / 2 + 0.02))
            g.add(at(car(), 0, 0, -290, Math.PI / 2 - 0.02))
            g.add(at(van(), 1090, 0, -305, -Math.PI / 2 + 0.02))
            const r = rng(14)
            ;[[-1280, 160], [1280, 120], [1220, 980]].forEach((p) => g.add(at(tree(r, 0.9), p[0], 0, p[1])))
            const t = at(pylon(820), -1080, 0, 1000, 0.3)
            g.add(t)
            hubs.forEach((h) => g.add(energyLine([v(h[0], 8, h[1] + 115), v(h[0], 8, 250), v(h[0] + 120, 8, 250), v(h[0] + 120, 8, 326)], C.energyLine)))
            S.add(g)
        },
    },
    {
        name: "wachtlijst",
        section: "Bedrijven · Het net groeit niet mee — wachtlijsten tot drie jaar",
        shot: { shadowFloor: false,  width: 1200, height: 1400, az: 28, el: 14, fov: 24, pad: 0.12 },
        build(S) {
            S.add(hourglass({ h: 460 }))
        },
    },
    {
        name: "voordeel-vermogen",
        section: "Bedrijven · Voordeel 01 — Meer vermogen, zonder drie jaar wachten",
        shot: { shadowFloor: false,  width: 2000, height: 1400, az: 206, el: 18, fov: 24, pad: 0.1 },
        build(S) {
            const limit = 300
            const L = box(170, limit, 170, C.blue, { r: 14 })
            L.position.x = -170
            const R = box(170, limit, 170, C.blue, { r: 14 })
            R.position.x = 170
            const boost = box(170, 190, 170, C.green, { r: 14, y: limit + 8 })
            boost.name = "scroll_grow" // the Sett's extra power rises above the limit
            boost.position.x = 170
            S.add(L, R, boost)
            const lp = limitPlane(760, 330, C.red)
            lp.position.y = limit + 4
            S.add(lp)
            S.add(box(840, 10, 360, C.cream, { r: 5, y: -10 }))
        },
    },
    {
        name: "voordeel-netuitval",
        section: "Bedrijven · Voordeel 02 — Altijd stroom, ook als het net uitvalt",
        light: "night",
        dark: true,
        shot: { width: 2400, height: 1500, az: 28, el: 28, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            g.add(settAcross(0, -300))
            g.add(slab({ w: 2900, d: 1500, x: 0, z: 200, depth: 80, radius: 90, top: C.asphalt, side: C.groundSide, holes: [binHole(0, -300, { rotated: true })] }))
            g.add(at(factory({ w: 800, d: 440, h: 240, windows: DARK_WINDOWS }), -920, 0, 480))
            g.add(at(factory({ w: 800, d: 440, h: 240, windows: LIT_WINDOWS }), 0, 0, 480))
            g.add(at(factory({ w: 800, d: 440, h: 240, windows: DARK_WINDOWS }), 920, 0, 480))
            g.add(at(van(), -920, 0, -40, Math.PI - 0.03))
            g.add(at(car(), 560, 0, -210, Math.PI / 2 + 0.05)) // clear of the grid's dashed line
            g.add(energyLine([v(40, 8, -190), v(40, 8, 200), v(-80, 8, 200), v(-80, 8, 254)], C.energyLine))
            const t = at(pylon(780), 1300, 0, 1050, 0.3)
            g.add(t)
            t.updateMatrixWorld(true)
            const tip = t.userData.tips[0].clone().applyMatrix4(t.matrixWorld)
            g.add(energyLine([tip, v(tip.x, 8, tip.z), v(tip.x, 8, 120), v(140, 8, 120), v(140, 8, -250), v(100, 8, -250)], "#4A5170", { dashed: true, r: 2.6 }))
            S.add(g)
            S.point(v(0, 90, -300), 0x8dff66, 1.4, 520)
            S.point(v(0, 200, 180), 0xffcf99, 1.0, 700)
        },
    },
    {
        name: "voordeel-peakshaving",
        section: "Bedrijven · Voordeel 03 — Lagere energiekosten door Peak Shaving",
        shot: { shadowFloor: false,  width: 2400, height: 1200, az: 196, el: 16, fov: 24, pad: 0.06 },
        build(S) {
            const f = (u) => 0.18 + 0.2 * Math.exp(-(((u - 0.3) / 0.12) ** 2)) + 0.74 * Math.exp(-(((u - 0.62) / 0.07) ** 2)) + 0.12 * Math.sin(u * 19) * 0.3
            const cap = 0.5
            // the peak above the cap is what the Sett covers: the full curve in
            // green, slightly inset, under the capped curve in purple
            const capped = (u) => Math.min(cap, f(u))
            S.add(areaChart({ f: capped, w: 1500, h: 440, depth: 140, bands: [{ from: 0, to: 1, color: C.purple }] }))
            // where the curve pokes above the cap: u where f(u) > cap
            const us = []
            for (let i = 0; i <= 600; i++) if (f(i / 600) > cap) us.push(i / 600)
            if (us.length) {
                const peak = areaChart({ f, floor: () => cap - 0.004, w: 1500, h: 440, depth: 140, bevel: 3, samples: 600, bands: [{ from: us[0], to: us[us.length - 1], color: C.green }] })
                peak.name = "scroll_grow" // the peak the Sett shaves off
                S.add(peak)
            }
            const lp = limitPlane(1560, 250, C.red)
            lp.position.y = 12 + cap * 440 + 2
            S.add(lp)
            S.add(box(1620, 10, 270, C.cream, { r: 5, y: -10 }))
        },
    },
    {
        name: "voordeel-arbitrage",
        section: "Bedrijven/Particulieren · Voordeel 04 — Energie verhandelen",
        shot: { shadowFloor: false,  width: 2400, height: 1300, az: 196, el: 18, fov: 24, pad: 0.07 },
        build(S) {
            const f = (u) => 0.46 + 0.3 * Math.sin((u * 1.55 + 0.1) * Math.PI * 2) + 0.05 * Math.sin(u * 31)
            const price = areaChart({ f, w: 1500, h: 420, depth: 130, bands: [{ from: 0, to: 1, color: "#8DB8F5" }] })
            price.name = "scroll_grow"
            S.add(price)
            // koop in het dal, verkoop op de piek
            const trough = 0.44, peak = 0.795
            const lowY = 12 + f(trough) * 420, highY = 12 + f(peak) * 420
            const buy = arrow({ up: false, color: C.green, len: 150 })
            buy.position.set((trough - 0.5) * 1500, lowY + 190, 0)
            const sell = arrow({ up: true, color: C.sun, len: 150 })
            sell.position.set((peak - 0.5) * 1500, highY + 40, 0)
            buy.name = "scroll_bob_a"
            sell.name = "scroll_bob_b"
            S.add(buy, sell)
            S.add(box(1600, 10, 240, C.cream, { r: 5, y: -10 }))
        },
    },
    {
        name: "voordeel-delen",
        section: "Bedrijven · Voordeel 05 — Energie delen op het industrieterrein",
        shot: { width: 2400, height: 1600, az: 30, el: 38, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            g.add(settAcross(0, 0))
            g.add(slab({ w: 2800, d: 2300, x: 0, z: 350, depth: 80, radius: 90, top: C.asphalt, side: C.groundSide, holes: [binHole(0, 0, { rotated: true })] }))
            g.add(at(factory({ w: 760, d: 420, h: 220 }), -900, 0, 520))
            g.add(at(factory({ w: 760, d: 420, h: 250, teeth: 3 }), 900, 0, 520))
            g.add(at(office({ w: 640, d: 300, floors: 3 }), 0, 0, 1100))
            g.add(at(van(), -900, 0, -20, Math.PI - 0.03))
            g.add(at(car(), 900, 0, 20, Math.PI + 0.04))
            const out = [
                [v(-160, 8, 0), v(-540, 8, 0), v(-540, 8, 300)],
                [v(160, 8, 0), v(540, 8, 0), v(540, 8, 300)],
                [v(0, 8, 115), v(0, 8, 940)],
            ]
            out.forEach((p) => g.add(energyLine(p, C.energyLine)))
            const r = rng(2)
            ;[[-1250, -700], [1250, -720]].forEach((p) => g.add(at(tree(r, 0.9), p[0], 0, p[1])))
            S.add(g)
        },
    },
    // ================================================================ /gemeenten
    {
        name: "gemeente-laadplein",
        section: "Gemeenten · Voordeel 01 — Publieke laadplekken bij de appartementen",
        shot: { width: 2400, height: 1600, az: 30, el: 34, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [-520, 520], hz = -420
            hubs.forEach((x) => g.add(settAcross(x, hz)))
            const holes = hubs.map((x) => binHole(x, hz, { rotated: true }))
            g.add(slab({ w: 3000, d: 2400, x: 0, z: 300, depth: 80, radius: 90, top: C.grass, side: C.groundSide, holes }))
            g.add(slab({ w: 2800, d: 1200, x: 0, z: -330, depth: 3, bevel: 0, radius: 26, top: C.asphalt, side: C.asphalt, y: 0.8, holes }))
            ;[-990, 0, 990].forEach((x, i) => g.add(at(car(), x, 0, -470, Math.PI / 2 + (i - 1) * 0.03)))
            ;[-750, 260].forEach((x, i) => g.add(at(car(), x, 0, -40, -Math.PI / 2 + i * 0.04)))
            const a = at(office({ w: 1000, d: 460, floors: 6 }), -640, 0, 860)
            const b = at(office({ w: 760, d: 460, floors: 4 }), 820, 0, 860)
            g.add(a, b)
            const r = rng(8)
            ;[[-1300, 380], [80, 420], [1320, 360], [-1450, 1150]].forEach((p) => g.add(at(tree(r, 0.85), p[0], 0, p[1])))
            hubs.forEach((x, i) => feed(g, x, hz + 120, v(i ? 820 : -640, 0, 860 - 236), { via: 300 }))
            S.add(g)
        },
    },
    {
        name: "gemeente-nieuwbouw",
        section: "Gemeenten · Voordeel 02 — Nieuwbouwwijk: laden en opslag vanaf dag één",
        shot: { width: 2400, height: 1600, az: 30, el: 36, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [-760, 640], hz = -420
            hubs.forEach((x) => g.add(settAcross(x, hz)))
            const holes = hubs.map((x) => binHole(x, hz, { rotated: true }))
            g.add(slab({ w: 3200, d: 2200, x: 0, z: 200, depth: 80, radius: 90, top: C.grass, side: C.groundSide, holes }))
            g.add(slab({ w: 3000, d: 560, x: 0, z: -470, depth: 3, bevel: 0, radius: 26, top: C.asphalt, side: C.asphalt, y: 0.8, holes }))
            const r = rng(14)
            const row = at(rowHouses({ n: 4, r }), -620, 0, 560)
            const flats = at(office({ w: 820, d: 480, floors: 5 }), 1020, 0, 600)
            g.add(row, flats)
            ;[[-1260, 0.02], [-60, -0.02], [1180, 0.03]].forEach(([x, ry]) => g.add(at(car(), x, 0, -470, Math.PI / 2 + ry)))
            ;[-1450, 230, 1500].forEach((x) => g.add(at(tree(r, 0.8), x, 0, -90)))
            const d = doorsOf(row).reduce((p, q) => (Math.abs(q.x - hubs[0]) < Math.abs(p.x - hubs[0]) ? q : p))
            feed(g, hubs[0], hz + 120, d.add(v(0, 0, -30)), { via: -160 })
            feed(g, hubs[1], hz + 120, v(1020, 0, 600 - 250), { via: -160 })
            S.add(g)
        },
    },
    {
        name: "gemeente-sporthal",
        section: "Gemeenten · Voordeel 04 — Sporthal: zonnestroom van het dak, laden op het parkeerterrein",
        shot: { width: 2400, height: 1600, az: 32, el: 32, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [-380, 520], hz = -520
            hubs.forEach((x) => g.add(settAcross(x, hz)))
            const holes = hubs.map((x) => binHole(x, hz, { rotated: true }))
            g.add(slab({ w: 3000, d: 2500, x: 0, z: 250, depth: 80, radius: 90, top: C.grass, side: C.groundSide, holes }))
            g.add(slab({ w: 2600, d: 760, x: 0, z: -520, depth: 3, bevel: 0, radius: 26, top: C.asphalt, side: C.asphalt, y: 0.8, holes }))
            const hall = at(sportsHall(), 0, 0, 640)
            g.add(hall)
            ;[[-850, 0.02], [70, -0.03], [990, 0.02]].forEach(([x, ry]) => g.add(at(car(), x, 0, -570, Math.PI / 2 + ry)))
            const r = rng(31)
            ;[[-1300, -20], [1300, -40], [-1250, 1150], [1250, 1200]].forEach((p) => g.add(at(tree(r, 0.9), p[0], 0, p[1])))
            // the roof's sun into the Sett, the Sett into the hall's entrance
            const e = hall.userData.entrance.clone().add(hall.position)
            g.add(energyLine([v(600, 470, 300), v(600, 470, 186), v(600, 8, 186), v(600, 8, -30), v(hubs[1], 8, -30), v(hubs[1], 8, hz + 120)], C.energyDay))
            feed(g, hubs[0], hz + 120, e.add(v(0, 0, -20)), { via: -30 })
            S.add(g)
        },
    },
    {
        name: "gemeente-wijk",
        section: "Gemeenten · Voordeel 05 — Schaalbaar: sporthal, school en woningen in één wijk",
        shot: { width: 2400, height: 1600, az: 30, el: 40, fov: 28, pad: 0.05 },
        build(S) {
            const g = new THREE.Group()
            const hubs = [-1150, 150, 1350], hz = -560
            hubs.forEach((x) => g.add(settAcross(x, hz)))
            const holes = hubs.map((x) => binHole(x, hz, { rotated: true }))
            g.add(slab({ w: 4000, d: 2500, x: 0, z: 150, depth: 80, radius: 90, top: C.grass, side: C.groundSide, holes }))
            g.add(slab({ w: 3800, d: 560, x: 0, z: -610, depth: 3, bevel: 0, radius: 26, top: C.asphalt, side: C.asphalt, y: 0.8, holes }))
            const hall = at(sportsHall({ w: 1150, d: 760, h: 400, rows: 3, cols: 7 }), -1150, 0, 560)
            const school = at(office({ w: 1000, d: 520, floors: 2, fh: 120 }), 150, 0, 540)
            const row = at(rowHouses({ n: 3, r: rng(3) }), 1350, 0, 520)
            g.add(hall, school, row)
            ;[[-500, 0.02], [800, -0.03], [1850, 0.02]].forEach(([x, ry]) => g.add(at(car(), x, 0, -610, Math.PI / 2 + ry)))
            const r = rng(41)
            ;[[-500, 300], [770, 280], [-1850, -200], [1880, 240]].forEach((p) => g.add(at(tree(r, 0.85), p[0], 0, p[1])))
            // each Sett feeds its own building; a line along the street ties them together
            feed(g, hubs[0], hz + 120, hall.userData.entrance.clone().add(hall.position).add(v(0, 0, -20)), { via: -160 })
            feed(g, hubs[1], hz + 120, v(150, 0, 540 - 280), { via: -160 })
            const d = doorsOf(row).reduce((p, q) => (Math.abs(q.x - hubs[2]) < Math.abs(p.x - hubs[2]) ? q : p))
            feed(g, hubs[2], hz + 120, d.add(v(0, 0, -30)), { via: -160 })
            g.add(energyLine([v(hubs[0], 8, -250), v(hubs[2], 8, -250)], C.energyLine, { dashed: true }))
            S.add(g)
        },
    },
]
