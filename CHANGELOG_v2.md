# 🚀 BillSplitter v2.0 - Changelog

## 🎉 Phiên bản v2.0 - Nâng cấp toàn diện

### ✨ Tính năng mới

#### 1. **Sidebar Navigation** 
- ✅ Chuyển từ Top Navigation sang Sidebar Navigation
- ✅ Thiết kế Sidebar responsive cho mobile và desktop
- ✅ 5 tab chính để điều hướng:
  - 📊 **Tổng quan (Dashboard)**: Xem nhanh thống kê
  - 🧾 **Chia hóa đơn (Split Bill)**: Tính năng chính
  - 💰 **Sổ chi tiêu (Expenses)**: Quản lý chi tiêu
  - 👥 **Nhóm/Bạn bè (Groups)**: Quản lý danh sách
  - 📈 **Báo cáo (Reports)**: Biểu đồ chi tiết

#### 2. **Quản lý Chi tiêu (Expenses Management)**
- ✅ **Overview Cards**: Hiển thị 4 thẻ tóm tắt
  - Tổng chi tháng này (với so sánh tháng trước)
  - Đang nợ bạn
  - Bạn đang nợ
  - Ngân sách còn lại

- ✅ **Charts & Biểu đồ**
  - Donut Chart: Phân loại chi tiêu (Ăn uống, Di chuyển, Nhà cửa, Giải trí, Khác)
  - Bar Chart: Xu hướng chi tiêu theo từng ngày trong tuần

- ✅ **Transaction List**
  - Danh sách giao dịch với timeline
  - Icon loại chi tiêu
  - Tìm kiếm và lọc theo loại
  - Hiển thị tổng tiền theo ngày

#### 3. **Tổng quan Dashboard**
- ✅ Hiển thị thống kê nhanh
- ✅ Tổng số hóa đơn, số lượng người
- ✅ Bình quân mỗi hóa đơn
- ✅ Hoạt động gần đây
- ✅ Mẹo sử dụng ứng dụng

#### 4. **Cải thiện giao diện "Chia hóa đơn"**
- ✅ **Avatar Stack**: Danh sách người bằng avatar tròn xếp chồng
  - Stack view cho ≤ 4 người
  - Grid view cho > 4 người
  - Hover để xem tên
  - Nút xóa trên hover

- ✅ **Upload Area**: Cải thiện Drag & Drop
  - Animation mượt mà khi kéo thả
  - Loading state đẹp khi AI xử lý
  - Grid hiển thị ảnh đẹp

#### 5. **Báo cáo (Reports)**
- ✅ Biểu đồ xu hướng chi tiêu hàng tháng
- ✅ So sánh chi tiêu theo loại
- ✅ Thống kê nhanh (tổng, bình quân, cao nhất)

#### 6. **Nhóm/Bạn bè (Groups)**
- ✅ Placeholder component cho tương lai
- ✅ Giao diện để quản lý nhóm
- ✅ Nút import nhóm vào chia tiền

### 🛠️ Cấu trúc dự án mới

```
bill-splitter-frontend/src/
├── components/
│   ├── layout/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── Sidebar.js          [NEW]
│   │   └── AppLayout.js        [NEW]
│   ├── dashboard/
│   │   ├── OverviewCards.js    [NEW]
│   │   ├── Charts.js           [NEW]
│   │   ├── TransactionList.js  [NEW]
│   │   └── ExpensesManagement.js [NEW]
│   ├── shared/
│   │   └── PeoplePicker.js     [NEW - Avatar Stack]
│   ├── SplitBillView.js        [NEW - Extract từ BillSplitter.js]
│   ├── DashboardView.js        [NEW]
│   ├── GroupsView.js           [NEW]
│   ├── ReportsView.js          [NEW]
│   ├── AuthForm.js
│   ├── StatsDashboard.js
│   └── TokenExpiredNotification.js
├── BillSplitter.js             [REFACTORED - Main router]
├── AuthContext.js
└── api/
    └── apiInterceptor.js
```

### 📦 Dependencies mới

```json
{
  "recharts": "^2.x.x",
  "react-chartjs-2": "^3.x.x"
}
```

### 🎨 Cải thiện giao diện

- ✅ Responsive design trên tất cả các thiết bị
- ✅ Dark mode toàn diện
- ✅ Animations smooth
- ✅ Colors consistent với Tailwind
- ✅ Icons từ lucide-react

### 🔒 Bảo mật

- ✅ Token expiration handling
- ✅ Protected routes
- ✅ Auth context integration

### 📱 Mobile First

- ✅ Sidebar collapse trên mobile
- ✅ Touch-friendly buttons
- ✅ Responsive grid layouts
- ✅ Mobile menu toggle

### 🚀 Performance

- ✅ Component lazy loading
- ✅ Optimized re-renders
- ✅ Efficient state management
- ✅ Charts optimization

## 🔄 Migration Guide

### Từ v1.0 → v2.0

**Không breaking changes!** Tất cả tính năng cũ vẫn hoạt động bình thường.

1. **Navigation**: Sử dụng Sidebar thay vì các nút ở Header
2. **Expenses**: Mở tab "Sổ chi tiêu" thay vì vào "Thống kê"
3. **Reports**: Mở tab "Báo cáo" để xem biểu đồ chi tiết

## 🎯 Các tính năng sắp tới (v2.1+)

- [ ] AI tagging tự động cho chi tiêu (ăn uống, di chuyển, etc.)
- [ ] Import/Export CSV
- [ ] Recurring bills
- [ ] Notifications & Reminders
- [ ] Multiple currency support
- [ ] Cloud sync & backup
- [ ] Collaborative features
- [ ] Advanced analytics

## 📝 Notes

- Tất cả data cũ tương thích 100%
- Không cần migration
- Có thể rollback về v1 nếu cần

---

**Ngày release**: April 6, 2026
**Status**: ✅ Stable Release
