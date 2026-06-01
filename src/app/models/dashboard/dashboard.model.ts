/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Các interface/type dùng cho Dashboard theo dõi trạng thái xe chở hàng.
 */

// ─── Kích thước widget ────────────────────────────────────────────────────────
export type WidgetSize = 'auto' | 'small' | 'medium' | 'large';

// ─── Loại điểm đến ───────────────────────────────────────────────────────────
export type DestinationType = 'border' | 'port' | 'factory' | 'road';

// ─── Thông tin phương tiện ───────────────────────────────────────────────────
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

// ─── Điểm đến (cửa khẩu, nhà máy, bãi cảng) ─────────────────────────────────
export interface Destination {
  id: number;
  /** Tên điểm đến */
  name: string;
  /** Loại điểm đến */
  type: DestinationType;
  /** Số xe hiện tại tại điểm */
  vehicleCount: number;
}

// ─── Thống kê tổng quan dashboard ────────────────────────────────────────────
export interface DashboardStats {
  totalVehicles: number;
  loadedVehicles: number;
  emptyVehicles: number;
  atBorder: number;
  onRoad: number;
  atPort: number;
  atFactory: number;
}

// ─── Cấu hình từng widget ────────────────────────────────────────────────────
export interface WidgetConfig {
  widgetId: string;
  size: WidgetSize;
  collapsed: boolean;
}

// ─── Cấu hình layout toàn dashboard (lưu localStorage) ──────────────────────
export interface DashboardLayoutConfig {
  userId: string;
  widgets: WidgetConfig[];
  savedAt: string;
}

// ─── Dữ liệu điểm đến dạng biểu đồ (bar chart) ──────────────────────────────
export interface DestinationChartItem {
  name: string;
  count: number;
  type: DestinationType;
}

// ─── Option item dùng cho bộ lọc ng-select (multi-select) ────────────────────
export interface VehicleOption {
  /** ID xe – dùng làm bindValue để so sánh bằng primitive number */
  id: number;
  /** Biển số xe – hiển thị trong dropdown */
  licensePlate: string;
}
