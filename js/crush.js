/* 짝사랑 분석 (v17) — CLAUDE.md "v17 짝사랑".
   analyze 결과(r)와 '나(me)'만으로 그 사람(them)의 호감 신호·점수·추세·조언·이야기를 만든다.
   원칙: 숫자는 r에서 계산한 것만 / 재미용 / 낮은 점수도 상처 주지 않는 말투 / 이야기 끝은 용기를 주는 편지. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"), require("./rules.js"), require("./story.js"));
  else root.Crush = factory(root.U, root.Rules, root.Story);
})(this, function (U, R, Story) {
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

  function verdict(s) {
    return s >= 80 ? "좋은 신호가 아주 많이 보여요" : s >= 60 ? "좋은 신호가 꽤 보여요" : s >= 40 ? "반반이에요, 조금 더 지켜봐요" : "아직은 신호가 조용해요";
  }

  function make(r, me, info) {
    info = info || {};
    const [A, B] = r.people;
    if (me !== A && me !== B) me = A;
    const them = me === A ? B : A;
    const ov = r.overview, sp = r.speed, L = r.love, bal = r.balance, ll = r.loveLang || {};
    const tc = p => ov.textCount[p] || 1;

    /* ---------- 신호 7가지 ---------- */
    const initTot = (sp.init[me] + sp.init[them]) || 1, initThem = sp.init[them] / initTot;
    const rt = sp.reply[them], rm = sp.reply[me];
    const shareThem = ov.byWho[them] / (ov.total || 1);
    const qThem = bal.per[them].questions / tc(them), qMe = bal.per[me].questions / tc(me);
    const heartOf = p => (L.miss[p] || 0) + (L.cute[p] || 0) + (L.thanks[p] || 0) + (L.love[p] || 0) + (L.like[p] || 0);
    const heartThem = heartOf(them), heartMe = heartOf(me);
    const timeCat = p => ((ll[p] && ll[p].cats) || []).find(c => c.key === "time") || { count: 0, per1000: 0 };
    const togetherThem = timeCat(them), togetherMe = timeCat(me);

    // 요즘 흐름: 최근 90일 vs 이전
    const dayKeys = Object.keys(r.daily).sort();
    const cut = U.addDays(ov.last, -89);
    const idx = p => p === A ? 9 : 10;
    const sumDays = (keys, f) => keys.reduce((s, k) => s + f(k), 0);
    const recK = dayKeys.filter(k => k >= cut), oldK = dayKeys.filter(k => k < cut);
    let trend = null;
    if (ov.span >= 120 && oldK.length >= 14 && recK.length >= 7 && r.days) {
      const ini = (ks, p) => sumDays(ks, k => (r.days[k] ? r.days[k][idx(p)] : 0));
      const recInit = ini(recK, them) / ((ini(recK, them) + ini(recK, me)) || 1);
      const oldInit = ini(oldK, them) / ((ini(oldK, them) + ini(oldK, me)) || 1);
      const recDays = U.diffDays(cut, ov.last) + 1, oldDays = U.diffDays(ov.first, cut);
      const recRate = sumDays(recK, k => r.daily[k][them] || 0) / recDays, oldRate = sumDays(oldK, k => r.daily[k][them] || 0) / Math.max(1, oldDays);
      const ch = oldRate ? recRate / oldRate - 1 : 0;
      trend = { recInit, oldInit, recRate, oldRate, change: ch, score: clamp(0.5 + (recInit - oldInit) * 1.5 + Math.max(-0.5, Math.min(0.5, ch)) * 0.5) };
    }

    const sig = [];
    const add = (key, title, w, score, val, text, versus, fmt, extra) => sig.push(Object.assign({ key, title, w, score: clamp(score), val, text, versus, fmt }, extra || {}));
    {
      const s = initThem / 0.5;
      add("init", "먼저 연락", 20, s, initThem,
        s >= 0.6 ? `한동안 조용할 때 먼저 대화를 연 건 ${them} ${pct(initThem)}%, ${me} ${100 - pct(initThem)}%예요. 그 사람도 먼저 찾아온다는 건 좋은 신호예요.`
          : s > 0.35 ? `먼저 대화를 여는 건 ${me} ${100 - pct(initThem)}%, ${them} ${pct(initThem)}%예요. 그 사람도 가끔은 먼저 찾아와요.`
            : `아직은 ${iga(me)} 먼저 말을 거는 일이 더 많아요(${100 - pct(initThem)}%). ${them}${eunneun(them).slice(them.length)} 먼저 다가오기보다 기다리는 편일 수도 있어요.`,
        [sp.init[me], sp.init[them]], v => num(v) + "번");
    }
    {
      const s = (rt.in5 || 0) / 0.7;
      add("reply", "답장 속도", 15, s, rt.in5,
        s >= 0.85 ? `${them}의 답장은 다섯 번 중 ${Math.round((rt.in5 || 0) * 5)}번이 5분 안에 와요. 대화를 놓치지 않으려는 마음일지도 몰라요.`
          : s >= 0.6 ? `${them}의 답장은 보통 ${num1(rt.median)}분 안에 와요. 오래 기다리게 하지 않는 편이에요.`
          : s > 0.35 ? `${them}의 답장은 보통 ${num1(rt.median)}분쯤 걸려요. 빠른 편은 아니지만 꾸준히 돌아와요.`
            : `${them}의 답장은 보통 ${num1(rt.median)}분쯤 걸려요. 바쁜 사람일 수도 있으니, 답장 속도만으로 마음을 판단하지는 마세요.`,
        [pct(rm.in5), pct(rt.in5)], v => v + "%", { sub: "5분 안에 온 답장" });
    }
    {
      const s = shareThem / 0.45;
      add("share", "대화 비중", 10, s, shareThem,
        s >= 0.6 ? `대화의 ${pct(shareThem)}%가 ${them}의 말풍선이에요. 주고받는 양이 비슷해요.`
          : `대화의 ${100 - pct(shareThem)}%가 ${me}의 말풍선이에요. ${iga(me)} 조금 더 많이 이야기하고 있어요.`,
        [ov.byWho[me], ov.byWho[them]], v => num(v) + "개");
    }
    {
      const s = qThem / 0.12;
      add("curious", "나에 대한 궁금함", 15, s, qThem,
        s >= 0.6 ? `${them}의 말 중 ${pct(qThem)}%가 질문이에요(${eunneun(me)} ${pct(qMe)}%). 질문은 '너에 대해 더 알고 싶어'라는 말이에요.`
          : `${them}의 말 중 질문은 ${pct(qThem)}%예요(${eunneun(me)} ${pct(qMe)}%). 질문이 늘어나는지 지켜보면 좋아요.`,
        [pct(qMe), pct(qThem)], v => v + "%", { sub: "말 중 질문 비율" });
    }
    {
      const per = heartThem / tc(them) * 1000, s = per / 15;
      add("heart", "마음 표현", 15, s, per,
        s >= 0.6 ? `보고 싶어·고마워·귀여워 같은 말을 ${iga(them)} ${num(heartThem)}번 했어요. 마음이 말에 묻어나요.`
          : heartThem ? `보고 싶어·고마워·귀여워 같은 말은 ${them}에게서 ${num(heartThem)}번 나왔어요. 아직은 마음을 아끼는 편이에요.`
            : `${them}에게서 보고 싶어·고마워 같은 말은 아직 나오지 않았어요. 표현이 서툰 사람일 수도 있어요.`,
        [heartMe, heartThem], v => num(v) + "번");
    }
    {
      const s = togetherThem.per1000 / 40;
      add("together", "함께하자는 말", 10, s, togetherThem.per1000,
        s >= 0.6 ? `'같이', '만나', '놀러 가자' 같은 말이 ${them}에게서 ${num(togetherThem.count)}번 나왔어요. 함께하는 시간을 그리고 있어요.`
          : `'같이', '만나' 같은 함께하자는 말은 ${them}에게서 ${num(togetherThem.count)}번이에요. 약속은 ${iga(me)} 먼저 꺼내 보는 게 좋겠어요.`,
        [togetherMe.count, togetherThem.count], v => num(v) + "번");
    }
    if (trend) {
      const up = trend.recInit - trend.oldInit, ch = trend.change;
      add("trend", "요즘 흐름", 15, trend.score, trend.score,
        trend.score >= 0.6 ? `최근 석 달, ${iga(them)} 먼저 연락한 비율이 ${pct(trend.oldInit)}% → ${pct(trend.recInit)}%가 됐어요${ch > 0.1 ? `. 하루 말풍선도 ${pct(ch)}% 늘었어요` : ""}. 점점 가까워지고 있어요.`
          : trend.score > 0.4 ? `최근 석 달, ${them}의 연락은 이전과 비슷해요(먼저 연락 ${pct(trend.oldInit)}% → ${pct(trend.recInit)}%). 큰 변화 없이 이어지고 있어요.`
            : `최근 석 달, ${them}의 ${up < 0 ? `먼저 연락이 ${pct(trend.oldInit)}% → ${pct(trend.recInit)}%로` : "말풍선이"} 조금 줄었어요. 바쁜 시기일 수도 있어요.`,
        [pct(trend.oldInit), pct(trend.recInit)], v => v + "%", { labels: ["이전", "최근 90일"], sub: `${them}의 먼저 연락 비율` });
    } else {
      add("trend", "요즘 흐름", 15, 0.5, null, `대화 기간이 아직 짧아서(${num(ov.span)}일) 흐름은 조금 더 지켜봐야 해요.`, null, null, { neutral: true });
    }
    sig.forEach(s => { s.level = s.neutral ? "mid" : s.score >= 0.6 ? "good" : s.score <= 0.35 ? "low" : "mid"; });
    const score = Math.round(sig.reduce((x, s) => x + s.w * s.score, 0));

    /* ---------- 달마다 ---------- */
    const months = Object.keys(r.monthly).sort();
    const initMonth = {};
    if (r.days) for (const k in r.days) { const mk = k.slice(0, 7); const o = initMonth[mk] || (initMonth[mk] = { me: 0, them: 0 }); o.me += r.days[k][idx(me)]; o.them += r.days[k][idx(them)]; }
    const monthly = months.map(k => {
      const m = r.monthly[k], im = initMonth[k] || { me: 0, them: 0 };
      return { month: k, me: m[me] || 0, them: m[them] || 0, share: m.total ? (m[them] || 0) / m.total : 0, initShare: (im.me + im.them) ? im.them / (im.me + im.them) : null, replyThem: (sp.monthlyReply[k] || {})[them], replyMe: (sp.monthlyReply[k] || {})[me] };
    });
    // 마음이 커진 때: 내 말풍선이 전달보다 가장 많이 늘어난 달(전달 30개 이상)
    let grow = null;
    for (let i = 1; i < monthly.length; i++) {
      const a = monthly[i - 1].me, b = monthly[i].me;
      if (a >= 30 && b > a) { const g = b / a - 1; if (!grow || g > grow.g) grow = { month: monthly[i].month, g, from: a, to: b }; }
    }

    /* ---------- 조언 ---------- */
    const TIPS = {
      init: ["다음 대화의 고리를 남겨 두기", `${them}${iga(them).slice(them.length)} 먼저 대화를 연 건 ${pct(initThem)}%예요.`, "대화를 끝낼 때 '내일 그거 어떻게 됐는지 알려 줘'처럼 다음에 이어질 이야기를 남겨 보세요. 그 사람이 먼저 말을 걸 이유가 생겨요."],
      reply: ["답장 속도에 마음 쓰지 않기", `${them}의 답장은 보통 ${num1(rt.median)}분쯤 걸려요.`, "답이 늦어도 재촉하거나 일부러 늦게 답하지 마세요. 짧고 가벼운 질문 하나로 대화를 열어 두면 충분해요."],
      share: ["조금 덜 말하고 더 묻기", `대화의 ${100 - pct(shareThem)}%가 ${me}의 말풍선이에요.`, "내 이야기를 길게 하기보다 그 사람의 하루를 묻고, 대답에 한 번 더 궁금해해 주세요. 대화의 무게가 자연스럽게 맞춰져요."],
      curious: ["대답하고 싶어지는 질문하기", `${them}의 말 중 질문은 ${pct(qThem)}%예요.`, "'뭐 해?'보다 '요즘 제일 재밌는 거 뭐야?'처럼 길게 대답할 수 있는 질문을 해 보세요. 질문을 받으면 사람은 질문을 돌려주고 싶어져요."],
      heart: ["작은 고마움부터 말로", `${them}에게서 마음을 드러내는 말은 ${num(heartThem)}번이었어요.`, "내가 먼저 '고마워', '덕분에 기분 좋다' 같은 가벼운 말을 건네 보세요. 마음을 말하는 분위기는 한쪽이 먼저 만들어요."],
      together: ["구체적인 약속 하나 제안하기", `함께하자는 말은 ${them}에게서 ${num(togetherThem.count)}번 나왔어요.`, "'언제 밥 한번'보다 '이번 토요일 ○○ 갈래?'처럼 날짜와 장소를 정해서 물어보세요. 대답하기 쉬운 약속이 만남을 만들어요."],
      trend: ["잠깐 숨 고르기", trend ? `최근 석 달, ${them}의 연락이 조금 줄었어요.` : "", "연락이 줄었다면 며칠 간격을 두고, 그 사람이 좋아하는 이야기로 가볍게 다시 말을 걸어 보세요. 조급함보다 편안함이 더 오래 가요."]
    };
    const advice = {
      items: sig.filter(s => s.level === "low" && TIPS[s.key] && TIPS[s.key][1]).sort((a, b) => a.score * a.w - b.score * b.w).map(s => ({ title: TIPS[s.key][0], why: TIPS[s.key][1], how: TIPS[s.key][2], level: s.w >= 15 ? "high" : "mid" })),
      good: sig.filter(s => s.level === "good").map(s => ({ title: s.title, why: s.text })),
      general: [
        { title: "얼굴 보고 이야기하기", how: "카톡 속 신호보다, 만나서 나누는 대화가 훨씬 많은 걸 알려 줘요. 신호는 참고만 하고, 직접 만날 기회를 만들어 보세요." },
        { title: "나를 먼저 아끼기", how: "답장 하나에 하루 기분이 흔들린다면 잠깐 휴대폰을 내려놓아도 괜찮아요. 좋아하는 마음만큼 나도 소중해요." },
        { title: "한 달 뒤 다시 보기", how: "한 달쯤 뒤에 대화를 다시 불러와 보세요. '요즘 흐름'이 어떻게 바뀌었는지 볼 수 있어요." }
      ]
    };

    const out = { me, them, score, verdict: verdict(score), signals: sig, trend, monthly, grow, advice, initThem, shareThem, qThem, qMe, heartThem, heartMe, together: { me: togetherMe, them: togetherThem }, openers: (r.openers || {})[them] || [], myOpeners: (r.openers || {})[me] || [] };
    out.story = story(r, out, info);
    return out;
  }

  /* ---------- 이야기 (확정 틀, 짝사랑 버전) ---------- */
  function story(r, c, info) {
    const { me, them } = c, ov = r.overview, sp = r.speed, hl = r.highlights;
    const first = hl.opening && hl.opening.lines.find(isText);
    const days = ov.span;
    const ch = [];

    const opening = [];
    if (first) opening.push(`${fmtDate(ov.first)}, ${timeOf(first.t)}.`, `${iga(first.who)} 처음으로 말을 걸었어요.`, `“${short(first.text, 30)}”`);
    else opening.push(`${fmtDate(ov.first)}.`, "두 사람의 첫 대화가 시작됐어요.");
    opening.push("그때는 몰랐을 거예요.", `이 한 줄이 ${me}의 마음이 될 줄은.`);
    const cover = { title: `${me} → ${them}`, subtitle: "말하지 못한 마음을 기억하다", score: c.score, opening, start: `이제, ${me}의 마음 이야기를 시작할게요.` };

    const initMe = sp.init[me], initThem = sp.init[them];
    ch.push({ id: "prologue", title: "프롤로그", blocks: [
      P(`누군가 저에게 이 두 사람을 소개해 달라고 한다면, 아마 이렇게 이야기할 것 같아요. 저는 두 사람이 나눈 ${num(ov.total)}개의 말풍선을 처음부터 끝까지 읽었거든요.`),
      P(`같은 대화방에 있었지만, 마음의 무게는 조금 달랐어요. 한 사람은 조금 더 많이 좋아하고 있었어요. 어쩌면 ${them}의 이름이 화면에 뜰 때마다, ${eunneun(me)} 잠깐 숨을 골랐을지도 몰라요.`),
      P(`${num(days)}일 동안 두 사람은 ${num(ov.chatDays)}일을 이야기했어요. ${eunneun(me)} ${num(ov.byWho[me])}개의 말풍선을, ${eunneun(them)} ${num(ov.byWho[them])}개의 말풍선을 보냈어요. 숫자로 적으면 이렇게 간단하지만, 그 하나하나를 보내기 전에 몇 번이나 썼다 지웠는지는 아무도 몰라요.`),
      { type: "stats", items: [
        { label: "함께 이야기한 날", value: num(ov.chatDays) + "일", sub: `${num(days)}일 중` },
        { label: "주고받은 말풍선", value: num(ov.total) + "개", sub: `하루 평균 ${num(ov.avgPerDay)}개` },
        { label: `${me}의 먼저 연락`, value: num(initMe) + "번", sub: "조용하다가 먼저" },
        { label: `${them}의 먼저 연락`, value: num(initThem) + "번", sub: "조용하다가 먼저" }
      ] },
      { type: "lines", lines: ["먼저, 두 사람이 어떤 사람이었는지부터 이야기할게요."] }
    ] });

    ch.push({ id: "people", title: `1. ${ira(me)} 사람, ${ira(them)} 사람`, blocks: [
      P("같은 대화방에 있었지만, 두 사람은 꽤 다른 사람이었어요. 대화를 읽다 보면 그게 보여요."),
      ...Story.portrait(r, me, them),
      ...Story.portrait(r, them, me)
    ] });

    const b1 = [
      P("처음은 언제나 조심스러워요. 어떤 말투로 말을 걸어야 할지, 답장은 얼마나 기다렸다가 보내야 할지, 이모티콘 하나를 붙일까 말까까지 고민하게 되죠."),
      P(first ? `${fmtDate(ov.first)}, ${timeOf(first.t)}. ${iga(first.who)} 먼저 말을 걸었어요. 지금 다시 읽어 보면 별것 아닌 대화인데, 이상하게 마음이 간질간질해요. 모든 게 여기서 시작됐으니까요.` : `${fmtDate(ov.first)}, 두 사람의 첫 대화가 남아 있어요.`)
    ];
    if (hl.opening) b1.push({ type: "scene", title: "첫 대화", date: hl.opening.date, lines: hl.opening.lines });
    ch.push({ id: "c1", title: "2. 처음 말을 건 날", blocks: b1 });

    const b2 = [P("좋아하는 마음은 대개 티가 나요. 답장이 조금 빨라지고, 할 말이 조금 많아지고, 별것 아닌 일도 그 사람에게 먼저 말하고 싶어지죠.")];
    const lm = info.likeSince && /^\d{4}-\d{2}/.test(info.likeSince) ? info.likeSince.slice(0, 7) : null;
    if (lm) {
      const row = c.monthly.find(x => x.month === lm), prev = c.monthly[c.monthly.findIndex(x => x.month === lm) - 1];
      b2.push({ type: "lines", lines: [`${fmtDate(lm)}.`, `${iga(me)} ${eulreul(them)} 좋아하게 된 달이에요.`] });
      if (row && prev && prev.me) b2.push(P(`그달 ${me}의 말풍선은 ${num(row.me)}개. 전달보다 ${row.me >= prev.me ? `${pct(row.me / prev.me - 1)}% 많아요` : "오히려 조금 적어요. 좋아하게 되면 오히려 말이 조심스러워지기도 하니까요"}.`));
    } else if (c.grow) {
      b2.push({ type: "lines", lines: [`${fmtDate(c.grow.month)}.`, `${me}의 말풍선이 ${pct(c.grow.g)}% 늘어난 달.`] });
      b2.push(P(`전달 ${num(c.grow.from)}개였던 말풍선이 ${num(c.grow.to)}개가 됐어요. 어쩌면 그때부터였을지도 몰라요. 하고 싶은 말이 갑자기 많아지는 건, 대개 마음이 먼저 커졌다는 뜻이니까요.`));
    }
    const rm = sp.reply[me], rt = sp.reply[them];
    if (rm.median != null) b2.push(P(`${me}의 답장은 보통 ${num1(rm.median)}분 안에 갔어요. 다섯 번 중 ${Math.round((rm.in5 || 0) * 5)}번은 5분도 걸리지 않았어요. 그 사람의 이름이 뜨면, 어쩌면 하던 일을 잠깐 멈췄을지도 몰라요.`));
    ch.push({ id: "c2", title: "3. 마음이 커진 때", blocks: b2 });

    const b3 = [];
    if (initThem) {
      b3.push(P(`한동안 조용하다가 먼저 말을 거는 건, 그 사람 머릿속에 누군가가 떠올랐다는 뜻이에요. ${eunneun(them)} 그렇게 ${num(initThem)}번, 먼저 ${me}에게 말을 걸었어요.`));
      c.openers.filter((o, i, arr) => arr.findIndex(x => x.text === o.text) === i).slice(-3).reverse().forEach(o => b3.push({ type: "quote", who: them, text: o.text, date: o.date, note: "조용하다가 먼저 건넨 말" }));
      b3.push(P(c.initThem >= 0.4 ? "대화를 여는 쪽이 늘 한 사람만은 아니었어요. 그건 작지만 분명한 신호예요." : `아직은 ${iga(me)} 먼저 다가가는 일이 더 많아요. 하지만 그 사람도 분명히, 먼저 찾아온 날들이 있었어요.`));
    } else {
      b3.push(P(`아직 ${iga(them)} 먼저 말을 건 날은 찾지 못했어요. 하지만 ${iga(me)} 말을 걸 때마다 대답은 돌아왔어요. ${num(rt.n)}번의 답장이요.`));
    }
    ch.push({ id: "c3", title: "4. 그 사람이 먼저 건넨 말들", blocks: b3 });

    const ls = sp.longestSilence;
    const b4 = [P("좋아하는 사람의 답장을 기다리는 시간은 시계보다 길게 흘러요. 1분이 10분 같고, 화면을 몇 번이나 켰다 껐다 하게 되죠.")];
    if (rt.median != null) b4.push(P(`${them}의 답장은 보통 ${num1(rt.median)}분 뒤에 왔어요. ${rt.median <= (rm.median || 0) + 1 ? "기다림이 길지 않았어요. 그 사람도 대화를 놓치고 싶지 않았던 것 같아요." : `${me}보다는 조금 느렸어요. 하지만 늦게 온 답장도 결국은 왔어요.`}`));
    if (ls && ls.hours >= 6) b4.push(P(`가장 오래 말이 없던 건 ${num1(ls.hours)}시간이에요(${fmtDate(ls.from)}). 그 침묵을 먼저 깬 건 ${yeoss(ls.breaker)}.`));
    ch.push({ id: "c4", title: "5. 기다림", blocks: b4 });

    const good = c.signals.filter(s => s.level === "good"), low = c.signals.filter(s => s.level === "low");
    const b5 = [P(`카톡에는 마음이 다 담기지 않아요. 그래도 대화를 처음부터 끝까지 읽으면, ${them}에게서 보이는 작은 신호들이 있어요.`)];
    good.slice(0, 3).forEach(s => b5.push(P(s.text)));
    if (low[0]) b5.push(P(`아쉬운 점도 하나 있어요. ${low[0].text}`));
    b5.push({ type: "aside", text: `호감 신호 ${c.score}점 · ${c.verdict}` });
    ch.push({ id: "c5", title: "6. 그 사람의 신호들", blocks: b5 });

    const askT = r.balance.per[me].askCare;
    const letter = c.score >= 60
      ? [`${me}에게.`, `${num(days)}일 동안 ${eunneun(me)} 기다렸고, ${num(initMe)}번 먼저 말을 걸었어요. 그리고 ${them}도 ${num(initThem)}번, 먼저 찾아왔어요.`, "신호는 충분히 보여요. 이제는 그 마음을 조금 꺼내 봐도 괜찮을 것 같아요. 거창한 고백이 아니어도 돼요. '이번 주말에 같이 갈래?' 한 줄이면 시작하기에 충분해요.", "— TALK VIEW"]
      : c.score >= 40
        ? [`${me}에게.`, `${num(days)}일 동안 ${eunneun(me)} 기다렸고, ${num(initMe)}번 먼저 말을 걸었어요. ${them}의 마음은 아직 반쯤 열린 문 같아요.`, "조급해하지 않아도 돼요. 대신 한 걸음만 더 가까이 가 봐요. 날짜와 장소가 있는 약속 하나, 대답하고 싶어지는 질문 하나. 문은 그렇게 조금씩 열려요.", "— TALK VIEW"]
        : [`${me}에게.`, `${num(days)}일 동안 ${eunneun(me)} 기다렸고, ${num(initMe)}번 먼저 말을 걸었어요. 그건 아무나 할 수 있는 일이 아니에요.`, "지금은 신호가 조용해요. 하지만 카톡은 마음의 아주 일부만 보여 줘요. 그리고 결과가 어떻든, 좋아하는 마음을 전하는 건 그 자체로 용기예요. 그 용기를 낼지 말지는 언제나 당신이 정해도 돼요. 어느 쪽이든, 당신의 마음은 소중해요.", "— TALK VIEW"];
    ch.push({ id: "c6", title: "7. 그 마음은 닿았을까요", blocks: [
      { type: "lines", lines: ["그래서, 그 마음은 닿았을까요?"] },
      P("쉽게 대답하지 못할 것 같아요. 카톡은 마음의 일부만 보여 주니까요. 답장이 늦은 날도 있었고, 대화가 끊긴 날도 있었어요."),
      { type: "aside", big: true, text: "하지만 한 가지는 확실해요." },
      P(`${eunneun(me)} 기다렸고, ${num(initMe)}번 먼저 말을 걸었고, ${num(askT)}번 그 사람의 하루를 물었고, 그렇게 ${num(ov.chatDays)}일 동안 그 사람 곁에 있었어요. 그건 정말 많이 좋아했다는 뜻이에요.`),
      ...letter.map(t => ({ type: "p", letter: true, text: t }))
    ] });

    const ep = [P(`어쩌면 오늘 밤에도, ${eunneun(me)} ${them}의 이름을 한 번 더 눌러 볼지도 몰라요. 보낼까 말까 망설이던 말을 입력창에 적었다가 지우면서요.`)];
    if (hl.latest) ep.push({ type: "scene", title: "가장 최근의 대화", date: hl.latest.date, lines: hl.latest.lines });
    ep.push(P(`첫 인사부터 이 마지막 대화까지 ${num(days)}일. 이 이야기가 어떻게 이어질지는 아직 아무도 몰라요. 그래서 더 설레는 거예요.`));
    ep.push({ type: "lines", lines: ["오늘 밤에는, 먼저 잘 자라고 말해 보세요."] });
    ch.push({ id: "epilogue", title: "에필로그", blocks: ep });
    return { cover, chapters: ch };
  }

  return { make, verdict };
});
