// gen-langmap.mjs — builds the home-page "language map" (EN/ES/PT) as inline SVG, at build time.
//
//   cd tools && npm install && node gen-langmap.mjs [path/to/countries-50m.json]
//
// Source geometry: world-atlas@2 countries-50m (Natural Earth, public domain). If no path is given the
// file is downloaded once into tools/.cache/. Output is injected into index.html, es/index.html and
// pt/index.html between <!-- langmap:start --> and <!-- langmap:end -->. Nothing is fetched at runtime.
//
// What is drawn
//   - land as a halftone: a hex grid of dots in projected space, one dot per cell centre that falls on land;
//   - the 34 countries where Spanish (20) or Portuguese (8) is a principal official language, plus the six largest
//     countries where English is most people's first language — their dots are lit. Only sovereign states are counted
//     (Puerto Rico, a US territory, was dropped in r8 so that "thirty-four countries" is literally true);
//   - one route per country between its capital and Seoul. Opening: the routes draw in three tides and converge on
//     Seoul, then fade to near-invisible. Resting state: one route at a time pulses out from Seoul and back
//     (a message and its answer), cycling ES/PT/EN (CSS animation, see css/site.css .lm-*).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
import { geoNaturalEarth1, geoContains, geoBounds, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let src = process.argv[2]
if (!src) {
  src = path.join(ROOT, 'tools/.cache/countries-50m.json')
  if (!fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(src), { recursive: true })
    const r = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
    fs.writeFileSync(src, Buffer.from(await r.arrayBuffer()))
  }
}
const topo = JSON.parse(fs.readFileSync(src, 'utf8'))
const countries = feature(topo, topo.objects.countries).features.filter(f => f.id !== '010') // no Antarctica

// ---- places: [iso numeric, native name, capital lon, lat] ------------------------------------------------
const PLACES = {
  es: [[724, 'España', -3.70, 40.42], [484, 'México', -99.13, 19.43], [320, 'Guatemala', -90.51, 14.64],
    [340, 'Honduras', -87.21, 14.07], [222, 'El Salvador', -89.19, 13.69], [558, 'Nicaragua', -86.25, 12.13],
    [188, 'Costa Rica', -84.09, 9.93], [591, 'Panamá', -79.52, 8.98], [192, 'Cuba', -82.37, 23.11],
    [214, 'República Dominicana', -69.93, 18.49], [170, 'Colombia', -74.07, 4.71],
    [862, 'Venezuela', -66.90, 10.49], [218, 'Ecuador', -78.47, -0.18], [604, 'Perú', -77.04, -12.05],
    [68, 'Bolivia', -68.15, -16.50], [152, 'Chile', -70.67, -33.45], [32, 'Argentina', -58.38, -34.60],
    [600, 'Paraguay', -57.58, -25.26], [858, 'Uruguay', -56.16, -34.90], [226, 'Guinea Ecuatorial', 8.78, 3.75]],
  pt: [[76, 'Brasil', -47.88, -15.79], [620, 'Portugal', -9.14, 38.72], [24, 'Angola', 13.23, -8.84],
    [508, 'Moçambique', 32.59, -25.97], [132, 'Cabo Verde', -23.51, 14.93], [624, 'Guiné-Bissau', -15.60, 11.86],
    [678, 'São Tomé e Príncipe', 6.73, 0.34], [626, 'Timor-Leste', 125.57, -8.56]],
  en: [[840, 'United States', -77.04, 38.91], [124, 'Canada', -75.70, 45.42], [826, 'United Kingdom', -0.13, 51.51],
    [372, 'Ireland', -6.26, 53.35], [36, 'Australia', 149.13, -35.28], [554, 'New Zealand', 174.78, -41.29]]
}
// labels: [iso, dx, dy, anchor, tier]  tier 1 = shown at every width, 2 = desktop only (offsets in map units)
const LABELS = [
  [484, -14, 2, 'end', 1], [170, 14, -2, 'start', 2], [604, -14, 6, 'end', 1], [152, -14, -2, 'end', 2],
  [32, 12, -16, 'start', 1], [76, 54, -24, 'start', 1], [840, 14, -12, 'start', 1], [124, 10, -60, 'start', 2],
  [724, 14, 14, 'start', 2], [620, -14, 4, 'end', 2], [826, 14, -8, 'start', 2], [24, 14, 4, 'start', 2],
  [508, 14, 6, 'start', 2], [36, -70, -95, 'middle', 2], [192, 6, -12, 'start', 2], [862, 12, -12, 'start', 2]
]
const SEOUL = [126.98, 37.57]
const LIVED = { sp: [-46.63, -23.55], ba: [-58.38, -34.60] }
const I18N = {
  en: { seoul: 'SEOUL', sp: ['São Paulo', 'lived 3 yrs'], ba: ['Buenos Aires', 'lived 5 yrs'] },
  es: { seoul: 'SEÚL', sp: ['São Paulo', 'viví 3 años'], ba: ['Buenos Aires', 'viví 5 años'] },
  pt: { seoul: 'SEUL', sp: ['São Paulo', 'morei 3 anos'], ba: ['Buenos Aires', 'morei 5 anos'] }
}

