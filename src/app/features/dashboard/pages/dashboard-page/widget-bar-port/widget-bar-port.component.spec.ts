/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho WidgetBarPortComponent — kiểm tra khởi tạo chart, nhóm theo destination, dataZoom và hasData.
 */
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetBarPortComponent } from './widget-bar-port.component';
import { Vehicle } from '../../../../models/dashboard';

describe('WidgetBarPortComponent', () => {
  let fixture: ComponentFixture<WidgetBarPortComponent>;
  let component: WidgetBarPortComponent;

  const makeVehicle = (overrides: Partial<Vehicle>): Vehicle => ({
    id: 1,
    licensePlate: '43C01338_C',
    driverName: 'Nguyễn Văn An',
    hasLoad: true,
    locationType: DestinationType.Port,
    destinationId: 1,
    destinationName: 'Cảng Tân Cảng Cát Lái',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [WidgetBarPortComponent],
    });

    fixture = TestBed.createComponent(WidgetBarPortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // Khởi tạo

  describe('Khởi tạo', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have chartOption as empty object initially', () => {
      expect(component.chartOption).toEqual({});
    });

    it('should have hasData as false initially', () => {
      expect(component.hasData).toBe(false);
    });

    it('should have chartWidth as "100%" by default', () => {
      expect(component.chartWidth).toBe('100%');
    });

    it('should have barColor as default green', () => {
      expect(component.barColor).toBe('#00c07f');
    });

    it('should have showZoom as true by default', () => {
      expect(component.showZoom).toBe(true);
    });
  });

  // buildChart với vehicles rỗng

  describe('buildChart() với vehicles rỗng', () => {
    it('should set hasData to false when vehicles is empty', () => {
      component.vehicles = [];
      component.ngOnChanges({ vehicles: { currentValue: [] } } as any);
      expect(component.hasData).toBe(false);
    });

    it('should have empty chartOption series when no vehicles', () => {
      component.vehicles = [];
      component.ngOnChanges({ vehicles: { currentValue: [] } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data).toEqual([]);
    });
  });

  // buildChart với vehicles có dữ liệu

  describe('buildChart() với vehicles có dữ liệu', () => {
    it('should set hasData to true when vehicles have destinationName', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      expect(component.hasData).toBe(true);
    });

    it('should group vehicles by destinationName', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái' }),
        makeVehicle({ id: 2, destinationName: 'Cảng Tân Cảng Cát Lái' }),
        makeVehicle({ id: 3, destinationName: 'Cảng Hải Phòng' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data).toEqual([2, 1]);
      expect(opts.xAxis.data).toEqual(['Cảng Tân Cảng Cát Lái', 'Cảng Hải Phòng']);
    });

    it('should strip driver name suffix " (name)" from destinationName for grouping', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái (Nguyễn Văn An)' }),
        makeVehicle({ id: 2, destinationName: 'Cảng Tân Cảng Cát Lái (Trần Văn Bình)' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data).toEqual([2]);
      expect(opts.xAxis.data[0]).toBe('Cảng Tân Cảng Cát Lái');
    });

    it('should set series bar color from barColor input', () => {
      component.barColor = '#ff0000';
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].itemStyle.color).toBe('#ff0000');
    });

    it('should exclude vehicles without destinationName', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái' }),
        makeVehicle({ id: 2, destinationName: undefined }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data).toEqual([1]);
    });

    it('should sort categories by count descending', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng A' }),
        makeVehicle({ id: 2, destinationName: 'Cảng B' }),
        makeVehicle({ id: 3, destinationName: 'Cảng B' }),
        makeVehicle({ id: 4, destinationName: 'Cảng C' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.xAxis.data).toEqual(['Cảng B', 'Cảng C', 'Cảng A']);
      expect(opts.series[0].data).toEqual([2, 1, 1]);
    });
  });

  // chartWidth

  describe('chartWidth', () => {
    it('should be "100%" when there are <= 4 categories', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng A' }),
        makeVehicle({ id: 2, destinationName: 'Cảng B' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      expect(component.chartWidth).toBe('100%');
    });

    it('should calculate dynamic width when many categories', () => {
      const manyVehicles = Array.from({ length: 30 }, (_, i) =>
        makeVehicle({ id: i, destinationName: `Cảng ${i}` })
      );
      component.vehicles = manyVehicles;
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      expect(component.chartWidth).toContain('px');
    });
  });

  // onChartInit

  describe('onChartInit()', () => {
    it('should store chart instance', () => {
      const mockInstance = { resize: vi.fn() };
      component.onChartInit(mockInstance);
      expect((component as any).chartInstance).toBe(mockInstance);
    });

    it('should call resize on chart instance after delay', () => {
      vi.useFakeTimers();
      const resizeSpy = vi.fn();
      const mockInstance = { resize: resizeSpy };
      component.onChartInit(mockInstance);
      vi.advanceTimersByTime(60);
      expect(resizeSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ngOnChanges

  describe('ngOnChanges()', () => {
    it('should rebuild chart when vehicles input changes', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data).toEqual([1]);
    });

    it('should not rebuild chart when vehicles did not change', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng Tân Cảng Cát Lái' }),
      ];
      component.ngOnChanges({});
      expect(component.chartOption).toEqual({});
    });
  });

  // dataZoom

  describe('dataZoom', () => {
    it('should disable dataZoom when showZoom is false', () => {
      component.showZoom = false;
      component.vehicles = Array.from({ length: 15 }, (_, i) =>
        makeVehicle({ id: i, destinationName: `Cảng ${i}` })
      );
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.dataZoom).toEqual([]);
    });

    it('should enable dataZoom when showZoom is true and categories > 8', () => {
      component.showZoom = true;
      component.vehicles = Array.from({ length: 12 }, (_, i) =>
        makeVehicle({ id: i, destinationName: `Cảng ${i}` })
      );
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.dataZoom.length).toBeGreaterThan(0);
    });

    it('should set dataZoom end based on ratio (8/categories)', () => {
      component.showZoom = true;
      component.vehicles = Array.from({ length: 16 }, (_, i) =>
        makeVehicle({ id: i, destinationName: `Cảng ${i}` })
      );
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const expectedEnd = Math.min(100, (8 / 16) * 100);
      expect(opts.dataZoom[0].end).toBe(expectedEnd);
    });
  });

  // Tooltip formatter

  describe('Tooltip formatter', () => {
    it('should format tooltip with vehicle count', () => {
      component.vehicles = [
        makeVehicle({ id: 1, destinationName: 'Cảng A' }),
        makeVehicle({ id: 2, destinationName: 'Cảng A' }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const formatter = opts.tooltip.formatter;
      const mockParams = [{ axisValue: 'Cảng A', marker: '●', value: 2 }];
      const result = formatter(mockParams);
      expect(result).toContain('Cảng A');
      expect(result).toContain('2');
    });
  });
});
