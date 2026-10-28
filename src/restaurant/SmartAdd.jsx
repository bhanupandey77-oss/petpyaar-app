import React, { useMemo, useState } from 'react';
import { Icon, Sheet, useToast, Img } from '../ui.jsx';
import { bulk } from '../lib/fb.js';
import { ITEMS, CATEGORIES } from '../data/menu.js';
import { STORY } from '../data/stories.js';
import { DICT } from '../i18n/dict.js';
import { rupee, compressImage } from '../lib/utils.js';
import { t } from '../i18n/index.js';
import { readMenuWithAI, isPdf, pdfText, pdfPages } from '../lib/menuAi.js';
import { findPhotos } from '../lib/dishPhoto.js';

/* ------------------------------------------------------------------
   "AI se dish jodo": read a menu-card photo (on-device OCR, Hindi + English)
   or a typed list → match each dish with FoodGaon's dish library →
   fill photo gallery, calories, serving, category and a Hindi tagline.
------------------------------------------------------------------- */
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, ' ').replace(/\s+/g, ' ').trim();
const hiOf = Object.fromEntries(DICT.map((r) => [r[0], r[1]]));

// one library entry per photo key, with English + Hindi names as aliases
function buildLibrary() {
  const seen = {};
  ITEMS.forEach((i) => {
    const key = (i.img || '').split('/').pop();
    const k = i.id.split('--')[1];
    if (!seen[k]) seen[k] = { ...i, key: k, names: new Set() };
    seen[k].names.add(norm(i.name));
    if (hiOf[i.name]) seen[k].names.add(norm(hiOf[i.name]));
  });
  const EXTRA = { // common menu spellings
    pbm: ['paneer butter masala', 'butter paneer', 'paneer makhani', 'पनीर बटर मसाला'], dal_makhani: ['dal makhni', 'दाल मखनी'], roti: ['tawa roti', 'रोटी', 'tandoori roti', 'तंदूरी रोटी'],
    naan: ['butter naan', 'नान', 'बटर नान'], chowmein: ['chowmin', 'chaumin', 'noodles', 'चाउमीन', 'चाऊमीन'], momos: ['momo', 'मोमोज'], jalebi: ['जलेबी'], samosa: ['समोसा'],
    lassi: ['लस्सी', 'meethi lassi'], thali: ['थाली', 'special thali', 'veg thali'], masala_dosa: ['dosa', 'डोसा', 'मसाला डोसा'], idli: ['इडली'], rasgulla: ['rasgulle', 'रसगुल्ला'],
    gulab_jamun: ['गुलाब जामुन'], rabri: ['rabdi', 'रबड़ी', 'रबडी'], kulfi: ['कुल्फी'], chai: ['tea', 'चाय'], cold_coffee: ['कोल्ड कॉफी'], paneer_tikka: ['पनीर टिक्का'],
    shahi_paneer: ['शाही पनीर'], kadai_paneer: ['kadhai paneer', 'कड़ाही पनीर'], matar_paneer: ['मटर पनीर'], palak_paneer: ['पालक पनीर'], veg_biryani: ['biryani', 'बिरयानी'],
    jeera_rice: ['जीरा राइस'], fried_rice: ['फ्राइड राइस'], burger: ['बर्गर'], pizza: ['पिज्जा'], sandwich: ['सैंडविच'], pav_bhaji: ['पाव भाजी'], chole_bhature: ['छोले भटूरे'],
    pani_puri: ['golgappa', 'gol gappe', 'गोलगप्पे', 'पानी पूरी'], aloo_tikki: ['tikki', 'टिक्की'], manchurian: ['मंचूरियन'], spring_roll: ['स्प्रिंग रोल'],
  };
  Object.entries(EXTRA).forEach(([k, al]) => { if (seen[k]) al.forEach((a) => seen[k].names.add(norm(a))); });
  return Object.values(seen);
}

