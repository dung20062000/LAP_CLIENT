/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho TranslationService — kiểm tra tải ngôn ngữ, resolve key, đổi ngôn ngữ và xử lý lỗi.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from './translation.service';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho TranslationService.
 */
describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'vi');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpMock = TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpClient);
    service = new TranslationService(http);
    const req = httpMock.expectOne('/assets/i18n/vi.json');
    req.flush({});
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
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

    it('should have lang = "vi" from localStorage', () => {
      expect(service.currentLang()).toBe('vi');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra translate() chỉ đọc signal, không gọi HTTP.
   */
  describe('translate()', () => {
    it('should return translated string for valid key', () => {
      service.changeLanguage('vi');
      const req = httpMock.expectOne('/assets/i18n/vi.json');
      req.flush({ login: { btn_login: 'Đăng nhập' } });
      expect(service.translate('login.btn_login')).toBe('Đăng nhập');
    });

    it('should return key itself when translation not found', () => {
      expect(service.translate('missing.key')).toBe('missing.key');
    });

    it('should resolve nested keys', () => {
      service.changeLanguage('vi');
      const req = httpMock.expectOne('/assets/i18n/vi.json');
      req.flush({ nav: { home: 'Trang chủ', products: 'Sản phẩm' } });
      expect(service.translate('nav.home')).toBe('Trang chủ');
      expect(service.translate('nav.products')).toBe('Sản phẩm');
    });

    it('should return key when nested path partially missing', () => {
      service.changeLanguage('vi');
      const req = httpMock.expectOne('/assets/i18n/vi.json');
      req.flush({ nav: { home: 'Trang chủ' } });
      expect(service.translate('nav.missing')).toBe('nav.missing');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra changeLanguage() cập nhật signal và tải file ngôn ngữ mới.
   */
  describe('changeLanguage()', () => {
    it('should update currentLang signal to en', () => {
      service.changeLanguage('en');
      httpMock.match('/assets/i18n/en.json')[0].flush({});
      expect(service.currentLang()).toBe('en');
    });

    it('should save lang to localStorage', () => {
      service.changeLanguage('en');
      httpMock.match('/assets/i18n/en.json')[0].flush({});
      expect(localStorage.getItem('app_lang')).toBe('en');
    });

    it('should load en.json when changing to English', () => {
      service.changeLanguage('en');
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush({ login: { btn_login: 'Login' } });
      expect(service.translate('login.btn_login')).toBe('Login');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra service không crash khi tải file JSON thất bại.
   */
  describe('Error handling', () => {
    it('should not crash when JSON file load fails', () => {
      service.changeLanguage('en');
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.error(new ProgressEvent('error'), { status: 404 });
      expect(service.translate('any.key')).toBe('any.key');
      expect(service.currentLang()).toBe('en');
    });
  });
});
