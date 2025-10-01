'use client';

import React, { useState, useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import {
  Box,
  Button,
  Badge,
  CloseButton,
  ButtonGroup,
  Dialog,
  Portal,
  Drawer,
  EmptyState,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  VStack,
  useDisclosure,
  Alert,
  Table,
  Fieldset,
  Field,
  RadioGroup,
  Heading,
  Spacer,
  Card,
  FormatNumber,
  createListCollection,
  Select
} from '@chakra-ui/react';
import { Chart, useChart } from "@chakra-ui/charts";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { 
  LuCirclePlus, 
  LuPencil, 
  LuTrash2, 
  LuTags,
  LuChartPie,
  LuCalendar,
} from "react-icons/lu";
import { CreateCategoryData, UpdateCategoryData, CategoryType, Category } from '@/types/auth';

// Period filter type
type PeriodFilter = 'all' | 'yearly' | 'monthly' | 'weekly' | 'daily' | 'custom';

interface CategoryWithTotal extends Category {
  total: number;
  count: number;
}

// Chart data interface
interface ChartDataItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

export default function Categories() {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { open, onOpen, onClose } = useDisclosure();
  const { 
    open: dateFilterOpen, 
    onOpen: onDateFilterOpen, 
    onClose: onDateFilterClose 
  } = useDisclosure();

  const {
    incomeCategories,
    expenseCategories,
    isLoading: loadingCategories,
    error: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    transactionsWithDetails,
    loading: loadingTransactions,
    error: transactionsError,
  } = useTransactions();

  // Collection for period select
  const periodCollection = createListCollection({
    items: [
      { label: 'All Time', value: 'all' },
      { label: 'This Year', value: 'yearly' },
      { label: 'This Month', value: 'monthly' },
      { label: 'This Week', value: 'weekly' },
      { label: 'Today', value: 'daily' },
      { label: 'Custom Range', value: 'custom' },
    ],
  });

  // Helper function to get consistent colors for categories
  const getColorForIndex = (index: number): string => {
    const colors = [
      "purple.500",
      "cyan.500",
      "blue.500",
      "teal.500",
      "green.500",
      "yellow.500",
      "orange.500",
      "pink.500",
      "red.500",
      "gray.500",
    ];
    return colors[index % colors.length];
  };

  // Handle period change
  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    if (value === 'custom') {
      onDateFilterOpen();
    }
  };

  // Apply custom date range
  const applyCustomDateRange = () => {
    if (startDate && endDate) {
      onDateFilterClose();
    }
  };

  // Reset custom date range
  const resetCustomDateRange = () => {
    setStartDate('');
    setEndDate('');
    setPeriodFilter('all');
    onDateFilterClose();
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return transactionsWithDetails.filter(transaction => {
      const [year, month, day] = transaction.date.split('-').map(Number);
      const transactionDate = new Date(year, month - 1, day);

      switch (periodFilter) {
        case 'daily':
          return transactionDate >= startOfDay;
        case 'weekly':
          return transactionDate >= startOfWeek;
        case 'monthly':
          return transactionDate >= startOfMonth;
        case 'yearly':
          return transactionDate >= startOfYear;
        case 'custom':
          if (startDate && endDate) {
            const customStartDate = new Date(startDate);
            const customEndDate = new Date(endDate);
            customEndDate.setHours(23, 59, 59, 999); // Include the entire end date
            return transactionDate >= customStartDate && transactionDate <= customEndDate;
          }
          return true;
        case 'all':
        default:
          return true;
      }
    });
  }, [transactionsWithDetails, periodFilter, startDate, endDate]);

  // Calculate category totals
  const categoriesWithTotals = useMemo((): CategoryWithTotal[] => {
    const categoryTotals = new Map<number, { category: Category; total: number; count: number }>();

    filteredTransactions.forEach(transaction => {
      if (transaction.category) {
        const existing = categoryTotals.get(transaction.category.id);
        if (existing) {
          existing.total += parseFloat(transaction.amount);
          existing.count += 1;
        } else {
          categoryTotals.set(transaction.category.id, {
            category: transaction.category,
            total: parseFloat(transaction.amount),
            count: 1,
          });
        }
      }
    });

    return Array.from(categoryTotals.values())
      .map(item => ({
        ...item.category,
        total: item.total,
        count: item.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  // Separate income and expense categories with totals
  const incomeCategoriesWithTotals = useMemo(() => 
    categoriesWithTotals.filter(cat => cat.type === 'INCOME'),
    [categoriesWithTotals]
  );

  const expenseCategoriesWithTotals = useMemo(() => 
    categoriesWithTotals.filter(cat => cat.type === 'EXPENSE'),
    [categoriesWithTotals]
  );

  // Chart data for income categories
  const incomeChartData = useMemo((): ChartDataItem[] => {
    return incomeCategoriesWithTotals.map((item, index) => ({
      name: item.name,
      value: item.total,
      count: item.count,
      color: getColorForIndex(index),
    }));
  }, [incomeCategoriesWithTotals]);

  // Chart data for expense categories
  const expenseChartData = useMemo((): ChartDataItem[] => {
    return expenseCategoriesWithTotals.map((item, index) => ({
      name: item.name,
      value: item.total,
      count: item.count,
      color: getColorForIndex(index),
    }));
  }, [expenseCategoriesWithTotals]);

  const incomeChart = useChart<ChartDataItem>({
    data: incomeChartData,
  });

  const expenseChart = useChart<ChartDataItem>({
    data: expenseChartData,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !type) {
      return;
    }

    try {
      const data: CreateCategoryData | UpdateCategoryData = {
        name: name.trim(),
        type: type as CategoryType,
      };

      if (editingId) {
        await updateCategory(editingId, data);
        setEditingId(null);
      } else {
        await createCategory(data as CreateCategoryData);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setType('');
    setEditingId(null);
  };

  const handleEdit = (category: typeof incomeCategories[0] | typeof expenseCategories[0]) => {
    setName(category.name);
    setType(category.type);
    setEditingId(category.id);
    onOpen();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Format custom date range display
  const getCustomDateRangeText = () => {
    if (periodFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const end = new Date(endDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${start} - ${end}`;
    }
    return '';
  };

  if (loadingCategories || loadingTransactions) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  if (categoriesError || transactionsError) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error!</Alert.Title>
        <Alert.Description>{categoriesError || transactionsError}</Alert.Description>
      </Alert.Root>
    );
  }

  const renderCategoryTable = (
    categories: typeof incomeCategories, 
    title: string, 
    colorPalette: 'green' | 'red'
  ) => (
    <Box>
      <VStack align="start" mb={4}>
        <Text fontSize="xl" fontWeight="semibold">
          {title}
        </Text>
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </Text>
      </VStack>

      {categories.length === 0 ? (
        <EmptyState.Root
          border="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.800' }}
          p={8}
          borderRadius="md"
          size="sm"
        >
          <EmptyState.Indicator>
            <LuTags color={colorPalette === 'green' ? '#4DE3AF' : '#dc2626'} />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title fontSize="md">No {title.toLowerCase()} categories</EmptyState.Title>
            <EmptyState.Description fontSize="sm">
              Add your first {title.toLowerCase()} category to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Root>
      ) : (
        <Table.Root size="md" stickyHeader>
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>Category Name</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {categories.map((category) => (
              <Table.Row key={category.id}>
                <Table.Cell>
                  <HStack>
                    <Badge borderRadius="md" colorPalette={colorPalette}>
                      {category.name}
                    </Badge>
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <HStack justify="end">
                    <IconButton 
                      onClick={() => handleEdit(category)}
                      variant="ghost"
                      size="sm"
                      aria-label="Edit category"
                    >
                      <LuPencil color="#4DE3AF" />
                    </IconButton>
                    <Dialog.Root>
                      <Dialog.Trigger asChild>
                        <IconButton 
                          variant="ghost"
                          size="sm"
                          aria-label="Delete category"
                        > 
                          <LuTrash2 color="#dc2626" />
                        </IconButton>
                      </Dialog.Trigger>
                      <Portal>
                        <Dialog.Backdrop />
                        <Dialog.Positioner>
                          <Dialog.Content _dark={{ bg: 'gray.900' }}>
                            <Dialog.Header>
                              <Dialog.Title>Delete Category</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                              <p>
                                {`Are you sure you want to delete the category "${category.name}"? 
                                This action cannot be undone and may affect existing transactions.`}
                              </p>
                            </Dialog.Body>
                            <Dialog.Footer>
                              <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </Dialog.ActionTrigger>
                              <Button
                                onClick={() => handleDelete(category.id)}
                                colorPalette="red"
                              >
                                Delete
                              </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                              <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                          </Dialog.Content>
                        </Dialog.Positioner>
                      </Portal>
                    </Dialog.Root>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );

  const renderCategoryChart = (
    categoriesData: CategoryWithTotal[],
    chart: ReturnType<typeof useChart<ChartDataItem>>,
    title: string,
    colorPalette: 'green' | 'red'
  ) => (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <VStack align="start">
            <Text fontSize="lg" fontWeight="semibold">
              {title}
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Transaction breakdown by category
            </Text>
          </VStack>
          <Box p={3} borderRadius="lg" bg={`${colorPalette}.50`} _dark={{ bg: `${colorPalette}.900` }}>
            <LuChartPie color={colorPalette === 'green' ? '#059669' : '#dc2626'} size={24} />
          </Box>
        </HStack>
      </Card.Header>
      <Card.Body>
        {categoriesData.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
            No transaction data for this period
          </Text>
        ) : (
          <VStack gap={4} align="stretch">
            {/* Pie Chart */}
            <Chart.Root height="300px" mx="auto" chart={chart}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    cursor={false}
                    animationDuration={100}
                    content={<Chart.Tooltip hideLabel />}
                  />
                  <Pie
                    data={chart.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={0}
                    paddingAngle={2}
                    isAnimationActive={true}
                    animationDuration={1000}
                  >
                    {chart.data.map((item) => (
                      <Cell 
                        key={item.name} 
                        fill={chart.color(item.color)} 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Chart.Root>

            {/* Summary List */}
            <VStack gap={2} align="stretch" mt={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: 'gray.300' }}>
                Category Details:
              </Text>
              {categoriesData.map((item, index) => (
                <HStack key={item.id} justify="space-between">
                  <HStack>
                    <Box 
                      w={3} 
                      h={3} 
                      borderRadius="sm"
                      bg={chart.color(getColorForIndex(index))}
                    />
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm">
                        {item.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontWeight="medium" fontSize="sm">
                    <FormatNumber
                      value={item.total}
                      style="currency"
                      currency="USD"
                    />
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  );

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <HStack>
        <VStack align="start" mb={6}>
          <Heading>
            Categories
          </Heading>
          <Text fontSize="md">
            Organize your transactions with custom categories
          </Text>
        </VStack>
        <Spacer />
        {/* Add Category Button */}
        <Box mb={6}>
          <Flex justify="flex-end">
            <Button onClick={onOpen} size={{ base: "xs", md: "sm", lg: "md" }}>
              <LuCirclePlus color='#4DE3AF' />
                Add Category
            </Button>
          </Flex>
        </Box>
      </HStack>

      {/* Period Filter */}
      <Box mb={6}>
        <HStack wrap="wrap" gap={4}>
          <Select.Root 
            collection={periodCollection}
            value={[periodFilter]}
            onValueChange={(e) => handlePeriodChange(e.value[0] as PeriodFilter)}
            size="sm" 
            width="200px"
          >
            <Select.Label>Period:</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select period" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {periodCollection.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          {/* Custom Date Range Display */}
          {periodFilter === 'custom' && startDate && endDate && (
            <HStack>
              <Badge colorPalette="blue" size="lg" borderRadius="md">
                <HStack>
                  <LuCalendar size={14} />
                  <Text fontSize="sm">{getCustomDateRangeText()}</Text>
                </HStack>
              </Badge>
              <IconButton
                size="xs"
                variant="ghost"
                onClick={() => onDateFilterOpen()}
                aria-label="Edit date range"
              >
                <LuPencil size={14} />
              </IconButton>
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Analytics Charts */}
      <Grid 
        templateColumns={{ base: '1fr', lg: '1fr 1fr' }} 
        gap={6}
        mb={8}
      >
        {/* Income Chart */}
        {renderCategoryChart(
          incomeCategoriesWithTotals,
          incomeChart,
          'Income Analytics',
          'green'
        )}
        
        {/* Expense Chart */}
        {renderCategoryChart(
          expenseCategoriesWithTotals,
          expenseChart,
          'Expense Analytics',
          'red'
        )}
      </Grid>

      {/* Categories Tables */}
      <Grid 
        templateColumns={{ base: '1fr', lg: '1fr 1fr' }} 
        gap={8}
      >
        {/* Income Categories */}
        {renderCategoryTable(incomeCategories, 'Income Categories', 'green')}
        
        {/* Expense Categories */}
        {renderCategoryTable(expenseCategories, 'Expense Categories', 'red')}
      </Grid>

      {/* Custom Date Range Dialog */}
      <Dialog.Root open={dateFilterOpen} onOpenChange={(e) => !e.open && onDateFilterClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content _dark={{ bg: 'gray.900' }}>
              <Dialog.Header>
                <Dialog.Title>Custom Date Range</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Field.Root>
                    <Field.Label>Start Date</Field.Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined}
                    />
                  </Field.Root>
                  
                  <Field.Root>
                    <Field.Label>End Date</Field.Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                    />
                  </Field.Root>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <ButtonGroup>
                  <Button 
                    variant="outline" 
                    onClick={resetCustomDateRange}
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={applyCustomDateRange}
                    disabled={!startDate || !endDate}
                  >
                    Apply
                  </Button>
                </ButtonGroup>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Add/Edit Category Drawer */}
      <Drawer.Root open={open} onOpenChange={(e) => !e.open && handleCancel()}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <VStack align="start">
                  <Drawer.Title>
                    {editingId ? 'Edit Category' : 'Add New Category'}
                  </Drawer.Title>
                  <Text fontSize="sm">
                    {editingId ? 'Update category details' : 'Create a new category for your transactions'}
                  </Text>
                </VStack>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>

            <Drawer.Body>
              <Box as="form" onSubmit={handleSubmit} id="category-form">
                <Fieldset.Root size="lg" maxW="md">
                  <Stack gap={5}>
                    <Fieldset.Legend>Category Details</Fieldset.Legend>
                    
                    <Field.Root>
                      <Field.Label>Category Name</Field.Label>
                      <Input
                        placeholder="Enter category name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Field.Root>
                    
                    <Field.Root>
                      <Field.Label>Category Type</Field.Label>
                      <RadioGroup.Root 
                        value={type} 
                        onValueChange={(value) => setType(value.value as CategoryType | '')}
                      >
                        <HStack
                          gap="6"
                          border="1px solid"
                          borderColor="gray.200"
                          _dark={{ borderColor: 'gray.800' }}
                          p={4}
                          borderRadius="md"
                        >
                          <RadioGroup.Item value="INCOME">
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText>Income</RadioGroup.ItemText>
                          </RadioGroup.Item>
                          <RadioGroup.Item value="EXPENSE">
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText>Expense</RadioGroup.ItemText>
                          </RadioGroup.Item>
                        </HStack>
                      </RadioGroup.Root>
                    </Field.Root>
                  </Stack>
                </Fieldset.Root>
              </Box>
            </Drawer.Body>
            
            <Drawer.Footer>
              <ButtonGroup>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="category-form"
                  disabled={!name.trim() || !type}
                >
                  {editingId ? 'Update' : 'Add'}
                </Button>
              </ButtonGroup>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}