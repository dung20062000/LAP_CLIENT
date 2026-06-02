/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Service quản lý dữ liệu Dashboard:
 *        - Mock data phương tiện & điểm đến
 *        - Auto-refresh mỗi 5 phút qua RxJS timer + BehaviorSubject trigger
 *        - Lưu/đọc cấu hình layout widget theo userId từ localStorage
 *        - BehaviorSubject quản lý bộ lọc xe đang chọn (theo Vehicle.id)
 *        - Expose stream riêng cho từng loại địa điểm để widget dùng độc lập
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, timer, Observable, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  Vehicle,
  VehicleOption,
  Destination,
  DashboardStats,
  WidgetConfig,
  DashboardLayoutConfig,
  DestinationChartItem,
  WidgetSize,
} from '../../models/dashboard';

// Hằng số
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 phút
const LAYOUT_STORAGE_PREFIX = 'dashboard_layout_';

// Dữ liệu giả lập điểm đến
const MOCK_DESTINATIONS: Omit<Destination, 'vehicleCount'>[] = [
  // Cửa khẩu
  { id: 1, name: 'Cửa khẩu Mộc Bài', type: 'border' },
  { id: 2, name: 'Cửa khẩu Lao Bảo', type: 'border' },
  { id: 3, name: 'Cửa khẩu Cầu Treo', type: 'border' },
  { id: 4, name: 'Cửa khẩu Hữu Nghị', type: 'border' },
  { id: 5, name: 'Cửa khẩu Tân Thanh', type: 'border' },
  // Bãi cảng
  { id: 6, name: 'Cảng Tân Cảng Cát Lái', type: 'port' },
  { id: 7, name: 'Cảng Hải Phòng', type: 'port' },
  { id: 8, name: 'ICD Sóng Thần', type: 'port' },
  { id: 9, name: 'Cảng VICT', type: 'port' },
  { id: 10, name: 'Cảng Đà Nẵng', type: 'port' },
  // Nhà máy
  { id: 11, name: 'Nhà máy Samsung', type: 'factory' },
  { id: 12, name: 'Nhà máy VinFast', type: 'factory' },
  { id: 13, name: 'Nhà máy Formosa', type: 'factory' },
  { id: 14, name: 'Nhà máy Intel', type: 'factory' },
  { id: 15, name: 'Nhà máy LG', type: 'factory' },
  { id: 16, name: 'Nhà máy Toyota', type: 'factory' },
  { id: 17, name: 'Nhà máy Pepsi', type: 'factory' },
  { id: 18, name: 'Nhà máy Unilever', type: 'factory' },
  { id: 19, name: 'KCN Bình Dương', type: 'factory' },
  { id: 20, name: 'KCN Long An', type: 'factory' },
];

