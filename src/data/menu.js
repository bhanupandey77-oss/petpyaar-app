// Starter data — 100% vegetarian. Calories are rough estimates per serving shown.
import { photo } from './photos.js';

export const CATEGORIES = [
  { id: 'sweets', name: 'Sweets', img: 'gulab_jamun' },
  { id: 'lassi', name: 'Lassi & Shakes', img: 'lassi' },
  { id: 'chinese', name: 'Chinese', img: 'chowmein' },
  { id: 'fastfood', name: 'Fast Food', img: 'burger' },
  { id: 'northindian', name: 'North Indian', img: 'pbm' },
  { id: 'chaat', name: 'Snacks & Chaat', img: 'pani_puri' },
  { id: 'thali', name: 'Thali & Rice', img: 'thali' },
].map((c) => ({ ...c, img: photo(c.img) }));

// Haidergarh, Barabanki (approx.) — each restaurant can set its exact spot from its panel
const HG = { lat: 26.6178, lng: 81.3657 };

export const RESTAURANTS = [
  {
    id: 'raju-lassi', name: 'Raju Lassi', ownerPhone: '9415213754', ownerName: 'Raju',
    tagline: 'Thick lassi, shakes & fresh sweets', cuisines: ['lassi', 'sweets'],
    cover: photo('lassi'), rating: 4.6, prepMins: 10, open: true, demo: false,
    address: 'Main Market, Haidergarh, Barabanki', lat: HG.lat, lng: HG.lng, sort: 1,
  },
  {
    id: 'annapurna', name: 'Annapurna Bhojnalaya', ownerPhone: '', ownerName: '',
    tagline: 'Homestyle North Indian thali & paneer', cuisines: ['northindian', 'thali'],
    cover: photo('thali'), rating: 4.4, prepMins: 25, open: true, demo: true,
    address: 'Lucknow Road, Haidergarh', lat: HG.lat + 0.004, lng: HG.lng - 0.003, sort: 2,
  },
  {
    id: 'dragon-chinese', name: 'Dragon Chinese & Fast Food', ownerPhone: '', ownerName: '',
    tagline: 'Chowmein, momos, burgers & pizza', cuisines: ['chinese', 'fastfood'],
    cover: photo('chowmein'), rating: 4.3, prepMins: 20, open: true, demo: true,
    address: 'Bus Stand, Haidergarh', lat: HG.lat - 0.003, lng: HG.lng + 0.004, sort: 3,
  },
  {
    id: 'mithaas', name: 'Mithaas Sweets & Chaat', ownerPhone: '', ownerName: '',
    tagline: 'Jalebi, samosa, chaat & mithai', cuisines: ['sweets', 'chaat'],
    cover: photo('jalebi'), rating: 4.5, prepMins: 10, open: true, demo: true,
    address: 'Tehsil Chauraha, Haidergarh', lat: HG.lat + 0.002, lng: HG.lng + 0.005, sort: 4,
  },
];

const I = (restaurantId, key, name, cat, price, kcal, qty, desc, extra = {}) => ({
  id: `${restaurantId}--${key}`, restaurantId, name, cat, price, kcal, qty, desc, img: photo(extra.img || key),
  veg: true, available: true, bestseller: !!extra.best, sort: extra.sort || 0,
});

