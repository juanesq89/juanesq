// /guide/index.html 허브를 파일시스템에서 다시 만든다.
// 가이드를 추가한 뒤 실행하면 허브에 자동 반영된다:  node tools/gen-guide-hub.mjs
//
// 카드 문구(제목·요약)는 기존 허브와 각 언어 허브에 이미 쓰여 있는 것을 그대로 가져온다.
// 영문 126개 중 19개는 본문 h1과 다르게 손으로 다듬어 놓은 것이라 재생성하면서 날리면 안 된다.
// 기존 카드가 없는 새 가이드만 해당 가이드 파일(breadcrumb 분류 / h1 / meta description)에서
// 뽑아 쓴다.
//
// 분류는 각 가이드 breadcrumb의 마지막 칸이 원본이다. 그 값이 영문에서만 32종으로 흩어져
// 있어서(Criminal Defense / Criminal Defence / Criminal Procedure 등) 아래 CANON에서 묶는다.
// 가이드 파일의 breadcrumb 자체는 건드리지 않는다.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const HUB = join(ROOT, 'guide/index.html')
const START = '<!-- GUIDE-HUB:START — tools/gen-guide-hub.mjs가 생성한다. 직접 고치지 말 것 -->'
const END = '<!-- GUIDE-HUB:END -->'

const LANGS = [
  { code: 'en', dir: 'guide', base: '/guide', label: 'English', hub: 'guide/index.html', read: 'Read Article', count: (n) => `${n} guides` },
  { code: 'es', dir: 'guide/es', base: '/guide/es', label: 'Español', hub: 'guide/es/index.html', read: 'Leer Artículo', count: (n) => `${n} guías` },
  { code: 'pt', dir: 'guide/pt', base: '/guide/pt', label: 'Português', hub: 'guide/pt/index.html', read: 'Ler Artigo', count: (n) => `${n} guias` },
]

// 표시 순서 = 배열 순서. 오른쪽은 breadcrumb에 실제로 나타나는 표기들이다.
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

