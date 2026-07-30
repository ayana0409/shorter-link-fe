# 🔗 Shorter Link — Frontend

> Giao diện quản lý URL rút gọn xây dựng trên React 19 với Redux Toolkit, React Router, Tailwind CSS, Socket.IO Client và QR code generation.

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc](#-kiến-trúc)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Chức năng](#-chức-năng)
- [Routing](#-routing)

---

## 🔭 Tổng quan

**Shorter Link Frontend** là giao diện SPA (Single Page Application) cho hệ thống rút gọn URL, được xây dựng trên **React 19** với **Create React App**. Ứng dụng hỗ trợ:

- **Xác thực JWT** với refresh token tự động (HttpOnly Cookie + Axios interceptor)
- **Phân quyền theo vai trò** (RBAC) — điều hướng dựa trên role `user`, `manager`, `admin`
- **Quản lý link rút gọn** — tạo, tìm kiếm, lọc, phân trang, thống kê
- **Quản lý nhóm** — tạo nhóm, thêm/xóa thành viên và link
- **Thông báo real-time** qua Socket.IO Client
- **Tạo mã QR** cho link rút gọn
- **Đa ngôn ngữ** (Tiếng Việt) — tập trung message constants
- **Multi-tab sync** — đồng bộ trạng thái auth giữa các tab (BroadcastChannel + localStorage events)
- **Proactive token refresh** — tự động refresh token trước khi hết hạn
- **Maintenance mode** — hiển thị màn hình bảo trì khi mất kết nối backend

---

## 🏗 Kiến trúc

```
shorter-link-fe/
├── src/
│   ├── components/           # UI components dùng chung
│   │   ├── Footer.js         # Footer chung
│   │   ├── Navbar.js         # Thanh điều hướng
│   │   ├── NotificationBell.js    # Chuông thông báo real-time
│   │   ├── PageWrapper.js         # Bọc layout trang
│   │   ├── QrCodePreview.js       # Xem trước mã QR
│   │   └── RoleProtectedRoute.js  # Route guard theo role
│   ├── constants/            # Hằng số & tiện ích local
│   │   ├── localStorage.js   # Token storage, JWT decode, expiry check
│   │   └── messages.js       # Tập trung UI messages (Tiếng Việt)
│   ├── pages/                # Các trang theo tính năng
│   │   ├── accounts/         # Đăng ký (RegisterPage)
│   │   ├── auth/             # Đăng nhập (LoginPage)
│   │   ├── admin/            # Trang quản trị (9 sub-pages)
│   │   │   ├── AdminPage.js           # Dashboard
│   │   │   ├── AccountManagementPage.js
│   │   │   ├── AccountDetailPage.js
│   │   │   ├── AccountGroupsPage.js
│   │   │   ├── AuditLogPage.js
│   │   │   ├── SystemConfigPage.js
│   │   │   ├── LevelManagementPage.js
│   │   │   ├── SystemHealthPage.js
│   │   │   └── SendNotificationPage.js
│   │   ├── group/            # Quản lý nhóm
│   │   │   ├── GroupsPage.js
│   │   │   ├── GroupMembersPage.js
│   │   │   └── GroupLinksPage.js
│   │   ├── CreateLink.js     # Trang tạo & quản lý link
│   │   ├── Navigator.js      # Redirect short URL
│   │   ├── NotFoundOrExpire.js
│   │   └── AccountLocked.js
│   ├── routes/
│   │   └── AppRoutes.js      # Định nghĩa routes & phân quyền
│   ├── store/                # Redux Toolkit state
│   │   ├── index.js          # Store configuration
│   │   └── authSlice.js      # Auth state (token, user, isAuthenticated)
│   ├── utils/                # Tiện ích
│   │   ├── request.js        # Axios instance, interceptors, token refresh, multi-tab sync
│   │   ├── notificationSocket.js  # Socket.IO client cho real-time notifications
│   │   └── url.js            # URL helpers
│   ├── App.js                # Root component — ping backend, maintenance mode
│   ├── App.css
│   ├── index.js              # Entry point — ReactDOM + Redux Provider
│   └── index.css             # Tailwind CSS imports
├── public/                   # Static assets
├── build/                    # Production build output
├── server.js                 # Express production server (serve SPA)
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── package.json
```

---

## 🛠 Công nghệ sử dụng

| Công nghệ            | Phiên bản | Mô tả                          |
| -------------------- | --------- | ------------------------------ |
| **React**            | 19.0.0    | UI framework                   |
| **Redux Toolkit**    | ^2.12.0   | State management               |
| **React Router DOM** | ^7.1.5    | Client-side routing            |
| **Tailwind CSS**     | ^3.4.17   | Utility-first CSS framework    |
| **Axios**            | ^1.7.9    | HTTP client với interceptors   |
| **Socket.IO Client** | ^4.8.3    | Real-time WebSocket connection |
| **qrcode**           | ^1.5.1    | Tạo mã QR cho link rút gọn     |
| **react-hot-toast**  | ^2.5.1    | Toast notifications            |
| **Express**          | ^4.18.3   | Production static file server  |
| **Create React App** | 5.0.1     | Build tooling & dev server     |
| **PostCSS**          | ^8.5.1    | CSS processing                 |
| **Autoprefixer**     | ^10.4.20  | CSS vendor prefixes            |

### Kỹ thuật & Patterns

- **Axios Interceptors** — Tự động attach Bearer token, xử lý 401/403, refresh token
- **Proactive Token Refresh** — Kiểm tra mỗi 2 phút, refresh khi còn < 6 phút hết hạn
- **Multi-tab Sync** — `BroadcastChannel` + `storage` event để đồng bý auth state giữa các tab
- **Role-based Route Guard** — `RoleProtectedRoute` component kiểm tra role trước khi render
- **Centralized Messages** — Tất cả UI strings trong `constants/messages.js`
- **Socket.IO Auto-reconnect** — Kết nối lại tự động với exponential backoff

---

## 📦 Chức năng

### 🔐 Xác thực

- **Đăng ký** tài khoản mới
- **Đăng nhập** — nhận JWT access token + refresh token (HttpOnly cookie)
- **Refresh token tự động** — proactive refresh + on-401 refresh
- **Đăng xuất** — xóa Redux state + localStorage + broadcast đến các tab khác
- **Multi-tab sync** — đăng xuất/refresh token đồng bộ real-time giữa các tab
- **Maintenance mode** — phát hiện backend offline, hiển thị thông báo bảo trì

### 🔗 Quản lý Link rút gọn

- **Tạo link rút gọn** — nhập URL gốc, tùy chọn mật khẩu, thời hạn
- **Xem danh sách link** — phân trang, tìm kiếm, lọc theo trạng thái
- **Xem quota** — số link còn lại có thể tạo trong ngày
- **Thống kê (analytics)** — biểu đồ tạo link theo thời gian
- **Tạo mã QR** — cho mỗi link rút gọn
- **Redirect** — truy cập short URL → điều hướng đến URL gốc

### 👥 Quản lý Nhóm

- **Tạo / Sửa / Xóa nhóm**
- **Thêm / Xóa thành viên** — với vai trò owner, manager, member
- **Thêm / Xóa link** vào nhóm
- **Xem danh sách** thành viên và link trong nhóm

### 🔔 Thông báo Real-time

- **Kết nối Socket.IO** đến WebSocket service
- **Nhận thông báo** real-time (chuông thông báo)
- **Gửi / Broadcast** thông báo (Admin)

### 🛠 Quản trị (Admin)

- **Dashboard** — tổng quan hệ thống
- **Quản lý tài khoản** — danh sách, chi tiết, khóa/mở khóa, xóa
- **Quản lý cấp độ (Levels)** — tạo, sửa, xóa level với các giới hạn
- **Cấu hình hệ thống** — chỉnh sửa config runtime
- **Audit Log** — xem nhật ký thao tác
- **System Health** — kiểm tra sức khỏe hệ thống
- **Gửi thông báo** — gửi/broadcast notification

---

## 🛣 Routing

| Route                      | Trang                    | Quyền    |
| -------------------------- | ------------------------ | -------- |
| `/`                        | Redirect → `/home`       | —        |
| `/home`                    | Tạo & quản lý link       | User+    |
| `/groups`                  | Danh sách nhóm           | User+    |
| `/groups/:groupId/members` | Thành viên nhóm          | User+    |
| `/groups/:groupId/links`   | Link trong nhóm          | User+    |
| `/admin`                   | Dashboard quản trị       | Admin    |
| `/admin/accounts`          | Quản lý tài khoản        | Manager+ |
| `/admin/:id`               | Chi tiết tài khoản       | Admin    |
| `/admin/:id/groups`        | Nhóm của tài khoản       | Admin    |
| `/admin/levels`            | Quản lý cấp độ           | Admin    |
| `/admin/config`            | Cấu hình hệ thống        | Admin    |
| `/admin/audit`             | Audit log                | Admin    |
| `/admin/health`            | System health            | Admin    |
| `/admin/notifications`     | Gửi thông báo            | Admin    |
| `/login`                   | Đăng nhập                | Public   |
| `/register`                | Đăng ký                  | Public   |
| `/s/:shortLink`            | Redirect short URL       | Public   |
| `/not-found`               | Không tìm thấy / hết hạn | Public   |
| `/locked`                  | Tài khoản bị khóa        | Public   |

---

## � Related Repositories

| Repository                 | Mô tả                                  | Link                                                |
| -------------------------- | -------------------------------------- | --------------------------------------------------- |
| **shorter-link-api**       | Backend REST API (NestJS)              | https://github.com/ayana0409/shorter-link-api       |
| **shorter-link-fe**        | Frontend (ReactJS)                     | https://github.com/ayana0409/shorter-link-fe        |
| **shorter-link-websocket** | WebSocket service (NestJS + Socket.IO) | https://github.com/ayana0409/shorter-link-websocket |

**Deploy:** https://shink.onrender.com/

---

## �📄 License

UNLICENSED — Private project.
