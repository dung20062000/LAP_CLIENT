import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services';
import { LoginRequest } from '../../../../models';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SlideBannerComponent, BannerSlide } from '../../../../shared/components/slide-banner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent, SlideBannerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  readonly banners: BannerSlide[] = [
    {
      id: 1,
      imageUrl: '/images/banners/BANNER_1.jpg',
      title: 'BA GPS - Hệ thống quản lý GPS thông minh',
      shortContents: 'Theo dõi và giám sát phương tiện trực tuyến 24/7 với công nghệ GPS tiên tiến nhất.',
      link: '#',
      order: 1,
    },
    {
      id: 2,
      imageUrl: '/images/banners/driver_check_vehicle_Ba.jpg',
      title: 'An toàn - Chính xác - Hiệu quả',
      shortContents: 'Giải pháp quản lý xe toàn diện cho doanh nghiệp vận tải và cá nhân.',
      link: '#',
      order: 2,
    },
    {
      id: 3,
      imageUrl: '/images/banners/baexpress.jpg',
      title: 'Kết nối mọi hành trình',
      shortContents: 'Hệ thống chi nhánh rộng khắp 6 tỉnh thành, hỗ trợ khách hàng mọi lúc.',
      link: '#',
      order: 3,
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
        ? 'Vui lòng nhập tên đăng nhập'
        : 'Vui lòng nhập mật khẩu';
    }
    if (field.errors['pattern']) {
      return 'Tên đăng nhập chỉ được chứa chữ và số';
    }
    if (field.errors['maxlength']) {
      return fieldName === 'username'
        ? 'Tên đăng nhập tối đa 50 ký tự'
        : 'Mật khẩu tối đa 200 ký tự';
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
          this.errorMessage.set(response.message || 'Tài khoản hoặc mật khẩu không đúng');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Tài khoản hoặc mật khẩu không đúng';
        this.errorMessage.set(msg);
      },
    });
  }
}
