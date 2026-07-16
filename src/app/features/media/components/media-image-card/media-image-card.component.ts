import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MediaImageItem } from '../../../../models/media';

/** Địa chỉ fake luân phiên – sẽ thay bằng reverse geocode khi có API */
const FAKE_ADDRESSES = [
  'Bãi đỗ 49 Đức Giang',
  'Điểm kẹp chí - KV3',
  'Cửa khẩu Mộc Bài',
  'Cảng Tân Cảng Cát Lái',
  'KCN Bình Dương - Cổng 1',
];

/**
 * Mô tả: Card hiển thị 1 bức ảnh phương tiện trong grid.
 * @Input() image: MediaImageItem  – dữ liệu ảnh
 * @Input() index: number          – index trong danh sách
 * @Output() imageClick: EventEmitter<number> – emit index khi click ảnh
 * @Thumbnail với object-fit: cover, aspect-ratio 4:3.
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
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
   * Lấy địa chỉ fake từ index để hiển thị trong metadata.
   * Xóa hàm này sau khi có reverse geocode hoặc địa chỉ từ API.
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  get fakeAddress(): string {
    return FAKE_ADDRESSES[this.index % FAKE_ADDRESSES.length];
  }

  /**
   * Xử lý khi người dùng click vào ảnh → emit index ra ngoài.
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onCardClick(): void {
    this.imageClick.emit(this.index);
  }

  /**
   * Tải ảnh về máy
   * @param event MouseEvent để ngăn bubble lên card click
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onDownload(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.image?.url) return;

    fetch(this.image.url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;

        // Tạo tên file từ URL hoặc dùng tên mặc định
        const fileName = this.image.url.split('/').pop()?.split('?')[0] || 'photo.jpg';
        a.download =
          fileName.endsWith('.jpg') || fileName.endsWith('.png') ? fileName : `${fileName}.jpg`;

        document.body.appendChild(a); // thêm thẻ a vào body
        a.click(); // click vào thẻ a để tải ảnh
        document.body.removeChild(a); // xóa thẻ a khỏi body
        window.URL.revokeObjectURL(blobUrl); // thu hồi URL của blob
      })
      .catch((err) => {
        console.warn('Lỗi tải ảnh, mở tab mới', err);
        window.open(this.image.url, '_blank');
      });
  }
}
