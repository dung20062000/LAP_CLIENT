import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { LoginRequest, LoginResponse, ApiResponse, UserInfo } from '../../models';

/**
 * Hardcode credentials tạm thời — xóa khi backend API sẵn sàng.
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 */
const HARDCODE_USERNAME = 'admin';
const HARDCODE_PASSWORD = 'admin@123';

/**
 * Mô tả: Service quản lý xác thực — đăng nhập, đăng xuất, lưu token,
 *         khôi phục session từ localStorage/sessionStorage.
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Tín hiệu lưu thông tin user hiện tại. */
  private currentUserSignal = signal<UserInfo | null>(null);
  /** Tín hiệu lưu JWT token. */
  private tokenSignal = signal<string | null>(null);

  /** Public readonly signals cho các component đăng ký theo dõi. */
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());

  /**
   * Kiểm tra môi trường browser để tránh lỗi ReferenceError trên SSR
   * Người tạo: DungBT
   * Ngày tạo: 18/06/2026
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Tạo session cookie để đánh dấu session còn hoạt động.
   * Cookie không có expires/max-age nên sẽ tự xóa khi đóng trình duyệt.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  private setSessionCookie(): void {
    if (this.isBrowser()) {
      document.cookie = 'browser_session_active=true; path=/; SameSite=Strict';
    }
  }

  /**
   * Xóa session cookie
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  private deleteSessionCookie(): void {
    if (this.isBrowser()) {
      document.cookie =
        'browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }
  }

  /**
   * Kiểm tra session cookie còn tồn tại không (tức là trình duyệt vẫn đang mở, chưa bị tắt hẳn).
   * Người tạo: DungBT
   * Ngày tạo: 18/06/2026
   */
  private hasSessionCookie(): boolean {
    if (!this.isBrowser()) {
      return false;
    }
    return document.cookie
      .split(';')
      .some((item) => item.trim().startsWith('browser_session_active='));
  }

  /**
   * Mô tả: Service quản lý xác thực — đăng nhập, đăng xuất, lưu token,
   *         khôi phục session từ localStorage/sessionStorage.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadStoredAuth();
  }

  /**
   * Thử khôi phục session từ localStorage và set vào signals.
   * Nếu parse lỗi hoặc thiếu data thì clearAuth.
   * Người tạo: DungBT
   * Ngày tạo: 29/05/2026
   */
  private tryRestoreSession(): void {
    if (!this.isBrowser()) return;

    const sessionData = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (sessionData && token) {
      try {
        this.currentUserSignal.set(JSON.parse(sessionData));
        this.tokenSignal.set(token);
      } catch {
        this.clearAuth();
      }
    } else {
      this.clearAuth();
    }
  }

  /**
   * Đọc auth data đã lưu, parse và set vào signals.
   * Nếu parse lỗi thì clear hết để tránh state không hợp lệ.
   * Logic:
   *   - remember_me = 'true'  → Ghi nhớ: luôn khôi phục từ localStorage.
   *   - remember_me = 'false' → Không ghi nhớ: chỉ khôi phục nếu session cookie còn tồn tại
   *                             (tức là trình duyệt vẫn đang mở, chưa bị tắt hẳn).
   *   - Còn lại → clearAuth.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  private loadStoredAuth(): void {
    if (!this.isBrowser()) return;

    const rememberFlag = localStorage.getItem('remember_me');

    if (rememberFlag === 'true') {
      // Ghi nhớ đăng nhập: luôn khôi phục từ localStorage
      this.tryRestoreSession();
    } else if (rememberFlag === 'false') {
      // Không ghi nhớ đăng nhập: chỉ khôi phục khi session cookie còn hiệu lực (chưa đóng trình duyệt)
      if (this.hasSessionCookie()) {
        this.tryRestoreSession();
      } else {
        // Đóng trình duyệt mở lại → tự động logout
        this.clearAuth();
      }
    } else {
      this.clearAuth();
    }
  }

  /**
   * @param credentials: truyền vào username, password
   * @param rememberMe: true nếu muốn ghi nhớ đăng nhập, false nếu không muốn ghi nhớ
   * Đăng nhập — hiện dùng hardcode tạm thời (admin/admin@123).
   * Nếu rememberMe = true: lưu vào localStorage với flag remember_me = true, xóa session cookie.
   * Ngược lại: lưu vào localStorage với flag remember_me = false và tạo session cookie.
   * Thay bằng gọi API /api/auth khi backend sẵn sàng.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
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

      if (this.isBrowser()) {
        // Luôn lưu token vào localStorage để chia sẻ giữa các tab
        localStorage.setItem('auth_token', fakeToken);
        localStorage.setItem('auth_user', JSON.stringify(fakeUser));

        if (rememberMe) {
          // Ghi nhớ đăng nhập: đánh dấu flag, xóa session cookie
          localStorage.setItem('remember_me', 'true');
          this.deleteSessionCookie();
        } else {
          // Không ghi nhớ: đánh dấu flag, tạo session cookie để theo dõi trình duyệt còn mở không
          localStorage.setItem('remember_me', 'false');
          this.setSessionCookie();
        }

        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
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
   * Đăng xuất — xóa signals, clear storage, điều hướng về /login.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  /**
   * Xóa toàn bộ auth state: signals, localStorage, sessionStorage và session cookie.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  private clearAuth(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);

    if (this.isBrowser()) {
      localStorage.removeItem('remember_me');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      this.deleteSessionCookie();
    }
  }

  /**
   * Lấy token hiện tại — dùng để attach vào HTTP header.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Kiểm tra đã xác thực chưa — dùng trong authGuard.
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   */
  isAuthenticated(): boolean {
    return !!this.tokenSignal() && !!this.currentUserSignal();
  }
}
