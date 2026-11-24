// Sett render studio — engine.
//
// Loads the same model the homepage hero uses (sett-v9.obj/.mtl + the car
// STL), colours it with the same roles, and stages still compositions for the
// website's sections. Every render is a transparent PNG, supersampled, with a
// soft contact shadow, written to framer/assets/ through the studio server.

import * as THREE from "https://esm.sh/three@0.185.1"
import { OBJLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/OBJLoader.js"
import { MTLLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/MTLLoader.js"
import { STLLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/STLLoader.js"
import { RoundedBoxGeometry } from "https://esm.sh/three@0.185.1/examples/jsm/geometries/RoundedBoxGeometry.js"
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js"

export { THREE, RoundedBoxGeometry }

// ---------------------------------------------------------------- palette
// scene roles: the colours the live homepage hero is configured with in Framer
// (read from sett.nl's page props), so a render and the live hero read as the
// same world
export const C = {
    // neutrals: clay white and grey, with the palette's navy for glass, poles and panels
    walls: "#DEDFE3",
    frame: "#B4B7BF",
    windows: "#1E2235",
    door: "#363636",
    pathway: "#C9C9CC",
    // the unit in the live homepage scene's colours (its Framer settings), so every
    // render, scroll scene and hero shows the same Sett
    settBin: "#95A3C2",
    battery: "#25CF77",
    batteryBlocks: "#2544CF",
    inverter: "#95A3C2",
    cooling: "#525252",
    chargePole: "#1E2235",
    solarPanels: "#1E2235",
    car: "#A1A1A1",
    treeLeaves: "#A1A1A1",
    treeTrunk: "#B0B0B0",
    bushes: "#A1A1A1",
    // energy: the Sett green, the sun's amber, the grid's blue
    energyLine: "#8DFF66",
    energyDay: "#FFB92B",
    energyGrid: "#2B8CFF",
    gridTower: "#7C7C80",
    logo: "#FFFFFF",
    // the Sett palette
    lime: "#8DFF66",
    sun: "#FFB92B",
    cream: "#FCF0D7",
    purple: "#9A6CE9",
    lavender: "#EADEF8",
    lilac: "#C0A8F0",
    blue: "#2583F0",
    skyBlue: "#E2EDFD",
    green: "#8DFF66",
    // problems (overload, limits) are the evening's purple: the palette has no red
    red: "#9A6CE9",
    ink: "#060C1A",
    // diorama ground, cool neutrals to sit on #F6F6F6 and the navy
    groundTop: "#EDEDF0",
    groundSide: "#DCDCE1",
    paving: "#E6E6EA",
    asphalt: "#D2D3D9",
    marking: "#FAFAFB",
    soil: "#D3C2A6",
    soilDeep: "#C1AC8C",
    grass: "#DDE8D4",
}

// ---------------------------------------------------------------- materials
const matCache = new Map()
// the hero's flat, matte, low-poly look: no metalness, full roughness,
// faceted shading
export function mat(hex, opts = {}) {
    const key = hex + JSON.stringify(opts)
    if (matCache.has(key)) return matCache.get(key)
    const m = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness: opts.roughness ?? 1,
        metalness: 0,
        flatShading: opts.flat ?? true,
        transparent: opts.opacity != null && opts.opacity < 1,
        opacity: opts.opacity ?? 1,
        side: opts.side ?? THREE.FrontSide,
        emissive: new THREE.Color(opts.emissive || "#000000"),
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        depthWrite: opts.depthWrite ?? true,
    })
    if (opts.name) m.name = opts.name
    matCache.set(key, m)
    return m
}
// a material that carries its role name (for GLB export)
export function named(role, hex, opts = {}) {
    return mat(hex, Object.assign({ name: role }, opts))
}
// unlit, for the energy lines (they read as light, not as objects)
export function glowMat(hex, opacity = 1, name = "") {
    const key = "glow" + hex + opacity + name
    if (matCache.has(key)) return matCache.get(key)
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), toneMapped: false, transparent: opacity < 1, opacity })
    if (name) m.name = name
    matCache.set(key, m)
    return m
}

// ---------------------------------------------------------------- random
export function rng(seed) {
    let a = seed >>> 0
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// ---------------------------------------------------------------- model
export const GRADE = 74 // the model's ground level (top of the buried bin, house floor)

// material UUID → role (the hero's COLOR_ROLES, v9 ids)
const COLOR_ROLES = {
    b909650e_271a_4e01_93e9_05e53b619e79: "walls",
    c170e513_0b2e_446b_9a5e_fb3586334a9d: "windows",
    b761d7c1_962e_451b_9711_6e31527a6303: "cooling",
    "23eb4583_2034_450f_84b7_5f0ef82c2a7d": "battery",
    b75eb569_5d23_4cc4_8576_c88eacc1589c: "batteryBlocks",
    "1fc193e7_0e1d_4046_9a0e_688cb6d88e91": "inverter",
    c6a399f0_84dd_4c64_ba55_f0694a0361a8: "frame",
    "8ef818db_74f9_4118_bb9a_b1bdd1c048cc": "pathway",
    e877d95c_e584_45b3_9567_104540b31256: "door",
    c3bd5488_83c5_4daf_abb6_4651b18d8926: "chargePole",
}
const SOLAR_PANEL_RE = /^Extruded\.0(1[1-8]|27|28)$/
const NAME_ROLES = [
    [/^BAK_met_RIBS$/, "settBin"],
    [/^Extruded\.00[1-8]$/, "settBin"],
    [/^(schot|Panel_side)$/, "settBin"],
    [/^Pipe\.002$/, "inverter"],
    [/^Extruded\.0(09|10)$/, "inverter"],
]
const SETT_RE = /^(BAK_met_RIBS|Extruded\.00[1-8]|Extruded\.0(19|2[0-6])|accu(\.\d+)?|Block_large_0[1-4]|Inverter_0[12]|Cooling|schot|Panel_side)$/
const POLE_RE = /^(Charge_pole|Exhaust|Pipe\.002|Extruded\.0(09|10))$/
const PATH_RE = /^Pathway$/

// shared role materials, so night mode can relight windows/batteries in one place
export const roleMat = {}
export function roleMaterial(role) {
    if (!roleMat[role]) {
        roleMat[role] = new THREE.MeshStandardMaterial({
            color: new THREE.Color(C[role]),
            roughness: 1,
            metalness: 0,
            flatShading: true,
            transparent: role === "windows",
            opacity: role === "windows" ? 0.88 : 1,
            emissive: new THREE.Color("#000000"),
        })
        roleMat[role].name = role
    }
    return roleMat[role]
}

// the "sett" wordmark is embossed into the Charge_pole mesh; split it into a
// second material group so it can be white (ported from SettScene3D)
function splitLogo(mesh) {
    let pg = mesh.geometry
    if (pg.index) pg = mesh.geometry = pg.toNonIndexed()
    const p = pg.attributes.position
    let maxY = -Infinity
    for (let i = 0; i < p.count; i++) maxY = Math.max(maxY, p.getY(i))
    const planes = {}
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i)
        if (y < maxY - 4) continue
        const k = y.toFixed(2)
        const pl = planes[k] || (planes[k] = { y, n: 0, minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity })
        pl.n++
        pl.minX = Math.min(pl.minX, p.getX(i))
        pl.maxX = Math.max(pl.maxX, p.getX(i))
        pl.minZ = Math.min(pl.minZ, p.getZ(i))
        pl.maxZ = Math.max(pl.maxZ, p.getZ(i))
    }
    const list = Object.values(planes)
    const facia = list.slice().sort((a, b) => b.maxZ - b.minZ - (a.maxZ - a.minZ))[0]
    const letters = list.filter((q) => q !== facia && q.y > facia.y).sort((a, b) => b.n - a.n)[0]
    if (!facia || !letters || letters.n <= 100) return
    const x0 = letters.minX - 0.6, x1 = letters.maxX + 0.6, z0 = letters.minZ - 0.6, z1 = letters.maxZ + 0.6
    const logo = [], rest = []
    for (let t = 0; t < p.count / 3; t++) {
        const a = t * 3
        const cx = (p.getX(a) + p.getX(a + 1) + p.getX(a + 2)) / 3
        const cy = (p.getY(a) + p.getY(a + 1) + p.getY(a + 2)) / 3
        const cz = (p.getZ(a) + p.getZ(a + 1) + p.getZ(a + 2)) / 3
        if (cy > facia.y + 0.05 && cx > x0 && cx < x1 && cz > z0 && cz < z1) logo.push(t)
        else rest.push(t)
    }
    if (logo.length <= 20) return
    const idx = new Uint32Array(p.count)
    let w = 0
    rest.concat(logo).forEach((t) => {
        idx[w++] = t * 3
        idx[w++] = t * 3 + 1
        idx[w++] = t * 3 + 2
    })
    pg.setIndex(new THREE.BufferAttribute(idx, 1))
    pg.clearGroups()
    pg.addGroup(0, rest.length * 3, 0)
    pg.addGroup(rest.length * 3, logo.length * 3, 1)
    mesh.material = [roleMaterial("chargePole"), roleMaterial("logo")]
}

function loadText(url) {
    return fetch(url).then((r) => {
        if (!r.ok) throw new Error(url + " " + r.status)
        return r.text()
    })
}

// master parts (never added to a scene directly — compositions clone them)
export const P = {}

export async function loadModel(base = "/") {
    const [mtlText, objText] = await Promise.all([loadText(base + "sett-v9.mtl"), loadText(base + "sett-v9.obj")])
    const materials = new MTLLoader().parse(mtlText, base)
    materials.preload()
    const obj = new OBJLoader().setMaterials(materials).parse(objText)

    const house = new THREE.Group(), sett = new THREE.Group(), pole = new THREE.Group(), path = new THREE.Group()
    const parts = {} // name → mesh (first of a name wins; the two "schot" partitions get suffixed)
    const meshes = []
    obj.traverse((m) => m.isMesh && meshes.push(m))
    meshes.forEach((m) => {
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        const byName = NAME_ROLES.find((r) => r[0].test(m.name))
        const roleOf = (mm) => (SOLAR_PANEL_RE.test(m.name) ? "solarPanels" : byName ? byName[1] : (mm && COLOR_ROLES[mm.name]) || "solarPanels")
        if (m.name === "Charge_pole") splitLogo(m) // on the raw geometry: the split keys off the pole's local axes
        else if (Array.isArray(m.material)) m.material = mats.map((mm) => roleMaterial(roleOf(mm)))
        else m.material = roleMaterial(roleOf(m.material))
        m.geometry.rotateX(-Math.PI / 2) // bake the Z-up export into world space: y is up, grade at GRADE
        m.geometry.computeBoundingBox()
        m.castShadow = true
        m.receiveShadow = true
        let key = m.name
        while (parts[key]) key += "_"
        m.name = key
        parts[key] = m
    })
    meshes.forEach((m) => {
        const n = m.name.replace(/_+$/, "")
        if (SETT_RE.test(n)) sett.add(m)
        else if (POLE_RE.test(n)) pole.add(m)
        else if (PATH_RE.test(n)) path.add(m)
        else house.add(m)
    })
    // the homepage recentres the model on its bounding box and places the car,
    // trees and bushes in that frame — keep the offset to translate them
    const all = new THREE.Box3()
    meshes.forEach((m) => all.union(new THREE.Box3().setFromObject(m)))
    P.modelCenter = all.getCenter(new THREE.Vector3())
    P.house = house
    P.sett = sett
    P.pole = pole
    P.path = path
    P.parts = parts
    P.settBox = new THREE.Box3().setFromObject(sett)
    P.houseBox = new THREE.Box3().setFromObject(house)
    P.poleBox = new THREE.Box3().setFromObject(pole)
    // where the charge pole stands on the bin, relative to the bin's centre
    const bc = P.settBox.getCenter(new THREE.Vector3())
    P.settCenter = new THREE.Vector3(bc.x, GRADE, bc.z)
    P.poleOffset = P.poleBox.getCenter(new THREE.Vector3()).sub(P.settCenter).setY(0)

    const stl = await fetch(base + "tesla-y2.stl").then((r) => r.arrayBuffer())
    const g = new STLLoader().parse(stl)
    // the scan's footprint sits at an angle in its own frame: square it up so
    // the car's length runs along z and its roof points up (from SettScene3D)
    const ang = THREE.MathUtils.degToRad(149.62008156248243)
    const L = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0)
    const W = new THREE.Vector3(Math.cos(ang + Math.PI / 2), Math.sin(ang + Math.PI / 2), 0)
    g.applyMatrix4(new THREE.Matrix4().makeBasis(W, new THREE.Vector3(0, 0, 1), L).transpose())
    g.computeBoundingBox()
    const cb = g.boundingBox
    const s = 460 / (cb.max.z - cb.min.z)
    g.translate(-(cb.min.x + cb.max.x) / 2, -cb.min.y, -(cb.min.z + cb.max.z) / 2)
    g.scale(s, s, s)
    g.computeVertexNormals()
    const car = new THREE.Mesh(g, roleMaterial("car"))
    car.castShadow = car.receiveShadow = true
    P.car = car
    P.van = await loadVanModel().catch((e) => (console.warn("van model", e), null))
    return P
}

