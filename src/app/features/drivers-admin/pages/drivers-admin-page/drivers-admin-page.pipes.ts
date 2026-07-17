import { Pipe, PipeTransform } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Mô tả: Lấy thông báo lỗi của một field.
 *        Nhận ValidationErrors | null (reference đổi khi validate → pure pipe hoạt động).
 * Người tạo: DungBT
 * Ngày tạo: 17/07/2026
 * Cách dùng: ctrl.errors | daFieldError:'FieldName':(ctrl.touched ?? false)
 */
@Pipe({ name: 'daFieldError', standalone: true, pure: true })
export class FieldErrorPipe implements PipeTransform {
  /**
   * @param errors   ctrl.errors — null khi valid (reference mới mỗi lần invalid → pure pipe detect được)
   * @param field    Tên field để hiển thị đúng thông báo
   * @param touched  ctrl.touched — boolean primitive, thay đổi theo trạng thái
   */
  transform(errors: ValidationErrors | null | undefined, field: string, touched = false): string {
    if (!errors || !touched) return '';
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
 * Mô tả: Lấy thông báo lỗi cấp row (dateRange validator).
 *        Nhận ValidationErrors | null (reference đổi khi validate → pure pipe hoạt động).
 * Người tạo: DungBT
 * Ngày tạo: 17/07/2026
 * Cách dùng: rowCtrl.errors | daRowError:(rowCtrl.touched)
 */
@Pipe({ name: 'daRowError', standalone: true, pure: true })
export class RowErrorPipe implements PipeTransform {
  /**
   * @param errors   rowGroup.errors — null hoặc object mới khi lỗi dateRange
   * @param touched  rowGroup.touched — boolean primitive
   */
  transform(errors: ValidationErrors | null | undefined, touched = false): string {
    if (!errors || !touched) return '';
    if (errors['issueFuture']) return errors['issueFuture'] as string;
    if (errors['expireBeforeIssue']) return errors['expireBeforeIssue'] as string;
    return '';
  }
}

/**
 * Mô tả: Tạo object [ngClass] cho các input text.
 *        Nhận các primitive (status, dirty, touched) thay vì AbstractControl.
 * Người tạo: DungBT
 * Ngày tạo: 17/07/2026
 * Cách dùng: ctrl.status | daFieldInputClass:(ctrl.dirty ?? false):(ctrl.touched ?? false)
 *            ctrl.status | daFieldInputClass:(ctrl.dirty ?? false):(ctrl.touched ?? false):true:(!!ctrl.value)
 */
@Pipe({ name: 'daFieldInputClass', standalone: true, pure: true })
export class FieldInputClassPipe implements PipeTransform {
  /**
   * @param status    ctrl.status — 'VALID'|'INVALID'|'PENDING'|'DISABLED', string primitive
   * @param dirty     ctrl.dirty — boolean primitive
   * @param touched   ctrl.touched — boolean primitive
   * @param optional  Nếu true → chỉ áp dụng valid/invalid khi có giá trị (dành cho Mobile)
   * @param hasValue  ctrl.value có giá trị hay không (dùng khi optional = true)
   */
  transform(
    status: string | null | undefined,
    dirty = false,
    touched = false,
    optional = false,
    hasValue = false,
  ): { [klass: string]: boolean } {
    const shouldApply = optional ? touched && hasValue : touched;
    const isValid = status === 'VALID';
    const isInvalid = status === 'INVALID';

    return {
      'da-input-valid': isValid && shouldApply,
      'da-input-invalid': isInvalid && shouldApply,
      'da-input-dirty': dirty,
    };
  }
}

/**
 * Mô tả: Tạo chuỗi [inputStyleClass] cho p-datepicker.
 *        Nhận các primitive của cả field-level và row-level để pure pipe hoạt động.
 * Người tạo: DungBT
 * Ngày tạo: 17/07/2026
 * Cách dùng: ctrl.status | daDateInputClass:'IssueLicenseDate':(ctrl.dirty ?? false):(ctrl.touched ?? false):(rowCtrl.errors | json):(rowCtrl.touched)
 */
@Pipe({ name: 'daDateInputClass', standalone: true, pure: true })
export class DateInputClassPipe implements PipeTransform {
  /**
   * @param ctrlStatus      ctrl.status — 'VALID'|'INVALID'... string primitive
   * @param field           Tên field để phân biệt logic IssueLicenseDate / ExpireLicenseDate
   * @param dirty           ctrl.dirty — boolean primitive
   * @param ctrlTouched     ctrl.touched — boolean primitive
   * @param rowErrorsJson   JSON.stringify(rowCtrl.errors) — chuỗi, thay đổi khi row error thay đổi
   * @param rowTouched      rowCtrl.touched — boolean primitive
   */
  transform(
    ctrlStatus: string | null | undefined,
    field: 'IssueLicenseDate' | 'ExpireLicenseDate',
    dirty = false,
    ctrlTouched = false,
    rowErrorsJson: string | null = null,
    rowTouched = false,
  ): string {
    const valid = ctrlStatus === 'VALID' && ctrlTouched;
    const invalid = ctrlStatus === 'INVALID' && ctrlTouched;

    const rowErrors = rowErrorsJson ? (JSON.parse(rowErrorsJson) as ValidationErrors) : null;
    const issueFuture = !!rowErrors?.['issueFuture'] && rowTouched;
    const expireBeforeIssue = !!rowErrors?.['expireBeforeIssue'] && rowTouched;

    const classes: string[] = ['da-input'];

    if (field === 'IssueLicenseDate') {
      if (valid && !issueFuture && !expireBeforeIssue) classes.push('da-input-valid');
      if (invalid || issueFuture || expireBeforeIssue) classes.push('da-input-invalid');
    } else {
      if (valid && !expireBeforeIssue) classes.push('da-input-valid');
      if (invalid || expireBeforeIssue) classes.push('da-input-invalid');
    }

    if (dirty) classes.push('da-input-dirty');
    return classes.join(' ');
  }
}

/**
 * Mô tả: Hiển thị ngày cập nhật từ ISO string (pure — value chuỗi tĩnh, không phụ thuộc form state).
 * Người tạo: DungBT
 * Ngày tạo: 17/07/2026
 * Cách dùng: rowCtrl.get('UpdatedDate')?.value | daUpdatedDate
 */
@Pipe({ name: 'daUpdatedDate', standalone: true, pure: true })
export class UpdatedDatePipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'HH:mm dd/MM/yyyy') : '';
  }
}
