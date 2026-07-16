import { HttpInterceptorFn, HttpParams } from '@angular/common/http';

/**
 * cleanParamsInterceptor: Xoá các params có giá trị null/undefined
 * Người tạo: DungBT
 * Ngày tạo: 16/07/2026
 */

export const cleanParamsInterceptor: HttpInterceptorFn = (req, next) => {
  let cleanedParams = new HttpParams();

  // Duyệt qua tất cả các params hiện tại
  req.params.keys().forEach((key) => {
    const values = req.params.getAll(key);
    if (values) {
      values.forEach((value) => {
        // Chỉ giữ lại những giá trị hợp lệ (khác chuỗi 'undefined' và 'null')
        if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
          cleanedParams = cleanedParams.append(key, value);
        }
      });
    }
  });

  // Clone request với params mới đã được làm sạch
  const cleanedReq = req.clone({ params: cleanedParams });
  return next(cleanedReq);
};
