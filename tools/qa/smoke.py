"""QA검증팀: 서버·페이지 스모크 테스트.
로컬에서 server.js를 띄워 주요 주소가 정상 응답하는지, 헤드리스 크롬(모바일 390px)으로
게임 페이지를 열었을 때 자바스크립트 오류가 없는지 확인한다.
사용: python3 tools/qa/smoke.py  → JSON 한 줄 출력, 문제가 있으면 종료코드 1
"""
import json, os, re, subprocess, sys, time, urllib.request, http.server, threading, functools, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
PORT = 8099
errors, checks = [], []

def get(path):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{path}", timeout=10) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:
        return 0, str(e).encode()

env = dict(os.environ, PORT=str(PORT))
srv = subprocess.Popen(["node", "server.js"], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
try:
    for _ in range(40):
        if get("/api/ping")[0] == 200: break
        time.sleep(0.25)
    else:
        errors.append("서버가 10초 안에 뜨지 않음: " + (srv.stderr.read(400).decode(errors="ignore") if srv.poll() is not None else ""))

    # 1) 주요 주소 응답 (사이트맵에 있는 페이지 전부 + 핵심 API)
    paths = ["/", "/seoul/", "/seoul/e/e1", "/api/ping", "/api/ranking", "/api/stats", "/robots.txt", "/sitemap.xml",
             "/seoul/manifest.webmanifest", "/seoul/sw.js", "/assets/og_seoul.jpg"]
    sm = (ROOT / "public/sitemap.xml").read_text(encoding="utf-8")
    for u in re.findall(r"<loc>https://aptgame\.kr([^<]*)</loc>", sm):
        if not u.startswith("/johapjang"): paths.append(u or "/")
    for p in dict.fromkeys(paths):
        code, _ = get(p)
        checks.append([p, code])
        if code != 200: errors.append(f"{p} 응답 {code}")

    # 2) 엔딩 공유 이미지 40장 존재
    miss = [f"e{i}" for i in range(1, 41) if not (ROOT / f"public/assets/end/e{i}.jpg").exists()]
    if miss: errors.append("공유 이미지 없음: " + ",".join(miss))

    # 3) 헤드리스 크롬으로 게임 페이지 열기 (조합장은 로컬 미러를 정적 서버로)
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    jh = http.server.ThreadingHTTPServer(("127.0.0.1", 8098), functools.partial(Quiet, directory=str(ROOT / "public/johapjang")))
    threading.Thread(target=jh.serve_forever, daemon=True).start()
    from playwright.sync_api import sync_playwright
    out = pathlib.Path("/tmp/qa_shots"); out.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for name, url in [("seoul", f"http://127.0.0.1:{PORT}/seoul/"), ("home", f"http://127.0.0.1:{PORT}/"), ("johapjang", "http://127.0.0.1:8098/")]:
            pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
            perr = []
            pg.on("pageerror", lambda e, perr=perr: perr.append(str(e)[:200]))
            pg.goto(url, wait_until="domcontentloaded", timeout=20000)
            pg.wait_for_timeout(3500)
            # 첫 화면에서 아무 버튼이나 몇 번 눌러 기본 흐름이 멈추지 않는지 확인
            for _ in range(3):
                try:
                    btn = pg.locator("button:visible").first
                    if btn.count(): btn.click(timeout=1500); pg.wait_for_timeout(700)
                except Exception: pass
            pg.screenshot(path=str(out / f"{name}.png"))
            for e in perr: errors.append(f"[{name}] 자바스크립트 오류: {e}")
            pg.close()
        b.close()
    jh.shutdown()
finally:
    srv.terminate()

print(json.dumps({"errors": errors, "checked": len(checks), "screenshots": "/tmp/qa_shots"}, ensure_ascii=False))
sys.exit(1 if errors else 0)
