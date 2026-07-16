import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/auth/auth.model';
// prettier-ignore
import { DriverLookupDto, LicenseTypeLookupDto, DriverListResponse, DriverListRequest, UpdateDriverRequest, CreateDriverRequest, DriverDto, } from '../../models/drivers-admin';
import { getHttpErrorMessage } from '../../shared/utils/http-error';

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
  private messageService = inject(MessageService);
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
      .pipe(
        map((res) => res.data ?? []),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: getHttpErrorMessage(err, 'Có lỗi khi tải danh sách lái xe.'),
          });
          return of([]);
        }),
      );
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
      .pipe(
        map((res) => res.data ?? []),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: getHttpErrorMessage(err, 'Có lỗi khi tải danh sách loại bằng lái.'),
          });
          return of([]);
        }),
      );
  }

  /**
   * GET /api/drivers
   * Lấy danh sách lái xe có phân trang và bộ lọc.
   * @param request Tham số filter và phân trang
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  getDriverList(request: DriverListRequest): Observable<DriverListResponse> {
    return this.http
      .get<ApiResponse<DriverListResponse>>(`${this.apiUrl}/drivers`, { params: request as any })
      .pipe(
        map((res) => res.data ?? { TotalRecord: 0, Items: [] }),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: getHttpErrorMessage(err, 'Có lỗi khi tải danh sách lái xe.'),
          });
          return of({ TotalRecord: 0, Items: [] });
        }),
      );
  }
  /**
   * GET /api/drivers/{id}
   * Lấy thông tin chi tiết lái xe theo ID.
   * Người tạo: DungBT
   * Ngày tạo: 06/07/2026
   */
  getById(id: number): Observable<DriverDto | null> {
    return this.http.get<ApiResponse<DriverDto>>(`${this.apiUrl}/drivers/${id}`).pipe(
      map((res) => res.data ?? null),
      catchError((err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: getHttpErrorMessage(err, 'Không thể tải thông tin lái xe.'),
        });
        return of(null);
      }),
    );
  }

  /**
   * PUT /api/drivers
   * Cập nhật hàng loạt các dòng đã thay đổi (inline edit).
   * @param items Danh sách payload các dòng dirty
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  batchUpdate(items: UpdateDriverRequest[]): Observable<boolean> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/drivers`, items).pipe(
      map(() => true),
      catchError((err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: getHttpErrorMessage(err, 'Có lỗi khi lưu dữ liệu.'),
        });
        return of(false);
      }),
    );
  }
  /**
   * Tạo mới lái xe.
   * POST /api/drivers/create
   * Người tạo: DungBT
   * Ngày tạo: 06/07/2026
   */
  create(request: CreateDriverRequest): Observable<boolean> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/drivers`, request).pipe(
      map(() => true),
      catchError((err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: getHttpErrorMessage(err, 'Có lỗi khi tạo lái xe.'),
        });
        return of(false);
      }),
    );
  }

  /**
   * DELETE /api/drivers/{id}
   * Xóa mềm lái xe theo ID.
   * @param id ID lái xe cần xóa
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  softDelete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/drivers/${id}`).pipe(
      map(() => void 0),
      catchError((err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: getHttpErrorMessage(err, 'Có lỗi khi xóa lái xe.'),
        });
        return of(void 0);
      }),
    );
  }

  /**
   * GET /api/drivers/export
   * Xuất file Excel, trả về Blob để tải xuống trình duyệt.
   * @param request Tham số filter (không cần phân trang)
   * Người tạo: DungBT
   * Ngày tạo: 25/06/2026
   */
  exportExcel(request: DriverListRequest): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/drivers/export`, {
        params: request as any,
        responseType: 'blob',
      })
      .pipe(
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: getHttpErrorMessage(err, 'Có lỗi khi xuất file Excel.'),
          });
          return of(new Blob());
        }),
      );
  }
}
