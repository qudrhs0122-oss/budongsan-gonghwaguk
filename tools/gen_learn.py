# -*- coding: utf-8 -*-
# aptgame.kr 콘텐츠 확장: 부동산 공부(아티클) · 계산기 · 게임 가이드 · 업데이트 소식 · 소개
import html, os, json
ROOT = '/home/claude/budongsan-gonghwaguk/public'
SITE = 'https://aptgame.kr'
TODAY = '2026-11-13'
e = html.escape

NAV = [('/', '🏠 게임 고르기'), ('/learn/', '📚 부동산 공부'), ('/tools/', '🧮 계산기'), ('/bluemarble', '🎲 부루마블'), ('/johapjang/', '🏗️ 조합장 키우기'), ('/seoul/', '🏙️ 서울 아파트'), ('/news.html', '📰 업데이트'), ('/about.html', 'ℹ️ 소개')]
AD = '<div class="adbox"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-2150655592231599" data-ad-slot="4104692035" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>'

def nav(cur):
    return ''.join(f'<a href="{h}" class="{"on" if h == cur else ""}">{t}</a>' for h, t in NAV)

def page(path, title, desc, body, cur='', ad=True, extra_head='', kind='article'):
    url = SITE + '/' + path.replace('index.html', '')
    out = f'''<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} | aptgame.kr</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{kind}"><meta property="og:site_name" content="aptgame.kr"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://aptgame.kr/assets/og2.jpg"><meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/page.css">{extra_head}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2150655592231599" crossorigin="anonymous"></script>
</head><body>
<header class="top"><a class="brand" href="/"><img src="/assets/logo.png" alt="aptgame.kr 대한민국 부동산 게임즈"></a><nav>{nav(cur)}</nav></header>
<main class="doc">{body}{AD if ad else ""}</main>
<footer class="foot"><nav>{nav(cur)}<a href="/glossary.html">부동산 용어</a><a href="/apartments.html">단지 도감</a><a href="/privacy.html">개인정보처리방침</a></nav>
<p>aptgame.kr은 부동산을 소재로 한 무료 웹게임과 부동산 기초 지식을 함께 제공하는 사이트입니다. 게임 속 시세·수익·이벤트는 가상 수치이며 투자 권유나 시세 예측이 아닙니다. 부동산 공부 글은 공개된 법령과 정부 발표를 바탕으로 쉽게 풀어 쓴 일반 정보이며, 실제 거래 전에는 반드시 공식 자료와 전문가 상담으로 확인하세요.</p>
<p>운영 강병곤 · 문의 <a href="https://github.com/qudrhs0122-oss/budongsan-gonghwaguk/issues" rel="noopener" target="_blank">문의·오류 제보</a> · 최종 업데이트 {TODAY} · © 2026 aptgame.kr</p></footer>
</body></html>'''
    fp = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w', encoding='utf-8').write(out)
    return url

def meta(date, mins):
    return f'<p class="meta">작성 aptgame.kr 편집팀(강병곤) · {date} · 읽는 데 약 {mins}분</p>'
def note(t): return f'<div class="gamenote">🎮 <b>게임으로 체험하기</b> — {t}</div>'
def warn(): return '<p class="disclaimer">이 글은 이해를 돕기 위한 일반 정보입니다. 제도는 수시로 바뀌고 개인 상황마다 적용이 다르니, 실제 거래 전에는 관련 기관(국토교통부, 국세청, 위택스, 청약홈, 금융기관)과 전문가에게 꼭 확인하세요.</p>'

ARTS = []  # (slug, title, desc, date, mins, body, tag)

# 1 ─ 청약 가점
ARTS.append(('cheongyak-gajeom', '청약 가점 84점 만점, 내 점수 계산하는 법', '무주택기간 32점, 부양가족 35점, 청약통장 가입기간 17점. 청약 가점제의 세 항목을 표와 예시로 계산해 봅니다.', '2026-11-13', 7, f'''
<p class="lead">아파트 청약 일반공급 중 상당수는 <b>가점제</b>로 당첨자를 고릅니다. 가점은 84점 만점이고, 무주택기간·부양가족 수·청약통장 가입기간 세 가지로만 계산됩니다. 점수표를 한 번 이해하면 내가 어느 단지에 도전할 만한지 감을 잡을 수 있습니다.</p>
<h2>1. 가점의 세 기둥</h2>
<table><tr><th>항목</th><th>만점</th><th>점수 매기는 방식</th></tr>
<tr><td>무주택기간</td><td>32점</td><td>1년 미만 2점, 이후 1년마다 2점씩 더해 15년 이상이면 32점</td></tr>
<tr><td>부양가족 수</td><td>35점</td><td>0명 5점, 1명마다 5점씩 더해 6명 이상이면 35점</td></tr>
<tr><td>청약통장 가입기간</td><td>17점</td><td>6개월 미만 1점, 6개월~1년 2점, 이후 1년마다 1점씩 더해 15년 이상이면 17점</td></tr></table>
<p>세 항목 가운데 부양가족이 35점으로 비중이 가장 큽니다. 같은 나이, 같은 무주택기간이라도 가족 수가 다르면 점수 차이가 크게 벌어지는 이유입니다.</p>
<h2>2. 무주택기간은 언제부터 셀까?</h2>
<p>무주택기간은 단순히 집이 없던 기간이 아니라 <b>만 30세가 된 날</b>부터 셉니다. 다만 30세 전에 혼인했다면 <b>혼인신고일</b>부터 셉니다. 예를 들어 29살 미혼 직장인은 아직 무주택기간 점수가 쌓이기 전 단계이고, 27살에 결혼했다면 결혼한 날부터 점수가 쌓입니다. 중간에 집을 가졌다가 판 적이 있다면 마지막으로 무주택자가 된 날부터 다시 셉니다.</p>
<h2>3. 부양가족에는 누가 들어갈까?</h2>
<p>배우자, 자녀, 그리고 일정 기간 이상 같은 주민등록표에 올라 있는 직계존속(부모님 등)이 부양가족이 될 수 있습니다. 본인은 부양가족 수에 들어가지 않습니다. 그래서 1인 가구는 부양가족 0명으로 5점에서 시작합니다. 직계존속은 함께 등록된 기간 요건 등 세부 조건이 있으니 모집공고를 꼭 확인해야 합니다.</p>
<h2>4. 예시로 계산해 보기</h2>
<table><tr><th>사례</th><th>무주택</th><th>부양가족</th><th>통장</th><th>합계</th></tr>
<tr><td>32세 미혼, 통장 5년</td><td>6점 (2년 이상~3년 미만)</td><td>5점 (0명)</td><td>7점</td><td><b>18점</b></td></tr>
<tr><td>36세 기혼·자녀 1, 통장 9년</td><td>14점 (6년 이상~7년 미만)</td><td>15점 (2명)</td><td>11점</td><td><b>40점</b></td></tr>
<tr><td>42세 기혼·자녀 2·부모 동거, 통장 15년</td><td>26점 (12년 이상~13년 미만)</td><td>30점 (5명)</td><td>17점</td><td><b>73점</b></td></tr></table>
<p>서울 인기 단지의 당첨 가점은 60점대 후반~70점대에 형성되는 경우가 많습니다. 20~30대 1~2인 가구가 가점제만으로 당첨되기 어려운 이유가 이 표에 그대로 드러납니다.</p>
<h2>5. 가점이 낮을 때 노려볼 길</h2>
<ul><li><b>추첨제 물량</b>: 일부 면적·단지는 일정 비율을 추첨으로 뽑습니다. 가점이 낮아도 운이 따르면 당첨될 수 있습니다.</li>
<li><b>특별공급</b>: 신혼부부, 생애최초, 다자녀, 노부모 부양 등 별도 자격으로 경쟁하는 물량이 있습니다.</li>
<li><b>무순위(줍줍)</b>: 계약 포기·부적격 물량을 다시 모집하는 것으로 경쟁률이 매우 높지만 가점과 무관합니다. 지역·자격 요건은 공고마다 다릅니다.</li></ul>
<h2>6. 당첨만큼 중요한 '계약금'</h2>
<p>당첨되면 보통 분양가의 10% 안팎을 계약금으로 바로 내야 하고, 중도금과 잔금 일정이 이어집니다. 계약금을 마련하지 못하면 당첨을 포기해야 하고, 당첨 사실 때문에 일정 기간 다른 청약이 제한될 수도 있습니다. 청약은 점수만큼 <b>현금 계획</b>이 중요합니다.</p>
{note('<a href="/seoul/">나의 첫 번째 서울 아파트 구하기</a>에서는 무주택 기간과 결혼·출산·부모님 부양에 따라 가점이 실시간으로 바뀌고, 당첨되면 계약금 10%를 바로 내야 합니다. 직접 <a href="/tools/cheongyak.html">청약 가점 계산기</a>로 내 점수를 확인해 보세요.')}
<p>공식 기준과 단지별 공고는 한국부동산원 <a href="https://www.applyhome.co.kr" rel="nofollow noopener" target="_blank">청약홈</a>에서 확인할 수 있습니다.</p>{warn()}''', '청약'))

