import React, { useEffect, useRef, useState } from 'react';
import { Icon, Img, VegMark, Wordmark, Logo, Stepper, useToast } from '../ui.jsx';
import { useApp } from '../App.jsx';
import { useRestaurants, useItems, useBanners, useCart, cartStore } from '../lib/data.js';
import { CATEGORIES } from '../data/menu.js';
import { rupee, LS } from '../lib/utils.js';
import { t } from '../i18n/index.js';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function Home({ nav }) {
  const { user, config } = useApp();
  const rests = useRestaurants();
  const items = useItems();
  const banners = useBanners();
  const addr = LS.get('pp_addr_label');
  const name = (user?.displayName || '').split(' ')[0];
  const best = (items || []).filter((i) => i.bestseller && i.available !== false && (rests || []).find((r) => r.id === i.restaurantId)?.open !== false).slice(0, 10);

  return (
    <div className="home">
      <header className="home-hero">
        <div className="blob b1" /><div className="blob b2" />
        <div className="hero-top">
          <button className="addr-btn" onClick={() => nav.go({ name: 'address' })} aria-label="Delivery address">
            <Icon name="pin" size={20} />
            <span><b>{addr || 'Haidergarh'}</b><small data-notr="">{config.serviceArea}</small></span>
          </button>
          <Logo size={38} />
        </div>
        <h1 className="hero-title"><span>{name ? `${greet()}, ${name}!` : `${greet()}!`}</span><br /><em>What would you like to eat?</em></h1>
        <button className="search-bar" onClick={() => nav.go({ name: 'search' })}>
          <Icon name="search" size={20} /><span>Search "paneer", "lassi", "momos"…</span>
        </button>
        <div className="veg-ribbon"><VegMark size={14} /> 100% pure vegetarian · FREE delivery</div>
      </header>

      <Banners list={banners} />

      <section className="sec">
        <h2 className="sec-title">What's on your mind?</h2>
        <div className="cat-row">
          {CATEGORIES.map((c, i) => (
            <button key={c.id} className="cat" style={{ animationDelay: i * 50 + 'ms' }} onClick={() => nav.go({ name: 'search', cat: c.id })}>
              <span className="cat-img"><Img src={c.img} alt="" /></span>
              <b>{c.name}</b>
            </button>
          ))}
        </div>
      </section>

      {best.length > 0 && (
        <section className="sec">
          <h2 className="sec-title"><Icon name="fire" size={20} className="t-orange" /> Bestsellers in town</h2>
          <div className="best-row">
            {best.map((it) => <BestCard key={it.id} it={it} rest={rests.find((r) => r.id === it.restaurantId)} nav={nav} showKcal={config.showCalories} />)}
          </div>
        </section>
      )}

      <section className="sec">
        <h2 className="sec-title">{rests ? `${rests.length} restaurants to explore` : 'Restaurants'}</h2>
        {!rests && [1, 2, 3].map((i) => <div key={i} className="rest-card skeleton" />)}
        {rests && rests.map((r, i) => <RestCard key={r.id} r={r} i={i} onOpen={() => nav.openRest(r.id)} />)}
      </section>

      <footer className="home-foot">
        <b>Khao, piyo,<br />pyaar karo!</b>
        <span>Crafted with <Icon name="heart" size={14} fill="#e8461a" stroke={0} /> in Haidergarh</span>
        <small data-notr="">Pandey Techno</small>
      </footer>
    </div>
  );
}

function Banners({ list }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const n = list?.length || 0;
  useEffect(() => {
    if (n < 2) return;
    const x = setInterval(() => setI((v) => (v + 1) % n), 3800);
    return () => clearInterval(x);
  }, [n]);
  useEffect(() => { const el = ref.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); }, [i]);
  if (!n) return <div className="banners"><div className="banner skeleton" /></div>;
  return (
    <div className="banners">
      <div className="banner-track" ref={ref} onScroll={(e) => { const w = e.currentTarget.clientWidth; const k = Math.round(e.currentTarget.scrollLeft / w); if (k !== i) setI(k); }}>
        {list.map((b) => (
          <div key={b.id} className="banner">
            <Img src={b.img} alt="" className="banner-img kenburns" />
            <div className="banner-txt"><b>{b.title}</b><span>{b.sub}</span></div>
          </div>
        ))}
      </div>
      <div className="dots">{list.map((b, k) => <i key={b.id} className={k === i ? 'on' : ''} />)}</div>
    </div>
  );
}

export function RestCard({ r, i = 0, onOpen }) {
  return (
    <button className={'rest-card' + (r.open === false ? ' closed' : '')} style={{ animationDelay: i * 60 + 'ms' }} onClick={onOpen}>
      <div className="rc-img">
        <Img src={r.cover} alt="" />
        <span className="rc-free">FREE DELIVERY</span>
        {r.open === false && <span className="rc-closed">Closed now</span>}
      </div>
      <div className="rc-body">
        <div className="rc-row"><b className="rc-name" data-notr="">{r.name}</b><span className="rating"><Icon name="star" size={12} fill="#fff" stroke={0} />{Number(r.rating || 4.2).toFixed(1)}</span></div>
        <div className="rc-meta"><Icon name="clock" size={14} /> {`${(r.prepMins || 20) + 10}-${(r.prepMins || 20) + 20} mins`} · <VegMark size={12} /> Pure veg</div>
        <div className="rc-tag">{r.tagline}</div>
      </div>
    </button>
  );
}

function BestCard({ it, rest, nav, showKcal }) {
  const cart = useCart();
  const toast = useToast();
  const qty = cart.items[it.id]?.qty || 0;
  const add = () => {
    if (!cartStore.add(it)) {
      if (confirm(t('Your cart has items from another restaurant. Start a new cart?'))) cartStore.replaceWith(it);
    } else if (!qty) toast(t('Added to cart'));
  };
  return (
    <div className="best-card">
      <button className="bc-img" onClick={() => nav.openRest(it.restaurantId)}><Img src={it.img} alt="" /><span className="bc-shade" /><b>{it.name}</b></button>
      <div className="bc-body">
        <small className="muted" data-notr="">{rest?.name}</small>
        <div className="bc-row"><b>{rupee(it.price)}</b>{showKcal && it.kcal > 0 && <span className="kcal">{`~${it.kcal} kcal`}</span>}</div>
        <Stepper small qty={qty} onAdd={add} onSub={() => cartStore.sub(it.id)} />
      </div>
    </div>
  );
}