const CAT_WORDS = [
  ['chinese', ['chow', 'noodle', 'manchur', 'momo', 'chilli', 'schezwan', 'hakka', 'fried rice', 'चाउ', 'मोमो', 'मंचू']],
  ['lassi', ['lassi', 'shake', 'coffee', 'tea', 'chai', 'milk', 'juice', 'soda', 'लस्सी', 'शेक', 'चाय', 'दूध', 'कॉफी']],
  ['southindian', ['dosa', 'idli', 'uttapam', 'vada', 'sambar', 'डोसा', 'इडली']],
  ['sweets', ['jamun', 'rasgulla', 'barfi', 'peda', 'laddu', 'halwa', 'jalebi', 'rabri', 'kheer', 'sweet', 'मिठा', 'बर्फी', 'लड्डू', 'हलवा', 'खीर']],
  ['icecream', ['ice cream', 'kulfi', 'sundae', 'आइसक्रीम', 'कुल्फी']],
  ['fastfood', ['burger', 'pizza', 'sandwich', 'fries', 'pav', 'pasta', 'बर्गर', 'पिज्जा']],
  ['chaat', ['chaat', 'tikki', 'samosa', 'kachori', 'pakora', 'puri', 'bhalla', 'चाट', 'समोसा', 'पकौड़ा']],
  ['thali', ['thali', 'rice', 'biryani', 'pulao', 'थाली', 'चावल', 'बिरयानी']],
  ['northindian', ['paneer', 'dal', 'roti', 'naan', 'paratha', 'kofta', 'sabzi', 'पनीर', 'दाल', 'रोटी', 'पराठा']],
];
const GENERIC = {
  sweets: { kcal: 300, qty: '2 pieces', story: 'ताज़ा बनी, शुद्ध मिठास — हर ख़ुशी के मौक़े के लिए।' },
  lassi: { kcal: 280, qty: '1 glass', story: 'ठंडा-ठंडा, ताज़गी भरा — एक घूँट में मन ख़ुश।' },
  chinese: { kcal: 450, qty: '1 plate', story: 'गरमा-गरम, चटपटा देसी-चाइनीज़ — हर बाइट में मज़ा।' },
  fastfood: { kcal: 400, qty: '1 plate', story: 'गरमा-गरम और लज़ीज़ — दोस्तों के साथ बाँटिए।' },
  northindian: { kcal: 450, qty: '1 bowl', story: 'घर जैसा स्वाद, होटल जैसी शान — गरमा-गरम परोसा।' },
  chaat: { kcal: 300, qty: '1 plate', story: 'चटपटा, करारा और खट्टा-मीठा — मुँह में पानी ला दे।' },
  thali: { kcal: 750, qty: '1 plate', story: 'पेट भी भरे, मन भी — पूरा भोजन एक साथ।' },
  southindian: { kcal: 350, qty: '1 plate', story: 'हल्का, सेहतमंद दक्षिण भारतीय स्वाद — सांभर-चटनी के साथ।' },
  icecream: { kcal: 220, qty: '1 cup', story: 'ठंडी-मीठी ख़ुशी — गर्मी का सबसे प्यारा साथी।' },
};
function guessCat(name) {
  const n = norm(name);
  for (const [c, words] of CAT_WORDS) if (words.some((w) => n.includes(norm(w)))) return c;
  return 'northindian';
}
function match(lib, name) {
  const n = norm(name); if (!n) return null;
  const toks = new Set(n.split(' '));
  let best = null; let score = 0;
  lib.forEach((d) => d.names.forEach((al) => {
    let s = 0;
    if (al === n) s = 1; else if (al.includes(n) || n.includes(al)) s = 0.85 * Math.min(al.length, n.length) / Math.max(al.length, n.length) + 0.1;
    else { const at = al.split(' '); const hit = at.filter((x) => toks.has(x)).length; s = hit / Math.max(at.length, toks.size) * 0.8; }
    if (s > score) { score = s; best = d; }
  }));
  return score >= 0.45 ? best : null;
}

/** "Paneer Butter Masala ..... 180" → { name, price } */
export function parseLines(text) {
  return String(text || '').split(/\n|;/).map((l) => l.replace(/[|_*•·]+/g, ' ').trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*?)[\s:\-–—=.]*(?:rs\.?|₹|र\.?|रु\.?)?\s*(\d{1,4})(?:\s*\/-?)?\s*$/i);
    const name = (m ? m[1] : l).replace(/[\-–—:.=₹]+$/g, '').trim();
    return { name, price: m ? Number(m[2]) : 0 };
  }).filter((x) => /[a-zA-Z\u0900-\u097f]{2,}/.test(x.name) && x.name.length <= 40);
}

const STEPS = ['नाम पढ़ा', 'फ़ोटो ढूँढी', 'कैलोरी व मात्रा', 'हिंदी विवरण', 'ग्राफ़िक्स सेट', 'मेन्यू में जुड़ी'];
const baseOf = (n) => norm(String(n || '').replace(/\(.*?\)/g, ''));

