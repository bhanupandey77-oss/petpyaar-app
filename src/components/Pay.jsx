import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Icon, Field, useToast } from '../ui.jsx';
import { compressImage, upiLink, rupee } from '../lib/utils.js';
import { upiPay } from '../lib/native.js';
import { t } from '../i18n/index.js';

export const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;
export const hasUpi = (x) => !!(x && (x.upiId || x.upiQr));

/** QR made from a UPI link (with amount) — falls back to an uploaded QR photo */
export function UpiQr({ upiId, upiName, upiQr, amount, note, refId, size = 220 }) {
  const [src, setSrc] = useState('');
  const link = upiId ? upiLink({ upiId, upiName, amount, note, ref: refId }) : '';
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
export function UpiButton({ upiId, upiName, amount, note, refId, label = 'Pay by UPI app', className = 'btn primary block lg', onDone }) {
  if (!upiId) return null;
  const go = async () => { await upiPay(upiLink({ upiId, upiName, amount, note, ref: refId }), ''); onDone?.(); };
  return <button type="button" className={className} onClick={go}><Icon name="upi" size={20} /> {t(label)}{amount > 0 ? ` · ${rupee(amount)}` : ''}</button>;
}

/** Edit UPI ID + name + QR photo (used by restaurant shop settings and admin settings) */
export function UpiEditor({ value, onSave, title = 'UPI for receiving money', hint }) {
  const toast = useToast();
  const [f, setF] = useState({ upiId: value.upiId || '', upiName: value.upiName || '', upiQr: value.upiQr || '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => setF({ upiId: value.upiId || '', upiName: value.upiName || '', upiQr: value.upiQr || '' }), [value.upiId, value.upiName, value.upiQr]);
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setF((x) => ({ ...x, upiQr: '' })); const img = await compressImage(file, 700, 240000); setF((x) => ({ ...x, upiQr: img })); } catch (er) { toast(t(er.message), 'err'); }
  };
  const save = async () => {
    const id = f.upiId.trim();
    if (id && !UPI_RE.test(id)) { toast(t('UPI ID looks wrong. Example: shopname@okaxis'), 'err'); return; }
    setBusy(true);
    try { await onSave({ upiId: id, upiName: f.upiName.trim(), upiQr: f.upiQr }); toast(t('Saved')); } catch (er) { console.warn(er); toast(t('Could not save'), 'err'); }
    setBusy(false);
  };
  return (
    <div className="card upi-edit">
      <h4><Icon name="upi" size={18} /> {title}</h4>
      {hint && <p className="tiny muted">{hint}</p>}
      <Field label="Merchant UPI ID" hint="Business / merchant UPI works best (e.g. from PhonePe Business, Paytm for Business, GPay for Business)">
        <input className="input" value={f.upiId} onChange={(e) => setF({ ...f, upiId: e.target.value.replace(/\s/g, '') })} placeholder="shopname@okaxis" autoCapitalize="none" data-notr="" />
      </Field>
      <Field label="Name on UPI account"><input className="input" value={f.upiName} onChange={(e) => setF({ ...f, upiName: e.target.value })} data-notr="" /></Field>
      <div className="qr-edit">
        {f.upiQr ? <img src={f.upiQr} alt="QR" /> : <span className="qr-ph"><Icon name="image" size={28} /><small>No QR photo</small></span>}
        <div className="grow">
          <p className="small"><b>QR code photo</b></p>
          <p className="tiny muted">Take a clear photo or screenshot of your shop's UPI QR (barcode) stand.</p>
          <div className="row gap wrap">
            <label className="btn small ghost"><Icon name="image" size={16} /> {f.upiQr ? 'Change QR' : 'Upload QR'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
            {f.upiQr && <button type="button" className="btn small ghost danger-text" onClick={() => setF({ ...f, upiQr: '' })}>Remove</button>}
          </div>
        </div>
      </div>
      {f.upiId && UPI_RE.test(f.upiId) && <p className="tiny t-green"><Icon name="check" size={12} /> Customers' UPI apps will open with this ID</p>}
      <button className="btn primary block" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save UPI details'}</button>
    </div>
  );
}
