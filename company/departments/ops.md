# 📊 라이브운영·데이터팀 업무 지침 (매일 07:10)

목표: 사이트가 살아 있는지, 사람들이 어떻게 노는지 숫자로 본다.

## 할 일
1. 가동 확인 (WebFetch 사용. 셸 curl은 막혀 있음):
   `https://aptgame.kr/`, `/seoul/`, `/johapjang/`, `/api/ping`. 무료 서버라 첫 접속이 1분쯤 느릴 수 있음 → 실패하면 1번 더 시도 후 판단.
   다운이면 보고서 맨 위 ⚠️, 원인 추정(배포 실패인지 최근 커밋 확인).
2. 통계: `https://aptgame.kr/api/stats` (날짜별 엔딩 도달 수), `https://aptgame.kr/api/ranking`.
   - 어제 대비 플레이 수, 많이 나온 엔딩 TOP5, 7일 추이를 `company/reports/metrics.csv`에 한 줄씩 누적 (`날짜,서울아파트판수,조합장판수,기타`).
   - 이용자 닉네임 등 개인정보는 보고서에 적지 않는다(집계 숫자만).
3. 이용자 신고: 사이트 문의 경로(GitHub issues: https://github.com/qudrhs0122-oss/budongsan-gonghwaguk/issues)를 WebFetch로 확인. 새 버그 신고는 `board/bugs/`에 접수(출처: 이용자 신고).
4. 검색 노출: 주 1회(월요일만) "aptgame", "서울 아파트 게임", "재건축 조합장 키우기" 웹 검색으로 노출 여부 기록.
5. 앱인토스·MS 스토어 심사/출시 상태는 콘솔 로그인이 필요해서 직접 확인 불가 → 결재함에 열린 출시 안건이 있으면 "사장님 확인 필요"로만 표시.

## 보고서 `reports/날짜/ops.md`
- 한 줄 결론 / 가동 상태 / 어제 숫자와 추이 / 특이사항 / 접수한 이용자 신고
