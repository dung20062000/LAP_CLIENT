// prettier-ignore
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
// prettier-ignore
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { format, parseISO, isValid, isAfter, isBefore, startOfDay } from 'date-fns';
import { NgSelectModule } from '@ng-select/ng-select';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { DriversAdminService } from '../../../../../services/drivers-admin';
// prettier-ignore
import { DriverDto, LicenseTypeLookupDto, UpdateDriverRequest, CreateDriverRequest } from '../../../../../models/drivers-admin';
// prettier-ignore
import {VarcharOnlyDirective, NoAngleBracketsDirective } from '../../../../../shared/directives/input-filters.directive';

export type ModalMode = 'view' | 'edit' | 'create';

/**
 * Người tạo: DungBT
 * Ngày tạo: 08/07/2026
 * formatDate pipe dùng để format ngày.
 */
@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(iso: string | null | undefined, pattern = 'dd/MM/yyyy'): string {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, pattern) : '';
  }
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 08/07/2026
 * isExpired pipe dùng để kiểm tra ngày hết hạn.
 */
@Pipe({ name: 'isExpired', standalone: true })
export class IsExpiredPipe implements PipeTransform {
  transform(iso: string | null | undefined): boolean {
    if (!iso) return false;
    const d = parseISO(iso);
    return isValid(d) && isBefore(startOfDay(d), startOfDay(new Date()));
  }
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 08/07/2026
 * formError pipe dùng để hiển thị lỗi form.
 */
@Pipe({ name: 'formError', standalone: true })
export class FormErrorPipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined, field: string): string {
    if (!errors) return '';
    if (errors['required']) return 'Giá trị không được để trống';
    if (errors['maxlength']) return `Tối đa ${errors['maxlength'].requiredLength} ký tự`;
    if (errors['pattern']) {
      if (field === 'DriverLicense') return 'Chỉ được nhập ký tự không dấu (varchar)';
      return 'SĐT sai định dạng';
    }
    if (errors['noAngleBrackets']) return errors['noAngleBrackets'] as string;
    if (errors['whitespace']) return errors['whitespace'] as string;
    return 'Giá trị không hợp lệ';
  }
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 08/07/2026
 * Mô tả: Popup xem chi tiết / sửa / tạo mới lái xe (dùng p-dialog PrimeNG).
 *        - Mode 'view': hiển thị thông tin chỉ đọc, có nút "Sửa"
 *        - Mode 'edit': form sửa thông tin, dùng batch update API
 *        - Mode 'create': form tạo mới lái xe
 */