// ---------------------------------------------------------------- the cargo van
// van003 (white panel van) from the "low poly vehicle mini pack 7", extracted
// from ~/Desktop/low-poly-vehicle-mini-pack-7/source/lvp_pack_7.fbx into
// lvp-van003.glb (footprint centre at the
// origin, wheels on y 0, nose along +z, ≈ cm). It renders as one grey clay
// piece, like the homepage's Tesla, so its parts merge into a single geometry.
const VAN_URL = "/studio/models/lvp-van003.glb"
const VAN_SCALE = 0.95 // 5.3 m, next to the 4.6 m car
async function loadVanModel() {
    const gltf = await new GLTFLoader().loadAsync(VAN_URL)
    gltf.scene.updateMatrixWorld(true)
    const all = []
    const p = new THREE.Vector3()
    gltf.scene.traverse((o) => {
        if (!o.isMesh) return
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry
        const pos = g.attributes.position
        for (let k = 0; k < pos.count; k++) {
            p.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld).multiplyScalar(VAN_SCALE)
            all.push(p.x, p.y, p.z)
        }
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(all, 3))
    geo.computeVertexNormals()
    return geo
}

// ---------------------------------------------------------------- instancing
// every placer returns a Group whose origin is the part's footprint centre at
// ground level, so compositions think in "stand this at (x, z)" terms
function pivot(master, center) {
    const inner = master.clone(true)
    inner.position.set(-center.x, -center.y, -center.z)
    const g = new THREE.Group()
    g.add(inner)
    return g
}
export function settBox({ withPole = true, poles = 1, cable = false } = {}) {
    const g = pivot(P.sett, P.settCenter)
    g.name = "settUnit"
    if (withPole) {
        for (let i = 0; i < poles; i++) {
            const p = pivot(P.pole, P.settCenter)
            if (!cable) p.traverse((o) => o.isMesh && /^(Pipe\.002|Extruded\.010)/.test(o.name) && (o.visible = false))
            // a second pole stands beside the first (the vent is on the other side)
            if (i === 1) {
                p.position.x = -48
                p.traverse((o) => o.isMesh && /^Exhaust/.test(o.name) && (o.visible = false))
            }
            g.add(p)
        }
    }
    g.userData.footprint = { w: P.settBox.max.x - P.settBox.min.x, d: P.settBox.max.z - P.settBox.min.z }
    return g
}
export function chargePole({ cable = false } = {}) {
    // just the pole column (the Exhaust vent stands on the bin, not by the pole)
    const pb = new THREE.Box3().setFromObject(P.parts["Charge_pole"])
    const c = pb.getCenter(new THREE.Vector3())
    const g = pivot(P.pole, new THREE.Vector3(c.x, GRADE, c.z))
    g.name = "pole"
    g.traverse((o) => {
        if (!o.isMesh) return
        if (/^Exhaust/.test(o.name)) o.visible = false
        if (!cable && /^(Pipe\.002|Extruded\.010)/.test(o.name)) o.visible = false
    })
    return g
}
export function house() {
    const c = P.houseBox.getCenter(new THREE.Vector3())
    const g = pivot(P.house, new THREE.Vector3(c.x, GRADE, c.z))
    g.name = "house"
    return g
}
export function car() {
    const g = new THREE.Group()
    g.name = "car"
    g.add(P.car.clone())
    return g
}
// the whole homepage set in its original layout: house, Sett + pole, path, car
// the homepage's car/tree/bush positions are in its recentred frame; to model coordinates
function homeFrame(x, z) {
    return new THREE.Vector3(x + P.modelCenter.x, GRADE, z + P.modelCenter.z)
}
// park the car against the charge cable's plug head, as the homepage does: cast
// from outside the car through the plug, close the gap to a 2-unit touch
function alignCarToPlug(carGroup) {
    const plug = new THREE.Box3().setFromObject(P.parts["Extruded.010"]).getCenter(new THREE.Vector3())
    carGroup.updateMatrixWorld(true)
    const toCar = new THREE.Box3().setFromObject(carGroup).getCenter(new THREE.Vector3()).sub(plug)
    toCar.y = 0
    if (toCar.lengthSq() < 1) return
    toCar.normalize()
    const back = 400
    const hits = new THREE.Raycaster(plug.clone().addScaledVector(toCar, -back), toCar, 0, back + 900).intersectObject(carGroup, true)
    if (!hits.length) return
    const gap = hits[0].distance - back
    const slack = 2
    if (Math.abs(gap - slack) < 0.5 || Math.abs(gap) > 260) return
    carGroup.position.addScaledVector(toCar, -(gap - slack))
}
export function homeSet({ carOn = true, trees = true, bushes = trees, seed = 7, sett = true, pole = true, cable = true } = {}) {
    const g = new THREE.Group()
    const origin = new THREE.Vector3(P.settCenter.x, GRADE, P.settCenter.z)
    const add = (m) => {
        const c = m.clone(true)
        c.position.sub(origin)
        g.add(c)
    }
    add(P.house)
    if (sett) add(P.sett)
    if (pole) {
        const pc = P.pole.clone(true)
        pc.position.sub(origin)
        pc.traverse((o) => {
            if (!o.isMesh) return
            if (!sett && /^Exhaust/.test(o.name)) o.visible = false // the vent belongs to the buried unit
            if ((!cable || !carOn) && /^(Pipe\.002|Extruded\.010)/.test(o.name)) o.visible = false
        })
        g.add(pc)
    }
    add(P.path)
    if (carOn) {
        // where the homepage parks it, then slid onto the plug like the homepage does
        const c = car()
        c.position.copy(homeFrame(-472, -301))
        c.rotation.y = 0.08
        if (cable) alignCarToPlug(c)
        c.position.sub(origin)
        g.add(c)
    }
    const r = rng(seed)
    if (trees) {
        ;[
            [-650, 250],
            [-650, 650],
            [660, 680],
            [-180, 1010],
        ].forEach((p) => {
            const t = tree(r)
            t.position.copy(homeFrame(p[0], p[1])).sub(origin)
            g.add(t)
        })
    }
    if (bushes) {
        // the row along the front of the house
        ;[-280, -195, -110, 175, 260, 340].forEach((x) => {
            const b = bush(r)
            b.position.copy(homeFrame(x, 95)).sub(origin)
            g.add(b)
        })
    }
    return g
}
// convenience: world positions of home-set landmarks, relative to the set origin
export function homeAnchors() {
    const o = new THREE.Vector3(P.settCenter.x, GRADE, P.settCenter.z)
    const rel = (x, y, z) => new THREE.Vector3(x - o.x, y - GRADE, z - o.z)
    return {
        roof: rel(430, 640, 700), // over the solar panels
        panels: rel(438, 600, 710),
        door: rel(303, GRADE + 10, 400),
        houseFront: rel(120, GRADE, 380),
        batteries: rel(-2, 56, -136),
        settTop: rel(-8, GRADE, -8),
        pole: rel(-39, 204, 186),
        car: rel(-472, GRADE, -301),
    }
}

// ---------------------------------------------------------------- scenery
export function tree(r = Math.random, scale = 1) {
    const g = new THREE.Group()
    const trunkH = 170 + r() * 70
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(9, 15, trunkH, 7), named("treeTrunk", shade(C.treeTrunk, (r() - 0.5) * 0.06)))
    trunk.position.y = trunkH / 2
    g.add(trunk)
    const leaf = named("treeLeaves", shade(C.treeLeaves, (r() - 0.5) * 0.12))
    const n = 3 + Math.floor(r() * 2)
    for (let i = 0; i < n; i++) {
        const rad = 85 + r() * 55
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 0), leaf)
        b.position.set((r() - 0.5) * 90, trunkH + 55 + r() * 70, (r() - 0.5) * 90)
        b.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI)
        g.add(b)
    }
    g.scale.setScalar((0.85 + r() * 0.4) * scale)
    g.rotation.y = r() * Math.PI * 2
    shadowAll(g)
    return g
}
export function bush(r = Math.random, scale = 1) {
    const g = new THREE.Group()
    const leaf = named("bushes", shade(C.bushes, (r() - 0.5) * 0.12))
    const n = 2 + Math.floor(r() * 2)
    for (let i = 0; i < n; i++) {
        const rad = 26 + r() * 16
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 0), leaf)
        b.position.set((r() - 0.5) * 34, rad * 0.75, (r() - 0.5) * 24)
        b.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI)
        g.add(b)
    }
    g.scale.setScalar((0.85 + r() * 0.45) * scale)
    shadowAll(g)
    return g
}
// the hero's lattice pylon, standing at the origin; returns the wire tips too
export function pylon(h = 900, color = C.gridTower) {
    const g = new THREE.Group()
    const m = mat(color)
    const bar = (a, b, r) => {
        const len = a.distanceTo(b)
        const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), m)
        c.position.copy(a).add(b).multiplyScalar(0.5)
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
        g.add(c)
    }
    const legR = h * 0.008, baseHalf = h * 0.13, topHalf = h * 0.04
    const signs = [[1, 1], [1, -1], [-1, -1], [-1, 1]]
    const ring = (y, half) => signs.map((s) => new THREE.Vector3(s[0] * half, y, s[1] * half))
    const bottom = ring(0, baseHalf), top = ring(h * 0.92, topHalf)
    for (let i = 0; i < 4; i++) bar(bottom[i], top[i], legR)
    ;[0.16, 0.36, 0.56, 0.74, 0.92].forEach((f) => {
        const rr = ring(h * f, THREE.MathUtils.lerp(baseHalf, topHalf, f / 0.92))
        for (let i = 0; i < 4; i++) bar(rr[i], rr[(i + 1) % 4], legR * 0.7)
        // cross bracing on two faces
        const next = ring(h * Math.max(0, f - 0.2), THREE.MathUtils.lerp(baseHalf, topHalf, Math.max(0, f - 0.2) / 0.92))
        bar(rr[0], next[1], legR * 0.5)
        bar(rr[2], next[3], legR * 0.5)
    })
    const apex = new THREE.Vector3(0, h, 0)
    for (let i = 0; i < 4; i++) bar(top[i], apex, legR * 0.7)
    const tips = []
    ;[0.66, 0.82].forEach((f, idx) => {
        const y = h * f, L = h * (idx === 0 ? 0.26 : 0.21)
        bar(new THREE.Vector3(-L, y, 0), new THREE.Vector3(L, y, 0), legR * 0.9)
        ;[-1, 1].forEach((s) => {
            const tip = new THREE.Vector3(s * L * 0.9, y, 0)
            const ins = new THREE.Mesh(new THREE.CylinderGeometry(legR * 1.7, legR * 1.7, h * 0.035, 6), m)
            ins.position.copy(tip).add(new THREE.Vector3(0, -h * 0.0175, 0))
            g.add(ins)
            tips.push(tip.clone().add(new THREE.Vector3(0, -h * 0.035, 0)))
        })
    })
    shadowAll(g)
    g.userData.tips = tips
    return g
}

