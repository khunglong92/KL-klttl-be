import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Bắt đầu reset bảng Products và Services...\n');

  try {
    // Xóa ProductLike trước (có foreign key với Product)
    console.log('Xóa ProductLikes...');
    const deletedProductLikes = await prisma.productLike.deleteMany();
    console.log(`✅ Đã xóa ${deletedProductLikes.count} product likes\n`);

    // Xóa Products (sau khi xóa ProductLikes)
    console.log('Xóa Products...');
    const deletedProducts = await prisma.product.deleteMany();
    console.log(`✅ Đã xóa ${deletedProducts.count} products\n`);

    // Xóa Services (không có foreign key constraint)
    console.log('Xóa Services...');
    const deletedServices = await prisma.service.deleteMany();
    console.log(`✅ Đã xóa ${deletedServices.count} services\n`);

    console.log('🎉 Hoàn thành reset bảng Products và Services!\n');
    console.log('📊 Tổng kết:');
    console.log(`   - ProductLikes: ${deletedProductLikes.count} records`);
    console.log(`   - Products: ${deletedProducts.count} records`);
    console.log(`   - Services: ${deletedServices.count} records`);
    console.log(
      `   - Tổng cộng: ${
        deletedProductLikes.count +
        deletedProducts.count +
        deletedServices.count
      } records đã bị xóa\n`,
    );
  } catch (error) {
    console.error('❌ Lỗi khi reset dữ liệu:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi không mong muốn:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
