/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Component hiển thị slide banner với auto-play, điều hướng mũi tên,
 *         dots, hover tạm dừng, và hỗ trợ đa ngôn ngữ (VI/EN).
 */
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { BannerService } from '../../services/banner.service';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Shape gốc từ CMS API trả về — mỗi trường có thể hiển thị đều chứa cả VI và EN.
 * Shape này KHÔNG dùng trực tiếp trong template; cần qua resolvedSlides trước.
 */
export interface BannerSlide {
  id: string | number;
  imageUrl: string;
  title: { vi: string; en: string };
  shortContents: { vi: string; en: string };
  link?: string;
  order?: number;
  active?: boolean;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Banner sau khi đã resolve ngôn ngữ — title và shortContents là string thuần,
 * sẵn sàng hiển thị trong template.
 */
export interface ResolvedBannerSlide extends Omit<BannerSlide, 'title' | 'shortContents'> {
  title: string;
  shortContents: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Component hiển thị slide banner.
 */
@Component({
  selector: 'app-slide-banner',
  imports: [],
  templateUrl: './slide-banner.component.html',
  styleUrl: './slide-banner.component.scss',
})
export class SlideBannerComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  private bannerService = inject(BannerService);

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Chuyển Observable thành Signal nhờ toSignal.
   * initialValue đảm bảo component render ngay với mảng rỗng trước khi HTTP
   * response về, không cần kiểm tra null ở khắp nơi.
   */
  readonly banners = toSignal(this.bannerService.getBanners(), {
    initialValue: [] as BannerSlide[],
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Theo dõi slide nào đang hiển thị (index bắt đầu từ 0).
   */
  readonly currentIndex = signal(0);

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * True khi chuột đang ở trong vùng banner — dùng để hiện/ẩn mũi tên.
   */
  readonly isHovered = signal(false);

  // Viết tắt cho TranslationService.translate — dùng trong template.
  readonly t = (key: string): string => this.translationService.translate(key);

  // Mã ngôn ngữ hiện tại ('vi' | 'en'). resolvedSlides dùng giá trị này.
  readonly currentLang = (): string => this.translationService.currentLang();

  // Handle của timer auto-play — clear trong ngOnDestroy để tránh rò rỉ bộ nhớ.
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_INTERVAL_MS = 5000;

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Resolve dữ liệu thô từ API thành chuỗi sẵn sàng hiển thị.
   * computed tự chạy lại khi banners() hoặc currentLang() thay đổi,
   * nhờ đó UI luôn đúng ngôn ngữ mà không cần subscription thủ công.
   */
  readonly resolvedSlides = computed<ResolvedBannerSlide[]>(() => {
    const lang = this.currentLang() as 'vi' | 'en';
    return this.banners().map((slide) => ({
      ...slide,
      title: slide.title[lang] ?? slide.title['vi'],
      shortContents: slide.shortContents[lang] ?? slide.shortContents['vi'],
    }));
  });

  // True khi có ít nhất một banner để hiển thị.
  readonly hasSlides = computed(
    () => this.resolvedSlides() !== null && this.resolvedSlides().length > 0,
  );

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Trả về object slide đang hiển thị.
   * Trả null nếu không có slide (dùng làm guard cho @if trong template).
   */
  readonly currentSlide = computed(() => {
    if (!this.hasSlides()) return null;
    return this.resolvedSlides()[this.currentIndex()] || null;
  });

  // Tổng số slide — dùng cho phép tính modulo trong nextSlide.
  readonly totalSlides = computed(() => this.resolvedSlides()?.length || 0);

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Các chấm tròn chỉ giới hạn 5 cái dù có nhiều slide hơn.
   */
  readonly dotIndices = computed(() => {
    if (!this.hasSlides()) return [];
    const count = Math.min(this.resolvedSlides().length, 5);
    return Array.from({ length: count }, (_, i) => i);
  });

  // Bắt đầu auto-play khi component được khởi tạo.
  ngOnInit(): void {
    this.startAutoPlay();
  }

  // Dọn dẹp timer khi component bị hủy để tránh rò rỉ bộ nhớ.
  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Khởi động lại auto-play.
   * Luôn stop timer cũ trước để tránh có nhiều interval chạy cùng lúc.
   * Không làm gì nếu chỉ có 1 slide (không cần chuyển).
   */
  private startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.hasSlides() && this.totalSlides() > 1) {
      this.intervalId = setInterval(() => {
        this.nextSlide();
      }, this.SLIDE_INTERVAL_MS);
    }
  }

  // Xóa timer auto-play và reset handle về null.
  private stopAutoPlay(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Di chuyển đến slide có index cho trước, giới hạn trong phạm vi hợp lệ.
   * Clamp giá trị để chặn index nằm ngoài mảng từ dot click hoặc bàn phím.
   */
  private goToSlide(index: number): void {
    if (!this.hasSlides()) return;
    const maxIndex = this.totalSlides() - 1;
    this.currentIndex.set(Math.max(0, Math.min(index, maxIndex)));
  }

  // Chuyển sang slide tiếp theo, quay vòng từ cuối về đầu.
  nextSlide(): void {
    if (!this.hasSlides()) return;
    this.goToSlide((this.currentIndex() + 1) % this.totalSlides());
  }

  // Chuyển về slide trước, quay vòng từ đầu về cuối.
  prevSlide(): void {
    if (!this.hasSlides()) return;
    const newIndex = this.currentIndex() - 1;
    this.goToSlide(newIndex < 0 ? this.totalSlides() - 1 : newIndex);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Xử lý khi click vào dot — nhảy đến slide được chọn VÀ restart auto-play.
   * Restart để user có chu kỳ mới sau khi tự điều hướng thủ công.
   */
  goToSlideByIndex(index: number): void {
    this.goToSlide(index);
    this.startAutoPlay();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Tạm dừng auto-play khi user hover vào banner.
   * Nhờ đó user yên tâm đọc nội dung mà không bị slide chuyển.
   */
  onMouseEnter(): void {
    this.isHovered.set(true);
    this.stopAutoPlay();
  }

  // Tiếp tục auto-play khi chuột rời khỏi banner.
  onMouseLeave(): void {
    this.isHovered.set(false);
    this.startAutoPlay();
  }
}
