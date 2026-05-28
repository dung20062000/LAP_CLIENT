/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Trang đăng nhập với form reactive, validation, hiển thị banner, header và footer.
 */
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services';
import { LoginRequest } from '../../../../models';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SlideBannerComponent } from '../../../../shared/components/slide-banner';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/services/translation.service';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Component trang đăng nhập.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    SlideBannerComponent,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private translationService = inject(TranslationService);

  // Form đăng nhập
  loginForm!: FormGroup;
  // loading khi submit
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Khởi tạo form với các validation rule.
   * Username: bắt buộc, chỉ chữ và số, tối đa 50 ký tự.
   * Password: bắt buộc, tối đa 200 ký tự.
   */
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$'), Validators.maxLength(50)],
      ],
      password: ['', [Validators.required, Validators.maxLength(200)]],
      rememberMe: [true],
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * @param fieldName: tên field
   * Kiểm tra field có lỗi và đã được touch hoặc dirty chưa.
   * Dùng để hiển thị border đỏ và error message.
   */
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
   * - Hardcode check admin/admin@123 ở client (tạm thời).
   * - Gọi AuthService.login, điều hướng /dashboard nếu thành công.
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

    // Hardcode check trực tiếp ở Client (tạm thời — sẽ xóa khi backend sẵn sàng).
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
          this.router.navigate(['/dashboard']);
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
