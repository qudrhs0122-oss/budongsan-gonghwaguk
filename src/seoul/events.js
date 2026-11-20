// ===================== 부동산 이벤트 카드 =====================
// w(S) → 가중치(0이면 안 나옴), run(S) → { cat, t, d, ch:[{l, f() → 결과 문장}] }
const owns = k => S.props.filter(p => p.kind === k);
const ownsOld = () => S.props.filter(p => p.kind === 'buy' && !p.vb && AP[p.aid].y && AP[p.aid].y < 2000);
const gapProps = () => S.props.filter(p => p.tenant);
const single = () => S.married < 0;
const homelessYears = () => S.everOwned ? 0 : Math.max(0, ageOf() - 30) + 1;
function gajeom() { // 청약 가점 (84점 만점, 단순화)
  const h = Math.min(32, 2 + homelessYears() * 2);
  const fam = Math.min(35, 5 + ((S.married >= 0) ? 5 : 0) + S.kids.length * 5 + (S.parentsHelp ? 5 : 0));
  const acc = Math.min(17, 6 + Math.floor(S.t / 2) + 1);
  const bonus = S.chBonus || 0;
  return { h, fam, acc, bonus, total: Math.min(84, h + fam + acc + bonus) };
}
function payOrCredit(amt) { S.cash = r2(S.cash - amt); }

