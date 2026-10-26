// Turn any on-screen element (bill, weekly statement, report) into an A4 PDF.
// Rendering via html2canvas keeps Hindi (Devanagari) text exactly as shown on screen.
import { isNative } from './native.js';

export async function elementToPdf(el, fileName = 'FoodGaon.pdf', title = 'FoodGaon') {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pw = pdf.internal.pageSize.getWidth(); const ph = pdf.internal.pageSize.getHeight();
  const m = 8; const w = pw - m * 2;
  const pxPerMm = canvas.width / w; const pageH = Math.floor((ph - m * 2) * pxPerMm);
  for (let y = 0, page = 0; y < canvas.height; y += pageH, page++) {
    const slice = document.createElement('canvas');
    slice.width = canvas.width; slice.height = Math.min(pageH, canvas.height - y);
    slice.getContext('2d').drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (page) pdf.addPage();
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', m, m, w, slice.height / pxPerMm);
  }
  pdf.setProperties({ title });
  if (!isNative) { pdf.save(fileName); return true; }
  const base64 = pdf.output('datauristring').split(',')[1];
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const r = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
  await Share.share({ title, text: title, url: r.uri, dialogTitle: 'Save or share PDF' });
  return true;
}
