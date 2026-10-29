# HƯỚNG DẪN & TÀI LIỆU DỰ ÁN WEB TRÀ SỮA SINH VIÊN (IMT MILK TEA)

> **Cổng Đặt Trà Sữa Sinh Viên Trực Tuyến - IMT Milk Tea**  
> Giao diện được thiết kế theo phong cách Cổng thông tin Đại học (chuẩn nhận diện thương hiệu xanh navy `#16329c` và vàng gold `#f7b500`), tích hợp hệ thống xác thực sinh viên bằng MSSV và cơ chế phân tách dữ liệu đa tầng độc lập.

---

## 1. TỔNG QUAN DỰ ÁN

- **Tên dự án:** Cổng Đặt Món Sinh Viên - IMT Milk Tea
- **Công nghệ xây dựng:** 100% thuần HTML5, CSS3 và JavaScript ES6 gói gọn trong **1 file duy nhất (`index.html`)**.
- **Không phụ thuộc thư viện ngoài:** Không dùng thư viện CDN (như Bootstrap, Tailwind, jQuery hay React), không cần cấu hình Node.js/Backend phức tạp.
- **Khả năng tương thích:** Chạy ngay lập tức khi nhấp đúp mở file trên mọi trình duyệt hiện đại (Google Chrome, Microsoft Edge, Firefox, Cốc Cốc, Safari) trên cả máy tính lẫn điện thoại di động (Responsive 100%).

---

## 2. CÁC TÍNH NĂNG CHÍNH CỦA WEBSITE

### 2.1. Cổng Đăng Nhập & Đăng Ký Bằng Mã Số Sinh Viên (Auth Portal)
- **Bắt buộc định danh trước khi sử dụng:** Khi mới mở web hoặc sau khi đăng xuất, hệ thống hiển thị màn hình Modal chào mừng yêu cầu xác thực bằng **Mã số sinh viên (MSSV)** và **Mật khẩu**.
- **Hỗ trợ 2 Tab linh hoạt:**
  - **Đăng nhập:** Dành cho sinh viên đã có tài khoản trên hệ thống.
  - **Đăng ký mới:** Dành cho sinh viên lần đầu tham gia đặt món (nhập MSSV, Họ tên và Mật khẩu).
- **Tính năng bảo mật & chống lưu vết:**
  - Tự động xóa sạch toàn bộ nội dung đã nhập khi chuyển đổi giữa 2 tab Đăng nhập và Đăng ký.
  - Vô hiệu hóa tính năng tự động điền gợi ý của trình duyệt (`autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`, `autocomplete="new-password"`).
  - Khi sinh viên bấm nút **"Thoát"** (Đăng xuất), phiên đăng nhập bị hủy ngay lập tức và các trường nhập liệu được reset sạch sẽ 100%.

---

### 2.2. Hero Banner Khuyến Mãi Tự Động (Deal Slider)
- **4 Slide Deal độc quyền sinh viên:**
  1. **Menu Bestseller 2026:** Giới thiệu Top 8 món trà sữa đậm vị tươi ngon chỉ từ 25.000đ.
  2. **Ưu đãi Mua 5 Tặng 1:** Deal nhóm học tập – Mua 5 ly bất kỳ nhận ngay 1 ly truyền thống miễn phí.
  3. **Ưu đãi Giảm 5% Thẻ Sinh Viên:** Giảm trực tiếp 5% hóa đơn cho toàn bộ sinh viên có thẻ học tập.
  4. **Happy Hour Vàng (14h - 17h):** Tự động nâng cấp miễn phí từ Size M lên Size L khổng lồ.
- **Cơ chế tự động trượt (Auto-Slide):**
  - Tự động lướt sang slide tiếp theo sau mỗi **5 giây**.
  - Có các nút điều hướng chuyển slide trước/sau (`<` và `>`) và hàng chấm chỉ báo (Dots indicator) có hiệu ứng co giãn thành hình viên thuốc màu vàng khi active.
- **Hiệu ứng chuyển động mượt mà (Luxury Slow Glide & Animation):**
  - Banner trượt chuyển động chậm với đường cong gia tốc mềm mại (`transition: transform 1.35s cubic-bezier(0.22, 1, 0.36, 1)`).
  - Hoạt ảnh so le (Staggered Entry Animation) cho chữ, số to `100%`, huy hiệu Deal và hình vẽ ly trà sữa SVG.
  - Thẻ Deal có hiệu ứng nhấp nhô nhẹ nhàng (`Floating Animation`) và có thể bấm trực tiếp để cuộn nhanh xuống thực đơn.

