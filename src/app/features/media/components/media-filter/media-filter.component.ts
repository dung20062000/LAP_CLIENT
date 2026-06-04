/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Bộ lọc màn hình Xem Ảnh Phương Tiện.
 *        - TreeSelect nhóm PT → khi chọn/bỏ chọn sẽ gọi service lấy danh sách xe.
 *        - Dropdown xe (có filter), MultiSelect kênh (Kênh 1..4).
 *        - Calendar ngày + 2 Calendar giờ bắt đầu/kết thúc (timeOnly).
 *        - Logic disable: ngày kết thúc không được cách ngày bắt đầu quá 30 ngày.
 *        - Emit sự kiện (search) kèm MediaSearchParams ra page cha khi bấm Tìm kiếm.
 */
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';
import { Select } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePicker } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TreeNode } from 'primeng/api';

import { MediaService } from '../../../../services/media';
import {
  VehicleItem,
  MediaChannel,
  MediaSearchParams,
  SortOption,
} from '../../../../models/media';

/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Component bộ lọc tìm kiếm ảnh phương tiện.
 */
@Component({
  selector: 'app-media-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeSelectModule,
    Select,
    MultiSelectModule,
    DatePicker,
    ButtonModule,
  ],
  templateUrl: './media-filter.component.html',
  styleUrl: './media-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaFilterComponent implements OnInit {
  private mediaService = inject(MediaService);
  private cdr = inject(ChangeDetectorRef);

  // Quản lý số cột của layout từ component cha
  @Input() activeLayout: 4 | 5 | 6 = 6;
  @Output() layoutChange = new EventEmitter<4 | 5 | 6>();

  // Sự kiện phát ra params tìm kiếm cho page cha
  @Output() searchSubmit = new EventEmitter<MediaSearchParams>();

  changeLayout(cols: 4 | 5 | 6): void {
    this.layoutChange.emit(cols);
  }

  // Dữ liệu cho TreeSelect nhóm PT
  vehicleGroups: TreeNode[] = [];
  // Các node đang được chọn trong TreeSelect
  selectedGroups: TreeNode[] = [];

  // Dữ liệu và giá trị cho Dropdown xe
  vehicleList: VehicleItem[] = [];
  selectedVehicle: VehicleItem | null = null;
  vehicleLoading = false;

  // Dữ liệu và giá trị cho MultiSelect kênh
  channelOptions: MediaChannel[] = [];
  selectedChannels: number[] = [];

  // Dropdown chiều sắp xếp
  sortOptions: SortOption[] = [
    { label: 'Theo ảnh mới nhất', value: 'desc' },
    { label: 'Theo ảnh cũ nhất', value: 'asc' },
  ];
  selectedSort: 'desc' | 'asc' = 'desc';

  // Calendar ngày
  selectedDate: Date | null = new Date();
  today = new Date();

  // Calendar giờ bắt đầu (default 00:00)
  startTime: Date = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // Calendar giờ kết thúc (default 23:59)
  endTime: Date = (() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d;
  })();

  // Ngày tối đa cho endDate (startDate + 30 ngày)
  maxEndDate: Date = new Date();

  ngOnInit(): void {
    // Load nhóm xe khi khởi tạo component
    this.loadVehicleGroups();
    // Khởi tạo maxEndDate = today + 0 (không giới hạn cho ngày đầu)
    this.updateMaxEndDate();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Gọi service lấy cây nhóm xe cho TreeSelect.
   */
  private loadVehicleGroups(): void {
    // [API] loadVehicleGroups
    this.mediaService.getVehicleGroups().subscribe({
      next: (groups) => {
        this.vehicleGroups = groups;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Khi chọn/bỏ chọn node nhóm trong TreeSelect → load lại danh sách xe.
   */
  onNodeSelect(): void {
    this.loadVehiclesByGroups();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Khi bỏ chọn node nhóm → load lại danh sách xe theo nhóm còn lại.
   */
  onNodeUnselect(): void {
    this.loadVehiclesByGroups();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Gọi service lấy danh sách xe theo các nhóm đang được chọn.
   */
  private loadVehiclesByGroups(): void {
    // Lấy key của các node lá đang được chọn
    const groupIds = this.selectedGroups
      .filter((n) => !n.children || n.children.length === 0)
      .map((n) => n.key as string);

    this.vehicleLoading = true;
    this.selectedVehicle = null;
    this.channelOptions = [];
    this.selectedChannels = [];
    this.cdr.markForCheck();

    // [API] loadVehiclesByGroups – gọi service
    this.mediaService.getVehiclesByGroups(groupIds).subscribe({
      next: (vehicles) => {
        this.vehicleList = vehicles;
        this.vehicleLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Khi chọn xe → khởi tạo danh sách kênh (Kênh 1..4 fake).
   */
  onVehicleChange(): void {
    if (this.selectedVehicle) {
      // Khởi tạo 4 kênh fake khi có xe được chọn
      this.channelOptions = [1, 2, 3, 4].map((i) => ({
        value: i,
        label: `Kênh ${i}`,
      }));
    } else {
      this.channelOptions = [];
      this.selectedChannels = [];
    }
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Khi thay đổi ngày bắt đầu → tính lại maxEndDate (không quá 30 ngày).
   */
  onDateChange(): void {
    this.updateMaxEndDate();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Tính maxEndDate = selectedDate + 30 ngày (tối đa đến today).
   */
  private updateMaxEndDate(): void {
    if (!this.selectedDate) {
      this.maxEndDate = this.today;
      return;
    }
    const max = new Date(this.selectedDate);
    max.setDate(max.getDate() + 30);
    // Không được vượt quá hôm nay
    this.maxEndDate = max > this.today ? this.today : max;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Build params và emit sự kiện search ra page cha.
   * Validate: phải chọn xe trước khi tìm kiếm.
   */
  onSearch(): void {
    if (!this.selectedVehicle || !this.selectedDate) {
      return;
    }

    // Ghép ngày và giờ thành datetime string ISO
    const date = new Date(this.selectedDate);
    const start = new Date(date);
    start.setHours(this.startTime.getHours(), this.startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(this.endTime.getHours(), this.endTime.getMinutes(), 59, 0);

    const params: MediaSearchParams = {
      vehiclePlate: this.selectedVehicle.vehiclePlate,
      customerId: null,
      channels: this.selectedChannels,
      startTime: this.formatDatetime(start),
      endTime: this.formatDatetime(end),
      sortOrder: this.selectedSort,
      pageNumber: 1,
      pageSize: 50,
    };

    // Emit params lên page cha
    this.searchSubmit.emit(params);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Format Date thành chuỗi ISO datetime không có timezone
   * để gửi lên API đúng định dạng "yyyy-MM-ddTHH:mm:ss".
   * @param date Date cần format
   */
  private formatDatetime(date: Date): string {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }
}
