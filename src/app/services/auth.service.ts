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

const HARDCODE_USERNAME = 'admin';
const HARDCODE_PASSWORD = 'admin@123';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = '/api/auth';

  private currentUserSignal = signal<UserInfo | null>(null);
  private tokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());
  readonly token = this.tokenSignal.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const rememberFlag = localStorage.getItem('remember_me');
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

    const fakeErrorResponse: ApiResponse<LoginResponse> = {
      success: false,
      message: 'Tài khoản hoặc mật khẩu không đúng',
    };
    return of(fakeErrorResponse);
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem('remember_me');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal() && !!this.currentUserSignal();
  }
}