const EVENTS = [
  // ── 시장 ──
  { id: 'rateUp', w: () => S.rate < 5 ? 6 : 0, run: () => {
    const y = yearOf();
    return { cat: '시장', t: `${y}년, 금리가 급등했습니다!`, d: '은행에서 연락이 왔습니다. 다음 달부터 대출 이자가 오릅니다. 이대로라면 저축액이 크게 줄어듭니다.',
      ch: [
        { l: '그대로 버틴다', s: '현금 유지 · 이자 부담 증가', f: () => { S.rate = r2(S.rate + .75); return `기준금리가 ${S.rate.toFixed(2)}%로 올랐습니다. 매달 나가는 이자가 늘어납니다.`; } },
        { l: '일부 대출 상환', s: '현금 감소 · 미래 이자 완화', ok: () => S.props.some(p => p.loan > 0) && S.cash > .3, f: () => { S.rate = r2(S.rate + .75); const p = S.props.filter(p => p.loan > 0).sort((a, b) => b.loan - a.loan)[0]; const amt = r2(Math.min(p.loan, S.cash * .5)); p.loan = r2(p.loan - amt); S.cash = r2(S.cash - amt); return `${aptName(p)} 대출 ${won(amt)}을 미리 갚았습니다.`; } },
        { l: '아파트 매도 검토', s: '부채를 줄일 수 있지만 매매 손익과 이사비 발생', ok: () => S.props.length > 0, f: () => { S.rate = r2(S.rate + .75); S.goTab = 'assets'; return '내 자산 화면에서 팔 집을 골라 보세요.'; } },
      ] };
  } },
  { id: 'rateDown', w: () => S.rate > 1 ? 4 : 0, run: () => ({ cat: '시장', t: '기준금리 인하', d: '중앙은행이 경기 부양을 위해 금리를 내렸습니다. 대출 문의가 늘고 매수 심리가 살아납니다.',
    ch: [{ l: '좋은 소식이다', f: () => { S.rate = r2(Math.max(.5, S.rate - .5)); S.gShock = 1.5; return `기준금리 ${S.rate.toFixed(2)}%. 다음 반기 집값에 훈풍이 붑니다.`; } }] }) },
  { id: 'freeze', w: () => S.phase !== 'up' ? 4 : 1, run: () => ({ cat: '시장', t: '거래 절벽', d: '매수 문의가 뚝 끊겼습니다. 중개사무소마다 "지금은 사려는 사람이 없어요"라는 말뿐입니다.',
    ch: [{ l: '시장을 지켜본다', f: () => { S.gShock = -2; return '다음 반기 집값이 약세를 보일 가능성이 커졌습니다.'; } }] }) },
  { id: 'urgent', w: () => 5, run: () => {
    const cands = APTS.filter(a => a.kind === 'buy' && S.avail[a.id]); const a = pick(cands); const disc = r2(rnd(.06, .12));
    return { cat: '시장', t: `급매 출현: ${a.n}`, d: `집주인 사정으로 ${GUN[a.gu].n}구 ${a.n}에 시세보다 ${Math.round(disc * 100)}% 싼 급매가 나왔습니다. 이번 반기에만 유효합니다.`,
      ch: [{ l: '매물 보러 가기', f: () => { S.deal = { aid: a.id, disc, t: S.t }; S.goApt = a.id; return `${a.n} 급매가 ${won(price(a.id) * (1 - disc))}에 나와 있습니다.`; } }, { l: '관심 없다', f: () => '그냥 넘겼습니다.' }] };
  } },
  { id: 'jUp', w: () => 3, run: () => ({ cat: '전월세', t: '전세가 급등', d: '입주 물량이 줄어 전세 매물이 사라지고 있습니다. 전셋값이 크게 오릅니다.',
    ch: [{ l: '어쩔 수 없다', f: () => { S.jShock = 8; let m = '전세 시세가 오릅니다.'; if (S.res.type === 'jeonse') { const add = r2(S.res.dep * .1); S.res.dep = r2(S.res.dep + add); S.cash = r2(S.cash - add); m += ` 집주인이 보증금 ${won(add)} 인상을 요구해 올려 줬습니다.`; } return m; } }] }) },
  { id: 'jDown', w: () => S.phase === 'down' ? 4 : 1.5, run: () => ({ cat: '전월세', t: '전세가 급락', d: '대규모 입주와 금리 부담으로 전세 시세가 크게 떨어졌습니다. 다음 재계약 때 보증금을 돌려줘야 하는 집주인이 늘고 있습니다.',
    ch: [{ l: '비상금을 점검한다', f: () => { S.jShock = -14; if (gapProps().length) { S.flags.jCrashHit = true; return '갖고 있는 전세 낀 집의 다음 재계약이 걱정됩니다. 현금을 넉넉히 준비하세요.'; } return '세입자 입장에서는 나쁘지 않은 소식입니다.'; } }] }) },
  { id: 'tenantOut', w: () => gapProps().length ? 3 : 0, run: () => { const p = pick(gapProps()); return { cat: '갭투자', t: '세입자 퇴거 요청', d: `${aptName(p)} 세입자가 회사 발령으로 만기 전에 나가겠다며 보증금 ${won(p.tenant.dep)} 반환을 요청했습니다.`,
    ch: [
      { l: '새 세입자를 구해 돌려준다', s: '현재 전세 시세로 다시 계약', f: () => { const nd = r2(propValue(p) * AP[p.aid].jr * S.J); const diff = r2(nd - p.tenant.dep); S.cash = r2(S.cash + diff); p.tenant = { dep: nd, until: S.t + 4, J0: S.J }; S.st.jReturn++; return diff >= 0 ? `새 보증금이 ${won(diff)} 더 높아 차액이 들어왔습니다.` : `새 보증금이 낮아 ${won(-diff)}을 보태 돌려줬습니다.`; } },
      { l: '집을 팔아 정리한다', f: () => { const g = sellProp(p); return `매도 대금으로 보증금을 정리했습니다. 손에 남은 돈 ${won(g)}.`; } },
    ] }; } },
  // ── 청약 ──
  { id: 'cheong', w: () => isHomeless() ? 7 : 1, run: () => {
    const b = pick(VBUN), g = gajeom(), ok = isHomeless() && S.t >= 1;
    const sp = S.married >= 0 && S.t - S.married <= 14 ? 12 : 0;
    const chance = clamp(1 / (1 + Math.exp(-(g.total + sp - b.cut) / 3)) * .9 + .02, .02, .9);
    return { cat: '청약', t: `청약 공고: ${b.n}`, d: `${GUN[b.gu].n}구 신규 분양. 분양가 ${won(b.p)} (전용 59㎡). 예상 당첨 가점 ${b.cut}점 안팎. 내 가점 ${g.total}점 (무주택 ${g.h} · 부양가족 ${g.fam} · 통장 ${g.acc})${sp ? ' · 신혼 특별공급 대상' : ''}. 당첨되면 계약금 10%(${won(b.p * .1)})를 바로 내야 합니다.`,
      ch: [
        { l: `청약 넣기 (당첨 확률 약 ${Math.round(chance * 100)}%)`, ok: () => ok, s: ok ? '' : '무주택자만 청약할 수 있어요', f: () => {
          S.st.chTry = (S.st.chTry || 0) + 1;
          if (Math.random() > chance) return '아쉽게도 낙첨입니다. 가점을 더 쌓아 다음 기회를 노려 보세요.';
          if (S.cash < b.p * .1) { S.chPend = { n: b.n, gu: b.gu, p: b.p }; return '🎉 당첨! 서울 아파트에 당첨될 기회가 찾아왔습니다. 하지만 계약하려면 돈이 더 필요해요.'; }
          S.cash = r2(S.cash - b.p * .1); S.st.chWin++;
          S.props.push({ uid: S.uid++, vb: true, vname: b.n, vgu: b.gu, kind: 'bun', total: b.p, base: b.p, G0: S.G, prem: rnd(1.15, 1.45), mv: yearOf() + 3, buyT: S.t, loan: 0, fromCh: true, resaleOk: rules().bunResale });
          return `🎉 당첨! 계약금 ${won(b.p * .1)}을 냈습니다. ${yearOf() + 3}년 입주 예정입니다. 중도금은 집단대출로, 잔금은 입주 때 냅니다.`;
        } },
        { l: '이번엔 넘긴다', f: () => '다음 공고를 기다립니다.' },
      ] };
  } },
  { id: 'musun', w: () => S.t > 2 ? 2 : 0, run: () => { const b = pick(VBUN); const ok = isHomeless() || S.mode === 'hist';
    return { cat: '청약', t: '무순위 청약(줍줍) 공고', d: `${b.n}에서 계약 포기 물량이 나왔습니다. 분양가 ${won(b.p)}. 경쟁률 수천 대 1이 예상됩니다.`,
      ch: [{ l: '밑져야 본전, 넣어 본다', ok: () => ok, s: ok ? '' : '현 규제에서는 무주택자만 신청할 수 있어요', f: () => {
        if (Math.random() > .04) return '역시 어렵네요. 낙첨입니다.';
        if (S.cash < b.p * .1) { S.flags.chGiveUp = true; return '기적처럼 당첨! 하지만 계약금이 없어 포기했습니다…'; }
        S.cash = r2(S.cash - b.p * .1);
        S.props.push({ uid: S.uid++, vb: true, vname: b.n + ' (무순위)', vgu: b.gu, kind: 'bun', total: b.p, base: b.p, G0: S.G, prem: rnd(1.3, 1.6), mv: yearOf() + 2, buyT: S.t, loan: 0, musun: true, resaleOk: rules().bunResale });
        return `🍀 무순위 당첨! 계약금 ${won(b.p * .1)}을 냈습니다. ${yearOf() + 2}년 입주 예정.`; } }, { l: '안 넣는다', f: () => '넘겼습니다.' }] }; } },
  { id: 'special', w: () => (S.married >= 0 || S.kids.length) && isHomeless() ? 2 : 0, run: () => ({ cat: '청약', t: '특별공급 자격 발생', d: '신혼부부·다자녀 특별공급 자격이 생겼습니다. 다음 청약에서 당첨 확률이 크게 오릅니다.',
    ch: [{ l: '좋아!', f: () => { S.married = Math.max(S.married, S.t - 1); return '특별공급 대상자로 등록했습니다.'; } }] }) },
  // ── 구축 ──
  { id: 'leak', w: () => ownsOld().length ? 4 : 0, run: () => { const p = pick(ownsOld()), c = r2(rnd(.03, .08)); return { cat: '구축', t: '누수 발견', d: `${aptName(p)} 욕실 천장에서 물이 샙니다. 아랫집에서 연락이 왔습니다. 수리비 ${won(c)}.`,
    ch: [{ l: '바로 수리한다', f: () => { payOrCredit(c); return `수리비 ${won(c)}을 냈습니다. 아랫집과 관계는 지켰습니다.`; } }, { l: '보험 처리 알아본다', f: () => { payOrCredit(c * .5); S.happy -= 4; return `절반은 보험으로 처리했지만, 몇 주간 공사로 스트레스를 받았습니다.`; } }] }; } },
  { id: 'remodel', w: () => S.props.some(p => p.kind === 'buy' && p.live) ? 2 : 0, run: () => { const p = S.props.find(p => p.kind === 'buy' && p.live); const c = r2(rnd(.15, .4)); return { cat: '구축', t: '인테리어 고민', d: `${aptName(p)}이(가) 낡아 보입니다. 리모델링을 하면 생활이 훨씬 쾌적해집니다. 비용 ${won(c)}.`,
    ch: [{ l: '리모델링한다', ok: () => S.cash >= c, f: () => { S.cash = r2(S.cash - c); S.happy += 10; p.remod = true; return '새집 같아졌습니다. 주거 만족도가 크게 올랐습니다.'; } }, { l: '조금 더 참는다', f: () => '다음에 하기로 했습니다.' }] }; } },
  // ── 분양권 ──
  { id: 'delay', w: () => owns('bun').length ? 3 : 0, run: () => { const p = pick(owns('bun')); return { cat: '분양권', t: '공사 지연', d: `${aptName(p)} 현장에 자재 수급 문제가 생겨 입주가 1년 늦어진다는 공지가 왔습니다.`,
    ch: [{ l: '기다린다', f: () => { p.mv++; return `입주 예정이 ${p.mv}년으로 미뤄졌습니다.`; } }] }; } },
  { id: 'option', w: () => owns('bun').length ? 2 : 0, run: () => { const p = pick(owns('bun')); const c = r2(p.total * .02); return { cat: '분양권', t: '옵션비 증가', d: `${aptName(p)} 발코니 확장·시스템 에어컨 옵션 비용이 ${won(c)}로 확정됐습니다.`,
    ch: [{ l: '옵션을 넣는다', f: () => { payOrCredit(c); S.happy += 3; return '입주 때 쾌적하게 살 수 있겠습니다.'; } }, { l: '기본형으로 간다', f: () => '옵션 없이 가기로 했습니다.' }] }; } },
  { id: 'midBlock', w: () => owns('bun').length && S.t > 3 ? 1.5 : 0, run: () => { const p = pick(owns('bun')); const c = r2(p.total * .2); return { cat: '분양권', t: '중도금 대출 불가', d: `대출 규제로 ${aptName(p)} 중도금 집단대출 일부가 막혔습니다. 중도금 ${won(c)}을 직접 내야 합니다.`,
    ch: [
      { l: '현금으로 낸다', ok: () => S.cash >= c, f: () => { S.cash = r2(S.cash - c); p.total = r2(p.total - c / .9 * 0); p.prepaid = (p.prepaid || 0) + c; return `중도금 ${won(c)}을 냈습니다.`; } },
      { l: '분양권을 판다', ok: () => p.resaleOk || rules().bunResale, s: p.resaleOk || rules().bunResale ? '' : '전매제한 기간이라 팔 수 없어요', f: () => { const g = sellProp(p); return `분양권을 넘겼습니다. 손에 남은 돈 ${won(g)}.`; } },
      { l: '신용대출로 버틴다', f: () => { S.credit = r2(S.credit + c); p.prepaid = (p.prepaid || 0) + c; return `신용대출 ${won(c)}으로 중도금을 막았습니다.`; } },
    ] }; } },
  // ── 입주권 ──
  { id: 'ipjStep', w: () => owns('ipj').length ? 3 : 0, run: () => { const p = pick(owns('ipj')); return { cat: '입주권', t: '정비사업 진척', d: `${aptName(p)} 조합 총회가 순조롭게 끝났습니다.`, ch: [{ l: '좋다', f: () => { p.stage = Math.min(5, p.stage + 1); return `'${STAGES[p.stage]}' 단계로 넘어갔습니다.`; } }] }; } },
  { id: 'dues', w: () => owns('ipj').length ? 3 : 0, run: () => { const p = pick(owns('ipj')); const add = r2(p.dues * rnd(.12, .25)); return { cat: '입주권', t: '추가분담금 증가', d: `${aptName(p)} 공사비가 올라 조합원 1인당 분담금이 ${won(add)} 늘어난다는 총회 안건이 올라왔습니다.`,
    ch: [{ l: '찬성한다 (사업 속도 유지)', f: () => { p.dues = r2(p.dues + add); S.st.duesUp++; return `분담금이 ${won(p.dues)}으로 늘었습니다.`; } }, { l: '반대표를 던진다', f: () => { if (Math.random() < .5) { p.slow = true; return '안건이 부결돼 시공사와 협상이 길어집니다. 사업이 늦어질 수 있습니다.'; } p.dues = r2(p.dues + add); S.st.duesUp++; return `반대에도 안건이 통과됐습니다. 분담금 ${won(p.dues)}.`; } }] }; } },
  { id: 'suit', w: () => owns('ipj').length ? 2 : 0, run: () => { const p = pick(owns('ipj')); return { cat: '입주권', t: '조합 소송', d: `${aptName(p)} 비대위가 관리처분계획 무효 소송을 냈습니다.`, ch: [{ l: '결과를 기다린다', f: () => { p.slow = Math.random() < .6; p.wait = (p.wait || 0) + 2; return p.slow ? '소송이 길어지며 사업이 지연됩니다.' : '법원이 조합 손을 들어줬습니다.'; } }] }; } },
  { id: 'nego', w: () => owns('ipj').length ? 1.5 : 0, run: () => { const p = pick(owns('ipj')); return { cat: '입주권', t: '공사비 협상', d: `${aptName(p)} 시공사가 공사비 인상을 요구하며 공사를 멈추겠다고 통보했습니다.`,
    ch: [{ l: '조합의 합의안 찬성', f: () => { const add = r2(p.dues * .1); p.dues = r2(p.dues + add); S.st.duesUp++; p.slow = false; return `공사가 재개됩니다. 분담금 +${won(add)}.`; } }, { l: '버틴다', f: () => { p.slow = true; p.wait = (p.wait || 0) + 2; return '공사가 멈췄습니다. 이주비 이자가 쌓입니다.'; } }] }; } },
  { id: 'rbStart', w: () => S.props.some(p => p.kind === 'buy' && !p.vb && (AP[p.aid].tr.rb || 0) >= .4 && S.t - p.buyT >= 4) ? 3 : 0, run: () => {
    const p = pick(S.props.filter(p => p.kind === 'buy' && !p.vb && (AP[p.aid].tr.rb || 0) >= .4 && S.t - p.buyT >= 4)); const v = propValue(p);
    return { cat: '재건축', t: `${aptName(p)} 재건축 조합 설립!`, d: `드디어 ${aptName(p)} 재건축 조합이 설립됐습니다. 집이 조합원 입주권으로 바뀌고, 이주·철거 뒤 새 아파트가 지어집니다. 준공 때 분담금은 약 ${won(v * .35)}로 예상됩니다.${p.live ? ' 사는 집이라 이주해야 합니다(이주비 대출로 전세를 구합니다).' : ''}`,
      ch: [
        { l: '조합원으로 끝까지 간다', s: '신축 입주까지 몇 년 · 분담금 필요', f: () => { if (p.live) { S.res = { type: 'jeonse', dep: r2(v * .4), loan: r2(v * .4) }; } if (p.tenant) { S.cash = r2(S.cash - p.tenant.dep); p.tenant = null; } Object.assign(p, { kind: 'ipj', conv: true, paid: p.buyP, paid0: p.buyP, dues: r2(v * .35), stage: 0, live: false, verified: true, slow: false, wait: 0 }); return '조합원이 됐습니다. 이주비 대출로 근처 전셋집에 들어갔습니다. 이제 사업 단계를 지켜보세요.'; } },
        { l: '조합 설립 호재에 판다', f: () => { S.px[p.aid] = r2(S.px[p.aid] * 1.08); const g = sellProp(p); return `호재로 시세가 오른 틈에 팔았습니다. 손에 쥔 돈 ${won(g)}.`; } },
      ] };
  } },
  { id: 'rebuild', w: () => S.t > 2 ? 2 : 0, run: () => ({ cat: '정책', t: '재건축 규제 완화', d: '정부가 안전진단 기준을 완화하고 재건축 초과이익 부담을 줄이겠다고 발표했습니다.', ch: [{ l: '재건축 단지에 호재다', f: () => { S.rbBoost = 6; for (const p of owns('ipj')) p.slow = false; return '재건축 기대 단지 시세가 들썩입니다.'; } }] }) },
  // ── 도시 ──
  { id: 'transit', w: () => 3, run: () => { const a = pick(APTS.filter(a => a.tr.tr)); const g = GUN[a.gu].n; return { cat: '도시', t: `교통망 개통: ${g} 일대`, d: `${g}구를 지나는 새 철도 노선이 개통 일정을 확정했습니다. 역세권 단지들이 주목받습니다.`,
    ch: [{ l: '소식을 확인했다', f: () => { for (const b of APTS) if (b.gu === a.gu || (b.tr.tr && Math.random() < .3)) S.px[b.id] = r2(S.px[b.id] * 1.05); return `${g}구 단지 시세가 5% 안팎 올랐습니다.`; } }] }; } },
  { id: 'station', w: () => 2, run: () => { const a = pick(APTS.filter(a => a.kind === 'buy')); return { cat: '도시', t: '신설역 계획 변경', d: `${GUN[a.gu].n}구에 들어서기로 했던 신설역 위치가 바뀌었습니다.`, ch: [{ l: '아쉽다', f: () => { for (const b of APTS) if (b.gu === a.gu) S.px[b.id] = r2(S.px[b.id] * .96); return `${GUN[a.gu].n}구 단지 시세가 4% 빠졌습니다.`; } }] }; } },
  { id: 'devCancel', w: () => 1.5, run: () => { const g = pick(GU.filter(g => g.t >= 3)); return { cat: '도시', t: '개발 호재 취소', d: `${g.n}구 대형 복합개발 사업이 무산됐습니다.`, ch: [{ l: '그렇구나', f: () => { for (const b of APTS) if (b.gu === g.id) S.px[b.id] = r2(S.px[b.id] * .95); return `${g.n}구 시세가 약세입니다.`; } }] }; } },
  { id: 'school', w: () => 1.5, run: () => ({ cat: '도시', t: '학군 수요 집중', d: '자사고·특목고 정책 변화로 학군지 수요가 몰립니다.', ch: [{ l: '확인', f: () => { for (const b of APTS) if (b.tr.sc) S.px[b.id] = r2(S.px[b.id] * (1 + .05 * b.tr.sc)); return '대치·목동·중계 학군 단지가 올랐습니다.'; } }] }) },
  // ── 정책 ──
  { id: 'relax', w: () => !S.relax && rules().name.startsWith('10·15') && yearOf() >= 2029 ? 1.5 : 0, run: () => ({ cat: '정책', t: '규제지역 일부 해제', d: '집값이 안정되자 정부가 서울 일부 규제를 풀었습니다. LTV가 50%로 오르고, 전세 낀 매수도 다시 가능해집니다.', ch: [{ l: '판이 바뀐다', f: () => { S.relax = true; S.gShock = 2; return '규제 완화. 갭투자와 분양권 전매가 다시 가능합니다.'; } }] }) },
  { id: 'tight', w: () => !S.tight && S.phase === 'up' && S.t > 3 ? 1.5 : 0, run: () => ({ cat: '정책', t: '추가 대출 규제', d: '집값 과열에 정부가 LTV를 추가로 낮췄습니다.', ch: [{ l: '확인', f: () => { S.tight = true; S.gShock = -1.5; return '대출 한도가 줄었습니다 (LTV −10%p).'; } }] }) },
  // ── 인생 ──
  { id: 'marry', w: () => single() && ageOf() >= 30 && ageOf() <= 42 ? 5 : 0, run: () => ({ cat: '인생', t: '결혼 이야기', d: '오래 만난 연인과 결혼 이야기가 나왔습니다. 예식과 혼수에 3,000만 원 정도가 들고, 배우자 소득이 생깁니다.',
    ch: [{ l: '결혼한다', f: () => { S.married = S.t; S.spouse = .42; S.cash = r2(S.cash - .3); S.happy += 12; return '💍 결혼했습니다! 가구 소득이 늘었고, 신혼부부 특별공급 자격이 생겼습니다.'; } }, { l: '아직은 이르다', f: () => { S.happy -= 2; return '조금 더 생각해 보기로 했습니다.'; } }] }) },
  { id: 'baby', w: () => S.married >= 0 && S.kids.length < 3 && ageOf() <= 44 ? 4 : 0, run: () => ({ cat: '인생', t: '아기 소식', d: '가족이 늘어날 수 있습니다. 육아비가 들지만 청약 부양가족 점수가 오릅니다.',
    ch: [{ l: '새 가족을 맞는다', f: () => { S.kids.push(S.t); S.happy += 10; payOrCredit(.1); return `👶 아이가 태어났습니다! (${S.kids.length}명)`; } }, { l: '지금은 어렵다', f: () => '조금 더 준비하기로 했습니다.' }] }) },
  { id: 'job', w: () => !S.biz && ageOf() < 50 ? 3 : 0, run: () => ({ cat: '인생', t: '이직 제안', d: '경쟁사에서 연봉 15% 인상 조건으로 이직 제안이 왔습니다. 다만 새 회사는 안정성이 조금 떨어집니다.',
    ch: [{ l: '옮긴다', f: () => { S.salary = r2(S.salary * 1.15); S.jobRisk = (S.jobRisk || 0) + 1; return `연봉이 ${won(S.salary)}으로 올랐습니다.`; } }, { l: '남는다', f: () => { S.happy += 2; return '익숙한 곳에서 계속 일하기로 했습니다.'; } }] }) },
  { id: 'promo', w: () => S.biz ? 0 : 1, run: () => ({ cat: '인생', t: '승진', d: '그동안의 성과를 인정받아 승진했습니다.', ch: [{ l: '감사합니다', f: () => { S.salary = r2(S.salary * 1.1); S.happy += 5; return `연봉 ${won(S.salary)}.`; } }] }) },
  { id: 'layoff', w: () => S.biz ? 0 : 1 + (S.jobRisk || 0) * 1.5, run: () => ({ cat: '인생', t: '회사 구조조정', d: '회사가 구조조정에 들어갔습니다. 당분간 소득이 크게 줄어듭니다.',
    ch: [{ l: '버티며 재취업 준비', f: () => { S.cash = r2(S.cash - S.salary * .35); S.salary = r2(S.salary * .95); S.happy -= 10; S.jobRisk = 0; return '반년 가까이 쉬다 재취업했습니다. 연봉은 조금 줄었습니다.'; } }] }) },
  { id: 'kidcost', w: () => S.kids.length ? 3 : 0, run: () => ({ cat: '인생', t: '교육비 증가', d: '아이가 커 가며 학원비가 늘었습니다.', ch: [{ l: '학원을 보낸다', f: () => { payOrCredit(.04 * S.kids.length); S.happy += 2; return `교육비 ${won(.04 * S.kids.length)}이 더 나갔습니다.`; } }, { l: '집에서 가르친다', f: () => { S.happy -= 3; return '돈은 아꼈지만 저녁 시간이 빠듯해졌습니다.'; } }] }) },
  { id: 'parents', w: () => ageOf() >= 35 && !S.parentsHelp ? 2.5 : 0, run: () => ({ cat: '인생', t: '부모님 부양', d: '부모님 전셋집 계약이 끝나 보증금이 모자란다고 하십니다. 5,000만 원을 보태 드리면 큰 힘이 됩니다.',
    ch: [{ l: '보태 드린다', ok: () => S.cash >= .5, f: () => { S.cash = r2(S.cash - .5); S.parentsHelp = true; S.happy += 6; return '부모님이 한시름 놓으셨습니다. 청약 부양가족 점수도 오릅니다.'; } }, { l: '지금은 어렵다고 말씀드린다', f: () => { S.happy -= 5; return '마음이 무겁습니다.'; } }] }) },
  { id: 'bonus', w: () => 2, run: () => ({ cat: '인생', t: '성과급', d: '회사 실적이 좋아 성과급이 나왔습니다.', ch: [{ l: '저축한다', f: () => { const b = r2(S.salary * .15); S.cash = r2(S.cash + b); return `${won(b)}을 모았습니다.`; } }, { l: '가족 여행을 간다', f: () => { const b = r2(S.salary * .15); S.cash = r2(S.cash + b * .4); S.happy += 8; return '오랜만에 푹 쉬었습니다.'; } }] }) },
  // ── 노동·건강 ──
  { id: 'bigco', w: () => !S.biz && S.career >= 3 && ageOf() < 45 ? 3 : 0, run: () => ({ cat: '노동', t: '대기업 경력직 합격!', d: '본업에 집중하며 쌓은 경력 덕분에 대기업 경력직 공채에 붙었습니다. 연봉이 40% 오르지만 업무 강도도 셉니다.',
    ch: [{ l: '옮긴다', s: '연봉 +40% · 체력 −10', f: () => { S.salary = r2(S.salary * 1.4); S.hp = clamp(S.hp - 10, 0, 100); S.career = 0; return `연봉이 ${won(S.salary)}이 됐습니다!`; } }, { l: '지금 회사에 남는다', f: () => { S.happy += 3; return '익숙한 동료들과 계속 일하기로 했습니다.'; } }] }) },
  { id: 'promoMiss', w: () => !S.biz && S.w.two + S.w.three >= 3 && S.career === 0 ? 2.5 : 0, run: () => ({ cat: '노동', t: '승진 누락', d: '부업에 지친 티가 났던 걸까요. 이번 승진 명단에 이름이 없습니다. 동기가 팀장이 됐습니다.',
    ch: [{ l: '이직을 알아본다', f: () => { if (Math.random() < .5) { S.salary = r2(S.salary * 1.12); return `이직에 성공해 연봉 ${won(S.salary)}.`; } S.happy -= 4; return '마땅한 자리가 없었습니다.'; } }, { l: '본업에 다시 집중하겠다고 다짐한다', f: () => { S.plan.work = 'main'; S.happy -= 3; return '다음 반기는 본업에 집중하도록 바꿨습니다.'; } }] }) },
  { id: 'faint', w: () => S.hp < 35 ? 5 : 0, run: () => ({ cat: '건강', t: '야근하다 쓰러짐', d: '사무실에서 눈앞이 하얘졌습니다. 정신을 차려 보니 응급실입니다. 의사는 최소 한 달은 쉬라고 합니다.',
    ch: [{ l: '의사 말대로 쉰다', s: '병원비 · 월급 일부 감소 · 체력 회복', f: () => { const c = r2(.02 + S.salary * .08); S.cash = r2(S.cash - c); S.hp = clamp(S.hp + 35, 0, 100); S.plan.work = S.biz ? 'bizlite' : 'rest'; return `병원비와 휴직으로 ${won(c)}이 나갔지만 체력이 ${S.hp}까지 회복됐습니다.`; } },
      { l: '진통제 먹고 바로 복귀한다', s: '돈은 지키지만 위험', f: () => { S.hp = clamp(S.hp - 5, 0, 100); S.overwarn++; return `과로 경고 ${S.overwarn}/2. 몸이 계속 신호를 보냅니다.`; } }] }) },
  { id: 'blog', w: () => !S.passive && S.t > 4 ? 1.5 : 0, run: () => ({ cat: '부업', t: '블로그 수익화 성공', d: '틈틈이 쓰던 부동산 공부 블로그에 광고 수익이 붙기 시작했습니다. 조금씩이지만 매달 돈이 들어옵니다.',
    ch: [{ l: '꾸준히 써 본다', s: '자동 부수입 · 체력 −3', f: () => { S.passive = .012; S.hp = clamp(S.hp - 3, 0, 100); return '반기마다 약 120만 원의 부수입이 생겼습니다.'; } }, { l: '귀찮다, 접는다', f: () => '블로그를 닫았습니다.' }] }) },
  { id: 'store', w: () => !S.biz && S.t > 3 && S.cash >= .1 ? 1.5 : 0, run: () => ({ cat: '부업', t: '스마트스토어 창업 제안', d: '친구가 같이 온라인 쇼핑몰을 해 보자고 합니다. 1,000만 원이 들고, 잘되면 쏠쏠한 부수입이 됩니다.',
    ch: [{ l: '해 본다', s: '1,000만 원 · 성공 확률 40%', f: () => { S.cash = r2(S.cash - .1); S.hp = clamp(S.hp - 8, 0, 100); if (Math.random() < .4) { S.passive = r2((S.passive || 0) + .04); return '대박! 반기마다 약 400만 원이 들어옵니다.'; } return '재고만 쌓였습니다. 1,000만 원을 잃었습니다.'; } }, { l: '거절한다', f: () => '본업에 집중하기로 했습니다.' }] }) },
  { id: 'deliveryBoom', w: () => S.plan.work === 'two' || S.plan.work === 'three' ? 2 : 0, run: () => ({ cat: '부업', t: '배달 부업 대박', d: '비 오는 연휴, 배달 단가가 두 배로 뛰었습니다. 오늘 밤 나가면 크게 벌 수 있습니다.',
    ch: [{ l: '나간다', s: '+300만 원 · 체력 −10', f: () => { S.cash = r2(S.cash + .03); S.st.sideEarn += .03; S.hp = clamp(S.hp - 10, 0, 100); return '하룻밤에 300만 원을 벌었습니다. 다리가 후들거립니다.'; } }, { l: '쉰다', f: () => { S.hp = clamp(S.hp + 5, 0, 100); return '따뜻한 이불 속에서 푹 잤습니다.'; } }] }) },
  // ── 주식 ──
  { id: 'stockTip', w: () => S.t > 2 && S.cash > .3 ? 2 : 0, run: () => ({ cat: '주식', t: '친구의 주식 추천', d: '"이번엔 진짜야. 내가 확실한 종목 하나 알아." 대학 동기가 단톡방에 종목 하나를 찍어 줬습니다.',
    ch: [{ l: '1,000만 원 넣어 본다', ok: () => S.cash >= .1, f: () => { buyStock('neo', .1); if (Math.random() < .35) { bumpStock('neo', .12); return '정말 올랐습니다! 성장주 계좌가 1,200만 원 불었습니다.'; } bumpStock('neo', -.06); return '사자마자 떨어졌습니다. 600만 원 손실.'; } }, { l: '안 한다', f: () => '친구에게 이모티콘만 보냈습니다.' }] }) },
  // ── 전월세 위험 ──
  { id: 'fraud', w: () => S.res.type === 'jeonse' && S.res.dep >= 2 ? 1.2 : 0, run: () => ({ cat: '전월세', t: '전세사기 의심', d: '집주인이 연락이 안 됩니다. 등기부등본을 떼어 보니 근저당이 잔뜩 잡혀 있고, 같은 건물 세입자들이 모이고 있습니다.',
    ch: [{ l: '법적 절차를 밟는다', s: '보증금 일부 회수 · 오래 걸림', f: () => { const lost = r2((S.res.dep - S.res.loan) * rnd(.3, .6)); S.cash = r2(S.cash + (S.res.dep - S.res.loan) - lost); S.res = { type: 'wolse', dep: .1, loan: 0 }; S.flags.fraud = true; S.happy -= 15; return `보증금 중 ${won(lost)}을 끝내 돌려받지 못했습니다. 월세로 옮겼습니다.`; } }] }) },
  // ── 인생 ──
  { id: 'leaveSeoul', w: () => isHomeless() && ageOf() >= 38 && S.t < MAXT - 2 ? 1.2 + (S.leaveBias || 0) : 0, run: () => ({ cat: '인생', t: '지방 지사 발령 제안', d: '회사가 지방 지사장 자리를 제안했습니다. 집값은 서울의 3분의 1, 출퇴근은 15분. 서울 아파트의 꿈은 접어야 합니다.',
    ch: [{ l: '서울을 떠난다', s: '이 선택으로 인생이 마무리돼요', f: () => { S.ended = 'e35'; return '마당 있는 집으로 이사했습니다.'; } }, { l: '서울에 남는다', f: () => { S.happy -= 2; return '서울에서 끝까지 버티기로 했습니다.'; } }] }) },
];

