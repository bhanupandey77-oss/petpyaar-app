import React, { useState } from 'react';
import { Icon, Sheet, Field, useToast, Empty, WaBtn } from '../ui.jsx';
import { useList, useDoc } from '../lib/data.js';
import { patch, put, add } from '../lib/fb.js';
import { rupee, plain, tel, fmtDateTime, dayKey } from '../lib/utils.js';
import { UpiButton, UpiQr } from '../components/Pay.jsx';
import { t } from '../i18n/index.js';

const r2 = (n) => Math.round(n * 100) / 100;

/* Restaurant's own delivery boys: add / remove, pay per delivery or monthly, pay by UPI */
export default function Team({ rest, orders }) {
  const toast = useToast();
  const riders = rest.riders || [];
  const pays = useList('riderPays', [['restaurantId', '==', rest.id]], [rest.id]);
  const [addOpen, setAddOpen] = useState(false);
  const [f, setF] = useState({ name: '', phone: '' });
  const [rate, setRate] = useState(String(rest.riderRate ?? 20));
  const [busy, setBusy] = useState(false);
  const [payTo, setPayTo] = useState(null);

  const saveRate = async () => { try { await patch('restaurants', rest.id, { riderRate: Number(rate) || 0 }); toast(t('Saved')); } catch { toast(t('Could not save'), 'err'); } };
  const addRider = async () => {
    const p = f.phone.replace(/\D/g, '');
    if (f.name.trim().length < 2 || p.length !== 10) { toast(t('Enter name and 10-digit mobile number'), 'err'); return; }
    const phone = '+91' + p;
    if (riders.some((r) => r.phone === phone)) { toast(t('Already added'), 'err'); return; }
    setBusy(true);
    try {
      await put('staff', phone, { phone, name: f.name.trim(), rider: true, riderOf: rest.id, admin: false, restaurant: '' });
      await patch('restaurants', rest.id, { riders: [...riders, { phone, name: f.name.trim() }] });
      toast(t('Delivery partner added. They can log in with this number.')); setAddOpen(false); setF({ name: '', phone: '' });
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  const removeRider = async (r) => {
    if (!confirm(t('Remove this delivery partner?'))) return;
    try {
      await patch('restaurants', rest.id, { riders: riders.filter((x) => x.phone !== r.phone) });
      await put('staff', r.phone, { rider: false, riderOf: '' });
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
  };

  return (
    <div className="pad-x">
      <div className="card">
        <h4><Icon name="bike" size={18} /> Delivery pay</h4>
        <p className="tiny muted">Your own delivery boys deliver your orders. Set how much you pay them for each delivery.</p>
        <div className="row gap">
          <Field label="₹ per delivery"><input className="input" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ''))} /></Field>
          <button className="btn primary" onClick={saveRate} style={{ alignSelf: 'flex-end', marginBottom: 12 }}>Save</button>
        </div>
      </div>
      {riders.map((r) => <RiderCard key={r.phone} r={r} rest={rest} orders={orders} pays={(pays || []).filter((x) => x.riderPhone === r.phone)} onPay={(x) => setPayTo(x)} onRemove={() => removeRider(r)} />)}
      {!riders.length && <Empty icon="bike" title="No delivery partner yet" text="Add your delivery boy. He logs in with his own mobile number." />}
      <button className="btn ghost block" onClick={() => setAddOpen(true)}><Icon name="plus" size={18} /> Add delivery partner</button>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add delivery partner">
        <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-notr="" /></Field>
        <Field label="Mobile number"><input className="input" inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} /></Field>
        <button className="btn primary block lg" disabled={busy} onClick={addRider}>Add</button>
      </Sheet>
      {payTo && <PaySheet x={payTo} rest={rest} onClose={() => setPayTo(null)} />}
    </div>
  );
}

