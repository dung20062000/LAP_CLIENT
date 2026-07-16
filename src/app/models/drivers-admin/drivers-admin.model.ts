/**
 * Mô tả: Các interface/model dùng cho màn hình Quản Lý Lái Xe.
 * Người tạo: DungBT
 * Ngày tạo: 25/06/2026
 */

/**
 * Enum cho loại tìm kiếm lái xe
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 */
export enum DriverSearchType {
  Name = 0,
  DriverLicense = 1,
}

/**
 * Dropdown lái xe (GET /api/drivers/lookup)
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 */
export interface DriverLookupDto {
  Value: number;
  Label: string;
}

/**
 * Dropdown loại bằng (GET /api/drivers/license-types-lookup)
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 */
export interface LicenseTypeLookupDto {
  Value: number;
  Name: string;
  Code: string;
}

/**
 * Dữ liệu một dòng lái xe trong lưới
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 */
export interface DriverDto {
  Id: number;
  EmployeeCode: string;
  Name: string;
  DisplayName: string;
  Mobile: string | null;
  DriverLicense: string | null;
  /** ISO string từ API */
  IssueLicenseDate: string | null;
  /** ISO string từ API */
  ExpireLicenseDate: string | null;
  IssueLicensePlace: string | null;
  LicenseType: number | null;
  LicenseTypeName: string | null;
  /** ISO string từ API */
  UpdatedDate: string | null;
}

/**
 * Response phân trang cho lưới
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
 */
export interface DriverListResponse {
  TotalRecord: number;
  Items: DriverDto[];
}

/**
 * Request filter cho lưới và export
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
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
 * Payload batch update một dòng
 * Người tạo: DungBT
 * Ngày tạo: 01/07/2026
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
 * Payload tạo mới lái xe
 * Người tạo: DungBT
 * Ngày tạo: 06/07/2026
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
