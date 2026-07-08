/**
 * Người tạo: DungBT
 * Ngày tạo: 25/06/2026
 * Mô tả: Các interface/model dùng cho màn hình Quản Lý Lái Xe.
 */

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Enum cho loại tìm kiếm lái xe
 */
export enum DriverSearchType {
  Name = 0,
  DriverLicense = 1,
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Dropdown lái xe (GET /api/drivers/lookup)
 */
export interface DriverLookupDto {
  Value: number;
  Label: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Dropdown loại bằng (GET /api/drivers/license-types-lookup)
 */
export interface LicenseTypeLookupDto {
  Value: number;
  Name: string;
  Code: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Dữ liệu một dòng lái xe trong lưới
 */
export interface DriverDto {
  Id: number;
  EmployeeCode: string;
  Name: string;
  DisplayName: string;
  Mobile: string | null;
  DriverLicense: string | null;
  IssueLicenseDate: string | null; // ISO string từ API
  ExpireLicenseDate: string | null; // ISO string từ API
  IssueLicensePlace: string | null;
  LicenseType: number | null;
  LicenseTypeName: string | null;
  UpdatedDate: string | null; // ISO string từ API
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Response phân trang cho lưới
 */
export interface DriverListResponse {
  TotalRecord: number;
  Items: DriverDto[];
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Request filter cho lưới và export
 */
export interface DriverListRequest {
  Type?: DriverSearchType;
  Keyword?: string;
  DriverIds?: number[];
  LicenseTypeIds?: number[];
  Page?: number;
  PageSize?: number;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 * Payload batch update một dòng
 */
export interface UpdateDriverRequest {
  Id: number;
  DisplayName?: string;
  DriverLicense?: string | null;
  IssueLicenseDate?: string | null;
  ExpireLicenseDate?: string | null;
  IssueLicensePlace?: string | null;
  LicenseType?: number | null;
  Mobile?: string | null;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 06/07/2026
 * Payload tạo mới lái xe
 */
export interface CreateDriverRequest {
  Id?: number;
  DisplayName: string;
  DriverLicense?: string | null;
  IssueLicenseDate?: string | null;
  ExpireLicenseDate?: string | null;
  IssueLicensePlace?: string | null;
  LicenseType?: number | null;
  Mobile?: string | null;
}
