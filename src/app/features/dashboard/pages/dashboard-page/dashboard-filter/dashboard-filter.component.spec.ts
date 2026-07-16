/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho DashboardFilterComponent — kiểm tra chọn tất cả, toggle item, search, remove, clear và emit.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';
import { DashboardFilterComponent } from './dashboard-filter.component';
import { VehicleOption } from '../../../../models/dashboard';

const mockOptions: VehicleOption[] = [
  { value: 1, label: '43C01338_C' },
  { value: 2, label: '43C01339_C' },
  { value: 3, label: '43C01340_C' },
  { value: 4, label: '43C01341_C' },
  { value: 5, label: '43C01342_C' },
];

describe('DashboardFilterComponent', () => {
  let fixture: ComponentFixture<DashboardFilterComponent>;
  let component: DashboardFilterComponent;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [DashboardFilterComponent],
    });

    fixture = TestBed.createComponent(DashboardFilterComponent);
    component = fixture.componentInstance;
    component.vehicleOptions = mockOptions;
    component.ngOnInit();
    fixture.detectChanges();
  });

  // Khởi tạo

  describe('Khởi tạo', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize selectedIds as empty array', () => {
      expect(component.selectedIds).toEqual([]);
    });

    it('should initialize isOpen as false', () => {
      expect(component.isOpen).toBe(false);
    });

    it('should initialize searchTerm as empty string', () => {
      expect(component.searchTerm).toBe('');
    });

    it('should set filteredOptions to vehicleOptions on ngOnInit', () => {
      expect(component.filteredOptions).toEqual(mockOptions);
    });
  });

  // Toggle dropdown

  describe('toggleDropdown()', () => {
    it('should open dropdown when closed', () => {
      component.isOpen = false;
      component.toggleDropdown();
      expect(component.isOpen).toBe(true);
    });

    it('should close dropdown when open', () => {
      component.isOpen = true;
      component.toggleDropdown();
      expect(component.isOpen).toBe(false);
    });

    it('should reset searchTerm when opening dropdown', () => {
      component.searchTerm = 'abc';
      component.toggleDropdown();
      expect(component.searchTerm).toBe('');
    });
  });

  // closeDropdown

  describe('closeDropdown()', () => {
    it('should set isOpen to false', () => {
      component.isOpen = true;
      component.closeDropdown();
      expect(component.isOpen).toBe(false);
    });

    it('should reset searchTerm', () => {
      component.searchTerm = 'test';
      component.closeDropdown();
      expect(component.searchTerm).toBe('');
    });

    it('should restore filteredOptions to full list', () => {
      component.filteredOptions = [];
      component.closeDropdown();
      expect(component.filteredOptions).toEqual(mockOptions);
    });
  });

  // onSearch

  describe('onSearch()', () => {
    it('should filter filteredOptions by searchTerm', () => {
      component.searchTerm = '1339';
      component.onSearch();
      expect(component.filteredOptions.length).toBe(1);
      expect(component.filteredOptions[0].value).toBe(2);
    });

    it('should return all options when searchTerm is empty', () => {
      component.searchTerm = '';
      component.onSearch();
      expect(component.filteredOptions).toEqual(mockOptions);
    });

    it('should be case-insensitive', () => {
      component.searchTerm = 'ABC';
      component.onSearch();
      expect(component.filteredOptions.length).toBe(5);
    });
  });

  // isSelected

  describe('isSelected()', () => {
    it('should return true for selected id', () => {
      component.selectedIds = [1, 3];
      expect(component.isSelected(1)).toBe(true);
      expect(component.isSelected(3)).toBe(true);
    });

    it('should return false for unselected id', () => {
      component.selectedIds = [1, 3];
      expect(component.isSelected(2)).toBe(false);
      expect(component.isSelected(99)).toBe(false);
    });
  });

  // toggleItem

  describe('toggleItem()', () => {
    it('should add id to selectedIds when not selected', () => {
      component.selectedIds = [1];
      component.toggleItem(2);
      expect(component.selectedIds).toContain(2);
      expect(component.selectedIds.length).toBe(2);
    });

    it('should remove id from selectedIds when already selected', () => {
      component.selectedIds = [1, 2, 3];
      component.toggleItem(2);
      expect(component.selectedIds).not.toContain(2);
      expect(component.selectedIds.length).toBe(2);
    });

    it('should emit updated selectedIds', () => {
      let emitted: number[] = [];
      component.filterChange.emit = (ids: number[]) => { emitted = ids; };

      component.selectedIds = [];
      component.toggleItem(1);
      expect(emitted).toEqual([1]);
    });
  });

  // toggleAllSelection

  describe('toggleAllSelection()', () => {
    it('should select all when isAllSelected is false', () => {
      component.selectedIds = [];
      component.toggleAllSelection();
      expect(component.selectedIds.length).toBe(mockOptions.length);
    });

    it('should deselect all when isAllSelected is true', () => {
      component.selectedIds = mockOptions.map(o => o.value);
      component.toggleAllSelection();
      expect(component.selectedIds).toEqual([]);
    });

    it('should emit empty array when deselecting all', () => {
      let emitted: number[] = [];
      component.filterChange.emit = (ids: number[]) => { emitted = ids; };

      component.selectedIds = mockOptions.map(o => o.value);
      component.toggleAllSelection();
      expect(emitted).toEqual([]);
    });
  });

  // removeItem

  describe('removeItem()', () => {
    it('should remove id from selectedIds', () => {
      const event = { stopPropagation: () => {} } as Event;

      component.selectedIds = [1, 2, 3];
      component.removeItem(2, event);
      expect(component.selectedIds).not.toContain(2);
      expect(component.selectedIds.length).toBe(2);
    });

    it('should stop event propagation', () => {
      let stopped = false;
      const event = { stopPropagation: () => { stopped = true; } } as Event;

      component.removeItem(1, event);
      expect(stopped).toBe(true);
    });

    it('should emit updated ids', () => {
      let emitted: number[] = [];
      component.filterChange.emit = (ids: number[]) => { emitted = ids; };
      const event = { stopPropagation: () => {} } as Event;

      component.selectedIds = [1, 2];
      component.removeItem(1, event);
      expect(emitted).toEqual([2]);
    });
  });

  // onClear

  describe('onClear()', () => {
    it('should clear all selectedIds', () => {
      const event = { stopPropagation: () => {} } as Event;

      component.selectedIds = [1, 2, 3];
      component.onClear(event);
      expect(component.selectedIds).toEqual([]);
    });

    it('should reset searchTerm', () => {
      const event = { stopPropagation: () => {} } as Event;

      component.searchTerm = 'test';
      component.onClear(event);
      expect(component.searchTerm).toBe('');
    });

    it('should emit empty array', () => {
      let emitted: number[] = [];
      component.filterChange.emit = (ids: number[]) => { emitted = ids; };
      const event = { stopPropagation: () => {} } as Event;

      component.onClear(event);
      expect(emitted).toEqual([]);
    });
  });

  // isAllSelected

  describe('isAllSelected', () => {
    it('should return true when all vehicleOptions are selected', () => {
      component.selectedIds = mockOptions.map(o => o.value);
      expect(component.isAllSelected).toBe(true);
    });

    it('should return false when some are selected', () => {
      component.selectedIds = [1, 2];
      expect(component.isAllSelected).toBe(false);
    });

    it('should return false when none are selected', () => {
      component.selectedIds = [];
      expect(component.isAllSelected).toBe(false);
    });

    it('should return false when vehicleOptions is empty', () => {
      component.vehicleOptions = [];
      component.selectedIds = [];
      expect(component.isAllSelected).toBe(false);
    });
  });

  // ngOnChanges

  describe('ngOnChanges()', () => {
    it('should remove invalid selectedIds when vehicleOptions changes', () => {
      component.selectedIds = [1, 2, 3];
      const newOptions: VehicleOption[] = [
        { value: 1, label: '43C01338_C' },
        { value: 2, label: '43C01339_C' },
      ];
      component.ngOnChanges({ vehicleOptions: { currentValue: newOptions } } as unknown as SimpleChanges);
      expect(component.selectedIds).not.toContain(3);
    });

    it('should keep valid selectedIds when vehicleOptions changes', () => {
      component.selectedIds = [1, 2];
      const newOptions: VehicleOption[] = [
        { value: 1, label: '43C01338_C' },
        { value: 2, label: '43C01339_C' },
        { value: 3, label: '43C01340_C' },
      ];
      component.ngOnChanges({ vehicleOptions: { currentValue: newOptions } } as unknown as SimpleChanges);
      expect(component.selectedIds).toContain(1);
      expect(component.selectedIds).toContain(2);
    });
  });

  // getLabelById

  describe('getLabelById()', () => {
    it('should return label for existing id', () => {
      expect(component.getLabelById(1)).toBe('43C01338_C');
    });

    it('should return empty string for unknown id', () => {
      expect(component.getLabelById(99)).toBe('');
    });
  });

  // onSearch – applySearch integration

  describe('onSearch() – applySearch integration', () => {
    it('should return all options when term is empty', () => {
      component.searchTerm = '';
      component.onSearch();
      expect(component.filteredOptions).toEqual(mockOptions);
    });

    it('should filter by label substring', () => {
      component.vehicleOptions = mockOptions;
      component.searchTerm = '1340';
      component.onSearch();
      expect(component.filteredOptions.length).toBe(1);
      expect(component.filteredOptions[0].value).toBe(3);
    });

    it('should be case-insensitive', () => {
      component.vehicleOptions = mockOptions;
      component.searchTerm = 'C0';
      component.onSearch();
      expect(component.filteredOptions.length).toBe(5);
    });
  });
});
