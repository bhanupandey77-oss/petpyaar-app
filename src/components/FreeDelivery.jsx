import React from 'react';

/* Animated "FREE delivery on all orders" strip — scooter rides along a road */
export default function FreeDelivery({ km = 5, compact }) {
  return (
    <div className={'fd-hero' + (compact ? ' compact' : '')} role="note" aria-label="Free delivery on all orders">
      <div className="fd-txt">
        <b>FREE <span>delivery</span></b>
        <small>{`on all orders · within ${km} km`}</small>
      </div>
      <div className="fd-scene" aria-hidden="true">
        <div className="fd-road"><i /><i /><i /><i /><i /><i /></div>
        <svg className="fd-scooter" viewBox="0 0 120 80" width="96" height="64">
          <g className="fd-bounce">
            {/* delivery box */}
            <rect x="12" y="14" width="30" height="24" rx="4" fill="#e8461a" />
            <rect x="12" y="14" width="30" height="7" rx="3" fill="#ff7a45" />
            <text x="27" y="33" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="sans-serif">FG</text>
            {/* rider */}
            <circle cx="66" cy="14" r="8" fill="#ffd34d" stroke="#2b1d12" strokeWidth="2" />
            <path d="M58 14 a8 8 0 0 1 16 0 z" fill="#e8461a" />
            <path d="M62 22 L56 42 L70 42 L74 28 Z" fill="#1e9e55" />
            <path d="M70 30 L86 34" stroke="#2b1d12" strokeWidth="4" strokeLinecap="round" />
            {/* scooter body */}
            <path d="M10 46 Q12 40 22 40 L60 40 L70 46 L92 46 L96 30 L102 30 L100 48 Q98 56 88 56 L24 56 Q10 56 10 46 Z" fill="#ffd34d" stroke="#2b1d12" strokeWidth="2.5" />
            <path d="M96 30 L90 24" stroke="#2b1d12" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="104" cy="40" r="3" fill="#fff8c4" className="fd-light" />
          </g>
          {/* wheels */}
          <g className="fd-wheel" style={{ transformOrigin: '26px 62px' }}><circle cx="26" cy="62" r="10" fill="#2b1d12" /><circle cx="26" cy="62" r="4" fill="#ccc" /><path d="M26 52 V72 M16 62 H36" stroke="#666" strokeWidth="1.5" /></g>
          <g className="fd-wheel" style={{ transformOrigin: '90px 62px' }}><circle cx="90" cy="62" r="10" fill="#2b1d12" /><circle cx="90" cy="62" r="4" fill="#ccc" /><path d="M90 52 V72 M80 62 H100" stroke="#666" strokeWidth="1.5" /></g>
          {/* speed lines */}
          <g className="fd-speed" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M0 30 H8" /><path d="M2 38 H10" /><path d="M0 46 H6" /></g>
        </svg>
      </div>
    </div>
  );
}
