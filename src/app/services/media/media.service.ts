import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  VehicleGroupTreeNode,
  VehicleItem,
  MediaSearchParams,
  MediaSearchResult,
} from '../../models/media';
import { ApiResponse } from '../../models/auth/auth.model';
import { environment } from '../../../environments/environment';

/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Service quản lý dữ liệu màn hình Xem Ảnh Phương Tiện.
 *        Kết nối LAP_API qua các endpoint:
 *        - getVehicleGroups()     → GET  /api/vehicles/groups
 *        - getVehiclesByGroups()  → GET  /api/vehicles?groupIds=...
 *        - searchImages()         → POST /api/vehicles/images/search
 */
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private http = inject(HttpClient);
  // Base URL lấy từ environment
  private apiUrl = `${environment.apiUrl}/Vehicles`;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * GET /api/vehicles/groups
   * Lấy cây nhóm xe để hiển thị trong PrimeNG TreeSelect.
   */
  getVehicleGroups(): Observable<VehicleGroupTreeNode[]> {
    return this.http
      .get<ApiResponse<VehicleGroupTreeNode[]>>(`${this.apiUrl}/groups`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * GET /api/vehicles?groupIds=1&groupIds=2
   * Lấy danh sách xe theo nhóm được chọn trong TreeSelect.
   * @param groupIds Danh sách key (string) của node lá đã chọn – convert sang int để khớp BE
   */
  getVehiclesByGroups(groupIds: string[]): Observable<VehicleItem[]> {
    let params = new HttpParams();
    groupIds.forEach((id) => {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        params = params.append('groupIds', numId.toString());
      }
    });
    return this.http
      .get<ApiResponse<VehicleItem[]>>(this.apiUrl, { params })
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * POST /api/vehicles/images/search
   * Tìm kiếm ảnh lịch sử có phân trang.
   * @param params Bộ lọc tìm kiếm (vehiclePlate, channels, startTime, endTime, sortOrder, page, pageSize)
   */
  searchImages(params: MediaSearchParams): Observable<MediaSearchResult> {
    return this.http
      .post<ApiResponse<MediaSearchResult>>(`${this.apiUrl}/images/search`, params)
      .pipe(map((res) => res.data ?? { totalCount: 0, items: [] }));
  }
}
