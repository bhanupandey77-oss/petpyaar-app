import React, { useMemo, useState } from 'react';
import { Icon, Img, VegMark, Stepper, useToast, Sheet } from '../ui.jsx';
import { useApp } from '../App.jsx';
import { useRestaurants, useItems, useCart, cartStore } from '../lib/data.js';
import { CATEGORIES } from '../data/menu.js';
import { rupee } from '../lib/utils.js';
import { t } from '../i18n/index.js';

export default function RestaurantPage({ id, nav }) {
  const { config } = useApp();
  const rest = (useRestaurants() || []).find((r) => r.id === id);
  const all = useItems() || [];
  const [q, setQ] = useState('');
  const [view, setView] = useState(null);
  const items = all.filter((i) => i.restaurantId === id);
  const groups = useMemo(() => {
    const list = items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()));
    const best = list.filter((i) => i.bestseller);
    const g = [];
    if (best.length && !q) g.push({ id: 'best', name: 'Bestsellers', items: best });
    CATEGORIES.forEach((c) => { const x = list.filter((i) => i.cat === c.id); if (x.length) g.push({ id: c.id, name: c.name, items: x }); });
    const other = list.filter((i) => !CATEGORIES.some((c) => c.id === i.cat));
    if (other.length) g.push({ id: 'other', name: 'More', items: other });
    return g;
  }, [items, q]);

  if (!rest) return <div className="page"><TopBar onBack={nav.back} /><div className="skeleton" style={{ height: 200, margin: 16 }} /></div>;

  return (
    <div className="rest-page">
      <div className="rp-hero">
        <Img src={rest.cover} alt="" className="kenburns" />
        <div className="rp-shade" />
        <TopBar onBack={nav.back} light />
      </div>
      <div className="rp-card">
        <h1 data-notr="">{rest.name}</h1>
        <p className="muted">{rest.tagline}</p>
        <div className="rp-stats">
          <span className="rating big"><Icon name="star" size={14} fill="#fff" stroke={0} />{Number(rest.rating || 4.2).toFixed(1)}</span>
          <span><Icon name="clock" size={16} /> {`${(rest.prepMins || 20) + 10}-${(rest.prepMins || 20) + 20} mins`}</span>
          <span><VegMark size={13} /> Pure veg</span>
        </div>
        <div className="rp-addr"><Icon name="pin" size={15} /> <span data-notr="">{rest.address}</span></div>
        <div className="rp-offer"><Icon name="bike" size={18} /> <b>FREE delivery</b> on every order</div>
        {rest.open === false && <div className="alert alert-red">This restaurant is closed right now. You can see the menu, ordering opens when it is back.</div>}
      </div>

      <div className="rp-search">
        <Icon name="search" size={18} />
        <input placeholder="Search in menu" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {groups.map((g) => (
        <section key={g.id} className="menu-sec">
          <h3>{g.name} <small>{g.items.length}</small></h3>
          {g.items.map((it) => <MenuItem key={g.id + it.id} it={it} rest={rest} showKcal={config.showCalories} onView={() => setView(it)} />)}
        </section>
      ))}
      {!groups.length && <p className="muted center pad">No dishes found</p>}
      <p className="kcal-note"><Icon name="info" size={14} /> Calories are approximate, per serving shown. Eat mindfully.</p>

      <Sheet open={!!view} onClose={() => setView(null)} title={view?.name || ''}>
        {view && (
          <div className="item-view">
            <Img src={view.img} alt="" className="iv-img" />
            <div className="row between"><span><VegMark /> <b>{rupee(view.price)}</b> · <span className="muted">{view.qty}</span></span>
              {config.showCalories && view.kcal > 0 && <span className="kcal big"><Icon name="fire" size={14} /> {`~${view.kcal} kcal`}</span>}</div>
            <p className="muted">{view.desc}</p>
            <ItemAdd it={view} rest={rest} />
          </div>
        )}
      </Sheet>
    </div>
  );
}

export function TopBar({ onBack, title, light, right }) {
  return (
    <div className={'topbar' + (light ? ' light' : '')}>
      <button className="icon-btn round" onClick={onBack} aria-label="Back"><Icon name="back" stroke={2.6} /></button>
      {title && <h2>{title}</h2>}
      <span className="grow" />
      {right}
    </div>
  );
}

function useAdd(it, rest) {
  const toast = useToast();
  return () => {
    if (rest && rest.open === false) { toast(t('Restaurant is closed right now'), 'err'); return; }
    if (it.available === false) return;
    if (!cartStore.add(it)) {
      if (confirm(t('Your cart has items from another restaurant. Start a new cart?'))) cartStore.replaceWith(it);
    }
  };
}
function ItemAdd({ it, rest }) {
  const cart = useCart(); const add = useAdd(it, rest);
  return <div className="iv-add"><Stepper qty={cart.items[it.id]?.qty || 0} onAdd={add} onSub={() => cartStore.sub(it.id)} /></div>;
}

export function MenuItem({ it, rest, showKcal, onView }) {
  const cart = useCart();
  const qty = cart.items[it.id]?.qty || 0;
  const add = useAdd(it, rest);
  const off = it.available === false;
  return (
    <div className={'menu-item' + (off ? ' off' : '')}>
      <div className="mi-info" onClick={onView}>
        <div className="mi-tags"><VegMark size={13} />{it.bestseller && <span className="best-tag"><Icon name="star" size={11} fill="currentColor" stroke={0} /> Bestseller</span>}</div>
        <b className="mi-name">{it.name}</b>
        <div className="mi-price">{rupee(it.price)} <small className="muted">· {it.qty}</small></div>
        {showKcal && it.kcal > 0 && <span className="kcal"><Icon name="fire" size={12} /> {`~${it.kcal} kcal`}</span>}
        <p className="mi-desc">{it.desc}</p>
      </div>
      <div className="mi-side">
        <button className="mi-img" onClick={onView}><Img src={it.img} alt="" /></button>
        {off ? <span className="soldout">Sold out</span> : <Stepper qty={qty} onAdd={add} onSub={() => cartStore.sub(it.id)} />}
      </div>
    </div>
  );
}
