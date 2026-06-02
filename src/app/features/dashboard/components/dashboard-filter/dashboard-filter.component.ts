/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Component bộ lọc phương tiện – thuần Angular, không dùng ng-select.
 *        - Custom dropdown multi-select với checkbox.
 *        - Header ghim cố định "Tất cả (N)" ở đầu dropdown.
 *        - Hỗ trợ search, clear, click-outside để đóng dropdown.
 *        - Emit filterChange: number[] (danh sách Vehicle.id được chọn).
 */
import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleOption } from '../../../../models';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Component bộ lọc xe — custom multi-select thuần HTML/Angular với checkbox và dòng "Tất cả" ghim đầu.
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
  // Danh sách option xe nhận từ service
  @Input() vehicleOptions: VehicleOption[] = [];
  // Phát ra danh sách Vehicle.id đang được chọn (rỗng = tất cả)
  @Output() filterChange = new EventEmitter<number[]>();

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  // Giá trị đang chọn
  selectedIds: number[] = [];

  // Trạng thái mở/đóng dropdown
  isOpen = false;

  // Từ khóa tìm kiếm
  searchTerm = '';

  // Danh sách options đã lọc theo searchTerm
  filteredOptions: VehicleOption[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.filteredOptions = [...this.vehicleOptions];
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xử lý thay đổi input
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

  // Kiểm tra xem tất cả xe có đang được chọn hay không.
  get isAllSelected(): boolean {
    return this.vehicleOptions.length > 0 && this.selectedIds.length === this.vehicleOptions.length;
  }

  // Mở/đóng dropdown
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

  // Đóng dropdown
  closeDropdown(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchTerm = '';
      this.filteredOptions = [...this.vehicleOptions];
      this.cdr.markForCheck();
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Lắng nghe click toàn document để đóng dropdown khi click ra ngoài.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  /** Lọc danh sách khi người dùng gõ tìm kiếm */
  onSearch(): void {
    this.filteredOptions = this.applySearch(this.vehicleOptions, this.searchTerm);
    this.cdr.markForCheck();
  }

  private applySearch(options: VehicleOption[], term: string): VehicleOption[] {
    if (!term || !term.trim()) return [...options];
    const lower = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }

  // Kiểm tra item có đang được chọn không
  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  // Lấy label theo id
  getLabelById(id: number): string {
    return this.vehicleOptions.find((o) => o.value === id)?.label ?? '';
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Bật/tắt chọn tất cả xe từ checkbox header "Tất cả".
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
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Chọn/bỏ chọn một item theo id.
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
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Xóa một item khỏi danh sách chọn (bấm × trên tag).
   */
  removeItem(id: number, event: Event): void {
    event.stopPropagation();
    this.selectedIds = this.selectedIds.filter((x) => x !== id);
    this.filterChange.emit([...this.selectedIds]);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Gọi khi người dùng xóa tất cả bằng nút clear.
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