// ===== 🔀 인생의 갈림길: 정해진 시점에 반드시 찾아오는 큰 선택 =====
const CROSS = {
  3: () => ({ cat: '🔀 인생의 갈림길', t: '내 집 마련, 어떤 길로 갈까?', d: '직장 생활 2년 차. 부동산 카페, 유튜브, 선배들의 조언이 쏟아집니다. 이제 내 집 마련 전략을 정할 때입니다.',
    ch: [{ l: '🏚️ 외곽 구축부터 사서 갈아탄다', s: '임장 기회 +3 · 구축 실거주 전략', f: () => { S.goal = 'old'; S.imjang = 3; return '외곽 구축 단지 임장 일정을 잡았습니다. 실거주 2년 뒤 상급지로 갈아타는 게 목표!'; } },
      { l: '🎟️ 무주택을 지키며 청약을 노린다', s: '청약 당첨 확률 보너스', f: () => { S.goal = 'ch'; S.chBonus = (S.chBonus || 0) + 2; return '청약 가점 계산표를 냉장고에 붙였습니다. 무주택 기간이 곧 무기입니다.'; } },
      { l: '🏗️ 재개발·재건축 공부를 시작한다', s: '권리 검증 1회 무료', f: () => { S.goal = 're'; S.freeVerify = (S.freeVerify || 0) + 1; return '정비사업 강의를 들었습니다. 입주권 권리 검증을 한 번 무료로 받을 수 있어요.'; } },
      { l: '🎯 전세 끼고 사는 법(갭투자)을 배운다', s: '전세가율 정보 · 위험 관리', f: () => { S.goal = 'gap'; S.happy = clamp(S.happy + 2, 0, 100); return rules().gap ? '전세가율 높은 단지 목록을 만들었습니다. 만기마다 보증금 차액을 조심하세요.' : '배워 뒀지만 지금은 규제로 갭투자가 막혀 있습니다. 때를 기다립니다.'; } }] }),
  9: () => ({ cat: '🔀 인생의 갈림길', t: '커리어의 갈림길', d: '입사 5년 차. 회사는 익숙해졌지만 연봉은 제자리. 이대로 괜찮을까?',
    ch: [{ l: '🏢 지금 회사에서 승부를 본다', s: '승진 확률 크게 ↑', f: () => { S.career += 4; return '팀장 자리를 노리기로 했습니다. 본업에 집중하면 승진이 가까워요.'; } },
      { l: '🔀 연봉 높여 이직한다', s: '연봉 +18% · 행복 −3', f: () => { S.salary = r2(S.salary * 1.18); S.career = 0; S.happy = clamp(S.happy - 3, 0, 100); return `이직 성공! 연봉 ${won(S.salary)}.`; } },
      { l: '🎓 야간 대학원에 다닌다', s: '1,500만 원 · 체력 −10 · 나중에 연봉 +25%', f: () => { S.cash = r2(S.cash - .15); S.hp = clamp(S.hp - 10, 0, 100); S.gradT = S.t + 4; return '2년 동안 퇴근 후 학교에 갑니다. 졸업하면 연봉이 크게 오를 거예요.'; } },
      { l: '🚀 퇴사하고 내 사업을 한다', s: '다음 반기부터 사장님', f: () => { S.plan.work = 'biz'; return '사표를 품에 넣었습니다. 다음 반기, 창업합니다!'; } }] }),
  15: () => S.married >= 0 ? ({ cat: '🔀 인생의 갈림길', t: '우리 가족의 다음 장', d: '서른 중반. 저녁을 먹다 배우자가 조심스럽게 묻습니다. "우리, 이제 아이 생각도 해볼까?"',
    ch: [{ l: '👪 아이를 갖는다', s: '양육비 · 가점 ↑ · 행복 ↑', ok: () => S.kids.length < 3, f: () => { S.kids.push(S.t); S.happy = clamp(S.happy + 10, 0, 100); return '가족이 늘었습니다! 청약 가점도 올라갑니다.'; } },
      { l: '🏠 집부터 마련하고 낳자', s: '행복 −3 · 내 집 마련에 집중', f: () => { S.happy = clamp(S.happy - 3, 0, 100); return '둘이 힘을 합쳐 먼저 우리 집을 마련하기로 했습니다.'; } },
      { l: '✈️ 둘만의 시간을 더 즐긴다', s: '500만 원 · 행복 +6', f: () => { S.cash = r2(S.cash - .05); S.happy = clamp(S.happy + 6, 0, 100); return '여행을 다녀오며 둘만의 시간을 보냈습니다.'; } }] }) : ({ cat: '🔀 인생의 갈림길', t: '사랑이냐, 집이냐', d: '서른 중반. 오래 만난 사람이 진지한 이야기를 꺼냅니다. "우리, 결혼할까?"',
    ch: [{ l: '💍 결혼한다', s: '맞벌이 소득 · 결혼 비용 · 행복 ↑', ok: () => S.married < 0, f: () => { const c = .3; S.cash = r2(S.cash - c); S.married = S.t; S.spouse = r2(rnd(.38, .6)); S.happy = clamp(S.happy + 15, 0, 100); return `결혼했습니다! 결혼 비용 ${won(c)}, 배우자 연봉 ${won(S.spouse)}이 더해집니다.`; } },
      { l: '⏳ 집부터 마련하고 결혼하자고 한다', s: '행복 −8 · 1년 뒤 다시', ok: () => S.married < 0, f: () => { S.happy = clamp(S.happy - 8, 0, 100); S.crossRetry = S.t + 2; return '상대가 서운해했지만 기다려 주기로 했습니다.'; } },
      { l: '🏃 일과 돈에 집중하며 혼자 산다', s: '행복 −4 · 체력 +5', f: () => { S.happy = clamp(S.happy - 4, 0, 100); S.hp = clamp(S.hp + 5, 0, 100); S.flags.single = true; return '혼자만의 속도로 살기로 했습니다.'; } },
      ] }),
  23: () => ({ cat: '🔀 인생의 갈림길', t: '자산을 어떻게 굴릴까?', d: '마흔을 넘었습니다. 지금까지 모은 것을 어떻게 키우느냐에 노후가 달려 있습니다.',
    ch: [{ l: '🚚 상급지로 갈아탄다', s: '좋은 동네 매물 찾기 · 갈아타기 엔딩 ↑', f: () => { S.goal = 'move'; S.imjang = 3; return '주말마다 상급지 임장을 다니기로 했습니다. 임장 기회 3회.'; } },
      { l: '📈 주식 비중을 늘린다', s: '현금 30%를 우량주로', ok: () => S.cash > .2, f: () => { buyStock('usx', r2(S.cash * .3)); return '우량주를 사 모으기 시작했습니다. 길게 가져갈 생각입니다.'; } },
      { l: '💵 현금을 쌓아 기회를 기다린다', s: '위기 때 급매 기회', f: () => { S.cashMode = true; S.happy = clamp(S.happy + 2, 0, 100); return '쓸 데 없는 돈은 쓰지 않고 위기를 기다립니다.'; } },
      { l: '🌳 서울을 떠날 준비를 한다', s: '지방 이주 제안이 더 자주 와요', f: () => { S.leaveBias = 3; return '지방 도시의 집값을 검색해 보기 시작했습니다.'; } }] }),
  31: () => ({ cat: '🔀 인생의 갈림길', t: '인생 2막을 준비할 때', d: '어느덧 쉰을 바라봅니다. 남은 시간, 무엇을 지키고 무엇을 키울까요?',
    ch: [{ l: '🩺 건강부터 챙긴다', s: '체력 +30 · 행복 +5', f: () => { S.hp = clamp(S.hp + 30, 0, 100); S.happy = clamp(S.happy + 5, 0, 100); S.cash = r2(S.cash - .05); return '종합검진을 받고 운동을 시작했습니다.'; } },
      { l: '🏝️ 조기 은퇴를 준비한다', s: '부수입 늘리기', f: () => { S.passive = r2((S.passive || 0) + .02); return '배당과 월세로 생활비를 만드는 계획을 세웠습니다.'; } },
      { l: '📚 아이 교육에 투자한다', s: '2,000만 원 · 행복 +8', ok: () => S.kids.length > 0, f: () => { S.cash = r2(S.cash - .2); S.happy = clamp(S.happy + 8, 0, 100); return '아이의 꿈을 응원하기로 했습니다.'; } },
      { l: '🔥 마지막 승부, 한 채 더!', s: '추가 매수 의지 · 임장 +3', f: () => { S.imjang = 3; S.goal = 'more'; return '마지막으로 한 번 더 크게 움직여 보기로 했습니다.'; } }] }),
};
function drawEvent() {
  const pool = EVENTS.map(e => [e, Math.max(0, e.w())]).filter(x => x[1] > 0 && x[0].id !== S.lastEv);
  let tot = pool.reduce((a, x) => a + x[1], 0), r = Math.random() * tot;
  for (const [e, w] of pool) { if ((r -= w) < 0) { S.lastEv = e.id; return e; } }
  return null;
}

function winBun(c) { S.cash = r2(S.cash - c.p * .1); S.st.chWin++; S.props.push({ uid: S.uid++, vb: true, vname: c.n, vgu: c.gu, kind: 'bun', total: c.p, base: c.p, G0: S.G, prem: rnd(1.15, 1.45), mv: yearOf() + 3, buyT: S.t, loan: 0, fromCh: true, resaleOk: rules().bunResale }); }
