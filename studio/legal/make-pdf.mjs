// Prints the terms and the privacy statement (studio/legal.html, from v2-content.js) to
// A4 PDFs in framer/assets/legal/, with Sett's footer on every page. The studio server must
// run on :8936.   node studio/legal/make-pdf.mjs
import { chromium } from "/Users/tristan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "framer", "assets", "legal")
const DOCS = { voorwaarden: ["sett-algemene-voorwaarden", "Algemene voorwaarden"], privacy: ["sett-privacyverklaring", "Privacyverklaring"] }
const browser = await chromium.launch({ channel: "chrome" })
for (const [key, [file, title]] of Object.entries(DOCS)) {
  const page = await browser.newPage()
  page.on("pageerror", (e) => console.log(key, "ERR", e.message))
  await page.goto("http://localhost:8936/studio/legal.html?doc=" + key + "&v=" + Date.now(), { waitUntil: "networkidle" })
  await page.waitForFunction(() => window.__ready === true)
  await page.pdf({
    path: path.join(OUT, file + ".pdf"),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;padding:0 18mm;display:flex;justify-content:space-between;font:500 7pt Menlo,'SF Mono',ui-monospace,monospace;letter-spacing:.06em;color:#8a8d96;"><span>SETT · ${title.toUpperCase()}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  })
  console.log("✓ " + file + ".pdf")
  await page.close()
}
await browser.close()
