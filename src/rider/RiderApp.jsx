import React, { useEffect, useRef, useState } from 'react';
import { Icon, Toggle, Empty, useToast, StatusChip, Logo, BottomNav, Confirm } from '../ui.jsx';
import { useApp, RoleSwitchButton } from '../App.jsx';
import { useList, setStatus } from '../lib/data.js';
import { put, patch } from '../lib/fb.js';
import { watchPosition } from '../lib/native.js';
import { rupee, fmtTime, tel, plain, mapsDir, km, todayKey, ding, unlockAudio, systemNotify, askNotifyPermission, LS } from '../lib/utils.js';
import MapView from '../components/MapView.jsx';
import { t } from '../i18n/index.js';

const OPEN = ['accepted', 'preparing', 'ready'];

export default function RiderApp() {
  const { phone, staff, user, logout } = useApp();
  const toast = useToast();
  const name = staff?.name || user?.displayName || 'Rider';
  const mine = useList('orders', [['riderPhone', '==', phone]], [phone]);
  const free = useList('orders', [['riderPhone', '==', '']], []);
  const [online, setOnline] = useState(() => LS.get('pp_online', true));
  const [pos, setPos] = useState(null);
  const [tab, setTab] = useState('live');
  const lastSent = useRef(0);
  const seen = useRef(null);

  useEffect(() => { askNotifyPermission(); window.addEventListener('pointerdown', unlockAudio, { once: true }); }, []);
  // live GPS while online
  useEffect(() => {
    LS.set('pp_online', online);
    put('riderLoc', phone, { online, name, ts: Date.now() }).catch(() => {});
    if (!online) return;
    let stop = () => {};
    watchPosition((p) => {
      setPos(p);
      if (Date.now() - lastSent.current > 8000) { lastSent.current = Date.now(); put('riderLoc', phone, { lat: p.lat, lng: p.lng, acc: p.acc || 0, ts: Date.now(), online: true, name }).catch(() => {}); }
    }).then((s) => { stop = s; }).catch((e) => toast(t(e.message || 'Location permission denied'), 'err'));
    return () => stop();
  }, [online, phone]); // eslint-disable-line

  const active = (mine || []).filter((o) => [...OPEN, 'picked'].includes(o.status)).sort((a, b) => a.createdMs - b.createdMs);
  const avail = (free || []).filter((o) => OPEN.includes(o.status)).sort((a, b) => a.createdMs - b.createdMs);
  // alert when an order is assigned to me / becomes available
  useEffect(() => {
    if (!mine || !free) return;
    const ids = new Set([...active, ...avail].map((o) => o.id));
    if (seen.current && online) {
      const nw = [...ids].filter((x) => !seen.current.has(x));
      if (nw.length) { ding(3); systemNotify(t('New delivery'), t('Open PetPyaar to see the order')); }
    }
    seen.current = ids;
  }, [mine, free]); // eslint-disable-line

  const today = (mine || []).filter((o) => o.status === 'delivered' && o.day === todayKey());
  const cash = today.filter((o) => o.payment === 'cod').reduce((a, o) => a + o.total, 0);

  return (
    <div className="panel">
      <header className="panel-head rider-head">
        <div className="ph-row">
          <Logo size={34} />
          <div className="grow"><b data-notr="">{name}</b><small>Delivery partner</small></div>
          <RoleSwitchButton />
          <button className="icon-btn light" onClick={logout} aria-label="Log out"><Icon name="logout" /></button>
        </div>
        <div className={'open-switch' + (online ? ' on' : '')}>
          <span><b>{online ? 'You are online' : 'You are offline'}</b><small>{online ? (pos ? 'Sharing live location with customers' : 'Getting GPS…') : 'Go online to get orders'}</small></span>
          <Toggle on={online} onChange={setOnline} label="Online" />
        </div>
      </header>

      {tab === 'live' && (
        <div className="pad-x page-anim">
          <div className="kpis">
            <div><b>{active.length}</b><small>My orders</small></div>
            <div><b>{today.length}</b><small>Delivered today</small></div>
            <div><b>{rupee(cash)}</b><small>Cash collected</small></div>
          </div>
          {online && <p className="tiny muted center">Keep this screen open while delivering so the customer can see you on the map.</p>}
          {active.map((o) => <DeliveryCard key={o.id} o={o} me={pos} />)}
          {avail.length > 0 && <h3 className="board-h new">Available orders</h3>}
          {avail.map((o) => <DeliveryCard key={o.id} o={o} me={pos} available phone={phone} name={name} />)}
          {!active.length && !avail.length && <Empty icon="bike" title="No deliveries right now" text={online ? 'New orders will ring here.' : 'Go online to receive orders.'} />}
        </div>
      )}
      {tab === 'history' && (
        <div className="pad-x page-anim">
          <h3>Delivered today</h3>
          {today.map((o) => <div key={o.id} className="bill"><span>#{o.code} · <span data-notr="">{o.restaurantName}</span> · {fmtTime(o.timeline?.delivered)}</span><span>{o.payment === 'cod' ? rupee(o.total) : 'UPI'}</span></div>)}
          {!today.length && <p className="muted center">Nothing yet today</p>}
        </div>
      )}
      <BottomNav value={tab} onChange={setTab} tabs={[{ id: 'live', icon: 'bike', label: 'Deliveries', badge: avail.length }, { id: 'history', icon: 'receipt', label: 'History' }]} />
    </div>
  );
}

function DeliveryCard({ o, me, available, phone, name }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const rest = o.restLat ? { lat: o.restLat, lng: o.restLng } : null;
  const home = o.address?.lat ? { lat: o.address.lat, lng: o.address.lng } : null;
  const run = async (fn) => { setBusy(true); try { await fn(); } catch (e) { console.warn(e); toast(t('Could not save. Maybe another partner took this order.'), 'err'); } setBusy(false); };
  const d1 = km(me, rest); const d2 = km(rest, home);
  const picked = o.status === 'picked';
  return (
    <div className={'dcard' + (available ? ' avail' : '')}>
      <div className="row between"><b>#{o.code}</b><StatusChip s={o.status} /></div>
      {(rest || home) && <MapView height={150} points={[rest && { id: 'r', kind: 'rest', ...rest }, home && { id: 'h', kind: 'home', ...home }, me && { id: 'me', kind: 'rider', ...me }].filter(Boolean)} />}
      <div className={'leg' + (picked ? ' done' : '')}>
        <span className="leg-ic"><Icon name="store" size={18} /></span>
        <div className="grow"><small>PICK UP{d1 != null ? ` · ${d1.toFixed(1)} km` : ''}</small><b data-notr="">{o.restaurantName}</b><p className="tiny muted" data-notr="">{o.restaurantAddr}</p></div>
        {rest && <a className="icon-btn round" href={mapsDir(rest)} target="_blank" rel="noreferrer" aria-label="Navigate to restaurant"><Icon name="nav" size={18} /></a>}
        {o.restaurantPhone && <a className="icon-btn round" href={tel(o.restaurantPhone)} aria-label="Call restaurant"><Icon name="phone" size={18} /></a>}
      </div>
      <div className="leg">
        <span className="leg-ic home"><Icon name="home" size={18} /></span>
        <div className="grow"><small>DROP{d2 != null ? ` · ${d2.toFixed(1)} km from shop` : ''}</small><b data-notr="">{o.address?.name || o.customerName}</b><p className="tiny muted" data-notr="">{o.address?.line}</p></div>
        {home ? <a className="icon-btn round" href={mapsDir(home)} target="_blank" rel="noreferrer" aria-label="Navigate to customer"><Icon name="nav" size={18} /></a> : <span className="tiny t-red">No GPS</span>}
        <a className="icon-btn round green" href={tel(o.address?.phone || o.customerPhone)} aria-label="Call customer"><Icon name="phone" size={18} /></a>
      </div>
      <div className="row between small"><span>{`${o.items.reduce((a, x) => a + x.qty, 0)} items`}</span>
        <b>{o.payment === 'cod' ? `Collect cash ${rupee(o.total)}` : o.payment === 'upi_rider' ? `Collect UPI ${rupee(o.total)}` : 'Prepaid'}</b></div>

      {available && <button className="btn primary block" disabled={busy} onClick={() => run(() => patch('orders', o.id, { riderPhone: phone, riderName: name }))}><Icon name="check" size={18} /> Accept delivery</button>}
      {!available && !picked && (
        <button className="btn primary block" disabled={busy || o.status !== 'ready'} onClick={() => run(() => setStatus(o, 'picked'))}>
          {o.status === 'ready' ? 'Picked up the food' : 'Waiting for food to be ready…'}
        </button>
      )}
      {!available && picked && <button className="btn green block lg" disabled={busy} onClick={() => setDone(true)}><Icon name="check" size={18} /> Delivered</button>}
      <Confirm open={done} onClose={() => setDone(false)} title="Mark as delivered?" okText="Yes, delivered"
        text={o.payment === 'prepaid' || o.payment === 'upi_now' ? 'Hand over the food to the customer.' : `Make sure you collected ${rupee(o.total)} from the customer.`}
        onOk={() => run(() => setStatus(o, 'delivered', { paid: true }))} />
    </div>
  );
}
