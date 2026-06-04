/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Các interface/type dùng cho màn hình Xem Ảnh Phương Tiện.
 *        Map trực tiếp với DTOs của LAP_API:
 *        - VehicleGroupTreeNode  ← VehicleGroupTreeDto
 *        - VehicleItem           ← VehicleDto
 *        - MediaImageItem        ← ImageItemDto
 *        - MediaSearchParams     ← ImageSearchRequest
 *        - MediaSearchResult     ← ImageSearchResponse
 *        - ApiResponse<T>        ← ApiResponse<T>
 */

// ApiResponse<T> được tái sử dụng từ auth.model.ts (đã export qua models/index.ts)
// Không định nghĩa lại ở đây để tránh trùng lặp.

// Node cây nhóm phương tiện cho PrimeNG TreeSelect
// Map từ VehicleGroupTreeDto (key, label, data, children)
export interface VehicleGroupTreeNode {
  key: string;
  label: string;
  data: string;
  children: VehicleGroupTreeNode[];
}

// Thông tin xe dùng cho Dropdown
// Map từ VehicleDto (id, vehiclePlate, privateCode, displayName)
export interface VehicleItem {
  id: number;
  vehiclePlate: string;
  privateCode: string;
  // Hiển thị dạng "PrivateCode (VehiclePlate)"
  displayName: string;
}

// Kênh camera (Kênh 1..4)
export interface MediaChannel {
  value: number;
  label: string;
}

// Một bức ảnh trả về từ API
// Map từ ImageItemDto (channel, imageTime, url, latitude, longitude)
export interface MediaImageItem {
  channel: number;
  imageTime: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  // Thông tin xe được gán thêm ở FE sau khi search
  vehiclePlate?: string;
  displayName?: string;
}

// Params gửi lên khi tìm kiếm ảnh
// Map từ ImageSearchRequest của LAP_API
export interface MediaSearchParams {
  vehiclePlate: string | null;
  customerId: string | null;
  channels: number[];
  // ISO datetime string, ví dụ: "2025-04-10T00:00:00"
  startTime: string;
  endTime: string;
  // "desc" = Mới nhất, "asc" = Cũ nhất
  sortOrder: 'desc' | 'asc';
  pageNumber: number;
  pageSize: number;
}

// Kết quả phân trang trả về
// Map từ ImageSearchResponse của LAP_API
export interface MediaSearchResult {
  totalCount: number;
  items: MediaImageItem[];
}

// Option sort direction cho Dropdown
export interface SortOption {
  label: string;
  value: 'desc' | 'asc';
}
