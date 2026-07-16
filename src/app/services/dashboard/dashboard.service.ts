import { Injectable } from '@angular/core';
import { BehaviorSubject, timer, Observable, of } from 'rxjs';
import { map, shareReplay, delay, tap } from 'rxjs/operators';
// prettier-ignore
import { Vehicle, VehicleOption, Destination, DashboardStats,
  WidgetConfig, DashboardLayoutConfig, DestinationChartItem, WidgetSize, DestinationType } from '../../models/dashboard';

/** Hằng số */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 phút
const LAYOUT_STORAGE_PREFIX = 'dashboard_layout_';

/** Độ trễ giả lập network (ms) – mô phỏng API call */
/**API tổng */
const MOCK_API_DELAY_FULL = 800;
/**API từng widget */
const MOCK_API_DELAY_WIDGET = 500;

/** Dữ liệu giả lập điểm đến */
const MOCK_DESTINATIONS: Omit<Destination, 'vehicleCount'>[] = [
  // Cửa khẩu
  { id: 1, name: 'Cửa khẩu Mộc Bài', type: DestinationType.Border },
  { id: 2, name: 'Cửa khẩu Lao Bảo', type: DestinationType.Border },
  { id: 3, name: 'Cửa khẩu Cầu Treo', type: DestinationType.Border },
  { id: 4, name: 'Cửa khẩu Hữu Nghị', type: DestinationType.Border },
  { id: 5, name: 'Cửa khẩu Tân Thanh', type: DestinationType.Border },
  // Bãi cảng
  { id: 6, name: 'Cảng Tân Cảng Cát Lái', type: DestinationType.Port },
  { id: 7, name: 'Cảng Hải Phòng', type: DestinationType.Port },
  { id: 8, name: 'ICD Sóng Thần', type: DestinationType.Port },
  { id: 9, name: 'Cảng VICT', type: DestinationType.Port },
  { id: 10, name: 'Cảng Đà Nẵng', type: DestinationType.Port },
  // Nhà máy
  { id: 11, name: 'Nhà máy Samsung', type: DestinationType.Factory },
  { id: 12, name: 'Nhà máy VinFast', type: DestinationType.Factory },
  { id: 13, name: 'Nhà máy Formosa', type: DestinationType.Factory },
  { id: 14, name: 'Nhà máy Intel', type: DestinationType.Factory },
  { id: 15, name: 'Nhà máy LG', type: DestinationType.Factory },
  { id: 16, name: 'Nhà máy Toyota', type: DestinationType.Factory },
  { id: 17, name: 'Nhà máy Pepsi', type: DestinationType.Factory },
  { id: 18, name: 'Nhà máy Unilever', type: DestinationType.Factory },
  { id: 19, name: 'KCN Bình Dương', type: DestinationType.Factory },
  { id: 20, name: 'KCN Long An', type: DestinationType.Factory },
];

/** Dữ liệu giả lập tên lái xe */
const DRIVER_NAMES = [
  'Nguyễn Văn An',
  'Trần Văn Bình',
  'Lê Minh Cường',
  'Phạm Văn Dũng',
  'Hoàng Văn Em',
  'Nguyễn Thị Phương',
  'Trần Văn Giang',
  'Lê Văn Hùng',
  'Phạm Minh Khoa',
  'Đỗ Văn Long',
  'Vũ Thị Mai',
  'Bùi Văn Nam',
  'Đặng Văn Oanh',
  'Ngô Văn Phúc',
  'Dương Thị Quỳnh',
  'Trịnh Văn Sơn',
  'Đinh Văn Tài',
  'Lý Văn Uy',
  'Hà Thị Vân',
  'Cao Văn Xuân',
];

/** Kiểu locationType hợp lệ */
type LocationType = Vehicle['locationType'];

