// prettier-ignore
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { MessageService } from 'primeng/api';

import { getHttpErrorMessage } from '../../../../shared/utils/http-error';
import { PAGE_SIZE_OPTIONS } from '../../../../shared/utils/constants';
import { MediaService } from '../../../../services/media';
// prettier-ignore
import { MediaSearchParams, MediaImageItem, GalleryLayoutCols, LAYOUT_CLASS_MAP } from '../../../../models/media';
import { MediaFilterComponent } from './media-filter/media-filter.component';
import { MediaImageCardComponent } from './media-image-card/media-image-card.component';
import { MediaDetailDialogComponent } from './media-detail-dialog/media-detail-dialog.component';

/**
 * Mô tả: Trang chính Xem Ảnh Phương Tiện.
 *        - Phối hợp MediaFilterComponent, MediaImageCardComponent,
 *          MediaDetailDialogComponent và PrimeNG Paginator.
 *        - Gọi MediaService.searchImages() khi submit bộ lọc hoặc đổi trang.
 *        - Container height: 100%; overflow-y: auto để fit vừa 1 màn hình.
 *        - Layout grid: 4 cột (col-md-3), 5 cột (col-20), 6 cột (col-md-2).
 *          Mặc định 6 cột.
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
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

  /** Danh sách ảnh hiện tại */
  images: MediaImageItem[] = [];
  /** Tổng số ảnh (dùng cho paginator) */
  totalRecords = 0;
  /** Trạng thái loading khi đang tìm kiếm */
  loading = false;

  /** Params tìm kiếm hiện tại – lưu để dùng khi đổi trang */
  currentParams: MediaSearchParams | null = null;

  /** Layout class: 4→col-md-3, 5→col-20, 6→col-md-2 */
  layoutClass = LAYOUT_CLASS_MAP[GalleryLayoutCols.Col6];
  /** Số cột đang chọn */
  activeLayout: GalleryLayoutCols = GalleryLayoutCols.Col6;

  // Paginator state
  currentPage = 0; // p-paginator dùng 0-based
  rows = 50;
  rowsPerPageOptions = PAGE_SIZE_OPTIONS;

  // Dialog state
  dialogVisible = false;
  activeIndex = 0;

  /**
   * Nhận params từ filter component → reset về trang 1 → tìm kiếm.
   * @param params Bộ lọc từ MediaFilterComponent
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
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
   * Gọi service tìm kiếm ảnh và cập nhật grid.
   * searchImages(this.currentParams): Gọi API tìm kiếm ảnh
   * pipe(...): Đưa luồng dữ liệu vào đường ống xử lý.
   * takeUntilDestroyed(this.destroyRef): Lắp một cái "van tự động ngắt". Nếu Component bị hủy trước khi API trả lời, ngắt luồng ngay lập tức.
   * subscribe({ ... }): Lắng nghe kết quả. Nếu dữ liệu về an toàn (Component vẫn còn sống),
   *  -> cập nhật UI (next),
   *  -> báo Toast success,
   *  -> và trigger Change Detection.
   *  Nếu lỗi thì bắt lỗi (error), báo Toast error.
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
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
   * Xử lý sự kiện đổi trang từ PrimeNG Paginator.
   * Cập nhật pageNumber/pageSize và gọi lại tìm kiếm.
   * @param event Sự kiện paginator { page, rows, first }
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
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
   * Thay đổi số cột hiển thị trong grid.
   * @param cols Số cột muốn hiển thị
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onLayoutChange(cols: GalleryLayoutCols): void {
    this.activeLayout = cols;
    this.layoutClass = LAYOUT_CLASS_MAP[cols];
    this.cdr.markForCheck();
  }

  /**
   * Kiểm tra xem có trang trước đó không
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  get hasPrevPage(): boolean {
    return this.currentPage > 0;
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
   * Mở dialog xem chi tiết ảnh tại index được click.
   * @param index Index của ảnh trong mảng images
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onImageClick(index: number): void {
    this.activeIndex = index;
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  /**
   * Load trang tiếp theo khi đang xem ảnh trong dialog
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  onDialogLoadNextPage(): void {
    if (!this.currentParams || !this.hasNextPage) return;
    this.currentPage++;
    this.currentParams = { ...this.currentParams, pageNumber: this.currentPage + 1 };
    this.loadImages();
  }

  /**
   * Load trang trước đó khi đang xem ảnh trong dialog
   * Người tạo: DungBT
   * Ngày tạo: 23/06/2026
   */
  onDialogLoadPrevPage(): void {
    if (!this.currentParams || !this.hasPrevPage) return;
    this.currentPage--;
    this.currentParams = { ...this.currentParams, pageNumber: this.currentPage + 1 };
    this.loadImages();
  }

  /**
   * Đóng dialog – nhận sự kiện visibleChange từ dialog component.
   * @param visible Trạng thái visible mới
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   */
  onDialogVisibleChange(visible: boolean): void {
    this.dialogVisible = visible;
    this.cdr.markForCheck();
  }
}
