import React, { useEffect, useRef, useState } from 'react';
import { Icon, BottomNav, Toggle, Empty, Sheet, Field, useToast, StatusChip, Img, VegMark, Logo } from '../ui.jsx';
import { useApp, RoleSwitchButton } from '../App.jsx';
import { useRestaurants, useList, setStatus, ACTIVE } from '../lib/data.js';
import { patch } from '../lib/fb.js';
import { rupee, fmtTime, fmtDateTime, tel, plain, ding, unlockAudio, systemNotify, askNotifyPermission, compressImage, todayKey, dayKey, mapsPin } from '../lib/utils.js';
import { getPosition } from '../lib/native.js';
import MenuManager from './MenuManager.jsx';
import { t, tr } from '../i18n/index.js';

/* rings while there are un-accepted orders */
export function useNewOrderAlert(orders, title = 'New order!') {
  const seen = useRef(null);
  const pending = (orders || []).filter((o) => o.status === 'placed');
  useEffect(() => {
    if (!orders) return;
    const ids = new Set(pending.map((o) => o.id));
    if (seen.current) {
      const fresh = pending.filter((o) => !seen.current.has(o.id));
      if (fresh.length) { ding(4); systemNotify(t(title), `${fresh[0].customerName} · ${rupee(fresh[0].total)}`); }
    }
    seen.current = ids;
  }, [orders]); // eslint-disable-line
  useEffect(() => {
    if (!pending.length) return;
    const x = setInterval(() => ding(2), 6000);
    return () => clearInterval(x);
  }, [pending.length]);
  return pending.length;
}

export default function RestaurantApp() {
  const { staff, logout } = useApp();
  const restId = staff?.restaurant;
  const rest = (useRestaurants() || []).find((r) => r.id === restId);
  const orders = useList('orders', restId ? [['restaurantId', '==', restId]] : null, [restId]);
  const [tab, setTab] = useState('orders');
  const toast = useToast();
  const newCount = useNewOrderAlert(orders);
  useEffect(() => { askNotifyPermission(); const u = () => unlockAudio(); window.addEventListener('pointerdown', u, { once: true }); }, []);
  useEffect(() => { window.__ppBack = () => { if (tab !== 'orders') { setTab('orders'); return true; } return false; }; return () => { window.__ppBack = null; }; });

  if (!restId) return <div className="page"><Empty icon="store" title="No restaurant linked" text="Ask the admin to link your number to a restaurant." action={<button className="btn ghost" onClick={logout}>Log out</button>} /></div>;
  if (!rest) return <div className="page"><div className="skeleton" style={{ height: 160, margin: 16 }} /></div>;

  const toggleOpen = async (v) => { try { await patch('restaurants', rest.id, { open: v }); toast(t(v ? 'Restaurant is now OPEN' : 'Restaurant is now CLOSED')); } catch { toast(t('Could not save'), 'err'); } };

  return (
    <div className="panel">
      <header className="panel-head rest-head">
        <div className="ph-row">
          <Logo size={34} />
          <div className="grow"><b data-notr="">{rest.name}</b><small>Restaurant panel</small></div>
          <RoleSwitchButton />
          <button className="icon-btn light" onClick={logout} aria-label="Log out"><Icon name="logout" /></button>
        </div>
        <div className={'open-switch' + (rest.open !== false ? ' on' : '')}>
          <span><b>{rest.open !== false ? 'Accepting orders' : 'Closed'}</b><small>{rest.open !== false ? 'Customers can order now' : 'Customers cannot order'}</small></span>
          <Toggle on={rest.open !== false} onChange={toggleOpen} label="Open / closed" />
        </div>
      </header>
      <div className="page-anim" key={tab}>
        {tab === 'orders' && <RestOrders orders={orders} />}
        {tab === 'menu' && <MenuManager restId={rest.id} />}
        {tab === 'money' && <Earnings orders={orders} />}
        {tab === 'shop' && <ShopSettings rest={rest} />}
      </div>
      <BottomNav value={tab} onChange={setTab} tabs={[
        { id: 'orders', icon: 'receipt', label: 'Orders', badge: newCount },
        { id: 'menu', icon: 'list', label: 'Menu' },
        { id: 'money', icon: 'chart', label: 'Earnings' },
        { id: 'shop', icon: 'store', label: 'Shop' },
      ]} />
    </div>
  );
}

