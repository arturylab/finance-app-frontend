import { useState, useCallback, useEffect } from 'react';
import { 
  Transfer, 
  CreateTransferData, 
  UpdateTransferData, 
  TransferFilters,
} from '@/types/auth';
import { apiClient } from '@/lib/api';

interface UseTransfersState {
  transfers: Transfer[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseTransfersReturn extends UseTransfersState {
  // CRUD Operations
  fetchTransfers: (filters?: TransferFilters) => Promise<void>;
  createTransfer: (data: CreateTransferData) => Promise<Transfer | undefined>;
  updateTransfer: (id: number, data: UpdateTransferData) => Promise<Transfer | undefined>;
  deleteTransfer: (id: number) => Promise<boolean>;
  
  // Single transfer operations
  getTransferById: (id: number) => Promise<Transfer | undefined>;
  
  // Utility functions
  refreshTransfers: () => Promise<void>;
  clearError: () => void;
  
  // Helper functions
  findTransferById: (id: number) => Transfer | undefined;
  getTransfersByAccount: (accountId: number) => Transfer[];
  getTotalTransferAmount: () => number;
}

const initialState: UseTransfersState = {
  transfers: [],
  isLoading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
};

export const useTransfers = (
  autoFetch: boolean = true,
  initialFilters?: TransferFilters,
  callbacks?: {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }
): UseTransfersReturn => {
  const [state, setState] = useState<UseTransfersState>(initialState);
  const [lastFilters, setLastFilters] = useState<TransferFilters | undefined>(initialFilters);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UseTransfersState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Callback handlers
  const handleSuccess = useCallback((message: string) => {
    callbacks?.onSuccess?.(message);
  }, [callbacks]);

  const handleError = useCallback((message: string) => {
    callbacks?.onError?.(message);
  }, [callbacks]);

  // Fetch transfers with filters
  const fetchTransfers = useCallback(async (filters?: TransferFilters) => {
    try {
      updateState({ isLoading: true, error: null });
      setLastFilters(filters);
      
      const transfers = await apiClient.transfers.getAll(filters);
      updateState({ 
        transfers: Array.isArray(transfers) ? transfers : [],
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transfers';
      updateState({ 
        error: errorMessage, 
        isLoading: false,
        transfers: []
      });
      handleError(errorMessage);
    }
  }, [updateState, handleError]);

  // Refresh transfers with last used filters
  const refreshTransfers = useCallback(async () => {
    await fetchTransfers(lastFilters);
  }, [fetchTransfers, lastFilters]);

  // Get single transfer by ID
  const getTransferById = useCallback(async (id: number): Promise<Transfer | undefined> => {
    try {
      clearError();
      const transfer = await apiClient.transfers.getById(id);
      return transfer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transfer';
      updateState({ error: errorMessage });
      handleError(errorMessage);
      return undefined;
    }
  }, [clearError, updateState, handleError]);

  // Create new transfer
  const createTransfer = useCallback(async (data: CreateTransferData): Promise<Transfer | undefined> => {
    try {
      updateState({ isCreating: true, error: null });
      
      const newTransfer = await apiClient.transfers.create(data);
      
      // Add to local state
      updateState({ 
        transfers: [newTransfer, ...state.transfers],
        isCreating: false
      });
      
      handleSuccess('Transfer created successfully');
      return newTransfer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transfer';
      updateState({ 
        error: errorMessage, 
        isCreating: false 
      });
      handleError(errorMessage);
      return undefined;
    }
  }, [state.transfers, updateState, handleSuccess, handleError]);

  // Update existing transfer
  const updateTransfer = useCallback(async (id: number, data: UpdateTransferData): Promise<Transfer | undefined> => {
    try {
      updateState({ isUpdating: true, error: null });
      
      const updatedTransfer = await apiClient.transfers.update(id, data);
      
      // Update in local state
      const updatedTransfers = state.transfers.map(transfer =>
        transfer.id === id ? updatedTransfer : transfer
      );
      
      updateState({
        transfers: updatedTransfers,
        isUpdating: false
      });
      
      handleSuccess('Transfer updated successfully');
      return updatedTransfer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transfer';
      updateState({ 
        error: errorMessage, 
        isUpdating: false 
      });
      handleError(errorMessage);
      return undefined;
    }
  }, [state.transfers, updateState, handleSuccess, handleError]);

  // Delete transfer
  const deleteTransfer = useCallback(async (id: number): Promise<boolean> => {
    try {
      updateState({ isDeleting: true, error: null });
      
      await apiClient.transfers.delete(id);
      
      // Remove from local state
      const filteredTransfers = state.transfers.filter(transfer => transfer.id !== id);
      updateState({
        transfers: filteredTransfers,
        isDeleting: false
      });
      
      handleSuccess('Transfer deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transfer';
      updateState({ 
        error: errorMessage, 
        isDeleting: false 
      });
      handleError(errorMessage);
      return false;
    }
  }, [state.transfers, updateState, handleSuccess, handleError]);

  // Find transfer by ID in local state
  const findTransferById = useCallback((id: number): Transfer | undefined => {
    return state.transfers.find(transfer => transfer.id === id);
  }, [state.transfers]);

  // Get transfers by account (either from or to account)
  const getTransfersByAccount = useCallback((accountId: number): Transfer[] => {
    return state.transfers.filter(transfer => 
      transfer.from_account === accountId || transfer.to_account === accountId
    );
  }, [state.transfers]);

  // Calculate total transfer amount
  const getTotalTransferAmount = useCallback((): number => {
    return state.transfers.reduce((total, transfer) => {
      return total + parseFloat(transfer.amount);
    }, 0);
  }, [state.transfers]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
  if (autoFetch) {
    fetchTransfers(initialFilters);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoFetch]); 

  return {
    // State
    transfers: state.transfers,
    isLoading: state.isLoading,
    error: state.error,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    
    // CRUD Operations
    fetchTransfers,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    getTransferById,
    
    // Utility functions
    refreshTransfers,
    clearError,
    
    // Helper functions
    findTransferById,
    getTransfersByAccount,
    getTotalTransferAmount,
  };
};

// Hook variant that doesn't auto-fetch
export const useTransfersLazy = (
  initialFilters?: TransferFilters,
  callbacks?: {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }
) => {
  return useTransfers(false, initialFilters, callbacks);
};

// Hook for single transfer management
export const useTransfer = (
  transferId?: number,
  callbacks?: {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }
) => {
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfer = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTransfer = await apiClient.transfers.getById(id);
      setTransfer(fetchedTransfer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transfer';
      setError(errorMessage);
      callbacks?.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callbacks]);

  useEffect(() => {
    if (transferId) {
      fetchTransfer(transferId);
    }
  }, [transferId, fetchTransfer]);

  return {
    transfer,
    isLoading,
    error,
    fetchTransfer,
    clearError: () => setError(null),
  };
};

export default useTransfers;