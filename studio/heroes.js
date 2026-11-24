// Page heroes for /particulieren, /bedrijven and /gemeenten: static scenes exported as
// GLB for the SettHero3D component, which lights and animates them.
import { THREE, C, GRADE, P, settBox, chargePole, house, car, rowHouses, homeSet, tree, bush, pylon, slab, energyLine, rng, v, named, warehouse, van, hedge, flowerBed, glowMat, originDot, cableCenterline, chargeCable, filletPath, corrugated } from "./core.js"

// the homepage's line: thin, six-sided, no end beads (the start gets an originDot)
const LINE = { r: 2.8, radial: 6, segLen: 6, beads: false }

const W = (x, y, z) => v(x - P.settCenter.x, y - GRADE, z - P.settCenter.z)
const Wl = (pts) => pts.map((p) => W(p[0], p[1], p[2]))
// rotated: the unit turned a quarter about y (+π/2), or "back" for −π/2
function binHole(cx = 0, cz = 0, { pad = 2, rotated = false } = {}) {
    const b = P.settBox, c = P.settCenter
    let hx0 = b.min.x - c.x - pad, hx1 = b.max.x - c.x + pad, hz0 = b.min.z - c.z - pad, hz1 = b.max.z - c.z + pad
    if (rotated === "back") [hx0, hx1, hz0, hz1] = [-hz1, -hz0, hx0, hx1]
    else if (rotated) [hx0, hx1, hz0, hz1] = [hz0, hz1, -hx1, -hx0]
    return { x0: cx + hx0, x1: cx + hx1, z0: cz + hz0, z1: cz + hz1 }
}
function at(o, x, y, z, ry = 0) {
    o.position.set(x, y, z)
    o.rotation.y = ry
    return o
}
// the region the camera frames (the rest is context that may crop)
function focus(g, box) {
    g.userData.frame = { min: box.min.toArray(), max: box.max.toArray() }
}

// ---------------------------------------------------------------- particulieren
// the heroes keep the Sett's inside in the live homepage scene's colours (its
// Framer settings), so the page heroes and the homepage show the same unit
export const HOME_SETT = { settBin: "#95A3C2", battery: "#25CF77", batteryBlocks: "#2544CF", inverter: "#95A3C2", cooling: "#525252" }
function homeSett(g) {
    const made = new Map()
    g.traverse((o) => {
        if (!o.isMesh) return
        const swap = (m) => {
            const hex = m && HOME_SETT[m.name]
            if (!hex) return m
            if (!made.has(m)) {
                const n = m.clone()
                n.name = m.name
                n.color = new THREE.Color(hex)
                made.set(m, n)
            }
            return made.get(m)
        }
        o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material)
    })
    return g
}

export function heroParticulieren() {
    const g = new THREE.Group()
    g.name = "hero-particulieren"
    const set = homeSet({ carOn: true, trees: false, bushes: true, cable: true })
    g.add(set)
    // the charge cable, rebuilt as on the homepage: a lean grey tube along the
    // exported cable's centreline (the original mesh stays out of the export)
    set.traverse((o) => o.isMesh && /^Pipe\.002/.test(o.name) && (o.visible = false))
    const origin = new THREE.Vector3(P.settCenter.x, GRADE, P.settCenter.z)
    const socket = new THREE.Box3().setFromObject(P.parts["Extruded.009"]).getCenter(new THREE.Vector3())
    const cl = cableCenterline(P.parts["Pipe.002"], socket)
    const cablePts = cl.points.map((p) => p.clone().sub(origin))
    const cableR = cl.radius * 2.6
    const r = rng(11)
    const holes = [binHole()]
    // lawn plot, paved driveway with the pit, pavement and street in front
    const LAWN = "#C9D4B8"
    g.add(slab({ w: 2700, d: 2500, x: 150, z: 520, depth: 8, bevel: 0, radius: 30, top: LAWN, side: "#B7C2A5", topName: "lawn", sideName: "lawn", holes }))
    g.add(slab({ w: 820, d: 900, x: -250, z: -190, depth: 4, bevel: 0, radius: 16, top: "#D6CFC2", side: "#C7BFB1", topName: "paving", sideName: "paving", holes, y: 1 }))
    g.add(slab({ w: 2700, d: 150, x: 150, z: -720, depth: 10, bevel: 0, radius: 4, top: "#D9D6CF", side: "#C9C5BC", topName: "pavement", sideName: "pavement", y: 2 }))
    g.add(slab({ w: 2700, d: 520, x: 150, z: -1060, depth: 10, bevel: 0, radius: 4, top: "#8E9199", side: "#7E8189", topName: "road", sideName: "road", y: -2 }))
    // garden: the homepage's bushes along the facade (from homeSet), a low shrub
    // border in the front garden (no flowers), a hedge on the plot line, trees behind
    const SHRUB = "#AAB79C"
    g.add(at(flowerBed(420, 60, r, [], SHRUB), 700, 0, 60))
    // the hedge on the plot line leaves room for the path, which runs on to the pavement
    g.add(at(hedge(910, r), 835, 0, -560))
    g.add(slab({ w: 102, d: 210, x: 310, z: -545, depth: 3, bevel: 0, radius: 2, top: C.pathway, side: C.pathway, topName: "pathway", sideName: "pathway", y: 1.6 }))
    const h2 = hedge(900, r)
    at(h2, 1320, 0, 150, Math.PI / 2)
    g.add(h2)
    ;[[-700, 700], [700, 1150], [-250, 1350], [1250, 900], [-1050, 150]].forEach(([x, z], i) => {
        const t = tree(r, i === 4 ? 0.9 : 1.05)
        t.name = "tree_" + i
        at(t, x, 0, z, t.rotation.y)
        g.add(t)
    })
    // energy, in the homepage's colours and style: gold from the panels to the
    // Sett, green from the Sett to the front door and, along the cable, to the car
    const solar = [[372, 612, 505], [372, 612, 433], [372, 322, 433], [372, 322, 376], [372, 80, 376], [372, 80, 250], [0, 80, 250], [0, 82, 120], [0, 82, -10], [-47, 82, -10], [-47, 72, -10]]
    const battery = [-2, 72, -12]
    const toHouse = [battery, [-2, 82, -12], [82, 82, -12], [82, 82, 240], [244, 82, 240], [244, 82, 392], [303, 82, 392], [303, 96, 402]]
    g.add(energyLine(Wl(solar), C.energyDay, Object.assign({ name: "energy_solar" }, LINE)))
    g.add(energyLine(Wl(toHouse), C.green, Object.assign({ name: "energy_flow" }, LINE)))
    // up the pole's bin-facing side like a conduit, into the socket, along the cable
    const toSocket = filletPath(Wl([battery, [-2, 82, -12], [-39, 82, -12], [-39, 82, 172], [-39, socket.y - 4, 172]]), 12)
    g.add(chargeCable(cablePts, cableR))
    const carLine = toSocket.concat([cablePts[0]])
    g.add(energyLine(carLine, C.green, Object.assign({ name: "energy_flow" }, LINE)))
    g.add(originDot(W(357, 612, 505), "energy_solar"))
    g.add(originDot(W(battery[0], battery[1], battery[2]), "energy_flow"))
    // frame the Sett, the car and the front of the house; the rest may crop
    focus(g, new THREE.Box3(v(-620, 0, -560), v(420, 560, 640)))
    return homeSett(g)
}

