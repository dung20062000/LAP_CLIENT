/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Widget Tổng quan Công ty — hiển thị 3 card thống kê:
 *        Tổng phương tiện | Có hàng | Không hàng.
 */
import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';

import { DashboardStats } from '../../../../models';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Widget hiển thị thống kê tổng quan dạng 3 card màu.
 */
@Component({
  selector: 'app-widget-overview',
  standalone: true,
  imports: [],
  templateUrl: './widget-overview.component.html',
  styleUrl: './widget-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetOverviewComponent implements OnChanges {
  /** Dữ liệu thống kê từ DashboardService */
  @Input() stats: DashboardStats | null = null;

  /** Phần trăm xe có hàng */
  loadedPercent = 0;
  /** Phần trăm xe không hàng */
  emptyPercent = 0;

  ngOnChanges(): void {
    if (this.stats && this.stats.totalVehicles > 0) {
      this.loadedPercent = Math.round((this.stats.loadedVehicles / this.stats.totalVehicles) * 100);
      this.emptyPercent = 100 - this.loadedPercent;
    }
  }
}