@Component({
  selector: 'app-driver-form-modal',
  standalone: true,
  // prettier-ignore
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, DialogModule, DatePickerModule, VarcharOnlyDirective, NoAngleBracketsDirective, FormatDatePipe, IsExpiredPipe, FormErrorPipe],
  templateUrl: './driver-form-modal.component.html',
  styleUrls: ['./driver-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverFormModalComponent implements OnInit {
  // ID lái xe — dùng khi mode='view' hoặc 'edit' để load data
  @Input() driverId: number | null = null;

  // Mode khởi đầu khi mở modal
  @Input() initialMode: ModalMode = 'view';

  // Danh sách loại bằng truyền vào từ trang cha (tránh gọi API lại)
  @Input() licenseTypeLookup: LicenseTypeLookupDto[] = [];

  // Emit khi cần đóng modal
  @Output() closed = new EventEmitter<void>();

  // Emit khi lưu thành công (trang cha reload lưới)
  @Output() saved = new EventEmitter<void>();

  private readonly service = inject(DriversAdminService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  readonly todayDate = new Date();

  mode: ModalMode = 'view';
  driver: DriverDto | null = null;
  form!: FormGroup;
  isLoading = false;
  isSaving = false;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 07/07/2026
   * Lấy danh sách control của form để dễ gọi.
   */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 07/07/2026
   * Kiểm tra mode xem
   */
  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 07/07/2026
   * Kiểm tra mode sửa
   */
  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 07/07/2026
   * Kiểm tra mode tạo mới
   */
  get isCreateMode(): boolean {
    return this.mode === 'create';
  }

  ngOnInit(): void {
    this.mode = this.initialMode;
    if (this.isCreateMode) {
      this.buildForm(null);
    } else if (this.driverId) {
      this.loadDriver();
    }
  }

  // Data loading

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Lấy thông tin chi tiết lái xe theo ID từ API.
   */
  private loadDriver(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.service
      .getById(this.driverId!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          if (data) {
            this.driver = data;
            if (this.isEditMode) this.buildForm(data);
          }
          this.cdr.markForCheck();
        },
      });
  }

  // Form

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Khởi tạo FormGroup với validators tương đương inline-edit trên lưới.
   * @param driver Dữ liệu lái xe cần điền sẵn, null khi tạo mới.
   */
  private buildForm(driver: DriverDto | null): void {
    const toDate = (iso: string | null): Date | null => {
      if (!iso) return null;
      const d = parseISO(iso);
      return isValid(d) ? d : null;
    };

    this.form = this.fb.group(
      {
        DisplayName: [
          driver?.DisplayName ?? '',
          [
            Validators.required,
            Validators.maxLength(100),
            this.noAngleBrackets(),
            this.noWhitespace(),
          ],
        ],
        Mobile: [driver?.Mobile, [Validators.pattern(/^0[35789]\d{8}$/), Validators.maxLength(10)]],
        DriverLicense: [
          driver?.DriverLicense ?? '',
          [
            Validators.required,
            Validators.maxLength(32),
            Validators.pattern(/^[\x00-\x7F]*$/),
            this.noAngleBrackets(),
            this.noWhitespace(),
          ],
        ],
        IssueLicenseDate: [toDate(driver?.IssueLicenseDate ?? null), [Validators.required]],
        ExpireLicenseDate: [toDate(driver?.ExpireLicenseDate ?? null), [Validators.required]],
        IssueLicensePlace: [
          driver?.IssueLicensePlace ?? '',
          [
            Validators.required,
            Validators.maxLength(150),
            this.noAngleBrackets(),
            this.noWhitespace(),
          ],
        ],
        LicenseType: [driver?.LicenseType ?? null, [Validators.required]],
      },
      { validators: this.dateRangeValidator() },
    );
  }

  // Custom Validators

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Không chứa ký tự < hoặc > (chống XSS)
   */
  private noAngleBrackets() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const val = ctrl.value as string;
      if (val && (val.includes('<') || val.includes('>'))) {
        return { noAngleBrackets: 'Không được chứa ký tự < hoặc >' };
      }
      return null;
    };
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Không cho phép chỉ nhập khoảng trắng
   */
  private noWhitespace() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const val = ctrl.value;
      if (typeof val === 'string' && val.length > 0 && val.trim().length === 0) {
        return { whitespace: 'Không được chỉ nhập khoảng trắng' };
      }
      return null;
    };
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Ngày cấp <= hôm nay và Ngày hết hạn > Ngày cấp
   */
  private dateRangeValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const issueDate = group.get('IssueLicenseDate')?.value as Date | null;
      const expireDate = group.get('ExpireLicenseDate')?.value as Date | null;
      const errors: ValidationErrors = {};

      if (issueDate && isValid(issueDate)) {
        if (isAfter(startOfDay(issueDate), startOfDay(new Date()))) {
          errors['issueFuture'] = 'Ngày cấp không được lớn hơn ngày hiện tại';
        }
      }

      if (issueDate && expireDate && isValid(issueDate) && isValid(expireDate)) {
        if (!isAfter(startOfDay(expireDate), startOfDay(issueDate))) {
          errors['expireBeforeIssue'] = 'Ngày hết hạn phải sau ngày cấp';
        }
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  // Actions

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Chuyển từ mode view sang mode edit
   */
  switchToEditMode(): void {
    this.mode = 'edit';
    this.buildForm(this.driver);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Hủy chỉnh sửa: quay về view (nếu mở từ view) hoặc đóng modal
   */
  onCancelEdit(): void {
    if (this.initialMode === 'edit' || this.initialMode === 'create') {
      // Mở thẳng edit/create → đóng hẳn modal
      this.onClose();
    } else {
      // Chuyển từ view sang edit rồi bấm hủy → quay về view
      this.mode = 'view';
      this.cdr.markForCheck();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Submit form: validate, build payload, gọi API create hoặc update
   */
  onSubmit(): void {
    if (!this.form) return;

    // Mark all touched để hiện lỗi
    Object.values(this.form.controls).forEach((c) => c.markAsTouched());
    this.form.markAsTouched();
    this.cdr.markForCheck();

    if (this.form.invalid) return;

    const toIso = (dateVal: Date | string | null): string | null => {
      if (!dateVal) return null;
      const d = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
      return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : null;
    };

    const v = this.form.value as {
      DisplayName: string;
      Mobile: string;
      DriverLicense: string;
      IssueLicenseDate: Date | string | null;
      ExpireLicenseDate: Date | string | null;
      IssueLicensePlace: string;
      LicenseType: number | null;
    };

    if (this.isCreateMode) {
      const payload: CreateDriverRequest = {
        Id: 0,
        DisplayName: v.DisplayName,
        DriverLicense: v.DriverLicense || null,
        IssueLicenseDate: toIso(v.IssueLicenseDate),
        ExpireLicenseDate: toIso(v.ExpireLicenseDate),
        IssueLicensePlace: v.IssueLicensePlace || null,
        LicenseType: v.LicenseType,
        Mobile: v.Mobile || null,
      };
      this.callCreate(payload);
    } else {
      const payload: UpdateDriverRequest = {
        Id: this.driverId!,
        DisplayName: v.DisplayName,
        DriverLicense: v.DriverLicense || null,
        IssueLicenseDate: toIso(v.IssueLicenseDate),
        ExpireLicenseDate: toIso(v.ExpireLicenseDate),
        IssueLicensePlace: v.IssueLicensePlace || null,
        LicenseType: v.LicenseType,
        Mobile: v.Mobile || null,
      };
      this.callUpdate(payload);
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Gọi API tạo mới lái xe
   */
  private callCreate(payload: CreateDriverRequest): void {
    this.isSaving = true;
    this.cdr.markForCheck();

    this.service
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isSaving = false;
          if (success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Tạo mới lái xe thành công.',
            });
            this.saved.emit();
            this.onClose();
          }
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Gọi API cập nhật lái xe (batchUpdate với 1 item)
   */
  private callUpdate(payload: UpdateDriverRequest): void {
    this.isSaving = true;
    this.cdr.markForCheck();

    this.service
      .batchUpdate([payload])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isSaving = false;
          if (success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Cập nhật lái xe thành công.',
            });
            this.saved.emit();
            this.onClose();
          }
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Đóng dialog và emit sự kiện closed về trang cha
   */
  onClose(): void {
    this.closed.emit();
  }

  // Display helpers

  /**
   * Người tạo: DungBT
   * Ngày tạo: 08/07/2026
   * Hiển thị toast lỗi
   */
  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail });
  }
}
