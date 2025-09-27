'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { apiClient } from '@/lib/api';
import {
  Box,
  Card,
  Grid,
  HStack,
  Text,
  VStack,
  Spinner,
  Alert,
  Stat,
  FormatNumber,
  Table,
  Badge,
  Flex,
  Heading,
} from '@chakra-ui/react';
import { Chart, useChart } from "@chakra-ui/charts";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { 
  LuWallet, 
  LuCreditCard, 
  LuTrendingUp, 
  LuTrendingDown,
  LuActivity,
} from "react-icons/lu";
import { Account, Category } from '@/types/auth';

// Helper interfaces for dashboard data
interface DashboardMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
}

interface CategorySummary {
  category: Category;
  total: number;
  count: number;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const {
    transactionsWithDetails,
    loading: loadingTransactions,
    error: transactionsError,
  } = useTransactions();

  const {
    isLoading: loadingCategories,
    error: categoriesError,
  } = useCategories();

  // Load accounts data
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const accountsData = await apiClient.accounts.getAll();
        setAccounts(accountsData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load accounts';
        setAccountsError(errorMessage);
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

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

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    // Account-based calculations
    const totalAssets = accounts
      .filter(account => parseFloat(account.balance) > 0)
      .reduce((sum, account) => sum + parseFloat(account.balance), 0);

    const totalLiabilities = Math.abs(accounts
      .filter(account => parseFloat(account.balance) < 0)
      .reduce((sum, account) => sum + parseFloat(account.balance), 0));

    const netWorth = totalAssets - totalLiabilities;

    // Transaction-based calculations (current month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthTransactions = transactionsWithDetails.filter(transaction => {
      const [year, month, day] = transaction.date.split('-').map(Number);
      const transactionDate = new Date(year, month - 1, day);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(transaction => transaction.category?.type === 'INCOME')
      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(transaction => transaction.category?.type === 'EXPENSE')
      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);