---

### 2.3. Cấu Trúc 3 Tab Chức Năng Cốt Lõi

Hệ thống hoạt động theo mô hình SPA (Single Page Application) chuyển tab tức thì không tải lại trang:

#### Tab 1: "Thực đơn" (Chọn món để Order)
- Trưng bày **8 món trà sữa đặc sắc**:
  1. *Trà sữa truyền thống* (25.000đ)
  2. *Trà sữa trân châu đen* (30.000đ)
  3. *Trà sữa matcha* (35.000đ)
  4. *Trà sữa khoai môn* (32.000đ)
  5. *Trà sữa socola* (32.000đ)
  6. *Hồng trà sữa* (28.000đ)
  7. *Trà sữa thái xanh* (30.000đ)
  8. *Trà sữa Oolong* (33.000đ)
- Có thanh tìm kiếm món theo thời gian thực (nhập tên món để lọc ngay lập tức).
- Mỗi thẻ món có hình vẽ minh họa SVG chuẩn phong cách phẳng, nhãn giá nổi bật và nút **"Chọn món yêu thích"**.
- **Popup Modal Đặt Món:**
  - Tự động điền Họ tên và MSSV của sinh viên đang đăng nhập (khóa không cho người khác sửa mạo danh).
  - Tùy chọn **Size:** Size M hoặc Size L.
  - Tùy chọn **Mức đường:** 0%, 50%, 100%.
  - Tùy chọn **Mức đá:** Không đá, Ít đá, Bình thường.
  - Ô nhập **Ghi chú riêng:** Nhập yêu cầu đặc biệt (tùy chọn, tối đa 120 ký tự).
- Sau khi bấm "Xác nhận Order", hệ thống hiển thị thông báo toast màu xanh lá xác nhận thành công kèm phím tắt xem ngay lịch sử cá nhân.

---

#### Tab 2: "Cộng đồng" (Dữ liệu chung cho mọi người)
- **Mục đích:** Là không gian chung để mọi sinh viên cùng thấy xu hướng chọn món của toàn trường.
- **Thống kê tổng quan:**
  - Hiển thị tổng số lượt đã order của toàn bộ cộng đồng.
  - Bảng xếp hạng (Top Ranking) các món trà sữa được yêu thích nhất toàn trường, xếp hạng theo số lượt chọn giảm dần và hiển thị thanh tỷ lệ phần trăm trực quan.
- **Bảng nhật ký chung:**
  - Cột: STT, Tên sinh viên (kèm MSSV ẩn danh một phần), Món chọn, Size, Mức đường, Mức đá, Thời gian đặt.
  - Thứ tự: Đơn mới nhất luôn hiển thị ở dòng đầu tiên.
- **Nút "Tải lại":** Cập nhật dữ liệu tức thì.
- **Dữ liệu mẫu khởi tạo:** Khi hệ thống vừa mở lần đầu, tự động nạp sẵn 10 đơn hàng mẫu thực tế từ các bạn sinh viên khác nhau để Tab cộng đồng luôn sống động.

---

#### Tab 3: "Của tôi" (Dữ liệu riêng tư tuyệt đối)
- **Mục đích:** Quản lý nhật ký và lịch sử đặt món của **chính sinh viên đang đăng nhập thiết bị đó**.
- **Tính riêng tư & Độc lập:**
  - Chỉ lọc và hiển thị các đơn hàng thuộc về đúng mã số sinh viên (MSSV) của phiên làm việc hiện tại.
  - Bất kỳ ai khác mở máy hoặc đăng nhập bằng tài khoản khác sẽ **hoàn toàn không thấy** các đơn hàng này.
  - Khi một sinh viên mới đăng ký tài khoản, Tab này ban đầu sẽ có 0 đơn hàng và hiện thông báo khuyến khích đặt món mới.
- **Thống kê cá nhân:**
  - Tổng số lần sinh viên đã đặt món.
  - Món trà sữa yêu thích nhất của riêng sinh viên đó (món được người đó gọi nhiều nhất và số lần).
- **Nhật ký chi tiết:** Bảng gồm STT, Tên món, Size, Đường, Đá, Ghi chú và Thời gian chi tiết.
- **Nút "Xóa lịch sử của tôi":** Cho phép sinh viên dọn sạch lịch sử cá nhân của riêng mình (có hộp thoại hỏi xác nhận `Confirm` an toàn trước khi xóa).

