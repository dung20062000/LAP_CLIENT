/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Các interface/type dùng cho màn hình Xem Ảnh Phương Tiện.
 */

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Node cây nhóm phương tiện cho PrimeNG TreeSelect
 * Map từ VehicleGroupTreeDto (key, label, data, children)
 */
export interface VehicleGroupTreeNode {
  key: string;
  label: string;
  data: string;
  children: VehicleGroupTreeNode[];
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Thông tin xe dùng cho Dropdown
 * Map từ VehicleDto (id, vehiclePlate, privateCode, displayName)
 */
export interface VehicleItem {
  id: number;
  vehiclePlate: string;
  privateCode: string;
  XNCode: number;
  // Hiển thị dạng "PrivateCode (VehiclePlate)"
  displayName: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Kênh camera (Kênh 1..4)
 */
export interface MediaChannel {
  value: number;
  label: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Một bức ảnh trả về từ API
 * Map từ ImageItemDto (channel, imageTime, url, latitude, longitude)
 */
export interface MediaImageItem {
  channel: number;
  imageTime: string;
  url: string;
  vehiclePlate?: string;
  driverName?: string;
  speed: number;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Params gửi lên khi tìm kiếm ảnh
 * Map từ ImageSearchRequest của LAP_API
 */
export interface MediaSearchParams {
  vehiclePlate: string | null;
  customerId: number;
  channels: number[];
  // ISO datetime string, ví dụ: "2025-04-10T00:00:00"
  startTime: string;
  endTime: string;
  // "desc" = Mới nhất, "asc" = Cũ nhất
  sortOrder: 'desc' | 'asc';
  pageNumber: number;
  pageSize: number;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Kết quả phân trang trả về
 * Map từ ImageSearchResponse của LAP_API
 */
export interface MediaSearchResult {
  totalCount: number;
  items: MediaImageItem[];
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Option sort direction cho Dropdown
 */
export interface SortOption {
  label: string;
  value: 'desc' | 'asc';
}
