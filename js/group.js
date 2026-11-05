/* 친구 단톡방 분석 (v19) — CLAUDE.md "v19 친구 단톡방".
   analyze()는 두 사람용이라, 단톡방은 여기서 메시지를 직접 읽어 사람 수만큼 센다.
   Group.analyze 결과는 함수 없는 순수 데이터(그대로 저장), 이야기는 Group.story로 그때그때 만든다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"), require("./rules.js"));
  else root.Group = factory(root.U, root.Rules);
})(this, function (U, R) {
  "use strict";
  const { num, num1, iga, eunneun, eulreul, fmtDate } = U;
  const MIN = 60000, H = 3600000;
  const clamp = v => Math.max(0, Math.min(1, v || 0));
  const LAUGH = /[ㅋㅎ]{2,}/;
  const MEET = /만나|모이|모여|모임|약속|같이|놀러|언제\s?봐|보자|볼래|시간\s?돼|시간\s?되/;
  const CARE = R.CARE_SETS.filter(([label]) => /걱정|응원|위로/.test(label)).map(x => x[1]);
  const isQ = t => /\?/.test(t) || R.Q_END.test(t);
  const given = n => /^[가-힣]{3}$/.test(n) ? n.slice(1) : n;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const THIRD = ["일일", "이이", "삼삼", "사사", "오오", "육육", "칠칠", "팔팔", "구구", "십십"];

  /* 단톡방인지: 말풍선 3개 이상이면서 전체의 1% 이상인 사람이 3명 이상 */
  function members(counts) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(counts).filter(p => counts[p] >= 3 && counts[p] / total >= 0.01).sort((a, b) => counts[b] - counts[a]);
  }

  /* 이름 정리(성 떼기, 겹치면 전체 이름) + 대화 속 제3자 "~씨" 가리기 */
  function prepare(all, mem) {
    const short = mem.map(given), dup = short.filter((x, i) => short.indexOf(x) !== i);
    const map = {}; mem.forEach((p, i) => { map[p] = dup.includes(short[i]) ? p : short[i]; });
    const known = new Set(mem.flatMap(p => [p, given(p)]));
    const cnt = {};
    for (const m of all) if (m.type === "text") for (const x of m.text.matchAll(/([가-힣]{2,3})씨/g)) {
      const n = x[1]; if (known.has(n) || R.STEM_EXCL.has(n) || R.NAME_EXCL.test(n) || R.TITLE_EXCL.test(n)) continue;
      cnt[n] = (cnt[n] || 0) + 1;
    }
    const third = Object.keys(cnt).filter(n => cnt[n] >= 3).sort((a, b) => cnt[b] - cnt[a]);
    const tmap = {}; third.forEach((n, i) => { tmap[n] = THIRD[i] || ("제" + (i + 1)); });
    const tre = third.length ? new RegExp("(" + third.map(esc).join("|") + ")(?=씨)", "g") : null;
    const keep = new Set(mem);
    return all.filter(m => keep.has(m.who)).map(m => Object.assign({}, m, { who: map[m.who], text: tre ? m.text.replace(tre, s => tmap[s]) : m.text }));
  }

  const line = m => ({ who: m.who, t: m.t, text: m.type === "text" ? m.text : m.type === "photo" ? "(사진)" : m.type === "emoticon" ? "(이모티콘)" : m.type === "call" ? "(통화)" : m.type === "link" ? "(링크)" : "(삭제된 메시지)" });

  function analyze(all, memRaw, title) {
    const ms = prepare(all, memRaw);
    const names = [...new Set(ms.map(m => m.who))];
    const N = ms.length, P = {};
    names.forEach(p => { P[p] = { name: p, n: 0, texts: 0, laughs: 0, react: 0, init: 0, replies: [], night: 0, ask: 0, care: 0, meet: 0 }; });
    const daily = {}, dayLaugh = {}, monthly = {}, pair = {}, dayIdx = {};
    let longestSilence = { hours: 0 };
    for (let i = 0; i < N; i++) {
      const m = ms[i], prev = ms[i - 1], p = P[m.who], dk = U.dayKey(m.t), gap = prev ? m.t - prev.t : Infinity;
      p.n++; daily[dk] = (daily[dk] || 0) + 1; monthly[dk.slice(0, 7)] = (monthly[dk.slice(0, 7)] || 0) + 1;
      (dayIdx[dk] = dayIdx[dk] || []).push(i);
      if (new Date(m.t).getHours() <= 5) p.night++;
      if (gap > 4 * H) p.init++;
      if (prev && gap > longestSilence.hours * H) longestSilence = { hours: gap / H, from: U.dayKey(prev.t), breaker: m.who };
      if (prev && prev.who !== m.who && gap <= 60 * MIN) p.replies.push(Math.round(gap / MIN));
      if (prev && prev.who !== m.who && gap <= 10 * MIN) { const k = [prev.who, m.who].sort().join("\u0001"); pair[k] = (pair[k] || 0) + 1; }
      if (m.type === "text") {
        p.texts++;
        if (LAUGH.test(m.text)) { p.laughs++; dayLaugh[dk] = (dayLaugh[dk] || 0) + 1; if (prev && prev.who !== m.who && gap <= 10 * MIN && prev.type !== "emoticon") P[prev.who].react++; }
        if (isQ(m.text) && R.ASK_CARE.test(m.text)) p.ask++;
        if (CARE.some(re => re.test(m.text))) p.care++;
        if (MEET.test(m.text)) p.meet++;
      }
    }
    const first = U.dayKey(ms[0].t), last = U.dayKey(ms[N - 1].t), span = U.diffDays(first, last) + 1;
    let streak = 0, longestStreak = 0;
    for (let k = first; k <= last; k = U.addDays(k, 1)) { if (daily[k]) { streak++; longestStreak = Math.max(longestStreak, streak); } else streak = 0; }
    const people = names.map(p => {
      const x = P[p], rs = x.replies;
      return { name: p, n: x.n, share: x.n / N, texts: x.texts, laughs: x.laughs, react: x.react, init: x.init, replyMed: rs.length >= 30 ? U.median(rs) : null, replyN: rs.length, night: x.night, ask: x.ask, care: x.care, meet: x.meet, roles: [] };
    }).sort((a, b) => b.n - a.n);
    // 역할 배지: 역할마다 그 항목 순위가 가장 높은 사람에게, 한 사람당 최대 2개(모두에게 고르게)
    people.forEach(p => { p.nightShare = p.n ? p.night / p.n : 0; p.laughShare = p.texts ? p.laughs / p.texts : 0; p.careN = p.care + p.ask; });
    const ROLES = [
      ["가장 말이 많은 사람", p => p.n, () => true],
      ["분위기 메이커", p => p.react, p => p.react > 0],
      ["대화를 여는 사람", p => p.init, p => p.init > 0],
      ["챙김 담당", p => p.careN, p => p.careN > 0],
      ["답장 요정", p => -p.replyMed, p => p.replyMed != null],
      ["밤 올빼미", p => p.nightShare, p => p.night >= 20],
      ["웃음이 많은 사람", p => p.laughShare, p => p.laughs >= 10],
      ["모임을 챙기는 사람", p => p.meet, p => p.meet > 0]
    ];
    for (const [role, score, ok] of ROLES) {
      const c = people.filter(p => ok(p) && p.roles.length < 2).sort((a, b) => score(b) - score(a))[0];
      if (c) c.roles.push(role);
    }
    if (people.length >= 3) { const q = people[people.length - 1]; if (!q.roles.length) q.roles.push("조용한 관찰자"); }

    const pairs = Object.entries(pair).map(([k, n]) => ({ a: k.split("\u0001")[0], b: k.split("\u0001")[1], n })).sort((x, y) => y.n - x.n).slice(0, 5);

    const scene = (k, re) => {
      const idx = dayIdx[k]; if (!idx || idx.length < 9) return null;
      let best = null;
      for (let s = 0; s + 9 <= idx.length; s++) {
        let sc = 0; for (let j = 0; j < 9; j++) { const m = ms[idx[s + j]]; if (m.type === "text" && re.test(m.text)) sc += 2; if (j && m.t - ms[idx[s + j - 1]].t > 15 * MIN) sc -= 3; }
        if (!best || sc > best.sc) best = { sc, i: idx[s] };
      }
      return { date: k, lines: ms.slice(best.i, best.i + 9).map(line) };
    };
    const laughMoments = [], seen = new Set();
    for (const k of Object.keys(dayLaugh).sort((a, b) => dayLaugh[b] - dayLaugh[a])) {
      if (laughMoments.length >= 4 || dayLaugh[k] < 3) break;
      if (seen.has(k.slice(0, 7))) continue;
      const sc = scene(k, LAUGH); if (sc) { seen.add(k.slice(0, 7)); laughMoments.push(Object.assign(sc, { n: dayLaugh[k] })); }
    }
    laughMoments.sort((a, b) => a.date < b.date ? -1 : 1);
    const topDayK = Object.keys(daily).sort((a, b) => daily[b] - daily[a])[0];
    const peak = topDayK ? Object.assign(scene(topDayK, /./) || { date: topDayK, lines: [] }, { n: daily[topDayK] }) : null;

    // 우정 지수
    const texts = people.reduce((s, p) => s + p.texts, 0) || 1;
    const laughs = people.reduce((s, p) => s + p.laughs, 0), care = people.reduce((s, p) => s + p.care + p.ask, 0), meet = people.reduce((s, p) => s + p.meet, 0);
    const allRep = people.flatMap(p => P[p.name].replies), in30 = allRep.length ? allRep.filter(x => x <= 30).length / allRep.length : 0;
    const ent = people.length > 1 ? -people.reduce((s, p) => s + (p.share ? p.share * Math.log(p.share) : 0), 0) / Math.log(people.length) : 1;
    const chatDays = Object.keys(daily).length;
    const parts = [
      { key: "steady", label: "꾸준함", w: 20, v: chatDays / span / 0.6, say: `${num(span)}일 중 ${num(chatDays)}일 이야기했어요.` },
      { key: "laugh", label: "웃음", w: 20, v: laughs / texts / 0.3, say: `말풍선 ${Math.round(laughs / texts * 100)}%에 웃음이 묻어 있어요.` },
      { key: "even", label: "고른 참여", w: 15, v: ent / 0.8, say: `${people.length}명이 ${ent >= 0.8 ? "고르게" : "조금씩 다르게"} 이야기에 참여했어요.` },
      { key: "reply", label: "답장", w: 15, v: in30 / 0.8, say: `누군가 말하면 30분 안에 답이 온 게 ${Math.round(in30 * 100)}%예요.` },
      { key: "care", label: "챙김", w: 15, v: care / texts * 1000 / 60, say: `안부·걱정·응원의 말이 ${num(care)}번 오갔어요.` },
      { key: "meet", label: "모임", w: 15, v: meet / texts * 1000 / 60, say: `'만나', '모이자', '약속' 같은 말이 ${num(meet)}번 나왔어요.` }
    ].map(p => Object.assign(p, { score: clamp(p.v), pts: Math.round(clamp(p.v) * p.w) }));
    const score = parts.reduce((s, p) => s + p.pts, 0);

    // 요즘 흐름
    const cut = U.addDays(last, -89);
    let trend = null;
    if (span >= 120) {
      const rec = Object.keys(daily).filter(k => k >= cut).reduce((s, k) => s + daily[k], 0) / (U.diffDays(cut, last) + 1);
      const old = Object.keys(daily).filter(k => k < cut).reduce((s, k) => s + daily[k], 0) / Math.max(1, U.diffDays(first, cut));
      trend = { recRate: rec, oldRate: old, change: old ? rec / old - 1 : 0 };
    }
    return {
      title: title || null, people, total: N, first, last, span, chatDays, avgPerDay: N / span, longestStreak,
      longestSilence: { hours: longestSilence.hours, from: longestSilence.from, breaker: longestSilence.breaker },
      monthly: Object.keys(monthly).sort().map(k => ({ month: k, n: monthly[k] })),
      pairs, laughMoments, peak, laughs, care, meet, in30, score, parts, trend,
      opening: { date: first, lines: ms.slice(0, 9).map(line) }, latest: { date: last, lines: ms.slice(-9).map(line) }
    };
  }

  function verdict(s) { return s >= 80 ? "말 안 해도 통하는 사이예요" : s >= 60 ? "든든한 친구들이에요" : s >= 40 ? "편하게 이어지는 사이예요" : "천천히 가까워지는 사이예요"; }

  /* 조언 */
  function advice(g) {
    const items = [], ps = g.people, quiet = ps[ps.length - 1];
    if (g.trend && g.trend.change <= -0.25) items.push({ title: "요즘 조금 조용해졌어요", why: `최근 석 달 하루 말풍선이 ${num1(g.trend.oldRate)}개 → ${num1(g.trend.recRate)}개로 줄었어요.`, how: "누군가 먼저 근황 한 줄을 올려 보세요. 단톡방은 한 사람이 말을 꺼내면 금방 다시 시끄러워져요." });
    if (ps.length >= 3 && quiet.share < 0.08) items.push({ title: `${quiet.name}에게 말 걸어 보기`, why: `${eunneun(quiet.name)} 말풍선 지분이 ${Math.round(quiet.share * 100)}%예요.`, how: `조용한 친구도 대화를 다 읽고 있을 때가 많아요. "${quiet.name}는 어때?"처럼 이름을 불러 한 번 물어봐 주세요.`.replace(`${quiet.name}는`, eunneun(quiet.name)) });
    if (g.parts.find(p => p.key === "meet").score < 0.5) items.push({ title: "모이는 날 정하기", why: g.parts.find(p => p.key === "meet").say, how: "'언제 한번 보자'보다 날짜 두세 개를 올리고 투표하듯 고르면 약속이 훨씬 빨리 잡혀요." });
    if (g.parts.find(p => p.key === "care").score < 0.5) items.push({ title: "안부 한 줄 더하기", why: g.parts.find(p => p.key === "care").say, how: "누군가 힘든 이야기를 꺼냈다면, 웃음 대신 '괜찮아?' 한마디를 먼저 남겨 주세요." });
    const good = g.parts.filter(p => p.score >= 0.75).map(p => ({ title: p.label, why: p.say }));
    const general = [
      { title: "생일 챙기기", how: "단톡방에서 생일을 함께 축하하면, 그날의 대화가 오래 남는 추억이 돼요." },
      { title: "사진 한 장 올리기", how: "예전에 같이 찍은 사진 한 장이 오래 조용했던 방을 다시 깨우기도 해요." },
      { title: "반년 뒤 다시 보기", how: "반년쯤 뒤 다시 대화를 불러와 보세요. 우리 사이가 어떻게 이어졌는지 볼 수 있어요." }
    ];
    return { items, good, general };
  }

  /* 우리들의 이야기 (확정 틀, 진중한 친구 말투) */
  function story(g, info) {
    info = info || {};
    const P = text => ({ type: "p", text }), ps = g.people, n = ps.length;
    const since = info.since && /^\d{4}-\d{2}/.test(info.since) ? info.since.slice(0, 7) : null;
    const first = g.opening.lines.find(l => l.text && !/^\(/.test(l.text));
    const hm = t => { const d = new Date(t); return U.hm(d.getHours() * 60 + d.getMinutes()); };
    const short = (t, k = 30) => t.length > k ? t.slice(0, k) + "…" : t;
    const yeoss = w => w + (U.jong(w) ? "이었어요" : "였어요");
    const room = g.title ? `'${g.title}'` : "이 단톡방";
    const opening = [];
    if (first) opening.push(`${fmtDate(g.first)}, ${hm(first.t)}.`, `${iga(first.who)} 먼저 말을 걸었어요.`, `“${short(first.text)}”`);
    else opening.push(`${fmtDate(g.first)}.`, "우리의 대화가 시작됐어요.");
    opening.push("그때는 몰랐을 거예요.", `이 한 줄이 ${n}명의 이야기가 될 줄은.`);
    const cover = { title: g.title || `우리 ${n}명`, subtitle: "우리의 우정을 기억하다", score: g.score, opening, start: "이제, 우리들의 이야기를 시작할게요." };
    const ch = [];
    ch.push({ id: "prologue", title: "프롤로그", blocks: [
      P(`누군가 저에게 ${room}을 소개해 달라고 한다면, 아마 이렇게 이야기할 것 같아요. 저는 ${n}명이 나눈 ${num(g.total)}개의 말풍선을 처음부터 끝까지 읽었거든요.`),
      P(`여러 사람이 함께 있는 대화방은 조금 특별해요. 누군가 시시한 이야기를 꺼내면 누군가는 웃고, 누군가는 받아치고, 누군가는 조용히 읽고 지나가요. 그렇게 쌓인 대화가 하나의 우정이 돼요.${since ? ` ${fmtDate(since)}부터 이어진 사이라고 하니, 이 대화는 그 긴 시간의 일부예요.` : ""}`),
      P(`${num(g.span)}일 동안 ${num(g.chatDays)}일을 이야기했고, ${num(g.laughs)}개의 말풍선에 웃음이 묻어 있었어요.`),
      { type: "stats", items: [
        { label: "함께한 사람", value: n + "명", sub: ps.slice(0, 3).map(p => p.name).join(", ") + (n > 3 ? " 외" : "") },
        { label: "주고받은 말풍선", value: num(g.total) + "개", sub: `하루 평균 ${num(g.avgPerDay)}개` },
        { label: "웃음이 묻은 말풍선", value: num(g.laughs) + "개", sub: "ㅋㅋ · ㅎㅎ" },
        { label: "가장 긴 연속 대화", value: num(g.longestStreak) + "일", sub: "하루도 빠짐없이" }
      ] },
      { type: "lines", lines: ["먼저, 이 방의 사람들부터 소개할게요."] }
    ] });

    const ROLE = {
      "가장 말이 많은 사람": p => `이 방에서 가장 많이 이야기한 사람이에요. 말풍선 ${num(p.n)}개, 전체의 ${Math.round(p.share * 100)}%예요.`,
      "분위기 메이커": p => `${p.name}의 말 뒤에는 자주 웃음이 따라왔어요(${num(p.react)}번). 이 방의 분위기를 만든 사람이에요.`,
      "대화를 여는 사람": p => `한동안 조용하던 방에 먼저 말을 건 게 ${num(p.init)}번이에요. 대화가 끊기지 않게 한 사람이에요.`,
      "답장 요정": p => `누군가 말하면 보통 ${num1(p.replyMed)}분 안에 답했어요. 아무도 혼자 말하게 두지 않았어요.`,
      "밤 올빼미": p => `새벽(0~5시)에 보낸 말풍선이 ${num(p.night)}개예요. 늦은 밤의 이야기 상대였어요.`,
      "챙김 담당": p => `안부를 묻고 걱정하고 응원한 말이 ${num(p.care + p.ask)}번이에요. 말없이 모두를 챙긴 사람이에요.`,
      "웃음이 많은 사람": p => `말풍선 ${Math.round(p.laughShare * 100)}%에 웃음이 묻어 있어요. 이 방에서 가장 잘 웃어 준 사람이에요.`,
      "모임을 챙기는 사람": p => `'만나자', '언제 봐' 같은 말을 ${num(p.meet)}번 꺼냈어요. 다 같이 모이는 날을 만든 사람이에요.`,
      "조용한 관찰자": p => `말수는 적었지만(${num(p.n)}개), 그래도 늘 그 자리에 있었어요. 조용히 읽어 주는 친구도 우정의 일부예요.`
    };
    const intro = [P(`이 방에는 ${n}명이 있어요. 대화를 읽다 보면 각자 자리가 보여요.`)];
    ps.slice(0, 10).forEach(p => {
      intro.push({ type: "lines", lines: [p.name, p.roles[0] ? `${p.roles[0]}` : "늘 함께 있던 사람"] });
      intro.push(P(p.roles.length ? p.roles.map(r => ROLE[r](p)).join(" ") : `말풍선 ${num(p.n)}개로, 이 방의 ${Math.round(p.share * 100)}%를 채웠어요.`));
    });
    if (n > 10) intro.push(P(`그리고 ${n - 10}명이 더 있어요. 모두 이 방의 일부였어요.`));
    ch.push({ id: "people", title: "1. 우리를 소개합니다", blocks: intro });

    ch.push({ id: "c1", title: "2. 처음 말을 건 날", blocks: [
      P("모든 대화방에는 첫 대화가 있어요. 그때는 그게 시작인 줄도 모르고 지나가지만요."),
      first ? P(`${fmtDate(g.first)}, ${hm(first.t)}. ${iga(first.who)} 먼저 말을 걸었어요. 지금 다시 읽어 보면 별것 아닌 대화인데, 이상하게 오래 들여다보게 돼요.`) : null,
      { type: "scene", title: "첫 대화", date: g.opening.date, lines: g.opening.lines }
    ].filter(Boolean) });

    const b3 = [P("오랜만에 단톡방을 거슬러 올라가 보면, 무슨 이야기였는지보다 그때 다 같이 웃었던 기억이 먼저 떠올라요. 웃음이 가장 많이 오갔던 날들을 골라 두었어요. 천천히 다시 읽어 보세요.")];
    g.laughMoments.forEach(m => { b3.push({ type: "lines", lines: [`${fmtDate(m.date)}.`, `웃음이 ${num(m.n)}번 오간 날.`] }); b3.push({ type: "scene", title: "그날의 대화", date: m.date, lines: m.lines }); });
    if (!g.laughMoments.length) b3.push(P("웃음이 한곳에 몰린 날은 찾지 못했어요. 대신 웃음이 하루하루에 고르게 흩어져 있었어요."));
    ch.push({ id: "c2", title: "3. 함께 웃었던 날들", blocks: b3 });

    const carer = ps.slice().sort((a, b) => (b.care + b.ask) - (a.care + a.ask))[0];
    ch.push({ id: "c3", title: "4. 서로를 챙긴 말들", blocks: [
      P("여럿이 있는 방에서는 서로를 챙기는 말이 묻히기 쉬워요. 그래도 천천히 읽어 보면, 누군가 힘들다고 할 때 꼭 한마디씩 건네는 사람이 있어요."),
      P(`이 방에서는 안부와 걱정, 응원의 말이 ${num(g.care)}번 오갔어요. 그중 가장 자주 마음을 건넨 건 ${yeoss(carer.name)}.`)
    ] });

    const b5 = [P("어떤 날은 단톡방이 쉬지 않고 울려요. 한 사람이 꺼낸 이야기에 모두가 한마디씩 보태다 보면 시간이 가는 줄도 몰라요.")];
    if (g.peak) { b5.push(P(`${fmtDate(g.peak.date)}, 하루에 ${num(g.peak.n)}개의 말풍선이 오갔어요. 평소보다 ${Math.round(g.peak.n / Math.max(1, g.avgPerDay))}배쯤 많은 날이에요.`)); if (g.peak.lines.length) b5.push({ type: "scene", title: "가장 오래 이야기한 날", date: g.peak.date, lines: g.peak.lines }); }
    ch.push({ id: "c4", title: "5. 가장 오래 이야기한 날", blocks: b5 });

    const b6 = [P("여럿이 함께 있어도, 유난히 자주 말을 주고받는 두 사람이 있어요. 서로의 말에 가장 먼저 답하는 사이요.")];
    g.pairs.slice(0, 3).forEach((x, i) => b6.push(P(`${i === 0 ? "가장 자주 주고받은 건" : "그다음은"} ${x.a}${U.jong(x.a) ? "과" : "와"} ${yeoss(x.b)}. 서로의 말에 10분 안에 답한 게 ${num(x.n)}번이에요.`)));
    ch.push({ id: "c5", title: "6. 이 방의 단짝들", blocks: b6 });

    const ls = g.longestSilence, b7 = [P("오래된 단톡방에는 조용한 시간도 있어요. 각자의 삶이 바빠지는 때가 오니까요. 그래도 누군가 한마디를 꺼내면, 방은 금세 다시 이어져요.")];
    if (ls && ls.hours >= 24) b7.push(P(`가장 오래 조용했던 건 ${num1(ls.hours / 24)}일이에요(${fmtDate(ls.from)}부터). 그 침묵을 먼저 깬 건 ${yeoss(ls.breaker)}.`));
    if (g.trend) b7.push(P(g.trend.change <= -0.25 ? `요즘은 예전보다 조금 조용해졌어요(하루 ${num1(g.trend.oldRate)}개 → ${num1(g.trend.recRate)}개). 멀어진 게 아니라, 각자의 하루를 살고 있는 거예요.` : g.trend.change >= 0.2 ? `요즘은 오히려 더 자주 이야기하고 있어요(하루 ${num1(g.trend.oldRate)}개 → ${num1(g.trend.recRate)}개).` : "요즘도 이 방은 예전처럼 꾸준히 이어지고 있어요."));
    ch.push({ id: "c6", title: "7. 조용했던 시간, 그리고 다시", blocks: b7 });

    const inits = ps.reduce((s, p) => s + p.init, 0);
    ch.push({ id: "c7", title: "8. 우리는 좋은 친구들이었나요", blocks: [
      { type: "lines", lines: ["그래서, 우리는 좋은 친구들이었나요?"] },
      P("쉽게 대답하지 못할 것 같아요. 답장이 없던 날도, 서운했던 날도, 한동안 조용하던 날도 있었으니까요."),
      { type: "aside", big: true, text: "하지만 한 가지는 확실해요." },
      P(`${n}명은 ${num(g.laughs)}번 함께 웃었고, ${num(g.care)}번 서로를 챙겼고, ${num(g.meet)}번 만나자는 이야기를 꺼냈고, 방이 조용해질 때마다 ${num(inits)}번 누군가 다시 먼저 말을 걸었어요. 그건 우리가 서로에게 좋은 친구였다는 뜻이에요.`),
      ...[`${g.title ? g.title : "이 방"}의 ${n}명에게.`, `${num(g.span)}일 동안의 대화를 처음부터 끝까지 읽었어요. 거기엔 시시한 농담과, 별것 아닌 하루와, 가끔은 쉽게 꺼내기 어려웠을 이야기가 함께 있었어요.`, "시간이 지나면 각자의 자리가 달라지고, 단톡방이 조용해지는 날도 와요. 그래도 언젠가 이 대화를 다시 열어 웃을 수 있다면, 여러분은 이미 서로에게 오래 남을 사람들이에요.", "— TALK VIEW"].map(t => ({ type: "p", letter: true, text: t }))
    ] });
    const ep = [P("어쩌면 오늘도 누군가는 웃긴 걸 보다가, 이 방에 올릴까 잠깐 고민했을지도 몰라요.")];
    ep.push({ type: "scene", title: "가장 최근의 대화", date: g.latest.date, lines: g.latest.lines });
    ep.push(P(`첫 대화부터 지금까지 ${num(g.span)}일. 이 방의 이야기는 아직 이어지고 있어요.`));
    ep.push({ type: "lines", lines: ["오늘은, 단톡방에 먼저 한마디 남겨 보세요."] });
    ch.push({ id: "epilogue", title: "에필로그", blocks: ep });
    return { cover, chapters: ch };
  }

  return { members, analyze, story, advice, verdict };
});
