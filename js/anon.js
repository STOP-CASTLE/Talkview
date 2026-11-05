/* 실명 가리기 — CLAUDE.md 8장. 분석 "전에" 원문과 사람 키의 이름을 바꾼다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"));
  else root.Anon = factory(root.Rules);
})(this, function (R) {
  "use strict";
  const ALIAS = ["00", "○○"];
  const THIRD = ["일일", "이이", "삼삼", "사사", "오오", "육육", "칠칠", "팔팔", "구구", "십십"];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 받침 뺀 형태: "민" → "미" (+"니" 변형: 지민 → 지미니)
  function dropJong(ch) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171 || c % 28 === 0) return null;
    return String.fromCharCode(0xac00 + c - (c % 28));
  }

  function variants(name) {
    const v = new Set([name]);
    const isHangul3 = /^[가-힣]{3}$/.test(name);
    const given = isHangul3 ? name.slice(1) : name;
    if (/^[가-힣]{2,}$/.test(given)) {
      v.add(given);
      const last = given[given.length - 1], d = dropJong(last);
      if (d) v.add(given.slice(0, -1) + d + "니");
    }
    return [...v].sort((a, b) => b.length - a.length);
  }

  // opts.keepCouple: 두 사람 이름은 그대로 보여 준다(성은 떼고). 제3자 이름(~씨)만 가린다.
  function anonymize(parsed, opts) {
    const keep = !!(opts && opts.keepCouple);
    const [A, B] = parsed.people;
    const given = n => /^[가-힣]{3}$/.test(n) ? n.slice(1) : n;
    let names = keep ? [given(A), given(B)] : ALIAS;
    if (names[0] === names[1]) names = keep ? [A, B] : ALIAS;
    const map = {}; map[A] = names[0]; map[B] = names[1];
    const reps = [];
    if (!keep) [A, B].forEach((p, i) => variants(p).forEach(v => { if (v.length >= 2) reps.push([v, ALIAS[i]]); }));
    reps.sort((a, b) => b[0].length - a[0].length);
    const nameRe = reps.length ? new RegExp(reps.map(r => esc(r[0])).join("|"), "g") : null;
    const lookup = Object.fromEntries(reps);

    // 제3자 "~씨" (3번 이상)
    const thirdCnt = {};
    for (const m of parsed.messages) if (m.type === "text") {
      for (const x of m.text.matchAll(/([가-힣]{2,3})씨/g)) {
        const n = x[1];
        if (R.STEM_EXCL.has(n) || R.NAME_EXCL.test(n) || R.TITLE_EXCL.test(n)) continue;
        if (lookup[n] || variants(A).includes(n) || variants(B).includes(n)) continue;
        thirdCnt[n] = (thirdCnt[n] || 0) + 1;
      }
    }
    const third = Object.keys(thirdCnt).filter(n => thirdCnt[n] >= 3).sort((a, b) => thirdCnt[b] - thirdCnt[a]);
    const thirdMap = {};
    third.forEach((n, i) => { thirdMap[n] = THIRD[i] || ("제" + (i + 1)); });
    const thirdRe = third.length ? new RegExp("(" + third.map(esc).join("|") + ")(?=씨)", "g") : null;

    const messages = parsed.messages.map(m => {
      let text = m.text;
      if (nameRe) text = text.replace(nameRe, s => lookup[s]);
      if (thirdRe) text = text.replace(thirdRe, s => thirdMap[s]);
      return Object.assign({}, m, { who: map[m.who], text });
    });
    return { people: [names[0], names[1]], messages, others: parsed.others, thirdCount: third.length };
  }

  return { anonymize, variants, ALIAS };
});
