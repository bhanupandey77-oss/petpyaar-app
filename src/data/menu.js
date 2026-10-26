// Starter data — 100% vegetarian. Calories are rough estimates per serving shown.
import { photo } from './photos.js';
import { extraPhotos } from './gallery.js';
import { storyFor } from './stories.js';

export const CATEGORIES = [
  { id: 'sweets', name: 'Sweets', img: 'gulab_jamun' },
  { id: 'lassi', name: 'Lassi & Shakes', img: 'lassi' },
  { id: 'chinese', name: 'Chinese', img: 'chowmein' },
  { id: 'fastfood', name: 'Fast Food', img: 'burger' },
  { id: 'northindian', name: 'North Indian', img: 'pbm' },
  { id: 'chaat', name: 'Snacks & Chaat', img: 'pani_puri' },
  { id: 'thali', name: 'Thali & Rice', img: 'thali' },
  { id: 'southindian', name: 'South Indian', img: 'idli' },
  { id: 'icecream', name: 'Ice Cream & Desserts', img: 'sundae' },
].map((c) => ({ ...c, img: photo(c.img) }));

// Haidergarh, Barabanki (approx.) — each restaurant can set its exact spot from its panel
const HG = { lat: 26.6178, lng: 81.3657 };

const REAL = { fssai: '', gstin: '', radiusKm: 5, minOrder: 50, riderRate: 20, selfDelivery: true };
export const RESTAURANTS = [
  {
    id: 'parag', name: 'Parag Milk Parlour & Restaurant', ownerPhone: '9120799904', ownerName: 'Parag',
    tagline: 'Rabri, lassi, shakes, paneer & full meals', cuisines: ['northindian', 'lassi', 'sweets'],
    cover: photo('pbm'), rating: 4.7, prepMins: 20, open: true, demo: false, ...REAL,
    riders: [{ phone: '+911234567890', name: 'Ajay Kumar' }],
    address: 'Main Road, Haidergarh, Barabanki', lat: HG.lat + 0.001, lng: HG.lng + 0.001, sort: 0,
  },
  {
    id: 'raju-lassi', name: 'Raju Lassi', ownerPhone: '9198427160', ownerName: 'Raju', ...REAL,
    riders: [{ phone: '+911234567891', name: 'Rakesh' }],
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
  {
    id: 'sagar-south', name: 'Sagar South Indian', ownerPhone: '', ownerName: '',
    tagline: 'Idli, dosa, uttapam & hot breakfast', cuisines: ['southindian'],
    cover: photo('idli'), rating: 4.4, prepMins: 15, open: true, demo: true,
    address: 'Station Road, Haidergarh', lat: HG.lat - 0.004, lng: HG.lng - 0.002, sort: 5,
  },
  {
    id: 'cafe-chill', name: 'Cafe Chill', ownerPhone: '', ownerName: '',
    tagline: 'Shakes, sundaes, pasta & pizza', cuisines: ['icecream', 'fastfood'],
    cover: photo('sundae'), rating: 4.5, prepMins: 15, open: true, demo: true,
    address: 'Near Inter College, Haidergarh', lat: HG.lat + 0.005, lng: HG.lng + 0.002, sort: 6,
  },
];

const I = (restaurantId, key, name, cat, price, kcal, qty, desc, extra = {}) => ({
  id: `${restaurantId}--${key}`, restaurantId, name, cat, price, kcal, qty, desc, img: photo(extra.img || key), story: storyFor(key, extra.img),
  gallery: [photo(extra.img || key), ...extraPhotos(extra.img || key)].filter(Boolean),
  veg: true, available: true, bestseller: !!extra.best, sort: extra.sort || 0,
});

export const ITEMS = [
  // Parag Milk Parlour & Restaurant
  I('parag', 'rabri', 'Kesar Rabri', 'sweets', 70, 320, '100 g', 'Slow-cooked thick milk with kesar and dry fruits', { best: true, sort: 1 }),
  I('parag', 'jalebi', 'Jalebi with Rabri', 'sweets', 60, 420, '4 pieces + rabri', 'Hot crisp jalebi served with chilled rabri', { best: true, sort: 2 }),
  I('parag', 'badam_milk', 'Kesar Badam Milk', 'lassi', 60, 280, '1 glass (300 ml)', 'Hot or chilled almond-saffron milk', { sort: 3 }),
  I('parag', 'lassi', 'Malai Lassi', 'lassi', 50, 280, '1 glass (300 ml)', 'Thick sweet lassi with a layer of malai', { best: true, sort: 4 }),
  I('parag', 'mango_lassi', 'Mango Lassi', 'lassi', 70, 320, '1 glass (300 ml)', 'Ripe mango blended with curd', { sort: 5 }),
  I('parag', 'choco_shake', 'Chocolate Shake', 'lassi', 80, 380, '1 glass (300 ml)', 'Thick chocolate milkshake', { sort: 6 }),
  I('parag', 'straw_shake', 'Strawberry Shake', 'lassi', 80, 330, '1 glass (300 ml)', 'Chilled strawberry milkshake', { sort: 7 }),
  I('parag', 'cold_coffee', 'Cold Coffee', 'lassi', 80, 300, '1 glass (300 ml)', 'Creamy coffee with ice cream', { sort: 8 }),
  I('parag', 'thandai', 'Kesar Thandai', 'lassi', 70, 300, '1 glass', 'Chilled milk with saffron and dry fruits', { sort: 9 }),
  I('parag', 'kulfi', 'Malai Kulfi', 'icecream', 40, 190, '1 piece', 'Matka malai kulfi', { sort: 10 }),
  I('parag', 'rasmalai', 'Rasmalai', 'sweets', 60, 280, '2 pieces', 'Soft chenna in saffron milk', { sort: 11 }),
  I('parag', 'gulab_jamun', 'Gulab Jamun', 'sweets', 40, 300, '2 pieces', 'Warm khoya jamun in syrup', { sort: 12 }),
  I('parag', 'rasgulla', 'Rasgulla', 'sweets', 40, 240, '2 pieces', 'Spongy chenna balls in syrup', { sort: 13 }),
  I('parag', 'barfi', 'Khoya Barfi', 'sweets', 120, 1000, '250 g', 'Pure khoya barfi', { sort: 14 }),
  I('parag', 'peda', 'Doodh Peda', 'sweets', 120, 950, '250 g', 'Soft milk peda', { sort: 15 }),
  I('parag', 'pbm', 'Paneer Butter Masala', 'northindian', 180, 520, '1 bowl (serves 2)', 'Soft paneer in buttery tomato gravy', { best: true, sort: 16 }),
  I('parag', 'shahi_paneer', 'Shahi Paneer', 'northindian', 190, 540, '1 bowl (serves 2)', 'Paneer in rich cashew-cream gravy', { sort: 17 }),
  I('parag', 'kadai_paneer', 'Kadai Paneer', 'northindian', 190, 480, '1 bowl (serves 2)', 'Paneer with capsicum in kadai masala', { sort: 18 }),
  I('parag', 'paneer_tikka', 'Paneer Tikka', 'northindian', 200, 420, '8 pieces', 'Tandoor-roasted spiced paneer', { sort: 19 }),
  I('parag', 'malai_kofta', 'Malai Kofta', 'northindian', 190, 560, '1 bowl (serves 2)', 'Soft koftas in creamy gravy', { sort: 20 }),
  I('parag', 'dal_makhani', 'Dal Makhani', 'northindian', 150, 450, '1 bowl (serves 2)', 'Black dal with butter and cream', { sort: 21 }),
  I('parag', 'naan', 'Butter Naan', 'northindian', 40, 260, '1 piece', 'Tandoori naan with butter', { sort: 22 }),
  I('parag', 'roti', 'Tandoori Roti', 'northindian', 15, 120, '1 piece', 'Whole wheat tandoori roti', { sort: 23 }),
  I('parag', 'lachha', 'Lachha Paratha', 'northindian', 40, 280, '1 piece', 'Flaky layered paratha', { sort: 24 }),
  I('parag', 'jeera_rice', 'Jeera Rice', 'thali', 110, 380, '1 plate', 'Basmati rice with ghee and cumin', { sort: 25 }),
  I('parag', 'veg_biryani', 'Veg Biryani', 'thali', 150, 520, '1 plate', 'Dum biryani with raita', { sort: 26 }),
  I('parag', 'thali', 'Parag Special Thali', 'thali', 160, 850, '1 thali', 'Paneer, dal, sabzi, 3 roti, rice, salad & sweet', { best: true, sort: 27 }),
  I('parag', 'chole_bhature', 'Chole Bhature', 'northindian', 90, 650, '2 bhature + chole', 'Fluffy bhature with spicy chole', { sort: 28 }),
  I('parag', 'masala_dosa', 'Masala Dosa', 'southindian', 100, 420, '1 dosa', 'Crisp dosa with potato masala, sambar & chutney', { sort: 29 }),
  I('parag', 'chowmein', 'Veg Chowmein', 'chinese', 90, 480, '1 plate', 'Street-style veg noodles', { sort: 30 }),
  I('parag', 'paneer_pakora', 'Paneer Pakora', 'chaat', 100, 420, '6 pieces', 'Paneer in crisp besan coating', { sort: 31 }),
  I('parag', 'pav_bhaji', 'Pav Bhaji', 'fastfood', 90, 550, '2 pav + bhaji', 'Buttery bhaji with toasted pav', { sort: 32 }),
  I('parag', 'sandwich', 'Grilled Veg Sandwich', 'fastfood', 60, 320, '1 sandwich', 'Butter-grilled veg sandwich', { sort: 33 }),

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
  I('annapurna', 'masala_dosa', 'Masala Dosa', 'southindian', 70, 380, '1 dosa', 'Crispy dosa, sambar & chutney'),

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

  // --- more dishes ---
  I('raju-lassi', 'chaas', 'Masala Chaas', 'lassi', 20, 70, '1 glass (300 ml)', 'Spiced buttermilk with roasted jeera'),
  I('raju-lassi', 'thandai', 'Kesar Thandai', 'lassi', 60, 300, '1 glass', 'Chilled milk with dry fruits, saunf & saffron'),
  I('raju-lassi', 'badam_milk', 'Badam Milk', 'lassi', 50, 260, '1 glass', 'Warm or chilled almond milk'),

  I('mithaas', 'gajar_halwa', 'Gajar ka Halwa', 'sweets', 60, 330, '100 g', 'Slow-cooked carrot halwa with khoya & nuts', { best: true }),
  I('mithaas', 'kheer', 'Seviyan Kheer', 'sweets', 50, 280, '1 bowl', 'Vermicelli cooked in sweet milk with raisins'),
  I('mithaas', 'malpua', 'Malpua with Rabri', 'sweets', 50, 420, '2 pieces', 'Soft fried malpua soaked in syrup'),
  I('mithaas', 'imarti', 'Imarti', 'sweets', 40, 380, '100 g', 'Urad dal imarti in sugar syrup'),
  I('mithaas', 'balushahi', 'Balushahi', 'sweets', 40, 380, '2 pieces', 'Flaky glazed balushahi'),
  I('mithaas', 'moong_halwa', 'Moong Dal Halwa', 'sweets', 80, 450, '100 g', 'Rich ghee moong dal halwa'),
  I('mithaas', 'papdi_chaat', 'Papdi Chaat', 'chaat', 40, 300, '1 plate', 'Crispy papdi, curd, chutneys & sev', { best: true }),
  I('mithaas', 'bhel', 'Bhel Puri', 'chaat', 40, 280, '1 plate', 'Puffed rice, onion, tomato & tangy chutney'),
  I('mithaas', 'dhokla', 'Khaman Dhokla', 'chaat', 40, 220, '4 pieces', 'Soft steamed besan dhokla with tadka'),
  I('mithaas', 'bread_pakora', 'Bread Pakora', 'chaat', 30, 420, '2 pieces', 'Aloo-stuffed bread pakora with chutney'),
  I('mithaas', 'paneer_pakora', 'Paneer Pakora', 'chaat', 70, 380, '6 pieces', 'Crispy besan-coated paneer'),

  I('dragon-chinese', 'fried_momos', 'Veg Fried Momos', 'chinese', 70, 420, '8 pieces', 'Golden fried momos with spicy chutney'),
  I('dragon-chinese', 'manchow', 'Veg Manchow Soup', 'chinese', 70, 150, '1 bowl', 'Hot & spicy soup with crispy noodles'),
  I('dragon-chinese', 'chilli_mushroom', 'Chilli Mushroom', 'chinese', 120, 320, 'Full plate', 'Mushroom tossed in chilli-garlic sauce'),
  I('dragon-chinese', 'schezwan', 'Schezwan Noodles', 'chinese', 100, 520, 'Full plate', 'Fiery schezwan sauce noodles'),

  I('annapurna', 'rajma', 'Rajma Chawal', 'thali', 90, 550, '1 plate', 'Homestyle rajma with steamed rice', { best: true }),
  I('annapurna', 'kadhi', 'Kadhi Chawal', 'thali', 80, 480, '1 plate', 'Pakodi kadhi with steamed rice'),
  I('annapurna', 'malai_kofta', 'Malai Kofta', 'northindian', 160, 520, 'Half plate', 'Paneer-potato koftas in creamy gravy'),
  I('annapurna', 'palak_paneer', 'Palak Paneer', 'northindian', 150, 380, 'Half plate', 'Paneer cubes in smooth spinach gravy'),
  I('annapurna', 'matar_paneer', 'Matar Paneer', 'northindian', 140, 420, 'Half plate', 'Green peas & paneer in tomato gravy'),
  I('annapurna', 'dal_tadka', 'Dal Tadka', 'northindian', 90, 280, 'Half plate', 'Yellow dal with ghee-jeera tadka'),
  I('annapurna', 'mix_veg', 'Mix Veg', 'northindian', 110, 250, 'Half plate', 'Seasonal vegetables in light masala'),
  I('annapurna', 'lachha', 'Lachha Paratha', 'northindian', 35, 300, '1 piece', 'Layered crispy tandoori paratha'),
  I('annapurna', 'puri_sabzi', 'Puri Sabzi', 'thali', 60, 550, '4 puri + sabzi', 'Fluffy puris with aloo sabzi'),
  I('annapurna', 'pulao', 'Veg Pulao', 'thali', 90, 420, '1 plate', 'Mildly spiced rice with vegetables'),
  I('annapurna', 'kulcha', 'Amritsari Kulcha', 'northindian', 90, 620, '2 kulcha + chole', 'Stuffed tandoori kulcha with chole'),

  I('sagar-south', 'idli', 'Idli Sambar', 'southindian', 50, 300, '3 idli', 'Soft idli with sambar & coconut chutney', { best: true }),
  I('sagar-south', 'plain_dosa', 'Plain Dosa', 'southindian', 50, 250, '1 dosa', 'Crispy dosa with sambar & chutney'),
  I('sagar-south', 'masala_dosa', 'Masala Dosa', 'southindian', 70, 380, '1 dosa', 'Dosa stuffed with spiced potato', { best: true }),
  I('sagar-south', 'uttapam', 'Onion Tomato Uttapam', 'southindian', 70, 330, '1 uttapam', 'Thick dosa topped with onion & tomato'),
  I('sagar-south', 'medu_vada', 'Medu Vada', 'southindian', 50, 320, '2 pieces', 'Crispy urad dal vada with sambar'),
  I('sagar-south', 'upma', 'Rava Upma', 'southindian', 40, 250, '1 plate', 'Semolina upma with veggies'),
  I('sagar-south', 'poha', 'Indori Poha', 'southindian', 30, 270, '1 plate', 'Poha with peanuts, sev & lemon'),
  I('sagar-south', 'curd_rice', 'Curd Rice', 'southindian', 60, 330, '1 bowl', 'Cooling curd rice with tempering'),

  I('cafe-chill', 'choco_shake', 'Chocolate Shake', 'lassi', 90, 450, '1 glass (350 ml)', 'Thick chocolate shake with cream', { best: true }),
  I('cafe-chill', 'straw_shake', 'Strawberry Shake', 'lassi', 80, 380, '1 glass (350 ml)', 'Strawberry shake topped with cream'),
  I('cafe-chill', 'lime_soda', 'Fresh Lime Soda', 'lassi', 40, 90, '1 glass', 'Sweet or salted, with fresh lime'),
  I('cafe-chill', 'icecream', 'Ice Cream (2 scoops)', 'icecream', 60, 270, '2 scoops', 'Vanilla, chocolate or butterscotch'),
  I('cafe-chill', 'sundae', 'Strawberry Sundae', 'icecream', 120, 520, '1 sundae', 'Ice cream, strawberries, wafer & sauce', { best: true }),
  I('cafe-chill', 'pasta', 'Red Sauce Pasta', 'fastfood', 130, 520, '1 plate', 'Penne in tangy tomato sauce with herbs'),
  I('cafe-chill', 'garlic_bread', 'Cheese Garlic Bread', 'fastfood', 90, 380, '4 pieces', 'Toasted garlic bread with cheese'),
  I('cafe-chill', 'maggi', 'Vegetable Maggi', 'fastfood', 50, 350, '1 plate', 'Masala maggi loaded with veggies'),
  I('cafe-chill', 'veg_pizza', 'Farm Veg Pizza', 'fastfood', 179, 850, '8 inch', 'Capsicum, onion, olives, corn & cheese'),
];

export const BANNERS = [
  { id: 'b1', title: 'Your town, your taste', sub: 'Best restaurants of Haidergarh on FoodGaon', img: photo('ban_thali'), sort: 1 },
  { id: 'b2', title: 'FREE delivery', sub: 'No delivery charge on any order', img: photo('chowmein'), sort: 2 },
  { id: 'b3', title: 'Mithai by the box', sub: 'Fresh sweets for every occasion', img: photo('ban_sweets'), sort: 3 },
];

export const OFFERS = [
  { id: 'welcome', code: 'GAON20', title: '20% off on your order', sub: 'On all restaurants', type: 'percent', value: 20, minOrder: 149, maxOff: 50, restaurantId: '', fundedBy: 'admin', active: true, color: '#e8461a', until: '', sort: 1 },
  { id: 'sweet50', code: 'MITHAI50', title: 'Flat ₹50 off on sweets', sub: 'Mithaas Sweets & Chaat', type: 'flat', value: 50, minOrder: 299, maxOff: 0, restaurantId: 'mithaas', fundedBy: 'restaurant', active: true, color: '#d4307a', until: '', sort: 2 },
  { id: 'parag10', code: 'PARAG10', title: '10% off at Parag', sub: 'Rabri, paneer & more', type: 'percent', value: 10, minOrder: 199, maxOff: 40, restaurantId: 'parag', fundedBy: 'restaurant', active: true, color: '#1e9e55', until: '', sort: 4 },
  { id: 'lassi10', code: 'LASSI10', title: '10% off at Raju Lassi', sub: 'Thick lassi, cool deal', type: 'percent', value: 10, minOrder: 99, maxOff: 30, restaurantId: 'raju-lassi', fundedBy: 'restaurant', active: true, color: '#7a4fe0', until: '', sort: 3 },
];

export const DEFAULT_CONFIG = {
  appName: 'FoodGaon',
  firmName: 'TechGaon AI Services',
  firmAddress: 'Haidergarh, Barabanki, Uttar Pradesh',
  gstin: '',
  supportEmail: 'contact@techgaon.in',
  otpMode: 'mock',
  gstPct: 5,
  commissionPct: 4.9,
  commissionGstPct: 18,
  customerDeliveryFee: 0,
  restaurantDeliveryCharge: 0,
  minOrder: 50,
  radiusKm: 5,
  codEnabled: true,
  upiEnabled: true,
  upiId: '',
  upiName: 'FoodGaon',
  supportPhone: '9415213754',
  serviceArea: 'Haidergarh, Barabanki',
  showCalories: true,
};

export const STAFF = [
  { phone: '+919415213754', name: 'TechGaon Admin', admin: true, restaurant: '', rider: false, riderOf: '' },
  { phone: '+919120799904', name: 'Parag', admin: false, restaurant: 'parag', rider: false, riderOf: '' },
  { phone: '+919198427160', name: 'Raju', admin: false, restaurant: 'raju-lassi', rider: false, riderOf: '' },
  { phone: '+911234567890', name: 'Ajay Kumar', admin: false, restaurant: '', rider: true, riderOf: 'parag' },
  { phone: '+911234567891', name: 'Rakesh', admin: false, restaurant: '', rider: true, riderOf: 'raju-lassi' },
];
