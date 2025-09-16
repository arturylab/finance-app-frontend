'use client';

import React, { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
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
  RadioGroup
} from '@chakra-ui/react';
import { 
  LuCirclePlus, 
  LuPencil, 
  LuTrash2, 
  LuTags,
} from "react-icons/lu";
import { CreateCategoryData, UpdateCategoryData, CategoryType } from '@/types/auth';

export default function Categories() {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { open, onOpen, onClose } = useDisclosure();

  const {
    incomeCategories,
    expenseCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

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

  const renderCategoryTable = (categories: typeof incomeCategories, title: string, colorPalette: 'green' | 'red') => (
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

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <VStack align="start" mb={6}>
        <Text fontSize="md">
          Organize your transactions with custom categories
        </Text>
      </VStack>

      {/* Add Category Button */}
      <Box mb={6}>
        <Flex justify="flex-end">
          <Button onClick={onOpen}>
            <LuCirclePlus color='#4DE3AF' />
            Add Category
          </Button>
        </Flex>
      </Box>

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
              <form onSubmit={handleSubmit} id="category-form">
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