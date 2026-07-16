import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/**
 * Pipe dịch thuật với pure: false để tự cập nhật khi ngôn ngữ thay đổi.
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 */
@Pipe({
  name: 'translate',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  /**
   * @param key: key dịch thuật
   * @param params: params để thay thế trong chuỗi
   * Transform translation key thành chuỗi hiển thị.
   * pure: false kết hợp với việc đọc translations signal tạo reactive dependency,
   * nhờ đó pipe tự re-evaluate mỗi khi ngôn ngữ thay đổi.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  transform(key: string, params?: Record<string, string | number>): string {
    let result = this.translationService.translate(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return result;
  }
}
