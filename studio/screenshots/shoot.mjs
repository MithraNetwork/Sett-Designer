// Screenshots of every V2 page from the studio preview (the studio server must run on
// :8936). Scrolls through each page like a visitor, one screen at a time, so the
// pinned scroll sections show their stages, and saves the screens as tiles; stitch.py
// turns them into one PNG per page and size, plus thumbs/ and index.json.
//   node studio/screenshots/shoot.mjs desktop|mobile [page,page]   then   python3 studio/screenshots/stitch.py
import { chromium } from "/Users/tristan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"
import fs from "node:fs"
const [mode = "desktop"] = process.argv.slice(2)
const [W, H] = mode === "mobile" ? [390, 844] : [1440, 900]
const ONLY = process.argv[3]?.split(",")
const PAGES = ONLY ?? ["details", "particulieren", "bedrijven", "gemeenten", "contact", "qa", "over", "preorder", "partners", "bevestigd", "roadmap", "bedankt", "blog", "artikel", "voorwaarden", "privacy"]
const TILES = new URL("./tiles/", import.meta.url).pathname
const browser = await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] })
for (const p of PAGES) {
  const dir = TILES + p + "-" + mode + "/"
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: W, height: H }, hasTouch: mode === "mobile", isMobile: mode === "mobile" })
  page.setDefaultTimeout(90000)
  page.on("pageerror", (e) => console.log(p, "ERR", e.message))
  await page.goto(`http://localhost:8936/studio/v2.html?v=${Date.now()}#${p}`, { waitUntil: "load" })
  await page.addStyleTag({ content: ".bar,.sck{display:none!important}" }) // the studio's page bar and the cookie notice
  await page.waitForTimeout(4000)
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const meta = []
  for (let y = 0, i = 0; y < total; y += H, i++) {
    await page.evaluate((y) => scrollTo(0, y), y)
    await page.waitForTimeout(1500)
    const at = await page.evaluate(() => scrollY)
    const f = String(i).padStart(3, "0") + ".png"
    await page.screenshot({ path: dir + f })
    meta.push({ f, crop: y - at, keep: Math.min(H, total - y) })
    if (i === 0) await page.addStyleTag({ content: "#nav{visibility:hidden!important}" }) // the menu once, at the top
  }
  fs.writeFileSync(dir + "meta.json", JSON.stringify({ W, H, total, meta }))
  console.log(p, mode, total + "px", meta.length, "tiles")
  await page.close()
}
await browser.close()