---

## 3. CƠ CHẾ LƯU TRỮ DỮ LIỆU (SQLITE & SCRYPT SECURITY ARCHITECTURE)

Hệ thống nâng cấp toàn diện cơ chế lưu trữ lên **Cơ sở dữ liệu quan hệ SQLite (`imt_teashop.db`)** kết hợp **Mã hóa băm mật khẩu Scrypt chuẩn an ninh OWASP**, giải quyết triệt để bài toán bảo mật và đồng bộ dữ liệu:

### 3.1. Cấu Trúc Bảng Trong Database SQLite (`imt_teashop.db`)

1. **Bảng `users` (Quản lý tài khoản sinh viên & Phân quyền Admin):**
   * `id`: Khóa chính tự tăng (Primary Key, Auto-increment).
   * `mssv`: Mã số sinh viên (Duy nhất - `UNIQUE NOT NULL`).
   * `full_name`: Họ và tên sinh viên.
   * `password_hash`: Chuỗi băm mật khẩu 64-byte được tạo bởi thuật toán `scrypt` (chống Rainbow Table & Brute Force).
   * `salt`: Chuỗi muối ngẫu nhiên 16-byte duy nhất cho từng tài khoản.
   * **`admin`**: **Cột phân quyền quản trị (`1` = Quản trị viên Admin toàn năng, `0` = Khách hàng / Sinh viên)**.
   * `created_at`: Thời điểm tạo tài khoản (ISO 8601).

2. **Bảng `products` (Quản lý thực đơn & Món trà sữa):**
   * `id`: Mã định danh sản phẩm tự tăng.
   * `name`: Tên món trà sữa.
   * `price`: Giá bán (ví dụ: `25.000đ`).
   * `tag`: Huy hiệu hiển thị (Bán chạy, Signature, Mới...).
   * `desc`: Mô tả hương vị.
   * `cup_color`, `bg`: Màu ly SVG và gradient nền thẻ.
   * `is_active`: Trạng thái phục vụ (1: Đang bán, 0: Tạm ngưng).

3. **Bảng `orders` (Lịch sử đặt món theo từng tài khoản):**
   * `id`: Khóa chính định danh đơn hàng (`order-xxx`).
   * `user_id`: Khóa ngoại tham chiếu đến bảng `users(id)` (`FOREIGN KEY ... ON DELETE CASCADE`).
   * `mssv`: Mã số sinh viên đặt món.
   * `full_name`: Tên sinh viên đặt món.
   * `drink_name`: Tên món trà sữa đã chọn.
   * `size`, `sugar`, `ice`, `note`: Tùy chỉnh chi tiết (Size, Đường, Đá, Ghi chú riêng).
   * `order_time`: Chuỗi thời gian hiển thị thân thiện (giờ:phút ngày/tháng/năm).
   * `created_at`: Dấu thời gian chuẩn ISO.

4. **Bảng `sessions` (Quản lý phiên đăng nhập an toàn):**
   * `token`: Khóa chính Session Token ngẫu nhiên 32-byte (Bearer Token).
   * `user_id`, `mssv`, `full_name`, `admin`, `created_at`: Thông tin phiên đăng nhập đang hoạt động.

---

## 4. HƯỚNG DẪN TRẢI NGHIỆM CỔNG QUẢN TRỊ ADMIN (ADMIN PORTAL)

### 4.1. Đăng nhập Cổng Quản Trị
1. Khởi động server: `node server.js` (hoặc `npm start`).
2. Mở trình duyệt và truy cập: **`http://localhost:3000/admin`**  
   *(hoặc bấm vào nút **"Admin"** ở góc trên bên phải trang chủ `index.html`)*.
3. Cổng xác thực Admin (Login Gate) sẽ xuất hiện:
   * **Tên đăng nhập:** `admin`
   * **Mật khẩu:** `1`
   *(Database SQLite tự động kiểm tra cột `admin = 1`)*.

