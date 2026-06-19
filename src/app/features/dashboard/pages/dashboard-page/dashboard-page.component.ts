// prettier-ignore
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Observable } from 'rxjs';

// prettier-ignore
import { AuthService, DashboardService } from '../../../../services';
// prettier-ignore
import { WidgetConfig, WidgetSize, VehicleOption, Vehicle, Destination, DashboardStats } from '../../../../models';

import { WidgetContainerComponent } from '../../components/widget-container/widget-container.component';
import { DashboardFilterComponent } from '../../components/dashboard-filter/dashboard-filter.component';
import { WidgetOverviewComponent } from '../../components/widget-overview/widget-overview.component';
import { WidgetDonutBorderComponent } from '../../components/widget-donut-border/widget-donut-border.component';
import { WidgetDonutRoadComponent } from '../../components/widget-donut-road/widget-donut-road.component';
import { WidgetBarPortComponent } from '../../components/widget-bar-port/widget-bar-port.component';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Dashboard Page – Màn hình chính theo dõi trạng thái xe chở hàng.
 *        - Gọi API tổng (getAllDashboardData) 1 lần khi load trang để lấy toàn bộ dữ liệu.
 *        - Khi ấn reload trên từng Widget, chỉ gọi API riêng của widget đó (refreshWidget).
 *        - Mỗi widget có loading state độc lập, hiển thị spinner khi đang reload.
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
export class DashboardPageComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Dữ liệu từng widget (giá trị thực tế nhận từ service)
  statsData: DashboardStats | null = null;
  destinationsData: Destination[] = [];
  borderVehiclesData: Vehicle[] = [];
  roadVehiclesData: Vehicle[] = [];
  factoryVehiclesData: Vehicle[] = [];
  portVehiclesData: Vehicle[] = [];

  // Trạng thái loading từng widget
  overviewLoading = false;
  borderLoading = false;
  roadLoading = false;
  factoryLoading = false;
  portLoading = false;

  // Danh sách option cho bộ lọc (id + biển số)
  vehicleOptions: VehicleOption[] = [];

  // Cấu hình layout widget
  widgetConfigs: WidgetConfig[] = [];

  // Timestamp refresh gần nhất
  lastRefresh = signal<Date>(new Date());

  constructor() {}

  ngOnInit(): void {
    this.initStreams();
    this.initLayout();
    this.loadAllData();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   * Đăng ký nhận dữ liệu và trạng thái loading từ service, gán vào các biến của component.
   */
  private initStreams(): void {
    // Hàm hỗ trợ đăng ký luồng dữ liệu, gán biến và kích hoạt cập nhật giao diện
    const subscribeTo = <T>(source$: Observable<T>, assignFn: (val: T) => void): void => {
      source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
        assignFn(val);
        this.cdr.markForCheck();
      });
    };

    // 1. Nhận dữ liệu của từng widget
    subscribeTo(this.dashboardService.statsData, (val) => (this.statsData = val));
    subscribeTo(this.dashboardService.destinationsData, (val) => (this.destinationsData = val));
    subscribeTo(this.dashboardService.borderVehiclesData, (val) => (this.borderVehiclesData = val));
    subscribeTo(this.dashboardService.roadVehiclesData, (val) => (this.roadVehiclesData = val));
    subscribeTo(
      this.dashboardService.factoryVehiclesData,
      (val) => (this.factoryVehiclesData = val),
    );
    subscribeTo(this.dashboardService.portVehiclesData, (val) => (this.portVehiclesData = val));

    // 2. Nhận trạng thái loading của từng widget
    subscribeTo(this.dashboardService.overviewLoading$, (val) => (this.overviewLoading = val));
    subscribeTo(this.dashboardService.borderLoading$, (val) => (this.borderLoading = val));
    subscribeTo(this.dashboardService.roadLoading$, (val) => (this.roadLoading = val));
    subscribeTo(this.dashboardService.factoryLoading$, (val) => (this.factoryLoading = val));
    subscribeTo(this.dashboardService.portLoading$, (val) => (this.portLoading = val));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Load cấu hình layout từ localStorage và subscribe vehicleOptions.
   */
  private initLayout(): void {
    const userId = this.getCurrentUserId();

    // Load cấu hình layout từ localStorage
    this.widgetConfigs = this.dashboardService.getLayoutConfig(userId);

    // Subscribe stream tất cả xe chỉ để lấy vehicleOptions (danh sách dropdown)
    this.dashboardService.allVehiclesDataStream
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.vehicleOptions = this.dashboardService.getVehicleOptions();
        this.cdr.markForCheck();
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   * [Gọi API tổng] Tải toàn bộ dữ liệu dashboard khi load trang lần đầu.
   * Sau khi hoàn thành sẽ cập nhật lastRefresh.
   */
  private loadAllData(): void {
    this.dashboardService
      .getAllDashboardData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.lastRefresh.set(new Date());
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[Dashboard] Lỗi khi tải dữ liệu tổng:', err);
          this.cdr.markForCheck();
        },
      });
  }

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
   * @param widgetId ID của widget cần lấy cấu hình
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
   * Làm mới toàn bộ dữ liệu dashboard: reset bộ lọc + tải lại tất cả widget.
   */
  onPageReload(): void {
    this.dashboardService
      .refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.lastRefresh.set(new Date());
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 03/06/2026
   * [Reload độc lập] Xử lý reload từng widget riêng biệt.
   * Gọi đúng API tương ứng với widgetId, chỉ cập nhật dữ liệu widget đó.
   * @param widgetId ID widget cần reload ('overview' | 'donut-border' | 'donut-road' | 'bar-factory' | 'bar-port')
   */
  onWidgetReload(widgetId: string): void {
    this.dashboardService
      .refreshWidget(widgetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(`[Dashboard] Lỗi khi reload widget "${widgetId}":`, err);
          this.cdr.markForCheck();
        },
      });
  }
}
