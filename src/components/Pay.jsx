import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Icon, Field, useToast } from '../ui.jsx';
import { compressImage, upiLink, rupee, parseUpiQr } from '../lib/utils.js';

/* decode a QR code from a photo (jsQR, loaded only when needed) */
async function readQr(file) {
  const { default: jsQR } = await import('jsqr');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    for (const max of [1400, 900, 2000]) {
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const r = jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
      if (r?.data) return r.data;
    }
    return '';
  } finally { URL.revokeObjectURL(url); }
}
import { upiPay, upiApps, isNative } from '../lib/native.js';
import { LS } from '../lib/utils.js';
import { t } from '../i18n/index.js';

export const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;
export const hasUpi = (x) => !!(x && (x.upiId || x.upiQr));

/* UPI apps installed on this phone (with their own icons from the phone) */
let APPS = null;
export function useUpiApps() {
  const [apps, setApps] = useState(APPS || []);
  useEffect(() => { if (APPS) return; upiApps().then((a) => { APPS = a; setApps(a); }); }, []);
  return apps;
}
// CRED (and BHIM) accept app-to-app shop payments; Paytm/PhonePe/GPay often block them without a payment gateway
const PREF = ['cred', 'bhim', 'amazon', 'mobikwik', 'whatsapp', 'google', 'phonepe', 'paytm'];
const rank = (p) => { const i = PREF.findIndex((k) => p.includes(k)); return i < 0 ? 99 : i; };
export const chosenApp = () => LS.get('pp_upi_pkg', '');

/** row of UPI app icons — tap one to choose which app opens */
export function UpiAppStrip({ value, onChange, compact }) {
  const apps = [...useUpiApps()].sort((a, b) => rank(a.package) - rank(b.package));
  if (!apps.length) {
    return <div className="upi-strip generic"><span className="upi-badge">UPI</span><small>{isNative ? t('Any UPI app on your phone') : 'Google Pay · PhonePe · Paytm · BHIM'}</small></div>;
  }
  return (
    <div className={'upi-strip' + (compact ? ' compact' : '')}>
      {apps.slice(0, compact ? 5 : 8).map((a) => (
        <button type="button" key={a.package} className={'upi-app' + (value === a.package ? ' on' : '')} onClick={(e) => { e.stopPropagation(); LS.set('pp_upi_pkg', a.package); onChange?.(a.package); }} title={a.label}>
          {a.icon ? <img src={a.icon} alt="" /> : <span className="upi-badge">UPI</span>}
          {!compact && <small data-notr="">{a.label}</small>}
        </button>
      ))}
    </div>
  );
}

