import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Vehicle, Destination } from '../../../../models';

const MOBILE_BREAKPOINT = 576;

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Widget Donut Chart – Phương tiện tại Cửa khẩu.
 *        Hiển thị phân bổ xe tại các cửa khẩu dạng hình vành khăn (Donut).
 *        Số tổng hiển thị ở giữa biểu đồ bằng graphic text.
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
  // Danh sách xe (đã lọc từ dashboard)
  @Input() vehicles: Vehicle[] = [];
  // Danh sách điểm đến để lấy tên
  @Input() destinations: Destination[] = [];

  // ECharts option
  chartOption: EChartsOption = {};
  // Flag kiểm tra xem có dữ liệu hay không
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

  private updateMobile(): void {
    const isNowMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (this.isMobile !== isNowMobile) {
      this.isMobile = isNowMobile;
      if (this.vehicles.length > 0 || this.destinations.length > 0) {
        this.buildChart();
      }
    }
  } /**
   * Người tạo: DungBT
   * Ngày tạo: 02/06/2026
   * Xử lý thay đổi input
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicles'] || changes['destinations']) {
      this.buildChart();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xây dựng cấu hình ECharts Donut cho xe tại cửa khẩu.
   */
  private buildChart(): void {
    // Lọc xe đang ở cửa khẩu
    const borderVehicles = this.vehicles.filter((v) => v.locationType === 'border');

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
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'outside',
            formatter: '{c} Phương tiện ({d}%)',
            color: '#666',
            fontSize: 11,
          },
          labelLine: {
            show: showLabelLine,
            length: 6, // Thu ngắn đường dẫn để nhãn sát biểu đồ hơn, tránh tràn viền gây dấu ba chấm
            length2: 4,
          },
          labelLayout: {
            y: 260, // Căn chỉnh nhãn về phía chân dưới biểu đồ
          },
          data: data,
        },
      ],
    };

    this.cdr.markForCheck();
  }
}
