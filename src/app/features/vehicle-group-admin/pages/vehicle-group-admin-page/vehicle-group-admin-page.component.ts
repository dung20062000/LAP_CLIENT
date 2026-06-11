/**
 * Người tạo: DungBT
 * Ngày tạo: 11/06/2026
 * Mô tả: Trang quản trị gán nhóm xe cho người dùng.
 *        Layout 3 cột: Danh sách User | Nhóm chưa gán | Nhóm đã gán
 *        - Cột 1: Bootstrap List Group + search client-side.
 *        - Cột 2 & 3: PrimeNG Tree với checkbox, search, nút điều hướng giữa 2 cột.
 *        - Nút Lưu/Hủy sticky bottom; enable khi có thay đổi.
 *        - ChangeDetectionStrategy.OnPush để tối ưu hiệu suất.
 */
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TreeModule } from 'primeng/tree';
import { TreeNode, MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { getHttpErrorMessage } from '../../../../shared/utils/http-error';
import { VehicleGroupAdminService } from '../../../../services/vehicle-group-admin';
import { UserDto, VehicleGroupNode } from '../../../../models/vehicle-group-admin';

/**
 * Người tạo: DungBT
 * Ngày tạo: 11/06/2026
 * Page component chính quản lý toàn bộ state và điều phối 3 cột.
 */
@Component({
  selector: 'app-vehicle-group-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './vehicle-group-admin-page.component.html',
  styleUrl: './vehicle-group-admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleGroupAdminPageComponent implements OnInit {
  private service = inject(VehicleGroupAdminService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ─── State: Cột 1 ─────────────────────────────────────────────────────────

  // Danh sách user gốc từ API
  allUsers: UserDto[] = [];
  // Danh sách user sau khi lọc client-side
  filteredUsers: UserDto[] = [];
  // User đang được chọn
  selectedUser: UserDto | null = null;
  // Từ khoá tìm kiếm user
  userSearchQuery = '';
  // Đang tải danh sách user
  usersLoading = false;

  // ─── State: Cột 2 (Nhóm chưa gán) ────────────────────────────────────────

  // Nodes hiển thị trong cây nhóm chưa gán
  unassignedNodes: TreeNode[] = [];
  // Nodes gốc không lọc (để restore sau khi xoá filter)
  originalUnassignedNodes: TreeNode[] = [];
  // Các nodes đang được check ở cột 2
  selectedUnassigned: TreeNode[] = [];
  // Từ khoá filter cây cột 2
  unassignedSearchQuery = '';
  // Đang tải nhóm chưa gán
  unassignedLoading = false;
  // Tổng số nhóm chưa gán (flat count)
  unassignedCount = 0;

  // ─── State: Cột 3 (Nhóm đã gán) ─────────────────────────────────────────

  // Nodes hiển thị trong cây nhóm đã gán
  assignedNodes: TreeNode[] = [];
  // Nodes gốc không lọc
  originalAssignedNodes: TreeNode[] = [];
  // Các nodes đang được check ở cột 3
  selectedAssigned: TreeNode[] = [];
  // Từ khoá filter cây cột 3
  assignedSearchQuery = '';
  // Đang tải nhóm đã gán
  assignedLoading = false;
  // Tổng số nhóm đã gán
  assignedCount = 0;

  // ─── State: Dirty tracking ────────────────────────────────────────────────

  // Tập hợp các key ban đầu thuộc cây đã gán
  initialAssignedKeys = new Set<string>();
  // Tập hợp các key ban đầu thuộc cây chưa gán
  initialUnassignedKeys = new Set<string>();
  // Có thay đổi so với trạng thái ban đầu hay không
  isDirty = false;
  // Đang lưu
  isSaving = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  // ─── CỘT 1: Danh sách User ────────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Tải danh sách user từ API.
   */
  private loadUsers(): void {
    this.usersLoading = true;
    this.cdr.markForCheck();

    this.service.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.allUsers = users;
          this.filteredUsers = users;
          this.usersLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[VehicleGroupAdmin] Lỗi tải user:', err);
          this.usersLoading = false;
          this.showError(getHttpErrorMessage(err, 'Không thể tải danh sách người dùng.'));
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Lọc danh sách user client-side theo username hoặc fullname.
   */
  onUserSearch(): void {
    const q = this.userSearchQuery.toLowerCase().trim();
    this.filteredUsers = q
      ? this.allUsers.filter(
          (u) =>
            u.username.toLowerCase().includes(q) ||
            u.fullname.toLowerCase().includes(q)
        )
      : this.allUsers;
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Click vào user → load dữ liệu 2 cây.
   * @param user User được click
   */
  onSelectUser(user: UserDto): void {
    if (this.selectedUser?.userId === user.userId) return;
    this.selectedUser = user;
    this.resetTreeState();
    this.loadGroupsForUser(user.userId);
  }

  // ─── CỘT 2 & 3: Cây nhóm xe ──────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Tải đồng thời nhóm chưa gán và đã gán cho user.
   * @param userId ID người dùng đã chọn
   */
  private loadGroupsForUser(userId: string): void {
    this.unassignedLoading = true;
    this.assignedLoading = true;
    this.cdr.markForCheck();

    // Load nhóm chưa gán
    this.service.getUnassignedGroups(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nodes) => {
          const treeNodes = this.toTreeNodes(nodes, false);
          this.originalUnassignedNodes = treeNodes;
          this.unassignedNodes = treeNodes;
          this.unassignedCount = this.countAllNodes(nodes);

          this.initialUnassignedKeys.clear();
          this.collectKeys(treeNodes, this.initialUnassignedKeys);

          this.unassignedLoading = false;
          this.checkDirtyState();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.unassignedLoading = false;
          this.showError(getHttpErrorMessage(err, 'Không thể tải nhóm chưa gán.'));
          this.cdr.markForCheck();
        },
      });

    // Load nhóm đã gán
    this.service.getAssignedGroups(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nodes) => {
          const treeNodes = this.toTreeNodes(nodes, false);
          this.originalAssignedNodes = treeNodes;
          this.assignedNodes = treeNodes;
          this.assignedCount = this.countAllNodes(nodes);

          this.initialAssignedKeys.clear();
          this.collectKeys(treeNodes, this.initialAssignedKeys);

          this.assignedLoading = false;
          this.checkDirtyState();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.assignedLoading = false;
          this.showError(getHttpErrorMessage(err, 'Không thể tải nhóm đã gán.'));
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Chuyển đổi VehicleGroupNode[] của BE sang PrimeNG TreeNode[].
   * @param nodes Danh sách node từ API
   * @param dirty Có đánh dấu isDirty hay không
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

  // ─── Nút điều hướng: Move giữa 2 cây ─────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Nút > : Move các node đã check ở cột 2 sang cột 3.
   * Thuật toán:
   * 1. Thu thập tất cả key của selection (bao gồm cả con).
   * 2. Xây lại cây unassigned: loại bỏ các node đã chọn; nếu node cha bị loại hết con thì cha cũng bị loại.
   * 3. Merge các node được chọn vào cây assigned, giữ nguyên cấu trúc cha/con.
   * 4. Đánh dấu isDirty cho các node mới thêm vào assigned.
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
    this.originalAssignedNodes = this.mergeNodes(this.originalAssignedNodes, this.cloneNodes(nodesToMove));

    // Cập nhật style
    this.updateNodeStyles(this.originalUnassignedNodes, false);
    this.updateNodeStyles(this.originalAssignedNodes, true);

    // Áp lại filter nếu đang có query
    this.applyUnassignedFilter();
    this.applyAssignedFilter();

    this.unassignedCount = this.countTreeNodes(this.originalUnassignedNodes);
    this.assignedCount = this.countTreeNodes(this.originalAssignedNodes);

    // Reset selection
    this.selectedUnassigned = [];
    this.checkDirtyState();
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Nút < : Move các node đã check ở cột 3 về cột 2.
   * Xoá isDirty khi move ngược lại.
   */
  moveToUnassigned(): void {
    if (!this.selectedAssigned.length) return;

    const selectedKeys = new Set(this.selectedAssigned.map((n) => n.key as string));

    const nodesToMove = this.extractSelectedNodes(this.originalAssignedNodes, selectedKeys);

    // Xoá khỏi assigned
    this.originalAssignedNodes = this.removeNodes(this.originalAssignedNodes, selectedKeys);

    // Merge vào unassigned
    this.originalUnassignedNodes = this.mergeNodes(this.originalUnassignedNodes, this.cloneNodes(nodesToMove));

    // Cập nhật style
    this.updateNodeStyles(this.originalUnassignedNodes, false);
    this.updateNodeStyles(this.originalAssignedNodes, true);

    this.applyUnassignedFilter();
    this.applyAssignedFilter();

    this.unassignedCount = this.countTreeNodes(this.originalUnassignedNodes);
    this.assignedCount = this.countTreeNodes(this.originalAssignedNodes);

    this.selectedAssigned = [];
    this.checkDirtyState();
    this.cdr.markForCheck();
  }

  // ─── Search / Filter cây ─────────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Lọc cây nhóm chưa gán theo keyword.
   */
  onUnassignedSearch(): void {
    this.applyUnassignedFilter();
    this.cdr.markForCheck();
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Lọc cây nhóm đã gán theo keyword.
   */
  onAssignedSearch(): void {
    this.applyAssignedFilter();
    this.cdr.markForCheck();
  }

  private applyUnassignedFilter(): void {
    const q = this.unassignedSearchQuery.toLowerCase().trim();
    this.unassignedNodes = q
      ? this.filterTree(this.originalUnassignedNodes, q)
      : this.originalUnassignedNodes;
  }

  private applyAssignedFilter(): void {
    const q = this.assignedSearchQuery.toLowerCase().trim();
    this.assignedNodes = q
      ? this.filterTree(this.originalAssignedNodes, q)
      : this.originalAssignedNodes;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Lọc cây đệ quy: Giữ node nếu label khớp HOẶC có ít nhất 1 con khớp.
   * Nếu node cha khớp thì giữ nguyên tất cả con.
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

  // ─── Lưu / Hủy ───────────────────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Nút Lưu: thu thập tất cả leaf node ID trong cây assigned → gọi API.
   */
  onSave(): void {
    if (!this.selectedUser || !this.isDirty) return;

    // Lấy TẤT CẢ group IDs (không chỉ leaf) trong assigned tree
    const groupIds = this.collectAllGroupIds(this.originalAssignedNodes);

    this.isSaving = true;
    this.cdr.markForCheck();

    this.service.assignGroups(this.selectedUser.userId, { groupIds })
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
          this.updateNodeStyles(this.originalUnassignedNodes, false);
          this.updateNodeStyles(this.originalAssignedNodes, true);

          this.applyUnassignedFilter();
          this.applyAssignedFilter();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Gán nhóm xe thành công.',
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSaving = false;
          this.showError(getHttpErrorMessage(err, 'Lỗi khi lưu gán nhóm xe.'));
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Nút Hủy: Hỏi xác nhận bằng p-confirmDialog, sau đó reset về trạng thái ban đầu.
   */
  onCancel(): void {
    if (!this.isDirty) return;

    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn hủy các thay đổi chưa lưu?',
      header: 'Xác nhận hủy',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Hủy thay đổi',
      rejectLabel: 'Tiếp tục chỉnh sửa',
      accept: () => {
        if (this.selectedUser) {
          this.resetTreeState();
          this.loadGroupsForUser(this.selectedUser.userId);
        }
      },
    });
  }

  // ─── Utilities & Helpers ─────────────────────────────────────────────────

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Reset toàn bộ state của 2 cây khi chọn user mới hoặc hủy thay đổi.
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
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Đếm tổng số node (bao gồm cả cha) trong VehicleGroupNode[].
   * Dùng khi nhận data từ API (trước khi convert sang TreeNode).
   */
  private countAllNodes(nodes: VehicleGroupNode[]): number {
    let count = 0;
    for (const n of nodes) {
      count++;
      if (n.children?.length) count += this.countAllNodes(n.children);
    }
    return count;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Đếm tổng số TreeNode trong cây (dùng sau khi đã convert).
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
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Thu thập data (groupId: number) của tất cả node trong cây assigned.
   * Gửi tất cả ID (cả cha lẫn con) lên API để BE xử lý.
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
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Trích xuất các node hoàn chỉnh từ cây dựa vào selectedKeys.
   * Chỉ lấy node cấp cao nhất được chọn (không lấy trùng cha-con).
   * Nếu cha được chọn thì tất cả con cũng sẽ theo.
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
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Xoá các node có key trong removedKeys khỏi cây.
   * Nếu node cha hết con sau khi xoá thì node cha cũng bị xoá.
   */
  private removeNodes(nodes: TreeNode[], removedKeys: Set<string>): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (removedKeys.has(node.key as string)) continue; // Bỏ qua node này
      const filteredChildren = this.removeNodes(node.children ?? [], removedKeys);
      result.push({ ...node, children: filteredChildren });
    }
    return result;
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Merge các node mới vào cây hiện tại, giữ nguyên cấu trúc phân cấp.
   * Nếu node cha đã tồn tại (cùng key) thì merge children vào.
   * Nếu chưa tồn tại thì thêm mới vào cuối.
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
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Clone cây TreeNode.
   */
  private cloneNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((n) => ({
      ...n,
      children: n.children?.length ? this.cloneNodes(n.children) : [],
    }));
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Thu thập tất cả key của node và con vào Set.
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
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Cập nhật styleClass 'node-dirty' cho các node dựa vào trạng thái ban đầu.
   */
  private updateNodeStyles(nodes: TreeNode[], isAssignedTree: boolean): void {
    for (const node of nodes) {
      const isDirtyNode = isAssignedTree
        ? this.initialUnassignedKeys.has(node.key as string)
        : this.initialAssignedKeys.has(node.key as string);

      node.styleClass = isDirtyNode ? 'node-dirty' : undefined;

      if (node.children?.length) {
        this.updateNodeStyles(node.children, isAssignedTree);
      }
    }
  }

  /**
   * Người tạo: DungBT
   * Ngày tạo: 11/06/2026
   * Kiểm tra xem có thay đổi nào so với dữ liệu ban đầu hay không.
   */
  private checkDirtyState(): void {
    const checkUnassigned = (nodes: TreeNode[]): boolean => {
      for (const n of nodes) {
        if (this.initialAssignedKeys.has(n.key as string)) return true;
        if (n.children?.length && checkUnassigned(n.children)) return true;
      }
      return false;
    };

    const checkAssigned = (nodes: TreeNode[]): boolean => {
      for (const n of nodes) {
        if (this.initialUnassignedKeys.has(n.key as string)) return true;
        if (n.children?.length && checkAssigned(n.children)) return true;
      }
      return false;
    };

    this.isDirty = checkUnassigned(this.originalUnassignedNodes) || checkAssigned(this.originalAssignedNodes);
  }

  /** Helper: hiển thị toast lỗi */
  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail });
  }
}
