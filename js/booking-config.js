/* juanesq.com 상담 예약 설정 — 이 파일만 고치면 /book/ 세 언어 페이지(와 홈의 예약 안내 문구)에 바로 반영된다.
   빈 값('')이면 그 기능은 꺼지고, 신청서 → 결제 안내(신청 완료 화면 + 메일) → 입금 확인 후 확정 방식으로 동작한다.
   이 파일을 고치면 이 파일을 부르는 곳의 ?v= 숫자를 올린다(book/es/book/pt/book, index/es/pt 홈).

   googleSchedule : 구글 캘린더 '예약 일정'(appointment schedule) 공개 링크.
                    채우면 /book/의 '전화·화상 30분' 카드를 누를 때 신청서 대신 캘린더가 열리고, "시간 고르기" 문구로 바뀐다.
                    방문 60분은 항상 신청서로 받는다.
                    예) 'https://calendar.app.google/XXXXXXXX' 또는
                        'https://calendar.google.com/calendar/appointments/schedules/AcZssZ...'
   paypalMe       : paypal.me 아이디 (예: 'juanesq' → paypal.me/juanesq). 채우면 캘린더 결제 칸과 신청 완료 화면에
                    'PayPal로 US$○○ 결제' 버튼이 생긴다. 페이팔은 원화(KRW)를 받지 않아 달러로 청구한다.
   priceUSD       : 페이팔 청구액(달러). ₩120,000 / ₩250,000에 맞춘 값(약 1,350원/달러, 5달러 단위).
   계좌 안내 문구는 /book/ 신청 완료 화면과 jq-book 메일에 같은 내용으로 들어 있다. */
window.JQ_BOOKING = {
  googleSchedule: '',
  paypalMe: '',
  priceUSD: { phone: 90, inperson: 185 }
};
