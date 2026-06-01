/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Component dùng chung bọc ngoài các widget Dashboard.
 *        Quản lý: tiêu đề, collapse/expand, reload, tùy chọn độ rộng.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetSize } from '../../../../models';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Component bao ngoài widget: header với Collapse, Reload, Options (kích thước).
 * @Input  title     – Tiêu đề hiển thị trên header
 * @Input  widgetId  – ID duy nhất của widget (dùng cho lưu layout)
 * @Input  size      – Kích thước hiện tại ('auto' | 'small' | 'medium' | 'large')
 * @Input  collapsed – Trạng thái thu gọn
 * @Output sizeChange   – Phát ra khi người dùng thay đổi kích thước
 * @Output reload       – Phát ra khi người dùng nhấn nút Tải lại
 * @Output collapsedChange – Phát ra khi trạng thái thu gọn thay đổi
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
  @Input() size: WidgetSize = 'auto';
  @Input() collapsed = false;
  @Input() layoutClass = ''; // Nhận class col động từ component cha

  @Output() sizeChange = new EventEmitter<WidgetSize>();
  @Output() reload = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  /** Hiển thị popup options (hover) */
  showOptions = false;
  /** Đang spinner reload */
  isReloading = false;
  /** Mở submenu sang bên trái khi sát mép phải màn hình */
  openLeft = false;

  // Các tùy chọn kích thước
  readonly sizeOptions: { label: string; value: WidgetSize }[] = [
    { label: 'Tự động (mặc định)', value: 'auto' },
    { label: 'Nhỏ', value: 'small' },
    { label: 'Trung bình', value: 'medium' },
    { label: 'Lớn', value: 'large' },
  ];

  /**
   * Toggle mở options và tự động tính toán hướng mở rộng của submenu
   */
  toggleOptions(event: MouseEvent): void {
    event.stopPropagation();
    this.showOptions = !this.showOptions;
    if (this.showOptions) {
      this.checkSubmenuPosition();
    }
  }

  /**
   * Tính toán xem menu có gần rìa phải màn hình không để mở submenu sang trái
   */
  checkSubmenuPosition(): void {
    setTimeout(() => {
      const btn = this.el.nativeElement.querySelector('.widget-btn--options');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        // Nếu khoảng cách tới mép phải < 350px thì mở submenu sang bên trái
        this.openLeft = (screenWidth - rect.right) < 350;
      }
    }, 50);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Toggle thu gọn / mở rộng widget body.
   */
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Kích hoạt reload với animation spinner tạm thời.
   */
  onReload(): void {
    this.isReloading = true;
    this.reload.emit();
    setTimeout(() => (this.isReloading = false), 800);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Thay đổi kích thước widget và đóng popup.
   */
  onSelectSize(size: WidgetSize): void {
    this.size = size;
    this.sizeChange.emit(size);
    this.showOptions = false;
  }

  /** Đóng popup options khi click ra ngoài */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showOptions = false;
    }
  }

  /** Tính toán lại khi resize màn hình */
  @HostListener('window:resize')
  onResize(): void {
    if (this.showOptions) {
      this.checkSubmenuPosition();
    }
  }

  constructor(private el: ElementRef) {}
}
