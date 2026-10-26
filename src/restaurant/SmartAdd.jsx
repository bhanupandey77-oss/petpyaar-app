import React, { useMemo, useState } from 'react';
import { Icon, Sheet, useToast, Img } from '../ui.jsx';
import { bulk } from '../lib/fb.js';
import { ITEMS, CATEGORIES } from '../data/menu.js';
import { STORY } from '../data/stories.js';
import { DICT } from '../i18n/dict.js';
import { rupee } from '../lib/utils.js';
import { t } from '../i18n/index.js';

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

export default function SmartAdd({ open, onClose, restId }) {
  const toast = useToast();
  const lib = useMemo(buildLibrary, []);
  const [mode, setMode] = useState('photo');
  const [text, setText] = useState('');
  const [ocr, setOcr] = useState(null); // {pct, msg}
  const [rows, setRows] = useState(null);
  const [run, setRun] = useState(null); // per-row step index
  const [done, setDone] = useState(false);

  const reset = () => { setRows(null); setRun(null); setDone(false); setOcr(null); setText(''); };
  const close = () => { reset(); onClose(); };

  const prepare = (list) => {
    if (!list.length) { toast(t('No dish names found. Try a clearer photo or type the list.'), 'err'); return; }
    setRows(list.slice(0, 40).map((x, i) => {
      const m = match(lib, x.name);
      const cat = m?.cat || guessCat(x.name);
      return { id: i, on: true, name: x.name, price: x.price || m?.price || '', m, cat };
    }));
  };
  const readPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setOcr({ pct: 0, msg: 'Starting…' });
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['hin', 'eng'], 1, { logger: (m) => m.progress != null && setOcr({ pct: Math.round(m.progress * 100), msg: m.status }) });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setOcr(null);
      prepare(parseLines(data.text));
    } catch (er) { console.warn(er); setOcr(null); toast(t('Could not read the photo. Check internet and try again.'), 'err'); }
  };
  const go = async () => {
    const list = rows.filter((r) => r.on && r.name.trim() && Number(r.price) > 0);
    if (!list.length) { toast(t('Name and price are required'), 'err'); return; }
    setRun(Object.fromEntries(list.map((r) => [r.id, 0])));
    const ops = [];
    for (const r of list) {
      for (let s = 1; s <= STEPS.length; s++) { await new Promise((ok) => setTimeout(ok, 160)); setRun((x) => ({ ...x, [r.id]: s })); }
      const m = r.m; const g = GENERIC[r.cat] || GENERIC.northindian;
      const key = m?.key; const catImg = CATEGORIES.find((c) => c.id === r.cat)?.img || ''; const img = m ? m.img : catImg;
      ops.push(['set', 'items', `${restId}--${(key || 'd')}-${Date.now().toString(36)}${r.id}`, {
        restaurantId: restId, name: r.name.trim(), price: Number(r.price), cat: r.cat, veg: true, available: true, bestseller: false, sort: 60 + r.id,
        kcal: m?.kcal || g.kcal, qty: m?.qty || g.qty, desc: m?.desc || '', story: (key && STORY[key]) || m?.story || g.story,
        img: img || '', gallery: m?.gallery || [img].filter(Boolean), aiAdded: true,
      }]);
    }
    try { await bulk(ops); setDone(true); toast(t('{} dishes added to your menu').replace('{}', ops.length)); } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
  };

  return (
    <Sheet open={open} onClose={close} title="Add dishes with AI" full>
      {!rows && !ocr && (
        <>
          <div className="ai-hero"><span className="ai-spark">✨</span><div><b>Photo khinchiye, menu ban jayega</b><small>Take a photo of your menu card — FoodGaon reads dish names & prices and fills photos, calories and a Hindi line for each dish.</small></div></div>
          <div className="seg"><button className={mode === 'photo' ? 'on' : ''} onClick={() => setMode('photo')}>Menu photo</button><button className={mode === 'type' ? 'on' : ''} onClick={() => setMode('type')}>Type names</button></div>
          {mode === 'photo' ? (
            <label className="ai-drop"><Icon name="image" size={34} /><b>Click / choose menu photo</b><small>Clear, straight photo in good light works best</small><input type="file" accept="image/*" capture="environment" hidden onChange={readPhoto} /></label>
          ) : (
            <>
              <textarea className="input" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={'One dish per line, with price\nPaneer Butter Masala 180\nमसाला डोसा 100\nCold Coffee - 80'} />
              <button className="btn primary block lg" disabled={!text.trim()} onClick={() => prepare(parseLines(text))}><Icon name="check" size={18} /> Find dishes</button>
            </>
          )}
        </>
      )}
      {ocr && (
        <div className="ai-reading"><div className="ai-scan" /><b>Reading your menu…</b><div className="kbar"><i style={{ width: ocr.pct + '%' }} /></div><small className="muted">{`${ocr.msg} · ${ocr.pct}%`}</small></div>
      )}
      {rows && !run && (
        <>
          <p className="small">{`${rows.length} dishes found — check names & prices, untick what you don't want.`}</p>
          {rows.map((r) => (
            <div key={r.id} className={'ai-row' + (r.on ? '' : ' off')}>
              <input type="checkbox" checked={r.on} onChange={(e) => setRows(rows.map((x) => (x.id === r.id ? { ...x, on: e.target.checked } : x)))} />
              <Img src={r.m?.img || CATEGORIES.find((c) => c.id === r.cat)?.img} alt="" className="ai-thumb" />
              <div className="grow">
                <input className="input slim" value={r.name} onChange={(e) => setRows(rows.map((x) => (x.id === r.id ? { ...x, name: e.target.value, m: match(lib, e.target.value) } : x)))} data-notr="" />
                <small className={r.m ? 't-green' : 'muted'}>{r.m ? `✓ ${t('Matched')}: ${r.m.name}` : t('New dish — category photo will be used')}</small>
              </div>
              <input className="input slim price" inputMode="numeric" value={r.price} placeholder="₹" onChange={(e) => setRows(rows.map((x) => (x.id === r.id ? { ...x, price: e.target.value.replace(/\D/g, '') } : x)))} />
            </div>
          ))}
          <button className="btn primary block lg" onClick={go}><Icon name="plus" size={18} /> {`Add ${rows.filter((r) => r.on).length} dishes`}</button>
          <button className="btn ghost block" onClick={reset}>Start again</button>
        </>
      )}
      {run && (
        <>
          {rows.filter((r) => run[r.id] !== undefined).map((r) => {
            const st = run[r.id]; const ok = st >= STEPS.length;
            return (
              <div key={r.id} className={'ai-prog' + (ok ? ' ok' : '')}>
                <div className="row gap"><Img src={r.m?.img || CATEGORIES.find((c) => c.id === r.cat)?.img} alt="" className="ai-thumb" /><div className="grow"><b data-notr="">{r.name}</b><small className="muted">{rupee(Number(r.price))}</small></div>{ok ? <span className="ai-tick">✓</span> : <span className="ai-spin" />}</div>
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