// ---------------------------------------------------------------- bedrijven
export function heroBedrijven() {
    const g = new THREE.Group()
    g.name = "hero-bedrijven"
    const r = rng(23)
    const wh = warehouse({ w: 1700, d: 950, h: 560 })
    const whZ = 600
    at(wh, 0, 0, whZ)
    g.add(wh)
    const front = whZ - 475
    const doorA = wh.userData.doorA
    // the Sett in the yard in front of the open door, laid along the facade,
    // its batteries toward the van
    const hubX = doorA.x - 40, hubZ = front - 470
    const hub = at(settBox({ poles: 2 }), hubX, 0, hubZ, -Math.PI / 2)
    g.add(hub)
    const holes = [binHole(hubX, hubZ, { rotated: "back" })]
    // yard paving and the verge around it
    g.add(slab({ w: 3000, d: 1500, x: 0, z: front - 700, depth: 8, bevel: 0, radius: 20, top: "#8F939B", side: "#80848C", topName: "yardPaving", sideName: "yardPaving", holes, y: 0 }))
    g.add(slab({ w: 3000, d: 700, x: 0, z: whZ + 150, depth: 8, bevel: 0, radius: 20, top: "#9FAE86", side: "#8C9A75", topName: "lawn", sideName: "lawn", y: -1 }))
    // parking bays by the office
    const lineM = named("marking", "#E9ECEF")
    ;[260, 530, 800].forEach((x) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 520), lineM)
        b.position.set(x, 1, front - 300)
        b.receiveShadow = true
        g.add(b)
    })
    // the van at the pole, nose to the camera, its charge port toward the Sett
    const vn = van()
    at(vn, hubX + 340, 0, front - 360, Math.PI + 0.02)
    g.add(vn)
    g.add(at(car(), 395, 0, front - 320, 0.01))
    // no physical cable came with the rotated unit; one is drawn to the van below
    // greenery at the edges, the grid far behind
    const h1 = hedge(700, r)
    at(h1, -1250, 0, front - 500, Math.PI / 2)
    g.add(h1)
    ;[[-1250, whZ + 150], [1150, whZ + 350], [-1450, front - 1000], [1350, front - 700]].forEach(([x, z], i) => {
        const t = tree(r, 1.1)
        t.name = "tree_" + i
        at(t, x, 0, z, t.rotation.y)
        g.add(t)
    })
    const py = at(pylon(1100), -2100, 0, whZ + 1500, 0.4)
    g.add(py)
    // energy: Sett → the workshop wall, Sett's pole → the van's charge port
    const hb = holes[0]
    // out of the batteries (the modules' end of the rotated unit), across the yard, into the workshop wall
    const batt = v(hubX + 136, -17, hubZ)
    // …up the wall beside the open door, on the van's side of it
    const entryX = doorA.x + doorA.w / 2 + 42
    const toBuilding = [batt, v(batt.x, 8, batt.z), v(hubX + 80, 8, batt.z), v(hubX + 80, 8, front - 40), v(entryX, 8, front - 40), v(entryX, 8, front - 8), v(entryX, 60, front - 8)]
    g.add(energyLine(toBuilding, C.green, Object.assign({ name: "energy_flow" }, LINE)))
    g.add(originDot(batt, "energy_flow"))
    // a charge cable from the pole's socket to the van's port, in the homepage's
    // style (grey cable, pulsing green sheath). The poles stand at the far end of
    // the unit, so the cable drops off the front pole and lies on the paving
    // along the camera side of the pit, rising to the port at the van's flank
    hub.updateMatrixWorld(true)
    vn.updateMatrixWorld(true)
    const port = vn.localToWorld(vn.userData.port ? vn.userData.port.clone() : v(-102, 118, -150))
    let sock = null
    hub.traverse((o) => {
        if (!o.isMesh || o.name !== "Extruded.009") return
        const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
        if (!sock || c.z < sock.z) sock = c // the pole nearer the camera
    })
    const toVan = Math.sign(port.x - sock.x) // along the unit, toward the van
    const lay = hb.z0 - 26 // on the paving, just clear of the pit's front edge
    const cablePath = [
        sock,
        sock.clone().add(v(toVan * 12, -8, -4)),
        v(sock.x + toVan * 22, 48, (sock.z + lay) / 2),
        v(sock.x + toVan * 38, 3, lay),
        v(port.x - toVan * 90, 3, lay),
        v(port.x - toVan * 28, 4, (lay + port.z) / 2),
        v(port.x - toVan * 10, port.y * 0.45, port.z - 6),
        port.clone().add(v(-toVan * 3, -6, 0)),
        port,
    ]
    // the spline sags between the lying points: keep it on top of the paving
    const cablePts = new THREE.CatmullRomCurve3(cablePath, false, "centripetal", 0.5).getPoints(60)
    cablePts.forEach((q) => (q.y = Math.max(q.y, 3.6)))
    g.add(chargeCable(cablePts, 3.4))
    // the Sett, the van and the open workshop; the office end may run under the headline
    focus(g, new THREE.Box3(v(-900, 0, front - 640), v(420, 600, front + 120)))
    return homeSett(g)
}

