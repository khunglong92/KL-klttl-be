import { PrismaClient, Category } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { servicesSeedData } from './services-seed-data';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Interface cho category với keywords
interface CategoryWithKeywords extends Category {
  keywords: string[];
}

// Hàm tạo ảnh ngẫu nhiên với từ khóa
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getImageUrl(_keywords: string[]): string {
  // Sử dụng picsum.photos hoặc placeholder.com
  return `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/640/480`;
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...\n');

  // Xóa dữ liệu cũ để tránh lỗi unique constraint
  console.log('🗑️  Xóa dữ liệu cũ...');
  await prisma.review.deleteMany();
  await prisma.project.deleteMany();

  await prisma.productCategory.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.news.deleteMany();
  await prisma.recruitment.deleteMany();
  await prisma.priceQuote.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ Xóa dữ liệu cũ thành công.\n');

  // 0. Seed Admin User
  console.log('👤 Tạo Admin User...');
  const adminPassword = await import('bcryptjs').then((m) =>
    m.hash('123456', 10),
  );
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Đã tạo Admin User (admin@gmail.com / 123456)\n');

  // 1. Seed Categories (10 records)
  const seedMode = process.env.SEED_MODE || 'all';

  if (seedMode === 'all') {
    console.log('📁 Tạo Categories...');
    const categories: CategoryWithKeywords[] = [];
    const categoryNames = [
      {
        name: 'Thiết bị điện gia dụng',
        keywords: ['fan', 'vacuum', 'kitchen'],
      },
      { name: 'Thiết bị chiếu sáng', keywords: ['lamp', 'light', 'led'] },
      {
        name: 'Thiết bị an toàn điện',
        keywords: ['circuit', 'safety', 'breaker'],
      },
      { name: 'Dây cáp điện', keywords: ['cable', 'wire', 'electric'] },
      { name: 'Ổ cắm và công tắc', keywords: ['socket', 'switch', 'outlet'] },
      {
        name: 'Thiết bị đo lường điện',
        keywords: ['meter', 'voltage', 'tester'],
      },
      {
        name: 'Thiết bị tự động hóa',
        keywords: ['automation', 'robot', 'control'],
      },
      {
        name: 'Thiết bị bảo vệ điện',
        keywords: ['surge', 'protector', 'fuse'],
      },
      { name: 'Phụ kiện điện', keywords: ['plug', 'adapter', 'connector'] },
      {
        name: 'Thiết bị điện công nghiệp',
        keywords: ['industrial', 'factory', 'machine'],
      },
    ];

    for (let i = 0; i < categoryNames.length; i++) {
      const cat = categoryNames[i];
      const category = await prisma.category.create({
        data: {
          name: cat.name,
          description: faker.commerce.productDescription(),
          updatedByUserId: faker.number.int({ min: 1, max: 5 }),
          updatedByName: faker.person.fullName(),
          orderIndex: i, // Added orderIndex
        },
      });
      categories.push({ ...category, keywords: cat.keywords });
    }
    console.log(`✅ Đã tạo ${categories.length} categories\n`);

    // 2. Seed Products (30 products per category = 300 total)
    console.log('📦 Tạo Products...');
    let totalProducts = 0;
    let totalReviews = 0;
    for (const category of categories) {
      for (let i = 0; i < 30; i++) {
        const productName = `${faker.commerce.productName()} - ${category.name}`;
        const product = await prisma.product.create({
          data: {
            name: productName,
            description: [
              faker.commerce.productAdjective(),
              faker.commerce.productDescription(),
              faker.lorem.sentence(),
            ],
            detailedDescription: `product-details/${faker.string.uuid()}.txt`,
            price: faker.commerce.price({ min: 50000, max: 10000000, dec: 0 }),
            showPrice: faker.datatype.boolean(0.8),
            images: [
              getImageUrl(category.keywords),
              getImageUrl(category.keywords),
              getImageUrl(category.keywords),
            ],
            categoryId: category.id,
            isFeatured: faker.datatype.boolean(0.3), // 30% chance of being featured
          },
        });

        // Seed 2-5 reviews for each product
        const reviewCount = faker.number.int({ min: 2, max: 5 });
        for (let j = 0; j < reviewCount; j++) {
          await prisma.review.create({
            data: {
              name: faker.person.fullName(),
              email: faker.internet.email(),
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 3, max: 5 }),
              targetType: 'PRODUCT',
              targetId: product.id,
            },
          });
          totalReviews++;
        }

        totalProducts++;
      }
    }
    console.log(
      `✅ Đã tạo ${totalProducts} products và ${totalReviews} reviews\n`,
    );

    // 3. Seed Services
    console.log('⚡ Tạo Services...');
    for (let i = 0; i < servicesSeedData.length; i++) {
      const service = servicesSeedData[i];
      await prisma.service.create({
        data: {
          ...service,
          orderIndex: i, // Added orderIndex
        },
      });
    }
    console.log(`✅ Đã tạo ${servicesSeedData.length} services\n`);

    // 5. Seed Projects (20 projects)
    console.log('🏗️  Tạo Projects...');
    const projectNames = [
      'Nhà máy sản xuất linh kiện điện tử Hà Nội',
      'Trung tâm thương mại Saigon Square',
      'Toà nhà văn phòng Lotte Center Hà Nội',
      'Bệnh viện Đại học Y Dược TP.HCM',
      'Khu công nghiệp Quế Võ Bắc Ninh',
      'Khách sạn 5 sao Melia Hà Nội',
      'Nhà máy điện tử Samsung Thái Nguyên',
      'Trung tâm mua sắm Vincom Mega Mall',
      'Toà nhà văn phòng Bitexco Financial Tower',
      'Trường đại học Kinh tế Quốc dân',
      'Nhà máy sản xuất dây cáp Hải Phòng',
      'Khu đô thị sinh thái Ecopark',
      'Bệnh viện Quân y 103',
      'Nhà máy sản xuất thiết bị điện Bắc Giang',
      'Trung tâm thương mại Aeon Mall Tân Phú',
      'Toà nhà văn phòng Vietcombank Tower',
      'Khu công nghiệp Yên Phong Bắc Ninh',
      'Khách sạn Sheraton Hà Nội',
      'Nhà máy sản xuất công tắc ổ cắm Đà Nẵng',
      'Trung tâm mua sắm Crescent Mall',
    ];

    const projectDescriptions = [
      'Dự án thi công hệ thống điện nhẹ, điện động lực và hệ thống chiếu sáng LED tiết kiệm năng lượng.',
      'Triển khai hệ thống điện thông minh với công nghệ IoT và quản lý năng lượng tự động.',
      'Lắp đặt hệ thống phòng cháy chữa cháy, an ninh điện và hệ thống UPS dự phòng.',
      'Thi công hạng mục điện cho khu công nghiệp với công suất lớn và độ tin cậy cao.',
      'Lắp đặt hệ thống điện mặt trời kết hợp với lưới điện chính.',
      'Thi công hệ thống điều hòa không khí, thông gió và điều khiển tự động.',
      'Lắp đặt hệ thống cáp quang, mạng LAN và hệ thống viễn thông.',
      'Thi công hệ thống báo cháy, báo động và hệ thống an ninh tích hợp.',
      'Lắp đặt hệ thống máy phát điện dự phòng và bộ lưu điện UPS công suất lớn.',
      'Thi công hệ thống chiếu sáng ngoài trời và trang trí kiến trúc.',
    ];

    let totalProjects = 0;
    for (let i = 0; i < 20; i++) {
      const projectName = projectNames[i];

      await prisma.project.create({
        data: {
          title: projectName,
          shortDescription: projectDescriptions[i % projectDescriptions.length],
          detailedDescription: faker.lorem.paragraphs(3, '\n\n'),
          images: [
            getImageUrl(['project', 'construction']),
            getImageUrl(['project', 'architecture']),
            getImageUrl(['project', 'engineering']),
          ],
          isFeatured: i < 5, // First 5 projects are featured
          isActive: true,
        },
      });
      totalProjects++;
    }
    console.log(`✅ Đã tạo ${totalProjects} projects\n`);

    // Seed Company Intro
    console.log('🏢 Tạo dữ liệu giới thiệu công ty...');
    const companyIntros = [
      {
        url: 'https://plus.unsplash.com/premium_photo-1664297997167-88170c57bc35?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description: 'GIỚI THIỆU CÔNG TY – TẦM NHÌN & SỨ MỆNH',
        orderIndex: 1,
        isActive: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1585204630262-84278b4d8b00?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description: 'NHÀ XƯỞNG – TRANG THIẾT BỊ HIỆN ĐẠI',
        orderIndex: 2,
        isActive: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1758271613743-748b409c196b?q=80&w=1750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description: 'ĐỘI NGŨ KỸ SƯ – NHÂN SỰ CHỦ CHỐT',
        orderIndex: 3,
        isActive: true,
      },
    ];

    for (const intro of companyIntros) {
      await prisma.companyIntro.create({ data: intro });
    }
    console.log(`✅ Đã tạo ${companyIntros.length} mục giới thiệu công ty\n`);

    // Seed Contact Info

    // 5. Seed News
    console.log('📰 Tạo Tin tức...');
    const newsData = [];

    // 1. Specific Featured Article
    newsData.push({
      title:
        'BUỒNG PHUN BI – PHUN CÁT TUẦN HOÀN: CHIẾN BINH MỚI TRONG GIA CÔNG KIM LOẠI THÀNH TIẾN',
      subtitle:
        'Bứt tốc công nghệ, nâng tầm sản xuất – Thành Tiến chính thức đưa vào vận hành phòng phun bi – phun cát tuần hoàn hiện đại. Đây là bước đầu tư quan trọng giúp tối ưu quy trình xử lý bề mặt kim loại, nâng cao độ bền và thẩm mỹ cho từng sản phẩm trước khi hoàn thiện.',
      image:
        'https://images.unsplash.com/photo-1565008447742-d360e2277d34?q=80&w=2674&auto=format&fit=crop', // Industrial metal work
      isFeatured: true,
      isActive: true,
      contentSections: [
        {
          title: 'Máy phun cát là gì?',
          description:
            'Máy phun cát là thiết bị sử dụng hạt mài phun với áp lực cao để làm sạch bề mặt kim loại. Công nghệ này giúp loại bỏ rỉ sét, dầu mỡ, tạp chất, đồng thời tạo độ nhám đồng đều, tăng khả năng bám dính sơn và kéo dài tuổi thọ sản phẩm.',
          image:
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop', // Machine
        },
        {
          title: 'Tái sinh bề mặt kim loại nâng cao chất lượng sản phẩm',
          description:
            'Với hệ thống phun cát tuần hoàn khép kín, bề mặt kim loại được làm sạch sâu và đồng nhất. Mỗi chi tiết sau xử lý đều đạt chuẩn kỹ thuật, sẵn sàng cho các công đoạn sơn phủ, mạ hoặc hoàn thiện tiếp theo, đảm bảo độ bền lâu dài trong môi trường khắc nghiệt.',
        },
        {
          title: 'Trang bị công nghệ phun bi – phun cát hiện đại',
          description:
            'Phòng phun tại Thành Tiến được trang bị thiết bị phun bi, phun cát công nghệ cao, cho phép xử lý chính xác đến từng chi tiết nhỏ. Bề mặt sau phun đạt độ nhám tiêu chuẩn, tăng tính thẩm mỹ và nâng cao chất lượng tổng thể của sản phẩm kim loại.',
          image:
            'https://images.unsplash.com/photo-1621905208291-092c696e5743?q=80&w=2670&auto=format&fit=crop', // Welding/Industrial
        },
        {
          title: 'Đáp ứng đa dạng vật liệu và kích thước',
          description:
            'Hệ thống phun cát được thiết kế linh hoạt, phù hợp với nhiều loại vật liệu và kích thước khác nhau. Từ các sản phẩm nhỏ đến kết cấu lớn như cửa cổng, thùng xe ô tô, vỏ tàu thuyền hay chi tiết công nghiệp nặng đều có thể xử lý hiệu quả.',
        },
        {
          title: 'Tích hợp hệ thống thu hồi bụi và cát tự động',
          description:
            'Quy trình phun bi, phun cát tại Thành Tiến được tích hợp hệ thống thu hồi bụi tự động. Bụi bẩn được tách lọc hiệu quả, cát dư được thu hồi, giúp tiết kiệm vật liệu, giảm hao phí và giữ môi trường làm việc sạch sẽ, an toàn.',
        },
        {
          title: 'Tối ưu năng suất và tốc độ sản xuất',
          description:
            'Phòng phun hiện đại giúp rút ngắn thời gian xử lý bề mặt, đồng bộ chất lượng giữa các sản phẩm. Nhờ đó, Thành Tiến có thể đáp ứng tốt các đơn hàng số lượng lớn, yêu cầu tiến độ gấp mà vẫn đảm bảo tiêu chuẩn kỹ thuật cao.',
          image:
            'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2670&auto=format&fit=crop', // Factory line
        },
        {
          title: 'Công nghệ hiện đại – Thân thiện môi trường',
          description:
            'Hệ thống tủ hút bụi công suất lớn kết hợp rũ bụi tự động bằng khí nén giúp hạn chế tối đa bụi phát tán ra môi trường. Giải pháp này không chỉ đảm bảo an toàn cho người lao động mà còn đáp ứng các yêu cầu về sản xuất xanh, bền vững.\n\nViệc đưa buồng phun bi – phun cát tuần hoàn vào vận hành là minh chứng cho định hướng đầu tư bài bản và dài hạn của Thành Tiến. Mỗi bước cải tiến công nghệ đều hướng đến mục tiêu nâng cao chất lượng sản phẩm và mang lại giải pháp gia công kim loại chính xác – bền đẹp – đạt chuẩn cho khách hàng.',
        },
      ],
      createdAt: new Date(),
    });

    // 2. Generic News
    const genericNews = Array.from({ length: 15 }).map(() => {
      const title = faker.lorem.sentence({ min: 6, max: 12 });
      return {
        title: title.replace(/\.$/, ''),
        subtitle: faker.lorem.sentences(2),
        image: `https://images.unsplash.com/photo-${faker.helpers.arrayElement(['1581091226825-a6a2a5aee158', '1504917595217-d4dc5ebe6122', '1565008447742-d360e2277d34', '1621905208291-092c696e5743', '1535191030432-843c081d054d'])}?q=80&w=800&auto=format&fit=crop`,
        isFeatured: faker.datatype.boolean({ probability: 0.2 }),
        isActive: true,
        contentSections: [
          {
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraphs(2),
            image: `https://images.unsplash.com/photo-${faker.helpers.arrayElement(['1581091226825-a6a2a5aee158', '1504917595217-d4dc5ebe6122', '1565008447742-d360e2277d34'])}?q=80&w=800&auto=format&fit=crop`,
          },
          {
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraphs(2),
          },
        ],
        createdAt: faker.date.past(),
      };
    });

    newsData.push(...genericNews);

    for (const news of newsData) {
      await prisma.news.create({
        data: news,
      });
    }
    console.log(`✅ Đã tạo ${newsData.length} tin tức\n`);

    // 6. Seed Recruitment
    console.log('👥 Tạo Tin tuyển dụng...');
    const recruitmentData = [];

    // 1. Specific Recruitment Article
    recruitmentData.push({
      title: 'THÀNH TIẾN TUYỂN DỤNG THÁNG 8/2025',
      subtitle:
        'Tháng 8/2025, Công ty TNHH Sản Xuất Thương Mại Thành Tiến tuyển dụng nhiều vị trí làm việc tại TP. Hà Nội và TP. Hồ Chí Minh. Chúng tôi chào đón các ứng viên có tinh thần trách nhiệm, cầu tiến và mong muốn phát triển cùng doanh nghiệp.',
      image:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2000&auto=format&fit=crop', // Business team
      isFeatured: true,
      isActive: true,
      contentSections: [
        {
          title: 'CÁC VỊ TRÍ TUYỂN DỤNG TẠI HÀ NỘI',
          description: `04 Nam – Kỹ thuật hiện trường
04 Nam – Thợ bảo hành / Hà Nội, Đi công trình các tỉnh miền Bắc
03 Nữ – Kế toán công nợ / Hà Nội
03 Nam/Nữ – Trợ lý kinh doanh / Hà Nội
10 Nam /1 Nữ – Lao động phổ thông / Hà Nội`,
        },
        {
          title: 'CÁC VỊ TRÍ TUYỂN DỤNG TẠI VĨNH TƯỜNG – PHÚ THỌ',
          description: `01 Nam kỹ thuật sản xuất
15 Nam/Nữ lao động phổ thông`,
        },
        {
          title: 'CÁC VỊ TRÍ TUYỂN DỤNG TẠI TP. HCM',
          description: `01 Nhân viên hành chính – kế toán
02 Nhân viên thị trường`,
        },
        {
          title: 'CHI TIẾT: 04 Nam – Kỹ thuật hiện trường',
          description: `**Mô tả công việc**
- Chịu trách nhiệm quản lý khu vực được phân công giám sát như: kỹ thuật thi công, tiến độ thi công, nhân công đội khoán, chất lượng và theo dõi hồ sơ
- Quyết toán lại tiền chi phí công trường cho bộ phận kế toán/ hoặc thư ký công trình.
- Tổng kết vật tư, dụng cụ thi công xuất và nhập

**Yêu cầu**
- Trình độ: Cao đẳng trở lên các ngành: Xây dựng / Kỹ thuật / Cơ khí hoặc liên quan,…
- Sẵn sàng đi công trình ở các tỉnh miền Bắc
- Nhanh nhẹn, trách nhiệm, chịu được áp lực công việc`,
        },
        {
          title: 'CHI TIẾT: 04 Nam – Thợ bảo hành',
          description: `**Mô tả công việc**
- Xử lý bảo hành, sửa chữa các lỗi sản phẩm cửa
- Lắp đặt cửa các công trình lẻ
- Hỗ trợ xử lý bàn giao các dự án cửa: Sửa chữa, lắp đặt, sơn bả,…

**Yêu cầu**
- Nam tốt nghiệp THPT trở lên, độ tuổi từ 18 – 45…
- Sẵn sàng đi công trình các tỉnh miền Bắc (theo phân công).
- Sức khỏe tốt, có trách nhiệm trong công việc.
- Thời gian làm việc: 7h30 -17h (8h/ngày, thứ 2 – thứ 7).`,
        },
        {
          title: 'CHI TIẾT: 03 Nữ – Kế toán công nợ',
          description: `**Mô tả công việc**
- Soạn thảo hợp đồng bán hàng, hợp đồng kinh tế theo đề xuất của kinh doanh.
- Tiếp nhận đơn đặt hàng sau khi ký hợp đồng, đơn hàng được khách hàng xác nhận.
- Hoàn thiện các giấy tờ liên quan đến đơn hàng

**Yêu cầu**
- Tốt nghiệp chuyên ngành Kế toán hoặc tương đương
- Thành thạo tin học văn phòng
- Thành thạo phần mềm kế toán MISA
- Có khả năng làm việc độc lập và làm việc nhóm`,
        },
        {
          title: 'CHI TIẾT: 01 Nam/Nữ – Digital Marketing',
          description: `**Mô tả công việc**
- Chịu trách nhiệm về quản trị các kênh truyền thông, quảng cáo cho sản phẩm và thương hiệu của công ty.
- Lên kế hoạch (quản lý và phân bổ ngân sách) và triển khai các chiến dịch quảng cáo hàng tháng/quý/năm của công ty.
- Theo dõi, đo lường và báo cáo đánh giá hiệu quả hoạt động của các kênh quảng cáo và đưa ra các giải pháp tối ưu ngân sách, tỷ lệ chuyển đổi quảng cáo với cấp trên.
- Định hướng content quảng cáo, content quản trị. Kết hợp với team Content, Design sáng tạo ra nội dung hiệu quả để chạy quảng cáo kết quả tốt.
- Phối hợp cùng bộ phận chăm sóc khách hàng (Customer Service) thực hiện khai thác và nâng cao tỷ lệ chuyển đổi.
- Nghiên cứu và phân tích hoạt động marketing của đối thủ, tìm ra lợi thế cạnh tranh và định hướng truyền thông.
- Cập nhật các kênh truyền thông xã hội, công nghệ web và xu hướng Digital Marketing mới nhất áp dụng vào công ty.

**Yêu cầu công việc**
- Đại học, Chuyên ngành marketing, truyền thông, công nghệ, kinh tế ….
- Có 01 năm kinh nghiệm tại vị trí tương đương..
- Am hiểu về các hình thức quảng cáo và tư duy quảng cáo.
- Có kiến thức về SEO, Google Analylist và webmaster Tool là một lợi thế.
- Nắm vững các quy định Pháp luật liên quan đến hoạt động marketing.`,
          image:
            'https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=2670&auto=format&fit=crop', // Marketing meeting
        },
        {
          title: 'CHI TIẾT: 02 Nữ – Thực tập sinh Pháp chế',
          description: `**Mô tả công việc**
- Tiếp cận công việc soạn thảo hợp đồng
- Tư vấn pháp lý

**Yêu cầu công việc**
- Đã tốt nghiệp các chuyên ngành Luật, không yêu cầu kinh nghiệm
- Có định hướng làm pháp chế doanh nghiệp lâu dài, mục tiêu nghề nghiệp rõ ràng
- Sử dụng thành thạo tin học văn phòng`,
        },
        {
          title: 'CHI TIẾT: 01 Nam kỹ thuật sản xuất',
          description: `**Mô tả công việc**
- Triển khai bóc tách chi tiết bản vẽ chuyển xuống bộ phận xưởng sản xuất.
- Thực hiện các công việc khác theo yêu cầu.
- Trao đổi chi tiết các công việc khi phỏng vấn.

**Yêu cầu công việc**
- Bằng cấp: Cao đẳng, Đại học.
- Ưu tiên có kinh nghiệm, chuyên ngành cơ khí.- Thành thạo AutoCad và Solidworks hoặc phần mềm 3D khác
- Có tinh thần học hỏi, có trách nhiệm, nhanh nhẹn, giao tiếp tốt…
- Có thể làm tăng ca, đi làm chủ nhật khi có yêu cầu.`,
          image:
            'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2670&auto=format&fit=crop', // Engineer
        },
        {
          title: 'HÌNH THỨC ỨNG TUYỂN',
          description: `Gửi CV về email: tuyendung.thanhtienhn@gmail.com
Liên hệ phòng nhân sự: 0976.278.031 (Ms Linh)`,
        },
      ],
      createdAt: new Date(),
    });

    // 2. Generic Recruitment
    const genericRecruitment = Array.from({ length: 10 }).map(() => {
      const title = 'Tuyển dụng ' + faker.person.jobTitle();
      return {
        title: title,
        subtitle: faker.lorem.sentences(2),
        image: `https://images.unsplash.com/photo-${faker.helpers.arrayElement(['1521737604893-d14cc237f11d', '1552581234-26160f608093', '1581093458791-9f3c3900df4b', '1568992685965-43344360d0d4'])}?q=80&w=800&auto=format&fit=crop`,
        isFeatured: faker.datatype.boolean({ probability: 0.2 }),
        isActive: true,
        contentSections: [
          {
            title: 'Mô tả công việc',
            description: faker.lorem.paragraphs(2),
          },
          {
            title: 'Yêu cầu',
            description: faker.lorem.paragraphs(2),
          },
          {
            title: 'Quyền lợi',
            description: faker.lorem.paragraphs(1),
          },
        ],
        createdAt: faker.date.past(),
      };
    });

    recruitmentData.push(...genericRecruitment);

    for (const item of recruitmentData) {
      await prisma.recruitment.create({
        data: item,
      });
    }
    console.log(`✅ Đã tạo ${recruitmentData.length} tin tuyển dụng\n`);

    // 7. Seed Price Quotes
    console.log('💲 Tạo Báo giá...');
    const priceQuoteData = [];

    // 1. Specific Price List
    priceQuoteData.push({
      title: 'BẢNG BÁO GIÁ CỬA CHỐNG CHÁY, CỬA THÉP CÔNG NGHIỆP 2025',
      subtitle:
        'Thành Tiến xin gửi tới Quý khách hàng bảng báo giá cửa chống cháy, cửa thép công nghiệp mới nhất năm 2025. Bảng giá đã bao gồm chi phí vật tư, phụ kiện và nhân công lắp đặt, cam kết giá cạnh tranh nhất thị trường.',
      image:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2674&auto=format&fit=crop',
      isFeatured: true,
      isActive: true,
      contentSections: [
        {
          title: 'Bảng giá Cửa chống cháy',
          description:
            'Cửa chống cháy 60 phút: 1.800.000 VNĐ/m2\nCửa chống cháy 90 phút: 2.000.000 VNĐ/m2\nCửa chống cháy 120 phút: 2.200.000 VNĐ/m2\n\n*Giá chưa bao gồm phụ kiện và VAT.',
          image:
            'https://images.unsplash.com/photo-1595844856691-030da6fc1472?q=80&w=2000&auto=format&fit=crop',
        },
        {
          title: 'Bảng giá Phụ kiện',
          description:
            '- Khóa tay gạt: 350.000 VNĐ/bộ\n- Tay co thủy lực: 450.000 VNĐ/chiếc\n- Thanh thoát hiểm: 1.200.000 VNĐ/thanh\n- Kính chống cháy: Liên hệ',
        },
        {
          title: 'Lưu ý khi đặt hàng',
          description:
            '1. Đơn giá trên áp dụng cho các đơn hàng có khối lượng > 50m2.\n2. Thời gian giao hàng: 15-20 ngày kể từ ngày chốt bản vẽ kỹ thuật.\n3. Bảo hành sản phẩm 12 tháng theo tiêu chuẩn nhà sản xuất.',
        },
      ],
      createdAt: new Date(),
    });

    // 2. Generic Price Quotes
    const genericPriceQuotes = Array.from({ length: 8 }).map(() => {
      return {
        title: 'Báo giá ' + faker.commerce.productName(),
        subtitle: faker.lorem.sentence(),
        image: `https://images.unsplash.com/photo-${faker.helpers.arrayElement(['1513828583680-498c8d8f0f35', '1454165804606-c3d57bc86b40', '1580913428706-c311abaf487b'])}?q=80&w=800&auto=format&fit=crop`,
        isFeatured: faker.datatype.boolean({ probability: 0.3 }),
        isActive: true,
        contentSections: [
          {
            title: 'Chi tiết giá',
            description:
              faker.commerce.productDescription() +
              '\n\nGiá tham khảo: ' +
              faker.commerce.price({
                min: 100000,
                max: 10000000,
                symbol: 'VNĐ',
              }),
            image: `https://images.unsplash.com/photo-${faker.helpers.arrayElement(['1513828583680-498c8d8f0f35', '1454165804606-c3d57bc86b40'])}?q=80&w=800&auto=format&fit=crop`,
          },
          {
            title: 'Chính sách bảo hành',
            description: faker.lorem.paragraph(),
          },
        ],
        createdAt: faker.date.past(),
      };
    });

    priceQuoteData.push(...genericPriceQuotes);

    for (const item of priceQuoteData) {
      await prisma.priceQuote.create({
        data: item,
      });
    }
    console.log(`✅ Đã tạo ${priceQuoteData.length} báo giá\n`);
  }

  // Seed Contact Info (Always seed)
  console.log('📞 Tạo thông tin liên hệ...');
  await prisma.contactInfo.deleteMany();

  const contactInfo = {
    companyName: 'CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI CƠ KHÍ THIÊN LỘC',
    address: 'Thôn Đan Nhiễm, Xã Khánh Hà, Huyện Thường Tín, Thành phố Hà Nội',
    phone: '0967853833',
    email: 'kimloaitamthienloc@gmail.com',
    workingHours: 'Thứ 2 - Thứ 7: 8:00 - 17:30',
    googleMapUrl:
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3722.21422816136!2d105.78172187545887!3d21.1040236851889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab0502d70607%3A0x9ea3437f85caec8e!2zTmjDoCBWxINuIGjDs2EgVGjDtG4gVsO1bmcgTGE!5e0!3m2!1svi!2s!4v1767061533502!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    foundingDate: new Date('2020-01-01'),
    companyType: 'Công ty TNHH',
    aboutUs: `
      <p><strong>CÔNG TY TNHH SẢN XUẤT VÀ GIA CÔNG KIM LOẠI TẤM THIÊN LỘC</strong> là đơn vị hàng đầu trong lĩnh vực sản xuất và gia công kim loại tấm tại Việt Nam.</p>
      <p>Với hơn 10 năm kinh nghiệm cùng đội ngũ kỹ thuật viên tay nghề cao, chúng tôi cam kết mang đến sản phẩm chất lượng, chính xác và bền vững, đáp ứng tiêu chuẩn khắt khe của các ngành công nghiệp.</p>
      <p>Từ cắt, dập, chấn, hàn, sơn tĩnh điện cho đến lắp ráp hoàn thiện, mỗi sản phẩm của Thiên Lộc đều được gia công tỉ mỉ trên dây chuyền hiện đại, đảm bảo độ chính xác cao và tính thẩm mỹ vượt trội.</p>
      <p>Chúng tôi không ngừng đổi mới công nghệ, nâng cao chất lượng dịch vụ nhằm mang lại giải pháp tối ưu và hiệu quả nhất cho mọi khách hàng và đối tác.</p>
    `,
    yearsOfExperience: 10,
    projectsCompleted: 150,
    satisfiedClients: 120,
    satisfactionRate: 98,
    mission: `
      <p>Công ty TNHH Sản Xuất và Gia Công Kim Loại Tấm Thiên Lộc hoạt động với sứ mệnh cung cấp các sản phẩm và giải pháp gia công kim loại tấm chính xác, ổn định và đạt tiêu chuẩn kỹ thuật cao, đáp ứng linh hoạt nhu cầu của khách hàng trong các lĩnh vực công nghiệp, xây dựng và cơ khí.</p>
      <p>Công ty đầu tư đồng bộ hệ thống máy móc hiện đại như cắt laser CNC, chấn CNC, đột CNC cùng các dây chuyền gia công chuyên dụng, kết hợp với đội ngũ kỹ thuật lành nghề nhằm đảm bảo chất lượng sản phẩm, tiến độ thực hiện và tính đồng nhất trong từng đơn hàng.</p>
    `,
    vision: `
      <p>Thiên Lộc hướng tới trở thành đơn vị gia công kim loại tấm uy tín và chuyên nghiệp hàng đầu, được khách hàng và đối tác tin tưởng lựa chọn.</p>
      <p>Công ty không ngừng cải tiến công nghệ, chuẩn hóa quy trình sản xuất và nâng cao năng lực quản lý, hướng đến phát triển bền vững, xây dựng mối quan hệ hợp tác lâu dài và mang lại giá trị gia tăng cao nhất cho khách hàng và đối tác.</p>
    `,
  };

  await prisma.contactInfo.create({
    data: contactInfo,
  });
  console.log('✅ Đã tạo thông tin liên hệ\n');

  console.log('🎉 Hoàn thành seed dữ liệu!\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