# 2 ─ LTV DSR
ARTS.append(('ltv-dsr', 'LTV·DTI·DSR 차이, 내 대출 한도는 어떻게 정해질까', '집값 기준 한도(LTV)와 소득 기준 한도(DSR)를 예시 숫자로 계산해 보고, 스트레스 DSR이 한도를 줄이는 원리를 설명합니다.', '2026-11-13', 8, f'''
<p class="lead">주택담보대출 한도는 두 개의 문을 동시에 통과해야 나옵니다. 하나는 <b>집값에 비해 얼마까지 빌려주느냐(LTV)</b>, 다른 하나는 <b>내 소득으로 갚을 수 있느냐(DSR)</b>입니다. 둘 중 더 작은 쪽이 실제 한도가 됩니다.</p>
<h2>1. LTV — 담보인정비율</h2>
<p>LTV(Loan To Value)는 집값 대비 대출 비율입니다. 10억 원 아파트에 LTV 40%가 적용되면 집값만 보고 빌릴 수 있는 최대 금액은 4억 원입니다. 규제지역 여부, 무주택·유주택 여부, 생애최초 구입 여부에 따라 비율이 달라지고, 정책에 따라 <b>금액 상한</b>이 따로 붙기도 합니다.</p>
<h2>2. DTI와 DSR — 소득으로 보는 한도</h2>
<p>DTI(총부채상환비율)는 연소득 대비 주택담보대출 원리금과 다른 대출의 <b>이자</b>를 봅니다. DSR(총부채원리금상환비율)은 한 걸음 더 나아가 신용대출·자동차 할부 같은 <b>모든 대출의 원금과 이자</b>를 연소득과 비교합니다. 은행권은 대출자 단위 DSR 40%가 기본 기준입니다.</p>
<table><tr><th>구분</th><th>무엇을 보나</th><th>핵심</th></tr>
<tr><td>LTV</td><td>집값</td><td>담보 가치 대비 대출 비율</td></tr>
<tr><td>DTI</td><td>소득 · 주담대 원리금 + 기타 대출 이자</td><td>주택담보대출 중심</td></tr>
<tr><td>DSR</td><td>소득 · 모든 대출 원리금</td><td>현재 가장 강력한 한도 기준</td></tr></table>
<h2>3. 숫자로 계산해 보기</h2>
<p>연소득 6,000만 원, 다른 대출 없음, 8억 원 아파트를 금리 4%, 30년 원리금균등으로 산다고 가정해 봅시다.</p>
<ul><li>LTV 40%라면 한도는 3억 2,000만 원입니다.</li>
<li>DSR 40%라면 1년 원리금 상환액이 2,400만 원을 넘으면 안 됩니다. 금리 4%·30년 기준 원리금이 연 2,400만 원이 되는 대출은 약 4억 1,900만 원입니다.</li>
<li>두 한도 중 작은 <b>3억 2,000만 원</b>이 실제 한도에 가깝습니다. 여기에 취득세·중개보수까지 더하면 필요한 현금은 약 5억 원입니다.</li></ul>
<h2>4. 스트레스 DSR이란?</h2>
<p>변동금리 대출은 앞으로 금리가 오를 수 있습니다. 그래서 DSR을 계산할 때 실제 금리에 일정 <b>가산금리(스트레스 금리)</b>를 더해 원리금을 더 크게 잡습니다. 같은 소득이라도 한도가 줄어드는 효과가 있습니다. 2025년 10·15 대책에서는 수도권·규제지역 주택담보대출의 스트레스 금리 하한을 1.5%에서 3.0%로 올리는 방안이 발표됐습니다.</p>
<p>위 예시에서 금리 4%에 스트레스 금리 3%를 더해 7%로 계산하면, 연 원리금 2,400만 원으로 감당할 수 있는 대출은 약 3억 원으로 줄어듭니다. 이번에는 DSR이 LTV보다 더 작은 한도가 됩니다.</p>
<h2>5. 한도를 늘리기보다 먼저 볼 것</h2>
<ul><li>신용대출·마이너스통장은 DSR을 잡아먹습니다. 집을 사기 전에 정리하면 주담대 한도가 늘어납니다.</li>
<li>대출 기간을 길게 하면 연 원리금이 줄어 DSR 한도는 늘지만, 총이자는 커집니다.</li>
<li>'최대한 빌릴 수 있는 금액'과 '매달 편하게 갚을 수 있는 금액'은 다릅니다. 금리가 1%p 오르면 월 상환액이 얼마나 늘지 꼭 계산해 보세요.</li></ul>
{note('<a href="/seoul/">서울 아파트 게임</a>에서 매물을 누르면 LTV·대출 한도 구간·DSR 40%를 실제로 계산해 부족한 현금을 보여줍니다. <a href="/tools/loan.html">대출 한도 계산기</a>로 내 숫자를 넣어 볼 수도 있습니다.')}{warn()}''', '대출'))

# 3 ─ 10·15 대책
ARTS.append(('policy-1015', '10·15 부동산 대책 한눈에 정리: 서울 전역 규제지역·토지거래허가', '2025년 10월 15일 발표된 주택시장 안정화 대책의 핵심(규제지역 지정, LTV 40%, 주담대 한도 6·4·2억, 실거주 의무, 갭투자 차단)을 정리합니다.', '2026-11-13', 7, f'''
<p class="lead">정부는 2025년 10월 15일 주택시장 안정화 대책을 발표하고 <b>서울 25개 구 전역과 경기 12개 지역</b>을 조정대상지역·투기과열지구로 지정했습니다. 같은 지역을 토지거래허가구역으로도 묶어, 집을 사는 방식 자체가 크게 바뀌었습니다.</p>
<h2>1. 어디가 묶였나</h2>
<p>서울 25개 구 전체, 그리고 경기 과천시·광명시·성남시(분당·수정·중원구)·수원시(영통·장안·팔달구)·안양시 동안구·용인시 수지구·의왕시·하남시가 대상입니다. 기존에는 강남·서초·송파·용산 정도만 규제지역이었던 것과 비교하면 범위가 크게 넓어졌습니다.</p>
<h2>2. 대출은 어떻게 바뀌었나</h2>
<table><tr><th>항목</th><th>내용</th></tr>
<tr><td>무주택자 LTV</td><td>70% → 40% (생애최초 구입자는 70% 유지)</td></tr>
<tr><td>유주택자</td><td>규제지역 주택담보대출 사실상 불가</td></tr>
<tr><td>주담대 금액 한도</td><td>시가 15억 원 이하 6억 원 · 15억~25억 원 4억 원 · 25억 원 초과 2억 원</td></tr>
<tr><td>스트레스 금리</td><td>수도권·규제지역 주담대 하한 1.5% → 3.0% 상향</td></tr>
<tr><td>전세대출</td><td>1주택자 전세대출 이자를 DSR에 반영, 보증비율 축소</td></tr></table>
<h2>3. 토지거래허가구역이 의미하는 것</h2>
<p>토지거래허가구역에서 아파트를 사려면 관할 구청의 허가를 받아야 하고, 허가를 받으면 <b>일정 기간 실제로 거주해야 할 의무</b>가 생깁니다. 그래서 세입자의 전세보증금을 끼고 집을 사는 이른바 '갭투자'가 사실상 막혔습니다. 집을 사려면 실거주를 전제로 자금 계획을 세워야 합니다.</p>
<h2>4. 정비사업과 분양권</h2>
<p>투기과열지구에서는 재건축·재개발 조합원 지위 양도가 제한되고, 새로 분양하는 아파트의 분양권 전매도 일정 기간 제한됩니다. 이미 조합원 지위가 생긴 정비구역에서 입주권을 사려면 양도 제한 예외에 해당하는 매물인지 꼼꼼히 확인해야 합니다. 예외에 해당하지 않으면 조합원 자격을 얻지 못하고 현금청산 대상이 될 수 있습니다.</p>
<h2>5. 실수요자가 체크할 것</h2>
<ul><li>내가 <b>생애최초 구입자</b>에 해당하는지 확인하세요. LTV가 크게 다릅니다.</li>
<li>집값 구간(15억·25억)에 따라 대출 금액 상한이 바뀝니다. 가격이 경계선 근처인 집은 특히 주의하세요.</li>
<li>보유 중인 신용대출이 있으면 규제지역 주택 구입이 제한될 수 있습니다.</li>
<li>세부 요건과 시행일, 예외 조항은 국토교통부·금융위원회 보도자료와 대출 기관에서 확인해야 합니다.</li></ul>
{note('<a href="/seoul/">나의 첫 번째 서울 아파트 구하기</a>의 <b>2026 현실 모드</b>는 이 대책의 LTV·대출 한도·실거주 의무·갭투자 금지·조합원 지위 양도 제한을 게임 규칙으로 반영했습니다. <b>역사 모드</b>에서는 2015년 완화기부터 시작해 규제가 바뀌는 과정을 차례로 겪어 볼 수 있습니다.')}{warn()}''', '정책'))

