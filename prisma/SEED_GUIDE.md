# Hướng Dẫn Seed Dữ Liệu

## Giới thiệu

File `prisma/seed.ts` giúp bạn tạo dữ liệu mẫu cho database một cách nhanh chóng. Script này sử dụng thư viện `@faker-js/faker` để tạo dữ liệu ngẫu nhiên và sinh động.

## Dữ liệu được tạo

Script sẽ tạo **60 records** cho các bảng sau (trừ bảng `users`):

| Bảng | Số lượng | Mô tả |
|------|----------|-------|
| **Categories** | 10 | Danh mục sản phẩm (Thiết bị điện, Chiếu sáng, An toàn điện...) |
| **Products** | 10 | Sản phẩm điện (Quạt trần, Đèn LED, Ổ cắm...) |
| **Services** | 10 | Dịch vụ (Thi công điện, Bảo trì, Tư vấn...) |
| **Product Categories** | 10 | Danh mục sản phẩm theo thương hiệu (Panasonic, Schneider...) |
| **Project Categories** | 10 | Danh mục dự án (Dân dụng, Công nghiệp, Thương mại...) |
| **Projects** | 10 | Dự án đã thực hiện (Chung cư, Nhà máy, Trung tâm thương mại...) |

## Cách sử dụng

### 1. Chạy seed lần đầu

```bash
# Sử dụng yarn
yarn prisma:seed

# Hoặc sử dụng npm
npm run prisma:seed

# Hoặc chạy trực tiếp
npx prisma db seed
```

### 2. Reset database và seed lại

⚠️ **CẢNH BÁO**: Lệnh này sẽ **XÓA TOÀN BỘ DỮ LIỆU** trong database!

```bash
# Reset database và chạy seed tự động
npx prisma migrate reset

# Hoặc thủ công
npx prisma migrate reset --skip-seed  # Reset không seed
yarn prisma:seed                       # Sau đó seed thủ công
```

### 3. Xem dữ liệu đã tạo

```bash
# Mở Prisma Studio để xem dữ liệu
yarn prisma:studio

# Hoặc
npx prisma studio
```

## Các lệnh hữu ích

```bash
# Chạy seed
yarn prisma:seed

# Xem dữ liệu trong Prisma Studio
yarn prisma:studio

# Reset database (xóa tất cả dữ liệu)
npx prisma migrate reset

# Generate Prisma Client
yarn prisma:generate

# Tạo migration mới
yarn prisma:migrate
```

## Tùy chỉnh dữ liệu seed

### Thay đổi số lượng records

Mở file `prisma/seed.ts` và chỉnh sửa:

```typescript
// Thay đổi từ 10 thành số lượng bạn muốn
for (let i = 0; i < 20; i++) {  // Tạo 20 records thay vì 10
  // ...
}
```

### Thêm dữ liệu cho bảng User

Nếu bạn muốn thêm dữ liệu mẫu cho bảng `users`, thêm đoạn code sau vào `prisma/seed.ts`:

```typescript
// Seed Users (5 records)
console.log('[object Object].');
const bcrypt = require('bcryptjs');

for (let i = 0; i < 5; i++) {
  await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: await bcrypt.hash('password123', 10),
      role: faker.helpers.arrayElement(['ADMIN', 'USER', 'MANAGER']),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
      avtUrl: faker.image.avatar(),
    },
  });
}
console.log('✅ Đã tạo 5 users\n');
```

## Xử lý lỗi thường gặp

### Lỗi: "Unique constraint failed"

Nếu bạn chạy seed nhiều lần và gặp lỗi trùng dữ liệu:

**Giải pháp**: Reset database trước khi seed lại
```bash
npx prisma migrate reset
```

### Lỗi: "Foreign key constraint failed"

Đảm bảo bạn tạo dữ liệu theo đúng thứ tự:
1. Categories trước
2. Products sau (vì Products cần categoryId)
3. Project Categories trước
4. Projects sau (vì Projects cần categoryId)

## Tài liệu tham khảo

- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
- [Faker.js Documentation](https://fakerjs.dev/)
- [TypeScript Node Documentation](https://typestrong.org/ts-node/)

