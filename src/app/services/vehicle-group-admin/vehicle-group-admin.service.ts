import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserDto, VehicleGroupNode, AssignGroupsRequest } from '../../models/vehicle-group-admin';
import { ApiResponse } from '../../models/auth/auth.model';
import { environment } from '../../../environments/environment';

/**
 * Người tạo: DungBT
 * Ngày tạo: 11/06/2026
 * Mô tả: Service quản lý dữ liệu màn hình Quản Trị Nhóm Phương Tiện.
 *        Kết nối LAP_API qua các endpoint:
 *        - getUsers()              → GET  /api/users
 *        - getUnassignedGroups()   → GET  /api/groups/unassigned?userId=...
 *        - getAssignedGroups()     → GET  /api/groups/assigned?userId=...
 *        - assignGroups()          → POST /api/users/{id}/groups
 */
@Injectable({
  providedIn: 'root',
})
export class VehicleGroupAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * GET /api/users
   * Lấy danh sách người dùng đang hoạt động của công ty.
   */
  getUsers(): Observable<UserDto[]> {
    return this.http
      .get<ApiResponse<UserDto[]>>(`${this.apiUrl}/users`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * GET /api/groups/unassigned?userId=...
   * Lấy danh sách nhóm xe chưa gán cho user, dạng cây.
   * @param userId ID người dùng cần kiểm tra
   */
  getUnassignedGroups(userId: string): Observable<VehicleGroupNode[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<ApiResponse<VehicleGroupNode[]>>(`${this.apiUrl}/groups/unassigned`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * GET /api/groups/assigned?userId=...
   * Lấy danh sách nhóm xe đã gán cho user, dạng cây.
   * @param userId ID người dùng cần kiểm tra
   */
  getAssignedGroups(userId: string): Observable<VehicleGroupNode[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http
      .get<ApiResponse<VehicleGroupNode[]>>(`${this.apiUrl}/groups/assigned`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * POST /api/users/{id}/groups
   * Lưu danh sách gán nhóm xe mới cho người dùng (replace-all).
   * @param userId ID người dùng
   * @param request Body chứa mảng GroupId mới
   */
  assignGroups(userId: string, request: AssignGroupsRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/users/${userId}/groups`, request)
      .pipe(map(() => void 0));
  }
}
