/**
 * Người tạo: DungBT
 * Ngày tạo: 11/06/2026
 * Mô tả: Các interface dùng cho màn hình Quản Trị Nhóm Phương Tiện.
 */

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Người dùng trong danh sách cột 1. Map từ UserDto BE
 */
export interface UserDto {
  userId: string;
  username: string;
  fullname: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Node trong cây nhóm phương tiện cho PrimeNG Tree.
 * Map từ VehicleGroupNodeDto BE.
 * Thêm thuộc tính isDirty (FE-only) để đánh dấu node vừa được chuyển sang cột assigned
 * chưa được lưu, dùng để highlight nền vàng.
 */
export interface VehicleGroupNode {
  key: string;
  label: string;
  data: number;
  parentId?: number | null;
  children: VehicleGroupNode[];
  leaf: boolean;
  /** FE-only: true nếu node vừa được move sang assigned nhưng chưa lưu */
  isDirty?: boolean;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Request gán nhóm xe. Map từ AssignGroupsRequest BE
 */
export interface AssignGroupsRequest {
  groupIds: number[];
}
