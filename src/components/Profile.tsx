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
  Icon,
  Fieldset,
  Field,
  Separator,
  Alert,
} from '@chakra-ui/react';
import { PasswordInput } from "@/components/ui/password-input"
import {
  LuUser,
  LuMail,
  LuPencil,
  LuSave,
  LuX,
  LuCircleCheck,
  LuCircleAlert,
  LuLock,
} from 'react-icons/lu';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { User, UpdateUserProfileData, ChangePasswordData } from '@/types/auth';

interface ProfileFormData {
  first_name: string;
  last_name: string;
}

interface PasswordFormData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const Profile: React.FC = () => {
  const { user: authUser, refreshToken } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false,
  });

  // Synchronize with the user from the auth context
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setFormData({
        first_name: authUser.first_name || '',
        last_name: authUser.last_name || '',
      });
    }
  }, [authUser]);

  // Load user data on component mount
  useEffect(() => {
    if (!user) {
      loadUserData();
    }
  }, [user]);

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

  const handlePasswordInputChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({
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
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  };

  const handleStartPasswordChange = () => {
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordData({
      old_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordData({
      old_password: '',
      new_password: '',
      confirm_password: '',
    });
    setShowPasswords({
      old_password: false,
      new_password: false,
      confirm_password: false,
    });
  };

  const validatePasswordForm = (): string | null => {
    if (!passwordData.old_password) {
      return 'Current password is required.';
    }
    
    if (!passwordData.new_password) {
      return 'New password is required.';
    }
    
    if (passwordData.new_password.length < 8) {
      return 'New password must be at least 8 characters long.';
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      return 'New passwords do not match.';
    }
    
    if (passwordData.old_password === passwordData.new_password) {
      return 'New password must be different from current password.';
    }
    
    return null;
  };

  const handlePasswordSubmit = async () => {
    try {
      setIsChangingPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const validationError = validatePasswordForm();
      if (validationError) {
        setPasswordError(validationError);
        return;
      }

      const changePasswordData: ChangePasswordData = {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      };

      await apiClient.auth.changePassword(changePasswordData);

      setPasswordSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setShowPasswords({
        old_password: false,
        new_password: false,
        confirm_password: false,
      });

      setTimeout(() => {
        setPasswordSuccess(null);
      }, 5000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password. Please try again.';
      setPasswordError(errorMessage);
      console.error('Error changing password:', err);
    } finally {
      setIsChangingPasswordLoading(false);
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

      const updateData: UpdateUserProfileData = {};
      
      if (formData.first_name !== (user.first_name || '')) {
        updateData.first_name = formData.first_name;
      }
      
      if (formData.last_name !== (user.last_name || '')) {
        updateData.last_name = formData.last_name;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setSuccess('No changes to save.');
        setTimeout(() => setSuccess(null), 3000);
        return;
      }

      const updatedUser = await apiClient.auth.updateProfile(updateData);
      
      setUser(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');

      await refreshToken();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setError(errorMessage);
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

  const hasChanges = () => {
    if (!user) return false;
    return (
      formData.first_name !== (user.first_name || '') ||
      formData.last_name !== (user.last_name || '')
    );
  };

  const isPasswordFormValid = () => {
    return passwordData.old_password && 
           passwordData.new_password && 
           passwordData.confirm_password &&
           passwordData.new_password === passwordData.confirm_password &&
           passwordData.new_password.length >= 8;
  };

  if (isLoading && !user) {
    return (
      <Container maxW="lg" py="8">
        <Text textAlign="center">Loading profile...</Text>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxW="lg" py="8">
        <Alert.Root status="error">
          <Icon>
            <LuCircleAlert />
          </Icon>
          <Text>Unable to load user data. Please refresh the page.</Text>
        </Alert.Root>
      </Container>
    );
  }

  return (
    <Box w={{ base: "95%", md: "75%" }} mx="auto" px={{ base: 4, md: 0 }}>
      <Container maxW="lg" py="8">
        <Stack gap="8">
          {/* Header with Avatar */}
          <VStack gap="4">
            <Box
              w="20"
              h="20"
              bg="#4DE3AF"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              fontWeight="bold"
            >
              {getInitials()}
            </Box>
            <Stack gap="2" textAlign="center">
              <Heading size="xl">{getDisplayName()}</Heading>
              <Text fontSize="md" color="fg.muted">
                Manage your account information
              </Text>
            </Stack>
          </VStack>

          {/* Success/Error Messages */}
          {(success || passwordSuccess) && (
            <Alert.Root status="success">
              <Icon>
                <LuCircleCheck />
              </Icon>
              <Text>{success || passwordSuccess}</Text>
            </Alert.Root>
          )}

          {(error || passwordError) && (
            <Alert.Root status="error">
              <Icon>
                <LuCircleAlert />
              </Icon>
              <Text>{error || passwordError}</Text>
            </Alert.Root>
          )}

          {/* Account Information */}
          <Fieldset.Root size="lg">
            <Stack textAlign="center">
              <Fieldset.Legend>Account Information</Fieldset.Legend>
              <Fieldset.HelperText>
                View your account details and update your personal information
              </Fieldset.HelperText>
            </Stack>

            <Fieldset.Content>
              {/* Username - Read Only */}
              <Field.Root>
                <Field.Label>
                  <Icon mr="2">
                    <LuUser />
                  </Icon>
                  Username
                </Field.Label>
                <Input value={user.username} disabled variant="subtle" />
              </Field.Root>

              {/* Email - Read Only */}
              <Field.Root>
                <Field.Label>
                  <Icon mr="2">
                    <LuMail />
                  </Icon>
                  Email Address
                </Field.Label>
                <Input value={user.email} disabled variant="subtle" />
              </Field.Root>

              <Separator my="4" />

              {/* Editable Personal Information */}
              <VStack gap="4" align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="medium">Personal Information</Text>
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                    >
                      <Icon mr="1">
                        <LuPencil />
                      </Icon>
                      Edit
                    </Button>
                  )}
                </HStack>

                {/* First Name */}
                <Field.Root>
                  <Field.Label>First Name</Field.Label>
                  {isEditing ? (
                    <Input
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                      disabled={isSaving}
                    />
                  ) : (
                    <Input value={user.first_name || 'Not provided'} disabled />
                  )}
                </Field.Root>

                {/* Last Name */}
                <Field.Root>
                  <Field.Label>Last Name</Field.Label>
                  {isEditing ? (
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                      disabled={isSaving}
                    />
                  ) : (
                    <Input value={user.last_name || 'Not provided'} disabled />
                  )}
                </Field.Root>

                {/* Profile Edit Actions */}
                {isEditing && (
                  <HStack justify="flex-end" gap="3">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <Icon mr="1">
                        <LuX />
                      </Icon>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      loading={isSaving}
                      loadingText="Saving..."
                      disabled={!hasChanges()}
                    >
                      <Icon mr="1">
                        <LuSave />
                      </Icon>
                      Save Changes
                    </Button>
                  </HStack>
                )}
              </VStack>
            </Fieldset.Content>
          </Fieldset.Root>

          {/* Password Change Section */}
          <Fieldset.Root size="lg">
            <Stack textAlign="center">
              <Fieldset.Legend>Security Settings</Fieldset.Legend>
              <Fieldset.HelperText>
                Update your password to keep your account secure
              </Fieldset.HelperText>
            </Stack>

            <Fieldset.Content>
              {!isChangingPassword ? (
                <VStack gap="4" align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Password</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartPasswordChange}
                    >
                      <Icon mr="1">
                        <LuLock />
                      </Icon>
                      Change Password
                    </Button>
                  </HStack>
                  
                  <Field.Root>
                    <Field.Label>
                      <Icon mr="2">
                        <LuLock />
                      </Icon>
                      Current Password
                    </Field.Label>
                    <Input value="••••••••" disabled />
                  </Field.Root>
                </VStack>
              ) : (
                <Stack gap="4">
                  <Text fontWeight="medium" textAlign="center" mb="2">
                    Change Your Password
                  </Text>
                  
                  {/* Current Password */}
                  <Field.Root>
                    <Field.Label>Current Password *</Field.Label>
                    <HStack w="full">
                      <PasswordInput
                        type={showPasswords.old_password ? 'text' : 'password'}
                        value={passwordData.old_password}
                        onChange={(e) => handlePasswordInputChange('old_password', e.target.value)}
                        placeholder="Enter your current password"
                        disabled={isChangingPasswordLoading}
                      />
                    </HStack>
                  </Field.Root>

                  {/* New Password */}
                  <Field.Root>
                    <Field.Label>New Password *</Field.Label>
                    <HStack w="full">
                      <PasswordInput
                        type={showPasswords.new_password ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => handlePasswordInputChange('new_password', e.target.value)}
                        placeholder="Enter your new password (min. 8 characters)"
                        disabled={isChangingPasswordLoading}
                      />
                    </HStack>
                  </Field.Root>

                  {/* Confirm New Password */}
                  <Field.Root>
                    <Field.Label>Confirm New Password *</Field.Label>
                    <HStack w="full">
                      <PasswordInput
                        type={showPasswords.confirm_password ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => handlePasswordInputChange('confirm_password', e.target.value)}
                        placeholder="Confirm your new password"
                        disabled={isChangingPasswordLoading}
                      />
                    </HStack>
                  </Field.Root>

                  {/* Password Change Actions */}
                  <HStack justify="flex-end" gap="3" pt="2">
                    <Button
                      variant="outline"
                      onClick={handleCancelPasswordChange}
                      disabled={isChangingPasswordLoading}
                    >
                      <Icon mr="1">
                        <LuX />
                      </Icon>
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordSubmit}
                      loading={isChangingPasswordLoading}
                      loadingText="Changing..."
                      disabled={!isPasswordFormValid()}
                    >
                      <Icon mr="1">
                        <LuLock />
                      </Icon>
                      Change Password
                    </Button>
                  </HStack>
                </Stack>
              )}
            </Fieldset.Content>
          </Fieldset.Root>
        </Stack>
      </Container>
    </Box>
  );
};

export default Profile;