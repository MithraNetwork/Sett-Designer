// The V2 preview: v2-content.js's sections as React elements, with the asset
// markers pointed at the local files.
import React from "https://esm.sh/react@18.3.1"
import { V2, PHOTOS } from "./v2-content.js"
import SettV2Hero from "./lib/SettV2Hero.js"
import SettV2Statement from "./lib/SettV2Statement.js"
import SettV2DayCycle from "./lib/SettV2DayCycle.js"
import SettV2Stack from "./lib/SettV2Stack.js"
import SettV2Xray from "./lib/SettV2Xray.js"
import SettV2Descent from "./lib/SettV2Descent.js"
import SettV2Compare from "./lib/SettV2Compare.js"
import SettV2Film from "./lib/SettV2Film.js"
import SettV2Photos from "./lib/SettV2Photos.js"
import SettV2Form from "./lib/SettV2Form.js"
import SettV2Contact from "./lib/SettV2Contact.js"
import SettV2FAQ from "./lib/SettV2FAQ.js"
import SettV2Team from "./lib/SettV2Team.js"
import SettV2Numbers from "./lib/SettV2Numbers.js"
import SettV2Switch from "./lib/SettV2Switch.js"
import SettV2Timeline from "./lib/SettV2Timeline.js"
import SettV2Marquee from "./lib/SettV2Marquee.js"
import SettV2Story from "./lib/SettV2Story.js"
import SettV2Steps from "./lib/SettV2Steps.js"
import SettV2Case from "./lib/SettV2Case.js"
import SettV2CTA from "./lib/SettV2CTA.js"
import SettV2Quote from "./lib/SettV2Quote.js"
import SettV2Partners from "./lib/SettV2Partners.js"
import SettV2Scheduler from "./lib/SettV2Scheduler.js"
import SettV2Confirm from "./lib/SettV2Confirm.js"
import SettV2Roadmap from "./lib/SettV2Roadmap.js"
import SettV2Blog from "./lib/SettV2Blog.js"
import SettV2Article from "./lib/SettV2Article.js"
import SettV2Legal from "./lib/SettV2Legal.js"

const C = { SettV2Hero, SettV2Statement, SettV2DayCycle, SettV2Stack, SettV2Xray, SettV2Descent, SettV2Compare, SettV2Film, SettV2Photos, SettV2Form, SettV2Contact, SettV2FAQ, SettV2Team, SettV2Numbers, SettV2Switch, SettV2Timeline, SettV2Marquee, SettV2Story, SettV2Steps, SettV2Case, SettV2CTA, SettV2Quote, SettV2Partners, SettV2Scheduler, SettV2Confirm, SettV2Roadmap, SettV2Blog, SettV2Article, SettV2Legal }
const local = (v) => {
  if (typeof v === "string" && v.startsWith("@file:")) return "/framer/" + v.slice(6) + ".glb"
  if (typeof v === "string" && v.startsWith("@image:")) return { src: "/framer/assets/" + v.slice(7) + ".png" }
  if (typeof v === "string" && v.startsWith("@photo:")) return { src: "/framer/assets/photo/" + v.slice(7) + ".jpg", alt: PHOTOS[v.slice(7)] || "" }
  if (typeof v === "string" && v.startsWith("@video:")) return "/framer/assets/photo/" + v.slice(7) + ".mp4"
  if (typeof v === "string" && v.startsWith("@pdf:")) return "/framer/assets/legal/" + v.slice(5) + ".pdf"
  if (typeof v === "string" && v.startsWith("@url:")) { const [alt, url] = v.slice(5).split("|"); return { src: url + "?scale-down-to=512", alt } }
  if (Array.isArray(v)) return v.map(local)
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, local(x)]))
  return v
}
// props as Framer hands them over: a property that isn't set gets its control's
// defaultValue, and a text or link without one arrives as "" (not undefined). The
// preview does the same, so a section that relies on a fallback shows up here too
const EMPTY = { String: "", Link: "" }
function framerProps(Component, props) {
  const out = { ...props }
  for (const [k, c] of Object.entries(Component.__controls || {})) {
    if (out[k] !== undefined) continue
    if ("defaultValue" in c) out[k] = c.defaultValue
    else if (c.type in EMPTY) out[k] = EMPTY[c.type]
  }
  return out
}
export const PAGES = Object.fromEntries(Object.entries(V2).map(([page, sections]) => [page, () => sections.map(([name, props]) => React.createElement(C[name], framerProps(C[name], local(props))))]))
