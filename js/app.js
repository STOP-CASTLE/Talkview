/* 화면, 불러오기, 화면 전환(해시), 공유 받기 — DOM은 여기서만 쓴다 (CLAUDE.md "화면 구조 v2") */
const ANONYMIZE = true; // 제3자 이름 가리기 스위치 (CLAUDE.md 8장)
const SHOW_NAMES = true; // 두 사람 이름은 보여 준다 (v5.3, 사용자 요청)

(function () {
  "use strict";
  const U = window.U, C = window.Charts;
  const $ = s => document.querySelector(s);
  const e = U.esc, num = U.num, num1 = U.num1;
  const MAX = 120 * 1024 * 1024;
  const STORE = "talkview.last.v2"; // v2: 이름 표시판. 예전(이름 가린) 저장 결과는 버린다
  const MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  /* ---------- 아이콘 (직접 그린 선 아이콘) ---------- */
  const P = {
    home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
    book: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z",
    chat: "M4 5h16v11H9.5L5 19.5V16H4z",
    bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
    heart: "M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.5 12 20 12 20z",
    moon: "M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z",
    scale: "M12 4v16M6 20h12M4 8h16M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z",
    cup: "M5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2 2 0 0 1 0 4H16M8.5 3.5v2.5M12.5 3.5v2.5",
    people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20a5.5 5.5 0 0 1 11 0M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.5a5.5 5.5 0 0 1 3 5.5",
    cloud: "M7 17.5a4 4 0 0 1-.4-8A6 6 0 0 1 18 9a4 4 0 0 1-.5 8.5M12.5 12.5l-2 3.5h3l-2 3.5",
    back: "M15 5l-7 7 7 7",
    next: "M9 5l7 7-7 7",
    lock: "M6 11h12v9.5H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
    upload: "M12 15V4M7.5 8.5L12 4l4.5 4.5M5 15v4.5h14V15",
    trash: "M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13",
    eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    check: "M5 12.5l4.5 4.5L19 7.5",
    shield: "M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5",
    gift: "M4 9h16v4H4zM5.5 13h13v7.5h-13zM12 9v11.5M12 9C10.5 5 6.5 4.5 6.5 7S10 9 12 9c2 0 5.5-.5 5.5-2S13.5 5 12 9z",
    star: "M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
  };
  const ico = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;

  const DETAIL = {
    us: ["우리 두 사람", "star", "사귀고 나서 우리는 달라졌을까?"],
    freq: ["대화 빈도", "chat", "우리 얼마나 자주 이야기할까?"], speed: ["답장 속도", "bolt", "누가 더 빨리 답할까?"],
    love: ["애정 표현", "heart", "누가 더 사랑한다고 말할까?"], lang: ["사랑의 언어", "gift", "우리는 어떤 방식으로 사랑할까?"], routine: ["하루 루틴", "moon", "우리는 언제 자고 일어날까?"],
    balance: ["관계의 균형", "scale", "누가 더 챙겨 줄까?"], life: ["일상 이야기", "cup", "우리는 무슨 이야기를 할까?"],
    mbti: ["MBTI", "people", "우리는 어떤 사람일까?"], conflict: ["싸움과 화해", "cloud", "싸우면 어떻게 화해할까?"],
    // 짝사랑(v17)
    sig: ["호감 신호", "heart", "그 사람도 나에게 관심이 있을까?"], first: ["먼저 다가가기", "chat", "누가 먼저 다가갈까?"],
    reply: ["답장", "bolt", "답장은 얼마나 빨리 올까?"], curious: ["궁금함", "people", "그 사람도 나를 궁금해할까?"],
    heart: ["마음 표현", "gift", "마음은 얼마나 드러날까?"], trend: ["요즘 흐름", "sparkle", "요즘 우리는 가까워지고 있을까?"],
    // 친구(v18)
    fbond: ["우정 지수", "people", "우리 우정은 몇 점일까?"], flaugh: ["웃음", "sparkle", "누가 더 웃길까?"],
    ftalk: ["대화", "chat", "우리 얼마나 자주 이야기할까?"], freply: ["답장", "bolt", "누가 더 빨리 답할까?"],
    fcare: ["챙김", "heart", "누가 더 챙겨 줄까?"], ftopic: ["이야기", "cup", "우리는 무슨 이야기를 할까?"]
  };
  const FR_IDS = ["fbond", "flaugh", "ftalk", "freply", "fcare", "ftopic"];
  const CR_IDS = ["sig", "first", "reply", "curious", "heart", "trend"];
  const CRUSH = () => !!(state && state.rel === "crush");
  const FRIEND = () => !!(state && state.rel === "friend");
  const topTitle = t => t === "story" ? (CRUSH() ? "마음 이야기" : FRIEND() ? "우정 이야기" : TOP[t]) : t === "advice" ? (CRUSH() ? "다가가려면" : FRIEND() ? "더 친해지려면" : TOP[t]) : TOP[t];
  const modeIds = () => CRUSH() ? CR_IDS : FRIEND() ? FR_IDS : null;
  const TOP = { home: "홈", story: "사랑 이야기", analysis: "분석", advice: "더 사랑하려면", info: "우리 정보", safe: "안전한 이유" };
  const NAV = [["home", "홈", "home"], ["story", "이야기", "book"], ["analysis", "분석", "grid"], ["advice", "조언", "sparkle"]];
  let state = null, route = "home", depth = 0, lastRoute = null;

  /* ---------- 분석 실행 ---------- */
  function compute(files, isSample) {
    const parsed = Parse.parseFiles(files);
    if (parsed.people.length < 2 || parsed.messages.length < 20) throw new Error("두 사람의 대화를 찾지 못했어요. 카카오톡 '대화 내보내기'로 만든 txt 파일인지 확인해 주세요.");
    const d = ANONYMIZE ? Anon.anonymize(parsed, { keepCouple: SHOW_NAMES }) : parsed;
    const r = Analyze.analyze(d.messages, d.people);
    const adv = Advice.advice(r);
    return { r, adv, sum: Summary.summary(r, adv), story: Story.story(r), isSample, others: parsed.others, savedAt: Date.now(), info: null, couple: null, rel: rel === "crush" || rel === "friend" ? rel : "love", crush: null, friend: rel === "friend" ? Friend.make(r, {}) : null };
  }
  // 사용자가 알려 준 정보(사귄 날·MBTI)를 반영해 다시 계산 (v10)
  // 두 사람 이름 바꾸기 (v16): 결과 객체 안의 이름 키·값을 통째로 바꾸고 조언·요약을 다시 만든다.
  // 대화 원문(메시지 글) 속 단어는 건드리지 않는다 — 값이 이름과 '정확히 같을' 때만 바꿈.
  function renameAll(map) {
    const walk = v => {
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === "object") { const o = {}; for (const k in v) o[k in map ? map[k] : k] = walk(v[k]); return o; }
      return typeof v === "string" && v in map ? map[v] : v;
    };
    if (!state.origNames) state.origNames = [state.r.A, state.r.B];
    state.r = walk(state.r);
    state.adv = Advice.advice(state.r);
    state.sum = Summary.summary(state.r, state.adv);
  }
  const cleanName = n => { const c = String(n).replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim(); return c && c !== n ? c : n; };
  function applyInfo(info) {
    state.info = info;
    if (CRUSH()) { state.crush = Crush.make(state.r, info.me, { likeSince: info.since }); save(); return; }
    if (FRIEND()) { state.friend = Friend.make(state.r, { since: info.since, me: info.me }); save(); return; }
    state.couple = Couple.make(state.r, info);
    state.story = Story.story(state.r, state.couple);
    save();
  }
  function save() {
    if (!state || state.isSample) return;
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) { /* 저장 못 해도 계속 */ }
  }
  function load() {
    try { localStorage.removeItem("lovestory.last.v1"); } catch (_) { /* 무시 */ }
    try {
      const s = localStorage.getItem(STORE), v = s ? JSON.parse(s) : null;
      if (v && v.r && SHOW_NAMES && v.r.A === "00") { localStorage.removeItem(STORE); return null; }
      return v;
    } catch (_) { return null; }
  }

  // 글 파일 읽기: 보통 UTF-8, 깨지면(엑셀로 저장한 CSV 등) EUC-KR로 다시 읽는다
  async function readText(f) {
    const buf = await f.arrayBuffer();
    const u = new TextDecoder("utf-8").decode(buf);
    const bad = (u.match(/\uFFFD/g) || []).length;
    if (bad > 20 && bad > u.length / 1000) { try { return new TextDecoder("euc-kr").decode(buf); } catch (_) { /* 그대로 */ } }
    return u;
  }
  async function readFiles(list) {
    const out = [];
    for (const f of list) {
      const isZip = /\.zip$/i.test(f.name) || /zip/.test(f.type);
      // 큰 zip(사진·동영상 포함)도 txt만 골라 읽는다 — 크기 제한 없음 (v14, bigzip.js)
      if (isZip && window.BigZip && BigZip.supported()) {
        try { out.push(...await BigZip.readTexts(f)); continue; }
        catch (err) { if (f.size > MAX) throw new Error(`${f.name}을 열지 못했어요. ${err.message || ""}`); /* 작으면 JSZip으로 다시 시도 */ }
      }
      if (f.size > MAX) throw new Error(isZip ? `${f.name} 파일이 너무 커서 이 기기에서 열 수 없어요. 카톡에서 '텍스트 메시지만 보내기'로 다시 내보내 주세요.` : `${f.name} 파일이 120MB가 넘어서 읽을 수 없어요.`);
      if (isZip) {
        if (!window.JSZip) throw new Error("zip을 여는 도구를 불러오지 못했어요. 압축을 풀어 txt 파일로 올려 주세요.");
        const z = await JSZip.loadAsync(f);
        const names = Object.keys(z.files).filter(n => /\.(txt|csv)$/i.test(n) && !z.files[n].dir);
        for (const n of names) out.push({ name: n, text: await z.files[n].async("string") });
        continue;
      } else out.push({ name: f.name, text: await readText(f) });
    }
    if (!out.length) throw new Error("대화 파일(txt 또는 csv)을 찾지 못했어요.");
    return out;
  }

  const loading = (on, text) => { $("#loading").hidden = !on; if (text) $("#loading-text").textContent = text; };
  function flash(msg, err) { const st = $("#status"); if (st) { st.className = "status" + (err ? " err" : ""); st.textContent = msg; } }

  async function handle(list) {
    loading(true, "대화를 읽고 있어요");
    try {
      const files = await readFiles([...list]);
      loading(true, "두 사람의 이야기를 정리하고 있어요");
      await new Promise(r => setTimeout(r, 60));
      state = compute(files, false);
      save();
      loading(false);
      go("info", true);
    } catch (err) {
      loading(false);
      if (!state) go("home", true);
      setTimeout(() => flash(err.message || String(err), true), 0);
    }
  }
  async function sample() {
    loading(true, "샘플 대화를 불러오고 있어요");
    await new Promise(r => setTimeout(r, 60));
    state = compute([{ name: "sample.txt", text: rel === "crush" ? Sample.makeCrush() : rel === "friend" ? Sample.makeFriend() : Sample.make() }], true);
    loading(false); go("info", true);
  }

  /* ---------- 화면 전환 ---------- */
  function go(to, replace) {
    const h = "#" + to;
    if (location.hash === h) { render(); return; }
    if (replace) { try { history.replaceState(null, "", h); } catch (_) { location.hash = h; return; } render(); }
    else { depth++; location.hash = h; }
  }
  window.addEventListener("hashchange", render);
  function back() { if (depth > 0) { depth--; history.back(); } else go(route in DETAIL ? "analysis" : "home", true); }
  const onScroll = () => document.body.classList.toggle("scrolled", window.scrollY > 38);
  window.addEventListener("scroll", onScroll, { passive: true });

  function render() {
    const h = location.hash.slice(1);
    route = (h in TOP || h in DETAIL) ? h : "home";
    if (!state && route !== "safe") route = "home";
    if (state && route in DETAIL) { const ids = modeIds(); if (ids ? !ids.includes(route) : (CR_IDS.includes(route) || FR_IDS.includes(route))) route = "analysis"; } // 관계별 화면 섞이지 않게
    if (state && CRUSH() && !state.crush && route !== "info" && route !== "safe") route = "info"; // 짝사랑은 '나'부터
    document.documentElement.dataset.mode = (state ? state.rel : rel) || ""; // 친구는 파란색(v18.1)
    const inDetail = route in DETAIL;
    const title = !state ? "" : inDetail ? DETAIL[route][0] : topTitle(route);
    $("#appbar").classList.toggle("solid", inDetail);
    $("#bar").innerHTML = route === "safe" ? `<button class="backbtn" type="button" data-act="back">${ico("back")}돌아가기</button><span class="mini">${e(title)}</span><span></span>` : route === "info" ? `<span></span><span class="mini">${e(title)}</span><span></span>` : (inDetail ? `<button class="backbtn" type="button" data-act="back">${ico("back")}분석</button>` : `<span></span>`)
      + `<span class="mini">${e(title)}</span><span></span>`;
    const nav = $("#nav"); nav.hidden = !state || route === "info" || route === "safe";
    const cur = inDetail ? "analysis" : route;
    nav.querySelectorAll("a").forEach((a, i) => {
      const [id, label, icon] = NAV[i];
      a.innerHTML = ico(icon) + `<span>${label}</span>`;
      if (id === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    let html;
    if (route === "safe") html = safePage();
    else if (!state) html = landing();
    else if (route === "info") html = infoForm();
    else if (route === "home" && FRIEND()) html = `<header><p class="hello-name">${state.info && state.info.since ? `${U.fmtDate(state.info.since)}부터 친구인` : `${U.fmtDate(state.r.overview.first)}부터 이어진`}</p><h1 class="large">${e(A())} <span style="color:var(--accent)">&amp;</span> ${e(B())}</h1></header>` + homeFriend();
    else if (route === "home" && CRUSH()) html = `<header><p class="hello-name">${U.fmtDate(state.r.overview.first)}부터 이어진</p><h1 class="large">${e(state.crush.me)}의 마음,<br><span style="color:var(--accent)">${e(state.crush.them)}</span>에게</h1></header>` + homeCrush();
    else if (route === "home") html = `<header><p class="hello-name">${state.couple && state.couple.since ? `${U.fmtDate(state.couple.since.month)}에 연인이 된` : `${U.fmtDate(state.r.overview.first)}부터 함께한`}</p><h1 class="large">${e(state.r.A)} <span style="color:var(--accent)">♥</span> ${e(state.r.B)}</h1></header>` + home();
    else if (route === "analysis") html = largeTitle("분석", "궁금한 질문을 눌러 자세히 볼 수 있어요") + (CRUSH() ? crushList() : FRIEND() ? friendList() : analysisList());
    else if (route === "story") html = `<div class="panel">${RENDER.story()}</div>`;
    else if (route === "advice") html = largeTitle(topTitle("advice")) + `<div class="panel">${CRUSH() ? RENDER.crushAdvice() : FRIEND() ? RENDER.friendAdvice() : RENDER.advice()}</div>`;
    else {
      const cd = (CRUSH() ? crushCards() : FRIEND() ? friendCards() : cards()).find(x => x[0] === route);
      CAP = {}; const body = RENDER[route](); const cap = CAP; CAP = null;
      const ins = (INSIGHTS[route] ? INSIGHTS[route]() : []).filter(Boolean);
      if (CRUSH()) ins.forEach(x => { if (x.versus && x.focus == null) x.focus = 1; }); // 짝사랑: 늘 '그 사람'(또는 '최근') 쪽을 진하게
      html = `<section class="answer" style="background:var(--p-${route})"><span class="q" style="color:var(--c-${route})">${DETAIL[route][2]}</span><b>${e(cd[1])}</b>${cd[2] ? `<span>${e(cd[2])}</span>` : ""}</section>
        <div class="panel">${cap.read || ""}
          ${ins.length ? `<section class="insights">${ins.map(x => insightCard(x, route)).join("")}</section>` : ""}
          ${cap.concl || ""}
          <details class="more"><summary>숫자와 그래프로 자세히 보기</summary><div class="panel" style="padding-top:16px">${body}</div></details>
        </div>`;
    }
    $("#main").innerHTML = `<div class="view">${html}</div>`;
    if (route !== lastRoute) window.scrollTo(0, 0); lastRoute = route; onScroll();
  }
  const largeTitle = (t, sub) => `<header><h1 class="large">${e(t)}</h1>${sub ? `<p class="large-sub">${e(sub)}</p>` : ""}</header>`;

  /* ---------- 시작 화면: 관계 고르기 → (연인) 불러오기 ---------- */
  const IN_APP = location.protocol === "file:";
  const PWA = !!window.__PWA; // 공개 웹앱판(GitHub Pages) — build-pwa.sh가 표시
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const STANDALONE = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  let hideInstall = false;
  function installHint() {
    if (!PWA || STANDALONE || hideInstall) return "";
    const share = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3.5M8 7.5l4-4 4 4M6 11H5v9.5h14V11h-1"/></svg>`;
    const steps = IOS
      ? `<li>아래(아이패드는 위) ${share}<b>공유</b> 버튼을 눌러요</li><li><b>홈 화면에 추가</b>를 눌러요</li><li>홈 화면의 TALK VIEW 아이콘으로 열어요</li>`
      : `<li>브라우저 메뉴(⋮)를 눌러요</li><li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 눌러요</li>`;
    return `<section class="group install"><div class="install-h"><b>앱처럼 쓰기</b><button type="button" class="x" data-act="hide-install" aria-label="닫기">닫기</button></div><ol>${steps}</ol><small>설치해도 대화는 이 기기 안에서만 분석돼요.</small></section>`;
  }
  const RELS = [
    ["love", "연인", "heart", "--c-love", "--p-love", "두 사람의 사랑 이야기"],
    ["crush", "짝사랑", "star", "--c-mbti", "--p-mbti", "마음이 얼마나 닿았는지"],
    ["friend", "친구", "people", "--c-freq", "--p-freq", "우리 우정의 기록"],
    ["family", "가족", "home", "--c-life", "--p-life", "가족과 나눈 하루하루"]
  ];
  let rel = null;
  const STEPS = {
    phone: IOS
      ? [["카카오톡에서 분석할 1:1 채팅방을 열어요.", ""], ["오른쪽 위 메뉴(≡) → 설정(톱니바퀴)을 눌러요.", ""], ["<b>대화 내용 내보내기</b> → <b>모든 메시지 도큐먼트로 저장</b>을 눌러요.", "아이폰에 파일로 바로 저장돼요. 사진이 많아 파일이 커도 괜찮아요(대화 글만 골라 읽어요). '텍스트 메시지만 보내기'는 메일 화면이 떠서 쓰지 않아요."], ["TALK VIEW로 돌아와 <b>카톡 대화 불러오기</b>를 눌러요.", "파일 창의 '최근 항목'에서 방금 저장된 파일을 누르면 바로 분석돼요."]]
      : [["카카오톡에서 분석할 1:1 채팅방을 열어요.", ""], ["오른쪽 위 메뉴(≡) → 설정(톱니바퀴)을 눌러요.", ""], ["대화 내용 내보내기 → 텍스트 메시지만 보내기", IN_APP ? "공유 목록에서 TALK VIEW를 누르면 끝이에요." : "파일로 저장한 뒤 위 버튼으로 골라요."]],
    pc: [["PC 카카오톡에서 채팅방을 열어요.", ""], ["메뉴(≡) → 대화 내용 → 대화 내보내기", "윈도우는 Ctrl+S로도 저장할 수 있어요."], ["저장된 파일을 위 버튼으로 고르거나 화면에 끌어다 놓아요.", "윈도우는 txt, 맥은 csv 파일로 저장돼요. 둘 다 돼요."]]
  };
  let guideTab = MOBILE ? "phone" : "pc";
  const stepsHtml = () => STEPS[guideTab].map(([t, n], i) => `<div class="row noicon"><span class="step-n">${i + 1}</span><div class="body step-t">${t}${n ? `<small>${n}</small>` : ""}</div></div>`).join("");
  const brand = () => `<div style="padding-top:12px"><h1 class="brand-name">TALK VIEW</h1><p class="brand-tag">우리의 모든 순간을 사랑으로 기억하다.</p></div>`;
  /* ---------- 안전 (v13): 말이 아니라 직접 확인할 수 있는 근거로 ---------- */
  const LOCKED = IN_APP || PWA; // 통신 차단이 실제로 걸린 판(앱: 인터넷 권한 없음 / 웹앱: CSP)
  const CODE_URL = "https://github.com/STOP-CASTLE/Talkview";
  function trustCard(compact) {
    return `<a class="trust${compact ? " compact" : ""}" href="#safe" data-go="safe">
      <span class="trust-ico">${ico("shield")}</span>
      <span class="trust-body"><b>개발자도, 누구도 볼 수 없어요</b><span>대화를 받을 서버가 없어요. 이 휴대폰 안에서만 읽어요.</span>${compact ? "" : `<span class="trust-chips"><i>서버 없음</i><i>업로드 없음</i><i>${LOCKED ? "통신 차단" : "기기 안에서만"}</i></span>`}<span class="trust-more">왜 안전한지 직접 확인하기 ›</span></span></a>`;
  }
  let netTest = null; // null: 안 함, "run", "blocked", "open"
  async function runNetTest() {
    netTest = "run"; render();
    try { await fetch("https://example.com/talkview-check", { mode: "no-cors", cache: "no-store" }); netTest = "open"; }
    catch (_) { netTest = "blocked"; }
    render();
  }
  function safePage() {
    const row = (icon, t, d) => `<div class="srow"><span class="sb">${ico(icon)}</span><div><b>${t}</b><p>${d}</p></div></div>`;
    const testRes = netTest === "blocked" ? `<p class="nt ok">${ico("check")}차단됐어요. 이 화면은 바깥 인터넷 어디에도 연결할 수 없어요.</p>`
      : netTest === "open" ? `<p class="nt warn">이 화면(미리보기)에서는 연결이 막혀 있지 않았어요. 앱이나 웹앱에서 다시 눌러 보세요.</p>`
        : netTest === "run" ? `<p class="nt">확인하는 중…</p>` : "";
    return `<header><h1 class="large" style="font-size:30px">대화는 이 휴대폰을<br>벗어나지 않아요</h1><p class="large-sub">말로만 하는 약속이 아니라, 직접 확인할 수 있게 적어 둘게요.</p></header>
      <div class="panel">
        <section class="flow" aria-label="대화가 지나가는 길">
          <div class="fbox">카톡 대화 파일</div><div class="farrow">↓</div>
          <div class="fbox on">${ico("lock")}이 휴대폰 안의 TALK VIEW<small>여기서 읽고, 세고, 이야기를 써요</small></div><div class="farrow">↓</div>
          <div class="fbox">결과 화면 (이 휴대폰에만 저장)</div>
          <div class="fno"><s>서버</s><s>개발자</s><s>AI 회사</s><span>어디에도 보내지 않아요</span></div>
        </section>
        <section class="sec"><p class="head">개발자도 볼 수 없는 이유</p><div class="group pad sl">
          ${row("lock", "대화를 받을 서버가 없어요", "TALK VIEW는 화면 파일만 있는 앱이에요. 대화를 보낼 곳이 처음부터 없어서, 개발자에게 도착할 수도 없어요.")}
          ${row("shield", "보내는 기능이 아예 없어요", IN_APP ? "이 안드로이드 앱은 인터넷 권한 자체가 없어요. 휴대폰 설정 → 애플리케이션 → TALK VIEW → 권한에서 직접 볼 수 있어요." : PWA ? "이 웹앱에는 바깥과 통신하지 못하게 막는 보안 설정(CSP)이 걸려 있어요. 아래 버튼으로 직접 확인할 수 있어요." : "대화를 어딘가로 보내는 코드가 없어요. 앱이나 웹앱에서는 통신 자체를 막는 설정도 걸려 있어요.")}
          ${row("people", "AI에게 보내지 않아요", "분석은 이 앱 안에 들어 있는 규칙(낱말 세기, 시간 계산)으로만 해요. ChatGPT나 Claude 같은 AI 서버에 대화를 보내지 않아요.")}
          ${row("trash", "결과는 이 휴대폰에만, 지우면 끝", "대화 원문은 저장하지 않아요. 분석 결과와 장면 몇 줄만 이 휴대폰에 남고, '이 기기 기록 지우기'를 누르면 바로 사라져요.")}
          ${row("eye", "다른 사람 이름은 가려요", "대화에 나온 다른 사람의 이름(○○씨)은 자동으로 바꿔서 보여 줘요.")}
        </div></section>
        <section class="sec"><p class="head">직접 확인해 보세요</p><div class="group pad sl">
          ${row("cloud", "1. 비행기 모드로 써 보기", `비행기 모드를 켜고 대화를 불러와 보세요. 인터넷이 없어도 분석이 끝까지 돼요. 인터넷이 필요 없다는 건, 어디로도 보내지 않는다는 뜻이에요.${PWA ? " (웹앱은 한 번 열어 둔 뒤에 해 보세요.)" : ""}`)}
          <div class="srow"><span class="sb">${ico("bolt")}</span><div><b>2. 통신 차단 확인하기</b><p>버튼을 누르면 이 화면이 바깥 인터넷에 연결을 시도해 보고, 막혔는지 보여 줘요. 아무 내용도 보내지 않아요.</p><button class="btn primary small" type="button" data-act="nettest" style="margin-top:8px;justify-self:start">지금 확인하기</button>${testRes}</div></div>
          ${row("book", "3. 코드는 공개돼 있어요", `TALK VIEW의 코드는 누구나 볼 수 있게 공개돼 있어요. 개발자를 아는 사람에게 확인을 부탁해도 좋아요.<br><a href="${CODE_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--tint);font-weight:600">github.com/STOP-CASTLE/Talkview</a>`)}
        </div></section>
        ${state && !state.isSample ? `<button class="btn danger block" type="button" data-act="forget" style="margin-top:4px">이 기기에 저장된 결과 지금 지우기</button>` : ""}
      </div>`;
  }
  function secureBox() {
    const it = (icon, t) => `<div class="sitem">${ico(icon)}<b>${t}</b></div>`;
    return `<section class="group secure"><h3>${ico("shield")}대화는 안전하게 지켜져요</h3>
      <div class="sgrid">
        ${it("lock", "서버 저장 없음")}
        ${it("upload", "업로드 없음")}
        ${it("eye", "개발자도 못 봄")}
        ${it("check", "기기 안에서만")}
        ${IN_APP ? it("shield", "인터넷 권한 없음") : ""}
        ${PWA ? it("shield", "통신 차단 설정") : ""}
        ${it("people", "다른 사람 이름 가림")}
        ${it("trash", "지우면 즉시 삭제")}
      </div></section>`;
  }
  function landing() {
    if (!rel) {
      return `<section class="welcome" style="gap:24px">${brand()}
        <p class="pick-q">누구와 나눈 대화인가요?</p>
        <div class="picks">${RELS.map(([id, label, icon, c, pc, d]) => `<button class="pick" type="button" data-rel="${id}"><span class="badge" style="background:var(${pc});color:var(${c})">${ico(icon)}</span><b>${label}${id === "family" ? ` <span class="soon">준비 중</span>` : ""}</b><span>${d}</span></button>`).join("")}</div>
        ${trustCard()}
      </section>${installHint()}`;
    }
    if (rel === "family") {
      const r = RELS.find(x => x[0] === rel);
      return `<section class="welcome">${brand()}
        <div class="group soon-box"><span class="badge" style="width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:var(${r[4]});color:var(${r[3]})">${ico(r[2])}</span>
          <h2 style="font-size:22px">${r[1]} 분석은 준비 중이에요</h2>
          <p class="cap" style="font-size:15px">${r[1]} 관계에 맞는 분석을 새로 만들고 있어요.<br>지금은 연인 분석을 쓸 수 있어요.</p>
          <button class="btn primary" type="button" data-rel="love">연인으로 분석하기</button>
          <button class="chip-back" type="button" data-rel="">관계 다시 고르기</button></div></section>`;
    }
    return `<section class="welcome" style="gap:22px">${brand()}
      ${rel === "crush" ? `<p class="pick-q" style="font-size:19px;line-height:1.5">그 사람과 나눈 카톡으로<br>마음이 얼마나 닿았는지 볼게요</p>` : rel === "friend" ? `<p class="pick-q" style="font-size:19px;line-height:1.5">친구와 나눈 카톡으로<br>우리 우정을 돌아볼게요</p>` : ""}
      <div class="cta"><label class="btn primary block" for="file">카톡 대화 불러오기</label>
        <button class="btn plain" type="button" data-act="sample">샘플로 먼저 둘러보기</button>
        <button class="chip-back" type="button" data-rel="" style="margin-top:4px">${({ crush: "짝사랑", friend: "친구" })[rel] || "연인"} · 관계 다시 고르기</button></div>
      ${trustCard(true)}
      <p class="status" id="status" role="status" aria-live="polite">${MOBILE ? "" : "파일을 이 화면에 끌어다 놓아도 돼요."}</p>
    </section>
    <section class="sec">
      <div class="seg" role="tablist"><button type="button" role="tab" data-guide="phone" aria-selected="${guideTab === "phone"}">휴대폰에서</button><button type="button" role="tab" data-guide="pc" aria-selected="${guideTab === "pc"}">PC에서</button></div>
      <p class="head" style="padding-top:6px">대화 파일 꺼내는 법</p>
      <div class="group" id="steps">${stepsHtml()}</div>
      ${MOBILE ? `<a class="btn kakao block" href="kakaotalk://launch" data-act="kakao">카카오톡 열어서 대화 내보내기</a>
      <p class="foot" style="text-align:center">${IN_APP ? "내보내기 화면의 공유 목록에서 TALK VIEW를 누르면 바로 분석돼요." : "내보낸 파일을 저장한 뒤, 여기로 돌아와 불러오면 돼요."}</p>` : ""}
    </section>`;
  }

  /* ---------- 우리 정보 (사귄 날·MBTI) v10 ---------- */
  let infoDraft = null, infoErr = "";
  function infoForm() {
    const r = state.r, ov = r.overview;
    if (!infoDraft) {
      infoDraft = state.info ? JSON.parse(JSON.stringify(state.info)) : { since: "", me: null, mbti: {} };
      infoDraft.names = [A(), B()].map(n => state.info ? n : cleanName(n));
      if (!state.info && state.isSample) infoDraft = FRIEND() ? { since: "", me: null, mbti: {}, names: [A(), B()] } : CRUSH() ? { since: "", me: A(), mbti: {}, names: [A(), B()] } : { since: U.addDays(ov.first, 30).slice(0, 7), me: A(), mbti: { [A()]: "ENFP", [B()]: "ISTJ" }, names: [A(), B()] };
    }
    const d = infoDraft;
    const opt = p => `<select data-mbti="${e(p)}" aria-label="${e(p)}의 MBTI"><option value="">모르겠어요</option>${Couple.TYPES.map(t => `<option${d.mbti[p] === t ? " selected" : ""}>${t}</option>`).join("")}</select>`;
    const tag = p => d.me ? (d.me === p ? "나" : "상대") : "";
    const thisY = new Date().getFullYear(), yrs = []; for (let y = thisY; y >= +ov.first.slice(0, 4) - 10; y--) yrs.push(y);
    const sy = d.since ? +d.since.slice(0, 4) : null, sm = d.since ? +d.since.slice(5, 7) : null;
    const ymSel = `<div class="ym"><select id="since-y" aria-label="해"><option value="">연도</option>${yrs.map(y => `<option${sy === y ? " selected" : ""}>${y}</option>`).join("")}</select><select id="since-m" aria-label="달"><option value="">월</option>${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<option value="${String(m).padStart(2, "0")}"${sm === m ? " selected" : ""}>${m}월</option>`).join("")}</select></div>`;
    const nameField = `<div class="field"><b>이렇게 불러도 될까요?</b>${[0, 1].map(i => { const cur = [A(), B()][i], orig = (state.origNames || [A(), B()])[i]; return `<div class="mrow"><span class="nm" style="font-size:14px;font-weight:600;color:var(--muted)">카톡 이름<small style="font-size:13px;color:var(--fg);word-break:break-all">${e(orig)}</small></span><input type="text" data-rename="${i}" value="${e(d.names[i])}" maxlength="12" placeholder="${e(cur)}" aria-label="${e(orig)}을 부를 이름" autocomplete="off"></div>`; }).join("")}<small>카톡에 애칭이나 이모티콘으로 저장돼 있으면 글이 어색할 수 있어요. 이야기에 쓸 이름으로 바꿔 주세요.${[A(), B()].some(n => cleanName(n) !== n) ? " 기호는 미리 빼 두었어요." : ""}</small></div>`;
    if (FRIEND()) {
      return `<header><h1 class="large" style="font-size:28px">두 사람에 대해<br>조금만 알려 주세요</h1><p class="large-sub">몰라도 괜찮아요. 알려 주면 우정 이야기가 더 정확해져요.</p></header>
      <div class="panel info">
        ${state.isSample ? `<p class="note" style="text-align:left;background:var(--p-us);color:var(--tint);padding:10px 12px;border-radius:12px">샘플 대화예요. 그대로 넘어가도 돼요.</p>` : ""}
        ${nameField}${infoErr ? `<p class="nt warn" style="margin:0">${e(infoErr)}</p>` : ""}
        <div class="field"><b>나는 누구인가요?</b><div class="me">${[A(), B()].map((p, i) => `<button type="button" data-me="${e(p)}" aria-pressed="${d.me === p}">${e(d.names[i] || p)}</button>`).join("")}</div><small>고르지 않아도 돼요.</small></div>
        <div class="field"><b>언제부터 친구였나요?</b>${ymSel}<small>몰라도 괜찮아요. 알려 주면 우정 이야기에 나와요.</small></div>
        <button class="btn primary block" type="button" data-act="info-save">우정 보러 가기</button>
        <button class="btn plain" type="button" data-act="info-skip">${state.info ? "바꾸지 않고 돌아가기" : "건너뛰기"}</button>
        <p class="lockline">${ico("lock")}이 정보도 서버로 보내지 않고, 이 기기에만 저장돼요</p>
      </div>`;
    }
    if (CRUSH()) {
      return `<header><h1 class="large" style="font-size:28px">두 사람에 대해<br>조금만 알려 주세요</h1><p class="large-sub">'나'를 골라 주면, 그 사람의 카톡에서 호감 신호를 찾아볼게요.</p></header>
      <div class="panel info">
        ${state.isSample ? `<p class="note" style="text-align:left;background:var(--p-us);color:var(--tint);padding:10px 12px;border-radius:12px">샘플이라 예시 값을 넣어 두었어요.</p>` : ""}
        ${nameField}
        <div class="field"><b>나는 누구인가요? <span style="color:var(--tint);font-size:14px">꼭 골라 주세요</span></b><div class="me">${[A(), B()].map((p, i) => `<button type="button" data-me="${e(p)}" aria-pressed="${d.me === p}">${e(d.names[i] || p)}</button>`).join("")}</div><small>내가 아닌 쪽이 '그 사람'이 돼요.</small>${infoErr ? `<p class="nt warn" style="margin:0">${e(infoErr)}</p>` : ""}</div>
        <div class="field"><b>언제부터 좋아했나요?</b>${ymSel}<small>몰라도 괜찮아요. 알려 주면 마음 이야기에 그 달이 나와요.</small></div>
        <button class="btn primary block" type="button" data-act="info-save">그 사람의 신호 보기</button>
        ${state.info ? `<button class="btn plain" type="button" data-act="info-skip">바꾸지 않고 돌아가기</button>` : ""}
        <p class="lockline">${ico("lock")}이 정보도 서버로 보내지 않고, 이 기기에만 저장돼요</p>
      </div>`;
    }
    return `<header><h1 class="large" style="font-size:28px">두 분에 대해<br>조금만 알려 주세요</h1><p class="large-sub">알려 주면 사귀기 전과 후, 해마다의 그 달, 실제 MBTI까지 더 자세히 분석해요. 몰라도 괜찮아요.</p></header>
      <div class="panel info">
        ${state.isSample ? `<p class="note" style="text-align:left;background:var(--p-us);color:var(--tint);padding:10px 12px;border-radius:12px">샘플이라 예시 값을 넣어 두었어요.</p>` : ""}
        <div class="field"><b>이렇게 불러도 될까요?</b>${[0, 1].map(i => { const cur = [A(), B()][i], orig = (state.origNames || [A(), B()])[i]; return `<div class="mrow"><span class="nm" style="font-size:14px;font-weight:600;color:var(--muted)">카톡 이름<small style="font-size:13px;color:var(--fg);word-break:break-all">${e(orig)}</small></span><input type="text" data-rename="${i}" value="${e(d.names[i])}" maxlength="12" placeholder="${e(cur)}" aria-label="${e(orig)}을 부를 이름" autocomplete="off"></div>`; }).join("")}<small>카톡에 애칭이나 이모티콘으로 저장돼 있으면 글이 어색할 수 있어요. 이야기에 쓸 이름으로 바꿔 주세요.${[A(), B()].some(n => cleanName(n) !== n) ? " 기호는 미리 빼 두었어요." : ""}</small>${infoErr ? `<p class="nt warn" style="margin:0">${e(infoErr)}</p>` : ""}</div>
        <div class="field"><b>나는 누구인가요?</b><div class="me">${[A(), B()].map((p, i) => `<button type="button" data-me="${e(p)}" aria-pressed="${d.me === p}">${e(d.names[i] || p)}</button>`).join("")}</div><small>대화에서 찾은 두 사람이에요. 고르지 않아도 돼요.</small></div>
        <div class="field"><b>언제부터 사귀었나요?</b><div class="ym"><select id="since-y" aria-label="사귄 해"><option value="">연도</option>${yrs.map(y => `<option${sy === y ? " selected" : ""}>${y}</option>`).join("")}</select><select id="since-m" aria-label="사귄 달"><option value="">월</option>${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<option value="${String(m).padStart(2, "0")}"${sm === m ? " selected" : ""}>${m}월</option>`).join("")}</select></div><small>몇 월인지만 알려 주면 돼요. 첫 대화(${U.fmtDate(ov.first.slice(0, 7))})보다 앞이어도 괜찮아요.</small></div>
        <div class="field"><b>MBTI를 알려 주세요</b>${[A(), B()].map((p, i) => `<div class="mrow"><span class="nm" style="word-break:break-all">${e(d.names[i] || p)}${tag(p) ? `<small>${tag(p)}</small>` : ""}</span>${opt(p)}</div>`).join("")}<small>카톡 말투로 추정한 성향과 비교해 볼게요.</small></div>
        <button class="btn primary block" type="button" data-act="info-save">이대로 분석 보기</button>
        <button class="btn plain" type="button" data-act="info-skip">${state.info ? "바꾸지 않고 돌아가기" : "건너뛰기"}</button>
        <p class="lockline">${ico("lock")}이 정보도 서버로 보내지 않고, 이 기기에만 저장돼요</p>
      </div>`;
  }
  function readInfoForm() {
    const d = infoDraft || { mbti: {} };
    document.querySelectorAll("[data-rename]").forEach(x => { d.names[+x.dataset.rename] = x.value.trim(); });
    const y = $("#since-y"), m = $("#since-m"); d.since = y && m && y.value && m.value ? `${y.value}-${m.value}` : "";
    document.querySelectorAll("[data-mbti]").forEach(x => { if (x.value) d.mbti[x.dataset.mbti] = x.value; else delete d.mbti[x.dataset.mbti]; });
    return d;
  }

  /* ---------- 홈 ---------- */
  const A = () => state.r.A, B = () => state.r.B;
  function verdict(s) { return s >= 85 ? "서로에게 푹 빠졌어요" : s >= 70 ? "다정한 사이예요" : s >= 50 ? "따뜻하게 이어지고 있어요" : "천천히 가까워지는 중이에요"; }
  const sq = (id, lg) => `<span class="sq${lg ? " lg" : ""}" style="background:var(--c-${id})">${ico(DETAIL[id][1])}</span>`;
  function cards() {
    const r = state.r, ov = r.overview, rs = r.speed.reply;
    const fast = (rs[A()].median ?? 99) <= (rs[B()].median ?? 99) ? A() : B();
    const fm = rs[fast].median;
    const L = r.love.love, more = L[A()] >= L[B()] ? A() : B();
    const ra = r.routine.by[A()], rb = r.routine.by[B()];
    const wake = ra && ra.ok ? ra.wake.med : rb && rb.ok ? rb.wake.med : null;
    const sleep = ra && ra.ok ? ra.sleep.med : rb && rb.ok ? rb.sleep.med : null;
    const careN = p => r.balance.per[p].care.reduce((x, c) => x + c.n, 0) + r.balance.per[p].askCare;
    const carer = careN(A()) >= careN(B()) ? A() : B();
    const food = r.life.foods[0];
    const c = r.conflict;
    const same = (x, y) => Math.abs(x - y) / Math.max(1, x + y) < 0.06;
    const cp = state.couple || {}, si = cp.since, mb = cp.mbti && cp.mbti.by || {};
    const usCard = si ? ["us", si.ago, si.before && si.after ? `사귀기 전 하루 ${num(si.before.perDay)}번 → 지금 ${num(si.after.perDay)}번` : `${si.next.label}까지 ${num(si.next.left)}개월`]
      : cp.mbti && cp.mbti.pair ? ["us", cp.mbti.pair.title, "알려 준 MBTI로 본 궁합"]
        : ["us", "알려 주면 더 자세히", "사귄 날 · MBTI 입력하기"];
    const mt = p => mb[p] ? mb[p].real : r.mbti[p].type;
    return [
      usCard,
      ["freq", `하루 ${num(ov.avgPerDay)}번`, `${num(ov.chatDays)}일 동안 이야기했어요`],
      ["speed", same(rs[A()].median || 0, rs[B()].median || 0) ? "둘이 비슷해요" : `${U.iga(fast)} 더 빨라요`, fm == null ? "" : `보통 ${num1(fm)}분 안에 답해요`],
      ["love", same(L[A()], L[B()]) ? "둘이 똑같이 말해요" : `${U.iga(more)} 더 많이 말해요`, `사랑해 ${num(L.total)}번 중 ${num(L[more])}번`],
      langCard(),
      ["routine", wake == null ? "기록이 부족해요" : `${U.hm(wake)} 기상`, sleep == null ? "" : `${U.hm(sleep)}쯤 잠들어요`],
      ["balance", same(careN(A()), careN(B())) ? "서로 비슷하게 챙겨요" : `${U.iga(carer)} 더 챙겨요`, "안부·걱정·응원을 건넨 횟수로 봤어요"],
      ["life", food ? food.label : "일상 이야기", food ? `가장 자주 나온 음식 · ${num(food.total)}번` : `먹는 이야기 ${Math.round(r.life.mealRatio * 100)}%`],
      ["mbti", `${mt(A())} · ${mt(B())}`, mb[A()] || mb[B()] ? "알려 준 MBTI와 카톡 속 모습 비교" : "카톡 말투로 본 재미용 성향"],
      ["conflict", c.resolvedNextDayPct == null ? "크게 싸운 적 없어요" : `${c.resolvedNextDayPct}% 다음 날 화해`, c.makeup[0] ? `주로 '${c.makeup[0].label}'로 풀어요` : "작은 서운함은 그날 풀어요"]
    ];
  }
  const LL = k => R_LANG().find(x => x.key === k);
  const R_LANG = () => ((window.Rules && window.Rules.LOVE_LANGS) || []);
  function langCard() {
    const ll = state.r.loveLang;
    if (!ll) return ["lang", "대화를 다시 불러와 주세요", "새로 생긴 분석이에요"];
    const a = ll[A()], b = ll[B()], la = LL(a.top).label, lb = LL(b.top).label;
    return ["lang", a.top === b.top ? `둘 다 ${la}` : `${la} · ${lb}`, a.top === b.top ? "같은 언어로 사랑하는 두 사람" : `${A()} · ${B()} 순서예요`];
  }
  const tile = ([id, v, sub]) => { const to = id === "us" && !state.info ? "info" : id; return `<a class="qtile" href="#${to}" data-go="${to}" style="background:var(--p-${id})"><span class="badge" style="color:var(--c-${id})">${ico(DETAIL[id][1])}</span><span class="q" style="color:var(--c-${id})">${DETAIL[id][2]}</span><span class="ans"><b>${e(v)}</b>${sub ? `<span>${e(sub)}</span>` : ""}</span></a>`; };
  function home() {
    const r = state.r, ov = r.overview, adv = state.adv;
    const dday = Math.max(1, U.diffDays(ov.first, U.dayKey(Date.now())) + 1);
    let h = "";
    if (state.isSample) h += `<div class="group sample-note"><span>가상의 두 사람 대화로 보는 중이에요</span><label class="btn primary small" for="file">내 대화 불러오기</label></div>`;
    h += `<section class="group score-card">
      <div class="score-line">${C.gauge(r.score.total, "ring")}<div><p class="score-big"><b>${r.score.total}</b>점 / 100점</p><p class="score-verdict">${verdict(r.score.total)}</p><p class="cap" style="font-size:13px">사랑 지수 · ${state.couple && state.couple.since ? e(state.couple.since.ago) : `첫 대화부터 D+${num(dday)}`}</p></div></div>
      <div class="stats couple" style="padding:0;gap:0"><div class="stats" style="margin:0 -18px -18px"><div><span>주고받은 말풍선</span><b>${num(ov.total)}</b></div><div><span>사랑해</span><b>${num(r.love.love.total)}</b></div><div><span>매일 연속</span><b>${num(ov.longestStreak)}<small>일</small></b></div></div></div>
    </section>`;
    h += `<a class="banner" href="#story" data-go="story">${ico("book")}<div><b>우리의 사랑 이야기 읽기</b><span>첫 대화부터 오늘까지, 일곱 장으로</span></div>${ico("next", "chev")}</a>`;
    h += `<section class="sec"><div class="sec-h"><h3>궁금한 걸 눌러 보세요</h3></div><div class="qgrid">${cards().map(tile).join("")}</div></section>`;
    const top = adv.top[0];
    h += `<section class="sec"><div class="sec-h"><h3>더 사랑하려면</h3><a href="#advice" data-go="advice">전체 보기</a></div>
      <a class="group pad" href="#advice" data-go="advice" style="display:grid;gap:10px;text-decoration:none">${adv.lights.length ? `<div class="dots">${adv.lights.map(l => `<span class="${l.color}">${e(l.label)}</span>`).join("")}</div>` : ""}
      ${top ? `<div style="display:grid;gap:3px"><span style="font-weight:600">${e(top.title)}</span><span class="cap" style="font-size:15px">${e(top.how)}</span></div>` : `<p class="cap" style="font-size:15px">${e(adv.comparable ? "지금 흐름을 그대로 이어 가면 될 만큼 안정적이에요." : adv.note)}</p>`}</a></section>`;
    h += `<section class="sec"><div class="group">
      <a class="row noicon" href="#info" data-go="info" style="color:var(--tint);font-weight:600;text-decoration:none">우리 정보 ${state.info ? "고치기" : "알려 주기"} <span class="cap" style="font-weight:400;margin-left:6px">사귄 날 · MBTI</span></a>
      <label class="row noicon" for="file" style="color:var(--tint);cursor:pointer;font-weight:600">새 대화 불러오기</label>
      ${state.isSample ? "" : `<button class="row noicon btn danger" type="button" data-act="forget" style="width:100%;background:none;border-radius:0;justify-content:flex-start;font-weight:400">이 기기에 저장된 결과 지우기</button>`}
    </div>${trustCard(true)}<p class="status" id="status" role="status" aria-live="polite"></p></section>`;
    return h;
  }

  /* ---------- 짝사랑 홈·타일 (v17) ---------- */
  const pc0 = v => Math.round((v || 0) * 100);
  function crushCards() {
    const c = state.crush, sp = state.r.speed, rt = sp.reply[c.them];
    const g = c.signals.filter(x => x.level === "good").length, l = c.signals.filter(x => x.level === "low").length;
    const t = c.trend;
    return [
      ["sig", `${c.score}점`, `좋은 신호 ${g}개 · 아쉬운 신호 ${l}개`],
      ["first", `${c.them} 먼저 ${pc0(c.initThem)}%`, `조용하다가 먼저 연 대화 ${num(sp.init[c.them])}번`],
      ["reply", rt.median == null ? "기록이 부족해요" : `보통 ${num1(rt.median)}분`, `${c.them}의 답장 · 5분 안 ${pc0(rt.in5)}%`],
      ["curious", `질문 ${pc0(c.qThem)}%`, `${c.them}의 말 중 질문 비율`],
      ["heart", c.heartThem ? `${num(c.heartThem)}번` : "아직 조용해요", "보고 싶어·고마워·귀여워 같은 말"],
      ["trend", t ? (t.score >= 0.6 ? "가까워지는 중" : t.score > 0.4 ? "비슷하게 이어져요" : "조금 뜸해졌어요") : "조금 더 지켜봐요", t ? `${c.them} 먼저 연락 ${pc0(t.oldInit)}% → ${pc0(t.recInit)}%` : "대화 기간이 아직 짧아요"]
    ];
  }
  function homeCrush() {
    const r = state.r, ov = r.overview, c = state.crush;
    let h = "";
    if (state.isSample) h += `<div class="group sample-note"><span>가상의 두 사람 대화로 보는 중이에요</span><label class="btn primary small" for="file">내 대화 불러오기</label></div>`;
    h += `<section class="group score-card">
      <div class="score-line">${C.gauge(c.score, "ring")}<div><p class="score-big"><b>${c.score}</b>점 / 100점</p><p class="score-verdict">${e(c.verdict)}</p><p class="cap" style="font-size:13px">호감 신호 · ${e(c.them)}의 카톡으로 본 재미용 점수</p></div></div>
      <div class="stats couple" style="padding:0;gap:0"><div class="stats" style="margin:0 -18px -18px"><div><span>주고받은 말풍선</span><b>${num(ov.total)}</b></div><div><span>${e(c.them)}의 먼저 연락</span><b>${num(r.speed.init[c.them])}<small>번</small></b></div><div><span>이야기한 날</span><b>${num(ov.chatDays)}<small>일</small></b></div></div></div>
    </section>`;
    h += `<a class="banner" href="#story" data-go="story">${ico("book")}<div><b>${e(c.me)}의 마음 이야기 읽기</b><span>첫 대화부터 오늘까지, 일곱 장으로</span></div>${ico("next", "chev")}</a>`;
    h += `<section class="sec"><div class="sec-h"><h3>궁금한 걸 눌러 보세요</h3></div><div class="qgrid">${crushCards().map(tile).join("")}</div></section>`;
    const top = c.advice.items[0];
    h += `<section class="sec"><div class="sec-h"><h3>다가가려면</h3><a href="#advice" data-go="advice">전체 보기</a></div>
      <a class="group pad" href="#advice" data-go="advice" style="display:grid;gap:3px;text-decoration:none">${top ? `<span style="font-weight:600">${e(top.title)}</span><span class="cap" style="font-size:15px">${e(top.how)}</span>` : `<span style="font-weight:600">지금처럼 하면 돼요</span><span class="cap" style="font-size:15px">아쉬운 신호가 거의 없어요. 이제 구체적인 약속 하나만 더해 보세요.</span>`}</a></section>`;
    h += `<section class="sec"><div class="group">
      <a class="row noicon" href="#info" data-go="info" style="color:var(--tint);font-weight:600;text-decoration:none">정보 고치기 <span class="cap" style="font-weight:400;margin-left:6px">나 · 이름 · 좋아하게 된 달</span></a>
      <label class="row noicon" for="file" style="color:var(--tint);cursor:pointer;font-weight:600">새 대화 불러오기</label>
      ${state.isSample ? "" : `<button class="row noicon btn danger" type="button" data-act="forget" style="width:100%;background:none;border-radius:0;justify-content:flex-start;font-weight:400">이 기기에 저장된 결과 지우기</button>`}
    </div>${trustCard(true)}<p class="status" id="status" role="status" aria-live="polite"></p></section>`;
    return h;
  }
  /* ---------- 친구 홈·타일 (v18) ---------- */
  function friendCards() {
    const f = state.friend, r = state.r, ov = r.overview, rs = r.speed.reply;
    const fast = (rs[A()].median ?? 99) <= (rs[B()].median ?? 99) ? A() : B();
    const food = r.life.foods[0];
    return [
      ["fbond", `${f.score}점`, f.verdict],
      ["flaugh", `${U.iga(f.funnier)} 더 웃겨요`, `${f.funnier}의 말 뒤에 ㅋㅋ ${num(f.react[f.funnier])}번`],
      ["ftalk", `하루 ${num(ov.avgPerDay)}번`, `${num(ov.chatDays)}일 이야기했어요`],
      ["freply", Math.abs((rs[A()].median || 0) - (rs[B()].median || 0)) < 1 ? "둘이 비슷해요" : `${U.iga(fast)} 더 빨라요`, rs[fast].median == null ? "" : `보통 ${num1(rs[fast].median)}분 안에 답해요`],
      ["fcare", Math.abs(f.careOf[A()] - f.careOf[B()]) / Math.max(1, f.careOf[A()] + f.careOf[B()]) < 0.06 ? "서로 비슷하게 챙겨요" : `${U.iga(f.carer)} 더 챙겨요`, `안부·응원·위로 ${num(f.careOf[A()] + f.careOf[B()])}번`],
      ["ftopic", food ? food.label : "일상 이야기", food ? `가장 자주 나온 음식 · ${num(food.total)}번` : "가장 자주 나온 이야기"]
    ];
  }
  function homeFriend() {
    const r = state.r, ov = r.overview, f = state.friend;
    let h = "";
    if (state.isSample) h += `<div class="group sample-note"><span>가상의 두 사람 대화로 보는 중이에요</span><label class="btn primary small" for="file">내 대화 불러오기</label></div>`;
    h += `<section class="group score-card">
      <div class="score-line">${C.gauge(f.score, "ring")}<div><p class="score-big"><b>${f.score}</b>점 / 100점</p><p class="score-verdict">${e(f.verdict)}</p><p class="cap" style="font-size:13px">우정 지수 · 카톡으로 본 재미용 점수</p></div></div>
      <div class="stats couple" style="padding:0;gap:0"><div class="stats" style="margin:0 -18px -18px"><div><span>주고받은 말풍선</span><b>${num(ov.total)}</b></div><div><span>같이 웃은 말풍선</span><b>${num(f.laughBy[A()] + f.laughBy[B()])}</b></div><div><span>이야기한 날</span><b>${num(ov.chatDays)}<small>일</small></b></div></div></div>
    </section>`;
    h += `<a class="banner" href="#story" data-go="story">${ico("book")}<div><b>우리의 우정 이야기 읽기</b><span>첫 대화부터 오늘까지, 일곱 장으로</span></div>${ico("next", "chev")}</a>`;
    h += `<section class="sec"><div class="sec-h"><h3>궁금한 걸 눌러 보세요</h3></div><div class="qgrid">${friendCards().map(tile).join("")}</div></section>`;
    const top = f.advice.items[0];
    h += `<section class="sec"><div class="sec-h"><h3>더 친해지려면</h3><a href="#advice" data-go="advice">전체 보기</a></div>
      <a class="group pad" href="#advice" data-go="advice" style="display:grid;gap:3px;text-decoration:none">${top ? `<span style="font-weight:600">${e(top.title)}</span><span class="cap" style="font-size:15px">${e(top.how)}</span>` : `<span style="font-weight:600">지금처럼만 하면 돼요</span><span class="cap" style="font-size:15px">아쉬운 점이 거의 없어요. 오랜만에 얼굴 보는 약속 하나 잡아 보세요.</span>`}</a></section>`;
    h += `<section class="sec"><div class="group">
      <a class="row noicon" href="#info" data-go="info" style="color:var(--tint);font-weight:600;text-decoration:none">정보 ${state.info ? "고치기" : "알려 주기"} <span class="cap" style="font-weight:400;margin-left:6px">이름 · 나 · 친구가 된 때</span></a>
      <label class="row noicon" for="file" style="color:var(--tint);cursor:pointer;font-weight:600">새 대화 불러오기</label>
      ${state.isSample ? "" : `<button class="row noicon btn danger" type="button" data-act="forget" style="width:100%;background:none;border-radius:0;justify-content:flex-start;font-weight:400">이 기기에 저장된 결과 지우기</button>`}
    </div>${trustCard(true)}<p class="status" id="status" role="status" aria-live="polite"></p></section>`;
    return h;
  }
  function friendList() {
    return `<div class="qgrid">${friendCards().map(tile).join("")}</div>
      <p class="foot">우정 지수는 카톡 속 말과 시간으로 본 재미용 점수예요. 만나서 함께한 시간은 카톡에 남지 않아요.</p>`;
  }
  function crushList() {
    return `<div class="qgrid">${crushCards().map(tile).join("")}</div>
      <p class="foot">호감 신호는 카톡 속 말과 시간으로 본 재미용 점수예요. 만나서 나눈 마음은 카톡에 남지 않아요.</p>`;
  }

  function analysisList() {
    return `<div class="qgrid">${cards().map(tile).join("")}</div>
      <p class="foot">MBTI, 하루 루틴, 싸움 주제는 재미로 보는 추정이에요. 다른 커플과 비교한 결과는 없어요.</p>`;
  }

  /* ---------- 공통 조각 (상세 화면) ---------- */
  const who = p => `<span class="${p === A() ? "who-a" : "who-b"}">${e(p)}</span>`;
  const legend = () => `<div class="legend"><span><i style="background:var(--a)"></i>${e(A())}</span><span><i style="background:var(--b)"></i>${e(B())}</span></div>`;
  let CAP = null; // 상세 화면에서 읽기·결론을 따로 받아 두는 곳
  const read = (eyebrow, title, s) => { const h = `<section class="read"><h2>${title}</h2>${s.intro.map(p => `<p>${e(p)}</p>`).join("")}</section>`; if (CAP) { CAP.read = h; return ""; } return h; };
  const concl = s => { const h = `<section class="conclusion"><div class="eyebrow">이 코너의 결론</div><p>${e(s.conclusion)}</p></section>`; if (CAP) { CAP.concl = h; return ""; } return h; };
  const block = (title, inner, cap) => `<section class="block"><h3>${title}</h3>${cap ? `<p class="cap">${cap}</p>` : ""}${inner}</section>`;
  const card = inner => `<div class="card">${inner}</div>`;
  const tiles = items => `<div class="tiles">${items.map(([l, v, s]) => `<div class="tile"><span class="l">${e(l)}</span><span class="v">${v}</span>${s ? `<span class="s">${e(s)}</span>` : ""}</div>`).join("")}</div>`;
  const legendNames = (a, b) => `<div class="legend"><span><i style="background:var(--a)"></i>${e(a)}</span><span><i style="background:var(--b)"></i>${e(b)}</span></div>`;
  function tallyNames(rows) {
    return `<div class="tally">${rows.map(([label, a, b]) => {
      const t = (a || 0) + (b || 0), pa = t ? a / t * 100 : 50;
      return `<div class="trow"><div class="lab"><span>${e(label)}</span><span>${num(a || 0)} · ${num(b || 0)}</span></div><div class="split">${t ? `<i class="pa" style="width:${pa}%"></i><i class="pb" style="flex:1"></i>` : ""}</div></div>`;
    }).join("")}</div>`;
  }
  function tally(rows) {
    return `<div class="tally">${rows.map(([label, a, b]) => {
      const t = (a || 0) + (b || 0), pa = t ? a / t * 100 : 50;
      return `<div class="trow" data-tip="${e(`${label} · ${A()} ${num(a)} · ${B()} ${num(b)}`)}"><div class="lab"><span>${e(label)}</span><span>${num(a)} · ${num(b)}</span></div><div class="split">${t ? `<i class="pa" style="width:${pa}%"></i><i class="pb" style="flex:1"></i>` : ""}</div></div>`;
    }).join("")}</div>`;
  }
  function table(head, rows, numCols = []) {
    return `<div class="tbl"><table><thead><tr>${head.map((h, i) => `<th class="${numCols.includes(i) ? "n" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${numCols.includes(i) ? "n" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function scene(sc, title) {
    if (!sc || !sc.lines || !sc.lines.length) return "";
    return `<div class="scene"><header><b>${e(title)}</b><span>${U.fmtDate(sc.date)}</span></header>${sc.lines.map((l, i) => `<div class="bub ${l.who === A() ? "a" : "b"}" style="animation-delay:${i * 0.08}s"><small>${e(l.who)} · ${e(U.hm(new Date(l.t).getHours() * 60 + new Date(l.t).getMinutes()))}</small>${e(l.text)}</div>`).join("")}</div>`;
  }
  const monthLabels = keys => keys.map(k => { const [y, m] = k.split("-"); return m === "01" || k === keys[0] ? `${y.slice(2)}.${+m}` : `${+m}월`; });

  /* ---------- 발견 카드 (v9) ---------- */
  function insightCard(x, route) {
    let viz = "";
    if (x.versus) {
      const [va, vb] = x.versus, mx = Math.max(va || 0, vb || 0, 1);
      const [la, lb] = x.labels || [A(), B()];
      const better = x.focus != null ? [la, lb][x.focus] : x.lowBetter ? ((va ?? 1e9) <= (vb ?? 1e9) ? la : lb) : ((va || 0) >= (vb || 0) ? la : lb);
      const row = (p, v, cls) => `<div class="vrow${p === better ? " win" : ""}"><span class="vn ${cls}">${e(p)}</span><span class="vbar"><i class="${cls}" style="width:${v == null ? 0 : Math.max(4, v / mx * 100)}%"></i></span><span class="vv">${v == null ? "-" : e(x.fmt ? x.fmt(v) : num(v))}</span></div>`;
      viz = `<div class="versus">${row(la, va, "pa")}${row(lb, vb, "pb")}</div>`;
    } else if (x.big != null) {
      viz = `<div class="bignum"><b>${e(x.big)}</b>${x.bigSub ? `<span>${e(x.bigSub)}</span>` : ""}</div>`;
    } else if (x.langs) {
      viz = `<div class="langs">${x.langs.map(l => `<div class="lrow${l.top ? " top" : ""}"><span class="ln">${e(l.label)}</span><span class="vbar"><i style="width:${Math.max(3, l.share)}%"></i></span><span class="vv">${l.share}%</span></div>`).join("")}</div>${x.quotes && x.quotes.length ? `<div class="lq">${x.quotes.map(q => `<q>${e(q)}</q>`).join("")}</div>` : ""}`;
    } else if (x.reasons) {
      viz = `<div class="reasons">${x.reasons.map(rs => `<div class="rsn${rs.off ? " off" : ""}"><b>${e(rs.k)}</b><div><p>${e(rs.t)}</p>${rs.off ? `<small>${e(rs.off)}</small>` : ""}</div></div>`).join("")}</div>`;
    } else if (x.anns) {
      viz = `<div class="anns">${x.anns.map(a => `<div class="ann${a.hot ? " hot" : ""}"><b>${e(a.label)}</b><span>${e(a.date)}</span><em>${e(a.v)}</em></div>`).join("")}</div>`;
    } else if (x.chips) {
      viz = `<div class="chips">${x.chips.map(c => `<span class="chip">${e(c)}</span>`).join("")}</div>`;
    }
    return `<article class="insight"><span class="it" style="color:var(--c-${route})">${e(x.title)}</span><p class="is">${e(x.text)}</p>${viz}</article>`;
  }
  const pc = v => Math.round((v || 0) * 100);
  const mins = v => v == null ? "-" : num1(v) + "분";
  const INSIGHTS = {
    fbond() { return state.friend.parts.map(p => ({ title: p.label, text: p.say, big: `${p.pts}점`, bigSub: `${p.w}점 만점` })); },
    flaugh() {
      const f = state.friend, hl = state.r.highlights, a = A(), b = B(), tc = p => state.r.overview.textCount[p] || 1;
      return [
        { title: "더 많이 웃긴 사람", text: `${f.funnier}의 말 바로 뒤에 상대의 ㅋㅋ가 따라온 게 ${num(f.react[f.funnier])}번이에요. ${U.eunneun(f.funnier)} 이 대화방의 웃음 담당이에요.`, versus: [f.react[a], f.react[b]], fmt: v => num(v) + "번" },
        { title: "더 자주 웃은 사람", text: `ㅋㅋ나 ㅎㅎ가 든 말풍선은 ${a} ${num(f.laughBy[a])}개(${Math.round(f.laughBy[a] / tc(a) * 100)}%), ${b} ${num(f.laughBy[b])}개(${Math.round(f.laughBy[b] / tc(b) * 100)}%)예요.`, versus: [f.laughBy[a], f.laughBy[b]], fmt: v => num(v) + "개" },
        hl.laughDay ? { title: "가장 많이 웃은 날", text: `${U.fmtDate(hl.laughDay.date)}, 하루에 ㅋㅋ가 든 말풍선이 ${num(hl.laughDay.n)}개였어요. 자세히 보기에서 그날 대화를 볼 수 있어요.`, big: U.fmtShort(hl.laughDay.date), bigSub: `웃음 ${num(hl.laughDay.n)}번` } : null
      ];
    },
    ftalk() {
      const ov = state.r.overview, sp = state.r.speed, f = state.friend, ls = sp.longestSilence;
      return [
        { title: "이야기한 날", text: `${num(ov.span)}일 중 ${num(ov.chatDays)}일, 하루 평균 ${num(ov.avgPerDay)}개씩 이야기했어요.`, big: `${num(ov.chatDays)}일`, bigSub: `${num(ov.span)}일 중` },
        { title: "가장 길게 이어진 날들", text: `${num(ov.longestStreak)}일 동안 하루도 빠짐없이 이야기한 적이 있어요.`, big: `${num(ov.longestStreak)}일`, bigSub: `${U.fmtDate(ov.longestStreakEnd)}까지` },
        ls && ls.hours >= 24 ? { title: "가장 길었던 공백", text: `${num1(ls.hours / 24)}일 동안 조용했던 적이 있어요. 그 침묵을 먼저 깬 건 ${yeoss(ls.breaker)}.`, big: `${num1(ls.hours / 24)}일`, bigSub: U.fmtDate(ls.from) } : null,
        f.trend ? { title: "요즘 흐름", text: f.trend.change <= -0.25 ? `최근 석 달은 조금 뜸해졌어요(하루 ${num1(f.trend.oldRate)}개 → ${num1(f.trend.recRate)}개). 바쁜 시기일 수도 있어요.` : f.trend.change >= 0.2 ? `최근 석 달은 오히려 더 자주 이야기해요(하루 ${num1(f.trend.oldRate)}개 → ${num1(f.trend.recRate)}개).` : "최근 석 달도 예전처럼 꾸준히 이야기하고 있어요.", versus: [f.trend.oldRate, f.trend.recRate], labels: ["이전", "최근 90일"], fmt: v => num1(v) + "개" } : null
      ];
    },
    freply() {
      const rs = state.r.speed.reply, ra = rs[A()], rb = rs[B()], fast = (ra.median ?? 99) <= (rb.median ?? 99) ? A() : B();
      return [
        { title: "보통 걸리는 시간", text: Math.abs((ra.median || 0) - (rb.median || 0)) < 1 ? `두 사람 모두 보통 ${mins(ra.median)} 안에 답해요.` : `${U.iga(fast)} 조금 더 빨리 답해요.`, versus: [ra.median, rb.median], lowBetter: true, fmt: mins },
        { title: "30분 안에 온 답장", text: "친구 사이엔 바로 답하지 않아도 괜찮아요. 30분 안에 돌아온 답장 비율이에요.", versus: [pc(ra.in30), pc(rb.in30)], fmt: v => v + "%" }
      ];
    },
    fcare() {
      const f = state.friend, b = state.r.balance.per, L = state.r.love;
      return [
        { title: "안부를 묻는 말", text: `"밥은 먹었어?", "괜찮아?" 같은 안부를 ${A()} ${num(b[A()].askCare)}번, ${B()} ${num(b[B()].askCare)}번 물었어요.`, versus: [b[A()].askCare, b[B()].askCare], fmt: v => num(v) + "번" },
        { title: "응원·위로·걱정까지", text: `서로를 챙긴 말은 모두 ${num(f.careOf[A()] + f.careOf[B()])}번. ${U.iga(f.carer)} 조금 더 많이 챙겼어요.`, versus: [f.careOf[A()], f.careOf[B()]], fmt: v => num(v) + "번" },
        L.thanks.total ? { title: "고마워", text: `쑥스러워도 "고마워"는 ${num(L.thanks.total)}번 나왔어요.`, versus: [L.thanks[A()], L.thanks[B()]], fmt: v => num(v) + "번" } : null
      ];
    },
    ftopic() {
      const r = state.r, l = r.life, f = state.friend, sh = p => (r.shorts[p] || []).filter(x => !/^[ㅋㅎㅠㅜ!?.~ ]+$/.test(x.w)).slice(0, 4).map(x => x.w);
      return [
        l.foods.length ? { title: "자주 이야기한 음식", text: `가장 자주 나온 음식은 ${l.foods[0].label}이에요.`.replace(/(.)이에요\.$/, (m, c) => U.jong(c) ? c + "이에요." : c + "예요."), chips: l.foods.slice(0, 6).map(x => x.label) } : null,
        { title: `${A()}의 입버릇`, text: "자주 보낸 짧은 말이에요.", chips: sh(A()) },
        { title: `${B()}의 입버릇`, text: "자주 보낸 짧은 말이에요.", chips: sh(B()) },
        { title: "함께하자는 말", text: `'같이', '만나', '놀러' 같은 말과 카톡 통화가 ${num(f.together)}번이에요.${f.together < 30 ? " 얼굴 보는 약속을 조금 더 잡아 봐도 좋겠어요." : ""}`, big: `${num(f.together)}번` }
      ];
    },
    sig() {
      const c = state.crush, ord = { good: 0, mid: 1, low: 2 }, tag = { good: "좋은 신호", mid: "보통", low: "아쉬운 신호" };
      return c.signals.slice().sort((a, b) => ord[a.level] - ord[b.level]).map(x => ({ title: `${tag[x.level]} · ${x.title}${x.sub ? ` (${x.sub})` : ""}`, text: x.text, versus: x.versus, labels: x.labels || [c.me, c.them], fmt: x.fmt }));
    },
    first() {
      const c = state.crush, sp = state.r.speed, me = c.me, th = c.them;
      const op = c.openers.filter((o, i, a) => a.findIndex(x => x.text === o.text) === i).map(o => o.text);
      const sInit = c.signals.find(x => x.key === "init");
      return [
        { title: "조용할 때 먼저 말을 건 사람", text: sInit.text, versus: [sp.init[me], sp.init[th]], labels: [me, th], fmt: v => num(v) + "번" },
        { title: "답을 기다리지 않고 이어 보낸 말", text: `답이 오기 전에 한 번 더 보낸 건 ${me} ${num(sp.doubles[me])}번, ${th} ${num(sp.doubles[th])}번이에요. ${sp.doubles[th] >= sp.doubles[me] * 0.8 ? "그 사람도 할 말이 많아질 때가 있어요." : "하고 싶은 말이 더 많은 쪽은 아직 나예요."}`, versus: [sp.doubles[me], sp.doubles[th]], labels: [me, th], fmt: v => num(v) + "번" },
        op.length ? { title: `${th}${U.iga(th).slice(th.length)} 먼저 건넨 첫마디`, text: "한동안 조용하다가 그 사람이 먼저 보낸 말이에요. 최근 것부터 보여 줘요.", chips: op.reverse() } : { title: "그 사람의 첫마디", text: `아직 ${U.iga(th)} 먼저 말을 건 기록은 찾지 못했어요.` }
      ];
    },
    reply() {
      const c = state.crush, sp = state.r.speed, me = c.me, th = c.them, rm = sp.reply[me], rt = sp.reply[th];
      const ms = c.monthly.filter(m => m.replyThem != null), f = ms[0], l = ms[ms.length - 1];
      return [
        { title: "보통 걸리는 시간", text: (rt.median || 0) <= (rm.median || 0) + 1 ? `${th}도 ${me}만큼 빨리 답해요. 보통 ${num1(rt.median)}분이에요.` : `${me}는 보통 ${num1(rm.median)}분, ${th}는 ${num1(rt.median)}분 만에 답해요.`.replace(`${me}는`, U.eunneun(me)).replace(`${th}는`, U.eunneun(th)), versus: [rm.median, rt.median], labels: [me, th], lowBetter: true, fmt: mins },
        { title: "5분 안에 온 답장", text: `${th}의 답장 중 ${pc0(rt.in5)}%가 5분 안에 왔어요.`, versus: [pc0(rm.in5), pc0(rt.in5)], labels: [me, th], fmt: v => v + "%" },
        f && l && f !== l ? { title: "처음과 요즘", text: l.replyThem < f.replyThem ? `${th}의 답장이 빨라졌어요. ${U.fmtDate(f.month)} ${num1(f.replyThem)}분 → ${U.fmtDate(l.month)} ${num1(l.replyThem)}분.` : l.replyThem > f.replyThem ? `${th}의 답장이 조금 느려졌어요(${num1(f.replyThem)}분 → ${num1(l.replyThem)}분). 바쁜 시기일 수도 있어요.` : `${th}의 답장 속도는 처음과 비슷해요.`, versus: [f.replyThem, l.replyThem], labels: ["처음 달", "최근 달"], lowBetter: true, fmt: mins } : null
      ];
    },
    curious() {
      const c = state.crush, r = state.r, me = c.me, th = c.them, b = r.balance.per, nc = r.nicknames.nameCalls || {};
      return [
        { title: "질문 비율", text: c.signals.find(x => x.key === "curious").text, versus: [pc0(c.qMe), pc0(c.qThem)], labels: [me, th], fmt: v => v + "%" },
        { title: "안부를 묻는 말", text: `"밥은 먹었어?", "잘 잤어?" 같은 안부를 ${th}${U.iga(th).slice(th.length)} ${num(b[th].askCare)}번 물었어요.`, versus: [b[me].askCare, b[th].askCare], labels: [me, th], fmt: v => num(v) + "번" },
        (nc[me] || nc[th]) ? { title: "이름을 불러 준 횟수", text: `${th}${U.iga(th).slice(th.length)} ${me}의 이름을 부른 건 ${num(nc[th] || 0)}번이에요.`, versus: [nc[me] || 0, nc[th] || 0], labels: [me, th], fmt: v => num(v) + "번" } : null
      ];
    },
    heart() {
      const c = state.crush, L = state.r.love, me = c.me, th = c.them, ll = state.r.loveLang;
      const out = [{ title: "마음을 드러낸 말", text: c.signals.find(x => x.key === "heart").text, versus: [c.heartMe, c.heartThem], labels: [me, th], fmt: v => num(v) + "번" }];
      const parts = [["보고 싶어", L.miss[th]], ["고마워", L.thanks[th]], ["예뻐·귀여워", L.cute[th]], ["좋아해", L.like[th]]].filter(x => x[1]);
      if (parts.length) out.push({ title: `${th}의 말 속에서`, text: "그 사람이 보낸 마음 표현을 종류별로 세어 봤어요.", chips: parts.map(([k, v]) => `${k} ${num(v)}번`) });
      if (ll && ll[th]) {
        const x = ll[th], top = x.cats.find(z => z.key === x.top);
        out.push({ title: `${th}의 사랑의 언어 (재미용)`, text: `${U.eunneun(th)} 주로 '${top.label}'${roP(top.label)} 마음을 표현하는 편이에요.`, langs: x.cats.slice().sort((a, b) => b.share - a.share).map(z => ({ label: z.label, share: z.share, top: z.key === x.top })), quotes: top.examples.map(q => q.text) });
      }
      return out;
    },
    trend() {
      const c = state.crush, t = c.trend, th = c.them;
      if (!t) return [{ title: "요즘 흐름", text: c.signals.find(x => x.key === "trend").text }];
      return [
        { title: `${th}의 먼저 연락`, text: c.signals.find(x => x.key === "trend").text, versus: [pc0(t.oldInit), pc0(t.recInit)], labels: ["이전", "최근 90일"], fmt: v => v + "%" },
        { title: `${th}의 하루 말풍선`, text: t.change > 0.1 ? `최근 석 달, ${th}의 말풍선이 하루 ${num1(t.oldRate)}개 → ${num1(t.recRate)}개로 늘었어요.` : t.change < -0.1 ? `최근 석 달, ${th}의 말풍선이 하루 ${num1(t.oldRate)}개 → ${num1(t.recRate)}개로 줄었어요.` : `${th}의 하루 말풍선은 이전과 비슷해요(${num1(t.recRate)}개).`, versus: [t.oldRate, t.recRate], labels: ["이전", "최근 90일"], fmt: v => num1(v) + "개" }
      ];
    },
    freq() {
      const r = state.r, ov = r.overview, wd = r.weekday.indexOf(Math.max(...r.weekday)), hr = r.hourly.indexOf(Math.max(...r.hourly));
      const a = ov.byWho[A()], b = ov.byWho[B()], more = a >= b ? A() : B(), even = Math.abs(a - b) / ov.total < 0.1;
      return [
        { title: "하루에 얼마나", text: `두 사람은 하루에 ${num(ov.avgPerDay)}번쯤 말을 주고받았어요.`, big: `${num(ov.avgPerDay)}개`, bigSub: `${num(ov.span)}일 중 ${num(ov.chatDays)}일 이야기했어요` },
        { title: "누가 더 많이", text: even ? "두 사람이 거의 반반씩 이야기했어요." : `${U.iga(more)} 조금 더 많이 이야기했어요.`, versus: [a, b], fmt: v => num(v) + "개" },
        { title: "가장 길게 이어진 날들", text: `${num(ov.longestStreak)}일 동안 하루도 빠짐없이 이야기한 적이 있어요.`, big: `${num(ov.longestStreak)}일`, bigSub: `${U.fmtDate(ov.longestStreakEnd)}까지` },
        { title: "가장 수다스러운 때", text: `${U.WD[wd]}요일, ${hr}시쯤 가장 많이 이야기해요.` }
      ];
    },
    speed() {
      const r = state.r, sp = r.speed, ra = sp.reply[A()], rb = sp.reply[B()];
      const fast = (ra.median ?? 99) <= (rb.median ?? 99) ? A() : B();
      const it = (sp.init[A()] + sp.init[B()]) || 1;
      const first = sp.init[A()] >= sp.init[B()] ? A() : B();
      return [
        { title: "답장 속도", text: Math.abs((ra.median || 0) - (rb.median || 0)) < 1 ? `두 사람 모두 보통 ${mins(ra.median)} 안에 답해요.` : `${U.iga(fast)} 조금 더 빨리 답해요.`, versus: [ra.median, rb.median], lowBetter: true, fmt: mins },
        { title: "5분 안에 온 답장", text: `답장의 대부분이 5분 안에 왔어요. 서로를 오래 기다리게 하지 않았어요.`, versus: [pc(ra.in5), pc(rb.in5)], fmt: v => v + "%" },
        { title: "먼저 말을 거는 사람", text: `한동안 조용할 때 먼저 말을 거는 건 주로 ${yeoss(first)}.`, versus: [Math.round(sp.init[A()] / it * 100), Math.round(sp.init[B()] / it * 100)], fmt: v => v + "%" },
        sp.longestSilence.hours >= 6 ? { title: "가장 길었던 침묵", text: `가장 오래 말이 없던 건 ${num1(sp.longestSilence.hours)}시간이에요. 그 침묵을 먼저 깬 건 ${yeoss(sp.longestSilence.breaker)}.`, big: `${num1(sp.longestSilence.hours)}시간`, bigSub: U.fmtDate(sp.longestSilence.from) } : null
      ];
    },
    love() {
      const r = state.r, L = r.love, nk = r.nicknames.list[0];
      const more = L.love[A()] >= L.love[B()] ? A() : B();
      return [
        { title: "사랑해", text: `"사랑해"는 모두 ${num(L.love.total)}번. ${U.iga(more)} 조금 더 자주 말했어요.`, versus: [L.love[A()], L.love[B()]], fmt: v => num(v) + "번" },
        r.firstSay.love ? { title: "처음 사랑해라고 말한 날", text: `${U.fmtDate(r.firstSay.love.date)}, ${U.iga(r.firstSay.love.who)} 먼저 말했어요.${r.firstLoveReply ? ` ${U.eunneun(r.firstLoveReply.who)} "${r.firstLoveReply.text}"라고 답했어요.` : ""}` } : null,
        { title: "보고 싶어", text: `보고 싶다는 말은 ${num(L.miss.total)}번 오갔어요.`, versus: [L.miss[A()], L.miss[B()]], fmt: v => num(v) + "번" },
        { title: "시간이 지나면서", text: r.loveTrend.second >= r.loveTrend.first ? "함께한 시간이 길어질수록, 사랑한다는 말이 오히려 늘었어요." : "처음보다는 조금 줄었지만, 사랑한다는 말은 멈추지 않았어요." },
        nk ? { title: "서로를 부르는 이름", text: `가장 많이 부른 호칭은 "${nk.label}"(${num(nk.total)}번)이에요.`, chips: r.nicknames.list.slice(0, 4).map(n => n.label) } : null
      ];
    },
    routine() {
      const r = state.r, by = r.routine.by;
      const line = p => { const x = by[p]; return x && x.ok ? `${p}: ${U.hm(x.wake.med)}에 하루를 시작하고 ${U.hm(x.sleep.med)}쯤 잠들어요.` : `${p}: 아침·밤 기록이 더 필요해요.`; };
      const x = by[A()] && by[A()].ok ? by[A()] : by[B()];
      const slot = r.routine.slots.find(s => s.top.length);
      return [
        { title: "하루의 시작과 끝", text: `${line(A())} ${line(B())}` },
        x && x.ok && x.weekday && x.weekend ? { title: "평일과 주말", text: `주말엔 평일보다 ${num1(Math.abs(x.weekend.wake - x.weekday.wake) / 60)}시간 ${x.weekend.wake >= x.weekday.wake ? "늦게" : "일찍"} 하루를 시작해요.` } : null,
        x && x.ok && x.firstWords.length ? { title: "아침 첫마디", text: "눈 뜨자마자 가장 자주 보낸 말이에요.", chips: x.firstWords.map(w => w.text) } : null,
        x && x.ok && x.lastWords.length ? { title: "잠들기 전 마지막 말", text: "하루의 끝에 가장 자주 남긴 말이에요.", chips: x.lastWords.map(w => w.text) } : null,
        slot ? { title: "시간대마다", text: r.routine.slots.filter(s => s.top.length).slice(0, 3).map(s => `${s.label}엔 ${s.top[0].name}`).join(", ") + " 이야기를 많이 해요." } : null
      ];
    },
    balance() {
      const r = state.r, b = r.balance;
      const careOf = p => b.per[p].care.reduce((x, c) => x + c.n, 0);
      return [
        { title: "안부를 묻는 사람", text: `"밥은 먹었어?" 같은 안부는 ${U.iga(b.per[A()].askCare >= b.per[B()].askCare ? A() : B())} 더 자주 물었어요.`, versus: [b.per[A()].askCare, b.per[B()].askCare], fmt: v => num(v) + "번" },
        { title: "걱정하고 응원하는 말", text: `걱정·배려·응원의 말은 ${U.iga(careOf(A()) >= careOf(B()) ? A() : B())} 조금 더 많이 건넸어요.`, versus: [careOf(A()), careOf(B())], fmt: v => num(v) + "번" },
        b.simFirst != null && b.simLast != null ? { title: "닮아 가는 말투", text: b.simLast >= b.simFirst ? "처음보다 마지막에 말투가 더 닮아 있었어요." : "두 사람은 각자의 말투를 지키며 이야기했어요.", big: `${b.simFirst} → ${b.simLast}점`, bigSub: "처음 60일 → 마지막 60일 (100점 만점)" } : null,
        b.spread.length ? { title: "서로에게 번진 말", text: `"${b.spread[0].word}"는 ${U.iga(b.spread[0].from)} 먼저 쓰기 시작했는데, ${b.spread[0].gapDays}일 뒤엔 ${b.spread[0].to}도 쓰고 있었어요.`, chips: b.spread.map(x => x.word) } : null
      ];
    },
    life() {
      const r = state.r, l = r.life, ppl = l.people.filter(x => x.total).sort((a, b) => b.total - a.total)[0];
      return [
        l.foods.length ? { title: "자주 이야기한 음식", text: `가장 자주 나온 음식은 ${l.foods[0].label}예요.`.replace(/(.)예요\.$/, (m, c) => U.jong(c) ? c + "이에요." : c + "예요."), chips: l.foods.slice(0, 6).map(f => f.label) } : null,
        { title: "먹는 이야기", text: `대화의 ${pc(l.mealRatio)}%가 밥, 간식, 맛집 이야기였어요.`, big: `${pc(l.mealRatio)}%` },
        ppl ? { title: "대화 속 사람들", text: `대화 속에 가장 자주 등장한 건 ${ppl.label} 이야기예요.`, chips: l.people.filter(x => x.total).map(x => x.label) } : null,
        l.trips.length ? { title: "떨어져 있던 시기", text: `여행이나 출장으로 떨어져 있던 때가 ${l.trips.length}번 있었어요. 그때 대화는 평소의 ${l.trips[0].vsUsual}%였어요.`, chips: l.trips.map(t => `${U.fmtShort(t.from)}~${U.fmtShort(t.to)}`) } : null
      ];
    },
    conflict() {
      const r = state.r, c = r.conflict;
      if (!c.days.length) return [{ title: "크게 싸운 날", text: "두 사람 모두 서운함을 말한 날은 거의 없었어요." }];
      const first = c.apologizedFirst[A()] >= c.apologizedFirst[B()] ? A() : B();
      return [
        { title: "서운했던 날", text: `두 사람 모두 서운함과 미안함을 말한 날이 ${num(c.count)}일 있었어요.`, big: `${num(c.count)}일`, bigSub: `대화한 ${num(r.overview.chatDays)}일 중` },
        c.resolvedNextDayPct != null ? { title: "다음 날엔", text: `그런 날의 ${c.resolvedNextDayPct}%는 다음 날이면 괜찮아졌어요.`, big: `${c.resolvedNextDayPct}%` } : null,
        c.topics.length ? { title: "무엇 때문에 (재미용 추정)", text: `주로 ${c.topics.slice(0, 2).map(t => t.label).join(", ")} 이야기에서 서운함이 생겼어요.`, chips: c.topics.map(t => t.label) } : null,
        c.makeup.length ? { title: "화해하는 방법", text: `주로 '${c.makeup[0].label}'로 다시 가까워졌어요.`, chips: c.makeup.map(m => m.label) } : null,
        { title: "먼저 미안하다고 한 사람", text: `서운했던 날, 먼저 미안하다고 한 건 주로 ${yeoss(first)}.`, versus: [c.apologizedFirst[A()], c.apologizedFirst[B()]], fmt: v => num(v) + "번" }
      ];
    },
    lang() {
      const ll = state.r.loveLang;
      if (!ll) return [{ title: "사랑의 언어", text: "새로 생긴 분석이에요. 대화를 한 번 다시 불러오면 볼 수 있어요." }];
      const card = p => {
        const x = ll[p], top = x.cats.find(c => c.key === x.top), sec = x.cats.find(c => c.key === x.second);
        const why = `${top.label}에 해당하는 말이 글 1000개 중 ${num1(top.per1000)}번${top.calls ? `(카톡 통화 ${num(top.calls)}번 포함)` : ""} 나왔어요. 다섯 가지 중 기준보다 가장 많이 나온 언어예요.`;
        return { title: `${p}의 사랑의 언어`, text: `${U.eunneun(p)} 주로 '${top.label}'${roP(top.label)} 사랑을 표현해요. ${LL(top.key).desc}. ${why}${sec && sec.share >= 20 ? ` 다음은 '${sec.label}'이에요.` : ""}`.replace(/'(인정하는 말|함께하는 시간|선물|봉사|스킨십)'이에요/, (m, w) => `'${w}'${U.jong(w) ? "이에요" : "예요"}`),
          langs: x.cats.slice().sort((a, b) => b.share - a.share).map(c => ({ label: c.label, share: c.share, top: c.key === x.top })), quotes: top.examples.map(q => q.text) };
      };
      const a = ll[A()], b = ll[B()], la = LL(a.top), lb = LL(b.top);
      const pair = a.top === b.top
        ? { title: "두 사람의 언어", text: `두 사람 모두 '${la.label}'${roP(la.label)} 사랑해요. 같은 언어를 쓰니까, 마음이 쉽게 전해지는 사이예요.` }
        : { title: "서로 다른 언어", text: `${U.eunneun(A())} '${la.label}', ${U.eunneun(B())} '${lb.label}'. 서로 다른 언어로 사랑하고 있어요. 상대의 언어로 한 번씩 표현해 주면 마음이 더 잘 전해져요.`, chips: [`${A()} → ${B()}: ${lb.tip}`, `${B()} → ${A()}: ${la.tip}`] };
      return [card(A()), card(B()), pair];
    },
    us() {
      const cp = state.couple, si = cp && cp.since, out = [];
      if (si) {
        out.push({ title: "연인이 된 달", text: si.someMonths > 0 ? `첫 대화로부터 ${Couple.ym(si.someMonths)} 뒤, ${U.fmtDate(si.month)}에 연인이 되었어요.` : si.someMonths === 0 ? `첫 대화를 나눈 그 달, ${U.fmtDate(si.month)}에 바로 연인이 되었어요.` : `${U.fmtDate(si.month)}에 연인이 되었어요.`, big: si.months > 0 ? Couple.ym(si.months) : "이번 달", bigSub: si.next.left === 0 ? `이번 달이 ${si.next.label}이에요` : `${si.next.label}까지 ${num(si.next.left)}개월 (${U.fmtDate(si.next.month)})` });
        const b = si.before, a = si.after, L = ["사귀기 전", "사귄 뒤"];
        if (b && a) {
          const ch = Math.round((a.perDay / Math.max(0.1, b.perDay) - 1) * 100);
          out.push({ title: "하루 대화량", text: Math.abs(ch) < 10 ? "사귀기 전이나 후나, 대화량은 비슷했어요. 처음부터 마음이 있었나 봐요." : ch > 0 ? `사귀고 나서 하루 대화가 ${ch}% 늘었어요.` : `사귀고 나서 하루 대화는 ${-ch}% 줄었어요. 대신 만나서 나누는 이야기가 늘었을지도 몰라요.`, versus: [b.perDay, a.perDay], labels: L, fmt: v => num(v) + "개" });
          out.push({ title: "사랑해 (말풍선 1000개당)", text: b.love === 0 ? `사귀기 전엔 한 번도 없던 "사랑해"가, 사귄 뒤엔 ${num(a.love)}번 오갔어요.` : `"사랑해"가 말풍선 1000개당 ${num1(b.love1000)}번에서 ${num1(a.love1000)}번이 되었어요.`, versus: [b.love1000, a.love1000], labels: L, fmt: v => num1(v) + "번" });
          if (b.fast != null && a.fast != null) out.push({ title: "5분 안에 온 답장", text: a.fast >= b.fast + 3 ? `사귀고 나서 답장이 더 빨라졌어요. ${b.fast}% → ${a.fast}%.` : a.fast <= b.fast - 3 ? `사귀기 전엔 5분 안에 답한 게 ${b.fast}%, 지금은 ${a.fast}%예요. 서로 편해진 만큼 조금 여유가 생겼어요.` : `사귀기 전에도, 지금도 답장은 늘 빨랐어요.`, versus: [b.fast, a.fast], labels: L, fmt: v => v + "%" });
          if (b.formal != null && a.formal != null && b.formal - a.formal >= 15) out.push({ title: "말투", text: `사귀기 전엔 말의 ${b.formal}%가 "~요"로 끝났는데, 사귄 뒤엔 ${a.formal}%예요. 존댓말이 반말이 되었어요.`, versus: [b.formal, a.formal], labels: L, fmt: v => v + "%" });
          const ib = b.init[A()] + b.init[B()], first = b.init[A()] >= b.init[B()] ? A() : B();
          if (ib >= 5) out.push({ title: "사귀기 전, 먼저 다가간 사람", text: `연인이 되기 전에 먼저 말을 건 건 주로 ${yeoss(first)}. 그동안 ${num(b.init[first])}번이요.`, versus: [b.init[A()], b.init[B()]], fmt: v => num(v) + "번" });
        }
        const fl = si.firstLove;
        if (fl) out.push({ title: "처음 사랑해", text: fl.m > 0 ? `사귄 지 ${Couple.ym(fl.m)} 만에, ${U.fmtDate(fl.date)} ${U.iga(fl.who)} 처음 "사랑해"라고 말했어요.` : fl.m === 0 ? `사귄 그 달, ${U.fmtDate(fl.date)}에 ${U.iga(fl.who)} 처음 "사랑해"라고 말했어요.` : `사귀기 ${Couple.ym(-fl.m)} 전에 이미 ${U.iga(fl.who)} "사랑해"라고 말했어요. 마음이 먼저 와 있었어요.` });
        if (si.anniversaries.length) {
          const an = si.anniversaries, best = an.slice().sort((x, y) => y.perDay - x.perDay)[0], cel = an.filter(x => x.celebrated).length;
          out.push({ title: "해마다 그 달의 우리", text: an.length === 1 ? `사귄 달엔 하루 ${num(an[0].perDay)}개씩 이야기했어요.` : `사귄 달과 해마다 돌아온 그 달을 모아 봤어요. 가장 이야기가 많았던 건 ${best.label}이에요.${cel ? ` ${cel}번은 그 달에 기념일·축하 이야기가 오갔어요.` : ""}`, anns: an.slice(-8).map(x => ({ label: x.label, date: x.month.replace("-", "."), v: `하루 ${num(x.perDay)}개${x.vsAvg != null && x.label !== "사귄 달" ? ` · 평소의 ${x.vsAvg}%` : ""}`, hot: an.length > 1 && x === best })) });
        }
      }
      const pr = cp && cp.mbti && cp.mbti.pair;
      if (pr) {
        const by = cp.mbti.by;
        out.push({ title: "MBTI로 본 두 사람 (재미용)", text: `${by[A()].real}와 ${by[B()].real}, ${pr.title}이에요.`.replace(/([A-Z]{4})와/, "$1와"), big: `${pr.same}/4`, bigSub: "같은 글자 수" });
        pr.evidence.forEach(x => out.push({ title: "대화에서 보인 모습", text: `${x.t}. ${x.s}`, versus: x.v, fmt: v => num(v) + "번" }));
      }
      if (!out.length) out.push({ title: "알려 주면 더 볼 수 있어요", text: "사귄 날을 알려 주면 사귀기 전과 후, 기념일을 비교해 드려요. MBTI를 알려 주면 실제 성향과 카톡 속 모습을 비교해요." });
      return out;
    },
    mbti() {
      const r = state.r, m = r.mbti, given = state.couple && state.couple.mbti && state.couple.mbti.by || {};
      return [A(), B()].map(p => {
        const g = given[p], est = m[p];
        const reasons = est.axes.map((x, i) => {
          const gx = g && g.axes[i];
          return { k: x.pick, t: x.reason || x.why, off: gx && !gx.match ? `알려 준 MBTI는 ${gx.real}${gx.real === "N" ? "이에요" : "예요"}. ${Couple.WORD[gx.real]} 사람도 이 대화에서는 ${Couple.WORD[x.pick]} 모습이 더 보였어요.` : "" };
        });
        if (!g) return { title: `${p} · 카톡으로 본 ${est.type} (재미용)`, text: `${U.eunneun(p)} 카톡 말투로 보면 ${est.type}에 가까워요. 글자마다 이렇게 봤어요.`, reasons };
        return { title: `${p} · 알려 준 ${g.real} · 카톡 속 ${g.est}`, text: g.same === 4 ? `카톡 속 ${p}도 그대로 ${g.real}였어요. 글자마다 이렇게 봤어요.` : `4글자 중 ${g.same}글자가 같아요. 글자마다 왜 그렇게 봤는지 적어 둘게요.`, reasons };
      });
    }
  };
  const roP = w => { const c = w.charCodeAt(w.length - 1) - 0xac00, j = c >= 0 && c < 11172 ? c % 28 : 0; return j && j !== 8 ? "으로" : "로"; };
  const yeoss = w => w + (U.jong(w) ? "이었어요" : "였어요");

  const RENDER = {
    fbond() {
      const f = state.friend;
      if (CAP) { CAP.read = `<section class="read"><h2>우정 지수 ${f.score}점 <span class="fun">재미용</span></h2><p>꾸준함, 웃음, 주고받는 균형, 답장, 챙김, 함께하기. 여섯 가지를 카톡에서 찾아 더한 점수예요.</p><p>만나서 함께한 시간은 카톡에 남지 않으니, 점수는 참고만 해 주세요.</p></section>`; CAP.concl = `<section class="conclusion"><div class="eyebrow">이 코너의 결론</div><p>${e(f.score >= 60 ? "카톡만 봐도 든든한 친구 사이예요. 이 우정, 오래 지켜 주세요." : "카톡만으로는 다 보이지 않는 우정도 있어요. 가끔은 만나서 채워 주세요.")}</p></section>`; }
      return block("여섯 가지", table(["항목", "점수", "근거"], f.parts.map(p => [e(p.label), `${p.pts}/${p.w}`, e(p.say)]), [1]), "기준: 이야기한 날 60%, 웃음 든 말풍선 30%, 30분 안 답장 80%, 챙김 1000개당 60번, 함께하자는 말·통화 1000개당 60번이면 만점이에요.");
    },
    flaugh() {
      const hl = state.r.highlights;
      if (CAP) CAP.read = `<section class="read"><h2>누가 더 웃길까</h2><p>ㅋㅋ나 ㅎㅎ가 든 말풍선을 '웃음'으로 셌어요. 그리고 한 사람의 말 바로 뒤(10분 안)에 상대가 ㅋㅋ로 답하면, 앞사람이 웃긴 걸로 셌어요.</p></section>`;
      return hl.laughDay ? scene(hl.laughDay, "가장 많이 웃은 날") : `<p class="cap">웃음이 몰린 날을 찾지 못했어요.</p>`;
    },
    ftalk() {
      const r = state.r, keys = Object.keys(r.monthly).sort();
      if (CAP) CAP.read = `<section class="read"><h2>우리 얼마나 자주 이야기할까</h2><p>매일 이야기하지 않아도 괜찮은 게 친구예요. 그래도 얼마나 자주, 얼마나 꾸준히 이야기했는지 보면 우정의 모양이 보여요.</p></section>`;
      return block("달마다 주고받은 말풍선", legend() + card(C.stacked({ labels: monthLabels(keys), tipLabels: keys.map(U.fmtDate), a: keys.map(k => r.monthly[k][A()]), b: keys.map(k => r.monthly[k][B()]), names: [A(), B()] })));
    },
    freply() {
      const sp = state.r.speed;
      if (CAP) CAP.read = `<section class="read"><h2>누가 더 빨리 답할까</h2><p>상대 말에 60분 안에 답한 것만 '답장'으로 셌어요.</p></section>`;
      return block("답장 속도", table(["", "중간값", "5분 안", "30분 안"], [A(), B()].map(p => { const x = sp.reply[p]; return [who(p), num1(x.median) + "분", U.pct(x.in5, 1) + "%", U.pct(x.in30, 1) + "%"]; }), [1, 2, 3]));
    },
    fcare() {
      const b = state.r.balance;
      if (CAP) CAP.read = `<section class="read"><h2>누가 더 챙겨 줄까</h2><p>안부를 묻는 질문, 그리고 응원·위로·걱정의 말을 셌어요. 친구 사이엔 쑥스러워서 잘 안 하는 말이라 더 소중해요.</p></section>`;
      return block("챙김 네 가지", legend() + tally(b.per[A()].care.map((c, i) => [c.label, c.n, b.per[B()].care[i].n])) + tally([["안부 질문", b.per[A()].askCare, b.per[B()].askCare]]));
    },
    ftopic() {
      const l = state.r.life;
      if (CAP) CAP.read = `<section class="read"><h2>우리는 무슨 이야기를 할까</h2><p>음식, 대화에 나온 사람들, 자주 쓰는 말을 모아 봤어요.</p></section>`;
      return (l.foods.length ? block("자주 이야기한 음식", legend() + tally(l.foods.map(f => [f.label, f.by[A()] || 0, f.by[B()] || 0]))) : "") + block("대화 속 사람들", tally(l.people.map(x => [x.label, x.by[A()] || 0, x.by[B()] || 0])));
    },
    friendAdvice() {
      const f = state.friend, a = f.advice;
      let h = `<section class="read"><h2>우정을 오래 지키는 법</h2><p>카톡에서 보인 것들을 바탕으로 골랐어요. 정답은 아니에요. 두 사람을 가장 잘 아는 건 두 사람이에요.</p></section>`;
      const item = (it, i) => `<div class="item"><h4>${i != null ? `<span class="num">${i + 1}</span>` : ""}${e(it.title)}</h4><div><div class="k">데이터에서 찾은 점</div><p>${e(it.why)}</p></div><div><div class="k">이렇게 해 보세요</div><p>${e(it.how)}</p></div></div>`;
      if (a.items.length) h += block("해 볼 만한 것", `<div class="items">${a.items.map(item).join("")}</div>`);
      if (a.good.length) h += block("이미 잘하고 있어요", `<div class="items">${a.good.map(g => `<div class="item"><h4>${e(g.title)} <span class="pill good">잘함</span></h4><p>${e(g.why)}</p></div>`).join("")}</div>`);
      h += block("늘 도움이 되는 것", `<div class="items">${a.general.map(g => `<div class="item"><h4>${e(g.title)} <span class="pill gen">일반적인 조언</span></h4><p>${e(g.how)}</p></div>`).join("")}</div>`);
      return h;
    },
    sig() {
      const c = state.crush;
      if (CAP) {
        CAP.read = `<section class="read"><h2>호감 신호 ${c.score}점 <span class="fun">재미용</span></h2><p>${e(c.them)}의 카톡에서 일곱 가지 신호를 찾아 더한 점수예요. 먼저 연락하는지, 답장이 빠른지, 나를 궁금해하는지 같은 것들이에요.</p><p>카톡에 남지 않는 마음(만나서 한 말, 표정, 목소리)은 셀 수 없어요. 그러니 점수는 참고만 해 주세요.</p></section>`;
        CAP.concl = `<section class="conclusion"><div class="eyebrow">이 코너의 결론</div><p>${e(c.score >= 60 ? `${c.them}에게서 좋은 신호가 꽤 보여요. 이제는 신호를 세기보다, 한 걸음 다가가 볼 때예요.` : c.score >= 40 ? `${c.them}의 마음은 반쯤 열린 문 같아요. 조급해하지 말고, 대답하고 싶어지는 질문과 구체적인 약속으로 천천히 다가가 봐요.` : `지금은 신호가 조용해요. 하지만 카톡은 마음의 아주 일부만 보여 줘요. 서두르지 말고, 나를 먼저 아끼면서 천천히 지켜봐요.`)}</p></section>`;
      }
      return block("일곱 가지 신호", table(["신호", "점수", "비중"], c.signals.map(x => [e(x.title), x.neutral ? "-" : Math.round(x.score * 100) + "점", x.w + "%"]), [1, 2]), "신호마다 0~100점으로 바꾼 뒤 비중만큼 더했어요. 기준: 먼저 연락 50%면 만점, 5분 안 답장 70%면 만점, 대화 비중 45%면 만점, 질문 12%면 만점, 마음 표현 1000개당 15번이면 만점, 함께하자는 말 1000개당 40번이면 만점.");
    },
    first() {
      const c = state.crush, sp = state.r.speed, keys = c.monthly.filter(m => m.initShare != null);
      if (CAP) CAP.read = `<section class="read"><h2>누가 먼저 다가갈까</h2><p>4시간 넘게 조용하다가 처음 말을 건 사람을 '먼저 연락'으로 셌어요. 그 사람 머릿속에 누군가가 먼저 떠올랐다는 뜻이니까요.</p></section>`;
      return block("먼저, 이어서, 마지막", legendNames(c.me, c.them) + tallyNames([["먼저 연락", sp.init[c.me], sp.init[c.them]], ["연달아 보내기", sp.doubles[c.me], sp.doubles[c.them]], ["대화 마지막 말", sp.enders[c.me], sp.enders[c.them]]]))
        + (keys.length > 1 ? block(`달마다 ${e(c.them)}의 먼저 연락 비율`, card(C.line({ labels: monthLabels(keys.map(k => k.month)), tipLabels: keys.map(k => U.fmtDate(k.month)), unit: "%", series: [{ name: c.them, color: "var(--b)", values: keys.map(k => Math.round(k.initShare * 100)) }] }))) : "");
    },
    reply() {
      const c = state.crush, sp = state.r.speed, ks = c.monthly.filter(m => m.replyThem != null || m.replyMe != null);
      if (CAP) CAP.read = `<section class="read"><h2>답장은 얼마나 빨리 올까</h2><p>상대 말에 60분 안에 답한 것만 '답장'으로 셌어요. 그보다 늦으면 새 대화로 봤어요. 답장이 늦다고 마음이 없는 건 아니에요. 바쁜 사람일 수도 있어요.</p></section>`;
      return block("답장 속도", table(["", "중간값", "5분 안", "30분 안"], [c.me, c.them].map(p => { const x = sp.reply[p]; return [e(p), num1(x.median) + "분", U.pct(x.in5, 1) + "%", U.pct(x.in30, 1) + "%"]; }), [1, 2, 3]))
        + (ks.length > 1 ? block("달마다 답장 속도(중간값)", card(C.line({ labels: monthLabels(ks.map(k => k.month)), tipLabels: ks.map(k => U.fmtDate(k.month)), unit: "분", series: [{ name: c.me, color: "var(--a)", values: ks.map(k => k.replyMe) }, { name: c.them, color: "var(--b)", values: ks.map(k => k.replyThem) }] }))) : "");
    },
    curious() {
      const c = state.crush, b = state.r.balance.per;
      if (CAP) CAP.read = `<section class="read"><h2>그 사람도 나를 궁금해할까</h2><p>물음표가 있거나 질문으로 끝나는 말을 '질문'으로 셌어요. 질문은 대화를 이어 가고 싶다는 마음이고, '너에 대해 더 알고 싶어'라는 말이기도 해요.</p></section>`;
      return block("질문과 안부", legendNames(c.me, c.them) + tallyNames([["질문", b[c.me].questions, b[c.them].questions], ["안부 질문", b[c.me].askCare, b[c.them].askCare]]));
    },
    heart() {
      const c = state.crush, L = state.r.love;
      if (CAP) CAP.read = `<section class="read"><h2>마음은 얼마나 드러날까</h2><p>보고 싶어, 고마워, 예뻐·귀여워, 좋아해, 사랑해 같은 말을 사람마다 셌어요. 표현이 서툰 사람도 있으니, 숫자보다 '늘어나는지'를 봐 주세요.</p></section>`;
      return block("마음 표현", legendNames(c.me, c.them) + tallyNames([["보고 싶어", L.miss[c.me], L.miss[c.them]], ["고마워", L.thanks[c.me], L.thanks[c.them]], ["예뻐·귀여워", L.cute[c.me], L.cute[c.them]], ["좋아해", L.like[c.me], L.like[c.them]], ["사랑해", L.love[c.me], L.love[c.them]]]));
    },
    trend() {
      const c = state.crush, ks = c.monthly;
      if (CAP) CAP.read = `<section class="read"><h2>요즘 우리는</h2><p>최근 90일과 그 이전을 비교했어요. 그 사람이 먼저 연락하는 비율과 하루 말풍선이 늘었는지를 봐요.</p></section>`;
      return ks.length > 1 ? block(`달마다 ${e(c.them)}의 몫`, card(C.line({ labels: monthLabels(ks.map(k => k.month)), tipLabels: ks.map(k => U.fmtDate(k.month)), unit: "%", series: [{ name: "말풍선 비중", color: "var(--b)", values: ks.map(k => Math.round(k.share * 100)) }, { name: "먼저 연락 비율", color: "var(--accent)", values: ks.map(k => k.initShare == null ? null : Math.round(k.initShare * 100)) }] })), "두 사람 말풍선 중 그 사람 몫, 그리고 조용하다가 먼저 연 대화 중 그 사람 몫이에요.") : `<p class="cap">달마다 비교할 만큼 기간이 길지 않아요.</p>`;
    },
    crushAdvice() {
      const c = state.crush, a = c.advice;
      let h = `<section class="read"><h2>${e(c.them)}에게 한 걸음 더</h2><p>아쉬운 신호에 맞춰 해 볼 만한 것들을 골랐어요. 정답은 아니에요. 그 사람을 가장 잘 아는 건 결국 ${e(c.me)}예요.</p></section>`;
      const item = (it, i) => `<div class="item"><h4>${i != null ? `<span class="num">${i + 1}</span>` : ""}${e(it.title)}</h4><div><div class="k">데이터에서 찾은 점</div><p>${e(it.why)}</p></div><div><div class="k">이렇게 해 보세요</div><p>${e(it.how)}</p></div></div>`;
      if (a.items.length) h += block("해 볼 만한 것", `<div class="items">${a.items.map(item).join("")}</div>`);
      if (a.good.length) h += block("이미 좋은 신호예요", `<div class="items">${a.good.map(g => `<div class="item"><h4>${e(g.title)} <span class="pill good">좋은 신호</span></h4><p>${e(g.why)}</p></div>`).join("")}</div>`);
      h += block("늘 도움이 되는 것", `<div class="items">${a.general.map(g => `<div class="item"><h4>${e(g.title)} <span class="pill gen">일반적인 조언</span></h4><p>${e(g.how)}</p></div>`).join("")}</div>`);
      return h;
    },
    lang() {
      const ll = state.r.loveLang;
      if (CAP) CAP.read = `<section class="read"><h2>사랑을 말하는 다섯 가지 방법 <span class="fun">재미용</span></h2><p>사람마다 사랑을 표현하고 느끼는 방식이 다르다는 생각이 있어요. 게리 채프먼은 이걸 '사랑의 언어' 다섯 가지로 나눴어요. 인정하는 말, 함께하는 시간, 선물, 봉사, 스킨십이에요.</p><p>두 사람이 카톡에서 각 언어에 해당하는 말을 얼마나 썼는지 세서 짐작했어요. 만나서 한 행동은 카톡에 남지 않으니, 실제와 다를 수 있어요.</p></section>`;
      if (!ll) return "";
      if (CAP) { const a = ll[A()], b = ll[B()]; CAP.concl = `<section class="conclusion"><div class="eyebrow">이 코너의 결론</div><p>${e(a.top === b.top ? "같은 언어로 사랑하는 두 사람이에요. 지금처럼 서로에게 익숙한 방식으로 마음을 건네면 돼요." : "사랑은 같아도 말하는 방식은 달라요. 내가 좋아하는 방식이 아니라 상대가 알아듣는 방식으로 건넬 때, 마음이 가장 잘 닿아요.")}</p></section>`; }
      return block("다섯 가지 언어를 이렇게 셌어요", table(["언어", "이런 말을 셌어요", `${e(A())} (1000개당)`, `${e(B())} (1000개당)`], R_LANG().map(L => {
        const ca = ll[A()].cats.find(c => c.key === L.key), cb = ll[B()].cats.find(c => c.key === L.key);
        return [`<b>${e(L.label)}</b>`, e(L.desc), num1(ca.per1000), num1(cb.per1000)];
      }), [2, 3]), "점수는 1000개당 횟수를 언어마다 정한 기준값(인정하는 말 60, 함께하는 시간 50, 선물 8, 봉사 12, 스킨십 10)으로 나눠 비교했어요. 선물·스킨십 같은 말은 원래 드물게 나오니까요. 카톡 통화는 건 사람의 '함께하는 시간'에 더했어요.")
        + `<div class="duo" style="grid-template-columns:1fr">${[A(), B()].map(p => `<div class="card" style="display:grid;gap:8px"><p>${who(p)}의 예시</p>${ll[p].cats.filter(c => c.examples.length).map(c => `<p class="cap"><b>${e(c.label)}</b> · ${c.examples.map(q => `“${e(q.text)}”`).join(", ")}</p>`).join("")}</div>`).join("")}</div>`;
    },
    us() {
      const cp = state.couple, si = cp && cp.since;
      let h = "";
      if (CAP) CAP.read = `<section class="read"><h2>알려 준 정보로 다시 본 우리</h2><p>${si ? `사귄 달(${e(U.fmtDate(si.month))})의 1일을 기준으로 사귀기 전과 후를 나눠 봤어요.` : "사귄 달을 알려 주면 사귀기 전과 후를 나눠 볼 수 있어요."} 이 정보도 이 기기에만 저장돼요.</p><p><a href="#info" data-go="info" style="color:var(--tint);font-weight:600">우리 정보 고치기</a></p></section>`;
      if (si && si.before && si.after) {
        const b = si.before, a = si.after;
        h += block("사귀기 전과 후", table(["", "사귀기 전", "사귄 뒤"], [
          ["기간", num(b.days) + "일", num(a.days) + "일"], ["하루 말풍선", num1(b.perDay), num1(a.perDay)], ["사랑해(1000개당)", num1(b.love1000), num1(a.love1000)], ["보고 싶어", num(b.miss), num(a.miss)],
          ["5분 안 답장", b.fast == null ? "-" : b.fast + "%", a.fast == null ? "-" : a.fast + "%"], ["존댓말 비율", b.formal == null ? "-" : b.formal + "%", a.formal == null ? "-" : a.formal + "%"],
          [`먼저 연락 ${e(A())}`, num(b.init[A()]), num(a.init[A()])], [`먼저 연락 ${e(B())}`, num(b.init[B()]), num(a.init[B()])]
        ], [1, 2]), "사귄 달 1일부터를 '사귄 뒤'로 셌어요. 날짜가 아니라 달만 받아서, 경계에 며칠 차이가 있을 수 있어요.");
      }
      if (si && si.anniversaries.length) h += block("해마다 그 달", table(["", "달", "하루 말풍선", "사랑해", "기념일 이야기"], si.anniversaries.map(x => [e(x.label), U.fmtDate(x.month), num1(x.perDay), num(x.love), x.celebrated ? "있음" : "-"]), [2, 3]), "'기념일 이야기'는 그 달에 기념일·주년·축하 같은 말이 나왔는지예요.");
      const by = cp && cp.mbti && cp.mbti.by || {};
      const ks = Object.keys(by);
      if (ks.length) h += block("알려 준 MBTI와 카톡 속 모습", table(["", "알려 준", "카톡 속", "같은 글자"], ks.map(p => [who(p), by[p].real, by[p].est, by[p].same + "/4"]), [3]), "카톡 속 모습은 말투로 본 재미용 추정이에요.");
      if (!h) h = `<p class="cap">아직 알려 준 정보가 없어요.</p>`;
      if (CAP) CAP.concl = si ? `<section class="conclusion"><div class="eyebrow">이 코너의 결론</div><p>${e(si.before && si.after && si.after.love > si.before.love ? `연인이 되고 나서, 두 사람은 마음을 더 자주 말로 꺼내기 시작했어요. ${U.fmtDate(si.month)}은 두 사람의 대화가 달라진 달이에요.` : `${U.fmtDate(si.month)}부터 ${si.months > 0 ? Couple.ym(si.months) : "지금까지"}, 두 사람은 여전히 서로에게 말을 걸고 있어요.`)}</p></section>` : "";
      return h;
    },
    story() {
      const s = CRUSH() ? state.crush.story : FRIEND() ? state.friend.story : state.story, r = state.r;
      const op = (s.cover.opening || []).map((l, i) => `<p style="animation-delay:${0.3 + i * 0.9}s">${e(l)}</p>`).join("");
      const n = (s.cover.opening || []).length;
      const st = s.cover.start ? `<p class="start" style="animation-delay:${0.3 + n * 0.9 + 0.8}s">${e(s.cover.start)}</p>` : "";
      const opening = op ? `<section class="opening" aria-label="오프닝">${op}${st}</section>` : "";
      const cover = `<section class="group cover"><p class="eyebrow">TALK VIEW</p><h2>${e(s.cover.title)}</h2><p class="sub">${e(s.cover.subtitle)}</p>${C.gauge(s.cover.score, "ring-lg")}<div class="eyebrow">${CRUSH() ? `호감 신호 · ${e(state.crush.verdict)}` : FRIEND() ? `우정 지수 · ${e(state.friend.verdict)}` : `사랑 지수 · ${verdict(s.cover.score)}`}</div>${CRUSH() || FRIEND() ? "" : `<div class="parts">${r.score.parts.map(p => `<span>${e(p.label)} ${p.pts}/${p.max}</span>`).join("")}</div>`}</section>`;
      const toc = `<nav class="toc" aria-label="목차">${s.chapters.map(c => `<a href="#story" data-jump="${c.id}">${e(c.title.replace(/^\d\. /, ""))}</a>`).join("")}</nav>`;
      return opening + cover + toc + s.chapters.map(c => `<article class="chapter" id="ch-${c.id}"><h2>${e(c.title)}</h2>${c.blocks.map(storyBlock).join("")}</article>`).join("");
    },
    advice() {
      const a = state.adv, s = state.sum.advice;
      let h = read("더 사랑하려면", "최근 90일, 우리는 어땠을까", s);
      if (a.lights.length) h += block("여섯 가지 신호", `<div class="lights">${a.lights.map(l => `<div class="light ${l.color}"><span class="sig">${e(l.label)}</span><span class="num">${l.change > 0 ? "+" : ""}${l.change}%</span></div>`).join("")}</div>`, "최근 90일과 그 이전을 비교했어요. 초록은 괜찮음, 노랑은 조금 줄어듦, 빨강은 많이 줄어듦이에요. 서운함은 늘수록 빨강이에요.");
      const item = (it, i) => `<div class="item"><h4>${i != null ? `<span class="num">${i + 1}</span>` : ""}${e(it.title)} <span class="pill ${it.level}">${{ high: "먼저", mid: "보통", low: "가볍게" }[it.level]}</span></h4><div><div class="k">데이터에서 찾은 점</div><p>${e(it.why)}</p></div><div><div class="k">이렇게 해 보세요</div><p>${e(it.how)}</p></div></div>`;
      if (a.top.length) h += block("먼저 해 볼 세 가지", `<div class="items">${a.top.map(item).join("")}</div>`);
      if (a.items.length > 3) h += block("그 밖에 살펴볼 것", `<div class="items">${a.items.slice(3).map(it => item(it)).join("")}</div>`);
      if (a.good.length) h += block("잘하고 있어요", `<div class="items">${a.good.map(g => `<div class="item"><h4>${e(g.title)} <span class="pill good">잘함</span></h4><p>${e(g.why)}</p></div>`).join("")}</div>`);
      h += block("늘 도움이 되는 것", `<div class="items">${a.general.map(g => `<div class="item"><h4>${e(g.title)} <span class="pill gen">일반적인 조언</span></h4><p>${e(g.how)}</p></div>`).join("")}</div>`);
      return h + concl(s);
    },
    freq() {
      const r = state.r, ov = r.overview, s = state.sum.freq;
      const keys = Object.keys(r.monthly).sort();
      let h = read("대화 빈도", "얼마나 자주 이야기했을까", s);
      h += tiles([["함께 이야기한 날", num(ov.chatDays) + "일", `전체 ${num(ov.span)}일`], ["하루 평균", num(ov.avgPerDay) + "개", "말풍선"], ["가장 긴 연속 대화", num(ov.longestStreak) + "일", `${U.fmtShort(ov.longestStreakEnd)}까지`], ["새벽 0~5시", num(ov.lateNight) + "개", "늦은 밤의 말풍선"]]);
      h += block("달마다 주고받은 말풍선", legend() + card(C.stacked({ labels: monthLabels(keys), tipLabels: keys.map(U.fmtDate), a: keys.map(k => r.monthly[k][A()]), b: keys.map(k => r.monthly[k][B()]), names: [A(), B()] })));
      h += block("요일별", card(C.bars({ labels: U.WD, values: r.weekday, tips: r.weekday.map((v, i) => `${U.WD[i]}요일 · ${num(v)}개`) })));
      h += block("시간대별", card(C.bars({ labels: r.hourly.map((_, i) => i + "시"), values: r.hourly, every: 3, tips: r.hourly.map((v, i) => `${i}시대 · ${num(v)}개`) })));
      h += block("가장 수다스러웠던 날", table(["날짜", A(), B(), "합계"], r.topDays.map(d => [U.fmtDate(d.date), num(d[A()]), num(d[B()]), `<b>${num(d.total)}</b>`]), [1, 2, 3]));
      h += block("사진, 이모티콘, 통화", tally([["사진", ov.photos[A()], ov.photos[B()]], ["이모티콘", ov.emoticons[A()], ov.emoticons[B()]], ["카톡 통화(건)", ov.calls[A()], ov.calls[B()]]]) + `<p class="cap">카톡 통화는 모두 ${num(ov.callCount)}번, ${num(ov.callMinutes)}분이에요.${ov.longestCall ? ` 가장 긴 통화는 ${U.fmtDate(ov.longestCall.date)}의 ${num(ov.longestCall.sec / 60)}분이에요.` : ""} 일반 전화는 카톡에 남지 않아요.</p>`);
      if (ov.missingList.length) h += block("대화가 비었던 날", table(["기간", "일수"], ov.missingList.map(m => [m.from === m.to ? U.fmtDate(m.from) : `${U.fmtDate(m.from)} ~ ${U.fmtShort(m.to)}`, num(m.n) + "일"]), [1]), `대화가 없던 날은 모두 ${num(ov.missingDays)}일이에요. 가장 길었던 기간부터 보여 드려요.`);
      return h + concl(s);
    },
    speed() {
      const r = state.r, sp = r.speed, s = state.sum.speed;
      const keys = Object.keys(sp.monthlyReply).sort();
      let h = read("답장 속도", "서로에게 얼마나 빨리 달려갔을까", s);
      h += block("답장 속도 한눈에", table(["", "평균", "중간값", "1분 안", "5분 안", "30분 안"], [A(), B()].map(p => { const x = sp.reply[p]; return [who(p), num1(x.mean) + "분", num1(x.median) + "분", U.pct(x.in1, 1) + "%", U.pct(x.in5, 1) + "%", U.pct(x.in30, 1) + "%"]; }), [1, 2, 3, 4, 5]), "사람이 바뀌었고 간격이 60분 이하인 경우만 답장으로 셌어요.");
      h += block("달마다 답장 속도(중간값)", legend() + card(C.line({ labels: monthLabels(keys), tipLabels: keys.map(U.fmtDate), unit: "분", series: [{ name: A(), color: "var(--a)", values: keys.map(k => sp.monthlyReply[k][A()]) }, { name: B(), color: "var(--b)", values: keys.map(k => sp.monthlyReply[k][B()]) }] })));
      h += block("누가 먼저, 누가 마지막", tally([["먼저 연락(4시간 조용한 뒤)", sp.init[A()], sp.init[B()]], ["대화 마무리", sp.enders[A()], sp.enders[B()]], ["연달아 보내기", sp.doubles[A()], sp.doubles[B()]]]));
      h += tiles([["대화 묶음", num(sp.sessions) + "번", "30분 넘게 비면 새 대화"], ["한 번에 평균", num1(sp.avgSessionLen) + "개", "말풍선"], ["가장 긴 대화", num(sp.maxSession.n) + "개", `${U.fmtShort(sp.maxSession.date)} · ${num(sp.maxSession.minutes)}분`], ["가장 긴 침묵", num1(sp.longestSilence.hours) + "시간", `${U.fmtShort(sp.longestSilence.from)}, 다시 연 사람 ${sp.longestSilence.breaker}`]]);
      h += block("가장 길게 이어진 대화", scene(r.highlights.longestScene, "가장 긴 대화의 시작"));
      return h + concl(s);
    },
    love() {
      const r = state.r, L = r.love, s = state.sum.love;
      const keys = Object.keys(r.loveMonthly).sort();
      const names = { love: "사랑해", like: "좋아해", miss: "보고 싶어", cute: "예뻐·귀여워", thanks: "고마워", goodnight: "잘 자", goodmorning: "좋은 아침", kiss: "뽀뽀", hug: "안아 줘", care: "걱정·챙김", future: "결혼·미래" };
      let h = read("애정 표현", "마음을 얼마나 말로 꺼냈을까", s);
      h += block("열한 가지 애정 표현", legend() + tally(Object.keys(names).map(k => [names[k], L[k][A()], L[k][B()]])), "글 메시지에서 규칙 표의 단어가 들어간 말풍선 수예요.");
      h += block("달마다 사랑해", card(C.line({ labels: monthLabels(keys), tipLabels: keys.map(U.fmtDate), unit: "번", series: [{ name: "말풍선 1000개당", color: "var(--accent)", values: keys.map(k => r.loveMonthly[k]) }] })), "그 달 말풍선 1000개 중 사랑해가 몇 번 나왔는지예요.");
      const nk = r.nicknames;
      h += block("서로를 부르는 이름", nk.list.length ? table(["호칭", A(), B(), "자리 잡은 날"], nk.list.map(n => [`<b>${e(n.label)}</b>`, num(n[A()]), num(n[B()]), n.first ? U.fmtDate(n.first) : "-"]), [1, 2]) : `<p>8번 넘게 쓴 호칭은 없어요.</p>`, `"자리 잡은 날"은 14일 안에 5번 이상 쓰이기 시작한 날이에요. 이름으로 부른 횟수는 ${A()} ${num(nk.nameCalls[A()])}번, ${B()} ${num(nk.nameCalls[B()])}번이에요.`);
      const words = p => `<div class="card" style="display:grid;gap:8px"><p>${who(p)}의 말버릇</p><div class="chips">${r.words[p].slice(0, 12).map(w => `<span class="chip" data-tip="${e(w.w + " · " + num(w.c) + "번")}">${e(w.w)}</span>`).join("")}</div></div>`;
      h += block("말버릇", `<div class="duo" style="grid-template-columns:1fr">${words(A())}${words(B())}</div>`);
      if (r.firstFuture) h += block("처음 나온 미래 이야기", `<div class="quote ${r.firstFuture.who === A() ? "a" : "b"}">${r.firstFuture.text ? `<q>${e(r.firstFuture.text)}</q>` : ""}<span class="meta">${e(r.firstFuture.who)} · ${U.fmtDate(r.firstFuture.date)}</span></div>`);
      return h + concl(s);
    },
    routine() {
      const r = state.r, rt = r.routine, s = state.sum.routine;
      let h = read("하루 루틴", `서로의 하루, 처음과 끝 <span class="fun">재미용 추정</span>`, s);
      h += block("잠든 시간대", legend() + card(C.routine([A(), B()], rt.by)), "굵은 선은 마지막 메시지(취침)에서 첫 메시지(기상)까지, 옅은 상자는 날마다 달라지는 범위(25~75%)예요.");
      const row = p => { const x = rt.by[p]; if (!x || !x.ok) return [who(p), "기록 부족", "-", "-", "-"]; return [who(p), U.hm(x.wake.med), U.hm(x.sleep.med), x.weekday ? `${U.hm(x.weekday.wake)} / ${U.hm(x.weekday.sleep)}` : "-", x.weekend ? `${U.hm(x.weekend.wake)} / ${U.hm(x.weekend.sleep)}` : "-"]; };
      h += block("기상과 취침", table(["", "첫 메시지", "마지막 메시지", "평일", "주말"], [row(A()), row(B())]));
      const words = (p, k) => { const x = rt.by[p]; return x && x.ok && x[k].length ? x[k].map(w => `<span class="chip">${e(w.text)} <span class="num">${w.n}</span></span>`).join(" ") : "-"; };
      h += block("아침 첫마디, 잠들기 전 마지막 말", table(["", "아침 첫마디", "마지막 말"], [A(), B()].map(p => [who(p), words(p, "firstWords"), words(p, "lastWords")])));
      h += block("시간대마다 많이 하는 이야기", table(["시간대", "많은 이야기"], rt.slots.map(sl => [`${e(sl.label)} <span class="cap">${sl.from}~${sl.to}시</span>`, sl.top.length ? sl.top.map(t => `${e(t.name)} <span class="cap">(${num(t.n)}번, 평소의 ${num1(t.ratio)}배)</span>`).join("<br>") : "<span class=\"cap\">특별히 몰린 이야기 없음</span>"])));
      return h + concl(s);
    },
    balance() {
      const r = state.r, b = r.balance, s = state.sum.balance;
      let h = read("관계의 균형", "주고받는 마음의 무게", s);
      h += block("질문과 안부", legend() + tally([["질문", b.per[A()].questions, b.per[B()].questions], ["안부 질문", b.per[A()].askCare, b.per[B()].askCare]]));
      h += block("챙김 네 가지", tally(b.per[A()].care.map((c, i) => [c.label, c.n, b.per[B()].care[i].n])) + `<p class="cap">${b.per[A()].care.map(c => e(c.label) + ": " + e(c.ex)).join(" · ")}</p>`);
      h += tiles([["말투 닮음(처음 60일)", b.simFirst == null ? "-" : b.simFirst + "점", "100점 만점"], ["말투 닮음(마지막 60일)", b.simLast == null ? "-" : b.simLast + "점", "100점 만점"]]);
      if (b.spread.length) h += block("서로에게 번진 말", table(["말", "먼저 쓴 사람", "처음", "상대가 쓰기 시작", "합계"], b.spread.map(x => [`<b>${e(x.word)}</b>`, who(x.from), U.fmtShort(x.firstFrom), `${U.fmtShort(x.firstTo)} (${x.gapDays}일 뒤)`, num(x.total)]), [4]));
      h += block("서운함이 많은 시간", card(C.heat({ rows: b.heat.map(x => x.label), cols: U.WD, values: b.heat.map(x => x.per1000), tips: b.heat.map(x => x.per1000.map((v, i) => `${U.WD[i]}요일 ${x.label} · ${v == null ? "말풍선이 적어 계산 안 함" : `1000개당 ${num1(v)}번 (${x.n[i]}번)`}`)) })), "서운·속상·화났어 같은 말이 그 시간 말풍선 1000개당 몇 번인지예요. 짙을수록 많아요.");
      return h + concl(s);
    },
    life() {
      const r = state.r, l = r.life, s = state.sum.life;
      let h = read("일상 이야기", "우리의 평범한 하루들", s);
      if (l.foods.length) h += block("자주 이야기한 음식", legend() + tally(l.foods.map(f => [f.label, f.by[A()] || 0, f.by[B()] || 0])));
      h += block("대화 속 사람들", tally(l.people.map(x => [x.label, x.by[A()] || 0, x.by[B()] || 0])) + (l.thirdNames.length ? `<p class="cap">자주 나온 이름: ${l.thirdNames.map(x => `${e(x.name)} ${num(x.n)}번`).join(", ")} (실제 이름은 가렸어요)</p>` : ""));
      h += block("떨어져 있던 시기", l.trips.length ? table(["기간", "종류", "여행 단어", "하루 말풍선", "평소 대비"], l.trips.map(t => [`${U.fmtDate(t.from)} ~ ${U.fmtShort(t.to)}`, e(t.kind), num(t.words), num1(t.perDay), t.vsUsual + "%"]), [2, 3, 4]) : "<p>여행이나 출장 이야기가 몰린 시기를 찾지 못했어요.</p>", "여행·출장 단어가 하루 3번 넘게 나온 날을 묶은 거예요.");
      return h + concl(s);
    },
    mbti() {
      const r = state.r, s = state.sum.mbti;
      let h = read("MBTI", `카톡으로 본 우리 <span class="fun">재미용</span>`, s);
      const cardOf = p => { const m = r.mbti[p], col = p === A() ? "var(--a)" : "var(--b)"; return `<div class="card"><div>${who(p)}</div><div class="type">${e(m.type)}</div><div class="cap">확신도 ${m.confidence}% · 실제 검사와 다를 수 있어요</div>${m.axes.map(x => { const left = x.pick === x.a; const w = 50 * x.strength / 100; return `<div class="axis"><div class="bar"><b>${x.a}</b><div class="track"><i style="background:${col};${left ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}"></i></div><b>${x.b}</b></div><div class="why">${e(x.why)}</div></div>`; }).join("")}</div>`; };
      h += `<div class="mbti">${cardOf(A())}${cardOf(B())}</div>`;
      return h + concl(s);
    },
    conflict() {
      const r = state.r, c = r.conflict, s = state.sum.conflict;
      let h = read("싸움과 화해", "서운했던 날과 다시 가까워진 날", s);
      h += tiles([["갈등이 컸던 날", num(c.count) + "일", "두 사람 모두 서운함·미안함을 말한 날"], ["다음 날 회복", c.resolvedNextDayPct == null ? "-" : c.resolvedNextDayPct + "%", "다음 날 점수 3 미만"]]);
      if (c.topics.length) h += block(`무엇 때문에 <span class="fun">재미용 추정</span>`, table(["주제", "갈등일"], c.topics.map(t => [e(t.label), num(t.n) + "일"]), [1]), "갈등일 중 그 이야기가 3번 넘게 나온 날의 수예요.");
      if (c.makeup.length) h += block("화해하는 방법", table(["방법", "쓴 날"], c.makeup.map(m => [e(m.label), num(m.n) + "일"]), [1]));
      h += block("미안해와 먼저 사과", legend() + tally([["미안해", c.sorry[A()], c.sorry[B()]], ["갈등 뒤 먼저 사과", c.apologizedFirst[A()], c.apologizedFirst[B()]], ["걱정했어", c.worry[A()], c.worry[B()]]]));
      c.scenes.forEach((sc, i) => { h += scene(sc, i ? "또 다른 날" : "대표 장면"); });
      if (c.days.length) h += block("갈등이 컸던 날들", table(["날짜", "점수", "주제", "먼저 사과", "다음 날"], c.days.map(d => [U.fmtDate(d.date), num(d.s), d.topics.map(e).join(", ") || "-", d.apologizedFirst ? who(d.apologizedFirst) : "-", d.resolvedNextDay ? "괜찮아짐" : "이어짐"]), [1]));
      return h + concl(s);
    }
  };

  function storyBlock(b) {
    switch (b.type) {
      case "p": return b.letter ? `<p class="letter">${e(b.text)}</p>` : `<p>${e(b.text)}</p>`;
      case "aside": return `<p class="aside${b.big ? " big" : ""}">${e(b.text)}</p>`;
      case "lines": return `<div class="lines">${b.lines.map(l => `<p>${e(l)}</p>`).join("")}</div>`;
      case "scene": return scene(b, b.title);
      case "quote": return `<div class="quote ${b.who === A() ? "a" : "b"}"><q>${e(b.text)}</q><span class="meta"><b>${e(b.who)}</b> · ${U.fmtDate(b.date)}${b.note ? " · " + e(b.note) : ""}</span></div>`;
      case "stats": return tiles(b.items.map(i => [i.label, i.value, i.sub]));
      case "tally": return block(e(b.title), legend() + tally(b.rows));
      case "nicks": return block(e(b.title), `<div class="nicks">${b.items.map(n => `<div class="nick"><b>${e(n.label)}</b><span>${num(n.total)}번 · 주로 ${e(n.main)}</span>${n.first ? `<span>${U.fmtDate(n.first)}부터</span>` : ""}</div>`).join("")}</div>`);
      case "seasons": return `<div class="seasons">${b.items.map(s => `<div class="season"><h4>${s.year}년 ${s.season}</h4><span class="st">말풍선 ${num(s.msgs)} · 사랑해 ${num(s.love)} · ${num(s.chatDays)}일</span>${s.words.length ? `<div class="w">${s.words.map(w => `<span class="chip">${e(w)}</span>`).join("")}</div>` : ""}${s.quotes[0] ? `<span class="cap">“${e(s.quotes[0].text)}”</span>` : ""}</div>`).join("")}</div>`;
      case "duo": return `<div class="duo">${b.items.map(d => `<div><b>${who(d.who)}</b>${d.lines.map(l => `<span>${e(l)}</span>`).join("")}</div>`).join("")}</div>`;
      case "chart": { const r = state.r, keys = Object.keys(r.loveMonthly).sort(); return card(C.line({ labels: monthLabels(keys), tipLabels: keys.map(U.fmtDate), unit: "번", series: [{ name: "말풍선 1000개당 사랑해", color: "var(--accent)", values: keys.map(k => r.loveMonthly[k]) }] })); }
      default: return "";
    }
  }

  /* ---------- 이벤트 ---------- */
  document.addEventListener("click", ev => {
    const t = ev.target.closest("[data-go],[data-act],[data-jump],[data-guide],[data-rel],[data-me],a[data-nav]");
    if (!t) return;
    if (t.dataset.rel !== undefined) { rel = t.dataset.rel || null; render(); return; }
    if (t.dataset.go || t.dataset.nav) { ev.preventDefault(); const to = t.dataset.go || t.dataset.nav; if (to === "info") infoDraft = null; if (to !== route) go(to); else window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (t.dataset.jump) { ev.preventDefault(); const el = document.getElementById("ch-" + t.dataset.jump); if (el) el.scrollIntoView({ behavior: "smooth" }); return; }
    if (t.dataset.guide) { guideTab = t.dataset.guide; document.querySelectorAll("[data-guide]").forEach(b => b.setAttribute("aria-selected", b.dataset.guide === guideTab)); $("#steps").innerHTML = stepsHtml(); return; }
    if (t.dataset.me !== undefined) { const d = readInfoForm(); d.me = d.me === t.dataset.me ? null : t.dataset.me; render(); return; }
    const act = t.dataset.act;
    if (act === "back") back();
    else if (act === "sample") sample();
    else if (act === "hide-install") { hideInstall = true; render(); }
    else if (act === "nettest") runNetTest();
    else if (act === "info-save") {
      const d = readInfoForm();
      const olds = [A(), B()], news = d.names.map((n, i) => n || olds[i]);
      if (news[0] === news[1]) { infoErr = "두 사람 이름이 같으면 구분할 수 없어요. 다르게 적어 주세요."; render(); return; }
      if (CRUSH() && !d.me) { infoErr = "'나'를 골라 주세요. 그래야 그 사람의 신호를 볼 수 있어요."; render(); return; }
      infoErr = "";
      const map = {}; olds.forEach((o, i) => { if (news[i] !== o) map[o] = news[i]; });
      let mbti = d.mbti || {}, me = d.me || null;
      if (Object.keys(map).length) {
        mbti = Object.fromEntries(Object.entries(mbti).map(([k, v]) => [map[k] || k, v]));
        if (me && map[me]) me = map[me];
        renameAll(map);
      }
      infoDraft = null; applyInfo({ since: d.since || null, me, mbti }); go("home", true);
    }
    else if (act === "info-skip") { infoDraft = null; infoErr = ""; if (!state.info) { state.couple = Couple.make(state.r, {}); } go("home", true); }
    else if (act === "kakao" && !IN_APP) { setTimeout(() => flash("카카오톡이 열리지 않으면 직접 카카오톡을 열어 주세요."), 1500); }
    else if (act === "forget") { try { localStorage.removeItem(STORE); } catch (_) { /* 무시 */ } state = null; rel = null; go("home", true); setTimeout(() => flash("이 기기에 저장된 결과를 지웠어요."), 0); }
  });
  // 이름 칸을 다 쓰면(포커스 빠질 때) 아래 버튼·MBTI 이름도 바로 바뀌게
  document.addEventListener("change", ev => { if (ev.target.matches && ev.target.matches("[data-rename]") && route === "info") { readInfoForm(); render(); } });
  $("#file").addEventListener("change", ev => { if (ev.target.files.length) handle(ev.target.files); ev.target.value = ""; });
  let dragN = 0;
  document.addEventListener("dragenter", ev => { if ([...(ev.dataTransfer?.types || [])].includes("Files")) { ev.preventDefault(); dragN++; document.body.classList.add("dragging"); } });
  document.addEventListener("dragover", ev => ev.preventDefault());
  document.addEventListener("dragleave", () => { if (--dragN <= 0) { dragN = 0; document.body.classList.remove("dragging"); } });
  document.addEventListener("drop", ev => { ev.preventDefault(); dragN = 0; document.body.classList.remove("dragging"); if (ev.dataTransfer.files.length) handle(ev.dataTransfer.files); });

  // 툴팁 (data-tip)
  const tip = $("#tip");
  document.addEventListener("pointermove", ev => {
    if (ev.pointerType === "touch") return;
    const t = ev.target.closest && ev.target.closest("[data-tip]");
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.getAttribute("data-tip"); tip.hidden = false;
    const w = tip.offsetWidth, x = Math.min(ev.clientX + 12, window.innerWidth - w - 8);
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = (ev.clientY + 16) + "px";
  });
  document.addEventListener("pointerdown", ev => {
    const t = ev.target.closest && ev.target.closest("[data-tip]");
    if (!t || ev.pointerType !== "touch") { if (ev.pointerType === "touch") tip.hidden = true; return; }
    tip.textContent = t.getAttribute("data-tip"); tip.hidden = false;
    const w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(ev.clientX - w / 2, window.innerWidth - w - 8)) + "px"; tip.style.top = Math.max(8, ev.clientY - 52) + "px";
  });

  // 안드로이드 앱에서 공유로 받은 파일
  window.__nativeShare = list => {
    try {
      const files = list.map(x => { const bin = atob(x.data), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new File([u8], x.name, { type: x.type }); });
      handle(files);
    } catch (err) { flash("공유받은 파일을 열지 못했어요.", true); }
  };
  // PWA 공유(share_target)로 받은 파일
  async function inbox() {
    if (!/[?&]inbox=1/.test(location.search) || !window.caches) return;
    try {
      const cache = await caches.open("share-inbox"), reqs = await cache.keys(), files = [];
      for (const q of reqs) { const res = await cache.match(q); const blob = await res.blob(); files.push(new File([blob], decodeURIComponent(q.url.split("/").pop()), { type: blob.type })); await cache.delete(q); }
      if (files.length) handle(files);
    } catch (_) { /* 무시 */ }
  }

  // 시작: 이 기기에 저장된 결과가 있으면 홈, 없으면 시작 화면
  state = load();
  if (state && !state.r) state = null;
  if (state && state.rel === "friend" && window.Friend) { try { state.friend = Friend.make(state.r, { since: state.info && state.info.since, me: state.info && state.info.me }); } catch (_) { state = null; } }
  if (state && state.rel === "crush" && state.info && state.info.me && window.Crush) { try { state.crush = Crush.make(state.r, state.info.me, { likeSince: state.info.since }); } catch (_) { state.crush = null; } }
  if (state && state.r && !state.r.days) state.couple = null; // v10 이전 결과: 사귄 날 분석은 대화를 다시 불러와야 함
  if (state) rel = state.rel || "love";
  render();
  inbox();
})();
