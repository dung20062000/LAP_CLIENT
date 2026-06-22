/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho WidgetDonutBorderComponent — kiểm tra khởi tạo chart, buildChart, phân bổ cửa khẩu và ngOnChanges.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetDonutBorderComponent } from './widget-donut-border.component';
import { Vehicle, Destination } from '../../../../models/dashboard';

describe('WidgetDonutBorderComponent', () => {
  let fixture: ComponentFixture<WidgetDonutBorderComponent>;
  let component: WidgetDonutBorderComponent;

  const makeVehicle = (overrides: Partial<Vehicle>): Vehicle => ({
    id: 1,
    licensePlate: '43C01338_C',
    driverName: 'Nguyễn Văn An',
    hasLoad: true,
    locationType: DestinationType.Border,
    ...overrides,
  });

  const makeDestination = (overrides: Partial<Destination>): Destination => ({
    id: 1,
    name: 'Cửa khẩu Mộc Bài',
    type: DestinationType.Border,
    vehicleCount: 0,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [WidgetDonutBorderComponent],
    });

    fixture = TestBed.createComponent(WidgetDonutBorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

  // ngOnChanges

  describe('ngOnChanges()', () => {
    it('should rebuild chart when vehicles changes', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Border }),
        makeVehicle({ id: 2, hasLoad: false, locationType: DestinationType.Border }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].data.length).toBeGreaterThan(0);
    });

    it('should rebuild chart when destinations changes', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true })];
      component.destinations = [makeDestination({ id: 1, name: 'Cửa khẩu Mộc Bài' })];
      component.ngOnChanges({ destinations: { currentValue: component.destinations } } as any);
      const opts = component.chartOption as any;
      expect(opts.series).toBeTruthy();
    });

    it('should not rebuild chart when unrelated input changes', () => {
      component.ngOnChanges({ otherProp: { currentValue: 'x' } } as any);
      expect(component.chartOption).toEqual({});
    });
  });

  // buildChart – hasData

  describe('buildChart() – hasData', () => {
    it('should set hasData to true when vehicles has border vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border, hasLoad: true })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      expect(component.hasData).toBe(true);
    });

    it('should set hasData to false when no border vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Factory })];
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
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Border }),
        makeVehicle({ id: 2, hasLoad: true, locationType: DestinationType.Border }),
        makeVehicle({ id: 3, hasLoad: false, locationType: DestinationType.Border }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const loadedItem = opts.series[0].data.find((d: any) => d.name === 'Phương tiện có hàng');
      const emptyItem = opts.series[0].data.find((d: any) => d.name === 'Phương tiện không hàng');
      expect(loadedItem.value).toBe(2);
      expect(emptyItem.value).toBe(1);
    });

    it('should show label only when count > 0 for loaded', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Border }),
        makeVehicle({ id: 2, hasLoad: true, locationType: DestinationType.Border }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const loadedItem = opts.series[0].data[0];
      expect(loadedItem.label.show).toBe(true);
    });

    it('should hide label when loaded count is 0', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: false, locationType: DestinationType.Border }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const loadedItem = opts.series[0].data[0];
      expect(loadedItem.label.show).toBe(false);
    });

    it('should use green color for loaded vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const loadedItem = opts.series[0].data[0];
      expect(loadedItem.itemStyle.color).toBe('#4db848');
    });

    it('should use orange color for empty vehicles', () => {
      component.vehicles = [makeVehicle({ id: 1, hasLoad: false, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const emptyItem = opts.series[0].data.find((d: any) => d.name === 'Phương tiện không hàng');
      expect(emptyItem.itemStyle.color).toBe('#e67e22');
    });
  });

  // buildChart – chartOption structure

  describe('buildChart() – chartOption structure', () => {
    it('should use pie type with donut radius', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].type).toBe('pie');
      expect(opts.series[0].radius).toEqual(['50%', '75%']);
    });

    it('should display total vehicle count in graphic text', () => {
      component.vehicles = [
        makeVehicle({ id: 1, hasLoad: true, locationType: DestinationType.Border }),
        makeVehicle({ id: 2, hasLoad: false, locationType: DestinationType.Border }),
      ];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const totalGraphic = opts.graphic[0];
      expect(totalGraphic.style.text).toBe('2');
    });

    it('should display "tổng xe" label in graphic text', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      const labelGraphic = opts.graphic[1];
      expect(labelGraphic.style.text).toBe('tổng xe');
    });

    it('should have legend at bottom with circle icon', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.legend.bottom).toBe(0);
      expect(opts.legend.icon).toBe('circle');
    });

    it('should have transparent background', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.backgroundColor).toBe('transparent');
    });

    it('should have tooltip with percentage formatter', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.tooltip.trigger).toBe('item');
      expect(opts.tooltip.formatter).toBe('{b}: <b>{c}</b> xe ({d}%)');
    });

    it('should have series name in Vietnamese', () => {
      component.vehicles = [makeVehicle({ id: 1, locationType: DestinationType.Border })];
      component.ngOnChanges({ vehicles: { currentValue: component.vehicles } } as any);
      const opts = component.chartOption as any;
      expect(opts.series[0].name).toBe('Phương tiện tại cửa khẩu');
    });
  });
});
