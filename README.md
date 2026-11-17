# SG Travel Tracker

Web theo dõi chi phí chuyến Singapore 21–24/11/2026 của gia đình.
Next.js 15.5 + Supabase (Postgres) + Vercel. Có mật khẩu chung cho cả nhà.

## Cách hoạt động

- Mọi trang và API đều cần đăng nhập (tên mặc định `giadinh` + mật khẩu `SITE_PASSWORD`).
- Trình duyệt **không** nói chuyện trực tiếp với Supabase. Mọi đọc/ghi đi qua API của web,
  dùng service role key nằm trên server Vercel. Các bảng trong Supabase bật RLS và không có
  policy nào, nên khoá công khai (anon key) không đọc/sửa được gì.
- Trang chuyến đi tự làm mới 15 giây/lần để cả nhà thấy cập nhật của nhau.

## Triển khai (khoảng 15 phút)

### 1. Supabase — tạo cơ sở dữ liệu
1. Vào https://supabase.com → **New project**. Đặt tên `sg-travel`, region **Southeast Asia (Singapore)**,
   ghi lại mật khẩu database.
2. Vào **SQL Editor** → **New query** → mở file `supabase/setup_all.sql`, copy toàn bộ, dán vào → **Run**.
   Kết quả: 3 bảng `trips`, `costs`, `receipts` và 32 khoản chi của chuyến Singapore.
3. Vào **Project Settings → API Keys** (hoặc **Data API**), copy:
   - **Project URL** → dùng cho `SUPABASE_URL`
   - **service_role** key (hoặc **Secret key** `sb_secret_…`) → dùng cho `SUPABASE_SERVICE_ROLE_KEY`.
     Khoá này bí mật, không gửi qua chat, không dán vào code.

### 2. Đưa code lên GitHub
Cách nhanh nhất không cần cài gì:
1. Vào https://github.com/new → tên `sg-travel`, chọn **Private** → **Create repository**.
2. Bấm **uploading an existing file**, giải nén file zip rồi kéo **toàn bộ nội dung bên trong thư mục `sg-travel`**
   (không kéo thư mục `node_modules` nếu có) vào → **Commit changes**.

### 3. Vercel — đưa web lên mạng
1. Vào https://vercel.com → đăng nhập bằng GitHub → **Add New… → Project** → chọn repo `sg-travel` → **Import**.
2. Mở **Environment Variables**, thêm 4 biến:

   | Tên | Giá trị |
   |---|---|
   | `SUPABASE_URL` | Project URL ở bước 1.3 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key ở bước 1.3 |
   | `SITE_USER` | `giadinh` (hoặc tên khác) |
   | `SITE_PASSWORD` | mật khẩu chung cho cả nhà |

3. Bấm **Deploy**, chờ khoảng 1–2 phút.
4. Mở `https://<tên-dự-án>.vercel.app/trips/singapore-2026`, đăng nhập bằng `SITE_USER` / `SITE_PASSWORD`.

Muốn đổi mật khẩu: sửa `SITE_PASSWORD` trong Vercel → Settings → Environment Variables → **Redeploy**.

## Chạy thử trên máy

```bash
cp .env.local.example .env.local   # điền 4 biến
npm install
npm run dev                         # http://localhost:3000
```

## Tính năng
- 3 hàng thẻ tổng quan: ngân sách 160 triệu / dự toán + dư / đã chi + tiền mặt 3.000 SGD + tiền thẻ còn.
- Bấm vào khoản chi để nhập thực chi, đổi trạng thái, ghi chú. Gõ `42s` = 42 SGD tự quy đổi (× 21.000).
- Lọc theo trạng thái, thêm khoản phát sinh.

## Việc tiếp theo (chưa làm)
- Chụp hoá đơn → AI đọc và gợi ý cập nhật (bảng `receipts` đã có sẵn).
- Xuất báo cáo tổng kết sau chuyến đi.
