/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Widget Donut Chart – Phương tiện đang trên đường.
 *        Hiển thị phân bổ xe đang di chuyển phân loại theo trạng thái có/không hàng.
 *        Số tổng hiển thị ở giữa biểu đồ.
 */
import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Vehicle } from '../../../../models';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Widget Donut phân bổ xe đang di chuyển (có hàng / không hàng).
 */
@Component({
  selector: 'app-widget-donut-road',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './widget-donut-road.component.html',
  styleUrl: './widget-donut-road.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDonutRoadComponent implements OnChanges {
  // Danh sách xe (đã lọc từ dashboard)
  @Input() vehicles: Vehicle[] = [];

  chartOption: EChartsOption = {};
  // Flag kiểm tra xem có dữ liệu hay không
  hasData = false;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 02/06/2026
   * Xử lý thay đổi input
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicles']) {
      this.buildChart();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xây dựng cấu hình ECharts Donut cho xe đang trên đường.
   */
  private buildChart(): void {
    // Lọc xe trên đường
    const roadVehicles = this.vehicles.filter((v) => v.locationType === 'road');

    let loadedCount = 0;
    let emptyCount = 0;

    roadVehicles.forEach((v) => {
      if (v.hasLoad) loadedCount++;
      else emptyCount++;
    });

    const total = loadedCount + emptyCount;
    this.hasData = total > 0;

    const data = [
      {
        value: loadedCount,
        name: 'Phương tiện có hàng',
        itemStyle: { color: '#4db848' },
        label: { show: loadedCount > 0 },
        labelLine: { show: loadedCount > 0 },
      },
      {
        value: emptyCount,
        name: 'Phương tiện không hàng',
        itemStyle: { color: '#e67e22' },
        label: { show: emptyCount > 0 },
        labelLine: { show: emptyCount > 0 },
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
            text: 'đang di chuyển',
            fontSize: 11,
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
          name: 'Phương tiện đang trên đường',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          label: {
            show: true,
            position: 'outside',
            formatter: '{c} Phương tiện ({d}%)',
            color: '#666',
            fontSize: 11,
          },
          labelLine: {
            show: true,
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
  }
}
