-- =============================================
-- 004: Lịch trình thêm chỉ đường, đã đi, tiền SGD, Google Maps
-- Chạy SAU 003. Chạy được nhiều lần, KHÔNG xoá dấu "đã đi" và số tiền đã nhập.
-- =============================================

ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS directions TEXT;          -- chỉ dẫn tự đi (MRT, cửa ra, đi bộ)
ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS map_query  TEXT;          -- từ khoá tìm trên Google Maps
ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS done       BOOLEAN NOT NULL DEFAULT FALSE;  -- đã đi chưa
ALTER TABLE itinerary ADD COLUMN IF NOT EXISTS spent_sgd  NUMERIC(10,2); -- tiền đã tiêu (SGD)

DO $$
DECLARE trip UUID;
BEGIN
  SELECT id INTO trip FROM trips WHERE slug = 'singapore-2026';

  UPDATE itinerary SET map_query = 'Changi Airport Terminal 2', directions = 'Theo biển Arrival → Immigration → Baggage Claim. Xe đẩy nhận lại ở ống lồng nếu bị gửi ở cửa máy bay.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 1;
  UPDATE itinerary SET map_query = 'Jewel Changi Airport', directions = 'Từ sảnh đến T2 đi theo biển "Jewel", đi bộ trong nhà khoảng 5–10 phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 2;
  UPDATE itinerary SET map_query = '290 Jalan Besar Singapore', directions = 'Taxi/xe 13 chỗ từ Changi khoảng 25 phút. Gần khách sạn; tự đi: MRT Jalan Besar (DT22) hoặc Farrer Park (NE8) rồi đi bộ.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 3;
  UPDATE itinerary SET map_query = 'Mercure Singapore Tyrwhitt', directions = 'Taxi/Grab: đọc "Mercure Tyrwhitt, 165 Tyrwhitt Road". Tự đi: MRT Bendemeer (DT23) hoặc Farrer Park (NE8), đi bộ khoảng 7–10 phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 4;
  UPDATE itinerary SET map_query = 'Merlion Park Singapore', directions = 'Taxi thả ở One Fullerton. Tự đi: MRT Raffles Place (EW14/NS26) cửa H, đi bộ khoảng 5–7 phút theo biển Merlion Park.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 5;
  UPDATE itinerary SET map_query = 'Rasapura Masters Marina Bay Sands', directions = 'Từ Merlion đi bộ qua cầu Jubilee → Esplanade → cầu Helix khoảng 20 phút, hoặc taxi khoảng 10 phút. Tầng B2 The Shoppes.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 6;
  UPDATE itinerary SET map_query = 'Event Plaza Marina Bay Sands', directions = 'Bờ vịnh ngay trước The Shoppes, đi bộ 3–5 phút từ Rasapura.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 7;
  UPDATE itinerary SET map_query = 'Masjid Sultan Singapore', directions = 'Taxi thả ở Masjid Sultan (Muscat Street). Tự đi: MRT Bugis (EW12/DT14), đi bộ khoảng 7 phút; Haji Lane ngay cạnh thánh đường.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 8;
  UPDATE itinerary SET map_query = 'Ng Ah Sio Bak Kut Teh 208 Rangoon Road', directions = 'Gần khách sạn, taxi khoảng 5 phút. Tự đi: MRT Farrer Park (NE8), đi bộ khoảng 5–8 phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 9;
  UPDATE itinerary SET map_query = 'Mercure Singapore Tyrwhitt', directions = 'Taxi khoảng 5–10 phút từ Rangoon Road.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 10;
  UPDATE itinerary SET map_query = 'Cloud Forest Gardens by the Bay', directions = 'Taxi: báo "Gardens by the Bay, Flower Dome drop-off". Tự đi: MRT Bayfront (CE1/DT16) cửa B, đi qua đường hầm và cầu Dragonfly, khoảng 10–15 phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 11;
  UPDATE itinerary SET map_query = 'Supertree Food Hall Gardens by the Bay', directions = 'Đi bộ khoảng 5 phút từ hai mái vòm về phía Supertree Grove.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 12;
  UPDATE itinerary SET map_query = 'Supertree Grove Gardens by the Bay', directions = 'Ngay cạnh Supertree Food Hall. Show Garden Rhapsody lúc 19:45 và 20:45.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 13;
  UPDATE itinerary SET map_query = 'Singapore Cable Car HarbourFront Station', directions = 'Tự đi: MRT HarbourFront (NE1/CC29) → HarbourFront Tower 2, đi thang máy lên ga cáp treo. Hoặc taxi lên Faber Peak (ga Mount Faber).' WHERE trip_id = trip AND plan = 'nang' AND order_num = 14;
  UPDATE itinerary SET map_query = 'Singapore Oceanarium Sentosa', directions = 'Trong Resorts World Sentosa. Tự đi: MRT HarbourFront (NE1/CC29) → VivoCity tầng 3 → Sentosa Express → ga Resorts World, theo biển Oceanarium.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 15;
  UPDATE itinerary SET map_query = 'Malaysian Food Street Resorts World Sentosa', directions = 'Trong Resorts World, gần cổng Universal Studios, đi bộ vài phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 16;
  UPDATE itinerary SET map_query = 'Universal Studios Singapore Globe', directions = 'Quả địa cầu trước cổng Universal Studios, đi bộ khoảng 3 phút từ Malaysian Food Street.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 17;
  UPDATE itinerary SET map_query = 'Hi Hot Pot City Square Mall Singapore', directions = 'Taxi từ Sentosa khoảng 20–25 phút. Tự đi: MRT Farrer Park (NE8), có lối đi thẳng vào City Square Mall.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 18;
  UPDATE itinerary SET map_query = 'Wings of Time Sentosa', directions = 'Ở bãi Siloso. Taxi báo "Beach Station, Sentosa". Tự đi: MRT HarbourFront → VivoCity tầng 3 → Sentosa Express → ga Beach, đi bộ khoảng 3 phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 19;
  UPDATE itinerary SET map_query = 'Chinatown Complex Food Centre', directions = 'Taxi khoảng 15 phút. Tự đi: MRT Chinatown (NE4/DT19) cửa A, đi bộ khoảng 5 phút.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 20;
  UPDATE itinerary SET map_query = 'Pagoda Street Chinatown Singapore', directions = 'Ngay cạnh MRT Chinatown (NE4/DT19) cửa A: phố Pagoda, Trengganu, Smith.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 21;
  UPDATE itinerary SET map_query = 'Buddha Tooth Relic Temple', directions = 'Trên đường South Bridge Road, đi bộ khoảng 5 phút từ phố Pagoda (MRT Chinatown cửa A).' WHERE trip_id = trip AND plan = 'nang' AND order_num = 22;
  UPDATE itinerary SET map_query = 'Maxwell Food Centre', directions = 'Đối diện Phật Nha Tự, đi bộ khoảng 2 phút. Cạnh MRT Maxwell (TE18).' WHERE trip_id = trip AND plan = 'nang' AND order_num = 23;
  UPDATE itinerary SET map_query = 'Changi Airport Terminal 2', directions = 'Xe 13 chỗ đón ở khách sạn, khoảng 25–30 phút. Không nên đi MRT vì nhiều hành lý.' WHERE trip_id = trip AND plan = 'nang' AND order_num = 24;
  UPDATE itinerary SET map_query = 'Changi Airport Terminal 2', directions = 'Theo biển Arrival → Immigration → Baggage Claim. Xe đẩy nhận lại ở ống lồng nếu bị gửi ở cửa máy bay.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 1;
  UPDATE itinerary SET map_query = 'Jewel Changi Airport', directions = 'Từ sảnh đến T2 đi theo biển "Jewel", đi bộ trong nhà khoảng 5–10 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 2;
  UPDATE itinerary SET map_query = 'Jewel Changi Airport', directions = 'Các quầy ăn ở tầng hầm B1–B2 của Jewel, xem bảng chỉ dẫn.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 3;
  UPDATE itinerary SET map_query = 'Mercure Singapore Tyrwhitt', directions = 'Xe 13 chỗ từ Changi khoảng 25 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 4;
  UPDATE itinerary SET map_query = 'The Shoppes at Marina Bay Sands', directions = 'Taxi báo "The Shoppes, Marina Bay Sands". Tự đi: MRT Bayfront (CE1/DT16) có lối đi thẳng vào trung tâm, không phải ra ngoài trời.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 5;
  UPDATE itinerary SET map_query = 'Rasapura Masters Marina Bay Sands', directions = 'Tầng B2 The Shoppes. Tự đi: MRT Bayfront (CE1/DT16) có lối đi thẳng vào The Shoppes, không phải ra ngoài trời.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 6;
  UPDATE itinerary SET map_query = 'Event Plaza Marina Bay Sands', directions = 'Bờ vịnh ngay trước The Shoppes, đi bộ 3–5 phút từ Rasapura.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 7;
  UPDATE itinerary SET map_query = 'Mercure Singapore Tyrwhitt', directions = 'Grab/taxi khoảng 15 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 8;
  UPDATE itinerary SET map_query = 'Bugis Junction Singapore', directions = 'Tự đi: MRT Bugis (EW12/DT14) có lối thẳng vào Bugis Junction; Masjid Sultan đi bộ khoảng 7 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 9;
  UPDATE itinerary SET map_query = 'Marina Barrage Singapore', directions = 'Nên đi taxi khoảng 15–20 phút; đi MRT phải đi bộ khá xa ngoài trời.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 10;
  UPDATE itinerary SET map_query = 'Ng Ah Sio Bak Kut Teh 208 Rangoon Road', directions = 'Gần khách sạn, taxi khoảng 5 phút. Tự đi: MRT Farrer Park (NE8), đi bộ khoảng 5–8 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 11;
  UPDATE itinerary SET map_query = 'Mercure Singapore Tyrwhitt', directions = 'Taxi khoảng 5–10 phút từ Rangoon Road.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 12;
  UPDATE itinerary SET map_query = 'Cloud Forest Gardens by the Bay', directions = 'Taxi: báo "Gardens by the Bay, Flower Dome drop-off". Tự đi: MRT Bayfront (CE1/DT16) cửa B, đi qua đường hầm và cầu Dragonfly, khoảng 10–15 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 13;
  UPDATE itinerary SET map_query = 'Supertree Food Hall Gardens by the Bay', directions = 'Đi bộ khoảng 5 phút từ hai mái vòm về phía Supertree Grove.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 14;
  UPDATE itinerary SET map_query = 'Mercure Singapore Tyrwhitt', directions = 'Grab/taxi khoảng 15 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 15;
  UPDATE itinerary SET map_query = 'Resorts World Sentosa', directions = 'Taxi báo "Resorts World Sentosa" khoảng 25 phút. Tự đi: MRT HarbourFront → VivoCity tầng 3 → Sentosa Express → ga Resorts World (có mái che).' WHERE trip_id = trip AND plan = 'mua' AND order_num = 16;
  UPDATE itinerary SET map_query = 'Singapore Oceanarium Sentosa', directions = 'Trong Resorts World Sentosa. Tự đi: MRT HarbourFront (NE1/CC29) → VivoCity tầng 3 → Sentosa Express → ga Resorts World, theo biển Oceanarium.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 17;
  UPDATE itinerary SET map_query = 'Malaysian Food Street Resorts World Sentosa', directions = 'Trong Resorts World, gần cổng Universal Studios, đi bộ vài phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 18;
  UPDATE itinerary SET map_query = 'Universal Studios Singapore Globe', directions = 'Quả địa cầu trước cổng Universal Studios, đi bộ khoảng 3 phút từ Malaysian Food Street.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 19;
  UPDATE itinerary SET map_query = 'Singapore Cable Car Sentosa Station Imbiah', directions = 'Ga cáp treo phía Sentosa ở khu Imbiah: từ Resorts World đi Sentosa Express đến ga Imbiah.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 20;
  UPDATE itinerary SET map_query = 'Hi Hot Pot City Square Mall Singapore', directions = 'Taxi từ Sentosa khoảng 20–25 phút. Tự đi: MRT Farrer Park (NE8), có lối đi thẳng vào City Square Mall.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 21;
  UPDATE itinerary SET map_query = 'Wings of Time Sentosa', directions = 'Ở bãi Siloso. Taxi báo "Beach Station, Sentosa". Tự đi: MRT HarbourFront → VivoCity tầng 3 → Sentosa Express → ga Beach, đi bộ khoảng 3 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 22;
  UPDATE itinerary SET map_query = 'Chinatown Complex Food Centre', directions = 'Taxi khoảng 15 phút. Tự đi: MRT Chinatown (NE4/DT19) cửa A, đi bộ khoảng 5 phút.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 23;
  UPDATE itinerary SET map_query = 'Chinatown Point Singapore', directions = 'Ngay trên MRT Chinatown (NE4/DT19) cửa E.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 24;
  UPDATE itinerary SET map_query = 'Buddha Tooth Relic Temple', directions = 'Trên đường South Bridge Road, đi bộ khoảng 5 phút từ phố Pagoda (MRT Chinatown cửa A).' WHERE trip_id = trip AND plan = 'mua' AND order_num = 25;
  UPDATE itinerary SET map_query = 'Maxwell Food Centre', directions = 'Đối diện Phật Nha Tự, đi bộ khoảng 2 phút. Cạnh MRT Maxwell (TE18).' WHERE trip_id = trip AND plan = 'mua' AND order_num = 26;
  UPDATE itinerary SET map_query = 'Changi Airport Terminal 2', directions = 'Xe 13 chỗ đón ở khách sạn, khoảng 25–30 phút. Không nên đi MRT vì nhiều hành lý.' WHERE trip_id = trip AND plan = 'mua' AND order_num = 27;
END $$;