    const monthlyCashFlow = monthlyIncome - monthlyExpenses;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyCashFlow,
    };
  }, [accounts, transactionsWithDetails]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return transactionsWithDetails
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactionsWithDetails]);

  // Calculate top expense categories for current month
  const topExpenseCategories = useMemo((): CategorySummary[] => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthExpenses = transactionsWithDetails.filter(transaction => {
      const [year, month, day] = transaction.date.split('-').map(Number);
      const transactionDate = new Date(year, month - 1, day);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             transaction.category?.type === 'EXPENSE';
    });

    const categoryTotals = new Map<number, { category: Category; total: number; count: number }>();

    currentMonthExpenses.forEach(transaction => {
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
      .sort((a, b) => b.total - a.total)
  }, [transactionsWithDetails]);

  // Transform data for the chart
  const expenseChartData = useMemo(() => {
    return topExpenseCategories.map((item, index) => ({
      name: item.category.name,
      value: item.total,
      count: item.count,
      color: getColorForIndex(index),
    }));
  }, [topExpenseCategories]);

  const expenseChart = useChart({
    data: expenseChartData,
  });

  // Loading state
  if (loadingAccounts || loadingTransactions || loadingCategories) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  // Error state
  if (accountsError || transactionsError || categoriesError) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error!</Alert.Title>
        <Alert.Description>
          {accountsError || transactionsError || categoriesError}
        </Alert.Description>
      </Alert.Root>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      {/* Header */}
      <VStack align="start" mb={8}>
        <Heading>
          Dashboard
        </Heading>
        <Text fontSize="md" color="gray.600" _dark={{ color: 'gray.400' }}>
          Overview of your financial status
        </Text>
      </VStack>

      {/* Main Metrics Cards */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap={6} mb={8}>
        {/* Total Assets */}
        <Card.Root>
          <Card.Body>
            <Stat.Root>
              <HStack justify="space-between">
                <VStack align="start">
                  <HStack>
                    <Box p={3} borderRadius="lg" bg="green.50" _dark={{ bg: 'green.900' }}>
                      <LuWallet color="#059669" size={24} />
                    </Box>
                    <Stat.Label>Total Assets</Stat.Label>
                  </HStack>
                  <Stat.ValueText>
                    <FormatNumber
                      value={dashboardMetrics.totalAssets}
                      style="currency"
                      currency="USD"
                    />
                  </Stat.ValueText>
                </VStack>
              </HStack>
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        {/* Total Liabilities */}
        <Card.Root>
          <Card.Body>
            <Stat.Root>
              <HStack justify="space-between">
                <VStack align="start">
                  <HStack>
                    <Box p={3} borderRadius="lg" bg="red.50" _dark={{ bg: 'red.900' }}>
                      <LuCreditCard color="#dc2626" size={24} />
                    </Box>
                    <Stat.Label>Total Liabilities</Stat.Label>
                  </HStack>
                  <Stat.ValueText>
                    <FormatNumber
                      value={dashboardMetrics.totalLiabilities}
                      style="currency"
                      currency="USD"
                    />
                  </Stat.ValueText>
                </VStack>
              </HStack>
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        {/* Net Worth */}
        <Card.Root>
          <Card.Body>
            <Stat.Root>
              <HStack justify="space-between">
                <VStack align="start">
                  <HStack>
                    <Box p={3} borderRadius="lg" bg="blue.50" _dark={{ bg: 'blue.900' }}>
                      <LuTrendingUp color="#2563eb" size={24} />
                    </Box>
                    <Stat.Label>Net Worth</Stat.Label>
                  </HStack>
                  <HStack>
                    <Stat.ValueText>
                      <FormatNumber
                        value={dashboardMetrics.netWorth}
                        style="currency"
                        currency="USD"
                      />
                    </Stat.ValueText>
                    {dashboardMetrics.netWorth >= 0 ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
                  </HStack>
                </VStack>
              </HStack>
            </Stat.Root>
          </Card.Body>
        </Card.Root>

        {/* Monthly Cash Flow */}
        <Card.Root>
          <Card.Body>
            <Stat.Root>
              <HStack justify="space-between">
                <VStack align="start">
                  <HStack>
                    <Box p={3} borderRadius="lg" bg="purple.50" _dark={{ bg: 'purple.900' }}>
                      <LuActivity color="#7c3aed" size={24} />
                    </Box>
                    <Stat.Label>Monthly Cash Flow</Stat.Label>
                  </HStack>
                  <HStack>
                    <Stat.ValueText>
                      <FormatNumber
                        value={dashboardMetrics.monthlyCashFlow}
                        style="currency"
                        currency="USD"
                      />
                    </Stat.ValueText>
                    {dashboardMetrics.monthlyCashFlow >= 0 ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
                  </HStack>
                </VStack>
              </HStack>
            </Stat.Root>
          </Card.Body>
        </Card.Root>
      </Grid>

      {/* Transaction Analysis */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mb={8}>
        {/* Monthly Transaction Analysis */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="semibold">
              Monthly Analysis
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Current month transaction breakdown
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <HStack>
                  <Box w={3} h={3} borderRadius="sm" bg="green.500" />
                  <Text fontSize="sm">Total Income</Text>
                </HStack>
                <Text fontWeight="medium">
                  <FormatNumber
                    value={dashboardMetrics.monthlyIncome}
                    style="currency"
                    currency="USD"
                  />
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <HStack>
                  <Box w={3} h={3} borderRadius="sm" bg="red.500" />
                  <Text fontSize="sm">Total Expenses</Text>
                </HStack>
                <Text fontWeight="medium">
                  <FormatNumber
                    value={dashboardMetrics.monthlyExpenses}
                    style="currency"
                    currency="USD"
                  />
                </Text>
              </HStack>
              
              <Box borderTop="1px solid" borderColor="gray.200" _dark={{ borderColor: 'gray.700' }} pt={3}>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Net Savings</Text>
                  <HStack>
                    <Text fontWeight="bold" color={dashboardMetrics.monthlyCashFlow >= 0 ? 'green.500' : 'red.500'}>
                      <FormatNumber
                        value={dashboardMetrics.monthlyCashFlow}
                        style="currency"
                        currency="USD"
                      />
                    </Text>
                    {dashboardMetrics.monthlyCashFlow >= 0 ? <LuTrendingUp color="#059669" size={16} /> : <LuTrendingDown color="#dc2626" size={16} />}
                  </HStack>
                </HStack>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Accounts Overview */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="semibold">
              Accounts Overview
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Current balance of all accounts
            </Text>
          </Card.Header>
          <Card.Body>
            {accounts.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No accounts found
              </Text>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Account</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Balance</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {accounts.map((account) => (
                    <Table.Row key={account.id}>
                      <Table.Cell>
                        <HStack>
                          <Text fontWeight="medium">{account.name}</Text>
                          <Badge 
                            size="sm" 
                            borderRadius="md"
                            colorPalette={parseFloat(account.balance) >= 0 ? 'green' : 'red'}
                          >
                            {parseFloat(account.balance) >= 0 ? 'Asset' : 'Liability'}
                          </Badge>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <Text 
                          fontWeight="medium"
                          color={parseFloat(account.balance) >= 0 ? 'green.500' : 'red.500'}
                        >
                          <FormatNumber
                            value={parseFloat(account.balance)}
                            style="currency"
                            currency="USD"
                          />
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Card.Body>
        </Card.Root>
      </Grid>
      
      {/* Bottom Section */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        {/* Recent Transactions */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="semibold">
              Recent Transactions
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Latest financial activity
            </Text>
          </Card.Header>
          <Card.Body>
            {recentTransactions.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No transactions found
              </Text>
            ) : (
              <VStack gap={3} align="stretch">
                {recentTransactions.map((transaction) => (
                  <HStack key={transaction.id} justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {transaction.description || 'No description'}
                      </Text>
                      <HStack gap={2}>
                        <Text fontSize="xs" color="gray.500">
                          {transaction.date}
                        </Text>
                        {transaction.category && (
                          <Badge 
                            size="sm" 
                            borderRadius="md"
                            colorPalette={transaction.category.type === 'INCOME' ? 'green' : 'red'}
                          >
                            {transaction.category.name}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                    <VStack align="end" gap={1}>
                      <Text 
                        fontSize="sm" 
                        fontWeight="medium"
                        color={transaction.category?.type === 'INCOME' ? 'green.500' : 'red.500'}
                      >
                        <FormatNumber
                          value={parseFloat(transaction.amount)}
                          style="currency"
                          currency="USD"
                        />
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {transaction.account?.name}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            )}
          </Card.Body>
        </Card.Root>
        
        {/* Monthly Expense Categories with Pie Chart */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="semibold">
              Monthly Expense Categories
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              All spending categories for this month
            </Text>
          </Card.Header>
          <Card.Body>
            {topExpenseCategories.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No expense data for this month
              </Text>
            ) : (
              <VStack gap={4} align="stretch">
                {/* Pie Chart */}
                <Chart.Root height="300px" mx="auto" chart={expenseChart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        cursor={false}
                        animationDuration={100}
                        content={<Chart.Tooltip hideLabel />}
                      />
                      <Pie
                        data={expenseChart.data}
                        dataKey={expenseChart.key("value")}
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={0}
                        paddingAngle={2}
                        isAnimationActive={true}
                        animationDuration={1000}
                      >
                        {expenseChart.data.map((item) => (
                          <Cell 
                            key={item.name} 
                            fill={expenseChart.color(item.color)} 
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
                  {topExpenseCategories.map((item, index) => (
                    <HStack key={item.category.id} justify="space-between">
                      <HStack>
                        <Box 
                          w={3} 
                          h={3} 
                          borderRadius="sm"
                          bg={expenseChart.color(getColorForIndex(index))}
                        />
                        <Text fontSize="sm">
                          {item.category.name}
                        </Text>
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
      </Grid>
    </Box>
  );
}