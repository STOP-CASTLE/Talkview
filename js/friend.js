/* 친구 분석 (v18) — CLAUDE.md "v18 친구".
   analyze 결과(r)로 우정 지수·웃음·챙김·조언·우정 이야기를 만든다. 숫자는 r에서 계산한 것만, 재미용. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"), require("./story.js"));
  else root.Friend = factory(root.U, root.Story);
})(this, function (U, Story) {
  "use strict";
  const { num, num1, iga, eunneun, eulreul, gwawa, fmtDate } = U;
  const clamp = v => Math.max(0, Math.min(1, v || 0));
  const pct = v => Math.round((v || 0) * 100);
  const yeoss = w => w + (U.jong(w) ? "이었어요" : "였어요");
  const ira = w => w + (U.jong(w) ? "이라는" : "라는");
  const P = text => ({ type: "p", text });
  const isText = l => l && l.text && !/^\((사진|이모티콘|통화|링크|삭제)/.test(l.text);
  const short = (t, n = 28) => t.length > n ? t.slice(0, n) + "…" : t;
  const timeOf = t => { const d = new Date(t); return U.hm(d.getHours() * 60 + d.getMinutes()); };
  const and = (a, b) => `${a}${gwawa(a).slice(a.length)} ${b}`;

  function verdict(s) {
    return s >= 80 ? "말 안 해도 통하는 사이예요" : s >= 60 ? "든든한 친구 사이예요" : s >= 40 ? "편하게 이어지는 사이예요" : "천천히 가까워지는 사이예요";
  }

  function make(r, info) {
    info = info || {};
    const [A, B] = r.people, ov = r.overview, sp = r.speed, bal = r.balance;
    const tc = p => ov.textCount[p] || 1, texts = (ov.textCount[A] || 0) + (ov.textCount[B] || 0) || 1;
    const laughBy = r.laughBy || { [A]: 0, [B]: 0 }, react = r.laughReact || { [A]: 0, [B]: 0 };
    const careOf = p => bal.per[p].askCare + bal.per[p].care.reduce((x, c) => x + c.n, 0);
    const timeOf2 = p => (((r.loveLang || {})[p] || {}).cats || []).find(c => c.key === "time") || { count: 0 };
    const together = timeOf2(A).count + timeOf2(B).count + (ov.callCount || 0);

    const parts = [
      { key: "steady", label: "꾸준함", w: 20, v: ov.chatDays / ov.span / 0.6, say: `${num(ov.span)}일 중 ${num(ov.chatDays)}일 이야기했어요.` },
      { key: "laugh", label: "웃음", w: 20, v: (laughBy[A] + laughBy[B]) / texts / 0.3, say: `말풍선 ${pct((laughBy[A] + laughBy[B]) / texts)}%에 ㅋㅋ나 ㅎㅎ가 들어 있어요.` },
      { key: "balance", label: "주고받는 균형", w: 15, v: 1 - Math.abs(ov.byWho[A] - ov.byWho[B]) / (ov.total || 1), say: `${A} ${num(ov.byWho[A])}개, ${B} ${num(ov.byWho[B])}개를 보냈어요.` },
      { key: "reply", label: "답장", w: 15, v: (((sp.reply[A].in30 || 0) + (sp.reply[B].in30 || 0)) / 2) / 0.8, say: `30분 안에 온 답장이 ${pct(((sp.reply[A].in30 || 0) + (sp.reply[B].in30 || 0)) / 2)}%예요.` },
      { key: "care", label: "챙김", w: 15, v: (careOf(A) + careOf(B)) / texts * 1000 / 60, say: `안부·응원·위로·걱정의 말이 ${num(careOf(A) + careOf(B))}번 오갔어요.` },
      { key: "together", label: "함께하기", w: 15, v: together / texts * 1000 / 60, say: `'같이', '만나', '놀러' 같은 말과 통화가 ${num(together)}번이에요.` }
    ].map(p => Object.assign(p, { score: clamp(p.v), pts: Math.round(clamp(p.v) * p.w) }));
    const score = parts.reduce((x, p) => x + p.pts, 0);

    // 요즘 흐름 (최근 90일 vs 이전)
    const dayKeys = Object.keys(r.daily).sort(), cut = U.addDays(ov.last, -89);
    let trend = null;
    if (ov.span >= 120) {
      const rec = dayKeys.filter(k => k >= cut), old = dayKeys.filter(k => k < cut);
      const recRate = rec.reduce((s, k) => s + r.daily[k].total, 0) / (U.diffDays(cut, ov.last) + 1);
      const oldRate = old.reduce((s, k) => s + r.daily[k].total, 0) / Math.max(1, U.diffDays(ov.first, cut));
      const ini = (ks, idx) => ks.reduce((s, k) => s + (r.days && r.days[k] ? r.days[k][idx] : 0), 0);
      const ra = ini(rec, 9), rb = ini(rec, 10);
      trend = { recRate, oldRate, change: oldRate ? recRate / oldRate - 1 : 0, recInitA: (ra + rb) ? ra / (ra + rb) : null };
    }

    const months = Object.keys(r.monthly).sort();
    const monthly = months.map(k => ({ month: k, total: r.monthly[k].total, a: r.monthly[k][A] || 0, b: r.monthly[k][B] || 0 }));
    const funnier = react[A] >= react[B] ? A : B, laugher = laughBy[A] / tc(A) >= laughBy[B] / tc(B) ? A : B;
    const carer = careOf(A) >= careOf(B) ? A : B;
    const initTot = (sp.init[A] + sp.init[B]) || 1, initA = sp.init[A] / initTot;

    /* 조언: 약한 항목 + 흐름 */
    const items = [];
    if (trend && trend.change <= -0.25) items.push({ title: "요즘 조금 뜸해졌어요", why: `최근 석 달 하루 말풍선이 ${num1(trend.oldRate)}개 → ${num1(trend.recRate)}개로 줄었어요.`, how: "바빠서 그런 거라면 괜찮아요. 오랜만에 그 친구가 좋아하던 이야기로 가볍게 말을 걸어 보세요. '이거 보니까 너 생각났어' 한 줄이면 충분해요.", level: "high" });
    if (Math.abs(initA - 0.5) >= 0.2 && initTot >= 20) { const more = initA > 0.5 ? A : B, less = more === A ? B : A; items.push({ title: "먼저 연락하는 쪽이 한 사람에게 몰려 있어요", why: `조용하다가 먼저 말을 건 건 ${more} ${pct(Math.max(initA, 1 - initA))}%예요.`, how: `${eunneun(less)} 가끔 먼저 연락해 보세요. 늘 먼저 연락하던 친구에게는 그게 꽤 큰 선물이에요.`, level: "mid" }); }
    const P0 = k => parts.find(p => p.key === k);
    if (P0("care").score < 0.5) items.push({ title: "안부 한 줄 더하기", why: P0("care").say, how: "'오늘 어땠어?', '시험 잘 봤어?'처럼 그 친구의 하루를 물어보세요. 친한 사이일수록 안부는 생략되기 쉬워요.", level: "mid" });
    if (P0("together").score < 0.5) items.push({ title: "얼굴 보는 약속 만들기", why: P0("together").say, how: "'언제 한번 보자' 대신 '이번 주 금요일 저녁 어때?'처럼 날짜를 정해서 물어보세요. 카톡으로 이어진 우정도 가끔은 만나서 채워야 해요.", level: "mid" });
    if (P0("reply").score < 0.5) items.push({ title: "답장은 짧아도 괜찮아요", why: P0("reply").say, how: "바쁠 땐 '이따 답할게' 한 줄이면 돼요. 기다리는 쪽은 답의 길이보다 '읽었다는 표시'가 더 고마워요.", level: "low" });
    const good = parts.filter(p => p.score >= 0.75).map(p => ({ title: p.label, why: p.say }));
    const general = [
      { title: "생일과 기념일 챙기기", how: "카톡 생일 알림이 뜨면 기프티콘 하나보다 긴 메시지 한 줄이 더 오래 남아요." },
      { title: "고마웠던 일 말해 주기", how: "오래 알던 친구일수록 고맙다는 말을 잊기 쉬워요. 예전에 고마웠던 일을 한 번 꺼내 말해 보세요." },
      { title: "반년 뒤 다시 보기", how: "반년쯤 뒤에 다시 대화를 불러와 보세요. 우정이 어떻게 이어졌는지 볼 수 있어요." }
    ];

    const out = { A, B, score, verdict: verdict(score), parts, trend, monthly, laughBy, react, funnier, laugher, carer, careOf: { [A]: careOf(A), [B]: careOf(B) }, together, advice: { items, good, general } };
    out.story = story(r, out, info);
    return out;
  }

  /* ---------- 우정 이야기 (확정 틀, 친구 버전 — v18.1: 더 활기차게) ----------
     친구 사이답게 짧고 통통 튀는 문장, 장난스러운 장 제목, 느낌표. 사실(숫자·날짜·대사)은 데이터만. */
  function story(r, f, info) {
    const { A, B } = f, ov = r.overview, sp = r.speed, hl = r.highlights, L = r.love;
    const first = hl.opening && hl.opening.lines.find(isText);
    const days = ov.span, ch = [];
    const since = info.since && /^\d{4}-\d{2}/.test(info.since) ? info.since.slice(0, 7) : null;
    const lb = f.laughBy, laughs = lb[A] + lb[B], per = r.balance.per;
    const careAll = f.careOf[A] + f.careOf[B], askAll = per[A].askCare + per[B].askCare;

    const opening = [];
    if (first) opening.push(`${fmtDate(ov.first)}, ${timeOf(first.t)}.`, `${iga(first.who)} 먼저 말을 걸었어요.`, `“${short(first.text, 30)}”`);
    else opening.push(`${fmtDate(ov.first)}.`, "두 사람의 수다가 시작됐어요.");
    opening.push("그때는 몰랐겠죠.", `이 한 줄이 ${num(ov.total)}개의 수다가 되고,`, `${num(laughs)}번의 ㅋㅋ가 될 줄은!`);
    const cover = { title: `${A} & ${B}`, subtitle: "우리의 우정을 기억하다", score: f.score, opening, start: `자, ${and(A, B)}의 우정 이야기, 지금 시작합니다!` };

    ch.push({ id: "prologue", title: "프롤로그", blocks: [
      P(`이 두 사람을 소개해 달라고요? 좋아요, 제가 할게요. 무려 ${num(ov.total)}개의 말풍선을 처음부터 끝까지 다 읽었거든요. 중간중간 같이 웃으면서요.`),
      P(`친구가 뭐냐고 물으면 저는 이렇게 답할래요. 웃긴 걸 보면 제일 먼저 떠오르는 사람. ${and(A, B)}가 딱 그랬어요.${since ? ` 친구가 된 건 ${fmtDate(since)}부터라고 하니, 이 대화는 그 긴 우정의 한 조각이에요.` : ""}`.replace(`${and(A, B)}가`, `${and(A, B)}${U.jong(B) ? "이" : "가"}`)),
      P(`${num(days)}일 동안 ${num(ov.chatDays)}일을 떠들었고, ㅋㅋ나 ㅎㅎ가 들어간 말풍선만 ${num(laughs)}개예요. 진짜 많이 웃었어요, 이 두 사람.`),
      { type: "stats", items: [
        { label: "같이 떠든 날", value: num(ov.chatDays) + "일", sub: `${num(days)}일 중` },
        { label: "주고받은 수다", value: num(ov.total) + "개", sub: `하루 평균 ${num(ov.avgPerDay)}개` },
        { label: "ㅋㅋ가 터진 말풍선", value: num(laughs) + "개", sub: "적어도 이만큼은 웃었어요" },
        { label: "연속 수다 기록", value: num(ov.longestStreak) + "일", sub: "하루도 안 빠지고!" }
      ] },
      { type: "lines", lines: ["그럼 먼저, 이 두 사람부터 소개할게요!"] }
    ] });

    ch.push({ id: "people", title: `1. 이 둘을 소개합니다`, blocks: [
      P(`같은 대화방에서 매일 떠들었지만, ${and(A, B)}는 꽤 다른 사람이에요. 그래서 더 재밌어요.`.replace(`${and(A, B)}는`, `${and(A, B)}${U.jong(B) ? "은" : "는"}`)),
      ...Story.portrait(r, A, B, { friend: true }),
      ...Story.portrait(r, B, A, { friend: true }),
      { type: "aside", text: `이 대화방의 웃음 담당: ${f.funnier}. ${f.funnier}의 말 뒤에 ㅋㅋ가 ${num(f.react[f.funnier])}번 따라왔어요!` }
    ] });

    const b1 = [P("모든 찐친도 처음엔 어색했어요. 그 어색한 첫마디를 다시 보는 게 우정 이야기의 제일 웃긴 부분이에요.")];
    if (first) b1.push(P(`${fmtDate(ov.first)}, ${timeOf(first.t)}. ${iga(first.who)} 먼저 말을 걸었어요. 지금 보면 "이게 시작이었다고?" 싶을 만큼 별거 없는 대화예요. 원래 그런 거예요, 좋은 우정은.`));
    if (hl.opening) b1.push({ type: "scene", title: "모든 게 시작된 대화", date: hl.opening.date, lines: hl.opening.lines });
    ch.push({ id: "c1", title: "2. 시작은 별거 없었다", blocks: b1 });

    const b2 = [P("친구랑 나눈 카톡을 다시 읽으면, 무슨 얘기였는지는 기억 안 나도 그때 배 잡고 웃은 건 기억나요.")];
    b2.push(P(`더 자주 웃은 건 ${yeoss(f.laugher)}. 그리고 더 많이 웃긴 건 ${yeoss(f.funnier)}! ${f.funnier}${U.jong(f.funnier) ? "이" : "가"} 한마디 던지면, 열 번 중 몇 번은 ㅋㅋ가 바로 돌아왔어요.`));
    if (hl.laughDay) {
      b2.push({ type: "lines", lines: [`${fmtDate(hl.laughDay.date)}.`, `ㅋㅋ가 ${num(hl.laughDay.n)}번 터진 날!`] });
      b2.push({ type: "scene", title: "ㅋㅋ가 멈추지 않던 날", date: hl.laughDay.date, lines: hl.laughDay.lines });
    }
    ch.push({ id: "c2", title: "3. ㅋㅋㅋ가 멈추지 않던 날", blocks: b2 });

    const b3 = [
      P("친구끼리는 '걱정돼', '고마워' 같은 말을 대놓고 잘 안 해요. 오글거리니까요. 대신 툭툭 던지죠. \"밥은 먹었냐\", \"괜찮냐\"처럼요."),
      P(`그렇게 툭 던진 안부가 ${num(askAll)}번.${careAll > askAll ? ` 응원하고 위로하고 걱정한 말까지 합치면 ${num(careAll)}번이에요.` : ""} 오글거린다면서 할 건 다 했어요. 특히 ${f.carer}!`),
      L.thanks.total ? P(`"고마워"도 ${num(L.thanks.total)}번이나 나왔어요(${A} ${num(L.thanks[A])}번, ${B} ${num(L.thanks[B])}번). 쑥스러워도 할 말은 하는 사이예요.`) : null
    ].filter(Boolean);
    ch.push({ id: "c3", title: "4. 툭툭 던지는 챙김", blocks: b3 });

    const b4 = [P("어떤 날은 할 말이 끝도 없이 쏟아져요. 하나 말하면 하나 더 생각나고, 그러다 보면 몇 시간이 훌쩍 지나 있는 날이요.")];
    if (r.topDays[0]) b4.push(P(`${fmtDate(r.topDays[0].date)}, 두 사람은 하루에 무려 ${num(r.topDays[0].total)}개의 말풍선을 쏟아냈어요. 평소의 ${Math.round(r.topDays[0].total / Math.max(1, ov.avgPerDay))}배예요!`));
    if (hl.peakDay) b4.push({ type: "scene", title: "수다가 폭발한 날", date: hl.peakDay.date, lines: hl.peakDay.lines });
    ch.push({ id: "c4", title: "5. 수다 폭발한 날", blocks: b4 });

    const ls = sp.longestSilence;
    const b5 = [P("찐친의 특징 하나. 한참 연락이 없어도 어색하지 않아요. 다시 말을 거는 순간, 어제 하던 얘기처럼 바로 이어지니까요.")];
    if (ls && ls.hours >= 24) b5.push(P(`가장 오래 잠수 탄 건 ${num1(ls.hours / 24)}일(${fmtDate(ls.from)}부터). 그리고 그 잠수를 먼저 끝낸 건 ${yeoss(ls.breaker)}! 역시 먼저 연락하는 쪽이 이기는 거예요.`));
    if (f.trend) b5.push(P(f.trend.change <= -0.25 ? `요즘은 조금 뜸해졌어요(하루 ${num1(f.trend.oldRate)}개 → ${num1(f.trend.recRate)}개). 괜찮아요. 각자 바빠진 것뿐이에요. 찐친은 이 정도로 안 멀어져요.` : f.trend.change >= 0.2 ? `그리고 요즘은 오히려 더 시끄러워졌어요(하루 ${num1(f.trend.oldRate)}개 → ${num1(f.trend.recRate)}개)!` : "요즘도 여전히, 꾸준히 떠들고 있어요."));
    ch.push({ id: "c5", title: "6. 잠수, 그리고 귀환", blocks: b5 });

    ch.push({ id: "c6", title: "7. 그래서, 찐친인가요?", blocks: [
      { type: "lines", lines: ["그래서, 두 사람은 찐친인가요?"] },
      P("음, 바로 대답하기는 좀 그래요. 답장 늦은 날도 있었고, 잠수 탄 날도 있었고, 서로 놀린 날은 셀 수도 없으니까요."),
      { type: "aside", big: true, text: "근데 한 가지는 확실해요." },
      P(`두 사람은 ${num(laughs)}번 같이 웃었고, ${num(askAll)}번 서로의 하루를 물었고,${careAll > askAll ? ` 응원하고 걱정한 말까지 ${num(careAll)}번 서로를 챙겼고,` : ""} 조용해질 때마다 ${num(sp.init[A] + sp.init[B])}번 다시 먼저 말을 걸었어요. 이 정도면 찐친 인정이에요!`),
      ...[`${and(A, B)}에게!`, `${num(days)}일 치 수다를 다 읽었어요. 시시한 농담, 아무 말 대잔치, 가끔 진지한 고민까지. 읽는 내내 저도 좀 웃었어요.`, "좋은 친구는 대단한 순간보다 별거 없는 하루를 더 많이 같이 보내는 사람이에요. 두 사람이 딱 그래요. 앞으로도 웃긴 거 보면 제일 먼저 보내 주는 사이로, 오래오래 시끄럽게 지내요!", "— TALK VIEW"].map(t => ({ type: "p", letter: true, text: t }))
    ] });

    const ep = [P(`아마 오늘도 ${eunneun(A)} 웃긴 걸 보다가 ${eulreul(B)} 떠올렸을 거예요. 그리고 ${B}도 똑같았을 거고요.`)];
    if (hl.latest) ep.push({ type: "scene", title: "가장 최근의 수다", date: hl.latest.date, lines: hl.latest.lines });
    ep.push(P(`첫 인사부터 지금까지 ${num(days)}일. 그리고 이 수다는 아직 끝나지 않았어요.`));
    ep.push({ type: "lines", lines: ["오늘은 아무 이유 없이, \"ㅋㅋ 뭐해?\" 한 줄 보내 보세요!"] });
    ch.push({ id: "epilogue", title: "에필로그", blocks: ep });
    return { cover, chapters: ch };
  }

  return { make, verdict };
});
