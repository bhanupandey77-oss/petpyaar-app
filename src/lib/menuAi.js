// Read menu cards (photos and/or PDF) with Gemini (Firebase AI Logic, Gemini Developer API).
// Returns { dishes: [{ name, price, cat, photoKey, search, kcal, qty, desc, story, veg }], engine }
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';
import { app } from './fb.js';
import { compressImage } from './utils.js';

const MODELS = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
export const CATS = ['sweets', 'lassi', 'chinese', 'fastfood', 'northindian', 'chaat', 'thali', 'southindian', 'icecream'];

const SCHEMA = Schema.object({
  properties: {
    dishes: Schema.array({
      items: Schema.object({
        properties: {
          name: Schema.string(), price: Schema.number(), category: Schema.enumString({ enum: CATS }),
          photoKey: Schema.string(), search: Schema.string(), kcal: Schema.integer(), serving: Schema.string(),
          desc: Schema.string(), hindiLine: Schema.string(), veg: Schema.boolean(),
        },
        optionalProperties: ['photoKey', 'kcal', 'serving', 'desc', 'hindiLine', 'search'],
      }),
    }),
  },
});

export const isPdf = (f) => f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''));

const toB64 = (file) => new Promise((ok, bad) => {
  const fr = new FileReader();
  fr.onerror = () => bad(new Error('Could not read the file'));
  fr.onload = () => ok(String(fr.result).split(',')[1]);
  fr.readAsDataURL(file);
});

/* PDF → page images (for big PDFs and for the offline fallback) */
async function pdfLib() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(`${import.meta.env.BASE_URL}pdf.worker.min.js`, location.href).href;
  return pdfjs;
}
export async function pdfPages(file, maxPages = 8) {
  const pdfjs = await pdfLib();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const out = [];
  for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
    const page = await doc.getPage(p);
    const vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: Math.min(3, 2200 / Math.max(vp0.width, vp0.height)) });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    out.push(c.toDataURL('image/jpeg', 0.85));
  }
  return out;
}
/* Digital PDF: exact text lines (no OCR needed) */
export async function pdfText(file) {
  const pdfjs = await pdfLib();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines = [];
  for (let p = 1; p <= Math.min(doc.numPages, 20); p++) {
    const tc = await (await doc.getPage(p)).getTextContent();
    const rows = {};
    tc.items.forEach((it) => { const y = Math.round(it.transform[5] / 4); (rows[y] = rows[y] || []).push(it); });
    Object.keys(rows).sort((a, b) => b - a).forEach((y) => lines.push(rows[y].sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join(' ')));
  }
  return lines.join('\n');
}

/* Build the parts list sent to Gemini */
async function partsOf(files, onStatus) {
  const parts = [];
  for (const f of files) {
    if (isPdf(f)) {
      if (f.size <= 14 * 1024 * 1024) parts.push({ inlineData: { mimeType: 'application/pdf', data: await toB64(f) } });
      else { onStatus?.('Big PDF — preparing pages…'); (await pdfPages(f)).forEach((u) => parts.push({ inlineData: { mimeType: 'image/jpeg', data: u.split(',')[1] } })); }
    } else {
      const u = await compressImage(f, 2600, 2600000);
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: u.split(',')[1] } });
    }
  }
  return parts;
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, bad) => setTimeout(() => bad(new Error('timeout')), ms))]);

/* Short human reason for the user (also helps support) */
export function aiReason(e) {
  const m = String(e?.message || e || '');
  if (/timeout/i.test(m)) return 'AI took too long (slow internet?)';
  if (/fetch|network|Failed to fetch|offline/i.test(m)) return 'No internet / network blocked';
  if (/429|quota|exhaust|rate/i.test(m)) return 'AI daily free limit reached — try after some time';
  if (/403|permission|API key|referer|blocked/i.test(m)) return 'AI access blocked for this app (API key)';
  if (/404|not found/i.test(m)) return 'AI model not available';
  if (/JSON|Unexpected token/i.test(m)) return 'AI reply was incomplete';
  return m.slice(0, 120) || 'AI error';
}

