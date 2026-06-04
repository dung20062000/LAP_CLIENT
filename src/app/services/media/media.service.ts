/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Service quản lý dữ liệu màn hình Xem Ảnh Phương Tiện.
 *        Các endpoint LAP_API được kết nối:
 *        - getVehicleGroups()     → GET  /api/vehicles/groups
 *        - getVehiclesByGroups()  → GET  /api/vehicles?groupIds=...
 *        - searchImages()         → POST /api/vehicles/images/search
 *
 *        [CHÚ Ý] Hiện tại đang dùng MOCK DATA để phát triển giao diện.
 *        Khi kết nối API thật:
 *          1. Uncomment các dòng HttpClient
 *          2. Xóa phần return mock data
 *          3. Map response qua ApiResponse<T>.data
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  VehicleGroupTreeNode,
  VehicleItem,
  MediaSearchParams,
  MediaSearchResult,
  MediaImageItem,
} from '../../models/media';
import { environment } from '../../../environments/environment';

// Độ trễ giả lập network (ms) – mô phỏng API call
const MOCK_DELAY_MS = 600;

// Dữ liệu fake nhóm xe
const MOCK_GROUPS: VehicleGroupTreeNode[] = [
  {
    key: '1',
    label: 'Nhóm Xe Tải (5)',
    data: '1',
    children: [
      { key: '11', label: 'Xe Tải Nặng (3)', data: '11', children: [] },
      { key: '12', label: 'Xe Tải Nhẹ (2)',  data: '12', children: [] },
    ],
  },
  {
    key: '2',
    label: 'Nhóm Xe Container (8)',
    data: '2',
    children: [],
  },
  {
    key: '3',
    label: 'Nhóm Xe Đầu Kéo (4)',
    data: '3',
    children: [],
  },
];

// Dữ liệu fake danh sách xe
const _MOCK_VEHICLES: VehicleItem[] = [
  { id: 1, vehiclePlate: '29H24388', privateCode: 'DX1', displayName: 'DX1 (29H24388)' },
  { id: 2, vehiclePlate: '29H24389', privateCode: 'DX2', displayName: 'DX2 (29H24389)' },
  { id: 3, vehiclePlate: '29H24390', privateCode: 'DX3', displayName: 'DX3 (29H24390)' },
  { id: 4, vehiclePlate: '51G12345', privateCode: 'HCM1', displayName: 'HCM1 (51G12345)' },
  { id: 5, vehiclePlate: '43C01338', privateCode: 'DN1', displayName: 'DN1 (43C01338)' },
];

// Địa chỉ fake
// const MOCK_ADDRESSES = [
//   'Bãi đỗ 49 Đức Giang',
//   'Điểm kẹp chí - KV3',
//   'Cửa khẩu Mộc Bài',
//   'Cảng Tân Cảng Cát Lái',
//   'KCN Bình Dương - Cổng 1',
// ];

/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Service singleton cung cấp dữ liệu cho màn hình Xem Ảnh Phương Tiện.
 */
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private http = inject(HttpClient);
  // Base URL lấy từ environment
  private apiUrl = `${environment.apiUrl}/vehicles`;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * [API] GET /api/vehicles/groups
   * Lấy cây nhóm xe để hiển thị trong PrimeNG TreeSelect.
   * Kết nối thật: uncomment HttpClient và xóa mock bên dưới.
   */
  getVehicleGroups(): Observable<VehicleGroupTreeNode[]> {
    // [API] getVehicleGroups – đang dùng mock, kết nối thật tại đây:
    // return this.http.get<ApiResponse<VehicleGroupTreeNode[]>>(`${this.apiUrl}/groups`).pipe(
    //   map(res => res.data)
    // );

    return of(MOCK_GROUPS).pipe(delay(MOCK_DELAY_MS));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * [API] GET /api/vehicles?groupIds=1&groupIds=2
   * Lấy danh sách xe theo nhóm được chọn trong TreeSelect.
   * @param groupIds Danh sách key của node đã chọn
   */
  getVehiclesByGroups(_groupIds: string[]): Observable<VehicleItem[]> {
    // [API] getVehiclesByGroups – đang dùng mock, kết nối thật tại đây:
    // let params = new HttpParams();
    // groupIds.forEach(id => { params = params.append('groupIds', id); });
    // return this.http.get<ApiResponse<VehicleItem[]>>(this.apiUrl, { params }).pipe(
    //   map(res => res.data)
    // );

    return of(_MOCK_VEHICLES).pipe(delay(MOCK_DELAY_MS));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * [API] POST /api/vehicles/images/search
   * Tìm kiếm ảnh lịch sử có phân trang.
   * @param params Bộ lọc tìm kiếm (vehiclePlate, channels, startTime, endTime, sortOrder, page, pageSize)
   */
  searchImages(params: MediaSearchParams): Observable<MediaSearchResult> {
    // [API] searchImages – đang dùng mock, kết nối thật tại đây:
    // return this.http.post<ApiResponse<MediaSearchResult>>(`${this.apiUrl}/images/search`, params).pipe(
    //   map(res => res.data)
    // );

    return of(this.generateMockImages(params)).pipe(delay(MOCK_DELAY_MS));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Tạo dữ liệu ảnh giả lập để phát triển giao diện.
   * Xóa hàm này sau khi kết nối API thật.
   * @param params Params tìm kiếm để tính phân trang mock
   */
  private generateMockImages(params: MediaSearchParams): MediaSearchResult {
    const total = 80;
    const items: MediaImageItem[] = [];

    // Tạo timestamp mock từ ngày hiện tại lùi dần
    const baseTime = new Date('2025-04-10T10:00:00');

    for (let i = 0; i < params.pageSize; i++) {
      // Mỗi ảnh cách nhau 3 phút
      const imgTime = new Date(baseTime.getTime() - i * 3 * 60 * 1000);
      // Kênh: luân phiên theo channels đã chọn hoặc kênh 1
      const channels = params.channels.length > 0 ? params.channels : [1];
      const channel = channels[i % channels.length];

      items.push({
        channel,
        imageTime: imgTime.toISOString(),
        // URL ảnh placeholder có kích thước cố định
        url: `https://picsum.photos/seed/${i + (params.pageNumber * 100)}/640/480`,
        latitude: 20.870562,
        longitude: 106.655235,
        vehiclePlate: params.vehiclePlate ?? '29H24388',
        displayName: 'DX1 (29H24388)',
      });
    }

    return { totalCount: total, items };
  }
}
