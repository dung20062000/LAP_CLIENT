/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho WidgetDonutRoadComponent — kiểm tra khởi tạo chart, buildChart, donut structure và ngOnChanges.
 */
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetDonutRoadComponent } from './widget-donut-road.component';
import { Vehicle } from '../../../../models/dashboard';

describe('WidgetDonutRoadComponent', () => {
  let fixture: ComponentFixture<WidgetDonutRoadComponent>;
  let component: WidgetDonutRoadComponent;

  const makeVehicle = (overrides: Partial<Vehicle>): Vehicle => ({
    id: 1,
    licensePlate: '43C01338_C',
    driverName: 'Nguyễn Văn An',
    hasLoad: true,
    locationType: DestinationType.Road,
    ...overrides,
  });

  beforeEach(() => {
    let currentWidth = 1200;
    Object.defineProperty(window, 'innerWidth', {
      get: () => currentWidth,
      set: (v) => { currentWidth = v; },
      configurable: true,
    });
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [WidgetDonutRoadComponent],
    });

    fixture = TestBed.createComponent(WidgetDonutRoadComponent);
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

    it('should have vehicles as empty array by default', () => {
      expect(component.vehicles).toEqual([]);
    });

    it('should have chartOption as empty object initially', () => {
      expect(component.chartOption).toEqual({});
    });

    it('should have hasData as false initially', () => {
      expect(component.hasData).toBe(false);
    });
  });

  // buildChart – labelLine responsive

  describe('buildChart() – labelLine responsive (desktop vs mobile)', () => {
    it('should show labelLine on desktop (innerWidth > 576)', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].labelLine.show).toBe(true);
      opts.series[0].data.forEach((item: any) => {
        expect(item.labelLine.show).toBe(true);
      });
    });

    it('should hide labelLine on mobile (innerWidth <= 576)', () => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].labelLine.show).toBe(false);
      opts.series[0].data.forEach((item: any) => {
        expect(item.labelLine.show).toBe(false);
      });
    });

    it('should hide label on data item when mobile even if count > 0', () => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road }),
        makeVehicle({ id: 2, hasLoad: false, locationType: DestinationType.Road }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      opts.series[0].data.forEach((item: any) => {
        expect(item.label.show).toBe(false);
      });
    });
  });

  // ngOnDestroy

  describe('ngOnDestroy()', () => {
    it('should remove resize event listener on destroy', () => {
      component.ngOnDestroy();
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  // ngOnChanges

  describe('ngOnChanges()', () => {
    it('should rebuild chart when vehicles changes', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road }),
        makeVehicle({ id: 2, hasLoad: false, locationType: DestinationType.Road }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data.length).toBeGreaterThan(0);
    });

    it('should not rebuild chart when unrelated input changes', () => {
      component.ngOnChanges({ otherProp: { currentValue: 'x' } } as any);
      expect(component.chartOption).toEqual({});
    });
  });

  // buildChart – hasData

  describe('buildChart() – hasData', () => {
    it('should set hasData to true when vehicles has road vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      expect(component.hasData).toBe(true);
    });

    it('should set hasData to false when no road vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      expect(component.hasData).toBe(false);
    });

    it('should set hasData to false when vehicles is empty', () => {
      component.vehicles = [];
      component.ngOnChanges({ vehicles: { currentValue: [] } } as any);
      expect(component.hasData).toBe(false);
    });
  });

  // buildChart – phân bổ có hàng / không hàng

  describe('buildChart() – phân bổ có hàng / không hàng', () => {
    it('should count hasLoad=true as loaded in series data', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road }),
        makeVehicle({ id: 2, hasLoad: true, locationType: DestinationType.Road }),
        makeVehicle({ id: 3, hasLoad: false, locationType: DestinationType.Road }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const loadedItem = opts.series[0].data.find((d: any) => d.name === 'Phương tiện có hàng');
      const emptyItem = opts.series[0].data.find((d: any) => d.name === 'Phương tiện không hàng');
      expect(loadedItem.value).toBe(2);
      expect(emptyItem.value).toBe(1);
    });

    it('should use green color for loaded vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const loadedItem = opts.series[0].data[0];
      expect(loadedItem.itemStyle.color).toBe('#4db848');
    });

    it('should use orange color for empty vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: false, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const emptyItem = opts.series[0].data.find((d: any) => d.name === 'Phương tiện không hàng');
      expect(emptyItem.itemStyle.color).toBe('#e67e22');
    });

    it('should show label only when count > 0 on desktop', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road }),
        makeVehicle({ id: 2, hasLoad: false, locationType: DestinationType.Road }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      opts.series[0].data.forEach((item: any) => {
        expect(item.label.show).toBe(true);
      });
    });
  });

  // buildChart – chartOption structure

  describe('buildChart() – chartOption structure', () => {
    it('should use pie type with donut radius', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].type).toBe('pie');
      expect(opts.series[0].radius).toEqual(['50%', '75%']);
    });

    it('should display total vehicle count in graphic text', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Road }),
        makeVehicle({ id: 2, hasLoad: false, locationType: DestinationType.Road }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const totalGraphic = opts.graphic[0];
      expect(totalGraphic.style.text).toBe('2');
    });

    it('should display "đang di chuyển" label in graphic text', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const labelGraphic = opts.graphic[1];
      expect(labelGraphic.style.text).toBe('đang di chuyển');
    });

    it('should have legend at bottom with circle icon', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.legend.bottom).toBe(0);
      expect(opts.legend.icon).toBe('circle');
    });

    it('should have transparent background', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.backgroundColor).toBe('transparent');
    });

    it('should have tooltip with percentage formatter', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.tooltip.trigger).toBe('item');
      expect(opts.tooltip.formatter).toBe('{b}: <b>{c}</b> xe ({d}%)');
    });

    it('should have series name in Vietnamese', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Road })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].name).toBe('Phương tiện đang trên đường');
    });
  });
});
