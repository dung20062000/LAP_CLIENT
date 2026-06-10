/**
 * Người tạo: DungBT
 * Ngày tạo: 10/06/2026
 * Mô tả: Unit test cho MediaImageCardComponent — kiểm tra hiển thị metadata, click card và download ảnh.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MediaImageCardComponent } from './media-image-card.component';
import { MediaImageItem } from '../../../../models/media';
import { describe, expect, it, beforeEach, vi } from 'vitest';

describe('MediaImageCardComponent', () => {
  let fixture: ComponentFixture<MediaImageCardComponent>;
  let component: MediaImageCardComponent;

  const mockImage: MediaImageItem = {
    channel: 1,
    imageTime: '2026-06-10T10:00:00',
    url: 'http://example.com/card.jpg',
    speed: 60,
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MediaImageCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaImageCardComponent);
    component = fixture.componentInstance;
    component.image = mockImage;
    component.index = 0;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('fakeAddress', () => {
    it('should return fake address based on index', () => {
      component.index = 0;
      expect(component.fakeAddress).toBe('Bãi đỗ 49 Đức Giang');

      component.index = 1;
      expect(component.fakeAddress).toBe('Điểm kẹp chí - KV3');
    });
  });

  describe('onCardClick()', () => {
    it('should emit index on imageClick', () => {
      const emitSpy = vi.spyOn(component.imageClick, 'emit');
      component.onCardClick();
      expect(emitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('onDownload()', () => {
    it('should stop propagation and fetch image', async () => {
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
      const mockBlob = new Blob([''], { type: 'image/jpeg' });
      const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/abc');
      const revokeObjectURLMock = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      component.onDownload(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledWith(mockImage.url);

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/abc');

      vi.unstubAllGlobals();
    });

    it('should fallback to window.open on failure', async () => {
      const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
      const fetchSpy = vi.spyOn(window, 'fetch').mockRejectedValue(new Error('CORS error'));
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component.onDownload(mockEvent);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetchSpy).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(mockImage.url, '_blank');
    });
  });
});