function RiderCard({ r, rest, orders, pays, onPay, onRemove }) {
  const prof = useDoc('riders', r.phone);
  const mine = (orders || []).filter((o) => o.riderPhone === r.phone && o.status === 'delivered');
  const today = dayKey(Date.now());
  const rate = Number(rest.riderRate ?? 20);
  const earned = r2(mine.length * rate);
  const paid = r2(pays.filter((x) => x.status !== 'rejected').reduce((a, x) => a + Number(x.amount || 0), 0));
  const bal = Math.max(0, r2(earned - paid));
  return (
    <div className="card rider-card">
      <div className="row gap">
        <span className="avatar">{prof?.photo ? <img src={prof.photo} alt="" /> : <Icon name="user" size={22} />}</span>
        <div className="grow"><b data-notr="">{prof?.name || r.name}</b><small className="muted">{plain(r.phone)}{prof?.vehicle ? ` · ${prof.vehicle}` : ''}</small></div>
        <WaBtn phone={r.phone} />
        <a className="icon-btn round green" href={tel(r.phone)} aria-label="Call"><Icon name="phone" size={18} /></a>
      </div>
      <div className="money-grid">
        <div className="mg"><small>Today</small><b>{mine.filter((o) => o.day === today).length}</b><span>deliveries</span></div>
        <div className="mg"><small>Total earned</small><b>{rupee(earned)}</b><span>{`${mine.length} × ${rupee(rate)}`}</span></div>
        <div className="mg"><small>Paid</small><b>{rupee(paid)}</b></div>
        <div className={'mg' + (bal > 0 ? ' due' : ' green')}><small>To pay</small><b>{rupee(bal)}</b></div>
      </div>
      {!prof?.upiId && <p className="tiny muted">UPI not added by the delivery partner yet — you can still pay cash and record it.</p>}
      <div className="row gap">
        <button className="btn primary small grow" disabled={bal <= 0} onClick={() => onPay({ r, prof, bal })}><Icon name="upi" size={16} /> {`Pay ${rupee(bal)}`}</button>
        <button className="btn ghost small danger-text" onClick={onRemove}>Remove</button>
      </div>
      {pays.length > 0 && (
        <details className="setts"><summary className="small">{`Payments (${pays.length})`}</summary>
          {[...pays].sort((a, b) => b.createdMs - a.createdMs).map((x) => (
            <div key={x.id} className="bill small"><span>{fmtDateTime(x.createdMs)}{x.mode === 'cash' ? ' · cash' : ''}</span><span>{rupee(x.amount)} <em className={'st-mini ' + (x.status === 'received' ? 'confirmed' : '')}>{x.status === 'received' ? t('Received') : t('Sent')}</em></span></div>
          ))}
        </details>
      )}
    </div>
  );
}

function PaySheet({ x, rest, onClose }) {
  const toast = useToast();
  const [amt, setAmt] = useState(String(x.bal));
  const [busy, setBusy] = useState(false);
  const a = Number(amt) || 0;
  const record = async (mode) => {
    if (a <= 0) return;
    setBusy(true);
    try {
      await add('riderPays', { restaurantId: rest.id, restaurantName: rest.name, riderPhone: x.r.phone, riderName: x.prof?.name || x.r.name, amount: a, mode, status: 'sent', createdMs: Date.now() });
      toast(t('Payment recorded')); onClose();
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  return (
    <Sheet open onClose={onClose} title={`Pay ${x.prof?.name || x.r.name}`}>
      <Field label="Amount ₹"><input className="input" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ''))} /></Field>
      {x.prof?.upiId ? (
        <>
          <UpiButton upiId={x.prof.upiId} upiName={x.prof.upiName || x.prof.name} amount={a} note={`Delivery pay ${rest.name}`} label="Pay by UPI app" />
          <UpiQr upiId={x.prof.upiId} upiName={x.prof.upiName || x.prof.name} upiQr={x.prof.upiQr} amount={a} note={`Delivery pay ${rest.name}`} size={180} />
          <button className="btn green block" disabled={busy} onClick={() => record('upi')}><Icon name="check" size={18} /> {`I have paid ${rupee(a)} by UPI`}</button>
        </>
      ) : <p className="tiny muted">No UPI added by the delivery partner.</p>}
      <button className="btn ghost block" disabled={busy} onClick={() => record('cash')}><Icon name="cash" size={18} /> {`Paid ${rupee(a)} in cash`}</button>
    </Sheet>
  );
}
