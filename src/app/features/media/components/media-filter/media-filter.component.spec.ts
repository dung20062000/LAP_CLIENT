/**
 * Người tạo: DungBT
 * Ngày tạo: 10/06/2026
 * Mô tả: Unit test cho MediaFilterComponent — kiểm tra TreeSelect, MultiSelect, Calendar, validation và event emit.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MediaFilterComponent } from './media-filter.component';
import { MediaService } from '../../../../services/media';
import { MessageService, TreeNode } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

describe('MediaFilterComponent', () => {
  let fixture: ComponentFixture<MediaFilterComponent>;
  let component: MediaFilterComponent;
  let mediaServiceMock: any;
  let messageServiceMock: any;

  const mockGroups: TreeNode[] = [
    {
      key: 'g1',
      label: 'Group 1',
      children: [
        { key: 'c1', label: 'Child 1', children: [] },
        { key: 'c2', label: 'Child 2', children: [] },
      ],
    },
    {
      key: 'g2',
      label: 'Group 2',
      children: [],
    },
  ];

  const mockVehicles = [
    { id: 1, vehiclePlate: '29C-11111', privateCode: 'V1', XNCode: 100, displayName: 'V1 (29C-11111)' },
    { id: 2, vehiclePlate: '29C-22222', privateCode: 'V2', XNCode: 100, displayName: 'V2 (29C-22222)' },
  ];

  beforeEach(async () => {
    mediaServiceMock = {
      getVehicleGroups: vi.fn().mockReturnValue(of(mockGroups)),
      getVehiclesByGroups: vi.fn().mockReturnValue(of(mockVehicles)),
    };

    messageServiceMock = {
      add: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MediaFilterComponent],
      providers: [
        { provide: MediaService, useValue: mediaServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaFilterComponent);
    component = fixture.componentInstance;
  });

  describe('Khởi tạo', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load vehicle groups on init', () => {
      fixture.detectChanges();
      expect(mediaServiceMock.getVehicleGroups).toHaveBeenCalled();
      expect(component.vehicleGroups).toEqual(mockGroups);
      expect(component.originalVehicleGroups).toEqual(mockGroups);
    });

    it('should handle error when loading vehicle groups', () => {
      mediaServiceMock.getVehicleGroups.mockReturnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Lỗi',
        })
      );
    });
  });

  describe('Thay đổi Layout', () => {
    it('should emit layoutChange when changeLayout is called', () => {
      const emitSpy = vi.spyOn(component.layoutChange, 'emit');
      component.changeLayout(4);
      expect(emitSpy).toHaveBeenCalledWith(4);
    });
  });

  describe('Lọc TreeSelect', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter tree nodes based on search query', () => {
      const event = { target: { value: 'Child 1' } } as unknown as Event;
      component.onCustomFilter(event);
      expect(component.vehicleGroups.length).toBe(1);
      expect(component.vehicleGroups[0].key).toBe('g1');
      expect(component.vehicleGroups[0].children?.length).toBe(1);
      expect(component.vehicleGroups[0].children?.[0].key).toBe('c1');
    });

    it('should restore original list when search query is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onCustomFilter(event);
      expect(component.vehicleGroups).toEqual(mockGroups);
    });

    it('should reset search query on tree select hide/show/clear', () => {
      component.groupSearchQuery = 'test';
      component.onTreeSelectHide();
      expect(component.groupSearchQuery).toBe('');
      expect(component.vehicleGroups).toEqual(mockGroups);

      component.groupSearchQuery = 'test';
      component.onTreeSelectShow();
      expect(component.groupSearchQuery).toBe('');
      expect(component.vehicleGroups).toEqual(mockGroups);

      component.groupSearchQuery = 'test';
      component.clearSearchQuery();
      expect(component.groupSearchQuery).toBe('');
      expect(component.vehicleGroups).toEqual(mockGroups);
    });
  });

  describe('Chọn/bỏ chọn nhóm phương tiện', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate leaf nodes count correctly', () => {
      expect(component.getLeafNodesCount()).toBe(3); // Child 1, Child 2, Group 2 (since it has no children, it's a leaf)
    });

    it('should return false for isAllSelected initially', () => {
      expect(component.isAllSelected()).toBe(false);
    });

    it('should toggle select all when toggleSelectAll is called with true', () => {
      component.toggleSelectAll(true);
      expect(component.selectedGroups.length).toBe(4); // g1, c1, c2, g2
      expect(mediaServiceMock.getVehiclesByGroups).toHaveBeenCalled();
    });

    it('should deselect all when toggleSelectAll is called with false', () => {
      component.toggleSelectAll(true);
      component.toggleSelectAll(false);
      expect(component.selectedGroups.length).toBe(0);
    });
  });

  describe('Chọn/bỏ chọn Kênh', () => {
    beforeEach(() => {
      component.channelOptions = [
        { value: 1, label: 'Kênh 1' },
        { value: 2, label: 'Kênh 2' },
      ];
    });

    it('should toggle all channels', () => {
      expect(component.isAllChannelsSelected()).toBe(false);
      component.toggleAllChannels();
      expect(component.selectedChannels).toEqual([1, 2]);
      expect(component.isAllChannelsSelected()).toBe(true);

      component.toggleAllChannels();
      expect(component.selectedChannels).toEqual([]);
      expect(component.isAllChannelsSelected()).toBe(false);
    });
  });

  describe('Expand/Collapse toàn bộ', () => {
    it('should toggle isAllExpanded and expand/collapse tree nodes', () => {
      fixture.detectChanges();
      expect(component.isAllExpanded).toBe(false);
      component.toggleExpandAll();
      expect(component.isAllExpanded).toBe(true);
      expect(component.vehicleGroups[0].expanded).toBe(true);

      component.toggleExpandAll();
      expect(component.isAllExpanded).toBe(false);
      expect(component.vehicleGroups[0].expanded).toBe(false);
    });
  });

  describe('Load xe theo nhóm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load vehicles if group is selected', () => {
      component.selectedGroups = [{ key: 'c1', label: 'Child 1' }]; // leaf node
      component.onGroupsChange();
      expect(mediaServiceMock.getVehiclesByGroups).toHaveBeenCalledWith(['c1']);
      expect(component.vehicleList).toEqual(mockVehicles);
    });

    it('should clean vehicle list and emit null if no group is selected', () => {
      const submitSpy = vi.spyOn(component.searchSubmit, 'emit');
      component.selectedGroups = [];
      component.onGroupsChange();
      expect(component.vehicleList).toEqual([]);
      expect(component.selectedVehicle).toBeNull();
      expect(submitSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('Chọn xe', () => {
    it('should set channelOptions when a vehicle is selected', () => {
      component.selectedVehicle = mockVehicles[0];
      component.onVehicleChange();
      expect(component.channelOptions.length).toBe(4);
      expect(component.channelOptions[0].value).toBe(1);
    });

    it('should clear channels and emit null if vehicle is deselected', () => {
      const submitSpy = vi.spyOn(component.searchSubmit, 'emit');
      component.selectedVehicle = null;
      component.onVehicleChange();
      expect(component.channelOptions).toEqual([]);
      expect(component.selectedChannels).toEqual([]);
      expect(submitSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('Thay đổi ngày và giờ', () => {
    it('should update maxEndDate onDateChange', () => {
      component.selectedDate = new Date('2026-06-01');
      component.onDateChange();
      expect(component.maxEndDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });
  });

  describe('Tìm kiếm (onSearch)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-10T12:00:00'));
      fixture.detectChanges();
      component.selectedVehicle = mockVehicles[0];
      component.selectedDate = new Date('2026-06-10');
      component.startTime = new Date('2026-06-10T08:00:00');
      component.endTime = new Date('2026-06-10T11:00:00');
      component.selectedChannels = [1, 2];
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should emit params if all inputs are valid', () => {
      const submitSpy = vi.spyOn(component.searchSubmit, 'emit');
      component.onSearch();
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiclePlate: '29C-11111',
          customerId: 100,
          channels: [1, 2],
        })
      );
    });

    it('should show error if vehicle is not selected', () => {
      component.selectedVehicle = null;
      component.onSearch();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Vui lòng chọn xe',
        })
      );
    });

    it('should show error if date is not selected', () => {
      component.selectedDate = null;
      component.onSearch();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Vui lòng chọn ngày',
        })
      );
    });

    it('should show error if startTime is not selected', () => {
      (component as any).startTime = null;
      component.onSearch();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Vui lòng chọn giờ bắt đầu',
        })
      );
    });

    it('should show error if endTime is not selected', () => {
      (component as any).endTime = null;
      component.onSearch();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Vui lòng chọn giờ kết thúc',
        })
      );
    });

    it('should show error if startTime > endTime', () => {
      component.startTime = new Date('2026-06-10T17:00:00');
      component.endTime = new Date('2026-06-10T08:00:00');
      component.onSearch();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Giờ bắt đầu không được lớn hơn giờ kết thúc',
        })
      );
    });
  });
});
