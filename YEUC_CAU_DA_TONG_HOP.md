# Yêu cầu đã tổng hợp — Dự án mới Xe Máy Tâm An Nomura

## 1. Thương hiệu & trải nghiệm khách hàng
- Tông đỏ hiện đại, mượt, responsive ưu tiên điện thoại nhưng không cắt ảnh xe trên desktop.
- Logo, favicon, tiêu đề tab, màu chủ đạo, font tiêu đề/font nội dung, ảnh Hero, ảnh showroom, ảnh khuyến mại đều thay được trong admin.
- Nhiều font: Be Vietnam Pro, Manrope, Inter, Plus Jakarta Sans, DM Sans, Urbanist, Lexend, Archivo, Montserrat, Barlow Condensed, Roboto Condensed, Oswald, Space Grotesk.
- Không hiển thị đường dẫn quản trị trên website khách; `/admin` là đường dẫn riêng.
- Nút gọi, Zalo, Messenger, Facebook, TikTok, YouTube, bản đồ, chat và nút lên đầu trang.

## 2. Sản phẩm
- 4 nhóm: xe máy mới, xe máy cũ, xe điện mới, xe điện cũ.
- Chỉ nhóm có sản phẩm đang hiển thị mới xuất hiện ngoài trang khách.
- Tìm kiếm gần đúng theo tên, hãng và tên màu.
- Carousel ngang có mũi tên; điện thoại vuốt ngang.
- Giá có thể để trống để hiển thị “Liên hệ nhận giá”; có giá cũ gạch ngang.
- Trạng thái: còn hàng, sắp về, đang giữ xe, đã bán.
- Mỗi xe: thông số, giấy tờ, nội dung trả góp, khoản trả trước tham khảo, hỗ trợ hồ sơ.
- Nhiều màu, mỗi màu tối đa 12 ảnh; bấm màu đổi đúng album.
- Nhiều ảnh chung; gallery thumbnail; phóng to ảnh có mũi tên qua/lại.
- Nhiều phiên bản xe; giá/mô tả theo phiên bản.
- Xe tương tự bên dưới chi tiết xe.

## 3. Nội dung & dịch vụ
- Khuyến mại có ảnh, nội dung, thứ tự và bật/tắt.
- Phụ tùng/phụ kiện, ảnh, giá có thể ẩn.
- Hỗ trợ giao xe tận nơi.
- Trang `/tra-gop`: ảnh riêng, nội dung, thủ tục 4 bước, giấy tờ thường cần, FAQ và form.
- Chính sách/bài viết tự tạo, sửa, ẩn, xoá trong admin.

## 4. Form, chat & phân quyền
- Form tư vấn/giữ xe/trả góp lưu D1; lọc theo trạng thái, ngày, nhân viên.
- Quy trình form: chưa xử lý, đang xử lý, đã xong.
- Chat khách–nhân viên; khách thấy đúng tên nhân viên.
- Chat có trạng thái mở/đã xong, gán nhân viên, lọc ngày/trạng thái/nhân viên, bật chuông; chỉ admin xoá.
- Admin toàn quyền: cấu hình web, xoá, nhân viên, analytics, nhật ký.
- Nhân viên: thêm/sửa sản phẩm, phụ kiện, xử lý form và chat; không được xoá hoặc sửa cấu hình website.
- Nhật ký hệ thống chỉ admin xem.

## 5. Đo lường & AI
- Lượt truy cập nội bộ 30 ngày.
- Lưu Meta/Facebook Pixel ID và TikTok Pixel ID trong admin; website gửi PageView, ViewProduct và Lead khi mã pixel được cấu hình.
- Chatbot Gemini có thể bật/tắt; trả lời theo kho xe và kiến thức admin nhập; tự nhường nhân viên khi hội thoại được nhận.
- Có chế độ webhook để thay chatbot/nhà cung cấp sau này.
