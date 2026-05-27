import { Component } from '@angular/core';

interface BranchLocation {
  id: string | number;
  city: string;
  address: string;
}

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly branches: BranchLocation[] = [
    { id: 1, city: 'Hà Nội', address: 'Lô 14 phố Nguyễn Cảnh Dị, Phường Định Công, Thành phố Hà Nội' },
    { id: 2, city: 'Hải Phòng', address: 'Căn BH 01- 47 KĐT Vinhomes Imperia, Đ. Bạch Đằng, P. Hồng Bàng, TP. Hải Phòng' },
    { id: 3, city: 'Nghệ An', address: 'Số B5-15, ngõ 26, Đ. Nguyễn Thái Học, P. Thành Vinh, T. Nghệ An' },
    { id: 4, city: 'Hà Tĩnh', address: 'Số 402, Đường Trần Phú, Phường Thạch Trung, Thành phố Hà Tĩnh' },
    { id: 5, city: 'Đà Nẵng', address: 'Số nhà 42, Đ. Bờ Quan 7, P. Ngũ Hành Sơn, TP. Đà Nẵng' },
    { id: 6, city: 'TP. Hồ Chí Minh', address: 'Số 9, Đường 37, KĐT Vạn Phúc, P. Hiệp Bình Phước, TP. Thủ Đức, TP. Hồ Chí Minh' },
  ];
}
