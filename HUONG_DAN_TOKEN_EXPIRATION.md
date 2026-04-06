# 🔐 Token Expiration Handler - Hướng Dẫn Chi Tiết

## 📋 Tóm Tắt Vấn Đề
Khi token hết hạn nhưng người dùng vẫn dùng ứng dụng, sẽ xảy ra lỗi:
- ❌ Không lưu được hóa đơn
- ❌ Không tải được lịch sử
- ❌ API calls thất bại không rõ nguyên nhân

## ✅ Giải Pháp Đã Implement

### 1. **API Interceptor** (`src/api/apiInterceptor.js`)
- Tạo một layer wrapper cho tất cả API calls
- Kiểm tra status code 401/403 (Unauthorized)
- Phát hiện khi token hết hạn hoặc không hợp lệ
- Tự động trigger logout callback

```javascript
fetchWithTokenCheck(url, options) → Kiểm tra response
  ├─ Status 401/403 + "expired/invalid" → Logout + throw error
  └─ Status 200-299 → Return response bình thường
```

### 2. **BillApiService Updates** (`src/api/billApiService.js`)
- Thay thế tất cả `fetch()` bằng `fetchWithTokenCheck()`
- Áp dụng cho tất cả API endpoints:
  - `createBill()`
  - `getBills()`
  - `getBillStats()`
  - `updateBill()`
  - `deleteBill()`
  - `login()`
  - `register()`

### 3. **AuthContext Enhancement** (`src/context/AuthContext.js`)
Thêm:
- `tokenExpiredError` state - Ghi lại khi token hết hạn
- `handleTokenExpiration()` - Xử lý logout khi token expired
- `clearTokenExpiredError()` - Reset error state
- Đăng ký logout callback vào API interceptor

```javascript
const handleTokenExpiration = () => {
  console.warn('Token expired, logging out...');
  logout(); // Xóa user & token
  setTokenExpiredError(true); // Trigger notification
}
```

### 4. **TokenExpiredNotification Component** (`src/components/TokenExpiredNotification.js`)
Thông báo người dùng:
- 🚨 Hiển thị modal/notification theo Tailwind CSS
- ⏱️ Tự động redirect sau 4 giây
- 🔘 Button "Đăng nhập lại" để quay về login ngay

### 5. **Integration** (`src/BillSplitter.js`)
- Import `TokenExpiredNotification` component
- Import `fetchWithTokenCheck` cho inline API calls
- Thêm notification vào UI (ngay dưới Header)
- Thay thế tất cả fetch calls bằng `fetchWithTokenCheck()`

---

## 🔄 Flow Xử Lý Token Expiration

```
┌─────────────────────────────────────────────┐
│ User làm action (load history, save bill)   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ API Call gửi token cũ (hết hạn)             │
│ Headers: Authorization: Bearer <expired_token>
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Backend nhận request                        │
│ jwt.verify() kiểm tra token                 │
│ → Token invalid/expired                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Backend trả về: HTTP 403                    │
│ Body: { error: "Invalid or expired token" } │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ fetchWithTokenCheck nhận 403                │
│ Phát hiện "expired" trong error message     │
│ → Gọi logoutCallback()                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ handleTokenExpiration() được gọi            │
│ ├─ logout() xóa user, token khỏi state     │
│ ├─ Xóa localStorage (user, token, people)  │
│ └─ setTokenExpiredError(true)              │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ TokenExpiredNotification hiện lên           │
│ ├─ Thông báo "Phiên đăng nhập hết hạn"    │
│ ├─ Countdown 4 giây                        │
│ └─ Auto redirect hoặc user click button    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Chuyển hướng về trang login (/)             │
│ ✅ User phải đăng nhập lại                 │
└─────────────────────────────────────────────┘
```

---

## 🧪 Cách Kiểm Tra

### Phương Pháp 1: Test với Thời Gian Thực
1. Đăng nhập vào ứng dụng
2. Để ứng dụng hoạt động trong 7 ngày + 1 giây
3. Cố gắng tải lịch sử hóa đơn
4. ✅ Kỳ vọng: Thông báo token expired, auto-logout

### Phương Pháp 2: Simulation (Test Nhanh)
1. Đăng nhập vào ứng dụng
2. Mở DevTools (F12) → Console
3. Thay đổi token trong localStorage:
   ```javascript
   // Lấy token hiện tại
   const token = localStorage.getItem('token');
   const parts = token.split('.');
   
   // Decode payload (base64)
   const payload = JSON.parse(atob(parts[1]));
   
   // Tạo token với exp cũ (đã hết hạn)
   payload.exp = Math.floor(Date.now() / 1000) - 3600;
   
   console.log('Token sắp hết hạn:', new Date(payload.exp * 1000));
   ```
4. Cố gắng tải hóa đơn → Sẽ trigger expiration handler

### Phương Pháp 3: Modify Server Response (Best)
1. Trong backend (src/routes/auth.js):
   ```javascript
   // Thay đổi expiresIn tạm thời để test
   { expiresIn: '10s' }  // 10 giây thay vì 7 ngày
   ```
2. Đăng nhập
3. Đợi 11 giây
4. Cố gắng làm action
5. ✅ Thông báo sẽ hiện lên

---

## 📊 Backend Configuration (server.js)

Token expiration hiện tại:
```javascript
jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
```

**7 ngày** = 604,800 giây = 1 tuần

### Thay đổi theo nhu cầu:
- `{ expiresIn: '1h' }` → 1 giờ
- `{ expiresIn: '24h' }` → 1 ngày
- `{ expiresIn: '30d' }` → 30 ngày
- `{ expiresIn: '7d' }` → 7 ngày (mặc định)

---

## 🔍 Các File Được Sửa/Tạo

### Files Tạo Mới:
1. ✅ `src/api/apiInterceptor.js` - Xử lý token expiration
2. ✅ `src/components/TokenExpiredNotification.js` - UI notification

### Files Sửa:
1. ✅ `src/api/billApiService.js` - Sử dụng interceptor
2. ✅ `src/context/AuthContext.js` - Handle token expiration
3. ✅ `src/BillSplitter.js` - Integrate notification

---

## 🎯 Kết Quả Mong Đợi

### Trước (❌ Có Bug):
- Token hết hạn → API calls fail lặng lẽ
- User không biết phải làm gì
- Dữ liệu không lưu, không tải

### Sau (✅ Fixed):
- Token hết hạn → Notification hiển thị ngay
- User được thông báo rõ ràng
- Auto logout & redirect to login
- Người dùng có thể đăng nhập lại để tiếp tục

---

## 🚀 Deploy & Sản Xuất

Hiện tại:
- `expiresIn: '7d'` - An toàn, tokenlâu hạn dài
- Auto-logout khi expired - An toàn, không cần tokens dài

### Nếu muốn bảo mật hơn:
1. Giảm `expiresIn` xuống 1-24 giờ
2. Implement refresh token mechanism
3. Tách refresh token ra endpoint riêng

Nhưng hiện tại công cụ đã đủ tốt để xử lý token expiration.

---

## 💡 Notes

- **Token Storage**: Lưu trong localStorage (có thể upgrade lên sessionStorage nếu cần)
- **Security**: Token hết hạn sẽ không thể sử dụng lập lại
- **UX**: Notification 4 giây cho phép user xem message trước khi redirect
- **Performance**: Interceptor không ảnh hưởng đến performance (chỉ check response status)

---

Nếu có vấn đề hoặc cần tùy chỉnh, hãy liên hệ! 🎉
