/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Component dashboard.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Component hiển thị dashboard.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})

export class DashboardPageComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Lấy tên người dùng hiện tại.
   */
  getCurrentUserName(): string {
    const user = this.authService.currentUser();
    return user?.fullName || user?.username || 'admin';
  }
}
