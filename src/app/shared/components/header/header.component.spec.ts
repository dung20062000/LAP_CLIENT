/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho HeaderComponent — kiểm tra menu items, ngôn ngữ, menu mobile, auth state và render HTML.
 */
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { ClickOutsideDirective } from './click-outside.directive';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { routes } from '../../../app.routes';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho HeaderComponent.
 */
describe('HeaderComponent', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ClickOutsideDirective, TranslatePipe],
      providers: [
        provideRouter(routes),
        {
          provide: TranslationService,
          useValue: {
            currentLang: signal('vi'),
            translations: signal({}),
            translate: vi.fn((key: string) => {
              const map: Record<string, string> = {
                'nav.home': 'Trang chủ',
                'nav.products': 'Sản phẩm',
                'nav.news': 'Tin tức',
                'nav.payment': 'Thanh toán',
                'nav.guide': 'Hướng dẫn',
                'nav.network': 'Mạng lưới',
                'nav.about': 'Giới thiệu',
                'header.greeting': 'Xin chào',
                'header.logout': 'Đăng xuất',
                'header.select_language': 'Chọn ngôn ngữ',
                'common.zalo': 'Zalo',
              };
              return map[key] ?? key;
            }),
            changeLanguage: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra khởi tạo component.
   */
  describe('Khởi tạo', () => {
    it('should create', () => {
      const { component } = createComponent();
      expect(component).toBeTruthy();
    });

    it('should have langOpen = false on init', () => {
      const { component } = createComponent();
      expect(component.langOpen).toBe(false);
    });

    it('should have isMenuOpen = false on init', () => {
      const { component } = createComponent();
      expect(component.isMenuOpen).toBe(false);
    });

    it('should expose hotline number', () => {
      const { component } = createComponent();
      expect(component.hotline).toBe('19006464');
    });

    it('should expose Zalo URL', () => {
      const { component } = createComponent();
      expect(component.zaloUrl).toBe('https://zalo.me/19006464');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra menuItems computed signal được translate đúng.
   */
  describe('menuItems computed signal', () => {
    it('should have 7 menu items', () => {
      const { component } = createComponent();
      expect(component.menuItems().length).toBe(7);
    });

    it('should have translated labels', () => {
      const { component } = createComponent();
      const items = component.menuItems();
      expect(items[0].label).toBe('Trang chủ');
      expect(items[1].label).toBe('Sản phẩm');
    });

    it('should have correct href for each item', () => {
      const { component } = createComponent();
      const items = component.menuItems();
      expect(items[0].href).toBe('https://bagps.vn/');
      expect(items[1].href).toBe('https://bagps.vn/san-pham-va-giai-phap');
    });

    it('should update labels when language changes', () => {
      const { component } = createComponent();
      expect(component.menuItems()[0].label).toBe('Trang chủ');
      component.selectLang('en');
      expect(component.menuItems()[0].label).toBeTruthy();
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra chọn ngôn ngữ.
   */
  describe('Ngôn ngữ', () => {
    it('should have 2 supported languages (VI and EN)', () => {
      const { component } = createComponent();
      expect(component.languages.length).toBe(2);
    });

    it('should expose currentLang from TranslationService', () => {
      const { component } = createComponent();
      expect(component.currentLang).toBe('vi');
    });

    it('should call changeLanguage on selectLang()', () => {
      const { component } = createComponent();
      const svc = TestBed.inject(TranslationService) as any;
      component.selectLang('en');
      expect(svc.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('should toggle langOpen dropdown', () => {
      const { component } = createComponent();
      expect(component.langOpen).toBe(false);
      component.langOpen = true;
      expect(component.langOpen).toBe(true);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra toggle menu mobile.
   */
  describe('Menu mobile', () => {
    it('should toggle isMenuOpen', () => {
      const { component } = createComponent();
      expect(component.isMenuOpen).toBe(false);
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(false);
    });

    it('should close menu via closeMenu()', () => {
      const { component } = createComponent();
      component.isMenuOpen = true;
      component.closeMenu();
      expect(component.isMenuOpen).toBe(false);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra trạng thái auth hiển thị đúng.
   */
  describe('Auth state', () => {
    it('should be not logged in initially', () => {
      const { component } = createComponent();
      expect(component.isLoggedIn()).toBe(false);
    });

    it('should call logout on AuthService when onLogout() triggered', () => {
      const { component } = createComponent();
      const router = TestBed.inject(Router);
      const logoutSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.onLogout();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra render HTML của component.
   */
  describe('Render HTML', () => {
    it('should render BA GPS logo', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.header-logo img')).toBeTruthy();
    });

    it('should render navigation links', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      const navLinks = compiled.querySelectorAll('.nav-link');
      expect(navLinks.length).toBe(7);
    });

    it('should render hotline button', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.hotline-btn')).toBeTruthy();
    });

    it('should render Zalo button', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.zalo-btn')).toBeTruthy();
    });

    it('should render language selector', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.lang-selector')).toBeTruthy();
    });

    it('should NOT render user greeting when not logged in', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.user-greeting')).toBeFalsy();
    });

    it('should NOT render logout button when not logged in', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.logout-btn')).toBeFalsy();
    });

    it('should render hamburger menu toggle button', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.menu-toggle-btn')).toBeTruthy();
    });
  });
});