// ---------------------------------------------------------------- gemeenten
// a residential street: a terrace behind its front gardens, the pavement with street
// trees, and the shared parking strip with two Setts under it, each feeding the house
// nearest to it and the car charging at its pole. Framed close on the middle of the
// street; the ends of the terrace may crop
export function heroGemeenten() {
    const g = new THREE.Group()
    g.name = "hero-gemeenten"
    const r = rng(5)
    const hubs = [-520, 520], hubZ = -420
    hubs.forEach((x) => g.add(at(settBox(), x, 0, hubZ, Math.PI / 2)))
    const holes = hubs.map((x) => binHole(x, hubZ, { rotated: true }))
    g.add(slab({ w: 3400, d: 2300, x: 0, z: 250, depth: 8, bevel: 0, radius: 30, top: "#9FAE86", side: "#8C9A75", topName: "lawn", sideName: "lawn", holes, y: -1 }))
    g.add(slab({ w: 3400, d: 230, x: 0, z: -40, depth: 6, bevel: 0, radius: 4, top: "#8F939B", side: "#80848C", topName: "yardPaving", sideName: "yardPaving", y: 1 }))
    g.add(slab({ w: 3400, d: 560, x: 0, z: -470, depth: 6, bevel: 0, radius: 4, top: "#8F939B", side: "#80848C", topName: "yardPaving", sideName: "yardPaving", holes, y: 0.5 }))
    // bay lines across the strip
    const lineM = named("marking", "#E9ECEF")
    ;[-1500, -770, -260, 260, 770, 1500].forEach((x) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 500), lineM)
        b.position.set(x, 4, -470)
        b.receiveShadow = true
        g.add(b)
    })
    const row = at(rowHouses({ n: 7, r }), 0, 0, 620)
    g.add(row)
    const doors = row.userData.doors.map((d) => d.clone().add(row.position))
    // cars in the bays; the two beside the Setts' poles charge
    ;[[-1130, 0.02], [0, -0.03], [1130, 0.03]].forEach(([x, ry]) => g.add(at(car(), x, 0, -470, Math.PI / 2 + ry)))
    ;[-1300, -260, 760, 1700].forEach((x, i) => {
        const t = tree(r, 0.85)
        t.name = "tree_" + i
        at(t, x, 0, -40, t.rotation.y)
        g.add(t)
    })
    hubs.forEach((x, i) => {
        const d = doors.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a))
        const start = v(x, 8, hubZ + 120)
        g.add(energyLine([start, v(x, 8, -150), v(d.x, 8, -150), v(d.x, 8, d.z - 30), v(d.x, 40, d.z - 6)], C.green, Object.assign({ name: "energy_flow" }, LINE)))
        g.add(originDot(start, "energy_flow"))
    })
    // the middle of the street: both Setts, the car between them and the houses behind
    focus(g, new THREE.Box3(v(-900, 0, -760), v(900, 420, 700)))
    return homeSett(g)
}

