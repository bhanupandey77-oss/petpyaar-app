import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, useToast } from '../ui.jsx';
import { patch } from '../lib/fb.js';
import { upiPay, isNative } from '../lib/native.js';
import { upiLink, rupee } from '../lib/utils.js';
import { chosenApp, UpiAppStrip } from '../components/Pay.jsx';
import { t } from '../i18n/index.js';

/* "Pay now by UPI": the order reaches the restaurant ONLY after the UPI app reports success.
   Phone app: we read the UPI app's own answer (SUCCESS / FAILURE / back pressed).
   Web: the browser cannot read it, so the customer confirms. */
export default function PayWait({ order, rest, onDone, onClose }) {
  const toast = useToast();
  const [st, setSt] = useState('opening'); // opening | waiting | failed | confirm | saving
  const [msg, setMsg] = useState('');
  const [last, setLast] = useState('');
  const [app, setApp] = useState(chosenApp());
  const started = useRef(false);
  const link = upiLink({ upiId: rest.upiId, upiName: rest.upiName || rest.name, amount: order.amount, note: `FoodGaon order ${rest.name}`, ref: order.id });

  const confirmPlaced = async (extra) => {
    setSt('saving');
    try {
      await patch('orders', order.id, { status: 'placed', 'timeline.placed': Date.now(), paymentClaim: 'upi_now', claimMs: Date.now(), ...extra });
      onDone(order.id);
    } catch (e) { console.warn(e); toast(t('Could not save'), 'err'); setSt('failed'); }
  };
  const pay = async () => {
    setSt('waiting'); setMsg('');
    const r = await upiPay(link, app);
    if (!isNative) { setSt('confirm'); return; }
    if (!r.ok) { setSt('failed'); setMsg(t('No UPI app found on this phone')); return; }
    setLast(`${r.status}${r.txnId ? ' · ' + r.txnId : ''}`);
    // only a clear SUCCESS from the UPI app (with a transaction id) sends the order to the restaurant
    if (r.status === 'SUCCESS' && (r.txnId || r.txnRef)) {
      await confirmPlaced({ upiStatus: r.status, upiTxn: r.txnId || '', upiRef: r.txnRef || '' });
      return;
    }
    setSt('failed');
    setMsg(r.status === 'FAILURE' || r.status === 'FAILED' ? t('The UPI app says the payment FAILED.')
      : r.status === 'SUBMITTED' || r.status === 'PENDING' ? t('Payment is still pending in your UPI app. Order is not placed yet — check your UPI app, then try again or choose pay on delivery.')
        : t('Payment was not completed (you came back without paying).'));
  };
  useEffect(() => { if (!started.current) { started.current = true; pay(); } }, []); // eslint-disable-line

  const switchTo = async (payment) => {
    setSt('saving');
    try { await patch('orders', order.id, { payment, status: 'placed', 'timeline.placed': Date.now() }); onDone(order.id); } catch { toast(t('Could not save'), 'err'); setSt('failed'); }
  };
  const cancel = async () => {
    try { await patch('orders', order.id, { status: 'payment_failed', 'timeline.payment_failed': Date.now() }); } catch { /* ignore */ }
    onClose();
  };

  return createPortal(
    <div className="paywait">
      <div className="pw-card">
        {(st === 'opening' || st === 'waiting' || st === 'saving') && (
          <>
            <div className="pw-spin"><span className="pw-ring" /><span className="pw-ring r2" /><b>₹</b></div>
            <h3>{st === 'saving' ? t('Placing your order…') : t('Complete the payment in your UPI app')}</h3>
            <p className="pw-amt">{rupee(order.amount)}</p>
            <p className="small muted">{t('Money goes straight to the restaurant. Do not close FoodGaon.')}</p>
          </>
        )}
        {st === 'confirm' && (
          <>
            <div className="pw-icon q">?</div>
            <h3>{t('Did the payment go through?')}</h3>
            <p className="pw-amt">{rupee(order.amount)}</p>
            <button className="btn green block lg" onClick={() => confirmPlaced({ upiStatus: 'CUSTOMER_CONFIRMED' })}><Icon name="check" size={18} /> {t('Yes, payment done')}</button>
            <button className="btn ghost block" onClick={() => { setSt('failed'); setMsg(t('Payment was not completed.')); }}>{t('No, not paid')}</button>
          </>
        )}
        {st === 'failed' && (
          <>
            <div className="pw-icon x">!</div>
            <h3>{t('Payment not completed')}</h3>
            <p className="small">{msg}</p>
            <p className="tiny muted">{t('Your order has NOT been sent to the restaurant yet.')}</p>
            {last && <p className="tiny muted" data-notr="">{`UPI: ${last}`}</p>}
            <UpiAppStrip value={app} onChange={setApp} compact />
            <button className="btn primary block lg" onClick={pay}>↻ {`${t('Try paying again')} · ${rupee(order.amount)}`}</button>
            <button className="btn ghost block" onClick={() => switchTo('upi_rider')}>{t('Pay on delivery by UPI instead')}</button>
            <button className="btn ghost block" onClick={() => switchTo('cod')}>{t('Cash on delivery instead')}</button>
            <button className="btn ghost danger-text block" onClick={cancel}>{t('Cancel order')}</button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
