// Sett fonts: Outfit and Geist Mono for every Sett component, without the jump from a
// fallback font to the real one. Both are variable fonts (one file per character set
// covers every weight); the Latin files are preloaded, and the faces use
// font-display: block, so text appears once in its own font instead of swapping.
// Rendered once per section; the browser fetches each file only once.

import * as React from "react"

const OUTFIT = "https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2"
const OUTFIT_EXT = "https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqUYLkn8BJ.woff2"
const MONO = "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2"
const MONO_EXT = "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrkdmhHkjkotbA.woff2"
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
const LATIN_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF"

const face = (family: string, url: string, range: string) =>
    `@font-face{font-family:"${family}";font-style:normal;font-weight:100 900;font-display:block;src:url(${url}) format("woff2");unicode-range:${range};}`
// own family names ("Sett Outfit", "Sett Mono"): Framer declares its own Outfit and Geist Mono
// (other files, font-display: swap) for the site's text, and two faces under one name made
// the text swap twice while loading. The components ask for these names first
const CSS = face("Sett Outfit", OUTFIT_EXT, LATIN_EXT) + face("Sett Outfit", OUTFIT, LATIN) + face("Sett Mono", MONO_EXT, LATIN_EXT) + face("Sett Mono", MONO, LATIN)

export function SettFonts() {
    return (
        <>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="preload" as="font" type="font/woff2" href={OUTFIT} crossOrigin="" />
            <link rel="preload" as="font" type="font/woff2" href={MONO} crossOrigin="" />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
        </>
    )
}
