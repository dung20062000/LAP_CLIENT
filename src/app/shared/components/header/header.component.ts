import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  hotline = '19006464';
  zaloUrl = 'https://zalo.me/19006464';

  menuItems = [
    { label: 'Trang chủ', href: 'https://bagps.vn/' },
    { label: 'Sản phẩm', href: 'https://bagps.vn/san-pham-va-giai-phap' },
    { label: 'Tin tức', href: 'https://bagps.vn/tin-tuc-c10' },
    { label: 'Đóng phí', href: 'https://bagps.vn/huong-dan-dong-phi-dich-vu-ba-gps-d610' },
    { label: 'Hướng dẫn', href: 'https://badoc.bagroup.vn/x/SAGhBg' },
    { label: 'Mạng lưới', href: 'https://bagps.vn/mang-luoi' },
    { label: 'Về chúng tôi', href: 'https://bagps.vn/gioi-thieu/' },
  ];

  languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: 'https://img.icons8.com/color/48/vietnam-circular.png' },
    { code: 'en', label: 'English', flag: 'https://img.icons8.com/color/48/usa-circular.png' },
  ];

  currentLang = 'vi';
  zaloText = 'Zalo';
  langOpen = false;

  selectLang(code: string): void {
    this.currentLang = code;
    this.langOpen = false;
  }

  openTab(href: string): void {
    window.open(href, '_blank');
  }
}