export function RestOrders({ orders, showRest }) {
  const { config } = useApp();
  if (orders === undefined) return <div className="pad"><div className="skeleton" style={{ height: 120 }} /></div>;
  const today = todayKey();
  const by = (s) => orders.filter((o) => s.includes(o.status)).sort((a, b) => a.createdMs - b.createdMs);
  const nw = by(['placed']); const cook = by(['accepted', 'preparing']); const ready = by(['ready']); const out = by(['picked']);
  const done = orders.filter((o) => o.day === today && o.status === 'delivered');
  return (
    <div className="pad-x orders-board">
      <div className="kpis">
        <div><b>{nw.length}</b><small>New</small></div>
        <div><b>{cook.length}</b><small>Cooking</small></div>
        <div><b>{ready.length + out.length}</b><small>Ready / out</small></div>
        <div><b>{done.length}</b><small>Done today</small></div>
      </div>
      {!nw.length && !cook.length && !ready.length && !out.length && <Empty icon="receipt" title="No live orders" text="New orders will ring loudly here. Keep the app open." />}
      {nw.length > 0 && <h3 className="board-h new">New orders</h3>}
      {nw.map((o) => <OrderCard key={o.id} o={o} riders={config.riders || []} showRest={showRest} />)}
      {cook.length > 0 && <h3 className="board-h">Cooking</h3>}
      {cook.map((o) => <OrderCard key={o.id} o={o} riders={config.riders || []} showRest={showRest} />)}
      {ready.length > 0 && <h3 className="board-h">Ready for pickup</h3>}
      {ready.map((o) => <OrderCard key={o.id} o={o} riders={config.riders || []} showRest={showRest} />)}
      {out.length > 0 && <h3 className="board-h">Out for delivery</h3>}
      {out.map((o) => <OrderCard key={o.id} o={o} riders={config.riders || []} showRest={showRest} />)}
    </div>
  );
}

export function OrderCard({ o, riders, showRest, admin }) {
  const toast = useToast();
  const [reject, setReject] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn) => { setBusy(true); try { await fn(); } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); } setBusy(false); };
  const accept = (mins) => run(() => setStatus(o, 'preparing', { prepMins: mins, 'timeline.accepted': Date.now() }));
  const assign = (phone) => { const r = riders.find((x) => x.phone === phone); return run(() => patch('orders', o.id, { riderPhone: phone || '', riderName: r?.name || '' })); };
  const age = Math.floor((Date.now() - o.createdMs) / 60000);
  return (
    <div className={'ocard st-' + o.status}>
      <div className="row between">
        <span><b>#{o.code}</b> <small className="muted">{fmtTime(o.createdMs)} · {age < 1 ? t('just now') : `${age} min`}</small></span>
        <StatusChip s={o.status} />
      </div>
      {showRest && <div className="small"><Icon name="store" size={14} /> <b data-notr="">{o.restaurantName}</b></div>}
      <div className="oc-items">
        {o.items.map((x) => <div key={x.id}><VegMark size={11} /> <b>{x.qty} ×</b> {x.name}</div>)}
      </div>
      {o.note && <div className="oc-note">{`“${o.note}”`}</div>}
      {o.discount > 0 && <div className="tiny t-green">{`Coupon ${o.offerCode}: − ${rupee(o.discount)}`}{o.discountBy === 'restaurant' ? '' : ` (${t('paid by PetPyaar')})`}</div>}
      <div className="row between small">
        <span>{o.customerName} · <a href={tel(o.customerPhone)}>{plain(o.customerPhone)}</a></span>
        <b>{rupee(o.total)} <small className="muted">{o.payment === 'cod' ? 'Cash' : 'UPI'}</small></b>
      </div>
      {admin && <div className="tiny muted" data-notr="">{o.address?.line}</div>}

      {o.status === 'placed' && (
        <>
          <p className="tiny muted">Accept with cooking time:</p>
          <div className="row gap wrap">
            {[10, 20, 30, 45].map((m) => <button key={m} className="btn primary small grow" disabled={busy} onClick={() => accept(m)}>{`${m} min`}</button>)}
          </div>
          <button className="btn ghost danger-text small block" disabled={busy} onClick={() => setReject(true)}>Reject</button>
        </>
      )}
      {['accepted', 'preparing'].includes(o.status) && (
        <button className="btn green block" disabled={busy} onClick={() => run(() => setStatus(o, 'ready'))}><Icon name="check" size={18} /> Food is ready</button>
      )}
      {['accepted', 'preparing', 'ready'].includes(o.status) && (
        <div className="rider-pick">
          <Icon name="bike" size={18} />
          <select value={o.riderPhone || ''} onChange={(e) => assign(e.target.value)} disabled={busy}>
            <option value="">{t('No delivery partner yet')}</option>
            {riders.map((r) => <option key={r.phone} value={r.phone}>{r.name} · {plain(r.phone)}</option>)}
          </select>
        </div>
      )}
      {o.status === 'picked' && <div className="small"><Icon name="bike" size={14} /> {`${o.riderName || 'Rider'} is delivering`}</div>}
      {admin && ACTIVE.includes(o.status) && o.status !== 'placed' && (
        <div className="row gap wrap">
          {o.status === 'ready' && <button className="btn small ghost grow" onClick={() => run(() => setStatus(o, 'picked'))}>Mark picked</button>}
          {o.status === 'picked' && <button className="btn small green grow" onClick={() => run(() => setStatus(o, 'delivered', { paid: true }))}>Mark delivered</button>}
          <button className="btn small ghost danger-text" onClick={() => run(() => setStatus(o, 'cancelled', { cancelReason: 'Cancelled by admin' }))}>Cancel</button>
        </div>
      )}

      <Sheet open={reject} onClose={() => setReject(false)} title="Reject order">
        <div className="chip-row wrap">
          {['Item not available', 'Too busy right now', 'Closing soon', 'Address too far'].map((r) => <button key={r} className={'fchip' + (reason === r ? ' on' : '')} onClick={() => setReason(r)}>{r}</button>)}
        </div>
        <button className="btn danger block" disabled={!reason || busy} onClick={() => { setReject(false); run(() => setStatus(o, 'rejected', { cancelReason: reason })); }}>Reject order</button>
      </Sheet>
    </div>
  );
}