# 4 ─ 재건축 절차
ARTS.append(('rebuild-steps', '재건축은 어떻게 진행될까: 안전진단부터 입주까지 10단계', '재건축 사업의 단계별 흐름과 각 단계에서 조합원이 겪는 일, 시간이 오래 걸리는 이유를 정리합니다.', '2026-11-13', 9, f'''
<p class="lead">"재건축 들어간대"라는 말을 듣고 입주까지 10년 넘게 걸리는 경우가 흔합니다. 재건축은 수많은 동의와 인허가를 순서대로 통과해야 하는 긴 여정이기 때문입니다. 단계별로 무슨 일이 일어나는지 알면 뉴스 속 '사업시행인가', '관리처분' 같은 말이 훨씬 쉽게 들립니다.</p>
<h2>단계별 흐름</h2>
<ol>
<li><b>안전진단(재건축진단)</b> — 건물이 낡아 다시 지을 필요가 있는지 평가합니다. 구조 안전성, 주거 환경, 설비 노후도 등을 봅니다.</li>
<li><b>정비구역 지정</b> — 지자체가 정비계획을 세워 사업 구역과 용적률·층수 등 큰 틀을 정합니다.</li>
<li><b>추진위원회 구성</b> — 토지등소유자 과반수 동의로 조합 설립을 준비하는 임시 조직을 만듭니다.</li>
<li><b>조합 설립 인가</b> — 일정 비율 이상의 소유자 동의를 받아 법인인 재건축 조합이 생깁니다. 이때부터 조합장과 이사회가 사업을 이끕니다.</li>
<li><b>시공사 선정</b> — 총회에서 건설사를 고릅니다. 공사비, 설계, 브랜드를 두고 경쟁이 치열한 단계입니다.</li>
<li><b>사업시행계획 인가</b> — 건물 배치, 세대수, 기반시설 등 구체적인 설계안을 확정해 인가를 받습니다.</li>
<li><b>관리처분계획 인가</b> — 누가 어떤 집을 받고 얼마를 내거나 돌려받는지(분담금·환급금)를 확정합니다. 이 시점부터 기존 집은 <b>조합원 입주권</b>이 됩니다.</li>
<li><b>이주·철거</b> — 조합원과 세입자가 이사를 나가고 건물을 허뭅니다. 이주비 대출이 나오기도 합니다.</li>
<li><b>착공·일반분양</b> — 공사를 시작하고 조합원 몫을 뺀 나머지를 청약으로 일반분양합니다. 일반분양 수입은 사업비를 충당하는 핵심 재원입니다.</li>
<li><b>준공·입주·청산</b> — 새 아파트가 완공되면 입주하고, 이전고시와 청산을 거쳐 조합이 해산합니다.</li></ol>
<h2>왜 이렇게 오래 걸릴까</h2>
<ul><li><b>동의 문제</b>: 단계마다 소유자 동의가 필요합니다. 상가 소유자, 고령 소유자, 실거주·투자자의 이해관계가 엇갈립니다.</li>
<li><b>공사비 상승</b>: 착공 전후로 자재비·인건비가 오르면 시공사와 공사비 증액 협상이 길어지고, 분담금이 늘어납니다.</li>
<li><b>소송</b>: 조합 설립이나 관리처분계획을 두고 무효 소송이 제기되면 사업이 몇 년씩 멈추기도 합니다.</li>
<li><b>정책 변화</b>: 안전진단 기준, 초과이익 환수, 분양가 규제가 바뀔 때마다 사업성이 달라집니다.</li></ul>
<h2>조합원이 꼭 알아야 할 두 숫자</h2>
<p>재건축의 손익은 <b>비례율</b>과 <b>분담금</b>으로 요약됩니다. 비례율은 사업이 끝났을 때 남는 가치를 종전 자산 대비 비율로 나타낸 값이고, 분담금은 새 집 조합원 분양가에서 내 권리가액을 뺀 금액입니다. 자세한 계산은 <a href="/learn/proportional-rate.html">비례율과 분담금 계산법</a>에서 다룹니다.</p>
{note('<a href="/johapjang/">재건축 조합장 키우기</a>에서는 직접 조합장이 되어 동의서 받기, 시공사 선정, 공사비 협상, 해임총회 위기를 거쳐 입주까지 사업을 이끌어 봅니다.')}{warn()}''', '정비사업'))

# 5 ─ 비례율 분담금
ARTS.append(('proportional-rate', '비례율과 분담금 계산법: 내가 얼마를 더 내야 할까', '재건축·재개발 조합원 분담금을 좌우하는 비례율, 권리가액, 조합원 분양가의 관계를 예시 숫자로 계산합니다.', '2026-11-13', 7, f'''
<p class="lead">재건축·재개발 조합원이 새 아파트를 받을 때 얼마를 더 내는지(분담금), 혹은 돌려받는지(환급금)는 세 개의 숫자로 결정됩니다. <b>종전자산 평가액, 비례율, 조합원 분양가</b>입니다.</p>
<h2>1. 비례율</h2>
<p>비례율은 사업이 얼마나 남는 장사인지를 보여 주는 지표입니다.</p>
<p class="formula">비례율 = (사업 완료 후 총수입 − 총사업비) ÷ 종전자산 평가총액 × 100</p>
<p>총수입은 조합원 분양 수입과 일반분양 수입을 합한 값이고, 총사업비에는 공사비·금융비용·각종 용역비와 보상비가 들어갑니다. 일반분양가가 높거나 공사비가 낮으면 비례율이 올라가고, 반대면 내려갑니다.</p>
<h2>2. 권리가액</h2>
<p class="formula">권리가액 = 내 종전자산 감정평가액 × 비례율</p>
<p>내 집이 감정평가로 8억 원을 받았고 비례율이 110%라면 권리가액은 8억 8,000만 원입니다. 비례율이 90%로 떨어지면 7억 2,000만 원이 됩니다. 같은 집이라도 사업성에 따라 1억 6,000만 원 차이가 납니다.</p>
<h2>3. 분담금</h2>
<p class="formula">분담금 = 조합원 분양가 − 권리가액</p>
<table><tr><th>시나리오</th><th>비례율</th><th>권리가액</th><th>조합원 분양가(84㎡)</th><th>분담금</th></tr>
<tr><td>사업성 좋음</td><td>115%</td><td>9억 2,000만 원</td><td>11억 원</td><td>1억 8,000만 원</td></tr>
<tr><td>보통</td><td>100%</td><td>8억 원</td><td>11억 원</td><td>3억 원</td></tr>
<tr><td>공사비 급등</td><td>85%</td><td>6억 8,000만 원</td><td>11억 5,000만 원</td><td>4억 7,000만 원</td></tr></table>
<p>(종전자산 감정가 8억 원 가정, 모든 수치는 설명을 위한 예시)</p>
<p>공사비가 올라 비례율이 떨어지고 조합원 분양가까지 오르면 분담금이 두 방향에서 동시에 커집니다. 뉴스에서 "분담금 폭탄"이라는 말이 나오는 이유입니다.</p>
<h2>4. 투자 관점에서 기억할 점</h2>
<ul><li>입주권 가격에는 이미 예상 분담금이 반영돼 있습니다. 매수 후 분담금이 더 늘면 그 부담은 새 주인이 집니다.</li>
<li>사업 기간이 늘어나면 금융비용이 쌓여 비례율이 떨어집니다. 시간 자체가 비용입니다.</li>
<li>관리처분 이후에도 공사비 협상 결과에 따라 분담금이 바뀔 수 있습니다.</li></ul>
{note('<a href="/johapjang/">재건축 조합장 키우기</a>의 재무 화면에서 공사비·금융비용·일반분양 수입을 바꿔 가며 비례율과 분담금이 어떻게 움직이는지 볼 수 있습니다. <a href="/tools/proportion.html">비례율·분담금 계산기</a>도 준비했습니다.')}{warn()}''', '정비사업'))

# 6 ─ 분양권 vs 입주권
ARTS.append(('bunyang-vs-ipju', '분양권과 입주권, 뭐가 다를까', '청약으로 얻는 분양권과 정비사업 조합원이 받는 입주권의 차이를 취득 방법, 필요한 돈, 세금, 위험 요소별로 비교합니다.', '2026-11-13', 6, f'''
<p class="lead">둘 다 "앞으로 새 아파트에 들어갈 수 있는 권리"지만, 어디서 생겼는지가 다릅니다. <b>분양권</b>은 청약에 당첨되거나 그 권리를 산 경우, <b>입주권</b>은 재건축·재개발 조합원이 관리처분계획 인가를 받으며 갖게 되는 권리입니다.</p>
<h2>한눈에 비교</h2>
<table><tr><th>구분</th><th>분양권</th><th>입주권</th></tr>
<tr><td>생기는 방법</td><td>청약 당첨, 또는 전매로 매수</td><td>기존 주택 소유 → 관리처분인가로 전환, 또는 매수</td></tr>
<tr><td>초기 비용</td><td>계약금(보통 분양가의 10% 안팎) + 프리미엄</td><td>권리가액 + 프리미엄 (목돈이 큼)</td></tr>
<tr><td>추가 비용</td><td>중도금(대출 승계 가능 여부 확인), 잔금</td><td>분담금(사업 진행 중 늘어날 수 있음)</td></tr>
<tr><td>일정</td><td>입주 시기가 비교적 명확</td><td>사업 지연에 따라 입주 시기가 크게 변동</td></tr>
<tr><td>주요 위험</td><td>잔금대출 부족, 전매제한</td><td>분담금 증가, 소송·지연, 조합원 지위 승계 불가</td></tr></table>
<h2>세금에서 다른 점</h2>
<p>양도소득세에서 입주권은 원래부터 주택 수에 포함되고, 분양권은 2021년 1월 1일 이후 취득분부터 주택 수에 포함됩니다. 짧게 보유하고 팔 때 세율도 높습니다. 분양권은 1년 미만 70%, 그 이후 60%의 단기 세율이 적용되고, 주택과 입주권은 1년 미만 70%, 2년 미만 60%가 적용됩니다. 세부 요건은 국세청 안내로 확인하세요.</p>
<h2>규제 지역에서 특히 조심할 것</h2>
<ul><li>규제지역에서 새로 분양한 아파트는 일정 기간 분양권 전매가 제한됩니다. 잔금을 마련할 계획이 없다면 당첨이 오히려 부담이 될 수 있습니다.</li>
<li>투기과열지구 정비사업은 조합원 지위 양도가 제한됩니다. 예외 요건(장기 보유·거주 1주택자 매물 등)에 해당하지 않는 입주권을 사면 현금청산될 수 있습니다.</li></ul>
{note('<a href="/seoul/">서울 아파트 게임</a>에는 서울원 아이파크·마포자이힐스테이트 라첼스 등 분양권과 한남3·노량진3구역 입주권이 등장합니다. 입주권은 임장으로 권리를 검증하지 않으면 현금청산 엔딩을 맞을 수 있습니다.')}{warn()}''', '정비사업'))