// ---- projection: Natural Earth, Pacific-centred so Seoul sits left, Americas centre, Iberia/Africa right ----
const W = 1600
const proj = geoNaturalEarth1().rotate([100, 0])
// frame (r8): 84°E (west edge) … 76°E (east edge), 63°N … 47°S. Wider and flatter than r6/r7 (98°E…58°E, 74°N…57°S) so the
// map can run the full width of a 1280-1440 laptop at the height the type leaves; the Arctic and the tip of Patagonia are cut (the frame fades out there anyway).
const frame = { type: 'MultiPoint', coordinates: [[84.5, 0], [75.5, 0], [-100, 63], [-100, -47]] }
proj.fitWidth(W, frame)
const pts = frame.coordinates.map(c => proj(c))
const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]))
const y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]))
proj.translate([proj.translate()[0] - x0, proj.translate()[1] - y0])
const H = Math.round(y1 - y0)
const P = c => proj(c).map(v => +v.toFixed(1))

// ---- halftone grid ------------------------------------------------------------------------------------
const lang = {}; for (const k in PLACES) for (const p of PLACES[k]) lang[p[0]] = k
const bb = countries.map(f => ({ f, id: +f.id, b: geoBounds(f) }))
const S = 7.4, RY = S * Math.sqrt(3) / 2
const base = [], lit = {}
for (let r = 0, y = RY / 2; y < H; r++, y += RY) {
  for (let x = (r % 2 ? S / 2 : 0) + S / 4; x < W; x += S) {
    const ll = proj.invert([x, y]); if (!ll || !isFinite(ll[0])) continue
    // reject points that fall outside the globe outline (invert of off-globe pixels)
    const back = proj(ll); if (Math.hypot(back[0] - x, back[1] - y) > 0.5) continue
    let hit = null
    for (const c of bb) {
      const [[a, b], [cc, d]] = c.b
      if (ll[1] < b || ll[1] > d) continue
      if (a <= cc ? (ll[0] < a || ll[0] > cc) : (ll[0] < a && ll[0] > cc)) continue
      if (geoContains(c.f, ll)) { hit = c; break }
    }
    if (!hit) continue
    const k = lang[hit.id]
    const xy = [+x.toFixed(1), +y.toFixed(1)]
    base.push(xy)
    if (k) (lit[hit.id] ||= []).push(xy)
  }
}
// zero-length segments with round caps = dots; relative moves keep it small
const dots = arr => { let s = '', px = 0, py = 0; for (const [x, y] of arr) { s += (s ? 'm' + r1(x - px) + ' ' + r1(y - py) : 'M' + x + ' ' + y) + 'h0'; px = x; py = y } return s }
const r1 = v => +(Math.round(v * 10) / 10).toFixed(1)

