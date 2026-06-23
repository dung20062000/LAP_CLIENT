// prettier-ignore
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { MessageService } from 'primeng/api';

import { getHttpErrorMessage } from '../../../../shared/utils/http-error';
import { MediaService } from '../../../../services/media';
import { MediaSearchParams, MediaImageItem, GalleryLayoutCols, LAYOUT_CLASS_MAP } from '../../../../models/media';

import { MediaFilterComponent } from '../../components/media-filter/media-filter.component';
import { MediaImageCardComponent } from '../../components/media-image-card/media-image-card.component';
import { MediaDetailDialogComponent } from '../../components/media-detail-dialog/media-detail-dialog.component';

/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Trang chính Xem Ảnh Phương Tiện.
 *        - Phối hợp MediaFilterComponent, MediaImageCardComponent,
 *          MediaDetailDialogComponent và PrimeNG Paginator.
 *        - Gọi MediaService.searchImages() khi submit bộ lọc hoặc đổi trang.
 *        - Container height: 100%; overflow-y: auto để fit vừa 1 màn hình.
 *        - Layout grid: 4 cột (col-md-3), 5 cột (col-20), 6 cột (col-md-2).
 *          Mặc định 6 cột.
 */
@Component({
  selector: 'app-media-gallery-page',
  standalone: true,
  // prettier-ignore
  imports: [CommonModule, PaginatorModule, MediaFilterComponent, MediaImageCardComponent, MediaDetailDialogComponent],
  templateUrl: './media-gallery-page.component.html',
  styleUrl: './media-gallery-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // Chỉ chạy code khi có thay đổi
})
export class MediaGalleryPageComponent {
  private mediaService = inject(MediaService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);

  // Danh sách ảnh hiện tại
  images: MediaImageItem[] = [];
  // Tổng số ảnh (dùng cho paginator)
  totalRecords = 0;

  // Trạng thái loading khi đang tìm kiếm
  loading = false;

  // Params tìm kiếm hiện tại – lưu để dùng khi đổi trang
  currentParams: MediaSearchParams | null = null;

  // Layout class: 4→col-md-3, 5→col-20, 6→col-md-2
  layoutClass = LAYOUT_CLASS_MAP[6];
  // Số cột đang chọn
  activeLayout: GalleryLayoutCols = 6;

  // Paginator state
  currentPage = 0; // p-paginator dùng 0-based
  rows = 50;
  rowsPerPageOptions = [10, 20, 50, 100];

  // Dialog state
  dialogVisible = false;
  activeIndex = 0;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Nhận params từ filter component → reset về trang 1 → tìm kiếm.
   * @param params Bộ lọc từ MediaFilterComponent
   */
  onSearch(params: MediaSearchParams | null): void {
    // Reset về trang đầu khi filter thay đổi
    this.currentPage = 0;
    if (!params) {
      this.currentParams = null;
      this.images = [];
      this.totalRecords = 0;
      this.cdr.markForCheck();
      return;
    }
    this.currentParams = { ...params, pageNumber: 1, pageSize: this.rows };
    this.loadImages();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Gọi service tìm kiếm ảnh và cập nhật grid.
   * searchImages(this.currentParams): Gọi API tìm kiếm ảnh
   * pipe(...): Đưa luồng dữ liệu vào đường ống xử lý.
   * takeUntilDestroyed(this.destroyRef): Lắp một cái "van tự động ngắt". Nếu Component bị hủy trước khi API trả lời, ngắt luồng ngay lập tức.
   * subscribe({ ... }): Lắng nghe kết quả. Nếu dữ liệu về an toàn (Component vẫn còn sống),
   *  -> cập nhật UI (next),
   *  -> báo Toast success,
   *  -> và trigger Change Detection.
   *  Nếu lỗi thì bắt lỗi (error), báo Toast error.
   */
  private loadImages(): void {
    if (!this.currentParams) return;

    this.loading = true;
    this.cdr.markForCheck();

    // API loadImages
    this.mediaService
      .searchImages(this.currentParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.images = result.items;
          this.totalRecords = result.totalCount;
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Tìm kiếm thành công.',
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[Media] Lỗi khi tìm kiếm ảnh:', err);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: getHttpErrorMessage(err, 'Lỗi khi tìm kiếm ảnh. Vui lòng thử lại.'),
          });
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Xử lý sự kiện đổi trang từ PrimeNG Paginator.
   * Cập nhật pageNumber/pageSize và gọi lại tìm kiếm.
   * @param event Sự kiện paginator { page, rows, first }
   */
  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.rows = event.rows ?? 50;

    if (this.currentParams) {
      this.currentParams = {
        ...this.currentParams,
        pageNumber: (event.page ?? 0) + 1, // API 1-based (từ 1 trở đi)
        pageSize: event.rows ?? 50,
      };
      this.loadImages();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Thay đổi số cột hiển thị trong grid.
   * @param cols Số cột muốn hiển thị
   */
  onLayoutChange(cols: GalleryLayoutCols): void {
    this.activeLayout = cols;
    this.layoutClass = LAYOUT_CLASS_MAP[cols];
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Mở dialog xem chi tiết ảnh tại index được click.
   * @param index Index của ảnh trong mảng images
   */
  onImageClick(index: number): void {
    this.activeIndex = index;
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Đóng dialog – nhận sự kiện visibleChange từ dialog component.
   * @param visible Trạng thái visible mới
   */
  onDialogVisibleChange(visible: boolean): void {
    this.dialogVisible = visible;
    this.cdr.markForCheck();
  }
}