// ---------------------------------------------------------------- slide: kantoor + datacenter
// For a presentation slide (studio/slide.html), not the site: the bedrijven building with
// offices in its left two thirds and, behind a large window on the right, a server room with
// a big rack. Three Setts in a row in the yard: one charges a car, all three feed the offices
// and the rack. Front at -z; +x is screen-left from the camera
function lit(hex, emissive, intensity, name) {
    const m = new THREE.MeshStandardMaterial({ color: hex, emissive, emissiveIntensity: intensity, roughness: 1 })
    m.name = name
    return m
}
// a server rack (after a liquid-cooled GPU rack): a black cabinet, eight server trays with
// status lights, silver coolant manifolds with their connectors and hoses down both sides,
// brass fittings on top and a power unit with a screen at the bottom. Front at -z
function serverRack({ W = 180, H = 440, D = 130 } = {}) {
    const g = new THREE.Group()
    g.name = "serverRack"
    const box = (w, h, d, m, x, y, z) => {
        const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
        o.position.set(x, y, z)
        o.castShadow = o.receiveShadow = true
        g.add(o)
        return o
    }
    const cab = named("rack", "#111318"), back = named("rackInner", "#1B1E25"), unit = named("rackUnit", "#2C3038")
    const steel = named("rackSteel", "#C7CCD4"), hose = named("rackCable", "#5E636C"), brass = named("rackBrass", "#C9A55B")
    const green = lit("#22FF44", "#22FF44", 1.2, "serverLed"), blue = lit("#1C7BFF", "#1C7BFF", 1.3, "serverLed"), screen = lit("#4FD0FF", "#3FB8F0", 1, "serverLed")
    const zf = -D / 2
    // cabinet: sides, top, bottom, the dark inside, feet
    box(8, H, D, cab, -W / 2 + 4, H / 2 + 8, 0)
    box(8, H, D, cab, W / 2 - 4, H / 2 + 8, 0)
    box(W, 10, D, cab, 0, H + 3, 0)
    box(W, 12, D, cab, 0, 14, 0)
    box(W - 16, H - 20, 4, back, 0, H / 2 + 8, D / 2 - 6)
    ;[-W / 2 + 12, W / 2 - 12].forEach((x) => [zf + 12, -zf - 12].forEach((z) => box(10, 8, 10, cab, x, 4, z)))
    // eight trays, each with its lights
    const trayW = W - 64
    for (let i = 0; i < 8; i++) {
        const y = 92 + i * 38
        box(trayW, 32, D - 24, unit, 0, y, 4)
        box(trayW, 32, 2, named("rackUnitFace", "#353A43"), 0, y, zf + 9)
        ;[-1, 1].forEach((sgn) => {
            for (let k = 0; k < 3; k++) box(5, 9, 2, green, sgn * (trayW / 2 - 8), y - 9 + k * 9, zf + 7.5)
            box(7, 7, 2, blue, sgn * (trayW / 2 - 22), y + 6, zf + 7.5)
        })
        // a row of activity lights across the tray, green and blue
        for (let k = 0; k < 6; k++) box(6, 4, 2, k % 2 ? blue : green, -30 + k * 12, y + 9, zf + 7.5)
        box(20, 6, 2, named("rackPort", "#0D0F13"), -14, y - 6, zf + 7.5)
        box(10, 6, 2, named("rackPort", "#0D0F13"), 14, y - 6, zf + 7.5)
    }
    // the coolant manifolds down both sides, their connectors, and a hose to every tray
    ;[-1, 1].forEach((sgn) => {
        const x = sgn * (W / 2 - 20)
        box(12, H - 50, 12, steel, x, H / 2 + 6, zf + 4)
        for (let k = 0; k < 22; k++) {
            const c = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 10, 10), steel)
            c.rotation.z = Math.PI / 2
            c.position.set(x - sgn * 9, 52 + k * 17, zf + 4)
            c.castShadow = true
            g.add(c)
        }
        for (let i = 0; i < 8; i++) box(18, 4, 4, hose, x - sgn * 18, 92 + i * 38 + 8, zf + 6)
        // brass fittings on top, the hoses out at the bottom
        const b = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 22, 12), brass)
        b.position.set(x, H + 18, zf + 4)
        g.add(b)
        const t = new THREE.Mesh(new THREE.TorusGeometry(16, 5, 8, 16, Math.PI / 2), hose)
        t.position.set(x - sgn * 16, 40, zf + 4)
        t.rotation.z = sgn > 0 ? Math.PI : -Math.PI / 2
        g.add(t)
    })
    // the power unit with its screen
    box(W - 50, 46, 10, named("rackUnit", "#2C3038"), 0, 52, zf + 6)
    box(34, 18, 2, screen, -24, 56, zf + 0.5)
    g.userData.size = { W, H, D }
    return g
}
// office furniture, front of the desk toward -z (the window): a desk with a monitor whose
// screen faces the window, a chair behind it (the person faces the window)
function desk(g, x, y, z, M) {
    const add = (w, h, d, m, px, py, pz) => {
        const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
        o.position.set(x + px, y + py, z + pz)
        o.castShadow = o.receiveShadow = true
        g.add(o)
    }
    add(150, 5, 72, M.top, 0, 74, 0)
    ;[-68, 68].forEach((dx) => add(5, 72, 64, M.leg, dx, 36, 0))
    add(56, 34, 4, M.dark, 0, 112, -14)
    add(50, 28, 1, M.screen, 0, 112, -16.5)
    add(8, 22, 8, M.leg, 0, 88, -10)
    // the chair, on the window side
    add(52, 6, 50, M.chair, 0, 46, -62)
    add(52, 52, 6, M.chair, 0, 74, -88)
    add(6, 40, 6, M.leg, 0, 24, -62)
}
function plant(g, x, y, z, M, s = 1) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(16 * s, 12 * s, 34 * s, 10), M.pot)
    pot.position.set(x, y + 17 * s, z)
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(30 * s, 0), M.plant)
    leaf.position.set(x, y + 34 * s + 26 * s, z)
    ;[pot, leaf].forEach((o) => ((o.castShadow = o.receiveShadow = true), g.add(o)))
}
function officeDatacenter({ w = 1700, d = 950, h = 600 } = {}) {
    const g = new THREE.Group()
    g.name = "officeDatacenter"
    const clad = named("cladding", "#566072"), officeWall = named("cladding", "#5E6879")
    const trim = named("trim", "#2B2F37"), frame = named("trim", "#1F232B"), roof = named("roof", "#565C68")
    const win = named("windows", C.windows), glass = named("glass", "#A9C8EE")
    const inner = named("interior", "#B9BCC4"), innerFloor = named("interiorFloor", "#8C8F95")
    const dark = named("roomDark", "#171B22"), darkFloor = named("roomDark", "#1E232C")
    const lamp = new THREE.MeshStandardMaterial({ color: "#fff4e0", emissive: "#ffe2b0", emissiveIntensity: 1.6, roughness: 1 })
    lamp.name = "interiorLight"
    const wallLamp = new THREE.MeshStandardMaterial({ color: "#fff1d6", emissive: "#ffd9a0", emissiveIntensity: 1.4, roughness: 1 })
    wallLamp.name = "wallLamp"
    const screen = lit("#9CC9FF", "#8FC2FF", 1.1, "screenLight")
    const F = { top: named("interiorDark", "#E3E5EA"), leg: named("interiorDark", "#3B3F48"), dark: named("interiorDark", "#1B1E24"), chair: named("interiorDark", "#2E3440"), screen, pot: named("interiorDark", "#C9C2B6"), plant: named("plant", "#5E8F5A") }
    const add = (m, x, y, z) => {
        m.position.set(x, y, z)
        m.castShadow = m.receiveShadow = true
        g.add(m)
        return m
    }
    const boxM = (bw, bh, bd, material) => new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), material)
    const z0 = -d / 2
    const split = -w / 2 + 600 // server room on the right (-x), offices on the rest
    const xw = -w / 2 + 300, ww = 470, wy0 = 70, wy1 = 430
    const panel = (x0, x1, y0, y1) => {
        const p = corrugated(x1 - x0, y1 - y0, { material: clad })
        p.position.set((x0 + x1) / 2, y0, z0)
        g.add(p)
    }
    panel(-w / 2, xw - ww / 2, 0, h)
    panel(xw - ww / 2, xw + ww / 2, 0, wy0)
    panel(xw - ww / 2, xw + ww / 2, wy1, h)
    panel(xw + ww / 2, split, 0, h)
    // sides, back, roof, parapet, corners
    const side = corrugated(d, h, { material: clad })
    side.rotation.y = -Math.PI / 2
    side.position.set(w / 2, 0, 0)
    g.add(side)
    add(boxM(w, h, 8, clad), 0, h / 2, d / 2 - 4)
    add(boxM(8, h, d, clad), -w / 2 + 4, h / 2, 0)
    add(boxM(w + 4, 14, d + 4, roof), 0, h - 7, 0)
    add(boxM(w + 16, 26, 10, trim), 0, h + 6, z0 - 3)
    add(boxM(10, 26, d + 16, trim), w / 2 + 3, h + 6, 0)
    ;[-w / 2, w / 2].forEach((x) => add(boxM(12, h, 12, trim), x, h / 2, z0 - 2))
    add(boxM(16, h + 20, 16, trim), split, h / 2 + 4, z0 - 6)

    // ---------------------------------------------------------------- offices
    const ox0 = split + 8, ox1 = w / 2 - 6, ow = ox1 - ox0, ocx = (ox0 + ox1) / 2
    const bands = [{ y0: 60, y1: 262 }, { y0: 350, y1: 528 }]
    // the facade around the window bands: base, the floor between, the top
    const ex = w / 2 - 250 // the entrance
    const dx0 = ex - 98, dx1 = ex + 98 // the doorway, down to the ground
    ;[[262, 350], [528, h]].forEach(([y0, y1]) => add(boxM(ow, y1 - y0, 10, officeWall), ocx, (y0 + y1) / 2, z0 - 2))
    ;[[ox0, dx0], [dx1, ox1]].forEach(([a, b2]) => add(boxM(b2 - a, 60, 10, officeWall), (a + b2) / 2, 30, z0 - 2))
    bands.forEach(({ y0, y1 }, fi) => {
        // glass across the band, mullions every bay, a transom, a sill
        add(boxM(ow, y1 - y0, 3, glass), ocx, (y0 + y1) / 2, z0 - 1)
        const n = 7
        for (let k = 0; k <= n; k++) add(boxM(k === 0 || k === n ? 14 : 9, y1 - y0, 16, frame), ox0 + (ow / n) * k, (y0 + y1) / 2, z0 - 5)
        add(boxM(ow, 7, 14, frame), ocx, y1 - (y1 - y0) * 0.22, z0 - 4)
        add(boxM(ow, 8, 16, frame), ocx, y1 - 4, z0 - 5)
        // the sill (the ground floor's leaves the doorway open)
        if (fi) add(boxM(ow + 10, 10, 26, trim), ocx, y0 - 5, z0 - 11)
        else [[ox0 - 5, dx0], [dx1, ox1 + 5]].forEach(([a, b2]) => add(boxM(b2 - a, 10, 26, trim), (a + b2) / 2, y0 - 5, z0 - 11))
    })
    // the entrance: a frame round the glass doors, the handle bars, the canopy
    add(boxM(196, 12, 16, frame), ex, 256, z0 - 7)
    ;[ex - 92, ex, ex + 92].forEach((x) => add(boxM(10, 256, 16, frame), x, 128, z0 - 7))
    add(boxM(196, 8, 16, frame), ex, 4, z0 - 7)
    add(boxM(184, 60, 3, glass), ex, 30, z0 - 1)
    ;[ex - 14, ex + 14].forEach((x) => add(boxM(4, 70, 6, named("trim", "#C7CCD4")), x, 140, z0 - 16))
    add(boxM(300, 12, 130, trim), ex, 284, z0 - 66)
    // inside: floors, ceilings, walls, lights
    const od = 440
    add(boxM(ow, 4, od, innerFloor), ocx, 3, z0 + od / 2)
    add(boxM(ow, 14, od, innerFloor), ocx, 305, z0 + od / 2)
    add(boxM(ow, 8, od, inner), ocx, h - 24, z0 + od / 2)
    add(boxM(ow, h - 30, 8, inner), ocx, (h - 30) / 2, z0 + od)
    add(boxM(8, h - 30, od, inner), ox0 + 4, (h - 30) / 2, z0 + od / 2)
    add(boxM(8, h - 30, od, inner), ox1 - 4, (h - 30) / 2, z0 + od / 2)
    ;[ocx - ow * 0.32, ocx, ocx + ow * 0.32].forEach((x) => {
        add(boxM(120, 4, 40, lamp), x, 294, z0 + od * 0.45)
        add(boxM(120, 4, 40, lamp), x, h - 30, z0 + od * 0.45)
    })
    // ground floor: a reception desk by the entrance, two rows of desks, plants
    add(boxM(220, 100, 60, F.top), ex, 50, z0 + 150)
    add(boxM(226, 8, 66, F.leg), ex, 104, z0 + 150)
    plant(g, ex + 150, 6, z0 + 70, F, 1.1)
    plant(g, ox0 + 60, 6, z0 + 80, F, 1.2)
    ;[ox0 + 180, ox0 + 390, ox0 + 600].forEach((x) => [z0 + 170, z0 + 330].forEach((z) => desk(g, x, 6, z, F)))
    // first floor: desks along the window, a meeting table at the far end
    ;[ox0 + 160, ox0 + 360, ox0 + 560].forEach((x) => desk(g, x, 312, z0 + 190, F))
    add(boxM(260, 6, 110, F.top), ex - 20, 386, z0 + 230)
    ;[-110, 110].forEach((dx) => add(boxM(6, 66, 90, F.leg), ex - 20 + dx, 349, z0 + 230))
    for (let k = 0; k < 4; k++) [-1, 1].forEach((sg) => add(boxM(44, 44, 40, F.chair), ex - 110 + k * 60, 340, z0 + 230 + sg * 82))
    plant(g, ox1 - 60, 312, z0 + 90, F, 1)
    // side windows, two floors
    for (let k = 0; k < 3; k++) [170, 440].forEach((y) => add(boxM(8, 120, 160, win), w / 2 + 6, y, -d / 2 + 190 + k * 260))

    // ---------------------------------------------------------------- the server room
    // dark: lit only by the racks' own lights
    const room = { w: ww + 120, d: 460, h: h - 40 }
    add(boxM(room.w, 6, room.d, darkFloor), xw, 3, z0 + room.d / 2)
    add(boxM(room.w, room.h, 8, dark), xw, room.h / 2, z0 + room.d)
    add(boxM(8, room.h, room.d, dark), xw - room.w / 2, room.h / 2, z0 + room.d / 2)
    add(boxM(8, room.h, room.d, dark), xw + room.w / 2, room.h / 2, z0 + room.d / 2)
    add(boxM(room.w, 8, room.d, dark), xw, room.h, z0 + room.d / 2)
    // two racks side by side, half the size, each with its glow
    const racks = [-56, 56].map((dx) => {
        const r = serverRack()
        r.scale.setScalar(0.5)
        r.position.set(xw + dx, 6, z0 + 230)
        g.add(r)
        const glow = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), named("serverGlow", "#5CFFB0"))
        glow.position.set(xw + dx, 60, z0 + 230 - 60)
        g.add(glow)
        return r
    })
    // the door between the server room and the offices: a door leaf with its frame and handle
    // on both faces of the wall between them
    const doorM = named("door", "#3A404C"), doorFrame = named("trim", "#1F232B"), handle = named("trim", "#C7CCD4")
    const dz = z0 + 330, dH = 215, dW = 96
    ;[[xw + room.w / 2 - 5, -1], [ox0 + 9, 1]].forEach(([x, face]) => {
        add(boxM(3, dH, dW, doorM), x, dH / 2 + 6, dz)
        add(boxM(4, dH + 10, 8, doorFrame), x + face * 0.5, (dH + 10) / 2 + 6, dz - dW / 2 - 4)
        add(boxM(4, dH + 10, 8, doorFrame), x + face * 0.5, (dH + 10) / 2 + 6, dz + dW / 2 + 4)
        add(boxM(4, 8, dW + 16, doorFrame), x + face * 0.5, dH + 12, dz)
        add(boxM(4, 4, 22, handle), x + face * 3, 110, dz - dW / 2 + 14)
    })
    const back = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), named("serverGlow", "#4FA3FF"))
    back.position.set(xw, 200, z0 + 120)
    g.add(back)
    // the window: glass with a frame, mullions and a transom
    add(boxM(ww, wy1 - wy0, 4, glass), xw, (wy0 + wy1) / 2, z0 - 1)
    add(boxM(ww + 28, 16, 16, frame), xw, wy1 + 8, z0 - 4)
    add(boxM(ww + 40, 14, 30, trim), xw, wy0 - 7, z0 - 10)
    ;[xw - ww / 2 - 7, xw + ww / 2 + 7].forEach((x) => add(boxM(14, wy1 - wy0 + 16, 16, frame), x, (wy0 + wy1) / 2, z0 - 4))
    // (the mullions stand clear of the two racks behind the middle pane)
    ;[-ww / 4 - 8, ww / 4 + 8].forEach((dx) => add(boxM(7, wy1 - wy0, 10, frame), xw + dx, (wy0 + wy1) / 2, z0 - 3))
    add(boxM(ww, 7, 10, frame), xw, wy1 - 80, z0 - 3)
    // a floodlight over the window; under the entrance canopy, two downlights
    add(boxM(44, 10, 26, trim), xw, wy1 + 70, z0 - 14)
    add(boxM(36, 3, 20, wallLamp), xw, wy1 + 64, z0 - 16)
    ;[ex - 80, ex + 80].forEach((x) => add(boxM(30, 3, 30, wallLamp), x, 276.5, z0 - 70))
    g.userData.size = { w, d, h }
    g.userData.entrance = { x: ex, z: z0 }
    g.userData.window = { x: xw, z: z0 }
    g.userData.rack = { x: xw, z: z0 + 230, W: 90 * 2 + 34, H: 220, D: 65, xs: [xw - 56, xw + 56] }
    void racks
    return g
}

