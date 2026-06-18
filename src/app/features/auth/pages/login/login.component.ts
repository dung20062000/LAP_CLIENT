import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services';
import { LoginRequest } from '../../../../models';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';
import { BannerService } from '../../../../shared/services/banner.service';

export interface BannerSlide {
  id: string | number;
  imageUrl: string;
  title: { vi: string; en: string };
  shortContents: { vi: string; en: string };
  link?: string;
  order?: number;
  active?: boolean;
}

export interface ResolvedBannerSlide extends Omit<BannerSlide, 'title' | 'shortContents'> {
  title: string;
  shortContents: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 * Component trang đăng nhập.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bannerService = inject(BannerService);

  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  // --- Banner State ---
  readonly banners = toSignal(this.bannerService.getBanners(), {
    initialValue: [] as BannerSlide[],
  });
  readonly currentIndex = signal(0);
  readonly isHovered = signal(false);

  readonly currentLang = (): string => this.translationService.currentLang();

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_INTERVAL_MS = 100000;

  readonly resolvedSlides = computed<ResolvedBannerSlide[]>(() => {
    const lang = this.currentLang() as 'vi' | 'en';
    return this.banners().map((slide) => ({
      ...slide,
      title: slide.title[lang] ?? slide.title['vi'],
      shortContents: slide.shortContents[lang] ?? slide.shortContents['vi'],
    }));
  });

  readonly hasSlides = computed(() => this.resolvedSlides().length > 0);
  readonly currentSlide = computed(() => {
    if (!this.hasSlides()) return null;
    return this.resolvedSlides()[this.currentIndex()] || null;
  });
  readonly totalSlides = computed(() => this.resolvedSlides().length);
  readonly dotIndices = computed(() => {
    if (!this.hasSlides()) return [];
    const count = Math.min(this.resolvedSlides().length, 5);
    return Array.from({ length: count }, (_, i) => i);
  });

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$'), Validators.maxLength(50)],
      ],
      password: ['', [Validators.required, Validators.maxLength(200)]],
      rememberMe: [true],
    });
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  // --- Banner Methods ---
  private startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.hasSlides() && this.totalSlides() > 1) {
      this.intervalId = setInterval(() => {
        this.nextSlide();
      }, this.SLIDE_INTERVAL_MS);
    }
  }

  private stopAutoPlay(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private goToSlide(index: number): void {
    if (!this.hasSlides()) return;
    const maxIndex = this.totalSlides() - 1;
    this.currentIndex.set(Math.max(0, Math.min(index, maxIndex)));
  }

  nextSlide(): void {
    if (!this.hasSlides()) return;
    this.goToSlide((this.currentIndex() + 1) % this.totalSlides());
  }

  prevSlide(): void {
    if (!this.hasSlides()) return;
    const newIndex = this.currentIndex() - 1;
    this.goToSlide(newIndex < 0 ? this.totalSlides() - 1 : newIndex);
  }

  goToSlideByIndex(index: number): void {
    this.goToSlide(index);
    this.startAutoPlay();
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
    this.stopAutoPlay();
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    this.startAutoPlay();
  }

  // --- Form Methods ---
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * @param fieldName: tên field
   * Trả về message lỗi đầu tiên của field dựa trên các validation rule.
   * Message được resolve qua TranslationService theo ngôn ngữ hiện tại.
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors || !(field.touched || field.dirty)) return '';

    if (field.errors['required']) {
      return fieldName === 'username'
        ? this.translationService.translate('login.err_username_required')
        : this.translationService.translate('login.err_password_required');
    }
    if (field.errors['pattern']) {
      return this.translationService.translate('login.err_username_pattern');
    }
    if (field.errors['maxlength']) {
      return fieldName === 'username'
        ? this.translationService.translate('login.err_username_maxlength')
        : this.translationService.translate('login.err_password_maxlength');
    }
    return '';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Xử lý submit form:
   * - Validate form, markAllAsTouched nếu invalid.
   * - Gọi AuthService.login, điều hướng về returnUrl hoặc /dashboard nếu thành công.
   * - Hiển thị error message nếu thất bại.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password, rememberMe } = this.loginForm.value;

    const credentials: LoginRequest = {
      username: username.trim(),
      password,
    };

    this.authService.login(credentials, rememberMe).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          this.router.navigate([returnUrl || '/public/dashboard']);
        } else {
          this.errorMessage.set(
            response.message || this.translationService.translate('login.err_invalid_credentials'),
          );
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message || this.translationService.translate('login.err_invalid_credentials');
        this.errorMessage.set(msg);
      },
    });
  }
}
