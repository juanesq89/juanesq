// 각 가이드 하단의 "관련 가이드" 블록을 만든다.
//
//   node tools/gen-related.mjs          블록이 없는 가이드에만 넣는다 (기본)
//   node tools/gen-related.mjs --all    전부 다시 만든다
//
// 기본값이 "없는 것만"인 이유: 영문 126편은 이미 블록이 있고 손으로 고른 흔적이 있어서
// 무턱대고 덮어쓰면 그 선택이 날아간다. 새로 추가된 가이드만 채우는 것이 안전하다.
//
// 고르는 기준은 같은 언어 + 같은 분류(가이드 breadcrumb 기준, gen-guide-hub.mjs와 같은
// CANON을 쓴다)다. 같은 분류가 모자라면 같은 언어의 다른 글로 채운다 — 언어를 섞지 않는다.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ALL = process.argv.includes('--all')
const MIN = 3, MAX = 4

const LANGS = [
  { code: 'en', dir: 'guide', base: '/guide', eyebrow: 'Related Guides' },
  { code: 'es', dir: 'guide/es', base: '/guide/es', eyebrow: 'Guías Relacionadas' },
  { code: 'pt', dir: 'guide/pt', base: '/guide/pt', eyebrow: 'Guias Relacionados' },
]

// gen-guide-hub.mjs의 CANON과 같은 표를 쓴다. 한쪽만 고치면 허브와 관련글의 분류가 어긋난다.
const CANON = {
  en: [
    ['Immigration & Visas', ['Immigration & Visas', 'Immigration', 'Immigration Law']],
    ['Criminal Defense', ['Criminal Defense', 'Criminal Defence', 'Criminal Procedure']],
    ['Labor & Employment', ['Labor & Employment', 'Employment', 'Labor Law']],
    ['Family & Inheritance', ['Family Law', 'Family', 'Inheritance & Estate']],
    ['Money, Debt & Fraud', ['Civil Claims & Debt Recovery', 'Debt & Bankruptcy', 'Financial Crime & Fraud', 'Banking & Foreign Exchange']],
    ['Business, Tax & Consumer', ['Tax Law', 'Corporate & Business', 'Intellectual Property', 'Consumer Protection', 'Consumer']],
    ['Housing & Real Estate', ['Real Estate & Leasing', 'Real Estate']],
    ['Documents & Privacy', ['Documents & Authentication', 'Documents & Procedure', 'Privacy & Data Protection']],
    ['Nationality & Military Service', ['Nationality & Military Service']],
    ['Personal Safety', ['Personal Safety']],
    ['Traffic & Accidents', ['Traffic & Accidents']],
    ['Health, Pensions & Benefits', ['Medical Malpractice & Patient Rights', 'Health Insurance & Benefits', 'Pensions & Benefits']],
  ],
  es: [
    ['Inmigración y Visados', ['Inmigración y Visados', 'Inmigración']],
    ['Defensa Penal', ['Defensa Penal']],
    ['Derecho Laboral', ['Derecho Laboral']],
    ['Derecho de Familia', ['Derecho de Familia']],
    ['Derecho Inmobiliario', ['Derecho Inmobiliario']],
    ['Derecho Corporativo', ['Derecho Corporativo', 'Corporativo']],
  ],
  pt: [
    ['Imigração e Vistos', ['Imigração e Vistos', 'Imigração']],
    ['Defesa Criminal', ['Defesa Criminal']],
    ['Direito Trabalhista', ['Direito Trabalhista']],
    ['Direito de Família', ['Direito de Família']],
    ['Direito Imobiliário', ['Direito Imobiliário']],
    ['Direito Empresarial', ['Direito Empresarial', 'Empresarial']],
  ],
}

