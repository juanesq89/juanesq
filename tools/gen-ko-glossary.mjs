// 한국어 법률 용어 사전(/ko/glossary/) 생성기 — 용어 목록을 고치면 이 파일을 다시 돌린다.
//   node tools/gen-ko-glossary.mjs
// 번역어는 각 언어 가이드의 제목·본문에서 쓴 말과 맞춘다(사이트 안에서 같은 말을 쓰도록).
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://juanesq.com'

// [한국어, 영어, 스페인어, 포르투갈어, 가이드 slug]
const GROUPS = [
  ['형사', [
    ['모욕죄', 'Insult (criminal insult)', 'Injuria', 'Injúria', 'insult-crime-korea-foreigners'],
    ['명예훼손', 'Defamation', 'Difamación', 'Difamação', 'korea-defamation-law'],
    ['폭행 · 상해', 'Assault · Bodily injury', 'Agresión · Lesiones', 'Agressão · Lesão corporal', 'assault-charges-korea-foreigners'],
    ['공갈', 'Extortion', 'Extorsión', 'Extorsão', 'extortion-settlement-demand-korea-foreigners'],
    ['사기', 'Fraud', 'Estafa', 'Estelionato', 'fraud-charges-korea-foreigners'],
    ['절도', 'Theft', 'Hurto', 'Furto', 'theft-shoplifting-charges-korea-foreigners'],
    ['강제추행', 'Indecent act by force', 'Abuso sexual', 'Abuso sexual', 'indecent-act-by-force-charges-korea-foreigners'],
    ['불법촬영', 'Illegal filming', 'Grabación sin consentimiento', 'Filmagem sem consentimento', 'illegal-filming-charges-korea-foreigners'],
    ['음주운전', 'Drunk driving (DUI)', 'Conducir bebido', 'Dirigir alcoolizado', 'dui-korea-foreigners'],
    ['뺑소니 (도주치상)', 'Hit-and-run', 'Fuga tras un accidente', 'Fuga do local do acidente', 'hit-and-run-korea-foreigners'],
    ['업무방해', 'Obstruction of business', 'Obstrucción del negocio', 'Obstrução de atividade comercial', 'obstruction-of-business-korea-foreigners'],
    ['마약', 'Drug offences', 'Delitos de drogas', 'Crimes de drogas', 'drug-charges-korea-foreigners'],
    ['보이스피싱', 'Voice phishing', 'Estafa telefónica', 'Golpe por telefone', 'voice-phishing-scam-korea-foreigners'],
    ['명의대여 · 차명계좌', 'Lending your name · Borrowed-name account', 'Prestar tu nombre o tu cuenta', 'Emprestar seu nome ou sua conta', 'lending-your-name-korea-foreigners'],
    ['고소', 'Criminal complaint', 'Denuncia penal', 'Queixa-crime', 'criminal-complaint-victim-korea-foreigners'],
    ['구속영장', 'Detention warrant', 'Orden de prisión preventiva', 'Mandado de prisão preventiva', 'detention-warrant-bail-korea-foreigners'],
    ['약식명령', 'Summary order', 'Orden sumaria', 'Ordem sumária', 'summary-order-criminal-fine-korea-foreigners'],
    ['기소유예', 'Suspended indictment', 'Suspensión de la acusación', 'Suspensão da denúncia', 'suspended-dispositions-korea-foreigners'],
    ['집행유예', 'Suspended execution (of sentence)', 'Suspensión de la ejecución', 'Suspensão da execução', 'suspended-dispositions-korea-foreigners'],
    ['형사합의', 'Settlement with the victim', 'Acuerdo con la víctima', 'Acordo com a vítima', 'criminal-settlement-agreement-korea-foreigners'],
    ['배상명령', 'Compensation order', 'Orden de indemnización', 'Ordem de indenização', 'compensation-order-criminal-korea-foreigners'],
    ['항소', 'Appeal', 'Recurso de apelación', 'Recurso de apelação', 'criminal-appeal-korea-foreigners'],
    ['출국정지', 'Departure ban', 'Prohibición de salir del país', 'Proibição de sair do país', 'departure-ban-korea-foreigners'],
    ['스토킹 · 접근금지', 'Stalking · Restraining order', 'Acoso · Orden de alejamiento', 'Perseguição · Medida protetiva', 'restraining-order-korea-foreigners'],
  ]],
  ['가족 · 상속', [
    ['이혼 (협의 · 재판)', 'Divorce (by agreement · by trial)', 'Divorcio (de mutuo acuerdo · contencioso)', 'Divórcio (consensual · litigioso)', 'divorce-korea-foreigners'],
    ['친권 · 양육권', 'Parental authority · Custody', 'Patria potestad · Custodia', 'Poder familiar · Guarda', 'child-custody-korea-foreigners'],
    ['양육비', 'Child support', 'Pensión alimenticia', 'Pensão alimentícia', 'child-support-korea-foreigners'],
    ['혼인신고', 'Marriage registration', 'Registro del matrimonio', 'Registro do casamento', 'marriage-registration-korea-foreigners'],
    ['사실혼', 'Common-law marriage', 'Unión de hecho', 'União estável', 'common-law-marriage-korea-foreigners'],
    ['상속 · 한정승인 · 상속포기', 'Inheritance · Limited acceptance · Renunciation', 'Herencia · Aceptación a beneficio de inventario · Renuncia', 'Herança · Aceitação limitada · Renúncia', 'inheritance-korea-foreigners'],
    ['유언', 'Will', 'Testamento', 'Testamento', 'will-testament-korea-foreigners'],
  ]],
  ['체류 · 비자', [
    ['귀화', 'Naturalization', 'Naturalización', 'Naturalização', 'naturalization-korea-foreigners'],
    ['영주권 (F-5)', 'Permanent residency', 'Residencia permanente', 'Residência permanente', 'permanent-residency-korea-foreigners'],
    ['강제퇴거 · 출국명령', 'Deportation · Departure order', 'Deportación · Orden de salida', 'Deportação · Ordem de saída', 'deportation-entry-ban-korea-foreigners'],
    ['불법체류 (체류기간 초과)', 'Visa overstay', 'Visa vencida', 'Visto vencido', 'visa-overstay-korea-foreigners'],
    ['외국인등록', 'Alien registration', 'Registro de extranjería', 'Registro de estrangeiro', 'alien-registration-address-reporting-korea-foreigners'],
    ['재입국허가', 'Re-entry permit', 'Permiso de reingreso', 'Permissão de reentrada', 're-entry-permit-korea-foreigners'],
  ]],
  ['노동', [
    ['부당해고', 'Unfair dismissal', 'Despido improcedente', 'Demissão sem justa causa', 'wrongful-termination-korea-foreigners'],
    ['임금체불', 'Unpaid wages', 'Salarios impagos', 'Salário atrasado', 'unpaid-wages-korea-foreigners'],
    ['퇴직금', 'Severance pay', 'Indemnización por años de servicio', 'Indenização por tempo de serviço', 'severance-pay-korea-foreigners'],
    ['직장 내 괴롭힘', 'Workplace bullying', 'Acoso laboral', 'Assédio moral no trabalho', 'workplace-bullying-korea-foreigners'],
    ['산업재해', 'Workplace injury', 'Accidente de trabajo', 'Acidente de trabalho', 'workplace-injury-korea-foreigners'],
  ]],
  ['집 · 돈 · 소송', [
    ['전세사기', 'Jeonse scam', 'Estafa del jeonse', 'Golpe do jeonse', 'jeonse-scam-korea-foreigners'],
    ['임대차 보증금', 'Rental deposit', 'Fianza', 'Caução do aluguel', 'deposit-return-korea-foreigners'],
    ['명도소송', 'Eviction lawsuit', 'Juicio de desahucio', 'Ação de despejo', 'eviction-korea-foreigners'],
    ['가압류', 'Provisional attachment', 'Embargo preventivo', 'Arresto cautelar', 'provisional-attachment-korea-foreigners'],
    ['소액사건', 'Small claims', 'Demanda de menor cuantía', 'Pequenas causas', 'small-claims-court-korea-foreigners'],
    ['강제집행', 'Compulsory execution', 'Ejecución forzosa', 'Execução forçada', 'enforcing-a-judgment-korea-foreigners'],
    ['소멸시효', 'Statute of limitations', 'Prescripción', 'Prescrição', 'limitation-periods-deadlines-korea-foreigners'],
  ]],
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
for (const [, rows] of GROUPS) for (const r of rows) for (const l of ['', 'es/', 'pt/'])
  if (!fs.existsSync(path.join(ROOT, 'guide', l + r[4] + '.html'))) throw new Error('가이드 없음: ' + l + r[4])

const N = GROUPS.reduce((n, [, r]) => n + r.length, 0)
const TITLE = `법률 용어 영어·스페인어·포르투갈어로 — 모욕죄·이혼·귀화 등 ${N}개 | 홍우원 변호사`
const DESC = `모욕죄 영어로 뭐라고 할까요? 명예훼손·공갈·이혼·양육권·귀화·부당해고 등 한국 법률 용어 ${N}개를 영어·스페인어·포르투갈어로 정리했습니다. 단어마다 그 언어로 쓴 가이드로 연결됩니다.`
const URL = `${SITE}/ko/glossary/`

const ld = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': URL,
  name: '법률 용어 영어·스페인어·포르투갈어',
  inLanguage: ['ko', 'en', 'es', 'pt'],
  url: URL,
  author: { '@id': `${SITE}/#juan` },
  hasDefinedTerm: GROUPS.flatMap(([, rows]) => rows.map((r) => ({
    '@type': 'DefinedTerm',
    name: r[0].replace(/ · /g, '·'),
    alternateName: [r[1], r[2], r[3]],
    url: `${SITE}/guide/${r[4]}.html`,
  }))),
}

