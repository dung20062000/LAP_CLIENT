/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Card hiển thị 1 bức ảnh phương tiện trong grid.
 *        - @Input() image: MediaImageItem  – dữ liệu ảnh
 *        - @Input() index: number          – index trong danh sách
 *        - @Output() imageClick: EventEmitter<number> – emit index khi click ảnh
 *        - Thumbnail với object-fit: cover, aspect-ratio 4:3.
 *        - Metadata: thời gian, tốc độ (fake 0 km/h), kênh, địa chỉ (fake), nút download.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MediaImageItem } from '../../../../models/media';

// Địa chỉ fake luân phiên – sẽ thay bằng reverse geocode khi có API
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
 * Component hiển thị card ảnh đơn trong grid gallery.
 */
@Component({
  selector: 'app-media-image-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './media-image-card.component.html',
  styleUrl: './media-image-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaImageCardComponent {
  @Input() image!: MediaImageItem;
  @Input() index: number = 0;
  @Output() imageClick = new EventEmitter<number>();

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Lấy địa chỉ fake từ index để hiển thị trong metadata.
   * Xóa hàm này sau khi có reverse geocode hoặc địa chỉ từ API.
   */
  get fakeAddress(): string {
    return FAKE_ADDRESSES[this.index % FAKE_ADDRESSES.length];
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Xử lý khi người dùng click vào ảnh → emit index ra ngoài.
   */
  onCardClick(): void {
    this.imageClick.emit(this.index);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Tải ảnh về máy – mở URL trong tab mới.
   * @param event MouseEvent để ngăn bubble lên card click
   */
  onDownload(event: MouseEvent): void {
    event.stopPropagation();
    // [API] downloadImage – mở URL để tải xuống
    window.open(this.image.url, '_blank');
  }
}
