/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Dialog xem ảnh chi tiết dùng PrimeNG Dialog + Galleria.
 *        - @Input() images: MediaImageItem[]         – danh sách ảnh trang hiện tại
 *        - @Input() activeIndex: number              – index ảnh được click mở
 *        - @Input() visible: boolean                 – trạng thái hiển thị
 *        - @Output() visibleChange: EventEmitter<boolean> – emit khi đóng dialog
 *        - Galleria: circular, showItemNavigators, autoPlay có thể toggle.
 *        - Caption overlay: biển số, thời gian, kênh, địa chỉ, tốc độ, nút download.
 *          Nền rgba(0,0,0,0.7) giống thiết kế.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { MediaImageItem } from '../../../../models/media';

// Địa chỉ fake cho caption – xóa sau khi có API
const FAKE_ADDRESSES = [
  'Bãi đỗ 49 Đức Giang',
  'Điểm kẹp chí - KV3',
  'Cửa khẩu Mộc Bài',
  'Cảng Tân Cảng Cát Lái',
  'KCN Bình Dương - Cổng 1',
];

/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Component dialog xem ảnh chi tiết với slideshow Galleria.
 */
@Component({
  selector: 'app-media-detail-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, DialogModule, GalleriaModule, ButtonModule],
  templateUrl: './media-detail-dialog.component.html',
  styleUrl: './media-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaDetailDialogComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() images: MediaImageItem[] = [];
  @Input() activeIndex: number = 0;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  // Trạng thái autoPlay của galleria
  autoPlay = false;

  // Trạng thái active index nội bộ (đồng bộ từ @Input)
  currentIndex: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    // Khi mở dialog, đồng bộ activeIndex từ @Input
    if (changes['activeIndex'] || changes['visible']) {
      this.currentIndex = this.activeIndex;
      this.cdr.markForCheck();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Lấy địa chỉ fake theo index cho caption overlay.
   * Xóa sau khi có reverse geocode từ latitude/longitude.
   * @param index Index ảnh trong danh sách
   */
  getFakeAddress(index: number): string {
    return FAKE_ADDRESSES[index % FAKE_ADDRESSES.length];
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Toggle bật/tắt chế độ xem ảnh tự động (autoPlay).
   */
  toggleAutoPlay(): void {
    this.autoPlay = !this.autoPlay;
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Tải ảnh hiện tại về máy – mở URL trong tab mới.
   * @param image Ảnh cần download
   */
  onDownload(image: MediaImageItem): void {
    // [API] downloadImage
    window.open(image.url, '_blank');
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Đóng dialog và emit trạng thái về page cha.
   */
  onHide(): void {
    this.autoPlay = false;
    this.visibleChange.emit(false);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Cập nhật currentIndex khi galleria chuyển ảnh.
   * @param index Index mới
   */
  onActiveIndexChange(index: number): void {
    this.currentIndex = index;
    this.cdr.markForCheck();
  }
}
