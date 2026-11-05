/* "더 사랑하려면" 제안 — CLAUDE.md 6장 판단 기준 그대로 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"));
  else root.Advice = factory(root.U);
})(this, function (U) {
  "use strict";
  const ORDER = { high: 0, mid: 1, low: 2 };
  const R_LANG = {
    words: { label: "인정하는 말", tip: "구체적인 칭찬이나 고마움을 말로 꺼내 주세요", msg: "오늘 발표 준비하는 거 보면서 진짜 멋있다고 생각했어" },
    time: { label: "함께하는 시간", tip: "휴대폰을 내려놓고 온전히 함께하는 시간을 먼저 제안해 주세요", msg: "이번 주말엔 폰 내려놓고 하루 종일 너랑만 있고 싶어. 산책 갈래?" },
    gift: { label: "선물", tip: "비싸지 않아도 '네 생각이 나서'라는 작은 선물을 건네 보세요", msg: "편의점 갔다가 너 좋아하는 젤리 보여서 샀어ㅋㅋ 이따 줄게" },
    service: { label: "봉사", tip: "데리러 가기, 귀찮은 일 대신 해 주기처럼 행동으로 보여 주세요", msg: "오늘 늦게 끝나지? 내가 데리러 갈게" },
    touch: { label: "스킨십", tip: "만나자마자 먼저 손잡고, 헤어질 때 꼭 안아 주세요", msg: "빨리 만나서 안아 주고 싶다" }
  };
  const ch = (rec, old) => old ? (rec - old) / old : (rec > 0 ? 1 : 0);
  const p = x => Math.round(x * 100) + "%";
  // 연구 메모 — 앱 안에서는 출처 이름만 적고 링크는 걸지 않는다(통신 차단)
  const SCI = {
    bids: "가트맨 연구소가 신혼부부를 6년 동안 지켜본 연구에서, 함께 남은 부부는 상대가 건넨 작은 신호(말 걸기, 보여 주기, 웃기)에 86% 응답했고 헤어진 부부는 33%였어요.",
    acr: "심리학자 셸리 게이블의 연구에서, 연인의 좋은 소식에 신나게 묻고 함께 기뻐해 준 커플은 관계 만족도가 높았고 두 달 뒤 헤어질 가능성도 낮았어요.",
    gratitude: "사라 알고 연구팀은 연인 사이의 일상적인 고마움을 관계의 '부스터 샷'이라고 불렀어요. 고마움을 느낀 다음 날까지 두 사람의 만족감과 연결감이 함께 올라갔어요.",
    ratio: "가트맨 연구에서 오래가는 커플은 다툴 때도 부정적인 순간 1번에 긍정적인 순간 5번 이상을 유지했고, 평소에는 그 비율이 20 대 1쯤이었어요.",
    soft: "가트맨 연구에서는 다툼을 어떻게 시작하느냐가 그 대화의 결말을 크게 좌우했어요. '너는 맨날'로 시작하는 비난 대신 '나는 ~해서 서운했어'로 시작하는 걸 '부드러운 시작'이라고 해요.",
    repair: "가트맨은 다툼 중에 분위기를 누그러뜨리는 말(사과, 농담, '잠깐 쉬자')을 '화해 시도'라고 불러요. 오래가는 커플의 차이는 싸우지 않는 게 아니라 화해 시도가 잘 받아들여지는 데 있었어요.",
    novelty: "아서 아론의 연구에서, 오래 만난 커플이 새롭고 조금 설레는 활동을 함께하면 관계 만족도가 올라갔어요. 익숙한 데이트보다 '처음 해 보는 것'이 효과가 컸어요.",
    rituals: "가트맨의 '일주일 6시간' 습관에는 헤어질 때 오늘 일정 하나 묻기(하루 2분), 다시 만나면 하루 이야기 나누기(하루 20분), 매일 고마움 표현하기(하루 5분)가 들어 있어요.",
    lovemap: "가트맨은 상대의 걱정, 꿈, 요즘 관심사를 얼마나 아는지를 '사랑 지도'라고 불러요. 사랑 지도가 자세한 커플일수록 힘든 시기를 더 잘 견뎠어요.",
    lang: "게리 채프먼의 '다섯 가지 사랑의 언어'는, 사람마다 사랑을 느끼는 방식(말, 시간, 선물, 행동, 스킨십)이 달라서 내 방식이 아니라 상대의 방식으로 표현해야 잘 닿는다는 생각이에요."
  };
  const GENERAL = [
    { title: "작은 신호에 응답하기", sci: SCI.bids, how: "상대가 사진을 보내거나 '있잖아'로 말을 걸면, 짧게라도 그 이야기에 질문 하나로 답해 보세요. 'ㅇㅇ' 대신 '오 어디야? 맛있어 보인다'처럼요." },
    { title: "좋은 소식엔 크게 반응하기", sci: SCI.acr, how: "축하 한마디로 끝내지 말고 '어떻게 된 거야? 처음부터 다 얘기해 줘'처럼 묻고, 그 일이 상대에게 어떤 의미인지 말해 주세요." },
    { title: "하루 한 번 구체적인 고마움", sci: SCI.gratitude, how: "'고마워'에 이유를 붙여 보세요. '어제 늦게까지 통화해 줘서 고마워, 덕분에 잠이 잘 왔어'처럼요." },
    { title: "헤어질 때 2분, 다시 만날 때 20분", sci: SCI.rituals, how: "아침엔 '오늘 제일 큰 일정이 뭐야?' 하나만 묻고, 저녁엔 그 일정이 어땠는지 물어보세요. 해결책보다 편들어 주기가 먼저예요." },
    { title: "처음 해 보는 데이트", sci: SCI.novelty, how: "한 달에 한 번은 둘 다 안 해 본 것(원데이 클래스, 낯선 동네 산책, 새로운 운동)을 골라 보세요." },
    { title: "일주일에 한 번, 우리 점검 시간", sci: SCI.rituals, how: "주말에 30분, '이번 주 고마웠던 것 3개 → 서운했던 것 1개 → 다음 주에 해 줬으면 하는 것 1개' 순서로 이야기해 보세요." },
    { title: "반년 뒤에 다시 분석해 보기", how: "지금 결과를 저장해 두고 6개월 뒤에 같은 방법으로 다시 돌려 보세요. 무엇이 달라졌는지 둘이 같이 보는 것만으로도 좋은 대화가 돼요." }
  ];
  // 싸울 때 기억할 네 가지 (가트맨의 '네 가지 독'과 해독제)
  const FIGHT = [
    { bad: "비난", badEx: "너는 맨날 늦어", good: "나 전달법", goodEx: "나 30분 기다려서 좀 속상했어. 늦을 땐 미리 알려 줄래?" },
    { bad: "방어", badEx: "내가 뭘 잘못했는데?", good: "내 몫 인정하기", goodEx: "듣고 보니 내가 연락을 너무 늦게 했네. 미안해" },
    { bad: "경멸", badEx: "(한숨) 됐다, 너랑 무슨 얘길 해", good: "고마움 떠올리기", goodEx: "화는 나지만, 네가 늘 챙겨 주는 거 알아" },
    { bad: "담쌓기", badEx: "(읽고 답 안 함)", good: "쉬었다 다시 오기", goodEx: "지금은 말이 날카로워질 것 같아. 20분만 쉬고 다시 얘기하자" }
  ];
  // 서로를 더 알아가는 질문 (사랑 지도)
  const QUESTIONS = [
    "요즘 제일 신경 쓰이는 일이 뭐야?", "요즘 나한테 제일 고마웠던 순간 있어?", "어렸을 때 꿈은 뭐였어?", "1년 뒤에 우리가 꼭 해 봤으면 하는 거 하나만 말해 줘.",
    "요즘 나랑 있을 때 제일 편한 순간은 언제야?", "내가 해 주면 제일 힘이 나는 말이 뭐야?", "요즘 회사(학교)에서 제일 마음에 드는 사람은 누구야?", "스트레스 받을 때 내가 어떻게 해 주면 좋겠어?",
    "우리 처음 만났을 때 내 첫인상 어땠어?", "요즘 혼자 있을 때 제일 많이 하는 생각은?", "죽기 전에 꼭 가 보고 싶은 곳은?", "가장 행복했던 우리 데이트는 언제였어?",
    "요즘 갖고 싶은 거 있어?", "나만 아는 너의 귀여운 습관 하나만 말해 줘ㅋㅋ", "10년 뒤 우리 모습을 상상하면 어때?", "최근에 나 때문에 서운했는데 말 못 한 거 있어?",
    "부모님께 제일 고마운 점은 뭐야?", "요즘 배우고 싶은 게 있어?", "하루가 완벽했다고 느끼는 날은 어떤 날이야?", "내가 제일 멋있어(예뻐) 보였던 순간은?"
  ];


  // v20 연구 기반 습관 항목 (최근·이전 비교가 없어도 나옴)
  function habitItems(r, add, nice) {
    const [A, B] = r.people, h = r.habits, other = x => x === A ? B : A, p = x => Math.round(x * 100) + "%";
    const EX = (h && h.ex) || {};
    const sc = (key, title) => EX[key] ? Object.assign({ title }, EX[key]) : null;
    if (h) {
      // 1) 신호에 답하기
      const ga = h.people[A], gb = h.people[B];
      if (ga.bidsSent >= 30 && gb.bidsSent >= 30) {
        const ra = ga.towardRateGot, rb = gb.towardRateGot;            // A가 보낸 신호에 B가 답한 비율 = ra
        const [lowP, lowR, hiR] = ra <= rb ? [A, ra, rb] : [B, rb, ra]; // lowP가 보낸 신호가 덜 받아졌다
        if (lowR < 0.5 && hiR - lowR >= 0.12) add("high", `${other(lowP)}의 답이 한 박자 느려요`,
          `${U.iga(lowP)} 사진·링크를 보내거나 '있잖아'처럼 이야기를 꺼냈을 때, ${U.iga(other(lowP))} 30분 안에 'ㅇㅇ'보다 긴 답을 한 건 ${p(lowR)}예요. 반대 방향은 ${p(hiR)}예요. (바빠서 늦은 답도 섞여 있어요)`,
          `${U.eunneun(other(lowP))} ${U.iga(lowP)} 무언가 보여 주면, 짧더라도 그 내용에 질문 하나를 붙여 답해 보세요. 답이 늦을 땐 '지금 바빠서 이따 자세히 볼게!' 한 줄이면 충분해요.`, "bids", "오 이거 뭐야ㅋㅋ 어디서 봤어? 이따 자세히 얘기해 줘!",
          [sc("bidMiss:" + lowP, "답이 짧았던 순간"), sc("bidGood:" + lowP, "이렇게 잘 이어진 날도 있었어요")]);
        else if (Math.min(ra, rb) >= 0.75) nice("서로의 신호에 잘 답해요", `무언가 보여 주거나 이야기를 꺼냈을 때 30분 안에 제대로 답한 비율이 ${A} 쪽 ${p(rb)}, ${B} 쪽 ${p(ra)}예요.`, "bids", [sc("bidGood:" + A, "이렇게 이어졌어요")]);
      }
      // 2) 좋은 소식에 반응하기
      for (const x of [A, B]) {
        const q = h.people[x];
        if (q.news >= 3) {
          const rate = q.newsCele / q.news;
          if (rate < 0.5) add("mid", `${x}의 좋은 소식에 더 크게`,
            `${U.iga(x)} 합격·성공·칭찬 같은 좋은 소식을 전한 ${q.news}번 중, ${U.iga(other(x))} '축하해', '대박' 같은 말로 함께 기뻐한 건 ${q.newsCele}번이에요.`,
            `${U.eunneun(other(x))} 다음 좋은 소식에 축하 한마디 뒤에 질문을 하나 더 붙여 보세요. 어떻게 된 건지, 그때 기분이 어땠는지요.`, "acr", "대박!! 진짜 축하해 🎉 어떻게 된 거야? 처음부터 다 얘기해 줘",
            [sc("newsMiss:" + x, "좋은 소식을 전했던 날"), sc("newsGood:" + x, "이렇게 함께 기뻐한 날도 있었어요")]);
          else if (rate >= 0.7) nice(`${x}의 좋은 소식에 함께 기뻐해요`, `${U.iga(x)} 좋은 소식을 전한 ${q.news}번 중 ${q.newsCele}번을 ${U.iga(other(x))} 크게 축하해 줬어요.`, "acr", [sc("newsGood:" + x, "함께 기뻐한 날")]);
        }
      }
      // 3) 고마움 균형
      const ta = ga.thanksPer1000, tb = gb.thanksPer1000;
      if (Math.max(ta, tb) >= 5) {
        const [lo, hi, lov, hiv] = ta <= tb ? [A, B, ta, tb] : [B, A, tb, ta];
        if (lov <= hiv * 0.5) add("mid", `${lo}의 '고마워'가 적어요`,
          `'고마워'가 들어간 말이 글 1000개당 ${hi} ${U.num1(hiv)}번, ${lo} ${U.num1(lov)}번이에요.`,
          `${U.eunneun(lo)} 하루에 한 번, ${U.iga(hi)} 해 준 일 하나를 골라 이유와 함께 고마움을 말해 보세요. ${EX["thanks:" + hi] ? `아래처럼 ${U.iga(hi)} 보낸 말이 좋은 본보기예요.` : ""}`, "gratitude", "오늘 점심 챙겨 줘서 고마워. 덕분에 오후 내내 기분 좋았어",
          [sc("thanks:" + hi, `${U.iga(hi)} 보낸 고마움`), sc("thanks:" + lo, `${lo}의 고마움도 있었어요`)]);
        else if (lov >= 20) nice("고마움을 자주 말해요", `두 사람 모두 글 1000개당 '고마워'를 ${U.num1(lov)}번 넘게 말해요.`, "gratitude", [sc("thanks:" + A, "이런 고마움"), sc("thanks:" + B, "이런 고마움")]);
      }
      // 4) 아침·밤 인사
      const ms = h.morningShare, ns = h.nightShare;
      if (h.recDays >= 30 && h.oldDays >= 30) {
        if (ns.old >= 0.4 && ns.rec <= ns.old - 0.2) add("mid", "'잘 자' 인사가 뜸해졌어요",
          `이전엔 이야기한 날의 ${p(ns.old)}에 '잘 자' 인사가 있었는데, 최근 90일엔 ${p(ns.rec)}예요.`,
          "자기 전 인사를 둘만의 작은 의식으로 만들어 보세요. 오늘 고마웠던 것 하나를 같이 말하면 더 좋아요.", "rituals", "오늘도 수고했어. 오늘 제일 좋았던 건 너랑 점심 먹은 거! 잘 자 💤", [sc("nightOld", "예전엔 이렇게 인사했어요")]);
        else if (ns.rec >= 0.7 && ms.rec >= 0.5) nice("하루의 시작과 끝을 함께해요", `최근 90일, 이야기한 날의 ${p(ms.rec)}에 아침 인사가, ${p(ns.rec)}에 '잘 자'가 있었어요.`, "rituals");
      }
      // 5) 따뜻한 말 : 서운한 말
      const wr = h.conf.rec ? h.warm.rec / h.conf.rec : null, wo = h.conf.all ? h.warm.all / h.conf.all : null;
      if (h.conf.rec >= 5 && wr != null && wr < 5) add("high", "따뜻한 말보다 서운한 말이 늘었어요",
        `최근 90일, 사랑·고마움·웃음이 담긴 말풍선 ${U.num(h.warm.rec)}개에 서운함·짜증이 담긴 말풍선 ${U.num(h.conf.rec)}개예요. 1개당 ${U.num1(wr)}개꼴이에요. (말을 세어 본 근사치라 연구와 같은 기준은 아니에요)`,
          "서운한 말 하나를 하게 되면, 그날 안에 따뜻한 말 다섯 개를 채워 보세요. 고마움, 칭찬, 웃음 모두 좋아요.", "ratio", "아까는 내가 예민했어. 그래도 오늘 너 덕분에 웃은 거 세 번은 넘어ㅋㅋ", [sc("warmRec", "요즘에도 이런 말은 있었어요")]);
      else if (wr != null && wr >= 20 && h.warm.rec >= 100) nice("따뜻한 말이 훨씬 많아요", `최근 90일, 서운한 말 1개당 따뜻한 말이 ${U.num(Math.round(wr))}개꼴이에요.`, "ratio", [sc("warmRec", "최근의 따뜻한 말")]);
      // 6) '너는 맨날' 대신 '나는'
      const absA = ga.absAll, absB = gb.absAll;
      if (absA + absB >= 4) {
        const x = absA >= absB ? A : B, n = Math.max(absA, absB);
        add("mid", "'맨날', '항상' 대신 '나는'으로",
          `'너는 맨날', '항상 그래'처럼 상대 전체를 말하는 표현이 ${x}에게서 ${n}번 나왔어요.`,
          "서운할 땐 '너는 맨날' 대신 '나는 ~해서 서운했어, ~해 줄래?' 순서로 말해 보세요. 같은 이야기도 훨씬 부드럽게 닿아요.", "soft", "나 오늘 연락이 없어서 좀 서운했어. 바쁘면 한 줄만 남겨 줄래?", [sc("abs:" + x, "이런 말이 있었어요"), sc("istmt", "이렇게 말한 날도 있었어요")]);
      } else if (ga.istmtAll + gb.istmtAll >= 3) nice("서운함을 '나는'으로 말해요", `'나는 ~해서 서운했어'처럼 내 마음으로 말한 게 ${U.num(ga.istmtAll + gb.istmtAll)}번이에요.`, "soft", [sc("istmt", "이렇게 말했어요")]);
      // 7) 서로 알아가는 질문
      const co = (ga.curiousOldPer1000 + gb.curiousOldPer1000) / 2, cr = (ga.curiousRecPer1000 + gb.curiousRecPer1000) / 2;
      if (h.recDays >= 30 && co >= 3 && cr <= co * 0.6) add("low", "서로에게 묻는 질문이 줄었어요",
        `'어땠어?', '무슨 생각 해?'처럼 마음을 묻는 질문이 글 1000개당 ${U.num1(co)}번에서 ${U.num1(cr)}번으로 줄었어요.`,
        "아래 '오늘의 질문'에서 하나를 골라 보내 보세요. 오래 만나도 아직 모르는 게 꼭 있어요.", "lovemap", "갑자기 궁금해졌어. 요즘 제일 신경 쓰이는 일이 뭐야?", [sc("curiousOld", "예전엔 이렇게 물었어요")]);
    }
    // 8) 사랑의 언어 맞춤
    const ro = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; if (c < 0 || c > 11171) return "로"; const j = c % 28; return j === 0 || j === 8 ? "로" : "으로"; };
    const L = r.loveLang;
    if (L && L[A] && L[B]) {
      const name = k => (R_LANG[k] || {}).label || k;
      for (const x of [A, B]) {
        const y = other(x), top = L[y].top, mine = L[x].top;
        if (top !== mine && R_LANG[top]) add("low", `${y}에게는 '${name(top)}'${ro(name(top))}`,
          `카톡으로 보면 ${U.eunneun(y)} '${name(top)}'${ro(name(top))} 마음을 가장 많이 표현하고, ${U.eunneun(x)} '${name(mine)}' 쪽이에요. 사람은 흔히 자기가 표현하는 방식으로 사랑받고 싶어 해요.`,
          `${U.eunneun(x)} 이번 주에 ${y}의 방식으로 한 번 표현해 보세요. ${R_LANG[top].tip}.`, "lang", R_LANG[top].msg,
          [(() => { const c = (L[y].cats || []).find(c => c.key === top), e0 = c && c.examples && c.examples[0]; return e0 ? { title: `${U.iga(y)} 이렇게 표현했어요`, date: e0.date, lines: [{ who: y, t: Date.parse(e0.date + "T12:00:00"), text: e0.text }], noTime: true } : null; })()]);
      }
    }
  }

  function advice(r) {
    const [A, B] = r.people, s = r.signals, out = [], good = [];
    const add = (level, title, why, how, sci, tryMsg, scenes) => out.push({ level, title, why, how, sci: sci ? SCI[sci] : null, try: tryMsg || null, scenes: (scenes || []).filter(Boolean) });
    const nice = (title, why, sci, scenes) => good.push({ title, why, sci: sci ? SCI[sci] : null, scenes: (scenes || []).filter(Boolean) });
    const ov = r.overview;
    habitItems(r, add, nice);

    // 잘하고 있어요(고정 기준)
    const rs = r.speed.reply;
    if ((rs[A].in5 + rs[B].in5) / 2 >= 0.8) nice("답장이 빨라요", `두 사람 모두 답장의 ${p(Math.min(rs[A].in5, rs[B].in5))} 이상을 5분 안에 보내고 있어요.`);
    if (ov.longestStreak >= 100) nice("매일 이어진 대화", `하루도 빠지지 않고 ${U.num(ov.longestStreak)}일 동안 대화가 이어진 적이 있어요.`);

    if (!s || !s.comparable) {
      return { comparable: false, good, lights: [], general: GENERAL, fight: FIGHT, questions: QUESTIONS, items: out.sort((a, b2) => ORDER[a.level] - ORDER[b2.level]), top: out.slice(0, 3), note: `대화 기간이 ${U.num(s ? s.span : 0)}일이라 아직 최근과 이전을 비교하기엔 짧아요. 150일이 넘으면 변화를 보여 드릴게요.` };
    }
    const { rec, old } = s;

    if (rec.love >= old.love * 0.95 && old.love > 0) nice("사랑해가 줄지 않았어요", `최근 90일 사랑해는 글 1000개당 ${U.num1(rec.love)}번으로, 이전(${U.num1(old.love)}번)과 비슷하거나 더 많아요.`);

    // 대화량 감소
    const dPer = ch(rec.perDay, old.perDay);
    if (dPer <= -0.15) add(dPer <= -0.3 ? "high" : "mid", "대화량이 줄었어요",
      `최근 90일 하루 평균 말풍선이 ${U.num1(rec.perDay)}개로, 이전(${U.num1(old.perDay)}개)보다 ${p(-dPer)} 적어요.`,
      "하루에 한 번, 정해 둔 시간(점심이나 퇴근길)에 '오늘 제일 웃겼던 일' 하나씩 주고받아 보세요. 짧아도 매일 이어지는 대화가 커져요.", "rituals", "오늘 제일 웃겼던 일 하나만 말해 줘ㅋㅋ 나부터 말할게!", [r.highlights && r.highlights.peakDay ? Object.assign({ title: "예전엔 이렇게 이야기했어요" }, r.highlights.peakDay) : null]);

    // 카톡 통화
    if (old.callsPerMonth >= 2 && rec.callsPerMonth <= old.callsPerMonth * 0.4) add("high", "카톡 통화가 줄었어요",
      `이전엔 한 달에 ${U.num1(old.callsPerMonth)}번쯤 카톡 통화를 했는데, 최근엔 ${U.num1(rec.callsPerMonth)}번이에요. (일반 전화는 카톡에 남지 않아서 여기엔 안 보여요.)`,
      "자기 전 5분 통화를 일주일에 두 번만 정해 보세요. 목소리로 듣는 '잘 자'는 글자와 또 달라요.", "rituals", "오늘 자기 전에 5분만 통화할까? 목소리 듣고 자고 싶어");
    else if (ov.callCount === 0) add("mid", "목소리로 나누는 대화",
      "대화 기록에 카톡 통화가 한 번도 없어요. (일반 전화는 카톡에 남지 않아서, 실제로는 통화를 하고 있을 수도 있어요.)",
      "가끔은 글 대신 짧은 통화로 하루를 마무리해 보세요.");

    // 칭찬·고마움
    const pr = ch(rec.praise, old.praise);
    if (pr <= -0.2) add("mid", "칭찬과 고마움이 줄었어요",
      `예쁘다·고마워·보고싶다 같은 말이 글 1000개당 ${U.num1(old.praise)}번에서 ${U.num1(rec.praise)}번으로 ${p(-pr)} 줄었어요. ${rec.love >= old.love * 0.95 ? "그래도 사랑해는 그대로 지켜지고 있어요." : "사랑해도 조금 줄었어요."}`,
      "하루에 하나, 상대가 한 일 중 고마운 걸 구체적으로 말해 보세요. '데리러 와 줘서 고마워'처럼요.", "gratitude", "어제 데리러 와 줘서 진짜 고마웠어. 덕분에 하루가 편했어");

    // 함께 계획
    if (old.plan > 0 && rec.plan <= old.plan * 0.7) add("mid", "함께 계획하는 말이 줄었어요",
      `'같이 가자', '주말에', '나중에 우리' 같은 말이 1000개당 ${U.num1(old.plan)}번에서 ${U.num1(rec.plan)}번으로 줄었어요.`,
      "다음 달에 하고 싶은 것 세 가지를 같이 적어 보세요. 작은 계획 하나가 기다리는 즐거움을 만들어 줘요. 그중 하나는 둘 다 처음 해 보는 걸로 골라 보세요.", "novelty", "다음 달에 우리 둘 다 처음 해 보는 거 하나 해 볼래? 후보 3개씩 뽑아 오기!");

    // 여행
    const trips = r.life.trips;
    if (!trips.length) add("high", "같이 떠난 흔적이 없어요", "대화에서 여행이나 휴가 이야기가 몰린 시기를 찾지 못했어요.", "가까운 곳이라도 1박 2일로 날짜부터 먼저 정해 보세요. 둘 다 안 가 본 곳이면 더 좋아요.", "novelty", "우리 이번 달에 1박 2일로 어디 갈까? 날짜부터 먼저 정하자");
    else if (rec.trip < 10) add("mid", "여행 이야기가 뜸해졌어요",
      `마지막으로 여행 이야기가 몰렸던 때는 ${U.fmtDate(trips[trips.length - 1].from)}이고, 최근 90일엔 여행 단어가 ${rec.trip}번뿐이에요.`,
      "다음 휴가 날짜를 먼저 맞춰 두면, 그때까지 둘이 나눌 이야기가 생겨요.", "novelty", "다음 휴가 언제 맞출 수 있어? 가고 싶은 곳 하나씩 말해 보자");
    const away = trips.filter(t => t.vsUsual >= 130);
    if (away.length) nice("떨어져 있어도 더 많이 이야기해요", `${U.fmtShort(away[0].from)} 무렵엔 대화가 평소의 ${away[0].vsUsual}%였어요.`);

    // 질문 불균형
    const qa = rec.per[A].qRatio, qb = rec.per[B].qRatio, hi = Math.max(qa, qb), lo = Math.min(qa, qb);
    if (lo > 0 && hi / lo >= 1.4 && hi >= 0.06) add("low", "질문을 주고받는 균형",
      `최근 글 중 질문 비율이 ${A} ${p(qa)}, ${B} ${p(qb)}로 차이가 있어요.`,
      "두 사람 모두 하루에 한 번씩 '오늘 어땠어?' 대신 조금 더 구체적인 질문을 건네 보세요.", "lovemap", "오늘 회의 어떻게 끝났어? 그 사람 또 그랬어?");

    // 먼저 사과
    const c = r.conflict, ap = c.apologizedFirst;
    if (c.days.length >= 10) {
      const [x, y] = ap[A] >= ap[B] ? [A, B] : [B, A];
      if (ap[x] >= 8 && ap[x] >= ap[y] * 2.2) add("mid", "먼저 사과하는 사람이 한쪽이에요",
        `갈등이 컸던 ${c.days.length}일 중 먼저 미안하다고 한 건 ${x} ${ap[x]}번, ${y} ${ap[y]}번이에요.`,
        `다음엔 ${y}도 먼저 '나도 미안해'를 건네 보세요. 누가 먼저냐보다 둘 다 말하는 게 중요해요.`, "repair", "아까는 내가 말이 좀 날카로웠어. 나도 미안해", [c.scenes && c.scenes[0] ? Object.assign({ title: "서운했던 날, 이렇게 풀었어요" }, c.scenes[0]) : null]);
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
        `${x === A ? B : A}도 하루에 한 번은 먼저 '뭐 해?'를 보내 보세요. 먼저 찾는다는 느낌이 생각보다 커요.`, "bids", "갑자기 생각나서 연락했어. 뭐 해?");
      else if (Math.max(sa, sb) < 0.6) nice("번갈아 연락해요", `최근 먼저 연락한 비율이 ${A} ${p(sa)}, ${B} ${p(sb)}로 고르게 나뉘어요.`);
    }

    // 긴 글
    if (old.longText >= 8 && rec.longText <= old.longText * 0.6) add("low", "긴 이야기가 줄었어요",
      `25자 넘는 글이 1000개당 ${U.num1(old.longText)}개에서 ${U.num1(rec.longText)}개로 줄었어요.`,
      "가끔은 짧은 답 말고, 오늘 있었던 일을 길게 들려주세요.", "lovemap");

    // 사진
    const ph = ch(rec.photos, old.photos);
    if (old.photos >= 15 && ph <= -0.25) add("low", "사진이 줄었어요", `사진이 글 1000개당 ${U.num1(old.photos)}장에서 ${U.num1(rec.photos)}장으로 줄었어요.`, "지금 보고 있는 하늘, 먹고 있는 점심 한 장이면 충분해요. 사진은 상대에게 건네는 작은 '신호'예요.", "bids");
    else if (old.photos > 0 && ph >= 0.2) nice("사진을 더 많이 나눠요", `사진이 1000개당 ${U.num1(old.photos)}장에서 ${U.num1(rec.photos)}장으로 늘었어요.`);

    // 낮 침묵
    if (old.daySilencePerMonth >= 3 && rec.daySilencePerMonth <= old.daySilencePerMonth * 0.3) nice("낮에도 연락이 이어져요", `낮에 6시간 넘게 조용했던 날이 한 달 ${U.num1(old.daySilencePerMonth)}번에서 ${U.num1(rec.daySilencePerMonth)}번으로 줄었어요.`);
    else if (old.daySilencePerMonth >= 1 && rec.daySilencePerMonth >= old.daySilencePerMonth * 2 && rec.daySilencePerMonth >= 3) add("mid", "낮 시간이 조용해졌어요",
      `낮(9~20시)에 6시간 넘게 연락이 없던 날이 한 달 ${U.num1(old.daySilencePerMonth)}번에서 ${U.num1(rec.daySilencePerMonth)}번으로 늘었어요.`,
      "바쁜 날엔 '지금 회의 들어가, 끝나고 연락할게' 한 줄만 남겨 두세요.", "rituals", "나 지금 회의 들어가! 끝나고 바로 연락할게");

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
    return { comparable: true, items: out, good, lights, top: out.slice(0, 3), general: GENERAL, fight: FIGHT, questions: QUESTIONS };
  }

  return { advice };
});
