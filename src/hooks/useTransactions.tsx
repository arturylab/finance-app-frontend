import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  Transaction,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  PaginatedResponse,
  Account,
  Category,
  TransactionWithDetails,
} from '@/types/auth';

interface UseTransactionsState {
  transactions: Transaction[];
  transactionsWithDetails: TransactionWithDetails[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface UseTransactionsActions {
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<Transaction>;
  updateTransaction: (id: number, data: UpdateTransactionData) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<void>;
  getTransactionById: (id: number) => Promise<Transaction>;
  refreshTransactions: () => Promise<void>;
  clearError: () => void;
}

export interface UseTransactionsReturn extends UseTransactionsState, UseTransactionsActions {}

export const useTransactions = (initialFilters?: TransactionFilters): UseTransactionsReturn => {
  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    transactionsWithDetails: [],
    loading: false,
    error: null,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>(initialFilters || {});

  // Helper function to populate transaction details
  const populateTransactionDetails = useCallback((transactions: Transaction[]): TransactionWithDetails[] => {
    return transactions.map(transaction => ({
      ...transaction,
      account: accounts.find(acc => acc.id === transaction.account) || {
        id: transaction.account,
        name: 'Unknown Account',
        balance: '0.00',
        owner: 0
      },
      category: transaction.category 
        ? categories.find(cat => cat.id === transaction.category) || null
        : null
    }));
  }, [accounts, categories]);

  // Fetch supporting data (accounts and categories)
  const fetchSupportingData = useCallback(async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        apiClient.accounts.getAll(),
        apiClient.categories.getAll()
      ]);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch supporting data:', error);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (filters?: TransactionFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const filtersToUse = filters || currentFilters;
      setCurrentFilters(filtersToUse);
      
      const response = await apiClient.transactions.getAll(filtersToUse);
      
      // Handle both paginated and non-paginated responses
      const isPaginated = 'results' in response;
      const transactions = isPaginated ? (response as PaginatedResponse<Transaction>).results : response as Transaction[];
      const totalCount = isPaginated ? (response as PaginatedResponse<Transaction>).count : transactions.length;
      const hasNext = isPaginated ? !!(response as PaginatedResponse<Transaction>).next : false;
      const hasPrevious = isPaginated ? !!(response as PaginatedResponse<Transaction>).previous : false;

      setState(prev => ({
        ...prev,
        transactions,
        transactionsWithDetails: populateTransactionDetails(transactions),
        totalCount,
        hasNext,
        hasPrevious,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [currentFilters, populateTransactionDetails]);

  // Create transaction
  const createTransaction = useCallback(async (data: CreateTransactionData): Promise<Transaction> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newTransaction = await apiClient.transactions.create(data);
      
      // Add to local state
      setState(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
        transactionsWithDetails: [
          ...populateTransactionDetails([newTransaction]),
          ...prev.transactionsWithDetails
        ],
        totalCount: prev.totalCount + 1,
        loading: false,
      }));
      
      return newTransaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [populateTransactionDetails]);

  // Update transaction
  const updateTransaction = useCallback(async (id: number, data: UpdateTransactionData): Promise<Transaction> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedTransaction = await apiClient.transactions.update(id, data);
      
      // Update local state
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === id ? updatedTransaction : t
        ),
        transactionsWithDetails: prev.transactionsWithDetails.map(t => 
          t.id === id ? populateTransactionDetails([updatedTransaction])[0] : t
        ),
        loading: false,
      }));
      
      return updatedTransaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [populateTransactionDetails]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await apiClient.transactions.delete(id);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
        transactionsWithDetails: prev.transactionsWithDetails.filter(t => t.id !== id),
        totalCount: Math.max(0, prev.totalCount - 1),
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Get transaction by ID
  const getTransactionById = useCallback(async (id: number): Promise<Transaction> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const transaction = await apiClient.transactions.getById(id);
      setState(prev => ({ ...prev, loading: false }));
      return transaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Refresh transactions with current filters
  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize supporting data on mount
  useEffect(() => {
    fetchSupportingData();
  }, [fetchSupportingData]);

  // Update transaction details when accounts or categories change
  useEffect(() => {
    if (accounts.length > 0 || categories.length > 0) {
      setState(prev => ({
        ...prev,
        transactionsWithDetails: populateTransactionDetails(prev.transactions),
      }));
    }
  }, [accounts, categories, populateTransactionDetails]);

  // Initial fetch
    useEffect(() => {
      if (accounts.length > 0 && categories.length > 0) {
        fetchTransactions(initialFilters);
      }
    }, [accounts, categories, fetchTransactions, initialFilters]);

  return {
    // State
    transactions: state.transactions,
    transactionsWithDetails: state.transactionsWithDetails,
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,
    hasNext: state.hasNext,
    hasPrevious: state.hasPrevious,
    
    // Actions
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    refreshTransactions,
    clearError,
  };
};

// Hook variant for single transaction operations
export const useTransaction = (id?: number) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = useCallback(async (transactionId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.transactions.getById(transactionId);
      setTransaction(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTransaction = useCallback(async (transactionId: number, data: UpdateTransactionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedTransaction = await apiClient.transactions.update(transactionId, data);
      setTransaction(updatedTransaction);
      return updatedTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchTransaction(id);
    }
  }, [id, fetchTransaction]);

  return {
    transaction,
    loading,
    error,
    fetchTransaction,
    updateTransaction,
    clearError: () => setError(null),
  };
};