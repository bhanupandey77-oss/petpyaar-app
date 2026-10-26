import React, { useRef, useState } from 'react';
import { Icon, Sheet, useToast, Logo, Wordmark } from '../ui.jsx';
import { rupee, fmtDateTime, plain } from '../lib/utils.js';
import { elementToPdf } from '../lib/pdf.js';
import { cycleRange } from '../lib/data.js';
import { t } from '../i18n/index.js';

const r2 = (n) => Math.round(n * 100) / 100;
const sum = (l, k) => r2(l.reduce((a, o) => a + Number(o[k] || 0), 0));
const PAY = { cod: 'Cash on delivery', upi_rider: 'UPI on delivery', upi_now: 'UPI (paid now)' };

/** Sheet that shows a document and lets the user save it as PDF */
export function DocSheet({ open, onClose, title, fileName, children }) {
  const ref = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await elementToPdf(ref.current, fileName, title); } catch (e) { console.warn(e); toast(t('Could not make the PDF'), 'err'); }
    setBusy(false);
  };
  return (
    <Sheet open={open} onClose={onClose} title={title} full>
      <div className="doc-scroll"><div ref={ref} className="doc">{children}</div></div>
      <button className="btn primary block lg" disabled={busy} onClick={save}><Icon name="download" size={18} /> {busy ? t('Making PDF…') : t('Download PDF')}</button>
    </Sheet>
  );
}

