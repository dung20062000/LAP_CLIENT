import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
// prettier-ignore
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services';
import { LoginRequest } from '../../../../models';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';
import { BannerService } from '../../../../shared/services/banner.service';
import { TranslationKey } from '../../../../shared/enums/translation-key.enum';

/**
 * Interface chứa thông tin banner slide.
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 */
export interface BannerSlide {
  id: string | number;
  imageUrl: string;
  title: { vi: string; en: string };
  shortContents: { vi: string; en: string };
  link?: string;
  order?: number;
  active?: boolean;
}

/**
 * Interface chứa thông tin banner slide đã được resolve.
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 */
export interface ResolvedBannerSlide extends Omit<BannerSlide, 'title' | 'shortContents'> {
  title: string;
  shortContents: string;
}

/**
 * Component trang đăng nhập.
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, HeaderComponent, FooterComponent, TranslatePipe],
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
  usernameControl!: AbstractControl | null;
  passwordControl!: AbstractControl | null;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');
  readonly TranslationKey = TranslationKey;

  // --- Banner State ---
  readonly banners = toSignal(this.bannerService.getBanners(), {
    initialValue: [] as BannerSlide[],
  });
  readonly currentIndex = signal(0);
  readonly isHovered = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_INTERVAL_MS = 5000;

  readonly resolvedSlides = computed<ResolvedBannerSlide[]>(() => {
    const lang = this.translationService.currentLang() as 'vi' | 'en';
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
    this.usernameControl = this.loginForm.get('username');
    this.passwordControl = this.loginForm.get('password');
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Bắt đầu auto play banner.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  private startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.hasSlides() && this.totalSlides() > 1) {
      this.intervalId = setInterval(() => {
        this.nextSlide();
      }, this.SLIDE_INTERVAL_MS);
    }
  }

  /**
   * Dừng auto play banner.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  private stopAutoPlay(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Đi đến slide index.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  private goToSlide(index: number): void {
    if (!this.hasSlides()) return;
    const maxIndex = this.totalSlides() - 1;
    this.currentIndex.set(Math.max(0, Math.min(index, maxIndex)));
  }

  /**
   * Đi đến slide tiếp theo.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  nextSlide(): void {
    if (!this.hasSlides()) return;
    this.goToSlide((this.currentIndex() + 1) % this.totalSlides());
  }

  /**
   * Đi đến slide trước đó.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  prevSlide(): void {
    if (!this.hasSlides()) return;
    const newIndex = this.currentIndex() - 1;
    this.goToSlide(newIndex < 0 ? this.totalSlides() - 1 : newIndex);
  }

  /**
   * Đi đến slide index và bắt đầu auto play.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  goToSlideByIndex(index: number): void {
    this.goToSlide(index);
    this.startAutoPlay();
  }

  /**
   * Dừng auto play khi hover vào banner.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  onMouseEnter(): void {
    this.isHovered.set(true);
    this.stopAutoPlay();
  }

  /**
   * Bắt đầu auto play khi rời khỏi banner.
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   */
  onMouseLeave(): void {
    this.isHovered.set(false);
    this.startAutoPlay();
  }

  /**
   * Xử lý submit form:
   * - Validate form, markAllAsTouched nếu invalid.
   * - Gọi AuthService.login, điều hướng về returnUrl hoặc /dashboard nếu thành công.
   * - Hiển thị error message nếu thất bại.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
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
            this.translationService.translate(TranslationKey.LoginErrInvalidCredentials) ||
              response.message,
          );
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message ||
          this.translationService.translate(TranslationKey.LoginErrInvalidCredentials);
        this.errorMessage.set(msg);
      },
    });
  }
}