// a factory hall: walls, a saw-tooth roof with north lights, two roller doors
export function factory({ w = 560, d = 380, h = 200, teeth = 4, wall = C.walls, roof = C.frame, windows = null } = {}) {
    const winMat = windows || roleMaterial("windows")
    const g = new THREE.Group()
    g.name = "building"
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wall))
    body.position.y = h / 2
    g.add(body)
    const tw = w / teeth, th = h * 0.32
    for (let i = 0; i < teeth; i++) {
        const s = new THREE.Shape()
        s.moveTo(0, 0)
        s.lineTo(tw, 0)
        s.lineTo(tw, th)
        s.lineTo(0, 0)
        const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false })
        const tooth = new THREE.Mesh(geo, mat(roof))
        tooth.position.set(-w / 2 + i * tw, h, -d / 2)
        g.add(tooth)
        // the glazed vertical face of each tooth
        const glass = new THREE.Mesh(new THREE.BoxGeometry(2, th * 0.72, d * 0.92), winMat)
        glass.position.set(-w / 2 + (i + 1) * tw + 1, h + th * 0.42, 0)
        g.add(glass)
    }
    // roller doors on the front (-z) face
    const doorW = Math.min(110, w * 0.2), doorH = h * 0.62
    ;[-0.24, 0.12].forEach((fx, k) => {
        const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 4), mat(C.door))
        door.position.set(w * fx, doorH / 2, -d / 2 - 2)
        g.add(door)
        for (let r = 1; r < 7; r++) {
            const rib = new THREE.Mesh(new THREE.BoxGeometry(doorW, 1.6, 5), mat(shade(C.door, -0.06)))
            rib.position.set(w * fx, (doorH / 7) * r, -d / 2 - 2.5)
            g.add(rib)
        }
        if (k === 1) {
            // the office corner: a strip of windows
            const band = new THREE.Mesh(new THREE.BoxGeometry(w * 0.26, h * 0.2, 4), winMat)
            band.position.set(w * 0.36, h * 0.66, -d / 2 - 2)
            g.add(band)
        }
    })
    shadowAll(g)
    g.userData.size = { w, d, h: h + th }
    return g
}
// an office block with window strips per floor
export function office({ w = 420, d = 300, floors = 4, fh = 95, wall = C.walls, trim = C.frame, windows = null } = {}) {
    const winMat = windows || roleMaterial("windows")
    const g = new THREE.Group()
    g.name = "building"
    const h = floors * fh
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wall))
    body.position.y = h / 2
    g.add(body)
    for (let f = 0; f < floors; f++) {
        const y = f * fh + fh * 0.55
        const front = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, fh * 0.42, 4), winMat)
        front.position.set(0, y, -d / 2 - 2)
        g.add(front)
        const side = new THREE.Mesh(new THREE.BoxGeometry(4, fh * 0.42, d * 0.82), winMat)
        side.position.set(-w / 2 - 2, y, 0)
        g.add(side)
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 12, 14, d + 12), mat(trim))
    cap.position.y = h + 7
    g.add(cap)
    const plant = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 38, d * 0.3), mat(shade(trim, 0.06)))
    plant.position.set(w * 0.18, h + 33, d * 0.1)
    g.add(plant)
    shadowAll(g)
    g.userData.size = { w, d, h: h + 52 }
    return g
}
// the thing Sett replaces: a battery cabinet on the pavement next to the pole
export function batteryCabinet({ w = 150, h = 205, d = 80 } = {}) {
    const g = new THREE.Group()
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 3), mat("#A9AEB8"))
    body.position.y = h / 2 + 8
    g.add(body)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 10, 8, d + 10), mat("#8E939C"))
    plinth.position.y = 4
    g.add(plinth)
    // door seam + vents
    const seam = new THREE.Mesh(new THREE.BoxGeometry(1.4, h - 30, 1), mat("#80858F"))
    seam.position.set(0, h / 2 + 8, -d / 2 - 0.4)
    g.add(seam)
    for (let i = 0; i < 6; i++) {
        const v = new THREE.Mesh(new THREE.BoxGeometry(w * 0.34, 3, 1.2), mat("#80858F"))
        v.position.set(-w * 0.24, h - 22 - i * 9, -d / 2 - 0.5)
        g.add(v)
        const v2 = v.clone()
        v2.position.x = w * 0.24
        g.add(v2)
    }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(24, 21, 1), mat(C.sun))
    sign.position.set(-w * 0.24, h * 0.52, -d / 2 - 0.6)
    g.add(sign)
    shadowAll(g)
    return g
}

// ---------------------------------------------------------------- ground
// a diorama base: a rounded slab with its top at y=0. Holes are cut straight
// through (their walls take the side colour, which reads as soil), and
// `notch` removes a rectangle that runs out to the slab's edge, for cutaways.
export function slab({ w = 1400, d = 1000, depth = 90, radius = 60, holes = [], top = C.groundTop, side = C.groundSide, bevel = 6, x = 0, z = 0, y = 0, topName = "", sideName = "" } = {}) {
    const s = roundedRectShape(-w / 2, -d / 2, w, d, radius)
    // holes come in scene coordinates; the shape is built around the slab's own centre
    holes.forEach((h) => s.holes.push(rectPath(h.x0 - x, h.z0 - z, h.x1 - h.x0, h.z1 - h.z0)))
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16 })
    // the shape is drawn in x/y with y = world z; extruded along +z, which becomes down
    geo.rotateX(Math.PI / 2)
    geo.translate(0, -bevel, 0) // the bevel adds thickness above the cap: keep the top face at y = 0
    const m = new THREE.Mesh(geo, [mat(top, topName ? { name: topName } : {}), mat(side, sideName ? { name: sideName } : {})])
    m.position.set(x, y, z)
    m.receiveShadow = true
    m.castShadow = true
    return m
}
// a cutaway slab: the front edge is cut back to `cutZ` across the part of the
// slab between x0..x1, exposing whatever sits below grade there (the Sett)
export function cutawaySlab({ w = 1400, d = 1000, depth = 110, radius = 60, cut, top = C.groundTop, side = C.soil } = {}) {
    // outline, counter-clockwise, with a rectangular bite taken out of the front
    // the front edge is the section plane, so its corners stay square
    const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, r = radius
    const s = new THREE.Shape()
    s.moveTo(x0, z0)
    s.lineTo(cut.x0, z0)
    s.lineTo(cut.x0, cut.z)
    s.lineTo(cut.x1, cut.z)
    s.lineTo(cut.x1, z0)
    s.lineTo(x1, z0)
    s.lineTo(x1, z1 - r)
    s.quadraticCurveTo(x1, z1, x1 - r, z1)
    s.lineTo(x0 + r, z1)
    s.quadraticCurveTo(x0, z1, x0, z1 - r)
    s.lineTo(x0, z0)
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 16 })
    geo.rotateX(Math.PI / 2)
    const m = new THREE.Mesh(geo, [mat(top), mat(side)])
    m.receiveShadow = m.castShadow = true
    return m
}
export function box(w, h, d, color, { r = 0, y = 0 } = {}) {
    const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d)
    const m = new THREE.Mesh(geo, typeof color === "string" ? mat(color) : color)
    m.position.y = y + h / 2
    m.castShadow = m.receiveShadow = true
    return m
}
// parking-bay lines on a slab top
export function bayLines(g, { x, z, w = 260, d = 520, t = 7, color = C.marking, open = "front" } = {}) {
    const m = mat(color)
    const seg = (sx, sz, px, pz) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.8, sz), m)
        b.position.set(px, 0.5, pz)
        b.receiveShadow = true
        g.add(b)
    }
    seg(t, d, x - w / 2, z)
    seg(t, d, x + w / 2, z)
    if (open !== "back") seg(w + t, t, x, z + d / 2)
}

function roundedRectShape(x, y, w, h, r) {
    const s = new THREE.Shape()
    s.moveTo(x + r, y)
    s.lineTo(x + w - r, y)
    s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r)
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h)
    s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r)
    s.quadraticCurveTo(x, y, x + r, y)
    return s
}
function rectPath(x, y, w, h) {
    const p = new THREE.Path()
    p.moveTo(x, y)
    p.lineTo(x, y + h)
    p.lineTo(x + w, y + h)
    p.lineTo(x + w, y)
    p.lineTo(x, y)
    return p
}

// ---------------------------------------------------------------- energy lines
// a rounded orthogonal route through the given points (corners filleted with
// `radius`), drawn as a thin glowing tube with a bead at each end
export function energyLine(points, color, { r = 3.2, radius = 22, beads = true, colorEnd = null, dashed = false, name = "", segLen = 3, radial = 10 } = {}) {
    const pts = filletPath(points, radius)
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.02)
    const g = new THREE.Group()
    const segs = Math.max(48, Math.round(curve.getLength() / segLen))
    if (dashed) {
        // grey static dashes: an inactive line
        const n = Math.round(curve.getLength() / 22)
        for (let i = 0; i < n; i++) {
            const a = i / n, b = (i + 0.5) / n
            const sub = new THREE.CatmullRomCurve3([curve.getPointAt(a), curve.getPointAt((a + b) / 2), curve.getPointAt(b)])
            g.add(new THREE.Mesh(new THREE.TubeGeometry(sub, 4, r * 0.8, 8), glowMat(color)))
        }
        return g
    }
    const geo = new THREE.TubeGeometry(curve, segs, r, radial)
    let material = glowMat(color, 1, name)
    if (colorEnd) {
        // a colour ramp along the line (u = arc length along the tube)
        const c0 = new THREE.Color(color), c1 = new THREE.Color(colorEnd)
        const uv = geo.attributes.uv
        const cols = new Float32Array(uv.count * 3)
        const tmp = new THREE.Color()
        for (let i = 0; i < uv.count; i++) {
            const t = THREE.MathUtils.smoothstep(uv.getX(i), 0.45, 0.95)
            tmp.copy(c0).lerp(c1, t)
            cols[i * 3] = tmp.r
            cols[i * 3 + 1] = tmp.g
            cols[i * 3 + 2] = tmp.b
        }
        geo.setAttribute("color", new THREE.BufferAttribute(cols, 3))
        material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })
    }
    const tube = new THREE.Mesh(geo, material)
    tube.userData.length = curve.getLength()
    g.add(tube)
    if (beads) {
        const b0 = new THREE.Mesh(new THREE.SphereGeometry(r * 2.4, radial + 4, Math.max(6, radial - 2)), glowMat(color, 1, name ? name + "_bead" : ""))
        b0.position.copy(pts[0])
        g.add(b0)
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(r * 2.4, radial + 4, Math.max(6, radial - 2)), glowMat(colorEnd || color, 1, name ? name + "_bead" : ""))
        b1.position.copy(pts[pts.length - 1])
        g.add(b1)
    }
    return g
}
export function filletPath(points, radius) {
    if (points.length < 3 || radius <= 0) return points.map((p) => p.clone())
    const out = [points[0].clone()]
    for (let i = 1; i < points.length - 1; i++) {
        const p = points[i], a = points[i - 1], b = points[i + 1]
        const da = a.clone().sub(p), db = b.clone().sub(p)
        const r = Math.min(radius, da.length() / 2, db.length() / 2)
        const pa = p.clone().add(da.normalize().multiplyScalar(r))
        const pb = p.clone().add(db.normalize().multiplyScalar(r))
        for (let k = 0; k <= 6; k++) {
            const t = k / 6
            // quadratic bezier pa → p → pb
            const q = pa.clone().multiplyScalar((1 - t) * (1 - t)).add(p.clone().multiplyScalar(2 * (1 - t) * t)).add(pb.clone().multiplyScalar(t * t))
            out.push(q)
        }
    }
    out.push(points[points.length - 1].clone())
    // drop near-duplicates, which kink the spline
    return out.filter((p, i) => i === 0 || p.distanceTo(out[i - 1]) > 0.5)
}
// a flat ring on the ground (a "pulse" marker)
export function ring(radius, color, t = 3) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(radius, t, 10, 72), glowMat(color))
    m.rotation.x = -Math.PI / 2
    return m
}

