# Network Do Gia Dung - Backend API (Bản Tiếng Việt)

Chào mừng bạn đến với Repository Backend của dự án **Network Do Gia Dung**. Hệ thống API được xây dựng với **NestJS**, sử dụng **Prisma ORM** và lưu trữ **MinIO**.

🇺🇸 **[English Version](./README.md)**

---

## 🛠 Công Nghệ Sử Dụng

- **Framework**: [NestJS](https://nestjs.com/) (Node.js).
- **Database**: [PostgreSQL](https://www.postgresql.org/).
- **ORM**: [Prisma](https://www.prisma.io/).
- **Storage**: [MinIO](https://min.io/) (S3 Compatible).
- **Authentication**: JWT & Passport.
- **Documentation**: Swagger (OpenAPI).

---

## 📂 Cá Cấu Trúc Thư Mục

Dự án được tổ chức theo module giúp quản lý dễ dàng:

```plaintext
src/
├── admin/              # Module quản trị viên
├── auth/               # Xác thực, phân quyền (Login, Guards, JWT)
├── categories/         # Quản lý danh mục chung
├── company-intro/      # Thông tin giới thiệu công ty
├── contact-info/       # Thông tin liên hệ (Header/Footer info)
├── contacts/           # Liên hệ khách hàng gửi về
├── mail/               # Service gửi email
├── minio/              # Giao tiếp với MinIO Storage
├── news/               # Quản lý tin tức
├── price-quotes/       # Quản lý yêu cầu báo giá
├── prisma/             # Prisma Module & Service (Database connection)
├── product-categories/ # Danh mục sản phẩm (theo hãng, loại)
├── products/           # Quản lý sản phẩm
├── projects/           # Quản lý dự án
├── quotes/             # Quản lý đơn hàng/báo giá
├── recruitment/        # Quản lý tuyển dụng
├── reviews/            # Đánh giá sản phẩm/dịch vụ
├── services/           # Quản lý dịch vụ
├── statistics/         # Thống kê (Dashboard chart)
├── upload/             # API upload file
├── users/              # Quản lý người dùng
└── main.ts             # Entry point
```

---

## 🚀 Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Hệ Thống

- [Node.js](https://nodejs.org/) (v18 hoặc v20 LTS).
- [Yarn](https://yarnpkg.com/).
- [Docker](https://www.docker.com/) (Tùy chọn cho DB/MinIO).

### 2. Các Bước Cài Đặt

```bash
# Clone và cài đặt
git clone <repository-url>
cd network-dogiadung-be
yarn install
```

### 3. Cấu Hình .env

```bash
cp .env.example .env
```

Cập nhật `DATABASE_URL`, `JWT_SECRET`, và các thông số `MINIO` trong file `.env`.

### 4. Thiết Lập Database & Seed

```bash
# 1. Tạo Prisma Client
yarn prisma:generate

# 2. Chạy Migration
yarn prisma:migrate dev

# 3. Tạo dữ liệu mẫu (Seeding)
# Chọn MỘT trong hai lệnh sau bài tùy vào nhu cầu:

# Cách A: Seed TOÀN BỘ dữ liệu mẫu (Sản phẩm, Tin tức, Review...)
yarn prisma:seed

# Cách B: Seed dữ liệu CỐT LÕI (Chỉ thông tin liên hệ công ty)
yarn prisma:seed:essential
```

---

## 📜 Các Lệnh Thường Dùng

| Lệnh | Mô tả |
| :--- | :--- |
| `yarn dev` | Chạy phát triển (Watch mode). |
| `yarn build` | Build production. |
| `yarn start:prod` | Chạy bản build production. |
| `yarn lint` | Kiểm tra lỗi code. |
| `yarn prisma:studio` | Giao diện quản lý DB. |
| `yarn prisma:seed:all` | Seed toàn bộ dữ liệu mẫu một cách tường minh. |

---

## 🛠 Quản Lý Cơ Sở Dữ Liệu

### Reset Database (Làm mới hoàn toàn)

**Cảnh báo: Lệnh này sẽ xóa sạch dữ liệu cũ.**

```bash
yarn prisma migrate reset --force
```

### Khi sửa đổi Schema

Nếu sửa file `prisma/schema.prisma`:

```bash
yarn prisma migrate dev --name <mo_ta>
```

---

## 📚 Tài Liệu API (Swagger)

- **Development**: [http://localhost:4000/docs](http://localhost:4000/docs)
- **Production**: Tự động tắt vì lý do bảo mật.

---

**© 2024 Network Do Gia Dung Backend Team**
