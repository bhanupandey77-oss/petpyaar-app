// Find real, freely-licensed photos for a dish on Wikimedia Commons (CORS-enabled public API).
const API = 'https://commons.wikimedia.org/w/api.php';
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
const BAD = /logo|map|menu|svg|icon|drawing|diagram|flag|signature|poster|chicken|mutton|fish|egg|meat|restaurant|shop|stall|market|people|person|portrait|festival/i;

async function search(q, used, want) {
  const u = `${API}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=15&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=640`;
  let r = null;
  for (let k = 0; k < 4; k++) {
    try { r = await fetch(u); if (r.ok) break; } catch { r = null; } // plain GET: no custom header, so no CORS preflight
    await wait(1500 * (k + 1)); // Wikimedia rate limit → back off and retry
  }
  if (!r || !r.ok) return [];
  const pages = Object.values((await r.json())?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const out = [];
  for (const p of pages) {
    if (out.length >= want) break;
    const ii = p.imageinfo?.[0]; if (!ii || !/jpe?g|png|webp/.test(ii.mime || '')) continue;
    const url = ii.thumburl || ii.url;
    if (BAD.test(p.title) || used.has(url)) continue;
    const md = ii.extmetadata || {};
    used.add(url);
    out.push({ url, page: ii.descriptionurl, license: md.LicenseShortName?.value || '', author: String(md.Artist?.value || '').replace(/<[^>]+>/g, '').slice(0, 60) });
  }
  return out;
}

/** dishes: [{ id, search, name, have }] → calls onEach(id, photos[]) with up to `want - have` NEW photos.
 *  Runs 2 at a time, gently (Wikimedia rate limits); a photo is never given to two different dishes. */
export async function findPhotos(dishes, onEach, want = 3) {
  const used = new Set(); let i = 0;
  dishes.forEach((d) => (d.skip || []).forEach((u) => used.add(u)));
  const worker = async () => {
    while (i < dishes.length) {
      const d = dishes[i++];
      const need = Math.max(0, want - (d.have || 0));
      const base = String(d.name || '').replace(/\(.*?\)/g, '').trim();
      const tries = [...new Set([d.search, base, `${base} food`, `${base} Indian`].filter(Boolean))];
      const got = [];
      for (const q of tries) {
        if (got.length >= need) break;
        try { got.push(...(await search(q, used, need - got.length))); } catch { /* next */ }
        await wait(500);
      }
      onEach?.(d.id, got);
      await wait(500);
    }
  };
  await Promise.all([worker(), worker()]);
}
