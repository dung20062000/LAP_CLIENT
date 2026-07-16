import { Directive, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Mô tả: Chỉ cho phép ký tự số trong input
 * Người tạo: DungBT
 * Ngày tạo: 26/06/2026
 */
@Directive({
  selector: '[appNumbersOnly]',
  standalone: true,
})
export class NumbersOnlyDirective {
  constructor(@Optional() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!value) return;
    const newValue = value.replace(/[^0-9]/g, '');
    if (value !== newValue) {
      if (this.ngControl) {
        this.ngControl.control?.setValue(newValue, { emitEvent: false });
        if (this.ngControl.valueAccessor) {
          this.ngControl.valueAccessor.writeValue(newValue);
        }
      } else {
        input.value = newValue;
      }
    }
  }
}

/**
 * Mô tả: Chỉ cho phép ký tự chữ và số trong input
 * Người tạo: DungBT
 * Ngày tạo: 26/06/2026
 */
@Directive({
  selector: '[appVarcharOnly]',
  standalone: true,
})
export class VarcharOnlyDirective {
  constructor(@Optional() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!value) return;
    const newValue = value.replace(/[^\x00-\x7F]/g, '');
    if (value !== newValue) {
      if (this.ngControl) {
        this.ngControl.control?.setValue(newValue, { emitEvent: false });
        if (this.ngControl.valueAccessor) {
          this.ngControl.valueAccessor.writeValue(newValue);
        }
      } else {
        input.value = newValue;
      }
    }
  }
}

/**
 * Mô tả: Loại bỏ ký tự dấu <, > trong input
 * Người tạo: DungBT
 * Ngày tạo: 26/06/2026
 */
@Directive({
  selector: '[appNoAngleBrackets]',
  standalone: true,
})
export class NoAngleBracketsDirective {
  constructor(@Optional() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!value) return;
    const newValue = value.replace(/[<>]/g, '');
    if (value !== newValue) {
      if (this.ngControl) {
        this.ngControl.control?.setValue(newValue, { emitEvent: false });
        if (this.ngControl.valueAccessor) {
          this.ngControl.valueAccessor.writeValue(newValue);
        }
      } else {
        input.value = newValue;
      }
    }
  }
}
