import React, { useEffect, useMemo, useState } from 'react';
import { Icon, BottomNav, Toggle, Empty, Sheet, Field, useToast, Img, Logo, Confirm } from '../ui.jsx';
import { useApp, RoleSwitchButton } from '../App.jsx';
import { useRestaurants, useItems, useList, ACTIVE } from '../lib/data.js';
import { put, patch, remove, bulk, getList, watchList } from '../lib/fb.js';
import { rupee, todayKey, dayKey, plain, unlockAudio, askNotifyPermission, fmtDateTime } from '../lib/utils.js';
import { RESTAURANTS, ITEMS, BANNERS, DEFAULT_CONFIG, STAFF } from '../data/menu.js';
import { OrderCard, useNewOrderAlert, Earnings } from '../restaurant/RestaurantApp.jsx';
import MenuManager from '../restaurant/MenuManager.jsx';
import MapView from '../components/MapView.jsx';
import { t } from '../i18n/index.js';

export default function AdminApp() {
  const { logout } = useApp();
  const [tab, setTab] = useState('dash');
  const days = useMemo(() => [todayKey(), dayKey(Date.now() - 86400000)], []);
  const orders = useList('orders', [['day', 'in', days]], [days.join()]);
  const newCount = useNewOrderAlert(orders, 'New order on PetPyaar!');
  useEffect(() => { askNotifyPermission(); window.addEventListener('pointerdown', unlockAudio, { once: true }); }, []);
  useEffect(() => { window.__ppBack = () => { if (tab !== 'dash') { setTab('dash'); return true; } return false; }; return () => { window.__ppBack = null; }; });
  return (
    <div className="panel">
      <header className="panel-head admin-head">
        <div className="ph-row">
          <Logo size={34} />
          <div className="grow"><b>PetPyaar Admin</b><small data-notr="">Pandey Techno</small></div>
          <RoleSwitchButton />
          <button className="icon-btn light" onClick={logout} aria-label="Log out"><Icon name="logout" /></button>
        </div>
      </header>
      <div className="page-anim" key={tab}>
        {tab === 'dash' && <Dashboard orders={orders} go={setTab} />}
        {tab === 'orders' && <LiveOrders orders={orders} />}
        {tab === 'rest' && <Restaurants />}
        {tab === 'riders' && <Riders />}
        {tab === 'settings' && <Settings />}
      </div>
      <BottomNav value={tab} onChange={setTab} tabs={[
        { id: 'dash', icon: 'chart', label: 'Dashboard' },
        { id: 'orders', icon: 'receipt', label: 'Orders', badge: newCount },
        { id: 'rest', icon: 'store', label: 'Restaurants' },
        { id: 'riders', icon: 'bike', label: 'Riders' },
        { id: 'settings', icon: 'gear', label: 'Settings' },
      ]} />
    </div>
  );
}