// ---------------------------------------------------------------- chart shapes
// an area chart as a solid: f(u) for u in [0,1] gives a height; the silhouette
// is extruded `depth` deep, split into coloured bands along u
export function areaChart({ f, floor = null, w = 1000, h = 360, depth = 120, samples = 160, bands = [{ from: 0, to: 1, color: C.purple }], bevel = 4, base = 12 } = {}) {
    const g = new THREE.Group()
    bands.forEach((band) => {
        const s = new THREE.Shape()
        const u0 = band.from, u1 = band.to
        const n = Math.max(4, Math.round(samples * (u1 - u0)))
        const y0 = (u) => (floor ? base + floor(u) * h : 0)
        s.moveTo(u0 * w, y0(u0))
        for (let i = 0; i <= n; i++) {
            const u = u0 + ((u1 - u0) * i) / n
            s.lineTo(u * w, base + Math.max(0, f(u)) * h)
        }
        for (let i = n; i >= 0; i--) {
            const u = u0 + ((u1 - u0) * i) / n
            s.lineTo(u * w, y0(u))
        }
        const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.6, bevelSegments: 2, curveSegments: 4 })
        geo.translate(-w / 2, 0, -depth / 2)
        const m = new THREE.Mesh(geo, mat(band.color, { flat: false }))
        m.castShadow = m.receiveShadow = true
        g.add(m)
    })
    return g
}
// rounded bars standing on the ground, left to right along x
export function bars(values, { w = 90, gap = 34, depth = 90, h = 360, colors = [C.sun], r = 10 } = {}) {
    const g = new THREE.Group()
    const total = values.length * w + (values.length - 1) * gap
    values.forEach((v, i) => {
        const hh = Math.max(r * 2 + 1, v * h)
        const b = box(w, hh, depth, colors[i % colors.length], { r })
        b.position.x = -total / 2 + w / 2 + i * (w + gap)
        g.add(b)
    })
    g.userData.pitch = w + gap
    g.userData.total = total
    return g
}
// a translucent horizontal plane with a coloured edge: the grid's limit
export function limitPlane(w, d, color = C.red) {
    const g = new THREE.Group()
    const plane = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), mat(color, { opacity: 0.16, depthWrite: false }))
    g.add(plane)
    const edgeMat = glowMat(color)
    ;[[w, 3.4, 3.4, 0, -d / 2], [w, 3.4, 3.4, 0, d / 2], [3.4, 3.4, d, -w / 2, 0], [3.4, 3.4, d, w / 2, 0]].forEach((e) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(e[0], e[1], e[2]), edgeMat)
        b.position.set(e[3], 0, e[4])
        g.add(b)
    })
    return g
}
// a lightning bolt, extruded and softly bevelled
export function bolt({ size = 400, depth = 70, color = C.green, glow = 0 } = {}) {
    const s = new THREE.Shape()
    // the same bolt the site's badges use (24-unit icon grid)
    const pts = [[13, 2], [4.5, 13.5], [11, 13.5], [10, 22], [18.5, 10.5], [12, 10.5], [13, 2]]
    pts.forEach((p, i) => {
        const x = (p[0] - 11.5) * (size / 20), y = (12 - p[1]) * (size / 20)
        i ? s.lineTo(x, y) : s.moveTo(x, y)
    })
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 10, bevelSize: 7, bevelSegments: 4 })
    geo.center()
    const m = new THREE.Mesh(geo, mat(color, { flat: false, emissive: glow ? color : null, emissiveIntensity: glow }))
    m.castShadow = m.receiveShadow = true
    return m
}
// an hourglass: two glass bulbs, sand in the brand yellow, two end plates
export function hourglass({ h = 420, color = C.sun, frame = C.frame } = {}) {
    const g = new THREE.Group()
    const r = h * 0.28, neck = h * 0.035, half = h / 2 - 16
    const prof = []
    for (let i = 0; i <= 24; i++) {
        const t = i / 24
        const y = -half + t * 2 * half
        const k = Math.abs(y) / half
        prof.push(new THREE.Vector2(neck + (r - neck) * Math.pow(Math.sin((k * Math.PI) / 2), 0.9), y))
    }
    const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshStandardMaterial({ color: "#EAF2FF", roughness: 0.25, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }))
    glass.position.y = h / 2
    g.add(glass)
    // sand: a mound below, a funnel above (most of it has run out)
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(r * 0.86, half * 0.62, 48), mat(color, { flat: false }))
    bottom.position.y = 16 + (half * 0.62) / 2 + 4
    g.add(bottom)
    const topSand = new THREE.Mesh(new THREE.ConeGeometry(r * 0.52, half * 0.36, 48), mat(color, { flat: false }))
    topSand.rotation.x = Math.PI
    topSand.position.y = h / 2 + half * 0.2
    g.add(topSand)
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, half * 0.5, 8), mat(color))
    stream.position.y = h / 2 - half * 0.18
    g.add(stream)
    ;[0, h - 16].forEach((y) => {
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 16, 48), mat(frame, { flat: false }))
        plate.position.y = y + 8
        g.add(plate)
    })
    ;[0, 1, 2].forEach((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4
        const post = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, h - 16, 10), mat(frame))
        post.position.set(Math.cos(a) * r * 1.02, h / 2, Math.sin(a) * r * 1.02)
        g.add(post)
    })
    shadowAll(g)
    return g
}
// a pedestal: a soft rounded block in a brand colour, top at y = h
export function pedestal({ w = 520, h = 120, d = 520, color = C.lavender } = {}) {
    const m = box(w, h, d, color, { r: 22 })
    return m
}
// a downward/upward arrow marker (cone + shaft), for buy/sell
export function arrow({ up = true, color = C.green, len = 120 } = {}) {
    const g = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, len * 0.6, 20), mat(color, { flat: false }))
    const head = new THREE.Mesh(new THREE.ConeGeometry(30, len * 0.45, 24), mat(color, { flat: false }))
    shaft.position.y = len * 0.3
    head.position.y = len * 0.6 + len * 0.22
    g.add(shaft, head)
    if (!up) g.rotation.z = Math.PI
    shadowAll(g)
    return g
}

// ---------------------------------------------------------------- utils
export function shade(hex, dl) {
    const c = new THREE.Color(hex)
    c.offsetHSL(0, 0, dl)
    return "#" + c.getHexString()
}
export function shadowAll(o) {
    o.traverse((m) => {
        if (m.isMesh) {
            m.castShadow = true
            m.receiveShadow = true
        }
    })
    return o
}
export function visibleChain(o) {
    for (let p = o; p; p = p.parent) if (!p.visible) return false
    return true
}
export function v(x, y, z) {
    return new THREE.Vector3(x, y, z)
}

// ---------------------------------------------------------------- lighting
// the hero's day/evening/night presets, trimmed to what a still needs
// key/rim are [colour, intensity, azimuth offset from the camera (deg), elevation (deg)]:
// placed relative to the camera, so every shot gets shadows falling across
// the frame instead of hiding behind the objects that cast them
export const LIGHT = {
    day: { hemi: [0xf6f5f2, 0xcdb98d, 1.15], key: [0xfff4e2, 2.3, 62, 50], rim: [0xfff1de, 0.55, 200, 30], bounce: [0xe9dac0, 0.35], view: 0.4, exposure: 0.95, sky: ["#ffffff", "#f6f5f2", "#eae6de", "#dcd4c4"], night: false, shadow: 0.2 },
    dusk: { hemi: [0xd9c8f5, 0x2a2440, 1.25], key: [0xffb987, 1.9, -70, 22], rim: [0x8fa6ff, 1.1, 150, 34], bounce: [0x6a5aa8, 0.3], view: 0.7, exposure: 0.98, sky: ["#2a2150", "#3b2f63", "#5b4a7e", "#8a6f95"], night: true, glow: 0.7, shadow: 0.42 },
    night: { hemi: [0x7c86ad, 0x141a30, 1.35], key: [0xbfcdff, 0.85, -60, 55], rim: [0x5a76ff, 1.2, 160, 36], bounce: [0x1c2454, 0.2], view: 0.9, exposure: 1.05, sky: ["#0d1130", "#111640", "#171d4a", "#1e2558"], night: true, glow: 1.0, shadow: 0.5 },
}

