/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * chứa parameters của login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * chứa response của login
 */
export interface LoginResponse {
  token: string;
  user: UserInfo;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * chứa thông tin user của response của login
 */
export interface UserInfo {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
}

/**
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 * chứa response của api
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  timestamp?: string;
}
