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
//   - two compositions of the same data: 'dk' for desktop/tablet and 'ph' for phones (jqA; see makePh below);
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

// ---- two compositions ---------------------------------------------------------------------------------
// 'dk' (desktop/tablet, > 640px): Natural Earth, Pacific-centred so Seoul sits left, Americas centre, Iberia/Africa right.
//   Frame (r8): 84°E (west edge) … 76°E (east edge), 63°N … 47°S, viewBox 1600 wide.
// 'ph' (phone, <= 640px, jqA): its own crop, Seoul upper-left and the Americas filling the right two-thirds. To make that
//   fit a phone at a legible size the empty middle of the Pacific is folded out (an interrupted projection, as in Goode's
//   maps): the band from 155°E to 128°W (just off Vancouver Island) is removed and Asia/Oceania are moved east next to the
//   Americas with an 8° gap. Nothing is invented or moved within a lobe; Alaska, Hawaii and New Zealand fall in the cut,
//   and the frame (55°N … 47°S) keeps the cut away from Canada's coast.
//   Only the places inside this frame get a route (the Americas, Timor-Leste, Australia).
const wrap = v => ((v + 540) % 360) - 180
function makeDk() {
  const W = 1600
  const proj = geoNaturalEarth1().rotate([100, 0])
  const frame = { type: 'MultiPoint', coordinates: [[84.5, 0], [75.5, 0], [-100, 63], [-100, -47]] }
  proj.fitWidth(W, frame)
  const pts = frame.coordinates.map(c => proj(c))
  const x0 = Math.min(...pts.map(p => p[0])), y1 = Math.max(...pts.map(p => p[1])), y0 = Math.min(...pts.map(p => p[1]))
  proj.translate([proj.translate()[0] - x0, proj.translate()[1] - y0])
  return { key: 'dk', W, H: Math.round(y1 - y0), fwd: ll => proj(ll), inv: xy => proj.invert(xy), S: 7.4, pfx: 'lm' }
}
function makePh() {
  const W = 800, A = -105, B = -28, G = 8, SH = B - G - A // rotated longitudes (lon + 100)
  const ne = geoNaturalEarth1()
  const fwdL = ([lon, lat]) => { let l = wrap(lon + 100); if (l <= A) l += SH; else if (l < B) return null; return [l, lat] }
  // frame in folded longitudes: west edge 9° west of Seoul, east edge just past Rio; 55°N … 47°S
  const frame = { type: 'MultiPoint', coordinates: [[-74, 37], [-74, 0], [62, 0], [62, -23], [-20, 55], [-20, -47], [-60, -47], [-60, 55]] }
  ne.fitWidth(W, frame)
  const pts = frame.coordinates.map(c => ne(c))
  const x0 = Math.min(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]))
  ne.translate([ne.translate()[0] - x0, ne.translate()[1] - y0])
  const fwd = ll => { const f = fwdL(ll); return f && ne(f) }
  const inv = xy => {
    const r = ne.invert(xy); if (!r || !isFinite(r[0])) return null
    let l = r[0]; if (l > B - G && l < B) return null; if (l <= B - G) l -= SH
    return [wrap(l - 100), r[1]]
  }
  return { key: 'ph', W, H: Math.round(y1 - y0), fwd, inv, S: 7, pfx: 'lmp', seamX: [ne([B - G, 0])[0], ne([B, 0])[0]] }
}

// labels: [iso, dx, dy, anchor, tier]  tier 1 = always shown (quietly), 2 = desktop only, 3 = phone: shown only while lit.
// Offsets are in map units of that composition.
const LABELS = {
  dk: [
    [484, -14, 2, 'end', 1], [170, 14, -2, 'start', 2], [604, -14, 6, 'end', 1], [152, -22, 18, 'end', 2],
    [32, 12, -26, 'end', 1], [76, 54, -24, 'start', 1], [840, 14, -12, 'start', 1], [124, 10, -60, 'start', 2],
    [724, 14, 14, 'start', 2], [620, -14, 4, 'end', 2], [826, 14, -8, 'start', 2], [24, 14, 4, 'start', 2],
    [508, 14, 6, 'start', 2], [36, -70, -95, 'middle', 2], [192, 6, -12, 'start', 2], [862, 12, -12, 'start', 2]],
  ph: [
    [484, -12, 4, 'end', 1], [76, -18, -40, 'end', 1], [604, -12, 8, 'end', 1], [32, -14, 4, 'end', 1],
    [840, -14, 6, 'end', 1], [124, 0, -18, 'middle', 3], [170, 12, -14, 'start', 3], [68, 12, 22, 'start', 3],
    [192, 4, -16, 'middle', 3], [862, -10, -14, 'end', 3], [858, -14, 28, 'end', 3], [218, -12, 6, 'end', 3]]
}
// resting pulse (r8): one route at a time, Seoul -> capital -> Seoul. --k is the slot; css/site.css .lm-pk turns it into a
// delay of (end of opening + k * slot length). The CSS keyframes assume 12 slots in both lists.
const PULSE = {
  dk: [32, 76, 840, 484, 620, 826, 724, 24, 124, 170, 508, 36],
  ph: [32, 76, 840, 484, 68, 124, 170, 604, 192, 862, 858, 218]
}
const SEOUL = [126.98, 37.57]
const lang = {}; for (const k in PLACES) for (const p of PLACES[k]) lang[p[0]] = k
const bb = countries.map(f => ({ f, id: +f.id, b: geoBounds(f) }))
const r1 = v => +(Math.round(v * 10) / 10).toFixed(1)
const P2 = (M, c) => { const v = M.fwd(c); return v && v.map(n => +n.toFixed(1)) }

