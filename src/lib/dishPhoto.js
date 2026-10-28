// Find a real, freely-licensed photo for a dish on Wikimedia Commons (CORS-enabled public API).
const API = 'https://commons.wikimedia.org/w/api.php';
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
const BAD = /logo|map|menu|svg|icon|drawing|diagram|flag|signature|poster|chicken|mutton|fish|egg|meat/i;

async function search(q, used) {
  const u = `${API}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=640`;
  let r = null;
  for (let k = 0; k < 4; k++) {
    try { r = await fetch(u, { headers: { 'Api-User-Agent': 'FoodGaon/1.0 (contact@techgaon.in)' } }); if (r.ok) break; } catch { r = null; }
    await wait(1500 * (k + 1)); // Wikimedia rate limit → back off and retry
  }
  if (!r || !r.ok) return null;
  const pages = Object.values((await r.json())?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0]; if (!ii || !/jpe?g|png|webp/.test(ii.mime || '')) continue;
    if (BAD.test(p.title) || used.has(ii.thumburl)) continue;
    const md = ii.extmetadata || {};
    return { url: ii.thumburl || ii.url, page: ii.descriptionurl, license: md.LicenseShortName?.value || '', author: String(md.Artist?.value || '').replace(/<[^>]+>/g, '').slice(0, 60) };
  }
  return null;
}

/** dishes: [{ id, search, name }] → { [id]: photo } ; runs 2 at a time, gently (Wikimedia rate limits), never reuses the same photo */
export async function findPhotos(dishes, onEach) {
  const used = new Set(); const out = {};
  let i = 0;
  const worker = async () => {
    while (i < dishes.length) {
      const d = dishes[i++];
      const base = String(d.name || '').replace(/\(.*?\)/g, '').trim();
      const tries = [...new Set([d.search, base, `${base} food`].filter(Boolean))];
      let ph = null;
      for (const q of tries) { try { ph = await search(q, used); } catch { ph = null; } if (ph) break; await wait(500); }
      if (ph) { used.add(ph.url); out[d.id] = ph; }
      onEach?.(d.id, ph);
      await wait(600);
    }
  };
  await Promise.all([worker(), worker()]);
  return out;
}
