import { useEffect, useState, useSyncExternalStore } from 'react';
import { watchList, watchDoc, patch, put, newId, serverTimestamp } from './fb.js';
import { LS, todayKey, shortId } from './utils.js';

/* ---------- live collections (small, public) ---------- */
const cache = {};
function useShared(key, start) {
  const [v, setV] = useState(cache[key]?.v);
  useEffect(() => {
    let c = cache[key];
    if (!c) {
      c = cache[key] = { v: undefined, subs: new Set() };
      c.off = start((x) => { c.v = x; c.subs.forEach((f) => f(x)); });
    }
    c.subs.add(setV); if (c.v !== undefined) setV(c.v);
    return () => c.subs.delete(setV);
  }, [key]); // eslint-disable-line
  return v;
}
const bySort = (a, b) => (a.sort || 99) - (b.sort || 99) || String(a.name).localeCompare(String(b.name));
export const useRestaurants = () => useShared('restaurants', (cb) => watchList('restaurants', [], (l) => cb(l.sort(bySort))));
export const useItems = () => useShared('items', (cb) => watchList('items', [], (l) => cb(l.sort(bySort))));
export const useBanners = () => useShared('banners', (cb) => watchList('banners', [], (l) => cb(l.sort(bySort))));

export function useDoc(path, id) {
  const [d, setD] = useState(undefined);
  useEffect(() => { if (!id) { setD(null); return; } return watchDoc(path, id, setD); }, [path, id]);
  return d;
}
export function useList(path, filters, deps = []) {
  const [l, setL] = useState(undefined);
  useEffect(() => {
    if (!filters) { setL([]); return; }
    return watchList(path, filters, setL, null, null, () => setL([]));
  }, deps); // eslint-disable-line
  return l;
}

/* ---------- cart (one restaurant at a time, like the big apps) ---------- */
const CK = 'pp_cart';
let cart = LS.get(CK, { restaurantId: '', items: {} });
const subs = new Set();
const emit = () => { LS.set(CK, cart); subs.forEach((f) => f()); };
export const cartStore = {
  get: () => cart,
  subscribe: (f) => { subs.add(f); return () => subs.delete(f); },
  add(item) {
    if (cart.restaurantId && cart.restaurantId !== item.restaurantId) return false;
    const cur = cart.items[item.id]?.qty || 0;
    cart = { restaurantId: item.restaurantId, items: { ...cart.items, [item.id]: { id: item.id, name: item.name, price: item.price, kcal: item.kcal || 0, qty: cur + 1 } } };
    emit(); return true;
  },
  sub(id) {
    const cur = cart.items[id]?.qty || 0;
    const items = { ...cart.items };
    if (cur <= 1) delete items[id]; else items[id] = { ...items[id], qty: cur - 1 };
    cart = { restaurantId: Object.keys(items).length ? cart.restaurantId : '', items };
    emit();
  },
  replaceWith(item) { cart = { restaurantId: '', items: {} }; this.add(item); },
  clear() { cart = { restaurantId: '', items: {} }; emit(); },
};
export const useCart = () => useSyncExternalStore(cartStore.subscribe, cartStore.get);
export function cartTotals(c) {
  const list = Object.values(c.items);
  return {
    list,
    count: list.reduce((a, x) => a + x.qty, 0),
    total: list.reduce((a, x) => a + x.qty * x.price, 0),
    kcal: list.reduce((a, x) => a + x.qty * (x.kcal || 0), 0),
  };
}

/* ---------- orders ---------- */
export const ACTIVE = ['placed', 'accepted', 'preparing', 'ready', 'picked'];
export const r2 = (n) => Math.round(n * 100) / 100;

export async function placeOrder({ user, customerName, rest, config, cartData, address, payment, note, offer, discount = 0 }) {
  const { list, total, kcal } = cartTotals(cartData);
  const pct = Number(rest.commissionPct ?? config.commissionPct ?? 0);
  const disc = Math.max(0, Math.min(Number(discount) || 0, total));
  const discountBy = disc ? (offer?.fundedBy === 'restaurant' ? 'restaurant' : 'admin') : '';
  const base = discountBy === 'restaurant' ? total - disc : total; // restaurant-funded discount lowers the commission base
  const commission = r2((base * pct) / 100);
  const restDelivery = Number(rest.deliveryCharge ?? config.restaurantDeliveryCharge ?? 0);
  const deliveryFee = Number(config.customerDeliveryFee || 0);
  const id = newId('orders');
  const now = Date.now();
  const order = {
    code: shortId(), day: todayKey(), createdAt: serverTimestamp(), createdMs: now,
    customerUid: user.uid, customerPhone: user.phoneNumber, customerName,
    address, restaurantId: rest.id, restaurantName: rest.name, restaurantPhone: rest.ownerPhone || '', restaurantAddr: rest.address || '',
    restLat: rest.lat || null, restLng: rest.lng || null,
    items: list.map((x) => ({ id: x.id, name: x.name, price: x.price, qty: x.qty, kcal: x.kcal || 0 })),
    itemTotal: total, deliveryFee, discount: disc, offerCode: disc ? offer.code : '', discountBy, total: total - disc + deliveryFee, kcal,
    commissionPct: pct, commission, restDelivery, payable: r2(base - commission - restDelivery),
    payment, paid: false, note: note || '',
    status: 'placed', riderPhone: '', riderName: '', prepMins: rest.prepMins || 20,
    timeline: { placed: now },
  };
  await put('orders', id, order, false);
  return id;
}
export function setStatus(order, status, extra = {}) {
  return patch('orders', order.id, { status, [`timeline.${status}`]: Date.now(), ...extra });
}
