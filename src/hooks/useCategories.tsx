import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Category, 
  CreateCategoryData, 
  UpdateCategoryData, 
  CategoryFilters,
  CategoryType,
  LoadingState 
} from '@/types/auth';

// Hook state interface
interface UseCategoriesState extends LoadingState {
  categories: Category[];
}

// Hook return type
interface UseCategoriesReturn {
  // State
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  incomeCategories: Category[];
  expenseCategories: Category[];
  categoriesById: Record<number, Category>;
  
  // Actions
  fetchCategories: (filters?: CategoryFilters) => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<Category>;
  updateCategory: (id: number, data: UpdateCategoryData) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  refreshCategories: () => Promise<void>;
  
  // Utilities
  getCategoryById: (id: number) => Category | undefined;
  getCategoriesByType: (type: CategoryType) => Category[];
  clearError: () => void;
}

/**
 * Custom hook for managing categories data and operations
 * Provides CRUD operations, filtering, and computed values for categories
 */
export const useCategories = (
  initialFilters?: CategoryFilters,
  autoFetch: boolean = true
): UseCategoriesReturn => {
  // State management
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    isLoading: false,
    error: null,
  });

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Update categories in state
  const setCategories = useCallback((categories: Category[]) => {
    setState(prev => ({ ...prev, categories }));
  }, []);

  /**
   * Fetch categories from API with optional filters
   */
  const fetchCategories = useCallback(async (filters?: CategoryFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const categories = await apiClient.categories.getAll(filters);
      setCategories(categories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCategories]);

  /**
   * Create a new category
   */
  const createCategory = useCallback(async (data: CreateCategoryData): Promise<Category> => {
    try {
      setLoading(true);
      setError(null);

      const newCategory = await apiClient.categories.create(data);
      
      // Update local state with new category
      setState(prev => ({
        ...prev,
        categories: [newCategory, ...prev.categories].sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return newCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Update an existing category
   */
  const updateCategory = useCallback(async (id: number, data: UpdateCategoryData): Promise<Category> => {
    try {
      setLoading(true);
      setError(null);

      const updatedCategory = await apiClient.categories.update(id, data);
      
      // Update local state
      setState(prev => ({
        ...prev,
        categories: prev.categories
          .map(category => category.id === id ? updatedCategory : category)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return updatedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Delete a category
   */
  const deleteCategory = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.categories.delete(id);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(category => category.id !== id),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Refresh categories (re-fetch with current filters)
   */
  const refreshCategories = useCallback(async () => {
    await fetchCategories(initialFilters);
  }, [fetchCategories, initialFilters]);

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback((id: number): Category | undefined => {
    return state.categories.find(category => category.id === id);
  }, [state.categories]);

  /**
   * Get categories filtered by type
   */
  const getCategoriesByType = useCallback((type: CategoryType): Category[] => {
    return state.categories.filter(category => category.type === type);
  }, [state.categories]);

  // Computed values using useMemo for performance
  const incomeCategories = useMemo(() => 
    getCategoriesByType('INCOME'), 
    [getCategoriesByType]
  );

  const expenseCategories = useMemo(() => 
    getCategoriesByType('EXPENSE'), 
    [getCategoriesByType]
  );

  const categoriesById = useMemo(() => 
    state.categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<number, Category>), 
    [state.categories]
  );

  // Auto-fetch categories on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchCategories(initialFilters);
    }
  }, [fetchCategories, initialFilters, autoFetch]);

  return {
    // State
    categories: state.categories,
    isLoading: state.isLoading,
    error: state.error,
    
    // Computed values
    incomeCategories,
    expenseCategories,
    categoriesById,
    
    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    
    // Utilities
    getCategoryById,
    getCategoriesByType,
    clearError,
  };
};