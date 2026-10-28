import React, { useState } from 'react';
import { Icon, Confirm, useToast } from '../ui.jsx';
import { patch, remove, bulk, getList } from '../lib/fb.js';
import { t } from '../i18n/index.js';

/** Remove an order from MY list. Customer / restaurant / rider: hidden only for them (accounts stay correct).
 *  Admin: deleted permanently (with its review). */
export function HideOrderBtn({ o, role, small = true }) {
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  const admin = role === 'admin';
  const ok = async () => {
    try {
      if (admin) { await remove('orders', o.id); remove('reviews', o.id).catch(() => {}); }
      else await patch('orders', o.id, { [`hide.${role}`]: true });
      toast(admin ? t('Order deleted') : t('Order removed from your list'));
    } catch (e) { console.warn(e); toast(t('Could not delete'), 'err'); }
    setAsk(false);
  };
  return (
    <>
      <button type="button" className={'hide-btn' + (small ? ' small' : '')} onClick={(e) => { e.stopPropagation(); setAsk(true); }} aria-label={admin ? 'Delete order' : 'Remove order'}>
        <Icon name="trash" size={small ? 15 : 18} />
      </button>
      <Confirm open={ask} danger title={admin ? t('Delete this order permanently?') : t('Remove this order from your list?')}
        text={admin ? `#${o.code} — ${t('It will be deleted for everyone. This cannot be undone.')}` : `#${o.code} — ${t('Only hidden for you. Bills and accounts stay safe.')}`}
        okText={admin ? t('Delete') : t('Remove')} onOk={ok} onClose={() => setAsk(false)} />
    </>
  );
}
export const visibleFor = (role) => (o) => !(o.hide && o.hide[role]);

/** Admin: delete all old/test orders created before a date (with their reviews, rider pays & settlements) */
export function ClearTestOrders() {
  const toast = useToast();
  const today = new Date(); const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [before, setBefore] = useState(ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)));
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const cut = new Date(before + 'T00:00:00').getTime();
  const scan = async () => {
    setBusy(true);
    try {
      const [orders, pays, setts] = await Promise.all([getList('orders', []), getList('riderPays', []), getList('settlements', [])]);
      setFound({ orders: orders.filter((o) => (o.createdMs || 0) < cut), pays: pays.filter((x) => (x.createdMs || 0) < cut), setts: setts.filter((x) => (x.createdMs || x.paidMs || 0) < cut) });
    } catch (e) { console.warn(e); toast(t('Could not load'), 'err'); }
    setBusy(false);
  };
  const run = async () => {
    setBusy(true); setAsk(false);
    try {
      const ops = [
        ...found.orders.flatMap((o) => [['del', 'orders', o.id], ['del', 'reviews', o.id]]),
        ...found.pays.map((x) => ['del', 'riderPays', x.id]),
        ...found.setts.map((x) => ['del', 'settlements', x.id]),
      ];
      await bulk(ops);
      toast(t('{} test orders deleted').replace('{}', found.orders.length)); setFound(null);
    } catch (e) { console.warn(e); toast(t('Could not delete'), 'err'); }
    setBusy(false);
  };
  return (
    <div className="card">
      <h4><Icon name="trash" size={18} /> {t('Delete old / test orders')}</h4>
      <p className="tiny muted">{t('Deletes every order placed before this date, with its reviews, delivery-pay records and settlements. Use it once before going live.')}</p>
      <div className="row gap">
        <input className="input grow" type="date" value={before} onChange={(e) => { setBefore(e.target.value); setFound(null); }} />
        <button className="btn ghost" disabled={busy} onClick={scan}>{t('Check')}</button>
      </div>
      {found && (
        <>
          <p className="small">{`${found.orders.length} ${t('orders')} · ${found.pays.length} ${t('rider payments')} · ${found.setts.length} ${t('settlements')}`}</p>
          <button className="btn danger block" disabled={busy || !(found.orders.length + found.pays.length + found.setts.length)} onClick={() => setAsk(true)}>{t('Delete all of these')}</button>
        </>
      )}
      <Confirm open={ask} danger title={t('Delete permanently?')} text={t('This cannot be undone.')} okText={t('Delete')} onOk={run} onClose={() => setAsk(false)} />
    </div>
  );
}
