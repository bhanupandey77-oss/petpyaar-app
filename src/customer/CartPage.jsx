import React, { useState } from 'react';
import { Icon, VegMark, Stepper, Empty, useToast } from '../ui.jsx';
import { useApp } from '../App.jsx';
import { useCart, cartTotals, cartStore, useRestaurants, placeOrder } from '../lib/data.js';
import { rupee, upiLink } from '../lib/utils.js';
import { upiPay } from '../lib/native.js';
import { TopBar } from './RestaurantPage.jsx';
import { useAddresses, useSyncAddresses, addrLine, AddressForm } from './Address.jsx';
import { t } from '../i18n/index.js';

export default function CartPage({ nav, onPlaced }) {
  const { user, config, askLogin } = useApp();
  const toast = useToast();
  const cart = useCart();
  const rest = (useRestaurants() || []).find((r) => r.id === cart.restaurantId);
  const { list, total, kcal } = cartTotals(cart);
  useSyncAddresses();
  const { list: addrs, sel } = useAddresses();
  const addr = addrs.find((a) => a.id === sel) || addrs[0];
  const [pay, setPay] = useState('cod');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(false);
  const fee = Number(config.customerDeliveryFee || 0);

  if (!list.length) return (
    <div className="page"><TopBar onBack={nav.back} title="Cart" />
      <Empty icon="bag" title="Your cart is empty" text="Good food is always cooking. Go ahead, order some yummy items from the menu." action={<button className="btn primary" onClick={nav.back}>Browse food</button>} />
    </div>
  );

  const place = async () => {
    if (!user) { askLogin(); return; }
    if (!addr) { setForm(true); return; }
    if (!rest || rest.open === false) { toast(t('Restaurant is closed right now'), 'err'); return; }
    if (config.minOrder && total < config.minOrder) { toast(t('Minimum order is {}').replace('{}', rupee(config.minOrder)), 'err'); return; }
    setBusy(true);
    try {
      const id = await placeOrder({
        user, customerName: user.displayName || addr.name, rest, config, cartData: cart, note, payment: pay,
        address: { label: addr.label, name: addr.name, phone: addr.phone, line: addrLine(addr), lat: addr.lat || null, lng: addr.lng || null },
      });
      if (pay === 'upi_now' && config.upiId) {
        await upiPay(upiLink({ upiId: config.upiId, upiName: config.upiName, amount: total + fee, note: `PetPyaar order`, ref: id }), '');
      }
      cartStore.clear();
      onPlaced(id);
    } catch (e) { console.warn(e); toast(t('Could not place the order. Check internet and try again.'), 'err'); }
    setBusy(false);
  };

  return (
    <div className="page cart-page">
      <TopBar onBack={nav.back} title={rest?.name || 'Cart'} />
      <div className="pad-x">
        <div className="card">
          {list.map((x) => (
            <div key={x.id} className="cart-row">
              <VegMark size={13} />
              <div className="grow"><b>{x.name}</b><small className="muted">{rupee(x.price)}{config.showCalories && x.kcal ? ` · ~${x.kcal} kcal` : ''}</small></div>
              <Stepper small qty={x.qty} onAdd={() => cartStore.add({ ...x, restaurantId: cart.restaurantId })} onSub={() => cartStore.sub(x.id)} />
              <b className="cart-amt">{rupee(x.qty * x.price)}</b>
            </div>
          ))}
          <button className="link small" onClick={() => nav.openRest(cart.restaurantId)}><Icon name="plus" size={14} /> Add more items</button>
          <textarea className="input note" rows={2} placeholder="Any request for the restaurant? (e.g. less spicy)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} />
        </div>

        {config.showCalories && kcal > 0 && (
          <div className="kcal-card">
            <Icon name="fire" size={22} />
            <div><b>{`About ${kcal.toLocaleString('en-IN')} kcal in this order`}</b><small>{kcalHint(kcal)}</small></div>
          </div>
        )}

        <div className="card">
          <h4>Bill details</h4>
          <div className="bill"><span>Item total</span><span>{rupee(total)}</span></div>
          <div className="bill"><span>Delivery fee</span><span>{fee ? rupee(fee) : <><s className="muted">₹30</s> <b className="t-green">FREE</b></>}</span></div>
          <div className="bill total"><span>To pay</span><span>{rupee(total + fee)}</span></div>
        </div>

        <div className="card">
          <div className="row between"><h4>Deliver to</h4><button className="link small" onClick={() => (addrs.length ? nav.go({ name: 'address' }) : setForm(true))}>{addrs.length ? 'Change' : 'Add'}</button></div>
          {addr ? (
            <div className="addr-mini"><Icon name="pin" size={20} /><div><b>{addr.label}</b><p className="small muted" data-notr="">{addrLine(addr)}</p><small className="muted">{addr.name} · {addr.phone}{!addr.lat && <> · <span className="t-red">no GPS pin</span></>}</small></div></div>
          ) : <p className="muted small">Add your address to place the order</p>}
        </div>

        <div className="card">
          <h4>Payment</h4>
          {config.codEnabled !== false && <PayOpt id="cod" cur={pay} set={setPay} icon="cash" title="Cash on delivery" sub="Pay cash to the delivery partner" />}
          {config.upiEnabled !== false && <PayOpt id="upi_rider" cur={pay} set={setPay} icon="upi" title="UPI on delivery" sub="Scan & pay when food arrives" />}
          {config.upiId && <PayOpt id="upi_now" cur={pay} set={setPay} icon="upi" title="Pay now by UPI" sub="Google Pay, PhonePe, Paytm…" />}
        </div>
        <p className="tiny muted center">Restaurant can take 1-2 minutes to accept. You can cancel until it is accepted.</p>
      </div>

      <div className="place-bar">
        <div><b>{rupee(total + fee)}</b><small>TOTAL</small></div>
        <button className="btn primary lg grow" disabled={busy} onClick={place}>{busy ? 'Placing…' : !user ? 'Log in to order' : !addr ? 'Add address' : 'Place order'}</button>
      </div>
      <AddressForm open={form} onClose={() => setForm(false)} />
    </div>
  );
}

const kcalHint = (k) => (k <= 600 ? 'A light meal, nicely balanced.' : k <= 1200 ? 'A filling meal — great to share or for one hungry person.' : 'A big feast! Perfect for sharing with family.');

function PayOpt({ id, cur, set, icon, title, sub }) {
  return (
    <button className={'pay-opt' + (cur === id ? ' on' : '')} onClick={() => set(id)}>
      <Icon name={icon} size={22} />
      <span className="grow"><b>{title}</b><small>{sub}</small></span>
      <i className="radio" />
    </button>
  );
}
