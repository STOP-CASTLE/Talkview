/* 탭마다 "한눈에 읽기" 줄글과 "이 코너의 결론" — 숫자를 해석해 만든다 (CLAUDE.md 7장) */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"));
  else root.Summary = factory(root.U);
})(this, function (U) {
  "use strict";
  const { num, num1, iga, eunneun, gwawa, fmtDate, fmtShort, hm, pct, WD } = U;
  const p = x => Math.round(x * 100) + "%";

  function summary(r, adv) {
    const [A, B] = r.people, ov = r.overview, sp = r.speed, out = {};

    /* 대화 빈도 */
    {
      const ratio = ov.chatDays / ov.span, more = ov.byWho[A] >= ov.byWho[B] ? A : B;
      const wdMax = r.weekday.indexOf(Math.max(...r.weekday)), hMax = r.hourly.indexOf(Math.max(...r.hourly));
      const top = r.topDays[0];
      out.freq = {
        intro: [
          `두 사람은 ${fmtDate(ov.first)}부터 ${fmtDate(ov.last)}까지 ${num(ov.span)}일 동안 말풍선 ${num(ov.total)}개를 주고받았어요. 그중 대화가 있었던 날은 ${num(ov.chatDays)}일로, ${ratio >= 0.95 ? "거의 매일 이야기를 나눈 셈이에요" : `열흘 중 ${Math.round(ratio * 10)}일은 이야기를 나눈 셈이에요`}.`,
          `하루 평균 ${num(ov.avgPerDay)}개씩, ${A} ${num(ov.byWho[A])}개, ${B} ${num(ov.byWho[B])}개로 ${Math.abs(ov.byWho[A] - ov.byWho[B]) / ov.total < 0.1 ? "거의 반반 나눠 말했어요" : eunneun(more) + " 조금 더 많이 말했어요"}. 가장 오래 매일 이어진 대화는 ${num(ov.longestStreak)}일이에요.`,
          `가장 수다스러운 요일은 ${WD[wdMax]}요일, 가장 바쁜 시간은 ${hMax}시대예요. ${top ? `제일 말이 많았던 날은 ${fmtDate(top.date)}, 하루에 ${num(top.total)}개나 오갔어요.` : ""}`
        ],
        conclusion: ratio >= 0.9 ? "거의 매일 서로의 하루에 들어가 있는 두 사람이에요. 대화가 끊기지 않는다는 건, 서로가 일상의 기본값이 되었다는 뜻이에요."
          : ratio >= 0.6 ? "자주, 꾸준히 이어지는 대화예요. 조용한 날이 있어도 다시 이어지는 리듬이 두 사람답게 자리 잡았어요."
            : "매일은 아니어도, 이야기할 땐 마음을 담아 나누는 두 사람이에요. 대화가 없는 날이 꼭 멀어진 날은 아니에요."
      };
    }

    /* 답장 속도 */
    {
      const ra = sp.reply[A], rb = sp.reply[B];
      const fast = (ra.median ?? 99) <= (rb.median ?? 99) ? A : B;
      const ini = sp.init[A] + sp.init[B] || 1;
      out.speed = {
        intro: [
          `답장 속도는 중간값으로 ${A} ${num1(ra.median)}분, ${B} ${num1(rb.median)}분이에요. 카톡 기록은 분 단위라, 같은 분에 온 답장은 0분으로 셌어요.`,
          `5분 안에 돌아온 답장은 ${A} ${p(ra.in5)}, ${B} ${p(rb.in5)}예요. ${Math.abs(ra.in5 - rb.in5) < 0.05 ? "둘의 속도가 신기할 만큼 비슷해요." : iga(fast) + " 조금 더 빨리 달려오는 편이에요."}`,
          `4시간 넘게 조용하다가 먼저 말을 건 건 ${A} ${pct(sp.init[A], ini)}%, ${B} ${pct(sp.init[B], ini)}%예요. 30분 넘게 끊기지 않은 대화 한 번에 평균 ${num1(sp.avgSessionLen)}개의 말풍선이 오갔고, 가장 길었던 대화는 ${fmtDate(sp.maxSession.date)}의 ${num(sp.maxSession.n)}개예요.`
        ],
        conclusion: (ra.in5 + rb.in5) / 2 >= 0.7 ? "서로의 메시지를 오래 기다리게 두지 않는 두 사람이에요. 빠른 답장은 '지금 너에게 집중하고 있어'라는 작은 신호예요."
          : "답장이 조금 느린 날도 있지만, 결국 다시 돌아와 이어지는 대화예요. 속도보다 꾸준함이 두 사람의 방식이에요."
      };
    }

    /* 애정 표현 */
    {
      const L = r.love, fl = r.firstSay.love, rep = r.firstLoveReply;
      const lv = L.love, more = lv[A] >= lv[B] ? A : B;
      const trendUp = r.loveTrend.second >= r.loveTrend.first;
      const nick = r.nicknames.list[0];
      out.love = {
        intro: [
          `"사랑해"는 모두 ${num(lv.total)}번 나왔어요. ${A} ${num(lv[A])}번, ${B} ${num(lv[B])}번으로 ${Math.abs(lv[A] - lv[B]) <= lv.total * 0.1 ? "둘이 거의 똑같이 말했어요" : eunneun(more) + " 조금 더 자주 말했어요"}. 보고 싶다는 말은 ${num(L.miss.total)}번, 고맙다는 말은 ${num(L.thanks.total)}번이에요.`,
          fl ? `처음 "사랑해"는 ${fmtDate(fl.date)}, ${iga(fl.who)} 먼저 꺼냈어요.${rep ? ` ${eunneun(rep.who)} ${rep.minutes ? rep.minutes + "분 만에" : "바로"} "${rep.text}"라고 답했어요.` : ""}` : "아직 대화 속에서 \"사랑해\"를 찾지 못했어요. 다른 말로 마음을 전하고 있을지도 몰라요.",
          `기간 전반과 후반을 나눠 보면 사랑해는 말풍선 1000개당 ${num1(r.loveTrend.first)}번에서 ${num1(r.loveTrend.second)}번으로 ${trendUp ? "오히려 늘었어요" : "조금 줄었어요"}. ${nick ? `가장 많이 부른 호칭은 "${nick.label}"(${num(nick.total)}번)이에요.` : ""}`
        ],
        conclusion: trendUp ? "시간이 지날수록 표현이 더 짙어진 사랑이에요. 익숙해져도 말로 아끼지 않는 건 쉽지 않은 일이에요."
          : "처음만큼 자주 말하진 않아도, 그 자리를 다른 말과 행동이 채우고 있을 거예요. 오늘 한 번 더 말해 주는 것도 좋아요."
      };
    }

    /* 하루 루틴 */
    {
      const ra = r.routine.by[A], rb = r.routine.by[B];
      const line = (n, x) => x && x.ok ? `${eunneun(n)} 보통 ${hm(x.wake.med)}쯤 첫 메시지를 보내고, ${hm(x.sleep.med)}쯤 마지막 인사를 해요.` : `${eunneun(n)} 아침·밤 기록이 부족해서 아직 추정하지 못했어요.`;
      const slots = r.routine.slots.filter(s => s.top.length);
      out.routine = {
        intro: [
          `카톡의 첫 메시지와 마지막 메시지로 두 사람의 하루를 그려 봤어요(재미용 추정이에요). ${line(A, ra)} ${line(B, rb)}`,
          ra && ra.ok && ra.weekday && ra.weekend ? `${A}의 주말 첫 메시지는 평일보다 ${Math.round((ra.weekend.wake - ra.weekday.wake) / 60 * 10) / 10}시간 ${ra.weekend.wake >= ra.weekday.wake ? "늦어요" : "빨라요"}. 아침 첫마디로는 "${ra.firstWords[0] ? ra.firstWords[0].text : "-"}"를 가장 자주 썼어요.` : "주말과 평일을 나눠 보기엔 아직 기록이 조금 부족해요.",
          slots.length ? `시간대별로 보면 ${slots.slice(0, 3).map(s => `${s.label}엔 ${s.top[0].name}`).join(", ")} 이야기가 특히 많아요. 서로의 하루가 시간 따라 대화에 그대로 묻어나요.` : "시간대별로 특별히 몰리는 이야기는 아직 보이지 않아요."
        ],
        conclusion: "눈 뜨자마자, 잠들기 직전에 서로를 찾는다는 건 하루의 처음과 끝을 함께 쓰고 있다는 뜻이에요."
      };
    }

    /* 관계의 균형 */
    {
      const b = r.balance, pa = b.per[A], pb = b.per[B];
      const careA = pa.care.reduce((s, c) => s + c.n, 0), careB = pb.care.reduce((s, c) => s + c.n, 0);
      out.balance = {
        intro: [
          `질문은 ${A}의 글 중 ${p(pa.qRatio)}, ${B}의 글 중 ${p(pb.qRatio)}예요. 그중 밥은 먹었는지, 잘 잤는지 묻는 안부 질문이 ${A} ${num(pa.askCare)}번, ${B} ${num(pb.askCare)}번이에요.`,
          `걱정하고, 맞춰 주고, 응원하는 말은 ${A} ${num(careA)}번, ${B} ${num(careB)}번이에요. ${Math.abs(careA - careB) / Math.max(1, careA + careB) < 0.15 ? "챙김이 한쪽으로 기울지 않았어요." : (careA > careB ? A : B) + "의 챙김이 조금 더 많아요."}`,
          b.simFirst != null && b.simLast != null ? `말투 닮음은 처음 60일 ${b.simFirst}점에서 마지막 60일 ${b.simLast}점이에요.${b.spread.length ? ` "${b.spread[0].word}"처럼 한 사람이 먼저 쓰고 상대에게 번진 말도 ${b.spread.length}개 찾았어요.` : ""}` : "말투를 비교하기엔 아직 대화가 조금 짧아요."
        ],
        conclusion: b.simLast >= b.simFirst ? "같이 지낸 시간만큼 말투가 서로를 닮아 갔어요. 주고받는 마음의 무게도 고르게 나뉘어 있어요."
          : "두 사람은 각자의 말투를 지키면서도 서로를 챙기는 방식으로 균형을 맞추고 있어요."
      };
    }

    /* 일상 */
    {
      const l = r.life, f = l.foods[0], fam = l.people.find(x => x.label === "가족");
      out.life = {
        intro: [
          `글의 ${p(l.mealRatio)}가 밥, 간식, 맛집 같은 먹는 이야기예요. ${f ? `가장 자주 등장한 음식은 ${f.label}(${num(f.total)}번)${l.foods[1] ? ", 그다음은 " + U.ieyo(l.foods[1].label) : "이에요"}.` : ""}`,
          `${(() => { const t = l.people.filter(x => x.total).sort((a, b) => b.total - a.total).slice(0, 2); return t.length ? `대화 속 사람들 중에선 ${t.map(x => `${x.label}(${num(x.total)}번)`).join(", ")} 이야기가 가장 많아요` : "대화 속에 특별히 자주 나온 사람은 없어요"; })()}.${fam && fam.total ? " 서로의 가족 이야기까지 나누는 사이예요." : ""}`,
          l.trips.length ? `여행·출장 이야기가 몰린 시기는 ${l.trips.length}번이에요. ${l.trips.map(t => `${fmtShort(t.from)}~${fmtShort(t.to)}`).slice(0, 3).join(", ")} 무렵, 그때 대화량은 평소의 ${l.trips[0].vsUsual}%였어요.` : "여행이나 출장 이야기가 몰린 시기는 아직 찾지 못했어요."
        ],
        conclusion: "사랑은 큰 이벤트보다 '점심 뭐 먹었어?' 같은 작은 질문 사이에서 자라요. 두 사람의 일상이 대화 속에 촘촘히 담겨 있어요."
      };
    }

    /* MBTI */
    {
      const ma = r.mbti[A], mb = r.mbti[B];
      out.mbti = {
        intro: [
          `카톡 말투로 본 재미용 MBTI예요. ${eunneun(A)} ${ma.type}(확신도 ${ma.confidence}%), ${eunneun(B)} ${mb.type}(확신도 ${mb.confidence}%)로 나왔어요.`,
          `먼저 연락하는 비율과 하루 대화량으로 E/I를, 미래·상상 이야기와 일상 이야기로 N/S를, 감정 표현으로 F/T를, 생활 리듬과 약속 이야기로 J/P를 가늠했어요.`,
          `실제 성격 검사와는 다를 수 있어요. 대화에 드러난 모습만 본 거라, 웃으면서 맞는지 서로 이야기해 보는 용도로 봐 주세요.`
        ],
        conclusion: ma.type === mb.type ? "둘이 같은 유형으로 나왔어요. 대화 속에서 이미 서로 닮아 있다는 뜻일지도 몰라요."
          : `${ma.type.split("").filter((c, i) => c === mb.type[i]).length}개 글자가 같고 나머지는 달라요. 다른 부분이 서로를 채워 주고 있을 거예요.`
      };
    }

    /* 싸움과 화해 */
    {
      const c = r.conflict;
      out.conflict = {
        intro: c.days.length ? [
          `서운한 말과 미안하다는 말이 두 사람 모두에게서 몰렸던 날은 ${num(c.count)}일이에요. 전체 대화일 ${num(ov.chatDays)}일 중 ${Math.max(1, Math.round(c.count / ov.chatDays * 1000) / 10)}%예요.`,
          c.topics.length ? `그런 날 주로 나온 이야기는 ${c.topics.slice(0, 2).map(t => t.label).join("과 ")}예요(재미용 추정). 대부분의 갈등이 마음이 아니라 상황에서 시작됐어요.` : "갈등이 있던 날의 주제는 뚜렷하게 하나로 모이지 않았어요.",
          `${c.makeup.length ? `화해할 땐 ${c.makeup.slice(0, 2).map(m => m.label).join(", ")}이 가장 많았어요. ` : ""}${c.resolvedNextDayPct != null ? `그리고 갈등의 ${c.resolvedNextDayPct}%는 다음 날이면 잠잠해졌어요.` : ""}`
        ] : [
          "두 사람 모두에게서 서운한 말이 몰린 날을 찾지 못했어요.",
          `미안하다는 말은 ${A} ${num(c.sorry[A])}번, ${B} ${num(c.sorry[B])}번이에요.`,
          "작은 서운함은 있어도 크게 부딪힌 날은 드문 두 사람이에요."
        ],
        conclusion: c.resolvedNextDayPct >= 70 || !c.days.length ? "다투지 않는 사이보다, 다툰 뒤 금방 돌아오는 사이가 더 단단해요. 두 사람은 돌아오는 길을 잘 알고 있어요."
          : "화해까지 시간이 걸리는 날도 있었지만, 결국 다시 이어졌어요. 다음엔 조금 더 빨리 '나도 미안해'를 건네 봐요."
      };
    }

    /* 더 사랑하려면 */
    {
      const n = adv.items.length;
      out.advice = {
        intro: adv.comparable ? [
          `최근 90일과 그 이전을 비교해서, 변한 것과 지켜진 것을 찾아봤어요. 다른 커플이 아니라 두 사람의 지난 모습과만 비교했어요.`,
          adv.good.length ? `잘하고 있는 점이 ${adv.good.length}가지 보여요. 예를 들면 ${adv.good.slice(0, 2).map(g => `'${g.title}'`).join(", ")} 같은 것들이에요.` : "이전과 비교해 크게 달라진 좋은 점은 아직 뚜렷하지 않아요.",
          n ? `조금 더 신경 쓰면 좋을 부분은 ${n}가지예요. 먼저 살펴볼 세 가지를 아래 맨 위에 모아 뒀어요.` : "지금 흐름을 그대로 이어 가면 될 만큼 안정적이에요."
        ] : [adv.note, `대신 늘 도움이 되는 일반적인 조언 몇 가지를 남겨 둘게요.`],
        conclusion: n ? "숫자가 줄었다고 마음이 줄어든 건 아니에요. 다만 마음은 표현될 때 더 잘 전해지니까, 작은 것 하나부터 시작해 봐요."
          : "지금처럼만 서로를 챙기면 충분해요. 가끔 이 페이지를 다시 열어 두 사람의 리듬을 확인해 보세요."
      };
    }
    return out;
  }
  return { summary };
});
