import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Icon, useToast } from '../ui.jsx';
import { patch, put } from '../lib/fb.js';
import { saveImage } from '../lib/native.js';
import { upiLink, rupee, compressImage } from '../lib/utils.js';
import { hi as t } from '../i18n/index.js';

const MAX_SHOTS = 4;
const fmtMob = (m) => (m ? `${m.slice(0, 5)} ${m.slice(5)}` : '');

async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch {
    try { const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); return true; } catch { return false; }
  }
}
const loadImg = (src) => new Promise((ok, bad) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = bad; i.src = src; });

/* QR card saved to the gallery: FoodGaon, restaurant, amount, order no., QR, UPI ID + a green note */
async function qrCard({ qrSrc, rest, amount, code }) {
  const W = 720; const H = 1120; const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#fff7ef'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(30, 30, W - 60, H - 60, 36); x.fill();
  x.textAlign = 'center';
  x.fillStyle = '#e8461a'; x.font = '900 46px Poppins, sans-serif'; x.fillText('FOODगाँव', W / 2, 110);
  x.fillStyle = '#2b1d12'; x.font = '700 32px Poppins, sans-serif'; x.fillText(rest.name.slice(0, 34), W / 2, 165);
  x.fillStyle = '#1e9e55'; x.font = '900 72px Poppins, sans-serif'; x.fillText(rupee(amount), W / 2, 255);
  x.fillStyle = '#7a6656'; x.font = '500 28px Poppins, sans-serif'; x.fillText(`Order #${code}`, W / 2, 300);
  const img = await loadImg(qrSrc); const S = 460; const sc = Math.min(S / img.width, S / img.height);
  const w = img.width * sc; const h = img.height * sc;
  x.drawImage(img, (W - w) / 2, 330 + (S - h) / 2, w, h);
  x.fillStyle = '#2b1d12'; x.font = '700 30px Poppins, sans-serif';
  if (rest.upiId) x.fillText(`UPI: ${rest.upiId}`, W / 2, 840);
  if (rest.upiMobile) x.fillText(`UPI mobile: ${fmtMob(rest.upiMobile)}`, W / 2, 884);
  x.fillStyle = '#eefaf2'; x.strokeStyle = '#1e9e55'; x.lineWidth = 3; x.beginPath(); x.roundRect(70, 920, W - 140, 150, 20); x.fill(); x.stroke();
  x.fillStyle = '#14773f'; x.font = '700 25px "Noto Sans Devanagari", Poppins, sans-serif';
  ['गैलरी से QR द्वारा भुगतान कर रहे हैं तो ₹2,000 से ऊपर का', 'ऑर्डर हिस्सों में भुगतान करें, और सभी भुगतान के', 'स्क्रीनशॉट FoodGaon में अपलोड करें।'].forEach((l, i) => x.fillText(l, W / 2, 965 + i * 38));
  return c.toDataURL('image/png');
}

/** "Pay now by UPI": UPI ID / mobile / QR → customer pays in any UPI app → uploads the payment screenshot(s).
 *  The order reaches the restaurant only with the screenshots; the restaurant checks them and accepts. */
