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
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 * Interface chứa thông tin banner slide.
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
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 * Interface chứa thông tin banner slide đã được resolve.
 */
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
  private readonly SLIDE_INTERVAL_MS = 100000;

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
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Bắt đầu auto play banner.
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
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Dừng auto play banner.
   */
  private stopAutoPlay(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Đi đến slide index.
   */
  private goToSlide(index: number): void {
    if (!this.hasSlides()) return;
    const maxIndex = this.totalSlides() - 1;
    this.currentIndex.set(Math.max(0, Math.min(index, maxIndex)));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Đi đến slide tiếp theo.
   */
  nextSlide(): void {
    if (!this.hasSlides()) return;
    this.goToSlide((this.currentIndex() + 1) % this.totalSlides());
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Đi đến slide trước đó.
   */
  prevSlide(): void {
    if (!this.hasSlides()) return;
    const newIndex = this.currentIndex() - 1;
    this.goToSlide(newIndex < 0 ? this.totalSlides() - 1 : newIndex);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Đi đến slide index và bắt đầu auto play.
   */
  goToSlideByIndex(index: number): void {
    this.goToSlide(index);
    this.startAutoPlay();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Dừng auto play khi hover vào banner.
   */
  onMouseEnter(): void {
    this.isHovered.set(true);
    this.stopAutoPlay();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 19/06/2026
   * Bắt đầu auto play khi rời khỏi banner.
   */
  onMouseLeave(): void {
    this.isHovered.set(false);
    this.startAutoPlay();
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
            this.translationService.translate(TranslationKey.LoginErrInvalidCredentials) || response.message,
          );
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message || this.translationService.translate(TranslationKey.LoginErrInvalidCredentials);
        this.errorMessage.set(msg);
      },
    });
  }
}
