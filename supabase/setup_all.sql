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