export default function SmartAdd({ open, onClose, restId }) {
  const toast = useToast();
  const lib = useMemo(buildLibrary, []);
  const [mode, setMode] = useState('photo');
  const [text, setText] = useState('');
  const [ocr, setOcr] = useState(null); // {pct, msg}
  const [rows, setRows] = useState(null);
  const [run, setRun] = useState(null); // per-row step index
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState([]);
  const [fail, setFail] = useState(null); // { reason, raw }
  const [engine, setEngine] = useState('');
  const [picking, setPicking] = useState(null); // row id for own photo

  const reset = () => { setRows(null); setRun(null); setDone(false); setOcr(null); setText(''); setFiles([]); setFail(null); setEngine(''); };
  const close = () => { reset(); onClose(); };
  const upd = (id, ch) => setRows((rs) => rs && rs.map((x) => (x.id === id ? { ...x, ...ch } : x)));

  /* list → review rows; library photo only for a truly matching dish, each library photo used once per dish name */
  const prepare = (list, eng) => {
    if (!list.length) { toast(t('No dish names found. Try a clearer photo or type the list.'), 'err'); return; }
    const usedKey = {};
    const out = list.slice(0, 120).map((x, i) => {
      const b = baseOf(x.name);
      let m = (x.photoKey && lib.find((d) => d.key === x.photoKey)) || match(lib, x.name);
      if (m && usedKey[m.key] && usedKey[m.key] !== b) m = null; // a different dish already took this photo
      if (m) usedKey[m.key] = b;
      const cat = x.cat || m?.cat || guessCat(x.name);
      return { id: i, on: x.veg !== false, name: x.name, price: x.price || '', m, cat, kcal: x.kcal, qty: x.qty, desc: x.desc, story: x.story, nonVeg: x.veg === false, search: x.search || '', ph: null, phState: m ? 'lib' : 'wait', own: '' };
    });
    setRows(out); setEngine(eng);
    // real photo from the web for every dish not in our library (same dish name → same photo)
    const need = []; const seenBase = {};
    out.filter((r) => !r.m).forEach((r) => { const b = baseOf(r.name); if (seenBase[b] == null) { seenBase[b] = r.id; need.push(r); } });
    findPhotos(need.map((r) => ({ id: r.id, name: r.name, search: r.search })), (id, ph) => {
      const b = baseOf(out.find((r) => r.id === id)?.name);
      setRows((rs) => rs && rs.map((x) => (!x.m && baseOf(x.name) === b ? { ...x, ph, phState: ph ? 'web' : 'none' } : x)));
    });
  };

  const ocrImage = async (src) => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(['hin', 'eng'], 1, { logger: (m) => m.progress != null && setOcr({ pct: Math.round(m.progress * 100), msg: m.status }) });
    const { data } = await worker.recognize(src);
    await worker.terminate();
    return data.text;
  };
  const readOffline = async () => {
    setFail(null); setOcr({ pct: 5, msg: 'Reading offline…' });
    try {
      let txt = '';
      for (const f of files) {
        if (isPdf(f)) {
          const pt = await pdfText(f);
          if (parseLines(pt).length >= 3) txt += pt + '\n';
          else for (const pg of await pdfPages(f, 4)) txt += (await ocrImage(pg)) + '\n';
        } else txt += (await ocrImage(f)) + '\n';
      }
      setOcr(null); prepare(parseLines(txt), 'offline');
    } catch (er) { console.warn(er); setOcr(null); toast(t('Could not read the file'), 'err'); }
  };
  const readAI = async (fl) => {
    const list = fl || files; if (!list.length) return;
    setFail(null);
    setOcr({ pct: 10, msg: 'Sending menu to AI…' });
    const tick = setInterval(() => setOcr((o) => (o ? { ...o, pct: Math.min(94, o.pct + 3) } : o)), 1500);
    try {
      const { dishes, engine: eng } = await readMenuWithAI(list, lib, (msg) => setOcr((o) => ({ ...(o || { pct: 20 }), msg })));
      clearInterval(tick); setOcr(null);
      prepare(dishes, eng);
    } catch (er) {
      clearInterval(tick); console.warn(er); setOcr(null);
      setFail({ reason: er.message, raw: er.raw || '' });
    }
  };
  const pickFiles = (e) => {
    const fl = [...(e.target.files || [])]; e.target.value = ''; if (!fl.length) return;
    const all = [...files, ...fl].slice(0, 6);
    setFiles(all);
    if (isPdf(fl[0]) || fl.length > 1 || e.target.dataset.go === '1') readAI(all);
  };

  const go = async () => {
    const list = rows.filter((r) => r.on && r.name.trim() && Number(r.price) > 0);
    if (!list.length) { toast(t('Name and price are required'), 'err'); return; }
    setRun(Object.fromEntries(list.map((r) => [r.id, 0])));
    const ops = [];
    for (const r of list) {
      for (let s = 1; s <= STEPS.length; s++) { await new Promise((ok) => setTimeout(ok, 120)); setRun((x) => ({ ...x, [r.id]: s })); }
      const m = r.m; const g = GENERIC[r.cat] || GENERIC.northindian;
      const key = m?.key; const catImg = CATEGORIES.find((c) => c.id === r.cat)?.img || '';
      const img = r.own || r.ph?.url || m?.img || catImg;
      const gallery = r.own ? [r.own] : r.ph ? [r.ph.url] : m?.gallery || [img].filter(Boolean);
      ops.push(['set', 'items', `${restId}--${(key || 'd')}-${Date.now().toString(36)}${r.id}`, {
        restaurantId: restId, name: r.name.trim(), price: Number(r.price), cat: r.cat, veg: true, available: true, bestseller: false, sort: 60 + r.id,
        kcal: r.kcal || m?.kcal || g.kcal, qty: r.qty || m?.qty || g.qty, desc: r.desc || m?.desc || '', story: r.story || (key && STORY[key]) || m?.story || g.story,
        img: img || '', gallery, aiAdded: true,
        ...(r.ph && !r.own ? { imgCredit: { page: r.ph.page || '', license: r.ph.license || '', author: r.ph.author || '' } } : {}),
      }]);
    }
    try { await bulk(ops); setDone(true); toast(t('{} dishes added to your menu').replace('{}', ops.length)); } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
  };

  const thumbOf = (r) => r.own || r.ph?.url || r.m?.img || '';
  const phText = (r) => (r.own ? t('Your photo') : r.phState === 'lib' ? `✓ ${t('Photo')}: ${r.m.name}` : r.phState === 'web' ? `✓ ${t('Real photo found')}` : r.phState === 'wait' ? t('Finding photo…') : t('No photo found — tap the photo to add yours'));
  const ownPick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f || picking == null) return;
    try { upd(picking, { own: await compressImage(f, 720, 180000) }); } catch { toast(t('Could not read the photo'), 'err'); }
    setPicking(null);
  };

  return (
    <Sheet open={open} onClose={close} title="Add dishes with AI" full>
      {!rows && !ocr && !fail && (
        <>
          <div className="ai-hero"><span className="ai-spark">✨</span><div><b>Menu ki photo ya PDF dijiye, menu ban jayega</b><small>FoodGaon AI reads every dish name & price, finds a real photo for each dish, and fills calories and a Hindi line.</small></div></div>
          <div className="seg"><button className={mode === 'photo' ? 'on' : ''} onClick={() => setMode('photo')}>Photo / PDF</button><button className={mode === 'type' ? 'on' : ''} onClick={() => setMode('type')}>Type names</button></div>
          {mode === 'photo' ? (
            <div className="ai-drop">
              <Icon name="camera" size={34} /><b>Menu card</b><small>Clear, straight photo in good light. Many pages? Add all pages (up to 6) or one PDF.</small>
              <div className="row gap wrap">
                <label className="btn primary"><Icon name="camera" size={18} /> Camera<input type="file" accept="image/*" capture="environment" hidden onChange={pickFiles} /></label>
                <label className="btn ghost"><Icon name="image" size={18} /> Gallery<input type="file" accept="image/*" multiple hidden onChange={pickFiles} /></label>
                <label className="btn ghost"><Icon name="receipt" size={18} /> PDF<input type="file" accept="application/pdf,.pdf" hidden onChange={pickFiles} /></label>
              </div>
              {files.length > 0 && (
                <div className="ai-files">
                  {files.map((f, i) => <span key={i} className="chip">{isPdf(f) ? '📄' : '🖼️'} {`${t('Page')} ${i + 1}`}<button onClick={() => setFiles(files.filter((_, k) => k !== i))} aria-label="Remove">×</button></span>)}
                  <button className="btn primary block lg" onClick={() => readAI()}>✨ {`${t('Read menu')} (${files.length})`}</button>
                  <small className="muted">{t('Add another page with Camera/Gallery, or read now.')}</small>
                </div>
              )}
            </div>
          ) : (
            <>
              <textarea className="input" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={'One dish per line, with price\nPaneer Butter Masala 180\nमसाला डोसा 100\nCold Coffee - 80'} />
              <button className="btn primary block lg" disabled={!text.trim()} onClick={() => prepare(parseLines(text), 'typed')}><Icon name="check" size={18} /> Find dishes</button>
            </>
          )}
        </>
      )}
      {ocr && (
        <div className="ai-reading"><div className="ai-scan" /><b>Reading your menu…</b><div className="kbar"><i style={{ width: ocr.pct + '%' }} /></div><small className="muted">{`${t(ocr.msg)} · ${ocr.pct}%`}</small><small className="muted">{t('A full menu can take up to 1 minute.')}</small></div>
      )}
      {fail && !ocr && (
        <div className="card ai-fail">
          <b className="t-red">⚠️ {t('AI could not read the menu')}</b>
          <p className="small">{t(fail.reason)}</p>
          {fail.raw && <details open><summary className="tiny muted">Details</summary><code className="tiny">{fail.raw.slice(0, 400)}</code></details>}
          <button className="btn primary block" onClick={() => readAI()}>↻ {t('Try AI again')}</button>
          <button className="btn ghost block" onClick={readOffline}>{t('Read offline (less accurate — check every name & price)')}</button>
          <button className="btn ghost block" onClick={() => { setFail(null); setMode('type'); }}>{t('Type names')}</button>
        </div>
      )}
      {rows && !run && (
        <>
          <p className={'small ai-engine' + (engine === 'offline' ? ' warn' : '')}>{engine === 'offline' ? `⚠️ ${t('Read offline — please check every name and price carefully.')}` : engine === 'typed' ? '' : `✨ ${t('Read by AI')}`}</p>
          <p className="small">{`${rows.length} ${t('dishes found — check names & prices, untick what you don\'t want. Tap a photo to change it.')}`}</p>
          {rows.map((r) => (
            <div key={r.id} className={'ai-row' + (r.on ? '' : ' off')}>
              <input type="checkbox" disabled={r.nonVeg} checked={r.on} onChange={(e) => upd(r.id, { on: e.target.checked })} />
              <button className="ai-thumb-btn" onClick={() => setPicking(r.id)} aria-label="Change photo">{r.phState === 'wait' && !r.own ? <span className="ai-thumb ai-spin-box"><span className="ai-spin" /></span> : <Img src={thumbOf(r)} alt="" className="ai-thumb" />}<i><Icon name="camera" size={11} /></i></button>
              <div className="grow">
                <input className="input slim" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} data-notr="" />
                <small className={r.nonVeg ? 't-red' : r.phState === 'none' && !r.own ? 'muted' : 't-green'}>{r.nonVeg ? t('Non-veg — not allowed on FoodGaon') : phText(r)}</small>
                {r.story && <small className="mi-story" data-notr="" lang="hi">{r.story}</small>}
              </div>
              <input className={'input slim price' + (Number(r.price) > 0 ? '' : ' need')} inputMode="numeric" value={r.price} placeholder="₹" onChange={(e) => upd(r.id, { price: e.target.value.replace(/\D/g, '') })} />
            </div>
          ))}
          <button className="btn primary block lg" onClick={go}><Icon name="plus" size={18} /> {`Add ${rows.filter((r) => r.on).length} dishes`}</button>
          <button className="btn ghost block" onClick={reset}>Start again</button>
        </>
      )}
      {picking != null && (
        <Sheet open onClose={() => setPicking(null)} title="Dish photo">
          <div className="row gap">
            <label className="btn primary grow"><Icon name="camera" size={18} /> Camera<input type="file" accept="image/*" capture="environment" hidden onChange={ownPick} /></label>
            <label className="btn ghost grow"><Icon name="image" size={18} /> Gallery<input type="file" accept="image/*" hidden onChange={ownPick} /></label>
          </div>
        </Sheet>
      )}
      {run && (
        <>
          {rows.filter((r) => run[r.id] !== undefined).map((r) => {
            const st = run[r.id]; const ok = st >= STEPS.length;
            return (
              <div key={r.id} className={'ai-prog' + (ok ? ' ok' : '')}>
                <div className="row gap"><Img src={thumbOf(r) || CATEGORIES.find((c) => c.id === r.cat)?.img} alt="" className="ai-thumb" /><div className="grow"><b data-notr="">{r.name}</b><small className="muted">{rupee(Number(r.price))}</small></div>{ok ? <span className="ai-tick">✓</span> : <span className="ai-spin" />}</div>
                <div className="ai-steps" data-notr="" lang="hi">{STEPS.map((s, k) => <span key={s} className={k < st ? 'done' : k === st ? 'cur' : ''}>{k < st ? '✓ ' : ''}{s}</span>)}</div>
              </div>
            );
          })}
          {done && <button className="btn green block lg" onClick={close}><Icon name="check" size={18} /> Done — see your menu</button>}
        </>
      )}
    </Sheet>
  );
}
