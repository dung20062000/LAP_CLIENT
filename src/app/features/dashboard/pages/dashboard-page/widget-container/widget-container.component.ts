// prettier-ignore
import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetSize } from '../../../../../models';

const WIDGET_OPTIONS_OPEN_EVENT = 'widget-options-open';

/**
 * Component bao ngoài widget: header với Collapse, Reload, Options (kích thước).
 * @Input  title     – Tiêu đề hiển thị trên header
 * @Input  widgetId  – ID duy nhất của widget (dùng cho lưu layout)
 * @Input  size      – Kích thước hiện tại (WidgetSize.Auto | WidgetSize.Small | WidgetSize.Medium | WidgetSize.Large)
 * @Input  collapsed – Trạng thái thu gọn
 * @Input  loading   – Loading state từ bên ngoài (service), true = đang fetch API
 * @Output sizeChange   – Phát ra khi người dùng thay đổi kích thước
 * @Output reload       – Phát ra khi người dùng nhấn nút Tải lại
 * @Output collapsedChange – Phát ra khi trạng thái thu gọn thay đổi
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 */
@Component({
  selector: 'app-widget-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-container.component.html',
  styleUrl: './widget-container.component.scss',
})
export class WidgetContainerComponent {
  @Input() title = '';
  @Input() widgetId = '';
  @Input() size: WidgetSize = WidgetSize.Auto;
  @Input() collapsed = false;

  /** Nhận class col động từ component cha */
  @Input() layoutClass = '';
  /** Loading state từ bên ngoài – true khi service đang fetch API cho widget này */
  @Input() loading = false;

  @Output() sizeChange = new EventEmitter<WidgetSize>();
  @Output() reload = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  /** Hiển thị popup options (hover) */
  showOptions = false;
  /** Spinner nội bộ (khi nhấn reload) – kết hợp với loading input để hiển thị spinner */
  private _internalReloading = false;

  /** Getter tổng hợp: đang spinner nếu loading từ ngoài HOẶC nội bộ đang chờ */
  get isReloading(): boolean {
    return this.loading || this._internalReloading;
  }

  /** Mở submenu sang bên trái khi sát mép phải màn hình */
  openLeft = false;

  /** Các tùy chọn kích thước */
  readonly sizeOptions: { label: string; value: WidgetSize }[] = [
    { label: 'Tự động', value: WidgetSize.Auto },
    { label: 'Nhỏ', value: WidgetSize.Small },
    { label: 'Trung bình', value: WidgetSize.Medium },
    { label: 'Lớn', value: WidgetSize.Large },
  ];

  /**
   * Toggle mở options và tự động tính toán hướng mở rộng của submenu
   * Người tạo: DungBT
   * Ngày tạo: 02/06/2026
   */
  toggleOptions(event: MouseEvent): void {
    event.stopPropagation();

    const nextState = !this.showOptions;
    this.showOptions = nextState;

    if (nextState) {
      window.dispatchEvent(new CustomEvent(WIDGET_OPTIONS_OPEN_EVENT, { detail: this.widgetId }));
      this.updateSubmenuPosition();
    } else {
      this.openLeft = false;
    }
  }

  /**
   * Tính toán xem menu có gần rìa phải màn hình không để mở submenu sang trái
   * Người tạo: DungBT
   * Ngày tạo: 02/06/2026
   */
  updateSubmenuPosition(): void {
    requestAnimationFrame(() => {
      const menu = this.el.nativeElement.querySelector(
        '.widget-options-menu',
      ) as HTMLElement | null;
      if (menu) {
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const submenuMinWidth = 180;
        const gap = 2;

        // Nếu submenu mở sang phải sẽ bị tràn viewport thì đổi sang trái ngay từ lần mở đầu tiên.
        this.openLeft = rect.right + submenuMinWidth + gap > viewportWidth;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Toggle thu gọn / mở rộng widget body.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  /**
   * Kích hoạt reload với animation spinner tạm thời.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  onReload(): void {
    // Bật spinner nội bộ ngay lập tức để phản hồi click tức thì,
    // sau đó tắt khi loading input từ service đã bật lên (hoặc timeout an toàn).
    this._internalReloading = true;
    this.reload.emit();
    // Tắt spinner nội bộ sau 600ms (service sẽ bật loading$ song song)
    setTimeout(() => {
      this._internalReloading = false;
      this.cdr.markForCheck();
    }, 600);
  }

  /**
   * Thay đổi kích thước widget và đóng popup.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  onSelectSize(size: WidgetSize): void {
    this.size = size;
    this.sizeChange.emit(size);
    this.showOptions = false;
  }

  /**
   * Đóng popup options khi click ra ngoài
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeOptions();
    }
  }

  /**
   * Đóng popup khi widget khác mở dropdown
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  @HostListener('window:widget-options-open', ['$event'])
  onWidgetOptionsOpen(event: Event): void {
    const customEvent = event as CustomEvent;
    if (customEvent.detail !== this.widgetId) {
      this.closeOptions();
    }
  }

  /**
   * Tính toán lại khi resize màn hình
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  @HostListener('window:resize')
  onResize(): void {
    if (this.showOptions) {
      this.updateSubmenuPosition();
    }
  }

  /**
   * Đóng popup options
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  private closeOptions(): void {
    this.showOptions = false;
    this.openLeft = false;
  }

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}
}
