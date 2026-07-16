import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ClickOutsideDirective } from './click-outside.directive';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../../services/auth';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationKey } from '../../enums/translation-key.enum';

/**
 * Item menu với label là translation key và href là đường dẫn.
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 */
interface MenuItem {
  label: TranslationKey | string;
  href: string;
}

/**
 * Component header chính của ứng dụng.
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
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
  private router = inject(Router);

  /** Trạng thái đăng nhập — lấy từ AuthService.  */
  readonly isLoggedIn = this.authService.isLoggedIn;
  /** Thông tin user hiện tại — lấy từ AuthService. */
  readonly currentUser = this.authService.currentUser;

  /** Số hotline hiển thị trên header. */
  hotline = '19006464';
  /** Đường dẫn Zalo OA của BA GPS. */
  zaloUrl = 'https://zalo.me/1958838581480438876';

  readonly TranslationKey = TranslationKey;

  /** Menu nội bộ */
  internalMenuItems = [
    { label: 'Dashboard', icon: 'fas fa-tachometer-alt', link: '/public/dashboard' },
    { label: 'Xem ảnh phương tiện', icon: 'fas fa-camera', link: '/public/media' },
    {
      label: 'Quản trị nhóm xe',
      icon: 'fas fa-users-cog',
      link: '/public/administration/vehicle-groups',
    },
    { label: 'Quản trị lái xe', icon: 'fas fa-user', link: '/public/administration/drivers' },
    {
      label: 'Quản trị lái xe v2',
      icon: 'fas fa-user',
      link: '/public/administration/drivers-new',
    },
  ];

  navOpen = false;

  /**
   * Lấy menu nội bộ match nhất với URL hiện tại.
   * Người tạo: DungBT
   * Ngày tạo: 16/07/2026
   */
  get activeInternalMenu(): { label: string; icon: string; link: string } {
    const currentUrl = this.router.url;
    // Tìm menu match nhất (dài nhất) để tránh nhầm route con
    let bestMatch = this.internalMenuItems[0];
    let maxLen = 0;
    for (const item of this.internalMenuItems) {
      if (currentUrl.startsWith(item.link) && item.link.length > maxLen) {
        maxLen = item.link.length;
        bestMatch = item;
      }
    }
    return bestMatch;
  }

  /**
   * Menu gốc chứa translation key — chưa resolve ngôn ngữ.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
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
   * Resolve translation key thành chuỗi hiển thị theo ngôn ngữ hiện tại.
   * Tự cập nhật khi currentLang thay đổi.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  menuItems = computed(() =>
    this.rawMenuItems.map((item) => ({
      ...item,
      label: this.translationService.translate(item.label),
    })),
  );

  /**
   * Danh sách ngôn ngữ hỗ trợ với flag và label.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
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
   * Lấy ngôn ngữ hiện tại từ TranslationService
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  get currentLang(): string {
    return this.translationService.currentLang();
  }

  /**
   * Lấy thông tin ngôn ngữ hiện tại từ TranslationService
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  readonly currentLangInfo = computed(
    () => this.languages.find((l) => l.code === this.currentLang) ?? this.languages[0],
  );

  /** Trạng thái mở dropdown ngôn ngữ. */
  langOpen = false;

  /** Trạng thái mở menu mobile (hamburger). */
  isMenuOpen = false;

  /**
   * Chọn ngôn ngữ và cập nhật vào TranslationService.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  selectLang(code: string): void {
    this.translationService.changeLanguage(code);
  }

  /**
   * Toggle trạng thái mở/đóng menu mobile.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Đóng menu mobile — dùng trong click-outside directive.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  /**
   * Xử lý đăng xuất qua AuthService.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  onLogout(): void {
    this.authService.logout();
  }
}
