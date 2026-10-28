import { useEffect } from 'react';
import { bulk, getList, patch } from './fb.js';
import { PARAG_OLD_IDS } from '../data/menu.js';

/* One-time install of a restaurant's real menu (from its menu card).
   Runs when the admin or that restaurant's owner opens the app; marked on restaurants/{id}.menuPack.
   Replaces the old starter dishes and earlier AI-imported copies, so nothing is duplicated. */
const PACKS = { parag: { v: 'parag-v1', load: () => import('../data/paragMenu.js') } };

export function useMenuPack(rests, canFor) {
  useEffect(() => {
    if (!rests) return;
    Object.entries(PACKS).forEach(async ([rid, pack]) => {
      const r = rests.find((x) => x.id === rid);
      if (!r || r.menuPack === pack.v || !canFor(rid)) return;
      const key = `pp_pack_${pack.v}`;
      if (window[key]) return; window[key] = true;
      try {
        const { ITEMS } = await pack.load();
        const cur = await getList('items', [['restaurantId', '==', rid]]);
        const keep = new Set(ITEMS.map((i) => i.id));
        const old = cur.filter((i) => !keep.has(i.id) && (PARAG_OLD_IDS.includes(i.id) || i.aiAdded)).map((i) => ['del', 'items', i.id]);
        const have = new Set(cur.map((i) => i.id));
        const add = ITEMS.filter((i) => !have.has(i.id)).map((i) => ['set', 'items', i.id, i]);
        await bulk([...old, ...add]);
        await patch('restaurants', rid, { menuPack: pack.v, priceInclGst: r.priceInclGst ?? true });
        console.info('menu pack', pack.v, 'removed', old.length, 'added', add.length);
      } catch (e) { console.warn('menu pack', e); window[key] = false; }
    });
  }, [rests]); // eslint-disable-line
}
