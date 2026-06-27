# Xe Máy Tâm An Nomura — dự án mới V1

Đây là dự án làm mới hoàn toàn: **không ghi đè repo/Worker cũ**. Dùng một GitHub repo, Worker, D1 database và R2 bucket mới để tránh mọi lỗi tích luỹ từ các bản trước.

## Cấu trúc

```text
public/            Giao diện website + quản trị
worker/index.js     API, auth, D1, R2, chat, AI
wrangler.jsonc      Cấu hình Cloudflare
```

## Chức năng chính

Xem `YEUC_CAU_DA_TONG_HOP.md`.

## Deploy hoàn toàn online

### A. Tạo tài nguyên mới trên Cloudflare

1. Tạo **R2 bucket** tên chính xác:
   ```text
   tam-an-images-v2
   ```
2. Tạo **D1 SQLite Database** tên:
   ```text
   tam-an-db-v2
   ```
3. Copy **Database ID** của D1.
4. Trong GitHub repo mới, mở `wrangler.jsonc`, thay:
   ```text
   REPLACE_WITH_NEW_D1_DATABASE_ID
   ```
   bằng Database ID thật.

### B. Tạo repo GitHub mới

1. Tạo repo mới, ví dụ `tam-an-motor-v1`.
2. Upload toàn bộ file/folder trong gói này vào repo mới.
3. Không upload file ZIP lồng bên trong repo.

### C. Tạo Worker từ GitHub

1. Cloudflare → **Workers & Pages** → **Create** → **Import a repository**.
2. Chọn repo mới.
3. Cấu hình:
   ```text
   Build command: npm install
   Deploy command: npx wrangler deploy
   Production branch: main
   ```
4. Deploy lần đầu.

### D. Thêm secrets runtime trước khi dùng `/admin`

Cloudflare → Worker mới → **Settings → Variables and Secrets** → tạo kiểu **Secret**:

| Tên | Giá trị |
|---|---|
| `ADMIN_PASSWORD` | Mật khẩu đăng nhập tài khoản `admin` lần đầu |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên dài, tối thiểu 32 ký tự |

Tùy chọn:

| Tên | Dùng cho |
|---|---|
| `GEMINI_API_KEY` | Bật Gemini chatbot |
| `AI_WEBHOOK_URL` | Nhà cung cấp chatbot khác theo webhook |
| `RESEND_API_KEY` | Gửi email có form mới |
| `NOTIFY_EMAIL` | Email nhận thông báo form |

Sau khi đặt `ADMIN_PASSWORD`, tài khoản đầu tiên sẽ là:

```text
Username: admin
Password: giá trị ADMIN_PASSWORD
```

Vào admin:

```text
https://TEN-WORKER.TEN-SUBDOMAIN.workers.dev/admin
```

## Lưu ý vận hành

- Website tự tạo bảng D1 khi có request đầu tiên; không cần dán SQL thủ công.
- Mỗi màu xe có thể tải nhiều ảnh. Tại admin: Kho xe → Thêm/Sửa xe → Màu xe & album ảnh.
- Trong `Nội dung website`, admin thay được ảnh Hero và ảnh Showroom độc lập.
- Chatbot chỉ trả lời khi chưa có nhân viên được gán vào cuộc hội thoại. Khi gán nhân viên, bot nhường người thật.
- Muốn dùng nhà cung cấp bot khác: chọn `ai_provider` là `webhook` trong cài đặt, đặt secret `AI_WEBHOOK_URL`; endpoint webhook nhận JSON có `prompt` và trả JSON `{ "reply": "..." }` hoặc `{ "message": "..." }`.

## Kiểm tra sau deploy

1. Mở `/api/health` → cần thấy `{"ok":true,"status":"ready"}`.
2. Mở `/` → website tải.
3. Vào `/admin` → đăng nhập `admin`.
4. Thêm một xe thử, upload ảnh R2, mở ở cửa sổ ẩn danh.
5. Test chat bằng 2 thiết bị/tab: khách và nhân viên.
