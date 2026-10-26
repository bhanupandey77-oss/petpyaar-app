import React from 'react';
import { Icon, useToast } from '../ui.jsx';
import { compressImage } from '../lib/utils.js';
import { t } from '../i18n/index.js';

/** Two buttons: take a photo with the camera, or choose one from the gallery */
export default function PhotoPick({ onPick, maxSide = 720, maxLen = 180000, facing = 'environment', small = true, className = '' }) {
  const toast = useToast();
  const pick = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { onPick(await compressImage(file, maxSide, maxLen)); } catch (er) { toast(t(er.message || 'Could not read the photo'), 'err'); }
  };
  const cls = 'btn ' + (small ? 'small ' : '') + 'ghost';
  return (
    <div className={'photo-pick ' + className}>
      <label className={cls}><Icon name="camera" size={16} /> Camera<input type="file" accept="image/*" capture={facing} hidden onChange={pick} /></label>
      <label className={cls}><Icon name="image" size={16} /> Gallery<input type="file" accept="image/*" hidden onChange={pick} /></label>
    </div>
  );
}
