import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  organization_id?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    organization_id?: string;
    created_at: string;
  };
  token_pair: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
}

export const authAPI = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  setAuthState(data: { access_token: string; refresh_token: string; user: any }) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('current_user', JSON.stringify(data.user));
  },

  getStoredAuth() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('current_user');
    if (token && user) {
      return { access_token: token, user: JSON.parse(user) };
    }
    return null;
  },

  clearAuthState() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  },
};
