/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Dashboard Page – Màn hình chính theo dõi trạng thái xe chở hàng.
 *        Orchestrate tất cả widget, quản lý layout, bộ lọc và auto-refresh.
 *        Mỗi widget nhận stream dữ liệu riêng (border/road/factory/port).
 */
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, DashboardService } from '../../../../services';
import {
  WidgetConfig,
  WidgetSize,
  Vehicle,
  VehicleOption,
  DashboardStats,
  Destination,
} from '../../../../models';

import { WidgetContainerComponent } from '../../components/widget-container/widget-container.component';
import { DashboardFilterComponent } from '../../components/dashboard-filter/dashboard-filter.component';
import { WidgetOverviewComponent } from '../../components/widget-overview/widget-overview.component';
import { WidgetDonutBorderComponent } from '../../components/widget-donut-border/widget-donut-border.component';
import { WidgetDonutRoadComponent } from '../../components/widget-donut-road/widget-donut-road.component';
import { WidgetBarPortComponent } from '../../components/widget-bar-port/widget-bar-port.component';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Component dashboard chính – theo dõi trạng thái xe chở hàng.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    WidgetContainerComponent,
    DashboardFilterComponent,
    WidgetOverviewComponent,
    WidgetDonutBorderComponent,
    WidgetDonutRoadComponent,
    WidgetBarPortComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ─── Thống kê tổng quan (từ toàn bộ xe, không lọc) ──────────────────────
  stats: DashboardStats | null = null;
  destinations: Destination[] = [];

  // ─── Dữ liệu stream riêng cho từng widget ────────────────────────────────
  borderVehicles: Vehicle[] = [];
  roadVehicles: Vehicle[] = [];
  factoryVehicles: Vehicle[] = [];
  portVehicles: Vehicle[] = [];

  // ─── Danh sách option cho bộ lọc (id + biển số) ──────────────────────────
  vehicleOptions: VehicleOption[] = [];

  // ─── Cấu hình layout widget ───────────────────────────────────────────────
  widgetConfigs: WidgetConfig[] = [];

  // ─── Timestamp refresh gần nhất ──────────────────────────────────────────
  lastRefresh = signal<Date>(new Date());

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const userId = this.getCurrentUserId();

    // Load cấu hình layout từ localStorage
    this.widgetConfigs = this.dashboardService.getLayoutConfig(userId);

    // Subscribe stream tất cả xe (cho thống kê tổng quan + tải danh sách option)
    this.dashboardService.allVehicles$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.vehicleOptions = this.dashboardService.getVehicleOptions();
      this.lastRefresh.set(new Date());
      this.cdr.markForCheck();
    });

    // Subscribe stats
    this.dashboardService.stats$.pipe(takeUntil(this.destroy$)).subscribe((stats) => {
      this.stats = stats;
      this.cdr.markForCheck();
    });

    // Subscribe destinations
    this.dashboardService.destinations$.pipe(takeUntil(this.destroy$)).subscribe((destinations) => {
      this.destinations = destinations;
      this.cdr.markForCheck();
    });

    // Subscribe stream xe tại Cửa khẩu
    this.dashboardService.borderVehicles$.pipe(takeUntil(this.destroy$)).subscribe((vehicles) => {
      this.borderVehicles = vehicles;
      this.cdr.markForCheck();
    });

    // Subscribe stream xe Đang trên đường
    this.dashboardService.roadVehicles$.pipe(takeUntil(this.destroy$)).subscribe((vehicles) => {
      this.roadVehicles = vehicles;
      this.cdr.markForCheck();
    });

    // Subscribe stream xe tại Nhà máy
    this.dashboardService.factoryVehicles$.pipe(takeUntil(this.destroy$)).subscribe((vehicles) => {
      this.factoryVehicles = vehicles;
      this.cdr.markForCheck();
    });

    // Subscribe stream xe tại Cảng
    this.dashboardService.portVehicles$.pipe(takeUntil(this.destroy$)).subscribe((vehicles) => {
      this.portVehicles = vehicles;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lấy userId để làm key localStorage.
   */
  getCurrentUserId(): string {
    const user = this.authService.currentUser();
    return String(user?.id || user?.username || 'default');
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lấy cấu hình widget theo ID.
   * @param widgetId ID của widget cần lấy cấu hình
   */
  getWidgetConfig(widgetId: string): WidgetConfig {
    return (
      this.widgetConfigs.find((w) => w.widgetId === widgetId) || {
        widgetId,
        size: 'auto',
        collapsed: false,
      }
    );
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Tính toán động class Bootstrap col cho các widget dựa trên kích thước cấu hình
   */
  getWidgetColClass(widgetId: string): string {
    const config = this.getWidgetConfig(widgetId);
    const size = config.size || 'auto';

    // overview và bar-port mặc định là full-width col-12
    if (widgetId === 'overview' || widgetId === 'bar-port') {
      if (size === 'small') return 'col-12 col-md-4';
      if (size === 'medium') return 'col-12 col-md-8';
      if (size === 'large') return 'col-12';
      return 'col-12'; // auto
    }

    // Tính toán động cho dòng giữa (donut-border, donut-road, bar-factory)
    const middleClasses = this.getMiddleWidgetColClasses();
    return middleClasses[widgetId] || 'col-12';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Tính toán phân bổ cột cho 3 widget dòng giữa để tối ưu diện tích hàng
   */
  private getMiddleWidgetColClasses(): Record<string, string> {
    const configs = {
      'donut-border': { default: 3, size: this.getWidgetConfig('donut-border').size || 'auto' },
      'donut-road': { default: 3, size: this.getWidgetConfig('donut-road').size || 'auto' },
      'bar-factory': { default: 6, size: this.getWidgetConfig('bar-factory').size || 'auto' },
    };

    const fixedWidths: Record<string, number> = {};
    const autoWidgets: string[] = [];
    let fixedSum = 0;

    for (const [id, cfg] of Object.entries(configs)) {
      if (cfg.size === 'small') {
        fixedWidths[id] = 4;
        fixedSum += 4;
      } else if (cfg.size === 'medium') {
        fixedWidths[id] = 8;
        fixedSum += 8;
      } else if (cfg.size === 'large') {
        fixedWidths[id] = 12;
        fixedSum += 12;
      } else {
        autoWidgets.push(id);
      }
    }

    const result: Record<string, string> = {};

    // 1. Gán class cho các widget cố định kích thước
    for (const [id, width] of Object.entries(fixedWidths)) {
      result[id] = `col-12 col-md-${width}`;
    }

    // 2. Phân bổ động cho các widget ở trạng thái 'auto'
    if (autoWidgets.length === 3) {
      return {
        'donut-border': 'col-12 col-md-3',
        'donut-road': 'col-12 col-md-3',
        'bar-factory': 'col-12 col-md-6',
      };
    }

    if (autoWidgets.length > 0) {
      const remaining = 12 - fixedSum;
      const minRequired = autoWidgets.length * 3; // tối thiểu 3 cột để không bị quá bé

      if (remaining >= minRequired) {
        if (autoWidgets.length === 1) {
          result[autoWidgets[0]] = `col-12 col-md-${remaining}`;
        } else {
          // 2 widget auto
          const id1 = autoWidgets[0];
          const id2 = autoWidgets[1];
          const def1 = configs[id1 as keyof typeof configs].default;
          const def2 = configs[id2 as keyof typeof configs].default;

          let col1 = Math.round(remaining * (def1 / (def1 + def2)));
          let col2 = remaining - col1;

          if (col1 < 3) {
            col1 = 3;
            col2 = remaining - 3;
          } else if (col2 < 3) {
            col2 = 3;
            col1 = remaining - 3;
          }

          result[id1] = `col-12 col-md-${col1}`;
          result[id2] = `col-12 col-md-${col2}`;
        }
      } else {
        // Không đủ không gian trên hàng hiện tại -> Để tự động xuống hàng theo kích thước mặc định
        autoWidgets.forEach((id) => {
          const def = configs[id as keyof typeof configs].default;
          result[id] = `col-12 col-md-${def}`;
        });
      }
    }

    return result;
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xử lý khi bộ lọc thay đổi – gửi danh sách Vehicle.id xuống service.
   * @param ids Danh sách Vehicle.id đang được chọn (rỗng = tất cả)
   */
  onFilterChange(ids: number[]): void {
    this.dashboardService.setFilter(ids);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xử lý thay đổi kích thước widget → lưu vào localStorage.
   * @param widgetId ID widget
   * @param size     Kích thước mới
   */
  onWidgetSizeChange(widgetId: string, size: WidgetSize): void {
    const userId = this.getCurrentUserId();
    this.widgetConfigs = this.dashboardService.updateWidgetSize(
      userId,
      widgetId,
      size,
      this.widgetConfigs,
    );
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xử lý thay đổi trạng thái collapsed → lưu vào localStorage.
   * @param widgetId  ID widget
   * @param collapsed Trạng thái thu gọn mới
   */
  onWidgetCollapsedChange(widgetId: string, collapsed: boolean): void {
    const userId = this.getCurrentUserId();
    this.widgetConfigs = this.dashboardService.updateWidgetCollapsed(
      userId,
      widgetId,
      collapsed,
      this.widgetConfigs,
    );
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Làm mới toàn bộ dữ liệu dashboard: reset bộ lọc + tải dữ liệu mới.
   */
  onPageReload(): void {
    this.dashboardService.refresh();
    this.lastRefresh.set(new Date());
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xử lý reload từng widget (hiện tại dữ liệu đã được stream, không cần thêm logic).
   * @param _widgetId ID widget (dùng khi mở rộng sau này để refresh riêng từng widget)
   */
  onWidgetReload(_widgetId: string): void {
    // TODO: Mở rộng sau – gọi refresh stream riêng của từng widget theo widgetId
    this.cdr.markForCheck();
  }
}
