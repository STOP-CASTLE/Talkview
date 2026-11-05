/* 카톡 txt 파싱 — CLAUDE.md 2장. (규칙 표 1/7 원본 누락 → 2쪽 설명대로 작성) */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Parse = factory();
})(this, function () {
  "use strict";

  const toH = (ap, h) => { h = +h % 12; if (ap === "오후") h += 12; return h; };
  // 안드로이드/기본: 2024. 12. 6. 오후 8:32, 이름 : 메시지
  const RE_AND = /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s:\s(.*)$/;
  // iOS: 2024년 12월 6일 오후 8:32, 이름 : 메시지
  const RE_IOS = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s:\s(.*)$/;
  // PC: [이름] [오후 8:32] 메시지
  const RE_PC = /^\[(.+?)\]\s\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s(.*)$/;
  // 날짜 구분 줄 (PC: --------------- 2024년 12월 6일 금요일 ---------------)
  const RE_DATE = /^-*\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*[월화수목금토일]요일\s*-*$/;
  // 시간은 있지만 " : "가 없는 시스템 줄(입장/퇴장 등)
  const RE_SYS = /^(\d{4})(\.\s*\d{1,2}\.\s*\d{1,2}\.|년\s*\d{1,2}월\s*\d{1,2}일)\s*(오전|오후)\s*\d{1,2}:\d{2}/;
  const RE_SAVED = /^저장한 날짜\s*:/;

  function classify(text) {
    const t = text.trim();
    let m;
    if ((m = t.match(/^사진(?:\s*(\d+)장)?$/))) return { type: "photo", n: m[1] ? +m[1] : 1 };
    if (t === "이모티콘" || t === "(이모티콘)") return { type: "emoticon" };
    if (t === "동영상" || t === "삭제된 메시지입니다.") return { type: "deleted" };
    if ((m = t.match(/^(?:보이스톡|페이스톡)\s+(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/))) {
      return { type: "call", sec: (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) };
    }
    if (/^https?:\/\/\S+$/.test(t)) return { type: "link" };
    return { type: "text" };
  }

  /* ---------- CSV (맥용 카카오톡 "대화 내보내기") ----------
     머리줄 예: Date,User,Message  /  행 예: 2024-12-06 20:32:15,"이름","메시지"(줄바꿈은 따옴표 안에)
     날짜는 "2024-12-06 20:32(:15)", "2024. 12. 6. 오후 8:32", "2024/12/06 20:32" 모두 받는다. */
  const RE_CSV_HEAD = /^\uFEFF?\s*"?(date|날짜|일시|시간)"?\s*[,\t]\s*"?(user|사용자|보낸\s?사람|이름|name)"?\s*[,\t]\s*"?(message|메시지|메세지|내용)"?/i;
  const RE_CSV_ROW = /^\uFEFF?"?\d{4}[-./]\s*\d{1,2}[-./]\s*\d{1,2}\.?\s+(오전|오후)?\s*\d{1,2}:\d{2}(:\d{2})?"?\s*[,\t]/;
  function looksCSV(raw) {
    const first = String(raw).replace(/^\uFEFF/, "").split(/\r?\n/).find(l => l.trim()) || "";
    return RE_CSV_HEAD.test(first) || RE_CSV_ROW.test(first);
  }
  function csvRows(text, delim) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"' && f === "") q = true;
      else if (c === delim) { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function csvTime(s) {
    s = s.trim(); let m;
    if ((m = s.match(/^(\d{4})[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})\.?\s+(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/))) {
      const h = m[4] ? toH(m[4], m[5]) : +m[5];
      return new Date(+m[1], +m[2] - 1, +m[3], h, +m[6], +(m[7] || 0)).getTime();
    }
    return NaN;
  }
  function parseCSV(raw) {
    const text = String(raw).replace(/^\uFEFF/, "");
    const first = text.split(/\r?\n/)[0] || "";
    const delim = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? "\t" : ",";
    const rows = csvRows(text, delim);
    if (rows.length && RE_CSV_HEAD.test(rows[0].join(delim))) rows.shift();
    const out = []; let seq = 0;
    for (const r of rows) {
      if (r.length < 3) continue;
      const t = csvTime(r[0]); if (isNaN(t)) continue;
      const who = (r[1] || "").trim(); if (!who) continue;
      const msg = r.slice(2).join(delim).replace(/\n+$/, "");
      out.push(Object.assign({ t, who, text: msg, seq: seq++ }, classify(msg)));
    }
    return out;
  }

  function parseText(raw) {
    if (looksCSV(raw)) return parseCSV(raw);
    const lines = String(raw).replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "").split("\n");
    const out = [];
    let cur = null, curDate = null, seq = 0;
    const push = (y, mo, d, h, mi, who, text) => {
      cur = { t: new Date(+y, +mo - 1, +d, h, +mi).getTime(), who: who.trim(), text, seq: seq++ };
      out.push(cur);
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      if (i === 0 && /카카오톡 대화|KakaoTalk/.test(line) && !RE_AND.test(line) && !RE_IOS.test(line)) { cur = null; continue; }
      if (RE_SAVED.test(line)) { cur = null; continue; }
      if ((m = line.match(RE_AND)) || (m = line.match(RE_IOS))) { push(m[1], m[2], m[3], toH(m[4], m[5]), m[6], m[7], m[8]); continue; }
      if ((m = line.match(RE_DATE))) { curDate = [m[1], m[2], m[3]]; cur = null; continue; }
      if ((m = line.match(RE_PC)) && curDate) { push(curDate[0], curDate[1], curDate[2], toH(m[2], m[3]), m[4], m[1], m[5]); continue; }
      if (RE_SYS.test(line)) { cur = null; continue; }
      if (cur) cur.text += "\n" + line; // 이전 메시지의 이어지는 줄
    }
    for (const msg of out) {
      msg.text = msg.text.replace(/\n+$/, "");
      Object.assign(msg, classify(msg.text));
    }
    return out;
  }

  // 파일명 속 숫자 자연수 정렬
  function naturalCompare(a, b) {
    const ax = a.match(/\d+|\D+/g) || [], bx = b.match(/\d+|\D+/g) || [];
    for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
      const x = ax[i], y = bx[i];
      if (x === y) continue;
      if (/^\d/.test(x) && /^\d/.test(y)) return (+x) - (+y);
      return x < y ? -1 : 1;
    }
    return ax.length - bx.length;
  }

  // files: [{name, text}] → 두 사람 메시지 (가장 많이 말한 두 사람만)
  function parseFiles(files) {
    const sorted = files.slice().sort((a, b) => naturalCompare(a.name, b.name));
    let all = [], seq = 0;
    for (const f of sorted) for (const m of parseText(f.text)) { m.seq = seq++; all.push(m); }
    all.sort((a, b) => a.t - b.t || a.seq - b.seq);
    const cnt = {};
    for (const m of all) cnt[m.who] = (cnt[m.who] || 0) + 1;
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 2);
    if (top.length < 2) return { people: top, messages: all, others: 0 };
    const keep = all.filter(m => top.includes(m.who));
    const A = keep[0].who, B = top.find(p => p !== A);
    return { people: [A, B], messages: keep, others: all.length - keep.length };
  }

  return { parseText, parseFiles, parseCSV, looksCSV, classify, naturalCompare };
});
