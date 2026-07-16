import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { Vehicle } from '../../../../../models';

/**
 * Mô tả: Widget Bar Chart – Phương tiện tại Cảng / Nhà máy.
 *        Trục X: tên bãi/cảng. Trục Y: số lượng xe.
 *        Có dataZoom slider ngang để cuộn khi nhiều cột vượt chiều rộng.
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
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
  /** Flag kiểm tra xem có dữ liệu hay không */
  hasData = false;
  /** Độ rộng động của chart */
  chartWidth = '100%';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chartInstance: any;

  /**
   * Khởi tạo ECharts
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChartInit(ec: any): void {
    this.chartInstance = ec;
    setTimeout(() => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    }, 50);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicles']) {
      this.buildChart();
    }
  }

  /**
   * Xây dựng cấu hình ECharts Bar chart.
   * Gộp xe tại cảng và nhà máy, nhóm theo tên điểm.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private buildChart(): void {
    // Data đã được lọc sẵn theo loại địa điểm từ service (không cần filter lại)
    const filteredVehicles = this.vehicles.filter((v) => v.destinationName);

    // Nhóm theo tên (loại bỏ phần lái xe trong ngoặc đơn nếu có để gom nhóm chính xác theo địa điểm)
    const groupMap: Record<string, number> = {};
    filteredVehicles.forEach((v) => {
      const key = v.destinationName!.split(' (')[0];
      if (!groupMap[key]) groupMap[key] = 0;
      groupMap[key]++;
    });

    const categories = Object.keys(groupMap);
    const seriesData = categories.map((k) => groupMap[k]);
    this.hasData = categories.length > 0;

    // Tính toán độ rộng của chart dựa trên số lượng phần tử để hỗ trợ cuộn ngang
    const colWidth = 90; // Độ rộng tối thiểu cho mỗi cột (bao gồm khoảng trống giữa các cột)
    const calculatedWidth = categories.length * colWidth + 80; // Cộng thêm margin cho grid
    this.chartWidth = calculatedWidth > 400 ? `${calculatedWidth}px` : '100%';

    // Resize chart khi độ rộng thay đổi
    setTimeout(() => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    }, 50);

    // Tự động dataZoom nếu bật và cột nhiều hơn 8 (chỉ bật khi không cuộn ngang bằng CSS)
    const useZoom = this.showZoom && categories.length > 8 && calculatedWidth <= 400;
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
        left: 90, // Dịch cột Y về bên phải để label của Y nằm gọn bên trái
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
          rotate: 0,
          interval: 0,
          overflow: 'break',
          width: 90, // Tăng độ rộng nhãn của cột trục x lên
        },
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: '#dee2e6' } },
      },
      yAxis: {
        type: 'value',
        name: 'Số phương tiện',
        nameTextStyle: { fontSize: 11, color: '#6c757d', padding: [0, 125, 0, 0] },
        minInterval: 1,
        axisLabel: {
          fontSize: 11,
          color: '#6c757d',
          margin: 12, // Dịch các label cách xa đường trục y một chút
        },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 25, // độ rộng cột
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
