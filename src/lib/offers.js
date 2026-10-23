import { watchList } from './fb.js';
import { useEffect, useState } from 'react';
import { rupee, todayKey } from './utils.js';

/* offers/{id}: { title, sub, code, type: 'percent'|'flat', value, minOrder, maxOff, restaurantId ('' = all),
   fundedBy: 'admin'|'restaurant', active, color, sort, until ('YYYY-MM-DD' or '') } */
let cache = null; const subs = new Set();
export function useOffers() {
  const [l, setL] = useState(cache);
  useEffect(() => {
    subs.add(setL);
    if (!cache && subs.size === 1) watchList('offers', [], (x) => { cache = x.sort((a, b) => (a.sort || 9) - (b.sort || 9)); subs.forEach((f) => f(cache)); });
    return () => subs.delete(setL);
  }, []);
  return l;
}

export const isLive = (o) => o && o.active !== false && (!o.until || o.until >= todayKey());
export const forRestaurant = (list, rid) => (list || []).filter((o) => isLive(o) && (!o.restaurantId || o.restaurantId === rid));

export function discountFor(o, itemTotal) {
  if (!isLive(o) || itemTotal < Number(o.minOrder || 0)) return 0;
  let d = o.type === 'flat' ? Number(o.value || 0) : (itemTotal * Number(o.value || 0)) / 100;
  if (o.maxOff) d = Math.min(d, Number(o.maxOff));
  return Math.max(0, Math.min(Math.round(d), itemTotal));
}

export const offerLabel = (o) => (o.type === 'flat' ? `₹${o.value} OFF` : `${o.value}% OFF`);
export const offerTerms = (o) => [
  o.minOrder ? `Min order ${rupee(o.minOrder)}` : '',
  o.type !== 'flat' && o.maxOff ? `up to ${rupee(o.maxOff)}` : '',
].filter(Boolean).join(' · ');

export const OFFER_COLORS = ['#e8461a', '#7a4fe0', '#1e9e55', '#2f6fe4', '#d4307a', '#c98a00'];