// ---- routes -----------------------------------------------------------------------------------------
const sxy = P(SEOUL)
const items = []
for (const k in PLACES) for (const [id, name, lon, lat] of PLACES[k]) {
  const xy = P([lon, lat]); items.push({ id, k, name, lon, lat, xy, gd: geoDistance([lon, lat], SEOUL) })
}
// three tides, Spanish → Portuguese → English; inside each tide the farthest place flies first
const TIDE = { es: { at: 800, step: 82 }, pt: { at: 2750, step: 105 }, en: { at: 3700, step: 120 } }
const ORDER = { es: 0, pt: 1, en: 2 }
items.sort((a, b) => ORDER[a.k] - ORDER[b.k] || b.gd - a.gd)
const seen = { es: 0, pt: 0, en: 0 }
const hash = n => { let h = n * 2654435761 % 4294967296; return (h / 4294967296) }
items.forEach((it, i) => {
  const [x, y] = it.xy, [sx, sy] = sxy, dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy)
  // perpendicular, oriented upward (north) for routes arriving from the east; southern origins arc less
  let nx = -dy / d, ny = dx / d; if (ny > 0) { nx = -nx; ny = -ny }
  // bow: southern origins dip south of the chord, northern ones rise over it — the fan opens instead of bundling
  const t = Math.min(1, Math.max(0, (it.lat + 36) / 92))
  let f = -0.11 + 0.43 * t + (hash(it.id) - 0.5) * 0.06
  if (x < sx + 40) f = 0.12 // Australia, New Zealand, Timor-Leste: short gentle arcs
  let cx = (x + sx) / 2 + nx * d * f, cy = (y + sy) / 2 + ny * d * f
  cy = Math.max(cy, -40)
  it.d = `M${x} ${y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${sx} ${sy}`
  // timing (ms): per-tide stagger, duration grows with length
  it.delay = TIDE[it.k].at + seen[it.k]++ * TIDE[it.k].step
  it.dur = Math.round(950 + Math.min(1, d / 1300) * 650)
})
const endMs = Math.max(...items.map(it => it.delay + it.dur))
// resting pulse (r8): one route at a time, Seoul -> capital -> Seoul, cycling Spanish / Portuguese / English.
// --k is the slot; css/site.css .lm-pk turns it into a delay of (end of opening + k * slot length).
const PULSE = [32, 76, 840, 484, 620, 826, 724, 24, 124, 170, 508, 36]
PULSE.forEach((id, k) => { const it = items.find(x => x.id === id); if (it) it.k8 = k })

