/* 공통 도우미: 날짜, 통계, 한국어 조사(jong, iga, eunneun…) — CLAUDE.md 7장 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.U = factory();
})(this, function () {
  "use strict";
  const DAY = 86400000;
  const pad = n => String(n).padStart(2, "0");
  const dayKey = t => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  const monthKey = t => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1); };
  const keyToTime = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d || 1).getTime(); };
  const addDays = (k, n) => { const [y, m, d] = k.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n).getTime()); };
  const diffDays = (a, b) => Math.round((keyToTime(b) - keyToTime(a)) / DAY);
  const median = arr => { if (!arr.length) return null; const s = arr.slice().sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
  const quantile = (arr, q) => { if (!arr.length) return null; const s = arr.slice().sort((a, b) => a - b), p = (s.length - 1) * q, lo = Math.floor(p); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (p - lo); };
  const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const num = n => (n == null || isNaN(n)) ? "-" : Math.round(n).toLocaleString("ko-KR");
  const num1 = n => (n == null || isNaN(n)) ? "-" : (Math.round(n * 10) / 10).toLocaleString("ko-KR");
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const fmtDate = k => { if (!k) return "-"; const [y, m, d] = k.split("-").map(Number); return d ? `${y}년 ${m}월 ${d}일` : `${y}년 ${m}월`; };
  const fmtShort = k => { if (!k) return "-"; const [y, m, d] = k.split("-").map(Number); return d ? `${m}월 ${d}일` : `${m}월`; };
  const hm = min => { if (min == null) return "-"; min = ((Math.round(min) % 1440) + 1440) % 1440; const h = Math.floor(min / 60), m = min % 60; return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}시${m ? " " + m + "분" : ""}`; };
  const WD = ["일", "월", "화", "수", "목", "금", "토"];

  // 받침 여부: 한글은 종성, 숫자는 읽는 소리 기준(0은 받침 있음 "00이")
  function jong(word) {
    const s = String(word).trim(); if (!s) return false;
    const ch = s[s.length - 1], c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 !== 0;
    if (/[0136780]/.test(ch)) return true;
    if (/[2459]/.test(ch)) return false;
    if (ch === "○") return true;
    return false;
  }
  const iga = w => w + (jong(w) ? "이" : "가");
  const eunneun = w => w + (jong(w) ? "은" : "는");
  const eulreul = w => w + (jong(w) ? "을" : "를");
  const gwawa = w => w + (jong(w) ? "과" : "와");
  const irang = w => w + (jong(w) ? "이랑" : "랑");
  const ieyo = w => w + (jong(w) ? "이에요" : "예요");
  const ya = w => w + (jong(w) ? "아" : "야");
  // 사람 이름은 성을 떼고 쓴다(성+이름 3글자일 때)
  const disp = n => /^[가-힣]{3}$/.test(n) ? n.slice(1) : n;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  return { DAY, pad, dayKey, monthKey, keyToTime, addDays, diffDays, median, quantile, mean, clamp01, num, num1, pct, fmtDate, fmtShort, hm, WD,
    jong, iga, eunneun, eulreul, gwawa, irang, ieyo, ya, disp, esc };
});