const lk = (lang, txt, slug) => `<a href="/guide/${lang ? lang + '/' : ''}${slug}.html" lang="${lang || 'en'}" hreflang="${lang || 'en'}">${esc(txt)}</a>`
const body = GROUPS.map(([g, rows], gi) => `
<section class="gl-sec${gi % 2 ? ' paper' : ''}">
  <div class="wrap">
    <p class="label"><span class="no">${String(gi + 1).padStart(2, '0')}</span>${g}</p>
    <ul class="gl-list">
${rows.map((r) => `      <li data-k="${esc([r[0], r[1], r[2], r[3]].join(' ').toLowerCase())}"><b class="gl-ko">${esc(r[0])}</b><span class="gl-t"><i>EN</i>${lk('', r[1], r[4])}</span><span class="gl-t"><i>ES</i>${lk('es', r[2], r[4])}</span><span class="gl-t"><i>PT</i>${lk('pt', r[3], r[4])}</span></li>`).join('\n')}
    </ul>
  </div>
</section>`).join('\n')

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<meta name="robots" content="index, follow">
<meta name="author" content="홍우원 변호사">
<link rel="canonical" href="${URL}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${URL}">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${SITE}/img/og-juan-1200x630.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-28GWYNEPR3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-28GWYNEPR3');
</script>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preload" href="/fonts/piazzolla-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/archivo-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500&display=swap" rel="stylesheet">
<link href="/css/site.css?v=19" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
:root{--serif:'Piazzolla','Noto Serif KR','AppleMyungjo','Batang',serif}
.ko{--sans:'Archivo','Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
.gl-hero{padding:150px 0 56px}
.gl-hero .h2{font-size:clamp(32px,3.8vw,54px);font-weight:500;line-height:1.2;letter-spacing:-.035em}
.gl-hero .h2 em{display:block;margin-top:16px;font-family:var(--sans);font-style:normal;font-size:clamp(17px,1.5vw,21px);font-weight:500;line-height:1.6;letter-spacing:-.01em;color:var(--ivory-3)}
.gl-find{margin-top:36px;max-width:520px}
.gl-find input{width:100%;min-height:52px;padding:12px 16px;background:rgba(6,13,24,.5);border:1px solid rgba(242,238,230,.22);color:var(--ivory);font:inherit;font-size:16px;outline:none}
.gl-find input:focus{border-color:var(--seal)}
.gl-sec{padding:72px 0}
.gl-list{list-style:none;margin:24px 0 0;padding:0;border-top:1px solid var(--rule)}
.gl-list li{display:grid;grid-template-columns:minmax(0,1.1fr) repeat(3,minmax(0,1fr));gap:12px 28px;align-items:baseline;padding:20px 0;border-bottom:1px solid var(--rule-2)}
.paper .gl-list{border-top-color:rgba(0,0,0,.18)}.paper .gl-list li{border-bottom-color:rgba(0,0,0,.1)}
.gl-ko{font-family:var(--serif);font-weight:500;font-size:22px;line-height:1.3;letter-spacing:-.02em}
.paper .gl-ko{color:var(--navy)}
.gl-t{font-size:15px;line-height:1.5}
.gl-t i{display:block;font-style:normal;font-size:11px;font-weight:600;letter-spacing:.14em;color:var(--seal);margin-bottom:2px}
.paper .gl-t i{color:var(--seal-deep)}
.gl-t a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(201,105,79,.35)}
.gl-t a:hover{border-bottom-color:currentColor}
.gl-none{display:none;padding:24px 0;color:var(--ivory-3)}
.gl-note{font-size:14px;line-height:1.8;color:var(--ivory-3);max-width:40em}
@media (max-width:860px){.gl-hero{padding:120px 0 40px}.gl-sec{padding:56px 0}.gl-list li{grid-template-columns:1fr;gap:8px}.gl-ko{font-size:20px}.gl-t{display:flex;gap:10px;align-items:baseline}.gl-t i{display:inline;min-width:22px}}
</style>
</head>
<body class="ko">
<a class="skip" href="#main">본문 바로 가기</a>
<header class="nav solid" id="navbar">
  <div class="wrap">
    <a href="/ko/" class="wordmark" aria-label="홍우원 변호사"><b>Juan W. Hong</b><small>홍우원 변호사 · 법무법인 에스엔케이</small></a>
    <ul class="nav-links" id="nav-links">
      <li><a href="/ko/#career">이력</a></li>
      <li><a href="/ko/#who">이런 일</a></li>
      <li><a href="/ko/glossary/" aria-current="page">법률 용어</a></li>
      <li><a href="/ko/#contact">상담</a></li>
    </ul>
    <nav class="lang" aria-label="언어">
      <a href="/" hreflang="en" lang="en">EN</a>
      <a href="/es/" hreflang="es" lang="es">ES</a>
      <a href="/pt/" hreflang="pt" lang="pt">PT</a>
      <a href="/ko/" hreflang="ko" lang="ko" aria-current="page">KO</a>
    </nav>
    <a href="/book/" class="btn btn-line nav-cta">상담 예약</a>
    <button class="menu-btn" type="button" aria-label="메뉴" aria-expanded="false" aria-controls="nav-links"><span></span></button>
  </div>
