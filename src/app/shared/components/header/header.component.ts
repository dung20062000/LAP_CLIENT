import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ClickOutsideDirective } from './click-outside.directive';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../../services/auth';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationKey } from '../../enums/translation-key.enum';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Item menu với label là translation key và href là đường dẫn.
 */
interface MenuItem {
  label: TranslationKey | string;
  href: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Component header chính của ứng dụng.
 */
@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, ClickOutsideDirective, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);

  // Trạng thái đăng nhập — lấy từ AuthService.
  readonly isLoggedIn = this.authService.isLoggedIn;
  // Thông tin user hiện tại — lấy từ AuthService.
  readonly currentUser = this.authService.currentUser;

  // Số hotline hiển thị trên header.
  hotline = '19006464';
  // Đường dẫn Zalo OA của BA GPS.
  zaloUrl = 'https://zalo.me/1958838581480438876';

  readonly TranslationKey = TranslationKey;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Menu gốc chứa translation key — chưa resolve ngôn ngữ.
   */
  private rawMenuItems: MenuItem[] = [
    { label: TranslationKey.NavHome, href: 'https://bagps.vn/' },
    { label: TranslationKey.NavProducts, href: 'https://bagps.vn/san-pham-va-giai-phap' },
    { label: TranslationKey.NavNews, href: 'https://bagps.vn/tin-tuc-c10' },
    {
      label: TranslationKey.NavPayment,
      href: 'https://bagps.vn/huong-dan-dong-phi-dich-vu-ba-gps-d610',
    },
    { label: TranslationKey.NavGuide, href: 'https://badoc.bagroup.vn/x/SAGhBg' },
    { label: TranslationKey.NavNetwork, href: 'https://bagps.vn/mang-luoi' },
    { label: TranslationKey.NavAbout, href: 'https://bagps.vn/gioi-thieu/' },
  ];

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Resolve translation key thành chuỗi hiển thị theo ngôn ngữ hiện tại.
   * Tự cập nhật khi currentLang thay đổi.
   */
  menuItems = computed(() =>
    this.rawMenuItems.map((item) => ({
      ...item,
      label: this.translationService.translate(item.label),
    })),
  );

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Danh sách ngôn ngữ hỗ trợ với flag và label.
   */
  languages = [
    {
      code: 'vi',
      label: 'Tiếng Việt',
      flag: 'https://img.icons8.com/color/48/vietnam-circular.png',
    },
    {
      code: 'en',
      label: 'English',
      flag: 'https://img.icons8.com/color/48/usa-circular.png',
      href: 'https://bagps.vn/en/',
    },
  ];

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Lấy ngôn ngữ hiện tại từ TranslationService
   */
  get currentLang(): string {
    return this.translationService.currentLang();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Lấy thông tin ngôn ngữ hiện tại từ TranslationService
   */
  readonly currentLangInfo = computed(
    () => this.languages.find((l) => l.code === this.currentLang) ?? this.languages[0],
  );

  // Trạng thái mở dropdown ngôn ngữ.
  langOpen = false;

  // Trạng thái mở menu mobile (hamburger).
  isMenuOpen = false;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Chọn ngôn ngữ và cập nhật vào TranslationService.
   */
  selectLang(code: string): void {
    this.translationService.changeLanguage(code);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Toggle trạng thái mở/đóng menu mobile.
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Đóng menu mobile — dùng trong click-outside directive.
   */
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Xử lý đăng xuất qua AuthService.
   */
  onLogout(): void {
    this.authService.logout();
  }
}
