'use client';

import React, { useState, useEffect } from 'react';
import { useTransfers } from '@/hooks/useTransfers';
import { apiClient } from '@/lib/api';
import {
  Box,
  Button,
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
  FormatNumber,
  Table,
  Fieldset,
  Field,
  NativeSelectField,
  NativeSelectRoot,
  Textarea,
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { 
  LuCirclePlus, 
  LuPencil, 
  LuTrash2, 
  LuArrowRightLeft,
  LuArrowRight,
} from "react-icons/lu";
import { Account, CreateTransferData, UpdateTransferData } from '@/types/auth';

export default function Transfers() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromAccountId, setFromAccountId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [toAccountId, setToAccountId] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(true);
  
  const { open, onOpen, onClose } = useDisclosure();

  const {
    transfers,
    isLoading,
    error,
    createTransfer,
    updateTransfer,
    deleteTransfer,
  } = useTransfers(true, undefined, {
    onSuccess: (message) => toaster.create({
      title: 'Success',
      description: message,
      type: 'success',
      duration: 3000,
    }),
    onError: (message) => toaster.create({
      title: 'Error',
      description: message,
      type: 'error',
      duration: 5000,
    }),
  });

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await apiClient.accounts.getAll();
        setAccounts(accountsData);
      } catch (error) {
        console.error('Failed to load accounts:', error);
        toaster.create({
          title: 'Error',
          description: 'Failed to load accounts',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setLoadingSupport(false);
      }
    };

    loadAccounts();
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
    
    if (!fromAccountId || !toAccountId || amount === '') {
      return;
    }

    if (fromAccountId === toAccountId) {
      toaster.create({
        title: 'Error',
        description: 'Source and destination accounts must be different',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      const fromAcc = accounts.find(acc => acc.id === fromAccountId);
      const toAcc = accounts.find(acc => acc.id === toAccountId);

      const data: CreateTransferData | UpdateTransferData = {
        from_account: Number(fromAccountId),
        to_account: Number(toAccountId),
        amount,
        date,
        description: description || (fromAcc && toAcc ? `${fromAcc.name} → ${toAcc.name}` : ''),
      };

      if (editingId) {
        await updateTransfer(editingId, data);
        setEditingId(null);
      } else {
        await createTransfer(data as CreateTransferData);
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
    setFromAccountId('');
    setToAccountId('');
    setEditingId(null);
  };

  const handleEdit = (transfer: typeof transfers[0]) => {
    setAmount(transfer.amount);
    setDate(transfer.date);
    setDescription(transfer.description);
    setFromAccountId(transfer.from_account);
    setToAccountId(transfer.to_account);
    setEditingId(transfer.id);
    onOpen();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransfer(id);
    } catch (error) {
      console.error('Error deleting transfer:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const getAccountName = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getAccountBalance = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.balance : '0.00';
  };

  if (isLoading || loadingSupport) {
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
          Transfer money between your accounts
        </Text>
      </VStack>

      {/* Add Transfer Button */}
      <Box mb={6}>
        <Flex justify="flex-end">
          <Button onClick={onOpen}>
            <LuCirclePlus color='#4DE3AF' />
            Add Transfer
          </Button>
        </Flex>
      </Box>

      {/* Transfers List or Empty State */}
      {transfers.length === 0 ? (
        <EmptyState.Root
          border="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.800' }}
          p={10}
          borderRadius="md"
        >
          <EmptyState.Indicator>
            <LuArrowRightLeft color='#4DE3AF' />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No transfers yet</EmptyState.Title>
            <EmptyState.Description>
              Start moving money between your accounts by creating your first transfer
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
                  <Table.ColumnHeader>From Account</Table.ColumnHeader>
                  <Table.ColumnHeader>To Account</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transfers.map((transfer) => (
                  <Table.Row key={transfer.id}>
                    <Table.Cell>
                      {transfer.date}
                    </Table.Cell>
                    <Table.Cell>
                      <Text>
                        {transfer.description || 'No description'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>
                        {getAccountName(transfer.from_account)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack>
                        <LuArrowRight color="#4DE3AF" size={16} />
                        <Text>
                          {getAccountName(transfer.to_account)}
                        </Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <Text fontWeight="semibold">
                        <FormatNumber
                          value={parseFloat(transfer.amount)}
                          style="currency"
                          currency="USD"
                        />
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack justify={"end"}>
                        <IconButton 
                          onClick={() => handleEdit(transfer)}
                          disabled={false}
                          variant="ghost"
                          size="sm"
                          aria-label="Edit transfer"
                        >
                          <LuPencil color="#4DE3AF" />
                        </IconButton>
                        <Dialog.Root>
                          <Dialog.Trigger asChild>
                            <IconButton 
                              variant="ghost"
                              size="sm"
                              aria-label="Delete transfer"
                            > 
                              <LuTrash2 color="#dc2626" />
                            </IconButton>
                          </Dialog.Trigger>
                          <Portal>
                            <Dialog.Backdrop />
                            <Dialog.Positioner>
                              <Dialog.Content _dark={{ bg: 'gray.900' }}>
                                <Dialog.Header>
                                  <Dialog.Title>Delete Transfer</Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                  <p>
                                    Are you sure you want to delete this transfer? This action cannot be undone.
                                  </p>
                                </Dialog.Body>
                                <Dialog.Footer>
                                  <Dialog.ActionTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </Dialog.ActionTrigger>
                                  <Button
                                    onClick={() => handleDelete(transfer.id)}
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
              {transfers.map((transfer) => (
                <Card.Root key={transfer.id} w="full" size="sm" variant="outline">
                  <Card.Body p={4}>
                    <Table.Root size="sm">
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell p={0} border="none">
                            <VStack align="start" gap={2}>
                              <Text fontSize="sm" fontWeight="medium">
                                {transfer.description || 'No description'}
                              </Text>
                              <Text fontSize="xs">
                                {transfer.date}
                              </Text>
                              <HStack>
                                <Text fontSize="xs">
                                  {getAccountName(transfer.from_account)}
                                </Text>
                                <LuArrowRight color="#4DE3AF" size={12} />
                                <Text fontSize="xs">
                                  {getAccountName(transfer.to_account)}
                                </Text>
                              </HStack>
                            </VStack>
                          </Table.Cell>
                          <Table.Cell p={0} border="none" textAlign="end">
                            <Stack direction={{ base: "column", md: "row" }} align="end" gap={2}>
                              <Text fontWeight="semibold">
                                <FormatNumber
                                  value={parseFloat(transfer.amount)}
                                  style="currency"
                                  currency="USD"
                                />
                              </Text>
                              <HStack justify={"end"}>
                                <IconButton 
                                  // onClick={() => handleEdit(transfer)}
                                  disabled={true}
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Edit transfer"
                                >
                                  <LuPencil color="#4DE3AF" />
                                </IconButton>
                                <Dialog.Root>
                                  <Dialog.Trigger asChild>
                                    <IconButton 
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Delete transfer"
                                    > 
                                      <LuTrash2 color="#dc2626" />
                                    </IconButton>
                                  </Dialog.Trigger>
                                  <Portal>
                                    <Dialog.Backdrop />
                                    <Dialog.Positioner>
                                      <Dialog.Content _dark={{ bg: 'gray.900' }}>
                                        <Dialog.Header>
                                          <Dialog.Title>Delete Transfer</Dialog.Title>
                                        </Dialog.Header>
                                        <Dialog.Body>
                                          <p>
                                            Are you sure you want to delete this transfer? This action cannot be undone.
                                          </p>
                                        </Dialog.Body>
                                        <Dialog.Footer>
                                          <Dialog.ActionTrigger asChild>
                                            <Button variant="outline">Cancel</Button>
                                          </Dialog.ActionTrigger>
                                          <Button
                                            onClick={() => handleDelete(transfer.id)}
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

      {/* Add/Edit Transfer Drawer */}
      <Drawer.Root open={open} onOpenChange={(e) => !e.open && handleCancel()}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <VStack align="start">
                  <Drawer.Title>
                    {editingId ? 'Edit Transfer' : 'Add New Transfer'}
                  </Drawer.Title>
                  <Text fontSize="sm">
                    {editingId ? 'Update transfer details' : 'Enter transfer information'}
                  </Text>
                </VStack>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>

            <Drawer.Body>
              <form onSubmit={handleSubmit} id="transfer-form">
                <Fieldset.Root size="lg" maxW="md">
                  <Stack gap={5}>
                    <Fieldset.Legend>Transfer Details</Fieldset.Legend>
                    
                    <Field.Root>
                      <Field.Label>From Account</Field.Label>
                        <NativeSelectRoot>
                          <NativeSelectField
                            placeholder="Select source account"
                            value={fromAccountId}
                            onChange={(e) => setFromAccountId(e.target.value ? Number(e.target.value) : '')}
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
                      <Field.Label>To Account</Field.Label>
                      <NativeSelectRoot>
                        <NativeSelectField
                          placeholder="Select destination account"
                          value={toAccountId}
                          onChange={(e) => setToAccountId(e.target.value ? Number(e.target.value) : '')}
                        >
                          {accounts
                            .filter(account => account.id !== fromAccountId)
                            .map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name} - ${account.balance}
                              </option>
                            ))}
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
                          max={fromAccountId ? getAccountBalance(Number(fromAccountId)) : undefined}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                        />
                        {fromAccountId && (
                          <Text fontSize="xs" color="gray.500">
                            Available balance: ${getAccountBalance(Number(fromAccountId))}
                          </Text>
                        )}
                    </Field.Root>
                    
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                        <Textarea
                          placeholder={
                            fromAccountId && toAccountId
                              ? `${accounts.find(acc => acc.id === fromAccountId)?.name} → ${accounts.find(acc => acc.id === toAccountId)?.name}`
                              : "Enter transfer description (optional)"
                          }
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
                  form="transfer-form"
                  disabled={!fromAccountId || !toAccountId || amount === '' || fromAccountId === toAccountId}
                >
                  {editingId ? 'Update' : 'Transfer'}
                </Button>
              </ButtonGroup>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}