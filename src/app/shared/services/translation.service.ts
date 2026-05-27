import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly STORAGE_KEY = 'app_lang';
  private readonly DEFAULT_LANG = 'vi';

  translations = signal<Record<string, any>>({});
  currentLang = signal<string>(this.DEFAULT_LANG);

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const lang = saved || this.getBrowserLang() || this.DEFAULT_LANG;
    this.currentLang.set(lang);
    this.loadLanguage(lang);
  }

  private getBrowserLang(): string | null {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (!browserLang) return null;
    return browserLang.startsWith('en') ? 'en' : null;
  }

  loadLanguage(lang: string): void {
    this.http
      .get<Record<string, any>>(`/assets/i18n/${lang}.json`)
      .pipe(catchError(() => of({})))
      .subscribe((data) => this.translations.set(data));
  }

  changeLanguage(lang: string): void {
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.currentLang.set(lang);
    this.loadLanguage(lang);
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  }
}
