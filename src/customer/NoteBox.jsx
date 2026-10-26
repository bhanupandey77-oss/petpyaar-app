import React, { useEffect, useState } from 'react';
import { Icon } from '../ui.jsx';

// Quick Hindi requests for the kitchen — tap to add, and the empty box "types" ideas by itself
export const NOTE_CHIPS = [
  'भैया तेल हल्का रखना', 'भैया मिर्च कम डालना', 'थोड़ा तीखा बनाना', 'प्याज़-लहसुन मत डालना',
  'चटनी ज़्यादा देना', 'पैकिंग अच्छे से करना', 'जल्दी भेज देना', 'चम्मच मत भेजना', 'घी कम डालना', 'मीठा कम रखना',
];

export default function NoteBox({ value, onChange }) {
  const [ph, setPh] = useState('');
  useEffect(() => {
    if (value) return undefined;
    let i = 0; let c = 0; let back = false; let t;
    const tick = () => {
      const w = NOTE_CHIPS[i % NOTE_CHIPS.length];
      if (!back) { c++; setPh(w.slice(0, c)); if (c >= w.length) { back = true; t = setTimeout(tick, 1400); return; } }
      else { c--; setPh(w.slice(0, c)); if (c <= 0) { back = false; i++; } }
      t = setTimeout(tick, back ? 30 : 75);
    };
    t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, [value]);
  const toggle = (x) => {
    const parts = value ? value.split(', ').filter(Boolean) : [];
    const has = parts.includes(x);
    const next = has ? parts.filter((p) => p !== x) : [...parts, x];
    onChange(next.join(', ').slice(0, 200));
  };
  return (
    <div className="note-box" data-notr="" lang="hi">
      <label className="nb-label"><Icon name="edit" size={15} /> रसोई के लिए आपका सुझाव</label>
      <textarea className="input note" rows={2} value={value} onChange={(e) => onChange(e.target.value.slice(0, 200))} placeholder={`जैसे: ${ph}|`} />
      <div className="nb-chips">
        {NOTE_CHIPS.map((x) => {
          const on = (value || '').split(', ').includes(x);
          return <button type="button" key={x} className={'nb-chip' + (on ? ' on' : '')} onClick={() => toggle(x)}>{on ? '✓ ' : '+ '}{x}</button>;
        })}
      </div>
    </div>
  );
}