function Dashboard({ orders, go }) {
  const rests = useRestaurants();
  const today = (orders || []).filter((o) => o.day === todayKey());
  const del = today.filter((o) => o.status === 'delivered');
  const live = (orders || []).filter((o) => ACTIVE.includes(o.status));
  const sum = (l, k) => l.reduce((a, o) => a + Number(o[k] || 0), 0);
  const [riders, setRiders] = useState([]);
  useEffect(() => watchList('riderLoc', [['online', '==', true]], setRiders), []);
  return (
    <div className="pad-x">
      {rests && !rests.length && <SeedCard />}
      <div className="money-grid">
        <div className="mg big"><small>Today's orders</small><b>{today.length}</b><span>{`${del.length} delivered · ${live.length} live`}</span></div>
        <div className="mg"><small>Food sales</small><b>{rupee(sum(del, 'itemTotal'))}</b></div>
        <div className="mg"><small>Your commission</small><b className="t-green">{rupee(sum(del, 'commission'))}</b></div>
        <div className="mg"><small>Delivery charges</small><b>{rupee(sum(del, 'restDelivery'))}</b></div>
        <div className="mg"><small>Cash with riders</small><b>{rupee(sum(del.filter((o) => o.payment === 'cod'), 'total'))}</b></div>
      </div>
      <div className="card">
        <div className="row between"><h4>Riders online</h4><button className="link small" onClick={() => go('riders')}>Manage</button></div>
        {riders.filter((r) => r.lat).length > 0
          ? <MapView height={200} line={false} points={[...(rests || []).filter((r) => r.lat).map((r) => ({ id: r.id, kind: 'rest', lat: r.lat, lng: r.lng })), ...riders.filter((r) => r.lat).map((r) => ({ id: 'rd' + r.id, kind: 'rider', lat: r.lat, lng: r.lng }))]} />
          : <p className="small muted">No rider online right now</p>}
        {riders.map((r) => <div key={r.id} className="small">• {r.name} ({plain(r.id)}) — {r.ts ? fmtDateTime(r.ts) : ''}</div>)}
      </div>
      <button className="btn primary block" onClick={() => go('orders')}><Icon name="receipt" size={18} /> {`Live orders (${live.length})`}</button>
      <Reports />
    </div>
  );
}

function LiveOrders({ orders }) {
  const { config } = useApp();
  const [show, setShow] = useState('live');
  if (!orders) return null;
  const list = orders.filter((o) => (show === 'live' ? ACTIVE.includes(o.status) : !ACTIVE.includes(o.status))).sort((a, b) => b.createdMs - a.createdMs);
  return (
    <div className="pad-x">
      <div className="seg"><button className={show === 'live' ? 'on' : ''} onClick={() => setShow('live')}>Live</button><button className={show === 'done' ? 'on' : ''} onClick={() => setShow('done')}>Completed (2 days)</button></div>
      {!list.length && <Empty icon="receipt" title="No orders here" />}
      {list.map((o) => <OrderCard key={o.id} o={o} riders={config.riders || []} showRest admin />)}
    </div>
  );
}

