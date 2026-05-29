/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho LoginComponent — kiểm tra form validation, submit form, toggle password và render HTML.
 */
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SlideBannerComponent } from '../../../../shared/components/slide-banner/slide-banner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';
import { routes } from '../../../../app.routes';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mock translation data cho tests.
 */
const VI_TRANSLATIONS: Record<string, string> = {
  'login.username_placeholder': 'Tên đăng nhập',
  'login.password_placeholder': 'Mật khẩu',
  'login.err_username_required': 'Tên đăng nhập không được để trống',
  'login.err_password_required': 'Mật khẩu không được để trống',
  'login.err_username_pattern': 'Tên đăng nhập chỉ chứa chữ và số',
  'login.err_username_maxlength': 'Tên đăng nhập tối đa 50 ký tự',
  'login.err_password_maxlength': 'Mật khẩu tối đa 200 ký tự',
  'login.err_invalid_credentials': 'Tài khoản hoặc mật khẩu không đúng',
  'login.remember_me': 'Ghi nhớ đăng nhập',
  'login.forgot_password': 'Quên mật khẩu?',
  'login.btn_loading': 'Đang đăng nhập...',
  'login.btn_login': 'Đăng nhập',
  'login.qr_text': 'Quét mã QR để tải ứng dụng',
  'common.zalo': 'Zalo',
  'nav.home': 'Trang chủ',
  'header.greeting': 'Xin chào',
  'header.logout': 'Đăng xuất',
  'header.select_language': 'Chọn ngôn ngữ',
};

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho LoginComponent.
 */
describe('LoginComponent', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HeaderComponent,
        FooterComponent,
        SlideBannerComponent,
        TranslatePipe,
      ],
      providers: [
        provideRouter(routes),
        {
          provide: TranslationService,
          useValue: {
            currentLang: signal('vi'),
            translations: signal({}),
            translate: vi.fn((key: string) => VI_TRANSLATIONS[key] ?? key),
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent(): { fixture: ReturnType<typeof TestBed.createComponent<LoginComponent>>; component: LoginComponent } {
    const fixture = TestBed.createComponent(LoginComponent);
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

    it('should have empty errorMessage on init', () => {
      const { component } = createComponent();
      expect(component.errorMessage()).toBe('');
    });

    it('should have isLoading = false on init', () => {
      const { component } = createComponent();
      expect(component.isLoading()).toBe(false);
    });

    it('should have showPassword = false on init', () => {
      const { component } = createComponent();
      expect(component.showPassword()).toBe(false);
    });

    it('should have loginForm created in ngOnInit', () => {
      const { component } = createComponent();
      component.ngOnInit();
      expect(component.loginForm).toBeTruthy();
    });

    it('should have rememberMe default = true', () => {
      const { component } = createComponent();
      component.ngOnInit();
      expect(component.loginForm.get('rememberMe')?.value).toBe(true);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra form validation required.
   */
  describe('Validation - Required', () => {
    it('should mark username invalid when empty and touched', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(true);
    });

    it('should NOT mark username invalid when has value', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(false);
    });

    it('should mark password invalid when empty and touched', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('password')?.setValue('');
      component.loginForm.get('password')?.markAsTouched();
      expect(component.isFieldInvalid('password')).toBe(true);
    });

    it('should NOT mark password invalid when has value', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('password')?.setValue('admin@123');
      component.loginForm.get('password')?.markAsTouched();
      expect(component.isFieldInvalid('password')).toBe(false);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra form validation username pattern (chỉ chữ và số).
   */
  describe('Validation - Username pattern', () => {
    it('should mark username invalid when contains special chars', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin@123');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(true);
    });

    it('should mark username invalid when contains space', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin user');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(true);
    });

    it('should mark username valid for alphanumeric only', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin123');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(false);
    });

    it('should mark username valid for letters only', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(false);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra form validation maxlength.
   */
  describe('Validation - MaxLength', () => {
    it('should mark username invalid when > 50 chars', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('a'.repeat(51));
      component.loginForm.get('username')?.markAsTouched();
      expect(component.isFieldInvalid('username')).toBe(true);
    });

    it('should mark password invalid when > 200 chars', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('password')?.setValue('a'.repeat(201));
      component.loginForm.get('password')?.markAsTouched();
      expect(component.isFieldInvalid('password')).toBe(true);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra getFieldError() trả về message lỗi đúng.
   */
  describe('getFieldError()', () => {
    it('should return empty string when field is valid', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.getFieldError('username')).toBe('');
    });

    it('should return empty string when field is untouched', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('');
      expect(component.getFieldError('username')).toBe('');
    });

    it('should return required message for empty username', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.getFieldError('username')).toBe('Tên đăng nhập không được để trống');
    });

    it('should return required message for empty password', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('password')?.setValue('');
      component.loginForm.get('password')?.markAsTouched();
      expect(component.getFieldError('password')).toBe('Mật khẩu không được để trống');
    });

    it('should return pattern message for invalid username format', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('admin@');
      component.loginForm.get('username')?.markAsTouched();
      expect(component.getFieldError('username')).toBe('Tên đăng nhập chỉ chứa chữ và số');
    });

    it('should return maxlength message for long username', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('username')?.setValue('a'.repeat(51));
      component.loginForm.get('username')?.markAsTouched();
      expect(component.getFieldError('username')).toBe('Tên đăng nhập tối đa 50 ký tự');
    });

    it('should return maxlength message for long password', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.get('password')?.setValue('a'.repeat(201));
      component.loginForm.get('password')?.markAsTouched();
      expect(component.getFieldError('password')).toBe('Mật khẩu tối đa 200 ký tự');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra onSubmit() xử lý sai credentials.
   */
  describe('onSubmit() - Thất bại', () => {
    it('should show error message when credentials are wrong', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.setValue({ username: 'admin', password: 'wrongpass', rememberMe: false });
      component.onSubmit();
      expect(component.errorMessage()).toBe('Tài khoản hoặc mật khẩu không đúng');
    });

    it('should reset isLoading after failed login', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.setValue({ username: 'admin', password: 'wrongpass', rememberMe: false });
      component.onSubmit();
      expect(component.isLoading()).toBe(false);
    });

    it('should mark all fields as touched when form is invalid', () => {
      const { component } = createComponent();
      component.ngOnInit();
      component.loginForm.setValue({ username: '', password: '', rememberMe: false });
      component.onSubmit();
      expect(component.loginForm.get('username')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra toggle hiện/ẩn password.
   */
  describe('showPassword toggle', () => {
    it('should toggle showPassword from false to true', () => {
      const { component } = createComponent();
      expect(component.showPassword()).toBe(false);
      component.showPassword.set(true);
      expect(component.showPassword()).toBe(true);
    });

    it('should toggle showPassword back to false', () => {
      const { component } = createComponent();
      component.showPassword.set(true);
      component.showPassword.set(false);
      expect(component.showPassword()).toBe(false);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra render HTML của component.
   */
  describe('Render HTML', () => {
    it('should render login form with username and password fields', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#username')).toBeTruthy();
      expect(compiled.querySelector('#password')).toBeTruthy();
    });

    it('should render login button', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should NOT render error message initially', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-danger')).toBeFalsy();
    });

    it('should render error message when errorMessage is set', () => {
      const { fixture, component } = createComponent();
      component.errorMessage.set('Tài khoản hoặc mật khẩu không đúng');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.alert-danger')).toBeTruthy();
    });

    it('should render BA GPS logo', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.logo-img')).toBeTruthy();
    });

    it('should render remember me checkbox', () => {
      const { fixture } = createComponent();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#rememberMe')).toBeTruthy();
    });
  });
});
