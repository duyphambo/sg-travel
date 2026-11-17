-- =============================================
-- Travel Expense Tracker — Initial Schema
-- =============================================

-- Bảng chuyến đi
CREATE TABLE trips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,          -- 'singapore-2026'
  name        TEXT NOT NULL,                 -- 'Singapore 21-24/11/2026'
  start_date  DATE,
  end_date    DATE,
  members     INT DEFAULT 8,
  budget_vnd  BIGINT DEFAULT 160000000,
  rate        INT DEFAULT 21000,             -- 1 SGD = VND
  cash_sgd    INT DEFAULT 3000,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng chi phí
CREATE TABLE costs (
  id          TEXT NOT NULL,                 -- giữ id cũ: c01, c02...
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  cat         TEXT NOT NULL,                 -- 'Cố định','Vé tham quan','Ăn uống','Đi lại','Phát sinh'
  label       TEXT NOT NULL,
  planned     BIGINT DEFAULT 0,
  actual      BIGINT DEFAULT 0,
  status      TEXT DEFAULT 'chua',           -- 'chua','dat','tra'
  note        TEXT DEFAULT '',
  order_num   INT DEFAULT 99,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, trip_id)
);

-- Bảng hóa đơn scan
CREATE TABLE receipts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  cost_id     TEXT,
  image_url   TEXT,
  raw_text    TEXT,
  parsed_json JSONB,
  confirmed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index thường dùng
CREATE INDEX idx_costs_trip    ON costs(trip_id);
CREATE INDEX idx_costs_cat     ON costs(trip_id, cat);
CREATE INDEX idx_receipts_trip ON receipts(trip_id);

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER costs_updated_at
  BEFORE UPDATE ON costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Khoá bảng: bật RLS và KHÔNG tạo policy nào cho anon/authenticated.
-- Web chỉ đọc/ghi qua API phía server bằng service role key (bỏ qua RLS),
-- nên dù ai lấy được anon key cũng không đọc/sửa được dữ liệu.
ALTER TABLE trips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
-- =============================================
-- Seed data: Singapore 21-24/11/2026
-- Migrate từ Firestore ArtifactData
-- =============================================

INSERT INTO trips (slug, name, start_date, end_date, members, budget_vnd, rate, cash_sgd)
VALUES ('singapore-2026', 'Singapore 21–24/11/2026', '2026-11-21', '2026-11-24', 8, 160000000, 21000, 3000);