// ---------------------------------------------------------------- studio
export function createStudio(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 60000)
    const root = new THREE.Group() // everything a composition adds
    scene.add(root)

    const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
    const key = new THREE.DirectionalLight(0xffffff, 1)
    key.castShadow = true
    key.shadow.mapSize.set(4096, 4096)
    key.shadow.bias = -0.0002
    key.shadow.normalBias = 0.6
    key.shadow.radius = 7
    key.shadow.blurSamples = 16
    const rim = new THREE.DirectionalLight(0xffffff, 1)
    const bounce = new THREE.DirectionalLight(0xffffff, 1)
    const view = new THREE.DirectionalLight(0xfff2da, 1)
    scene.add(hemi, key, key.target, rim, rim.target, bounce, bounce.target, view, view.target)
    const extraLights = []

    // shadow catcher: takes the key light's shadow on the invisible floor
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.3 }))
    catcher.rotation.x = -Math.PI / 2
    catcher.receiveShadow = true
    scene.add(catcher)

    const pmrem = new THREE.PMREMGenerator(renderer)
    let envRT = null
    function buildEnv(sky) {
        const c = document.createElement("canvas")
        c.width = 128
        c.height = 64
        const ctx = c.getContext("2d")
        const grd = ctx.createLinearGradient(0, 0, 0, 64)
        ;[0, 0.35, 0.65, 1].forEach((s, i) => grd.addColorStop(s, sky[i]))
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, 128, 64)
        const tex = new THREE.CanvasTexture(c)
        tex.mapping = THREE.EquirectangularReflectionMapping
        tex.colorSpace = THREE.SRGBColorSpace
        if (envRT) envRT.dispose()
        envRT = pmrem.fromEquirectangular(tex)
        tex.dispose()
        scene.environment = envRT.texture
        scene.environmentIntensity = 0.3
    }

    let preset = LIGHT.day
    function light(name, over = {}) {
        preset = Object.assign({}, LIGHT[name], over)
        hemi.color.setHex(preset.hemi[0])
        hemi.groundColor.setHex(preset.hemi[1])
        hemi.intensity = preset.hemi[2]
        key.color.setHex(preset.key[0])
        key.intensity = preset.key[1]
        rim.color.setHex(preset.rim[0])
        rim.intensity = preset.rim[1]
        bounce.color.setHex(preset.bounce[0])
        bounce.intensity = preset.bounce[1]
        view.intensity = preset.view
        renderer.toneMappingExposure = preset.exposure
        catcher.material.opacity = preset.shadow
        buildEnv(preset.sky)
        // night: windows glow warm, batteries give off a little green
        const glow = preset.night ? preset.glow : 0
        if (roleMat.windows) {
            roleMat.windows.emissive.set("#ffdcae")
            roleMat.windows.emissiveIntensity = glow * 1.1
            roleMat.windows.color.set(preset.night ? "#6a5f55" : C.windows)
        }
        ;["battery", "batteryBlocks"].forEach((r) => {
            if (!roleMat[r]) return
            roleMat[r].emissive.set(C.battery)
            roleMat[r].emissiveIntensity = glow * (over.batteryGlow ?? 0.55)
        })
        if (roleMat.logo) {
            roleMat.logo.emissive.set("#ffffff")
            roleMat.logo.emissiveIntensity = glow * 0.6
        }
    }

    function clear() {
        root.traverse((o) => {
            if (o.isMesh && o.userData.disposable) o.geometry.dispose()
        })
        root.clear()
        extraLights.splice(0).forEach((l) => {
            scene.remove(l)
            if (l.target) scene.remove(l.target)
        })
    }
    function add(...objs) {
        objs.forEach((o) => root.add(o))
        return objs[0]
    }
    // a warm or green point of light, e.g. over the Sett at night
    function point(pos, color, intensity, distance = 900) {
        // decay 0 with a cutoff: a local pool of light, independent of scene scale
        const l = new THREE.PointLight(color, intensity, distance, 0)
        l.position.copy(pos)
        scene.add(l)
        extraLights.push(l)
        return l
    }

    // ---------------------------------------------------------------- framing
    const _v = new THREE.Vector3()
    function bounds() {
        root.updateMatrixWorld(true)
        const b = new THREE.Box3()
        root.traverse((o) => {
            if (!o.isMesh || o.userData.noFrame || !visibleChain(o)) return
            o.geometry.computeBoundingBox()
            const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)
            b.union(bb)
        })
        return b
    }
    // place the camera at (azimuth, elevation) degrees around the composition
    // and move in until the projected silhouette fills the frame minus `pad`
    function frame({ az = 35, el = 28, fov = 28, pad = 0.08, box = null, shift = [0, 0], aspect }) {
        camera.fov = fov
        camera.aspect = aspect
        camera.updateProjectionMatrix()
        const b = box || bounds()
        const pts = []
        for (let i = 0; i < 8; i++) pts.push(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z))
        // tighter than the box's corners: project real vertices of the scene
        const verts = []
        root.traverse((o) => {
            if (!o.isMesh || o.userData.noFrame || !visibleChain(o)) return
            const p = o.geometry.attributes.position
            const step = Math.max(1, Math.floor(p.count / 400))
            for (let i = 0; i < p.count; i += step) verts.push(_v.fromBufferAttribute(p, i).clone().applyMatrix4(o.matrixWorld))
        })
        const sample = verts.length ? verts : pts
        const target = b.getCenter(new THREE.Vector3())
        const azr = THREE.MathUtils.degToRad(az), elr = THREE.MathUtils.degToRad(el)
        const dir = new THREE.Vector3(Math.sin(azr) * Math.cos(elr), Math.sin(elr), -Math.cos(azr) * Math.cos(elr))
        let dist = b.getSize(new THREE.Vector3()).length() / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2))
        for (let it = 0; it < 14; it++) {
            camera.position.copy(target).addScaledVector(dir, dist)
            camera.lookAt(target)
            camera.updateMatrixWorld(true)
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
            for (const p of sample) {
                const q = p.clone().project(camera)
                x0 = Math.min(x0, q.x)
                x1 = Math.max(x1, q.x)
                y0 = Math.min(y0, q.y)
                y1 = Math.max(y1, q.y)
            }
            const halfH = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * dist
            const halfW = halfH * aspect
            const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
            const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
            target.addScaledVector(right, ((x0 + x1) / 2) * halfW).addScaledVector(up, ((y0 + y1) / 2) * halfH)
            const s = Math.max((x1 - x0) / 2, (y1 - y0) / 2) / (1 - pad)
            dist *= 0.35 + 0.65 * s
        }
        // optional off-centre placement, in fractions of the frame
        if (shift[0] || shift[1]) {
            const halfH = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * dist
            const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
            const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
            target.addScaledVector(right, -shift[0] * halfH * aspect).addScaledVector(up, -shift[1] * halfH)
            camera.position.copy(target).addScaledVector(dir, dist)
            camera.lookAt(target)
        }
        // depth range from the framing: a fitted scene sits within ~¼ of the
        // distance of its target, and a near plane of 1 left only ~2 units of depth
        // precision out here, so close parallel faces (glass on a facade) z-fought
        camera.near = Math.max(1, dist * 0.25)
        camera.far = dist * 6
        camera.updateProjectionMatrix()
        camera.updateMatrixWorld(true)
        return { target, dist, dir, box: b }
    }

    // ---------------------------------------------------------------- lights + shadows per shot
    function placeLights(b, target) {
        const size = b.getSize(new THREE.Vector3()).length()
        const camAz = Math.atan2(camera.position.x - target.x, -(camera.position.z - target.z))
        const dirAt = (azOff, el) => {
            const a = camAz + THREE.MathUtils.degToRad(azOff), e = THREE.MathUtils.degToRad(el)
            return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e))
        }
        const place = (l, d) => {
            l.position.copy(target).addScaledVector(d, size * 1.6)
            l.target.position.copy(target)
        }
        const keyD = dirAt(preset.key[2], preset.key[3])
        place(key, keyD)
        place(rim, dirAt(preset.rim[2], preset.rim[3]))
        place(bounce, new THREE.Vector3(-keyD.x, -0.5, -keyD.z).normalize())
        view.position.copy(camera.position)
        view.target.position.copy(target)
        const sc = key.shadow.camera
        const half = size * 0.62
        sc.left = -half
        sc.right = half
        sc.top = half
        sc.bottom = -half
        sc.near = size * 0.2
        sc.far = size * 3.4
        sc.updateProjectionMatrix()
        catcher.position.set(target.x, b.min.y + 0.2, target.z)
        catcher.scale.set(size * 4, size * 4, 1)
    }

    // soft contact shadow: render the scene's height above the floor from
    // below, blur it, lay it on the floor as an alpha texture
    const csRT = new THREE.WebGLRenderTarget(1024, 1024)
    const csRT2 = new THREE.WebGLRenderTarget(1024, 1024)
    const csMat = new THREE.ShaderMaterial({
        uniforms: { uFloor: { value: 0 }, uFade: { value: 200 }, uDark: { value: 1 } },
        vertexShader: "varying float vH; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vH = w.y; gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader: "uniform float uFloor, uFade, uDark; varying float vH; void main(){ float h = max(0.0, vH - uFloor); float a = uDark * pow(1.0 - clamp(h / uFade, 0.0, 1.0), 2.2); gl_FragColor = vec4(0.0, 0.0, 0.0, a); }",
        side: THREE.DoubleSide,
        transparent: false,
    })
    const blurMat = new THREE.ShaderMaterial({
        uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
        fragmentShader:
            "uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv; void main(){ vec4 s = vec4(0.0); float w[7]; w[0]=0.1964825501511404; w[1]=0.2969069646728344*0.5; w[2]=0.09447039785044732*0.5; w[3]=0.010381362401148057*0.5; w[4]=0.0; w[5]=0.0; w[6]=0.0; s += texture2D(tMap, vUv) * w[0]; for (int i = 1; i < 4; i++){ vec2 o = uDir * float(i) * 1.6; s += texture2D(tMap, vUv + o) * w[i]; s += texture2D(tMap, vUv - o) * w[i]; } gl_FragColor = s / (w[0] + 2.0*(w[1]+w[2]+w[3])); }",
        depthTest: false,
        depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat)
    const quadScene = new THREE.Scene()
    quadScene.add(quad)
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const csPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: csRT.texture, transparent: true, depthWrite: false, color: 0x000000 }))
    csPlane.rotation.x = -Math.PI / 2
    csPlane.renderOrder = -1
    scene.add(csPlane)
    function contactShadow(b, { strength = 0.6, fade = null, spread = 1.5, blur = 1 } = {}) {
        const size = b.getSize(new THREE.Vector3())
        const extent = Math.max(size.x, size.z) * spread
        const c = b.getCenter(new THREE.Vector3())
        const cam = new THREE.OrthographicCamera(-extent / 2, extent / 2, extent / 2, -extent / 2, 0, size.y + 20)
        cam.position.set(c.x, b.min.y - 1, c.z)
        cam.up.set(0, 0, 1)
        cam.lookAt(c.x, b.min.y + 10, c.z)
        csMat.uniforms.uFloor.value = b.min.y
        csMat.uniforms.uFade.value = fade ?? Math.max(60, size.y * 0.28)
        csMat.uniforms.uDark.value = 1
        const prevOverride = scene.overrideMaterial
        const prevVis = [catcher.visible, csPlane.visible]
        catcher.visible = csPlane.visible = false
        scene.overrideMaterial = csMat
        const prevClear = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha()
        renderer.setClearColor(0x000000, 0)
        renderer.setRenderTarget(csRT)
        renderer.clear()
        renderer.render(scene, cam)
        scene.overrideMaterial = prevOverride
        // blur: separable passes with widening steps — the shadow has to spread
        // well past the footprint, or it just hides under the object
        for (let k = 0; k < 7; k++) {
            const step = (1.5 + k * 2.2) * blur
            blurMat.uniforms.tMap.value = csRT.texture
            blurMat.uniforms.uDir.value.set(step / 1024, 0)
            renderer.setRenderTarget(csRT2)
            renderer.render(quadScene, quadCam)
            blurMat.uniforms.tMap.value = csRT2.texture
            blurMat.uniforms.uDir.value.set(0, step / 1024)
            renderer.setRenderTarget(csRT)
            renderer.render(quadScene, quadCam)
        }
        renderer.setRenderTarget(null)
        renderer.setClearColor(prevClear, prevAlpha)
        catcher.visible = prevVis[0]
        csPlane.visible = true
        csPlane.position.set(c.x, b.min.y + 0.35, c.z)
        csPlane.scale.set(extent, extent, 1)
        // the ortho camera looked up with +z as "up": flip to match world x/z
        csPlane.rotation.set(-Math.PI / 2, 0, 0)
        csPlane.scale.x = -extent
        csPlane.material.opacity = strength
        csPlane.visible = strength > 0
    }

    // ---------------------------------------------------------------- shadow-safe crop
    const PROBE = 480, CUT = 4 // probe width in px; alpha (0-255) that counts as "something there"
    function probe(aspect) {
        const w = PROBE, h = Math.max(1, Math.round(PROBE / aspect))
        renderer.setSize(w, h, false)
        renderer.setRenderTarget(null)
        renderer.clear()
        renderer.render(scene, camera)
        const gl = renderer.getContext()
        const px = new Uint8Array(w * h * 4)
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px)
        let x0 = w, x1 = -1, y0 = h, y1 = -1
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++)
                if (px[(y * w + x) * 4 + 3] > CUT) {
                    if (x < x0) x0 = x
                    if (x > x1) x1 = x
                    const top = h - 1 - y // readPixels rows run bottom-up
                    if (top < y0) y0 = top
                    if (top > y1) y1 = top
                }
        return { w, h, x0, x1: x1 + 1, y0, y1: y1 + 1, empty: x1 < 0 }
    }
    // turn the composition about its own centre (for the scroll "twist": the
    // framing has to hold at both ends of the turn)
    function pose(deg, centre) {
        const a = THREE.MathUtils.degToRad(deg)
        root.rotation.y = a
        const c = new THREE.Vector3(centre.x, 0, centre.z)
        root.position.copy(c).sub(c.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a))
        root.updateMatrixWorld(true)
    }
    function probePoses(aspect, twist, centre) {
        const angles = twist ? [-twist, 0, twist] : [0]
        let u = null
        for (const a of angles) {
            if (twist) pose(a, centre)
            const p = probe(aspect)
            if (p.empty) continue
            u = u ? { ...u, x0: Math.min(u.x0, p.x0), y0: Math.min(u.y0, p.y0), x1: Math.max(u.x1, p.x1), y1: Math.max(u.y1, p.y1) } : p
        }
        if (twist) pose(0, centre)
        return u
    }
    // returns the original fov when it switched to a crop (to restore after), else null
    function fitShadows(aspect, pad, twist = 0, centre = null) {
        const first = probePoses(aspect, twist, centre)
        if (!first) return null
        const touches = (p) => p.x0 <= 0 || p.y0 <= 0 || p.x1 >= p.w || p.y1 >= p.h
        if (!touches(first)) return null
        const baseFov = camera.fov
        const t = Math.tan(THREE.MathUtils.degToRad(baseFov) / 2)
        let k = 1.5, p = first
        for (let i = 0; i < 5; i++) {
            camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(t * k))
            camera.updateProjectionMatrix()
            p = probePoses(aspect, twist, centre) ?? p
            if (!touches(p)) break
            k *= 1.4
        }
        // the found region, a margin around it, grown to the output's aspect
        const m = Math.max(0.03, pad * 0.6) * Math.max(p.x1 - p.x0, (p.y1 - p.y0) * aspect)
        let x0 = p.x0 - m, x1 = p.x1 + m, y0 = p.y0 - m, y1 = p.y1 + m
        const cw = x1 - x0, ch = y1 - y0
        if (cw / ch < aspect) {
            const grow = ch * aspect - cw
            x0 -= grow / 2
            x1 += grow / 2
        } else {
            const grow = cw / aspect - ch
            y0 -= grow / 2
            y1 += grow / 2
        }
        camera.setViewOffset(p.w, p.h, x0, y0, x1 - x0, y1 - y0)
        camera.updateProjectionMatrix()
        return baseFov
    }

    // ---------------------------------------------------------------- render
    // the shot as render() sets it up: framing, lights, shadows, crop
    // out: the output size when it differs from the framing (card renders)
    function setup({ width, height, az, el, fov, pad, shift, box, contact = {}, shadowFloor = true, twist = 0, card = null, out = null }) {
        const aspect = width / height
        const f = frame({ az, el, fov, pad, shift, box, aspect })
        const b = bounds()
        placeLights(b, f.target)
        catcher.visible = shadowFloor
        if (contact !== false) contactShadow(b, contact)
        else csPlane.visible = false
        const centre = b.getCenter(new THREE.Vector3())
        const cropped = fitShadows(aspect, pad ?? 0.08, twist, centre)
        if (card) cardRegion(card, out ? out.width / out.height : aspect)
        return { aspect, b, centre, cropped, target: f.target }
    }
    function restore(cropped) {
        camera.clearViewOffset()
        if (cropped) camera.fov = cropped
        camera.updateProjectionMatrix()
    }
    // the card framing: in on the shot's region by `zoom`, centred at `focus`
    // (× region size), cropped to the output aspect. SettScrollScene does the
    // same sum at runtime, so a card poster and its live scene line up.
    function cardRegion({ zoom = 1.3, focus = [0, 0] }, aspect) {
        const v = camera.view && camera.view.enabled ? camera.view : null
        const fw = v ? v.fullWidth : 1000 * camera.aspect, fh = v ? v.fullHeight : 1000
        const x = v ? v.offsetX : 0, y = v ? v.offsetY : 0
        let w = v ? v.width : fw, h = v ? v.height : fh
        const cx = x + w / 2 + focus[0] * w, cy = y + h / 2 + focus[1] * h
        w /= zoom
        h /= zoom
        if (w / h > aspect) w = h * aspect
        else h = w / aspect
        camera.setViewOffset(fw, fh, cx - w / 2, cy - h / 2, w, h)
        camera.updateProjectionMatrix()
    }
    async function render(opts) {
        const { width, height } = opts.out ?? opts
        const ss = opts.ss ?? 2
        const { cropped } = setup(opts)
        // (setup: soft shadows can reach past a frame fitted to the geometry; if any
        // pixel touches an edge it looks wider, finds where the pixels really end
        // and renders exactly that region, plus margin, through a view offset)
        renderer.setSize(width * ss, height * ss, false)
        renderer.setRenderTarget(null)
        renderer.clear()
        renderer.render(scene, camera)
        restore(cropped)
        // downsample into the final canvas: supersampled edges, clean alpha
        const out = document.createElement("canvas")
        out.width = width
        out.height = height
        const ctx = out.getContext("2d")
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        if (ss > 2) {
            // two halving steps keep the filtering even at 3x-4x
            const mid = document.createElement("canvas")
            mid.width = width * 2
            mid.height = height * 2
            const mctx = mid.getContext("2d")
            mctx.imageSmoothingQuality = "high"
            mctx.drawImage(renderer.domElement, 0, 0, mid.width, mid.height)
            ctx.drawImage(mid, 0, 0, width, height)
        } else ctx.drawImage(renderer.domElement, 0, 0, width, height)
        const blob = await new Promise((res) => out.toBlob(res, "image/png"))
        return { blob, canvas: out }
    }

    // what a live, scroll-driven copy of a render needs (SettScrollScene): the
    // camera exactly as the PNG was taken, the lights, the baked contact shadow
    function shot(opts) {
        const { aspect, centre, cropped } = setup(opts)
        const v = camera.view && camera.view.enabled ? camera.view : null
        const light = (l) => ({ color: l.color.getHex(), intensity: l.intensity, position: l.position.toArray(), target: l.target.position.toArray() })
        const meta = {
            v: 1,
            aspect,
            camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, near: camera.near, far: camera.far, view: v ? { fullWidth: v.fullWidth, fullHeight: v.fullHeight, offsetX: v.offsetX, offsetY: v.offsetY, width: v.width, height: v.height } : null },
            lights: { hemi: { color: hemi.color.getHex(), ground: hemi.groundColor.getHex(), intensity: hemi.intensity }, key: light(key), rim: light(rim), bounce: light(bounce), view: light(view) },
            shadow: { opacity: catcher.material.opacity, visible: catcher.visible, y: catcher.position.y, size: catcher.scale.x, camera: { left: key.shadow.camera.left, right: key.shadow.camera.right, top: key.shadow.camera.top, bottom: key.shadow.camera.bottom, near: key.shadow.camera.near, far: key.shadow.camera.far } },
            exposure: renderer.toneMappingExposure,
            sky: preset.sky,
            points: extraLights.filter((l) => l.isPointLight).map((l) => ({ position: l.position.toArray(), color: l.color.getHex(), intensity: l.intensity, distance: l.distance })),
            centre: centre.toArray(),
        }
        // the contact shadow, read back from its render target into a texture on a plane
        let contactMesh = null
        if (csPlane.visible) {
            const px = new Uint8Array(1024 * 1024 * 4)
            renderer.readRenderTargetPixels(csRT, 0, 0, 1024, 1024, px)
            const c = document.createElement("canvas")
            c.width = c.height = 512
            const full = document.createElement("canvas")
            full.width = full.height = 1024
            const img = full.getContext("2d").createImageData(1024, 1024)
            // render-target rows run bottom-up: flip into canvas order
            for (let y = 0; y < 1024; y++) img.data.set(px.subarray((1023 - y) * 4096, (1024 - y) * 4096), y * 4096)
            full.getContext("2d").putImageData(img, 0, 0)
            c.getContext("2d").drawImage(full, 0, 0, 512, 512)
            const tex = new THREE.CanvasTexture(c)
            tex.colorSpace = THREE.NoColorSpace
            const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0x000000, opacity: csPlane.material.opacity })
            m.name = "contact_shadow"
            contactMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m)
            contactMesh.name = "contact_shadow"
            contactMesh.position.copy(csPlane.position)
            contactMesh.rotation.copy(csPlane.rotation)
            contactMesh.scale.copy(csPlane.scale)
            contactMesh.renderOrder = -1
        }
        restore(cropped)
        return { meta, contactMesh }
    }

    return { renderer, scene, camera, root, light, clear, add, point, render, shot, bounds, frame }
}