/** QR made from a UPI link (with amount) — falls back to an uploaded QR photo */
export function UpiQr({ upiId, upiName, upiQr, amount, note, refId, size = 220, extra }) {
  const [src, setSrc] = useState('');
  const link = upiId ? upiLink({ upiId, upiName, amount, note, ref: refId, extra }) : '';
  useEffect(() => {
    let on = true;
    if (!link) { setSrc(''); return; }
    QRCode.toDataURL(link, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' }).then((d) => on && setSrc(d)).catch(() => setSrc(''));
    return () => { on = false; };
  }, [link, size]);
  const img = src || upiQr;
  if (!img) return null;
  return (
    <div className="upi-qr">
      <img src={img} alt="UPI QR" width={size} height={size} />
      {upiId && <small data-notr="">{upiId}</small>}
      {amount > 0 && <b>{rupee(amount)}</b>}
    </div>
  );
}

/** “Open UPI app” button */
export function UpiButton({ upiId, upiName, amount, note, refId, label = 'Pay by UPI app', className = 'btn primary block lg', onDone, extra }) {
  if (!upiId) return null;
  const go = async () => { await upiPay(upiLink({ upiId, upiName, amount, note, ref: refId, extra }), chosenApp()); onDone?.(); };
  return <button type="button" className={className} onClick={go}><Icon name="upi" size={20} /> {t(label)}{amount > 0 ? ` · ${rupee(amount)}` : ''}</button>;
}

/** Edit UPI ID + name + QR photo (used by restaurant shop settings and admin settings) */
export function UpiEditor({ value, onSave, title = 'UPI for receiving money', hint, noQr }) {
  const toast = useToast();
  const [f, setF] = useState({ upiId: value.upiId || '', upiName: value.upiName || '', upiQr: value.upiQr || '' });
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useState(value.upiParams || null);
  useEffect(() => setF({ upiId: value.upiId || '', upiName: value.upiName || '', upiQr: value.upiQr || '' }), [value.upiId, value.upiName, value.upiQr]);
  useEffect(() => setParams(value.upiParams || null), [value.upiParams]);
  const scan = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    try {
      const txt = await readQr(file);
      const u = parseUpiQr(txt);
      if (!u) { toast(t('No UPI QR found in this photo. Take a clear, straight photo of the QR.'), 'err'); return; }
      setF((x) => ({ ...x, upiId: u.upiId, upiName: u.upiName || x.upiName })); setParams(u.extra);
      toast(Object.keys(u.extra).length ? t('Shop QR read — merchant details saved with your UPI ID') : t('QR read. It looks like a personal UPI QR (no merchant code).'));
    } catch (er) { console.warn(er); toast(t('Could not read the QR'), 'err'); }
  };
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setF((x) => ({ ...x, upiQr: '' })); const img = await compressImage(file, 700, 240000); setF((x) => ({ ...x, upiQr: img })); } catch (er) { toast(t(er.message), 'err'); }
  };
  const save = async () => {
    const id = f.upiId.trim();
    if (id && !UPI_RE.test(id)) { toast(t('UPI ID looks wrong. Example: shopname@okaxis'), 'err'); return; }
    setBusy(true);
    if (noQr && !id) { toast(t('Enter your UPI ID'), 'err'); setBusy(false); return; }
    try { await onSave({ upiId: id, upiName: f.upiName.trim(), upiQr: noQr ? '' : f.upiQr, upiParams: params || null }); toast(t('Saved')); } catch (er) { console.warn(er); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  return (
    <div className="card upi-edit">
      <h4><Icon name="upi" size={18} /> {title}</h4>
      {hint && <p className="tiny muted">{hint}</p>}
      {noQr && (
        <div className="qr-scan">
          <p className="small"><b>{t('Easiest: scan your shop’s UPI QR')}</b></p>
          <p className="tiny muted">{t('FoodGaon reads the UPI ID and merchant code from your QR stand, so customers’ UPI apps accept the payment.')}</p>
          <div className="row gap">
            <label className="btn small primary"><Icon name="camera" size={16} /> {t('Scan QR')}<input type="file" accept="image/*" capture="environment" hidden onChange={scan} /></label>
            <label className="btn small ghost"><Icon name="image" size={16} /> {t('QR from gallery')}<input type="file" accept="image/*" hidden onChange={scan} /></label>
          </div>
          {params && Object.keys(params).length > 0 && <p className="tiny t-green"><Icon name="check" size={12} /> {`${t('Merchant code')}: ${params.mc || '—'}`}</p>}
        </div>
      )}
      <Field label="Merchant UPI ID" hint="Business / merchant UPI works best (e.g. from PhonePe Business, Paytm for Business, GPay for Business)">
        <input className="input" value={f.upiId} onChange={(e) => { setF({ ...f, upiId: e.target.value.replace(/\s/g, '') }); setParams(null); }} placeholder="shopname@okaxis" autoCapitalize="none" data-notr="" />
      </Field>
      {noQr && <p className="upi-warn"><b>{t('Use a BUSINESS / merchant UPI ID')}</b><br />{t('UPI apps (Paytm, PhonePe, GPay) block app payments to a personal UPI ID like 98XXXXXXXX@upi. Get a free business UPI from Paytm for Business, PhonePe Business or BharatPe and put that ID here.')}</p>}
      <Field label="Name on UPI account"><input className="input" value={f.upiName} onChange={(e) => setF({ ...f, upiName: e.target.value })} data-notr="" /></Field>
      {!noQr && <div className="qr-edit">
        {f.upiQr ? <img src={f.upiQr} alt="QR" /> : <span className="qr-ph"><Icon name="image" size={28} /><small>No QR photo</small></span>}
        <div className="grow">
          <p className="small"><b>QR code photo</b></p>
          <p className="tiny muted">Take a clear photo or screenshot of your shop's UPI QR (barcode) stand.</p>
          <div className="row gap wrap">
            <label className="btn small ghost"><Icon name="camera" size={16} /> Camera<input type="file" accept="image/*" capture="environment" hidden onChange={pick} /></label>
            <label className="btn small ghost"><Icon name="image" size={16} /> Gallery<input type="file" accept="image/*" hidden onChange={pick} /></label>
            {f.upiQr && <button type="button" className="btn small ghost danger-text" onClick={() => setF({ ...f, upiQr: '' })}>Remove</button>}
          </div>
        </div>
      </div>}
      {f.upiId && UPI_RE.test(f.upiId) && <p className="tiny t-green"><Icon name="check" size={12} /> Customers' UPI apps will open with this ID</p>}
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save UPI details'}</button>
    </div>
  );
}
