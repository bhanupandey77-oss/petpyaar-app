import { wa } from './lib/utils.js';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LANGS, getLang, setLang } from './i18n/index.js';

const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm10 3-5-5',
  bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 4-6 8-6s8 2 8 6',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM1 21c0-4 3.5-6 8-6s8 2 8 6M16 3.5a4 4 0 0 1 0 7.5M19 15c2.5.8 4 2.7 4 6',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  more: 'M4 6h16M4 12h16M4 18h16',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  back: 'M15 18 9 12l6-6',
  right: 'M9 18l6-6-6-6',
  down: 'M6 9l6 6 6-6',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  chat: 'M4 20l1.4-4.2A8 8 0 1 1 8.5 19z M9 10.5h.01M12 10.5h.01M15 10.5h.01',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
  logout: 'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-15v5l3 2',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  gps: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  store: 'M3 9l2-5h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8M10 21v-5h4v5',
  bike: 'M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 15h6l3-6h-4M14 6h3l1.5 9M5.5 15 9 9h4',
  fire: 'M12 22c4 0 7-2.7 7-7 0-3-2-5.5-3.5-7 0 2-1 3.5-2.5 4 .5-3-1-6.5-4-9 0 4-4 6.5-4 12 0 4.3 3 7 7 7z',
  leaf: 'M5 21c0-9 5-15 16-16-1 11-7 16-16 16zM5 21l8-8',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
  cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01',
  upi: 'M7 4l-3 16M13 4l-3 16M17 8l4 4-4 4',
  image: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6v-5m0-3v.01',
  nav: 'M3 11l18-8-8 18-2-8z',
  power: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z',
  lang: 'M4 5h8M8 3v2M5 9c1.5 3 4 5 7 6M11 5c-1 4-3 7-7 9M13 21l4-9 4 9M14.5 18h5',
  swap: 'M4 7h13l-3-3M20 17H7l3 3',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17v.01',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  shield: 'M12 3l8 3v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6zM8.5 12l2.5 2.5 4.5-5',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-4v4M17 13.5h.01',
};

export function Icon({ name, size = 22, stroke = 2, className = '', style, fill = 'none' }) {
  return (
    <svg className={'ic ' + className} style={style} width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

/* Brand mark: "पे" sits inside the bowl of a "P", with steam rising — पेट + Pyaar */
export function Logo({ size = 44, animate = false }) {
  return (
    <svg className={'logo' + (animate ? ' logo-anim' : '')} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="FoodGaon logo">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8a1f" /><stop offset="1" stopColor="#e2361b" /></linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lg)" />
      <path className="logo-roof" d="M22 17 L32 9 L42 17" fill="none" stroke="#ffd34d" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="32" y="34" textAnchor="middle" fontFamily="Poppins, 'Baloo 2', sans-serif" fontWeight="900" fontSize="17" letterSpacing="-.4" fill="#fff">FOOD</text>
      <text x="32" y="55" textAnchor="middle" fontFamily="'Baloo 2', 'Mukta', sans-serif" fontWeight="800" fontSize="21" fill="#ffd34d">गाँव</text>
      {/* Indian veg mark: green dot in a green square */}
      <rect x="47" y="6" width="11" height="11" rx="1.5" fill="#fff" />
      <rect x="48.6" y="7.6" width="7.8" height="7.8" rx=".8" fill="none" stroke="#1e9e55" strokeWidth="1.3" />
      <circle cx="52.5" cy="11.5" r="2.2" fill="#1e9e55" />
    </svg>
  );
}

/** green WhatsApp chat button */
export function WaBtn({ phone, text, small, label }) {
  if (!phone) return null;
  return <a className={'icon-btn round wa' + (small ? ' small' : '')} href={wa(phone, text)} target="_blank" rel="noreferrer" aria-label={label || 'WhatsApp'} title="WhatsApp"><Icon name="chat" size={small ? 16 : 19} /></a>;
}

export function Wordmark({ size = 26 }) {
  return <span className="wordmark" style={{ fontSize: size }} data-notr=""><b>FOOD</b><i>गाँव</i></span>;
}

export function VegMark({ size = 14 }) {
  return <span className="vegmark" style={{ width: size, height: size }} title="Pure veg" aria-label="Pure veg"><i /></span>;
}

export function Sheet({ open, onClose, title, children, wide, full }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    document.body.classList.add('noscroll');
    return () => { window.removeEventListener('keydown', k); document.body.classList.remove('noscroll'); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="sheet-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={'sheet' + (wide ? ' sheet-wide' : '') + (full ? ' sheet-full' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => <div key={t.id} className={'toast toast-' + t.kind}>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

export function Empty({ icon = 'bag', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-ic"><Icon name={icon} size={30} stroke={1.7} /></div>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function BottomNav({ tabs, value, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Main menu">
      {tabs.map((t) => (
        <button key={t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)} aria-current={value === t.id}>
          <span className="nav-ic"><Icon name={t.icon} size={22} />{t.badge > 0 && <em>{t.badge > 99 ? '99+' : t.badge}</em>}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" className={'toggle' + (on ? ' on' : '')} role="switch" aria-checked={!!on} aria-label={label} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

export function Confirm({ open, title, text, okText = 'Yes', danger, onOk, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="muted" style={{ marginTop: 0 }}>{text}</p>
      <div className="row gap">
        <button className="btn ghost grow" onClick={onClose}>Cancel</button>
        <button className={'btn grow ' + (danger ? 'danger' : 'primary')} onClick={() => { onOk(); onClose(); }}>{okText}</button>
      </div>
    </Sheet>
  );
}

export function LangSwitch() {
  const cur = getLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language" data-notr="">
      {LANGS.map((l) => (
        <button key={l.id} className={cur === l.id ? 'on' : ''} aria-pressed={cur === l.id} onClick={() => cur !== l.id && setLang(l.id)}>{l.label}</button>
      ))}
    </div>
  );
}

/* Order status chip */
export const STATUS = {
  placed: { label: 'Waiting for restaurant', short: 'New', tone: 'amber' },
  accepted: { label: 'Order accepted', short: 'Accepted', tone: 'blue' },
  preparing: { label: 'Food is being prepared', short: 'Preparing', tone: 'blue' },
  ready: { label: 'Ready for pickup', short: 'Ready', tone: 'violet' },
  picked: { label: 'On the way', short: 'On the way', tone: 'orange' },
  delivered: { label: 'Delivered', short: 'Delivered', tone: 'green' },
  rejected: { label: 'Rejected by restaurant', short: 'Rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', short: 'Cancelled', tone: 'red' },
};
export function StatusChip({ s }) {
  const x = STATUS[s] || { short: s, tone: 'grey' };
  return <span className={'chip chip-' + x.tone}>{x.short}</span>;
}

export function Img({ src, alt = '', className = '' }) {
  const [ok, setOk] = useState(true);
  return ok && src
    ? <img className={className} src={src} alt={alt} loading="lazy" onError={() => setOk(false)} />
    : <div className={className + ' img-fallback'} aria-hidden="true"><Icon name="leaf" size={26} /></div>;
}

export function Stepper({ qty, onAdd, onSub, small }) {
  if (!qty) return <button className={'add-btn' + (small ? ' small' : '')} onClick={onAdd}>ADD<span>+</span></button>;
  return (
    <div className={'stepper' + (small ? ' small' : '')}>
      <button onClick={onSub} aria-label="Remove one"><Icon name="minus" size={16} stroke={3} /></button>
      <b key={qty} className="pop">{qty}</b>
      <button onClick={onAdd} aria-label="Add one"><Icon name="plus" size={16} stroke={3} /></button>
    </div>
  );
}
