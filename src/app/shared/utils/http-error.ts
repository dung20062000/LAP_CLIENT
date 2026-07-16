/**
 * Mô tả: Utility helper để trích xuất thông tin lỗi từ response của API server.
 * Người tạo: DungBT
 * Ngày tạo: 09/06/2026
 */

/**
 * Trích xuất thông tin lỗi từ response của API server.
 * @param err Đối tượng lỗi (thường là HttpErrorResponse hoặc Exception)
 * @param defaultMsg Thông điệp mặc định khi không tìm thấy lỗi từ server
 * Người tạo: DungBT
 * Ngày tạo: 09/06/2026
 */
export function getHttpErrorMessage(err: any, defaultMsg: string): string {
  if (err && err.error) {
    if (typeof err.error === 'string') {
      return err.error;
    } else if (err.error.message) {
      let msg = err.error.message;
      if (err.error.errors && typeof err.error.errors === 'object') {
        const details = Object.values(err.error.errors)
          .flatMap((messages: any) => messages)
          .join(', ');
        if (details) {
          msg += `: ${details}`;
        }
      }
      return msg;
    }
  } else if (err && err.message) {
    return err.message;
  }
  return defaultMsg;
}
