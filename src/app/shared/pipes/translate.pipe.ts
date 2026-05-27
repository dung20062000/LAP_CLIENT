import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string): string {
    const lang = this.translationService.currentLang();
    // Read translations signal to create a reactive dependency
    // so this pipe re-evaluates whenever translations load.
    this.translationService.translations();
    return this.translationService.translate(key);
  }
}
