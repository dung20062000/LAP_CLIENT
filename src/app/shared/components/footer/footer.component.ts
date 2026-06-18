import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Thông tin địa chỉ một chi nhánh. city là translation key.
 */
interface BranchLocation {
  id: string | number;
  city: string;
  address: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Component footer chính của ứng dụng.
 */
@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Danh sách chi nhánh của BA GPS trên toàn quốc.
   * city dùng làm translation key để hiển thị tên thành phố theo ngôn ngữ.
   */
  readonly branches: BranchLocation[] = [
    { id: 1, city: 'footer.city.hanoi', address: 'Lô 14 phố Nguyễn Cảnh Dị, Phường Định Công, Thành phố Hà Nội' },
    { id: 2, city: 'footer.city.haiphong', address: 'Căn BH 01- 47 KĐT Vinhomes Imperia, Đ. Bạch Đằng, P. Hồng Bàng, TP. Hải Phòng' },
    { id: 3, city: 'footer.city.nghean', address: 'Số B5-15, ngõ 26, Đ. Nguyễn Thái Học, P. Thành Vinh, T. Nghệ An' },
    { id: 4, city: 'footer.city.hatinh', address: 'Số 402, Đường Trần Phú, Phường Thạch Trung, Thành phố Hà Tĩnh' },
    { id: 5, city: 'footer.city.danang', address: 'Số nhà 42, Đ. Bờ Quan 7, P. Ngũ Hành Sơn, TP. Đà Nẵng' },
    { id: 6, city: 'footer.city.hcm', address: 'Số 9, Đường 37, KĐT Vạn Phúc, P. Hiệp Bình Phước, TP. Thủ Đức, TP. Hồ Chí Minh' },
  ];
}
