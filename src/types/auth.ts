// Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
}

// Financial Models
export interface Account {
  id: number;
  name: string;
  balance: string; // Django DecimalField comes as string in JSON
  owner: number; // User ID
}

export interface CreateAccountData {
  name: string;
  balance: string;
}

export interface UpdateAccountData {
  name?: string;
  balance?: string;
}

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  owner: number; // User ID
}

export interface CreateCategoryData {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryData {
  name?: string;
  type?: CategoryType;
}

export interface Transaction {
  id: number;
  account: number; // Account ID
  category: number | null; // Category ID, nullable
  amount: string; // Django DecimalField comes as string
  date: string; // ISO date string
  description: string;
  owner: number; // User ID
}

export interface CreateTransactionData {
  account: number;
  category: number | null;
  amount: string;
  description?: string;
}

export interface UpdateTransactionData {
  account?: number;
  category?: number | null;
  amount?: string;
  description?: string;
}

export interface Transfer {
  id: number;
  from_account: number; // Account ID
  to_account: number; // Account ID
  amount: string; // Django DecimalField comes as string
  date: string; // ISO datetime string
  description: string;
  owner: number; // User ID
}

export interface CreateTransferData {
  from_account: number;
  to_account: number;
  amount: string;
  date: string;
  description?: string;
}

export interface UpdateTransferData {
  from_account?: number;
  to_account?: number;
  amount?: string;
  date: string;
  description?: string;
}

// Extended types with populated relations for UI components
export interface TransactionWithDetails extends Omit<Transaction, 'account' | 'category'> {
  account: Account;
  category: Category | null;
}

export interface TransferWithDetails extends Omit<Transfer, 'from_account' | 'to_account'> {
  from_account: Account;
  to_account: Account;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Filter and search types
export interface TransactionFilters {
  account?: number;
  category?: number;
  date?: string;
  search?: string;
  ordering?: 'date' | '-date' | 'amount' | '-amount';
}

export interface AccountFilters {
  search?: string;
}

export interface CategoryFilters {
  search?: string;
  type?: CategoryType;
}

export interface TransferFilters {
  search?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  status?: number;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormState<T> extends LoadingState {
  data: T;
  isDirty: boolean;
}

// Dashboard and analytics types
export interface BalanceSummary {
  totalBalance: string;
  totalIncome: string;
  totalExpenses: string;
  accountsCount: number;
}

export interface CategorySummary {
  category: Category;
  total: string;
  transactionCount: number;
}

export interface MonthlyAnalytics {
  month: string;
  income: string;
  expenses: string;
  balance: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  isDisabled?: boolean;
}

export interface SelectOption<T = string | number> {
  label: string;
  value: T;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

// Utility types
export type CreateData<T> = Omit<T, 'id' | 'owner' | 'date'>;
export type UpdateData<T> = Partial<CreateData<T>>;
export type EntityWithOwner<T> = T & { owner: number };

// Constants
export const CATEGORY_TYPES: { label: string; value: CategoryType }[] = [
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' }
];

export const DEFAULT_CATEGORIES = {
  INCOME: [
    'Salary',
    'Investments', 
    'Gifts',
    'Deposits',
    'Initial Balance (+)',
    'Balance Adjustment (+)'
  ],
  EXPENSE: [
    'Food',
    'Housing',
    'Utilities',
    'Transportation',
    'Health',
    'Entertainment',
    'Education',
    'Debt Payments',
    'Initial Balance (-)',
    'Balance Adjustment (-)'
  ]
} as const;

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  status: string;
}