export default function PayManual({ order, rest, onDone, onClose, submit, cancelFn, label, sendLabel }) {
  const toast = useToast();
  const [qr, setQr] = useState(rest.upiQr || '');
  const [shots, setShots] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.body.classList.add('noscroll');
    if (!rest.upiQr && rest.upiId) QRCode.toDataURL(upiLink({ upiId: rest.upiId, upiName: rest.upiName || rest.name, amount: order.amount, note: `FoodGaon ${order.code}`, ref: order.id, extra: rest.upiParams }), { margin: 1, width: 520 }).then(setQr).catch(() => {});
    return () => document.body.classList.remove('noscroll');
  }, []); // eslint-disable-line

  const copy = async (v, what) => { if (await copyText(v)) toast(t('{} copied', what)); };
  const download = async () => {
    try { const png = await qrCard({ qrSrc: qr, rest, amount: order.amount, code: order.code }); toast((await saveImage(png, `FoodGaon-${order.code}.png`)) ? t('QR saved in your gallery (Pictures/FoodGaon)') : t('Could not save'), 'ok'); }
    catch (e) { console.warn(e); toast(t('Could not save'), 'err'); }
  };
  const addShots = async (e) => {
    const files = [...(e.target.files || [])]; e.target.value = '';
    for (const f of files.slice(0, MAX_SHOTS - shots.length)) {
      try { const img = await compressImage(f, 1000, 170000); setShots((l) => [...l, img].slice(0, MAX_SHOTS)); } catch { toast(t('Could not read the photo'), 'err'); }
    }
  };
  const send = async () => {
    if (!shots.length) { toast(t('Upload the payment screenshot first'), 'err'); return; }
    setBusy(true);
    try {
      if (submit) { await submit(shots); onDone(order.id); setBusy(false); return; }
      await put('payproofs', order.id, { orderId: order.id, restaurantId: rest.id, customerUid: order.uid, imgs: shots, createdMs: Date.now() }, false);
      await patch('orders', order.id, { status: 'placed', 'timeline.placed': Date.now(), paymentClaim: 'screenshot', claimMs: Date.now(), proofCount: shots.length });
      onDone(order.id);
    } catch (e) { console.warn(e); toast(t('Could not send. Check internet and try again.'), 'err'); }
    setBusy(false);
  };
  const cancel = async () => { if (cancelFn) { cancelFn(); return; } try { await patch('orders', order.id, { status: 'payment_failed' }); } catch { /* ignore */ } onClose(); };

  return createPortal(
    <div className="pm-wrap" data-notr="">
      <div className="pm-top">
        <button className="icon-btn round" onClick={cancel} aria-label="Back"><Icon name="back" size={22} /></button>
        <div><small data-notr="">{label || `${rest.name} · ${t('Order')} #${order.code}`}</small><h2>{t('Pay {}', rupee(order.amount))}</h2></div>
      </div>
      <div className="pm-body">
        <div className="pm-step">{t('Pay by UPI ID, mobile number or the QR below — then upload the payment screenshot or photo below.')}</div>
        <div className="card">
          {rest.upiId && <>
            <p className="pm-lbl">UPI ID</p>
            <div className="pm-box"><b data-notr="">{rest.upiId}</b><button className="pm-copy" onClick={() => copy(rest.upiId, 'UPI ID')}><Icon name="copy" size={14} /> {t('Copy')}</button></div>
          </>}
          {rest.upiMobile && <>
            {rest.upiId && <div className="pm-or">— {t('or')} —</div>}
            <p className="pm-lbl">{t('Mobile number (UPI)')}</p>
            <div className="pm-box"><b>{fmtMob(rest.upiMobile)}</b><button className="pm-copy" onClick={() => copy(rest.upiMobile, t('Number'))}><Icon name="copy" size={14} /> {t('Copy')}</button></div>
          </>}
          {qr && <>
            <div className="pm-or">— {t('or scan the QR')} —</div>
            <img className="pm-qr" src={qr} alt="UPI QR" />
            <button className="btn block pm-dl" onClick={download}><Icon name="download" size={18} /> {t('Download QR')}</button>
          </>}
        </div>
        <div className="pm-up">
          <h4>📸 {t('Upload payment screenshot / photo')}</h4>
          <p>{t('Paid in parts? Upload all the screenshots.')}</p>
          <div className="row gap" style={{ justifyContent: 'center' }}>
            <label className="btn green small"><Icon name="camera" size={16} /> {t('Camera')}<input type="file" accept="image/*" capture="environment" hidden onChange={addShots} /></label>
            <label className="btn ghost small pm-g"><Icon name="image" size={16} /> {t('Gallery')}<input type="file" accept="image/*" multiple hidden onChange={addShots} /></label>
          </div>
          {shots.length > 0 && (
            <div className="pm-shots">
              {shots.map((s, i) => <span key={i}><img src={s} alt="" /><button onClick={() => setShots(shots.filter((_, k) => k !== i))} aria-label="Remove">×</button></span>)}
            </div>
          )}
        </div>
        <button className="btn pm-send block lg" disabled={busy || !shots.length} onClick={send}>{busy ? t('Sending…') : `${sendLabel || t('Send order')} ✓`}</button>
        <button className="btn ghost block" onClick={cancel}>{cancelFn ? t('Close') : t('Cancel order')}</button>
      </div>
    </div>,
    document.body,
  );
}