export async function save(name, blob) {
    const r = await fetch("/save?name=" + encodeURIComponent(name), { method: "POST", body: blob })
    if (!r.ok) throw new Error("save failed " + r.status)
    return r.json()
}

// ---------------------------------------------------------------- export
// the Sett unit + charge pole as a compact GLB for the interactive component:
// origin at the bin's top-centre, y up, materials named after their colour
// role so the component can recolour them. The charge cable is left out (it
// only makes sense running to a parked car).
export async function exportSettGLB() {
    const { GLTFExporter } = await import("https://esm.sh/three@0.185.1/examples/jsm/exporters/GLTFExporter.js")
    const { mergeVertices } = await import("https://esm.sh/three@0.185.1/examples/jsm/utils/BufferGeometryUtils.js")
    // the component renders flat-shaded, so normals and uvs are dead weight;
    // without them, coincident corners weld and the index does the rest
    const slim = (g) => {
        const c = g.clone()
        c.deleteAttribute("normal")
        c.deleteAttribute("uv")
        return mergeVertices(c, 1e-3)
    }
    const root = new THREE.Group()
    root.name = "SettBox"
    const named = {}
    const roleOf = (m) => Object.keys(roleMat).find((k) => roleMat[k] === m) || "settBin"
    const matFor = (m) => {
        const role = roleOf(m)
        if (!named[role]) {
            named[role] = new THREE.MeshStandardMaterial({ color: m.color.clone(), roughness: 1, metalness: 0 })
            named[role].name = role
        }
        return named[role]
    }
    ;[P.sett, P.pole].forEach((grp) =>
        grp.children.forEach((src) => {
            if (!src.isMesh || /^(Pipe\.002|Extruded\.010)/.test(src.name)) return
            const m = new THREE.Mesh(slim(src.geometry), Array.isArray(src.material) ? src.material.map(matFor) : matFor(src.material))
            m.geometry.translate(-P.settCenter.x, -GRADE, -P.settCenter.z)
            m.name = src.name.replace(/_+$/, "") + (/_+$/.test(src.name) ? "_b" : "")
            root.add(m)
        })
    )
    const glb = await new GLTFExporter().parseAsync(root, { binary: true })
    return new Blob([glb], { type: "model/gltf-binary" })
}


// ---------------------------------------------------------------- hero builders
// corrugated steel sheet: a trapezoidal profile along x, extruded up to `h`.
// Its face points -z; thickness goes +z.
export function corrugated(w, h, { period = 24, depth = 4.5, material } = {}) {
    const s = new THREE.Shape()
    const n = Math.max(1, Math.round(w / period)), p = w / n
    s.moveTo(-w / 2, 0)
    for (let i = 0; i < n; i++) {
        const x = -w / 2 + i * p
        s.lineTo(x + p * 0.2, 0)
        s.lineTo(x + p * 0.32, -depth)
        s.lineTo(x + p * 0.68, -depth)
        s.lineTo(x + p * 0.8, 0)
    }
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, 6)
    s.lineTo(-w / 2, 6)
    s.lineTo(-w / 2, 0)
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 })
    // profile in x/y (y = -z, the face); extrusion along +z becomes up
    geo.rotateX(-Math.PI / 2)
    const m = new THREE.Mesh(geo, material)
    m.castShadow = m.receiveShadow = true
    return m
}