</header>

<main id="main">
<section class="gl-hero">
  <div class="wrap">
    <h1 class="h2">법률 용어, 영어·스페인어·포르투갈어로<em>외국인 배우자·직원·거래처에게 설명해야 할 때 쓰는 말 ${N}개를 정리했습니다. 단어를 누르면 그 언어로 쓴 가이드로 이어집니다.</em></h1>
    <div class="gl-find"><input type="search" id="gl-q" placeholder="찾을 말 (예: 모욕죄, divorce, estafa)" aria-label="용어 찾기"></div>
    <p class="gl-none" id="gl-none">맞는 용어가 없습니다. 다른 말로 찾아보세요.</p>
  </div>
</section>
${body}

<section class="closing" id="contact">
  <div class="wrap">
    <p class="gl-note">나라마다 법 제도가 달라 한 단어가 정확히 들어맞지 않는 경우가 있습니다. 위 번역은 한국 제도를 그 언어로 설명할 때 쓰는 말이고, 자세한 뜻은 연결된 가이드에 적었습니다.</p>
    <div class="hero-actions"><a href="/book/" class="btn btn-gold">상담 예약 신청</a> <a href="/ko/" class="btn btn-line">홍우원 변호사 소개</a></div>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot-bottom">
      <p>이 사이트의 글은 일반적인 정보이며 개별 사건에 대한 법률 자문이 아닙니다. 연락만으로 사건 위임 관계가 생기지는 않습니다.</p>
      <p>© 2026 juanesq.com · <a href="/privacy.html" style="color:inherit">Privacy Policy</a></p>
    </div>
  </div>
</footer>
<script>
(function(){var q=document.getElementById('gl-q'),none=document.getElementById('gl-none');if(!q)return;
q.addEventListener('input',function(){var v=q.value.trim().toLowerCase(),shown=0;
document.querySelectorAll('.gl-sec').forEach(function(sec){var c=0;sec.querySelectorAll('li').forEach(function(li){var ok=!v||li.getAttribute('data-k').indexOf(v)>-1;li.style.display=ok?'':'none';if(ok)c++});sec.style.display=c?'':'none';shown+=c});
none.style.display=shown?'none':'block'})})();
</script>
<script src="/js/ui.js?v=8" defer></script>
</body>
</html>
`
fs.mkdirSync(path.join(ROOT, 'ko/glossary'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'ko/glossary/index.html'), html)
console.log('ko/glossary/index.html', N, 'terms')
