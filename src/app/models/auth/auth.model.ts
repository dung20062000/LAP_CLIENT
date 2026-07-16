/**
 * chứa parameters của login
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * chứa response của login
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface LoginResponse {
  token: string;
  user: UserInfo;
  refreshToken: string;
  expiresIn: number;
}

/**
 * chứa thông tin user của response của login
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
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
 * chứa response của api
 * Người tạo: DungBT
 * Ngày tạo: 18/06/2026
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  timestamp?: string;
}