### 4.2. Các tính năng quản trị toàn năng trong Admin Portal
* 📊 **Tab 1 - Dashboard & Báo cáo:** Xem tổng quan đơn hàng, doanh thu ước tính, số lượng khách hàng, top 5 món bán chạy nhất và đơn hàng mới nhất.
* 👥 **Tab 2 - Quản lý Khách hàng:** Xem danh sách toàn bộ sinh viên, xem **chi tiết lịch sử mua hàng** của từng sinh viên, thăng/hạ quyền Admin (`admin=1/0`), hoặc xóa tài khoản.
* 🧋 **Tab 3 - Quản lý Thực đơn (Thêm, Sửa, Xóa sản phẩm):**
  * Bấm **"+ Thêm Món Trà Sữa Mới"** để tạo món mới kèm giá, mô tả và chọn màu ly SVG trực quan.
  * Món mới thêm hoặc sửa giá sẽ **tự động cập nhật ngay lập tức sang trang khách hàng `index.html`**.
  * Chỉnh sửa hoặc xóa các món không còn kinh doanh.
* 📋 **Tab 4 - Quản lý Đơn hàng:** Xem toàn bộ đơn hàng trong trường, tìm kiếm theo tên sinh viên hoặc món, xóa đơn spam, xuất file JSON báo cáo.
* 🗄️ **Tab 5 - Quản trị CSDL SQLite:** Xem trực tiếp dung lượng file `imt_teashop.db`, cấu trúc các bảng và dữ liệu thô (Raw Data) đã băm Scrypt.

---

## 4. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG VỚI SQLITE

### Cách 1: Chạy Server SQLite (Khuyến nghị - Chuẩn bảo mật cao nhất)
1. Mở cửa sổ dòng lệnh (Terminal / PowerShell / CMD) tại thư mục `WEB`:
   ```bash
   node server.js
   # hoặc: npm start
   ```
2. Mở trình duyệt và truy cập: **`http://localhost:3000`**
3. Trên thanh thông tin trên cùng của website sẽ xuất hiện huy hiệu màu xanh:  
   `🟢 SQLite (Scrypt Hash)` báo hiệu trang web đang kết nối trực tiếp vào cơ sở dữ liệu SQLite an toàn.

### Cách 2: Mở trực tiếp file (Offline Fallback)
* Nếu nhấp đúp trực tiếp vào file `index.html`, hệ thống sẽ tự động chuyển sang chế độ dự phòng Offline với huy hiệu màu vàng cam `Chế độ Offline (localStorage)`. Dữ liệu vẫn hoạt động bình thường trên máy tính của bạn.

### Bước 1: Khởi động Website
- Nhấp đúp chuột vào file `index.html` (hoặc kéo thả vào trình duyệt Chrome/Edge).
- Giao diện màn hình chào mừng đăng nhập sẽ xuất hiện ở chính giữa.

### Bước 2: Tạo tài khoản mới & Đăng nhập
1. Bấm vào nút tab **"Đăng ký mới"**.
2. Nhập một MSSV bất kỳ (ví dụ: `20261111`), Họ tên (ví dụ: `Lê Quốc Bảo`) và Mật khẩu (ví dụ: `123456`).
3. Bấm **"Đăng ký & Đăng nhập ngay"**.
4. Bạn sẽ được chuyển thẳng vào giao diện chính; góc trên bên phải hiển thị tên của bạn.

### Bước 3: Đặt món trà sữa
1. Tại **Tab 1 ("Thực đơn")**, chọn món bạn thích (ví dụ: *Trà sữa matcha*), bấm **"Chọn món yêu thích"**.
2. Hộp thoại Popup xuất hiện: Chọn Size L, Đường 50%, Đá ít, ghi chú "Uống liền".
3. Bấm **"Xác nhận Order"**.
4. Bảng thông báo thành công màu xanh lá sẽ hiển thị.

### Bước 4: Kiểm tra tính tách bạch dữ liệu
1. Chuyển sang **Tab 2 ("Cộng đồng")**: Bạn sẽ thấy đơn hàng vừa đặt của mình xuất hiện trên đầu bảng, đồng thời bảng xếp hạng món ngon được cập nhật ngay.
2. Chuyển sang **Tab 3 ("Của tôi")**: Thấy ngay đơn hàng của riêng bạn với thống kê chi tiết.
3. Bấm nút **"Thoát"** ở thanh trên cùng để đăng xuất.
4. Đăng nhập hoặc tạo một tài khoản sinh viên khác: Vào lại **Tab 3 ("Của tôi")** bạn sẽ thấy danh sách hoàn toàn trống (0 lượt), chứng minh dữ liệu cá nhân của bạn được bảo mật và phân tách độc lập tuyệt đối!

---

*Bản quyền giao diện & mã nguồn thuộc về dự án Sinh Viên IMT Milk Tea 2026.*
