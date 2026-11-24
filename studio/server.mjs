// Render studio server: serves the project root (the model files live there)
// and accepts rendered PNGs on POST /save?name=<file>.png, writing them into
// framer/assets/. Local development only.
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const OUT = path.join(ROOT, "framer", "assets")
const PORT = Number(process.env.PORT || 8936)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".obj": "text/plain", ".mtl": "text/plain", ".stl": "application/octet-stream", ".svg": "image/svg+xml", ".css": "text/css", ".glb": "model/gltf-binary", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".webp": "image/webp" }

fs.mkdirSync(OUT, { recursive: true })
const built = new Map() // component source → { mtime, code }

http
    .createServer((req, res) => {
        const url = new URL(req.url, "http://localhost")
        if (req.method === "POST" && url.pathname === "/save") {
            const name = url.searchParams.get("name") || ""
            if (!/^[a-z0-9][a-z0-9-]*\.(png|json|glb)$/.test(name)) {
                res.writeHead(400).end("bad name")
                return
            }
            const chunks = []
            req.on("data", (c) => chunks.push(c))
            req.on("end", () => {
                const buf = Buffer.concat(chunks)
                const dest = name.endsWith(".glb") ? path.join(ROOT, "framer") : OUT
                fs.writeFileSync(path.join(dest, name), buf)
                res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true, name, bytes: buf.length }))
            })
            return
        }
        // /studio/assets.json: what the asset library shows, read from framer/assets/ on every
        // request (so a new render is in it at once): renders and cards (PNG, with their pixel
        // size), photos and videos (with their posters), documents
        if (url.pathname === "/studio/assets.json") {
            const A = path.join(ROOT, "framer", "assets")
            const ls = (d, re) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => re.test(f)).sort() : [])
            const item = (rel) => {
                const f = path.join(ROOT, rel)
                const out = { path: "/" + rel.split(path.sep).join("/"), bytes: fs.statSync(f).size }
                if (rel.endsWith(".png")) {
                    const b = Buffer.alloc(24)
                    const fd = fs.openSync(f, "r")
                    fs.readSync(fd, b, 0, 24, 0)
                    fs.closeSync(fd)
                    out.w = b.readUInt32BE(16)
                    out.h = b.readUInt32BE(20)
                }
                return out
            }
            const pngs = ls(A, /\.png$/)
            const photos = ls(path.join(A, "photo"), /\.jpg$/)
            const list = [
                ...pngs.filter((f) => !f.startsWith("card-")).map((f) => ({ kind: "render", name: f.replace(/\.png$/, ""), ...item(path.join("framer", "assets", f)) })),
                ...pngs.filter((f) => f.startsWith("card-")).map((f) => ({ kind: "card", name: f.replace(/^card-|\.png$/g, ""), ...item(path.join("framer", "assets", f)) })),
                ...photos.filter((f) => !/-poster\.jpg$/.test(f)).map((f) => ({ kind: "photo", name: f.replace(/\.jpg$/, ""), ...item(path.join("framer", "assets", "photo", f)) })),
                ...ls(path.join(A, "photo"), /\.mp4$/).map((f) => ({ kind: "video", name: f.replace(/\.mp4$/, ""), poster: "/framer/assets/photo/" + f.replace(/\.mp4$/, "-poster.jpg"), ...item(path.join("framer", "assets", "photo", f)) })),
                ...ls(path.join(A, "legal"), /\.pdf$/).map((f) => ({ kind: "document", name: f.replace(/\.pdf$/, ""), ...item(path.join("framer", "assets", "legal", f)) })),
            ]
            res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify(list))
            return
        }
        // /studio/lib/<Component>.js: the Framer component from framer/<Component>.tsx,
        // bundled on request (esbuild via npx, fetched once) and cached until the file changes
        const lib = url.pathname.match(/^\/studio\/lib\/([A-Za-z0-9]+)\.js$/)
        if (lib) {
            const src = path.join(ROOT, "framer", lib[1] + ".tsx")
            if (!fs.existsSync(src)) {
                res.writeHead(404).end("no framer/" + lib[1] + ".tsx")
                return
            }
            const mtime = fs.statSync(src).mtimeMs
            const hit = built.get(src)
            if (!hit || hit.mtime !== mtime) {
                const r = spawnSync("npx", ["--yes", "esbuild@0.24.0", src, "--bundle", "--format=esm", "--jsx=automatic", "--loader:.tsx=tsx", "--alias:react=./shims/react.js", "--alias:react-dom=./shims/react-dom.js", "--alias:react/jsx-runtime=./shims/jsx-runtime.js", "--alias:framer=./shims/framer.js", "--external:https://*", "--log-level=error"], { cwd: HERE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
                if (r.status !== 0) {
                    res.writeHead(500, { "content-type": "text/plain" }).end("build failed:\n" + (r.stderr || r.error))
                    return
                }
                built.set(src, { mtime, code: r.stdout })
                console.log("built " + lib[1] + ".tsx")
            }
            res.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" }).end(built.get(src).code)
            return
        }
        let p = decodeURIComponent(url.pathname)
        if (p.endsWith("/")) p += "index.html"
        const file = path.join(ROOT, p)
        if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404).end("not found")
            return
        }
        const type = TYPES[path.extname(file)] || "application/octet-stream"
        const size = fs.statSync(file).size
        // byte ranges, so <video> can seek and loop
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "")
        if (range) {
            const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
            const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1
            res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1, "cache-control": "no-store" })
            fs.createReadStream(file, { start, end }).pipe(res)
            return
        }
        res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "content-length": size, "cache-control": "no-store" })
        fs.createReadStream(file).pipe(res)
    })
    .listen(PORT, () => {
        console.log("studio on http://localhost:" + PORT + "/studio/")
        console.log("  page heroes:     http://localhost:" + PORT + "/studio/heroes.html")
        console.log("  interactive box: http://localhost:" + PORT + "/studio/box.html")
    })
