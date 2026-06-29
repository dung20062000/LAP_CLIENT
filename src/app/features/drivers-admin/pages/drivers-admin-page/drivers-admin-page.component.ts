// prettier-ignore
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// prettier-ignore
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { format, parseISO, isValid, isAfter, startOfDay } from 'date-fns';
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
import { DriverLookupDto, LicenseTypeLookupDto, DriverDto, UpdateDriverRequest, DriverListRequest, DriverSearchType } from '../../../../models/drivers-admin';
// prettier-ignore
import { NumbersOnlyDirective, VarcharOnlyDirective, NoAngleBracketsDirective } from '../../../../shared/directives/input-filters.directive';
// prettier-ignore
import { PAGE_DEFAULT, PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '../../../../shared/utils/constants';

/**
 * Người tạo: DungBT
 * Ngày tạo: 29/06/2026
 * Mô tả: Trang Quản Lý Thông Tin Lái Xe.
 *        - Bộ lọc: Keyword (tìm theo tên/GPLX), ng-select chọn lái xe, chọn loại bằng.
 *        - Lưới inline-edit dùng FormArray với validation per-row.
 *        - Batch update có transaction, soft delete có xác nhận.
 *        - Xuất Excel qua blob.
 *        - Phân trang p-paginator.
 */
@Component({
  selector: 'app-drivers-admin-page',
  standalone: true,
  // prettier-ignore
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, ButtonModule, ConfirmDialogModule, ToastModule, PaginatorModule, TableModule, NumbersOnlyDirective, VarcharOnlyDirective, NoAngleBracketsDirective],
  providers: [ConfirmationService],
  templateUrl: './drivers-admin-page.component.html',
  styleUrls: ['./drivers-admin-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversAdminPageComponent implements OnInit {
  private service = inject(DriversAdminService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Expose Math to template
  readonly Math = Math;
  readonly todayDateString = format(new Date(), 'yyyy-MM-dd');

  // Dropdown data
  driverLookup: DriverLookupDto[] = [];
  licenseTypeLookup: LicenseTypeLookupDto[] = [];

  // Filter state
  // Từ khoá tìm kiếm
  keyword = '';
  // Loại tìm kiếm
  searchType: DriverSearchType = DriverSearchType.Name;
  searchTypeOptions = [
    { label: 'Tên lái xe', value: DriverSearchType.Name },
    { label: 'Số GPLX', value: DriverSearchType.DriverLicense },
  ];

  // Lái xe được chọn trong ng-select
  selectedDriverIds: number[] = [];
  // Loại bằng được chọn trong ng-select
  selectedLicenseTypeIds: number[] = [];

  // Grid / FormArray
  form!: FormGroup;

  // driversArray dùng để gán dữ liệu và nhận biết thay đổi
  get driversArray(): FormArray {
    return this.form.get('drivers') as FormArray;
  }

  // Raw data để so sánh khi cần reset
  originalData: DriverDto[] = [];

  // Loading / flags
  isLoading = false;
  isSaving = false;
  isExporting = false;

  // Pagination
  totalRecord = 0;
  currentPage = PAGE_DEFAULT;
  pageSize = PAGE_SIZE_DEFAULT;
  pageSizeOptions = PAGE_SIZE_OPTIONS;

  // Placeholder cho ô tìm kiếm
  get placeholder(): string {
    return this.searchType === DriverSearchType.Name
      ? 'Tìm theo tên lái xe...'
      : 'Tìm theo số GPLX...';
  }

  // Kiểm tra form có thay đổi
  get isFormDirty(): boolean {
    return this.driversArray.dirty;
  }

  // Kiểm tra có data
  get hasData(): boolean {
    return this.driversArray.length > 0;
  }

  ngOnInit(): void {
    this.form = this.fb.group({ drivers: this.fb.array([]) });
    this.loadDropdowns();
  }

  // Data loading
  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Tải đồng thời 2 dropdown (lái xe & loại bằng) bằng forkJoin.
   * Sau đó load lưới.
   */
  private loadDropdowns(): void {
    forkJoin({
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
        error: (err) => {
          this.showError(getHttpErrorMessage(err, 'Không thể tải dữ liệu dropdown.'));
          this.cdr.markForCheck();
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
            this.originalData = res.Items;
            this.rebuildFormArray(res.Items);
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.isLoading = false;
            this.showError(getHttpErrorMessage(err, 'Không thể tải danh sách lái xe.'));
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

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Xây lại FormArray từ danh sách DriverDto.
   * Mỗi row là một FormGroup với validators.
   */
  private rebuildFormArray(items: DriverDto[]): void {
    const arr = this.fb.array(items.map((d) => this.createDriverRow(d)));
    this.form.setControl('drivers', arr);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Tạo FormGroup cho một dòng lái xe với đầy đủ validators.
   * Dùng date-fns để parse ISO string thành value cho input type="date" (yyyy-MM-dd).
   */
  private createDriverRow(driver: DriverDto): FormGroup {
    const toDateInputValue = (iso: string | null): string => {
      if (!iso) return '';
      const d = parseISO(iso);
      return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
    };

    return this.fb.group(
      {
        Id: [driver.Id],
        DisplayName: [
          driver.DisplayName,
          [Validators.required, Validators.maxLength(100), this.noAngleBrackets()],
        ],
        Mobile: [driver.Mobile, [Validators.pattern(/^[0-9]{9,25}$/), Validators.maxLength(25)]],
        DriverLicense: [
          driver.DriverLicense,
          [
            Validators.required,
            Validators.maxLength(32),
            Validators.pattern(/^[\x00-\x7F]*$/),
            this.noAngleBrackets(),
          ],
        ],
        IssueLicenseDate: [toDateInputValue(driver.IssueLicenseDate), [Validators.required]],
        ExpireLicenseDate: [toDateInputValue(driver.ExpireLicenseDate), [Validators.required]],
        IssueLicensePlace: [
          driver.IssueLicensePlace,
          [Validators.required, Validators.maxLength(150), this.noAngleBrackets()],
        ],
        LicenseType: [driver.LicenseType, [Validators.required]],
        UpdatedDate: [driver.UpdatedDate],
      },
      { validators: this.dateRangeValidator() },
    );
  }

  // Custom Validators

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Không chứa ký tự < hoặc > (chống XSS)
   */
  private noAngleBrackets() {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value as string;
      if (val && (val.includes('<') || val.includes('>'))) {
        return { noAngleBrackets: 'Không được chứa ký tự < hoặc >' };
      }
      return null;
    };
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Ngày cấp <= hôm nay và Ngày hết hạn > Ngày cấp
   */
  private dateRangeValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const issue = group.get('IssueLicenseDate')?.value as string;
      const expire = group.get('ExpireLicenseDate')?.value as string;
      const errors: ValidationErrors = {};

      if (issue) {
        const issueDate = parseISO(issue);
        if (isValid(issueDate) && isAfter(startOfDay(issueDate), startOfDay(new Date()))) {
          errors['issueFuture'] = 'Ngày cấp không được lớn hơn ngày hiện tại';
        }
      }

      if (issue && expire) {
        const issueDate = parseISO(issue);
        const expireDate = parseISO(expire);
        if (isValid(issueDate) && isValid(expireDate) && !isAfter(expireDate, issueDate)) {
          errors['expireBeforeIssue'] = 'Ngày hết hạn phải sau ngày cấp';
        }
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  // Validation helpers cho template

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Lấy thông báo lỗi của một control trong một row
   */
  getFieldError(rowGroup: AbstractControl, field: string): string {
    const ctrl = rowGroup.get(field);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';

    if (ctrl.errors?.['required']) return 'Bắt buộc nhập';
    if (ctrl.errors?.['maxlength'])
      return `Tối đa ${ctrl.errors['maxlength'].requiredLength} ký tự`;
    if (ctrl.errors?.['pattern']) {
      if (field === 'DriverLicense') return 'Chỉ được nhập ký tự không dấu (varchar)';
      return 'SĐT chỉ nhập số, 9-25 ký tự';
    }
    if (ctrl.errors?.['noAngleBrackets']) return ctrl.errors['noAngleBrackets'] as string;
    return 'Giá trị không hợp lệ';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Lấy thông báo lỗi cấp row (date range)
   */
  getRowError(rowGroup: AbstractControl): string {
    if (!rowGroup.errors) return '';
    if (rowGroup.errors['issueFuture']) return rowGroup.errors['issueFuture'] as string;
    if (rowGroup.errors['expireBeforeIssue']) return rowGroup.errors['expireBeforeIssue'] as string;
    return '';
  }

  // Actions

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Tìm kiếm: reset về trang 1
   */
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

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Lưu: Lấy các row dirty, validate, gửi batch update lên API.
   * Dùng date-fns format() để convert date input value thành ISO string.
   */
  onSave(): void {
    const dirtyRows = this.driversArray.controls.filter((row) => row.dirty);
    if (!dirtyRows.length) return;

    // Kiểm tra nếu có row invalid
    const invalidRows = dirtyRows.filter((row) => row.invalid);
    if (invalidRows.length) {
      // Touch tất cả controls trong row invalid để hiển thị lỗi
      invalidRows.forEach((row) => {
        Object.values((row as FormGroup).controls).forEach((c) => c.markAsTouched());
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Dữ liệu không hợp lệ',
        detail: `Có ${invalidRows.length} dòng chứa lỗi. Vui lòng kiểm tra lại.`,
      });
      this.cdr.markForCheck();
      return;
    }

    const payload: UpdateDriverRequest[] = dirtyRows.map((row) => {
      const v = row.value;
      const toIso = (dateStr: string | null): string | null => {
        if (!dateStr) return null;
        const d = parseISO(dateStr);
        return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : null;
      };
      return {
        Id: v.Id as number,
        DisplayName: v.DisplayName as string,
        DriverLicense: v.DriverLicense as string | null,
        IssueLicenseDate: toIso(v.IssueLicenseDate as string | null),
        ExpireLicenseDate: toIso(v.ExpireLicenseDate as string | null),
        IssueLicensePlace: v.IssueLicensePlace as string | null,
        LicenseType: v.LicenseType as number | null,
        Mobile: v.Mobile as string | null,
      };
    });

    this.isSaving = true;
    this.cdr.markForCheck();

    this.service
      .batchUpdate(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Lưu thông tin lái xe thành công.',
          });
          this.loadGrid();
        },
        error: (err) => {
          this.isSaving = false;
          this.showError(getHttpErrorMessage(err, 'Lỗi khi lưu dữ liệu.'));
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Hủy: Mở p-confirmDialog, nếu đồng ý reload lại dữ liệu gốc từ API.
   */
  onCancel(): void {
    if (!this.isFormDirty) return;
    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn hủy các thay đổi chưa lưu không?',
      header: 'Xác nhận hủy',
      acceptLabel: 'Xác nhận',
      rejectLabel: 'Đóng',
      acceptIcon: 'fas fa-check',
      rejectIcon: 'fas fa-times',
      accept: () => this.loadGrid(),
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Xóa mềm một dòng: mở xác nhận trước khi gọi API.
   * @param id ID lái xe
   * @param index Vị trí trong FormArray (để xóa khỏi giao diện)
   */
  onDelete(id: number, index: number): void {
    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn xóa lái xe này không? Thao tác không thể hoàn tác.',
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
              this.driversArray.removeAt(index);
              this.totalRecord--;
              this.messageService.add({
                severity: 'success',
                summary: 'Đã xóa',
                detail: 'Xóa lái xe thành công.',
              });
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.showError(getHttpErrorMessage(err, 'Không thể xóa lái xe.'));
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
        error: (err) => {
          this.isExporting = false;
          this.showError(getHttpErrorMessage(err, 'Không thể xuất Excel.'));
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
   * Ngày cập nhật hiển thị: ưu tiên UpdatedDate, fallback về không hiển thị gì
   * Lưu ý: form chỉ chứa UpdatedDate, không có CreatedDate trong lưới này
   */
  getUpdatedDateDisplay(rowGroup: AbstractControl): string {
    const updatedDate = rowGroup.get('UpdatedDate')?.value as string | null;
    return this.formatDate(updatedDate, 'HH:mm dd/MM/yyyy');
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 29/06/2026
   * Lấy tên loại bằng từ ID
   */
  getLicenseTypeName(id: number | null): string {
    if (id == null) return '';
    return this.licenseTypeLookup.find((l) => l.Value === id)?.Name ?? '';
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
