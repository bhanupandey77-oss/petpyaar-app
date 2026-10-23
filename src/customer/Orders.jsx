import React, { useEffect, useRef, useState } from 'react';
import { Icon, Empty, StatusChip, STATUS, Confirm, useToast, VegMark } from '../ui.jsx';
import { useApp } from '../App.jsx';
import { useDoc, setStatus, ACTIVE } from '../lib/data.js';
import { patch } from '../lib/fb.js';
import { rupee, fmtDateTime, fmtTime, tel, plain, km, ms, systemNotify } from '../lib/utils.js';
import MapView from '../components/MapView.jsx';
import { TopBar } from './RestaurantPage.jsx';
import { t, tr } from '../i18n/index.js';

export function OrdersList({ orders, nav }) {
  const { user, askLogin } = useApp();
  if (!user) return <div className="page"><div className="page-head"><h2>Orders</h2></div><Empty icon="receipt" title="Log in to see your orders" action={<button className="btn primary" onClick={askLogin}>Log in</button>} /></div>;
  const list = [...(orders || [])].sort((a, b) => b.createdMs - a.createdMs);
  return (
    <div className="page">
      <div className="page-head"><h2>Your orders</h2></div>
      <div className="pad-x">
        {orders === undefined && [1, 2].map((i) => <div key={i} className="order-card skeleton" style={{ height: 110 }} />)}
        {orders && !list.length && <Empty icon="receipt" title="No orders yet" text="Your hot, fresh food is just a few taps away." />}
        {list.map((o, i) => (
          <button key={o.id} className="order-card" style={{ animationDelay: i * 50 + 'ms' }} onClick={() => nav.track(o.id)}>
            <div className="row between"><b data-notr="">{o.restaurantName}</b><StatusChip s={o.status} /></div>
            <p className="small muted">{o.items.map((x) => `${tr(x.name)} × ${x.qty}`).join(', ')}</p>
            <div className="row between small"><span className="muted">{fmtDateTime(o.createdMs)}</span><b>{rupee(o.total)}</b></div>
          </button>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { k: 'placed', label: 'Order placed', icon: 'receipt' },
  { k: 'accepted', label: 'Accepted & cooking', icon: 'fire' },
  { k: 'ready', label: 'Food ready', icon: 'bag' },
  { k: 'picked', label: 'On the way', icon: 'bike' },
  { k: 'delivered', label: 'Delivered', icon: 'home' },
];
const stepIndex = (s) => ({ placed: 0, accepted: 1, preparing: 1, ready: 2, picked: 3, delivered: 4 }[s] ?? 0);

export function TrackOrder({ id, fresh, nav }) {
  const toast = useToast();
  const o = useDoc('orders', id);
  const rider = useDoc('riderLoc', o?.riderPhone && ['accepted', 'preparing', 'ready', 'picked'].includes(o?.status) ? o.riderPhone : null);
  const [party, setParty] = useState(!!fresh);
  const [cancel, setCancel] = useState(false);
  const last = useRef(null);
  useEffect(() => { if (party) { const x = setTimeout(() => setParty(false), 2600); return () => clearTimeout(x); } }, [party]);
  useEffect(() => {
    if (!o) return;
    if (last.current && last.current !== o.status) systemNotify('PetPyaar', t(STATUS[o.status]?.label || o.status));
    last.current = o.status;
  }, [o?.status]); // eslint-disable-line

  if (o === undefined) return <div className="page"><TopBar onBack={nav.back} title="Order" /><div className="skeleton" style={{ height: 240, margin: 16 }} /></div>;
  if (o === null) return <div className="page"><TopBar onBack={nav.back} title="Order" /><Empty title="Order not found" /></div>;

  const idx = stepIndex(o.status);
  const dead = o.status === 'cancelled' || o.status === 'rejected';
  const live = ACTIVE.includes(o.status);
  const restP = o.restLat ? { id: 'rest', kind: 'rest', lat: o.restLat, lng: o.restLng } : null;
  const homeP = o.address?.lat ? { id: 'home', kind: 'home', lat: o.address.lat, lng: o.address.lng } : null;
  const riderP = rider?.lat && o.status === 'picked' ? { id: 'rider', kind: 'rider', lat: rider.lat, lng: rider.lng } : null;
  const eta = etaText(o, rider, homeP);

  const rate = async (n) => { try { await patch('orders', o.id, { rating: n }); toast(t('Thanks for rating!')); } catch { toast(t('Could not save'), 'err'); } };

  return (
    <div className="page track-page">
      {party && <OrderParty />}
      <TopBar onBack={nav.back} title={`Order #${o.code}`} />
      <div className={'track-hero tone-' + (dead ? 'red' : o.status === 'delivered' ? 'green' : 'orange')}>
        <div className="th-status">
          {live && <span className="pulse-dot" />}
          <div><b>{t(STATUS[o.status]?.label || o.status)}</b>{eta && live && <small>{eta}</small>}</div>
        </div>
        {o.status === 'picked' && <div className="road"><span className="scooter"><Icon name="bike" size={30} /></span></div>}
        {(o.status === 'accepted' || o.status === 'preparing') && <div className="cooking"><span /><span /><span /><Icon name="fire" size={34} /></div>}
      </div>

      {(restP || homeP) && live && <MapView height={220} points={[restP, homeP, riderP].filter(Boolean)} className="track-map" />}

      <div className="pad-x">
        {!dead && (
          <div className="card steps-card">
            {STEPS.map((s, i) => (
              <div key={s.k} className={'tstep' + (i < idx ? ' done' : i === idx ? ' cur' : '')}>
                <span className="ts-ic"><Icon name={i < idx ? 'check' : s.icon} size={16} stroke={2.6} /></span>
                <span className="grow">{s.label}</span>
                <small className="muted">{o.timeline?.[s.k] ? fmtTime(o.timeline[s.k]) : s.k === 'accepted' && o.timeline?.preparing ? fmtTime(o.timeline.preparing) : ''}</small>
              </div>
            ))}
          </div>
        )}
        {dead && <div className="alert alert-red">{o.status === 'rejected' ? `Sorry, the restaurant could not take this order. ${o.cancelReason || ''}` : 'This order was cancelled.'}</div>}

        {o.riderPhone && live && (
          <div className="card person">
            <span className="avatar"><Icon name="bike" size={22} /></span>
            <div className="grow"><b data-notr="">{o.riderName || 'Delivery partner'}</b><small className="muted">Your delivery partner</small></div>
            <a className="icon-btn round green" href={tel(o.riderPhone)} aria-label="Call delivery partner"><Icon name="phone" size={20} /></a>
          </div>
        )}
        <div className="card person">
          <span className="avatar"><Icon name="store" size={22} /></span>
          <div className="grow"><b data-notr="">{o.restaurantName}</b><small className="muted" data-notr="">{o.restaurantAddr}</small></div>
          {o.restaurantPhone && <a className="icon-btn round" href={tel(o.restaurantPhone)} aria-label="Call restaurant"><Icon name="phone" size={20} /></a>}
        </div>

        {o.status === 'delivered' && !o.rating && (
          <div className="card center">
            <b>How was your food?</b>
            <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => rate(n)} aria-label={`${n} stars`}><Icon name="star" size={32} fill="#ffb627" stroke={0} /></button>)}</div>
          </div>
        )}
        {o.rating > 0 && <p className="center muted small">{`You rated ${o.rating} ★ — thank you!`}</p>}

        <div className="card">
          <h4>Order details</h4>
          {o.items.map((x) => (
            <div key={x.id} className="bill"><span><VegMark size={11} /> {x.name} × {x.qty}</span><span>{rupee(x.price * x.qty)}</span></div>
          ))}
          {o.discount > 0 && <div className="bill t-green"><span>{`Coupon ${o.offerCode}`}</span><span>− {rupee(o.discount)}</span></div>}
          <div className="bill"><span>Delivery fee</span><span className="t-green">{o.deliveryFee ? rupee(o.deliveryFee) : 'FREE'}</span></div>
          <div className="bill total"><span>{o.payment === 'cod' ? 'To pay in cash' : o.payment === 'upi_rider' ? 'To pay by UPI on delivery' : 'Paid by UPI'}</span><span>{rupee(o.total)}</span></div>
          {o.kcal > 0 && <p className="tiny muted"><Icon name="fire" size={12} /> {`About ${o.kcal} kcal`}</p>}
          <p className="tiny muted">{fmtDateTime(o.createdMs)} · <span data-notr="">{o.address?.line}</span></p>
          {o.note && <p className="tiny muted">{`Note: ${o.note}`}</p>}
        </div>

        {o.status === 'placed' && <button className="btn ghost danger-text block" onClick={() => setCancel(true)}>Cancel order</button>}
      </div>
      <Confirm open={cancel} onClose={() => setCancel(false)} danger title="Cancel this order?" text="The restaurant has not accepted it yet, so you can cancel for free." okText="Yes, cancel"
        onOk={() => setStatus(o, 'cancelled', { cancelReason: 'Cancelled by customer' }).catch(() => toast(t('Could not cancel. The restaurant may have accepted already.'), 'err'))} />
    </div>
  );
}

function etaText(o, rider, homeP) {
  if (o.status === 'picked' && rider?.lat && homeP) {
    const d = km(rider, homeP);
    if (d != null) return `${Math.max(2, Math.round((d / 18) * 60) + 2)} min away · ${d.toFixed(1)} km`;
  }
  if (o.status === 'placed') return 'Usually accepted within 2 minutes';
  if (['accepted', 'preparing', 'ready'].includes(o.status)) {
    const base = (o.timeline?.accepted || o.timeline?.preparing || ms(o.createdMs)) + ((o.prepMins || 20) + 12) * 60000;
    const m = Math.max(5, Math.round((base - Date.now()) / 60000));
    return `Arriving in about ${m} min`;
  }
  return '';
}

function OrderParty() {
  const bits = Array.from({ length: 36 });
  return (
    <div className="party">
      <div className="confetti">{bits.map((_, i) => <i key={i} style={{ left: (i * 37) % 100 + '%', animationDelay: (i % 9) * 0.08 + 's', background: ['#e8461a', '#ffb627', '#1e9e55', '#ff7ab6', '#3d8bfd'][i % 5] }} />)}</div>
      <div className="party-card">
        <svg className="check-draw" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
        <b>Order placed!</b>
        <span>Sending it to the restaurant…</span>
      </div>
    </div>
  );
}
