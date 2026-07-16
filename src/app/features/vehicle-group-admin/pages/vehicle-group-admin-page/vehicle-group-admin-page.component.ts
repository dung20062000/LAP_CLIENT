// prettier-ignore
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TreeModule } from 'primeng/tree';
import { TreeNode, MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { VehicleGroupAdminService } from '../../../../services/vehicle-group-admin';
import { UserDto, VehicleGroupNode } from '../../../../models/vehicle-group-admin';

/**
 * Mô tả: Trang quản trị gán nhóm xe cho người dùng.
 *        Layout 3 cột: Danh sách User | Nhóm chưa gán | Nhóm đã gán
 *        - Cột 1: Bootstrap List Group + search client-side.
 *        - Cột 2 & 3: PrimeNG Tree với checkbox, search, nút điều hướng giữa 2 cột.
 *        - Nút Lưu/Hủy sticky bottom; enable khi có thay đổi.
 *        - ChangeDetectionStrategy.OnPush để tối ưu hiệu suất.
 * Người tạo: DungBT
 * Ngày tạo: 11/06/2026
 */
@Component({
  selector: 'app-vehicle-group-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeModule, ButtonModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService],
  templateUrl: './vehicle-group-admin-page.component.html',
  styleUrl: './vehicle-group-admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleGroupAdminPageComponent implements OnInit {
  private service = inject(VehicleGroupAdminService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  /** Danh sách user gốc từ API */
  allUsers: UserDto[] = [];
  /** Danh sách user sau khi lọc client-side */
  filteredUsers: UserDto[] = [];
  /** User đang được chọn */
  selectedUser: UserDto | null = null;
  /** Từ khoá tìm kiếm user */
  userSearchQuery = '';
  /** Đang tải danh sách user */
  usersLoading = false;

  /** Nodes hiển thị trong cây nhóm chưa gán */
  unassignedNodes: TreeNode[] = [];
  /** Nodes gốc không lọc (để restore sau khi xoá filter) */
  originalUnassignedNodes: TreeNode[] = [];
  /** Các nodes đang được check ở cột 2 */
  selectedUnassigned: TreeNode[] = [];
  /** Từ khoá filter cây cột 2 */
  unassignedSearchQuery = '';
  /** Đang tải nhóm chưa gán */
  unassignedLoading = false;
  /** Tổng số nhóm chưa gán (flat count) */
  unassignedCount = 0;

  /** Nodes hiển thị trong cây nhóm đã gán */
  assignedNodes: TreeNode[] = [];
  /** Nodes gốc không lọc */
  originalAssignedNodes: TreeNode[] = [];
  /** Các nodes đang được check ở cột 3 */
  selectedAssigned: TreeNode[] = [];
  /** Từ khoá filter cây cột 3 */
  assignedSearchQuery = '';
  /** Đang tải nhóm đã gán */
  assignedLoading = false;
  /** Tổng số nhóm đã gán */
  assignedCount = 0;

  /** Trạng thái checkbox "Tất cả" của cột 2 */
  isAllUnassignedSelected = false;
  /** Trạng thái không xác định của cột 2 */
  isUnassignedIndeterminate = false;

  /** Trạng thái checkbox "Tất cả" của cột 3 */
  isAllAssignedSelected = false;
  /** Trạng thái không xác định của cột 3 */
  isAssignedIndeterminate = false;

  /** Tập hợp các key ban đầu thuộc cây đã gán */
  initialAssignedKeys = new Set<string>();
  /** Tập hợp các key ban đầu thuộc cây chưa gán */
  initialUnassignedKeys = new Set<string>();
  /** Có thay đổi so với trạng thái ban đầu hay không */
  isDirty = false;
  /** Đang lưu */
  isSaving = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Tải danh sách user từ API.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private loadUsers(): void {
    this.usersLoading = true;
    this.cdr.markForCheck();

    this.service
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.allUsers = users;
          this.filteredUsers = users;
          this.usersLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Lọc danh sách user client-side theo username hoặc fullname.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  onUserSearch(): void {
    const q = this.userSearchQuery.toLowerCase().trim();
    this.filteredUsers = q
      ? this.allUsers.filter(
          (u) => u.username.toLowerCase().includes(q) || u.fullname.toLowerCase().includes(q),
        )
      : this.allUsers;
    this.cdr.markForCheck();
  }

  /**
   * Click vào user → load dữ liệu 2 cây.
   * @param user User được click
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  onSelectUser(user: UserDto): void {
    if (this.selectedUser?.userId === user.userId) return;
    this.selectedUser = user;
    this.resetTreeState();
    this.loadGroupsForUser(user.userId);
  }

  /**
   * Tải đồng thời nhóm chưa gán và đã gán cho user.
   * Dùng NgZone.run() để đảm bảo Angular change detection (OnPush) được kích hoạt
   * ngay lập tức sau khi API trả về bất đồng bộ, tránh phải click 2 lần.
   * @param userId ID người dùng đã chọn
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private loadGroupsForUser(userId: string): void {
    this.unassignedLoading = true;
    this.assignedLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      unassigned: this.service.getUnassignedGroups(userId),
      assigned: this.service.getAssignedGroups(userId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ unassigned, assigned }) => {
          this.zone.run(() => {
            const unassignedTreeNodes = this.toTreeNodes(unassigned, false);
            this.originalUnassignedNodes = unassignedTreeNodes;
            this.unassignedNodes = unassignedTreeNodes;
            this.unassignedCount = this.countTreeNodes(unassignedTreeNodes);
            this.initialUnassignedKeys.clear();
            this.collectKeys(unassignedTreeNodes, this.initialUnassignedKeys);

            const assignedTreeNodes = this.toTreeNodes(assigned, false);
            this.originalAssignedNodes = assignedTreeNodes;
            this.assignedNodes = assignedTreeNodes;
            this.assignedCount = this.countTreeNodes(assignedTreeNodes);
            this.initialAssignedKeys.clear();
            this.collectKeys(assignedTreeNodes, this.initialAssignedKeys);

            this.unassignedLoading = false;
            this.assignedLoading = false;
            this.checkDirtyState();
            this.cdr.markForCheck();
          });
        },
      });
  }

  /**
   * Chuyển đổi VehicleGroupNode[] của BE sang PrimeNG TreeNode[].
   * @param nodes Danh sách node từ API
   * @param dirty Có đánh dấu isDirty hay không
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private toTreeNodes(nodes: VehicleGroupNode[], dirty: boolean): TreeNode[] {
    return nodes.map((n) => ({
      key: n.key,
      label: n.label,
      data: n.data,
      leaf: n.leaf,
      expanded: false,
      styleClass: dirty ? 'node-dirty' : undefined,
      children: n.children?.length ? this.toTreeNodes(n.children, dirty) : [],
    }));
  }

  /**
   * Nút > : Move các node đã check ở cột 2 sang cột 3:
   * 1. Thu thập tất cả key của selection (bao gồm cả con).
   * 2. Xây lại cây unassigned: loại bỏ các node đã chọn; nếu node cha bị loại hết con thì cha cũng bị loại.
   * 3. Merge các node được chọn vào cây assigned, giữ nguyên cấu trúc cha/con.
   * 4. Đánh dấu isDirty cho các node mới thêm vào assigned.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  moveToAssigned(): void {
    if (!this.selectedUnassigned.length) return;

    // Keys của tất cả node đang checked ở cột 2
    const selectedKeys = new Set(this.selectedUnassigned.map((n) => n.key as string));

    // Lấy full node data (bao gồm cả partial-checked cha) từ cây gốc
    const nodesToMove = this.extractSelectedNodes(this.originalUnassignedNodes, selectedKeys);

    // Xoá khỏi unassigned (loại bỏ các node đã chuyển)
    this.originalUnassignedNodes = this.removeNodes(this.originalUnassignedNodes, selectedKeys);

    // Merge vào assigned
    this.originalAssignedNodes = this.mergeNodes(
      this.originalAssignedNodes,
      this.cloneNodes(nodesToMove),
    );

    // Cập nhật style
    this.originalUnassignedNodes = this.updateNodeStyles(this.originalUnassignedNodes, false);
    this.originalAssignedNodes = this.updateNodeStyles(this.originalAssignedNodes, true);

    // Áp lại filter nếu đang có query
    this.applyUnassignedFilter();
    this.applyAssignedFilter();

    this.unassignedCount = this.countTreeNodes(this.originalUnassignedNodes);
    this.assignedCount = this.countTreeNodes(this.originalAssignedNodes);

    // Reset selection
    this.selectedUnassigned = [];
    this.updateSelectAllStateUnassigned();
    this.updateSelectAllStateAssigned();
    this.checkDirtyState();
    this.cdr.markForCheck();
  }

  /**
   * Nút < : Move các node đã check ở cột 3 về cột 2.
   * Xoá isDirty khi move ngược lại.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  moveToUnassigned(): void {
    if (!this.selectedAssigned.length) return;

    const selectedKeys = new Set(this.selectedAssigned.map((n) => n.key as string));

    const nodesToMove = this.extractSelectedNodes(this.originalAssignedNodes, selectedKeys);

    // Xoá khỏi assigned
    this.originalAssignedNodes = this.removeNodes(this.originalAssignedNodes, selectedKeys);

    // Merge vào unassigned
    this.originalUnassignedNodes = this.mergeNodes(
      this.originalUnassignedNodes,
      this.cloneNodes(nodesToMove),
    );

    // Cập nhật style
    this.originalUnassignedNodes = this.updateNodeStyles(this.originalUnassignedNodes, false);
    this.originalAssignedNodes = this.updateNodeStyles(this.originalAssignedNodes, true);

    this.applyUnassignedFilter();
    this.applyAssignedFilter();

    this.unassignedCount = this.countTreeNodes(this.originalUnassignedNodes);
    this.assignedCount = this.countTreeNodes(this.originalAssignedNodes);

    this.selectedAssigned = [];
    this.updateSelectAllStateUnassigned();
    this.updateSelectAllStateAssigned();
    this.checkDirtyState();
    this.cdr.markForCheck();
  }

  /**
   * Lọc cây nhóm chưa gán theo keyword.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  onUnassignedSearch(): void {
    this.applyUnassignedFilter();
    this.cdr.markForCheck();
  }

  /**
   * Lọc cây nhóm đã gán theo keyword.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  onAssignedSearch(): void {
    this.applyAssignedFilter();
    this.cdr.markForCheck();
  }

  /**
   * Áp dụng filter cho cây nhóm chưa gán.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private applyUnassignedFilter(): void {
    const q = this.unassignedSearchQuery.toLowerCase().trim();
    this.unassignedNodes = q
      ? this.filterTree(this.originalUnassignedNodes, q)
      : this.originalUnassignedNodes;
  }

  /**
   * Áp dụng filter cho cây nhóm đã gán.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private applyAssignedFilter(): void {
    const q = this.assignedSearchQuery.toLowerCase().trim();
    this.assignedNodes = q
      ? this.filterTree(this.originalAssignedNodes, q)
      : this.originalAssignedNodes;
  }

  /**
   * Lọc cây đệ quy: Giữ node nếu label khớp HOẶC có ít nhất 1 con khớp.
   * Nếu node cha khớp thì giữ nguyên tất cả con.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private filterTree(nodes: TreeNode[], query: string): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      const matches = node.label?.toLowerCase().includes(query) ?? false;
      const filteredChildren = this.filterTree(node.children ?? [], query);
      if (matches || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: matches ? (node.children ?? []) : filteredChildren,
          expanded: true,
        });
      }
    }
    return result;
  }

  /**
   * Nút Lưu: thu thập tất cả leaf node ID trong cây assigned → gọi API.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  onSave(): void {
    if (!this.selectedUser || !this.isDirty) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại.',
      });
      return;
    }

    // Lấy TẤT CẢ group IDs (không chỉ leaf) trong assigned tree
    const groupIds = this.collectAllGroupIds(this.originalAssignedNodes);

    this.isSaving = true;
    this.cdr.markForCheck();

    this.service
      .assignGroups(this.selectedUser.userId, { groupIds })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.isDirty = false;

          // Cập nhật lại key ban đầu sau khi lưu thành công
          this.initialAssignedKeys.clear();
          this.collectKeys(this.originalAssignedNodes, this.initialAssignedKeys);
          this.initialUnassignedKeys.clear();
          this.collectKeys(this.originalUnassignedNodes, this.initialUnassignedKeys);

          // Cập nhật lại style của các node
          this.originalUnassignedNodes = this.updateNodeStyles(this.originalUnassignedNodes, false);
          this.originalAssignedNodes = this.updateNodeStyles(this.originalAssignedNodes, true);

          this.applyUnassignedFilter();
          this.applyAssignedFilter();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Gán nhóm xe thành công.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Nút Hủy: Hỏi xác nhận bằng p-confirmDialog, sau đó reset về trạng thái ban đầu.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  onCancel(): void {
    if (!this.isDirty) return;

    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn hủy các thay đổi chưa lưu?',
      header: 'Xác nhận hủy',
      acceptLabel: 'Xác nhận',
      rejectLabel: 'Đóng',
      acceptIcon: 'fas fa-check',
      rejectIcon: 'fas fa-times',
      accept: () => {
        if (this.selectedUser) {
          this.resetTreeState();
          this.loadGroupsForUser(this.selectedUser.userId);
        }
      },
    });
  }

  /**
   * Toggle chọn tất cả / bỏ chọn tất cả cột 2 (unassigned).
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  toggleSelectAllUnassigned(): void {
    if (this.isAllUnassignedSelected) {
      // Đang chọn tất cả → bỏ chọn hết
      this.selectedUnassigned = [];
    } else {
      // Chưa chọn tất cả → chọn hết (cả node đang hiển thị và các node ẩn bởi propagation)
      this.selectedUnassigned = this.collectAllTreeNodes(this.unassignedNodes);
    }
    this.updateSelectAllStateUnassigned();
    this.cdr.markForCheck();
  }

  /**
   * Toggle chọn tất cả / bỏ chọn tất cả cột 3 (assigned).
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  toggleSelectAllAssigned(): void {
    if (this.isAllAssignedSelected) {
      this.selectedAssigned = [];
    } else {
      this.selectedAssigned = this.collectAllTreeNodes(this.assignedNodes);
    }
    this.updateSelectAllStateAssigned();
    this.cdr.markForCheck();
  }

  /**
   * Gọi khi selection của cột 2 thay đổi (từ p-tree event).
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  onUnassignedSelectionChange(): void {
    this.updateSelectAllStateUnassigned();
  }

  /**
   * Gọi khi selection của cột 3 thay đổi (từ p-tree event).
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  onAssignedSelectionChange(): void {
    this.updateSelectAllStateAssigned();
  }

  /**
   * Cập nhật isAllUnassignedSelected và isUnassignedIndeterminate để check state của toggle select all của cột 2
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  private updateSelectAllStateUnassigned(): void {
    const allNodes = this.collectAllTreeNodes(this.unassignedNodes);
    if (!allNodes.length) {
      this.isAllUnassignedSelected = false;
      this.isUnassignedIndeterminate = false;
    } else {
      const selectedKeys = new Set(this.selectedUnassigned.map((n) => n.key as string));
      const checkedCount = allNodes.filter((n) => selectedKeys.has(n.key as string)).length;
      this.isAllUnassignedSelected = checkedCount === allNodes.length;
      this.isUnassignedIndeterminate = checkedCount > 0 && checkedCount < allNodes.length;
    }
    this.cdr.markForCheck();
  }

  /**
   * Cập nhật isAllAssignedSelected và isAssignedIndeterminate để check state của toggle select all của cột 3
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  private updateSelectAllStateAssigned(): void {
    const allNodes = this.collectAllTreeNodes(this.assignedNodes);
    if (!allNodes.length) {
      this.isAllAssignedSelected = false;
      this.isAssignedIndeterminate = false;
    } else {
      const selectedKeys = new Set(this.selectedAssigned.map((n) => n.key as string));
      const checkedCount = allNodes.filter((n) => selectedKeys.has(n.key as string)).length;
      this.isAllAssignedSelected = checkedCount === allNodes.length;
      this.isAssignedIndeterminate = checkedCount > 0 && checkedCount < allNodes.length;
    }
    this.cdr.markForCheck();
  }

  /**
   * Thu thập tất cả TreeNode (cả cha lấn con) từ cây để dùng cho select-all.
   * Người tạo: DungBT
   * Ngày tạo: 15/06/2026
   */
  private collectAllTreeNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const n of nodes) {
      result.push(n);
      if (n.children?.length) {
        result.push(...this.collectAllTreeNodes(n.children));
      }
    }
    return result;
  }

  /**
   * Reset toàn bộ state của 2 cây khi chọn user mới hoặc hủy thay đổi.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private resetTreeState(): void {
    this.unassignedNodes = [];
    this.originalUnassignedNodes = [];
    this.selectedUnassigned = [];
    this.unassignedSearchQuery = '';
    this.unassignedCount = 0;

    this.assignedNodes = [];
    this.originalAssignedNodes = [];
    this.selectedAssigned = [];
    this.assignedSearchQuery = '';
    this.assignedCount = 0;

    this.initialAssignedKeys.clear();
    this.initialUnassignedKeys.clear();
    this.isDirty = false;

    // Reset trạng thái select-all
    this.isAllUnassignedSelected = false;
    this.isUnassignedIndeterminate = false;
    this.isAllAssignedSelected = false;
    this.isAssignedIndeterminate = false;
  }

  /**
   * Đếm tổng số TreeNode trong cây (dùng sau khi đã convert).
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private countTreeNodes(nodes: TreeNode[]): number {
    let count = 0;
    for (const n of nodes) {
      count++;
      if (n.children?.length) count += this.countTreeNodes(n.children);
    }
    return count;
  }

  /**
   * Thu thập data (groupId: number) của tất cả node trong cây assigned.
   * Gửi tất cả ID (cả cha lẫn con) lên API để BE xử lý.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private collectAllGroupIds(nodes: TreeNode[]): number[] {
    const ids: number[] = [];
    for (const n of nodes) {
      if (n.data !== undefined && n.data !== null) {
        ids.push(n.data as number);
      }
      if (n.children?.length) {
        ids.push(...this.collectAllGroupIds(n.children));
      }
    }
    return ids;
  }

  /**
   * Trích xuất các node hoàn chỉnh từ cây dựa vào selectedKeys.
   * Chỉ lấy node cấp cao nhất được chọn (không lấy trùng cha-con).
   * Nếu cha được chọn thì tất cả con cũng sẽ theo.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private extractSelectedNodes(nodes: TreeNode[], selectedKeys: Set<string>): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (selectedKeys.has(node.key as string)) {
        // Node này được chọn → lấy toàn bộ subtree
        result.push(node);
      } else {
        // Node này không được chọn nhưng có thể có con được chọn
        const selectedChildren = this.extractSelectedNodes(node.children ?? [], selectedKeys);
        if (selectedChildren.length > 0) {
          // Tạo node cha wrapper chứa chỉ các con được chọn
          result.push({ ...node, children: selectedChildren });
        }
      }
    }
    return result;
  }

  /**
   * Xoá các node có key trong removedKeys khỏi cây.
   * Nếu node cha hết con sau khi xoá thì node cha cũng bị xoá.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private removeNodes(nodes: TreeNode[], removedKeys: Set<string>): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (removedKeys.has(node.key as string)) continue; // Bỏ qua node này
      const filteredChildren = this.removeNodes(node.children ?? [], removedKeys);

      // Nếu node cha trước đó có con nhưng sau khi xoá bị hết con -> bỏ qua node cha
      if (node.children?.length && filteredChildren.length === 0) continue;

      result.push({ ...node, children: filteredChildren });
    }
    return result;
  }

  /**
   * Merge các node mới vào cây hiện tại, giữ nguyên cấu trúc phân cấp.
   * Nếu node cha đã tồn tại (cùng key) thì merge children vào.
   * Nếu chưa tồn tại thì thêm mới vào cuối.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private mergeNodes(existing: TreeNode[], incoming: TreeNode[]): TreeNode[] {
    const result = [...existing];
    for (const newNode of incoming) {
      const idx = result.findIndex((n) => n.key === newNode.key);
      if (idx >= 0) {
        // Cha đã tồn tại → merge children
        const mergedChildren = this.mergeNodes(result[idx].children ?? [], newNode.children ?? []);
        result[idx] = { ...result[idx], children: mergedChildren };
      } else {
        result.push(newNode);
      }
    }
    return result;
  }

  /**
   * Clone cây TreeNode.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private cloneNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((n) => ({
      ...n,
      children: n.children?.length ? this.cloneNodes(n.children) : [],
    }));
  }

  /**
   * Thu thập tất cả key của node và con vào Set.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private collectKeys(nodes: TreeNode[], set: Set<string>): void {
    for (const n of nodes) {
      if (n.key) {
        set.add(n.key);
      }
      if (n.children?.length) {
        this.collectKeys(n.children, set);
      }
    }
  }

  /**
   * Cập nhật styleClass 'node-dirty' cho các node dựa vào trạng thái ban đầu.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private updateNodeStyles(nodes: TreeNode[], isAssignedTree: boolean): TreeNode[] {
    return nodes.map((node) => {
      const isDirtyNode = isAssignedTree
        ? this.initialUnassignedKeys.has(node.key as string) &&
          !this.initialAssignedKeys.has(node.key as string)
        : this.initialAssignedKeys.has(node.key as string) &&
          !this.initialUnassignedKeys.has(node.key as string);

      return {
        ...node,
        styleClass: isDirtyNode ? 'node-dirty' : undefined,
        children: node.children?.length ? this.updateNodeStyles(node.children, isAssignedTree) : [],
      };
    });
  }

  /**
   * Kiểm tra xem có thay đổi nào so với dữ liệu ban đầu hay không.
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private checkDirtyState(): void {
    const checkUnassigned = (nodes: TreeNode[]): boolean => {
      for (const n of nodes) {
        if (
          this.initialAssignedKeys.has(n.key as string) &&
          !this.initialUnassignedKeys.has(n.key as string)
        )
          return true;
        if (n.children?.length && checkUnassigned(n.children)) return true;
      }
      return false;
    };

    const checkAssigned = (nodes: TreeNode[]): boolean => {
      for (const n of nodes) {
        if (
          this.initialUnassignedKeys.has(n.key as string) &&
          !this.initialAssignedKeys.has(n.key as string)
        )
          return true;
        if (n.children?.length && checkAssigned(n.children)) return true;
      }
      return false;
    };

    this.isDirty =
      checkUnassigned(this.originalUnassignedNodes) || checkAssigned(this.originalAssignedNodes);
  }

  /**
   * Helper: hiển thị toast lỗi
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   */
  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail });
  }
}