# 7 ─ 취득세
ARTS.append(('acquisition-tax', '아파트 취득세 계산법: 1주택 1~3%, 다주택 중과까지', '주택 가격 구간과 보유 주택 수, 조정대상지역 여부에 따라 달라지는 취득세율을 표와 예시로 정리합니다.', '2026-11-13', 6, f'''
<p class="lead">집을 살 때 매매가 외에 가장 크게 드는 비용이 취득세입니다. 세율은 <b>집값</b>과 <b>취득 후 주택 수</b>, 그리고 <b>조정대상지역 여부</b>에 따라 달라집니다.</p>
<h2>1. 1주택(무주택자가 한 채 살 때)</h2>
<table><tr><th>취득가액</th><th>취득세율</th></tr>
<tr><td>6억 원 이하</td><td>1%</td></tr>
<tr><td>6억 원 초과 ~ 9억 원 이하</td><td>1~3% (가격에 비례해 구간 내에서 올라감)</td></tr>
<tr><td>9억 원 초과</td><td>3%</td></tr></table>
<p>6억~9억 원 구간은 계단식이 아니라 가격에 따라 세율이 조금씩 올라가는 방식입니다. 예를 들어 7억 5,000만 원이면 2% 안팎이 적용됩니다.</p>
<h2>2. 다주택 중과</h2>
<table><tr><th>취득 후 주택 수</th><th>조정대상지역</th><th>비조정지역</th></tr>
<tr><td>2주택</td><td>8%</td><td>1~3%</td></tr>
<tr><td>3주택</td><td>12%</td><td>8%</td></tr>
<tr><td>4주택 이상</td><td>12%</td><td>12%</td></tr></table>
<p>일시적 2주택(이사 등으로 기존 집을 일정 기간 안에 처분하는 경우)은 중과에서 제외될 수 있습니다. 2025년 10·15 대책으로 서울 전역이 조정대상지역이 된 만큼, 서울에서 두 번째 집을 사면 8% 세율이 적용될 수 있습니다.</p>
<h2>3. 세율 외에 붙는 것</h2>
<p>취득세에는 지방교육세가 함께 붙고, 전용 85㎡를 넘는 주택은 농어촌특별세도 붙습니다. 실제 부담액은 표의 세율보다 조금 높습니다. 정확한 금액은 행정안전부 <a href="https://www.wetax.go.kr" rel="nofollow noopener" target="_blank">위택스</a> 계산기로 확인하세요.</p>
<h2>4. 예시</h2>
<ul><li>무주택자가 5억 원 아파트 구입: 취득세 약 500만 원(1%)</li>
<li>무주택자가 12억 원 아파트 구입: 취득세 약 3,600만 원(3%)</li>
<li>서울(조정대상지역)에 이미 1주택이 있는 사람이 10억 원 아파트 추가 구입: 약 8,000만 원(8%)</li></ul>
<h2>5. 생애최초 감면</h2>
<p>생애최초로 주택을 사는 경우 일정 요건을 갖추면 취득세를 최대 200만 원까지 감면받는 제도가 있습니다. 적용 기한과 가격 요건은 개정될 수 있으니 구입 시점에 위택스나 관할 구청에서 확인하세요.</p>
{note('<a href="/seoul/">서울 아파트 게임</a>은 매수 화면에서 취득세(1~3%, 다주택 8·12%)를 자동 계산해 필요한 현금에 포함합니다. <a href="/tools/acqtax.html">취득세 계산기</a>로 미리 계산해 볼 수 있습니다.')}{warn()}''', '세금'))

# 8 ─ 1주택 비과세
ARTS.append(('one-house-exemption', '1세대 1주택 양도세 비과세 조건 정리', '2년 보유·2년 거주 요건, 12억 원 초과분 과세, 장기보유특별공제까지 1주택자가 집을 팔 때 알아야 할 핵심을 정리합니다.', '2026-11-13', 6, f'''
<p class="lead">집을 팔아 차익이 생기면 양도소득세를 냅니다. 하지만 <b>1세대 1주택</b> 요건을 갖추면 일정 금액까지 세금을 내지 않습니다. 실수요자에게 가장 중요한 절세 제도입니다.</p>
<h2>1. 기본 요건</h2>
<ul><li><b>1세대가 집 한 채만</b> 가지고 있을 것 (일시적 2주택 등 예외 있음)</li>
<li><b>2년 이상 보유</b>할 것</li>
<li>취득 당시 그 집이 <b>조정대상지역</b>이었다면 <b>2년 이상 거주</b>도 해야 함 (2017년 8월 3일 이후 취득분)</li></ul>
<h2>2. 12억 원 초과분은 과세</h2>
<p>요건을 채워도 양도가액이 12억 원을 넘으면 넘는 비율만큼의 차익에는 세금이 붙습니다. 예를 들어 15억 원에 팔아 차익이 5억 원이라면, 5억 원 × (15억 − 12억) ÷ 15억 = 1억 원이 과세 대상 차익이 됩니다.</p>
<h2>3. 장기보유특별공제</h2>
<p>과세 대상 차익이 생긴 1세대 1주택자는 보유 기간과 거주 기간에 따라 각각 연 4%씩, 최대 80%(보유 40% + 거주 40%)까지 공제를 받을 수 있습니다. 오래 보유하고 오래 살수록 세금이 크게 줄어듭니다.</p>
<h2>4. 단기 매도는 세율이 높다</h2>
<p>보유 기간이 짧으면 일반 세율보다 훨씬 높은 세율이 적용됩니다. 주택은 1년 미만 70%, 2년 미만 60%입니다. 실거주로 산 집이라도 2년을 채우기 전에 팔면 차익의 상당 부분이 세금으로 나갈 수 있습니다.</p>
<h2>5. 갈아타기할 때 체크리스트</h2>
<ul><li>새 집을 먼저 사면 일시적 2주택이 됩니다. 기존 집을 정해진 기간 안에 팔아야 비과세를 지킬 수 있습니다.</li>
<li>토지거래허가구역에서는 산 집에 실거주 의무가 있어, 이사 순서와 시기를 미리 계획해야 합니다.</li>
<li>세부 요건은 개인 상황마다 다르니 국세청 홈택스 안내와 세무 전문가 상담을 권합니다.</li></ul>
{note('<a href="/seoul/">서울 아파트 게임</a>에서는 2년 보유·실거주를 채운 1주택자는 12억 원까지 비과세, 그 외에는 보유 기간과 주택 수에 따라 양도세가 계산됩니다. 갈아타기 엔딩을 노린다면 이 규칙이 핵심입니다.')}{warn()}''', '세금'))

# 9 ─ 전세가율·역전세
ARTS.append(('jeonse-risk', '전세가율, 역전세, 깡통전세: 갭투자의 위험 이해하기', '전세가율이 무엇이고 왜 갭투자의 핵심 변수인지, 전셋값이 떨어질 때 집주인과 세입자에게 어떤 일이 생기는지 정리합니다.', '2026-11-13', 7, f'''
<p class="lead">전세는 집주인이 세입자에게 큰 보증금을 받고 집을 빌려주는 우리나라 특유의 제도입니다. 이 보증금을 활용해 적은 돈으로 집을 사는 방식이 <b>갭투자</b>이고, 갭투자의 성패는 <b>전세가율</b>에 달려 있습니다.</p>
<h2>1. 전세가율</h2>
<p class="formula">전세가율 = 전세 시세 ÷ 매매 시세 × 100</p>
<p>매매 10억 원, 전세 6억 원이면 전세가율은 60%입니다. 이 집을 전세를 끼고 사면 필요한 돈은 4억 원과 취득세 등 부대비용입니다. 전세가율이 높을수록 적은 돈으로 살 수 있지만, 그만큼 집값이 조금만 떨어져도 위험해집니다.</p>
<h2>2. 역전세 — 전셋값이 떨어질 때</h2>
<p>2년 뒤 계약 만기에 전세 시세가 6억 원에서 5억 원으로 내려갔다고 해 봅시다. 새 세입자에게는 5억 원만 받을 수 있는데, 기존 세입자에게는 6억 원을 돌려줘야 합니다. 집주인은 <b>1억 원을 직접 마련</b>해야 합니다. 이것이 역전세입니다. 현금이 없으면 대출을 받거나 집을 급하게 팔아야 하고, 그래도 안 되면 보증금을 제때 돌려주지 못하는 사고로 이어집니다.</p>
<h2>3. 깡통전세</h2>
<p>집값이 떨어져 매매가가 전세보증금과 대출을 합친 금액보다 낮아진 집을 흔히 '깡통전세'라고 부릅니다. 이 경우 집을 팔아도 보증금을 다 돌려줄 수 없어 세입자가 큰 피해를 볼 수 있습니다.</p>
<h2>4. 세입자가 지킬 수 있는 것</h2>
<ul><li>계약 전 등기부등본으로 선순위 대출(근저당)을 확인하세요.</li>
<li>전세가율이 지나치게 높은 집은 피하는 것이 안전합니다.</li>
<li>전입신고와 확정일자를 바로 받아 대항력과 우선변제권을 확보하세요.</li>
<li>주택도시보증공사(HUG) 등의 전세보증금 반환보증 가입을 검토하세요.</li></ul>
<h2>5. 지금은 갭투자가 가능할까?</h2>
<p>2025년 10·15 대책으로 서울 전역이 토지거래허가구역이 되면서, 서울 아파트를 사면 실거주해야 해 전세를 끼고 사는 방식은 사실상 막혔습니다. 규제 상황은 바뀔 수 있으니 거래 시점의 규정을 확인해야 합니다.</p>
{note('<a href="/seoul/">서울 아파트 게임</a>의 역사 모드(2015년 시작)에서는 갭투자가 합법이던 시기를 직접 겪어 볼 수 있습니다. 2년마다 전세 재계약이 돌아오고, 전셋값이 떨어지면 차액을 돌려줘야 해 "전세가 폭락 생존자" 같은 엔딩으로 이어집니다.')}{warn()}''', '전월세'))

