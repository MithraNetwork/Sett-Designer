// The Sett Designer's navigation bar, the same on every page: the logo (to the start page),
// the three parts with the current one marked, and the workshop tools in a menu on the right.
// A page includes it with <script type="module" src="./nav.js"></script> and gets a
// <nav class="sd-nav"> as the first element of its body, 56 px high (--sd-nav).
const PARTS = [
  { href: "./slide.html", label: "Slides", match: /\/slide\.html$/ },
  { href: "./box.html", label: "Sett-box", match: /\/box\.html$/ },
  { href: "./assets.html", label: "Assets", match: /\/assets\.html$/ },
]
const TOOLS = [
  { href: "./renders.html", label: "Renders maken" },
  { href: "./v2.html", label: "Pagina's bekijken" },
  { href: "./screenshots.html", label: "Screenshots" },
  { href: "./legal.html?doc=voorwaarden", label: "Juridisch (A4)" },
]
const CSS = `
:root{ --sd-nav:56px; }
.sd-nav{ position:relative; z-index:50; height:var(--sd-nav); display:flex; align-items:center; gap:6px; padding:0 18px; background:#090C14; border-bottom:1px solid #1E2330; font:500 14px Outfit, system-ui, sans-serif; color:#DFE4F2; }
.sd-nav a{ color:inherit; text-decoration:none; }
.sd-nav .home{ display:flex; align-items:flex-end; gap:10px; margin-right:18px; }
.sd-nav .home svg{ width:58px; height:auto; fill:#fff; display:block; }
.sd-nav .home b{ font:600 10.5px "Geist Mono", ui-monospace, monospace; letter-spacing:.16em; text-transform:uppercase; color:#8DFF66; padding-bottom:3px; }
.sd-nav .sd-part{ padding:8px 14px; border-radius:999px; color:#9AA3B8; transition:background .15s, color .15s; }
.sd-nav .sd-part:hover{ color:#fff; background:#161B26; }
.sd-nav .sd-part.on{ color:#060C1A; background:#8DFF66; font-weight:700; }
.sd-nav .sp{ flex:1; }
.sd-nav details{ position:relative; }
.sd-nav summary{ list-style:none; cursor:pointer; padding:8px 12px; border-radius:999px; color:#9AA3B8; font:600 11px "Geist Mono", ui-monospace, monospace; letter-spacing:.12em; text-transform:uppercase; }
.sd-nav summary::-webkit-details-marker{ display:none; }
.sd-nav summary:hover, .sd-nav details[open] summary{ color:#fff; background:#161B26; }
.sd-nav .menu{ position:absolute; right:0; top:calc(100% + 8px); min-width:210px; padding:6px; border-radius:14px; background:#12151C; border:1px solid #232836; box-shadow:0 18px 40px rgba(0,0,0,.45); display:grid; }
.sd-nav .menu a{ padding:9px 12px; border-radius:9px; }
.sd-nav .menu a:hover{ background:#1C212D; }
.sd-nav .menu hr{ border:0; border-top:1px solid #232836; margin:6px 4px; }
.sd-nav .menu small{ display:block; padding:4px 12px 6px; color:#6F788D; font-size:12px; }
@media (max-width:640px){ .sd-nav .home b{ display:none; } .sd-nav{ gap:2px; padding:0 10px; } .sd-nav .sd-part{ padding:8px 10px; } }
`
const here = location.pathname
const style = document.createElement("style")
style.textContent = CSS
document.head.appendChild(style)
const nav = document.createElement("nav")
nav.className = "sd-nav"
nav.setAttribute("aria-label", "Sett Designer")
nav.innerHTML =
  '<a class="home" href="./" title="Sett Designer: start"><svg viewBox="0 0 130 66.338" role="img" aria-label="Sett"></svg><b>Designer</b></a>' +
  PARTS.map((p) => '<a class="sd-part' + (p.match.test(here) ? " on" : "") + '" href="' + p.href + '"' + (p.match.test(here) ? ' aria-current="page"' : "") + ">" + p.label + "</a>").join("") +
  '<span class="sp"></span>' +
  '<details><summary>Werkplaats</summary><div class="menu"><small>Voor wie aan de site bouwt</small>' +
  TOOLS.map((t) => '<a href="' + t.href + '">' + t.label + "</a>").join("") +
  '<hr><a href="https://www.sett.nl" target="_blank" rel="noopener">sett.nl ↗</a></div></details>'
document.body.prepend(nav)
// close the menu on a click elsewhere
addEventListener("click", (e) => {
  const d = nav.querySelector("details")
  if (d.open && !d.contains(e.target)) d.open = false
})
// the Sett logo, from the menu component of the site (one path)
fetch("/framer/SettNav.tsx")
  .then((r) => r.text())
  .then((t) => {
    const d = (t.match(/LOGO_D = "([^"]+)"/) || [])[1]
    if (d) nav.querySelector(".home svg").innerHTML = '<path d="' + d + '"/>'
  })
  .catch(() => {})