// breadcrumb 안의 분류명은 "Immigration &amp; Visas"처럼 이스케이프된 채로 들어 있다.
// CANON과 대조하려면 먼저 풀어야 한다.
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
const pick = (t, re) => { const m = t.match(re); return m ? m[1].trim() : null }
// 카드 문구는 이미 HTML로 이스케이프된 상태로 꺼내 쓰므로 그대로 둔다. 분류명만 & 를 처리한다.
const esc = (s) => s.replace(/&(?!(amp|lt|gt|quot|nbsp|rsquo|mdash|#\d+);)/g, '&amp;')

// 기존 허브들에서 slug → {cat, title, desc} 를 긁는다 (손으로 다듬은 문구 보존용)
// base 경로가 정확히 일치하는 카드만 읽는다. /guide/index.html 한 파일에 en·es·pt 카드가
// 같은 slug로 함께 들어 있어서, 경로를 가리지 않으면 영문 카드 문구가 pt 카드 문구로
// 덮어써진다(번역된 slug 13개가 재생성 때마다 포르투갈어로 바뀌던 문제).
function existingCards(file, base) {
  const p = join(ROOT, file)
  if (!existsSync(p)) return {}
  const t = readFileSync(p, 'utf8')
  const out = {}
  const re = /<a href="([^"]*)\/([a-z0-9-]+)\.html" class="guide-card">\s*<p class="card-cat">([\s\S]*?)<\/p>\s*<h2 class="card-title">([\s\S]*?)<\/h2>\s*<p class="card-desc">([\s\S]*?)<\/p>/g
  for (const m of t.matchAll(re)) {
    if (m[1] !== base) continue
    out[m[2]] = { cat: m[3].trim(), title: m[4].trim(), desc: m[5].trim() }
  }
  return out
}

function canonicalise(lang, raw) {
  for (const [canon, aliases] of CANON[lang]) if (aliases.includes(raw)) return canon
  return null
}

let body = ''
const report = []
let bad = false

for (const L of LANGS) {
  const cards = existingCards(L.hub, L.base)
  const files = readdirSync(join(ROOT, L.dir)).filter((f) => f.endsWith('.html') && f !== 'index.html')
  const items = []
  const unmapped = []

  for (const f of files.sort()) {
    const slug = f.replace(/\.html$/, '')
    const src = readFileSync(join(ROOT, L.dir, f), 'utf8')
    const bc = pick(src, /<p class="breadcrumb">([\s\S]*?)<\/p>/)
    const rawCat = bc ? decode(bc.replace(/<[^>]*>/g, '').split('/').pop()) : null
    const canon = rawCat ? canonicalise(L.code, rawCat) : null
    if (!canon) unmapped.push(`${slug} (breadcrumb: ${rawCat ?? '없음'})`)
    const c = cards[slug]
    items.push({
      slug, canon,
      cat: c?.cat ?? rawCat ?? '',
      title: c?.title ?? pick(src, /<h1 class="article-title">([\s\S]*?)<\/h1>/) ?? slug,
      desc: c?.desc ?? pick(src, /<meta name="description" content="([\s\S]*?)">/) ?? '',
      fromHub: !!c,
    })
  }

  if (unmapped.length) {
    bad = true
    console.error(`❌ [${L.code}] 분류를 못 정한 가이드가 있습니다. CANON에 표기를 추가하세요:`)
    for (const u of unmapped) console.error(`   ${u}`)
  }

  const groups = CANON[L.code]
    .map(([canon]) => [canon, items.filter((i) => i.canon === canon)])
    .filter(([, list]) => list.length)

  body += `\n<section class="hub-lang" id="lang-${L.code}">\n`
  body += `  <div class="hub-lang-head">\n`
  body += `    <h2 class="hub-lang-title" lang="${L.code}">${L.label}</h2>\n`
  body += `    <span class="hub-lang-count">${L.count(items.length)}</span>\n`
  body += `  </div>\n`
  for (const [canon, list] of groups) {
    body += `  <h3 class="hub-group-title">${esc(canon)}<span>${list.length}</span></h3>\n`
    body += `  <div class="guide-grid">\n`
    for (const it of list) {
      body += `    <a href="${L.base}/${it.slug}.html" class="guide-card">\n`
      body += `      <p class="card-cat">${esc(it.cat)}</p>\n`
      body += `      <h2 class="card-title">${it.title}</h2>\n`
      body += `      <p class="card-desc">${it.desc}</p>\n`
      body += `      <span class="card-read">${L.read}</span>\n`
      body += `    </a>\n`
    }
    body += `  </div>\n`
  }
  body += `</section>\n`
  report.push(`${L.code}: ${items.length}편, 분류 ${groups.length}개, 기존 문구 재사용 ${items.filter((i) => i.fromHub).length}편`)
}

if (bad) { console.error('\n분류가 빠진 가이드가 있어 허브를 쓰지 않았습니다.'); process.exit(1) }

let hub = readFileSync(HUB, 'utf8')
const block = START + body + END
const esc_re = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

if (hub.includes(START)) {
  hub = hub.replace(new RegExp(`${esc_re(START)}[\\s\\S]*?${esc_re(END)}`), block)
} else {
  // 최초 실행: 기존 허브는 히어로 섹션 안에까지 카드가 섞여 있다. 히어로는 소개 문단
  // (guide-sub)까지만 남기고, 그 뒤 footer 앞까지를 통째로 생성 블록으로 바꾼다.
  const heroStart = hub.indexOf('<section class="guide-hero">')
  const subEnd = hub.indexOf('</p>', hub.indexOf('<p class="guide-sub">', heroStart))
  const footer = hub.indexOf('<footer>')
  if (heroStart === -1 || subEnd === -1 || footer === -1) throw new Error('guide-hero / guide-sub / footer를 찾지 못했습니다')
  const jump = '\n  <nav class="hub-jump" aria-label="Language">\n' +
    LANGS.map((L) => `    <a href="#lang-${L.code}" lang="${L.code}">${L.label}</a>`).join('\n') +
    '\n  </nav>\n</section>\n'
  hub = hub.slice(0, subEnd + '</p>'.length) + jump + '\n' + block + '\n\n' + hub.slice(footer)
}

writeFileSync(HUB, hub)
console.log('✅ guide/index.html 재생성')
for (const r of report) console.log('   ' + r)
