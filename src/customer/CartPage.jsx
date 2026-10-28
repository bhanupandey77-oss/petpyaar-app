import React, { useEffect, useState } from 'react';
import { hasUpi, UpiAppStrip, chosenApp } from '../components/Pay.jsx';
import { Sheet } from '../ui.jsx';
import { useOffers, forRestaurant, discountFor, offerLabel, offerTerms } from '../lib/offers.js';
import { LS, priceText, lineText } from '../lib/utils.js';
import { Icon, VegMark, Stepper, Empty, useToast } from '../ui.jsx';
import { useApp } from '../App.jsx';
import { useCart, cartTotals, cartStore, useRestaurants, placeOrder, billFor } from '../lib/data.js';
import PayWait from './PayWait.jsx';
import NoteBox from './NoteBox.jsx';
import { rupee, upiLink, km } from '../lib/utils.js';
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
  const upiNow = !!rest?.upiId && config.upiNowEnabled !== false;
  const upiDel = hasUpi(rest) && config.upiEnabled !== false;
  const cod = config.codEnabled !== false;
  const [pay, setPay] = useState(() => LS.get('pp_pay', 'upi_now'));
  const payOk = (p) => (p === 'upi_now' ? upiNow : p === 'upi_rider' ? upiDel : p === 'cod' ? cod : false);
  useEffect(() => { if (rest && !payOk(pay)) setPay(upiNow ? 'upi_now' : upiDel ? 'upi_rider' : 'cod'); }, [rest?.id, rest?.upiId, rest?.upiQr]); // eslint-disable-line
  const [note, setNote] = useState('');
  const [paying, setPaying] = useState(null);
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
  const bill = billFor({ itemTotal: total, discount, discountBy: applied?.fundedBy === 'restaurant' ? 'restaurant' : 'admin', rest: rest || {}, config });
  const minOrder = Number(rest?.minOrder ?? config.minOrder ?? 0);
  const radius = Number(rest?.radiusKm ?? config.radiusKm ?? 0);
  const dist = addr?.lat && rest?.lat ? km({ lat: addr.lat, lng: addr.lng }, { lat: rest.lat, lng: rest.lng }) : null;
  const far = radius > 0 && dist != null && dist > radius;
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
    if (minOrder && total < minOrder) { toast(t('Minimum order is {}').replace('{}', rupee(minOrder)), 'err'); return; }
    if (far) { toast(t('Sorry, this restaurant delivers only within {} km').replace('{}', radius), 'err'); return; }
    setBusy(true);
    try {
      const payNow = pay === 'upi_now' && rest.upiId;
      const id = await placeOrder({
        user, customerName: user.displayName || addr.name, rest, config, cartData: cart, note, payment: pay,
        offer: discount ? applied : null, discount, status: payNow ? 'awaiting_payment' : 'placed',
        address: { label: addr.label, name: addr.name, phone: addr.phone, line: addrLine(addr), lat: addr.lat || null, lng: addr.lng || null },
      });
      LS.set('pp_pay', pay);
      if (payNow) { setPaying({ id, amount: bill.total }); setBusy(false); return; } // order goes to the restaurant only after payment
      cartStore.clear(); LS.set('pp_coupon', '');
      onPlaced(id);
    } catch (e) { console.warn(e); toast(t('Could not place the order. Check internet and try again.'), 'err'); }
    setBusy(false);
  };

  return (
    <div className="page cart-page">
      <TopBar onBack={nav.back} title={rest?.name || 'Cart'} />
      {paying && <PayWait order={paying} rest={rest} onDone={(id) => { setPaying(null); cartStore.clear(); LS.set('pp_coupon', ''); onPlaced(id); }} onClose={() => setPaying(null)} />}
      <div className="pad-x">
        <div className="card">
          {list.map((x) => (
            <div key={x.id} className="cart-row">
              <VegMark size={13} />
              <div className="grow"><b>{x.name}</b><small className="muted">{priceText(x)}{config.showCalories && x.kcal ? ` · ~${x.kcal} kcal` : ''}</small></div>
              <Stepper small qty={x.qty} onAdd={() => cartStore.add({ ...x, restaurantId: cart.restaurantId })} onSub={() => cartStore.sub(x.id)} />
              <b className="cart-amt">{lineText(x)}</b>
            </div>
          ))}
          <button className="link small" onClick={() => nav.openRest(cart.restaurantId)}><Icon name="plus" size={14} /> Add more items</button>
          <NoteBox value={note} onChange={setNote} />
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

        <div className="card bill-card">
          <h4><Icon name="receipt" size={18} /> Bill details</h4>
          <div className="bill"><span>{`Item total (${list.reduce((a, x) => a + x.qty, 0)} items)`}</span><span>{rupee(total)}</span></div>
          {discount > 0 && <div className="bill t-green"><span>{`Coupon (${applied.code})`}</span><span>− {rupee(discount)}</span></div>}
          {!bill.gstIncluded && <div className="bill"><span>{`GST ${bill.gstPct}%`}</span><span>+ {rupee(bill.gst)}</span></div>}
          <div className="bill"><span>Delivery fee</span><span>{fee ? rupee(fee) : <b className="t-green">FREE</b>}</span></div>
          <div className="bill total"><span>To pay</span><span>{rupee(bill.total)}</span></div>
          {list.some((x) => x.onMrp && !(Number(x.price) > 0)) && <p className="tiny mrp-note">{t('“On MRP” items are not in this total — pay the printed MRP to the restaurant at delivery.')}</p>}
          <div className="gst-split">
            <span>{`Food value ${rupee(bill.taxable)}`}</span><span>+</span><span>{`GST ${bill.gstPct}% ${rupee(bill.gst)}`}</span><span>=</span><b>{rupee(bill.total - fee)}</b>
          </div>
          <p className="tiny muted">{bill.gstIncluded ? t('Menu prices already include GST — nothing extra is added.') : t('Menu prices are without GST — GST is added in the bill.')}</p>
          {discount > 0 && <div className="saved-strip">{`🎉 You saved ${rupee(discount)} on this order`}</div>}
          {minOrder > 0 && total < minOrder && <div className="alert alert-amber">{`Add ${rupee(minOrder - total)} more — minimum order is ${rupee(minOrder)}`}</div>}
        </div>

        <div className="card">
          <div className="row between"><h4>Deliver to</h4><button className="link small" onClick={() => (addrs.length ? nav.go({ name: 'address' }) : setForm(true))}>{addrs.length ? 'Change' : 'Add'}</button></div>
          {addr ? (
            <div className="addr-mini"><Icon name="pin" size={20} /><div><b>{addr.label}</b><p className="small muted" data-notr="">{addrLine(addr)}</p><small className="muted">{addr.name} · {addr.phone}{!addr.lat && <> · <span className="t-red">no GPS pin</span></>}{dist != null && <> · {`${dist.toFixed(1)} km`}</>}</small>{far && <div className="alert alert-red">{`This restaurant delivers within ${radius} km. Your address is ${dist.toFixed(1)} km away.`}</div>}</div></div>
          ) : <p className="muted small">Add your address to place the order</p>}
        </div>

        <div className="card">
          <h4>Payment</h4>
          <PayOpt id="upi_now" cur={pay} set={setPay} art="upi" title="Pay now — any UPI app" sub="Your UPI app opens right away · money goes straight to the restaurant" tag="Fastest" off={!upiNow} />
          <PayOpt id="upi_rider" cur={pay} set={setPay} art="upi" title="Pay on delivery — any UPI app" sub="When food arrives, tap Pay — your UPI app opens (or scan the QR)" off={!upiDel} />
          <PayOpt id="cod" cur={pay} set={setPay} art="cash" title="Cash on delivery" sub="Pay cash to the delivery partner" off={!cod} />
          {!upiNow && !upiDel && <p className="tiny muted">This restaurant has not added its UPI yet — UPI options will open as soon as it does. Cash on delivery works now.</p>}
          <p className="tiny muted pay-trust"><Icon name="shield" size={13} /> Your payment goes straight to the restaurant's own account. FoodGaon never holds your money.</p>
        </div>
        <p className="tiny muted center">Restaurant can take 1-2 minutes to accept. You can cancel until it is accepted.</p>
      </div>

      <div className="place-bar">
        <div><b>{rupee(bill.total)}</b><small>TOTAL</small></div>
        <button className="btn primary lg grow" disabled={busy} onClick={place}>{busy ? 'Placing…' : !user ? 'Log in to order' : !addr ? 'Add address' : pay === 'upi_now' ? 'Pay & place order' : 'Place order'}</button>
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

function PayOpt({ id, cur, set, art, title, sub, tag, off }) {
  const [pkg, setPkg] = useState(chosenApp());
  const on = cur === id && !off;
  const toast = useToast();
  const pick = () => (off ? toast(t('This restaurant has not added its UPI yet. Please choose cash.'), 'err') : set(id));
  return (
    <div className={'pay-opt2' + (on ? ' on' : '') + (off ? ' off' : '')} onClick={pick} role="radio" aria-checked={on} aria-disabled={off} tabIndex={0}>
      <div className="row gap">
        <span className={'pay-art ' + art}>{art === 'cash' ? <CashArt /> : <span className="upi-badge big">UPI</span>}</span>
        <span className="grow"><b>{title}{tag && <em className="pay-tag">{tag}</em>}</b><small>{sub}</small></span>
        <i className="radio" />
      </div>
      {art === 'upi' && <UpiAppStrip value={on ? pkg : ''} onChange={(p) => { if (off) { pick(); return; } setPkg(p); set(id); }} compact={!on} />}
    </div>
  );
}
const CashArt = () => (
  <svg width="38" height="38" viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="12" width="38" height="22" rx="4" fill="#2e9b57" /><rect x="7" y="16" width="38" height="22" rx="4" fill="#3fb86c" stroke="#fff" strokeWidth="1.5" /><circle cx="26" cy="27" r="6" fill="#e9f8ee" /><text x="26" y="31" textAnchor="middle" fontSize="9" fontWeight="800" fill="#2e9b57">₹</text></svg>
);
