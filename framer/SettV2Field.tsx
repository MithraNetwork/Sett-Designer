// Sett V2 Field — a WebGL shader background: the ground as a contour map
// ("hoogtelijnen"), with energy running along the lines. Three moods:
//   flow     lime pulses on black — energy moving freely (the Sett)
//   congest  amber and red, slow and knotted — a full grid
//   night    deep blue with lime — the evening peak, stored energy
// Reacts to the pointer; renders at reduced resolution, ~40 fps, pauses off
// screen; a still frame for reduced motion and the Framer canvas.

import * as React from "react"
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { onCanvas, reducedMotion, or } from "./SettV2Kit.tsx"

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseOn;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uBg; uniform float uSpeed; uniform float uKnot; uniform float uDensity; uniform float uGlow;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.02 + 17.0; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * uSpeed;
  // the terrain: slow, warped height field (knotted when congested)
  vec2 q = p * 1.35 + vec2(0.0, t * 0.02);
  q += uKnot * 0.35 * vec2(fbm(q * 2.3 + t * 0.05), fbm(q * 2.1 - t * 0.04));
  float h = fbm(q + vec2(fbm(q + t * 0.03), fbm(q * 1.3 - t * 0.02)) * 0.9);
  // the pointer lifts the ground
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  float d = length(p - m);
  h += uMouseOn * 0.16 * exp(-d * d * 9.0);
  // contour lines of that height
  float c = h * uDensity;
  float fw = max(fwidth(c), 1e-4);
  float fc = fract(c);
  float dl = min(fc, 1.0 - fc) / fw; // distance to the nearest contour, in pixels
  float line = 1.0 - smoothstep(0.6, 1.6, dl);
  float band = floor(c);
  // energy pulses travelling along each line
  float dir = mod(band, 2.0) < 1.0 ? 1.0 : -1.0;
  float along = atan(p.y - 0.2, p.x + 0.3) * 3.0 + h * 9.0;
  float pulse = pow(0.5 + 0.5 * sin(along * 1.2 - t * 2.0 * dir + band * 1.7), 30.0);
  vec3 col = uBg;
  vec3 lineCol = mix(uA, uB, smoothstep(0.25, 0.75, uv.y + 0.15 * sin(band)));
  col += lineCol * line * (0.09 + 0.75 * pulse) * uGlow;
  // pulses bloom a little around the line
  col += lineCol * pulse * (1.0 - smoothstep(0.0, 5.0, dl)) * 0.1 * uGlow;
  // a soft glow where the pointer is
  col += uB * uMouseOn * 0.03 * exp(-d * d * 5.0);
  // vignette + grain
  float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
  col = uBg + (col - uBg) * (0.25 + 0.75 * vig);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}`

const MOODS = {
    // kept quiet on purpose: a few faint lines and the odd pulse, a background
    flow: { a: "#2B8CFF", b: "#8DFF66", bg: "#060C1A", speed: 0.5, knot: 0.3, density: 5, glow: 0.5 },
    congest: { a: "#FFB92B", b: "#BF9CFF", bg: "#0B0A14", speed: 0.25, knot: 0.9, density: 6, glow: 0.45 },
    night: { a: "#9A6CE9", b: "#8DFF66", bg: "#060C1A", speed: 0.4, knot: 0.5, density: 5, glow: 0.5 },
}
type Mood = keyof typeof MOODS

const hex = (h: string) => {
    const n = parseInt(h.replace("#", ""), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

interface Props {
    mood?: Mood
    colorA?: string
    colorB?: string
    background?: string
    speed?: number
    density?: number
    interactive?: boolean
    intensity?: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
export default function SettV2Field(props: Props) {
    const ref = useRef<HTMLCanvasElement>(null)
    const live = useRef(props)
    live.current = props
    useEffect(() => {
        const canvas = ref.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false })
        if (!gl) return
        gl.getExtension("OES_standard_derivatives")
        const sh = (type: number, src: string) => {
            const s = gl.createShader(type)!
            gl.shaderSource(s, type === gl.FRAGMENT_SHADER ? "#extension GL_OES_standard_derivatives : enable\n" + src : src)
            gl.compileShader(s)
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s))
            return s
        }
        const prog = gl.createProgram()!
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "p")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const U = (n: string) => gl.getUniformLocation(prog, n)
        const u = { res: U("uRes"), time: U("uTime"), mouse: U("uMouse"), mouseOn: U("uMouseOn"), a: U("uA"), b: U("uB"), bg: U("uBg"), speed: U("uSpeed"), knot: U("uKnot"), density: U("uDensity"), glow: U("uGlow") }

        const still = onCanvas() || reducedMotion()
        const scale = window.innerWidth <= 760 ? 0.5 : 0.62
        let w = 1, h = 1
        const resize = () => {
            const r = canvas.getBoundingClientRect()
            w = Math.max(1, Math.round(r.width * scale))
            h = Math.max(1, Math.round(r.height * scale))
            canvas.width = w
            canvas.height = h
            gl.viewport(0, 0, w, h)
            draw(performance.now())
        }
        const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 }
        const onMove = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect()
            mouse.tx = (e.clientX - r.left) * scale
            mouse.ty = (r.bottom - e.clientY) * scale
            mouse.ton = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0
        }
        if (props.interactive !== false && !still) window.addEventListener("pointermove", onMove, { passive: true })

        const t0 = performance.now()
        let raf = 0, last = 0, visible = true
        function draw(now: number) {
            const P = live.current
            const M = MOODS[P.mood ?? "flow"] ?? MOODS.flow
            mouse.x += (mouse.tx - mouse.x) * 0.08
            mouse.y += (mouse.ty - mouse.y) * 0.08
            mouse.on += (mouse.ton - mouse.on) * 0.05
            gl.uniform2f(u.res, w, h)
            gl.uniform1f(u.time, still ? 12 : (now - t0) / 1000)
            gl.uniform2f(u.mouse, mouse.x, mouse.y)
            gl.uniform1f(u.mouseOn, mouse.on)
            gl.uniform3fv(u.a, hex(or(P.colorA, M.a)))
            gl.uniform3fv(u.b, hex(or(P.colorB, M.b)))
            gl.uniform3fv(u.bg, hex(or(P.background, M.bg)))
            gl.uniform1f(u.speed, (P.speed ?? 1) * M.speed)
            gl.uniform1f(u.knot, M.knot)
            gl.uniform1f(u.density, P.density ?? M.density)
            gl.uniform1f(u.glow, M.glow * (P.intensity ?? 1))
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop)
            if (!visible || document.hidden || now - last < 25) return
            last = now
            draw(now)
        }
        const ro = new ResizeObserver(resize)
        ro.observe(canvas)
        const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting))
        io.observe(canvas)
        resize()
        if (!still) raf = requestAnimationFrame(loop)
        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            window.removeEventListener("pointermove", onMove)
            gl.getExtension("WEBGL_lose_context")?.loseContext()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <canvas ref={ref} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", ...props.style }} />
}

SettV2Field.displayName = "Sett V2 · Energieveld (shader)"

addPropertyControls(SettV2Field, {
    mood: { type: ControlType.Enum, title: "Sfeer", options: ["flow", "congest", "night"], optionTitles: ["Stroom (lime)", "Congestie (rood)", "Nacht (blauw)"], defaultValue: "flow" },
    colorA: { type: ControlType.Color, title: "Kleur A" },
    colorB: { type: ControlType.Color, title: "Kleur B" },
    background: { type: ControlType.Color, title: "Achtergrond" },
    speed: { type: ControlType.Number, title: "Snelheid", min: 0, max: 3, step: 0.1, defaultValue: 1 },
    density: { type: ControlType.Number, title: "Lijnen", min: 3, max: 20, step: 1 },
    intensity: { type: ControlType.Number, title: "Sterkte", min: 0, max: 2, step: 0.05, defaultValue: 1 },
    interactive: { type: ControlType.Boolean, title: "Muis", defaultValue: true },
})
