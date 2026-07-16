// prettier-ignore
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { format, parseISO, isValid } from 'date-fns';
import { NgSelectModule } from '@ng-select/ng-select';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DriversAdminService } from '../../../../services/drivers-admin';
import { getHttpErrorMessage } from '../../../../shared/utils/http-error';
// prettier-ignore
import { DriverLookupDto, LicenseTypeLookupDto, DriverDto, DriverListRequest, DriverSearchType } from '../../../../models/drivers-admin';
// prettier-ignore
import { PAGE_DEFAULT, PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '../../../../shared/utils/constants';
import {
  DriverFormModalComponent,
  ModalMode,
} from './driver-form-modal/driver-form-modal.component';

/**
 * Người tạo: DungBT
 * Ngày tạo: 29/06/2026
 * Mô tả: Trang Quản Lý Thông Tin Lái Xe.
 *        - Bộ lọc: Keyword, ng-select chọn lái xe, chọn loại bằng.
 *        - Lưới chỉ đọc, click tên mở popup xem chi tiết.
 *        - Nút Sửa trong lưới mở popup chỉnh sửa.
 *        - Nút Thêm mới mở popup tạo lái xe mới.
 *        - Soft delete có xác nhận.
 *        - Xuất Excel qua blob.
 *        - Phân trang p-paginator.
 */
@Component({
  selector: 'app-drivers-admin-page',
  standalone: true,
  // prettier-ignore
  imports: [CommonModule, FormsModule, NgSelectModule, ButtonModule, ConfirmDialogModule, ToastModule, PaginatorModule, TableModule, DriverFormModalComponent],
  providers: [ConfirmationService],
  templateUrl: './drivers-admin-new-page.component.html',
  styleUrls: ['./drivers-admin-new-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversAdminNewPageComponent implements OnInit {
  private service = inject(DriversAdminService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Dropdown data
  driverLookup: DriverLookupDto[] = [];
  licenseTypeLookup: LicenseTypeLookupDto[] = [];

  // Filter state
  keyword = '';
  searchType: DriverSearchType = DriverSearchType.Name;
  searchTypeOptions = [
    { label: 'Tên lái xe', value: DriverSearchType.Name },
    { label: 'Số GPLX', value: DriverSearchType.DriverLicense },
  ];

  // Lái xe được chọn trong ng-select
  selectedDriverIds: number[] = [];
  // Loại bằng được chọn trong ng-select
  selectedLicenseTypeIds: number[] = [];

  // Grid data
  drivers: DriverDto[] = [];

  // Loading / flags
  isLoading = false;
  isExporting = false;

  // Pagination
  totalRecord = 0;
  currentPage = PAGE_DEFAULT;
  pageSize = PAGE_SIZE_DEFAULT;
  pageSizeOptions = PAGE_SIZE_OPTIONS;

  // Modal state
  modalVisible = false;
  modalMode: ModalMode = 'view';
  modalDriverId: number | null = null;

  get placeholder(): string {
    return this.searchType === DriverSearchType.Name
      ? 'Tìm theo tên lái xe...'
      : 'Tìm theo số GPLX...';
  }

  get hasData(): boolean {
    return this.drivers.length > 0;
  }

  ngOnInit(): void {
    this.loadDropdowns();
  }

  // Data loading
  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * forkJoin để gọi 2 API cùng lúc
   * Dùng takeUntilDestroyed để hủy observable khi component bị hủy
   * Dùng zone.run để đảm bảo component được update
   * Sau đó load lưới.
   */
  private loadDropdowns(): void {
    forkJoin({
      // Nếu lỗi, trả về mảng rỗng [] để dropdown không bị crash và các API khác vẫn chạy
      drivers: this.service.getDriverLookup(),
      licenseTypes: this.service.getLicenseTypeLookup(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ drivers, licenseTypes }) => {
          this.zone.run(() => {
            this.driverLookup = drivers;
            this.licenseTypeLookup = licenseTypes;
            this.cdr.markForCheck();
            this.loadGrid(1);
          });
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Load danh sách lái xe từ API theo filter hiện tại.
   * @param page Số trang cần load (default = currentPage)
   */
  loadGrid(page = this.currentPage): void {
    this.isLoading = true;
    this.currentPage = page;
    this.cdr.markForCheck();

    const request = this.buildRequest();

    this.service
      .getDriverList(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.totalRecord = res.TotalRecord;
            this.drivers = res.Items;
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Tạo request object từ filter state hiện tại
   */
  private buildRequest(): DriverListRequest {
    return {
      Type: this.searchType,
      Keyword: this.keyword.trim() || undefined,
      DriverIds: this.selectedDriverIds.length ? this.selectedDriverIds : undefined,
      LicenseTypeIds: this.selectedLicenseTypeIds.length ? this.selectedLicenseTypeIds : undefined,
      Page: this.currentPage,
      PageSize: this.pageSize,
    };
  }

  // Search
  onSearch(): void {
    this.loadGrid(1);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Xóa keyword
   */
  clearKeyword(): void {
    this.keyword = '';
    this.loadGrid(1);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Thay đổi trang hoặc pageSize từ p-paginator
   */
  onPageChange(event: PaginatorState): void {
    const newPage = (event.page ?? 0) + 1;
    const newSize = event.rows ?? this.pageSize;
    this.pageSize = newSize;
    this.loadGrid(newPage);
  }

  // Modal

  /** Click vào tên → mở popup xem chi tiết */
  openViewModal(driver: DriverDto): void {
    this.modalDriverId = driver.Id;
    this.modalMode = 'view';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  /** Nút Sửa trong lưới → mở popup chỉnh sửa ngay */
  openEditModal(driver: DriverDto): void {
    this.modalDriverId = driver.Id;
    this.modalMode = 'edit';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  /** Nút Thêm mới */
  openCreateModal(): void {
    this.modalDriverId = null;
    this.modalMode = 'create';
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  onModalClosed(): void {
    this.modalVisible = false;
    this.cdr.markForCheck();
  }

  onModalSaved(): void {
    this.modalVisible = false;
    this.loadGrid();
    this.cdr.markForCheck();
  }

  // Delete

  onDelete(id: number, index: number, name?: string): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa lái xe "<b>${name}</b>" không?`,
      header: 'Xác nhận xóa',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptIcon: 'fas fa-trash',
      rejectIcon: 'fas fa-times',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service
          .softDelete(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.drivers = this.drivers.filter((_, i) => i !== index);
              this.totalRecord--;
              this.messageService.add({
                severity: 'success',
                summary: 'Đã xóa',
                detail: 'Xóa lái xe thành công.',
              });
              this.cdr.markForCheck();
            },
          });
      },
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Xuất Excel: gọi API nhận Blob, kích hoạt tải xuống bằng thẻ <a> ẩn.
   */
  onExport(): void {
    this.isExporting = true;
    this.cdr.markForCheck();

    const request = this.buildRequest();

    this.service
      .exportExcel(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `DanhSachLaiXe_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
          this.isExporting = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ng-select helpers

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Toggle chọn tất cả lái xe
   */
  toggleAllDrivers(): void {
    if (this.isAllDriversSelected()) {
      this.selectedDriverIds = [];
    } else {
      this.selectedDriverIds = this.driverLookup.map((d) => d.Value);
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Kiểm tra tất cả lái xe đã được chọn
   */
  isAllDriversSelected(): boolean {
    return (
      this.driverLookup.length > 0 && this.selectedDriverIds.length === this.driverLookup.length
    );
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Toggle chọn tất cả loại bằng
   */
  toggleAllLicenseTypes(): void {
    if (this.isAllLicenseTypesSelected()) {
      this.selectedLicenseTypeIds = [];
    } else {
      this.selectedLicenseTypeIds = this.licenseTypeLookup.map((l) => l.Value);
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Kiểm tra tất cả loại bằng đã được chọn
   */
  isAllLicenseTypesSelected(): boolean {
    return (
      this.licenseTypeLookup.length > 0 &&
      this.selectedLicenseTypeIds.length === this.licenseTypeLookup.length
    );
  }

  // Display helpers

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Hiển thị ngày tháng từ ISO string dùng date-fns format.
   * Nếu UpdatedDate null → dùng UpdatedDate từ row gốc.
   * @param iso ISO date string
   * @param pattern format pattern của date-fns
   */
  formatDate(iso: string | null | undefined, pattern = 'dd/MM/yyyy'): string {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, pattern) : '';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Helper: hiển thị toast lỗi
   */
  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail });
  }
}
