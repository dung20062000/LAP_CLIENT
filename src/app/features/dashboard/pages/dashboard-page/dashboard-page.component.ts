import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  getCurrentUserName(): string {
    const user = this.authService.currentUser();
    return user?.fullName || user?.username || 'admin';
  }
}
