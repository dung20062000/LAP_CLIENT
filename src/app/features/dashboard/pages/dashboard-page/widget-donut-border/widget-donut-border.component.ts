// prettier-ignore
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Vehicle, Destination, DestinationType } from '../../../../../models';

const MOBILE_BREAKPOINT = 576;

/**
 * Mô tả: Widget Donut Chart – Phương tiện tại Cửa khẩu.
 *        Hiển thị phân bổ xe tại các cửa khẩu dạng hình vành khăn (Donut).
 *        Số tổng hiển thị ở giữa biểu đồ bằng graphic text.
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 */
@Component({
  selector: 'app-widget-donut-border',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './widget-donut-border.component.html',
  styleUrl: './widget-donut-border.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDonutBorderComponent implements OnChanges, OnDestroy {
  /** Danh sách xe (đã lọc từ dashboard) */
  @Input() vehicles: Vehicle[] = [];
  /** Danh sách điểm đến để lấy tên */
  @Input() destinations: Destination[] = [];

  /** ECharts option */
  chartOption: EChartsOption = {};
  /** Flag kiểm tra xem có dữ liệu hay không */
  hasData = false;

  private isMobile = false;
  private resizeHandler: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.resizeHandler = () => {
      this.updateMobile();
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Cập nhật trạng thái mobile
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private updateMobile(): void {
    const isNowMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (this.isMobile !== isNowMobile) {
      this.isMobile = isNowMobile;
      if (this.vehicles.length > 0 || this.destinations.length > 0) {
        this.buildChart();
      }
    }
  } /**
   * Xử lý thay đổi input
   * Người tạo: DungBT
   * Ngày tạo: 02/06/2026
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicles'] || changes['destinations']) {
      this.buildChart();
    }
  }

  /**
   * Mô tả: Xây dựng cấu hình ECharts Donut cho xe tại cửa khẩu.
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */

  private buildChart(): void {
    // Lọc xe đang ở cửa khẩu
    const borderVehicles = this.vehicles.filter((v) => v.locationType === DestinationType.Border);

    let loadedCount = 0;
    let emptyCount = 0;

    borderVehicles.forEach((v) => {
      if (v.hasLoad) loadedCount++;
      else emptyCount++;
    });

    const total = loadedCount + emptyCount;
    this.hasData = total > 0;

    const showLabelLine = !this.isMobile;

    const data = [
      {
        value: loadedCount,
        name: 'Phương tiện có hàng',
        itemStyle: { color: '#4db848' },
        label: { show: loadedCount > 0 && showLabelLine },
        labelLine: { show: showLabelLine },
      },
      {
        value: emptyCount,
        name: 'Phương tiện không hàng',
        itemStyle: { color: '#e67e22' },
        label: { show: emptyCount > 0 && showLabelLine },
        labelLine: { show: showLabelLine },
      },
    ];

    this.chartOption = {
      backgroundColor: 'transparent',
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '38%',
          style: {
            text: String(total),
            fontSize: 32,
            fontWeight: 800,
            fill: '#1a1a2e',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
        {
          type: 'text',
          left: 'center',
          top: '50%',
          style: {
            text: 'tổng xe',
            fontSize: 12,
            fill: '#6c757d',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[],
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> xe ({d}%)',
        backgroundColor: '#fff',
        borderColor: '#e0e0e0',
        textStyle: { color: '#333', fontSize: 13 },
      },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 12, color: '#333' },
      },
      series: [
        {
          name: 'Phương tiện tại cửa khẩu',
          type: 'pie',
          radius: ['40%', '55%'], // tăng/giảm kích thước đường kính vòng tròn (lùi ra, tiến vào)
          center: ['50%', '45%'], // căn chỉnh vị trí tâm vòng tròn (trục ngang, trục dọc)
          avoidLabelOverlap: true, // tránh overlap label
          label: {
            show: true,
            position: 'outside',
            formatter: '{c} Phương tiện ({d}%)',
            color: '#666',
            fontSize: 11,
            width: 150,
            overflow: 'break',
            lineHeight: 16,
          },
          labelLine: {
            show: showLabelLine,
            length: 15,
            length2: 5,
          },
          labelLayout: (params: any) => {
            const is100Percent = loadedCount === 0 || emptyCount === 0;
            if (is100Percent) {
              return { y: '82%' };
            }
            const isLeft = params.labelRect.x < params.rect.x;
            return {
              y: '82%',
              dx: isLeft ? 40 : -40, // Đẩy nhãn bên trái sang phải 40px, nhãn bên phải sang trái 40px
            };
          },
          data: data,
        },
      ],
    };

    this.cdr.markForCheck();
  }
}
