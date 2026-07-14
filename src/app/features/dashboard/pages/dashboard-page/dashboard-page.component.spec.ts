/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho DashboardPageComponent — kiểm tra khởi tạo, gọi API, filter, resize widget và layout.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardService } from '../../../../services/dashboard';
import { AuthService } from '../../../../services/auth';
import { WidgetContainerComponent } from '../../components/widget-container/widget-container.component';
import { DashboardFilterComponent } from '../../components/dashboard-filter/dashboard-filter.component';
import { WidgetOverviewComponent } from '../../components/widget-overview/widget-overview.component';
import { WidgetDonutBorderComponent } from '../../components/widget-donut-border/widget-donut-border.component';
import { WidgetDonutRoadComponent } from '../../components/widget-donut-road/widget-donut-road.component';
import { WidgetBarPortComponent } from '../../components/widget-bar-port/widget-bar-port.component';
import { DashboardStats, WidgetConfig, Vehicle, Destination, VehicleOption, WidgetSize } from '../../../../models/dashboard';

const mockStats: DashboardStats = {
  totalVehicles: 44,
  loadedVehicles: 25,
  emptyVehicles: 19,
  atBorder: 2,
  onRoad: 2,
  atPort: 20,
  atFactory: 20,
};

const mockVehicleOptions: VehicleOption[] = [
  { value: 1, label: '43C01338_C' },
  { value: 2, label: '43C01339_C' },
];

const defaultWidgets: WidgetConfig[] = [
  { widgetId: 'overview',     size: WidgetSize.Large, collapsed: false },
  { widgetId: 'donut-border', size: WidgetSize.Small, collapsed: false },
  { widgetId: 'donut-road',   size: WidgetSize.Small, collapsed: false },
  { widgetId: 'bar-factory',  size: WidgetSize.Small, collapsed: false },
  { widgetId: 'bar-port',     size: WidgetSize.Large, collapsed: false },
];

interface MockDashboardService {
  statsData: Subject<DashboardStats | null>;
  destinationsData: Subject<Destination[]>;
  borderVehiclesData: Subject<Vehicle[]>;
  roadVehiclesData: Subject<Vehicle[]>;
  factoryVehiclesData: Subject<Vehicle[]>;
  portVehiclesData: Subject<Vehicle[]>;
  overviewLoading$: Subject<boolean>;
  borderLoading$: Subject<boolean>;
  roadLoading$: Subject<boolean>;
  factoryLoading$: Subject<boolean>;
  portLoading$: Subject<boolean>;
  allVehiclesDataStream: Subject<VehicleOption[]>;
  getAllDashboardData: () => ReturnType<Subject<DashboardStats | null>['asObservable']>;
  refresh: () => ReturnType<Subject<DashboardStats | null>['asObservable']>;
  refreshWidget: (id?: string) => ReturnType<Subject<DashboardStats | null>['asObservable']>;
  setFilter: (ids: number[]) => void;
  getLayoutConfig: () => WidgetConfig[];
  updateWidgetSize: (uid: string, wid: string, size: WidgetSize, current: WidgetConfig[]) => WidgetConfig[];
  updateWidgetCollapsed: (uid: string, wid: string, collapsed: boolean, current: WidgetConfig[]) => WidgetConfig[];
  getVehicleOptions: () => VehicleOption[];
  emitMockData: () => void;
}

interface MockAuthService {
  currentUser: ReturnType<Subject<{ id: number; username: string }>['asObservable']>;
  logout: () => void;
}

function createMockDashboardService(): MockDashboardService {
  const statsData$ = new Subject<DashboardStats | null>();
  const allVehiclesDataStream$ = new Subject<VehicleOption[]>();

  return {
    statsData: statsData$,
    destinationsData: new Subject<Destination[]>(),
    borderVehiclesData: new Subject<Vehicle[]>(),
    roadVehiclesData: new Subject<Vehicle[]>(),
    factoryVehiclesData: new Subject<Vehicle[]>(),
    portVehiclesData: new Subject<Vehicle[]>(),
    overviewLoading$: new Subject<boolean>(),
    borderLoading$: new Subject<boolean>(),
    roadLoading$: new Subject<boolean>(),
    factoryLoading$: new Subject<boolean>(),
    portLoading$: new Subject<boolean>(),
    allVehiclesDataStream: allVehiclesDataStream$,

    getAllDashboardData: () => statsData$.asObservable(),
    refresh: () => statsData$.asObservable(),
    refreshWidget: () => statsData$.asObservable(),
    setFilter: () => {},
    getLayoutConfig: () => [...defaultWidgets],
    updateWidgetSize: (_uid: string, _wid: string, size: WidgetSize, current: WidgetConfig[]) =>
      current.map(w => ({ ...w, size })),
    updateWidgetCollapsed: (_uid: string, _wid: string, collapsed: boolean, current: WidgetConfig[]) =>
      current.map(w => ({ ...w, collapsed })),
    getVehicleOptions: () => [...mockVehicleOptions],

    emitMockData() {
      statsData$.next(mockStats);
      allVehiclesDataStream$.next(mockVehicleOptions);
    },
  };
}

