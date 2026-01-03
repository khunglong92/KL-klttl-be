import { Prisma, ServiceStatus } from '@prisma/client';

export const servicesSeedData: Prisma.ServiceCreateInput[] = [
  {
    name: 'Gia công kim loại tấm',
    shortDescription:
      'Cung cấp dịch vụ gia công kim loại tấm theo yêu cầu với độ chính xác cao, đáp ứng mọi tiêu chuẩn kỹ thuật khắt khe nhất.',
    detailedDescription: `
      <h2>Giải pháp toàn diện cho sản phẩm kim loại</h2>
      <p>Với hệ thống máy móc hiện đại và đội ngũ kỹ sư giàu kinh nghiệm, chúng tôi tự hào là đơn vị hàng đầu trong lĩnh vực gia công kim loại tấm tại Việt Nam.</p>
      <p>Chúng tôi nhận gia công các sản phẩm từ thép, inox, nhôm, đồng... với các phương pháp đột dập, chấn gấp, soi rãnh, cắt laser, đảm bảo chất lượng và tiến độ.</p>
      <p>Quy trình sản xuất được kiểm soát chặt chẽ từ khâu nhập vật liệu đến khi giao hàng, mang đến cho khách hàng sự yên tâm tuyệt đối.</p>
    `,
    images: [
      'https://picsum.photos/seed/metal-fabrication/800/600',
      'https://picsum.photos/seed/cnc-machine/800/600',
    ],
    orderIndex: 0,
    hashtags: ['gia công', 'kim loại', 'CNC', 'thép tấm'],
    status: ServiceStatus.published,
    isFeatured: true,
  },
  {
    name: 'Đột dập kim loại',
    shortDescription:
      'Dịch vụ đột dập kim loại tự động bằng hệ thống máy CNC, cho phép sản xuất hàng loạt các chi tiết phức tạp với tốc độ nhanh và chi phí tối ưu.',
    detailedDescription: `
      <h2>Định hình sản phẩm hàng loạt</h2>
      <p>Đột dập là phương pháp gia công sử dụng lực lớn để định hình phôi kim loại theo khuôn mẫu có sẵn. Công nghệ này đặc biệt hiệu quả cho việc sản xuất số lượng lớn các sản phẩm có hình dạng giống nhau.</p>
      <p>Chúng tôi có khả năng thiết kế và chế tạo khuôn dập theo bản vẽ, đảm bảo sản phẩm cuối cùng đáp ứng đúng yêu cầu kỹ thuật của khách hàng.</p>
    `,
    images: [
      'https://picsum.photos/seed/metal-stamping/800/600',
      'https://picsum.photos/seed/stamping-press/800/600',
    ],
    orderIndex: 1,
    hashtags: ['đột dập', 'dập kim loại', 'CNC', 'sản xuất hàng loạt'],
    status: ServiceStatus.published,
  },
  {
    name: 'Chấn gấp kim loại',
    shortDescription:
      'Dịch vụ chấn gấp kim loại bằng máy CNC hiện đại, tạo ra các góc gấp chính xác, đường nét sắc sảo cho các sản phẩm như vỏ tủ điện, khung máy, nội thất kim loại.',
    detailedDescription: `
      <h2>Tạo hình góc cạnh chính xác</h2>
      <p>Chấn gấp là quá trình uốn cong các tấm kim loại phẳng thành các hình dạng mong muốn. Với máy chấn CNC, chúng tôi có thể kiểm soát chính xác góc độ và bán kính cong, tạo ra sản phẩm hoàn hảo.</p>
    `,
    images: [
      'https://picsum.photos/seed/metal-bending/800/600',
      'https://picsum.photos/seed/press-brake/800/600',
    ],
    orderIndex: 2,
    hashtags: ['chấn gấp', 'uốn kim loại', 'CNC', 'vỏ tủ điện'],
    status: ServiceStatus.published,
  },
  {
    name: 'Soi rãnh kim loại',
    shortDescription:
      'Dịch vụ soi rãnh V (V-Groove) trên bề mặt inox, nhôm, đồng... giúp tạo ra các góc gấp vuông vắn, sắc cạnh, nâng cao tính thẩm mỹ cho sản phẩm nội thất, quảng cáo.',
    detailedDescription: `
      <h2>Tạo đường rãnh V-Groove sắc nét</h2>
      <p>Soi rãnh là bước quan trọng trước khi chấn gấp, đặc biệt với các vật liệu dày hoặc yêu cầu góc gấp nhỏ. Đường rãnh V giúp kim loại được uốn cong dễ dàng mà không bị rạn nứt hay biến dạng bề mặt.</p>
    `,
    images: [
      'https://picsum.photos/seed/v-grooving/800/600',
      'https://picsum.photos/seed/metal-grooving/800/600',
    ],
    orderIndex: 3,
    hashtags: ['soi rãnh', 'V-Groove', 'inox', 'trang trí nội thất'],
    status: ServiceStatus.published,
  },
  {
    name: 'Cắt laser kim loại tấm, hộp định hình',
    shortDescription:
      'Dịch vụ cắt laser CNC cho phép cắt các chi tiết kim loại từ đơn giản đến phức tạp với độ chính xác cực cao, đường cắt mịn, không ba via, áp dụng cho cả tấm và hộp.',
    detailedDescription: `
      <h2>Đường cắt chính xác, tinh xảo</h2>
      <p>Công nghệ cắt laser sử dụng chùm tia laser hội tụ năng lượng cao để làm nóng chảy và cắt vật liệu. Đây là phương pháp gia công hiện đại nhất, cho phép tạo ra các sản phẩm có hoa văn, chi tiết phức tạp.</p>
    `,
    images: [
      'https://picsum.photos/seed/laser-cutting/800/600',
      'https://picsum.photos/seed/laser-cut-metal/800/600',
    ],
    orderIndex: 4,
    hashtags: ['cắt laser', 'laser CNC', 'hoa văn kim loại', 'cắt tấm'],
    status: ServiceStatus.published,
    isFeatured: true,
  },
  {
    name: 'Thiết kế & thi công trần thạch cao, trần nhựa',
    shortDescription:
      'Chuyên tư vấn, thiết kế và thi công các loại trần thạch cao, trần nhựa giả gỗ, lam sóng... cho nhà ở, văn phòng, cửa hàng với mẫu mã đa dạng, chi phí hợp lý.',
    detailedDescription: `
      <h2>Không gian sống hiện đại, sang trọng</h2>
      <p>Trần thạch cao và trần nhựa là giải pháp trang trí nội thất phổ biến, giúp che đi các khuyết điểm của trần bê tông, hệ thống dây điện, đồng thời tạo điểm nhấn thẩm mỹ cho không gian.</p>
      <p>Chúng tôi cung cấp giải pháp trọn gói từ khâu khảo sát, tư vấn, thiết kế 3D đến thi công hoàn thiện, đảm bảo sự hài lòng của khách hàng.</p>
    `,
    images: [
      'https://picsum.photos/seed/drywall-ceiling/800/600',
      'https://picsum.photos/seed/pvc-ceiling/800/600',
    ],
    orderIndex: 5,
    hashtags: ['trần thạch cao', 'trần nhựa', 'lam sóng', 'trang trí nội thất'],
    status: ServiceStatus.published,
  },
];
