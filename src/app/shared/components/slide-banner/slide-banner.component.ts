import { Component, Input, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

export interface BannerSlide {
  id: string | number;
  imageUrl: string;
  title: string;
  shortContents: string;
  link?: string;
  order?: number;
  active?: boolean;
}

@Component({
  selector: 'app-slide-banner',
  imports: [],
  templateUrl: './slide-banner.component.html',
  styleUrl: './slide-banner.component.scss',
})
export class SlideBannerComponent implements OnInit, OnDestroy {
  @Input() slides: BannerSlide[] = [];

  private translationService = inject(TranslationService);

  readonly currentIndex = signal(0);
  readonly isHovered = signal(false);

  readonly t = (key: string) => this.translationService.translate(key);
  readonly currentLang = () => this.translationService.currentLang();

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_INTERVAL_MS = 5000;

  readonly hasSlides = computed(() => this.slides && this.slides.length > 0);

  readonly currentSlide = computed(() => {
    if (!this.hasSlides()) return null;
    return this.slides[this.currentIndex()] || null;
  });

  readonly totalSlides = computed(() => this.slides?.length || 0);

  readonly dotIndices = computed(() => {
    if (!this.hasSlides()) return [];
    const count = Math.min(this.slides.length, 5);
    return Array.from({ length: count }, (_, i) => i);
  });

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.hasSlides() && this.totalSlides() > 1) {
      this.intervalId = setInterval(() => {
        this.nextSlide();
      }, this.SLIDE_INTERVAL_MS);
    }
  }

  private stopAutoPlay(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private goToSlide(index: number): void {
    if (!this.hasSlides()) return;
    const maxIndex = this.totalSlides() - 1;
    this.currentIndex.set(Math.max(0, Math.min(index, maxIndex)));
  }

  nextSlide(): void {
    if (!this.hasSlides()) return;
    this.goToSlide((this.currentIndex() + 1) % this.totalSlides());
  }

  prevSlide(): void {
    if (!this.hasSlides()) return;
    const newIndex = this.currentIndex() - 1;
    this.goToSlide(newIndex < 0 ? this.totalSlides() - 1 : newIndex);
  }

  goToSlideByIndex(index: number): void {
    this.goToSlide(index);
    this.startAutoPlay();
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
    this.stopAutoPlay();
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    this.startAutoPlay();
  }
}