# 10 ─ 첫 집 자금계획
ARTS.append(('first-home-plan', '사회초년생 첫 집 마련 자금 계획, 숫자로 따라 해 보기', '연봉 4,800만 원, 현금 5,000만 원에서 시작하는 직장인이 서울에 첫 집을 마련하려면 무엇을 얼마나 준비해야 하는지 단계별로 계산합니다.', '2026-11-13', 8, f'''
<p class="lead">"언제쯤 서울에 집을 살 수 있을까?" 막연한 질문을 숫자로 바꾸면 답이 보입니다. 연봉 4,800만 원, 모은 돈 5,000만 원인 29세 직장인을 예로 계산해 봅니다. (모든 수치는 설명을 위한 가정입니다.)</p>
<h2>1단계: 매달 얼마를 모을 수 있나</h2>
<p>세후 월급을 약 330만 원으로 잡고 월세 85만 원과 생활비 170만 원을 쓰면 한 달에 75만 원, 1년에 약 900만 원을 모읍니다. 5년이면 원금만 4,500만 원으로, 지금 가진 돈과 합쳐 약 9,500만 원이 됩니다. 연봉이 오르고 지출을 줄이면 이 숫자는 더 커집니다.</p>
<h2>2단계: 살 수 있는 집의 가격대</h2>
<p>생애최초 구입자는 규제지역에서도 LTV 70%를 적용받을 수 있습니다. 하지만 소득이 낮으면 DSR이 먼저 한도를 막습니다. 연소득 4,800만 원이면 DSR 40% 기준 연 원리금 상환 가능액은 1,920만 원이고, 금리 4%에 스트레스 금리를 더해 계산하면 대출 가능액은 약 2억 4,000만~3억 원 수준입니다.</p>
<table><tr><th>집값</th><th>대출(가정)</th><th>취득세·부대비용</th><th>필요한 현금</th></tr>
<tr><td>5억 원</td><td>2억 7,000만 원</td><td>약 800만 원</td><td>약 2억 3,800만 원</td></tr>
<tr><td>7억 원</td><td>2억 7,000만 원</td><td>약 1,800만 원</td><td>약 4억 4,800만 원</td></tr></table>
<p>5억 원대 아파트도 현금 2억 원 이상이 필요합니다. 9,500만 원으로는 아직 부족합니다.</p>
<h2>3단계: 격차를 줄이는 방법</h2>
<ul><li><b>소득을 늘리기</b>: 연봉이 오르면 저축과 DSR 한도가 동시에 커집니다. 맞벌이는 가구 소득 기준으로 한도가 크게 늘어납니다.</li>
<li><b>주거비 줄이기</b>: 월세를 전세(전세대출 활용)로 바꾸면 매달 나가는 돈이 줄어 저축이 늘어날 수 있습니다. 다만 보증금 반환 위험도 함께 따져야 합니다.</li>
<li><b>청약 준비</b>: 청약통장을 꾸준히 유지하고, 결혼·출산 시 특별공급 자격을 챙기세요.</li>
<li><b>목표 지역 넓히기</b>: 같은 돈이라도 지역과 연식, 면적에 따라 선택지가 달라집니다.</li></ul>
<h2>4단계: 무리하지 않는 기준</h2>
<p>대출 한도를 끝까지 쓰면 금리가 1~2%p만 올라도 생활이 흔들립니다. 월 원리금이 세후 월급의 30~40%를 넘지 않는지, 6개월치 생활비 비상금이 남는지 확인하세요.</p>
{note('이 글의 시작 조건이 바로 <a href="/seoul/">나의 첫 번째 서울 아파트 구하기</a>의 기본 설정입니다. 20년 동안 저축·이직·결혼·청약·대출을 선택하며 직접 첫 집 마련에 도전해 보세요.')}{warn()}''', '내 집 마련'))

TAGS = ['청약', '대출', '정책', '정비사업', '세금', '전월세', '내 집 마련']

def build_articles():
    urls = []
    for i, (slug, title, desc, date, mins, body, tag) in enumerate(ARTS):
        prev_ = ARTS[i - 1] if i > 0 else None
        next_ = ARTS[i + 1] if i + 1 < len(ARTS) else None
        rel = ''.join(f'<li><a href="/learn/{a[0]}.html">{e(a[1])}</a></li>' for a in ARTS if a[6] == tag and a[0] != slug) or ''
        pn = '<div class="pn">' + (f'<a href="/learn/{prev_[0]}.html">← {e(prev_[1])}</a>' if prev_ else '<span></span>') + (f'<a href="/learn/{next_[0]}.html">{e(next_[1])} →</a>' if next_ else '<span></span>') + '</div>'
        ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": title, "description": desc, "datePublished": date, "dateModified": TODAY, "author": {"@type": "Person", "name": "강병곤"}, "publisher": {"@type": "Organization", "name": "aptgame.kr"}, "mainEntityOfPage": f"{SITE}/learn/{slug}.html", "inLanguage": "ko"}, ensure_ascii=False)
        full = f'<p class="crumb"><a href="/learn/">부동산 공부</a> › {tag}</p><h1>{e(title)}</h1>{meta(date, mins)}{body}' + (f'<h2>함께 읽으면 좋은 글</h2><ul>{rel}</ul>' if rel else '') + pn
        urls.append(page(f'learn/{slug}.html', title, desc, full, '/learn/', extra_head=f'<script type="application/ld+json">{ld}</script>'))
    cards = ''.join(f'<a class="lcard" href="/learn/{a[0]}.html"><span class="ltag">{a[6]}</span><b>{e(a[1])}</b><small>{e(a[2])}</small><i>읽는 데 약 {a[4]}분</i></a>' for a in ARTS)
    body = f'''<h1>📚 부동산 공부</h1><p class="lead">게임을 하다 보면 궁금해지는 LTV, DSR, 청약 가점, 비례율, 취득세, 전세가율 같은 개념을 쉬운 말과 예시 숫자로 정리했습니다. 각 글은 공개된 법령과 정부 발표를 바탕으로 작성했고, 마지막에는 해당 개념을 직접 체험해 볼 수 있는 게임과 계산기를 연결해 두었습니다.</p>
    <div class="toc">{''.join(f'<span>#{t}</span>' for t in TAGS)}</div><div class="lgrid">{cards}</div>
    <h2>🧮 함께 쓰면 좋은 계산기</h2><ul><li><a href="/tools/cheongyak.html">청약 가점 계산기</a></li><li><a href="/tools/loan.html">주택담보대출 한도 계산기 (LTV·DSR)</a></li><li><a href="/tools/acqtax.html">아파트 취득세 계산기</a></li><li><a href="/tools/proportion.html">재건축 비례율·분담금 계산기</a></li></ul>{warn()}'''
    urls.append(page('learn/index.html', '부동산 공부 — 청약·대출·세금·재건축 기초 가이드', '청약 가점, LTV·DSR, 10·15 대책, 재건축 절차, 비례율, 분양권·입주권, 취득세, 1주택 비과세, 전세가율, 첫 집 자금 계획을 쉽게 정리한 부동산 기초 가이드.', body, '/learn/', kind='website'))
    return urls

# ---------------- 계산기 ----------------
def tool(slug, title, desc, intro, form, js, explain):
    body = f'''<p class="crumb"><a href="/tools/">계산기</a></p><h1>{e(title)}</h1><p class="lead">{intro}</p>
    <div class="calc">{form}<div class="res" id="res"></div></div>
    {explain}{warn()}<script>{js}</script>'''
    return page(f'tools/{slug}.html', title, desc, body, '/tools/')