function createMockAuthService(): MockAuthService {
  const currentUser$ = new Subject<{ id: number; username: string }>();
  currentUser$.next({ id: 1, username: 'admin' });
  return {
    currentUser: currentUser$.asObservable(),
    logout: () => {},
  };
}

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let mockDash: ReturnType<typeof createMockDashboardService>;
  let mockAuth: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    mockDash = createMockDashboardService();
    mockAuth = createMockAuthService();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [
        DashboardPageComponent,
        WidgetContainerComponent,
        DashboardFilterComponent,
        WidgetOverviewComponent,
        WidgetDonutBorderComponent,
        WidgetDonutRoadComponent,
        WidgetBarPortComponent,
      ],
    })
      .overrideComponent(DashboardPageComponent, {
        set: {
          providers: [
            { provide: DashboardService, useValue: mockDash },
            { provide: AuthService, useValue: mockAuth },
          ],
        },
      });

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose vehicleOptions after data loaded', () => {
    mockDash.emitMockData();
    fixture.detectChanges();
    expect(component.vehicleOptions.length).toBe(mockVehicleOptions.length);
  });

  it('should set lastRefresh date after data loaded', () => {
    mockDash.emitMockData();
    fixture.detectChanges();
    expect(component.lastRefresh()).toBeTruthy();
  });

  it('should call setFilter when onFilterChange is called', () => {
    const setFilterSpy = { called: false, ids: [] as number[] };
    mockDash.setFilter = (ids: number[]) => {
      setFilterSpy.called = true;
      setFilterSpy.ids = ids;
    };

    component.onFilterChange([1, 2, 3]);
    expect(setFilterSpy.called).toBe(true);
    expect(setFilterSpy.ids).toEqual([1, 2, 3]);
  });

  it('should pass empty array when clearing filter', () => {
    const setFilterSpy = { called: false, ids: [] as number[] };
    mockDash.setFilter = (ids: number[]) => {
      setFilterSpy.called = true;
      setFilterSpy.ids = ids;
    };

    component.onFilterChange([]);
    expect(setFilterSpy.called).toBe(true);
    expect(setFilterSpy.ids).toEqual([]);
  });

  it('should update widget size on onWidgetSizeChange', () => {
    component.onWidgetSizeChange('overview', WidgetSize.Medium);
    const cfg = component.getWidgetConfig('overview');
    expect(cfg.size).toBe(WidgetSize.Medium);
  });

  it('should update widget collapsed on onWidgetCollapsedChange', () => {
    component.onWidgetCollapsedChange('overview', true);
    const cfg = component.getWidgetConfig('overview');
    expect(cfg.collapsed).toBe(true);
  });

  it('should call refresh on onPageReload', () => {
    let refreshCalled = false;
    mockDash.refresh = () => {
      refreshCalled = true;
      return new Subject<DashboardStats | null>().asObservable();
    };

    component.ngOnInit();
    fixture.detectChanges();
    component.onPageReload();
    expect(refreshCalled).toBe(true);
  });

  it('should call refreshWidget for each valid widgetId', () => {
    let calledWith = '';
    mockDash.refreshWidget = (id?: string) => {
      calledWith = id ?? '';
      return new Subject<DashboardStats | null>().asObservable();
    };

    component.ngOnInit();
    fixture.detectChanges();

    ['overview', 'donut-border', 'donut-road', 'bar-factory', 'bar-port'].forEach(id => {
      component.onWidgetReload(id);
      expect(calledWith).toBe(id);
    });
  });

  it('should not throw for unknown widgetId onWidgetReload', () => {
    expect(() => component.onWidgetReload('unknown-widget')).not.toThrow();
  });

  it('should return col-12 for overview at default large size', () => {
    expect(component.getWidgetColClass('overview')).toBe('col-12');
  });

  it('should return col-12 col-md-4 for overview at small size', () => {
    component.widgetConfigs = defaultWidgets.map(w =>
      w.widgetId === 'overview' ? { ...w, size: WidgetSize.Small } : w
    );
    expect(component.getWidgetColClass('overview')).toBe('col-12 col-md-4');
  });

  it('should return col-12 col-md-8 for overview at medium size', () => {
    component.widgetConfigs = defaultWidgets.map(w =>
      w.widgetId === 'overview' ? { ...w, size: WidgetSize.Medium } : w
    );
    expect(component.getWidgetColClass('overview')).toBe('col-12 col-md-8');
  });

  it('should fall back to col-12 for unknown widgetId', () => {
    expect(component.getWidgetColClass('nonexistent-widget')).toBe('col-12');
  });

  it('should return config for known widgetId', () => {
    const cfg = component.getWidgetConfig('overview');
    expect(cfg.widgetId).toBe('overview');
    expect(cfg.size).toBe(WidgetSize.Large);
  });

  it('should return default for unknown widgetId', () => {
    const cfg = component.getWidgetConfig('unknown');
    expect(cfg.widgetId).toBe('unknown');
    expect(cfg.size).toBe(WidgetSize.Auto);
    expect(cfg.collapsed).toBe(false);
  });

  it('should return user id as string', () => {
    const userId = component.getCurrentUserId();
    expect(typeof userId).toBe('string');
  });


});
