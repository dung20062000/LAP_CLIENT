import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services';
import { LoginRequest } from '../../../../models';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SlideBannerComponent, BannerSlide } from '../../../../shared/components/slide-banner';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent, SlideBannerComponent, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private translationService = inject(TranslationService);

  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  readonly banners: BannerSlide[] = [
    {
      id: 1,
      imageUrl: '/images/banners/BANNER_1.jpg',
      title: 'THIẾT BỊ ĐẦU GHI TÍCH HỢP GIÁM SÁT HÀNH TRÌNH',
      shortContents: 'Thiết bị đầu ghi giám sát hành trình tích hợp Camera giám sát trên xe ô tô BA-SmartCamera (BA-CAMND10-1) đáp ứng Nghị định 10/2020/NĐ-CP, Nghị định 47/2022/NĐ-CP, hợp chuẩn TCVN 13396:2021',
      link: 'https://bagps.vn/ba-smartcamera-chuan-nghi-dinh-10-p38',
      order: 1,
    },
    {
      id: 2,
      imageUrl: '/images/banners/driver_check_vehicle_Ba.jpg',
      title: 'Giải pháp Giám sát Hành trình Toàn diện',
      shortContents: 'Thiết bị giám sát hành trình chất lượng cao của BA GPS giúp doanh nghiệp tối ưu chi phí vận hành và quản lý đội xe hiệu quả trực tuyến 24/7.',
      link: 'https://bagps.vn/giam-sat-hanh-trinh-p2',
      order: 2,
    },
    {
      id: 3,
      imageUrl: '/images/banners/baexpress.jpg',
      title: 'BA Express - Chuyển phát nhanh tài liệu & hàng hóa',
      shortContents: 'Dịch vụ chuyển phát chuyên nghiệp, nhanh chóng và tin cậy trên toàn quốc với mạng lưới phủ khắp các tỉnh thành.',
      link: 'https://baexpress.vn',
      order: 3,
    },
    {
      id: 4,
      imageUrl: '/images/banners/ba_zalo_2023.jpg',
      title: 'Kết nối qua kênh Zalo Official Account',
      shortContents: 'Hỗ trợ kỹ thuật và chăm sóc khách hàng nhanh chóng tiện lợi trực tiếp trên Zalo OA của BA GPS.',
      link: 'https://zalo.me/1958838581480438876',
      order: 4,
    },
    {
      id: 5,
      imageUrl: '/images/banners/chuc_mung_nam_moi.png',
      title: 'Đồng hành cùng khách hàng trên mọi nẻo đường',
      shortContents: 'BA GPS kính chúc Quý khách hàng một năm mới an khang thịnh vượng, vạn sự như ý và có những chuyến đi thượng lộ bình an.',
      link: 'https://bagps.vn',
      order: 5,
    },
  ];

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9]+$'),
          Validators.maxLength(50),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
        ],
      ],
      rememberMe: [true],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

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

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password, rememberMe } = this.loginForm.value;

    // Hardcode check directly on Client
    if (username.trim() !== 'admin' || password !== 'admin@123') {
      this.isLoading.set(false);
      this.errorMessage.set(this.translationService.translate('login.err_invalid_credentials'));
      return;
    }

    const credentials: LoginRequest = {
      username: username.trim(),
      password,
    };

    this.authService.login(credentials, rememberMe).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage.set(response.message || this.translationService.translate('login.err_invalid_credentials'));
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || this.translationService.translate('login.err_invalid_credentials');
        this.errorMessage.set(msg);
      },
    });
  }
}
