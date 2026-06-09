/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Dialog xem ảnh chi tiết – custom slideshow (không dùng p-galleria
 *        để tránh lỗi two-way binding với ChangeDetectionStrategy.OnPush).
 *        - @Input() images: MediaImageItem[]         – danh sách ảnh trang hiện tại
 *        - @Input() activeIndex: number              – index ảnh được click mở
 *        - @Input() visible: boolean                 – trạng thái hiển thị
 *        - @Output() visibleChange: EventEmitter<boolean> – emit khi đóng dialog
 *        - Hỗ trợ circular navigation, autoPlay (timer 3s).
 *        - Caption overlay: biển số, thời gian, kênh, địa chỉ, tốc độ, nút download.
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
  OnDestroy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
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
 * Component dialog xem ảnh chi tiết
 */
@Component({
  selector: 'app-media-detail-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, DialogModule, ButtonModule],
  templateUrl: './media-detail-dialog.component.html',
  styleUrl: './media-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaDetailDialogComponent implements OnChanges, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  @Input() images: MediaImageItem[] = [];
  @Input() activeIndex: number = 0;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  // Cho phép circular navigation (quay lại đầu khi ở cuối)
  circular = true;

  // Trạng thái autoPlay
  autoPlay = false;

  // Index hiện tại – hoàn toàn do component tự quản lý
  currentIndex: number = 0;

  // Timer handle cho autoPlay
  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;

  // Getter tiện lợi để lấy ảnh hiện tại
  get currentImage(): MediaImageItem {
    return this.images[this.currentIndex];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Khi mở dialog hoặc activeIndex thay đổi, đồng bộ lại
    if (changes['activeIndex'] || changes['visible']) {
      this.currentIndex = this.activeIndex;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   * Chuyển sang ảnh trước.
   */
  prev(): void {
    if (this.images.length === 0) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.circular) {
      this.currentIndex = this.images.length - 1;
    }
    this.cdr.detectChanges();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   * Chuyển sang ảnh tiếp theo.
   */
  next(): void {
    if (this.images.length === 0) return;
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else if (this.circular) {
      this.currentIndex = 0;
    }
    this.cdr.detectChanges();
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
    if (this.autoPlay) {
      this.startAutoPlay();
    } else {
      this.stopAutoPlay();
    }
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   * Bắt đầu autoPlay với interval 3 giây.
   */
  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, 3000);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   * Dừng autoPlay.
   */
  private stopAutoPlay(): void {
    if (this.autoPlayTimer !== null) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Tải ảnh hiện tại về máy
   * @param image Ảnh cần download
   */
  onDownload(image: MediaImageItem): void {
    if (!image?.url) return;

    fetch(image.url)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;

        // Tạo tên file từ URL hoặc dùng tên mặc định
        const fileName = image.url.split('/').pop()?.split('?')[0] || 'photo.jpg';
        a.download = fileName.endsWith('.jpg') || fileName.endsWith('.png') ? fileName : `${fileName}.jpg`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        console.warn('CORS block or network error, falling back to window.open', err);
        window.open(image.url, '_blank');
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Đóng dialog và emit trạng thái về page cha.
   */
  onHide(): void {
    this.autoPlay = false;
    this.stopAutoPlay();
    this.visibleChange.emit(false);
  }
}