// a wind turbine: a tapering tower, the nacelle, the hub and three blades, the rotor facing -z
function windTurbine({ h = 1400, blade = 560 } = {}) {
    const g = new THREE.Group()
    g.name = "windTurbine"
    const white = named("turbine", "#E4E7EC"), grey = named("turbineGrey", "#C3C8D0")
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(18, 40, h, 18), white)
    tower.position.y = h / 2
    g.add(tower)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(90, 96, 16, 24), grey)
    base.position.y = 8
    g.add(base)
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(54, 50, 150), white)
    nacelle.position.set(0, h + 18, 20)
    g.add(nacelle)
    const hub = new THREE.Mesh(new THREE.ConeGeometry(26, 50, 16), grey)
    hub.rotation.x = -Math.PI / 2
    hub.position.set(0, h + 18, -78)
    g.add(hub)
    const rotor = new THREE.Group()
    rotor.position.set(0, h + 18, -62)
    for (let i = 0; i < 3; i++) {
        const arm = new THREE.Group()
        const b = new THREE.Mesh(new THREE.BoxGeometry(26, blade, 6), white)
        b.position.y = blade / 2 + 14
        // a blade tapers: narrower toward the tip
        const pos = b.geometry.attributes.position
        for (let k = 0; k < pos.count; k++) if (pos.getY(k) > 0) pos.setX(k, pos.getX(k) * 0.35)
        b.geometry.computeVertexNormals()
        arm.add(b)
        arm.rotation.z = (i * 2 * Math.PI) / 3 + 0.35
        rotor.add(arm)
    }
    g.add(rotor)
    g.traverse((o) => o.isMesh && ((o.castShadow = true), (o.receiveShadow = true)))
    return g
}

