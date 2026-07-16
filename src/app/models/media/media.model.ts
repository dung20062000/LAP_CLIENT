/**
 * Mô tả: Các interface/type dùng cho màn hình Xem Ảnh Phương Tiện.
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 */

/**
 * Node cây nhóm phương tiện cho PrimeNG TreeSelect
 * Map từ VehicleGroupTreeDto (key, label, data, children)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface VehicleGroupTreeNode {
  key: string;
  label: string;
  data: string;
  children: VehicleGroupTreeNode[];
}

/**
 * Thông tin xe dùng cho Dropdown
 * Map từ VehicleDto (id, vehiclePlate, privateCode, displayName)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface VehicleItem {
  id: number;
  vehiclePlate: string;
  privateCode: string;
  XNCode: number;
  /** Hiển thị dạng "PrivateCode (VehiclePlate)" */
  displayName: string;
}

/**
 * Kênh camera (Kênh 1..4)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface MediaChannel {
  value: number;
  label: string;
}

/**
 * Một bức ảnh trả về từ API
 * Map từ ImageItemDto (channel, imageTime, url, latitude, longitude)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
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
 * Params gửi lên khi tìm kiếm ảnh
 * Map từ ImageSearchRequest của LAP_API
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface MediaSearchParams {
  vehiclePlate: string | null;
  customerId: number;
  channels: number[];
  /** ISO datetime string, ví dụ: "2025-04-10T00:00:00" */
  startTime: string;
  /** ISO datetime string, ví dụ: "2025-04-10T00:00:00" */
  endTime: string;
  /** "desc" = Mới nhất, "asc" = Cũ nhất */
  sortOrder: 'desc' | 'asc';
  pageNumber: number;
  pageSize: number;
}

/**
 * Map từ ImageSearchResponse của LAP_API
 * Kết quả phân trang trả về
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface MediaSearchResult {
  totalCount: number;
  items: MediaImageItem[];
}

/**
 * Option sort direction cho Dropdown
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface SortOption {
  label: string;
  value: 'desc' | 'asc';
}

/**
 * Cấu hình layout hiển thị lưới ảnh
 * Người tạo: DungBT
 * Ngày tạo: 23/06/2026
 */
export enum GalleryLayoutCols {
  Col4 = 4,
  Col5 = 5,
  Col6 = 6,
}

/**
 * LAYOUT_CLASS_MAP dùng để map số cột với class của Bootstrap
 * Người tạo: DungBT
 * Ngày tạo: 16/07/2026
 */
export const LAYOUT_CLASS_MAP: Record<GalleryLayoutCols, string> = {
  [GalleryLayoutCols.Col4]: 'col-md-3',
  [GalleryLayoutCols.Col5]: 'col-20',
  [GalleryLayoutCols.Col6]: 'col-md-2',
};

/**
 * Tự động lấy danh sách layout từ map, tránh việc phải khai báo lặp lại
 * Người tạo: DungBT
 * Ngày tạo: 16/07/2026
 */
export const GALLERY_LAYOUTS = Object.keys(LAYOUT_CLASS_MAP).map(Number) as GalleryLayoutCols[];