/**
 * Mô tả: Service quản lý dữ liệu Dashboard:
 *        - Mock data phương tiện & điểm đến
 *        - API tổng (getAllDashboardData) khi load trang lần đầu
 *        - API riêng từng widget (getOverviewData, getBorderData, getRoadData, getFactoryData, getPortData)
 *          được gọi khi ấn nút reload của từng widget
 *        - Mỗi widget có BehaviorSubject trigger & loading state độc lập
 *        - Auto-refresh mỗi 5 phút qua RxJS timer
 *        - Lưu/đọc cấu hình layout widget theo userId từ localStorage
 *        - BehaviorSubject quản lý bộ lọc xe đang chọn (theo Vehicle.id)
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  /** Bộ lọc */
  private selectedIdsSubject = new BehaviorSubject<number[]>([]);
  readonly selectedIds$ = this.selectedIdsSubject.asObservable();

  /** Cache dữ liệu mock */
  private cachedVehicles: Vehicle[] = [];

  /** Loading state từng widget */
  private overviewLoadingSubject = new BehaviorSubject<boolean>(false);
  private borderLoadingSubject = new BehaviorSubject<boolean>(false);
  private roadLoadingSubject = new BehaviorSubject<boolean>(false);
  private factoryLoadingSubject = new BehaviorSubject<boolean>(false);
  private portLoadingSubject = new BehaviorSubject<boolean>(false);

  readonly overviewLoading$ = this.overviewLoadingSubject.asObservable();
  readonly borderLoading$ = this.borderLoadingSubject.asObservable();
  readonly roadLoading$ = this.roadLoadingSubject.asObservable();
  readonly factoryLoading$ = this.factoryLoadingSubject.asObservable();
  readonly portLoading$ = this.portLoadingSubject.asObservable();

  /** BehaviorSubject lưu dữ liệu riêng cho từng widget */
  private statsSubject = new BehaviorSubject<DashboardStats | null>(null);
  private borderVehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  private roadVehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  private factoryVehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  private portVehiclesSubject = new BehaviorSubject<Vehicle[]>([]);

  /** Observable expose ra ngoài cho component */
  readonly statsData: Observable<DashboardStats | null> = this.statsSubject.asObservable();
  readonly borderVehiclesData: Observable<Vehicle[]> = this.borderVehiclesSubject.asObservable();
  readonly roadVehiclesData: Observable<Vehicle[]> = this.roadVehiclesSubject.asObservable();
  readonly factoryVehiclesData: Observable<Vehicle[]> = this.factoryVehiclesSubject.asObservable();
  readonly portVehiclesData: Observable<Vehicle[]> = this.portVehiclesSubject.asObservable();

  /** Dùng để trigger lấy vehicleOptions cho filter dropdown */
  readonly allVehiclesDataStream: Observable<Vehicle[]> = this.statsData.pipe(
    map(() => this.cachedVehicles),
    shareReplay(1),
  );

  /** Destinations (dùng nếu cần) */
  readonly destinationsData: Observable<Destination[]> = this.statsData.pipe(
    map(() => this.calcDestinations(this.cachedVehicles)),
  );

  constructor() {
    // Tự động reload toàn bộ sau mỗi khoảng thời gian
    timer(REFRESH_INTERVAL_MS, REFRESH_INTERVAL_MS).subscribe(() => {
      this.refresh().subscribe();
    });
  }

  /**
   * [API TỔNG] Gọi 1 lần khi load trang – lấy toàn bộ dữ liệu dashboard.
   * Cập nhật đồng thời tất cả widget subjects.
   * Giả lập delay mạng MOCK_API_DELAY_FULL ms.
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  getAllDashboardData(): Observable<{
    stats: DashboardStats;
    border: Vehicle[];
    road: Vehicle[];
    factory: Vehicle[];
    port: Vehicle[];
  }> {
    // [API] getAllDashboardData – đang gọi API tổng...

    // Bật loading cho tất cả widget
    this.setAllLoading(true);

    const allVehicles = this.generateMockData();
    const filtered = this.applyFilter(allVehicles);

    const result = {
      stats: this.calcStats(filtered),
      border: filtered.filter((v) => v.locationType === DestinationType.Border),
      road: filtered.filter((v) => v.locationType === DestinationType.Road),
      factory: filtered.filter((v) => v.locationType === DestinationType.Factory),
      port: filtered.filter((v) => v.locationType === DestinationType.Port),
    };

    return of(result).pipe(
      delay(MOCK_API_DELAY_FULL),
      tap((data) => {
        this.statsSubject.next(data.stats);
        this.borderVehiclesSubject.next(data.border);
        this.roadVehiclesSubject.next(data.road);
        this.factoryVehiclesSubject.next(data.factory);
        this.portVehiclesSubject.next(data.port);
        this.setAllLoading(false);
        // [API] getAllDashboardData – hoàn thành.
      }),
    );
  }

  /**
   * [API WIDGET] Lấy dữ liệu widget TỔNG QUAN CÔNG TY.
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  getOverviewData(): Observable<DashboardStats> {
    // [API] getOverviewData – đang gọi API widget overview...
    this.overviewLoadingSubject.next(true);

    const vehicles = this.applyFilter(
      this.cachedVehicles.length ? this.cachedVehicles : this.generateMockData(),
    );
    const stats = this.calcStats(vehicles);

    return of(stats).pipe(
      delay(MOCK_API_DELAY_WIDGET),
      tap((data) => {
        this.statsSubject.next(data);
        this.overviewLoadingSubject.next(false);
        // [API] getOverviewData – hoàn thành.
      }),
    );
  }

  /**
   * [API WIDGET] Lấy dữ liệu widget PHƯƠNG TIỆN TẠI CỬA KHẨU.
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  getBorderData(): Observable<Vehicle[]> {
    return this.getWidgetData(
      DestinationType.Border,
      this.borderVehiclesSubject,
      this.borderLoadingSubject,
    );
  }

  /**
   * [API WIDGET] Lấy dữ liệu widget PHƯƠNG TIỆN ĐANG TRÊN ĐƯỜNG.
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  getRoadData(): Observable<Vehicle[]> {
    return this.getWidgetData(
      DestinationType.Road,
      this.roadVehiclesSubject,
      this.roadLoadingSubject,
    );
  }

  /**
   * [API WIDGET] Lấy dữ liệu widget PHƯƠNG TIỆN TẠI NHÀ MÁY.
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  getFactoryData(): Observable<Vehicle[]> {
    return this.getWidgetData(
      DestinationType.Factory,
      this.factoryVehiclesSubject,
      this.factoryLoadingSubject,
    );
  }

  /**
   * [API WIDGET] Lấy dữ liệu widget PHƯƠNG TIỆN TẠI CẢNG.
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  getPortData(): Observable<Vehicle[]> {
    return this.getWidgetData(
      DestinationType.Port,
      this.portVehiclesSubject,
      this.portLoadingSubject,
    );
  }
  /**
   * Làm mới toàn bộ dữ liệu dashboard (gọi lại API tổng).
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  refresh(): Observable<unknown> {
    this.selectedIdsSubject.next([]);
    return this.getAllDashboardData();
  }

  /**
   * Reload dữ liệu của một widget cụ thể – gọi API riêng tương ứng.
   * @param widgetId ID của widget cần reload
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   */
  refreshWidget(widgetId: string): Observable<unknown> {
    // [API] refreshWidget
    switch (widgetId) {
      case 'overview':
        return this.getOverviewData();
      case 'donut-border':
        return this.getBorderData();
      case 'donut-road':
        return this.getRoadData();
      case 'bar-factory':
        return this.getFactoryData();
      case 'bar-port':
        return this.getPortData();
      default:
        console.warn(`[API] refreshWidget: widgetId "${widgetId}" không tồn tại.`);
        return of(null);
    }
  }

  /**
   * Cập nhật bộ lọc theo danh sách Vehicle.id và re-apply lên tất cả subjects.
   * @param ids Danh sách ID xe được chọn (rỗng = hiển thị tất cả)
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  setFilter(ids: number[]): void {
    this.selectedIdsSubject.next(ids);
    // Re-distribute dữ liệu theo bộ lọc mới
    const filtered = this.applyFilter(this.cachedVehicles);
    this.statsSubject.next(this.calcStats(filtered));
    this.borderVehiclesSubject.next(
      filtered.filter((v) => v.locationType === DestinationType.Border),
    );
    this.roadVehiclesSubject.next(filtered.filter((v) => v.locationType === DestinationType.Road));
    this.factoryVehiclesSubject.next(
      filtered.filter((v) => v.locationType === DestinationType.Factory),
    );
    this.portVehiclesSubject.next(filtered.filter((v) => v.locationType === DestinationType.Port));
  }

  /**
   * Lấy danh sách VehicleOption (id + licensePlate) dùng cho dropdown bộ lọc.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  getVehicleOptions(): VehicleOption[] {
    if (this.cachedVehicles.length === 0) {
      this.generateMockData();
    }
    return this.cachedVehicles.map((v) => ({ value: v.id, label: v.licensePlate }));
  }

  /**
   * Lấy dữ liệu điểm đến dạng bar chart từ danh sách xe.
   * @param vehicles Danh sách xe cần tính toán
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  getDestinationChartData(vehicles: Vehicle[]): DestinationChartItem[] {
    const countMap: Record<string, { count: number; type: DestinationChartItem['type'] }> = {};
    vehicles
      .filter((v) => v.destinationName && v.locationType !== DestinationType.Road)
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

  /**
   * Lấy cấu hình layout widget từ localStorage theo userId.
   * @param userId ID/username người dùng đăng nhập
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
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
   * Lưu cấu hình layout widget vào localStorage theo userId.
   * @param userId ID/username người dùng đăng nhập
   * @param widgets Danh sách cấu hình widget
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
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
   * Cập nhật size của một widget và lưu lại.
   * @param userId    ID người dùng
   * @param widgetId  ID widget cần cập nhật
   * @param size      Kích thước mới
   * @param currentWidgets Danh sách widget hiện tại
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
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
   * Cập nhật trạng thái collapsed của widget và lưu lại.
   * @param userId    ID người dùng
   * @param widgetId  ID widget cần cập nhật
   * @param collapsed Trạng thái thu gọn mới
   * @param currentWidgets Danh sách widget hiện tại
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
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
      updated.push({ widgetId, size: WidgetSize.Auto, collapsed });
    }
    this.saveLayoutConfig(userId, updated);
    return updated;
  }
  /**
   * Helper dùng chung cho các API widget (getBorderData, getRoadData…).
   * Tạo mock data mới ngẫu nhiên cho loại locationType tương ứng,
   * cập nhật subject và tắt loading.
   * Người tạo: DungBT
   * Ngày tạo: 18/06/2026
   */
  private getWidgetData(
    type: LocationType,
    subject: BehaviorSubject<Vehicle[]>,
    loadingSubject: BehaviorSubject<boolean>,
  ): Observable<Vehicle[]> {
    // [API] getWidgetData(type) – đang gọi API widget...
    loadingSubject.next(true);

    // Tạo lại ngẫu nhiên toàn bộ data để lấy phần tương ứng
    const all = this.generateMockData();
    const filtered = this.applyFilter(all).filter((v) => v.locationType === type);

    return of(filtered).pipe(
      delay(MOCK_API_DELAY_WIDGET),
      tap((data) => {
        subject.next(data);
        loadingSubject.next(false);
        // [API] getWidgetData(type) – hoàn thành.
      }),
    );
  }

  /**
   * Bật hoặc tắt loading cho tất cả widget cùng lúc.
   * Người tạo: DungBT
   * Ngày tạo: 18/06/2026
   */
  private setAllLoading(state: boolean): void {
    this.overviewLoadingSubject.next(state);
    this.borderLoadingSubject.next(state);
    this.roadLoadingSubject.next(state);
    this.factoryLoadingSubject.next(state);
    this.portLoadingSubject.next(state);
  }

  /**
   * Áp dụng bộ lọc selectedIds lên danh sách xe.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private applyFilter(vehicles: Vehicle[]): Vehicle[] {
    const ids = this.selectedIdsSubject.getValue();
    return ids.length === 0 ? vehicles : vehicles.filter((v) => ids.includes(v.id));
  }

  /**
   * Tạo dữ liệu giả lập 83 phương tiện.
   * Biển số dạng 43C0XXXX_C, phân bổ theo loại địa điểm.
   * Mỗi lần gọi ngẫu nhiên hóa lại vị trí để mô phỏng thay đổi.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private generateMockData(): Vehicle[] {
    const vehicles: Vehicle[] = [];
    let vehicleId = 1;

    // Phân bổ phương tiện theo loại điểm
    const distributions: { type: Vehicle['locationType']; destIds: number[]; count: number }[] = [
      { type: DestinationType.Border, destIds: [1, 2, 3, 4, 5], count: 2 },
      { type: DestinationType.Port, destIds: [6, 7, 8, 9, 10], count: 20 },
      {
        type: DestinationType.Factory,
        destIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        count: 20,
      },
      { type: DestinationType.Road, destIds: [], count: 2 },
    ];

    // Biển số xe bắt đầu từ 43C01338_C
    let plateSeq = 1338;

    for (const dist of distributions) {
      for (let i = 0; i < dist.count; i++) {
        const plate = `43C0${plateSeq++}_C`;

        let destId: number | undefined;
        let destName: string | undefined;

        if (dist.type !== DestinationType.Road && dist.destIds.length > 0) {
          destId = dist.destIds[Math.floor(Math.random() * dist.destIds.length)];
          destName = MOCK_DESTINATIONS.find((d) => d.id === destId)?.name;
        }

        const driverName = DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)];
        const hasLoad = Math.random() > 0.45; // ~55% có hàng

        let finalDestName = destName;
        if (dist.type === DestinationType.Port && destName) {
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
    return vehicles;
  }

  /**
   * Tính toán thống kê tổng quan từ danh sách xe.
   * @param vehicles Danh sách xe cần tính toán
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private calcStats(vehicles: Vehicle[]): DashboardStats {
    return {
      totalVehicles: vehicles.length,
      loadedVehicles: vehicles.filter((v) => v.hasLoad).length,
      emptyVehicles: vehicles.filter((v) => !v.hasLoad).length,
      atBorder: vehicles.filter((v) => v.locationType === DestinationType.Border).length,
      onRoad: vehicles.filter((v) => v.locationType === DestinationType.Road).length,
      atPort: vehicles.filter((v) => v.locationType === DestinationType.Port).length,
      atFactory: vehicles.filter((v) => v.locationType === DestinationType.Factory).length,
    };
  }

  /**
   * Tính số xe tại từng điểm đến.
   * @param vehicles Danh sách xe cần tính toán
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private calcDestinations(vehicles: Vehicle[]): Destination[] {
    return MOCK_DESTINATIONS.map((d) => ({
      ...d,
      vehicleCount: vehicles.filter((v) => v.destinationId === d.id).length,
    }));
  }

  /**
   * Cấu hình layout mặc định khi chưa có trong localStorage.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private getDefaultLayoutConfig(): WidgetConfig[] {
    return [
      { widgetId: 'overview', size: WidgetSize.Large, collapsed: false },
      { widgetId: 'donut-border', size: WidgetSize.Small, collapsed: false },
      { widgetId: 'donut-road', size: WidgetSize.Small, collapsed: false },
      { widgetId: 'bar-factory', size: WidgetSize.Small, collapsed: false },
      { widgetId: 'bar-port', size: WidgetSize.Large, collapsed: false },
    ];
  }
}
