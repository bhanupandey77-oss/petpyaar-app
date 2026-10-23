import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinHtml = (kind) => `<div class="mpin mpin-${kind}"><span>${
  kind === 'rest' ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l2-5h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8"/></svg>'
  : kind === 'home' ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>'
  : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 15h6l3-6h-4M14 6h3l1.5 9M5.5 15 9 9h4"/></svg>'
}</span></div>`;
const icon = (kind) => L.divIcon({ className: 'mpin-wrap', html: pinHtml(kind), iconSize: [40, 48], iconAnchor: [20, 46] });

/**
 * points: [{ id, kind: 'rest'|'home'|'rider', lat, lng }]
 * draggable: id of a point the user can drag (onDrag gets {lat,lng})
 */
export default function MapView({ points = [], height = 220, draggable, onDrag, line = true, className = '' }) {
  const el = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const poly = useRef(null);
  const fitted = useRef('');

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([26.6178, 81.3657], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap © CARTO',
    }).addTo(map.current);
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);
    setTimeout(() => map.current?.invalidateSize(), 250);
    return () => { map.current.remove(); map.current = null; markers.current = {}; };
  }, []);

  useEffect(() => {
    const m = map.current; if (!m) return;
    const valid = points.filter((p) => p && p.lat && p.lng);
    const seen = new Set();
    valid.forEach((p) => {
      seen.add(p.id);
      let mk = markers.current[p.id];
      if (!mk) {
        mk = L.marker([p.lat, p.lng], { icon: icon(p.kind), draggable: draggable === p.id }).addTo(m);
        if (draggable === p.id) mk.on('dragend', () => { const ll = mk.getLatLng(); onDrag?.({ lat: ll.lat, lng: ll.lng }); });
        markers.current[p.id] = mk;
      } else {
        const cur = mk.getLatLng();
        if (cur.lat !== p.lat || cur.lng !== p.lng) animateTo(mk, p);
      }
    });
    Object.keys(markers.current).forEach((id) => { if (!seen.has(id)) { markers.current[id].remove(); delete markers.current[id]; } });
    if (poly.current) { poly.current.remove(); poly.current = null; }
    if (line && valid.length > 1) {
      poly.current = L.polyline(valid.map((p) => [p.lat, p.lng]), { color: '#e8461a', weight: 4, opacity: 0.7, dashArray: '8 10' }).addTo(m);
    }
    const key = valid.map((p) => p.id).join(',');
    if (key && fitted.current !== key) {
      fitted.current = key;
      if (valid.length === 1) m.setView([valid[0].lat, valid[0].lng], 16);
      else m.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 16 });
    }
  }, [points, draggable, line]); // eslint-disable-line

  return <div ref={el} className={'mapview ' + className} style={{ height }} />;
}

function animateTo(mk, p) {
  const from = mk.getLatLng(); const t0 = performance.now(); const dur = 900;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur); const e = k * (2 - k);
    mk.setLatLng([from.lat + (p.lat - from.lat) * e, from.lng + (p.lng - from.lng) * e]);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
