#!/usr/bin/env bash
# QA 게이트: 개발팀은 이 스크립트가 통과(종료코드 0)해야만 배포(push)할 수 있다.
# 사용: bash tools/qa/run.sh  → /tmp/qa_report.md 작성
cd "$(dirname "$0")/../.." || exit 2
fail=0; R=/tmp/qa_report.md
echo "# QA 게이트 결과 $(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M')" > $R

echo "## 1. 빌드·문법" >> $R
if python3 src/seoul/build.py >/dev/null && node --check /tmp/seoul_all.js; then echo "- 서울아파트 빌드/문법 ✅" >> $R; else echo "- 서울아파트 빌드/문법 ❌" >> $R; fail=1; fi
for f in server.js accounts.js public/auth.js public/seoul/sw.js; do node --check "$f" 2>>$R || { echo "- $f 문법 ❌" >> $R; fail=1; }; done
# 조합장(인라인 스크립트) 문법
python3 - <<'PY' >> $R || fail=1
import re,subprocess,sys,pathlib
bad=0
for i,js in enumerate(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', pathlib.Path('public/johapjang/index.html').read_text(encoding='utf-8'), re.S)):
    p=pathlib.Path(f'/tmp/jh_{i}.js'); p.write_text(js)
    r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    if r.returncode: bad=1; print(f'- 조합장 스크립트 #{i} 문법 ❌ {r.stderr[:200]}')
print('- 조합장 문법 ✅' if not bad else '')
sys.exit(bad)
PY

echo "## 2. 서울아파트 봇 대량 플레이" >> $R
SIM=$(node tools/qa/seoul_sim.js /tmp/seoul_all.js ${QA_GAMES:-40}); s=$?
echo "$SIM" > /tmp/qa_sim.json
python3 -c "
import json;d=json.load(open('/tmp/qa_sim.json'))
print(f\"- {d['games']}판 플레이, 엔딩 {d['distinctEndings']}/{d['totalEndings']}종 도달\")
print('- 한 번도 안 나온 엔딩: '+(', '.join(d['neverReached']) or '없음'))
for e in d['errors']: print('- ❌ '+e)
for m,c in d.get('assetLost',[]): print(f'- ⚠️ 자산 상실 {c}회: {m}…')
for m,c in d.get('warnings',[]): print(f'- ⚠️ 경고 {c}회: {m}')
" >> $R
[ $s -ne 0 ] && fail=1

echo "## 3. 서버·페이지 스모크" >> $R
SM=$(python3 tools/qa/smoke.py 2>/dev/null); s=$?
python3 -c "
import json,sys;d=json.loads(sys.argv[1])
print(f\"- 주소 {d['checked']}개 확인\" + (' ✅' if not d['errors'] else ''))
for e in d['errors']: print('- ❌ '+e)
" "$SM" >> $R 2>/dev/null || { echo "- 스모크 테스트 실행 실패 ❌" >> $R; fail=1; }
[ $s -ne 0 ] && fail=1

[ $fail -eq 0 ] && echo -e "\n**결론: 통과 ✅**" >> $R || echo -e "\n**결론: 실패 ❌**" >> $R
cat $R
exit $fail