export const ITEMS = [
  // Raju Lassi
  I('raju-lassi', 'lassi', 'Sweet Lassi', 'lassi', 40, 260, '1 glass (300 ml)', 'Thick curd lassi topped with malai', { best: true }),
  I('raju-lassi', 'mango_lassi', 'Mango Lassi', 'lassi', 60, 320, '1 glass (300 ml)', 'Lassi blended with ripe mango pulp'),
  I('raju-lassi', 'kesar_lassi', 'Kesar Badam Lassi', 'lassi', 70, 350, '1 glass (300 ml)', 'Saffron, almonds and malai', { img: 'lassi' }),
  I('raju-lassi', 'banana_shake', 'Banana Shake', 'lassi', 60, 290, '1 glass (300 ml)', 'Fresh banana and chilled milk'),
  I('raju-lassi', 'cold_coffee', 'Cold Coffee', 'lassi', 70, 280, '1 glass (300 ml)', 'Creamy chilled coffee with ice cream'),
  I('raju-lassi', 'falooda', 'Royal Falooda', 'lassi', 90, 450, '1 glass', 'Rose syrup, sabja, vermicelli & kulfi', { best: true }),
  I('raju-lassi', 'rabri', 'Rabri', 'sweets', 60, 300, '100 g', 'Slow-cooked thickened milk with dry fruits'),
  I('raju-lassi', 'kulfi', 'Malai Kulfi', 'sweets', 30, 180, '1 piece', 'Traditional pista malai kulfi'),
  I('raju-lassi', 'gulab_jamun', 'Gulab Jamun', 'sweets', 30, 300, '2 pieces', 'Soft khoya jamun in sugar syrup'),
  I('raju-lassi', 'rasmalai', 'Rasmalai', 'sweets', 50, 280, '2 pieces', 'Chenna discs in saffron milk'),
  I('raju-lassi', 'chai', 'Kulhad Masala Chai', 'lassi', 15, 90, '1 kulhad', 'Ginger-cardamom tea'),

  // Annapurna Bhojnalaya
  I('annapurna', 'thali', 'Special Veg Thali', 'thali', 120, 850, '1 thali', 'Paneer, dal, seasonal sabzi, rice, 3 roti, salad, sweet', { best: true }),
  I('annapurna', 'pbm', 'Paneer Butter Masala', 'northindian', 150, 480, 'Half plate', 'Paneer in rich tomato-butter gravy', { best: true }),
  I('annapurna', 'dal_makhani', 'Dal Makhani', 'northindian', 110, 380, 'Half plate', 'Black dal slow-cooked with butter & cream'),
  I('annapurna', 'shahi_paneer', 'Shahi Paneer', 'northindian', 150, 500, 'Half plate', 'Paneer in creamy cashew gravy'),
  I('annapurna', 'kadai_paneer', 'Kadai Paneer', 'northindian', 150, 450, 'Half plate', 'Paneer, capsicum & onion with kadai masala'),
  I('annapurna', 'paneer_tikka', 'Paneer Tikka', 'northindian', 160, 400, '8 pieces', 'Tandoor-grilled marinated paneer'),
  I('annapurna', 'naan', 'Butter Naan', 'northindian', 30, 290, '1 piece', 'Soft tandoori naan with butter'),
  I('annapurna', 'roti', 'Tandoori Roti', 'northindian', 10, 120, '1 piece', 'Whole-wheat tandoori roti'),
  I('annapurna', 'jeera_rice', 'Jeera Rice', 'thali', 80, 330, '1 plate', 'Basmati rice tempered with cumin'),
  I('annapurna', 'veg_biryani', 'Veg Biryani', 'thali', 110, 520, '1 plate', 'Fragrant rice with vegetables & raita'),
  I('annapurna', 'chole_bhature', 'Chole Bhature', 'northindian', 80, 650, '2 bhature', 'Spicy chole with fluffy bhature'),
  I('annapurna', 'paratha', 'Aloo Paratha', 'northindian', 60, 560, '2 pieces + curd', 'Stuffed potato paratha with butter'),
  I('annapurna', 'masala_dosa', 'Masala Dosa', 'thali', 70, 380, '1 dosa', 'Crispy dosa, sambar & chutney'),

  // Dragon Chinese & Fast Food
  I('dragon-chinese', 'chowmein', 'Veg Chowmein', 'chinese', 70, 450, 'Full plate', 'Street-style noodles with vegetables', { best: true }),
  I('dragon-chinese', 'hakka', 'Hakka Noodles', 'chinese', 90, 480, 'Full plate', 'Wok-tossed hakka noodles'),
  I('dragon-chinese', 'manchurian', 'Veg Manchurian (Gravy)', 'chinese', 90, 420, '8 pieces', 'Veg balls in spicy soy-garlic gravy'),
  I('dragon-chinese', 'chilli_paneer', 'Chilli Paneer', 'chinese', 130, 480, 'Full plate', 'Paneer with capsicum in chilli sauce', { best: true }),
  I('dragon-chinese', 'spring_roll', 'Veg Spring Roll', 'chinese', 70, 320, '4 pieces', 'Crispy rolls with veg filling'),
  I('dragon-chinese', 'momos', 'Veg Steamed Momos', 'chinese', 50, 300, '8 pieces', 'Steamed momos with red chutney', { best: true }),
  I('dragon-chinese', 'fried_rice', 'Veg Fried Rice', 'chinese', 80, 450, 'Full plate', 'Wok-fried rice with vegetables'),
  I('dragon-chinese', 'chilli_potato', 'Honey Chilli Potato', 'chinese', 90, 500, 'Full plate', 'Crispy potato in honey-chilli glaze'),
  I('dragon-chinese', 'burger', 'Aloo Tikki Burger', 'fastfood', 50, 400, '1 burger', 'Crispy aloo tikki, veggies & mayo'),
  I('dragon-chinese', 'pizza', 'Margherita Pizza', 'fastfood', 149, 800, '8 inch', 'Cheese & tomato pizza'),
  I('dragon-chinese', 'fries', 'French Fries', 'fastfood', 60, 380, 'Medium', 'Salted crispy fries'),
  I('dragon-chinese', 'sandwich', 'Cheese Grilled Sandwich', 'fastfood', 60, 350, '1 sandwich', 'Grilled with cheese & veggies'),
  I('dragon-chinese', 'vada_pav', 'Vada Pav', 'fastfood', 25, 290, '1 piece', 'Spicy batata vada in pav with chutney'),
  I('dragon-chinese', 'pav_bhaji', 'Pav Bhaji', 'fastfood', 70, 550, '2 pav', 'Buttery bhaji with toasted pav'),

  // Mithaas Sweets & Chaat
  I('mithaas', 'jalebi', 'Hot Jalebi', 'sweets', 30, 400, '100 g', 'Fresh crispy jalebi', { best: true }),
  I('mithaas', 'kaju_katli', 'Kaju Katli', 'sweets', 110, 450, '100 g', 'Cashew barfi with silver vark'),
  I('mithaas', 'laddu', 'Motichoor Laddu', 'sweets', 60, 480, '4 pieces', 'Pure ghee motichoor laddu'),
  I('mithaas', 'rasgulla', 'Rasgulla', 'sweets', 30, 250, '2 pieces', 'Spongy chenna balls in syrup'),
  I('mithaas', 'barfi', 'Milk Barfi', 'sweets', 70, 400, '100 g', 'Khoya barfi'),
  I('mithaas', 'peda', 'Kesar Peda', 'sweets', 60, 360, '4 pieces', 'Saffron khoya peda'),
  I('mithaas', 'gulab_jamun', 'Gulab Jamun', 'sweets', 30, 300, '2 pieces', 'Warm gulab jamun'),
  I('mithaas', 'samosa', 'Samosa', 'chaat', 20, 520, '2 pieces', 'Aloo samosa with sweet chutney', { best: true }),
  I('mithaas', 'kachori', 'Khasta Kachori', 'chaat', 30, 380, '2 pieces', 'Dal kachori with aloo sabzi'),
  I('mithaas', 'pani_puri', 'Pani Puri', 'chaat', 30, 220, '6 pieces', 'Tangy pani, aloo & chana'),
  I('mithaas', 'aloo_tikki', 'Aloo Tikki Chaat', 'chaat', 40, 350, '2 tikki', 'Tikki with curd, chutneys & sev'),
  I('mithaas', 'dahi_bhalla', 'Dahi Bhalla', 'chaat', 50, 320, '3 pieces', 'Soft bhalla in sweet curd'),
];

export const BANNERS = [
  { id: 'b1', title: 'Pure veg. Pure pyaar.', sub: '100% vegetarian kitchens of Haidergarh', img: photo('ban_thali'), sort: 1 },
  { id: 'b2', title: 'FREE delivery', sub: 'No delivery charge on any order', img: photo('chowmein'), sort: 2 },
  { id: 'b3', title: 'Mithai by the box', sub: 'Fresh sweets for every occasion', img: photo('ban_sweets'), sort: 3 },
];

export const DEFAULT_CONFIG = {
  appName: 'PetPyaar',
  commissionPct: 4.99,
  customerDeliveryFee: 0,
  restaurantDeliveryCharge: 20,
  minOrder: 0,
  codEnabled: true,
  upiEnabled: true,
  upiId: '',
  upiName: 'PetPyaar',
  supportPhone: '9415213754',
  serviceArea: 'Haidergarh, Barabanki',
  showCalories: true,
};

export const STAFF = [
  { phone: '+919415213754', name: 'Admin', admin: true, restaurant: 'raju-lassi' },
  { phone: '+919198427160', name: 'Rohit', rider: true },
];
