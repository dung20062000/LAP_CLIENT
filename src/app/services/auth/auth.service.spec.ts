/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho AuthService — kiểm tra đăng nhập, đăng xuất, lưu trữ, khôi phục phiên và xác thực.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { routes } from '../../app.routes';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho AuthService.
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    if (typeof document !== 'undefined') {
      document.cookie = 'browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideRouter(routes)],
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    const http = TestBed.inject(HttpClient);
    service = new AuthService(http, router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
    if (typeof document !== 'undefined') {
      document.cookie = 'browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra service khởi tạo ở trạng thái chưa đăng nhập.
   */
  describe('Khởi tạo service', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start as not logged in', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should start with null token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra đăng nhập thành công với credentials đúng.
   */
  describe('login() - Thành công', () => {
    it('should return success=true for correct credentials (admin/admin@123)', async () => {
      const res = await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      expect(res?.success).toBe(true);
      expect(res?.data?.user.username).toBe('admin');
      expect(res?.data?.token).toBeTruthy();
    });

    it('should return success=true with case-insensitive username', async () => {
      const res = await service.login({ username: 'Admin', password: 'admin@123' }, false).toPromise();
      expect(res?.success).toBe(true);
    });

    it('should trim username before validating', async () => {
      const res = await service.login({ username: '  admin  ', password: 'admin@123' }, false).toPromise();
      expect(res?.success).toBe(true);
    });

    it('should set isLoggedIn to true after successful login', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should set token after successful login', async () => {
      const res = await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      expect(service.getToken()).toBe(res?.data?.token);
    });

    it('should return user info in response data', async () => {
      const res = await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      expect(res?.data?.user.email).toBe('admin@bagps.com');
      expect(res?.data?.user.role).toBe('admin');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra đăng nhập thất bại với credentials sai.
   */
  describe('login() - Thất bại', () => {
    it('should return success=false for wrong password', async () => {
      const res = await service.login({ username: 'admin', password: 'wrongpass' }, false).toPromise();
      expect(res?.success).toBe(false);
      expect(res?.message).toBeTruthy();
    });

    it('should return success=false for wrong username', async () => {
      const res = await service.login({ username: 'user', password: 'admin@123' }, false).toPromise();
      expect(res?.success).toBe(false);
    });

    it('should return success=false for empty credentials', async () => {
      const res = await service.login({ username: '', password: '' }, false).toPromise();
      expect(res?.success).toBe(false);
    });

    it('should keep isLoggedIn false after failed login', async () => {
      await service.login({ username: 'admin', password: 'wrong' }, false).toPromise();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra login() lưu trữ đúng với rememberMe = true/false.
   */
  describe('login() - Lưu trữ', () => {
    it('should save to localStorage when rememberMe = true', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, true).toPromise();
      expect(localStorage.getItem('remember_me')).toBe('true');
      expect(localStorage.getItem('auth_token')).toBeTruthy();
      expect(localStorage.getItem('auth_user')).toBeTruthy();
      expect(document.cookie).not.toContain('browser_session_active=true');
    });

    it('should save to localStorage and set session cookie when rememberMe = false', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      expect(localStorage.getItem('remember_me')).toBe('false');
      expect(localStorage.getItem('auth_token')).toBeTruthy();
      expect(localStorage.getItem('auth_user')).toBeTruthy();
      expect(document.cookie).toContain('browser_session_active=true');
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra khôi phục phiên đăng nhập từ localStorage/sessionStorage.
   */
  describe('Khôi phục phiên đăng nhập', () => {
    it('should restore session from localStorage when remember_me = true even without session cookie', () => {
      localStorage.setItem('remember_me', 'true');
      localStorage.setItem('auth_token', 'token-123');
      localStorage.setItem('auth_user', JSON.stringify({ username: 'admin' }));

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http, router);

      expect(newService.isLoggedIn()).toBe(true);
      expect(newService.getToken()).toBe('token-123');
    });

    it('should restore session from localStorage when remember_me = false if session cookie is present', () => {
      localStorage.setItem('remember_me', 'false');
      localStorage.setItem('auth_token', 'token-123');
      localStorage.setItem('auth_user', JSON.stringify({ username: 'admin' }));
      document.cookie = 'browser_session_active=true; path=/; SameSite=Strict';

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http, router);

      expect(newService.isLoggedIn()).toBe(true);
      expect(newService.getToken()).toBe('token-123');
    });

    it('should NOT restore session and should clear storage when remember_me = false if session cookie is missing', () => {
      localStorage.setItem('remember_me', 'false');
      localStorage.setItem('auth_token', 'token-123');
      localStorage.setItem('auth_user', JSON.stringify({ username: 'admin' }));

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http, router);

      expect(newService.isLoggedIn()).toBe(false);
      expect(newService.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeFalsy();
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra logout() xóa trạng thái và điều hướng về /login.
   */
  describe('logout()', () => {
    it('should clear isLoggedIn after logout', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      service.logout();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should clear token after logout', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      service.logout();
      expect(service.getToken()).toBeNull();
    });

    it('should clear localStorage on logout', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, true).toPromise();
      service.logout();
      expect(localStorage.getItem('auth_token')).toBeFalsy();
      expect(localStorage.getItem('auth_user')).toBeFalsy();
    });

    it('should navigate to /login after logout', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      service.logout();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra isAuthenticated() trả về đúng trạng thái xác thực.
   */
  describe('isAuthenticated()', () => {
    it('should return true when token and user exist', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when not logged in', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra currentUser signal trả về đúng thông tin user.
   */
  describe('currentUser signal', () => {
    it('should expose user info after login', async () => {
      await service.login({ username: 'admin', password: 'admin@123' }, false).toPromise();
      const user = service.currentUser();
      expect(user?.username).toBe('admin');
      expect(user?.email).toBe('admin@bagps.com');
    });

    it('should be null before login', () => {
      expect(service.currentUser()).toBeNull();
    });
  });
});
