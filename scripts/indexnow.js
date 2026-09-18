#!/usr/bin/env node
// IndexNow 핑 — 새로 올리거나 고친 URL을 Bing·Naver 등 IndexNow 참여 엔진에 알린다.
// 구글은 IndexNow를 쓰지 않는다(사이트맵/크롤링으로만 받는다).
//
//   node scripts/indexnow.js <url> [url ...]
//   node scripts/indexnow.js --from urls.txt        (한 줄에 하나)
//   node scripts/indexnow.js --dry-run <url>        (키 확인까지만 하고 보내지 않음)
//
// 키 파일이 배포되어 https://juanesq.com/<KEY>.txt 가 200으로 응답하기 전에는 핑을 보내지
// 않는다 — 키 검증에 실패한 핑은 거부 이력으로 남는다.

const { readFileSync } = require('node:fs')

const HOST = 'juanesq.com'
const KEY = 'd15963c50032552b17c5c3635b2d8d24'
const KEY_URL = `https://${HOST}/${KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

// 진행 중인 fetch가 있는 상태에서 process.exit()를 부르면 Windows Node가 libuv
// 어서션으로 죽어 종료 코드가 뭉개진다(127). 그래서 던지고 맨 아래에서 한 번만 처리한다.
class Abort extends Error {}
const fail = (msg) => { throw new Abort(msg) }

function collectUrls() {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--from')
  let urls
  if (i !== -1) {
    if (!argv[i + 1]) fail('--from 뒤에 파일 경로가 필요합니다')
    urls = readFileSync(argv[i + 1], 'utf8').split('\n')
  } else {
    urls = argv.filter((a) => !a.startsWith('--'))
  }
  urls = urls.map((u) => u.trim()).filter(Boolean)

  if (urls.length === 0) fail('URL이 없습니다. 사용법은 이 파일 상단 주석 참고')
  if (urls.length > 10000) fail('한 번에 10,000개까지만 보낼 수 있습니다')
  // 다른 호스트 URL이 하나라도 섞이면 요청 전체가 422로 거부된다
  const wrong = urls.filter((u) => { try { return new URL(u).host !== HOST } catch { return true } })
  if (wrong.length) fail(`이 사이트(${HOST})의 URL이 아닙니다:\n   ` + wrong.join('\n   '))
  return urls
}

async function main() {
  const urls = collectUrls()
  const dryRun = process.argv.includes('--dry-run')

  // 1) 키 파일이 실제로 배포되어 있는지 먼저 확인한다
  process.stdout.write(`키 파일 확인 ${KEY_URL} ... `)
  let res
  try {
    res = await fetch(KEY_URL, { cache: 'no-store' })
  } catch (e) {
    fail(`요청 실패: ${e.message}`)
  }
  if (!res.ok) fail(`${res.status} — 아직 배포되지 않았습니다. 배포 후 다시 실행하세요`)
  const body = (await res.text()).trim()
  if (body !== KEY) fail(`키 파일 내용이 키와 다릅니다 (받은 값: ${body.slice(0, 40)})`)
  console.log('200 OK')

  console.log(`URL ${urls.length}개:`)
  for (const u of urls) console.log(`   ${u}`)
  if (dryRun) { console.log('\n--dry-run — 보내지 않고 끝냅니다'); return }

  // 2) 핑. 200 = 수락, 202 = 수락(키 검증 대기)
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_URL, urlList: urls }),
  })
  if (r.status !== 200 && r.status !== 202) {
    fail(`IndexNow ${r.status} ${r.statusText}\n` + (await r.text()).slice(0, 500))
  }
  console.log(`\n✅ IndexNow ${r.status} — ${urls.length}개 전송 완료`)
}

main().catch((e) => {
  if (!(e instanceof Abort)) console.error(e.stack || e.message)
  else console.error(`\n❌ ${e.message}`)
  process.exitCode = 1
})
