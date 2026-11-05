/* SVG 차트 — 직접 만든 SVG 문자열. 색은 CSS 토큰(--a, --b, --accent …), 툴팁은 data-tip */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./util.js"));
  else root.Charts = factory(root.U);
})(this, function (U) {
  "use strict";
  const e = U.esc;
  const W = 640;
  function nice(max) {
    if (max <= 0) return { max: 1, step: 1 };
    const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
    return { max: Math.ceil(max / step) * step, step };
  }
  const fmtTick = v => v >= 1000 ? (v / 1000).toLocaleString("ko-KR") + "천" : (Math.round(v * 10) / 10).toLocaleString("ko-KR");
  function frame(h, body, label) { return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img" aria-label="${e(label || "차트")}" preserveAspectRatio="xMidYMid meet">${body}</svg>`; }
  function yAxis(sc, top, bottom, left) {
    let s = "";
    for (let v = 0; v <= sc.max + 1e-9; v += sc.step) {
      const y = bottom - (v / sc.max) * (bottom - top);
      s += `<line x1="${left}" x2="${W - 8}" y1="${y}" y2="${y}" class="grid"/><text x="${left - 6}" y="${y + 4}" class="tick" text-anchor="end">${fmtTick(v)}</text>`;
    }
    return s;
  }
  function xLabels(labels, x, y, every) {
    return labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && l ? `<text x="${x(i)}" y="${y}" class="tick" text-anchor="middle">${e(l)}</text>` : "").join("");
  }
  // 4px 둥근 끝, 바닥에 붙은 막대 경로
  function barPath(x, y, w, h, r) {
    if (h <= 0) return "";
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  // 사람별로 쌓은 막대 (월별 말풍선 등)
  function stacked({ labels, a, b, names, tipLabels, unit = "개", h = 240 }) {
    const top = 14, bottom = h - 26, left = 44;
    const sc = nice(Math.max(...labels.map((_, i) => a[i] + b[i]), 1));
    const n = labels.length, bw = (W - 8 - left) / n, w = Math.max(2, bw - 2);
    const x = i => left + i * bw + bw / 2, Y = v => (v / sc.max) * (bottom - top);
    let body = yAxis(sc, top, bottom, left);
    labels.forEach((l, i) => {
      const ha = Y(a[i]), hb = Y(b[i]), x0 = left + i * bw + 1;
      const tip = `${tipLabels ? tipLabels[i] : l} · ${names[0]} ${U.num(a[i])}${unit} · ${names[1]} ${U.num(b[i])}${unit}`;
      body += `<g class="hit" data-tip="${e(tip)}"><rect x="${x0 - 1}" y="${top}" width="${bw}" height="${bottom - top}" fill="transparent"/>`;
      body += `<rect x="${x0}" y="${bottom - ha}" width="${w}" height="${ha}" fill="var(--a)"/>`;
      if (hb > 0) body += `<path d="${barPath(x0, bottom - ha - hb, w, Math.max(0, hb - 2), Math.min(4, w / 2))}" fill="var(--b)"/>`;
      body += `</g>`;
    });
    body += xLabels(labels, x, h - 8, Math.ceil(n / 8));
    return frame(h, body, "사람별 막대 차트");
  }

  // 단일 막대 (요일, 시간대)
  function bars({ labels, values, tips, h = 200, fill = "var(--accent)", every = 1 }) {
    const top = 12, bottom = h - 26, left = 44;
    const sc = nice(Math.max(...values, 1));
    const n = labels.length, bw = (W - 8 - left) / n, w = Math.max(2, bw - Math.max(2, bw * 0.25));
    const x = i => left + i * bw + bw / 2;
    let body = yAxis(sc, top, bottom, left);
    values.forEach((v, i) => {
      const hh = (v / sc.max) * (bottom - top), x0 = x(i) - w / 2;
      body += `<g class="hit" data-tip="${e(tips ? tips[i] : labels[i] + " · " + U.num(v))}"><rect x="${left + i * bw}" y="${top}" width="${bw}" height="${bottom - top}" fill="transparent"/><path d="${barPath(x0, bottom - hh, w, hh, 4)}" fill="${fill}"/></g>`;
    });
    body += xLabels(labels, x, h - 8, every);
    return frame(h, body, "막대 차트");
  }

  // 선 (월별 사랑해, 월별 답장 속도)
  function line({ labels, series, tipLabels, fmt = U.num1, unit = "", h = 220 }) {
    const top = 14, bottom = h - 26, left = 44;
    const all = series.flatMap(s => s.values.filter(v => v != null));
    const sc = nice(Math.max(...all, 1));
    const n = labels.length, step = n > 1 ? (W - 16 - left) / (n - 1) : 0;
    const x = i => left + 4 + i * step, y = v => bottom - (v / sc.max) * (bottom - top);
    let body = yAxis(sc, top, bottom, left);
    for (const s of series) {
      let d = "", pen = false;
      s.values.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1); pen = true; });
      body += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li = s.values.map((v, i) => v != null ? i : -1).filter(i => i >= 0).pop();
      if (li != null && li >= 0) body += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
    }
    labels.forEach((l, i) => {
      const tip = (tipLabels ? tipLabels[i] : l) + " · " + series.map(s => `${s.name} ${s.values[i] == null ? "-" : fmt(s.values[i]) + unit}`).join(" · ");
      body += `<rect class="hit" data-tip="${e(tip)}" x="${x(i) - step / 2}" y="${top}" width="${Math.max(step, 6)}" height="${bottom - top}" fill="transparent"/>`;
    });
    body += xLabels(labels, x, h - 8, Math.ceil(n / 8));
    return frame(h, body, "선 차트");
  }

  // 요일 × 시간대 히트맵 (한 색상, 옅음→짙음)
  function heat({ rows, cols, values, tips }) {
    const left = 56, top = 24, cw = (W - left - 8) / cols.length, ch = 34;
    const h = top + rows.length * ch + 6;
    const max = Math.max(...values.flat().filter(v => v != null), 0.0001);
    let body = cols.map((c, j) => `<text x="${left + j * cw + cw / 2}" y="16" class="tick" text-anchor="middle">${e(c)}</text>`).join("");
    rows.forEach((r, i) => {
      body += `<text x="${left - 8}" y="${top + i * ch + ch / 2 + 4}" class="tick" text-anchor="end">${e(r)}</text>`;
      cols.forEach((c, j) => {
        const v = values[i][j], op = v == null ? 0 : 0.08 + 0.85 * (v / max);
        body += `<g class="hit" data-tip="${e(tips[i][j])}"><rect x="${left + j * cw + 1}" y="${top + i * ch + 1}" width="${cw - 2}" height="${ch - 2}" rx="4" fill="var(--track)"/>${v == null ? "" : `<rect x="${left + j * cw + 1}" y="${top + i * ch + 1}" width="${cw - 2}" height="${ch - 2}" rx="4" fill="var(--accent)" fill-opacity="${op.toFixed(2)}"/>`}</g>`;
      });
    });
    return frame(h, body, "요일과 시간대 히트맵");
  }

  // 사랑 지수 원형 게이지
  function gauge(score, cls = "gauge") {
    const r = 52, c = 2 * Math.PI * r, f = Math.max(0, Math.min(100, score)) / 100;
    return `<svg class="${cls}" viewBox="0 0 132 132" role="img" aria-label="사랑 지수 ${score}점"><circle class="g-track" cx="66" cy="66" r="${r}" fill="none" stroke="var(--track)" stroke-width="14"/><circle class="g-fill" cx="66" cy="66" r="${r}" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 66 66)"/><text x="66" y="70" text-anchor="middle" class="gauge-num">${score}</text><text x="66" y="92" text-anchor="middle" class="gauge-sub">/ 100</text></svg>`;
  }

  // 하루 루틴: 18시 → 다음날 18시 축 위에 잠든 시간대(취침 중앙값→기상 중앙값)와 25~75% 범위
  function routine(people, by) {
    const left = 44, right = W - 12, rowH = 46, top = 16, h = top + people.length * rowH + 30;
    const X = m => left + (((m - 18 * 60 + 1440) % 1440) / 1440) * (right - left);
    let body = "";
    for (let hh = 18; hh <= 42; hh += 3) {
      const m = (hh % 24) * 60, x = left + ((hh - 18) / 24) * (right - left);
      body += `<line x1="${x}" x2="${x}" y1="${top - 4}" y2="${h - 26}" class="grid"/><text x="${x}" y="${h - 8}" class="tick" text-anchor="middle">${hh % 24}시</text>`;
      void m;
    }
    people.forEach((p, i) => {
      const r = by[p], y = top + i * rowH, col = i ? "var(--b)" : "var(--a)";
      body += `<text x="${left - 8}" y="${y + 20}" class="tick" text-anchor="end">${e(p)}</text>`;
      if (!r || !r.ok) { body += `<text x="${left + 8}" y="${y + 20}" class="tick">기록 부족</text>`; return; }
      const s = X(r.sleep.med), w = X(r.wake.med);
      body += `<g class="hit" data-tip="${e(`${p} · 잠드는 시각 ${U.hm(r.sleep.med)} · 첫 메시지 ${U.hm(r.wake.med)}`)}">`;
      body += `<rect x="${X(r.sleep.q1)}" y="${y + 4}" width="${Math.max(2, X(r.sleep.q3) - X(r.sleep.q1))}" height="26" rx="4" fill="${col}" fill-opacity="0.18"/>`;
      body += `<rect x="${X(r.wake.q1)}" y="${y + 4}" width="${Math.max(2, X(r.wake.q3) - X(r.wake.q1))}" height="26" rx="4" fill="${col}" fill-opacity="0.18"/>`;
      body += `<rect x="${s}" y="${y + 13}" width="${Math.max(2, w - s)}" height="8" rx="4" fill="${col}"/>`;
      body += `<circle cx="${s}" cy="${y + 17}" r="5" fill="${col}" stroke="var(--surface)" stroke-width="2"/><circle cx="${w}" cy="${y + 17}" r="5" fill="${col}" stroke="var(--surface)" stroke-width="2"/></g>`;
    });
    return frame(h, body, "잠든 시간대");
  }

  return { stacked, bars, line, heat, gauge, routine };
});
