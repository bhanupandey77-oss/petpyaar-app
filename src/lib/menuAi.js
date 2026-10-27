// Read a menu-card photo with Gemini (Firebase AI Logic, free Gemini Developer API tier).
// Returns [{ name, price, cat, photoKey, kcal, qty, desc, story }]
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { app } from './fb.js';
import { compressImage } from './utils.js';

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
const CATS = ['sweets', 'lassi', 'chinese', 'fastfood', 'northindian', 'chaat', 'thali', 'southindian', 'icecream'];

export async function readMenuWithAI(file, library) {
  const dataUrl = await compressImage(file, 1800, 1200000);
  const b64 = dataUrl.split(',')[1];
  const keys = library.map((d) => `${d.key} = ${d.name}`).join('\n');
  const prompt = `You are reading a photo of an Indian restaurant MENU CARD (it may be in Hindi, English or both, in columns, with decorative fonts).
Extract EVERY dish with its price exactly as printed. If a dish has several sizes/prices (e.g. Half/Full, Small/Large, 250g/500g), make one entry per size and add the size to the name, e.g. "Paneer Butter Masala (Half)".
Ignore headings, phone numbers, addresses, taxes and notes. Keep the dish name as the customer would read it, in English letters (transliterate Hindi names, e.g. "पनीर बटर मसाला" -> "Paneer Butter Masala").
For each dish also give:
- category: one of ${CATS.join(', ')}
- photoKey: the closest dish from this photo library (use the key on the left), or "" if nothing is similar:
${keys}
- kcal: rough calories for the serving
- serving: short serving size (e.g. "1 plate", "2 pieces", "1 glass")
- desc: one short English description (max 10 words)
- hindiLine: ONE short attractive Hindi line for customers (a hint + emotion, NOT a recipe), e.g. for Jalebi "राष्ट्रीय मिठाई, मीठे रस में डूबी — जो भर दे रिश्तों में मिठास।"
- veg: true/false
Reply ONLY with JSON: {"dishes":[{"name":"","price":0,"category":"","photoKey":"","kcal":0,"serving":"","desc":"","hindiLine":"","veg":true}]}`;
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  let last = null;
  for (const name of MODELS) {
    try {
      const model = getGenerativeModel(ai, { model: name, generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } });
      const r = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: b64 } }]);
      const txt = r.response.text().trim().replace(/^```(json)?/i, '').replace(/```$/, '');
      const json = JSON.parse(txt);
      const list = (json.dishes || json || []).filter((d) => d && d.name);
      return list.map((d) => ({
        name: String(d.name).trim().slice(0, 50),
        price: Math.round(Number(String(d.price).replace(/[^\d.]/g, '')) || 0),
        cat: CATS.includes(d.category) ? d.category : '',
        photoKey: String(d.photoKey || ''),
        kcal: Math.round(Number(d.kcal) || 0),
        qty: String(d.serving || '').slice(0, 30),
        desc: String(d.desc || '').slice(0, 80),
        story: String(d.hindiLine || '').slice(0, 120),
        veg: d.veg !== false,
      }));
    } catch (e) { last = e; console.warn('menu AI', name, e); }
  }
  throw last || new Error('AI failed');
}
