export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
  refreshToken: string;
  expiresIn: number;
}

export interface UserInfo {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  timestamp?: string;
}
