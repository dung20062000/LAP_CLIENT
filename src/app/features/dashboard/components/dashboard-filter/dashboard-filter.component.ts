/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Mô tả: Component bộ lọc phương tiện dùng ng-select multi-select.
 *        - Header template ghim cố định "Tất cả (N)" ở đầu dropdown.
 *        - bindValue="id" (number) để ng-select tracking chính xác.
 *        - Emit filterChange: number[] (danh sách Vehicle.id được chọn).
 */
import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { VehicleOption } from '../../../../models';

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/06/2026
 * Component bộ lọc xe — multi-select với checkbox và dòng "Tất cả" ghim đầu.
 */
@Component({
  selector: 'app-dashboard-filter',
  standalone: true,
  imports: [FormsModule, NgSelectModule],
  templateUrl: './dashboard-filter.component.html',
  styleUrl: './dashboard-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFilterComponent implements OnInit, OnChanges {
  /** Danh sách option xe nhận từ service (id + biển số) */
  @Input() vehicleOptions: VehicleOption[] = [];
  /** Phát ra danh sách Vehicle.id đang được chọn (rỗng = tất cả) */
  @Output() filterChange = new EventEmitter<number[]>();

  /** Giá trị đang chọn: array number (Vehicle.id), đồng bộ với bindValue="id" */
  selectedIds: number[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log("Kiểm tra data xe: ",this.vehicleOptions)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicleOptions'] && this.selectedIds.length > 0) {
      // Loại bỏ id không còn tồn tại trong danh sách mới
      const validIds = new Set(this.vehicleOptions.map((o) => o.value));
      this.selectedIds = this.selectedIds.filter((id) => validIds.has(id));
    }
    this.cdr.markForCheck();
  }

  // ─── Getters ─────────────────────────────────────────────────────────────

  /**
   * Kiểm tra xem tất cả xe có đang được chọn hay không.
   */
  get isAllSelected(): boolean {
    return this.vehicleOptions.length > 0 && this.selectedIds.length === this.vehicleOptions.length;
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

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
    this.filterChange.emit(this.selectedIds);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Gọi khi ng-select chọn 1 item.
   * ng-select với bindValue="id" trả về { id } object, ta dùng [(ngModel)] đã update selectedIds.
   */
  onAdd(): void {
    console.log('Kiểm tra data xe được chọn: ', this.selectedIds);
    this.filterChange.emit([...this.selectedIds]);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Gọi khi ng-select bỏ chọn 1 item.
   */
  onRemove(): void {
    console.log('Kiểm tra data xe được chọn: ', this.selectedIds);
    this.filterChange.emit([...this.selectedIds]);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Gọi khi người dùng xóa tất cả bằng nút clear.
   */
  onClear(): void {
    this.selectedIds = [];
    console.log('Kiểm tra data xe được chọn: ', this.selectedIds);
    this.filterChange.emit([]);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 01/06/2026
   * Custom search: tìm kiếm theo biển số xe (licensePlate).
   * @param term  Từ khóa tìm kiếm
   * @param item  Option đang xét
   */
  searchFn(term: string, item: VehicleOption): boolean {
    return item.label.toLowerCase().includes(term.toLowerCase());
  }
}