function build(M) {
  const { W, H, S } = M
  // ---- halftone grid (hex grid of dots in projected space, one per cell centre that falls on land) ----
  const RY = S * Math.sqrt(3) / 2
  const base = { far: [], asia: [], near: [] }, lit = {}
  for (let r = 0, y = RY / 2; y < H; r++, y += RY) {
    for (let x = (r % 2 ? S / 2 : 0) + S / 4; x < W; x += S) {
      const ll = M.inv([x, y]); if (!ll || !isFinite(ll[0])) continue
      const back = M.fwd(ll); if (!back || Math.hypot(back[0] - x, back[1] - y) > 0.5) continue
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
      // jqA: the land around Seoul is lit a little more (Seoul is the subject of the H1); Asia/Oceania one step up.
      const gd = geoDistance(ll, SEOUL) * 180 / Math.PI
      base[gd < 22 ? 'near' : (ll[0] >= 60 || ll[0] <= -170) ? 'asia' : 'far'].push(xy)
      if (k) (lit[hit.id] ||= []).push(xy)
    }
  }
  // ---- routes ----
  const sxy = P2(M, SEOUL)
  const items = []
  for (const k in PLACES) for (const [id, name, lon, lat] of PLACES[k]) {
    const xy = P2(M, [lon, lat])
    if (!xy || xy[0] < 0 || xy[0] > W || xy[1] < 0 || xy[1] > H) continue
    items.push({ id, k, name, lon, lat, xy, gd: geoDistance([lon, lat], SEOUL) })
  }
  // three tides, English → Spanish → Portuguese (same order as the hero legend; Korean = Seoul lights last); inside each
  // tide the farthest place flies first. css/site.css .hero-legend delays follow TIDE.at (desktop) — change both together.
  const TIDE = { en: { at: 800, step: 120 }, es: { at: 1700, step: 82 }, pt: { at: 3500, step: 105 } }
  if (M.key === 'ph') { TIDE.en.step = 200; TIDE.es.at = 2000; TIDE.es.step = 92; TIDE.pt.at = 3900; TIDE.pt.step = 160 }
  const ORDER = { en: 0, es: 1, pt: 2 }
  items.sort((a, b) => ORDER[a.k] - ORDER[b.k] || b.gd - a.gd)
  const seen = { es: 0, pt: 0, en: 0 }
  const hash = n => { let h = n * 2654435761 % 4294967296; return (h / 4294967296) }
  const span = M.key === 'ph' ? 0.5 : 1 // the phone map is half the width in units
  items.forEach(it => {
    const [x, y] = it.xy, [sx, sy] = sxy, dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy)
    // perpendicular, oriented upward (north) for routes arriving from the east; southern origins arc less
    let nx = -dy / d, ny = dx / d; if (ny > 0) { nx = -nx; ny = -ny }
    // bow: southern origins dip south of the chord, northern ones rise over it — the fan opens instead of bundling
    const t = Math.min(1, Math.max(0, (it.lat + 36) / 92))
    let f = -0.11 + 0.43 * t + (hash(it.id) - 0.5) * 0.06
    if (M.key === 'ph') f = 0.02 + 0.3 * t + (hash(it.id) - 0.5) * 0.06
    if (x < sx + 40 * span) f = 0.12 // Australia, New Zealand, Timor-Leste: short gentle arcs
    let cx = (x + sx) / 2 + nx * d * f, cy = (y + sy) / 2 + ny * d * f
    cy = Math.max(cy, -40 * span)
    it.d = `M${x} ${y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${sx} ${sy}`
    it.delay = TIDE[it.k].at + seen[it.k]++ * TIDE[it.k].step
    it.dur = Math.round(950 + Math.min(1, d / (1300 * span)) * 650)
  })
  const endMs = Math.max(...items.map(it => it.delay + it.dur))
  PULSE[M.key].forEach((id, k) => { const it = items.find(x => x.id === id); if (it) it.k8 = k; else throw new Error(`pulse ${id} not in ${M.key} frame`) })
  return { ...M, base, lit, sxy, items, endMs }
}

