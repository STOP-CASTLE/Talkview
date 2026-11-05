/* 핵심 분석 — CLAUDE.md 3·4·5장. analyze(messages, people) → result */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"), require("./util.js"), require("./extra.js"), require("./routine.js"));
  else root.Analyze = factory(root.Rules, root.U, root.Extra, root.Routine);
})(this, function (R, U, Extra, Routine) {
  "use strict";
  const H = 3600000, MIN = 60000;
  const HARSH = /씨발|시발|ㅅㅂ|병신|ㅂㅅ|존나|좆|개새|닥쳐/; // 대표 장면에서 빼는 거친 말 (원문 정의 없음 → CLAUDE.md 결정 기록)
  const SEASON = m => m >= 3 && m <= 5 ? "봄" : m >= 6 && m <= 8 ? "여름" : m >= 9 && m <= 11 ? "가을" : "겨울";
  const seasonKey = t => { const d = new Date(t), m = d.getMonth() + 1, y = m <= 2 ? d.getFullYear() - 1 : d.getFullYear(); return y + " " + SEASON(m); };
  const FORMAL = /(요|니다|니까|세요|죠)[\s~.!?ㅎㅋㅠㅜ^]*$/;
  const NAME_FRAG = /^이(는|가|랑|야|도|한테|를|의|지|고)$/;

  const zero = people => Object.fromEntries(people.map(p => [p, 0]));
  const sceneOf = (ms, i0, i1) => ms.slice(Math.max(0, i0), Math.min(ms.length, i1)).map(m => ({ who: m.who, t: m.t, text: m.type === "text" ? m.text : m.type === "photo" ? "(사진)" : m.type === "emoticon" ? "(이모티콘)" : m.type === "call" ? "(통화 " + Math.round(m.sec / 60) + "분)" : m.type === "link" ? "(링크)" : "(삭제된 메시지)" }));

  function analyze(messages, people) {
    const [A, B] = people;
    const N = messages.length;
    const texts = messages.filter(m => m.type === "text");
    const r = { people, A, B };

    /* ---------- overview ---------- */
    const byWho = zero(people), photos = zero(people), emoticons = zero(people), calls = zero(people), chars = zero(people), textCount = zero(people);
    const laughBy = zero(people), dayLaugh = {}; // v18 친구: 사람별 ㅋㅋ/ㅎㅎ 말풍선, 날짜별 웃음
    let laugh = 0, cry = 0, callCount = 0, callSec = 0, lateNight = 0, firstCallInfo = null, longestCall = null;
    const daily = {}, monthly = {}, weekday = Array(7).fill(0), hourly = Array(24).fill(0);
    for (const m of messages) {
      byWho[m.who]++;
      const dk = U.dayKey(m.t), mk = U.monthKey(m.t), d = new Date(m.t);
      (daily[dk] = daily[dk] || Object.assign({ total: 0 }, zero(people))).total++; daily[dk][m.who]++;
      (monthly[mk] = monthly[mk] || Object.assign({ total: 0, texts: 0, love: 0, photos: 0, calls: 0 }, zero(people))).total++; monthly[mk][m.who]++;
      weekday[d.getDay()]++; hourly[d.getHours()]++;
      if (d.getHours() <= 5) lateNight++;
      if (m.type === "photo") { photos[m.who] += m.n; monthly[mk].photos += m.n; }
      if (m.type === "emoticon") emoticons[m.who]++;
      if (m.type === "call") {
        calls[m.who]++; callCount++; callSec += m.sec; monthly[mk].calls++;
        if (!firstCallInfo) firstCallInfo = { date: dk, who: m.who, sec: m.sec };
        if (!longestCall || m.sec > longestCall.sec) longestCall = { date: dk, who: m.who, sec: m.sec };
      }
      if (m.type === "text") {
        chars[m.who] += m.text.length; textCount[m.who]++; monthly[mk].texts++;
        laugh += (m.text.match(/[ㅋㅎ]/g) || []).length; cry += (m.text.match(/[ㅠㅜ]/g) || []).length;
        if (/[ㅋㅎ]{2,}/.test(m.text)) { laughBy[m.who]++; dayLaugh[dk] = (dayLaugh[dk] || 0) + 1; }
      }
    }
    const firstDay = U.dayKey(messages[0].t), lastDay = U.dayKey(messages[N - 1].t);
    const span = U.diffDays(firstDay, lastDay) + 1;
    let streak = 0, longestStreak = 0, longestStreakEnd = firstDay, missing = [];
    for (let k = firstDay; k <= lastDay; k = U.addDays(k, 1)) {
      if (daily[k]) { streak++; if (streak > longestStreak) { longestStreak = streak; longestStreakEnd = k; } }
      else { streak = 0; missing.push(k); }
    }
    const missingList = [];
    for (const k of missing) { const g = missingList[missingList.length - 1]; if (g && U.addDays(g.to, 1) === k) { g.to = k; g.n++; } else missingList.push({ from: k, to: k, n: 1 }); }
    missingList.sort((a, b) => b.n - a.n);
    r.overview = {
      total: N, byWho, span, chatDays: Object.keys(daily).length, avgPerDay: N / span,
      first: firstDay, last: lastDay, photos, emoticons, calls, callCount, callMinutes: Math.round(callSec / 60),
      chars, textCount, textTotal: texts.length, laugh, cry, longestStreak, longestStreakEnd, currentStreak: streak,
      missingDays: missing.length, missingList: missingList.slice(0, 5), lateNight, firstCallInfo, longestCall
    };
    r.laughBy = laughBy;
    r.daily = daily; r.monthly = monthly; r.weekday = weekday; r.hourly = hourly;
    r.topDays = Object.entries(daily).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([date, v]) => Object.assign({ date }, v));

    /* ---------- speed ---------- */
    const reply = {}; for (const p of people) reply[p] = [];
    const init = zero(people), enders = zero(people), doubles = zero(people);
    const laughReact = zero(people); // v18: p의 말 바로 뒤(10분 안) 상대가 ㅋㅋ/ㅎㅎ로 반응한 횟수 = p가 웃긴 횟수
    const openers = {}; // v17: 사람별 '조용한 뒤 먼저 건넨 첫마디'(짝사랑 이야기용)
    const sessions = []; let sess = { start: 0, n: 0 };
    let longestSilence = { hours: 0 };
    const monthlyReplyRaw = {};
    for (let i = 0; i < N; i++) {
      const m = messages[i], prev = messages[i - 1], gap = prev ? m.t - prev.t : Infinity;
      if (gap > R.GAP_INIT) { init[m.who]++; if (m.type === "text" && m.text.length >= 2 && m.text.length <= 30) (openers[m.who] = openers[m.who] || []).push({ text: m.text, date: U.dayKey(m.t) }); }
      if (gap > R.GAP_SESSION) { if (prev) { sessions.push(sess); enders[prev.who]++; } sess = { start: i, n: 0 }; }
      sess.n++;
      if (prev && gap > longestSilence.hours * H) longestSilence = { hours: gap / H, from: U.dayKey(prev.t), to: U.dayKey(m.t), breaker: m.who };
      if (prev && prev.who === m.who && gap <= R.GAP_SESSION) doubles[m.who]++;
      if (prev && prev.who !== m.who && gap <= 10 * MIN && m.type === "text" && /[ㅋㅎ]{2,}/.test(m.text) && prev.type !== "emoticon") laughReact[prev.who]++;
      if (prev && prev.who !== m.who && gap <= R.GAP_REPLY) {
        const mins = Math.round(gap / MIN); reply[m.who].push(mins);
        const mk = U.monthKey(m.t); (monthlyReplyRaw[mk] = monthlyReplyRaw[mk] || { [A]: [], [B]: [] })[m.who].push(mins);
      }
    }
    sessions.push(sess); enders[messages[N - 1].who]++;
    const rs = {};
    for (const p of people) {
      const a = reply[p];
      rs[p] = { n: a.length, mean: U.mean(a), median: U.median(a), in1: a.length ? a.filter(x => x <= 1).length / a.length : 0, in5: a.length ? a.filter(x => x <= 5).length / a.length : 0, in30: a.length ? a.filter(x => x <= 30).length / a.length : 0 };
    }
    const maxS = sessions.reduce((a, b) => b.n > a.n ? b : a, sessions[0]);
    r.laughReact = laughReact;
    r.openers = Object.fromEntries(people.map(p => [p, (openers[p] || []).slice(-5)]));
    r.speed = {
      reply: rs, init, enders, doubles, sessions: sessions.length, avgSessionLen: N / sessions.length,
      maxSession: { n: maxS.n, date: U.dayKey(messages[maxS.start].t), start: maxS.start, minutes: Math.round((messages[maxS.start + maxS.n - 1].t - messages[maxS.start].t) / MIN) },
      longestSilence,
      monthlyReply: Object.fromEntries(Object.entries(monthlyReplyRaw).map(([k, v]) => [k, { [A]: U.median(v[A]), [B]: U.median(v[B]) }]))
    };

    /* ---------- love ---------- */
    const love = {};
    for (const key in R.LOVE) {
      const re = R.LOVE[key]; const o = Object.assign({ total: 0, first: null }, zero(people));
      for (let i = 0; i < N; i++) {
        const m = messages[i]; if (m.type !== "text" || !re.test(m.text)) continue;
        o.total++; o[m.who]++;
        if (m.text.length <= 40) o.last = { date: U.dayKey(m.t), who: m.who, text: m.text };
        if (!o.first && (key !== "love" || m.text.length <= 40)) o.first = { date: U.dayKey(m.t), who: m.who, text: m.text, i };
      }
      love[key] = o;
    }
    r.love = love;
    for (const m of texts) if (R.LOVE.love.test(m.text)) monthly[U.monthKey(m.t)].love++;
    r.loveMonthly = Object.fromEntries(Object.keys(monthly).sort().map(k => [k, monthly[k].total ? monthly[k].love / monthly[k].total * 1000 : 0]));
    r.firstSay = { love: love.love.first, miss: love.miss.first };
    // 첫 사랑해의 답장
    r.firstLoveReply = null;
    if (love.love.first) {
      const f = love.love.first, other = f.who === A ? B : A;
      for (let j = f.i + 1; j < Math.min(N, f.i + 81); j++) {
        const m = messages[j]; if (m.t - messages[f.i].t > 3 * H) break;
        if (m.who === other && m.type === "text" && m.text.length <= 30 && (/^(히히|ㅎㅎ+|헤헤)?\s*(나두|나도|저도|저두)/.test(m.text) || R.LOVE.love.test(m.text))) {
          r.firstLoveReply = { who: other, text: m.text, minutes: Math.round((m.t - messages[f.i].t) / MIN), date: U.dayKey(m.t) }; break;
        }
      }
    }
    const mid = messages[0].t + (messages[N - 1].t - messages[0].t) / 2;
    const half = (pred) => { const ms = messages.filter(pred); const l = ms.filter(m => m.type === "text" && R.LOVE.love.test(m.text)).length; return ms.length ? l / ms.length * 1000 : 0; };
    r.loveTrend = { first: half(m => m.t < mid), second: half(m => m.t >= mid) };

    /* ---------- nicknames / words ---------- */
    const nick = [];
    for (const [label, re] of R.NICK_CANDIDATES) {
      const o = Object.assign({ label, total: 0, dates: [] }, zero(people));
      for (const m of texts) if (re.test(m.text)) { o.total++; o[m.who]++; o.dates.push(m.t); }
      if (o.total < 8) continue;
      let first = null;
      for (let i = 0; i + 4 < o.dates.length; i++) if (o.dates[i + 4] - o.dates[i] <= 14 * U.DAY) { first = U.dayKey(o.dates[i]); break; }
      o.first = first; o.main = o[A] >= o[B] ? A : B; delete o.dates;
      nick.push(o);
    }
    nick.sort((a, b) => b.total - a.total);
    const nameCalls = { [A]: texts.filter(m => m.who === A && m.text.includes(B)).length, [B]: texts.filter(m => m.who === B && m.text.includes(A)).length };
    r.nicknames = { list: nick, nameCalls };
    const wc = {}; for (const p of people) wc[p] = {};
    const shortC = {}; for (const p of people) shortC[p] = {};
    for (const m of texts) {
      for (const w of (m.text.match(/[가-힣]{2,}/g) || [])) {
        if (R.STOP.has(w) || NAME_FRAG.test(w)) continue;
        wc[m.who][w] = (wc[m.who][w] || 0) + 1;
      }
      const s = m.text.trim();
      if (s.length <= 6 && !/^[ㅋㅎㅠㅜ\s~!?.]+$/.test(s)) shortC[m.who][s] = (shortC[m.who][s] || 0) + 1;
    }
    const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w, c]) => ({ w, c }));
    r.words = Object.fromEntries(people.map(p => [p, top(wc[p], 20)]));
    r.shorts = Object.fromEntries(people.map(p => [p, top(shortC[p], 8)]));

    /* ---------- conflict ---------- */
    const dayIdx = {};
    messages.forEach((m, i) => { const k = U.dayKey(m.t); (dayIdx[k] = dayIdx[k] || []).push(i); });
    const dayScore = k => {
      let s = 0; const used = new Set(); let start = null;
      for (const i of dayIdx[k] || []) {
        const m = messages[i]; if (m.type !== "text") continue;
        const st = R.STRONG.test(m.text), mi = R.MILD.test(m.text);
        if (st) s += 2; if (mi) s += 1;
        if (st || mi) { used.add(m.who); if (start == null) start = i; }
      }
      return { s, both: used.size === 2, start };
    };
    const cdays = [];
    for (const k of Object.keys(dayIdx)) { const d = dayScore(k); if (d.s >= 5 && d.both) cdays.push(Object.assign({ date: k }, d)); }
    cdays.sort((a, b) => b.s - a.s);
    const topC = cdays.slice(0, 25).sort((a, b) => a.date < b.date ? -1 : 1);
    const topicCnt = {}, makeCnt = {}, apolog = zero(people);
    let resolved = 0;
    for (const c of topC) {
      const idx = dayIdx[c.date], dt = idx.map(i => messages[i]).filter(m => m.type === "text");
      const tc = R.TOPICS.map(([label, re]) => [label, dt.filter(m => re.test(m.text)).length]).filter(x => x[1] >= 3).sort((a, b) => b[1] - a[1]).slice(0, 2);
      c.topics = tc.map(x => x[0]); for (const t of c.topics) topicCnt[t] = (topicCnt[t] || 0) + 1;
      const nextK = U.addDays(c.date, 1);
      const after = messages.slice(c.start, (dayIdx[nextK] ? dayIdx[nextK][dayIdx[nextK].length - 1] : idx[idx.length - 1]) + 1).filter(m => m.type === "text");
      c.makeup = R.MAKEUP.filter(([label, re]) => after.filter(m => re.test(m.text)).length >= (R.MAKEUP_MIN[label] || 2)).map(x => x[0]);
      for (const mk of c.makeup) makeCnt[mk] = (makeCnt[mk] || 0) + 1;
      const ap = after.find(m => /미안|죄송|잘못/.test(m.text)); c.apologizedFirst = ap ? ap.who : null; if (ap) apolog[ap.who]++;
      c.resolvedNextDay = dayScore(nextK).s < 3; if (c.resolvedNextDay) resolved++;
    }
    // 대표 장면
    const pickScene = (k, wordRe) => {
      const idx = dayIdx[k]; if (!idx || idx.length < 9) return null;
      let best = null;
      for (let s = 0; s + 9 <= idx.length; s++) {
        const w = idx.slice(s, s + 9).map(i => messages[i]);
        if (w.some(m => m.type === "text" && HARSH.test(m.text))) continue;
        let sc = 0;
        w.forEach((m, j) => { if (m.type === "text" && wordRe.test(m.text)) sc += 2; if (j && m.t - w[j - 1].t > 15 * MIN) sc -= 3; });
        if (!best || sc > best.sc) best = { sc, i: idx[s] };
      }
      return best ? { date: k, lines: sceneOf(messages, best.i, best.i + 9) } : null;
    };
    const CONF_WORDS = new RegExp([R.STRONG.source, R.MILD.source].concat(R.MAKEUP.map(x => x[1].source)).join("|"));
    const scenes = topC.slice().sort((a, b) => b.s - a.s).slice(0, 3).map(c => pickScene(c.date, CONF_WORDS)).filter(Boolean);
    const sorry = zero(people), worry = zero(people);
    for (const m of texts) { if (/미안|죄송/.test(m.text)) sorry[m.who]++; if (/걱정/.test(m.text)) worry[m.who]++; }
    r.conflict = {
      days: topC, count: cdays.length, topics: Object.entries(topicCnt).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      makeup: Object.entries(makeCnt).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      apologizedFirst: apolog, resolvedNextDayPct: topC.length ? Math.round(resolved / topC.length * 100) : null, scenes, sorry, worry
    };

    /* ---------- seasons ---------- */
    const allW = {}; let allWN = 0;
    for (const m of texts) for (const w of (m.text.match(/[가-힣]{2,}/g) || [])) if (!R.STOP.has(w) && !R.GENERIC.has(w)) { allW[w] = (allW[w] || 0) + 1; allWN++; }
    const seas = {};
    for (const m of messages) {
      const k = seasonKey(m.t);
      const s = seas[k] = seas[k] || { key: k, msgs: 0, love: 0, photos: 0, days: new Set(), w: {}, wn: 0, texts: [] };
      s.msgs++; s.days.add(U.dayKey(m.t));
      if (m.type === "photo") s.photos += m.n;
      if (m.type === "text") {
        s.texts.push(m);
        if (R.LOVE.love.test(m.text)) s.love++;
        for (const w of (m.text.match(/[가-힣]{2,}/g) || [])) if (!R.STOP.has(w) && !R.GENERIC.has(w)) { s.w[w] = (s.w[w] || 0) + 1; s.wn++; }
      }
    }
    const WARM = new RegExp([R.LOVE.love.source, R.LOVE.thanks.source, R.LOVE.cute.source, R.LOVE.miss.source].join("|"));
    const THIRD = new RegExp(R.PEOPLE.slice(0, 3).map(p => p[1].source).join("|"));
    const usedQ = new Set();
    const pickQuote = (list, who) => {
      const c = list.filter(m => m.who === who && !usedQ.has(m.text) && m.text.length >= 8 && m.text.length <= 40 && !m.text.includes("\n") && WARM.test(m.text) && !THIRD.test(m.text));
      c.sort((a, b) => Math.abs(a.text.length - 22) - Math.abs(b.text.length - 22) || a.t - b.t);
      if (c[0]) usedQ.add(c[0].text);
      return c[0] ? { who, text: c[0].text, date: U.dayKey(c[0].t) } : null;
    };
    r.seasons = Object.values(seas).map(s => {
      const minC = Math.max(5, Math.round(s.wn / 2000));
      const cand = Object.entries(s.w).filter(([w, c]) => c >= minC && (c / s.wn) / (allW[w] / allWN) >= 1.8).sort((a, b) => b[1] - a[1]);
      const seen = new Set(), words = [];
      for (const [w] of cand) { const k2 = w.slice(0, 2); if (seen.has(k2)) continue; seen.add(k2); words.push(w); if (words.length === 5) break; }
      return { key: s.key, season: s.key.split(" ")[1], year: +s.key.split(" ")[0], msgs: s.msgs, love: s.love, photos: s.photos, chatDays: s.days.size, words, quotes: people.map(p => pickQuote(s.texts, p)).filter(Boolean) };
    });

    /* ---------- speech / rhythm / firstFuture ---------- */
    const t0 = messages[0].t, t1 = messages[N - 1].t;
    const formal = (from, to) => Object.fromEntries(people.map(p => {
      const ms = texts.filter(m => m.who === p && m.t >= from && m.t < to);
      return [p, ms.length >= 30 ? Math.round(ms.filter(m => FORMAL.test(m.text)).length / ms.length * 100) : null];
    }));
    r.speech = { first: formal(t0, t0 + 30 * U.DAY), last: formal(t1 - 30 * U.DAY, t1 + 1) };
    const fm = zero(people), lm = zero(people), fh = [];
    for (const k in dayIdx) { const ix = dayIdx[k]; fm[messages[ix[0]].who]++; lm[messages[ix[ix.length - 1]].who]++; }
    r.rhythm = { firstMsg: fm, lastMsg: lm };
    const ff = love.future.first;
    r.firstFuture = ff ? { date: ff.date, who: ff.who, text: ff.text.length <= 60 ? ff.text : null } : null;

    /* ---------- 하루 요약 (사귄 날·기념일 분석용, v10) ----------
       [0 말풍선, 1 사랑해, 2 보고싶다, 3 A답장, 4 A 5분내, 5 B답장, 6 B 5분내, 7 존댓말 글, 8 글, 9 A먼저연락, 10 B먼저연락, 11 기념일 말] */
    const ANN = /기념일|주년|백일|\d+\s?일\s?(축하|기념|이다|이야|째)|(축하해|축하합니다)/;
    const days = {};
    for (let i = 0; i < N; i++) {
      const m = messages[i], prev = messages[i - 1], k = U.dayKey(m.t), gap = prev ? m.t - prev.t : Infinity;
      const d = days[k] || (days[k] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      d[0]++;
      if (gap > R.GAP_INIT) d[m.who === A ? 9 : 10]++;
      if (prev && prev.who !== m.who && gap <= R.GAP_REPLY) { const j = m.who === A ? 3 : 5; d[j]++; if (Math.round(gap / MIN) <= 5) d[j + 1]++; }
      if (m.type === "text") {
        d[8]++;
        if (R.LOVE.love.test(m.text)) d[1]++;
        if (R.LOVE.miss.test(m.text)) d[2]++;
        if (FORMAL.test(m.text)) d[7]++;
        if (ANN.test(m.text)) d[11]++;
      }
    }
    r.days = days;

    /* ---------- highlights ---------- */
    const around = (i, before) => i == null ? null : { date: U.dayKey(messages[i].t), lines: sceneOf(messages, i - before, i - before + 9) };
    r.highlights = {
      opening: { date: firstDay, lines: sceneOf(messages, 0, 9) },
      firstLove: love.love.first ? around(love.love.first.i, 3) : null,
      firstMiss: love.miss.first ? around(love.miss.first.i, 3) : null,
      peakDay: r.topDays[0] ? pickScene(r.topDays[0].date, WARM) : null,
      // v18.2: 함께 웃었던 순간들 — ㅋㅋ가 많이 오간 날 상위 4일의 장면(같은 달은 하나만)
      laughMoments: (() => { const out = [], seen = new Set(); for (const k of Object.keys(dayLaugh).sort((a, b) => dayLaugh[b] - dayLaugh[a])) { if (out.length >= 4 || dayLaugh[k] < 3) break; if (seen.has(k.slice(0, 7))) continue; const sc = pickScene(k, /[ㅋㅎ]{2,}/); if (sc) { seen.add(k.slice(0, 7)); out.push(Object.assign(sc, { n: dayLaugh[k] })); } } return out.sort((a, b) => a.date < b.date ? -1 : 1); })(),
      laughDay: (() => { const k = Object.keys(dayLaugh).sort((a, b) => dayLaugh[b] - dayLaugh[a])[0]; if (!k) return null; const sc = pickScene(k, /[ㅋㅎ]{2,}/); return sc ? Object.assign(sc, { n: dayLaugh[k] }) : null; })(),
      latest: { date: lastDay, lines: sceneOf(messages, N - 9, N) },
      longestScene: { date: r.speed.maxSession.date, lines: sceneOf(messages, maxS.start, maxS.start + 9) }
    };

    /* ---------- extra / routine ---------- */
    r.balance = Extra.balance(messages, people);
    r.life = Extra.life(messages, people);
    r.signals = Extra.signals(messages, people);
    r.routine = Routine.routine(messages, people);
    r.loveLang = loveLang(messages, people);
    r.mbti = mbti(r, messages, people);

    /* ---------- score ---------- */
    const ov = r.overview;
    const parts = [
      ["매일 이어진 대화", 25, ov.chatDays / ov.span],
      ["하루 대화량", 20, ov.avgPerDay / 250],
      ["빠른 답장", 20, (((rs[A].in5 || 0) + (rs[B].in5 || 0)) / 2 * 100) / 85],
      ["사랑 표현 농도", 20, love.love.total / N * 1000 / 8],
      ["주고받는 균형", 15, 1 - Math.abs(byWho[A] - byWho[B]) / N]
    ].map(([label, max, v]) => ({ label, max, ratio: U.clamp01(v), pts: Math.round(U.clamp01(v) * max * 10) / 10 }));
    r.score = { total: Math.round(parts.reduce((s, p) => s + p.pts, 0)), parts };
    return r;
  }

  /* 사랑의 언어 (v11, 재미용) — 사람마다 다섯 가지 표현을 글 1000개당으로 세고 기준값으로 나눠 비교.
     카톡 통화는 건 사람의 '함께하는 시간'으로 1번씩 더한다. 예시는 실제 대화 중 짧은 글(24자 이하) 2개. */
  function loveLang(messages, people) {
    const out = {};
    for (const p of people) {
      const mine = messages.filter(m => m.who === p);
      const texts = mine.filter(m => m.type === "text"), n = texts.length || 1;
      const calls = mine.filter(m => m.type === "call").length;
      const cats = R.LOVE_LANGS.map(L => {
        const hits = texts.filter(m => L.re.test(m.text));
        const count = hits.length + (L.key === "time" ? calls : 0);
        const per1000 = count / n * 1000;
        const ex = hits.filter(m => m.text.length <= 24 && m.text.length >= 3 && !/^(사랑해|고마워|ㅋ|ㅎ)+[\s!~.ㅎㅋ♡❤]*$/.test(m.text));
        const pick = [];
        for (const m of [ex[Math.floor(ex.length * 0.4)], ex[ex.length - 1]]) if (m && !pick.some(x => x.text === m.text)) pick.push({ text: m.text, date: U.dayKey(m.t) });
        return { key: L.key, label: L.label, count, calls: L.key === "time" ? calls : 0, per1000, score: per1000 / L.base, examples: pick };
      });
      const total = cats.reduce((x, c) => x + c.score, 0) || 1;
      cats.forEach(c => { c.share = Math.round(c.score / total * 100); });
      const rank = cats.slice().sort((a, b) => b.score - a.score);
      out[p] = { cats, top: rank[0].key, second: rank[1].key, texts: texts.length };
    }
    return out;
  }

  /* MBTI — 재미용 휴리스틱 (문서에 규칙 없음, CLAUDE.md 결정 기록) */
  function mbti(r, messages, people) {
    const texts = messages.filter(m => m.type === "text");
    const PLAN = new RegExp(R.LOVE.future.source + "|나중에|언젠가|미래|꿈|상상|만약");
    const FEEL = new RegExp([R.LOVE.love.source, R.LOVE.miss.source, R.LOVE.care.source, R.LOVE.thanks.source, "ㅠ|ㅜ|속상|기뻐|행복|슬퍼"].join("|"));
    const PROMISE = /약속|몇\s?시|일정|예약|계획|미리|준비/;
    const initTot = people.reduce((s, p) => s + r.speed.init[p], 0) || 1;
    return Object.fromEntries(people.map(p => {
      const mine = texts.filter(m => m.who === p), n = mine.length || 1;
      const rate = re => mine.filter(m => re.test(m.text)).length / n;
      const perDay = r.overview.byWho[p] / r.overview.span;
      const axes = [];
      const f1 = v => U.num1(v);
      const initPct = U.pct(r.speed.init[p], initTot);
      // E/I: 먼저 연락 비율 + 하루 말풍선
      const e = (r.speed.init[p] / initTot - 0.5) * 2 + (perDay / 60 - 1) * 0.5;
      axes.push(["E", "I", e, `먼저 연락 ${initPct}%, 하루 ${Math.round(perDay)}개`,
        e >= 0 ? `한동안 조용할 때 먼저 말을 건 게 ${initPct}%, 하루에 말풍선 ${Math.round(perDay)}개를 보내요. 먼저 다가가고 말이 많은 편이라 E로 봤어요.`
          : `한동안 조용할 때 먼저 말을 건 건 ${initPct}%예요. 대화를 먼저 열기보다 상대가 말을 걸어 주면 반기는 편이라 I로 봤어요.`]);
      // S/N: 미래·상상 vs 먹는 이야기
      const plan = rate(PLAN) * 100, meal = rate(R.MEAL) * 100;
      const nS = rate(PLAN) * 3 - rate(R.MEAL);
      axes.push(["N", "S", nS * 6, `미래·상상 단어 ${Math.round(rate(PLAN) * 1000)}‰, 먹는 이야기 ${Math.round(rate(R.MEAL) * 1000)}‰`,
        nS >= 0 ? `"나중에", "언젠가", 결혼처럼 앞날을 그리는 말이 글 100개 중 ${f1(plan)}개예요. 밥·간식 같은 오늘 이야기(${f1(meal)}개)보다 상상하는 이야기가 많아서 N으로 봤어요.`
          : `밥·간식·맛집 같은 오늘 이야기가 글 100개 중 ${f1(meal)}개로, 앞날을 그리는 말(${f1(plan)}개)보다 훨씬 많아요. 지금 여기를 이야기하는 편이라 S로 봤어요.`]);
      // F/T: 감정·애정 단어
      const feel = rate(FEEL) * 100;
      const f = (rate(FEEL) - 0.08) * 10;
      axes.push(["F", "T", f, `감정·애정 표현 ${Math.round(rate(FEEL) * 1000)}‰`,
        f >= 0 ? `사랑해·보고 싶어·고마워·걱정돼 같은 마음 표현이 글 100개 중 ${f1(feel)}개예요. 기준(8개)보다 많아서, 마음을 말로 잘 꺼내는 F로 봤어요.`
          : `사랑해·보고 싶어·고마워 같은 마음 표현이 글 100개 중 ${f1(feel)}개로 기준(8개)보다 적어요. 마음보다 내용 위주로 말하는 편이라 T로 봤어요.`]);
      // J/P: 기상·취침 퍼짐 + 약속 단어
      const rt = r.routine.by[p];
      const spreadH = rt && rt.ok ? (rt.sleep.iqr || 0) / 60 : 1.5;
      const prom = rate(PROMISE) * 1000;
      const j = (1.5 - spreadH) * 0.6 + (rate(PROMISE) - 0.02) * 20;
      const regular = spreadH <= 1.5, hasSleep = rt && rt.ok;
      const sleepJ = hasSleep ? (regular ? `잠드는 시각이 날마다 ${f1(spreadH)}시간 안에서 비슷하고, ` : `잠드는 시각은 날마다 ${f1(spreadH)}시간쯤 들쭉날쭉하지만, `) : "";
      const sleepP = hasSleep ? (regular ? `잠드는 시각은 날마다 비슷한 편이지만, ` : `잠드는 시각이 날마다 ${f1(spreadH)}시간쯤 들쭉날쭉하고, `) : "";
      axes.push(["J", "P", j, rt && rt.ok ? `잠드는 시각 퍼짐 ${U.num1(spreadH)}시간, 약속·계획 ${Math.round(rate(PROMISE) * 1000)}‰` : `약속·계획 ${Math.round(rate(PROMISE) * 1000)}‰ (수면 데이터 부족)`,
        j >= 0 ? `${sleepJ}"몇 시", "예약", "계획" 같은 약속 말이 글 1000개 중 ${Math.round(prom)}개예요. 미리 정해 두는 편이라 J로 봤어요.`
          : `${sleepP}"몇 시", "예약", "계획" 같은 약속 말은 글 1000개 중 ${Math.round(prom)}개로 ${prom < 5 ? "거의 없어요" : "많지 않아요"}. 그때그때 정하는 편이라 P로 봤어요.`]);
      const type = axes.map(([a, b, v]) => v >= 0 ? a : b).join("");
      const conf = Math.round(U.mean(axes.map(([, , v]) => Math.min(1, Math.abs(v)))) * 100);
      return [p, { type, confidence: Math.max(15, Math.min(85, conf)), axes: axes.map(([a, b, v, why, reason]) => ({ a, b, pick: v >= 0 ? a : b, strength: Math.round(Math.min(1, Math.abs(v)) * 100), why, reason })) }];
    }));
  }

  return { analyze, seasonKey };
});
