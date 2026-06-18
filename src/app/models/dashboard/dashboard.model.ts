/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Các interface/type dùng cho Dashboard theo dõi trạng thái xe chở hàng.
 */

//Kích thước widget
export type WidgetSize = 'auto' | 'small' | 'medium' | 'large';

//Loại điểm đến
export type DestinationType = 'border' | 'port' | 'factory' | 'road';

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Thông tin phương tiện
 */
export interface Vehicle {
  id: number;
  // Biển số xe
  licensePlate: string;
  // Tên lái xe
  driverName: string;
  // Có hàng: true, Không hàng: false
  hasLoad: boolean;
  // Loại vị trí hiện tại
  locationType: DestinationType;
  // ID điểm đến (nếu có)
  destinationId?: number;
  // Tên điểm đến hiển thị
  destinationName?: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Điểm đến (cửa khẩu, nhà máy, bãi cảng)
 */
export interface Destination {
  id: number;
  name: string;
  // Loại điểm đến
  type: DestinationType;
  // Số xe hiện tại tại điểm
  vehicleCount: number;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Thống kê tổng quan dashboard
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
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Cấu hình từng widget
 */
export interface WidgetConfig {
  widgetId: string;
  size: WidgetSize;
  collapsed: boolean;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Cấu hình layout toàn dashboard (lưu localStorage)
 */
export interface DashboardLayoutConfig {
  userId: string;
  widgets: WidgetConfig[];
  savedAt: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Dữ liệu điểm đến dạng biểu đồ (bar chart)
 */
export interface DestinationChartItem {
  name: string;
  count: number;
  type: DestinationType;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * Option item dùng cho bộ lọc ng-select (multi-select)
 */
export interface VehicleOption {
  value: number;
  label: string;
}
