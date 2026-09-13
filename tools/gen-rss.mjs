// 네이버 서치어드바이저 RSS 제출용 rss.xml 생성기.
// guide/*.html에서 제목·설명·분류를 읽고, 게시일은 git에서 그 파일이 처음
// 커밋된 시점으로 잡는다. 정적 사이트라 가이드를 추가한 뒤 직접 돌려야 한다:
//
//   node tools/gen-rss.mjs
//
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://juanesq.com'
const MAX_ITEMS = 60

const pick = (html, re) => {
  const m = html.match(re)
  return m ? m[1].trim() : ''
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** 파일이 처음 커밋된 시각 = 게시일 */
function publishedAt(relPath) {
  try {
    const out = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%aI', '--', relPath],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim()
    const first = out.split('\n').filter(Boolean).pop()
    if (first) return new Date(first)
  } catch {
    /* 커밋되지 않은 새 파일이면 아래 폴백 */
  }
  return new Date()
}

const files = readdirSync(join(ROOT, 'guide'))
  .filter((f) => f.endsWith('.html') && f !== 'index.html')

const items = files
  .map((f) => {
    const rel = `guide/${f}`
    const html = readFileSync(join(ROOT, rel), 'utf8')
    // <title>은 " | Juan" 접미사를 달고 있으니 떼어낸다
    const title = decode(pick(html, /<title>([\s\S]*?)<\/title>/)).replace(/\s*\|\s*Juan\s*$/, '')
    // og:description이 더 짧고 읽기 좋아 우선 사용
    const description =
      decode(pick(html, /<meta property="og:description" content="([\s\S]*?)">/)) ||
      decode(pick(html, /<meta name="description" content="([\s\S]*?)">/))
    const category = decode(pick(html, /<p class="article-eyebrow">([\s\S]*?)<\/p>/))
      .replace(/^Legal Guide\s*·\s*/, '')
    return { url: `${BASE}/${rel}`, title, description, category, date: publishedAt(rel) }
  })
  .filter((it) => it.title)
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, MAX_ITEMS)

if (items.length === 0) throw new Error('가이드를 하나도 읽지 못했습니다')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Juan W. Hong, Attorney at Law — Korean Law Guides for Foreign Nationals</title>
    <link>${BASE}/</link>
    <description>Plain-English guides to Korean law for foreign residents — immigration and visas, criminal defense, employment, real estate, family law, and tax.</description>
    <language>en</language>
    <lastBuildDate>${items[0].date.toUTCString()}</lastBuildDate>
    <generator>juanesq</generator>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${esc(it.url)}</link>
      <guid isPermaLink="true">${esc(it.url)}</guid>
${it.category ? `      <category>${esc(it.category)}</category>\n` : ''}      <description>${esc(it.description)}</description>
      <pubDate>${it.date.toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`

writeFileSync(join(ROOT, 'rss.xml'), xml)
console.log(`✅ rss.xml — ${items.length}편 (전체 ${files.length}편 중 최신순)`)