export async function readMenuWithAI(files, library, onStatus) {
  const list = Array.isArray(files) ? files : [files];
  const parts = await partsOf(list, onStatus);
  const keys = library.map((d) => `${d.key} = ${d.name}`).join('\n');
  const prompt = `These ${parts.length > 1 ? `${parts.length} images/pages are` : 'image/PDF is'} the MENU CARD of one Indian vegetarian restaurant (Hindi and/or English, columns, decorative fonts, maybe handwritten or a photo taken at an angle).
TASK: List EVERY dish exactly as printed with its correct price.
RULES:
- Read carefully row by row and column by column. The price belongs to the dish on the SAME row / nearest on the right. Never shift prices between rows.
- Read the full number (e.g. 120 not 12, 1,250 = 1250). Ignore "Rs", "₹", "/-".
- If a dish has several prices (Half/Full, Small/Medium/Large, 250g/500g/1kg, Plate/Piece) make ONE entry per price and add the size in brackets, e.g. "Paneer Butter Masala (Half)".
- If a section heading gives the size/price (e.g. "All Shakes ₹80"), apply it to each dish under it.
- Do NOT invent dishes. Skip headings, phone numbers, address, GST/tax notes, "extra" lines without a dish.
- name: as a customer would read it, in English letters (transliterate Hindi: "पनीर बटर मसाला" → "Paneer Butter Masala"). Fix obvious spelling mistakes only.
- category: one of ${CATS.join(', ')}.
- photoKey: key of the SAME dish from this photo library, only if it is really the same dish (e.g. "Kadai Paneer" ≠ "Paneer Tikka"); else "":
${keys}
- search: 2-4 English words to find a real photo of this dish (e.g. "kadai paneer curry", "veg hakka noodles").
- kcal (rough, for the serving), serving (e.g. "1 plate", "2 pieces", "1 glass"), desc (≤10 English words).
- hindiLine: ONE short attractive Hindi line (feeling + hint, not a recipe), different for every dish, e.g. Jalebi: "राष्ट्रीय मिठाई, मीठे रस में डूबी — जो भर दे रिश्तों में मिठास।"
- veg: false only for egg/chicken/mutton/fish dishes.`;
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const errs = [];
  for (const name of MODELS) {
    try {
      onStatus?.(`AI (${name}) is reading dish names & prices…`);
      const model = getGenerativeModel(ai, { model: name, generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0, maxOutputTokens: 32768 } }, { timeout: 150000 });
      const r = await withTimeout(model.generateContent([prompt, ...parts]), 160000);
      const txt = r.response.text().trim().replace(/^```(json)?/i, '').replace(/```$/, '');
      const json = JSON.parse(txt);
      const dishes = (json.dishes || []).filter((d) => d && d.name && String(d.name).trim().length > 1).map((d) => ({
        name: String(d.name).trim().slice(0, 60),
        price: Math.round(Number(String(d.price ?? '').replace(/[^\d.]/g, '')) || 0),
        cat: CATS.includes(d.category) ? d.category : '',
        photoKey: String(d.photoKey || ''),
        search: String(d.search || d.name || '').slice(0, 60),
        kcal: Math.round(Number(d.kcal) || 0),
        qty: String(d.serving || '').slice(0, 30),
        desc: String(d.desc || '').slice(0, 80),
        story: String(d.hindiLine || '').slice(0, 140),
        veg: d.veg !== false,
      }));
      if (!dishes.length) throw new Error('AI found no dishes');
      return { dishes, engine: name };
    } catch (e) { console.warn('menu AI', name, e); errs.push(e); if (/429|quota|fetch|network|403|API key/i.test(String(e?.message))) break; }
  }
  const err = new Error(aiReason(errs[errs.length - 1]));
  err.raw = errs.map((e) => String(e?.message || e)).join(' | ');
  throw err;
}
