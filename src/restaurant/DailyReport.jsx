import React, { useState } from 'react';
import { Icon, useToast } from '../ui.jsx';
import { rupee, dayKey } from '../lib/utils.js';
import { isNative } from '../lib/native.js';
import { ReviewList } from '../components/Reviews.jsx';
import { t } from '../i18n/index.js';

const r2 = (n) => Math.round(n * 100) / 100;
function stats(orders, day) {
  const all = orders.filter((o) => o.day === day);
  const done = all.filter((o) => o.status === 'delivered');
  const sum = (k) => r2(done.reduce((a, o) => a + Number(o[k] || 0), 0));
  const dishes = Object.entries(done.flatMap((o) => o.items).reduce((m, x) => { m[x.name] = (m[x.name] || 0) + x.qty; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const hours = done.reduce((m, o) => { const h = new Date(o.createdMs).getHours(); m[h] = (m[h] || 0) + 1; return m; }, {});
  const peak = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
  return {
    n: done.length, sales: sum('total'), earn: sum('payable'), dues: r2(done.reduce((a, o) => a + Number(o.dues ?? o.total - o.payable), 0)),
    lost: all.filter((o) => ['rejected', 'cancelled'].includes(o.status)).length, cash: r2(done.filter((o) => o.payment === 'cod').reduce((a, o) => a + o.total, 0)),
    upi: r2(done.filter((o) => o.payment !== 'cod').reduce((a, o) => a + o.total, 0)), dishes, peak: peak ? Number(peak[0]) : null,
  };
}
const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? ' AM' : ' PM'} – ${((h + 12) % 12) + 1}${h + 1 < 12 || h + 1 === 24 ? ' AM' : ' PM'}`;

/** one-look daily report for the owner, with compare-to-previous-day and WhatsApp share */
export default function DailyReport({ orders, rest, reviews }) {
  const toast = useToast();
  const [day, setDay] = useState(dayKey(Date.now()));
  if (!orders) return null;
  const prevDay = dayKey(new Date(day).getTime() - 86400000);
  const s = stats(orders, day); const p = stats(orders, prevDay);
  const dayRev = (reviews || []).filter((x) => x.rating && dayKey(x.createdMs) === day);
  const avgRev = dayRev.length ? dayRev.reduce((a, x) => a + x.rating, 0) / dayRev.length : 0;
  const diff = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
  const Up = ({ a, b }) => { const d = diff(a, b); return d ? <em className={'cmp ' + (d > 0 ? 'up' : 'down')}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}%</em> : null; };
  const nice = new Date(day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const share = async () => {
    const text = `${rest.name} — ${nice}\nOrders: ${s.n}\nSales: ${rupee(s.sales)}\nYour earning: ${rupee(s.earn)}\nTop dish: ${s.dishes[0] ? `${s.dishes[0][0]} × ${s.dishes[0][1]}` : '-'}\n— FoodGaon`;
    try {
      if (isNative) { const { Share } = await import('@capacitor/share'); await Share.share({ text, title: 'Daily report' }); } else if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast(t('Copied')); }
    } catch { /* cancelled */ }
  };
  return (
    <div className="pad-x">
      <div className="card daily">
        <div className="row between"><h4><Icon name="chart" size={18} /> Daily report</h4><button className="link small" onClick={share}><Icon name="copy" size={14} /> Share</button></div>
        <div className="row gap">
          <div className="seg grow" style={{ margin: 0 }}>
            <button className={day === dayKey(Date.now()) ? 'on' : ''} onClick={() => setDay(dayKey(Date.now()))}>Today</button>
            <button className={day === dayKey(Date.now() - 86400000) ? 'on' : ''} onClick={() => setDay(dayKey(Date.now() - 86400000))}>Yesterday</button>
          </div>
          <input className="input slim" type="date" value={day} max={dayKey(Date.now())} onChange={(e) => e.target.value && setDay(e.target.value)} style={{ width: 150 }} />
        </div>
        <div className="money-grid">
          <div className="mg big"><small>{`Sales · ${nice}`}</small><b>{rupee(s.sales)} <Up a={s.sales} b={p.sales} /></b><span>{`${s.n} orders delivered`}{s.lost ? ` · ${s.lost} cancelled` : ''}</span></div>
          <div className="mg green"><small>Your earning</small><b>{rupee(s.earn)}</b></div>
          <div className="mg"><small>To FoodGaon</small><b>{rupee(s.dues)}</b></div>
          <div className="mg"><small>Average order</small><b>{rupee(s.n ? Math.round(s.sales / s.n) : 0)}</b></div>
          <div className="mg"><small>Cash / UPI</small><b className="small">{`${rupee(s.cash)} / ${rupee(s.upi)}`}</b></div>
        </div>
        {s.peak != null && <p className="small"><Icon name="clock" size={14} /> {`Busiest time: ${hourLabel(s.peak)}`}</p>}
        {s.dishes.length > 0 && (
          <>
            <b className="small">Top dishes</b>
            {s.dishes.slice(0, 5).map(([n, c], i) => (
              <div key={n} className="top-dish"><span className="td-rank">{i + 1}</span><span className="grow">{n}</span><b>{`× ${c}`}</b><i style={{ width: `${(c / s.dishes[0][1]) * 100}%` }} /></div>
            ))}
          </>
        )}
        {!s.n && <p className="muted small center">No delivered orders on this day</p>}
        {dayRev.length > 0 && <p className="small"><span className="rev-stars">★</span> {`${avgRev.toFixed(1)} rating from ${dayRev.length} reviews`}</p>}
      </div>
      <div className="card">
        <h4><Icon name="star" size={18} /> Customer reviews</h4>
        <ReviewList list={reviews} max={10} />
      </div>
    </div>
  );
}
