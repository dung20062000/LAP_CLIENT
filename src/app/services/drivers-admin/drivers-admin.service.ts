import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/auth/auth.model';
// prettier-ignore
import { DriverLookupDto, LicenseTypeLookupDto, DriverListResponse, DriverListRequest, UpdateDriverRequest, DriverDto, CreateDriverRequest } from '../../models/drivers-admin';

/**
 * Người tạo: DungBT
 * Ngày tạo: 25/06/2026
 * Mô tả: Service kết nối API quản lý lái xe.
 *        - getDriverLookup()        → GET  /api/drivers/driver-lookup
 *        - getLicenseTypeLookup()   → GET  /api/drivers/license-types-lookup
 *        - getDriverList()          → GET  /api/drivers
 *        - getById()                → GET  /api/drivers/{id}
 *        - batchUpdate()            → PUT  /api/drivers
 *        - create()                 → POST /api/drivers/create
 *        - softDelete()             → DELETE /api/drivers/{id}
 *        - exportExcel()            → GET  /api/drivers/export  (blob)
 */
@Injectable({ providedIn: 'root' })
export class DriversAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   * GET /api/drivers/lookup
   * Lấy danh sách dropdown lái xe đang hoạt động.
   */
  getDriverLookup(): Observable<DriverLookupDto[]> {
    return this.http
      .get<ApiResponse<DriverLookupDto[]>>(`${this.apiUrl}/drivers/driver-lookup`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   * GET /api/drivers/license-types-lookup
   * Lấy danh sách dropdown loại bằng lái.
   */
  getLicenseTypeLookup(): Observable<LicenseTypeLookupDto[]> {
    return this.http
      .get<ApiResponse<LicenseTypeLookupDto[]>>(`${this.apiUrl}/drivers/license-types-lookup`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   * GET /api/drivers
   * Lấy danh sách lái xe có phân trang và bộ lọc.
   * @param request Tham số filter và phân trang
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
   * Người tạo: DungBT
   * Ngày tạo: 06/07/2026
   * GET /api/drivers/{id}
   * Lấy thông tin chi tiết lái xe theo ID.
   */
  getById(id: number): Observable<DriverDto> {
    return this.http
      .get<ApiResponse<DriverDto>>(`${this.apiUrl}/drivers/${id}`)
      .pipe(map((res) => res.data!));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   * PUT /api/drivers
   * Cập nhật hàng loạt các dòng đã thay đổi.
   * @param items Danh sách payload các dòng dirty
   */
  batchUpdate(items: UpdateDriverRequest[]): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.apiUrl}/drivers`, items)
      .pipe(map(() => void 0));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 06/07/2026
   * POST /api/drivers/create
   * Tạo mới lái xe.
   */
  create(request: CreateDriverRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/drivers`, request)
      .pipe(map(() => void 0));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   * DELETE /api/drivers/{id}
   * Xóa mềm lái xe theo ID.
   * @param id ID lái xe cần xóa
   */
  softDelete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/drivers/${id}`)
      .pipe(map(() => void 0));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   * GET /api/drivers/export
   * Xuất file Excel, trả về Blob để tải xuống trình duyệt.
   * @param request Tham số filter (không cần phân trang)
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
