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
import { NgSelectModule } from '@ng-select/ng-select';
import { DatePicker } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { TreeNode, MessageService } from 'primeng/api';

import { getHttpErrorMessage } from '../../../../shared/utils/http-error';
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
    NgSelectModule,
    DatePicker,
    ButtonModule,
    Checkbox,
  ],
  templateUrl: './media-filter.component.html',
  styleUrl: './media-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaFilterComponent implements OnInit {
  private mediaService = inject(MediaService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  // Quản lý số cột của layout từ component cha
  @Input() activeLayout: 4 | 5 | 6 = 6;
  @Output() layoutChange = new EventEmitter<4 | 5 | 6>();

  // Sự kiện phát ra params tìm kiếm cho page cha
  @Output() searchSubmit = new EventEmitter<MediaSearchParams | null>();

  // Dữ liệu cho TreeSelect nhóm PT
  vehicleGroups: TreeNode[] = [];
  originalVehicleGroups: TreeNode[] = [];
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
  minDate: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();
  groupSearchQuery = '';

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
    this.mediaService.getVehicleGroups().subscribe({
      next: (groups) => {
        this.vehicleGroups = groups || [];
        this.originalVehicleGroups = groups || [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[Media] Lỗi khi tải nhóm xe:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: getHttpErrorMessage(err, 'Không thể tải danh sách nhóm xe. Vui lòng thử lại.'),
        });
        this.cdr.markForCheck();
      },
    });
  }
  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Thay đổi layout hiển thị ảnh
   */
  changeLayout(cols: 4 | 5 | 6): void {
    this.layoutChange.emit(cols);
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 05/06/2026
   * Bộ lọc tùy chỉnh cho TreeSelect nhóm phương tiện.
   */
  onCustomFilter(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!query) {
      this.vehicleGroups = this.originalVehicleGroups;
    } else {
      this.vehicleGroups = this.filterTreeNodes(this.originalVehicleGroups, query);
    }
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 05/06/2026
   * Lọc node tree. Nếu group cha khớp thì giữ lại toàn bộ con của nó.
   */
  private filterTreeNodes(nodes: TreeNode[], query: string): TreeNode[] {
    const filtered: TreeNode[] = [];
    for (const node of nodes) {
      const matches = node.label?.toLowerCase().includes(query);
      let filteredChildren: TreeNode[] = [];
      if (node.children && node.children.length > 0) {
        filteredChildren = this.filterTreeNodes(node.children, query);
      }
      if (matches || filteredChildren.length > 0) {
        const clonedNode = { ...node };
        if (node.children && node.children.length > 0) {
          clonedNode.children = matches ? node.children : filteredChildren;
          clonedNode.expanded = true;
        }
        filtered.push(clonedNode);
      }
    }
    return filtered;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Reset kết quả tìm kiếm khi đóng dropdown TreeSelect
   */
  onTreeSelectHide(): void {
    this.groupSearchQuery = '';
    this.vehicleGroups = this.originalVehicleGroups;
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Reset kết quả tìm kiếm khi mở dropdown TreeSelect
   */
  onTreeSelectShow(): void {
    this.groupSearchQuery = '';
    this.vehicleGroups = this.originalVehicleGroups;
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Xóa từ khóa tìm kiếm và khôi phục danh sách nhóm
   */
  clearSearchQuery(): void {
    this.groupSearchQuery = '';
    this.vehicleGroups = this.originalVehicleGroups;
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Xử lý khi giá trị TreeSelect thay đổi
   */
  onGroupsChange(): void {
    this.loadVehiclesByGroups();
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
   * Ngày tạo: 05/06/2026
   * Trả về tất cả các node lá.
   */
  private getAllLeafNodes(nodes: TreeNode[]): TreeNode[] {
    let leaves: TreeNode[] = [];
    for (const node of nodes) {
      if (!node.children || node.children.length === 0) {
        leaves.push(node);
      } else {
        leaves.push(...this.getAllLeafNodes(node.children));
      }
    }
    return leaves;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 05/06/2026
   * Trả về tất cả các node bao gồm cả node cha.
   */
  private getAllNodes(nodes: TreeNode[]): TreeNode[] {
    let all: TreeNode[] = [];
    for (const node of nodes) {
      all.push(node);
      if (node.children && node.children.length > 0) {
        all.push(...this.getAllNodes(node.children));
      }
    }
    return all;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 05/06/2026
   * Kiểm tra xem tất cả các nhóm phương tiện đã được chọn hay chưa.
   */
  isAllSelected(): boolean {
    if (!this.vehicleGroups || this.vehicleGroups.length === 0) return false;
    const allLeaves = this.getAllLeafNodes(this.vehicleGroups);
    if (allLeaves.length === 0) return false;
    const selected = this.selectedGroups || [];
    const selectedLeaves = selected.filter(n => !n.children || n.children.length === 0);
    return allLeaves.length === selectedLeaves.length;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 05/06/2026
   * Chọn tất cả hoặc bỏ chọn tất cả các nhóm phương tiện.
   */
  toggleSelectAll(event: boolean | { checked?: boolean } | Event | null | undefined): void {
    let checked = false;
    if (typeof event === 'boolean') {
      checked = event;
    } else if (event && typeof event === 'object') {
      if ('checked' in event && event.checked !== undefined) {
        checked = event.checked;
      } else if ('target' in event && event.target) {
        checked = (event.target as HTMLInputElement).checked;
      }
    }
    if (checked) {
      this.selectedGroups = this.getAllNodes(this.vehicleGroups);
    } else {
      this.selectedGroups = [];
    }
    this.loadVehiclesByGroups();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 05/06/2026
   * Chọn tất cả hoặc bỏ chọn tất cả các kênh.
   */
  toggleAllChannels(): void {
    if (this.isAllChannelsSelected()) {
      this.selectedChannels = [];
    } else {
      this.selectedChannels = this.channelOptions.map(c => c.value);
    }
    this.cdr.markForCheck();
  }

  // Kiểm tra xem tất cả các kênh đã được chọn hay chưa.
  isAllChannelsSelected(): boolean {
    return this.channelOptions.length > 0 && this.selectedChannels.length === this.channelOptions.length;
  }

  //Đếm số lượng node lá (nhóm phương tiện con).
  getLeafNodesCount(): number {
    return this.getAllLeafNodes(this.vehicleGroups).length;
  }

  // Trạng thái expand/collapse toàn bộ tree nodes
  isAllExpanded = false;

  // Mở rộng / Thu gọn toàn bộ các node trong TreeSelect.
  toggleExpandAll(): void {
    this.isAllExpanded = !this.isAllExpanded;
    this.expandAllRecursive(this.vehicleGroups, this.isAllExpanded);
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 10/06/2026
   * Dùng để mở rộng / thu gọn tất cả các node trong TreeSelect.
   */
  private expandAllRecursive(nodes: TreeNode[], isExpand: boolean): void {
    for (const node of nodes) {
      node.expanded = isExpand;
      if (node.children && node.children.length > 0) {
        this.expandAllRecursive(node.children, isExpand);
      }
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 10/06/2026
   * Dùng để tải danh sách xe theo nhóm.
   */
  private loadVehiclesByGroups(): void {
    // Lấy key của các node lá đang được chọn
    const selected = this.selectedGroups || [];
    const groupIds = selected
      .filter((n) => !n.children || n.children.length === 0)
      .map((n) => n.key as string);

    if (groupIds.length === 0) {
      this.vehicleList = [];
      this.selectedVehicle = null;
      this.channelOptions = [];
      this.selectedChannels = [];
      this.vehicleLoading = false;
      this.searchSubmit.emit(null);
      this.cdr.markForCheck();
      return;
    }

    this.vehicleLoading = true;
    this.selectedVehicle = null;
    this.channelOptions = [];
    this.selectedChannels = [];
    this.cdr.markForCheck();

    this.mediaService.getVehiclesByGroups(groupIds).subscribe({
      next: (vehicles) => {
        this.vehicleList = vehicles;
        this.vehicleLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[Media] Lỗi khi tải danh sách xe:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: getHttpErrorMessage(err, 'Không thể tải danh sách xe. Vui lòng thử lại.'),
        });
        this.vehicleLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * Khi chọn xe → khởi tạo danh sách kênh (Kênh 1->4).
   */
  onVehicleChange(): void {
    if (this.selectedVehicle) {
      // Khởi tạo danh sách kênh khi có xe được chọn
      this.channelOptions = [1, 2, 3, 4].map((i) => ({
        value: i,
        label: `Kênh ${i}`,
      }));
    } else {
      this.channelOptions = [];
      this.selectedChannels = [];
      this.searchSubmit.emit(null);
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
   * Validate: phải chọn xe trước khi tìm kiếm, thời gian hợp lệ.
   */
  onSearch(): void {
    if (!this.selectedVehicle) return this.showError('Vui lòng chọn xe');
    if (!this.selectedDate) return this.showError('Vui lòng chọn ngày');

    const date = new Date(this.selectedDate);
    if (isNaN(date.getTime())) return this.showError('Ngày chọn không đúng định dạng hoặc không hợp lệ');
    if (date > this.today) return this.showError('Ngày chọn không được vượt quá ngày hiện tại');

    if (!this.startTime) return this.showError('Vui lòng chọn giờ bắt đầu');
    if (isNaN(new Date(this.startTime).getTime())) return this.showError('Giờ bắt đầu không đúng định dạng hoặc không hợp lệ');

    if (!this.endTime) return this.showError('Vui lòng chọn giờ kết thúc');
    if (isNaN(new Date(this.endTime).getTime())) return this.showError('Giờ kết thúc không đúng định dạng hoặc không hợp lệ');

    // Ghép ngày và giờ thành datetime Date objects
    const start = new Date(date);
    start.setHours(this.startTime.getHours(), this.startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(this.endTime.getHours(), this.endTime.getMinutes(), 59, 0);

    // So sánh thời gian
    if (start > end) return this.showError('Giờ bắt đầu không được lớn hơn giờ kết thúc');
    if (start > new Date()) return this.showError('Giờ bắt đầu không được lớn hơn thời gian hiện tại');
    if (end > new Date()) return this.showError('Giờ kết thúc không được lớn hơn thời gian hiện tại');

    const params: MediaSearchParams = {
      vehiclePlate: this.selectedVehicle.vehiclePlate,
      customerId: this.selectedVehicle.XNCode,
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

  /**
   * Người tạo: DungBT
   * Ngày tạo: 04/06/2026
   * @param detail Text thông báo lỗi
   */
  private showError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail,
    });
  }
}
