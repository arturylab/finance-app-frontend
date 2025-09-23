import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  Account,
  CreateAccountData,
  UpdateAccountData,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  Transfer,
  CreateTransferData,
  UpdateTransferData,
  PaginatedResponse,
  TransactionFilters,
  AccountFilters,
  CategoryFilters,
  TransferFilters,
  UpdateUserProfileData,
  ChangePasswordData,
  ChangePasswordResponse
} from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/register/',
  '/auth/token/',
  '/auth/token/refresh/',
];

// Token management utilities
const TokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  },

  setAccessToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },

  setRefreshToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  },

  clearTokens: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  isPublicRoute: (url?: string): boolean => {
    return PUBLIC_ROUTES.some(route => url?.includes(route));
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (!TokenManager.isPublicRoute(config.url)) {
      const token = TokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest || TokenManager.isPublicRoute(originalRequest.url)) {
      return Promise.reject(error);
    }
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          TokenManager.setAccessToken(access);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          
          return api(originalRequest);
        } catch (refreshError) {
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Error handler utility
const handleApiError = (error: unknown, fallbackMessage: string): never => {
  console.error('API Error:', error);
  
  if (error instanceof AxiosError) {
    const errorData = error.response?.data;
    
    // Handle structured error responses
    if (errorData && typeof errorData === 'object') {
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      
      // Handle field validation errors
      const firstError = Object.values(errorData)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        throw new Error(firstError[0]);
      }
      
      if (typeof firstError === 'string') {
        throw new Error(firstError);
      }
    }
    
    throw new Error(fallbackMessage);
  }
  
  throw error;
};

// Build query string from filters
const buildQueryString = <T extends object>(filters: T): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

// Authentication API
class AuthApi {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/token/', credentials);
      const { access, refresh } = response.data;
      
      TokenManager.setAccessToken(access);
      TokenManager.setRefreshToken(refresh);

      const userResponse = await api.get('/users/me/');
      
      return {
        user: userResponse.data,
        tokens: { access, refresh },
      };
    } catch (error) {
      handleApiError(error, 'Login failed');
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/register/', {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      const responseData = response.data;

      // Handle direct token response
      if (responseData.tokens) {
        TokenManager.setAccessToken(responseData.tokens.access);
        TokenManager.setRefreshToken(responseData.tokens.refresh);
        
        return {
          user: responseData.user,
          tokens: responseData.tokens,
        };
      }

      // Fallback to automatic login
      return await this.login({
        username: data.username,
        password: data.password,
      });
    } catch (error) {
      handleApiError(error, 'Registration failed');
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to get current user');
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await api.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      TokenManager.setAccessToken(access);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      TokenManager.clearTokens();
      return false;
    }
  }

async updateProfile(data: UpdateUserProfileData): Promise<User> {
  try {
    const response = await api.patch('/users/me/profile/', data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to update user profile');
    throw error;
  }
}

async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
  try {
    const response = await api.put('/users/me/change-password/', data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to change password');
    throw error;
  }
}

  logout(): void {
    TokenManager.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}


// Accounts API
class AccountsApi {
  async getAll(filters?: AccountFilters): Promise<Account[]> {
    try {
      const queryString = buildQueryString(filters || {});
      const response = await api.get(`/accounts/${queryString}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch accounts');
      throw error;
    }
  }

  async getById(id: number): Promise<Account> {
    try {
      const response = await api.get(`/accounts/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch account');
      throw error;
    }
  }

  async create(data: CreateAccountData): Promise<Account> {
    try {
      const response = await api.post('/accounts/', data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create account');
      throw error;
    }
  }

  async update(id: number, data: UpdateAccountData): Promise<Account> {
    try {
      const response = await api.patch(`/accounts/${id}/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update account');
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/accounts/${id}/`);
    } catch (error) {
      handleApiError(error, 'Failed to delete account');
      throw error;
    }
  }
}

// Categories API
class CategoriesApi {
  async getAll(filters?: CategoryFilters): Promise<Category[]> {
    try {
      const queryString = buildQueryString(filters || {});
      const response = await api.get(`/categories/${queryString}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch categories');
      throw error;
    }
  }

  async getById(id: number): Promise<Category> {
    try {
      const response = await api.get(`/categories/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch category');
      throw error;
    }
  }

  async create(data: CreateCategoryData): Promise<Category> {
    try {
      const response = await api.post('/categories/', data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create category');
      throw error;
    }
  }

  async update(id: number, data: UpdateCategoryData): Promise<Category> {
    try {
      const response = await api.patch(`/categories/${id}/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update category');
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/categories/${id}/`);
    } catch (error) {
      handleApiError(error, 'Failed to delete category');
      throw error;
    }
  }
}

// Transactions API
class TransactionsApi {
  async getAll(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction> | Transaction[]> {
    try {
      const queryString = buildQueryString(filters || {});
      const response = await api.get(`/transactions/${queryString}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch transactions');
      throw error;
    }
  }

  async getById(id: number): Promise<Transaction> {
    try {
      const response = await api.get(`/transactions/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch transaction');
      throw error;
    }
  }

  async create(data: CreateTransactionData): Promise<Transaction> {
    try {
      const response = await api.post('/transactions/', data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create transaction');
      throw error;
    }
  }

  async update(id: number, data: UpdateTransactionData): Promise<Transaction> {
    try {
      const response = await api.patch(`/transactions/${id}/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update transaction');
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/transactions/${id}/`);
    } catch (error) {
      handleApiError(error, 'Failed to delete transaction');
      throw error;
    }
  }
}

// Transfers API
class TransfersApi {
  async getAll(filters?: TransferFilters): Promise<Transfer[]> {
    try {
      const queryString = buildQueryString(filters || {});
      const response = await api.get(`/transfers/${queryString}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch transfers');
      throw error;
    }
  }

  async getById(id: number): Promise<Transfer> {
    try {
      const response = await api.get(`/transfers/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch transfer');
      throw error;
    }
  }

  async create(data: CreateTransferData): Promise<Transfer> {
    try {
      console.log("Payload to backend:", data)
      const response = await api.post('/transfers/', data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create transfer');
      throw error;
    }
  }

  async update(id: number, data: UpdateTransferData): Promise<Transfer> {
    try {
      const response = await api.patch(`/transfers/${id}/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update transfer');
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/transfers/${id}/`);
    } catch (error) {
      handleApiError(error, 'Failed to delete transfer');
      throw error;
    }
  }
}

// Main API client
class ApiClient {
  auth = new AuthApi();
  accounts = new AccountsApi();
  categories = new CategoriesApi();
  transactions = new TransactionsApi();
  transfers = new TransfersApi();

  // Legacy methods for backward compatibility
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.auth.login(credentials);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.auth.register(data);
  }

  async getCurrentUser(): Promise<User> {
    return this.auth.getCurrentUser();
  }

  async logout(): Promise<void> {
    this.auth.logout();
  }

  async refreshToken(): Promise<boolean> {
    return this.auth.refreshToken();
  }
}

export const apiClient = new ApiClient();

// Legacy exports for backward compatibility
export const setToken = (token: string) => {
  TokenManager.setAccessToken(token);
};

export { TokenManager };
export default api;