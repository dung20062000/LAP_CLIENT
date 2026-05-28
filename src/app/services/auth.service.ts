/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Service quản lý xác thực — đăng nhập, đăng xuất, lưu token,
 *         khôi phục session từ localStorage/sessionStorage.
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  ApiResponse,
  UserInfo,
} from '../models';

// Hardcode credentials tạm thời — xóa khi backend API sẵn sàng.
const HARDCODE_USERNAME = 'admin';
const HARDCODE_PASSWORD = 'admin@123';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Service singleton quản lý xác thực người dùng.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = '/api/auth';

  // Tín hiệu lưu thông tin user hiện tại.
  private currentUserSignal = signal<UserInfo | null>(null);
  // Tín hiệu lưu JWT token.
  private tokenSignal = signal<string | null>(null);

  // Public readonly signals cho các component đăng ký theo dõi.
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());
  readonly token = this.tokenSignal.asReadonly();

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Khôi phục session từ localStorage (remember me) hoặc sessionStorage.
   */
  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Đọc auth data đã lưu, parse và set vào signals.
   * Nếu parse lỗi thì clear hết để tránh state không hợp lệ.
   */
  private loadStoredAuth(): void {
    const rememberFlag = localStorage.getItem('remember_me');
    // Ưu tiên localStorage nếu rememberMe = true, ngược lại dùng sessionStorage.
    const sessionData = rememberFlag === 'true'
      ? localStorage.getItem('auth_user')
      : sessionStorage.getItem('auth_user');
    if (sessionData) {
      try {
        this.currentUserSignal.set(JSON.parse(sessionData));
        const token = rememberFlag === 'true'
          ? localStorage.getItem('auth_token')
          : sessionStorage.getItem('auth_token');
        this.tokenSignal.set(token);
      } catch {
        this.clearAuth();
      }
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Đăng nhập — hiện dùng hardcode tạm thời (admin/admin@123).
   * Nếu rememberMe = true: lưu vào localStorage.
   * Ngược lại: lưu vào sessionStorage (mất khi đóng tab).
   * Thay bằng gọi API /api/auth khi backend sẵn sàng.
   */
  login(credentials: LoginRequest, rememberMe: boolean): Observable<ApiResponse<LoginResponse>> {
    if (
      credentials.username.trim().toLowerCase() === HARDCODE_USERNAME &&
      credentials.password === HARDCODE_PASSWORD
    ) {
      const fakeUser: UserInfo = {
        id: 1,
        username: HARDCODE_USERNAME,
        email: 'admin@bagps.com',
        fullName: 'admin',
        role: 'admin',
      };
      const fakeToken = 'fake-jwt-token-' + Date.now();
      const fakeResponse: ApiResponse<LoginResponse> = {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token: fakeToken,
          user: fakeUser,
          refreshToken: 'refresh-' + fakeToken,
          expiresIn: 86400,
        },
      };

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('auth_token', fakeToken);
        localStorage.setItem('auth_user', JSON.stringify(fakeUser));
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        sessionStorage.setItem('auth_token', fakeToken);
        sessionStorage.setItem('auth_user', JSON.stringify(fakeUser));
      }
      this.tokenSignal.set(fakeToken);
      this.currentUserSignal.set(fakeUser);
      return of(fakeResponse);
    }

    // Sai credentials — trả về response lỗi.
    const fakeErrorResponse: ApiResponse<LoginResponse> = {
      success: false,
      message: 'Tài khoản hoặc mật khẩu không đúng',
    };
    return of(fakeErrorResponse);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Đăng xuất — xóa signals, clear storage, điều hướng về /login.
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Xóa toàn bộ auth state: signals, localStorage và sessionStorage.
   */
  private clearAuth(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem('remember_me');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  }

  // Lấy token hiện tại — dùng để attach vào HTTP header.
  getToken(): string | null {
    return this.tokenSignal();
  }

  // Kiểm tra đã xác thực chưa — dùng trong authGuard.
  isAuthenticated(): boolean {
    return !!this.tokenSignal() && !!this.currentUserSignal();
  }
}
