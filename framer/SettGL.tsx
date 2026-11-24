// Sett GL: lets a three.js renderer go completely when its scene unmounts.
// three.js keeps a few shared "empty" textures for its whole life, and every renderer that
// draws hangs a "dispose" listener on them; renderer.dispose() doesn't take those off, so
// each renderer (with its canvas, WebGL context and GPU memory) stayed in memory for good:
// one per scroll scene each time you scrolled past it. glTrack records every listener three
// adds while this renderer works, and release() takes them off again, frees the scenes'
// geometry, materials and textures, and closes the WebGL context.

import * as THREE from "https://esm.sh/three@0.185.1"

type Rec = [THREE.EventDispatcher<any>, string, (...a: any[]) => void]
// one shared recording slot per page (kept on the prototype, so every copy of this file sees the same one)
const P = THREE.EventDispatcher.prototype as unknown as { __settGL?: { rec: Rec[] | null }; addEventListener: (t: string, l: (...a: any[]) => void) => void }
if (!P.__settGL) {
    const slot: { rec: Rec[] | null } = { rec: null }
    P.__settGL = slot
    const add = P.addEventListener
    // note listeners added while a tracked renderer is working
    P.addEventListener = function (this: THREE.EventDispatcher<any>, t: string, l: (...a: any[]) => void) {
        if (slot.rec) slot.rec.push([this, t, l])
        return add.call(this, t, l)
    }
}
const slot = P.__settGL!

const freeMaterial = (m: any) => {
    for (const k of Object.keys(m)) if (m[k] && m[k].isTexture) m[k].dispose()
    if (m.uniforms) for (const u of Object.values(m.uniforms) as any[]) if (u && u.value && u.value.isTexture) u.value.dispose()
    m.dispose()
}

export function glTrack(renderer: THREE.WebGLRenderer) {
    const recs: Rec[] = []
    const r = renderer as any
    // everything that can make three hang listeners on shared objects runs inside the recording
    for (const name of ["render", "setRenderTarget", "compile", "initTexture", "initRenderTarget"]) {
        const fn = r[name]
        if (typeof fn !== "function") continue
        r[name] = function (...a: unknown[]) {
            const prev = slot.rec
            slot.rec = recs
            try {
                return fn.apply(renderer, a)
            } finally {
                slot.rec = prev
            }
        }
    }
    return {
        release(...scenes: (THREE.Object3D | null | undefined)[]) {
            for (const s of scenes)
                s?.traverse((o: any) => {
                    if (o.geometry) o.geometry.dispose()
                    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(freeMaterial)
                    if (o.isLight && o.shadow && o.shadow.dispose) o.shadow.dispose()
                })
            try {
                renderer.dispose()
            } catch {
                /* already gone */
            }
            for (const [t, type, l] of recs)
                try {
                    t.removeEventListener(type, l)
                } catch {
                    /* gone */
                }
            recs.length = 0
            try {
                renderer.forceContextLoss()
            } catch {
                /* no context to lose */
            }
            renderer.domElement.remove()
        },
    }
}