// ---- SVG ------------------------------------------------------------------------------------------------
function svg(L) {
  const t = I18N[L]
  const byId = Object.fromEntries(items.map(it => [it.id, it]))
  const o = []
  o.push(`<svg class="lm-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style="--lm-end:${endMs}ms;--lm-n:${PULSE.length}">`)
  o.push(`<defs><radialGradient id="lm-glow"><stop offset="0" stop-color="#f3e2b0" stop-opacity=".5"/><stop offset="1" stop-color="#f3e2b0" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="lm-fadeg" cx="${sxy[0]}" cy="${sxy[1]}" r="150" gradientUnits="userSpaceOnUse"><stop offset=".08" stop-color="#000"/><stop offset=".6" stop-color="#fff"/></radialGradient>` +
    `<mask id="lm-fade" maskUnits="userSpaceOnUse" x="-50" y="-80" width="${W + 100}" height="${H + 160}"><rect x="-50" y="-80" width="${W + 100}" height="${H + 160}" fill="url(#lm-fadeg)"/></mask></defs>`)
  o.push(`<path class="lm-land" d="${dots(base)}"/>`)
  o.push(`<g class="lm-lit">`)
  for (const it of items) {
    const arr = lit[it.id] || []
    // every place keeps at least its capital as a lit dot (small islands have no grid cell)
    o.push(`<path class="lm-c lm-${it.k}" style="--d:${it.delay - 260}ms" d="${dots(arr.length ? arr : [])}${arr.length ? '' : ''}"/>`)
  }
  o.push(`</g><g class="lm-routes" mask="url(#lm-fade)">`)
  const pk = it => it.k8 === undefined ? '' : ` lm-pk" data-k="${it.k8}`, pv = it => it.k8 === undefined ? '' : `;--k:${it.k8}`
  for (const it of items) o.push(`<path class="lm-r lm-${it.k}${pk(it)}" pathLength="1" style="--d:${it.delay}ms;--t:${it.dur}ms${pv(it)}" d="${it.d}"/>`)
  o.push(`</g><g class="lm-heads">`)
  for (const it of items) o.push(`<path class="lm-h${pk(it)}" pathLength="1" style="--d:${it.delay}ms;--t:${it.dur}ms${pv(it)}" d="${it.d}"/>`)
  o.push(`</g><g class="lm-caps">`)
  for (const it of items) o.push(`<circle class="lm-cap lm-${it.k}${pk(it)}" style="--d:${it.delay - 260}ms${pv(it)}" cx="${it.xy[0]}" cy="${it.xy[1]}" r="2.6"/>`)
  o.push(`</g><g class="lm-labels">`)
  for (const [id, dx, dy, anchor, tier] of LABELS) {
    const it = byId[id]
    o.push(`<text class="lm-l lm-t${tier}" data-c="${id}" style="--d:${it.delay + 200}ms" x="${r1(it.xy[0] + dx)}" y="${r1(it.xy[1] + dy)}" text-anchor="${anchor}">${it.name}</text>`)
  }
  o.push(`</g><g class="lm-lived">`)
  const [spx, spy] = P(LIVED.sp), colX = r1(spx + 46)
  for (const key of ['sp', 'ba']) {
    const [x, y] = P(LIVED[key]), [city, note] = t[key], ty = key === 'sp' ? y : Math.max(y, spy + 30)
    o.push(`<g class="lm-pin"><circle class="lm-ring" cx="${x}" cy="${y}" r="6.5"/><path class="lm-lead" d="M${r1(x + 7)} ${y}L${r1(colX - 22)} ${y}L${r1(colX - 8)} ${r1(ty)}"/>` +
      `<text class="lm-n" x="${colX}" y="${r1(ty + 4.5)}"><tspan class="lm-n1">${city}</tspan><tspan class="lm-n2" dx="8">${note}</tspan></text></g>`)
  }
  o.push(`</g><g class="lm-seoul" transform="translate(${sxy[0]} ${sxy[1]})"><circle class="lm-halo" r="46" fill="url(#lm-glow)"/><circle class="lm-sring" r="11"/><circle class="lm-sdot" r="4.6"/>` +
    `<text class="lm-sl" x="-18" y="-20" text-anchor="end">${t.seoul}</text></g>`)
  o.push(`</svg>`)
  return o.join('\n')
}

const counts = Object.fromEntries(Object.entries(PLACES).map(([k, v]) => [k, v.length]))
for (const [L, file] of [['en', 'index.html'], ['es', 'es/index.html'], ['pt', 'pt/index.html']]) {
  const fp = path.join(ROOT, file); let html = fs.readFileSync(fp, 'utf8')
  const a = html.indexOf('<!-- langmap:start -->'), b = html.indexOf('<!-- langmap:end -->')
  const out = svg(L)
  if (a < 0 || b < 0) { console.log(`${file}: no langmap markers, skipped`); continue }
  html = html.slice(0, a) + '<!-- langmap:start -->\n' + out + '\n' + html.slice(b)
  fs.writeFileSync(fp, html)
  console.log(`${file}: ${(out.length / 1024).toFixed(1)} KB svg`)
}
console.log(`viewBox ${W}x${H}, dots ${base.length}, lit ${Object.values(lit).reduce((a, v) => a + v.length, 0)}, places ${items.length}`, counts, `last landing ${endMs}ms`, 'seoul', sxy)
if (process.env.PREVIEW) fs.writeFileSync(process.env.PREVIEW, svg('en'))
