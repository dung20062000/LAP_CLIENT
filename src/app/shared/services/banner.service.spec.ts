/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho BannerService — kiểm tra lấy danh sách banner từ mock data.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BannerService } from './banner.service';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho BannerService.
 */
describe('BannerService', () => {
  let service: BannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(BannerService);
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra service được tạo thành công.
   */
  describe('Khởi tạo service', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra getBanners() trả về Observable.
   */
  describe('getBanners()', () => {
    it('should return an Observable', () => {
      const result = service.getBanners();
      expect(result).toBeTruthy();
    });

    it('should return mock banner array', async () => {
      const banners = await service.getBanners().toPromise();
      expect(Array.isArray(banners)).toBe(true);
      expect(banners!.length).toBeGreaterThan(0);
    });

    it('should have 5 banners in mock data', async () => {
      const banners = await service.getBanners().toPromise();
      expect(banners!.length).toBe(5);
    });

    it('should have banners with VI and EN translations', async () => {
      const banners = await service.getBanners().toPromise();
      banners!.forEach((banner) => {
        expect(banner.title).toBeTruthy();
        expect(typeof banner.title.vi).toBe('string');
        expect(typeof banner.title.en).toBe('string');
        expect(banner.title.vi.length).toBeGreaterThan(0);
        expect(banner.title.en.length).toBeGreaterThan(0);
      });
    });

    it('should have banners with required fields', async () => {
      const banners = await service.getBanners().toPromise();
      banners!.forEach((banner) => {
        expect(typeof banner.id).toBe('number');
        expect(typeof banner.imageUrl).toBe('string');
        expect(banner.shortContents).toBeTruthy();
        expect(typeof banner.order).toBe('number');
      });
    });

    it('should have banners ordered correctly', async () => {
      const banners = await service.getBanners().toPromise();
      banners!.forEach((banner, index) => {
        expect(banner.order).toBe(index + 1);
      });
    });

    it('should have links for banners that have them', async () => {
      const banners = await service.getBanners().toPromise();
      banners!.forEach((banner) => {
        if (banner.link) {
          expect(banner.link).toContain('https://');
        }
      });
    });

    it('should include BA-SmartCamera banner (DVR device)', async () => {
      const banners = await service.getBanners().toPromise();
      const dvrBanner = banners!.find((b) => b.title.vi.includes('ĐẦU GHI'));
      expect(dvrBanner).toBeTruthy();
    });

    it('should include BA Express banner', async () => {
      const banners = await service.getBanners().toPromise();
      const expressBanner = banners!.find((b) => b.title.vi.includes('BA Express'));
      expect(expressBanner).toBeTruthy();
    });

    it('should include Zalo banner', async () => {
      const banners = await service.getBanners().toPromise();
      const zaloBanner = banners!.find((b) => b.title.vi.includes('Zalo'));
      expect(zaloBanner).toBeTruthy();
    });
  });
});
