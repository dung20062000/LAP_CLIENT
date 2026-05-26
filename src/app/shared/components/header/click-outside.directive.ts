import { Directive, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Input() clickOutsideExclude?: string;
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.clickOutsideExclude) {
      const excluded = target.closest(this.clickOutsideExclude);
      if (excluded) return;
    }

    if (!this.el.nativeElement.contains(target)) {
      this.clickOutside.emit();
    }
  }
}
