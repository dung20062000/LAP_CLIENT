/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Route guards — bảo vệ route dựa trên trạng thái xác thực của AuthService.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Guard bảo vệ route yêu cầu đăng nhập.
 * Cho phép truy cập nếu đã xác thực, ngược lại redirect về login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Guard cho route chỉ dành cho khách (chưa đăng nhập) như /login, /register.
 * Cho phép truy cập nếu chưa xác thực, ngược lại redirect về /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
