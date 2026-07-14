/**
 * Người tạo: DungBT
 * Ngày tạo: 10/06/2026
 * Mô tả: Unit test cho MediaGalleryPageComponent — kiểm tra tích hợp filter, paginator, layout và dialog.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MediaGalleryPageComponent } from './media-gallery-page.component';
import { MediaService } from '../../../../services/media';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { MediaSearchParams, MediaSearchResult } from '../../../../models/media';
import { describe, expect, it, beforeEach, vi } from 'vitest';

describe('MediaGalleryPageComponent', () => {
  let fixture: ComponentFixture<MediaGalleryPageComponent>;
  let component: MediaGalleryPageComponent;
  let mediaServiceMock: any;
  let messageServiceMock: any;

  const mockParams: MediaSearchParams = {
    vehiclePlate: '29C-12345',
    customerId: 1,
    channels: [1, 2],
    startTime: '2026-06-10T00:00:00',
    endTime: '2026-06-10T23:59:59',
    sortOrder: 'desc',
    pageNumber: 1,
    pageSize: 50,
  };

  const mockSearchResult: MediaSearchResult = {
    totalCount: 100,
    items: [
      { channel: 1, imageTime: '2026-06-10T10:00:00', url: 'http://img1.jpg', speed: 10 },
      { channel: 2, imageTime: '2026-06-10T10:05:00', url: 'http://img2.jpg', speed: 20 },
    ],
  };

  beforeEach(async () => {
    mediaServiceMock = {
      getVehicleGroups: vi.fn().mockReturnValue(of([])),
      getVehiclesByGroups: vi.fn().mockReturnValue(of([])),
      searchImages: vi.fn().mockReturnValue(of(mockSearchResult)),
    };

    messageServiceMock = {
      add: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MediaGalleryPageComponent],
      providers: [
        { provide: MediaService, useValue: mediaServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaGalleryPageComponent);
    component = fixture.componentInstance;
  });

  describe('Khởi tạo', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have initial layout as 6 columns', () => {
      expect(component.activeLayout).toBe(6);
      expect(component.layoutClass).toBe('col-md-2');
    });

    it('should have initial paginator state', () => {
      expect(component.currentPage).toBe(0);
      expect(component.rows).toBe(50);
      expect(component.images.length).toBe(0);
    });
  });

  describe('onSearch()', () => {
    it('should search images and update list when params are provided', () => {
      component.onSearch(mockParams);

      expect(component.currentPage).toBe(0);
      expect(component.loading).toBe(false);
      expect(component.images).toEqual(mockSearchResult.items);
      expect(component.totalRecords).toBe(mockSearchResult.totalCount);
      expect(mediaServiceMock.searchImages).toHaveBeenCalledWith({
        ...mockParams,
        pageNumber: 1,
        pageSize: 50,
      });
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Thành công',
        })
      );
    });

    it('should clear results when search params is null', () => {
      component.images = mockSearchResult.items;
      component.totalRecords = 100;
      component.onSearch(null);

      expect(component.images).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.currentParams).toBeNull();
    });

    it('should handle search api error', () => {
      mediaServiceMock.searchImages.mockReturnValue(throwError(() => new Error('Error')));
      component.onSearch(mockParams);

      expect(component.loading).toBe(false);
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Lỗi',
        })
      );
    });
  });

  describe('onPageChange()', () => {
    it('should change current page and reload images', () => {
      component.currentParams = { ...mockParams };
      component.onPageChange({ page: 2, rows: 20 });

      expect(component.currentPage).toBe(2);
      expect(component.rows).toBe(20);
      expect(mediaServiceMock.searchImages).toHaveBeenCalledWith({
        ...mockParams,
        pageNumber: 3,
        pageSize: 20,
      });
    });

    it('should not search if currentParams is null', () => {
      component.currentParams = null;
      component.onPageChange({ page: 2, rows: 20 });
      expect(mediaServiceMock.searchImages).not.toHaveBeenCalled();
    });
  });

  describe('onLayoutChange()', () => {
    it('should change layout class to col-md-3 for 4 columns', () => {
      component.onLayoutChange(4);
      expect(component.activeLayout).toBe(4);
      expect(component.layoutClass).toBe('col-md-3');
    });

    it('should change layout class to col-20 for 5 columns', () => {
      component.onLayoutChange(5);
      expect(component.activeLayout).toBe(5);
      expect(component.layoutClass).toBe('col-20');
    });

    it('should change layout class to col-md-2 for 6 columns', () => {
      component.onLayoutChange(6);
      expect(component.activeLayout).toBe(6);
      expect(component.layoutClass).toBe('col-md-2');
    });
  });

  describe('Dialog chi tiết ảnh', () => {
    it('should open dialog and set activeIndex onImageClick', () => {
      component.onImageClick(3);
      expect(component.activeIndex).toBe(3);
      expect(component.dialogVisible).toBe(true);
    });

    it('should update dialogVisible onDialogVisibleChange', () => {
      component.onDialogVisibleChange(false);
      expect(component.dialogVisible).toBe(false);

      component.onDialogVisibleChange(true);
      expect(component.dialogVisible).toBe(true);
    });
  });
});
