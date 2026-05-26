import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services';
import { SlideBannerComponent, BannerSlide } from '../../../../shared/components';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, SlideBannerComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {

  readonly welcomeBanners: BannerSlide[] = [
    {
      id: 1,
      imageUrl: '/images/banners/BANNER_1.jpg',
      title: 'BA GPS - Hệ thống quản lý GPS thông minh',
      shortContents: 'Theo dõi và giám sát phương tiện trực tuyến 24/7 với công nghệ GPS tiên tiến nhất.',
      link: '#',
      order: 1,
    },
    {
      id: 2,
      imageUrl: '/images/banners/driver_check_vehicle_Ba.jpg',
      title: 'An toàn - Chính xác - Hiệu quả',
      shortContents: 'Giải pháp quản lý xe toàn diện cho doanh nghiệp vận tải và cá nhân.',
      link: '#',
      order: 2,
    },
    {
      id: 3,
      imageUrl: '/images/banners/baexpress.jpg',
      title: 'Kết nối mọi hành trình',
      shortContents: 'Hệ thống chi nhánh rộng khắp 6 tỉnh thành, hỗ trợ khách hàng mọi lúc.',
      link: '#',
      order: 3,
    },
  ];

  readonly featureCards = [
    {
      icon: 'fas fa-map-marked-alt',
      title: 'Theo dõi trực tuyến',
      description: 'Giám sát vị trí xe 24/7 với bản đồ chi tiết và cập nhật thời gian thực.',
      color: '#0066ff',
    },
    {
      icon: 'fas fa-route',
      title: 'Lộ trình di chuyển',
      description: 'Xem lại lịch sử hành trình, quãng đường và tốc độ di chuyển của xe.',
      color: '#00d2ff',
    },
    {
      icon: 'fas fa-bell',
      title: 'Cảnh báo thông minh',
      description: 'Nhận thông báo kịp thời khi xe vượt tốc độ, ra khỏi vùng giới hạn.',
      color: '#ff6b35',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Báo cáo chi tiết',
      description: 'Xuất báo cáo thống kê về hoạt động xe, tiêu hao nhiên liệu và hiệu suất.',
      color: '#28a745',
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Ứng dụng di động',
      description: 'Quản lý và giám sát xe ngay trên điện thoại thông minh.',
      color: '#6f42c1',
    },
    {
      icon: 'fas fa-headset',
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ hỗ trợ kỹ thuật luôn sẵn sàng giải đáp mọi thắc mắc.',
      color: '#ffc107',
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  getCurrentUserName(): string {
    const user = this.authService.currentUser();
    return user?.fullName || user?.username || 'admin';
  }
}