function DocHead({ config, title, sub }) {
  return (
    <div className="doc-head">
      <div className="row gap"><Logo size={40} /><div><Wordmark size={24} /><div className="doc-firm" data-notr="">{config.firmName || 'TechGaon AI Services'}</div></div></div>
      <div className="doc-title"><b>{title}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

/** Customer bill — FoodGaon is the e-commerce operator that charges GST under section 9(5) */
export function Invoice({ o, config }) {
  return (
    <div className="invoice" data-notr="">
      <DocHead config={config} title="Tax Invoice / बिल" sub={`#${o.code}`} />
      <div className="doc-grid">
        <div><small>Issued by (E-commerce operator, Sec. 9(5) CGST)</small><b>{o.firmName || config.firmName}</b><span>{config.firmAddress}</span><span>{`GSTIN: ${o.firmGstin || config.gstin || 'applied for / आवेदन किया गया'}`}</span><span>{config.supportEmail}</span></div>
        <div><small>Restaurant / रेस्टोरेंट</small><b>{o.restaurantName}</b><span>{o.restaurantAddr}</span>{o.restFssai && <span>{`FSSAI: ${o.restFssai}`}</span>}{o.restGstin && <span>{`GSTIN: ${o.restGstin}`}</span>}</div>
        <div><small>Customer / ग्राहक</small><b>{o.address?.name || o.customerName}</b><span>{plain(o.address?.phone || o.customerPhone)}</span><span>{o.address?.line}</span></div>
        <div><small>Order / ऑर्डर</small><b>{`#${o.code}`}</b><span>{fmtDateTime(o.createdMs)}</span><span>{PAY[o.payment] || o.payment}</span></div>
      </div>
      <table className="doc-table">
        <thead><tr><th>Item / आइटम</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>{o.items.map((x) => <tr key={x.id}><td>{x.name}</td><td>{x.qty}</td><td>{rupee(x.price)}</td><td>{rupee(x.price * x.qty)}</td></tr>)}</tbody>
      </table>
      <div className="doc-sum">
        <div><span>Item total / कुल आइटम</span><span>{rupee(o.itemTotal)}</span></div>
        {o.discount > 0 && <div><span>{`Coupon ${o.offerCode} / छूट`}</span><span>− {rupee(o.discount)}</span></div>}
        <div><span>Taxable value / कर योग्य राशि</span><span>{rupee(o.taxable ?? o.itemTotal - (o.discount || 0))}</span></div>
        <div><span>{`CGST ${(o.gstPct || 5) / 2}%`}</span><span>{rupee(r2((o.gst || 0) / 2))}</span></div>
        <div><span>{`SGST ${(o.gstPct || 5) / 2}%`}</span><span>{rupee(r2((o.gst || 0) - r2((o.gst || 0) / 2)))}</span></div>
        <div><span>Delivery / डिलीवरी</span><span>{o.deliveryFee ? rupee(o.deliveryFee) : 'FREE'}</span></div>
        <div className="grand"><span>Total / कुल राशि</span><span>{rupee(o.total)}</span></div>
      </div>
      <p className="doc-note">भुगतान सीधे रेस्टोरेंट को किया गया। इस बिल पर GST, FoodGaon (TechGaon AI Services) द्वारा सरकार को जमा किया जाता है। खाना ऑर्डर करने के लिए धन्यवाद! 🙏</p>
    </div>
  );
}

/** Restaurant weekly statement (one cycle) */
export function Statement({ rest, cycle, orders, setts = [], config }) {
  const rg = cycleRange(cycle);
  const list = orders.filter((o) => o.status === 'delivered').sort((a, b) => a.createdMs - b.createdMs);
  const dues = sum(list, 'dues') || r2(list.reduce((a, o) => a + (o.total - o.payable), 0));
  const paid = r2(setts.filter((x) => x.cycle === cycle && x.status !== 'rejected').reduce((a, x) => a + Number(x.amount || 0), 0));
  return (
    <div className="invoice" data-notr="">
      <DocHead config={config} title="Weekly statement / साप्ताहिक हिसाब" sub={rg.label} />
      <div className="doc-grid">
        <div><small>Restaurant / रेस्टोरेंट</small><b>{rest.name}</b><span>{rest.address}</span>{rest.fssai && <span>{`FSSAI: ${rest.fssai}`}</span>}{rest.gstin && <span>{`GSTIN: ${rest.gstin}`}</span>}</div>
        <div><small>Payment due / भुगतान की तारीख़</small><b>{new Date(rg.dueMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b><span>{`${config.firmName} · UPI: ${config.upiId || '—'}`}</span></div>
      </div>
      <table className="doc-table small">
        <thead><tr><th>Order</th><th>Date</th><th>Bill</th><th>GST</th><th>Comm.</th><th>To FoodGaon</th><th>You keep</th></tr></thead>
        <tbody>{list.map((o) => <tr key={o.id}><td>{`#${o.code}`}</td><td>{new Date(o.createdMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td><td>{rupee(o.total)}</td><td>{rupee(o.gst || 0)}</td><td>{rupee(o.commission || 0)}</td><td>{rupee(o.dues ?? o.total - o.payable)}</td><td>{rupee(o.payable)}</td></tr>)}</tbody>
      </table>
      {!list.length && <p className="doc-note">No delivered orders in this week.</p>}
      <div className="doc-sum">
        <div><span>{`Orders delivered / डिलीवर ऑर्डर`}</span><span>{list.length}</span></div>
        <div><span>Total bills (incl. GST) / कुल बिक्री</span><span>{rupee(sum(list, 'total'))}</span></div>
        <div><span>GST 5% (FoodGaon pays govt) / GST</span><span>{rupee(sum(list, 'gst'))}</span></div>
        <div><span>{`FoodGaon commission ${config.commissionPct}% (incl. 18% GST)`}</span><span>{rupee(sum(list, 'commission'))}</span></div>
        {sum(list, 'fgCoupon') > 0 && <div><span>FoodGaon coupons (returned to you)</span><span>− {rupee(sum(list, 'fgCoupon'))}</span></div>}
        <div className="grand"><span>Send to FoodGaon / FoodGaon को भेजें</span><span>{rupee(dues)}</span></div>
        <div><span>Already paid / भेजा जा चुका</span><span>{rupee(paid)}</span></div>
        <div className="grand"><span>Balance / बाकी</span><span>{rupee(Math.max(0, r2(dues - paid)))}</span></div>
        <div><span>Your earning / आपकी कमाई</span><span>{rupee(sum(list, 'payable'))}</span></div>
      </div>
      <p className="doc-note">ग्राहकों का पूरा पैसा सीधे आपके खाते में आया। हर हफ़्ते सिर्फ़ GST और कमीशन FoodGaon को भेजें। धन्यवाद! 🙏</p>
    </div>
  );
}

/** Admin monthly GST report */
export function GstReport({ month, orders, rests, config }) {
  const list = orders.filter((o) => o.status === 'delivered' && (o.day || '').startsWith(month));
  const by = rests.map((r) => ({ r, l: list.filter((o) => o.restaurantId === r.id) })).filter((x) => x.l.length);
  const taxable = sum(list, 'taxable'); const gst = sum(list, 'gst'); const comm = sum(list, 'commission'); const cgst = sum(list, 'commissionGst');
  return (
    <div className="invoice" data-notr="">
      <DocHead config={config} title="GST report / GST रिपोर्ट" sub={month} />
      <div className="doc-grid"><div><small>Firm</small><b>{config.firmName}</b><span>{`GSTIN: ${config.gstin || '—'}`}</span><span>{config.firmAddress}</span></div></div>
      <table className="doc-table small">
        <thead><tr><th>Restaurant</th><th>Orders</th><th>Taxable</th><th>GST 5%</th><th>Commission</th><th>GST in comm.</th></tr></thead>
        <tbody>{by.map(({ r, l }) => <tr key={r.id}><td>{r.name}</td><td>{l.length}</td><td>{rupee(sum(l, 'taxable'))}</td><td>{rupee(sum(l, 'gst'))}</td><td>{rupee(sum(l, 'commission'))}</td><td>{rupee(sum(l, 'commissionGst'))}</td></tr>)}</tbody>
      </table>
      <div className="doc-sum">
        <div><span>Restaurant service (Sec. 9(5)) taxable value — SAC 996331</span><span>{rupee(taxable)}</span></div>
        <div><span>CGST 2.5% + SGST 2.5% to pay (cash, no ITC)</span><span>{rupee(gst)}</span></div>
        <div><span>Commission income (incl. GST)</span><span>{rupee(comm)}</span></div>
        <div><span>Commission taxable value</span><span>{rupee(r2(comm - cgst))}</span></div>
        <div><span>CGST 9% + SGST 9% on commission</span><span>{rupee(cgst)}</span></div>
        <div className="grand"><span>Total GST for this month</span><span>{rupee(r2(gst + cgst))}</span></div>
      </div>
      <p className="doc-note">यह रिपोर्ट GSTR-1 और GSTR-3B भरने में मदद के लिए है। रिटर्न भरने से पहले CA से मिलान कर लें।</p>
    </div>
  );
}
