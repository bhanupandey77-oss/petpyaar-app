import React, { useState } from 'react';
import { Icon, Empty } from '../ui.jsx';
import { useFavs, useItems, useRestaurants } from '../lib/data.js';
import { useApp } from '../App.jsx';
import { MenuItem } from './RestaurantPage.jsx';
import DishView from '../components/DishView.jsx';

/* All dishes the customer has liked (❤️), grouped by restaurant */
export default function FavsPage({ nav }) {
  const { config } = useApp();
  const favs = useFavs();
  const items = useItems();
  const rests = useRestaurants() || [];
  const [view, setView] = useState(null);
  const list = favs.map((id) => (items || []).find((i) => i.id === id)).filter(Boolean);
  const groups = [...new Set(list.map((i) => i.restaurantId))].map((rid) => ({ r: rests.find((x) => x.id === rid), items: list.filter((i) => i.restaurantId === rid) }));
  return (
    <div className="page">
      <div className="page-head"><button className="icon-btn" onClick={nav.back} aria-label="Back"><Icon name="back" size={22} /></button><h2>My favourites</h2><span className="pill">{list.length}</span></div>
      <div className="pad-x">
        {!list.length && <Empty icon="heart" title="No favourites yet" text="Tap the ❤️ on any dish. It will be saved here and on the Home page." />}
        {groups.map((g) => (
          <div key={g.r?.id || 'x'} className="card fav-group">
            <button className="row gap fav-rest" onClick={() => g.r && nav.openRest(g.r.id)}>
              <b className="grow" data-notr="">{g.r?.name || ''}</b>
              <small className="muted">Open menu</small><Icon name="right" size={16} />
            </button>
            {g.items.map((it) => <MenuItem key={it.id} it={it} rest={g.r} showKcal={config.showCalories} onView={() => setView(it)} />)}
          </div>
        ))}
      </div>
      {view && <DishView it={view} rest={rests.find((r) => r.id === view.restaurantId)} showKcal={config.showCalories} onClose={() => setView(null)} />}
    </div>
  );
}
