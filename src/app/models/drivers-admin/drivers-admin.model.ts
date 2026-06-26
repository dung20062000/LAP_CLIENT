/**
 * Người tạo: DungBT
 * Ngày tạo: 25/06/2026
 * Mô tả: Các interface/model dùng cho màn hình Quản Lý Lái Xe.
 */

/** Enum cho loại tìm kiếm lái xe */
export enum DriverSearchType {
  Name = 0,
  DriverLicense = 1,
}

/** Dropdown lái xe (GET /api/drivers/lookup) */
export interface DriverLookupDto {
  Value: number;
  Label: string;
}

/** Dropdown loại bằng (GET /api/drivers/license-types-lookup) */
export interface LicenseTypeLookupDto {
  Value: number;
  Name: string;
  Code: string;
}

/** Dữ liệu một dòng lái xe trong lưới */
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

/** Response phân trang cho lưới */
export interface DriverListResponse {
  TotalRecord: number;
  Items: DriverDto[];
}

/** Request filter cho lưới và export */
export interface DriverListRequest {
  Type?: DriverSearchType;
  Keyword?: string;
  DriverIds?: number[];
  LicenseTypeIds?: number[];
  Page?: number;
  PageSize?: number;
}

/** Payload batch update một dòng */
export interface UpdateDriverRequest {
  Id: number;
  DriverLicense?: string | null;
  IssueLicenseDate?: string | null;
  ExpireLicenseDate?: string | null;
  IssueLicensePlace?: string | null;
  LicenseType?: number | null;
  Mobile?: string | null;
}
