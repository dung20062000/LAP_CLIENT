import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from './click-outside.directive';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface MenuItem {
  label: string;
  href: string;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, ClickOutsideDirective, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private translationService = inject(TranslationService);

  hotline = '19006464';
  zaloUrl = 'https://zalo.me/19006464';

  private rawMenuItems: MenuItem[] = [
    { label: 'nav.home', href: 'https://bagps.vn/' },
    { label: 'nav.products', href: 'https://bagps.vn/san-pham-va-giai-phap' },
    { label: 'nav.news', href: 'https://bagps.vn/tin-tuc-c10' },
    { label: 'nav.payment', href: 'https://bagps.vn/huong-dan-dong-phi-dich-vu-ba-gps-d610' },
    { label: 'nav.guide', href: 'https://badoc.bagroup.vn/x/SAGhBg' },
    { label: 'nav.network', href: 'https://bagps.vn/mang-luoi' },
    { label: 'nav.about', href: 'https://bagps.vn/gioi-thieu/' },
  ];

  menuItems = computed(() =>
    this.rawMenuItems.map((item) => ({
      ...item,
      label: this.translationService.translate(item.label),
    }))
  );

  languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: 'https://img.icons8.com/color/48/vietnam-circular.png' },
    { code: 'en', label: 'English', flag: 'https://img.icons8.com/color/48/usa-circular.png' },
  ];

  get currentLang(): string {
    return this.translationService.currentLang();
  }

  langOpen = false;

  selectLang(code: string): void {
    this.translationService.changeLanguage(code);
  }

  openTab(href: string): void {
    window.open(href, '_blank');
  }
}
