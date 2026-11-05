/* 사용자가 알려 준 정보(사귄 날, 실제 MBTI)로 하는 분석 — v10 (CLAUDE.md)
   입력: r(analyze 결과, r.days 필요), info = { since: "YYYY-MM-DD"|null, me: 이름|null, mbti: { 이름: "INFP" } }
   원칙: 숫자는 r.days에서 계산한 것만. MBTI 궁합은 재미용. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"));
  else root.Couple = factory(root.U);
})(this, function (U) {
  "use strict";
  const TYPES = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
  const POS = { E: 0, I: 0, S: 1, N: 1, T: 2, F: 2, J: 3, P: 3 };
  const WORD = { E: "사람들 속에서 힘을 얻는(E)", I: "혼자 충전하는(I)", S: "현실적인(S)", N: "상상하는(N)", T: "논리적인(T)", F: "마음을 먼저 보는(F)", J: "계획하는(J)", P: "즉흥적인(P)" };

  function agg(r, keys, calDays) {
    const [A, B] = r.people, t = Array(12).fill(0);
    for (const k of keys) { const d = r.days[k]; for (let i = 0; i < 12; i++) t[i] += d[i]; }
    const rep = t[3] + t[5];
    return {
      days: calDays, chatDays: keys.length, n: t[0],
      perDay: calDays ? t[0] / calDays : 0,
      love: t[1], love1000: t[0] ? t[1] / t[0] * 1000 : 0,
      miss: t[2],
      fast: rep ? Math.round((t[4] + t[6]) / rep * 100) : null,
      fastBy: { [A]: t[3] ? Math.round(t[4] / t[3] * 100) : null, [B]: t[5] ? Math.round(t[6] / t[5] * 100) : null },
      formal: t[8] >= 60 ? Math.round(t[7] / t[8] * 100) : null,
      init: { [A]: t[9], [B]: t[10] }
    };
  }

  // 달 단위 도우미 (사귄 날은 "YYYY-MM"까지만 받는다, v10.1)
  const mIdx = k => { const [y, m] = k.split("-").map(Number); return y * 12 + (m - 1); };
  const mDiff = (a, b) => mIdx(b) - mIdx(a);                 // a달 → b달 몇 개월
  const mKey = i => `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, "0")}`;
  const ym = n => n >= 12 ? `${Math.floor(n / 12)}년${n % 12 ? ` ${n % 12}개월` : ""}` : `${n}개월`;

  function sinceInfo(r, month, today) {
    const ov = r.overview, keys = Object.keys(r.days).sort();
    const start = month + "-01";
    const bk = keys.filter(k => k < start), ak = keys.filter(k => k >= start);
    const beforeDays = Math.max(0, U.diffDays(ov.first, start));
    const afterDays = start <= ov.last ? U.diffDays(start < ov.first ? ov.first : start, ov.last) + 1 : 0;
    const months = mDiff(month, today.slice(0, 7));          // 사귄 달 = 0
    const out = {
      month, start,
      months, ago: months <= 0 ? "이번 달에 연인이 되었어요" : `사귄 지 ${ym(months)}`,
      someMonths: mDiff(ov.first.slice(0, 7), month),        // 첫 대화 달 → 사귄 달
      someDays: beforeDays,
      before: beforeDays >= 7 && bk.length ? agg(r, bk, beforeDays) : null,
      after: afterDays >= 7 && ak.length ? agg(r, ak, afterDays) : null
    };
    const rel = x => x ? { who: x.who, date: x.date, m: mDiff(month, x.date.slice(0, 7)) } : null; // 0: 사귄 달, 양수: N개월 뒤, 음수: N개월 전
    out.firstLove = rel(r.firstSay.love);
    out.firstMiss = rel(r.firstSay.miss);
    // 기념일(달 단위): 사귄 달 + 해마다 같은 달
    const avg = out.after ? out.after.perDay : ov.avgPerDay;
    const anns = [];
    for (let k = 0; k <= 30; k++) {
      const mk = mKey(mIdx(month) + k * 12);
      if (mk < ov.first.slice(0, 7) || mk > ov.last.slice(0, 7)) continue;
      const ks = keys.filter(x => x.startsWith(mk)), t = Array(12).fill(0);
      for (const x of ks) for (let i = 0; i < 12; i++) t[i] += r.days[x][i];
      const [yy, mm] = mk.split("-").map(Number);
      const cal = new Date(yy, mm, 0).getDate();
      anns.push({ label: k ? `${k}주년` : "사귄 달", month: mk, perDay: t[0] / cal, n: t[0], love: t[1], celebrated: t[11] > 0, vsAvg: avg ? Math.round(t[0] / cal / avg * 100) : null });
    }
    out.anniversaries = anns;
    const nowM = today.slice(0, 7), years = Math.floor(Math.max(0, months) / 12);
    const nextK = months > 0 && months % 12 === 0 ? years : years + 1;
    const nk = mKey(mIdx(month) + nextK * 12);
    out.next = { label: `${nextK}주년`, month: nk, left: mDiff(nowM, nk) };
    return out;
  }

  function mbtiInfo(r, given) {
    const [A, B] = r.people, out = { by: {} };
    for (const p of [A, B]) {
      const real = given && TYPES.includes(given[p]) ? given[p] : null;
      if (!real) continue;
      const est = r.mbti[p];
      const axes = est.axes.map(x => { const want = real[POS[x.a]]; return { a: x.a, b: x.b, real: want, chat: x.pick, match: want === x.pick, strength: x.strength }; });
      out.by[p] = { real, est: est.type, same: axes.filter(x => x.match).length, axes };
    }
    if (out.by[A] && out.by[B]) {
      const a = out.by[A].real, b = out.by[B].real, same = [0, 1, 2, 3].filter(i => a[i] === b[i]).length;
      const NAMES = ["정반대라서 서로를 채워 주는 두 사람", "다른 점이 더 많아 서로에게 배우는 두 사람", "반은 닮고 반은 다른 두 사람", "많이 닮았지만 한 가지는 다른 두 사람", "거울처럼 닮은 두 사람"];
      const diff = [0, 1, 2, 3].filter(i => a[i] !== b[i]).map(i => [a[i], b[i]]);
      out.pair = { same, title: NAMES[same], diff };
      // 대화 속 증거 (실제 MBTI와 행동이 맞는지)
      const ev = [];
      const sp = r.speed, L = r.love.love;
      if (a[0] !== b[0]) {
        const e = a[0] === "E" ? A : B, i = e === A ? B : A, tot = (sp.init[A] + sp.init[B]) || 1;
        ev.push(sp.init[e] >= sp.init[i]
          ? { t: `E인 ${e}, 역시 먼저 말을 거는 쪽이었어요`, s: `조용하던 대화를 먼저 연 게 ${Math.round(sp.init[e] / tot * 100)}%예요.`, v: [sp.init[A], sp.init[B]] }
          : { t: `의외로, I인 ${i}${U.iga(i).slice(i.length)} 먼저 말을 거는 쪽이었어요`, s: `좋아하는 사람 앞에서는 I도 먼저 다가가요. 먼저 연 대화가 ${Math.round(sp.init[i] / tot * 100)}%예요.`, v: [sp.init[A], sp.init[B]] });
      }
      if (a[2] !== b[2]) {
        const f = a[2] === "F" ? A : B, t = f === A ? B : A;
        ev.push(L[f] >= L[t]
          ? { t: `F인 ${f}, "사랑해"도 더 많이 보냈어요`, s: `마음을 말로 꺼내는 데 망설임이 없었어요.`, v: [L[A], L[B]] }
          : { t: `의외로, T인 ${t}${U.iga(t).slice(t.length)} "사랑해"를 더 많이 보냈어요`, s: `논리적인 사람도 사랑 앞에서는 말을 아끼지 않아요.`, v: [L[A], L[B]] });
      }
      out.pair.evidence = ev;
    }
    return out;
  }

  function make(r, info, today) {
    info = info || {};
    today = today || U.dayKey(Date.now());
    const m = typeof info.since === "string" && /^\d{4}-\d{2}/.test(info.since) ? info.since.slice(0, 7) : null;
    return {
      me: r.people.includes(info.me) ? info.me : null,
      since: m && r.days ? sinceInfo(r, m, today) : null,
      mbti: mbtiInfo(r, info.mbti || {})
    };
  }

  return { make, TYPES, WORD, ym };
});
