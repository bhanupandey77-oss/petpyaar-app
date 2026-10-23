import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import '@fontsource/mukta/devanagari-400.css';
import '@fontsource/mukta/devanagari-600.css';
import '@fontsource/mukta/devanagari-700.css';
import '@fontsource/baloo-2/devanagari-700.css';
import '@fontsource/baloo-2/devanagari-800.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import './styles.css';
import App from './App.jsx';
import { initNative, isNative } from './lib/native.js';
import { startTranslator } from './i18n/index.js';

startTranslator();
createRoot(document.getElementById('root')).render(<App />);
initNative();
if (!isNative && 'serviceWorker' in navigator && location.protocol === 'https:' && location.hostname !== 'localhost') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
