-- =============================================
-- 003: Lịch trình (trời đẹp + trời mưa)
-- Chạy được nhiều lần: tạo bảng nếu chưa có, xoá lịch cũ của chuyến rồi nạp lại.
-- =============================================

CREATE TABLE IF NOT EXISTS itinerary (
  id          BIGSERIAL PRIMARY KEY,
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('nang','mua')),  -- 'nang' = trời đẹp, 'mua' = khi mưa
  day         INT  NOT NULL,              -- 1..4
  day_label   TEXT NOT NULL,              -- 'T7 21/11'
  time_label  TEXT NOT NULL,              -- '10:30–12:00'
  title       TEXT NOT NULL,              -- đi đâu / hoạt động
  detail      TEXT,                       -- làm gì
  kind        TEXT,                       -- 'Trong nhà' | 'Có mái che' | 'Ngoài trời'
  transport   TEXT,                       -- đi lại
  rain_tip    TEXT,                       -- (lịch trời đẹp) nếu mưa thì làm gì
  replaces    TEXT,                       -- (lịch mưa) thay cho hoạt động nào
  note        TEXT,
  order_num   INT  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip ON itinerary(trip_id, plan, day, order_num);
ALTER TABLE itinerary ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE trip UUID;
BEGIN
  SELECT id INTO trip FROM trips WHERE slug = 'singapore-2026';
  IF trip IS NULL THEN RAISE EXCEPTION 'Chưa có chuyến singapore-2026: chạy setup_all.sql trước'; END IF;
  DELETE FROM itinerary WHERE trip_id = trip;

  INSERT INTO itinerary (trip_id, plan, day, day_label, time_label, title, detail, kind, transport, rain_tip, replaces, note, order_num) VALUES
    (trip, 'nang', 1, 'T7 21/11', '09:05', 'Đến Changi T2, nhập cảnh, lấy hành lý', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, 'Nhận xe đẩy ở ống lồng nếu bị gửi ở cửa máy bay', 1),
    (trip, 'nang', 1, 'T7 21/11', '10:30–12:00', 'Jewel Changi · thác Rain Vortex', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, 'Đi chậm, ngồi nghỉ nhiều', 2),
    (trip, 'nang', 1, 'T7 21/11', '12:00–13:00', 'Ăn trưa quán 290 Jalan Besar', NULL, 'Trong nhà', NULL, 'Giữ nguyên, taxi thả tận cửa quán', NULL, NULL, 3),
    (trip, 'nang', 1, 'T7 21/11', '13:00–16:00', 'Về khách sạn gửi đồ, ngủ trưa', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, 'Nhận phòng chính thức 15:00; xin nhận sớm', 4),
    (trip, 'nang', 1, 'T7 21/11', '17:00–19:15', 'Chụp ảnh Merlion', 'Giờ vàng 17:00–18:30, chạng vạng 18:45–19:15', 'Ngoài trời', NULL, 'Mưa nhẹ: mặc áo mưa trong suốt vẫn chụp được. Mưa to: trú ở Esplanade hoặc The Shoppes Marina Bay Sands 30–60 phút, tạnh thì ra chụp. Không tạnh: dời chụp ảnh sang chiều N2.', NULL, 'Mang gậy selfie B.01-01', 5),
    (trip, 'nang', 1, 'T7 21/11', '19:15–20:00', 'Ăn tối Rasapura Masters (Marina Bay Sands)', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, NULL, 6),
    (trip, 'nang', 1, 'T7 21/11', '20:00', 'Show ánh sáng Spectra', NULL, 'Ngoài trời', NULL, 'Có thể bị huỷ khi mưa to hoặc sấm sét: về khách sạn ngủ sớm', NULL, 'Taxi về khách sạn: 2 xe, gọi ngay sau show', 7),
    (trip, 'nang', 2, 'CN 22/11', '08:30–10:30', 'Kampong Glam, Haji Lane, Thánh đường Sultan', NULL, 'Ngoài trời', NULL, 'Vào Thánh đường Sultan (trong nhà) hoặc trú ở Bugis Junction gần đó', NULL, 'Buổi sáng thường ít mưa hơn. Mặc áo che vai, quần qua gối', 8),
    (trip, 'nang', 2, 'CN 22/11', '11:30–13:00', 'Ăn trưa Bak Kut Teh Ng Ah Sio', '208 Rangoon Rd', 'Trong nhà', NULL, 'Giữ nguyên', NULL, NULL, 9),
    (trip, 'nang', 2, 'CN 22/11', '13:30–15:30', 'Nghỉ trưa ở khách sạn', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, NULL, 10),
    (trip, 'nang', 2, 'CN 22/11', '16:30–18:30', 'Cloud Forest + Flower Dome (Gardens by the Bay)', NULL, 'Trong nhà', NULL, 'Giữ nguyên: hai mái vòm kính, hợp nhất cho ngày mưa. Bảo taxi thả ở điểm đón trả khách của hai mái vòm', NULL, 'Cloud Forest vào cuối 20:00', 11),
    (trip, 'nang', 2, 'CN 22/11', '18:45–20:00', 'Ăn tối Supertree Food Hall', NULL, 'Có mái che', NULL, 'Giữ nguyên', NULL, NULL, 12),
    (trip, 'nang', 2, 'CN 22/11', '19:45', 'Supertree Grove · show đèn Garden Rhapsody', NULL, 'Ngoài trời', NULL, 'Ngồi lại ở Supertree Food Hall xem đèn từ xa; sấm sét thì bỏ, về khách sạn', NULL, 'Còn suất 20:45 nếu mưa tạnh muộn', 13),
    (trip, 'nang', 3, 'T2 23/11', '09:15–10:15', 'Cáp treo Mount Faber', NULL, 'Ngoài trời', NULL, 'Cáp treo có thể tạm dừng khi sấm sét, gió mạnh: đảo thứ tự, vào Oceanarium trước, tạnh mới đi cáp treo', NULL, 'Nên mua vé đổi được giờ/ngày', 14),
    (trip, 'nang', 3, 'T2 23/11', '10:30–12:00', 'Singapore Oceanarium', NULL, 'Trong nhà', NULL, 'Giữ nguyên: phương án dự phòng chính của ngày', NULL, 'Bé 3 tuổi miễn phí', 15),
    (trip, 'nang', 3, 'T2 23/11', '12:00–13:00', 'Ăn trưa Malaysian Food Street (Resorts World Sentosa)', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, NULL, 16),
    (trip, 'nang', 3, 'T2 23/11', '13:00–16:00', 'Dạo Sentosa, check-in quả địa cầu Universal, nghỉ', NULL, 'Ngoài trời', NULL, 'Ở trong khu Resorts World Sentosa (phần lớn có mái che), không ra bãi biển', NULL, NULL, 17),
    (trip, 'nang', 3, 'T2 23/11', '17:00–18:45', 'Lẩu Hi Hot Pot (City Square Mall)', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, 'Rời quán trước 18:45 để kịp Wings of Time; mưa thì gọi xe sớm 20 phút', 18),
    (trip, 'nang', 3, 'T2 23/11', '19:40', 'Wings of Time (ghế Premium)', NULL, 'Ngoài trời', NULL, 'Show có thể bị huỷ khi trời xấu: về khách sạn nghỉ', NULL, 'Khi mua vé, xem điều kiện hoàn tiền/đổi suất nếu huỷ vì thời tiết', 19),
    (trip, 'nang', 4, 'T3 24/11', '07:00–08:30', 'Ăn sáng Chinatown Complex Food Centre', 'Trả phòng, gửi hành lý trước khi đi', 'Có mái che', NULL, 'Giữ nguyên', NULL, 'Trả phòng trước 12:00', 20),
    (trip, 'nang', 4, 'T3 24/11', '08:30–10:00', 'Dạo phố Chinatown, mua quà', NULL, 'Có mái che', NULL, 'Đi men theo hành lang mái hiên; mưa to thì vào Chinatown Point', NULL, NULL, 21),
    (trip, 'nang', 4, 'T3 24/11', '10:00–11:00', 'Phật Nha Tự', NULL, 'Trong nhà', NULL, 'Giữ nguyên', NULL, 'Mặc áo che vai, quần qua gối', 22),
    (trip, 'nang', 4, 'T3 24/11', '11:00–12:00', 'Ăn trưa Maxwell · cơm gà Tian Tian', NULL, 'Có mái che', NULL, 'Giữ nguyên', NULL, NULL, 23),
    (trip, 'nang', 4, 'T3 24/11', '13:30', 'Lấy hành lý, xe 13 chỗ ra Changi T2', 'Có mặt ~14:30', 'Trong nhà', NULL, 'Mưa thì đường đông hơn: gọi xe sớm 20 phút', NULL, 'SQ186 cất cánh 17:30', 24),
    (trip, 'mua', 1, 'T7 21/11', '09:05', 'Changi T2', 'Nhập cảnh, lấy hành lý', 'Trong nhà', NULL, NULL, 'Giữ nguyên', NULL, 1),
    (trip, 'mua', 1, 'T7 21/11', '10:30–12:00', 'Jewel Changi', 'Xem thác Rain Vortex, chụp ảnh, nghỉ', 'Trong nhà', 'Đi bộ trong nhà từ nhà ga', NULL, 'Giữ nguyên', NULL, 2),
    (trip, 'mua', 1, 'T7 21/11', '12:00–13:00', 'Khu ẩm thực trong Jewel', 'Ăn trưa, không phải ra ngoài mưa', 'Trong nhà', NULL, NULL, 'Ăn trưa ở Jalan Besar', NULL, 3),
    (trip, 'mua', 1, 'T7 21/11', '13:00–16:00', 'Khách sạn Mercure Tyrwhitt', 'Gửi đồ, ngủ trưa', 'Trong nhà', 'Xe 13 chỗ từ Changi', NULL, 'Giữ nguyên', NULL, 4),
    (trip, 'mua', 1, 'T7 21/11', '16:30–18:00', 'The Shoppes Marina Bay Sands', 'Dạo trong nhà; tùy chọn: đi thuyền sampan trong trung tâm hoặc ArtScience Museum ngay cạnh (xem giờ mở cửa)', 'Trong nhà', 'Taxi thả ở sảnh The Shoppes', NULL, 'Chụp ảnh Merlion', NULL, 5),
    (trip, 'mua', 1, 'T7 21/11', '18:00–19:30', 'Rasapura Masters (tầng hầm The Shoppes)', 'Ăn tối', 'Trong nhà', 'Đi bộ trong nhà', NULL, 'Giữ nguyên', NULL, 6),
    (trip, 'mua', 1, 'T7 21/11', '19:30–20:15', 'Bờ vịnh trước The Shoppes', 'Nếu tạnh: chụp ảnh với view Merlion đối diện, xem Spectra 20:00. Nếu còn sấm sét: bỏ', 'Ngoài trời', 'Đi bộ ra cửa', NULL, 'Chụp ảnh Merlion + Spectra', NULL, 7),
    (trip, 'mua', 1, 'T7 21/11', '20:30', 'Khách sạn', 'Ngủ sớm', 'Trong nhà', '2 xe Grab, gọi sớm 20 phút', NULL, 'Giữ nguyên', NULL, 8),
    (trip, 'mua', 2, 'CN 22/11', '08:30–10:00', 'Thánh đường Sultan + Bugis Junction', 'Tham quan thánh đường (trong nhà), đi dạo trung tâm Bugis Junction có mái che', 'Có mái che', 'Taxi', NULL, 'Kampong Glam, Haji Lane', NULL, 9),
    (trip, 'mua', 2, 'CN 22/11', '10:00–11:15', 'Marina Barrage · Sustainable Singapore Gallery', 'Phòng trưng bày trong nhà, miễn phí, có trong tour gốc', 'Trong nhà', 'Taxi', NULL, 'Thêm mới', NULL, 10),
    (trip, 'mua', 2, 'CN 22/11', '11:30–13:00', 'Bak Kut Teh Ng Ah Sio (208 Rangoon Rd)', 'Ăn trưa', 'Trong nhà', 'Taxi', NULL, 'Giữ nguyên', NULL, 11),
    (trip, 'mua', 2, 'CN 22/11', '13:30–15:30', 'Khách sạn', 'Nghỉ trưa', 'Trong nhà', 'Taxi ngắn', NULL, 'Giữ nguyên', NULL, 12),
    (trip, 'mua', 2, 'CN 22/11', '16:30–18:30', 'Cloud Forest + Flower Dome', 'Hai mái vòm kính, hoàn toàn trong nhà', 'Trong nhà', 'Taxi thả ở điểm đón trả khách của hai mái vòm', NULL, 'Giữ nguyên', NULL, 13),
    (trip, 'mua', 2, 'CN 22/11', '18:30–20:00', 'Supertree Food Hall', 'Ăn tối dưới mái che, xem đèn Supertree từ xa', 'Có mái che', 'Đi bộ ngắn từ mái vòm', NULL, 'Garden Rhapsody ngoài trời', NULL, 14),
    (trip, 'mua', 2, 'CN 22/11', '20:00', 'Khách sạn', 'Nghỉ', 'Trong nhà', '2 xe Grab, gọi sớm 20 phút', NULL, 'Giữ nguyên', NULL, 15),
    (trip, 'mua', 3, 'T2 23/11', '09:00–09:40', 'Resorts World Sentosa', 'Đi thẳng vào Sentosa, bỏ cáp treo buổi sáng', 'Có mái che', 'Taxi thả ở sảnh Resorts World', NULL, 'Cáp treo Mount Faber 09:15', NULL, 16),
    (trip, 'mua', 3, 'T2 23/11', '10:00–12:00', 'Singapore Oceanarium', 'Xem thủy cung, hoàn toàn trong nhà', 'Trong nhà', 'Đi bộ trong khu Resorts World', NULL, 'Giữ nguyên (đưa lên sớm)', NULL, 17),
    (trip, 'mua', 3, 'T2 23/11', '12:00–13:00', 'Malaysian Food Street', 'Ăn trưa', 'Trong nhà', 'Đi bộ trong nhà', NULL, 'Giữ nguyên', NULL, 18),
    (trip, 'mua', 3, 'T2 23/11', '13:00–15:00', 'Khu Resorts World (có mái che)', 'Dạo, chụp ảnh quả địa cầu Universal khi ngớt mưa', 'Có mái che', 'Đi bộ', NULL, 'Dạo Sentosa ngoài trời', NULL, 19),
    (trip, 'mua', 3, 'T2 23/11', '15:00–16:00', 'Cáp treo Mount Faber (nếu tạnh) hoặc khách sạn', 'Tạnh: đi cáp treo ngắm cảnh chiều. Còn mưa: về khách sạn nghỉ', 'Ngoài trời', 'Ga cáp treo trong Sentosa / taxi', NULL, 'Cáp treo buổi sáng', NULL, 20),
    (trip, 'mua', 3, 'T2 23/11', '17:00–18:45', 'Hi Hot Pot (City Square Mall)', 'Ăn lẩu, trong nhà', 'Trong nhà', 'Taxi; trung tâm gần khách sạn', NULL, 'Giữ nguyên', NULL, 21),
    (trip, 'mua', 3, 'T2 23/11', '19:40', 'Wings of Time (Sentosa) hoặc khách sạn', 'Show chạy: đi xem. Show huỷ vì thời tiết: về khách sạn nghỉ, liên hệ hoàn/đổi vé', 'Ngoài trời', 'Taxi, gọi sớm 20 phút', NULL, 'Wings of Time', NULL, 22),
    (trip, 'mua', 4, 'T3 24/11', '07:00–08:30', 'Chinatown Complex Food Centre', 'Ăn sáng (có mái che); trước đó trả phòng, gửi hành lý', 'Có mái che', 'Taxi', NULL, 'Giữ nguyên', NULL, 23),
    (trip, 'mua', 4, 'T3 24/11', '08:30–10:00', 'Chinatown Point', 'Mua quà trong trung tâm thương mại', 'Trong nhà', 'Đi bộ theo hành lang mái hiên', NULL, 'Dạo phố Chinatown', NULL, 24),
    (trip, 'mua', 4, 'T3 24/11', '10:00–11:00', 'Phật Nha Tự', 'Tham quan (trong nhà), mặc áo che vai, quần qua gối', 'Trong nhà', 'Đi bộ theo hành lang mái hiên', NULL, 'Giữ nguyên', NULL, 25),
    (trip, 'mua', 4, 'T3 24/11', '11:00–12:00', 'Maxwell Food Centre', 'Ăn trưa cơm gà Tian Tian (có mái che)', 'Có mái che', 'Đi bộ ngắn', NULL, 'Giữ nguyên', NULL, 26),
    (trip, 'mua', 4, 'T3 24/11', '13:15', 'Khách sạn → Changi T2', 'Lấy hành lý, ra sân bay (có mặt ~14:30); dư giờ thì dạo Jewel', 'Trong nhà', 'Xe 13 chỗ, hẹn sớm 15 phút vì đường mưa đông', NULL, 'Đi lúc 13:30', NULL, 27);
END $$;
