/* 사랑 이야기 v7 — 읽는 이야기(에세이) 중심.
   오프닝 → 표지 → 프롤로그 + 7개 장 → 편지 → 에필로그.
   원칙: 숫자·날짜·대사는 전부 대화에서 계산한 것만. 마음은 "~했을지도 몰라요" 같은 짐작으로만.
   상상 장면(지하철, 이불 속…)은 반드시 "어쩌면"으로 열어 사실처럼 보이지 않게 한다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"));
  else root.Story = factory(root.U);
})(this, function (U) {
  "use strict";
  const { num, num1, iga, eunneun, gwawa, eulreul, ya, fmtDate, fmtShort, hm } = U;
  const timeOf = t => { const d = new Date(t); return hm(d.getHours() * 60 + d.getMinutes()); };
  const yeotda = w => w + (U.jong(String(w).replace(/['"’”)\]]+$/, "")) ? "이었어요" : "였어요");
  const ro = w => { const c = String(w).replace(/['"’”]+$/, "").slice(-1).charCodeAt(0) - 0xac00; const j = c >= 0 && c < 11172 ? c % 28 : 0; return w + (j && j !== 8 ? "으로" : "로"); };
  const ira = w => w + (U.jong(w) ? "이라고" : "라고");
  const isText = l => l && l.text && !/^\((사진|이모티콘|통화|링크|삭제)/.test(l.text);
  const short = (t, n = 28) => t.length > n ? t.slice(0, n) + "…" : t;
  const P = text => ({ type: "p", text });

  /* 인물 소개: 대표 특징 → 말투 → 리듬 → 솔직한 단점 → 감싸기 → 한 문장 */
  function portrait(r, p, q, cp) {
    const ov = r.overview, sp = r.speed, L = r.love, per = r.balance.per;
    const initTot = (sp.init[p] + sp.init[q]) || 1, initShare = sp.init[p] / initTot;
    const rp = sp.reply[p], rq = sp.reply[q];
    const careOf = x => per[x].askCare + (per[x].care.find(c => c.label === "걱정하고 챙기기") || { n: 0 }).n;
    const traits = [
      { k: "init", s: initShare - 0.5, head: "먼저 다가가는 사람", line: `한동안 조용하다가 대화를 다시 여는 건 대개 ${p}의 몫이었어요. 4시간 넘게 말이 없을 때 먼저 말을 건 게 ${Math.round(initShare * 100)}%예요.` },
      { k: "fast", s: rp.median != null && rq.median != null ? (rq.median - rp.median) / Math.max(1, rq.median) * 0.6 : 0, head: "기다리게 하지 않는 사람", line: `${p}의 답장은 보통 ${num1(rp.median)}분 안에 왔어요. 다섯 번 중 ${Math.round(rp.in5 * 5)}번은 5분도 걸리지 않았어요.` },
      { k: "love", s: L.love[p] ? (L.love[p] - L.love[q]) / Math.max(1, L.love.total) : -1, head: "사랑한다는 말을 아끼지 않는 사람", line: `"사랑해"를 ${num(L.love[p])}번 보냈어요. 마음이 생기면 굳이 숨기지 않았어요.` },
      { k: "care", s: (careOf(p) - careOf(q)) / Math.max(1, careOf(p) + careOf(q)), head: "하루를 챙기는 사람", line: `밥은 먹었는지, 잘 잤는지, 아프진 않은지. ${p}의 안부와 걱정은 ${num(careOf(p))}번이었어요.` }
    ].sort((a, b) => b.s - a.s);
    const top = traits[0], second = traits[1];
    const avgLen = ov.textCount[p] ? ov.chars[p] / ov.textCount[p] : 0;
    const shorts = (r.shorts[p] || []).filter(x => !/^[ㅋㅎㅠㅜ!?.~ ]+$/.test(x.w)).slice(0, 2).map(x => `"${x.w}"`);
    const rt = r.routine.by[p];
    const food = r.life.foods.filter(f => (f.by[p] || 0) >= 5).sort((a, b) => (b.by[p] || 0) - (a.by[p] || 0))[0];
    const c = r.conflict;
    // 솔직한 단점 후보 (가장 두드러진 것 하나)
    const flaws = [
      { s: (1 - rp.in30) - (1 - rq.in30), t: `솔직히 말하면, 답장이 조금 늦는 날도 있었어요. 30분 넘게 걸린 답장이 ${Math.round((1 - rp.in30) * 100)}%쯤 돼요.` },
      { s: (L.love[q] - L.love[p]) / Math.max(1, L.love.total) * 1.2, t: `솔직히 말하면, "사랑해"는 ${q}보다 조금 아끼는 편이었어요.` },
      { s: c.days.length >= 3 ? (c.apologizedFirst[q] - c.apologizedFirst[p]) / Math.max(1, c.days.length) : -1, t: "솔직히 말하면, 서운한 날 먼저 미안하다고 말하기까지는 조금 시간이 걸리는 편이었어요." },
      { s: 0.5 - initShare - 0.05, t: `솔직히 말하면, 먼저 연락하는 쪽은 아니었어요. 대화를 먼저 연 건 ${Math.round(initShare * 100)}%예요.` }
    ].sort((a, b) => b.s - a.s);
    const flaw = flaws[0].s > 0.05 ? flaws[0].t : null;
    const out = [];
    out.push({ type: "lines", lines: [`${p}`, `${top.head}이었어요.`] });
    out.push(P(top.line + (second && second.s > -0.05 ? ` 그리고 ${second.head}이기도 했어요. ${second.line}` : "")));
    const talk = avgLen >= 14 ? `말은 길게 하는 편이었어요. 글 하나에 평균 ${Math.round(avgLen)}자. 하고 싶은 이야기가 생기면 한 번에 다 털어놓았어요.`
      : avgLen && avgLen <= 8 ? `말은 짧고 담백한 편이었어요. 글 하나에 평균 ${Math.round(avgLen)}자. 길게 말하지 않아도 마음은 다 전해졌어요.`
        : `글 하나에 평균 ${Math.round(avgLen)}자, 너무 길지도 짧지도 않게 말하는 사람이었어요.`;
    out.push(P(`${talk}${shorts.length ? ` 입버릇처럼 자주 보내던 말은 ${yeotda(shorts.join(", "))}.` : ""}`));
    const rhythm = [];
    if (rt && rt.ok) rhythm.push(`카톡으로 보면 ${p}의 하루는 보통 ${hm(rt.wake.med)}쯤 시작해서 ${hm(rt.sleep.med)}쯤 끝났어요.`);
    const lg = r.loveLang && r.loveLang[p], LBL = { words: "칭찬과 고마움 같은 말", time: "함께하는 시간", gift: "작은 선물", service: "챙겨 주는 행동", touch: "스킨십" };
    if (lg) rhythm.push(`${cp && cp.friend ? "마음을" : "사랑을"} 표현하는 방식은 주로 ${LBL[lg.top]}이었어요${lg.cats.find(c => c.key === lg.top).examples[0] ? `. "${lg.cats.find(c => c.key === lg.top).examples[0].text}" 같은 말처럼요` : ""}.`.replace("말이었어요", "말이었어요").replace(/(시간|선물|행동|스킨십)이었어요/, (m, w) => w + (U.jong(w) ? "이었어요" : "였어요")));
    const mb = cp && cp.mbti && cp.mbti.by[p];
    if (mb) rhythm.push(mb.same >= 3 ? `스스로를 ${mb.real}라고 소개하는 사람인데, 대화를 읽어 보면 정말 그래요.` : `스스로는 ${mb.real}라고 하지만, 대화 속에서는 조금 다른 얼굴도 보여요.${mb.axes.filter(x => !x.match).length ? " 사랑하는 사람 앞에서는 누구나 조금씩 달라지니까요." : ""}`);
    if (food) rhythm.push(`가장 자주 꺼낸 음식 이야기는 ${yeotda(food.label)}(${num(food.by[p])}번).`);
    if (rhythm.length) out.push(P(rhythm.join(" ")));
    if (flaw) out.push(P(`${flaw} 하지만 이상하게도, 그게 차갑게 느껴지지는 않아요. ${top.k === "love" ? "그만큼 사랑한다는 말을 아끼지 않았으니까요." : top.k === "care" ? "그 대신 누구보다 상대의 하루를 먼저 물어봐 주었으니까요." : top.k === "fast" ? "답이 오는 날엔 누구보다 빨리, 진심으로 달려왔으니까요." : "그 대신 먼저 다가가는 쪽은 언제나 " + yeotda(p).replace("었어요", "었으니까요").replace("였어요", "였으니까요")}`));
    out.push({ type: "aside", text: `${U.eulreul(p)} 한 문장으로 적으면, ${top.head}.` });
    return out;
  }

  function story(r, cp) {
    const si = cp && cp.since;
    const [A, B] = r.people, ov = r.overview, L = r.love, hl = r.highlights;
    const ch = [];
    const first = hl.opening && hl.opening.lines.find(isText);
    const days = ov.span, ratio = ov.chatDays / days;
    const seasons = r.seasons.length;
    const care = r.balance.per;
    const careN = (p, label) => (care[p].care.find(c => c.label === label) || { n: 0 }).n;

    /* ---------- 오프닝 (한 줄씩 떠오름) ---------- */
    const opening = [];
    if (first) opening.push(`${fmtDate(ov.first)}, ${timeOf(first.t)}.`, `${iga(first.who)} 처음으로 말을 걸었어요.`, `“${short(first.text, 30)}”`);
    else opening.push(`${fmtDate(ov.first)}.`, "두 사람의 첫 대화가 시작됐어요.");
    opening.push("그때는 몰랐을 거예요.", `이 한 줄이 ${num(ov.total)}개의 말풍선이 되고,`, `${num(days)}일의 이야기가 될 줄은.`);
    const start = `이제, ${A}${gwawa(A).slice(A.length)} ${B}의 사랑 이야기를 시작할게요.`;
    const cover = { title: `${A} ♥ ${B}`, subtitle: "우리의 모든 순간을 사랑으로 기억하다", score: r.score.total, opening, start };

    /* ---------- 프롤로그 ---------- */
    ch.push({ id: "prologue", title: "프롤로그", blocks: [
      P(`누군가 저에게 이 두 사람을 소개해 달라고 한다면, 아마 이렇게 이야기할 것 같아요. 저는 두 사람이 나눈 ${num(ov.total)}개의 말풍선을 처음부터 끝까지 읽었거든요.`),
      P(`사랑은 대개 아주 작은 데서 시작돼요. 특별한 날이 아니라, 평범한 어느 날의 인사 한 줄에서요. ${A}${gwawa(A).slice(A.length)} ${B}의 이야기도 그랬어요.`),
      P(`${num(days)}일. 계절이 ${num(seasons)}번 바뀌는 동안 두 사람은 ${num(ov.chatDays)}일을 이야기했어요. ${ratio >= 0.9
        ? "바쁜 날도, 지친 날도, 서운한 날도 분명 있었을 텐데 대화는 거의 하루도 끊기지 않았어요. 어떤 날이든 하루의 어딘가에는 늘 서로가 있었어요."
        : ratio >= 0.6 ? "조용한 날도 있었지만, 대화는 늘 다시 이어졌어요. 며칠이 비어도 결국 먼저 말을 거는 쪽이 있었어요."
          : "매일은 아니었어도, 이야기할 때만큼은 마음을 다해 이야기했어요."}`),
      P(`그 시간을 숫자로 적으면 말풍선 ${num(ov.total)}개예요. 하지만 이건 숫자에 대한 이야기가 아니에요. 그 숫자 하나하나를 보내던 마음에 대한 이야기예요. 어쩌면 퇴근길에서, 어쩌면 잠들기 직전 불 꺼진 방에서, 두 사람은 몇 번이고 휴대폰을 들어 서로에게 말을 걸었어요.`),
      { type: "stats", items: [
        { label: "함께 이야기한 날", value: num(ov.chatDays) + "일", sub: `${num(days)}일 중` },
        { label: "주고받은 말풍선", value: num(ov.total) + "개", sub: `하루 평균 ${num(ov.avgPerDay)}개` },
        { label: "사랑해", value: num(L.love.total) + "번", sub: `${A} ${num(L.love[A])} · ${B} ${num(L.love[B])}` },
        { label: "잘 자", value: num(L.goodnight.total) + "번", sub: "그만큼의 밤" }
      ] },
      P(`${num(L.goodnight.total)}번의 "잘 자". 그건 ${num(L.goodnight.total)}번의 밤 동안 하루의 마지막 말을 서로에게 남겼다는 뜻이에요. 그리고 ${num(L.goodmorning.total)}번의 "좋은 아침"으로, 다음 날을 다시 서로에게서 시작했어요.`),
      { type: "lines", lines: ["먼저, 두 사람이 어떤 사람이었는지부터 이야기할게요."] }
    ] });

    /* ---------- 1장: 두 사람 ---------- */
    ch.push({ id: "people", title: `1. ${A}이라는 사람, ${B}라는 사람`.replace(`${A}이라는`, A + (U.jong(A) ? "이라는" : "라는")).replace(`${B}라는 사람`, B + (U.jong(B) ? "이라는" : "라는") + " 사람"), blocks: [
      P("같은 대화방에 있었지만, 두 사람은 꽤 다른 사람이었어요. 대화를 읽다 보면 그게 보여요."),
      ...portrait(r, A, B, cp),
      ...portrait(r, B, A, cp),
      P(`이렇게 다른 두 사람이 ${num(days)}일 동안 같은 대화방에 있었어요. 어쩌면 서로 달라서, 오히려 서로를 채워 줄 수 있었는지도 몰라요.`)
    ] });

    /* ---------- 1장: 조심스럽게 시작한 우리 ---------- */
    const sf = r.speech.first, sl = r.speech.last;
    const b1 = [
      P("처음은 언제나 조심스러워요. 어떤 말투로 말을 걸어야 할지, 답장은 얼마나 기다렸다가 보내야 할지, 이모티콘 하나를 붙일까 말까까지 고민하게 되죠. 아마 두 사람도 그랬을 거예요."),
      P(first ? `${fmtDate(ov.first)}, ${timeOf(first.t)}. ${iga(first.who)} 먼저 말을 걸었어요. 지금 다시 읽어 보면 별것 아닌 대화인데, 이상하게 마음이 간질간질해요. 모든 게 여기서 시작됐으니까요.` : `${fmtDate(ov.first)}, 두 사람의 첫 대화가 남아 있어요.`)
    ];
    if (hl.opening) b1.push({ type: "scene", title: "첫 대화", date: hl.opening.date, lines: hl.opening.lines });
    if (sf[A] != null && sl[A] != null && sf[A] > sl[A] + 20) {
      b1.push(P(`처음 한 달, ${A}의 말 중 ${sf[A]}%는 "~요"로 끝났어요. 서로를 아직 어려워하던 시절의 말투예요. 그런데 마지막 한 달에는 ${sl[A]}%. 언제부터였는지는 아무도 모르게, 조심스럽던 존댓말이 편한 반말이 되어 있었어요. 가까워진다는 건 어쩌면 이런 걸지도 몰라요.`));
    }
    if (r.firstSay.miss && hl.firstMiss) {
      const gap = U.diffDays(ov.first, r.firstSay.miss.date);
      b1.push(P(`그리고 첫 대화로부터 ${num(gap)}일째 되던 날, ${iga(r.firstSay.miss.who)} 처음으로 "보고 싶다"고 말했어요.`));
      b1.push(P(`아직 "사랑해"라고 하기엔 이른 것 같고, 그렇다고 아무 말도 안 하기엔 마음이 너무 커져 버렸을 때. 사람들은 대개 "보고 싶다"는 말을 먼저 꺼내요. 그 한마디를 보내기 전에, 몇 번이나 썼다 지웠을까요.`));
      b1.push({ type: "scene", title: "처음 보고 싶다고 말한 날", date: hl.firstMiss.date, lines: hl.firstMiss.lines });
    }
    if (si && si.someMonths >= 0) {
      b1.push({ type: "lines", lines: [`${fmtDate(si.month)}.`, "두 사람은 연인이 되었어요."] });
      const bf = si.before, af = si.after, sm = si.someMonths;
      b1.push(P(`${sm === 0 ? "첫 대화를 나눈 바로 그 달이었어요. 마음이 생기는 데 오래 걸리지 않았어요." : `첫 대화로부터 ${sm >= 12 ? `${Math.floor(sm / 12)}년${sm % 12 ? ` ${sm % 12}개월` : ""}` : `${sm}개월`}. ${sm >= 3 ? "꽤 오래 서로의 주변을 맴돌았어요." : "길지도 짧지도 않은, 딱 마음이 확인되기 좋은 시간이었어요."}`}${bf && bf.init[A] + bf.init[B] >= 5 ? ` 연인이 되기 전, 먼저 말을 건 건 주로 ${yeotda(bf.init[A] >= bf.init[B] ? A : B)}.` : ""}${bf && af && af.perDay > bf.perDay * 1.1 ? ` 그리고 사귀고 나서, 하루의 말풍선은 ${num(bf.perDay)}개에서 ${num(af.perDay)}개로 늘었어요. 할 말이 더 많아진 거예요.` : ""}`));
    } else if (si) {
      b1.push(P(`두 사람이 연인이 된 건 ${fmtDate(si.month)}. 이 대화는 그보다 뒤, 이미 서로를 사랑하고 있던 때부터 남아 있어요.`));
    }
    ch.push({ id: "c1", title: "2. 조심스럽게 시작한 우리", blocks: b1 });

    /* ---------- 2장: 사랑해 ---------- */
    const fl = r.firstSay.love, rep = r.firstLoveReply;
    let b2;
    if (fl) {
      const lv = L.love, more = lv[A] >= lv[B] ? A : B, less = more === A ? B : A;
      b2 = [
        { type: "lines", lines: [`${fmtDate(fl.date)}.`, si && si.firstLove && si.firstLove.m > 0 ? `사귄 지 ${num(si.firstLove.m)}개월 만이었어요.` : si && si.firstLove && si.firstLove.m === 0 ? "연인이 된 바로 그 달." : si && si.firstLove ? `연인이 되기 ${num(-si.firstLove.m)}개월 전.` : `첫 대화로부터 ${num(U.diffDays(ov.first, fl.date))}일째 되던 날.`] },
        P("어떤 말은 하기까지 오래 걸려요. 입안에서 몇 번이고 굴려 보다가, 결국 아주 평범한 순간에 툭 튀어나오곤 하죠."),
        P(`그날, ${iga(fl.who)} 처음으로 "사랑해"라고 보냈어요.${rep
          ? rep.minutes ? ` ${eunneun(rep.who)} ${rep.minutes}분 뒤에 답했어요. 그 ${rep.minutes}분이, 보낸 사람에게는 아주 길었을지도 몰라요.` : ` 답은 바로 왔어요. 망설임 없이, 같은 마음으로.`
          : " 그 말이 화면에 떠오른 순간, 두 사람 사이의 무언가가 조용히 바뀌었어요."}`),
        hl.firstLove ? { type: "scene", title: "처음 사랑해라고 말한 날", date: hl.firstLove.date, lines: hl.firstLove.lines } : null,
        rep ? { type: "quote", who: rep.who, text: rep.text, date: rep.date, note: "그날의 대답" } : null,
        P(`그날 이후로 "사랑해"는 ${num(lv.total)}번 오갔어요. ${more} ${num(lv[more])}번, ${less} ${num(lv[less])}번. 하지만 누가 더 많이 말했는지는 중요하지 않아요. 두 사람 모두 ${num(Math.min(lv[A], lv[B]))}번이 넘도록, 그 말을 아끼지 않았다는 게 중요해요.`),
        P(r.loveTrend.second >= r.loveTrend.first
          ? "보통은 시간이 지나면 익숙해져서 그 말이 줄어든다고들 해요. 그런데 두 사람은 반대였어요. 함께한 시간이 길어질수록, 사랑한다는 말을 더 자주 했어요."
          : "처음만큼 자주 말하지는 않게 되었지만, 한 번도 멈춘 적은 없어요. 말이 줄어든 자리에는 대신 더 깊은 익숙함이 들어와 있었을 거예요."),
        { type: "chart", kind: "loveMonthly" },
        lv.last ? { type: "aside", text: `가장 최근의 "사랑해"는 ${fmtDate(lv.last.date)}, ${iga(lv.last.who)} 보냈어요. 처음 그 말을 하던 날처럼요.` } : null
      ].filter(Boolean);
    } else {
      b2 = [P("대화 속에서 \"사랑해\"라는 말은 아직 찾지 못했어요. 어떤 사람들은 그 말을 아껴 두었다가 가장 중요한 순간에만 꺼내요. 그 대신 두 사람은 다른 말들로, 매일 조금씩 마음을 건네 왔어요.")];
    }
    ch.push({ id: "c2", title: "3. \"사랑해\"라고 처음 말한 날", blocks: b2 });

    /* ---------- 3장: 사랑한 방법 ---------- */
    const askT = care[A].askCare + care[B].askCare;
    const nk = r.nicknames.list[0];
    const cheerT = careN(A, "응원하고 위로하기") + careN(B, "응원하고 위로하기");
    const b3 = [
      P("\"사랑해\"는 사실 가장 쉬운 사랑의 증거예요. 진짜 사랑은 대개 그보다 더 작고 사소한 말들 속에 숨어 있어요. 두 사람의 대화에도 그런 말들이 가득했어요."),
      P(`"밥은 먹었어?" 같은 안부가 ${num(askT)}번 오갔어요. 별것 아닌 질문 같지만, 이건 "나는 지금 네 하루가 궁금해"라는 말이에요. 같은 하루를 살 수는 없어도, 서로의 하루를 놓치고 싶지 않았던 거예요.`),
      P(`걱정하고 챙기는 말은 ${A} ${num(careN(A, "걱정하고 챙기기"))}번, ${B} ${num(careN(B, "걱정하고 챙기기"))}번. "조심히 가", "푹 쉬어", "아프지 마". 대신 아파 줄 수는 없으니까, 말로라도 곁에 있어 주고 싶었던 마음이에요.`),
      cheerT ? P(`힘든 날에는 "수고했어", "파이팅"이 ${num(cheerT)}번 건네졌어요. 세상이 어떻게 보든, 나는 네 편이라는 뜻이었어요.`) : null,
      nk && nk.first ? P(`그리고 ${fmtDate(nk.first)} 무렵부터, 서로를 "${nk.label}"${ira(nk.label).slice(nk.label.length)} 부르기 시작했어요. 지금까지 ${num(nk.total)}번. 다른 사람은 모르는, 둘만 아는 이름이에요.`) : null,
      ov.lateNight ? P(`새벽 0시부터 5시 사이에도 말풍선이 ${num(ov.lateNight)}개 오갔어요. 내일을 생각하면 자야 했을 시간에, 두 사람은 조금만 더 이야기하는 쪽을 골랐어요. 잠보다 서로가 더 좋았던 밤들이에요.`) : null,
      { type: "tally", title: "말로 아끼지 않은 마음", rows: [["사랑해", L.love[A], L.love[B]], ["보고 싶어", L.miss[A], L.miss[B]], ["예뻐·귀여워", L.cute[A], L.cute[B]], ["고마워", L.thanks[A], L.thanks[B]]] }
    ].filter(Boolean);
    ch.push({ id: "c3", title: "4. 우리가 서로를 사랑한 방법", blocks: b3 });

    /* ---------- 4장: 계절 ---------- */
    const ss = r.seasons.slice(-8);
    const fS = ss[0], lS = ss[ss.length - 1];
    const trip = r.life.trips.find(t => t.vsUsual >= 100) || r.life.trips[0];
    ch.push({ id: "c4", title: "5. 우리가 지나온 계절", blocks: [
      P(`${fS ? `${fS.year}년 ${fS.season}` : "처음 계절"}에 시작된 이야기는 ${lS ? `${lS.year}년 ${lS.season}` : "지금"}까지 이어졌어요. 두 사람은 ${ss.length}번의 계절을 함께 지나왔어요.`),
      P("계절이 바뀌면 대화도 조금씩 바뀌어요. 더운 날엔 더위 이야기를, 추운 날엔 감기 걱정을 하면서요. 그런데 한 가지는 바뀌지 않았어요. 어느 계절이든, 하루의 끝엔 서로가 있었다는 것."),
      { type: "seasons", items: ss },
      trip ? P(`${fmtShort(trip.from)} 무렵에는 여행이나 출장으로 잠시 떨어져 있었어요. 그때 대화는 평소의 ${trip.vsUsual}%였어요. ${trip.vsUsual >= 100 ? "멀리 있을수록, 오히려 더 많이 이야기했어요. 곁에 없으니 말로라도 더 가까이 있고 싶었던 거예요." : "몸은 떨어져 있어도, 대화는 이어졌어요."}`) : null
    ].filter(Boolean) });

    /* ---------- 5장: 서운했던 날 ---------- */
    const c = r.conflict, sil = r.speed.longestSilence;
    const b5 = [P("사랑하는 사이라고 매일 좋기만 할 수는 없어요. 가까울수록 더 서운하고, 기대가 클수록 더 속상하니까요.")];
    if (c.days.length) {
      b5.push(P(`두 사람에게도 서운하다는 말과 미안하다는 말이 함께 오간 날이 ${num(c.count)}일 있었어요. 그날의 대화는 이랬어요.`));
      if (c.scenes[0]) b5.push({ type: "scene", title: "서운했던 어느 날", date: c.scenes[0].date, lines: c.scenes[0].lines });
      b5.push(P(`그래도 두 사람은 돌아오는 길을 알았어요.${c.makeup.length ? ` 대개 ${ro(c.makeup.slice(0, 2).map(m => `'${m.label}'`).join(", "))} 다시 가까워졌어요.` : ""}${c.resolvedNextDayPct != null ? ` 그리고 그런 날 가운데 ${c.resolvedNextDayPct}%는, 다음 날이면 다시 아무 일 없었다는 듯 "잘 잤어?"로 하루를 시작했어요.` : ""}`));
      b5.push(P("싸움이 없는 관계보다, 싸워도 다시 돌아오는 관계가 더 단단하다고 해요. 서운함을 꺼낼 수 있었던 것도, 미안하다고 먼저 말할 수 있었던 것도, 결국 서로를 잃고 싶지 않았기 때문일 거예요."));
      b5.push({ type: "duo", items: [A, B].map(p => ({ who: p, lines: [`미안해 ${num(c.sorry[p])}번`, `먼저 사과 ${num(c.apologizedFirst[p])}번`, `걱정했어 ${num(c.worry[p])}번`] })) });
    } else {
      b5.push(P("두 사람의 대화에서는 서운한 말이 크게 몰린 날을 찾지 못했어요. 작은 서운함은 있었겠지만, 그날그날 잘 풀어 온 것 같아요. 그것도 쉽지 않은 일이에요."));
    }
    if (sil && sil.hours >= 12 && sil.breaker) {
      b5.push(P(`가장 길었던 침묵은 ${num1(sil.hours)}시간이었어요. 그 시간 동안 두 사람이 무슨 생각을 했는지는 알 수 없어요. 다만 그 침묵을 먼저 깬 건 ${yeotda(sil.breaker)}. 먼저 손을 내미는 것도, 사랑이에요.`));
    }
    ch.push({ id: "c5", title: "6. 서운했던 날, 그리고 화해", blocks: b5 });

    /* ---------- 6장: 따뜻한 말 ---------- */
    const qs = r.seasons.flatMap(s => s.quotes.map(q => Object.assign({ season: s.key }, q))).slice(-8);
    ch.push({ id: "c6", title: "7. 서로에게 건넨 가장 따뜻한 말", blocks: [
      P(`${num(ov.total)}개의 말풍선 중에서, 계절마다 한 사람에 한 마디씩 골랐어요. 보낸 사람은 벌써 잊었을지도 몰라요. 하지만 이런 말은 대개, 받은 사람이 더 오래 기억해요.`),
      ...qs.map(q => ({ type: "quote", who: q.who, text: q.text, date: q.date, note: q.season })),
      P("천천히 다시 읽어 보세요. 그때의 목소리가 들리는 것 같지 않나요.")
    ] });

    /* ---------- 7장: 우리의 한 문장 + 편지 ---------- */
    const words = (L.love.total + L.miss.total + L.cute.total + L.thanks.total) / ov.total * 1000;
    const life = r.life.mealRatio * 1000;
    const sentence = words >= life * 0.6 ? "마음을 말로 아끼지 않는 두 사람" : "평범한 하루를 함께 나누는 두 사람";
    const ff = r.firstFuture, lastMiss = L.miss.last;
    const letter = [
      `${ya(A)}, ${ya(B)}.`,
      "",
      `${num(days)}일 전, 두 사람은 서로를 거의 몰랐어요.${first ? ` "${short(first.text, 24)}"라는 한 줄로 시작된 이야기가 여기까지 왔어요.` : ""}`,
      `그 사이 ${num(L.goodnight.total)}번 "잘 자"를 건넸고, ${num(L.miss.total)}번 "보고 싶다"고 말했고, ${num(L.love.total)}번 "사랑해"라고 했어요.`,
      c.days.length ? "서운한 날도 있었지만, 결국 언제나 다시 서로에게 돌아왔어요." : "",
      ff ? `${fmtDate(ff.date)}에는 처음으로 둘의 미래를 이야기했어요. 그날 그린 그림이 어떤 모습이었는지, 두 사람은 기억하고 있을까요.` : "",
      lastMiss ? `그리고 가장 최근의 "보고 싶어"는 ${fmtDate(lastMiss.date)}, ${iga(lastMiss.who)} 보냈어요. ${num(days)}일이 지나도, 여전히요.` : "",
      "",
      "어쩌면 오늘도 별일 없는 하루였을지 몰라요. 하지만 별일 없는 하루를 함께 보낼 사람이 있다는 것, 그게 가장 큰 사랑일지도 몰라요.",
      "이 숫자들은 언젠가 잊혀도, 그 말을 건네던 마음은 남아 있을 거예요.",
      "",
      "우리의 모든 순간을 사랑으로 기억할게요.",
      "— TALK VIEW"
    ].filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i > 0)).join("\n");
    ch.push({ id: "c7", title: "8. 그래서, 많이 사랑했나요", blocks: [
      P(`두 사람의 대화를 처음부터 끝까지 읽고 나면, 하나의 문장이 남아요. 사랑을 표현한 말은 말풍선 1000개당 ${num1(words)}번, 먹고 자고 일하는 일상 이야기는 ${num1(life)}번이었어요. 그래서 두 사람을 한 문장으로 적어 보면,`),
      { type: "aside", text: sentence, big: true },
      P("그래서 만약 이 대화를 다 읽은 저에게 누군가 마지막으로 묻는다면,"),
      { type: "lines", lines: ["“두 사람은 서로를 많이 사랑했나요?”"] },
      P(`저는 쉽게 대답하지 못할 것 같아요. 사랑의 크기는 숫자로 잴 수 없으니까요. 두 사람에게도 ${c.days.length ? `서운한 말이 오간 날이 ${num(c.count)}일 있었고, ` : ""}${sil && sil.hours >= 12 ? `${num1(sil.hours)}시간 동안 아무 말 없던 날도 있었어요.` : "조용한 날들이 있었어요."}`),
      P("하지만 한 가지는 확실해요."),
      { type: "lines", lines: [
        `두 사람은 서로의 하루를 궁금해했고,`,
        `${num(careN(A, "걱정하고 챙기기") + careN(B, "걱정하고 챙기기"))}번 걱정했고,`,
        c.days.length ? "서운해했고, 미안해했고," : "가끔 투정을 부렸고,",
        "그래도 언제나 다시 돌아왔고,",
        `${num(L.love.total)}번, 사랑한다고 말했어요.`
      ] },
      P("대단한 이벤트 속에서가 아니라, 매일의 \"밥은 먹었어?\"와 \"잘 자\" 속에서요. 그건 아마, 많이 사랑했다는 뜻일 거예요."),
      P("그리고 이 이야기를 마치며, 두 사람에게 짧은 편지를 남겨요."),
      { type: "p", text: letter, letter: true }
    ] });

    /* ---------- 에필로그 (소설처럼) ---------- */
    const rtA = r.routine.by[A], rtB = r.routine.by[B];
    const topWord = (k) => { const all = [rtA, rtB].filter(x => x && x.ok).flatMap((x, i) => x[k].map(w => Object.assign({ who: x === rtA ? A : B }, w))); all.sort((a, b) => b.n - a.n); return all[0]; };
    const night = topWord("lastWords"), morning = topWord("firstWords");
    const sleepAt = rtA && rtA.ok ? rtA.sleep.med : rtB && rtB.ok ? rtB.sleep.med : null;
    const wakeAt = rtA && rtA.ok ? rtA.wake.med : rtB && rtB.ok ? rtB.wake.med : null;
    const peak = r.topDays[0];
    const lastLine = hl.latest ? hl.latest.lines.filter(isText).pop() : null;
    const trip2 = r.life.trips.slice().sort((x, y) => y.vsUsual - x.vsUsual)[0];
    const ep = [];
    ep.push(P(`${sleepAt != null ? hm(sleepAt) : "늦은 밤"}. 불을 끄고 누운 방 안에서, 휴대폰 화면이 한 번 더 밝아져요.${night ? ` 화면에는 늘 비슷한 말이 떠 있었어요. "${night.text}". ${iga(night.who)} 잠들기 전 마지막으로 보낸 이 말만 ${num(night.n)}번이에요.` : ""}`));
    ep.push(P(`별것 아닌 한마디예요. 그런데 이상하죠. 같은 말을 ${night ? num(night.n) + "번이나" : "그렇게 여러 번"} 보냈는데, 한 번도 그냥 보낸 적은 없었을 것 같아요. 오늘 하루도 무사했는지, 내일도 내 곁에 있을 건지, 그 짧은 말 안에 다 들어 있었으니까요.`));
    if (morning) ep.push(P(`그리고 다음 날 아침${wakeAt != null ? `, ${hm(wakeAt)}쯤` : ""}. 눈을 뜨자마자 가장 먼저 하는 일은 서로를 찾는 거였어요. "${morning.text}". ${iga(morning.who)} 아침마다 보낸 첫마디예요. 하루의 처음과 끝이 늘 같은 사람에게 닿아 있었다는 것. 그걸 사랑이 아니면 뭐라고 불러야 할까요.`));
    if (ov.longestStreak >= 14) ep.push(P(`${fmtDate(U.addDays(ov.longestStreakEnd, -(ov.longestStreak - 1)))}부터 ${fmtDate(ov.longestStreakEnd)}까지, 두 사람은 ${num(ov.longestStreak)}일 동안 단 하루도 빠짐없이 이야기했어요. 비가 오는 날에도, 일이 몰아치는 날에도, 기분이 가라앉은 날에도요. 매일 연락한다는 건 생각보다 어려운 일이에요. 마음이 있어야만 가능한 일이거든요.`));
    if (peak) ep.push(P(`가장 말이 많았던 날은 ${fmtDate(peak.date)}이에요. 그날 두 사람은 ${num(peak.total)}개의 말풍선을 주고받았어요. 무슨 일이 있었는지는 두 사람만 알아요. 어쩌면 아주 좋은 일이었을 수도, 어쩌면 서로가 꼭 필요했던 날이었을 수도 있어요. 확실한 건, 그날 두 사람이 서로를 놓지 않았다는 거예요.`));
    if (trip2 && trip2.vsUsual >= 100) ep.push(P(`떨어져 있던 날들도 있었어요. ${fmtShort(trip2.from)}부터 ${fmtShort(trip2.to)}까지, 두 사람 사이엔 거리가 있었어요. 그런데 그 며칠 동안 대화는 평소의 ${trip2.vsUsual}%로 오히려 늘었어요. 보이지 않으니까 더 말하고 싶었던 거예요. 거리가 멀어질수록 마음은 더 가까이 붙어 있으려 했어요.`));
    if (c.days.length) ep.push(P(`물론 마음이 엇갈린 날도 있었어요. 서운하다고 말한 밤, 대답이 오지 않던 시간. 하지만 그런 날의 다음 페이지를 넘겨 보면, 어김없이 누군가 먼저 말을 걸고 있어요. ${c.resolvedNextDayPct != null ? `서운했던 날 가운데 ${c.resolvedNextDayPct}%가 그랬어요. ` : ""}사랑은 싸우지 않는 게 아니라, 싸운 다음 날에도 "잘 잤어?"라고 묻는 거라는 걸, 두 사람은 이미 알고 있었던 것 같아요.`));
    ep.push(P(`${fmtDate(ov.first)}의 첫 인사에서 ${fmtDate(ov.last)}의 마지막 대화까지. ${num(days)}일 동안 쌓인 ${num(ov.total)}개의 말풍선을 다 읽고 나면, 숫자보다 먼저 남는 게 있어요. 두 사람이 서로를 얼마나 자주 떠올렸는지. 어쩌면 맛있는 걸 먹을 때도, 하늘이 예쁠 때도, 피곤한 퇴근길에도, 결국 한 사람에게 말을 걸고 싶었다는 것.`));
    if (lastLine) ep.push(P(`지금 이 이야기의 마지막 줄은 ${fmtDate(hl.latest.date)}, ${iga(lastLine.who)} 보낸 "${short(lastLine.text, 30)}"${U.jong(short(lastLine.text, 30).replace(/[^가-힣0-9]+$/, "")) ? "이에요" : "예요"}. 아무렇지 않은 한 줄이지만, 그 한 줄이 아무렇지 않을 수 있다는 것. 그게 두 사람이 함께 만들어 온 가장 큰 것인지도 몰라요.`));
    if (hl.latest) ep.push({ type: "scene", title: "가장 최근의 대화", date: hl.latest.date, lines: hl.latest.lines });
    ep.push(P("그래서 다시 묻는다면, 저는 이제 이렇게 대답할 것 같아요."));
    ep.push({ type: "lines", lines: ["네. 두 사람은 정말 많이 사랑했어요.", "그리고 지금도, 그 이야기는 계속 쓰이고 있어요."] });
    ep.push({ type: "lines", lines: ["다음 페이지는 아직 비어 있어요.", "오늘 밤에도, 잘 자라고 말해 주세요."] });
    ch.push({ id: "epilogue", title: "에필로그", blocks: ep });

    return { cover, chapters: ch };
  }
  return { story, portrait };
});
