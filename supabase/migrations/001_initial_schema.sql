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
