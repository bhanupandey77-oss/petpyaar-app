import React, { useState } from 'react';
import { Icon, Toggle, Sheet, Field, useToast, Img, VegMark, Confirm } from '../ui.jsx';
import { useItems } from '../lib/data.js';
import { put, patch, remove } from '../lib/fb.js';
import { CATEGORIES } from '../data/menu.js';
import { rupee, compressImage } from '../lib/utils.js';
import { t } from '../i18n/index.js';
import SmartAdd from './SmartAdd.jsx';

export default function MenuManager({ restId }) {
  const items = (useItems() || []).filter((i) => i.restaurantId === restId);
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const [ai, setAi] = useState(false);
  const list = items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()));
  const avail = async (it, v) => { try { await patch('items', it.id, { available: v }); } catch { toast(t('Could not save'), 'err'); } };
  return (
    <div className="pad-x">
      <div className="row gap">
        <div className="rp-search grow" style={{ margin: 0 }}><Icon name="search" size={18} /><input placeholder="Search dish" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn ghost" onClick={() => setEdit({})}><Icon name="plus" size={18} /> Add</button>
      </div>
      <button className="ai-cta" onClick={() => setAi(true)}><span className="ai-spark">✨</span><span className="grow"><b>Add dishes with AI</b><small>Click a photo of your menu card or type dish names — photos, calories & details fill in by themselves</small></span><Icon name="right" size={18} /></button>
      <p className="tiny muted">{`${items.length} dishes · ${items.filter((i) => i.available === false).length} sold out`} — switch off a dish when it runs out.</p>
      {list.map((it) => (
        <div key={it.id} className={'mm-row' + (it.available === false ? ' off' : '')}>
          <Img src={it.img} alt="" className="mm-img" />
          <div className="grow" onClick={() => setEdit(it)}>
            <b>{it.name}</b>
            <small className="muted">{rupee(it.price)} · {it.qty}{it.kcal ? ` · ~${it.kcal} kcal` : ''}{it.aiAdded ? ' · ✨ AI' : ''}</small>
          </div>
          <Toggle on={it.available !== false} onChange={(v) => avail(it, v)} label="In stock" />
        </div>
      ))}
      <ItemEditor open={!!edit} item={edit} restId={restId} onClose={() => setEdit(null)} />
      <SmartAdd open={ai} restId={restId} onClose={() => setAi(false)} />
    </div>
  );
}

function ItemEditor({ open, item, restId, onClose }) {
  const toast = useToast();
  const isNew = !item?.id;
  const [f, setF] = useState(null);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => {
    if (open) setF({ name: '', price: '', kcal: '', qty: '1 plate', desc: '', cat: CATEGORIES[0].id, img: '', story: '', bestseller: false, ...item, price: item?.price ?? '', kcal: item?.kcal ?? '' });
  }, [open]); // eslint-disable-line
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pick = async (e) => { const file = e.target.files?.[0]; if (!file) return; try { setF({ ...f, img: await compressImage(file) }); } catch (er) { toast(t(er.message), 'err'); } };
  const save = async () => {
    if (!f.name.trim() || !(Number(f.price) > 0)) { toast(t('Name and price are required'), 'err'); return; }
    setBusy(true);
    const data = { restaurantId: restId, name: f.name.trim(), price: Number(f.price), kcal: Number(f.kcal) || 0, qty: f.qty.trim(), desc: f.desc.trim(), story: (f.story || '').trim(), cat: f.cat, img: f.img || '', bestseller: !!f.bestseller, veg: true, available: f.available !== false, sort: f.sort || 50 };
    try { await put('items', item?.id || `${restId}--${Date.now().toString(36)}`, data); toast(t('Saved')); onClose(); } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'Add dish' : 'Edit dish'} full>
      <div className="img-pick">
        <Img src={f.img} alt="" />
        <label className="btn small light"><Icon name="image" size={16} /> {f.img ? 'Change photo' : 'Add photo'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
      </div>
      <p className="tiny muted"><VegMark size={11} /> FoodGaon is 100% vegetarian — only veg dishes are allowed.</p>
      <Field label="Dish name"><input className="input" value={f.name} onChange={set('name')} /></Field>
      <div className="row gap">
        <Field label="Price (₹)"><input className="input" inputMode="decimal" value={f.price} onChange={set('price')} /></Field>
        <Field label="Calories (approx.)" hint="kcal per serving"><input className="input" inputMode="numeric" value={f.kcal} onChange={set('kcal')} /></Field>
      </div>
      <div className="row gap">
        <Field label="Serving size"><input className="input" value={f.qty} onChange={set('qty')} placeholder="e.g. Half plate, 2 pieces" /></Field>
        <Field label="Category">
          <select className="input" value={f.cat} onChange={set('cat')}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.name)}</option>)}</select>
        </Field>
      </div>
      <Field label="Description"><textarea className="input" rows={2} value={f.desc} onChange={set('desc')} /></Field>
      <Field label="Hindi line for customers" hint="एक छोटी आकर्षक लाइन, जैसे: राष्ट्रीय मिठाई, मीठे रस में डूबी"><textarea className="input" rows={2} value={f.story} onChange={set('story')} data-notr="" lang="hi" /></Field>
      <label className="check-row"><input type="checkbox" checked={!!f.bestseller} onChange={(e) => setF({ ...f, bestseller: e.target.checked })} /> Show as Bestseller</label>
      <button className="btn primary block lg" disabled={busy} onClick={save}>Save dish</button>
      {!isNew && <button className="btn ghost danger-text block" onClick={() => setDel(true)}><Icon name="trash" size={16} /> Delete dish</button>}
      <Confirm open={del} onClose={() => setDel(false)} danger title="Delete this dish?" text="It will be removed from the menu." okText="Delete"
        onOk={async () => { try { await remove('items', item.id); onClose(); } catch { toast(t('Could not delete'), 'err'); } }} />
    </Sheet>
  );
}