// a small business unit: corrugated anthracite cladding, a flat roof behind a
// parapet, one sectional door raised on a lit workshop, one closed, and an
// office corner with a glazed entrance. Front face at z = -d/2, ground at y=0.
export function warehouse({ w = 1700, d = 950, h = 560 } = {}) {
    const g = new THREE.Group()
    g.name = "warehouse"
    const clad = named("cladding", "#566072")
    const cladSide = named("cladding", "#566072")
    const trim = named("trim", "#2B2F37")
    const roof = named("roof", "#565C68")
    const doorM = named("door", "#C9CDD3")
    const doorSeam = named("trim", "#9EA3AB")
    const inner = named("interior", "#6E727B")
    const floorM = named("interiorFloor", "#8C8F95")
    const lamp = new THREE.MeshStandardMaterial({ color: "#fff4e0", emissive: "#ffe2b0", emissiveIntensity: 1.6, roughness: 1 })
    lamp.name = "interiorLight"
    const win = roleMaterial("windows")
    const add = (m, x, y, z) => {
        m.position.set(x, y, z)
        m.castShadow = m.receiveShadow = true
        g.add(m)
        return m
    }
    const boxM = (bw, bh, bd, material) => new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), material)
    const z0 = -d / 2
    // the open door (left) needs a real opening; everything else sits proud of the cladding
    const doorA = { x: -w / 2 + 330, w: 400, h: 430, open: 0.8 }
    const doorB = { x: -w / 2 + 800, w: 400, h: 430 }
    const aL = doorA.x - doorA.w / 2, aR = doorA.x + doorA.w / 2
    const panel = (x0, x1, y0, y1) => {
        const p = corrugated(x1 - x0, y1 - y0, { material: clad })
        p.position.set((x0 + x1) / 2, y0, z0)
        g.add(p)
    }
    panel(-w / 2, aL, 0, h)
    panel(aL, aR, doorA.h, h)
    panel(aR, w / 2, 0, h)
    // side (+x), back, far side, roof
    const side = corrugated(d, h, { material: cladSide })
    side.rotation.y = -Math.PI / 2
    side.position.set(w / 2, 0, 0)
    g.add(side)
    add(boxM(w, h, 8, clad), 0, h / 2, d / 2 - 4)
    add(boxM(8, h, d, clad), -w / 2 + 4, h / 2, 0)
    add(boxM(w + 4, 14, d + 4, roof), 0, h - 7, 0)
    // parapet trim along the top edges, corner flashings, downpipes
    add(boxM(w + 16, 26, 10, trim), 0, h + 6, z0 - 3)
    add(boxM(10, 26, d + 16, trim), w / 2 + 3, h + 6, 0)
    ;[-w / 2, w / 2].forEach((x) => add(boxM(12, h, 12, trim), x, h / 2, z0 - 2))
    ;[-w / 2 + 40, w / 2 - 40].forEach((x) => add(new THREE.Mesh(new THREE.CylinderGeometry(5, 5, h - 10, 8), trim), x, h / 2, z0 - 12))
    // the workshop behind the open door
    const room = { w: doorA.w + 220, d: 380, h: h - 30 }
    add(boxM(room.w, 6, room.d, floorM), doorA.x, 3, z0 + room.d / 2)
    add(boxM(room.w, room.h, 8, inner), doorA.x, room.h / 2, z0 + room.d)
    add(boxM(8, room.h, room.d, inner), doorA.x - room.w / 2, room.h / 2, z0 + room.d / 2)
    add(boxM(8, room.h, room.d, inner), doorA.x + room.w / 2, room.h / 2, z0 + room.d / 2)
    add(boxM(room.w, 8, room.d, inner), doorA.x, room.h, z0 + room.d / 2)
    ;[-110, 110].forEach((dx) => add(boxM(120, 4, 24, lamp), doorA.x + dx, room.h - 8, z0 + room.d * 0.5))
    // workbench, tool wall, shelving with coloured bins
    add(boxM(240, 88, 70, named("interiorDark", "#3B3F48")), doorA.x - 60, 44, z0 + room.d - 50)
    add(boxM(260, 150, 4, named("interiorDark", "#3B3F48")), doorA.x - 60, 190, z0 + room.d - 6)
    add(boxM(90, 240, 60, named("interiorDark", "#3B3F48")), doorA.x + 180, 120, z0 + room.d - 40)
    const binCols = ["#2385F4", "#E84040", "#FFC02D", "#2385F4"]
    for (let r2 = 0; r2 < 4; r2++) add(boxM(70, 30, 40, named("bins", binCols[r2])), doorA.x + 180, 40 + r2 * 58, z0 + room.d - 48)
    // the raised door: its panel parked in the head of the opening
    const up = doorA.h * doorA.open
    add(boxM(doorA.w - 8, doorA.h - up, 6, doorM), doorA.x, up + (doorA.h - up) / 2, z0 - 1)
    add(boxM(doorA.w + 24, 18, 14, trim), doorA.x, doorA.h + 9, z0 - 5)
    ;[aL - 8, aR + 8].forEach((x) => add(boxM(14, doorA.h, 14, trim), x, doorA.h / 2, z0 - 5))
    // the closed door, with its panel seams and a vision row
    add(boxM(doorB.w, doorB.h, 6, doorM), doorB.x, doorB.h / 2, z0 - 4)
    for (let k = 1; k < 6; k++) add(boxM(doorB.w, 2, 7, doorSeam), doorB.x, (doorB.h / 6) * k, z0 - 4.5)
    for (let k = 0; k < 4; k++) add(boxM(70, 28, 7, win), doorB.x - 135 + k * 90, (doorB.h / 6) * 4.5, z0 - 5)
    add(boxM(doorB.w + 24, 18, 14, trim), doorB.x, doorB.h + 9, z0 - 7)
    ;[doorB.x - doorB.w / 2 - 8, doorB.x + doorB.w / 2 + 8].forEach((x) => add(boxM(14, doorB.h, 14, trim), x, doorB.h / 2, z0 - 7))
    // LED floodlights over the doors and the entrance
    const lampM = new THREE.MeshStandardMaterial({ color: "#fff1d6", emissive: "#ffd9a0", emissiveIntensity: 1.4, roughness: 1 })
    lampM.name = "wallLamp"
    ;[doorA.x, doorB.x, w / 2 - 390].forEach((x) => {
        add(boxM(44, 10, 26, trim), x, doorA.h + 70, z0 - 14)
        add(boxM(36, 3, 20, lampM), x, doorA.h + 64, z0 - 16)
    })
    // office corner: a glazed entrance under a canopy, a strip of windows above
    const ox = w / 2 - 330
    add(boxM(170, 250, 8, win), ox - 60, 125, z0 - 5)
    add(boxM(186, 12, 12, trim), ox - 60, 256, z0 - 6)
    add(boxM(6, 250, 10, trim), ox - 60, 125, z0 - 7)
    add(boxM(280, 12, 120, trim), ox - 60, 300, z0 - 60)
    for (let k = 0; k < 4; k++) {
        add(boxM(118, 96, 8, win), ox - 190 + k * 132, 400, z0 - 5)
        add(boxM(130, 8, 10, trim), ox - 190 + k * 132, 350, z0 - 6)
    }
    // side windows
    for (let k = 0; k < 3; k++) add(boxM(8, 90, 150, win), w / 2 + 5, 400, -d / 2 + 180 + k * 250)
    g.userData.size = { w, d, h }
    g.userData.doorA = { x: doorA.x, z: z0, w: doorA.w, h: doorA.h }
    g.userData.office = { x: ox - 60, z: z0 }
    return g
}

// a generic electric company van, extruded from its side profile. Faces +z.
// the cargo van (see loadVanModel), nose along +z, footprint centre at the
// origin, in the car's grey clay. userData.port: its charge port, on the right
// flank just behind the front wheel
export function van() {
    if (!P.van) return boxVan()
    const g = new THREE.Group()
    g.name = "van"
    const body = new THREE.Mesh(P.van, roleMaterial("car"))
    g.add(body)
    const bb = new THREE.Box3().setFromObject(g)
    // the flank (not the mirrors) at the port: cast in from the right
    const y = 100, z = bb.max.z - 175
    const hit = new THREE.Raycaster(new THREE.Vector3(bb.max.x + 50, y, z), new THREE.Vector3(-1, 0, 0)).intersectObject(body)[0]
    const flankX = hit ? hit.point.x : bb.max.x - 20
    g.userData.port = new THREE.Vector3(flankX + 1, y, z)
    const flap = new THREE.Mesh(new THREE.BoxGeometry(2, 16, 14), roleMaterial("car"))
    flap.position.set(flankX + 0.5, y, z)
    g.add(flap)
    shadowAll(g)
    return g
}
// the earlier hand-built van, kept as a fallback when the model can't load
function boxVan({ body = "#E9ECEF", accent = C.lime } = {}) {
    const g = new THREE.Group()
    g.name = "van"
    const L = 470, W = 200
    const s = new THREE.Shape()
    const P = [[-L / 2, 34], [-L / 2 + 2, 214], [-L / 2 + 16, 226], [L / 2 - 140, 228], [L / 2 - 40, 156], [L / 2 - 6, 132], [L / 2, 94], [L / 2, 34]]
    P.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])))
    const geo = new THREE.ExtrudeGeometry(s, { depth: W - 16, bevelEnabled: true, bevelThickness: 8, bevelSize: 8, bevelSegments: 3, curveSegments: 4 })
    geo.translate(0, 0, -(W - 16) / 2)
    geo.rotateY(-Math.PI / 2) // profile x → world z (length), extrusion → world x (width)
    const shell = new THREE.Mesh(geo, named("vanBody", body))
    g.add(shell)
    const glass = named("vanGlass", "#262B35")
    // a cargo van: side glass only in the cab doors, a windscreen, small rear-door windows
    const band = new THREE.Shape()
    ;[[L / 2 - 205, 150], [L / 2 - 205, 204], [L / 2 - 150, 208], [L / 2 - 64, 152]].forEach((p, i) => (i ? band.lineTo(p[0], p[1]) : band.moveTo(p[0], p[1])))
    const bandGeo = new THREE.ExtrudeGeometry(band, { depth: W + 2, bevelEnabled: false })
    bandGeo.translate(0, 0, -(W + 2) / 2)
    bandGeo.rotateY(-Math.PI / 2)
    g.add(new THREE.Mesh(bandGeo, glass))
    const ws = new THREE.Mesh(new THREE.BoxGeometry(W - 24, 74, 3), glass)
    ws.position.set(0, 186, L / 2 - 92)
    ws.rotation.x = -0.62
    g.add(ws)
    ;[-1, 1].forEach((sx) => {
        const rw = new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 34, 46, 3), glass)
        rw.position.set(sx * (W / 4), 176, -L / 2 - 3)
        g.add(rw)
    })
    // panel seams: sliding side door, split rear doors
    const seam = named("vanSeam", "#B9BEC6")
    ;[-1, 1].forEach((sx) => {
        const sd = new THREE.Mesh(new THREE.BoxGeometry(2, 150, 2), seam)
        sd.position.set(sx * (W / 2 + 0.6), 118, L / 2 - 210)
        g.add(sd)
        const sd2 = sd.clone()
        sd2.position.z = L / 2 - 330
        g.add(sd2)
    })
    const rs = new THREE.Mesh(new THREE.BoxGeometry(2, 180, 2), seam)
    rs.position.set(0, 124, -L / 2 - 4)
    g.add(rs)
    // accent stripe, lights, wheels
    ;[-1, 1].forEach((sx) => {
        const st = new THREE.Mesh(new THREE.BoxGeometry(2, 12, L - 40), named("accent", accent))
        st.position.set(sx * (W / 2 + 0.5), 86, 0)
        g.add(st)
    })
    const tail = new THREE.MeshStandardMaterial({ color: "#ff3b3b", emissive: "#ff2a2a", emissiveIntensity: 0.9, roughness: 1 })
    tail.name = "taillight"
    ;[-1, 1].forEach((sx) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(34, 14, 3), tail)
        t.position.set(sx * (W / 2 - 22), 126, -L / 2 - 6)
        g.add(t)
        const hl = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 3), named("headlight", "#F4F6FA"))
        hl.position.set(sx * (W / 2 - 26), 112, L / 2 + 5)
        g.add(hl)
    })
    const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 30, 5, 3), tail)
    bar.position.set(0, 134, -L / 2 - 6)
    g.add(bar)
    const tyre = named("tyre", "#1E2126")
    const hub = named("hub", "#A9AEB6")
    ;[[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(36, 36, 26, 20), tyre)
        wh.rotation.z = Math.PI / 2
        wh.position.set(sx * (W / 2 - 10), 36, sz * (L / 2 - 90))
        g.add(wh)
        const hc = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 27, 14), hub)
        hc.rotation.z = Math.PI / 2
        hc.position.copy(wh.position)
        g.add(hc)
    })
    shadowAll(g)
    return g
}
// a street of Dutch row houses (rijtjeshuizen): one terrace block, the ridge along
// the street, two storeys under a pitched roof, doors paired at the shared walls,
// solar panels on the street-side slope and a hedged front garden per house.
// Footprint centre at the origin, street side toward -z. userData.doors: each
// door's foot, in the block's frame
export function rowHouses({ n = 6, w = 420, d = 560, eave = 340, ridge = 560, r = Math.random, panels = [3, 2, 4, 3, 2, 3], garden = 130 } = {}) {
    const g = new THREE.Group()
    g.name = "house"
    const L = n * w, front = -d / 2
    const wallM = roleMaterial("walls"), winM = named("windows", C.windows), doorM = roleMaterial("door") // opaque glass: the see-through kind sorts badly against the facade plates
    const roofM = named("roof", shade(C.walls, -0.1)), ribM = named("roofRib", shade(C.walls, -0.16))
    const trimM = named("trim", shade(C.walls, -0.06))
    const add = (m, x, y, z) => (m.position.set(x, y, z), g.add(m), m)
    // facade-flat parts (plates, glass, doors, paths) only receive: cast, they'd acne themselves
    const flat = []
    const addFlat = (m, x, y, z) => (flat.push(m), add(m, x, y, z))
    // the block and its gable ends
    add(new THREE.Mesh(new THREE.BoxGeometry(L, eave, d), wallM), 0, eave / 2, 0)
    const gable = new THREE.Shape([new THREE.Vector2(-d / 2, eave), new THREE.Vector2(d / 2, eave), new THREE.Vector2(0, ridge)])
    const gGeo = new THREE.ExtrudeGeometry(gable, { depth: L, bevelEnabled: false })
    gGeo.rotateY(Math.PI / 2)
    gGeo.translate(-L / 2, 0, 0)
    g.add(new THREE.Mesh(gGeo, wallM))
    // the two roof slopes, overhanging the eaves and the gables
    const over = 26, rise = ridge - eave, a = Math.atan2(rise, d / 2)
    const run = d / 2 + over, sw = run / Math.cos(a), yEave = eave - over * Math.tan(a)
    const slopes = [-1, 1].map((side) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(L + 30, 10, sw), roofM)
        m.rotation.x = side < 0 ? -a : a
        const off = new THREE.Vector3(0, 5, 0).applyEuler(m.rotation)
        add(m, 0, (ridge + yEave) / 2 + off.y, (side * run) / 2 + off.z)
        // the party walls show as ribs over the roof
        for (let i = 1; i < n; i++) {
            const rib = new THREE.Mesh(new THREE.BoxGeometry(9, 8, sw - 6), ribM)
            rib.position.set(-L / 2 + i * w, 7, 0)
            m.add(rib)
        }
        return m
    })
    const ridgeCap = add(new THREE.Mesh(new THREE.BoxGeometry(L + 30, 10, 18), ribM), 0, ridge + 9, 0)
    ridgeCap.castShadow = true
    // per house: a facade plate (a touch of tone difference reads as separate homes),
    // door + canopy, a wide ground-floor window, two upstairs, panels on the roof
    const doors = []
    const noRecv = []
    const glass = (ww, hh, x, y) => {
        // layers ≥ 6 units apart: at these camera distances closer faces z-fight
        noRecv.push(addFlat(new THREE.Mesh(new THREE.BoxGeometry(ww, hh, 8), winM), x, y, front - 6))
        add(new THREE.Mesh(new THREE.BoxGeometry(ww + 12, 6, 14), trimM), x, y - hh / 2 - 3, front - 7) // sill
        noRecv.push(addFlat(new THREE.Mesh(new THREE.BoxGeometry(5, hh, 14), wallM), x, y, front - 7)) // mullion
    }
    for (let i = 0; i < n; i++) {
        const cx = -L / 2 + (i + 0.5) * w
        const side = i % 2 ? 1 : -1 // doors pair up at every other party wall
        addFlat(new THREE.Mesh(new THREE.BoxGeometry(w - 8, eave - 6, 4), named("facade", shade(C.walls, i % 2 ? -0.018 : 0.006))), cx, eave / 2, front - 2)
        const dx = cx + side * (w / 2 - 72)
        addFlat(new THREE.Mesh(new THREE.BoxGeometry(84, 172, 10), doorM), dx, 86, front - 6)
        add(new THREE.Mesh(new THREE.BoxGeometry(124, 8, 46), trimM), dx, 182, front - 23)
        doors.push(new THREE.Vector3(dx, 0, front))
        glass(190, 112, cx - side * 70, 112)
        ;[-1, 1].forEach((k) => glass(118, 96, cx + k * 92, 262))
        // solar panels: rows of two up the street-side slope
        const cols = panels[i % panels.length], pw = 78, ph = 104, gap = 7
        for (let c = 0; c < cols; c++)
            for (let rr = 0; rr < 2; rr++) {
                const pnl = new THREE.Mesh(new THREE.BoxGeometry(pw, 5, ph), roleMaterial("solarPanels"))
                pnl.position.set(cx + (c - (cols - 1) / 2) * (pw + gap), 7.5, -sw / 2 + 60 + ph / 2 + rr * (ph + gap) + 20)
                slopes[0].add(pnl)
            }
        // the front garden: a low hedge with a gap for the path to the door
        const hl = w - 150
        const hg = hedge(hl, r, { h: 46, d: 30, color: C.bushes })
        hg.position.set(cx - side * 50, 0, front - garden)
        g.add(hg)
        addFlat(new THREE.Mesh(new THREE.BoxGeometry(86, 2, garden - 6), named("pathway", C.pathway)), dx, 1, front - garden / 2 - 3)
    }
    g.userData.doors = doors
    shadowAll(g)
    flat.forEach((m) => (m.castShadow = false))
    noRecv.forEach((m) => (m.receiveShadow = false)) // glass reads flat; it only caught shadow acne
    return g
}
// a trimmed hedge along x
export function hedge(len, r = Math.random, { h = 72, d = 58, color = "#A4B295" } = {}) {
    const g = new THREE.Group()
    const m = named("hedge", shade(color, (r() - 0.5) * 0.05))
    const b = new THREE.Mesh(new RoundedBoxGeometry(len, h, d, 2, 14), m)
    b.position.y = h / 2
    g.add(b)
    for (let x = -len / 2 + 30; x < len / 2 - 20; x += 44 + r() * 20) {
        const bl = new THREE.Mesh(new THREE.IcosahedronGeometry(20 + r() * 10, 0), m)
        bl.position.set(x, h - 4 + r() * 6, (r() - 0.5) * 16)
        bl.rotation.set(r() * 3, r() * 3, r() * 3)
        g.add(bl)
    }
    shadowAll(g)
    return g
}
// a border of flowering plants: small faceted blobs in a few colours
export function flowerBed(len, depth, r = Math.random, colors = ["#B9A6E8", "#F3EFE6", "#E9A8C4", "#9C86DA"], leafColor = "#9DB08A") {
    const g = new THREE.Group()
    const leaf = named("bushes", leafColor)
    for (let x = -len / 2; x < len / 2; x += 26 + r() * 14) {
        const z = (r() - 0.5) * depth
        const base = new THREE.Mesh(new THREE.IcosahedronGeometry(14 + r() * 8, 0), leaf)
        base.position.set(x, 10, z)
        g.add(base)
        if (!colors.length) continue
        const c = colors[Math.floor(r() * colors.length)]
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(7 + r() * 5, 0), named("flowers", c))
        f.position.set(x + (r() - 0.5) * 10, 24 + r() * 10, z + (r() - 0.5) * 10)
        g.add(f)
    }
    shadowAll(g)
    return g
}