// where the homepage's car takes its charge plug (above the rear wheel), in the car's own
// frame: read from the homepage set, where the car is slid onto the plug
function carPortLocal() {
    const set = homeSet({ carOn: true, cable: true, trees: false, bushes: false })
    set.updateMatrixWorld(true)
    let carG = null, plug = null
    set.traverse((o) => {
        if (o.name === "car" && !carG) carG = o
        if (o.isMesh && o.name === "Extruded.010" && o.visible) plug = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3())
    })
    return carG && plug ? carG.worldToLocal(plug) : v(-95, 85, -150)
}

export function slideDatacenter() {
    const g = new THREE.Group()
    g.name = "slide-datacenter"
    const r = rng(29)
    const b = officeDatacenter()
    const bz = 600
    at(b, 0, 0, bz)
    g.add(b)
    const { w, d } = b.userData.size
    const front = bz - d / 2
    // three Setts in a row in the yard, their long side toward the building
    const probe = settBox({ withPole: false })
    const size = new THREE.Box3().setFromObject(probe).getSize(new THREE.Vector3())
    const carW0 = new THREE.Box3().setFromObject(car()).getSize(new THREE.Vector3())
    const gap = size.x + carW0.x + 300
    const hubZ = front - 470
    const xs = [gap, 0, -gap].map((x) => x - 60)
    const hubs = xs.map((x) => at(settBox({ poles: 1 }), x, 0, hubZ))
    hubs.forEach((u) => g.add(u))
    const holes = xs.map((x) => binHole(x, hubZ))
    // yard, lawn round the building, bay lines between the Setts
    g.add(slab({ w: 3300, d: 1500, x: 0, z: front - 700, depth: 8, bevel: 0, radius: 20, top: "#8F939B", side: "#80848C", topName: "yardPaving", sideName: "yardPaving", holes, y: 0 }))
    // the lawn starts where the paving ends
    const lawn0 = front + 46, lawn1 = bz + 1800
    g.add(slab({ w: 4600, d: lawn1 - lawn0, x: 650, z: (lawn0 + lawn1) / 2, depth: 8, bevel: 0, radius: 20, top: "#9FAE86", side: "#8C9A75", topName: "lawn", sideName: "lawn", y: -1 }))
    const lineM = named("marking", "#E9ECEF")
    // (the car's bay beside the first Sett has no line between them)
    ;[xs[0] + size.x / 2 + 80, ...xs.slice(1).map((x) => x - size.x / 2 - 80), xs[1] + size.x / 2 + 80].forEach((x) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 560), lineM)
        m.position.set(x, 1, hubZ)
        m.receiveShadow = true
        g.add(m)
    })
    g.updateMatrixWorld(true)
    // each unit's charge socket (the pole's) and its batteries
    const partOf = (u, test) => {
        const bb = new THREE.Box3()
        u.traverse((o) => o.isMesh && test(o) && bb.union(new THREE.Box3().setFromObject(o)))
        return bb.isEmpty() ? null : bb.getCenter(new THREE.Vector3())
    }
    const sockets = hubs.map((u) => partOf(u, (o) => o.name === "Extruded.009"))
    const batts = hubs.map((u, i) => {
        const c = partOf(u, (o) => [].concat(o.material).some((m) => m && m.name === "battery"))
        return c ? v(c.x, -17, c.z) : v(xs[i], -17, hubZ)
    })
    // the car charges at the first Sett, parked beside it (nose to the camera), its charge port
    // (above the rear wheel, as on the homepage) on the Sett's side
    // the car model isn't centred on its origin: wrapped so it turns about its own middle
    const inner = car()
    const mid = new THREE.Box3().setFromObject(inner).getCenter(new THREE.Vector3())
    inner.position.set(-mid.x, 0, -mid.z)
    const cr = new THREE.Group()
    cr.name = "car"
    cr.add(inner)
    const port0 = carPortLocal().sub(v(mid.x, 0, mid.z))
    const turn = (port0.x > 0 ? Math.PI : 0) + Math.PI
    const sideX = Math.sign(Math.cos(turn) * port0.x) || 1 // which way the port faces once turned
    const sock = sockets[0]
    at(cr, xs[0] - sideX * (size.x / 2 + carW0.x / 2 + 150), 0, hubZ, turn)
    g.add(cr)
    cr.updateMatrixWorld(true)
    const port = cr.localToWorld(port0.clone())
    // from the socket down onto the paving, across to the car, up into the port
    const dir = Math.sign(port.x - sock.x) || 1
    const cablePath = [sock, sock.clone().add(v(dir * 10, -10, 0)), v(sock.x + dir * 30, 3, sock.z + (port.z - sock.z) * 0.3), v(port.x - dir * 50, 3, port.z), v(port.x - dir * 18, port.y * 0.45, port.z), port]
    const cablePts = new THREE.CatmullRomCurve3(cablePath, false, "centripetal", 0.5).getPoints(60)
    cablePts.forEach((q) => (q.y = Math.max(q.y, 3.6)))
    g.add(chargeCable(cablePts, 3.4))
    // energy: each Sett to a line along the facade, which feeds the offices' entrance and,
    // through the window wall, the server rack
    const bus = front - 80
    const ent = b.userData.entrance, rk = b.userData.rack
    // (the offices' entry point on the far side of the door from the charge pole, in view)
    const entX = ent.x - 400, rackX = rk.x + 120
    const flow = () => Object.assign({ name: "energy_flow" }, LINE)
    // the batteries: where each unit's line starts
    batts.forEach((batt) => {
        g.add(energyLine([batt, v(batt.x, 8, batt.z), v(batt.x, 8, bus)], C.green, flow()))
        g.add(originDot(batt, "energy_flow"))
    })
    // where the power goes into the building: the line ends at the wall, with a dot and a
    // green glow on the wall and the paving
    const entry = (x) => {
        g.add(originDot(v(x, 10, front - 7), "energy_flow"))
        const glow = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), named("serverGlow", "#8DFF66"))
        glow.position.set(x, 26, front - 34)
        g.add(glow)
    }
    // the line along the facade (from the outermost Sett at either end, so every one joins it)
    const busFrom = Math.min(rackX, ...batts.map((p) => p.x)), busTo = Math.max(entX, ...batts.map((p) => p.x))
    g.add(energyLine([v(busFrom, 8, bus), v(busTo, 8, bus)], C.green, flow()))
    // into the offices
    g.add(energyLine([v(entX, 8, bus), v(entX, 8, front - 7)], C.green, flow()))
    entry(entX)
    // into the server room, and on to the power unit at the foot of each rack
    g.add(energyLine([v(rackX, 8, bus), v(rackX, 8, front - 7)], C.green, flow()))
    entry(rackX)
    const zf = front + 172, rackFront = front + 194
    rk.xs.forEach((rx) => {
        g.add(energyLine([v(rackX, 8, front + 12), v(rackX, 8, zf), v(rx, 8, zf), v(rx, 8, rackFront), v(rx, 30, rackFront)], C.green, flow()))
        g.add(originDot(v(rx, 30, rackFront), "energy_flow"))
    })
    // ---------------------------------------------------------------- wind, the mast and the sun
    const grid = () => Object.assign({ name: "energy_grid" }, LINE)
    const solar = () => Object.assign({ name: "energy_solar" }, LINE)
    // in the background on the left: a wind turbine and a power mast
    const tx = w / 2 + 2250, tz = bz + 1050, px = w / 2 + 1300, pz = bz + 450
    g.add(at(windTurbine({ h: 950, blade: 360 }), tx, 0, tz, -0.35))
    g.add(at(pylon(720), px, 0, pz, 0.35))
    // the turbine's power to the mast
    g.add(energyLine([v(tx, 8, tz - 100), v(tx, 8, pz), v(px + 60, 8, pz)], C.green, grid()))
    g.add(originDot(v(tx, 10, tz - 100), "energy_grid"))
    // from the mast, past the building, to the front of the three Setts, a branch into each
    const carLen = carW0.z
    const rowZ = hubZ - Math.max(size.z / 2, carLen / 2) - 80
    const lastX = Math.min(...xs)
    g.add(energyLine([v(px, 8, pz - 60), v(px, 8, rowZ), v(lastX, 8, rowZ)], C.green, grid()))
    xs.forEach((x) => {
        g.add(energyLine([v(x, 8, rowZ), v(x, 8, hubZ - size.z / 2 - 6)], C.green, grid()))
        g.add(originDot(v(x, 10, hubZ - size.z / 2 - 6), "energy_grid"))
    })
    // solar panels on the offices' roof, tilted to the south (-z)
    const { h: bh } = b.userData.size
    const panelM = named("solarPanels", C.solarPanels), panelFrame = named("trim", "#9AA1AE")
    const rx0 = -w / 2 + 660, rx1 = w / 2 - 70, rz0 = front + 90, rz1 = front + d - 90
    const cols = 9, rows = 5, pw = (rx1 - rx0) / cols, pd = (rz1 - rz0) / rows
    for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
            const pnl = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.92, 5, pd * 0.62), panelM)
            pnl.rotation.x = -0.26
            pnl.position.set(rx0 + pw * (j + 0.5), bh + 26, rz0 + pd * (i + 0.5))
            pnl.castShadow = pnl.receiveShadow = true
            g.add(pnl)
            const leg = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.9, 18, 4), panelFrame)
            leg.position.set(rx0 + pw * (j + 0.5), bh + 12, rz0 + pd * (i + 0.5) + pd * 0.26)
            g.add(leg)
        }
    // one line from the panels: over the parapet, down the wall beside the server room, to the
    // middle Sett
    const sx = -w / 2 + 600 - 22
    g.add(energyLine([v(sx + 60, bh + 30, rz0 + 20), v(sx, bh + 30, rz0 + 20), v(sx, bh + 30, front - 8), v(sx, 8, front - 8), v(sx, 8, front - 40), v(xs[1] + 50, 8, front - 40), v(xs[1] + 50, 8, hubZ + size.z / 2 + 6)], C.green, solar()))
    g.add(originDot(v(sx + 60, bh + 30, rz0 + 20), "energy_solar"))
    g.add(originDot(v(xs[1] + 50, 10, hubZ + size.z / 2 + 6), "energy_solar"))
    // trees at the edges, the grid far behind
    ;[[w / 2 + 330, front - 380], [-w / 2 - 300, bz + 250], [w / 2 + 420, front - 900], [-w / 2 - 380, front - 760]].forEach(([x, z], i) => {
        const t = tree(r, 1.1)
        t.name = "tree_" + i
        at(t, x, 0, z, t.rotation.y)
        g.add(t)
    })
    // the building, the Setts and the car; the rest may crop
    // (the turbine and the mast on the left are in it too)
    focus(g, new THREE.Box3(v(-w / 2 - 80, 0, front - 720), v(w / 2 + 1500, 760, front + 120)))
    return homeSett(g)
}
