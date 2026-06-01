/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Widget Bar Chart – Phương tiện tại Cảng / Nhà máy.
 *        Trục X: tên bãi/cảng. Trục Y: số lượng xe.
 *        Có dataZoom slider ngang để cuộn khi nhiều cột vượt chiều rộng.
 */
import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Vehicle } from '../../../../models';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Widget Bar Chart phân bổ xe tại cảng và nhà máy.
 */
@Component({
  selector: 'app-widget-bar-port',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './widget-bar-port.component.html',
  styleUrl: './widget-bar-port.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetBarPortComponent implements OnChanges {
  /** Danh sách xe đã được lọc sẵn theo loại địa điểm (factory hoặc port) từ service */
  @Input() vehicles: Vehicle[] = [];
  /** Màu sắc cột biểu đồ */
  @Input() barColor: string = '#00c07f';
  /** Hiển thị thanh cuộn dataZoom ngang */
  @Input() showZoom: boolean = true;

  chartOption: EChartsOption = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicles']) {
      this.buildChart();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xây dựng cấu hình ECharts Bar chart.
   * Gộp xe tại cảng và nhà máy, nhóm theo tên điểm.
   */
  private buildChart(): void {
    // Data đã được lọc sẵn theo loại địa điểm từ service (không cần filter lại)
    const filteredVehicles = this.vehicles.filter((v) => v.destinationName);

    // Nhóm theo tên
    const groupMap: Record<string, number> = {};
    filteredVehicles.forEach((v) => {
      const key = v.destinationName!;
      if (!groupMap[key]) groupMap[key] = 0;
      groupMap[key]++;
    });

    const categories = Object.keys(groupMap);
    const seriesData = categories.map((k) => groupMap[k]);

    // Tự động dataZoom nếu bật và cột nhiều hơn 8
    const useZoom = this.showZoom && categories.length > 8;
    const endPercent = categories.length > 0 ? Math.min(100, (8 / categories.length) * 100) : 100;

    this.chartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: '#e0e0e0',
        textStyle: { color: '#333', fontSize: 13 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          let html = `<div style="font-weight:700;margin-bottom:4px">${params[0].axisValue}</div>`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params.forEach((p: any) => {
            html += `<div>${p.marker}Số lượng: <b>${p.value}</b> xe</div>`;
          });
          return html;
        },
      },
      grid: {
        top: 30,
        bottom: useZoom ? 60 : 30,
        left: 36,
        right: 16,
        containLabel: true,
      },
      dataZoom: useZoom
        ? [
            {
              type: 'slider',
              show: true,
              xAxisIndex: 0,
              bottom: 0,
              height: 16,
              start: 0,
              end: endPercent,
              borderColor: '#e0e0e0',
              fillerColor: 'rgba(3, 148, 214, 0.1)',
              handleStyle: { color: 'var(--primary-color, #0394d6)' },
              textStyle: { color: '#6c757d', fontSize: 10 },
            },
          ]
        : [],
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          fontSize: 10,
          color: '#333',
          rotate: categories.length > 5 ? 0 : 0, // In the image, text is not rotated, but long text might need it. Let's keep 0 and wrap or ellipsis.
          interval: 0,
          overflow: 'break',
          width: 70,
        },
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: '#dee2e6' } },
      },
      yAxis: {
        type: 'value',
        name: 'Số phương tiện',
        nameTextStyle: { fontSize: 11, color: '#6c757d', padding: [0, 0, 0, 30] },
        minInterval: 1,
        axisLabel: { fontSize: 11, color: '#6c757d' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 30,
          data: seriesData,
          label: {
            show: true,
            position: 'top',
            color: '#333',
            fontSize: 11,
          },
          itemStyle: {
            color: this.barColor,
          },
        },
      ],
    };
  }
}
