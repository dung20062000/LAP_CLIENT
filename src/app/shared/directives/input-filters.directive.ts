import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

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
  private debounceTimer?: any; // Biến lưu trữ timer

  constructor(
    @Optional() private ngControl: NgControl,
    private el: ElementRef,
  ) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement as HTMLInputElement;

    // Xóa timer cũ nếu người dùng đang gõ liên tục
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Đợi 150ms sau khi người dùng NGỪNG GÕ (hoặc Unikey chạy xong) mới xử lý
    this.debounceTimer = setTimeout(() => {
      const value = input.value;
      if (!value) return;

      // Phân rã dấu, xử lý chữ đ/Đ và loại bỏ ký tự không hợp lệ
      let newValue = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      newValue = newValue.replace(/đ/g, 'd').replace(/Đ/g, 'D');
      newValue = newValue.replace(/[^\x00-\x7F]/g, '');

      if (value !== newValue) {
        this.updateValue(input, value, newValue);
      }
    }, 150); // 150ms là "khoảng thời gian vàng" để bypass bộ gõ
  }

  private updateValue(input: HTMLInputElement, oldValue: string, newValue: string): void {
    const start = input.selectionStart;

    if (this.ngControl) {
      this.ngControl.control?.setValue(newValue, { emitEvent: false });
      if (this.ngControl.valueAccessor) {
        this.ngControl.valueAccessor.writeValue(newValue);
      }
    } else {
      input.value = newValue;
    }

    // Phục hồi con trỏ chuột
    if (start !== null) {
      const offset = oldValue.length - newValue.length;
      const newPos = Math.max(0, start - offset);
      input.setSelectionRange(newPos, newPos);
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
