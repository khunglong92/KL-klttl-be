
# Hướng Dẫn Quản Lý Database với Prisma

Tài liệu này hướng dẫn chi tiết cách quản lý database, migration và seeding dữ liệu cho dự án Network Do Gia Dung.

## 1. Cài Đặt Ban Đầu

Đảm bảo bạn đã cấu hình kết nối database trong file `.env` ở thư mục gốc dự án:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/network_dogiadung?schema=public"
```

## 2. Các Lệnh Thường Dùng

### Khởi tạo & Cập nhật Schema
Sử dụng khi bạn thay đổi nội dung file `schema.prisma`.

```bash
# 1. Tạo Prisma Client (để code backend hiểu schema mới)
yarn prisma:generate

# 2. Tạo migration mới và áp dụng vào DB (Development)
yarn prisma:migrate dev --name them_bang_moi
```

### Áp dụng Migration (Production)
Sử dụng khi deploy lên server thật (không tạo file migration mới, chỉ chạy những cái đã có).

```bash
yarn prisma:migrate:deploy
```

### Xem Database (Prisma Studio)
Công cụ giao diện trực quan để xem và sửa dữ liệu trực tiếp.

```bash
yarn prisma:studio
```

## 3. Seed Dữ Liệu (Tạo dữ liệu mẫu)

Dự án có sẵn script để tạo dữ liệu mẫu (fake data) giúp việc phát triển và kiểm thử dễ dàng hơn.

### Chạy Seed
Lệnh này sẽ xóa dữ liệu cũ (nếu script được viết như vậy) và thêm dữ liệu mới.

```bash
yarn prisma:seed
```

**Dữ liệu được tạo bao gồm:**
- Categories (Danh mục sản phẩm)
- Products (Sản phẩm điện, kèm Reviews)
- Services (Dịch vụ)
- Projects (Dự án đã làm)
- News (Tin tức)
- Recruitment (Tin tuyển dụng)
- Users (Admin, Manager, User) - *Mặc định password thường là `password123` hoặc cấu hình trong seed*

### Reset Database (Xóa sạch & Cài lại)
Dùng khi database bị lỗi đồng bộ hoặc bạn muốn làm mới hoàn toàn (XÓA HẾT DỮ LIỆU CŨ).

```bash
yarn prisma migrate reset --force
```
*Lưu ý: Lệnh này sẽ tự động chạy seed sau khi reset xong.*

## 4. Xử Lý Sự Cố Thường Gặp

### Lỗi "Migration history is out of sync"
Xảy ra khi bạn xóa file migration thủ công hoặc sửa đổi database trực tiếp.
**Giải pháp**: Reset lại database.
```bash
yarn prisma migrate reset --force
```

### Lỗi "Cannot find module '@prisma/client'"
Xảy ra khi mới clone project hoặc sau khi cập nhật thư viện.
**Giải pháp**:
```bash
yarn prisma:generate
```

### Lỗi kết nối Database
Kiểm tra kỹ `DATABASE_URL` trong file `.env`. Đảm bảo Docker (nếu dùng) đang chạy.
