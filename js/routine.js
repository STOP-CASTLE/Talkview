/* 하루 루틴 계산 — CLAUDE.md 5장 "하루 루틴", "시간대별 활동" (재미용 추정) */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"), require("./util.js"));
  else root.Routine = factory(root.Rules, root.U);
})(this, function (R, U) {
  "use strict";
  const H = 3600000;
  const minOf = t => { const d = new Date(t); return d.getHours() * 60 + d.getMinutes(); };
  const day5 = t => U.dayKey(t - 5 * H); // 새벽 5시를 하루 시작으로
  const sleepShift = m => (m - 18 * 60 + 1440) % 1440; // 18시를 0으로 이동

  function topShort(list) {
    const c = {};
    for (const s of list) { const k = s.trim(); if (k && k.length <= 12) c[k] = (c[k] || 0) + 1; }
    return Object.entries(c).filter(e => e[1] >= 3).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([text, n]) => ({ text, n }));
  }

  function person(msgs) {
    const pairs = {};
    for (let i = 1; i < msgs.length; i++) {
      const p = msgs[i - 1], c = msgs[i], gap = c.t - p.t;
      if (gap < 3 * H || gap > 15 * H) continue;
      const ph = new Date(p.t).getHours(), ch = new Date(c.t).getHours();
      if (!(ph >= 21 || ph < 6)) continue;
      if (ch < 4 || ch > 13) continue;
      const k = day5(c.t);
      if (!pairs[k] || pairs[k].gap < gap) pairs[k] = { gap, sleep: p, wake: c };
    }
    const list = Object.values(pairs);
    if (list.length < 10) return { ok: false, pairs: list.length };
    const wake = list.map(x => minOf(x.wake.t)), sleep = list.map(x => sleepShift(minOf(x.sleep.t)));
    const wd = list.filter(x => { const g = new Date(x.wake.t).getDay(); return g >= 1 && g <= 5; });
    const we = list.filter(x => { const g = new Date(x.wake.t).getDay(); return g === 0 || g === 6; });
    const part = arr => arr.length >= 5 ? {
      wake: U.median(arr.map(x => minOf(x.wake.t))),
      sleep: (U.median(arr.map(x => sleepShift(minOf(x.sleep.t)))) + 18 * 60) % 1440, n: arr.length
    } : null;
    return {
      ok: true, pairs: list.length,
      wake: { med: U.median(wake), q1: U.quantile(wake, .25), q3: U.quantile(wake, .75) },
      sleep: { med: (U.median(sleep) + 18 * 60) % 1440, q1: (U.quantile(sleep, .25) + 1080) % 1440, q3: (U.quantile(sleep, .75) + 1080) % 1440, shifted: U.median(sleep), iqr: U.quantile(sleep, .75) - U.quantile(sleep, .25) },
      weekday: part(wd), weekend: part(we),
      firstWords: topShort(list.filter(x => x.wake.type === "text").map(x => x.wake.text)),
      lastWords: topShort(list.filter(x => x.sleep.type === "text").map(x => x.sleep.text)),
      hoursSleep: U.median(list.map(x => x.gap / H))
    };
  }

  function slotOf(h) { return R.SLOTS.findIndex(([a, b]) => h >= a && h < b); }

  function activities(messages) {
    const slotN = R.SLOTS.map(() => 0), hit = R.SLOTS.map(() => R.ACTS.map(() => 0)), tot = R.ACTS.map(() => 0);
    let n = 0;
    for (const m of messages) {
      if (m.type !== "text") continue;
      const s = slotOf(new Date(m.t).getHours()); slotN[s]++; n++;
      R.ACTS.forEach(([, re], j) => { if (re.test(m.text)) { hit[s][j]++; tot[j]++; } });
    }
    return R.SLOTS.map(([a, b, label], s) => {
      const cands = [];
      R.ACTS.forEach(([name], j) => {
        if (!slotN[s] || !tot[j]) return;
        const ratio = (hit[s][j] / slotN[s]) / (tot[j] / n);
        if (ratio >= 1.25 && hit[s][j] >= 15) cands.push({ name, n: hit[s][j], ratio, score: hit[s][j] * Math.log(ratio) });
      });
      cands.sort((x, y) => y.score - x.score);
      return { label, from: a, to: b, msgs: slotN[s], top: cands.slice(0, 2) };
    });
  }

  function routine(messages, people) {
    const by = {};
    for (const p of people) by[p] = person(messages.filter(m => m.who === p));
    return { by, slots: activities(messages) };
  }

  return { routine, sleepShift };
});