// any group → compact GLB. Flat-shaded parts lose normals/uvs and weld;
// energy tubes keep their uvs (u runs along the line: the component's pulses ride on it)
// every triangle's three vertex normals (nearly) equal: flat shading reproduces it
function isFaceted(g) {
    const n = g.attributes.normal
    if (!n) return true
    const idx = g.index
    const tri = idx ? idx.count / 3 : n.count / 3
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
    let smooth = 0
    const step = Math.max(1, Math.floor(tri / 400))
    let seen = 0
    for (let t = 0; t < tri; t += step) {
        const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
        a.fromBufferAttribute(n, i0)
        b.fromBufferAttribute(n, i1)
        c.fromBufferAttribute(n, i2)
        if (a.dot(b) < 0.995 || a.dot(c) < 0.995) smooth++
        seen++
    }
    return smooth / Math.max(1, seen) < 0.05
}
export async function exportGroupGLB(root, { keepNormals = false } = {}) {
    const { GLTFExporter } = await import("https://esm.sh/three@0.185.1/examples/jsm/exporters/GLTFExporter.js")
    const { mergeVertices } = await import("https://esm.sh/three@0.185.1/examples/jsm/utils/BufferGeometryUtils.js")
    const out = root.clone(true)
    out.updateMatrixWorld(true)
    // userData goes into the file as JSON extras: drop references to scene
    // objects (a diorama keeps its set there — 9 MB of serialised meshes)
    out.traverse((o) => {
        for (const k of Object.keys(o.userData)) {
            const v = o.userData[k]
            // clone() has already JSON-copied them: an Object3D arrives as its toJSON() form
            if (v && typeof v === "object" && (v.isObject3D || v.isMaterial || v.isBufferGeometry || v.isTexture || (v.metadata && (v.object || v.geometries)))) delete o.userData[k]
        }
    })
    const slimmed = new Map() // source geometry → its slim copy, shared by every instance
    out.traverse((o) => {
        if (!o.isMesh) return
        if (!visibleChain(o)) {
            o.visible = false
            return
        }
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        // only the pulse tubes need their uvs; beads and the glowing cable weld like the rest
        // uvs stay on the pulse tubes (named, or any tube that knows its length) and textured parts
        const energy = mats.some((m) => (/^energy/.test(m.name || "") && !/_(bead|cable|dot|ring)$/.test(m.name || "")) || m.map) || (keepNormals && o.userData.length > 0)
        const key = o.geometry.uuid + (energy ? "e" : "")
        if (!slimmed.has(key)) {
            const g = o.geometry.clone()
            // hero scenes drop all normals (flat-shaded). Scroll scenes keep them only
            // where the surface is really smooth: on faceted meshes the loader's flat
            // shading looks the same, and without normals the vertices weld (10× smaller)
            if (!keepNormals || isFaceted(g)) g.deleteAttribute("normal")
            if (!energy) g.deleteAttribute("uv")
            slimmed.set(key, energy ? g : mergeVertices(g, 1e-3))
        }
        o.geometry = slimmed.get(key)
    })
    // hidden parts don't ship
    const drop = []
    out.traverse((o) => o.isMesh && !o.visible && drop.push(o))
    drop.forEach((o) => o.parent && o.parent.remove(o))
    const glb = await new GLTFExporter().parseAsync(out, { binary: true })
    return new Blob([glb], { type: "model/gltf-binary" })
}


// ---------------------------------------------------------------- homepage-style energy parts
// the homepage marks where a flow starts with a small bead and a camera-facing
// "ping" ring (the SettHero3D component animates the ring: it billboards,
// expands and fades every 1.6 s). Sizes are the homepage's, for this model.
export function originDot(pos, name) {
    const g = new THREE.Group()
    const bead = new THREE.Mesh(new THREE.SphereGeometry(3.9, 16, 12), glowMat("#ffffff", 1, name + "_dot"))
    const ringM = glowMat("#ffffff", 1, name + "_ring")
    const ring = new THREE.Mesh(new THREE.RingGeometry(6.5, 8.2, 40), ringM)
    g.add(bead, ring)
    g.position.copy(pos)
    return g
}
// the charge cable's centreline, walked from the socket end: repeatedly average
// the not-yet-visited vertices within reach (ported from SettScene3D)
export function cableCenterline(mesh, from) {
    mesh.updateMatrixWorld(true)
    const pos = mesh.geometry.attributes.position
    const pts = []
    for (let k = 0; k < pos.count; k++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, k).applyMatrix4(mesh.matrixWorld))
    const bb = new THREE.Box3().setFromPoints(pts)
    const R = Math.max(12, bb.getSize(new THREE.Vector3()).length() * 0.05)
    const visited = new Uint8Array(pts.length)
    let c = pts[0], nd = Infinity
    pts.forEach((q) => {
        const d = q.distanceToSquared(from)
        if (d < nd) {
            nd = d
            c = q
        }
    })
    const out = [c.clone()]
    for (let guard = 0; guard < 400; guard++) {
        const sum = new THREE.Vector3()
        let n = 0
        for (let k = 0; k < pts.length; k++) if (!visited[k] && pts[k].distanceToSquared(c) < R * R) (sum.add(pts[k]), n++, (visited[k] = 1))
        if (!n) {
            for (let k = 0; k < pts.length; k++) if (!visited[k] && pts[k].distanceToSquared(c) < 4 * R * R) (sum.add(pts[k]), n++, (visited[k] = 1))
            if (!n) break
        }
        c = sum.multiplyScalar(1 / n)
        out.push(c.clone())
    }
    // the cable's own radius: distance from inner centreline points to its surface
    const rs = []
    const step = Math.max(1, Math.floor((out.length - 2) / 6))
    for (let s = 1; s < out.length - 1; s += step) {
        let md = Infinity
        for (let q = 0; q < pts.length; q++) md = Math.min(md, pts[q].distanceToSquared(out[s]))
        rs.push(Math.sqrt(md))
    }
    rs.sort((a, b) => a - b)
    const radius = rs.length && rs[Math.floor(rs.length / 2)] > 0.2 ? rs[Math.floor(rs.length / 2)] : 2
    return { points: out, radius }
}
// a charge cable as on the homepage: a grey tube (2.6× the exported cable's
// thickness, as the homepage beefs it up), wrapped by the pulsing flow line
export function chargeCable(points, radius, name = "energy_flow") {
    const g = new THREE.Group()
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5)
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 10), roleMaterial("inverter"))
    cable.castShadow = cable.receiveShadow = true
    g.add(cable)
    const sheath = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius * 1.3, 8), glowMat("#ffffff", 1, name))
    sheath.userData.length = curve.getLength()
    g.add(sheath)
    return g
}
