/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Pipe dịch thuật — resolve translation key thành chuỗi hiển thị theo ngôn ngữ hiện tại.
 */
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Pipe dịch thuật với pure: false để tự cập nhật khi ngôn ngữ thay đổi.
 */
@Pipe({
  name: 'translate',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Transform translation key thành chuỗi hiển thị.
   * pure: false kết hợp với việc đọc translations signal tạo reactive dependency,
   * nhờ đó pipe tự re-evaluate mỗi khi ngôn ngữ thay đổi.
   */
  transform(key: string, params?: Record<string, string | number>): string {
    const lang = this.translationService.currentLang();
    this.translationService.translations();
    let result = this.translationService.translate(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return result;
  }
}
