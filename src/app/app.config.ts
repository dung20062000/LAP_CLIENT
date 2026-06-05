import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideEchartsCore({ echarts }),
    providePrimeNG({
      theme: {
        preset: Aura
      },
      translation: {
        startsWith: 'Bắt đầu với',
        contains: 'Chứa',
        notContains: 'Không chứa',
        endsWith: 'Kết thúc với',
        equals: 'Bằng',
        notEquals: 'Không bằng',
        noFilter: 'Không lọc',
        lt: 'Nhỏ hơn',
        lte: 'Nhỏ hơn hoặc bằng',
        gt: 'Lớn hơn',
        gte: 'Lớn hơn hoặc bằng',
        is: 'Là',
        isNot: 'Không là',
        before: 'Trước',
        after: 'Sau',
        dateIs: 'Ngày là',
        dateIsNot: 'Ngày không là',
        dateBefore: 'Ngày trước',
        dateAfter: 'Ngày sau',
        clear: 'Xóa',
        apply: 'Áp dụng',
        matchAll: 'Khớp tất cả',
        matchAny: 'Khớp bất kỳ',
        addRule: 'Thêm quy tắc',
        removeRule: 'Xóa quy tắc',
        accept: 'Có',
        reject: 'Không',
        choose: 'Chọn',
        completed: 'Hoàn thành',
        upload: 'Tải lên',
        cancel: 'Hủy',
        pending: 'Đang chờ',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        dayNames: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
        dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        monthNamesShort: ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'],
        chooseYear: 'Chọn năm',
        chooseMonth: 'Chọn tháng',
        chooseDate: 'Chọn ngày',
        prevDecade: 'Thập kỷ trước',
        nextDecade: 'Thập kỷ sau',
        prevYear: 'Năm trước',
        nextYear: 'Năm sau',
        prevMonth: 'Tháng trước',
        nextMonth: 'Tháng sau',
        prevHour: 'Giờ trước',
        nextHour: 'Giờ sau',
        prevMinute: 'Phút trước',
        nextMinute: 'Phút sau',
        prevSecond: 'Giây trước',
        nextSecond: 'Giây sau',
        am: 'sáng',
        pm: 'chiều',
        dateFormat: 'dd/mm/yy',
        firstDayOfWeek: 1,
        today: 'Hôm nay',
        weekHeader: 'Tuần'
      }
    })
  ]
};

