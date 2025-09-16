import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Account, CreateAccountData, UpdateAccountData, AccountFilters } from '@/types/auth';

export const useAccounts = (filters?: AccountFilters) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.accounts.getAll(filters);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching accounts');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const createAccount = async (data: CreateAccountData): Promise<Account | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const newAccount = await apiClient.accounts.create(data);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating account');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccount = async (id: number, data: UpdateAccountData): Promise<Account | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedAccount = await apiClient.accounts.update(id, data);
      setAccounts(prev => 
        prev.map(account => account.id === id ? updatedAccount : account)
      );
      return updatedAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating account');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (id: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.accounts.delete(id);
      setAccounts(prev => prev.filter(account => account.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting account');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccounts = useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
  };
};