const CSS = '.related-guides{max-width:760px;margin:70px auto 0;padding:0 32px}\n' +
  ".related-guides .rg-eyebrow{font-size:.58rem;font-weight:500;letter-spacing:.35em;text-transform:uppercase;color:var(--gold);margin-bottom:18px}\n" +
  '.related-guides ul{list-style:none;margin:0;padding:0;border-top:1px solid rgba(201,168,76,.15)}\n' +
  '.related-guides li{border-bottom:1px solid rgba(201,168,76,.15)}\n' +
  '.related-guides a{display:block;padding:15px 0;font-size:.93rem;font-weight:300;line-height:1.55;color:rgba(245,240,232,.75);text-decoration:none;transition:color .3s}\n' +
  '.related-guides a:hover{color:var(--gold-light)}\n' +
  '.related-guides .rg-cat{display:block;font-size:.56rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:rgba(201,168,76,.5);margin-bottom:5px}\n' +
  '@media(max-width:760px){.related-guides{padding:0 22px}}\n'
const CSS_ANCHOR = '.article-cta{max-width:760px;margin:72px auto 0;padding:0 32px}'

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
const pick = (t, re) => { const m = t.match(re); return m ? m[1].trim() : null }
const canonicalise = (lang, raw) => (CANON[lang].find(([, a]) => a.includes(raw)) ?? [null])[0]

let touched = 0, skipped = 0
const warn = []

for (const L of LANGS) {
  const files = readdirSync(join(ROOT, L.dir)).filter((f) => f.endsWith('.html') && f !== 'index.html').sort()
  const all = files.map((f) => {
    const src = readFileSync(join(ROOT, L.dir, f), 'utf8')
    const bc = pick(src, /<p class="breadcrumb">([\s\S]*?)<\/p>/)
    const rawCat = bc ? decode(bc.replace(/<[^>]*>/g, '').split('/').pop()) : null
    return {
      slug: f.replace(/\.html$/, ''), file: f, src, rawCat,
      canon: rawCat ? canonicalise(L.code, rawCat) : null,
      title: pick(src, /<h1 class="article-title">([\s\S]*?)<\/h1>/) ?? f,
    }
  })

  for (const it of all) {
    const has = it.src.includes('class="related-guides"')
    if (has && !ALL) { skipped++; continue }

    // 같은 분류 먼저, 모자라면 같은 언어의 다른 글로 채운다
    const same = all.filter((o) => o.slug !== it.slug && o.canon && o.canon === it.canon)
    const rest = all.filter((o) => o.slug !== it.slug && !same.includes(o))
    const chosen = [...same, ...rest].slice(0, MAX)
    if (chosen.length < MIN) { warn.push(`${L.code}/${it.slug}: 고를 글이 ${chosen.length}편뿐이라 건너뜀`); continue }

    const items = chosen.map((o) =>
      `    <li><a href="${L.base}/${o.slug}.html"><span class="rg-cat">${o.rawCat ?? ''}</span>${o.title}</a></li>`
    ).join('\n')
    const aside =
      `<aside class="related-guides" aria-label="${L.eyebrow}">\n` +
      `  <p class="rg-eyebrow">${L.eyebrow}</p>\n  <ul>\n${items}\n  </ul>\n</aside>\n`

    let out = it.src
    if (has) {
      out = out.replace(/<aside class="related-guides"[\s\S]*?<\/aside>\n?/, aside)
    } else {
      const at = out.indexOf('</article>')
      if (at === -1) { warn.push(`${L.code}/${it.slug}: </article>를 찾지 못해 건너뜀`); continue }
      out = out.slice(0, at + '</article>'.length) + '\n' + aside + out.slice(at + '</article>'.length + 1)
    }
    if (!out.includes('.related-guides{')) {
      if (!out.includes(CSS_ANCHOR)) { warn.push(`${L.code}/${it.slug}: CSS 앵커가 없어 스타일을 못 넣음`) }
      else out = out.replace(CSS_ANCHOR, CSS + CSS_ANCHOR)
    }
    writeFileSync(join(ROOT, L.dir, it.file), out)
    touched++
  }
}

console.log(`✅ 관련 가이드 블록 — ${touched}편 생성/갱신, ${skipped}편 유지${ALL ? ' (--all)' : ''}`)
for (const w of warn) console.warn('⚠️ ' + w)
