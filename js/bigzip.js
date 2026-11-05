/* 큰 zip에서 txt만 꺼내기 (v14)
   카톡 "모든 메시지 저장"처럼 사진·동영상이 든 수백 MB zip도, 파일 전체를 메모리에 올리지 않고
   목차(central directory)만 읽은 뒤 txt 항목의 압축 데이터만 잘라서 풀어 읽는다.
   File/Blob.slice + DecompressionStream("deflate-raw") 사용 (iOS 16.4+, 안드로이드 크롬 80+).
   기기 밖으로는 아무것도 보내지 않는다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BigZip = factory();
})(this, function () {
  "use strict";
  const supported = () => typeof DecompressionStream === "function" && typeof Blob !== "undefined" && typeof Blob.prototype.slice === "function";
  const u8 = async b => new Uint8Array(await b.arrayBuffer());
  const le16 = (d, o) => d[o] | (d[o + 1] << 8);
  const le32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;
  const le64 = (d, o) => le32(d, o) + le32(d, o + 4) * 4294967296;

  async function entries(file) {
    const size = file.size, tailLen = Math.min(size, 65557 + 20);
    const tail = await u8(file.slice(size - tailLen));
    let e = -1;
    for (let i = tail.length - 22; i >= 0; i--) if (le32(tail, i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error("zip 파일의 목차를 찾지 못했어요.");
    let count = le16(tail, e + 10), cdSize = le32(tail, e + 12), cdOff = le32(tail, e + 16);
    // zip64
    if (cdOff === 0xffffffff || cdSize === 0xffffffff || count === 0xffff) {
      const loc = e - 20;
      if (loc >= 0 && le32(tail, loc) === 0x07064b50) {
        const recOff = le64(tail, loc + 8);
        const rec = await u8(file.slice(recOff, recOff + 56));
        if (le32(rec, 0) === 0x06064b50) { count = le64(rec, 32); cdSize = le64(rec, 40); cdOff = le64(rec, 48); }
      }
    }
    const cd = await u8(file.slice(cdOff, cdOff + cdSize));
    const out = [], dec = new TextDecoder("utf-8");
    for (let p = 0; p + 46 <= cd.length && le32(cd, p) === 0x02014b50;) {
      const method = le16(cd, p + 10);
      let comp = le32(cd, p + 20), unc = le32(cd, p + 24);
      const nl = le16(cd, p + 28), xl = le16(cd, p + 30), cl = le16(cd, p + 32);
      let off = le32(cd, p + 42);
      const name = dec.decode(cd.subarray(p + 46, p + 46 + nl));
      // zip64 추가 정보
      let x = p + 46 + nl;
      const xe = x + xl;
      while (x + 4 <= xe) {
        const id = le16(cd, x), len = le16(cd, x + 2);
        if (id === 1) {
          let q = x + 4;
          if (unc === 0xffffffff) { unc = le64(cd, q); q += 8; }
          if (comp === 0xffffffff) { comp = le64(cd, q); q += 8; }
          if (off === 0xffffffff) { off = le64(cd, q); }
        }
        x += 4 + len;
      }
      out.push({ name, method, comp, unc, off });
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  async function readEntry(file, en) {
    const lh = await u8(file.slice(en.off, en.off + 30));
    if (le32(lh, 0) !== 0x04034b50) throw new Error("zip 파일이 손상된 것 같아요.");
    const start = en.off + 30 + le16(lh, 26) + le16(lh, 28);
    const blob = file.slice(start, start + en.comp);
    let bytes;
    if (en.method === 0) bytes = await u8(blob);
    else if (en.method === 8) bytes = new Uint8Array(await new Response(blob.stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else throw new Error("이 zip 압축 방식은 열 수 없어요. 압축을 풀어 txt 파일로 올려 주세요.");
    return new TextDecoder("utf-8").decode(bytes);
  }

  /* zip 속 txt 파일들 → [{name, text}] (사진·동영상 등은 건너뜀) */
  async function readTexts(file) {
    const list = (await entries(file)).filter(x => /\.txt$/i.test(x.name) && !/(^|\/)(__MACOSX|\.)/.test(x.name) && !x.name.endsWith("/"));
    const out = [];
    for (const en of list) out.push({ name: en.name, text: await readEntry(file, en) });
    return out;
  }

  return { supported, readTexts, entries };
});