// Dữ liệu giả lập tên lái xe
const DRIVER_NAMES = [
  'Nguyễn Văn An', 'Trần Văn Bình', 'Lê Minh Cường', 'Phạm Văn Dũng', 'Hoàng Văn Em',
  'Nguyễn Thị Phương', 'Trần Văn Giang', 'Lê Văn Hùng', 'Phạm Minh Khoa', 'Đỗ Văn Long',
  'Vũ Thị Mai', 'Bùi Văn Nam', 'Đặng Văn Oanh', 'Ngô Văn Phúc', 'Dương Thị Quỳnh',
  'Trịnh Văn Sơn', 'Đinh Văn Tài', 'Lý Văn Uy', 'Hà Thị Vân', 'Cao Văn Xuân',
];

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Service singleton cung cấp dữ liệu Dashboard và quản lý trạng thái.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  // BehaviorSubject bộ lọc xe đang chọn theo ID (rỗng = tất cả)
  private selectedIdsSubject = new BehaviorSubject<number[]>([]);
  readonly selectedIds$ = this.selectedIdsSubject.asObservable();

  // Trigger reload thủ công hoặc tự động
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Cache dữ liệu mock hiện tại
  private cachedVehicles: Vehicle[] = [];

  // Stream dữ liệu thô (tất cả xe, chưa lọc)
  readonly rawVehicles$: Observable<Vehicle[]> = this.refreshTrigger$.pipe(
    map(() => this.generateMockData()),
    shareReplay(1)
  );

  /**
   * Stream xe đã lọc theo selectedIds (rỗng = hiển thị tất cả).
   * Là nguồn gốc để derive các stream theo từng loại địa điểm.
   */
  readonly allVehiclesData: Observable<Vehicle[]> = combineLatest([
    this.rawVehicles$,
    this.selectedIds$,
  ]).pipe(
    map(([vehicles, ids]) =>
      ids.length === 0
        ? vehicles
        : vehicles.filter((v) => ids.includes(v.id))
    ),
    shareReplay(1)
  );

  // Stream dữ liệu theo từng loại địa điểm (dùng cho từng widget)

  /** Stream xe tại Cửa khẩu (đã lọc theo bộ lọc tổng quan) */
  readonly borderVehiclesData: Observable<Vehicle[]> = this.allVehiclesData.pipe(
    map((vehicles) => vehicles.filter((v) => v.locationType === 'border')),
    shareReplay(1)
  );

  /** Stream xe Đang trên đường (đã lọc theo bộ lọc tổng quan) */
  readonly roadVehiclesData: Observable<Vehicle[]> = this.allVehiclesData.pipe(
    map((vehicles) => vehicles.filter((v) => v.locationType === 'road')),
    shareReplay(1)
  );

  /** Stream xe tại Nhà máy (đã lọc theo bộ lọc tổng quan) */
  readonly factoryVehiclesData: Observable<Vehicle[]> = this.allVehiclesData.pipe(
    map((vehicles) => vehicles.filter((v) => v.locationType === 'factory')),
    shareReplay(1)
  );

  /** Stream xe tại Cảng (đã lọc theo bộ lọc tổng quan) */
  readonly portVehiclesData: Observable<Vehicle[]> = this.allVehiclesData.pipe(
    map((vehicles) => vehicles.filter((v) => v.locationType === 'port')),
    shareReplay(1)
  );

  /**
   * Stream thống kê tổng quan (luôn tính trên toàn bộ dữ liệu thô, không lọc).
   * Dùng cho widget TỔNG QUAN CÔNG TY.
   */
  readonly allVehiclesDataStream: Observable<Vehicle[]> = this.rawVehicles$;

  readonly statsData: Observable<DashboardStats> = this.allVehiclesData.pipe(
    map((vehicles) => this.calcStats(vehicles))
  );

  readonly destinationsData: Observable<Destination[]> = this.allVehiclesData.pipe(
    map((vehicles) => this.calcDestinations(vehicles))
  );

  constructor() {
    // Tự động reload sau mỗi 5 phút
    timer(REFRESH_INTERVAL_MS, REFRESH_INTERVAL_MS).subscribe(() => {
      this.refresh();
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Làm mới toàn bộ dữ liệu: reset bộ lọc + trigger stream mới.
   */
  refresh(): void {
    this.selectedIdsSubject.next([]);
    this.refreshTrigger$.next();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 02/06/2026
   * Reload dữ liệu của một widget cụ thể.
   * (Hiện tại gọi chung refreshTrigger$, khi tách API thật sẽ gọi riêng endpoint tại đây).
   * @param widgetId ID của widget cần reload
   */
  refreshWidget(widgetId: string): void {
    console.log(`Đang gọi API reload riêng cho widget: ${widgetId}`);
    // Tạm thời mock data đang dùng chung 1 stream nên trigger gọi lại toàn bộ
    this.refreshTrigger$.next();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Cập nhật bộ lọc theo danh sách Vehicle.id.
   * @param ids Danh sách ID xe được chọn (rỗng = hiển thị tất cả)
   */
  setFilter(ids: number[]): void {
    this.selectedIdsSubject.next(ids);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lấy danh sách VehicleOption (id + licensePlate) dùng cho dropdown bộ lọc.
   */
  getVehicleOptions(): VehicleOption[] {
    if (this.cachedVehicles.length === 0) {
      this.generateMockData();
    }
    return this.cachedVehicles.map((v) => ({ value: v.id, label: v.licensePlate }));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lấy dữ liệu điểm đến dạng bar chart từ danh sách xe.
   * @param vehicles Danh sách xe cần tính toán
   */
  getDestinationChartData(vehicles: Vehicle[]): DestinationChartItem[] {
    const countMap: Record<string, { count: number; type: DestinationChartItem['type'] }> = {};
    vehicles
      .filter((v) => v.destinationName && v.locationType !== 'road')
      .forEach((v) => {
        const key = v.destinationName!;
        if (!countMap[key]) {
          countMap[key] = { count: 0, type: v.locationType as DestinationChartItem['type'] };
        }
        countMap[key].count++;
      });

    return Object.entries(countMap)
      .map(([name, { count, type }]) => ({ name, count, type }))
      .sort((a, b) => b.count - a.count);
  }

  // Layout localStorage

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lấy cấu hình layout widget từ localStorage theo userId.
   * @param userId ID/username người dùng đăng nhập
   */
  getLayoutConfig(userId: string): WidgetConfig[] {
    try {
      const key = LAYOUT_STORAGE_PREFIX + userId;
      const raw = localStorage.getItem(key);
      const defaults = this.getDefaultLayoutConfig();
      if (!raw) return defaults;
      const config: DashboardLayoutConfig = JSON.parse(raw);
      const savedWidgets = config.widgets || [];

      // Trộn cấu hình đã lưu với cấu hình mặc định để tự động bổ sung các widget bị thiếu trong localStorage
      const merged = [...savedWidgets];
      defaults.forEach((def) => {
        if (!merged.some((w) => w.widgetId === def.widgetId)) {
          merged.push(def);
        }
      });
      return merged;
    } catch {
      return this.getDefaultLayoutConfig();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lưu cấu hình layout widget vào localStorage theo userId.
   * @param userId ID/username người dùng đăng nhập
   * @param widgets Danh sách cấu hình widget
   */
  saveLayoutConfig(userId: string, widgets: WidgetConfig[]): void {
    try {
      const key = LAYOUT_STORAGE_PREFIX + userId;
      const config: DashboardLayoutConfig = {
        userId,
        widgets,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(config));
    } catch {
      console.error('Không thể lưu layout widget');
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Cập nhật size của một widget và lưu lại.
   * @param userId    ID người dùng
   * @param widgetId  ID widget cần cập nhật
   * @param size      Kích thước mới
   * @param currentWidgets Danh sách widget hiện tại
   */
  updateWidgetSize(
    userId: string,
    widgetId: string,
    size: WidgetSize,
    currentWidgets: WidgetConfig[],
  ): WidgetConfig[] {
    let exists = false;
    const updated = currentWidgets.map((w) => {
      if (w.widgetId === widgetId) {
        exists = true;
        return { ...w, size };
      }
      return w;
    });
    if (!exists) {
      updated.push({ widgetId, size, collapsed: false });
    }
    this.saveLayoutConfig(userId, updated);
    return updated;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Cập nhật trạng thái collapsed của widget và lưu lại.
   * @param userId    ID người dùng
   * @param widgetId  ID widget cần cập nhật
   * @param collapsed Trạng thái thu gọn mới
   * @param currentWidgets Danh sách widget hiện tại
   */
  updateWidgetCollapsed(
    userId: string,
    widgetId: string,
    collapsed: boolean,
    currentWidgets: WidgetConfig[],
  ): WidgetConfig[] {
    let exists = false;
    const updated = currentWidgets.map((w) => {
      if (w.widgetId === widgetId) {
        exists = true;
        return { ...w, collapsed };
      }
      return w;
    });
    if (!exists) {
      updated.push({ widgetId, size: 'auto', collapsed });
    }
    this.saveLayoutConfig(userId, updated);
    return updated;
  }

  // Private – Tạo mock data

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Tạo dữ liệu giả lập 83 phương tiện.
   * Biển số dạng 43C0XXXX_C, phân bổ theo loại địa điểm.
   * Mỗi lần gọi ngẫu nhiên hóa lại vị trí để mô phỏng thay đổi.
   */
  private generateMockData(): Vehicle[] {
    const vehicles: Vehicle[] = [];
    let vehicleId = 1;

    // Phân bổ phương tiện theo loại điểm
    const distributions: { type: Vehicle['locationType']; destIds: number[]; count: number }[] = [
      { type: 'border',  destIds: [1, 2, 3, 4, 5], count: 2 },
      { type: 'port',    destIds: [6, 7, 8, 9, 10], count: 20 },
      { type: 'factory', destIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], count: 20 },
      { type: 'road',    destIds: [], count: 2 },
    ];

    // Biển số xe bắt đầu từ 43C01338_C
    let plateSeq = 1338;

    for (const dist of distributions) {
      for (let i = 0; i < dist.count; i++) {
        const plate = `43C0${plateSeq++}_C`;

        let destId: number | undefined;
        let destName: string | undefined;

        if (dist.type !== 'road' && dist.destIds.length > 0) {
          destId = dist.destIds[Math.floor(Math.random() * dist.destIds.length)];
          destName = MOCK_DESTINATIONS.find((d) => d.id === destId)?.name;
        }

        const driverName = DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)];
        const hasLoad = Math.random() > 0.45; // ~55% có hàng

        let finalDestName = destName;
        if (dist.type === 'port' && destName) {
          finalDestName = `${destName} (${driverName})`;
        }

        vehicles.push({
          id: vehicleId++,
          licensePlate: plate,
          driverName,
          hasLoad,
          locationType: dist.type,
          destinationId: destId,
          destinationName: finalDestName,
        });
      }
    }

    this.cachedVehicles = vehicles;
    console.log('DungBTvehicles', vehicles);
    return vehicles;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Tính toán thống kê tổng quan từ danh sách xe.
   * @param vehicles Danh sách xe cần tính toán
   */
  private calcStats(vehicles: Vehicle[]): DashboardStats {
    return {
      totalVehicles: vehicles.length,
      loadedVehicles: vehicles.filter((v) => v.hasLoad).length,
      emptyVehicles: vehicles.filter((v) => !v.hasLoad).length,
      atBorder:  vehicles.filter((v) => v.locationType === 'border').length,
      onRoad:    vehicles.filter((v) => v.locationType === 'road').length,
      atPort:    vehicles.filter((v) => v.locationType === 'port').length,
      atFactory: vehicles.filter((v) => v.locationType === 'factory').length,
    };
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Tính số xe tại từng điểm đến.
   * @param vehicles Danh sách xe cần tính toán
   */
  private calcDestinations(vehicles: Vehicle[]): Destination[] {
    return MOCK_DESTINATIONS.map((d) => ({
      ...d,
      vehicleCount: vehicles.filter((v) => v.destinationId === d.id).length,
    }));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Cấu hình layout mặc định khi chưa có trong localStorage.
   */
  private getDefaultLayoutConfig(): WidgetConfig[] {
    return [
      { widgetId: 'overview',     size: 'large', collapsed: false },
      { widgetId: 'donut-border', size: 'small', collapsed: false },
      { widgetId: 'donut-road',   size: 'small', collapsed: false },
      { widgetId: 'bar-factory',  size: 'small', collapsed: false },
      { widgetId: 'bar-port',     size: 'large', collapsed: false },
    ];
  }
}
