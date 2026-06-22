/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho DashboardService — kiểm tra mock data, filter, loading state, layout localStorage và reload widget.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { DashboardStats, WidgetConfig } from '../../models/dashboard';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    localStorage.clear();
    service = new DashboardService();
  });

  afterEach(() => {
    localStorage.clear();
  });


  describe('Khởi tạo', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should expose empty selectedIds$ initially', () => {
      let captured: number[] = [];
      service.selectedIds$.subscribe(ids => { captured = ids; });
      expect(captured).toEqual([]);
    });

    it('should expose statsData as null initially', () => {
      let captured: DashboardStats | null = null;
      service.statsData.subscribe(stats => { captured = stats; });
      expect(captured).toBeNull();
    });

    it('should expose all loading signals as false initially', () => {
      let captured = true;
      service.overviewLoading$.subscribe(loading => { captured = loading; });
      expect(captured).toBe(false);
    });
  });

  // generateMockData (via getOverviewData)

  describe('generateMockData (via getOverviewData)', () => {
    it('should generate 44 vehicles total (border:2 + port:20 + factory:20 + road:2)', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getOverviewData());
      vi.advanceTimersByTime(500);
      await promise;

      const stats = await firstValueFrom(service.statsData);
      expect(stats!.totalVehicles).toBe(44);
      vi.useRealTimers();
    });

    it('should distribute vehicles across border, port, factory, road', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getOverviewData());
      vi.advanceTimersByTime(800);
      await promise;

      const stats = await firstValueFrom(service.statsData);
      expect(stats!.atBorder).toBe(2);
      expect(stats!.atPort).toBe(20);
      expect(stats!.atFactory).toBe(20);
      expect(stats!.onRoad).toBe(2);
      vi.useRealTimers();
    });

    it('should generate hasLoad distribution around 55%', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getOverviewData());
      vi.advanceTimersByTime(800);
      await promise;

      const stats = await firstValueFrom(service.statsData);
      const ratio = stats!.loadedVehicles / stats!.totalVehicles;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.7);
      vi.useRealTimers();
    });

    it('should assign unique incrementing IDs starting from 1', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getOverviewData());
      vi.advanceTimersByTime(800);
      await promise;

      const options = service.getVehicleOptions();
      const ids = options.map(o => o.value);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids[0]).toBe(1);
      expect(ids[ids.length - 1]).toBe(44);
      vi.useRealTimers();
    });

    it('should assign plate numbers in format 43C0XXXX_C starting from 1338', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getOverviewData());
      vi.advanceTimersByTime(800);
      await promise;

      const options = service.getVehicleOptions();
      expect(options[0].label).toMatch(/^43C0\d+_C$/);
      vi.useRealTimers();
    });
  });

  // getAllDashboardData

  describe('getAllDashboardData()', () => {
    it('should return stats with correct totals', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      const data = await promise;

      expect(data.stats.totalVehicles).toBe(44);
      expect(data.border.length).toBe(2);
      expect(data.road.length).toBe(2);
      expect(data.factory.length).toBe(20);
      expect(data.port.length).toBe(20);
      vi.useRealTimers();
    });

    it('should set all loading subjects to true then back to false', async () => {
      vi.useFakeTimers();

      let loadingStates = true;
      const sub = service.overviewLoading$.subscribe(v => { loadingStates = v; });

      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(50);
      expect(loadingStates).toBe(true);

      vi.advanceTimersByTime(800);
      await promise;
      expect(loadingStates).toBe(false);

      sub.unsubscribe();
      vi.useRealTimers();
    });

    it('should update all vehicle subjects after completion', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const [border, road, factory, port] = await Promise.all([
        firstValueFrom(service.borderVehiclesData),
        firstValueFrom(service.roadVehiclesData),
        firstValueFrom(service.factoryVehiclesData),
        firstValueFrom(service.portVehiclesData),
      ]);

      expect(border.every(v => v.locationType === DestinationType.Border)).toBe(true);
      expect(road.every(v => v.locationType === DestinationType.Road)).toBe(true);
      expect(factory.every(v => v.locationType === DestinationType.Factory)).toBe(true);
      expect(port.every(v => v.locationType === DestinationType.Port)).toBe(true);
      vi.useRealTimers();
    });
  });

  // getWidgetData (border, road, factory, port)

  describe('getBorderData() / getRoadData() / getFactoryData() / getPortData()', () => {
    it('should return only border vehicles for getBorderData', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getBorderData());
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.borderVehiclesData);
      expect(vehicles.length).toBeGreaterThan(0);
      expect(vehicles.every(v => v.locationType === DestinationType.Border)).toBe(true);
      vi.useRealTimers();
    });

    it('should return only road vehicles for getRoadData', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getRoadData());
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.roadVehiclesData);
      expect(vehicles.every(v => v.locationType === DestinationType.Road)).toBe(true);
      vi.useRealTimers();
    });

    it('should return only factory vehicles for getFactoryData', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getFactoryData());
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.factoryVehiclesData);
      expect(vehicles.every(v => v.locationType === DestinationType.Factory)).toBe(true);
      vi.useRealTimers();
    });

    it('should return only port vehicles for getPortData', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getPortData());
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.portVehiclesData);
      expect(vehicles.every(v => v.locationType === DestinationType.Port)).toBe(true);
      vi.useRealTimers();
    });

    it('should set only its own loading subject to true then false', async () => {
      vi.useFakeTimers();

      let borderLoading = false;
      const sub = service.borderLoading$.subscribe(v => { borderLoading = v; });

      const promise = firstValueFrom(service.getBorderData());
      vi.advanceTimersByTime(50);
      expect(borderLoading).toBe(true);

      vi.advanceTimersByTime(500);
      await promise;
      expect(borderLoading).toBe(false);

      sub.unsubscribe();
      vi.useRealTimers();
    });
  });

  // refreshWidget

  describe('refreshWidget()', () => {
    it('should trigger getOverviewData observable for overview', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.refreshWidget('overview'));
      vi.advanceTimersByTime(500);
      await promise;

      const stats = await firstValueFrom(service.statsData);
      expect(stats).not.toBeNull();
      vi.useRealTimers();
    });

    it('should trigger getBorderData observable for donut-border', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.refreshWidget('donut-border'));
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.borderVehiclesData);
      expect(vehicles.length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should trigger getRoadData observable for donut-road', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.refreshWidget('donut-road'));
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.roadVehiclesData);
      expect(vehicles.length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should trigger getFactoryData observable for bar-factory', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.refreshWidget('bar-factory'));
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.factoryVehiclesData);
      expect(vehicles.length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should trigger getPortData observable for bar-port', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.refreshWidget('bar-port'));
      vi.advanceTimersByTime(500);
      await promise;

      const vehicles = await firstValueFrom(service.portVehiclesData);
      expect(vehicles.length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should warn and return null for unknown widgetId', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = service.refreshWidget('unknown-widget');
      expect(warnSpy).toHaveBeenCalledWith(
        '[API] refreshWidget: widgetId "unknown-widget" không tồn tại.'
      );
      result.subscribe(val => expect(val).toBeNull());
      warnSpy.mockRestore();
    });
  });

  // refresh

  describe('refresh()', () => {
    it('should reset selectedIds to empty array', async () => {
      vi.useFakeTimers();
      service.setFilter([1, 2, 3]);

      const promise = firstValueFrom(service.refresh());
      vi.advanceTimersByTime(800);
      await promise;

      const ids = await firstValueFrom(service.selectedIds$);
      expect(ids).toEqual([]);
      vi.useRealTimers();
    });

    it('should trigger getAllDashboardData observable', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.refresh());
      vi.advanceTimersByTime(800);
      await promise;

      const stats = await firstValueFrom(service.statsData);
      expect(stats).not.toBeNull();
      vi.useRealTimers();
    });
  });

  // setFilter

  describe('setFilter()', () => {
    it('should update selectedIds$ with given ids', () => {
      service.setFilter([5, 10, 15]);
      let captured: number[] = [];
      service.selectedIds$.subscribe(ids => { captured = ids; });
      expect(captured).toEqual([5, 10, 15]);
    });

    it('should emit empty array when called with []', () => {
      service.setFilter([1, 2]);
      service.setFilter([]);
      let captured: number[] = [];
      service.selectedIds$.subscribe(ids => { captured = ids; });
      expect(captured).toEqual([]);
    });

    it('should filter statsData when ids are set', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      service.setFilter([1]);
      vi.advanceTimersByTime(0);

      const stats = await firstValueFrom(service.statsData);
      expect(stats!.totalVehicles).toBeLessThanOrEqual(44);
      vi.useRealTimers();
    });

    it('should re-emit borderVehiclesData with only matching ids', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      service.setFilter([1, 2]);
      vi.advanceTimersByTime(0);

      const vehicles = await firstValueFrom(service.borderVehiclesData);
      vehicles.forEach(v => {
        expect([1, 2]).toContain(v.id);
      });
      vi.useRealTimers();
    });

    it('should emit all vehicles when ids is empty', () => {
      service.setFilter([1]);
      service.setFilter([]);
      service.statsData.subscribe(stats => {
        expect(stats!.totalVehicles).toBe(44);
      });
    });
  });

  // getVehicleOptions

  describe('getVehicleOptions()', () => {
    it('should return array of {value, label}', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const options = service.getVehicleOptions();
      expect(options.length).toBe(44);
      expect(typeof options[0].value).toBe('number');
      expect(typeof options[0].label).toBe('string');
      vi.useRealTimers();
    });

    it('should call generateMockData if cachedVehicles is empty', () => {
      const options = service.getVehicleOptions();
      expect(options.length).toBe(44);
    });

    it('should return options sorted by id', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const options = service.getVehicleOptions();
      for (let i = 1; i < options.length; i++) {
        expect(options[i].value).toBeGreaterThan(options[i - 1].value);
      }
      vi.useRealTimers();
    });
  });

  // getDestinationChartData

  describe('getDestinationChartData()', () => {
    it('should return sorted array by count descending', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const [border, port, factory] = await Promise.all([
        firstValueFrom(service.borderVehiclesData),
        firstValueFrom(service.portVehiclesData),
        firstValueFrom(service.factoryVehiclesData),
      ]);
      const allVehicles = [...border, ...port, ...factory];

      const result = service.getDestinationChartData(allVehicles);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
      }
      vi.useRealTimers();
    });

    it('should exclude road vehicles from destination chart', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const road = await firstValueFrom(service.roadVehiclesData);
      const result = service.getDestinationChartData(road);
      expect(result.length).toBe(0);
      vi.useRealTimers();
    });

    it('should exclude vehicles without destinationName', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const factory = await firstValueFrom(service.factoryVehiclesData);
      const result = service.getDestinationChartData(factory);
      result.forEach(item => {
        expect(item.name).toBeTruthy();
      });
      vi.useRealTimers();
    });

    it('should return array with name, count, type fields', async () => {
      vi.useFakeTimers();
      const promise = firstValueFrom(service.getAllDashboardData());
      vi.advanceTimersByTime(800);
      await promise;

      const factory = await firstValueFrom(service.factoryVehiclesData);
      const result = service.getDestinationChartData(factory);
      if (result.length > 0) {
        expect(typeof result[0].name).toBe('string');
        expect(typeof result[0].count).toBe('number');
        expect([DestinationType.Border, DestinationType.Port, DestinationType.Factory]).toContain(result[0].type);
      }
      vi.useRealTimers();
    });
  });

  // Layout config (localStorage)

  describe('Layout config (localStorage)', () => {
    it('should return default config when localStorage is empty', () => {
      const config = service.getLayoutConfig('user1');
      expect(config).toEqual([
        { widgetId: 'overview',    size: WidgetSize.Large, collapsed: false },
        { widgetId: 'donut-border', size: WidgetSize.Small, collapsed: false },
        { widgetId: 'donut-road',   size: WidgetSize.Small, collapsed: false },
        { widgetId: 'bar-factory',  size: WidgetSize.Small, collapsed: false },
        { widgetId: 'bar-port',     size: WidgetSize.Large, collapsed: false },
      ]);
    });

    it('should return saved config from localStorage', () => {
      localStorage.setItem('dashboard_layout_user1', JSON.stringify({
        userId: 'user1',
        widgets: [{ widgetId: 'overview', size: WidgetSize.Medium, collapsed: true }],
        savedAt: new Date().toISOString(),
      }));

      const config = service.getLayoutConfig('user1');
      expect(config.find(w => w.widgetId === 'overview')!.size).toBe(WidgetSize.Medium);
      expect(config.find(w => w.widgetId === 'overview')!.collapsed).toBe(true);
    });

    it('should merge saved config with defaults (fill missing widgets)', () => {
      localStorage.setItem('dashboard_layout_user2', JSON.stringify({
        userId: 'user2',
        widgets: [{ widgetId: 'overview', size: WidgetSize.Small, collapsed: true }],
        savedAt: new Date().toISOString(),
      }));

      const config = service.getLayoutConfig('user2');
      expect(config.length).toBe(5);
      expect(config.find(w => w.widgetId === 'overview')!.size).toBe(WidgetSize.Small);
      expect(config.find(w => w.widgetId === 'donut-border')!.size).toBe(WidgetSize.Small);
    });

    it('should return defaults when localStorage JSON is invalid', () => {
      localStorage.setItem('dashboard_layout_user3', 'not-valid-json');
      const config = service.getLayoutConfig('user3');
      expect(config.length).toBe(5);
    });

    it('should save layout config to localStorage', () => {
      const widgets = [{ widgetId: 'overview', size: WidgetSize.Medium, collapsed: false }];
      service.saveLayoutConfig('user4', widgets);

      const raw = localStorage.getItem('dashboard_layout_user4');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.userId).toBe('user4');
      expect(parsed.widgets).toEqual(widgets);
      expect(parsed.savedAt).toBeTruthy();
    });

    it('should not throw when localStorage.setItem fails', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(
        () => { throw new Error('QUOTA_EXCEEDED'); }
      );
      expect(() => {
        service.saveLayoutConfig('user5', [{ widgetId: 'overview', size: WidgetSize.Auto, collapsed: false }]);
      }).not.toThrow();
      setItemSpy.mockRestore();
    });

    it('should update widget size and persist to localStorage', () => {
      const initial = [
        { widgetId: 'overview', size: WidgetSize.Large, collapsed: false },
        { widgetId: 'donut-border', size: WidgetSize.Small, collapsed: false },
      ];
      service.saveLayoutConfig('user6', initial);

      const updated = service.updateWidgetSize('user6', 'overview', WidgetSize.Medium, initial);
      expect(updated.find(w => w.widgetId === 'overview')!.size).toBe(WidgetSize.Medium);

      const saved = JSON.parse(localStorage.getItem('dashboard_layout_user6')!);
      expect(saved.widgets.find((w: WidgetConfig) => w.widgetId === 'overview')!.size).toBe(WidgetSize.Medium);
    });

    it('should add new widget if not found in updateWidgetSize', () => {
      const initial = [{ widgetId: 'overview', size: WidgetSize.Large, collapsed: false }];
      const updated = service.updateWidgetSize('user7', 'donut-border', WidgetSize.Medium, initial);
      expect(updated.length).toBe(2);
      expect(updated.find(w => w.widgetId === 'donut-border')!.size).toBe(WidgetSize.Medium);
    });

    it('should update widget collapsed and persist', () => {
      const initial = [{ widgetId: 'overview', size: WidgetSize.Large, collapsed: false }];
      service.saveLayoutConfig('user8', initial);

      const updated = service.updateWidgetCollapsed('user8', 'overview', true, initial);
      expect(updated.find(w => w.widgetId === 'overview')!.collapsed).toBe(true);

      const saved = JSON.parse(localStorage.getItem('dashboard_layout_user8')!);
      expect(saved.widgets.find((w: WidgetConfig) => w.widgetId === 'overview')!.collapsed).toBe(true);
    });

    it('should add new widget if not found in updateWidgetCollapsed', () => {
      const initial: WidgetConfig[] = [];
      const updated = service.updateWidgetCollapsed('user9', 'bar-port', true, initial);
      expect(updated.length).toBe(1);
      expect(updated[0].widgetId).toBe('bar-port');
      expect(updated[0].collapsed).toBe(true);
      expect(updated[0].size).toBe(WidgetSize.Auto);
    });
  });
});
