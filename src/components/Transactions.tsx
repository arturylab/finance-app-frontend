'use client';

import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { apiClient } from '@/lib/api';
import {
  Box,
  Button,
  Badge,
  Card,
  CloseButton,
  ButtonGroup,
  Dialog,
  Portal,
  Drawer,
  EmptyState,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  VStack,
  useDisclosure,
  Alert,
  Stat,
  FormatNumber,
  Table,
  Fieldset,
  Field,
  NativeSelectField,
  NativeSelectRoot,
  Textarea,
} from '@chakra-ui/react';
import { 
  LuCirclePlus, 
  LuPencil, 
  LuTrash2, 
  LuReceipt,
} from "react-icons/lu";
import { Account, Category, CreateTransactionData, UpdateTransactionData } from '@/types/auth';

export default function Transactions() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(true);
  
  const { open, onOpen, onClose } = useDisclosure();

  const {
    transactionsWithDetails,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  // Load accounts and categories
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          apiClient.accounts.getAll(),
          apiClient.categories.getAll()
        ]);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load support data:', error);
      } finally {
        setLoadingSupport(false);
      }
    };

    loadSupportData();
  }, []);

  // Set today's date as default when opening drawer for new transaction
  useEffect(() => {
    if (open && !editingId) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [open, editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountId || amount === '' || !date) {
      return;
    }

    try {
      const data: CreateTransactionData | UpdateTransactionData = {
        account: Number(accountId),
        category: categoryId ? Number(categoryId) : null,
        amount,
        description: description,
        ...(date && { date }), // Include date if provided
      };

      if (editingId) {
        await updateTransaction(editingId, data);
        setEditingId(null);
      } else {
        await createTransaction(data as CreateTransactionData);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setAccountId('');
    setCategoryId('');
    setDate('');
    setEditingId(null);
  };

  const handleEdit = (transaction: typeof transactionsWithDetails[0]) => {
    setAmount(transaction.amount);
    setDescription(transaction.description);
    setAccountId(transaction.account ? transaction.account.id : '');
    setCategoryId(transaction.category ? transaction.category.id : '');
    // Format date to YYYY-MM-DD for input
    const formattedDate = transaction.date ? transaction.date.split('T')[0] : '';
    setDate(formattedDate);
    setEditingId(transaction.id);
    onOpen();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (loading || loadingSupport) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error!</Alert.Title>
        <Alert.Description>{error}</Alert.Description>
      </Alert.Root>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <VStack align="start" mb={6}>
        <Text fontSize="md">
          Track your income and expenses
        </Text>
      </VStack>

      {/* Add Transaction Button */}
      <Box mb={6}>
        <Flex justify="flex-end">
          <Button onClick={onOpen}>
            <LuCirclePlus color='#4DE3AF' />
            Add Transaction
          </Button>
        </Flex>
      </Box>

      {/* Transactions List or Empty State */}
      {transactionsWithDetails.length === 0 ? (
        <EmptyState.Root
          border="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.800' }}
          p={10}
          borderRadius="md"
        >
          <EmptyState.Indicator>
            <LuReceipt color='#4DE3AF' />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No transactions yet</EmptyState.Title>
            <EmptyState.Description>
              Start tracking your finances by adding your first transaction
            </EmptyState.Description>
          </VStack>
        </EmptyState.Root>
      ) : (
        <>
          {/* Desktop table */}
          <Box display={{ base: "none", md: "block" }}>
            <Table.Root size="md" stickyHeader>
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                  <Table.ColumnHeader>Category</Table.ColumnHeader>
                  <Table.ColumnHeader>Account</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transactionsWithDetails.map((transaction) => (
                  <Table.Row key={transaction.id}>
                    <Table.Cell>
                      {transaction.date}
                    </Table.Cell>
                    <Table.Cell>
                      <Text>
                        {transaction.description || 'No description'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {transaction.category && (
                        <Badge
                        borderRadius="md"
                        colorPalette={transaction.category.type === 'INCOME' ? 'green' : 'red'}
                        >
                          {transaction.category.name}
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text>
                        {transaction.account?.name || 'Unknown Account'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <Stat.Root>
                        <HStack justify="end">
                          <Text>
                            <FormatNumber
                              value={parseFloat(transaction.amount)}
                              style="currency"
                              currency="USD"
                            />
                          </Text>
                          {transaction.category?.type === 'INCOME' ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
                        </HStack>
                      </Stat.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack justify={"end"}>
                        <IconButton 
                          onClick={() => handleEdit(transaction)}
                          variant="ghost"
                          size="sm"
                          aria-label="Edit transaction"
                        >
                          <LuPencil color="#4DE3AF" />
                        </IconButton>
                        <Dialog.Root>
                          <Dialog.Trigger asChild>
                            <IconButton 
                              variant="ghost"
                              size="sm"
                              aria-label="Delete transaction"
                            > 
                              <LuTrash2 color="#dc2626" />
                            </IconButton>
                          </Dialog.Trigger>
                          <Portal>
                            <Dialog.Backdrop />
                            <Dialog.Positioner>
                              <Dialog.Content _dark={{ bg: 'gray.900' }}>
                                <Dialog.Header>
                                  <Dialog.Title>Delete Transaction</Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                  <p>
                                    Are you sure you want to delete this transaction? This action cannot be undone.
                                  </p>
                                </Dialog.Body>
                                <Dialog.Footer>
                                  <Dialog.ActionTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </Dialog.ActionTrigger>
                                  <Button
                                    onClick={() => handleDelete(transaction.id)}
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
          </Box>

          {/* Mobile Card */}
          <Box display={{ base: "block", md: "none" }}>
            <VStack gap={3}>
              {transactionsWithDetails.map((transaction) => (
                <Card.Root key={transaction.id} w="full" size="sm" variant="outline">
                  <Card.Body p={4}>
                    <Table.Root size="sm">
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell p={0} border="none">
                            <HStack gap={2} wrap="wrap">
                              <Text fontSize="sm" fontWeight="medium">
                                {transaction.description || 'No description'}
                              </Text>
                              <Text fontSize="xs">
                                {transaction.date}
                              </Text>
                              {transaction.category && (
                                <Badge
                                  borderRadius="md"
                                  colorPalette={transaction.category.type === 'INCOME' ? 'green' : 'red'}
                                >
                                  {transaction.category.name}
                                </Badge>
                              )}
                              <Text fontSize="xs">
                                {transaction.account?.name || 'Unknown Account'}
                              </Text>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell p={0} border="none" textAlign="end">
                            <Stack direction={{ base: "column", md: "row" }}>
                              <Stat.Root>
                                <HStack justify="end">
                                    <Text>
                                      <FormatNumber
                                        value={parseFloat(transaction.amount)}
                                        style="currency"
                                        currency="USD"
                                      />
                                    </Text>
                                    {transaction.category?.type === 'INCOME' ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
                                </HStack>
                              </Stat.Root>
                              <HStack justify={"end"}>
                                <IconButton 
                                  onClick={() => handleEdit(transaction)}
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Edit transaction"
                                >
                                  <LuPencil color="#4DE3AF" />
                                </IconButton>
                                <Dialog.Root>
                                  <Dialog.Trigger asChild>
                                    <IconButton 
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Delete transaction"
                                    > 
                                      <LuTrash2 color="#dc2626" />
                                    </IconButton>
                                  </Dialog.Trigger>
                                  <Portal>
                                    <Dialog.Backdrop />
                                    <Dialog.Positioner>
                                      <Dialog.Content _dark={{ bg: 'gray.900' }}>
                                        <Dialog.Header>
                                          <Dialog.Title>Delete Transaction</Dialog.Title>
                                        </Dialog.Header>
                                        <Dialog.Body>
                                          <p>
                                            Are you sure you want to delete this transaction? This action cannot be undone.
                                          </p>
                                        </Dialog.Body>
                                        <Dialog.Footer>
                                          <Dialog.ActionTrigger asChild>
                                            <Button variant="outline">Cancel</Button>
                                          </Dialog.ActionTrigger>
                                          <Button
                                            onClick={() => handleDelete(transaction.id)}
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
                            </Stack>
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                  </Card.Body>
                </Card.Root>
              ))}
            </VStack>
          </Box>
        </>
      )}

      {/* Add/Edit Transaction Drawer */}
      <Drawer.Root open={open} onOpenChange={(e) => !e.open && handleCancel()}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <VStack align="start">
                  <Drawer.Title>
                    {editingId ? 'Edit Transaction' : 'Add New Transaction'}
                  </Drawer.Title>
                  <Text fontSize="sm">
                    {editingId ? 'Update transaction details' : 'Enter transaction information'}
                  </Text>
                </VStack>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>

            <Drawer.Body>
              <form onSubmit={handleSubmit} id="transaction-form">
                <Fieldset.Root size="lg" maxW="md">
                  <Stack gap={5}>
                    <Fieldset.Legend>Transaction Details</Fieldset.Legend>
                    
                    <Field.Root>
                      <Field.Label>Account</Field.Label>
                        <NativeSelectRoot>
                          <NativeSelectField
                            placeholder="Select account"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
                          >
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name} - ${account.balance}
                              </option>
                            ))}
                          </NativeSelectField>
                        </NativeSelectRoot>
                    </Field.Root>
                    
                    <Field.Root>
                      <Field.Label>Category</Field.Label>
                      <NativeSelectRoot>
                        <NativeSelectField
                          placeholder="Select category"
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                        >
                          <optgroup label="Income">
                            {categories
                              .filter(category => category.type === 'INCOME')
                              .map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                          </optgroup>
                          
                          <optgroup label="Expense">
                            {categories
                              .filter(category => category.type === 'EXPENSE')
                              .map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                          </optgroup>
                        </NativeSelectField>
                      </NativeSelectRoot>
                    </Field.Root>
                    
                    <Field.Root>
                      <Field.Label>Date</Field.Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </Field.Root>
                    
                    <Field.Root>
                      <Field.Label>Amount</Field.Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          min={0}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                        />
                    </Field.Root>
                    
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                        <Textarea
                          placeholder="Enter transaction description (optional)"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                        />
                    </Field.Root>
                  </Stack>
                </Fieldset.Root>
              </form>
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
                  form="transaction-form"
                  disabled={!accountId || amount === '' || !categoryId || !date}
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