-- Lưu trip_id vào biến để dùng bên dưới
DO $$
DECLARE trip UUID;
BEGIN
  SELECT id INTO trip FROM trips WHERE slug = 'singapore-2026';

  -- CỐ ĐỊNH
  INSERT INTO costs VALUES
    ('c01', trip, 'Cố định', 'Vé máy bay SQ187/SQ186 + bảo hiểm', 42995000, 42995000, 'tra', 'Trip.com · 5 NL + 3 TE · 25 kg ký gửi', 1),
    ('c02', trip, 'Cố định', 'Khách sạn Mercure Singapore Tyrwhitt, 3 phòng × 3 đêm', 27490532, 27490532, 'tra', 'Trip.com · 1 phòng ban công + 2 phòng Classic · không hoàn tiền', 2),
    ('c03', trip, 'Cố định', 'eSIM 4 ngày × 5', 600000, 0, 'chua', '', 3),
    ('c04', trip, 'Cố định', 'Xe đưa đón Tân Sơn Nhất 2 chiều', 1200000, 0, 'chua', '2 xe Xanh SM · ga quốc tế T2', 4);

  -- VÉ THAM QUAN
  INSERT INTO costs VALUES
    ('c11', trip, 'Vé tham quan', 'Cloud Forest + Flower Dome', 6846000, 0, 'chua', 'Ngày 2 · 16:30 · đã gồm Jurassic World', 11),
    ('c12', trip, 'Vé tham quan', 'Cáp treo Mount Faber (Sky Pass 2 chặng)', 5250000, 0, 'chua', 'Ngày 3 · 09:15', 12),
    ('c13', trip, 'Vé tham quan', 'Singapore Oceanarium', 6006000, 0, 'chua', 'Ngày 3 · bé 3 tuổi miễn phí', 13),
    ('c14', trip, 'Vé tham quan', 'Wings of Time ghế Premium', 3969000, 0, 'chua', 'Ngày 3 · suất 19:40', 14);

  -- ĂN UỐNG
  INSERT INTO costs VALUES
    ('c20', trip, 'Ăn uống', 'N1 sáng · Jewel Changi', 1260000, 0, 'chua', '', 20),
    ('c21', trip, 'Ăn uống', 'N1 trưa · quán ăn 290 Jalan Besar', 1428000, 0, 'chua', '', 21),
    ('c22', trip, 'Ăn uống', 'N1 tối · Rasapura Masters', 2310000, 0, 'chua', '', 22),
    ('c23', trip, 'Ăn uống', 'N2 sáng · quán ăn 290 Jalan Besar', 861000, 0, 'chua', '', 23),
    ('c24', trip, 'Ăn uống', 'N2 trưa · Bak Kut Teh Ng Ah Sio', 2310000, 0, 'chua', '208 Rangoon Road', 24),
    ('c25', trip, 'Ăn uống', 'N2 tối · Supertree Food Hall', 2520000, 0, 'chua', '', 25),
    ('c26', trip, 'Ăn uống', 'N3 sáng · quán gần khách sạn', 861000, 0, 'chua', '', 26),
    ('c27', trip, 'Ăn uống', 'N3 trưa · Malaysian Food Street', 1680000, 0, 'chua', '', 27),
    ('c28', trip, 'Ăn uống', 'N3 tối · lẩu Hi Hot Pot', 7140000, 0, 'chua', 'City Square Mall · đặt bàn 17:00', 28),
    ('c29', trip, 'Ăn uống', 'N4 sáng · Chinatown Complex Food Centre', 861000, 0, 'chua', '', 29),
    ('c30', trip, 'Ăn uống', 'N4 trưa · Maxwell, cơm gà Tian Tian', 1428000, 0, 'chua', '', 30),
    ('c31', trip, 'Ăn uống', 'Nước, cà phê, ăn vặt · 4 ngày', 3360000, 0, 'chua', '840.000đ mỗi ngày', 31);

  -- ĐI LẠI
  INSERT INTO costs VALUES
    ('c40', trip, 'Đi lại', 'Xe 13 chỗ đón và tiễn sân bay', 2940000, 0, 'chua', 'S$75 đón · S$65 tiễn', 40),
    ('c42', trip, 'Đi lại', 'Taxi ngày 2', 2772000, 0, 'chua', '5 chặng', 42),
    ('c43', trip, 'Đi lại', 'Taxi ngày 3', 5040000, 0, 'chua', '5 chặng', 43),
    ('c44', trip, 'Đi lại', 'Taxi ngày 4', 1260000, 0, 'chua', 'Chinatown 2 chiều', 44),
    ('c45', trip, 'Đi lại', 'Dự phòng đi lại', 1260000, 0, 'chua', 'Mưa, đổi lịch', 45),
    ('c47', trip, 'Đi lại', 'Taxi từ MBS về khách sạn sau Spectra', 756000, 0, 'chua', '2 xe, ~20 phút, gọi ngay sau show', 47),
    ('c48', trip, 'Đi lại', 'Taxi từ khách sạn ra Merlion Park', 756000, 0, 'chua', '2 xe, ~15 phút', 48);

  -- PHÁT SINH (đã mua)
  INSERT INTO costs VALUES
    ('c51', trip, 'Phát sinh', '✓ Ổ khoá TSA × 4 + Dây đai vali × 2 (MIA.vn)', 644000, 644000, 'tra', 'Nhận 11/10 · khoá 129k×4 + dây 199k×2', 51),
    ('c52', trip, 'Phát sinh', '✓ Ổ cắm du lịch Điện Quang ESK × 3', 391139, 391139, 'tra', 'Nhận 11/10 · ổ 3 chân kiểu Anh', 52),
    ('c53', trip, 'Phát sinh', '✓ Túi zip A4 Thiên Long (combo 3 cái)', 52652, 52652, 'tra', 'Nhận 11/10', 53),
    ('c54', trip, 'Phát sinh', '✓ Túi phân loại hành lý MIAvn × 4', 233207, 233207, 'tra', 'Nhận 11/10', 54),
    ('c55', trip, 'Phát sinh', '✓ Đồ gia đình mặc cùng nhau', 2000000, 2000000, 'tra', 'Mua trước chuyến đi', 55);
END $$;
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
