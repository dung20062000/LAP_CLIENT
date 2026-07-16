// prettier-ignore
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnChanges, SimpleChanges, OnDestroy, } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MediaImageItem } from '../../../../models/media';

/** Địa chỉ fake cho caption – xóa sau khi có API */
const FAKE_ADDRESSES = [
  'Bãi đỗ 49 Đức Giang',
  'Điểm kẹp chí - KV3',
  'Cửa khẩu Mộc Bài',
  'Cảng Tân Cảng Cát Lái',
  'KCN Bình Dương - Cổng 1',
];

/**
 * Mô tả: Dialog xem ảnh chi tiết – custom slideshow (không dùng p-galleria
 * để tránh lỗi two-way binding với ChangeDetectionStrategy.OnPush).
 * @Input() images: MediaImageItem[] – danh sách ảnh trang hiện tại
 * @Input() activeIndex: number      – index ảnh được click mở
 * @Input() visible: boolean         – trạng thái hiển thị
 * @Output() visibleChange: EventEmitter<boolean> – emit khi đóng dialog
 * @Hỗ trợ circular navigation, autoPlay (timer 3s).
 * @Caption overlay: biển số, thời gian, kênh, địa chỉ, tốc độ, nút download.
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
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

  // Các Input cho phân trang
  @Input() totalRecords: number = 0;
  @Input() currentPage: number = 0;
  @Input() rows: number = 50;
  @Input() loading: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() loadNextPage = new EventEmitter<void>();
  @Output() loadPrevPage = new EventEmitter<void>();

  /** Cho phép circular navigation (quay lại đầu khi ở cuối) */
  /** Cho phép circular navigation (quay lại đầu khi ở cuối) */
  circular = true;

  /** Trạng thái autoPlay */
  autoPlay = false;

  /** Index hiện tại – hoàn toàn do component tự quản lý */
  currentIndex: number = 0;

  /** Lưu hướng chuyển trang để sau khi fetch xong sẽ gán lại index phù hợp */
  pendingDirection: 'next' | 'prev' | null = null;

  /** Timer handle cho autoPlay */
  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;

  /** Getter tiện lợi để lấy ảnh hiện tại */
  get currentImage(): MediaImageItem {
    return this.images[this.currentIndex];
  }

  /**
   * Kiểm tra xem có trang tiếp theo không
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  get hasNextPage(): boolean {
    return (this.currentPage + 1) * this.rows < this.totalRecords;
  }

  /**
   * Kiểm tra xem có trang trước không
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  get hasPrevPage(): boolean {
    return this.currentPage > 0;
  }

  /**
   * Lấy index hiện tại trong tổng số ảnh
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  get globalCurrentIndex(): number {
    return this.currentPage * this.rows + this.currentIndex + 1;
  }

  /**
   * Xử lý khi component nhận inputs thay đổi
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Khi mở dialog hoặc activeIndex thay đổi, đồng bộ lại
    if (changes['activeIndex'] || changes['visible']) {
      this.currentIndex = this.activeIndex;
      this.cdr.markForCheck();
    }

    // Nếu images thay đổi (ví dụ: chuyển trang), reset lại currentIndex
    if (changes['images'] && !changes['images'].isFirstChange() && this.visible) {
      if (this.pendingDirection === 'next') {
        this.currentIndex = 0;
      } else if (this.pendingDirection === 'prev') {
        this.currentIndex = this.images.length > 0 ? this.images.length - 1 : 0;
      }
      this.pendingDirection = null;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Chuyển sang ảnh trước.
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   */
  prev(): void {
    if (this.images.length === 0 || this.loading) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.hasPrevPage) {
      this.pendingDirection = 'prev';
      this.loadPrevPage.emit();
    } else if (this.circular) {
      this.currentIndex = this.images.length - 1;
    }
    this.cdr.detectChanges();
  }

  /**
   * Chuyển sang ảnh tiếp theo.
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   */
  next(): void {
    if (this.images.length === 0 || this.loading) return;
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else if (this.hasNextPage) {
      this.pendingDirection = 'next';
      this.loadNextPage.emit();
    } else if (this.circular) {
      this.currentIndex = 0;
    }
    this.cdr.detectChanges();
  }

  /**
   * Lấy địa chỉ fake theo index cho caption overlay.
   * Xóa sau khi có reverse geocode từ latitude/longitude.
   * @param index Index ảnh trong danh sách
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  getFakeAddress(index: number): string {
    return FAKE_ADDRESSES[index % FAKE_ADDRESSES.length];
  }

  /**
   * Toggle bật/tắt chế độ xem ảnh tự động (autoPlay).
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
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
   * Bắt đầu autoPlay với interval 3 giây.
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   */
  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, 3000);
  }

  /**
   * Dừng autoPlay.
   * Người tạo: DungBT
   * Ngày tạo: 09/06/2026
   */
  private stopAutoPlay(): void {
    if (this.autoPlayTimer !== null) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  /**
   * Tải ảnh hiện tại về máy
   * @param image Ảnh cần download
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onDownload(image: MediaImageItem): void {
    if (!image?.url) return;

    fetch(image.url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;

        // Tạo tên file từ URL hoặc dùng tên mặc định
        const fileName = image.url.split('/').pop()?.split('?')[0] || 'photo.jpg';
        a.download =
          fileName.endsWith('.jpg') || fileName.endsWith('.png') ? fileName : `${fileName}.jpg`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.warn('CORS block or network error, falling back to window.open', err);
        window.open(image.url, '_blank');
      });
  }

  /**
   * Đóng dialog và emit trạng thái về page cha.
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onHide(): void {
    this.autoPlay = false;
    this.stopAutoPlay();
    this.visibleChange.emit(false);
  }
}
