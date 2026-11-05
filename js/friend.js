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

  /* ---------- 우정 이야기 (확정 틀, 친구 버전 — v18.2: 진중하고 따뜻하게) ----------
     오래 곁에 있는 친구를 돌아보는 어른스러운 말투. 웃음이 많았던 날은 실제 장면으로 다시 꺼내 회상하게 한다.
     사실(숫자·날짜·대사)은 데이터만, 상상은 "어쩌면", 마음은 "~했을지도 몰라요". */
  function story(r, f, info) {
    const { A, B } = f, ov = r.overview, sp = r.speed, hl = r.highlights, L = r.love;
    const first = hl.opening && hl.opening.lines.find(isText);
    const days = ov.span, ch = [];
    const since = info.since && /^\d{4}-\d{2}/.test(info.since) ? info.since.slice(0, 7) : null;
    const lb = f.laughBy, laughs = lb[A] + lb[B], per = r.balance.per;
    const careAll = f.careOf[A] + f.careOf[B], askAll = per[A].askCare + per[B].askCare;
    const AB = and(A, B), ABsub = AB + (U.jong(B) ? "은" : "는");

    const opening = [];
    if (first) opening.push(`${fmtDate(ov.first)}, ${timeOf(first.t)}.`, `${iga(first.who)} 먼저 말을 걸었어요.`, `“${short(first.text, 30)}”`);
    else opening.push(`${fmtDate(ov.first)}.`, "두 사람의 대화가 시작됐어요.");
    opening.push("그때는 몰랐을 거예요.", `이 한 줄이 ${num(days)}일의 우정이 될 줄은.`);
    const cover = { title: `${A} & ${B}`, subtitle: "우리의 우정을 기억하다", score: f.score, opening, start: `이제, ${AB}의 우정 이야기를 시작할게요.` };

    ch.push({ id: "prologue", title: "프롤로그", blocks: [
      P(`누군가 저에게 이 두 사람을 소개해 달라고 한다면, 아마 이렇게 이야기할 것 같아요. 저는 두 사람이 나눈 ${num(ov.total)}개의 말풍선을 처음부터 끝까지 읽었거든요.`),
      P(`오래 곁에 남는 친구는 대단한 순간을 함께한 사람이 아니에요. 평범한 하루를 가장 많이 나눈 사람이에요. 오늘 있었던 시시한 일, 갑자기 생각난 농담, 아무에게나 하기 어려운 고민까지. ${ABsub} 그런 이야기를 서로에게 먼저 건네는 사이였어요.${since ? ` ${fmtDate(since)}부터 이어진 우정이라고 하니, 이 대화는 그 긴 시간의 일부를 담고 있어요.` : ""}`),
      P(`${num(days)}일 동안 두 사람은 ${num(ov.chatDays)}일을 이야기했어요. 그리고 ${num(laughs)}개의 말풍선에 웃음이 묻어 있었어요. 화면 너머로 같이 웃었던 순간들이에요.`),
      { type: "stats", items: [
        { label: "함께 이야기한 날", value: num(ov.chatDays) + "일", sub: `${num(days)}일 중` },
        { label: "주고받은 말풍선", value: num(ov.total) + "개", sub: `하루 평균 ${num(ov.avgPerDay)}개` },
        { label: "웃음이 묻은 말풍선", value: num(laughs) + "개", sub: "ㅋㅋ · ㅎㅎ" },
        { label: "가장 긴 연속 대화", value: num(ov.longestStreak) + "일", sub: "하루도 빠짐없이" }
      ] },
      { type: "lines", lines: ["먼저, 두 사람이 어떤 사람이었는지부터 이야기할게요."] }
    ] });

    ch.push({ id: "people", title: `1. ${ira(A)} 사람, ${ira(B)} 사람`, blocks: [
      P(`같은 대화방에 있었지만, ${ABsub} 꽤 다른 사람이었어요. 대화를 읽다 보면 그게 보여요.`),
      ...Story.portrait(r, A, B, { friend: true }),
      ...Story.portrait(r, B, A, { friend: true }),
      P(`그리고 두 사람 중 상대를 더 자주 웃게 한 건 ${yeoss(f.funnier)}. ${f.funnier}의 말 바로 뒤에 웃음이 따라온 게 ${num(f.react[f.funnier])}번이에요. 서로 다른 두 사람이라서, 오히려 오래 함께할 수 있었는지도 몰라요.`)
    ] });

    const b1 = [P("모든 우정에는 첫 대화가 있어요. 그때는 그게 시작인 줄도 모르고 지나가지만요.")];
    if (first) b1.push(P(`${fmtDate(ov.first)}, ${timeOf(first.t)}. ${iga(first.who)} 먼저 말을 걸었어요. 지금 다시 읽어 보면 별것 아닌 대화인데, 이상하게 오래 들여다보게 돼요. 모든 게 여기서 시작됐으니까요.`));
    if (hl.opening) b1.push({ type: "scene", title: "첫 대화", date: hl.opening.date, lines: hl.opening.lines });
    ch.push({ id: "c1", title: "2. 처음 말을 건 날", blocks: b1 });

    const b2 = [
      P("친구와 나눈 대화를 오랜만에 다시 읽으면, 무슨 이야기였는지보다 그때 웃었던 기억이 먼저 떠올라요. 그래서 웃음이 가장 많이 오갔던 날들을 골라 두었어요."),
      P(`천천히 다시 읽어 보세요. 어쩌면 그날의 공기와, 휴대폰을 보며 혼자 웃던 자신의 모습까지 떠오를지도 몰라요.`)
    ];
    const moments = hl.laughMoments && hl.laughMoments.length ? hl.laughMoments : hl.laughDay ? [hl.laughDay] : [];
    moments.forEach(m => {
      b2.push({ type: "lines", lines: [`${fmtDate(m.date)}.`, `웃음이 ${num(m.n)}번 오간 날.`] });
      b2.push({ type: "scene", title: "그날의 대화", date: m.date, lines: m.lines });
    });
    if (!moments.length) b2.push(P("웃음이 한곳에 몰린 날은 찾지 못했어요. 대신 웃음이 하루하루에 고르게 흩어져 있었어요."));
    ch.push({ id: "c2", title: "3. 함께 웃었던 날들", blocks: b2 });

    const b3 = [
      P("친구 사이에는 '고마워', '걱정돼' 같은 말을 쉽게 꺼내지 않아요. 쑥스럽기도 하고, 굳이 말하지 않아도 안다고 생각하니까요. 그래도 대화를 천천히 읽으면, 그 마음이 곳곳에 놓여 있어요."),
      P(`"밥은 먹었어?", "괜찮아?" 같은 안부가 ${num(askAll)}번 오갔어요.${careAll > askAll ? ` 응원하고, 위로하고, 걱정하는 말까지 더하면 ${num(careAll)}번이에요.` : ""} 그중 조금 더 자주 마음을 건넨 건 ${yeoss(f.carer)}.`),
      L.thanks.total ? P(`"고마워"는 ${num(L.thanks.total)}번 나왔어요. ${A} ${num(L.thanks[A])}번, ${B} ${num(L.thanks[B])}번. 짧은 한마디였지만, 그 말이 있어서 서로가 조금 덜 외로웠을지도 몰라요.`) : null
    ].filter(Boolean);
    ch.push({ id: "c3", title: "4. 말없이 건넨 마음", blocks: b3 });

    const b4 = [P("어떤 날은 이야기가 쉽게 끝나지 않아요. 하나를 말하면 다른 하나가 떠오르고, 그렇게 시간이 가는 줄 모르는 날이요.")];
    if (r.topDays[0]) b4.push(P(`${fmtDate(r.topDays[0].date)}, 두 사람은 하루에 ${num(r.topDays[0].total)}개의 말풍선을 주고받았어요. 평소보다 ${Math.round(r.topDays[0].total / Math.max(1, ov.avgPerDay))}배쯤 많은 날이에요. 그날은 서로에게 할 말이 유난히 많았나 봐요.`));
    if (hl.peakDay) b4.push({ type: "scene", title: "가장 오래 이야기한 날", date: hl.peakDay.date, lines: hl.peakDay.lines });
    ch.push({ id: "c4", title: "5. 가장 오래 이야기한 날", blocks: b4 });

    const ls = sp.longestSilence;
    const b5 = [P("오래된 친구 사이에는 조용한 시간도 있어요. 각자의 삶이 바빠지는 때가 오니까요. 그런데 좋은 친구는 다시 말을 거는 순간, 어제 이야기하던 것처럼 이어져요.")];
    if (ls && ls.hours >= 24) b5.push(P(`가장 오래 연락이 없던 건 ${num1(ls.hours / 24)}일이에요(${fmtDate(ls.from)}부터). 그 침묵을 먼저 깬 건 ${yeoss(ls.breaker)}. 어쩌면 그사이에도 문득문득 서로를 떠올렸을지도 몰라요.`));
    if (f.trend) b5.push(P(f.trend.change <= -0.25 ? `요즘은 예전보다 조금 뜸해졌어요(하루 ${num1(f.trend.oldRate)}개 → ${num1(f.trend.recRate)}개). 하지만 뜸해지는 건 멀어지는 게 아니에요. 각자의 하루를 열심히 살고 있다는 뜻일 때가 더 많아요.` : f.trend.change >= 0.2 ? `그리고 요즘은 오히려 예전보다 더 자주 이야기하고 있어요(하루 ${num1(f.trend.oldRate)}개 → ${num1(f.trend.recRate)}개).` : "요즘도 두 사람은 예전처럼 꾸준히 이야기하고 있어요."));
    ch.push({ id: "c5", title: "6. 조용했던 시간, 그리고 다시", blocks: b5 });

    ch.push({ id: "c6", title: "7. 두 사람은 좋은 친구였나요", blocks: [
      { type: "lines", lines: ["그래서, 두 사람은 좋은 친구였나요?"] },
      P("쉽게 대답하지 못할 것 같아요. 답장이 늦은 날도, 서운했던 날도, 한동안 연락이 없던 날도 있었으니까요."),
      { type: "aside", big: true, text: "하지만 한 가지는 확실해요." },
      P(`두 사람은 ${num(laughs)}번 함께 웃었고, ${num(askAll)}번 서로의 하루를 물었고,${careAll > askAll ? ` ${num(careAll)}번 서로를 챙겼고,` : ""} 조용해질 때마다 ${num(sp.init[A] + sp.init[B])}번 다시 먼저 말을 걸었어요. 그건 서로에게 좋은 친구였다는 뜻이에요.`),
      ...[`${AB}에게.`, `${num(days)}일 동안의 대화를 처음부터 끝까지 읽었어요. 거기엔 시시한 농담과, 별것 아닌 하루와, 가끔은 쉽게 꺼내기 어려웠을 이야기가 함께 있었어요.`, "살다 보면 연락이 뜸해지는 때도 오고, 각자의 자리가 멀어지는 때도 와요. 그래도 오늘 이 대화를 다시 웃으며 읽을 수 있다면, 두 사람은 이미 서로에게 오래 남을 사람이에요. 앞으로도 평범한 하루를 가장 먼저 나눌 수 있는 친구로 지내 주세요.", "— TALK VIEW"].map(t => ({ type: "p", letter: true, text: t }))
    ] });

    const ep = [P(`어쩌면 오늘도 ${eunneun(A)} 무언가를 보다가 문득 ${eulreul(B)} 떠올렸을지도 몰라요. 그리고 ${B}도 그랬을 거예요.`)];
    if (hl.latest) ep.push({ type: "scene", title: "가장 최근의 대화", date: hl.latest.date, lines: hl.latest.lines });
    ep.push(P(`첫 인사부터 이 마지막 대화까지 ${num(days)}일. 이 우정은 아직 이어지고 있어요.`));
    ep.push({ type: "lines", lines: ["오늘은, 먼저 안부 한 줄 보내 보세요."] });
    ch.push({ id: "epilogue", title: "에필로그", blocks: ep });
    return { cover, chapters: ch };
  }

  return { make, verdict };
});
