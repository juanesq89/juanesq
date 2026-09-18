// sitemap.xml을 파일시스템 + git 이력에서 다시 만든다.
//   node tools/gen-sitemap.mjs
//
// 지금까지는 손으로 URL을 추가해 왔다. 그래서 (1) 새 가이드를 빠뜨리기 쉽고
// (2) lastmod가 추가한 날에 멈춰 그 뒤 수정이 반영되지 않았다.
// lastmod는 git 이력에서 계산한다 — 임의로 만든 날짜를 쓰지 않고, 이력이 없는 파일은
// lastmod 없이 내보낸다. 계산 방식은 아래 lastmodOf 주석 참고.
//
// hreflang: 같은 slug의 영문/es/pt가 있으면 서로 묶는다. x-default는 영문이다.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://juanesq.com'
const OUT = join(ROOT, 'sitemap.xml')

// lastmod는 "내용이 마지막으로 바뀐 날"이어야 한다. 파일의 마지막 커밋 날짜를 그냥 쓰면
// 메타태그 일괄 수정이나 푸터 링크 추가 같은 손질 한 번에 159개 URL의 lastmod가 전부
// 같은 날로 뭉쳐 버린다 — 사실이긴 해도 크롤러에게 아무 정보가 안 된다.
// 그래서 가이드 페이지는 <article> 안쪽(본문)이 실제로 달라진 마지막 커밋을 찾아 쓴다.
// 본문이 없는 페이지(홈·허브·개인정보)는 파일의 마지막 커밋 날짜를 그대로 쓴다.
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

function articleBody(src) {
  const a = src.indexOf('<article')
  const b = src.indexOf('</article>')
  return a !== -1 && b !== -1 ? src.slice(a, b) : null
}

function fileCommits(rel) {
  try {
    return git(['log', '--format=%H %ad', '--date=short', '--', rel]).trim().split('\n').filter(Boolean)
      .map((l) => { const i = l.indexOf(' '); return { sha: l.slice(0, i), date: l.slice(i + 1) } })
  } catch { return [] }
}

const cache = new Map()
function lastmodOf(rel) {
  if (cache.has(rel)) return cache.get(rel)
  const commits = fileCommits(rel)
  let out = null
  if (commits.length) {
    out = commits[0].date
    const at = (sha) => { try { return git(['show', `${sha}:${rel}`]) } catch { return null } }
    const bodyAt = (sha) => { const s = at(sha); return s === null ? null : articleBody(s) }
    const head = bodyAt(commits[0].sha)
    if (head !== null) {
      // 최신 → 과거로 내려가며 본문이 달라지는 지점을 찾는다. 그 바로 앞(더 최신) 커밋이 답.
      for (let i = 1; i < commits.length; i++) {
        if (bodyAt(commits[i].sha) !== head) { out = commits[i - 1].date; break }
        out = commits[i].date   // 여기까지 본문이 같다 = 이 커밋이 아직 후보
      }
    }
  }
  cache.set(rel, out)
  return out
}

const guides = (dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => f.replace(/\.html$/, '')).sort()
    : []

const en = guides('guide')
const es = new Set(guides('guide/es'))
const pt = new Set(guides('guide/pt'))

// es/pt에만 있고 영문이 없는 slug가 생기면 hreflang 묶음이 깨진다 — 먼저 알린다.
const orphan = [...es, ...pt].filter((s) => !en.includes(s))
if (orphan.length) console.warn(`⚠️ 영문 원본이 없는 번역본: ${[...new Set(orphan)].join(', ')}`)

const entries = []
const add = (loc, file, priority, changefreq, alts) =>
  entries.push({ loc, lastmod: lastmodOf(file), priority, changefreq, alts })

const HOME_ALTS = { en: `${SITE}/`, es: `${SITE}/es/`, pt: `${SITE}/pt/` }
add(`${SITE}/`, 'index.html', '1.0', 'monthly', HOME_ALTS)
add(`${SITE}/es/`, 'es/index.html', '0.9', 'monthly', HOME_ALTS)
add(`${SITE}/pt/`, 'pt/index.html', '0.9', 'monthly', HOME_ALTS)

const HUB_ALTS = { en: `${SITE}/guide/`, es: `${SITE}/guide/es/`, pt: `${SITE}/guide/pt/` }
add(`${SITE}/guide/`, 'guide/index.html', '0.9', 'weekly', HUB_ALTS)
add(`${SITE}/guide/es/`, 'guide/es/index.html', '0.8', 'weekly', HUB_ALTS)
add(`${SITE}/guide/pt/`, 'guide/pt/index.html', '0.8', 'weekly', HUB_ALTS)

add(`${SITE}/privacy.html`, 'privacy.html', '0.3', 'yearly', null)

for (const slug of en) {
  const alts = { en: `${SITE}/guide/${slug}.html` }
  if (es.has(slug)) alts.es = `${SITE}/guide/es/${slug}.html`
  if (pt.has(slug)) alts.pt = `${SITE}/guide/pt/${slug}.html`
  const multi = Object.keys(alts).length > 1 ? alts : null
  add(`${SITE}/guide/${slug}.html`, `guide/${slug}.html`, '0.8', 'monthly', multi)
  if (es.has(slug)) add(`${SITE}/guide/es/${slug}.html`, `guide/es/${slug}.html`, '0.8', 'monthly', multi)
  if (pt.has(slug)) add(`${SITE}/guide/pt/${slug}.html`, `guide/pt/${slug}.html`, '0.8', 'monthly', multi)
}

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
for (const e of entries) {
  xml += '  <url>\n'
  xml += `    <loc>${e.loc}</loc>\n`
  if (e.alts) {
    for (const lang of ['en', 'es', 'pt']) {
      if (e.alts[lang]) xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${e.alts[lang]}"/>\n`
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${e.alts.en}"/>\n`
  }
  xml += '    '
  if (e.lastmod) xml += `<lastmod>${e.lastmod}</lastmod>`
  xml += `<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority>\n`
  xml += '  </url>\n'
}
xml += '</urlset>\n'

writeFileSync(OUT, xml)
const noDate = entries.filter((e) => !e.lastmod).length
console.log(`✅ sitemap.xml — ${entries.length} URL (en ${en.length} / es ${es.size} / pt ${pt.size} + 정적 7)`)
if (noDate) console.warn(`⚠️ 커밋 이력이 없어 lastmod를 못 넣은 URL ${noDate}개`)
