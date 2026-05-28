/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho TranslatePipe — kiểm tra transform key thành chuỗi dịch.
 */
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../services/translation.service';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho TranslatePipe.
 */
describe('TranslatePipe', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslationService,
          useValue: {
            currentLang: signal('vi'),
            translations: signal({ login: { btn_login: 'Đăng nhập' } }),
            translate: vi.fn((key: string) => {
              const map: Record<string, string> = {
                'login.btn_login': 'Đăng nhập',
                'common.zalo': 'Zalo',
              };
              return map[key] ?? key;
            }),
          },
        },
        TranslatePipe,
      ],
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra pipe transform() trả về chuỗi dịch đúng.
   */
  it('should return translated string for existing key', () => {
    const pipe = TestBed.inject(TranslatePipe);
    expect(pipe.transform('login.btn_login')).toBe('Đăng nhập');
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra pipe transform() trả về key gốc khi không tìm thấy.
   */
  it('should return key itself when not found', () => {
    const pipe = TestBed.inject(TranslatePipe);
    expect(pipe.transform('missing.key')).toBe('missing.key');
  });
});
