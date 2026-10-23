// Extra photos of each dish (Wikimedia Commons, free licences) — shown in the dish detail view
const B = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
const EXTRA = {
"gajar_halwa": [
"9/96/Delicious_Gajar_Ka_Halwa.jpg/500px-Delicious_Gajar_Ka_Halwa.jpg",
"1/1f/Gajar_Ka_Halwa_a_famous_Indian_Sweet_Dish_01.jpg/500px-Gajar_Ka_Halwa_a_famous_Indian_Sweet_Dish_01.jpg"
],
"kheer": [
"0/0a/Rice_Kheer_or_Rice_Pudding.JPG/500px-Rice_Kheer_or_Rice_Pudding.JPG",
"1/12/Kheer_or_rice_pudding.jpg/500px-Kheer_or_rice_pudding.jpg"
],
"malpua": [
"2/21/Coconut_and_Banana_Malpua.jpg/500px-Coconut_and_Banana_Malpua.jpg",
"3/3a/Malpua_from_Bhadrak_Kali_Puja.jpg/500px-Malpua_from_Bhadrak_Kali_Puja.jpg"
],
"imarti": [
"b/b3/%E0%A6%AE%E0%A7%81%E0%A6%9A%E0%A6%AE%E0%A7%81%E0%A6%9A%E0%A7%87_%E0%A6%B0%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A7%8B_%E0%A6%85%E0%A6%AE%E0%A7%83%E0%A6%A4%E0%A6%BF_-_%E0%A6%95%E0%A6%B2%E0%A6%95%E0%A6%BE%E0%A6%A4%E0%A6%BE.jpg/500px-%E0%A6%AE%E0%A7%81%E0%A6%9A%E0%A6%AE%E0%A7%81%E0%A6%9A%E0%A7%87_%E0%A6%B0%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A7%8B_%E0%A6%85%E0%A6%AE%E0%A7%83%E0%A6%A4%E0%A6%BF_-_%E0%A6%95%E0%A6%B2%E0%A6%95%E0%A6%BE%E0%A6%A4%E0%A6%BE.jpg",
"6/62/An_Imarti%2C_a_sweet_from_West_Bengal%2C_India%2C_made_by_deep-frying_vigna_mungo_flour_%28later_soaked_in_sugar_syrup%29%2C_photographed_by_Yogabrata_Chakraborty_on_June_19%2C_2023.jpg/500px-thumbnail.jpg"
],
"balushahi": [
"1/13/Balushahi_or_Badusha.jpg/500px-Balushahi_or_Badusha.jpg",
"5/52/Balushahi-_Home_made_in_Jalpaiguri-_WB-_01.jpg/500px-Balushahi-_Home_made_in_Jalpaiguri-_WB-_01.jpg"
],
"moong_halwa": [
"e/e5/Moong_Dal_Ka_Halwa_%28Sheera%29.jpg/500px-Moong_Dal_Ka_Halwa_%28Sheera%29.jpg"
],
"choco_shake": [
"a/a8/Chocolate_milkshake.jpg/500px-Chocolate_milkshake.jpg"
],
"straw_shake": [
"4/44/Strawberry_milkshake_%28KETO%2C_LCHF%2C_Low_Carb%2C_Gluten_free%2C_FIT%29_-_52774787519.jpg/500px-Strawberry_milkshake_%28KETO%2C_LCHF%2C_Low_Carb%2C_Gluten_free%2C_FIT%29_-_52774787519.jpg",
"1/14/Milkshake_beverage_strawberry_drink-1021027.jpg/500px-Milkshake_beverage_strawberry_drink-1021027.jpg"
],
"lime_soda": [
"f/f3/Limeade%2C_sangria_%2828951862464%29.jpg/500px-Limeade%2C_sangria_%2828951862464%29.jpg"
],
"thandai": [
"7/75/Thandai_Drink.JPG/500px-Thandai_Drink.JPG",
"a/aa/Thandai_high.jpg/500px-Thandai_high.jpg"
],
"badam_milk": [
"2/2a/Bapatla_Badam_Milk.jpg/500px-Bapatla_Badam_Milk.jpg"
],
"sundae": [
"3/3b/Strawberry_Ice_Cream_Sundae_%2826853326174%29.jpg/500px-Strawberry_Ice_Cream_Sundae_%2826853326174%29.jpg",
"8/83/Strawberry_Sundae_01.jpg/500px-Strawberry_Sundae_01.jpg"
],
"idli": [
"a/a6/Idli_Sambar_Food_by_Ms_Ujwala_Kasambe_DSCN9744_%282%29.jpg/500px-Idli_Sambar_Food_by_Ms_Ujwala_Kasambe_DSCN9744_%282%29.jpg",
"8/8a/Idli_sambar.2.jpg/500px-Idli_sambar.2.jpg"
],
"uttapam": [
"1/17/Uttapam-garnishing.jpg/500px-Uttapam-garnishing.jpg",
"f/ff/Mix_lentils_Uttapam_P_20190410_144153.jpg/500px-Mix_lentils_Uttapam_P_20190410_144153.jpg"
],
"medu_vada": [
"0/06/%E0%B4%89%E0%B4%B4%E0%B5%81%E0%B4%A8%E0%B5%8D%E0%B4%A8%E0%B5%81%E0%B4%B5%E0%B4%9F%E0%B4%95%E0%B5%BE.JPG/500px-%E0%B4%89%E0%B4%B4%E0%B5%81%E0%B4%A8%E0%B5%8D%E0%B4%A8%E0%B5%81%E0%B4%B5%E0%B4%9F%E0%B4%95%E0%B5%BE.JPG",
"c/c9/Aesthetic_Medu_Vadai.jpg/500px-Aesthetic_Medu_Vadai.jpg",
"d/db/Uzhunnu_vada.jpg/500px-Uzhunnu_vada.jpg"
],
"upma": [
"a/a2/Upma_of_Corn.jpg/500px-Upma_of_Corn.jpg",
"9/99/Chhole_Upma_-_Homemade%2C_Jabalpur_-_Madhya_Pradesh_-_IMG001.jpg/500px-Chhole_Upma_-_Homemade%2C_Jabalpur_-_Madhya_Pradesh_-_IMG001.jpg"
],
"poha": [
"b/b4/Poha_and_Chai.jpg/500px-Poha_and_Chai.jpg",
"3/33/Poha_made_from_flattened_rice.JPG/500px-Poha_made_from_flattened_rice.JPG"
],
"plain_dosa": [
"e/eb/Dosa_%28Plain%29.jpg/500px-Dosa_%28Plain%29.jpg",
"0/0d/Plain_Dosa_with_Peanut_Chutney.jpg/500px-Plain_Dosa_with_Peanut_Chutney.jpg"
],
"pasta": [
"4/48/A_plate_of_red_sauce_pasta.jpg/500px-A_plate_of_red_sauce_pasta.jpg",
"c/c3/Red_Sauce_Pasta.jpg/500px-Red_Sauce_Pasta.jpg"
],
"garlic_bread": [
"d/df/Garlic_bread_-_in_pan%2C_cooked.jpg/500px-Garlic_bread_-_in_pan%2C_cooked.jpg",
"e/ee/Garlic_bread_-_on_plate%2C_ready_to_eat.jpg/500px-Garlic_bread_-_on_plate%2C_ready_to_eat.jpg"
],
"maggi": [
"7/7f/Vegetable_Maggi_2.jpg/500px-Vegetable_Maggi_2.jpg",
"0/02/Veg_Maggi_2.jpg/500px-Veg_Maggi_2.jpg"
],
"veg_pizza": [
"d/db/Pizza_with_vegetables.jpg/500px-Pizza_with_vegetables.jpg"
],
"fried_momos": [
"e/ef/Fried_momos_5.jpg/500px-Fried_momos_5.jpg",
"7/7f/Fried_momos_4.jpg/500px-Fried_momos_4.jpg"
],
"schezwan": [
"4/4e/Schezwan_noodles.jpg/500px-Schezwan_noodles.jpg",
"8/8c/Schezwan_Noodles.jpg/500px-Schezwan_Noodles.jpg"
],
"papdi_chaat": [
"3/3f/Papdi_Chaat_Plate.jpg/500px-Papdi_Chaat_Plate.jpg",
"2/25/Papdi_chaat-_basic.jpg/500px-Papdi_chaat-_basic.jpg"
],
"bhel": [
"2/22/Bhel_puri_Snack.jpg/500px-Bhel_puri_Snack.jpg",
"9/97/Bhel_puri_chat%2C_photographed_in_West_Bengal%2C_India%2C_September_24%2C_2024.jpg/500px-Bhel_puri_chat%2C_photographed_in_West_Bengal%2C_India%2C_September_24%2C_2024.jpg"
],
"dhokla": [
"e/e9/Dhokla_5.jpg/500px-Dhokla_5.jpg",
"e/e3/Dhokla_Home_Made%2CDuliajan%2CAssam.jpg/500px-Dhokla_Home_Made%2CDuliajan%2CAssam.jpg"
],
"bread_pakora": [
"0/01/Bread_pakoda.jpg/500px-Bread_pakoda.jpg",
"d/d0/Bread_pakora.jpg/500px-Bread_pakora.jpg"
],
"paneer_pakora": [
"6/68/Dhal%2C_pakora_and_naan.jpg/500px-Dhal%2C_pakora_and_naan.jpg"
],
"kulcha": [
"0/0d/Amritsari_Kulcha_served_with_chhole.jpg/500px-Amritsari_Kulcha_served_with_chhole.jpg",
"9/9e/Amritsari_kulcha_chana.jpg/500px-Amritsari_kulcha_chana.jpg"
],
"rajma": [
"0/0f/Rajma_Chawal_from_India%281%29.jpg/500px-Rajma_Chawal_from_India%281%29.jpg",
"f/f5/Rajma_Chawal_from_India.jpg/500px-Rajma_Chawal_from_India.jpg"
],
"kadhi": [
"2/27/Kadhi_Rice_%28Chawal%29.jpg/500px-Kadhi_Rice_%28Chawal%29.jpg"
],
"malai_kofta": [
"e/ee/Malai_Kofta_Garnished_and_Ready_to_Eat_India.jpg/500px-Malai_Kofta_Garnished_and_Ready_to_Eat_India.jpg"
],
"palak_paneer": [
"8/8d/Palak_Paneer_%28Cottage_cheese_in_spinach_gravy%29.jpg/500px-Palak_Paneer_%28Cottage_cheese_in_spinach_gravy%29.jpg",
"e/e9/Palak_Paneer_%2853569672035%29.jpg/500px-Palak_Paneer_%2853569672035%29.jpg"
],
"matar_paneer": [
"4/44/Matar_Paneer_2.jpg/500px-Matar_Paneer_2.jpg",
"7/7f/Matar_Paneer_3.jpg/500px-Matar_Paneer_3.jpg"
],
"dal_tadka": [
"b/b2/Tadka_Dal.jpg/500px-Tadka_Dal.jpg",
"9/99/Dal_Tadka_Masala.png/500px-Dal_Tadka_Masala.png"
],
"mix_veg": [
"b/bf/Midnight_curry_with_mixed_Goan_spices_and_vegetables_pan-stirred.jpg/500px-Midnight_curry_with_mixed_Goan_spices_and_vegetables_pan-stirred.jpg"
],
"lachha": [
"a/ab/Lachha_Paratha%2C_Stuffed_Shimla_Mirch_Fry.jpg/500px-Lachha_Paratha%2C_Stuffed_Shimla_Mirch_Fry.jpg",
"c/cd/Makki_Ki_Roti_-_Naan_-_Lachha_Paratha_-_Mohali_2016-08-06_8224.JPG/500px-Makki_Ki_Roti_-_Naan_-_Lachha_Paratha_-_Mohali_2016-08-06_8224.JPG"
],
"puri_sabzi": [
"4/4c/Puri_sabji_in_Assam.jpg/500px-Puri_sabji_in_Assam.jpg",
"a/af/Puri_Sabji_of_Shimla.jpg/500px-Puri_Sabji_of_Shimla.jpg"
],
"pulao": [
"c/cf/Veg_Pulao_with_onion_Raitha_02.jpg/500px-Veg_Pulao_with_onion_Raitha_02.jpg",
"f/fd/Veg_pulao_with_raitha.jpg/500px-Veg_pulao_with_raitha.jpg"
],
"curd_rice": [
"5/58/Curd_Rice.jpg/500px-Curd_Rice.jpg"
],
"gulab_jamun": [
"c/c4/Gulab_jamun_%28Gibraltar%2C_November_2020%29.jpg/500px-Gulab_jamun_%28Gibraltar%2C_November_2020%29.jpg",
"6/61/Gulab_Jamun_as_a_Diwali_Sweet.jpg/500px-Gulab_Jamun_as_a_Diwali_Sweet.jpg"
],
"rasmalai": [
"d/df/Ras_Malai.JPG/500px-Ras_Malai.JPG",
"b/be/Rasmalai_with_carrot.jpg/500px-Rasmalai_with_carrot.jpg"
],
"jalebi": [
"d/dd/Hot_Jalebi-MA10.jpg/500px-Hot_Jalebi-MA10.jpg",
"e/e8/Jalebi_2.jpg/500px-Jalebi_2.jpg"
],
"kaju_katli": [
"2/2f/Kaju_katli_dessert_-_top_view.jpg/500px-Kaju_katli_dessert_-_top_view.jpg",
"a/ac/Kaju_katli_sweet.jpg/500px-Kaju_katli_sweet.jpg"
],
"laddu": [
"6/65/Motichoor_Laddu.jpg/500px-Motichoor_Laddu.jpg",
"b/b8/Motichoor_ladoo.JPG/500px-Motichoor_ladoo.JPG"
],
"rasgulla": [
"7/70/Rasgulla_preparation_for_Indian_wedding_09.jpg/500px-Rasgulla_preparation_for_Indian_wedding_09.jpg",
"6/6a/Rasgulla_preparation_for_Indian_wedding_12.jpg/500px-Rasgulla_preparation_for_Indian_wedding_12.jpg"
],
"barfi": [
"d/d9/Barfi.JPG/500px-Barfi.JPG"
],
"kulfi": [
"4/44/Kulfi_3.jpg/500px-Kulfi_3.jpg"
],
"peda": [
"0/05/Indian_Sweet_Dessert_Peda_in_a_glass_plate.jpg/500px-Indian_Sweet_Dessert_Peda_in_a_glass_plate.jpg"
],
"lassi": [
"b/ba/Lassi_with_malai_and_barfi_2.jpg/500px-Lassi_with_malai_and_barfi_2.jpg",
"a/af/Lassi_with_malai_and_barfi.jpg/500px-Lassi_with_malai_and_barfi.jpg"
],
"mango_lassi": [
"7/7b/Tasty_Mango_lassi_picture.JPG/500px-Tasty_Mango_lassi_picture.JPG"
],
"cold_coffee": [
"9/9c/Cold_Coffee_4.jpg/500px-Cold_Coffee_4.jpg"
],
"banana_shake": [
"4/41/Banana_Milkshake.jpg/500px-Banana_Milkshake.jpg"
],
"falooda": [
"3/39/Falooda_of_salem.jpg/500px-Falooda_of_salem.jpg",
"3/39/Falooda_of_Euro_Hut%2C_Dhaka.jpg/500px-Falooda_of_Euro_Hut%2C_Dhaka.jpg"
],
"chowmein": [
"2/28/Nepali_chow_mein.jpg/500px-Nepali_chow_mein.jpg",
"b/bb/Veg_chow_mein.jpg/500px-Veg_chow_mein.jpg"
],
"hakka": [
"8/8f/Hot_and_spicy_hakka_noodles_in_West_Bengal%2C_India%2C_photographed_on_December_5%2C_2023.jpg/500px-Hot_and_spicy_hakka_noodles_in_West_Bengal%2C_India%2C_photographed_on_December_5%2C_2023.jpg"
],
"manchurian": [
"f/f1/Veg_manchurian_Balls.jpg/500px-Veg_manchurian_Balls.jpg"
],
"chilli_paneer": [
"e/e3/Paneer_Chilli%2C_Bengaluru_%282026%29_01.jpg/500px-Paneer_Chilli%2C_Bengaluru_%282026%29_01.jpg",
"0/06/Paneer_Chilli_Semi_Gravy.jpg/500px-Paneer_Chilli_Semi_Gravy.jpg"
],
"spring_roll": [
"1/13/Spring_rolls_in_restaurant_in_Siem_Reap.jpg/500px-Spring_rolls_in_restaurant_in_Siem_Reap.jpg"
],
"momos": [
"9/9a/Steamed_Momos_-_KOLKATA.jpg/500px-Steamed_Momos_-_KOLKATA.jpg"
],
"fried_rice": [
"f/f1/VEG_FRIED_RICE.jpg/500px-VEG_FRIED_RICE.jpg"
],
"chilli_potato": [
"6/61/Honey_chilli_potato.2.jpg/500px-Honey_chilli_potato.2.jpg"
],
"burger": [
"f/fd/Aloo_tikki_recipe_by_Sonia_Goyal.jpg/500px-Aloo_tikki_recipe_by_Sonia_Goyal.jpg"
],
"pizza": [
"4/46/Pizza-napoletana.jpg/500px-Pizza-napoletana.jpg",
"0/08/Pizza_Margherita_%E3%83%94%E3%82%B6%E3%83%BB%E3%83%9E%E3%83%AB%E3%82%B2%E3%83%AA%E3%83%BC%E3%82%BF.jpg/500px-Pizza_Margherita_%E3%83%94%E3%82%B6%E3%83%BB%E3%83%9E%E3%83%AB%E3%82%B2%E3%83%AA%E3%83%BC%E3%82%BF.jpg"
],
"fries": [
"8/83/French_Fries.JPG/500px-French_Fries.JPG"
],
"pav_bhaji": [
"2/21/Pav_bhaji_SWW.jpg/500px-Pav_bhaji_SWW.jpg",
"6/66/Pav_bhaji_2.jpg/500px-Pav_bhaji_2.jpg"
],
"pbm": [
"1/19/Paneer_butter_masala_2.jpg/500px-Paneer_butter_masala_2.jpg"
],
"dal_makhani": [
"f/f8/Dal_Makhani.jpg/500px-Dal_Makhani.jpg",
"3/3e/Dal_Makhani..JPG/500px-Dal_Makhani..JPG"
],
"shahi_paneer": [
"9/92/Shahi_Paneer_with_mint.jpg/500px-Shahi_Paneer_with_mint.jpg"
],
"kadai_paneer": [
"f/fc/Kadai_Paneer_Recipe.JPG/500px-Kadai_Paneer_Recipe.JPG",
"4/48/Kadai_Paneer_%2815913018051%29.jpg/500px-Kadai_Paneer_%2815913018051%29.jpg"
],
"thali": [
"d/d9/Indian_Thali_01.jpg/500px-Indian_Thali_01.jpg",
"a/ab/Indian_Veg_Thali.JPG/500px-Indian_Veg_Thali.JPG"
],
"roti": [
"6/67/Butter-tandoori-roti.jpg/500px-Butter-tandoori-roti.jpg"
],
"jeera_rice": [
"5/5e/Jeera-rice.JPG/500px-Jeera-rice.JPG"
],
"chole_bhature": [
"a/aa/Chole_Bhature_1.jpg/500px-Chole_Bhature_1.jpg",
"9/9c/Chole_Bhature%2C_a_popular_North_Indian_dish.jpg/500px-Chole_Bhature%2C_a_popular_North_Indian_dish.jpg"
],
"paratha": [
"8/85/Aloo_Paratha_%2896238%29.jpg/500px-Aloo_Paratha_%2896238%29.jpg",
"e/eb/%22Amazing_Aloo_Paratha_and_Lovely_Lassi%22.jpg/500px-%22Amazing_Aloo_Paratha_and_Lovely_Lassi%22.jpg"
],
"veg_biryani": [
"5/51/Veg_biryani_03.jpg/500px-Veg_biryani_03.jpg"
],
"samosa": [
"e/ed/Samosa_4.jpg/500px-Samosa_4.jpg",
"e/ec/Samosa_AMU%27s_canteen.jpg/500px-Samosa_AMU%27s_canteen.jpg"
],
"kachori": [
"7/76/Kachori_MA23.jpg/500px-Kachori_MA23.jpg"
],
"pani_puri": [
"6/6c/Pani_puri_2.jpg/500px-Pani_puri_2.jpg",
"5/5c/Crispy_Pani_Puri.jpg/500px-Crispy_Pani_Puri.jpg"
],
"aloo_tikki": [
"3/36/Crispy_Aloo_Tikki_Chat.jpg/500px-Crispy_Aloo_Tikki_Chat.jpg",
"7/7f/Aloo_Tikki_Chaat.JPG/500px-Aloo_Tikki_Chaat.JPG"
],
"dahi_bhalla": [
"9/9c/Dahi_Vada_on_Glass_plate.jpg/500px-Dahi_Vada_on_Glass_plate.jpg"
],
"paneer_tikka": [
"a/a5/Malai_Paneer_Tikka%2C_PK_007.jpg/500px-Malai_Paneer_Tikka%2C_PK_007.jpg",
"4/43/Paneer_Tikka_Kabab.JPG/500px-Paneer_Tikka_Kabab.JPG"
],
"vada_pav": [
"5/5f/Aran_Vada_Pav_Mumbai.jpg/500px-Aran_Vada_Pav_Mumbai.jpg",
"4/46/Vada_Paav.jpg/500px-Vada_Paav.jpg"
],
"masala_dosa": [
"6/6e/Masala_dosa_2.jpg/500px-Masala_dosa_2.jpg",
"8/8c/Masala_Dosa_from_Kerala_3.jpg/500px-Masala_Dosa_from_Kerala_3.jpg"
],
"chai": [
"6/6a/Masala_Chai.jpg/500px-Masala_Chai.jpg",
"2/25/Mix_Masala_Tea.jpg/500px-Mix_Masala_Tea.jpg"
],
"chaas": [
"3/39/Drinking_buttermilk.jpg/500px-Drinking_buttermilk.jpg"
]
};
export const extraPhotos = (key) => (EXTRA[key] || []).map((p) => B + p);