def build_tools():
    urls = []
    urls.append(tool('cheongyak', '청약 가점 계산기', '무주택기간, 부양가족 수, 청약통장 가입기간을 입력하면 청약 가점(84점 만점)을 바로 계산합니다.',
        '세 가지 항목만 입력하면 아파트 청약 가점제 점수를 계산합니다. 무주택기간은 만 30세(그 전에 혼인했다면 혼인신고일)부터 계산합니다.',
        '''<label>무주택기간 <select id="h"><option value="0">무주택자 아님(유주택)</option><option value="1" selected>1년 미만</option>''' + ''.join(f'<option value="{y+1}">{y}년 이상 {y+1}년 미만</option>' for y in range(1, 15)) + '''<option value="16">15년 이상</option></select></label>
        <label>부양가족 수 (본인 제외) <select id="f">''' + ''.join(f'<option value="{n}">{n}명{" 이상" if n == 6 else ""}</option>' for n in range(7)) + '''</select></label>
        <label>청약통장 가입기간 <select id="a"><option value="0">6개월 미만</option><option value="1">6개월 이상 1년 미만</option>''' + ''.join(f'<option value="{y+1}">{y}년 이상 {y+1}년 미만</option>' for y in range(1, 15)) + '''<option value="16" selected>15년 이상</option></select></label>''',
        '''function c(){const h=+document.getElementById('h').value,f=+document.getElementById('f').value,a=+document.getElementById('a').value;
        const hs=h===0?0:Math.min(32,h*2), fs=Math.min(35,5+f*5), as=a===0?1:a===1?2:Math.min(17,a+1);
        const t=hs+fs+as; document.getElementById('res').innerHTML=`<div class="big">${t}<small>/84점</small></div><table><tr><td>무주택기간</td><td>${hs}/32</td></tr><tr><td>부양가족</td><td>${fs}/35</td></tr><tr><td>통장 가입기간</td><td>${as}/17</td></tr></table><p>${t>=65?'서울 인기 단지 가점제도 노려볼 만한 점수입니다.':t>=50?'중간 수준입니다. 비인기 평형이나 외곽 단지, 특별공급을 함께 검토해 보세요.':'가점제만으로는 쉽지 않습니다. 추첨제 물량과 특별공급 자격을 확인해 보세요.'}</p>`;}
        document.querySelectorAll('select').forEach(s=>s.onchange=c);c();''',
        '<h2>점수 계산 기준</h2><p>무주택기간 1년 미만 2점에서 1년마다 2점씩(최대 32점), 부양가족 0명 5점에서 1명마다 5점씩(최대 35점), 청약통장 6개월 미만 1점·6개월~1년 2점에서 1년마다 1점씩(최대 17점)입니다. 자세한 설명은 <a href="/learn/cheongyak-gajeom.html">청약 가점 84점 만점, 내 점수 계산하는 법</a>을 참고하세요.</p>'))
    urls.append(tool('loan', '주택담보대출 한도 계산기 (LTV·DSR)', '집값, 연소득, 금리, 기존 대출을 넣으면 LTV 한도와 DSR 40% 한도 중 실제 대출 가능액과 필요한 현금을 계산합니다.',
        'LTV(집값 기준)와 DSR(소득 기준) 두 한도를 동시에 계산해 더 작은 쪽을 예상 한도로 보여 줍니다. 스트레스 금리를 넣으면 금리 상승을 감안한 보수적인 한도를 볼 수 있습니다.',
        '''<label>집값 (억 원) <input id="p" type="number" step="0.1" value="8"></label><label>연소득 (만 원, 부부 합산 가능) <input id="i" type="number" value="6000"></label>
        <label>LTV <select id="l"><option value="0.4">40% (규제지역 무주택)</option><option value="0.7">70% (생애최초)</option><option value="0.5">50%</option><option value="0.7">70% (비규제)</option></select></label>
        <label>대출 금리 (%) <input id="r" type="number" step="0.1" value="4"></label><label>스트레스 금리 (%p) <input id="s" type="number" step="0.5" value="3"></label>
        <label>대출 기간 <select id="y"><option>30</option><option>40</option><option>20</option></select></label><label>기존 대출 연 원리금 (만 원) <input id="o" type="number" value="0"></label>
        <label><input type="checkbox" id="cap" checked> 수도권·규제지역 금액 한도 적용 (15억 이하 6억·25억 이하 4억·초과 2억)</label>''',
        '''const v=id=>+document.getElementById(id).value;function pmt(P,r,n){r=r/1200;n=n*12;return P*r/(1-Math.pow(1+r,-n))*12;}
        function c(){const p=v('p'),inc=v('i')/10000,l=v('l'),r=v('r'),s=v('s'),y=v('y'),o=v('o')/10000;let ltv=p*l;if(document.getElementById('cap').checked){const cap=p<=15?6:p<=25?4:2;ltv=Math.min(ltv,cap);}
        const room=Math.max(0,inc*.4-o);let lo=0,hi=50;for(let k=0;k<50;k++){const m=(lo+hi)/2;if(pmt(m,r+s,y)<=room)lo=m;else hi=m;}const dsr=lo,lim=Math.min(ltv,dsr);
        const tax=p*(p<=6?.01:p<=9?(p*2/3-3)/100:.03),fee=p*.004,need=p+tax+fee-lim,mon=pmt(lim,r,y)/12*10000;
        const f=x=>x>=1?(Math.round(x*100)/100)+'억 원':Math.round(x*10000).toLocaleString()+'만 원';
        document.getElementById('res').innerHTML=`<div class="big">${f(lim)}<small> 예상 한도</small></div><table><tr><td>LTV 기준 한도</td><td>${f(ltv)}</td></tr><tr><td>DSR 40% 기준 한도</td><td>${f(dsr)}</td></tr><tr><td>취득세(1주택 기준)·중개보수</td><td>${f(tax+fee)}</td></tr><tr><td><b>필요한 내 현금</b></td><td><b>${f(need)}</b></td></tr><tr><td>예상 월 상환액 (원리금균등)</td><td>${Math.round(mon).toLocaleString()}만 원</td></tr></table><p>${dsr<ltv?'소득(DSR)이 한도를 막고 있습니다. 기존 대출을 줄이거나 소득이 늘면 한도가 커집니다.':'집값(LTV) 기준 한도가 더 작습니다. 이 경우 소득이 늘어도 한도는 그대로입니다.'}</p>`;}
        document.querySelectorAll('input,select').forEach(s=>s.oninput=c);c();''',
        '<h2>계산 방식</h2><p>DSR은 모든 대출의 연간 원리금이 연소득의 40%를 넘지 않는 범위에서, 금리에 스트레스 금리를 더한 원리금균등 상환액으로 역산했습니다. 실제 은행 심사는 신용점수, 대출 종류, 상품별 우대 조건에 따라 달라집니다. 개념 설명은 <a href="/learn/ltv-dsr.html">LTV·DTI·DSR 차이</a>를 참고하세요.</p>'))
    urls.append(tool('acqtax', '아파트 취득세 계산기', '취득가액과 취득 후 주택 수, 조정대상지역 여부를 넣으면 주택 취득세율과 금액을 계산합니다.',
        '취득가액과 보유 주택 수를 넣으면 주택 취득세(본세)를 계산합니다. 지방교육세·농어촌특별세와 감면은 포함하지 않은 간이 계산입니다.',
        '''<label>취득가액 (억 원) <input id="p" type="number" step="0.1" value="7.5"></label><label>취득 후 주택 수 <select id="n"><option value="1">1주택</option><option value="2">2주택</option><option value="3">3주택</option><option value="4">4주택 이상</option></select></label><label><input type="checkbox" id="adj" checked> 조정대상지역 (2025.10.16~ 서울 전역)</label>''',
        '''function c(){const p=+document.getElementById('p').value,n=+document.getElementById('n').value,adj=document.getElementById('adj').checked;let r;
        if(n===1||(n===2&&!adj)) r=p<=6?1:p<=9?Math.round((p*2/3-3)*100)/100:3; else if(n===2) r=8; else if(n===3) r=adj?12:8; else r=12;
        const t=p*r/100;document.getElementById('res').innerHTML=`<div class="big">${t>=1?(Math.round(t*100)/100)+'억':Math.round(t*10000).toLocaleString()+'만'} 원<small> 취득세(본세)</small></div><p>적용 세율 <b>${r}%</b>. 지방교육세와 85㎡ 초과 주택의 농어촌특별세가 추가로 붙습니다.</p>`;}
        document.querySelectorAll('input,select').forEach(s=>s.oninput=c);c();''',
        '<h2>세율 기준</h2><p>1주택은 6억 원 이하 1%, 6억~9억 원 1~3%(가격에 비례), 9억 원 초과 3%입니다. 조정대상지역에서 2주택 8%, 3주택 이상 12%, 비조정지역은 3주택 8%, 4주택 이상 12%입니다. 일시적 2주택 등 예외는 반영하지 않았습니다. 자세한 내용은 <a href="/learn/acquisition-tax.html">아파트 취득세 계산법</a>을 참고하세요.</p>'))
    urls.append(tool('proportion', '재건축 비례율·분담금 계산기', '총수입, 총사업비, 종전자산 총액, 내 감정평가액, 조합원 분양가를 넣으면 비례율·권리가액·분담금을 계산합니다.',
        '정비사업의 비례율과 내 권리가액, 분담금(또는 환급금)을 계산합니다. 조합 총회 자료나 기사에 나온 숫자를 넣어 보세요.',
        '''<label>총수입 (조합원+일반분양, 억 원) <input id="rv" type="number" value="12000"></label><label>총사업비 (억 원) <input id="ct" type="number" value="7000"></label><label>종전자산 평가총액 (억 원) <input id="bt" type="number" value="5000"></label><label>내 종전자산 감정평가액 (억 원) <input id="me" type="number" step="0.1" value="8"></label><label>조합원 분양가 (억 원) <input id="up" type="number" step="0.1" value="11"></label>''',
        '''const v=id=>+document.getElementById(id).value;function c(){const ratio=(v('rv')-v('ct'))/v('bt')*100,right=v('me')*ratio/100,d=v('up')-right;
        document.getElementById('res').innerHTML=`<div class="big">${ratio.toFixed(1)}%<small> 비례율</small></div><table><tr><td>내 권리가액</td><td>${right.toFixed(2)}억 원</td></tr><tr><td>${d>=0?'분담금 (더 낼 돈)':'환급금 (돌려받을 돈)'}</td><td><b>${Math.abs(d).toFixed(2)}억 원</b></td></tr></table><p>공사비가 10% 오르면 비례율은 ${((v('rv')-v('ct')*1.1)/v('bt')*100).toFixed(1)}%, 분담금은 ${(v('up')-v('me')*(v('rv')-v('ct')*1.1)/v('bt')).toFixed(2)}억 원이 됩니다.</p>`;}
        document.querySelectorAll('input').forEach(s=>s.oninput=c);c();''',
        '<h2>계산식</h2><p>비례율 = (총수입 − 총사업비) ÷ 종전자산 평가총액 × 100, 권리가액 = 내 감정평가액 × 비례율, 분담금 = 조합원 분양가 − 권리가액입니다. 자세한 설명은 <a href="/learn/proportional-rate.html">비례율과 분담금 계산법</a>을 참고하세요.</p>'))
    body = '''<h1>🧮 부동산 계산기</h1><p class="lead">집을 알아볼 때 자주 필요한 계산을 바로 해 볼 수 있도록 만들었습니다. 입력값은 서버로 전송되지 않고 내 브라우저 안에서만 계산됩니다.</p>
    <div class="lgrid"><a class="lcard" href="/tools/cheongyak.html"><span class="ltag">청약</span><b>청약 가점 계산기</b><small>무주택기간·부양가족·통장 기간으로 84점 만점 가점 계산</small></a>
    <a class="lcard" href="/tools/loan.html"><span class="ltag">대출</span><b>대출 한도 계산기 (LTV·DSR)</b><small>집값 한도와 소득 한도 중 실제 한도, 필요한 현금, 월 상환액</small></a>
    <a class="lcard" href="/tools/acqtax.html"><span class="ltag">세금</span><b>아파트 취득세 계산기</b><small>가격 구간·주택 수·조정대상지역별 취득세율</small></a>
    <a class="lcard" href="/tools/proportion.html"><span class="ltag">정비사업</span><b>비례율·분담금 계산기</b><small>재건축·재개발 권리가액과 분담금, 공사비 상승 시나리오</small></a></div>''' + warn()
    urls.append(page('tools/index.html', '부동산 계산기 — 청약 가점·대출 한도·취득세·분담금', '청약 가점, 주택담보대출 한도(LTV·DSR), 아파트 취득세, 재건축 비례율·분담금을 바로 계산하는 무료 부동산 계산기 모음.', body, '/tools/', kind='website'))
    return urls

