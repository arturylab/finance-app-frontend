'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  Button,
  Input,
  HStack,
  VStack,
  Badge,
  Icon,
  Card,
  Separator,
  Alert,
} from '@chakra-ui/react';
import {
  LuUser,
  LuMail,
  LuPencil,
  LuSave,
  LuX,
  LuCircleCheck,
  LuCircleAlert,
} from 'react-icons/lu';
import { apiClient } from '@/lib/api';
import type { User } from '@/types/auth';

interface ProfileFormData {
  first_name: string;
  last_name: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await apiClient.auth.getCurrentUser();
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
      });
    } catch (err) {
      setError('Failed to load user data. Please try again.');
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form data to original user data
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!user) {
        throw new Error('User data not available');
      }

      // Here you would typically call an API endpoint to update the user
      // Since the API structure shows user update isn't available, 
      // we'll simulate the update for demo purposes
      
      // For now, we'll just update local state
      // In a real app, you'd make an API call like:
      // const updatedUser = await apiClient.users.update(user.id, formData);
      
      const updatedUser: User = {
        ...user,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      setUser(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = () => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user?.username || 'Unknown User';
  };

  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const username = user?.username || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <Container maxW="2xl" py="8">
        <Stack gap="6">
          <Text textAlign="center">Loading profile...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW="2xl" py="8">
      <Stack gap="8">
        {/* Header */}
        <Stack gap="4" textAlign="center">
          <Text fontSize="md" color="fg.muted">
            Manage your account information and preferences
          </Text>
        </Stack>

        {/* Success Alert */}
        {success && (
          <Alert.Root status="success" variant="subtle">
            <Icon color="green.fg">
              <LuCircleCheck />
            </Icon>
            <Text>{success}</Text>
          </Alert.Root>
        )}

        {/* Error Alert */}
        {error && (
          <Alert.Root status="error" variant="subtle">
            <Icon color="red.fg">
              <LuCircleAlert />
            </Icon>
            <Text>{error}</Text>
          </Alert.Root>
        )}

        {/* Profile Card */}
        <Card.Root>
          <Card.Header>
            <VStack gap="4">
              {/* Avatar */}
              <Box
                w="20"
                h="20"
                bg="#4DE3AF"
                color="white"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="2xl"
                fontWeight="bold"
              >
                {getInitials()}
              </Box>
              
              {/* User Name */}
              <Stack gap="1" textAlign="center">
                <Heading size="lg">{getDisplayName()}</Heading>
                <HStack justify="center" gap="2">
                  <Badge variant="subtle" colorPalette="blue">
                    <Icon>
                      <LuUser />
                    </Icon>
                    Active User
                  </Badge>
                </HStack>
              </Stack>
            </VStack>
          </Card.Header>

          <Card.Body>
            <Stack gap="6">
              {/* Account Information */}
              <Stack gap="4">
                <Heading size="md">Account Information</Heading>
                
                <Stack gap="4">
                  {/* Username - Read Only */}
                  <Stack gap="2">
                    <Text fontWeight="medium" color="fg.muted">
                      Username
                    </Text>
                    <HStack>
                      <Icon color="blue.fg">
                        <LuUser />
                      </Icon>
                      <Text>{user?.username}</Text>
                    </HStack>
                  </Stack>

                  {/* Email - Read Only */}
                  <Stack gap="2">
                    <Text fontWeight="medium" color="fg.muted">
                      Email Address
                    </Text>
                    <HStack>
                      <Icon color="blue.fg">
                        <LuMail />
                      </Icon>
                      <Text>{user?.email}</Text>
                    </HStack>
                  </Stack>

                  <Separator />

                  {/* Personal Information - Editable */}
                  <HStack justify="space-between" align="center">
                    <Heading size="md">Personal Information</Heading>
                    {!isEditing && (
                      <Button
                        size="sm"
                        onClick={handleEdit}
                      >
                        <Icon>
                          <LuPencil />
                        </Icon>
                        Edit
                      </Button>
                    )}
                  </HStack>

                  {/* First Name */}
                  <Stack gap="2">
                    <Text fontWeight="medium" color="fg.muted">
                      First Name
                    </Text>
                    {isEditing ? (
                      <Input
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <Text>{user?.first_name || 'Not provided'}</Text>
                    )}
                  </Stack>

                  {/* Last Name */}
                  <Stack gap="2">
                    <Text fontWeight="medium" color="fg.muted">
                      Last Name
                    </Text>
                    {isEditing ? (
                      <Input
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <Text>{user?.last_name || 'Not provided'}</Text>
                    )}
                  </Stack>

                  {/* Edit Actions */}
                  {isEditing && (
                    <HStack justify="flex-end" gap="3" pt="4">
                      <Button
                      variant={"outline"}
                        onClick={handleCancel}
                        // isDisabled={isSaving}
                      >
                        <Icon>
                          <LuX />
                        </Icon>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        loading={isSaving}
                        loadingText="Saving..."
                      >
                        <Icon>
                          <LuSave />
                        </Icon>
                        Save Changes
                      </Button>
                    </HStack>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Security Note */}
        <Box
          bg="yellow.subtle"
          p="4"
          borderRadius="md"
          borderWidth="1px"
          borderColor="yellow.muted"
        >
          <HStack gap="3">
            <Icon color="yellow.fg" fontSize="lg">
              <LuCircleAlert />
            </Icon>
            <Stack gap="1">
              <Text fontWeight="medium">Security Note</Text>
              <Text fontSize="sm" color="fg.muted">
                To change your username, email, or password, please contact support.
                Only first name and last name can be updated from this page.
              </Text>
            </Stack>
          </HStack>
        </Box>
      </Stack>
    </Container>
  );
};

export default Profile;