/* "더 사랑하려면" 제안 — CLAUDE.md 6장 판단 기준 그대로 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"));
  else root.Advice = factory(root.U);
})(this, function (U) {
  "use strict";
  const ORDER = { high: 0, mid: 1, low: 2 };
  const ch = (rec, old) => old ? (rec - old) / old : (rec > 0 ? 1 : 0);
  const p = x => Math.round(x * 100) + "%";
  const GENERAL = [
    { title: "처음 가 보는 곳에 같이 가 보기", how: "익숙한 데이트 사이에 한 번씩, 둘 다 안 가 본 동네나 가게를 골라 보세요. 새로운 장면이 생기면 이야깃거리도 같이 늘어나요." },
    { title: "반년 뒤에 다시 분석해 보기", how: "지금 결과를 저장해 두고 6개월 뒤에 같은 방법으로 다시 돌려 보세요. 무엇이 달라졌는지 둘이 같이 보는 것만으로도 좋은 대화가 돼요." },
    { title: "손글씨 쪽지 한 장", how: "카톡으로는 매일 말하지만, 손으로 쓴 몇 줄은 오래 남아요. 가방이나 책상에 몰래 넣어 두는 것도 좋아요." }
  ];

  function advice(r) {
    const [A, B] = r.people, s = r.signals, out = [], good = [];
    const add = (level, title, why, how) => out.push({ level, title, why, how });
    const nice = (title, why) => good.push({ title, why });
    const ov = r.overview;

    // 잘하고 있어요(고정 기준)
    const rs = r.speed.reply;
    if ((rs[A].in5 + rs[B].in5) / 2 >= 0.8) nice("답장이 빨라요", `두 사람 모두 답장의 ${p(Math.min(rs[A].in5, rs[B].in5))} 이상을 5분 안에 보내고 있어요.`);
    if (ov.longestStreak >= 100) nice("매일 이어진 대화", `하루도 빠지지 않고 ${U.num(ov.longestStreak)}일 동안 대화가 이어진 적이 있어요.`);

    if (!s || !s.comparable) {
      return { comparable: false, items: [], good, lights: [], top: [], general: GENERAL, note: `대화 기간이 ${U.num(s ? s.span : 0)}일이라 아직 최근과 이전을 비교하기엔 짧아요. 150일이 넘으면 변화를 보여 드릴게요.` };
    }
    const { rec, old } = s;

    if (rec.love >= old.love * 0.95 && old.love > 0) nice("사랑해가 줄지 않았어요", `최근 90일 사랑해는 글 1000개당 ${U.num1(rec.love)}번으로, 이전(${U.num1(old.love)}번)과 비슷하거나 더 많아요.`);

    // 대화량 감소
    const dPer = ch(rec.perDay, old.perDay);
    if (dPer <= -0.15) add(dPer <= -0.3 ? "high" : "mid", "대화량이 줄었어요",
      `최근 90일 하루 평균 말풍선이 ${U.num1(rec.perDay)}개로, 이전(${U.num1(old.perDay)}개)보다 ${p(-dPer)} 적어요.`,
      "하루에 한 번, 정해 둔 시간(점심이나 퇴근길)에 '오늘 제일 웃겼던 일' 하나씩 주고받아 보세요. 짧아도 매일 이어지는 대화가 커져요.");

    // 카톡 통화
    if (old.callsPerMonth >= 2 && rec.callsPerMonth <= old.callsPerMonth * 0.4) add("high", "카톡 통화가 줄었어요",
      `이전엔 한 달에 ${U.num1(old.callsPerMonth)}번쯤 카톡 통화를 했는데, 최근엔 ${U.num1(rec.callsPerMonth)}번이에요. (일반 전화는 카톡에 남지 않아서 여기엔 안 보여요.)`,
      "자기 전 5분 통화를 일주일에 두 번만 정해 보세요. 목소리로 듣는 '잘 자'는 글자와 또 달라요.");
    else if (ov.callCount === 0) add("mid", "목소리로 나누는 대화",
      "대화 기록에 카톡 통화가 한 번도 없어요. (일반 전화는 카톡에 남지 않아서, 실제로는 통화를 하고 있을 수도 있어요.)",
      "가끔은 글 대신 짧은 통화로 하루를 마무리해 보세요.");

    // 칭찬·고마움
    const pr = ch(rec.praise, old.praise);
    if (pr <= -0.2) add("mid", "칭찬과 고마움이 줄었어요",
      `예쁘다·고마워·보고싶다 같은 말이 글 1000개당 ${U.num1(old.praise)}번에서 ${U.num1(rec.praise)}번으로 ${p(-pr)} 줄었어요. ${rec.love >= old.love * 0.95 ? "그래도 사랑해는 그대로 지켜지고 있어요." : "사랑해도 조금 줄었어요."}`,
      "하루에 하나, 상대가 한 일 중 고마운 걸 구체적으로 말해 보세요. '데리러 와 줘서 고마워'처럼요.");

    // 함께 계획
    if (old.plan > 0 && rec.plan <= old.plan * 0.7) add("mid", "함께 계획하는 말이 줄었어요",
      `'같이 가자', '주말에', '나중에 우리' 같은 말이 1000개당 ${U.num1(old.plan)}번에서 ${U.num1(rec.plan)}번으로 줄었어요.`,
      "다음 달에 하고 싶은 것 세 가지를 같이 적어 보세요. 작은 계획 하나가 기다리는 즐거움을 만들어 줘요.");

    // 여행
    const trips = r.life.trips;
    if (!trips.length) add("high", "같이 떠난 흔적이 없어요", "대화에서 여행이나 휴가 이야기가 몰린 시기를 찾지 못했어요.", "가까운 곳이라도 1박 2일로 날짜부터 먼저 정해 보세요.");
    else if (rec.trip < 10) add("mid", "여행 이야기가 뜸해졌어요",
      `마지막으로 여행 이야기가 몰렸던 때는 ${U.fmtDate(trips[trips.length - 1].from)}이고, 최근 90일엔 여행 단어가 ${rec.trip}번뿐이에요.`,
      "다음 휴가 날짜를 먼저 맞춰 두면, 그때까지 둘이 나눌 이야기가 생겨요.");
    const away = trips.filter(t => t.vsUsual >= 130);
    if (away.length) nice("떨어져 있어도 더 많이 이야기해요", `${U.fmtShort(away[0].from)} 무렵엔 대화가 평소의 ${away[0].vsUsual}%였어요.`);

    // 질문 불균형
    const qa = rec.per[A].qRatio, qb = rec.per[B].qRatio, hi = Math.max(qa, qb), lo = Math.min(qa, qb);
    if (lo > 0 && hi / lo >= 1.4 && hi >= 0.06) add("low", "질문을 주고받는 균형",
      `최근 글 중 질문 비율이 ${A} ${p(qa)}, ${B} ${p(qb)}로 차이가 있어요.`,
      "두 사람 모두 하루에 한 번씩 '오늘 어땠어?' 대신 조금 더 구체적인 질문을 건네 보세요.");

    // 먼저 사과
    const c = r.conflict, ap = c.apologizedFirst;
    if (c.days.length >= 10) {
      const [x, y] = ap[A] >= ap[B] ? [A, B] : [B, A];
      if (ap[x] >= 8 && ap[x] >= ap[y] * 2.2) add("mid", "먼저 사과하는 사람이 한쪽이에요",
        `갈등이 컸던 ${c.days.length}일 중 먼저 미안하다고 한 건 ${x} ${ap[x]}번, ${y} ${ap[y]}번이에요.`,
        `다음엔 ${y}도 먼저 '나도 미안해'를 건네 보세요. 누가 먼저냐보다 둘 다 말하는 게 중요해요.`);
    }

    // 서운함 요일
    const b = r.balance;
    if (b.confTotal >= 40) {
      const w = b.confWeek, avg = U.mean(w), mx = Math.max(...w), wi = w.indexOf(mx);
      if (avg && mx >= avg * 1.3) add("low", `${U.WD[wi]}요일을 조심해요`,
        `서운함이 담긴 말이 ${U.WD[wi]}요일에 평균의 ${U.num1(mx / avg)}배로 많아요.`,
        `${U.WD[wi]}요일엔 서로 조금 더 일찍 연락하고, 피곤한 날이면 미리 말해 두세요.`);
    }

    // 잠드는 시각
    const ra = r.routine.by[A], rb = r.routine.by[B];
    if (ra && rb && ra.ok && rb.ok) {
      const d = Math.abs(ra.sleep.shifted - rb.sleep.shifted);
      if (d >= 60) add("low", "잠드는 시간이 달라요",
        `카톡으로 추정한 잠드는 시각이 ${A} ${U.hm(ra.sleep.med)}, ${B} ${U.hm(rb.sleep.med)}으로 ${Math.round(d)}분쯤 차이 나요. (재미용 추정)`,
        "먼저 자는 사람이 '잘 자' 인사를 꼭 남기고, 늦게 자는 사람은 아침에 답해 주는 식으로 맞춰 보세요.");
    }

    // 먼저 연락
    if (rec.initN >= 20) {
      const sa = rec.per[A].init / rec.initN, sb = 1 - sa, oldTot = old.initN || 1;
      const [x, sx, ox] = sa >= sb ? [A, sa, old.per[A].init / oldTot] : [B, sb, old.per[B].init / oldTot];
      if (sx >= 0.65 && sx - ox >= 0.1) add("high", "먼저 연락하는 쪽이 기울었어요",
        `최근 먼저 말을 건 ${rec.initN}번 중 ${p(sx)}가 ${x}였어요. 이전(${p(ox)})보다 늘었어요.`,
        `${x === A ? B : A}도 하루에 한 번은 먼저 '뭐 해?'를 보내 보세요. 먼저 찾는다는 느낌이 생각보다 커요.`);
      else if (Math.max(sa, sb) < 0.6) nice("번갈아 연락해요", `최근 먼저 연락한 비율이 ${A} ${p(sa)}, ${B} ${p(sb)}로 고르게 나뉘어요.`);
    }

    // 긴 글
    if (old.longText >= 8 && rec.longText <= old.longText * 0.6) add("low", "긴 이야기가 줄었어요",
      `25자 넘는 글이 1000개당 ${U.num1(old.longText)}개에서 ${U.num1(rec.longText)}개로 줄었어요.`,
      "가끔은 짧은 답 말고, 오늘 있었던 일을 길게 들려주세요.");

    // 사진
    const ph = ch(rec.photos, old.photos);
    if (old.photos >= 15 && ph <= -0.25) add("low", "사진이 줄었어요", `사진이 글 1000개당 ${U.num1(old.photos)}장에서 ${U.num1(rec.photos)}장으로 줄었어요.`, "지금 보고 있는 하늘, 먹고 있는 점심 한 장이면 충분해요.");
    else if (old.photos > 0 && ph >= 0.2) nice("사진을 더 많이 나눠요", `사진이 1000개당 ${U.num1(old.photos)}장에서 ${U.num1(rec.photos)}장으로 늘었어요.`);

    // 낮 침묵
    if (old.daySilencePerMonth >= 3 && rec.daySilencePerMonth <= old.daySilencePerMonth * 0.3) nice("낮에도 연락이 이어져요", `낮에 6시간 넘게 조용했던 날이 한 달 ${U.num1(old.daySilencePerMonth)}번에서 ${U.num1(rec.daySilencePerMonth)}번으로 줄었어요.`);
    else if (old.daySilencePerMonth >= 1 && rec.daySilencePerMonth >= old.daySilencePerMonth * 2 && rec.daySilencePerMonth >= 3) add("mid", "낮 시간이 조용해졌어요",
      `낮(9~20시)에 6시간 넘게 연락이 없던 날이 한 달 ${U.num1(old.daySilencePerMonth)}번에서 ${U.num1(rec.daySilencePerMonth)}번으로 늘었어요.`,
      "바쁜 날엔 '지금 회의 들어가, 끝나고 연락할게' 한 줄만 남겨 두세요.");

    // 한쪽이 말을 더 많이
    const tt = rec.per[A].texts + rec.per[B].texts;
    if (tt) { const sa = rec.per[A].texts / tt, x = sa >= 0.5 ? A : B, sx = Math.max(sa, 1 - sa);
      if (sx >= 0.62) add("low", "한쪽이 말을 더 많이 해요", `최근 90일 글의 ${p(sx)}를 ${x}가 보냈어요.`, `${x === A ? B : A}도 '나는 오늘 이랬어'를 조금 더 들려주세요.`); }

    // 신호등
    const light = (label, v, flip) => { const x = flip ? -v : v; return { label, change: Math.round(v * 100), color: x >= -0.1 ? "green" : x >= -0.25 ? "yellow" : "red" }; };
    const lights = [
      light("대화량", ch(rec.perDay, old.perDay)),
      light("사랑 표현", ch(rec.love, old.love)),
      light("칭찬·고마움", ch(rec.praise, old.praise)),
      light("함께 계획", ch(rec.plan, old.plan))
    ];
    if (old.callsPerMonth >= 2) lights.push(light("카톡 통화", ch(rec.callsPerMonth, old.callsPerMonth)));
    lights.push(light("서운함", ch(rec.confPer1000, old.confPer1000), true));

    out.sort((a, b2) => ORDER[a.level] - ORDER[b2.level]);
    return { comparable: true, items: out, good, lights, top: out.slice(0, 3), general: GENERAL };
  }

  return { advice };
});
