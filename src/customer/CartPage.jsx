import React, { useState } from 'react';
import { Sheet } from '../ui.jsx';
import { useOffers, forRestaurant, discountFor, offerLabel, offerTerms } from '../lib/offers.js';
import { LS } from '../lib/utils.js';
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
  const offers = forRestaurant(useOffers(), cart.restaurantId);
  const [code, setCode] = useState(() => LS.get('pp_coupon', ''));
  const [couponOpen, setCouponOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [yay, setYay] = useState(0);
  const applied = offers.find((o) => o.code === code);
  const discount = applied ? discountFor(applied, total) : 0;
  const best = offers.map((o) => ({ o, d: discountFor(o, total) })).filter((x) => x.d > 0).sort((a, b) => b.d - a.d)[0];
  const apply = (c) => {
    const o = offers.find((x) => x.code === String(c).trim().toUpperCase());
    if (!o) { toast(t('This coupon is not valid here'), 'err'); return; }
    const d = discountFor(o, total);
    if (!d) { toast(t('Add items worth {} more to use this coupon').replace('{}', rupee(Number(o.minOrder || 0) - total)), 'err'); return; }
    setCode(o.code); LS.set('pp_coupon', o.code); setCouponOpen(false); setYay(d);
    setTimeout(() => setYay(0), 2200);
  };
  const removeCoupon = () => { setCode(''); LS.set('pp_coupon', ''); };

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
        offer: discount ? applied : null, discount,
        address: { label: addr.label, name: addr.name, phone: addr.phone, line: addrLine(addr), lat: addr.lat || null, lng: addr.lng || null },
      });
      if (pay === 'upi_now' && config.upiId) {
        await upiPay(upiLink({ upiId: config.upiId, upiName: config.upiName, amount: total - discount + fee, note: `PetPyaar order`, ref: id }), '');
      }
      cartStore.clear(); LS.set('pp_coupon', '');
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

        <div className="card coupon-card">
          {applied && discount > 0 ? (
            <div className="row gap">
              <span className="cc-ic ok"><Icon name="check" size={18} stroke={3} /></span>
              <div className="grow"><b data-notr="">{applied.code}</b><small className="t-green">{`You save ${rupee(discount)}`}</small></div>
              <button className="link small" onClick={removeCoupon}>Remove</button>
            </div>
          ) : (
            <button className="row gap cc-btn" onClick={() => setCouponOpen(true)}>
              <span className="cc-ic"><Icon name="star" size={18} /></span>
              <div className="grow"><b>Apply coupon</b>{best ? <small className="t-green">{`Save ${rupee(best.d)} with ${best.o.code}`}</small> : <small className="muted">{offers.length ? `${offers.length} offers available` : 'No offers right now'}</small>}</div>
              <Icon name="right" size={18} />
            </button>
          )}
        </div>

        <div className="card">
          <h4>Bill details</h4>
          <div className="bill"><span>Item total</span><span>{rupee(total)}</span></div>
          <div className="bill"><span>Delivery fee</span><span>{fee ? rupee(fee) : <><s className="muted">₹30</s> <b className="t-green">FREE</b></>}</span></div>
          {discount > 0 && <div className="bill t-green"><span>{`Coupon (${applied.code})`}</span><span>− {rupee(discount)}</span></div>}
          <div className="bill total"><span>To pay</span><span>{rupee(total - discount + fee)}</span></div>
          {discount > 0 && <div className="saved-strip">{`🎉 You saved ${rupee(discount + 30)} on this order`}</div>}
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
        <div><b>{rupee(total - discount + fee)}</b><small>TOTAL</small></div>
        <button className="btn primary lg grow" disabled={busy} onClick={place}>{busy ? 'Placing…' : !user ? 'Log in to order' : !addr ? 'Add address' : 'Place order'}</button>
      </div>
      <AddressForm open={form} onClose={() => setForm(false)} />
      <Sheet open={couponOpen} onClose={() => setCouponOpen(false)} title="Coupons for you">
        <div className="row gap">
          <input className="input grow" placeholder="Enter coupon code" value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} />
          <button className="btn primary" onClick={() => apply(typed)} disabled={!typed}>Apply</button>
        </div>
        {offers.map((o) => {
          const d = discountFor(o, total);
          return (
            <div key={o.id} className="coupon-ticket" style={{ '--c': o.color || '#e8461a' }}>
              <div className="ct-left"><span>{offerLabel(o)}</span></div>
              <div className="ct-body">
                <b data-notr="">{o.code}</b>
                <p>{o.title}</p>
                <small className="muted">{offerTerms(o)}</small>
                {d > 0 ? <small className="t-green">{`You save ${rupee(d)}`}</small> : <small className="t-red">{`Add ${rupee(Number(o.minOrder || 0) - total)} more to unlock`}</small>}
              </div>
              <button className="link" disabled={!d} onClick={() => apply(o.code)}>APPLY</button>
            </div>
          );
        })}
        {!offers.length && <p className="muted center">No offers right now</p>}
      </Sheet>
      {yay > 0 && (
        <div className="yay" onClick={() => setYay(0)}>
          <div className="confetti">{Array.from({ length: 28 }).map((_, i) => <i key={i} style={{ left: (i * 37) % 100 + '%', animationDelay: (i % 7) * 0.06 + 's', background: ['#e8461a', '#ffb627', '#1e9e55', '#ff7ab6', '#3d8bfd'][i % 5] }} />)}</div>
          <div className="yay-card"><span className="yay-emoji">🎉</span><b>{`${rupee(yay)} saved!`}</b><small>{`with ${code}`}</small></div>
        </div>
      )}
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