const LIVED = { sp: [-46.63, -23.55], ba: [-58.38, -34.60] }
const I18N = {
  en: { seoul: 'SEOUL', sp: ['São Paulo', 'lived here'], ba: ['Buenos Aires', 'lived here'] },
  es: { seoul: 'SEÚL', sp: ['São Paulo', 'viví aquí'], ba: ['Buenos Aires', 'viví aquí'] },
  pt: { seoul: 'SEUL', sp: ['São Paulo', 'morei aqui'], ba: ['Buenos Aires', 'morei aqui'] }
}
// zero-length segments with round caps = dots; relative moves keep it small
const dots = arr => { let s = '', px = 0, py = 0; for (const [x, y] of arr) { s += (s ? 'm' + r1(x - px) + ' ' + r1(y - py) : 'M' + x + ' ' + y) + 'h0'; px = x; py = y } return s }

// ---- SVG ------------------------------------------------------------------------------------------------
function svg(L, G) {
  const t = I18N[L], ph = G.key === 'ph', id = s => `${G.pfx}-${s}`
  const { W, H, sxy, items } = G
  const byId = Object.fromEntries(items.map(it => [it.id, it]))
  const o = []
  o.push(`<svg class="lm-svg lm-svg--${G.key}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style="--lm-end:${G.endMs}ms;--lm-n:12">`)
  o.push(`<defs><radialGradient id="${id('glow')}" class="lm-glowg"><stop offset="0" stop-color="#f3e2b0" stop-opacity=".5"/><stop offset="1" stop-color="#f3e2b0" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id('aura')}" class="lm-aurag"><stop offset="0" stop-opacity=".18"/><stop offset=".45" stop-opacity=".07"/><stop offset="1" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id('fadeg')}" cx="${sxy[0]}" cy="${sxy[1]}" r="${ph ? 70 : 150}" gradientUnits="userSpaceOnUse"><stop offset=".08" stop-color="#000"/><stop offset=".6" stop-color="#fff"/></radialGradient>` +
    `<mask id="${id('fade')}" maskUnits="userSpaceOnUse" x="-50" y="-80" width="${W + 100}" height="${H + 160}"><rect x="-50" y="-80" width="${W + 100}" height="${H + 160}" fill="url(#${id('fadeg')})"/></mask></defs>`)
  // Seoul's permanent soft aura sits under the land (about 120px across at 1280 and at 390)
  o.push(`<circle class="lm-aura" cx="${sxy[0]}" cy="${sxy[1]}" r="${ph ? 58 : 76}" fill="url(#${id('aura')})"/>`)
  o.push(`<path class="lm-land" d="${dots(G.base.far)}"/><path class="lm-land lm-asia" d="${dots(G.base.asia)}"/><path class="lm-land lm-near" d="${dots(G.base.near)}"/>`)
  o.push(`<g class="lm-lit">`)
  for (const it of items) {
    const arr = G.lit[it.id] || []
    o.push(`<path class="lm-c lm-${it.k}" style="--d:${it.delay - 260}ms" d="${dots(arr)}"/>`)
  }
  o.push(`</g><g class="lm-routes" mask="url(#${id('fade')})">`)
  const pk = it => it.k8 === undefined ? '' : ` lm-pk" data-k="${it.k8}`, pv = it => it.k8 === undefined ? '' : `;--k:${it.k8}`
  for (const it of items) o.push(`<path class="lm-r lm-${it.k}${pk(it)}" pathLength="1" style="--d:${it.delay}ms;--t:${it.dur}ms${pv(it)}" d="${it.d}"/>`)
  o.push(`</g><g class="lm-heads">`)
  for (const it of items) o.push(`<path class="lm-h${pk(it)}" pathLength="1" style="--d:${it.delay}ms;--t:${it.dur}ms${pv(it)}" d="${it.d}"/>`)
  o.push(`</g><g class="lm-caps">`)
  for (const it of items) o.push(`<circle class="lm-cap lm-${it.k}${pk(it)}" style="--d:${it.delay - 260}ms${pv(it)}" cx="${it.xy[0]}" cy="${it.xy[1]}" r="${ph ? 2.2 : 2.6}"/>`)
  o.push(`</g><g class="lm-labels">`)
  // jqA: labels are quiet; the label of the place the current pulse is visiting lights up for its slot (same --k)
  for (const [cid, dx, dy, anchor, tier] of LABELS[G.key]) {
    const it = byId[cid]; if (!it) continue
    o.push(`<text class="lm-l lm-t${tier}${pk(it)}" data-c="${cid}" style="--d:${it.delay + 200}ms${pv(it)}" x="${r1(it.xy[0] + dx)}" y="${r1(it.xy[1] + dy)}" text-anchor="${anchor}">${it.name}</text>`)
  }
  o.push(`</g><g class="lm-lived">`)
  const [spx, spy] = P2(G, LIVED.sp)
  for (const key of ['sp', 'ba']) {
    const [x, y] = P2(G, LIVED[key]), [city, note] = t[key]
    if (ph) {
      // phone: the ring only. The city names would sit on top of the Brasil / Argentina labels at this size; the scroll
      // sequence below says "Five years in Argentina. Three in Brazil." in full.
      o.push(`<g class="lm-pin"><circle class="lm-ring" cx="${x}" cy="${y}" r="4"/></g>`)
      continue
    }
    const colX = r1(spx + 46), ty = key === 'sp' ? y : Math.max(y, spy + 30)
    o.push(`<g class="lm-pin"><circle class="lm-ring" cx="${x}" cy="${y}" r="6.5"/><path class="lm-lead" d="M${r1(x + 7)} ${y}L${r1(colX - 22)} ${y}L${r1(colX - 8)} ${r1(ty)}"/>` +
      `<text class="lm-n" x="${colX}" y="${r1(ty + 4.5)}"><tspan class="lm-n1">${city}</tspan><tspan class="lm-n2" dx="8">${note}</tspan></text></g>`)
  }
  const sl = ph ? `<text class="lm-sl" x="12" y="-12" text-anchor="start">${t.seoul}</text>` : `<text class="lm-sl" x="-18" y="-20" text-anchor="end">${t.seoul}</text>`
  o.push(`</g><g class="lm-seoul" transform="translate(${sxy[0]} ${sxy[1]})"><circle class="lm-halo" r="${ph ? 26 : 46}" fill="url(#${id('glow')})"/><circle class="lm-sring" r="${ph ? 7 : 11}"/><circle class="lm-sdot" r="${ph ? 3.4 : 4.6}"/>${sl}</g>`)
  o.push(`</svg>`)
  return o.join('\n')
}

