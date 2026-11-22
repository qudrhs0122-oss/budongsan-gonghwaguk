# 서버 GitHub 열쇠에 게임 저장소 쓰기 권한 추가 (2분)

**왜 필요한가요?** 지금 서버 열쇠는 비공개 데이터 저장소에만 쓸 수 있어요. 그래서
① 운영팀이 사이트 가동·플레이 통계를 못 보고(이틀 연속 '확인 불가'),
② 상황판 결재가 각 부서에 늦게 전달돼요.
이 권한 하나로 둘 다 해결돼요. **열쇠 값은 바뀌지 않아서 Render는 건드릴 필요 없어요.**

## 순서
1. 위 **🔗 바로 열기** → GitHub 로그인 상태면 'Fine-grained personal access tokens' 목록이 나와요.
2. 목록에서 **aptgame-data 저장소에 쓰던 토큰**을 눌러요. (이름이 기억 안 나면 'Repository access'에 aptgame-data가 있는 것)
3. **Repository access** 칸에서 **Only select repositories** 상태로 **`budongsan-gonghwaguk`를 추가**해요. (aptgame-data는 그대로 둬요)
4. 아래 **Repository permissions → Contents**를 **Read and write**로 바꿔요. (이미 Read and write면 그대로)
5. 맨 아래 **Update** 버튼. 끝.
6. 상황판에서 이 일 **✅ 완료** → 운영팀에 자동으로 넘어가서 다음 출근 때 통계가 들어오는지 확인해요.

만약 목록이 'Tokens (classic)' 쪽에 있다면: 해당 토큰 → **repo** 체크가 켜져 있는지만 보면 돼요(켜져 있으면 이미 됨 → 이 경우엔 Claude에게 "classic이었어"라고 알려주세요).
