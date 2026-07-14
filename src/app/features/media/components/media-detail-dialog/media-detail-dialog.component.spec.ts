/**
 * Người tạo: DungBT
 * Ngày tạo: 10/06/2026
 * Mô tả: Unit test cho MediaDetailDialogComponent — kiểm tra carousel, autoPlay, download ảnh và đóng dialog.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MediaDetailDialogComponent } from './media-detail-dialog.component';
import { SimpleChange } from '@angular/core';
import { MediaImageItem } from '../../../../models/media';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

describe('MediaDetailDialogComponent', () => {
  let fixture: ComponentFixture<MediaDetailDialogComponent>;
  let component: MediaDetailDialogComponent;

  const mockImages: MediaImageItem[] = [
    { channel: 1, imageTime: '2026-06-10T10:00:00', url: 'http://example.com/img1.jpg', speed: 20 },
    { channel: 2, imageTime: '2026-06-10T10:05:00', url: 'http://example.com/img2.jpg', speed: 30 },
    { channel: 3, imageTime: '2026-06-10T10:10:00', url: 'http://example.com/img3.jpg', speed: 40 },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MediaDetailDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaDetailDialogComponent);
    component = fixture.componentInstance;
    component.images = mockImages;
    component.activeIndex = 0;
    component.visible = false;
  });

  describe('Khởi tạo', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should set default properties', () => {
      expect(component.circular).toBe(true);
      expect(component.autoPlay).toBe(false);
      expect(component.currentIndex).toBe(0);
    });
  });

  describe('ngOnChanges()', () => {
    it('should sync currentIndex when activeIndex changes', () => {
      component.activeIndex = 2;
      component.ngOnChanges({
        activeIndex: new SimpleChange(0, 2, false),
      });
      expect(component.currentIndex).toBe(2);
    });

    it('should sync currentIndex when visible changes', () => {
      component.activeIndex = 1;
      component.ngOnChanges({
        visible: new SimpleChange(false, true, false),
      });
      expect(component.currentIndex).toBe(1);
    });
  });

  describe('Slideshow Navigation', () => {
    beforeEach(() => {
      component.currentIndex = 1;
    });

    it('should return correct currentImage', () => {
      expect(component.currentImage).toEqual(mockImages[1]);
    });

    it('should go to next slide', () => {
      component.next();
      expect(component.currentIndex).toBe(2);
    });

    it('should wrap around to 0 on next slide when at the end (circular = true)', () => {
      component.currentIndex = 2;
      component.next();
      expect(component.currentIndex).toBe(0);
    });

    it('should NOT wrap around to 0 on next slide when circular = false', () => {
      component.circular = false;
      component.currentIndex = 2;
      component.next();
      expect(component.currentIndex).toBe(2);
    });

    it('should go to previous slide', () => {
      component.prev();
      expect(component.currentIndex).toBe(0);
    });

    it('should wrap around to last slide on prev when at 0 (circular = true)', () => {
      component.currentIndex = 0;
      component.prev();
      expect(component.currentIndex).toBe(2);
    });

    it('should NOT wrap around to last slide on prev when circular = false', () => {
      component.circular = false;
      component.currentIndex = 0;
      component.prev();
      expect(component.currentIndex).toBe(0);
    });
  });

  describe('AutoPlay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start autoPlay slideshow and advance index', () => {
      expect(component.autoPlay).toBe(false);
      component.toggleAutoPlay();
      expect(component.autoPlay).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(component.currentIndex).toBe(1);

      vi.advanceTimersByTime(3000);
      expect(component.currentIndex).toBe(2);
    });

    it('should stop autoPlay when toggled off', () => {
      component.toggleAutoPlay(); // start
      component.toggleAutoPlay(); // stop
      expect(component.autoPlay).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(component.currentIndex).toBe(0);
    });

    it('should stop autoPlay on ngOnDestroy', () => {
      component.toggleAutoPlay(); // start
      component.ngOnDestroy();
      vi.advanceTimersByTime(3000);
      expect(component.currentIndex).toBe(0);
    });
  });

  describe('Download', () => {
    it('should trigger fetch when onDownload is called', async () => {
      const mockBlob = new Blob([''], { type: 'image/jpeg' });
      const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/123');
      const revokeObjectURLMock = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      component.onDownload(mockImages[0]);
      expect(fetchSpy).toHaveBeenCalledWith(mockImages[0].url);

      // Resolve promises
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/123');

      vi.unstubAllGlobals();
    });

    it('should fallback to window.open if fetch fails', async () => {
      const fetchSpy = vi.spyOn(window, 'fetch').mockRejectedValue(new Error('CORS'));
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component.onDownload(mockImages[0]);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetchSpy).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(mockImages[0].url, '_blank');
    });
  });

  describe('Hide Dialog', () => {
    it('should stop autoPlay and emit visibleChange when onHide is called', () => {
      const emitSpy = vi.spyOn(component.visibleChange, 'emit');
      component.autoPlay = true;
      component.onHide();
      expect(component.autoPlay).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });
});
