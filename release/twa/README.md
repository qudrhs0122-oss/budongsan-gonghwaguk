# TWA(안드로이드 앱 포장) — 서울아파트

원스토어·갤럭시 스토어·구글 플레이에 올릴 **APK/AAB** 를 만드는 설정입니다. 웹(aptgame.kr/seoul/)을 크롬으로 띄우는 얇은 앱이라, 웹을 고치면 앱도 바로 바뀝니다.

## ⚠️ 서명 키는 절대 이 저장소에 넣지 않습니다
- 이 저장소는 **공개 저장소**입니다. `*.keystore`·비밀번호는 커밋 금지(.gitignore 등록됨).
- 키를 잃어버리면 같은 앱으로 업데이트를 못 하니, 사장님 컴퓨터·클라우드 금고에 2곳 이상 보관.

## 만드는 순서 (사장님이 Claude 대화창에서 "원스토어 입점 진행해" 하시면 Claude가 사장님 컴퓨터에서 진행)
1. JDK 17 + 안드로이드 SDK 준비 → `npm i -g @bubblewrap/cli`
2. 이 폴더에서 `bubblewrap init --manifest=https://aptgame.kr/seoul/manifest.webmanifest` 후 설정을 `twa-manifest.seoul.json` 값으로 맞춤
3. 서명 키 생성(비밀번호는 사장님만 입력) → `bubblewrap build` → `app-release-signed.apk`(원스토어·갤럭시) + `app-release-bundle.aab`(구글 플레이)
4. `keytool -list -v -keystore seoul-upload.keystore` 로 SHA-256 **지문(공개값)** 확인 → `assetlinks.template.json` 에 넣어 개발팀이 `public/.well-known/assetlinks.json` 으로 배포
   - 구글 플레이는 '앱 서명' 화면의 지문도 함께 추가

## 앱에서 달라지는 점 (개발팀 작업, 시작 주소 `?src=twa`)
- 후원 버튼 숨김(구글 플레이 결제 정책)
- 나머지(광고·쿠팡 배너·랭킹)는 웹과 동일
