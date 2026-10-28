import React, { useState } from 'react';
import { Icon, Toggle, Sheet, Field, useToast, Img, VegMark, Confirm } from '../ui.jsx';
import { useItems } from '../lib/data.js';
import { put, patch, remove, bulk } from '../lib/fb.js';
import { CATEGORIES } from '../data/menu.js';
import { priceText, lineText, rupee, compressImage } from '../lib/utils.js';
import { t } from '../i18n/index.js';
import SmartAdd from './SmartAdd.jsx';
import PhotoPick from '../components/PhotoPick.jsx';

export default function MenuManager({ restId }) {
  const items = (useItems() || []).filter((i) => i.restaurantId === restId);
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const [ai, setAi] = useState(false);
  const [sel, setSel] = useState(null); // null = normal mode, Set = selecting
  const [askDel, setAskDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()));
  const toggleSel = (id) => { const n = new Set(sel); if (n.has(id)) n.delete(id); else n.add(id); setSel(n); };
  const allSel = sel && list.length > 0 && list.every((i) => sel.has(i.id));
  const runBulk = async (kind) => {
    const ids = [...sel]; if (!ids.length) return;
    setBusy(true);
    try {
      if (kind === 'del') await bulk(ids.map((id) => ['del', 'items', id]));
      else await bulk(ids.map((id) => ['update', 'items', id, { available: kind === 'on' }]));
      toast(kind === 'del' ? t('{} dishes deleted').replace('{}', ids.length) : t('Saved')); setSel(null);
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
    setBusy(false); setAskDel(false);
  };
  const avail = async (it, v) => { try { await patch('items', it.id, { available: v }); } catch { toast(t('Could not save'), 'err'); } };
  return (
    <div className="pad-x">
      <div className="row gap">
        <div className="rp-search grow" style={{ margin: 0 }}><Icon name="search" size={18} /><input placeholder="Search dish" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn ghost" onClick={() => setEdit({})}><Icon name="plus" size={18} /> Add</button>
      </div>
      <button className="ai-cta" onClick={() => setAi(true)}><span className="ai-spark">✨</span><span className="grow"><b>Add dishes with AI</b><small>Click a photo of your menu card or type dish names — photos, calories & details fill in by themselves</small></span><Icon name="right" size={18} /></button>
      <div className="row between">
        <p className="tiny muted">{`${items.length} dishes · ${items.filter((i) => i.available === false).length} sold out`}</p>
        {sel ? <button className="link small" onClick={() => setSel(null)}>Cancel</button> : <button className="btn small ghost" onClick={() => setSel(new Set())}><Icon name="check" size={14} /> Select</button>}
      </div>
      {sel && (
        <div className="sel-bar">
          <label className="check-row"><input type="checkbox" checked={allSel} onChange={(e) => setSel(e.target.checked ? new Set(list.map((i) => i.id)) : new Set())} /> {`All (${sel.size} selected)`}</label>
          <div className="row gap wrap">
            <button className="btn small ghost" disabled={!sel.size || busy} onClick={() => runBulk('off')}>Sold out</button>
            <button className="btn small ghost" disabled={!sel.size || busy} onClick={() => runBulk('on')}>In stock</button>
            <button className="btn small danger" disabled={!sel.size || busy} onClick={() => setAskDel(true)}><Icon name="trash" size={14} /> {`Delete (${sel.size})`}</button>
          </div>
        </div>
      )}
      {list.map((it) => (
        <div key={it.id} className={'mm-row' + (it.available === false ? ' off' : '') + (sel?.has(it.id) ? ' picked' : '')}>
          {sel && <input type="checkbox" className="mm-check" checked={sel.has(it.id)} onChange={() => toggleSel(it.id)} />}
          <Img src={it.img} alt="" className="mm-img" />
          <div className="grow" onClick={() => (sel ? toggleSel(it.id) : setEdit(it))}>
            <b>{it.name}</b>
            <small className="muted">{priceText(it)} · {it.qty}{it.kcal ? ` · ~${it.kcal} kcal` : ''}{it.aiAdded ? ' · ✨ AI' : ''}</small>
          </div>
          <Toggle on={it.available !== false} onChange={(v) => avail(it, v)} label="In stock" />
        </div>
      ))}
      <ItemEditor open={!!edit} item={edit} restId={restId} onClose={() => setEdit(null)} />
      <SmartAdd open={ai} restId={restId} onClose={() => setAi(false)} />
      <Confirm open={askDel} onClose={() => setAskDel(false)} danger title={`Delete ${sel?.size || 0} dishes permanently?`} text="They will be removed from your menu. This cannot be undone." okText="Delete" onOk={() => runBulk('del')} />
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
    if (!f.name.trim() || !(Number(f.price) > 0 || f.onMrp)) { toast(t('Name and price are required'), 'err'); return; }
    setBusy(true);
    const data = { restaurantId: restId, name: f.name.trim(), price: Number(f.price) || 0, onMrp: !!f.onMrp, kcal: Number(f.kcal) || 0, qty: f.qty.trim(), desc: f.desc.trim(), story: (f.story || '').trim(), cat: f.cat, img: f.img || '', gallery: (f.gallery && f.gallery.length ? f.gallery : [f.img]).filter(Boolean), bestseller: !!f.bestseller, veg: true, available: f.available !== false, sort: f.sort || 50 };
    try { await put('items', item?.id || `${restId}--${Date.now().toString(36)}`, data); toast(t('Saved')); onClose(); } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'Add dish' : 'Edit dish'} full>
      <div className="img-pick"><Img src={f.img} alt="" /></div>
      <p className="tiny muted">{f.img ? 'Change main photo' : 'Add main photo'}</p>
      <PhotoPick onPick={(img) => setF({ ...f, img, gallery: [img, ...(f.gallery || []).filter((g) => g !== f.img)].slice(0, 5) })} />
      <div className="gal-edit">
        {(f.gallery || []).filter((g) => g && g !== f.img).map((g) => (
          <span key={g.slice(-40)} className="gal-th"><Img src={g} alt="" /><button type="button" aria-label="Remove" onClick={() => setF({ ...f, gallery: f.gallery.filter((x) => x !== g) })}><Icon name="x" size={14} /></button></span>
        ))}
        {(f.gallery || []).length < 5 && f.img && <div className="gal-add"><small className="muted">More photos</small><PhotoPick onPick={(img) => setF({ ...f, gallery: [...(f.gallery || [f.img]), img].slice(0, 5) })} /></div>}
      </div>
      <p className="tiny muted"><VegMark size={11} /> FoodGaon is 100% vegetarian — only veg dishes are allowed.</p>
      <Field label="Dish name"><input className="input" value={f.name} onChange={set('name')} /></Field>
      <div className="row gap">
        <Field label={f.onMrp ? 'MRP (₹, optional)' : 'Price (₹)'}><input className="input" inputMode="decimal" value={f.price} onChange={set('price')} placeholder={f.onMrp ? 'On MRP' : ''} /><label className={'ai-mrp' + (f.onMrp ? ' on' : '')} style={{ marginTop: 6 }}><input type="checkbox" checked={!!f.onMrp} onChange={(e) => setF({ ...f, onMrp: e.target.checked })} /> On MRP</label></Field>
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
