import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/auth/auth.model';
// prettier-ignore
import { DriverLookupDto, LicenseTypeLookupDto, DriverListResponse, DriverListRequest, UpdateDriverRequest, CreateDriverRequest, DriverDto, } from '../../models/drivers-admin';

/**
 * Mô tả: Service kết nối API quản lý lái xe.
 *        - getDriverLookup()        → GET  /api/drivers/driver-lookup
 *        - getLicenseTypeLookup()   → GET  /api/drivers/license-types-lookup
 *        - getDriverList()          → GET  /api/drivers
 *        - batchUpdate()            → PUT  /api/drivers
 *        - softDelete()             → DELETE /api/drivers/{id}
 *        - exportExcel()            → GET  /api/drivers/export  (blob)
 * Người tạo: DungBT
 * Ngày tạo: 25/06/2026
 */
@Injectable({ providedIn: 'root' })
export class DriversAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * GET /api/drivers/lookup
   * Lấy danh sách dropdown lái xe đang hoạt động.
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  getDriverLookup(): Observable<DriverLookupDto[]> {
    return this.http
      .get<ApiResponse<DriverLookupDto[]>>(`${this.apiUrl}/drivers/driver-lookup`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * GET /api/drivers/license-types-lookup
   * Lấy danh sách dropdown loại bằng lái.
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  getLicenseTypeLookup(): Observable<LicenseTypeLookupDto[]> {
    return this.http
      .get<ApiResponse<LicenseTypeLookupDto[]>>(`${this.apiUrl}/drivers/license-types-lookup`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * GET /api/drivers
   * Lấy danh sách lái xe có phân trang và bộ lọc.
   * @param request Tham số filter và phân trang
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  getDriverList(request: DriverListRequest): Observable<DriverListResponse> {
    let params = new HttpParams();
    if (request.Keyword) params = params.set('Keyword', request.Keyword);
    if (request.Type) params = params.set('Type', request.Type);
    if (request.Page) params = params.set('Page', request.Page.toString());
    if (request.PageSize) params = params.set('PageSize', request.PageSize.toString());

    // Array params: DriverIds[], LicenseTypeIds[]
    (request.DriverIds ?? []).forEach((id) => {
      params = params.append('DriverIds', id.toString());
    });
    (request.LicenseTypeIds ?? []).forEach((id) => {
      params = params.append('LicenseTypeIds', id.toString());
    });

    return this.http
      .get<ApiResponse<DriverListResponse>>(`${this.apiUrl}/drivers`, { params })
      .pipe(map((res) => res.data ?? { TotalRecord: 0, Items: [] }));
  }
  /**
   * GET /api/drivers/{id}
   * Lấy thông tin chi tiết lái xe theo ID.
   * Người tạo: DungBT
   * Ngày tạo: 06/07/2026
   */
  getById(id: number): Observable<DriverDto> {
    return this.http
      .get<ApiResponse<DriverDto>>(`${this.apiUrl}/drivers/${id}`)
      .pipe(map((res) => res.data!));
  }

  /**
   * PUT /api/drivers
   * Cập nhật hàng loạt các dòng đã thay đổi (inline edit).
   * @param items Danh sách payload các dòng dirty
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  batchUpdate(items: UpdateDriverRequest[]): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.apiUrl}/drivers`, items)
      .pipe(map(() => void 0));
  }
  /**
   * Tạo mới lái xe.
   * POST /api/drivers/create
   * Người tạo: DungBT
   * Ngày tạo: 06/07/2026
   */
  create(request: CreateDriverRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/drivers`, request)
      .pipe(map(() => void 0));
  }

  /**
   * DELETE /api/drivers/{id}
   * Xóa mềm lái xe theo ID.
   * @param id ID lái xe cần xóa
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  softDelete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/drivers/${id}`)
      .pipe(map(() => void 0));
  }

  /**
   * GET /api/drivers/export
   * Xuất file Excel, trả về Blob để tải xuống trình duyệt.
   * @param request Tham số filter (không cần phân trang)
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  exportExcel(request: DriverListRequest): Observable<Blob> {
    let params = new HttpParams();
    if (request.Keyword) params = params.set('Keyword', request.Keyword);
    (request.DriverIds ?? []).forEach((id) => {
      params = params.append('DriverIds', id.toString());
    });
    (request.LicenseTypeIds ?? []).forEach((id) => {
      params = params.append('LicenseTypeIds', id.toString());
    });

    return this.http.get(`${this.apiUrl}/drivers/export`, {
      params,
      responseType: 'blob',
    });
  }
}
