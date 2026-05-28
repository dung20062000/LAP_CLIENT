/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Service lấy danh sách banner từ CMS API (hiện dùng mock data tạm thời).
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BannerSlide } from '../components/slide-banner/slide-banner.component';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mock data banner tạm thời — mỗi banner chứa cả VI và EN.
 * Thay bằng API call thật khi backend CMS sẵn sàng.
 */
const MOCK_BANNERS: BannerSlide[] = [
  {
    id: 1,
    imageUrl: '/images/banners/BANNER_1.jpg',
    title: {
      vi: 'THIẾT BỊ ĐẦU GHI TÍCH HỢP GIÁM SÁT HÀNH TRÌNH',
      en: 'INTEGRATED DVR WITH GPS TRACKING',
    },
    shortContents: {
      vi: 'Thiết bị đầu ghi giám sát hành trình tích hợp Camera giám sát trên xe ô tô BA-SmartCamera (BA-CAMND10-1) đáp ứng Nghị định 10/2020/NĐ-CP, Nghị định 47/2022/NĐ-CP, hợp chuẩn TCVN 13396:2021',
      en: 'Integrated DVR with GPS tracking and dashcam for vehicles BA-SmartCamera (BA-CAMND10-1) complies with Decree 10/2020/NĐ-CP, Decree 47/2022/NĐ-CP, and TCVN 13396:2021 standard.',
    },
    link: 'https://bagps.vn/ba-smartcamera-chuan-nghi-dinh-10-p38',
    order: 1,
  },
  {
    id: 2,
    imageUrl: '/images/banners/driver_check_vehicle_Ba.jpg',
    title: {
      vi: 'Giải pháp Giám sát Hành trình Toàn diện',
      en: 'Comprehensive GPS Tracking Solution',
    },
    shortContents: {
      vi: 'Thiết bị giám sát hành trình chất lượng cao của BA GPS giúp doanh nghiệp tối ưu chi phí vận hành và quản lý đội xe hiệu quả trực tuyến 24/7.',
      en: 'High-quality GPS tracking devices from BA GPS help businesses optimize operational costs and manage fleets effectively 24/7 online.',
    },
    order: 2,
  },
  {
    id: 3,
    imageUrl: '/images/banners/baexpress.jpg',
    title: {
      vi: 'BA Express - Chuyển phát nhanh tài liệu & hàng hóa',
      en: 'BA Express - Express Document & Cargo Delivery',
    },
    shortContents: {
      vi: 'Dịch vụ chuyển phát chuyên nghiệp, nhanh chóng và tin cậy trên toàn quốc với mạng lưới phủ khắp các tỉnh thành.',
      en: 'Professional, fast and reliable delivery service nationwide with a network covering all provinces.',
    },
    link: 'https://bagps.vn/mang-luoi',
    order: 3,
  },
  {
    id: 4,
    imageUrl: '/images/banners/ba_zalo_2023.jpg',
    title: {
      vi: 'Kết nối qua kênh Zalo Official Account',
      en: 'Connect via Zalo Official Account',
    },
    shortContents: {
      vi: 'Hỗ trợ kỹ thuật và chăm sóc khách hàng nhanh chóng tiện lợi trực tiếp trên Zalo OA của BA GPS.',
      en: 'Fast and convenient technical support and customer care directly on BA GPS Zalo OA.',
    },
    link: 'https://zalo.me/1958838581480438876',
    order: 4,
  },
  {
    id: 5,
    imageUrl: '/images/banners/chuc_mung_nam_moi.png',
    title: {
      vi: 'Đồng hành cùng khách hàng trên mọi nẻo đường',
      en: 'Accompanying customers on every journey',
    },
    shortContents: {
      vi: 'BA GPS kính chúc Quý khách hàng một năm mới an khang thịnh vượng, vạn sự như ý và có những chuyến đi thượng lộ bình an.',
      en: 'BA GPS wishes our customers a new year of peace and prosperity, all the best and safe journeys.',
    },
    link: 'https://bagps.vn',
    order: 5,
  },
];

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Service singleton cung cấp danh sách banner cho SlideBannerComponent.
 */
@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private http = inject(HttpClient);

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Lấy danh sách banner. Hiện trả mock data — thay bằng:
   * this.http.get<BannerSlide[]>('/api/banners')
   * khi backend CMS sẵn sàng.
   */
  readonly getBanners = (): Observable<BannerSlide[]> => {
    return of(MOCK_BANNERS);
  };
}
