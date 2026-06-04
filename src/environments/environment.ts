/**
 * Người tạo: DungBT
 * Ngày tạo: 04/06/2026
 * Mô tả: Cấu hình môi trường development.
 *        Thay đổi apiUrl khi deploy lên production.
 */
export const environment = {
  production: false,
  // Thay port thực tế của LAP_API khi chạy local
  apiUrl: 'http://localhost:5000/api',
};
