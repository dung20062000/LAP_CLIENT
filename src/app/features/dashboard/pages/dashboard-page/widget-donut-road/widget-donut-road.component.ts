// prettier-ignore
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { DestinationType, Vehicle } from '../../../../../models';

const MOBILE_BREAKPOINT = 576;

/**
 * Mô tả: Widget Donut Chart – Phương tiện đang trên đường.
 *        Hiển thị phân bổ xe đang di chuyển phân loại theo trạng thái có/không hàng.
 *        Số tổng hiển thị ở giữa biểu đồ.
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 */
@Component({
  selector: 'app-widget-donut-road',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './widget-donut-road.component.html',
  styleUrl: './widget-donut-road.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDonutRoadComponent implements OnChanges, OnDestroy {
  @Input() vehicles: Vehicle[] = [];
  /** True khi widget ở chế độ Small – dùng layout khác cho label */
  @Input() isSmall = false;

  chartOption: EChartsOption = {};
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicles'] || changes['isSmall']) {
      this.buildChart();
    }
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
    // Chỉ build lại chart khi thay đổi trạng thái giữa mobile và desktop
    if (this.isMobile !== isNowMobile) {
      this.isMobile = isNowMobile;
      if (this.vehicles.length > 0) {
        this.buildChart();
      }
    }
  }

  /**
   * Xây dựng biểu đồ donut
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  private buildChart(): void {
    const roadVehicles = this.vehicles.filter((v) => v.locationType === DestinationType.Road);

    let loadedCount = 0;
    let emptyCount = 0;

    roadVehicles.forEach((v) => {
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
          radius: ['40%', '55%'], // tăng/giảm kích thước đường kính vòng tròn (lùi ra, tiến vào)
          center: ['50%', '45%'], // căn chỉnh vị trí tâm vòng tròn (trục ngang, trục dọc)
          avoidLabelOverlap: false, // tắt để labelLayout kiểm soát hoàn toàn vị trí
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
              // 1 label duy nhất: đặt chính giữa bên dưới biểu đồ
              return { x: '50%', y: '82%', align: 'center', verticalAlign: 'top' };
            }

            if (this.isSmall) {
              // Small: container hẹp, dùng x% cố định để label không bị tràn ra mép
              const isRight = params.dataIndex === 0;
              return {
                x: isRight ? '75%' : '25%',
                y: '82%',
                align: 'center',
                verticalAlign: 'top',
              };
            }

            // Không phải Small: dùng pixel x của điểm cuối đường line (ổn định, khớp với bất kỳ kích thước nào)
            if (params.labelLinePoints && params.labelLinePoints[2]) {
              return {
                x: params.labelLinePoints[2][0],
                y: '82%',
                align: 'center',
                verticalAlign: 'top',
              };
            }
            // Fallback
            const isRight = params.dataIndex === 0;
            return {
              x: isRight ? '75%' : '25%',
              y: '82%',
              align: 'center',
              verticalAlign: 'top',
            };
          },
          data: data,
        },
      ],
    };

    this.cdr.markForCheck();
  }
}