# ---------------- 게임 가이드 · 소식 · 소개 ----------------
def build_guides():
    urls = []
    import re
    src = open('/home/claude/budongsan-gonghwaguk/src/seoul/endings.js', encoding='utf-8').read()
    ends = re.findall(r"(e\d+): \{ p: (\d), ic: '([^']+)', t: '([^']+)', d: '([^']+)'", src)
    parts = {'1': '🏆 부동산 성공 엔딩', '2': '🌱 특별한 인생 엔딩', '3': '♟️ 투자 전략·역전 엔딩', '4': '💥 실패·위기 엔딩'}
    etab = ''
    for pt in '1234':
        etab += f'<h3>{parts[pt]}</h3><table><tr><th>번호</th><th>엔딩</th><th>달성 조건</th></tr>' + ''.join(f'<tr><td>{k[1:]}</td><td>{ic} {e(t)}</td><td>{e(d)}</td></tr>' for k, p, ic, t, d in ends if p == pt) + '</table>'
    body = f'''<h1>나의 첫 번째 서울 아파트 구하기 — 게임 방법과 엔딩 40종</h1><p class="lead">월급쟁이로 시작해 서울에 내 집 한 채를 마련하는 부동산 인생 시뮬레이션입니다. 어떤 집을, 언제, 어떤 방법으로, 얼마의 자금으로 샀느냐에 따라 20년 뒤 40가지 서로 다른 인생이 펼쳐집니다.</p>
    <p class="cta"><a class="btn" href="/seoul/">🏙️ 지금 시작하기</a></p>
    <h2>1. 시작 조건</h2><p>2026년, 29세 무주택 직장인으로 시작합니다. 연봉 4,800만 원, 월세 85만 원, 청약통장 가입 5년. 시작 현금은 3,000만 원(하드)·5,000만 원(보통)·1억 원(쉬움)·3억 원(금수저) 중에서 고릅니다. 한 턴은 6개월이고 40턴(20년)이 지나거나 파산하면 인생이 결산됩니다.</p>
    <h2>2. 두 가지 시장 모드</h2><table><tr><th>모드</th><th>특징</th></tr><tr><td>2026 현실 모드</td><td>서울 전역 토지거래허가구역. 무주택 LTV 40%(생애최초 70%), 주담대 한도 6·4·2억 원, 유주택자 대출 불가, 2년 실거주 의무, 갭투자 금지, 조합원 지위 양도·분양권 전매 제한. 이후 시장은 가상 시나리오로 움직입니다.</td></tr><tr><td>역사 모드 (2015년 시작)</td><td>2015년 완화기(LTV 70%, 갭투자 가능)에서 시작해 8·2 대책, 12·16 대책(15억 초과 대출 금지), 10·15 대책을 차례로 겪습니다. 시장 흐름은 실제 서울 아파트 흐름을 단순화한 게임용 수치입니다.</td></tr></table>
    <h2>3. 네 가지 매수 전략</h2><ul><li><b>구축 아파트 매수</b> — 상계주공·창동주공 같은 외곽 구축으로 시작해 실거주 2년을 채우고 상급지로 갈아탑니다. 재건축 조합이 설립되면 내 집이 입주권으로 바뀌기도 합니다.</li><li><b>갭투자</b> — 규제가 허용하는 시기에만 가능합니다. 2년마다 전세 재계약에서 보증금 차액을 주고받습니다.</li><li><b>청약·분양권</b> — 가점(무주택기간·부양가족·통장)으로 당첨 확률이 정해집니다. 당첨되면 계약금 10%를 바로 내야 하고 입주 때 잔금을 치릅니다.</li><li><b>재개발·재건축</b> — 한남3구역·노량진3구역 입주권을 삽니다. 권리 검증, 분담금 증가, 소송·지연이 변수입니다.</li></ul>
    <h2>4. 화면 구성</h2><ul><li><b>홈</b>: 시장 분위기, 금리, 현재 규제, 반기 수입·지출, 나에게 맞는 조언</li><li><b>지도</b>: 서울 25개 구 지도에서 실존 단지 30곳을 고르고 자금 계산(LTV·DSR·취득세)을 확인</li><li><b>내 자산</b>: 매도, 대출 상환, 전세 놓기, 거주지 변경, 청약 가점</li><li><b>도감</b>: 엔딩 40종과 아파트 도감</li></ul>
    <h2>5. 엔딩 40종 목록</h2><p>같은 판에서 조건을 여러 개 만족하면 아직 보지 못한 엔딩이 먼저 나옵니다.</p>{etab}
    <h2>6. 팁</h2><ul><li>처음엔 월세를 전세로 바꿔 주거비를 줄이고 현금을 모으는 것이 안정적입니다.</li><li>현실 모드에서 유주택자는 대출을 받을 수 없습니다. 첫 집은 신중하게 고르세요.</li><li>하락장에 손해를 보고 팔면 반등 때 '공포에 매도한 사람' 엔딩이 기다립니다.</li><li>입주권은 임장으로 권리를 검증해 두면 현금청산 위험을 피할 수 있습니다.</li></ul>
    <p>게임 속 규칙의 배경 지식은 <a href="/learn/">부동산 공부</a>에서 확인할 수 있습니다.</p>'''
    urls.append(page('seoul-guide.html', '나의 첫 번째 서울 아파트 구하기 게임 방법·엔딩 40종', '서울 아파트 인생 시뮬레이션의 시작 조건, 현실·역사 모드 규제, 네 가지 매수 전략, 화면 구성과 엔딩 40종 달성 조건을 정리했습니다.', body, '/seoul/'))
    body = '''<h1>재건축 조합장 키우기 — 게임 방법</h1><p class="lead">재건축을 앞둔 오래된 아파트에서 얼떨결에 조합장이 된 주인공이 되어, 조합 설립부터 입주까지 실제 재건축 단계를 따라가는 선택형 시뮬레이션입니다. 등장인물·단체·사건은 모두 가상입니다.</p>
    <p class="cta"><a class="btn" href="/johapjang/">🏗️ 지금 시작하기</a></p>
    <h2>1. 목표</h2><p>조합원의 <b>지지율</b>을 지키고, 사업 <b>자금</b>과 나의 <b>스트레스</b>를 관리하며 입주까지 사업을 끌고 가는 것이 목표입니다. 지지율이 바닥나면 해임총회, 자금이 바닥나면 사업 중단, 스트레스가 넘치면 건강 악화로 실패합니다.</p>
    <h2>2. 단지와 조합장 유형</h2><p>은마아파트, 잠실주공5단지, 압구정 현대, 여의도 시범, 목동 6단지, 상계주공6단지 등 단지를 고르고, 조합장 유형과 난이도(쉬움·기본·현실)를 정합니다. 단지마다 대지지분, 상가 문제, 학군 수요 같은 특성이 다릅니다.</p>
    <h2>3. 한 분기의 흐름</h2><ol><li>일정 화면에서 할 일 2개를 고릅니다 (주민 간담회, 정비사업법 공부, 시공사 협상, 휴식 등).</li><li>사건 카드가 나오면 선택지를 고릅니다. 선택 전 지지율·자금·스트레스 변화가 미리 보입니다.</li><li>단계 목표를 달성하면 다음 사업 단계로 넘어갑니다.</li></ol>
    <h2>4. 사업 단계</h2><p>추진위원회 동의서 받기 → 조합 설립 → 시공사 선정 → 사업시행계획 → 관리처분계획 → 이주·철거 → 착공·공사비 협상 → 준공·입주. 실제 재건축 절차를 단순화했습니다. 자세한 절차는 <a href="/learn/rebuild-steps.html">재건축 10단계</a> 글을 참고하세요.</p>
    <h2>5. 재무와 분담금</h2><p>재무 화면에서 공사비, 금융비용, 일반분양 수입으로 계산되는 비례율과 예상 분담금을 볼 수 있습니다. 공사비가 오르면 비례율이 떨어지고 분담금이 늘어 조합원 불만이 커집니다. <a href="/learn/proportional-rate.html">비례율과 분담금 계산법</a>을 함께 읽으면 이해가 쉽습니다.</p>
    <h2>6. 엔딩</h2><p>입주에 성공하면 지지율·소송 기록·사업 기간 등에 따라 '재건축의 신', '환급금의 기적', '초고속 재건축', '구청장 출마' 같은 다양한 엔딩을 만납니다. 실패해도 해임·자금 바닥 등 이유별 실패 엔딩이 있고, 한 번의 부활 기회가 주어집니다.</p>
    <h2>7. 팁</h2><ul><li>처음이라면 쉬움 모드로 시작하세요. 나쁜 효과가 줄고 법률 아이템을 더 받습니다.</li><li>지지율이 낮을 때는 무리한 결정보다 간담회와 정보 공개로 신뢰를 먼저 쌓으세요.</li><li>스트레스가 높으면 휴식을 넣어야 끝까지 갈 수 있습니다.</li></ul>'''
    urls.append(page('johapjang-guide.html', '재건축 조합장 키우기 게임 방법·사업 단계·엔딩', '재건축 조합장 키우기의 목표(지지율·자금·스트레스), 분기 진행, 사업 단계, 비례율·분담금, 엔딩과 공략 팁을 정리했습니다.', body, '/johapjang/'))
    body = '''<h1>📰 업데이트 소식</h1><p class="lead">aptgame.kr의 새 게임, 기능 개선, 새 글 소식을 모아 둡니다.</p>
    <h2>2026-11-13</h2><ul><li>세 번째 게임 <a href="/seoul/">나의 첫 번째 서울 아파트 구하기</a> 공개 — 실존 단지 30곳, 현실·역사 모드, 엔딩 40종.</li><li><a href="/learn/">부동산 공부</a> 코너 신설: 청약 가점, LTV·DSR, 10·15 대책, 재건축 절차, 비례율, 분양권·입주권, 취득세, 1주택 비과세, 전세가율, 첫 집 자금 계획 10편.</li><li><a href="/tools/">부동산 계산기</a> 4종 추가: 청약 가점, 대출 한도, 취득세, 비례율·분담금.</li><li>게임별 가이드 페이지 정리 (<a href="/seoul-guide.html">서울 아파트</a>, <a href="/johapjang-guide.html">조합장 키우기</a>, <a href="/guide.html">부동산 공화국</a>).</li></ul>
    <h2>2026-11-11</h2><ul><li>재건축 조합장 키우기 '쉬움' 모드 추가, 선택 전 효과 미리보기, 위험 경고, 처음 하는 사람을 위한 튜토리얼.</li><li>압구정·여의도·목동·상계 단지 일러스트 추가와 화면 전환 효과 개선.</li></ul>
    <h2>2026-11-05</h2><ul><li>부동산 공화국 단지 도감, 부동산 용어 사전, 게임 방법 페이지 공개.</li><li>재건축 조합장 키우기 2.0 — 엔딩 40종과 엔딩 도감.</li></ul>
    <h2>2026-11-01</h2><ul><li>aptgame.kr 오픈: 대한민국 부동산 부루마블 '부동산 공화국'과 '재건축 조합장 키우기'.</li></ul>'''
    urls.append(page('news.html', '업데이트 소식', 'aptgame.kr 새 게임, 기능 개선, 부동산 공부 새 글 소식.', body, '/news.html'))
    body = '''<h1>aptgame.kr 소개</h1><p class="lead">aptgame.kr은 "부동산 공부를 게임처럼"이라는 생각으로 만든 무료 부동산 게임·학습 사이트입니다.</p>
    <h2>왜 만들었나요?</h2><p>집값, 대출, 금리, 세금, 재건축 이야기는 매일 뉴스에 나오지만 막상 그 구조를 체감하기는 어렵습니다. LTV가 40%로 줄면 내가 살 수 있는 집이 어떻게 바뀌는지, 공사비가 오르면 분담금이 왜 늘어나는지, 전셋값이 떨어지면 집주인에게 무슨 일이 생기는지를 직접 선택하고 결과를 겪어 보면 훨씬 오래 기억에 남습니다.</p>
    <h2>무엇을 제공하나요?</h2><ul><li><b>게임 3종</b>: <a href="/bluemarble">부동산 공화국</a>(아파트 부루마블), <a href="/johapjang/">재건축 조합장 키우기</a>(재건축 경영 시뮬레이션), <a href="/seoul/">나의 첫 번째 서울 아파트 구하기</a>(내 집 마련 인생 시뮬레이션)</li><li><b><a href="/learn/">부동산 공부</a></b>: 청약·대출·세금·정비사업·전월세 기초를 예시 숫자로 풀어 쓴 글</li><li><b><a href="/tools/">계산기</a></b>: 청약 가점, 대출 한도, 취득세, 비례율·분담금</li><li><b>자료 페이지</b>: <a href="/apartments.html">단지 도감</a>, <a href="/glossary.html">부동산 용어 사전</a></li></ul>
    <h2>콘텐츠 원칙</h2><ul><li>제도 설명은 법령과 국토교통부·금융위원회·국세청 등 공식 발표를 바탕으로 작성하고, 제도가 바뀌면 고칩니다.</li><li>게임 속 시세·수익률·사건은 공개 자료를 참고한 <b>게임용 가상 수치</b>입니다. 특정 단지의 매수·매도를 권하거나 미래 시세를 예측하지 않습니다.</li><li>실존 단지 이름은 장소로만 사용하며, 건설사 로고와 실제 사진은 쓰지 않습니다. 인물과 사건은 모두 가상입니다.</li></ul>
    <h2>운영자</h2><p>aptgame.kr은 개인 개발자 강병곤이 기획·개발·운영합니다. 오류 제보, 제도 변경 알림, 제휴 문의는 아래 게시판에 남겨 주세요.</p><p>📮 <a href="https://github.com/qudrhs0122-oss/budongsan-gonghwaguk/issues" rel="noopener" target="_blank">문의·오류 제보 게시판 바로가기</a></p>
    <h2>광고 안내</h2><p>모든 게임과 글은 무료이며, 서비스 유지를 위해 광고가 표시될 수 있습니다. 게임 안의 보상형 광고는 원하는 사람만 선택해서 볼 수 있습니다. 개인정보 처리 방식은 <a href="/privacy.html">개인정보처리방침</a>에서 확인하세요.</p>'''
    urls.append(page('about.html', 'aptgame.kr 소개 · 운영자 · 문의', 'aptgame.kr은 부동산 게임 3종과 부동산 기초 지식·계산기를 무료로 제공하는 사이트입니다. 운영자와 콘텐츠 원칙, 문의처를 안내합니다.', body, '/about.html'))
    return urls

