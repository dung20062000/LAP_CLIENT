/**
 * Mô tả: Các interface/type dùng cho Dashboard theo dõi trạng thái xe chở hàng.
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 */

/**
 * Kích thước widget 1: Tự động , 2 nhỏ, 3 trung bình, 4 lớn
 * Người tạo: DungBT
 * Ngày tạo: 22/06/2026
 */
export enum WidgetSize {
  Auto = 1,
  Small = 2,
  Medium = 3,
  Large = 4,
}

/**
 * Loại điểm đến 1: Cửa khẩu, 2: Bãi cảng, 3: Nhà máy, 4: Trên đường
 * Người tạo: DungBT
 * Ngày tạo: 22/06/2026
 */
export enum DestinationType {
  Border = 1,
  Port = 2,
  Factory = 3,
  Road = 4,
}

/**
 * Thông tin phương tiện
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface Vehicle {
  id: number;
  /** Biển số xe */
  licensePlate: string;
  /** Tên lái xe */
  driverName: string;
  /** Có hàng: true, Không hàng: false */
  hasLoad: boolean;
  /** Loại vị trí hiện tại */
  locationType: DestinationType;
  /** ID điểm đến (nếu có) */
  destinationId?: number;
  /** Tên điểm đến hiển thị */
  destinationName?: string;
}

/**
 * Điểm đến (cửa khẩu, nhà máy, bãi cảng)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface Destination {
  id: number;
  /** Tên điểm đến */
  name: string;
  /** Loại điểm đến */
  type: DestinationType;
  /** Số xe hiện tại tại điểm */
  vehicleCount: number;
}

/**
 * Thống kê tổng quan dashboard
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface DashboardStats {
  totalVehicles: number;
  loadedVehicles: number;
  emptyVehicles: number;
  atBorder: number;
  onRoad: number;
  atPort: number;
  atFactory: number;
}

/**
 * Cấu hình từng widget
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface WidgetConfig {
  widgetId: string;
  size: WidgetSize;
  collapsed: boolean;
}

/**
 * Cấu hình layout toàn dashboard (lưu localStorage)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface DashboardLayoutConfig {
  userId: string;
  widgets: WidgetConfig[];
  savedAt: string;
}

/**
 * Dữ liệu điểm đến dạng biểu đồ (bar chart)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface DestinationChartItem {
  name: string;
  count: number;
  type: DestinationType;
}

/**
 * Option item dùng cho bộ lọc ng-select (multi-select)
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface VehicleOption {
  value: number;
  label: string;
}
