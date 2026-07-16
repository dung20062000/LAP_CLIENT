// prettier-ignore
import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, SimpleChanges, ElementRef, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleOption } from '../../../../../models';

/**
 * Mô tả: Component bộ lọc phương tiện – thuần Angular, không dùng ng-select.
 *        - Custom dropdown multi-select với checkbox.
 *        - Header ghim cố định "Tất cả (N)" ở đầu dropdown.
 *        - Hỗ trợ search, clear, click-outside để đóng dropdown.
 *        - Emit filterChange: number[] (danh sách Vehicle.id được chọn).
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 */
@Component({
  selector: 'app-dashboard-filter',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard-filter.component.html',
  styleUrl: './dashboard-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFilterComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  /** Danh sách option xe nhận từ service */
  @Input() vehicleOptions: VehicleOption[] = [];
  /** Phát ra danh sách Vehicle.id đang được chọn (rỗng = tất cả) */
  @Output() filterChange = new EventEmitter<number[]>();

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  /** Giá trị đang chọn */
  selectedIds: number[] = [];

  /** Trạng thái mở/đóng dropdown */
  isOpen = false;

  /** Từ khóa tìm kiếm */
  searchTerm = '';

  /** Danh sách options đã lọc theo searchTerm */
  filteredOptions: VehicleOption[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.filteredOptions = [...this.vehicleOptions];
  }

  /**
   * Xử lý thay đổi input
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicleOptions']) {
      // Loại bỏ id không còn tồn tại trong danh sách mới
      if (this.selectedIds.length > 0) {
        const validIds = new Set(this.vehicleOptions.map((o) => o.value));
        this.selectedIds = this.selectedIds.filter((id) => validIds.has(id));
      }
      this.filteredOptions = this.applySearch(this.vehicleOptions, this.searchTerm);
    }
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  /**
   * Kiểm tra xem tất cả xe có đang được chọn hay không.
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  get isAllSelected(): boolean {
    return this.vehicleOptions.length > 0 && this.selectedIds.length === this.vehicleOptions.length;
  }

  /**
   * Mở/đóng dropdown
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  toggleDropdown(): void {
    this.searchTerm = '';
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Focus search input khi mở dropdown
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      }, 50);
    }
    this.cdr.markForCheck();
  }

  /**
   * Đóng dropdown
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  closeDropdown(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchTerm = '';
      this.filteredOptions = [...this.vehicleOptions];
      this.cdr.markForCheck();
    }
  }

  /**
   * Lắng nghe click toàn document để đóng dropdown khi click ra ngoài.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')

  /**
   * Đóng dropdown khi nhấn phím ESC
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  onEscape(): void {
    this.closeDropdown();
  }

  /**
   * Lọc danh sách khi người dùng gõ tìm kiếm
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  onSearch(): void {
    this.filteredOptions = this.applySearch(this.vehicleOptions, this.searchTerm);
    this.cdr.markForCheck();
  }

  /**
   * Áp dụng tìm kiếm
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  private applySearch(options: VehicleOption[], term: string): VehicleOption[] {
    if (!term || !term.trim()) return [...options];
    const lower = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }

  /**
   *  Kiểm tra item có đang được chọn không
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  /**
   * Lấy label theo id
   * Người tạo: DungBT
   * Ngày tạo: 15/07/2026
   */
  getLabelById(id: number): string {
    return this.vehicleOptions.find((o) => o.value === id)?.label ?? '';
  }

  /**
   * Bật/tắt chọn tất cả xe từ checkbox header "Tất cả".
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  toggleAllSelection(): void {
    if (this.isAllSelected) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.vehicleOptions.map((o) => o.value);
    }
    this.filterChange.emit([...this.selectedIds]);
    this.cdr.markForCheck();
  }

  /**
   * Chọn/bỏ chọn một item theo id.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  toggleItem(id: number): void {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) {
      this.selectedIds = this.selectedIds.filter((x) => x !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
    }
    this.filterChange.emit([...this.selectedIds]);
    this.cdr.markForCheck();
  }

  /**
   * Xóa một item khỏi danh sách chọn (bấm × trên tag).
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  removeItem(id: number, event: Event): void {
    event.stopPropagation();
    this.selectedIds = this.selectedIds.filter((x) => x !== id);
    this.filterChange.emit([...this.selectedIds]);
    this.cdr.markForCheck();
  }

  /**
   * Gọi khi người dùng xóa tất cả bằng nút clear.
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   */
  onClear(event: Event): void {
    event.stopPropagation();
    this.selectedIds = [];
    this.searchTerm = '';
    this.filteredOptions = [...this.vehicleOptions];
    this.filterChange.emit([]);
    this.cdr.markForCheck();
  }
}
