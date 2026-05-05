# Quản Lý Nhà Hàng

## Mô tả dự án

Đây là một hệ thống quản lý nhà hàng toàn diện, bao gồm backend API được xây dựng bằng Node.js và Express, cùng với frontend giao diện người dùng được phát triển bằng React và Vite. Hệ thống hỗ trợ nhiều vai trò người dùng như Admin, Cashier (Thu ngân), Chef (Đầu bếp), và Waiter (Phục vụ), với các chức năng quản lý người dùng, đơn hàng, thực đơn, thanh toán, đặt bàn, và phản hồi.

## Tính năng chính

- **Quản lý người dùng**: Đăng ký, đăng nhập, phân quyền theo vai trò (Admin, Cashier, Chef, Waiter).
- **Quản lý thực đơn**: Thêm, sửa, xóa món ăn và danh mục.
- **Quản lý đơn hàng**: Tạo và theo dõi đơn hàng từ khách hàng.
- **Quản lý thanh toán**: Xử lý thanh toán cho đơn hàng.
- **Quản lý đặt bàn**: Đặt và quản lý bàn ăn.
- **Quản lý nguyên liệu**: Theo dõi và quản lý nguyên liệu cho món ăn.
- **Phản hồi**: Thu thập và quản lý phản hồi từ khách hàng.
- **Dashboard**: Giao diện quản lý cho từng vai trò với các thống kê và báo cáo.

## Công nghệ sử dụng

### Backend
- **Node.js**: Môi trường chạy JavaScript phía server.
- **Express.js**: Framework web cho Node.js.
- **MongoDB**: Cơ sở dữ liệu NoSQL.
- **JWT**: Xác thực và ủy quyền người dùng.
- **bcrypt**: Mã hóa mật khẩu.

### Frontend
- **React**: Thư viện JavaScript cho giao diện người dùng.
- **Vite**: Công cụ xây dựng và phát triển nhanh.
- **CSS**: Styling cho giao diện.

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js (phiên bản 14 trở lên)
- MongoDB (cài đặt và chạy local hoặc sử dụng MongoDB Atlas)
- npm hoặc yarn

### Cài đặt Backend
1. Di chuyển vào thư mục backend:
   ```
   cd CNPMNC-NhaHang-main/backend
   ```
2. Cài đặt các dependencies:
   ```
   npm install
   ```
3. Cấu hình cơ sở dữ liệu: Chỉnh sửa file `config/connectDb.js` để kết nối với MongoDB của bạn.
4. Khởi tạo dữ liệu mẫu (tùy chọn):
   ```
   node config/seedAdmin.js
   node config/seedRole.js
   ```
5. Chạy server:
   ```
   npm start
   ```
   Server sẽ chạy trên `http://localhost:5000` (hoặc cổng được cấu hình).

### Cài đặt Frontend
1. Di chuyển vào thư mục frontend:
   ```
   cd CNPMNC-NhaHang-main/frontend
   ```
2. Cài đặt các dependencies:
   ```
   npm install
   ```
3. Chạy ứng dụng:
   ```
   npm run dev
   ```
   Frontend sẽ chạy trên `http://localhost:5173` (hoặc cổng được cấu hình bởi Vite).

## Cấu trúc dự án

```
CNPMNC-NhaHang-main/
├── backend/
│   ├── config/          # Cấu hình kết nối DB và seed data
│   ├── controllers/     # Logic xử lý cho từng module
│   ├── middlewares/     # Middleware xác thực
│   ├── models/          # Mô hình dữ liệu MongoDB
│   ├── routes/          # Định tuyến API
│   └── server.js        # Điểm khởi đầu server
├── frontend/
│   ├── public/          # Tài nguyên tĩnh
│   ├── src/
│   │   ├── components/  # Component React cho từng vai trò
│   │   ├── context/     # Context cho quản lý trạng thái
│   │   ├── lib/         # Utility functions
│   │   ├── login/       # Component đăng nhập
│   │   └── pages/       # Trang cho từng vai trò
│   └── vite.config.js   # Cấu hình Vite
└── README.md
```

## API Endpoints

Dưới đây là một số API endpoints chính:

- **Auth**: `/api/auth/login`, `/api/auth/register`
- **Users**: `/api/users` (CRUD operations)
- **Foods**: `/api/foods` (Quản lý món ăn)
- **Orders**: `/api/orders` (Quản lý đơn hàng)
- **Payments**: `/api/payments` (Quản lý thanh toán)
- **Reservations**: `/api/reservations` (Quản lý đặt bàn)
- **Feedbacks**: `/api/feedbacks` (Quản lý phản hồi)

Chi tiết API documentation có thể được tìm thấy trong code hoặc sử dụng tools như Postman để test.

## Đóng góp

Nếu bạn muốn đóng góp cho dự án:
1. Fork repository này.
2. Tạo một branch mới cho tính năng của bạn (`git checkout -b feature/AmazingFeature`).
3. Commit các thay đổi (`git commit -m 'Add some AmazingFeature'`).
4. Push lên branch (`git push origin feature/AmazingFeature`).
5. Tạo một Pull Request.

