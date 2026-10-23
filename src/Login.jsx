import React, { useEffect, useRef, useState } from 'react';
import { sendOtp, updateProfile, auth, put, serverTimestamp } from './lib/fb.js';
import { Logo, Wordmark, Icon, useToast } from './ui.jsx';
import { t } from './i18n/index.js';

const errText = (e) => {
  const c = e?.code || '';
  if (c.includes('invalid-verification-code')) return 'Wrong OTP. Please check and try again.';
  if (c.includes('code-expired')) return 'OTP expired. Please request a new one.';
  if (c.includes('too-many-requests') || c.includes('quota')) return 'Too many attempts. Please try again after some time.';
  if (c.includes('operation-not-allowed')) return 'SMS login is not enabled yet. Please try again later.';
  if (c.includes('invalid-phone')) return 'Enter a valid 10-digit mobile number';
  if (c.includes('network')) return 'Network problem. Please try again.';
  return 'Could not send OTP. Please try again.';
};

export default function Login({ onClose }) {
  const toast = useToast();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const conf = useRef(null);
  const otpRef = useRef(null);

  useEffect(() => { if (left <= 0) return; const x = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(x); }, [left]);
  useEffect(() => { if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 200); }, [step]);

  const send = async (e) => {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) { toast(t('Enter a valid 10-digit mobile number'), 'err'); return; }
    setBusy(true);
    try {
      conf.current = await sendOtp(phone, 'recaptcha-box');
      setStep('otp'); setLeft(30);
      toast(t('OTP sent to +91 {}').replace('{}', phone));
    } catch (er) { console.warn(er); toast(t(errText(er)), 'err'); }
    setBusy(false);
  };
  const verify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) return;
    setBusy(true);
    try {
      const r = await conf.current.confirm(otp);
      if (!r.user.displayName) { setStep('name'); setBusy(false); return; }
      onClose?.();
    } catch (er) { toast(t(errText(er)), 'err'); setBusy(false); }
  };
  const saveName = async (e) => {
    e?.preventDefault();
    const n = name.trim();
    if (n.length < 2) { toast(t('Please enter your name'), 'err'); return; }
    setBusy(true);
    try {
      await updateProfile(auth.currentUser, { displayName: n });
      await put('customers', auth.currentUser.uid, { name: n, phone: auth.currentUser.phoneNumber, createdAt: serverTimestamp() });
    } catch (er) { console.warn(er); }
    onClose?.();
    location.reload();
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        {onClose && step !== 'name' && <button className="icon-btn login-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>}
        <div className="login-brand"><Logo size={64} animate /><Wordmark size={34} /><p>Hot food from your town's best pure-veg kitchens</p></div>

        {step === 'phone' && (
          <form onSubmit={send} className="login-form">
            <h3>Log in or sign up</h3>
            <div className="phone-input">
              <span>+91</span>
              <input inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} autoFocus />
            </div>
            <button className="btn primary block lg" disabled={busy || phone.length !== 10}>{busy ? 'Sending…' : 'Continue'}</button>
            <p className="tiny muted center">By continuing you agree to our Terms & Privacy Policy</p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verify} className="login-form">
            <h3>Enter OTP</h3>
            <p className="muted small">{`Sent to +91 ${phone}`} · <button type="button" className="link" onClick={() => { setStep('phone'); setOtp(''); }}>Change</button></p>
            <input ref={otpRef} className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} placeholder="••••••"
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setOtp(v); }} />
            <button className="btn primary block lg" disabled={busy || otp.length !== 6}>{busy ? 'Checking…' : 'Verify & continue'}</button>
            <p className="small center">
              {left > 0 ? <span className="muted">{`Resend OTP in ${left}s`}</span> : <button type="button" className="link" onClick={send}>Resend OTP</button>}
            </p>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={saveName} className="login-form">
            <h3>What should we call you?</h3>
            <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={40} />
            <button className="btn primary block lg" disabled={busy}>Let's eat!</button>
          </form>
        )}
        <div id="recaptcha-box" />
      </div>
    </div>
  );
}