function Reports() {
  const rests = useRestaurants() || [];
  const [range, setRange] = useState(7);
  const [orders, setOrders] = useState(null);
  useEffect(() => { setOrders(null); getList('orders', [['day', '>=', dayKey(Date.now() - (range - 1) * 86400000)]]).then(setOrders).catch(() => setOrders([])); }, [range]);
  const del = (orders || []).filter((o) => o.status === 'delivered');
  const rows = rests.map((r) => {
    const l = del.filter((o) => o.restaurantId === r.id);
    const s = (k) => l.reduce((a, o) => a + Number(o[k] || 0), 0);
    return { r, n: l.length, sales: s('itemTotal'), com: s('commission'), dc: s('restDelivery'), pay: s('payable') };
  });
  return (
    <div className="card">
      <h4>Settlement report</h4>
      <div className="seg">{[[1, 'Today'], [7, '7 days'], [30, '30 days']].map(([v, l]) => <button key={v} className={range === v ? 'on' : ''} onClick={() => setRange(v)}>{l}</button>)}</div>
      {!orders ? <p className="muted small">Loading…</p> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Restaurant</th><th>Orders</th><th>Sales</th><th>Fee</th><th>Delivery</th><th>Pay to shop</th></tr></thead>
            <tbody>{rows.map((x) => <tr key={x.r.id}><td data-notr="">{x.r.name}</td><td>{x.n}</td><td>{rupee(x.sales)}</td><td>{rupee(x.com)}</td><td>{rupee(x.dc)}</td><td><b>{rupee(x.pay)}</b></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Restaurants() {
  const rests = useRestaurants() || [];
  const items = useItems() || [];
  const [edit, setEdit] = useState(null);
  const [menu, setMenu] = useState(null);
  const toast = useToast();
  if (menu) return (
    <div>
      <div className="pad-x row gap"><button className="btn ghost small" onClick={() => setMenu(null)}><Icon name="back" size={16} /> Back</button><b data-notr="">{menu.name}</b></div>
      <MenuManager restId={menu.id} />
    </div>
  );
  return (
    <div className="pad-x">
      <button className="btn primary block" onClick={() => setEdit({})}><Icon name="plus" size={18} /> Add restaurant</button>
      {rests.map((r) => (
        <div key={r.id} className="adm-rest">
          <Img src={r.cover} alt="" className="ar-img" />
          <div className="grow">
            <b data-notr="">{r.name}</b>
            <small className="muted">{`${items.filter((i) => i.restaurantId === r.id).length} dishes · owner ${r.ownerPhone || '—'}`}{r.demo ? ' · DEMO' : ''}</small>
            <div className="row gap">
              <button className="link small" onClick={() => setMenu(r)}>Menu</button>
              <button className="link small" onClick={() => setEdit(r)}>Edit</button>
            </div>
          </div>
          <Toggle on={r.open !== false} onChange={(v) => patch('restaurants', r.id, { open: v }).catch(() => toast(t('Could not save'), 'err'))} label="Open" />
        </div>
      ))}
      <RestEditor open={!!edit} r={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function RestEditor({ open, r, onClose }) {
  const { config } = useApp();
  const toast = useToast();
  const [f, setF] = useState(null);
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (open) setF({ name: '', tagline: '', address: '', ownerPhone: '', ownerName: '', prepMins: 20, commissionPct: '', deliveryCharge: '', cover: '', ...r, commissionPct: r?.commissionPct ?? '', deliveryCharge: r?.deliveryCharge ?? '' });
  }, [open]); // eslint-disable-line
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (!f.name.trim()) { toast(t('Name is required'), 'err'); return; }
    if (f.ownerPhone && !/^[6-9]\d{9}$/.test(f.ownerPhone)) { toast(t('Enter a valid 10-digit mobile number'), 'err'); return; }
    const id = r?.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) + '-' + Date.now().toString(36).slice(-3);
    const data = {
      name: f.name.trim(), tagline: f.tagline.trim(), address: f.address.trim(), ownerPhone: f.ownerPhone, ownerName: f.ownerName.trim(),
      prepMins: Number(f.prepMins) || 20, cover: f.cover || '', open: r?.open ?? true, rating: r?.rating ?? 4.2, sort: r?.sort ?? 20, demo: false,
      cuisines: r?.cuisines || [], lat: r?.lat || null, lng: r?.lng || null,
      ...(f.commissionPct !== '' ? { commissionPct: Number(f.commissionPct) } : {}),
      ...(f.deliveryCharge !== '' ? { deliveryCharge: Number(f.deliveryCharge) } : {}),
    };
    try {
      const ops = [['set', 'restaurants', id, data]];
      if (f.ownerPhone) ops.push(['set', 'staff', '+91' + f.ownerPhone, { restaurant: id, name: f.ownerName || f.name }]);
      if (r?.ownerPhone && r.ownerPhone !== f.ownerPhone) ops.push(['set', 'staff', '+91' + r.ownerPhone, { restaurant: '' }]);
      await bulk(ops);
      toast(t('Saved')); onClose();
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
  };
  return (
    <Sheet open={open} onClose={onClose} title={r?.id ? 'Edit restaurant' : 'Add restaurant'} full>
      <Field label="Restaurant name"><input className="input" value={f.name} onChange={set('name')} /></Field>
      <Field label="Short line"><input className="input" value={f.tagline} onChange={set('tagline')} placeholder="e.g. Best chaat in town" /></Field>
      <Field label="Address"><input className="input" value={f.address} onChange={set('address')} /></Field>
      <div className="row gap">
        <Field label="Owner mobile" hint="This number logs in to the restaurant panel"><input className="input" inputMode="numeric" maxLength={10} value={f.ownerPhone} onChange={(e) => setF({ ...f, ownerPhone: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Owner name"><input className="input" value={f.ownerName} onChange={set('ownerName')} /></Field>
      </div>
      <div className="row gap">
        <Field label="Commission %" hint={`Blank = default ${config.commissionPct}%`}><input className="input" inputMode="decimal" value={f.commissionPct} onChange={set('commissionPct')} /></Field>
        <Field label="Delivery charge ₹" hint={`Blank = default ₹${config.restaurantDeliveryCharge}`}><input className="input" inputMode="decimal" value={f.deliveryCharge} onChange={set('deliveryCharge')} /></Field>
      </div>
      <Field label="Cooking time (min)"><input className="input" inputMode="numeric" value={f.prepMins} onChange={set('prepMins')} /></Field>
      <button className="btn primary block lg" onClick={save}>Save</button>
      {r?.id && <button className="btn ghost danger-text block" onClick={() => setDel(true)}>Delete restaurant</button>}
      <Confirm open={del} onClose={() => setDel(false)} danger title="Delete restaurant?" text="The restaurant and its menu will be removed." okText="Delete"
        onOk={async () => { try { const its = await getList('items', [['restaurantId', '==', r.id]]); await bulk([['del', 'restaurants', r.id], ...its.map((i) => ['del', 'items', i.id])]); onClose(); } catch { toast(t('Could not delete'), 'err'); } }} />
    </Sheet>
  );
}

function Riders() {
  const { config } = useApp();
  const toast = useToast();
  const [p, setP] = useState(''); const [n, setN] = useState('');
  const riders = config.riders || [];
  const add = async () => {
    if (!/^[6-9]\d{9}$/.test(p) || !n.trim()) { toast(t('Enter name and a valid 10-digit mobile number'), 'err'); return; }
    const phone = '+91' + p;
    try {
      await bulk([['set', 'staff', phone, { rider: true, name: n.trim() }], ['set', 'config', 'app', { riders: [...riders.filter((r) => r.phone !== phone), { phone, name: n.trim() }] }]]);
      setP(''); setN(''); toast(t('Rider added'));
    } catch { toast(t('Could not save'), 'err'); }
  };
  const del = async (r) => {
    try { await bulk([['set', 'staff', r.phone, { rider: false }], ['set', 'config', 'app', { riders: riders.filter((x) => x.phone !== r.phone) }]]); } catch { toast(t('Could not save'), 'err'); }
  };
  return (
    <div className="pad-x">
      <div className="card">
        <h4>Add delivery partner</h4>
        <div className="row gap">
          <input className="input" placeholder="Name" value={n} onChange={(e) => setN(e.target.value)} />
          <input className="input" placeholder="Mobile" inputMode="numeric" maxLength={10} value={p} onChange={(e) => setP(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button className="btn primary block" onClick={add}><Icon name="plus" size={18} /> Add</button>
        <p className="tiny muted">The partner logs in with this number and gets the Deliveries screen.</p>
      </div>
      {riders.map((r) => (
        <div key={r.phone} className="mm-row">
          <span className="avatar"><Icon name="bike" size={20} /></span>
          <div className="grow"><b data-notr="">{r.name}</b><small className="muted">{plain(r.phone)}</small></div>
          <button className="icon-btn" onClick={() => del(r)} aria-label="Remove"><Icon name="trash" size={18} /></button>
        </div>
      ))}
    </div>
  );
}

function Settings() {
  const { config } = useApp();
  const toast = useToast();
  const [f, setF] = useState(config);
  useEffect(() => setF(config), [config]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    try {
      await put('config', 'app', {
        commissionPct: Number(f.commissionPct) || 0, customerDeliveryFee: Number(f.customerDeliveryFee) || 0, restaurantDeliveryCharge: Number(f.restaurantDeliveryCharge) || 0,
        minOrder: Number(f.minOrder) || 0, upiId: (f.upiId || '').trim(), upiName: (f.upiName || '').trim(), supportPhone: (f.supportPhone || '').trim(),
        serviceArea: f.serviceArea || '', codEnabled: !!f.codEnabled, upiEnabled: !!f.upiEnabled, showCalories: !!f.showCalories,
      });
      toast(t('Saved'));
    } catch { toast(t('Could not save'), 'err'); }
  };
  return (
    <div className="pad-x">
      <div className="card">
        <h4>Money</h4>
        <div className="row gap">
          <Field label="Commission %" hint="Taken from restaurant"><input className="input" inputMode="decimal" value={f.commissionPct} onChange={set('commissionPct')} /></Field>
          <Field label="Delivery charge ₹" hint="Paid by restaurant per order"><input className="input" inputMode="decimal" value={f.restaurantDeliveryCharge} onChange={set('restaurantDeliveryCharge')} /></Field>
        </div>
        <div className="row gap">
          <Field label="Customer delivery fee ₹" hint="0 = FREE delivery"><input className="input" inputMode="decimal" value={f.customerDeliveryFee} onChange={set('customerDeliveryFee')} /></Field>
          <Field label="Minimum order ₹"><input className="input" inputMode="decimal" value={f.minOrder} onChange={set('minOrder')} /></Field>
        </div>
      </div>
      <div className="card">
        <h4>Payments</h4>
        <label className="check-row"><input type="checkbox" checked={!!f.codEnabled} onChange={(e) => setF({ ...f, codEnabled: e.target.checked })} /> Cash on delivery</label>
        <label className="check-row"><input type="checkbox" checked={!!f.upiEnabled} onChange={(e) => setF({ ...f, upiEnabled: e.target.checked })} /> UPI on delivery</label>
        <Field label="Merchant UPI ID (for Pay now)" hint="Use a merchant/business UPI ID; personal IDs get blocked by UPI apps"><input className="input" value={f.upiId} onChange={set('upiId')} placeholder="yourshop@okaxis" /></Field>
        <Field label="UPI name"><input className="input" value={f.upiName} onChange={set('upiName')} /></Field>
      </div>
      <div className="card">
        <h4>App</h4>
        <Field label="Support phone"><input className="input" inputMode="numeric" value={f.supportPhone} onChange={set('supportPhone')} /></Field>
        <Field label="Service area"><input className="input" value={f.serviceArea} onChange={set('serviceArea')} /></Field>
        <label className="check-row"><input type="checkbox" checked={!!f.showCalories} onChange={(e) => setF({ ...f, showCalories: e.target.checked })} /> Show calories on dishes</label>
      </div>
      <button className="btn primary block lg" onClick={save}>Save settings</button>
      <SeedCard small />
    </div>
  );
}

function SeedCard({ small }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const riders = STAFF.filter((s) => s.rider).map((s) => ({ phone: s.phone, name: s.name }));
      await bulk([
        ['set', 'config', 'app', { ...DEFAULT_CONFIG, riders }],
        ...RESTAURANTS.map((r) => ['set', 'restaurants', r.id, r]),
        ...ITEMS.map((i) => ['set', 'items', i.id, i]),
        ...BANNERS.map((b) => ['set', 'banners', b.id, b]),
        ...STAFF.map(({ phone, ...s }) => ['set', 'staff', phone, s]),
      ]);
      toast(t('Starter menu loaded'));
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  return (
    <div className={'card' + (small ? '' : ' seed')}>
      <h4>Starter menu</h4>
      <p className="small muted">{`Loads ${RESTAURANTS.length} restaurants (Raju Lassi + 3 demo), ${ITEMS.length} veg dishes with photos & calories, banners, Rohit as rider. Existing dishes with the same id are updated.`}</p>
      <button className="btn ghost block" disabled={busy} onClick={() => setAsk(true)}>{busy ? 'Loading…' : 'Load starter menu'}</button>
      <Confirm open={ask} onClose={() => setAsk(false)} title="Load starter menu?" text="This adds/updates the starter restaurants and dishes." okText="Load" onOk={run} />
    </div>
  );
}