export function Earnings({ orders, title }) {
  const [range, setRange] = useState(1);
  if (orders === undefined) return null;
  const since = dayKey(Date.now() - (range - 1) * 86400000);
  const list = orders.filter((o) => o.status === 'delivered' && o.day >= since).sort((a, b) => b.createdMs - a.createdMs);
  const sum = (k) => list.reduce((a, o) => a + Number(o[k] || 0), 0);
  return (
    <div className="pad-x">
      {title && <h3>{title}</h3>}
      <div className="seg">
        {[[1, 'Today'], [7, '7 days'], [30, '30 days']].map(([v, l]) => <button key={v} className={range === v ? 'on' : ''} onClick={() => setRange(v)}>{l}</button>)}
      </div>
      <div className="money-grid">
        <div className="mg big"><small>Food sales</small><b>{rupee(sum('itemTotal'))}</b><span>{`${list.length} orders delivered`}</span></div>
        {sum('discount') > 0 && <div className="mg"><small>Your coupon discounts</small><b className="t-red">− {rupee(list.filter((o) => o.discountBy === 'restaurant').reduce((a, o) => a + Number(o.discount || 0), 0))}</b></div>}
        <div className="mg"><small>PetPyaar fee</small><b className="t-red">− {rupee(sum('commission'))}</b></div>
        <div className="mg"><small>Delivery cost</small><b className="t-red">− {rupee(sum('restDelivery'))}</b></div>
        <div className="mg big green"><small>Your earning</small><b>{rupee(sum('payable'))}</b></div>
      </div>
      <div className="card">
        {list.map((o) => (
          <div key={o.id} className="bill"><span>#{o.code} · {fmtDateTime(o.createdMs)}</span><span>{rupee(o.payable)}</span></div>
        ))}
        {!list.length && <p className="muted small center">No delivered orders in this period</p>}
      </div>
    </div>
  );
}

function ShopSettings({ rest }) {
  const toast = useToast();
  const [f, setF] = useState({ tagline: rest.tagline || '', address: rest.address || '', prepMins: rest.prepMins || 20, ownerPhone: rest.ownerPhone || '' });
  const [busy, setBusy] = useState(false);
  const save = async (extra = {}) => {
    setBusy(true);
    try { await patch('restaurants', rest.id, { ...f, prepMins: Number(f.prepMins) || 20, ...extra }); toast(t('Saved')); } catch { toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  const gps = async () => { try { const p = await getPosition(); await save({ lat: p.lat, lng: p.lng }); } catch (e) { toast(t(e.message), 'err'); } };
  const cover = async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const img = await compressImage(file, 1000, 220000); await save({ cover: img }); } catch (er) { toast(t(er.message), 'err'); } };
  return (
    <div className="pad-x">
      <div className="card">
        <div className="cover-edit"><Img src={rest.cover} alt="" /><label className="btn small light"><Icon name="image" size={16} /> Change photo<input type="file" accept="image/*" hidden onChange={cover} /></label></div>
        <Field label="Short line about your food"><input className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
        <Field label="Address"><input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <div className="row gap">
          <Field label="Usual cooking time (min)"><input className="input" inputMode="numeric" value={f.prepMins} onChange={(e) => setF({ ...f, prepMins: e.target.value.replace(/\D/g, '') })} /></Field>
          <Field label="Shop phone"><input className="input" inputMode="numeric" maxLength={10} value={f.ownerPhone} onChange={(e) => setF({ ...f, ownerPhone: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
        <button className="btn primary block" disabled={busy} onClick={() => save()}>Save</button>
      </div>
      <div className="card">
        <h4><Icon name="pin" size={18} /> Shop location on map</h4>
        <p className="small muted">{rest.lat ? <>Saved · <a href={mapsPin(rest)} target="_blank" rel="noreferrer">see on map</a></> : 'Not set'}</p>
        <p className="tiny muted">Stand inside your shop and tap the button, so delivery partners find you easily.</p>
        <button className="btn ghost block" onClick={gps}><Icon name="gps" size={18} /> Set my current location as shop</button>
      </div>
    </div>
  );
}
