/* juanesq.com 상담 예약 설정 — 이 파일만 고치면 /book/ 세 언어 페이지에 바로 반영된다.
   빈 값('')이면 그 기능은 꺼지고, 신청서 + "결제 안내는 메일로" 방식으로 동작한다.

   googleSchedule : 구글 캘린더 '예약 일정'(appointment schedule) 공개 링크.
                    전화·화상 30분 상담에만 쓴다. 방문 60분은 항상 신청서로 받는다.
                    예) 'https://calendar.app.google/XXXXXXXX' 또는
                        'https://calendar.google.com/calendar/appointments/schedules/AcZssZ...'
   paypalMe       : paypal.me 아이디 (예: 'juanesq' → paypal.me/juanesq). 페이팔은 원화(KRW)를 받지 않아 달러로 청구한다.
   priceUSD       : 페이팔 청구액(달러). ₩120,000 / ₩250,000에 맞춘 값.
   계좌번호는 여기에 넣지 않는다 — 공개 파일이다. 계좌는 확정 메일로만 보낸다. */
window.JQ_BOOKING = {
  googleSchedule: '',
  paypalMe: '',
  priceUSD: { phone: 90, inperson: 185 }
};
