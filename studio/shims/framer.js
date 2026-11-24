// outside Framer: the property controls are kept on the component, so the preview can
// hand props over the way Framer does (see framerProps in v2-pages.js)
export function addPropertyControls(component, controls) {
    component.__controls = controls
}
export const ControlType = new Proxy({}, { get: (t, k) => String(k) })
export const RenderTarget = { canvas: "CANVAS", preview: "PREVIEW", export: "EXPORT", thumbnail: "THUMBNAIL", current: () => "PREVIEW" }
