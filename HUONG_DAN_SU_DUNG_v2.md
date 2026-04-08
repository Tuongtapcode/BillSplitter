# 📖 Hướng dẫn sử dụng BillSplitter v2.0

## 📋 Nội dung

1. [Giới thiệu](#giới-thiệu)
2. [Giao diện chính](#giao-diện-chính)
3. [Các tính năng](#các-tính-năng)
4. [Hướng dẫn từng bước](#hướng-dẫn-từng-bước)
5. [Mẹo & Thủ thuật](#mẹo--thủ-thuật)

## Giới thiệu

**BillSplitter v2.0** là ứng dụng web giúp bạn chia tiền hóa đơn một cách dễ dàng và quản lý chi tiêu hiệu quả.

### Tính năng chính:
- 🤖 **AI đọc hóa đơn**: Chụp ảnh → Tự động nhập danh sách sản phẩm
- 👥 **Chia tiền thông minh**: Hỗ trợ chia đều, chia theo người, chia tùy chỉnh
- 📊 **Quản lý chi tiêu**: Theo dõi xu hướng, phân loại chi tiêu
- 📈 **Báo cáo chi tiết**: Biểu đồ đẹp, thống kê toàn diện
- 👨‍👩‍👧 **Nhóm bạn bè**: Lưu danh sách người thường xuyên chia tiền

## Giao diện chính

### Sidebar Navigation (Bên trái)

```
📊 Tổng quan      ← Xem dashboard, thống kê nhanh
🧾 Chia hóa đơn   ← Tính năng chính
💰 Sổ chi tiêu    ← Quản lý chi tiêu
👥 Nhóm/Bạn bè    ← Quản lý danh sách người
📈 Báo cáo        ← Biểu đồ chi tiết
```

### Header (Trên cùng)

```
[BillSplitter Logo] [Theme Toggle] [Đăng nhập/Đăng xuất]
```

### Footer (Dưới cùng)

```
© 2024 BillSplitter - Ứng dụng chia tiền thông minh
```

## Các tính năng

### 1. 📊 Tổng quan (Dashboard)

**Bao gồm:**
- 4 thẻ tóm tắt: Tổng chi, Nợ bạn, Bạn nợ, Ngân sách
- Số liệu thống kê: Tổng hóa đơn, Số người, Bình quân
- Hoạt động gần đây
- Mẹo sử dụng

**Cách dùng:**
1. Nhấp vào tab "📊 Tổng quan"
2. Xem nhanh các thông tin quan trọng
3. Kiểm tra hoạt động gần đây

---

### 2. 🧾 Chia hóa đơn (Split Bill)

**Quy trình:**

#### Bước 1: Thêm người
```
1. Nhấp "Thêm người"
2. Nhập tên người
3. Nhấp "Thêm" (hoặc Enter)
4. Lặp lại cho những người khác
```

**Giao diện Avatar:**
- **≤ 4 người**: Hiển thị stack avatar (chồng lên nhau)
- **> 4 người**: Hiển thị grid avatar 4 cột
- Hover để xem tên
- Click X trên avatar để xóa

#### Bước 2: Upload ảnh hóa đơn
```
1. Kéo thả ảnh lên vùng upload, HOẶC
2. Nhấp "Chụp ảnh" (từ camera), HOẶC
3. Nhấp "Tải ảnh lên" (từ file)
```

**Lưu ý:**
- Có thể upload nhiều ảnh cùng lúc
- AI sẽ chọn hôm nay tự động nhập danh sách sản phẩm
- Ảnh sẽ hiển thị ở dưới để referencia

#### Bước 3: Thêm sản phẩm
```
Cách 1: AI tự động (nếu upload ảnh)
- Danh sách tự động điền

Cách 2: Thêm thủ công
1. Nhấp "Thêm món mới"
2. Nhập: Tên món, Đơn giá, Số lượng
3. Chọn "Người trả tiền"
```

**Tùy chọn "Người trả tiền":**
- **Tất cả**: Chia cho tất cả mọi người
- **Cá nhân**: Chọn từng người cụ thể
- **Nút "Chia số lượng"**: Chia tùy chỉnh từng người

#### Bước 4: Chia tùy chỉnh (Optional)
```
Khi muốn người trả tiền khác nhau:

1. Nhấp nút "🔢 Chia số lượng riêng"
2. Nhập số lượng cho mỗi người
3. Tương tổng sẽ cập nhật tự động
```

**Ví dụ:**
- Toàn bộ 4 cái bánh
- Hoa mua 2 cái
- Tường mua 2 cái
→ Nhập: Hoa = 2, Tường = 2

#### Bước 5: Xem kết quả
```
Tổng hóa đơn ở trên
↓
Kết quả chia tiền:
  💰 Tương: 150,000đ
    🤝 Chia chung: 50,000đ
    👤 Riêng: 100,000đ
```

#### Bước 6: Lưu hóa đơn (Optional)
```
Yêu cầu: Phải đăng nhập trước

1. Nhập tên hóa đơn (hoặc để auto)
2. Nhấp "Lưu"
3. Hóa đơn sẽ lưu vào lịch sử
```

#### Bước 7: Xuất ảnh (Optional)
```
1. Nhấp "Xuất ảnh PNG"
2. Ảnh gồm: Thông tin hóa đơn + Ảnh gốc + Kết quả chia tiền
3. Nếu đăng nhập: Upload lên cloud
4. Nếu chưa đăng nhập: Download về máy
```

---

### 3. 💰 Sổ chi tiêu (Expenses)

**Hiển thị:**

1. **Overview Cards** (4 thẻ)
   - Tổng chi tháng này
   - Đang nợ bạn
   - Bạn đang nợ
   - Ngân sách còn lại

2. **Biểu đồ Donut** (Phân loại chi)
   - Ăn uống
   - Di chuyển
   - Nhà cửa
   - Giải trí
   - Khác

3. **Biểu đồ Bar** (Xu hướng tuần)
   - Từ thứ 2 → Chủ nhật
   - Hiển thị tổng chi mỗi ngày

4. **Danh sách giao dịch** (Timeline)
   - Tìm kiếm theo tên
   - Lọc theo loại
   - Nhấp để xem chi tiết

---

### 4. 👥 Nhóm/Bạn bè (Groups)

**Tính năng (v2.0):**
- Xem danh sách nhóm sẵn
- Nút "Sửa" và "Xóa" (sắp tới)
- Nút "Tạo nhóm mới" (sắp tới)

**Future (v2.1+):**
- Tạo nhóm tùy chỉnh
- Thêm/xóa thành viên
- Lưu nhóm yêu thích
- Import nhanh vào Chia hóa đơn

---

### 5. 📈 Báo cáo (Reports)

**Hiển thị:**

1. **Biểu đồ Xu hướng Hàng tháng**
   - Tổng chi theo từng tháng
   - Line chart mượt mà

2. **So sánh Chi tiêu Theo Loại**
   - Bar chart stack
   - So sánh giữa các tháng

3. **Thống kê Nhanh**
   - Tổng 6 tháng
   - Bình quân/tháng
   - Cao nhất/tháng

---

## Hướng dẫn từng bước

### Tình huống 1: Chia hóa đơn cà phê đơn giản

```
🎯 Mục đích: Hương mua cà phê cho 3 người

Bước 1: Thêm người
├─ Hương
├─ Tường
└─ Minh

Bước 2: Upload ảnh hoặc thêm thủ công
├─ Cà phê sữa đá: 30,000đ × 1 (Tất cả)
├─ Cà phê đen: 25,000đ × 1 (Tất cả)
└─ Trà Đào: 35,000đ × 1 (Tất cả)

Bước 3: Xem kết quả
├─ Hương: 30,000đ (30k + 8.3k + 11.7k)
├─ Tường: 30,000đ (8.3k + 25k + 11.7k)
└─ Minh: 30,000đ (8.3k + 8.3k + 35k)

Bước 4: Lưu (Optional)
└─ Tên: "Cà phê chiều với Hương, Tường, Minh"
```

### Tình huống 2: Chia hóa đơn nhà hàng (Chia tùy chỉnh)

```
🎯 Mục đích: Chia hóa đơn nhà hàng 3 người, thức ăn khác nhau

Bước 1: Thêm người
├─ An
├─ Bình
└─ Cúc

Bước 2: Thêm sản phẩm
├─ Cơm gà: 80,000đ × 1 (An + Bình)
├─ Cơm tấm: 70,000đ × 1 (Cúc)
└─ Bia: 200,000đ × 3 (Tất cả → Chia Tùy chỉnh!)

Bước 3: Chia tùy chỉnh cho Bia
├─ An: 1 chai
├─ Bình: 1 chai
└─ Cúc: 1 chai

Bước 4: Xem kết quả
├─ An:  127,000đ (40k cơm + 67k bia)
├─ Bình: 127,000đ (40k cơm + 67k bia)
└─ Cúc: 96,000đ (70k cơm + 67k bia)
```

---

## Mẹo & Thủ thuật

### 💡 Mẹo sử dụng

1. **Chụp ảnh hóa đơn**
   - Chụp thẳng, suất đầy khung
   - Đủ sáng để AI nhận diện tốt
   - Có thể chụp từng phần nếu hóa đơn dài

2. **Chia số lượng tùy chỉnh**
   - Dùng khi có người mua ít hơn/nhiều hơn
   - Ví dụ: 4 bánh nhưng A ≠ 2, B = 1, C = 1
   - Tổng sẽ auto update

3. **Lưu hóa đơn**
   - Lưu để có lịch sử
   - Có thể chỉnh sửa sau
   - Giúp xem xu hướng chi tiêu

4. **Xuất ảnh**
   - Chia sẻ kết quả cho người khác
   - Không cần đăng nhập để export local
   - Đăng nhập để lưu cloud

5. **Sử dụng nhóm (Sắp tới)**
   - Tạo nhóm "Ký túc xá"
   - Nhanh chóng thêm người
   - Import vào chia hóa đơn 1 click

### ⚡ Keyboard Shortcuts

```
Enter             → Thêm người / Lưu hóa đơn
Escape            → Đóng dialog
Tab               → Chuyển input
```

### 🔒 Bảo mật & Quyền riêng tư

- Dữ liệu được mã hóa
- Không chia sẻ info với bên thứ 3
- Có thể xóa dữ liệu bất kỳ lúc nào
- Avatar hiển thị chữ cái đầu (anonymous safe)

### ♿ Accessibility

- Hỗ trợ Dark Mode
- Font size tương thích
- Hỗ trợ keyboard navigation
- Color contrast đạt tiêu chuẩn

---

## Troubleshooting

### ❌ Vấn đề: Ảnh không nhận diện được

**Giải pháp:**
1. Chụp lại ảnh rõ hơn
2. Đảm bảo ánh sáng tốt
3. Chụp thẳng (không chếch)
4. Thêm thủ công nếu AI không nhận diện

### ❌ Vấn đề: Không lưu được

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Đăng nhập lại
3. Kiểm tra token có hết hạn không
4. Xóa browser cache thử lại

### ❌ Vấn đề: Danh sách người bị rối

**Giải pháp:**
1. Scroll xuống xem hết danh sách
2. Grid view tự động với > 4 người
3. Xóa người không cần
4. Làm mới trang (F5)

---

## Support

📧 **Email**: support@billsplitter.com
💬 **Chat**: Trong app (sắp tới)
🐛 **Report Bug**: GitHub Issues

---

**Version**: 2.0
**Last Updated**: April 6, 2026
**Language**: Vietnamese
