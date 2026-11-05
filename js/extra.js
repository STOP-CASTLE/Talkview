/* 균형 / 일상 / 신호(최근 90일 vs 이전) — CLAUDE.md 5·6장 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"), require("./util.js"));
  else root.Extra = factory(root.Rules, root.U);
})(this, function (R, U) {
  "use strict";
  const H = 3600000;
  const isQ = t => t.includes("?") || R.Q_END.test(t);
  const words = t => (t.match(/[가-힣]{2,}/g) || []);
  const band = h => R.BANDS.findIndex(([, a, b]) => h >= a && h <= b);

  function cosine(a, b, vocab) {
    let d = 0, na = 0, nb = 0;
    for (const w of vocab) { const x = a[w] || 0, y = b[w] || 0; d += x * y; na += x * x; nb += y * y; }
    return na && nb ? d / Math.sqrt(na * nb) : 0;
  }
  function freq(msgs) { const f = {}; for (const m of msgs) for (const w of words(m.text)) if (!R.STOP.has(w)) f[w] = (f[w] || 0) + 1; return f; }
  function similarity(texts, people) {
    const fa = freq(texts.filter(m => m.who === people[0])), fb = freq(texts.filter(m => m.who === people[1]));
    const all = {}; for (const f of [fa, fb]) for (const w in f) all[w] = (all[w] || 0) + f[w];
    const vocab = Object.keys(all).sort((x, y) => all[y] - all[x]).slice(0, 300);
    return vocab.length ? Math.round(cosine(fa, fb, vocab) * 100) : null;
  }

  function balance(messages, people) {
    const texts = messages.filter(m => m.type === "text");
    const per = {};
    for (const p of people) {
      const mine = texts.filter(m => m.who === p), qs = mine.filter(m => isQ(m.text));
      per[p] = {
        texts: mine.length, questions: qs.length, qRatio: mine.length ? qs.length / mine.length : 0,
        askCare: qs.filter(m => R.ASK_CARE.test(m.text)).length,
        care: R.CARE_SETS.map(([label, re, ex]) => ({ label, ex, n: mine.filter(m => re.test(m.text)).length }))
      };
    }
    // 말투 닮음: 첫 60일 vs 마지막 60일
    const t0 = texts.length ? texts[0].t : 0, t1 = texts.length ? texts[texts.length - 1].t : 0;
    const simFirst = similarity(texts.filter(m => m.t < t0 + 60 * U.DAY), people);
    const simLast = similarity(texts.filter(m => m.t > t1 - 60 * U.DAY), people);
    // 번진 말버릇
    const first = {}, cnt = {};
    for (const m of texts) for (const w of new Set(words(m.text))) {
      if (R.GENERIC.has(w) || R.STOP.has(w)) continue;
      first[w] = first[w] || {}; cnt[w] = cnt[w] || {};
      if (!first[w][m.who]) first[w][m.who] = m.t;
      cnt[w][m.who] = (cnt[w][m.who] || 0) + 1;
    }
    const spread = [];
    for (const w in first) {
      const [A, B] = people, fa = first[w][A], fb = first[w][B], ca = cnt[w][A] || 0, cb = cnt[w][B] || 0;
      if (!fa || !fb || ca < 8 || cb < 8 || ca + cb < 40) continue;
      const gapDays = Math.abs(fa - fb) / U.DAY;
      if (gapDays < 14) continue;
      const from = fa < fb ? A : B;
      spread.push({ word: w, from, to: from === A ? B : A, firstFrom: U.dayKey(Math.min(fa, fb)), firstTo: U.dayKey(Math.max(fa, fb)), gapDays: Math.round(gapDays), total: ca + cb });
    }
    spread.sort((a, b) => b.total - a.total);
    // 서운할 시간: 요일 × BANDS, 1000개당
    const all = R.BANDS.map(() => Array(7).fill(0)), conf = R.BANDS.map(() => Array(7).fill(0));
    for (const m of messages) {
      const d = new Date(m.t), b = band(d.getHours()); if (b < 0) continue;
      all[b][d.getDay()]++;
      if (m.type === "text" && R.CONF_MSG.test(m.text)) conf[b][d.getDay()]++;
    }
    const heat = R.BANDS.map(([label], b) => ({ label, per1000: all[b].map((n, w) => n >= 30 ? conf[b][w] / n * 1000 : null), n: conf[b] }));
    const confTotal = texts.filter(m => R.CONF_MSG.test(m.text)).length;
    const confWeek = Array(7).fill(0), allWeek = Array(7).fill(0);
    for (const m of messages) { const g = new Date(m.t).getDay(); allWeek[g]++; if (m.type === "text" && R.CONF_MSG.test(m.text)) confWeek[g]++; }
    return { per, simFirst, simLast, spread: spread.slice(0, 6), heat, confTotal, confWeek: confWeek.map((n, i) => allWeek[i] ? n / allWeek[i] * 1000 : 0), confWeekN: confWeek };
  }

  function tripPeriods(messages) {
    const dayCnt = {}, dayMsgs = {};
    for (const m of messages) {
      const k = U.dayKey(m.t); dayMsgs[k] = (dayMsgs[k] || 0) + 1;
      if (m.type === "text" && R.TRIP_RE.test(m.text)) dayCnt[k] = (dayCnt[k] || 0) + 1;
    }
    const hot = Object.keys(dayCnt).filter(k => dayCnt[k] >= 3).sort();
    const groups = [];
    for (const k of hot) {
      const g = groups[groups.length - 1];
      if (g && U.diffDays(g.to, k) <= 3) { g.to = k; g.words += dayCnt[k]; }
      else groups.push({ from: k, to: k, words: dayCnt[k] });
    }
    const days = Object.keys(dayMsgs), avgAll = messages.length / Math.max(1, days.length ? U.diffDays(days.sort()[0], days[days.length - 1]) + 1 : 1);
    const res = groups.filter(g => g.words >= 8).map(g => {
      let n = 0, d = 0;
      for (let k = g.from; k <= g.to; k = U.addDays(k, 1)) { n += dayMsgs[k] || 0; d++; }
      const kinds = R.TRIPS.map(([label, re]) => ({ label, n: messages.filter(m => m.type === "text" && U.dayKey(m.t) >= g.from && U.dayKey(m.t) <= g.to && re.test(m.text)).length })).sort((a, b) => b.n - a.n);
      return Object.assign(g, { days: d, perDay: n / d, vsUsual: Math.round(n / d / avgAll * 100), kind: kinds[0].n ? kinds[0].label : "여행" });
    });
    res.sort((a, b) => b.words - a.words);
    return res.slice(0, 5).sort((a, b) => a.from < b.from ? -1 : 1);
  }

  function life(messages, people) {
    const texts = messages.filter(m => m.type === "text");
    const foods = R.FOODS.map(([label, re]) => {
      const by = {}; let total = 0;
      for (const m of texts) if (re.test(m.text)) { by[m.who] = (by[m.who] || 0) + 1; total++; }
      return { label, total, by };
    }).filter(f => f.total >= 5).sort((a, b) => b.total - a.total).slice(0, 10);
    const meal = texts.filter(m => R.MEAL.test(m.text)).length;
    const ppl = R.PEOPLE.map(([label, re]) => {
      const by = {}; let total = 0;
      for (const m of texts) if (re.test(m.text)) { by[m.who] = (by[m.who] || 0) + 1; total++; }
      return { label, total, by };
    });
    const third = {};
    for (const m of texts) for (const x of m.text.matchAll(/([가-힣]{2,3})씨/g)) {
      const n = x[1]; if (R.NAME_EXCL.test(n) || R.TITLE_EXCL.test(n) || R.NICK_WORDS.includes(n)) continue;
      third[n] = (third[n] || 0) + 1;
    }
    const thirdNames = Object.entries(third).filter(e => e[1] >= 15).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name: name + "씨", n }));
    return { foods, mealRatio: texts.length ? meal / texts.length : 0, meal, people: ppl, thirdNames, trips: tripPeriods(messages) };
  }

  // 최근 90일(rec) vs 이전(old)
  function window(messages, people, from, to) {
    const ms = messages.filter(m => m.t >= from && m.t < to);
    const texts = ms.filter(m => m.type === "text");
    const days = Math.max(1, (to - from) / U.DAY), months = days / 30.44;
    const per1000 = re => texts.length ? texts.filter(m => re.test(m.text)).length / texts.length * 1000 : 0;
    const PLAN = /같이\s?(가|하|먹|보|살)|가자|하자|갈래|할래|다음에|주말에|놀러/;
    const per = {};
    let initN = 0; const init = {};
    for (let i = 0; i < ms.length; i++) {
      const gap = i === 0 ? Infinity : ms[i].t - ms[i - 1].t;
      if (gap > R.GAP_INIT) { init[ms[i].who] = (init[ms[i].who] || 0) + 1; initN++; }
    }
    // 낮(9~20시) 6시간 넘는 침묵
    let daySilence = 0;
    for (let i = 1; i < ms.length; i++) {
      const a = ms[i - 1].t, b = ms[i].t;
      if (b - a > 6 * H && U.dayKey(a) === U.dayKey(b) && new Date(a).getHours() >= 9 && new Date(b).getHours() <= 20) daySilence++;
    }
    for (const p of people) {
      const mine = texts.filter(m => m.who === p);
      per[p] = { texts: mine.length, qRatio: mine.length ? mine.filter(m => isQ(m.text)).length / mine.length : 0, init: init[p] || 0 };
    }
    const reply = {}; for (const p of people) reply[p] = [];
    for (let i = 1; i < ms.length; i++) {
      const a = ms[i - 1], b = ms[i];
      if (a.who !== b.who && b.t - a.t <= R.GAP_REPLY) reply[b.who].push((b.t - a.t) / 60000);
    }
    const r5 = people.map(p => reply[p].length ? reply[p].filter(x => x <= 5).length / reply[p].length : null);
    return {
      days, msgs: ms.length, texts: texts.length, perDay: ms.length / days,
      love: per1000(R.LOVE.love),
      praise: texts.length ? texts.filter(m => R.LOVE.cute.test(m.text) || R.LOVE.thanks.test(m.text) || R.LOVE.miss.test(m.text)).length / texts.length * 1000 : 0,
      plan: per1000(new RegExp(R.LOVE.future.source + "|" + PLAN.source)),
      callsPerMonth: ms.filter(m => m.type === "call").length / months,
      calls: ms.filter(m => m.type === "call").length,
      trip: texts.filter(m => R.TRIP_RE.test(m.text)).length,
      conf: texts.filter(m => R.CONF_MSG.test(m.text)).length,
      confPer1000: per1000(R.CONF_MSG),
      longText: texts.length ? texts.filter(m => m.text.length > 25).length / texts.length * 1000 : 0,
      photos: ms.length ? ms.filter(m => m.type === "photo").reduce((s, m) => s + m.n, 0) / Math.max(1, texts.length) * 1000 : 0,
      daySilencePerMonth: daySilence / months,
      initN, per, reply5: r5
    };
  }

  function signals(messages, people) {
    if (!messages.length) return null;
    const t0 = messages[0].t, t1 = messages[messages.length - 1].t + 60000;
    const span = (t1 - t0) / U.DAY;
    const cut = t1 - 90 * U.DAY;
    return { span, comparable: span >= 150, rec: window(messages, people, cut, t1), old: span >= 150 ? window(messages, people, t0, cut) : null };
  }

  return { balance, life, signals, isQ };
});