const DK = build(makeDk()), PH = build(makePh())
// jqA: the map scales with the window (and shrinks on short windows), so text sized in map units ends up anywhere from
// 9px to 20px. This writes --s (screen px per map unit, as drawn with preserveAspectRatio meet) on each SVG; css/site.css
// sizes the labels as calc(13px / var(--s)) so they stay 13-15px at every size. 'lm-small' marks a map drawn under 900px
// wide (tablets, short laptops), where the desktop-only labels only show while their route pulses.
const SIZER = `<script>(function(){var f=document.querySelector('.lm-frame');if(!f)return;var u=function(){var a=f.querySelectorAll('.lm-svg');for(var i=0;i<a.length;i++){var g=a[i],r=g.getBoundingClientRect(),v=g.viewBox.baseVal;if(!r.width)continue;var k=Math.min(r.width/v.width,r.height/v.height);g.style.setProperty('--s',k.toFixed(4));g.classList.toggle('lm-small',k*v.width<900)}};u();if(window.ResizeObserver)new ResizeObserver(u).observe(f);else addEventListener('resize',u)})()</script>`
const counts = Object.fromEntries(Object.entries(PLACES).map(([k, v]) => [k, v.length]))
for (const [L, file] of [['en', 'index.html'], ['es', 'es/index.html'], ['pt', 'pt/index.html']]) {
  const fp = path.join(ROOT, file); let html = fs.readFileSync(fp, 'utf8')
  const a = html.indexOf('<!-- langmap:start -->'), b = html.indexOf('<!-- langmap:end -->')
  const out = svg(L, DK) + '\n' + svg(L, PH) + '\n' + SIZER
  if (a < 0 || b < 0) { console.log(`${file}: no langmap markers, skipped`); continue }
  html = html.slice(0, a) + '<!-- langmap:start -->\n' + out + '\n' + html.slice(b)
  fs.writeFileSync(fp, html)
  console.log(`${file}: ${(out.length / 1024).toFixed(1)} KB svg (desktop + phone)`)
}
for (const G of [DK, PH]) console.log(G.key, `viewBox ${G.W}x${G.H}, dots ${G.base.far.length}+${G.base.asia.length}+${G.base.near.length}, lit ${Object.values(G.lit).reduce((a, v) => a + v.length, 0)}, routes ${G.items.length}`, `last landing ${G.endMs}ms`, 'seoul', G.sxy, G.seamX || '')
console.log('places', counts)
if (process.env.PREVIEW) fs.writeFileSync(process.env.PREVIEW, svg('en', process.env.PH ? PH : DK))
