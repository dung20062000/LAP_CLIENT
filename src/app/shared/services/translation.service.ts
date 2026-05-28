/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Service quản lý đa ngôn ngữ — load file JSON theo ngôn ngữ,
 *         lưu trữ lang hiện tại vào localStorage, hỗ trợ VI và EN.
 */
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Service singleton quản lý i18n cho toàn ứng dụng.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  // Key lưu ngôn ngữ vào localStorage.
  private readonly STORAGE_KEY = 'app_lang';
  // Ngôn ngữ mặc định khi không có lang lưu trước đó.
  private readonly DEFAULT_LANG = 'vi';

  // Tín hiệu chứa toàn bộ translations đã load — thay đổi trigger re-render.
  translations = signal<Record<string, any>>({});
  // Ngôn ngữ hiện tại — thay đổi trigger computed trong các component.
  currentLang = signal<string>(this.DEFAULT_LANG);

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * @param http: HttpClient để tải file JSON translation.
   * Khởi tạo: ưu tiên localStorage > browser language > DEFAULT_LANG.
   */
  constructor(private http: HttpClient) {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const lang = saved || this.getBrowserLang() || this.DEFAULT_LANG;
    this.currentLang.set(lang);
    this.loadLanguage(lang);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Lấy ngôn ngữ từ browser. Trả về 'en' nếu browser là tiếng Anh, null nếu không.
   */
  private getBrowserLang(): string | null {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (!browserLang) return null;
    return browserLang.startsWith('en') ? 'en' : null;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * @param lang: ngôn ngữ chọn
   * Load file JSON translation theo ngôn ngữ từ thư mục /assets/i18n/.
   * catchError trả về {} nếu load thất bại — tránh crash ứng dụng.
   */
  loadLanguage(lang: string): void {
    this.http
      .get<Record<string, any>>(`/assets/i18n/${lang}.json`)
      .pipe(catchError(() => of({})))
      .subscribe((data) => this.translations.set(data));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * @param lang: ngôn ngữ chọn
   * Thay đổi ngôn ngữ: lưu vào localStorage, cập nhật signal, load file mới.
   */
  changeLanguage(lang: string): void {
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.currentLang.set(lang);
    this.loadLanguage(lang);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * @param key: key dịch thuật
   * Resolve translation key thành chuỗi hiển thị.
   * Ví dụ: 'nav.home' -> đọc translations()['nav']['home'].
   * Trả về key gốc nếu không tìm thấy (fallback).
   */
  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  }
}
