'use client';

import React, { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
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
  SimpleGrid,
  Heading,
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
  Stat,
} from '@chakra-ui/react';
import { 
  LuCirclePlus, 
  LuPencil, 
  LuTrash2, 
  LuWallet,
} from "react-icons/lu";

interface Account {
  id: number;
  name: string;
  balance: string;
}

export default function Accounts() {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [editingId, setEditingId] = useState<number | null>(null);
  const { open, onOpen, onClose } = useDisclosure();

  const {
    accounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useAccounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateAccount(editingId, { name, balance });
        setEditingId(null);
      } else {
        await createAccount({ name, balance });
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setBalance('0.00');
    setEditingId(null);
  };

  const handleEdit = (account: Account) => {
    setName(account.name);
    setBalance(account.balance);
    setEditingId(account.id);
    onOpen();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAccount(id);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (isLoading) {
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
    <Box p={6} maxW="6xl" mx="auto">
      <VStack align="start" mb={6}>
        <Text fontSize="md">
          Manage your financial accounts
        </Text>
      </VStack>

      {/* Add Account Button */}
      <Box mb={6}>
        <Flex justify={"flex-end"}>
          <Button 
            onClick={onOpen} 
          >
            <LuCirclePlus color='#4DE3AF' />
            Add Account
          </Button>

        </Flex>
      </Box>

      {/* Accounts List or Empty State */}
      {accounts.length === 0 ? (
        <EmptyState.Root
          border={"1px solid"}
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.800' }}
          p={10}
          borderRadius="md"
          >
          <EmptyState.Indicator>
            <LuWallet color='#4DE3AF'/>
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No accounts yet</EmptyState.Title>
            <EmptyState.Description>
              Create your first account to start tracking your finances
            </EmptyState.Description>
          </VStack>
        </EmptyState.Root>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}>
          {accounts.map((account) => (
            <Card.Root
              key={account.id}
              size="lg"
              _dark={{ bg: 'gray.900' }}
              m={2}
            >
              <Card.Body>
                <VStack align="start">
                  <HStack justify="space-between" w="full">
                    <Heading size="lg">
                      {account.name}
                    </Heading>
                    <HStack>
                      <IconButton 
                        onClick={() => handleEdit(account)}
                        variant="ghost"
                        colorScheme="blue"
                        size="sm"
                        aria-label="Edit account"
                      >
                        <LuPencil color="#4DE3AF"/>
                      </IconButton>
                      <Dialog.Root>
                        <Dialog.Trigger asChild>
                          <IconButton 
                            variant="ghost"
                            size="sm"
                            aria-label="Delete account"
                          > 
                            <LuTrash2 color="#dc2626"/>
                          </IconButton>
                        </Dialog.Trigger>
                        <Portal>
                          <Dialog.Backdrop />
                          <Dialog.Positioner>
                            <Dialog.Content _dark={{ bg: 'gray.900' }}>
                              <Dialog.Header>
                                <Dialog.Title>Delete Account</Dialog.Title>
                              </Dialog.Header>
                              <Dialog.Body>
                                <p>
                                  {`Are you sure you want to delete "${account.name}"? This action cannot be undone and will also delete all associated transactions and transfers.`}
                                </p>
                              </Dialog.Body>
                              <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </Dialog.ActionTrigger>
                                  <Button
                                    onClick={() => handleDelete(account.id)}
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
                  </HStack>
                  <HStack>
                    <Stat.Root>
                      <Stat.Label>Balance</Stat.Label>
                      <Stat.ValueText color={parseFloat(account.balance || '0') >= 0 ? "green.600" : "red.600"}>
                        <FormatNumber
                          value={parseFloat(account.balance || '0')}
                          style="currency"
                          currency="USD"
                        />
                      </Stat.ValueText>
                    </Stat.Root>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}

      {/* Add/Edit Account Drawer */}
      <Drawer.Root open={open} onOpenChange={(e) => !e.open && handleCancel()}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justify="space-between" w="full">
                <VStack align="start">
                  <Drawer.Title>
                    {editingId ? 'Edit Account' : 'Add New Account'}
                  </Drawer.Title>
                  <Text color="gray.600" fontSize="sm">
                    {editingId ? 'Update account details' : 'Enter account information'}
                  </Text>
                </VStack>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>

            <Drawer.Body>
              <form onSubmit={handleSubmit} id="account-form">
                <Stack gap={6}>
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      Account Name *
                    </Text>
                    <Input
                      placeholder="Enter account name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      Initial Balance
                    </Text>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      size="lg"
                      disabled={true}
                      variant="subtle"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        Balance cannot be edited directly. Use <strong>Transactions</strong> instead, select <em>Initial Balance</em> or <em>Balance Adjustment</em> in <strong>Category</strong>. You can use <strong>Transfers</strong> as well.

                    </Text>
                  </Box>
                </Stack>
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
                  form="account-form"
                  disabled={name.trim() === ''}
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