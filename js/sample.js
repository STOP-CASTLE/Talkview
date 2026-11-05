/* 샘플 대화 생성기 — 실제 사람 아님. 가상의 두 사람(김가온, 이나래)의 안드로이드 형식 내보내기 txt를 만든다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Sample = factory();
})(this, function () {
  "use strict";
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function make() {
    const R = rng(20250110), pick = a => a[Math.floor(R() * a.length)], chance = p => R() < p;
    const A = "김가온", B = "이나래";
    const lines = ["김가온 님과 카카오톡 대화", "저장한 날짜 : 2026. 11. 2. 오전 9:00", ""];
    const start = new Date(2025, 0, 10), end = new Date(2026, 10, 1);
    const fmt = (d, who, text) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours() < 12 ? "오전" : "오후"} ${d.getHours() % 12 === 0 ? 12 : d.getHours() % 12}:${String(d.getMinutes()).padStart(2, "0")}, ${who} : ${text}`;
    let dayN = 0;
    const FOODS = ["치킨", "떡볶이", "김치찌개", "파스타", "삼겹살", "마라탕", "초밥", "국밥", "샐러드", "커피", "라떼", "케이크", "햄버거", "칼국수"];
    const tripDays = new Set();
    [[120, 123, "여행"], [260, 264, "출장"], [400, 404, "여행"]].forEach(([a, b]) => { for (let d = a; d <= b; d++) tripDays.add(d); });
    const conflictDays = new Set([70, 95, 140, 188, 230, 290, 333, 370, 420, 455, 500, 540, 580, 610, 640]);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), dayN++) {
      const late = dayN > 570; // 최근 석 달은 조금 뜸해짐
      if (chance(late ? 0.08 : 0.03) && !conflictDays.has(dayN)) continue;
      const formal = dayN < 25, couple = dayN >= 42, nickA = dayN >= 60 ? "자기야" : "";
      const nickB = dayN >= 75 ? "애기야" : "";
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const out = [];
      let t = new Date(d); t.setHours(weekend ? 9 : 7, Math.floor(R() * 50), 0, 0);
      const say = (who, text, gapMin) => { t = new Date(t.getTime() + (gapMin == null ? 1 + Math.floor(R() * 6) : gapMin) * 60000); out.push(fmt(t, who, text)); };
      const first = chance(0.55) ? A : B, other = first === A ? B : A;
      // 아침
      if (formal) { say(first, pick(["좋은 아침이에요", "일어나셨어요?", "출근 잘 하고 계세요?"]), 0); say(other, pick(["네 좋은 아침이에요 ㅎㅎ", "방금 일어났어요", "네 지하철이에요"])); }
      else { say(first, pick(["굿모닝", "일어났어?", "잘 잤어?", "좋은 아침 " + (first === A ? nickA : nickB)]), 0); say(other, pick(["응 방금 깼어", "굿모닝 ㅎㅎ", "잘 잤어! 너는?", "일어났어 졸려 ㅠㅠ"])); }
      if (!weekend) { say(first, pick(["출근 중이야", "버스 탔어", "지하철 사람 많다", "회사 도착"]), 20 + Math.floor(R() * 30)); say(other, pick(["조심히 가", "나도 가는 중", "오늘도 파이팅!", "화이팅"])); }
      // 점심
      t.setHours(12, Math.floor(R() * 30));
      const f = pick(FOODS);
      say(A, pick(["점심 뭐 먹어?", "밥 먹었어?", "배고파"]), 0);
      say(B, pick([`${f} 먹을 거야`, `오늘은 ${f}!`, `${f} 먹었어 맛있었어`]));
      say(A, pick(["오 맛있겠다 ㅋㅋ", `나도 ${f} 먹고 싶다`, "맛있게 먹어"]));
      if (chance(0.4)) say(B, "사진", 2);
      if (chance(0.3)) say(A, "이모티콘", 1);
      // 오후 잡담
      const nTalk = (late ? 6 : 12) + Math.floor(R() * (weekend ? 30 : 18));
      t.setHours(15, Math.floor(R() * 40));
      for (let i = 0; i < nTalk; i++) {
        const who = chance(0.52) ? A : B;
        const pool = formal ? ["오늘 날씨 좋네요", "회의가 길어지네요 ㅎㅎ", "주말에 뭐 하세요?", "그 영화 보셨어요?", "저도 그거 좋아해요"] :
          ["ㅋㅋㅋㅋ", "진짜?", "헐 대박", "보고싶다", "뭐해?", "회의 끝났다", "팀장님이 또 야근하래 ㅠㅠ", "민수씨가 오늘 커피 사줬어", "주말에 같이 영화 보자", "그거 귀엽다 ㅋㅋ", "오늘 너무 피곤해", "고마워 " + (who === A ? nickA : nickB), "다음에 같이 가자", "웅웅", "알겠어!", "그치 ㅋㅋ", "퇴근하고 뭐 먹을래?", "엄마가 반찬 보내주셨어", "강아지 산책 시켰어", "너무 예뻐", "오늘 데리러 와줘서 고마워", "너랑 있으면 시간이 너무 빨리 가", "벌써 보고싶다 내일 빨리 와라", "오늘 입은 옷 너무 예뻤어", "힘든 날 옆에 있어줘서 고마워", "네 목소리 들으니까 좋다", "우리 처음 만난 날 생각난다", "오늘따라 더 보고싶어", "케이크 사다줘서 고마워 감동이야", "눈 오니까 너 생각나", "바다 보니까 같이 오고 싶다", "벚꽃 피면 꼭 같이 보러 가자"];
        say(who, pick(pool), chance(0.15) ? 30 + Math.floor(R() * 60) : null);
      }
      if (tripDays.has(dayN)) { ["여행 와서 너무 좋다", "호텔 체크인 했어", "공항 도착!", "숙소 뷰 봐봐", "비행기 곧 타"].forEach((x, i) => say(i % 2 ? B : A, x)); say(A, "사진 3장"); }
      if (chance(late ? 0.05 : 0.15)) say(pick([A, B]), `보이스톡 ${String(5 + Math.floor(R() * 50)).padStart(2, "0")}:${String(Math.floor(R() * 60)).padStart(2, "0")}`, 10);
      if (dayN === 300) say(B, "우리 나중에 결혼하면 강아지 키우자");
      if (dayN === 30) { say(A, "오늘 정말 즐거웠어요"); say(B, "저도요 ㅎㅎ 다음에 또 봐요"); }
      if (dayN === 35) { say(B, "벌써 보고싶어요"); say(A, "저도 보고 싶어요 ㅎㅎ"); }
      // 갈등
      if (conflictDays.has(dayN)) {
        t.setHours(20, 10);
        say(B, pick(["오늘 연락 왜 안 했어?", "답장 너무 늦는 거 아니야?", "약속 시간 또 늦었잖아"]), 0);
        say(A, "회사 일 때문에 바빴어 미안");
        say(B, "서운해 진짜");
        say(A, "화났어? 내가 잘못했어");
        say(B, "속상하다 연락이라도 해주지");
        say(A, "미안해 다음엔 꼭 연락할게");
        say(B, "나도 미안 짜증내서");
        say(A, "전화할까?");
        say(B, "응 전화해줘", 2);
        say(A, `보이스톡 ${12 + Math.floor(R() * 30)}:${String(Math.floor(R() * 60)).padStart(2, "0")}`, 3);
        say(B, "이해해줘서 고마워", 30);
        say(A, "사랑해 화 풀어서 다행이다");
      }
      // 밤
      t.setHours(22 + (chance(0.4) ? 1 : 0), Math.floor(R() * 50));
      if (formal) { say(A, "오늘 하루도 수고하셨어요", 0); say(B, "가온씨도요 푹 쉬세요"); }
      else {
        say(first, pick(["오늘 하루 어땠어?", "피곤하다", "누워있어"]), 0);
        say(other, pick(["좋았어 너는?", "나도 누웠어", "넷플 보는 중"]));
        if (couple) { say(A, pick(["잘자 사랑해", "잘자 " + nickA, "좋은 꿈 꿔"])); say(B, pick(["나두 사랑해", "잘자 사랑해", "나도 잘자"])); }
        else { say(A, "잘 자요"); say(B, "잘 자요 내일 봐요"); }
      }
      if (dayN === 42) { t.setHours(23, 40); say(A, "나래야 사랑해", 0); say(B, "히히 나도 사랑해", 3); }
      lines.push(...out);
    }
    return lines.join("\n");
  }

  /* 짝사랑 샘플(v17) — 가상의 두 사람: 박서윤(나), 최도현(그 사람). 4개월, 존댓말→반말,
     처음엔 서윤이 주로 먼저 연락하다가 갈수록 도현도 먼저 연락하고 답장도 빨라지는 흐름. */
  function makeCrush() {
    const R = rng(20260601), pick = a => a[Math.floor(R() * a.length)], chance = p => R() < p;
    const ME = "박서윤", TH = "최도현";
    const lines = ["최도현 님과 카카오톡 대화", "저장한 날짜 : 2026. 11. 1. 오후 11:00", ""];
    const start = new Date(2026, 5, 2), end = new Date(2026, 9, 31);
    const fmt = (d, who, text) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours() < 12 ? "오전" : "오후"} ${d.getHours() % 12 === 0 ? 12 : d.getHours() % 12}:${String(d.getMinutes()).padStart(2, "0")}, ${who} : ${text}`;
    let n = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), n++) {
      const prog = n / 150; // 0 → 1
      if (!chance(0.45 + prog * 0.4)) continue;
      const formal = n < 18;
      let t = new Date(d); t.setHours(12 + Math.floor(R() * 10), Math.floor(R() * 60), 0, 0);
      const out = [];
      const say = (who, text, gap) => { t = new Date(t.getTime() + (gap == null ? 1 + Math.floor(R() * 4) : gap) * 60000); out.push(fmt(t, who, text)); };
      const thFirst = chance(0.12 + prog * 0.35), a = thFirst ? TH : ME, b = thFirst ? ME : TH;
      const thGap = () => Math.max(0, Math.round((1 - prog) * (3 + R() * 25) + R() * 4));
      const open = formal ? ["안녕하세요!", "오늘 수업 어떠셨어요?", "혹시 과제 끝내셨어요?", "주말 잘 보내셨어요?"] : ["뭐 해?", "오늘 뭐 했어?", "이거 봤어? ㅋㅋ", "점심 뭐 먹었어?", "퇴근했어?", "오늘 날씨 진짜 좋다"];
      say(a, pick(open), 0);
      say(b, pick(formal ? ["네 안녕하세요 ㅎㅎ", "저 방금 끝났어요", "아직이요 ㅠㅠ"] : ["방금 끝났어 ㅎㅎ", "ㅋㅋㅋ 봤어", "나 김치찌개!", "응 이제 집 가는 중"]), b === TH ? thGap() : null);
      const k = 3 + Math.floor(R() * (6 + prog * 14));
      for (let i = 0; i < k; i++) {
        const who = chance(0.58 - prog * 0.08) ? ME : TH;
        const pool = formal
          ? ["그 영화 보셨어요?", "저도 그거 좋아해요 ㅎㅎ", "오늘 날씨 좋네요", "주말에 뭐 하세요?", "아 진짜요? ㅋㅋ", "고마워요!", "재밌었어요 ㅎㅎ"]
          : who === ME
            ? ["ㅋㅋㅋㅋ", "진짜?", "오늘 좀 피곤해", "그거 나도 좋아해!", "다음에 같이 가 볼래?", "주말에 뭐 해?", "고마워 ㅎㅎ", "너는 요즘 뭐가 제일 재밌어?", "헐 대박", "그 노래 계속 듣고 있어", "잘 자!"]
            : (prog > 0.5
              ? ["ㅋㅋㅋ 너 진짜 웃기다", "너는 오늘 어땠어?", "주말에 영화 볼래?", "그 카페 가 봤어?", "ㅋㅋㅋㅋ", "응응", "오늘 좀 바빴어", "그치", "내일 시간 돼?", "잘 자", "너는 뭐 좋아해?", "오 좋다", "피곤하다 ㅠ", "고마워"]
              : ["ㅋㅋㅋ", "그치", "응응", "오 진짜?", "나도 그거 봤어", "피곤하다", "ㅇㅇ", "ㅋㅋ 그러게", "바빠서 이제 봤어"]);
        say(who, pick(pool), who === TH ? thGap() : null);
        if (chance(0.06)) say(who, "이모티콘", 1);
      }
      if (chance(0.04 + prog * 0.06)) say(pick([ME, TH]), `보이스톡 ${String(5 + Math.floor(R() * 40)).padStart(2, "0")}:${String(Math.floor(R() * 60)).padStart(2, "0")}`, 20);
      if (n === 95) { say(TH, "이번 주 토요일에 시간 돼? 같이 전시 보러 갈래?", 0); say(ME, "좋아!! 몇 시?"); say(TH, "2시 어때"); }
      lines.push(...out);
    }
    return lines.join("\n");
  }


  /* 친구 샘플(v18) — 가상의 두 사람: 김하준, 정민서. 1년, ㅋㅋ 많음, 시험·게임·맛집·약속. */
  function makeFriend() {
    const R = rng(20251001), pick = a => a[Math.floor(R() * a.length)], chance = p => R() < p;
    const A = "김하준", B = "정민서";
    const lines = ["정민서 님과 카카오톡 대화", "저장한 날짜 : 2026. 11. 1. 오후 10:00", ""];
    const start = new Date(2025, 9, 3), end = new Date(2026, 9, 31);
    const fmt = (d, who, text) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours() < 12 ? "오전" : "오후"} ${d.getHours() % 12 === 0 ? 12 : d.getHours() % 12}:${String(d.getMinutes()).padStart(2, "0")}, ${who} : ${text}`;
    let n = 0;
    const FOOD = ["마라탕", "떡볶이", "치킨", "국밥", "햄버거", "초밥", "삼겹살"];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1), n++) {
      const late = n > 300;
      if (!chance(late ? 0.35 : 0.55)) continue;
      let t = new Date(d); t.setHours(13 + Math.floor(R() * 9), Math.floor(R() * 60), 0, 0);
      const out = [], say = (who, text, gap) => { t = new Date(t.getTime() + (gap == null ? 1 + Math.floor(R() * 5) : gap) * 60000); out.push(fmt(t, who, text)); };
      const a = chance(0.62) ? A : B, b = a === A ? B : A;
      say(a, pick(["야", "뭐해", "ㅋㅋㅋㅋ 이거 봐", "오늘 시험 망함", "겜 ㄱ?", "배고프다", "나 오늘 진짜 웃긴 일 있었음"]), 0);
      say(b, pick(["ㅋㅋㅋㅋㅋ 뭔데", "왜", "ㄱㄱ", "ㅋㅋㅋ 나도", "헐 괜찮아?", "ㅋㅋㅋㅋ 미쳤다"]));
      const k = 4 + Math.floor(R() * 14);
      for (let i = 0; i < k; i++) {
        const who = chance(0.53) ? A : B;
        say(who, pick(["ㅋㅋㅋㅋㅋㅋ", "ㄹㅇ", "아 진짜 웃기네 ㅋㅋ", "인정", "그거 완전 너잖아 ㅋㅋㅋ", "오늘 과제 언제 끝나냐", "팀플 개힘듦", "시험 잘 봐!", "고마워 ㅋㅋ", "ㅋㅋㅋ 뭐래", "아 졸려", "나 오늘 늦잠 잠", `오늘 ${pick(FOOD)} 먹음`, `${pick(FOOD)} 먹으러 가자`, "주말에 만날래?", "ㅇㅋ", "그건 좀 ㅋㅋ", "ㅎㅎ", "웅", "이따 전화할게", "엄마가 너 안부 묻더라", "ㅋㅋㅋ 개웃겨"]), chance(0.1) ? 20 + Math.floor(R() * 40) : null);
      }
      if (chance(0.05)) say(pick([A, B]), `보이스톡 ${String(3 + Math.floor(R() * 40)).padStart(2, "0")}:${String(Math.floor(R() * 60)).padStart(2, "0")}`, 15);
      if (n === 200) { say(B, "생일 축하해!! 🎂", 0); say(A, "ㅋㅋㅋ 고마워 역시 너밖에 없다"); }
      lines.push(...out);
    }
    return lines.join("\n");
  }

  return { make, makeCrush, makeFriend };
});