if __name__ == '__main__':
    urls = build_articles() + build_tools() + build_guides()
    # 공통 스타일 추가
    css = open(f'{ROOT}/page.css', encoding='utf-8').read()
    if '.lgrid' not in css:
        css += '''
.meta{font-size:13px;color:#8a7f6a;margin:-4px 0 14px}.crumb{font-size:13px;margin:0}.crumb a{color:#8a7f6a}
.formula{background:#f3f6ff;border-radius:10px;padding:10px 12px;font-weight:700;color:#1f2547}
.disclaimer{font-size:12.5px;color:#8a7f6a;background:#faf7f1;border-radius:10px;padding:10px 12px;margin-top:24px}
.lgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin:14px 0}
.lcard{display:flex;flex-direction:column;gap:4px;border:1.5px solid #eadfcc;border-radius:16px;padding:14px;text-decoration:none;color:#2a2116;background:#fffdf9}
.lcard:hover{border-color:#e8553d}.lcard b{font-size:16px;line-height:1.4}.lcard small{font-size:13.5px;color:#6a604e;line-height:1.5}.lcard i{font-style:normal;font-size:12px;color:#8a7f6a}
.ltag{align-self:flex-start;font-size:11.5px;font-weight:800;background:#1f2547;color:#fff;border-radius:8px;padding:1px 8px}
.toc span{background:#f5efe4;border-radius:10px;padding:3px 10px;font-size:13px}
.pn{display:flex;justify-content:space-between;gap:10px;margin-top:26px;font-size:14px}.pn a{text-decoration:none;font-weight:700;max-width:48%}
.calc{background:#f8f5ee;border-radius:16px;padding:14px;margin:14px 0}.calc label{display:block;font-weight:700;font-size:14.5px;margin:8px 0}
.calc input[type=number],.calc select{display:block;width:100%;margin-top:4px;padding:10px;border:1.5px solid #e2d6c0;border-radius:10px;font:inherit;background:#fff}
.calc .res{background:#fff;border-radius:14px;padding:12px 14px;margin-top:12px}.calc .big{font-size:30px;font-weight:900;color:#1f2547}.calc .big small{font-size:14px;color:#8a7f6a;margin-left:6px}
'''
        open(f'{ROOT}/page.css', 'w', encoding='utf-8').write(css)
    print(len(urls), 'pages'); print('\n'.join(urls))
    json.dump(urls, open('/tmp/new_urls.json', 'w'))
