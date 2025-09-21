"use client";

import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ColorModeButton } from "@/components/ui/color-mode";
import { usePathname, useRouter } from 'next/navigation';

import React from 'react';
import Link from 'next/link';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Separator, 
  Image, 
  IconButton, 
  Menu, 
  Portal, 
  useDisclosure,
  Drawer,
  Avatar,
  Spacer
} from '@chakra-ui/react';
import { 
  LuLayoutDashboard, 
  LuPiggyBank, 
  LuArrowLeftRight, 
  LuCircleDollarSign, 
  LuTags,
  LuCircleHelp,
  LuChevronDown,
  LuEllipsisVertical,
  LuAlignRight,
  LuX
} from 'react-icons/lu';

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  hasDropdown?: boolean;
  onClick?: () => void;
}

interface SideBarProps {
  children: React.ReactNode;
}

const PRIMARY_COLOR = '#4DE3AF';

const MENU_ITEMS = [
  { icon: LuLayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: LuPiggyBank, label: 'Accounts', href: '/dashboard/accounts' },
  { icon: LuArrowLeftRight, label: 'Transfers', href: '/dashboard/transfers' },
  { icon: LuCircleDollarSign, label: 'Transactions', href: '/dashboard/transactions' },
  { icon: LuTags, label: 'Categories', href: '/dashboard/categories' },
];

const BOTTOM_MENU_ITEMS = [
  { icon: LuCircleHelp, label: 'Help Center', href: '/dashboard/help' },
];

const SideBar: React.FC<SideBarProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  // Helper function to determine if menu item is active
  const isItemActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // MenuItem component optimized as internal component
  const MenuItem: React.FC<MenuItemProps> = ({ 
    icon: Icon, 
    label,
    href,
    isActive = false, 
    hasDropdown = false,
    onClick 
  }) => {
    const handleClick = (): void => {
      router.push(href);
      onClick?.();
    };

    return (
      <HStack
        w="full"
        px="3"
        py="2.5"
        borderRadius="md"
        cursor="pointer"
        color={isActive ? PRIMARY_COLOR : 'gray.600'}
        _dark={{ color: isActive ? PRIMARY_COLOR : 'gray.300' }}
        _hover={{
          bg: PRIMARY_COLOR,
          color: 'gray.900'
        }}
        transition="all 0.2s"
        onClick={handleClick}
      >
        <Box display="flex" alignItems="center">
          <Icon size={18} />
        </Box>
        <Text fontSize="sm" fontWeight="medium" flex="1">
          {label}
        </Text>
        {hasDropdown && (
          <Box display="flex" alignItems="center">
            <LuChevronDown size={16} />
          </Box>
        )}
      </HStack>
    );
  };

  // Handle logout
  const handleLogout = (): void => {
    logout();
    onClose();
  };

  // Render sidebar content
  const renderSidebarContent = (onItemClick?: () => void) => (
    <Box
      w="280px"
      h={{ base: "auto", lg: "100vh" }}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={6}>
          <HStack>
            <Link href='/dashboard'>
              <Image src="/logo.png" alt="finance app logo" boxSize="32px"/>
            </Link>
            <Link href='/dashboard'>
              <Text fontSize="lg" fontWeight="semibold">
                Finance App
              </Text>
            </Link>
            <Spacer />
            <Box display={{ base: "none", lg: "block" }}>
              <ColorModeButton />
            </Box>
          </HStack>
      </Box>

      {/* Main Navigation */}
      <Box flex="1" px="4">
        <VStack align="stretch">
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isItemActive(item.href)}
              onClick={onItemClick}
            />
          ))}
          {BOTTOM_MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isItemActive(item.href)}
              onClick={onItemClick}
            />
          ))}
        </VStack>
        
        {/* Separator */}
        <Box py="6">
          <Separator />
        </Box>

        {/* User Profile */}
        <Box py="6">
          <HStack p="3" borderRadius="lg">
            <Avatar.Root bg={PRIMARY_COLOR}>
              <Avatar.Fallback name={user?.username} />
            </Avatar.Root>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold">
                {user?.username}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {user?.email}
              </Text>
            </Box>
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  aria-label="More options"
                  variant="ghost"
                  size="xs"
                >
                  <LuEllipsisVertical size={16} />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content zIndex={1600}>
                    <Menu.Item 
                      value="profile" 
                      onClick={() => {
                        router.push('/dashboard/profile');
                        onItemClick?.();
                      }}
                    >
                      <Link href='/dashboard/profile'>
                        Profile
                      </Link>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item value="logout" onClick={handleLogout}>
                      Logout
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </HStack>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ProtectedRoute>
      <Box 
        display="flex" 
        minH="100vh" 
        flexDirection="row"
        position="relative"
      >
        {/* Desktop Sidebar */}
        <Box 
          display={{ base: "none", lg: "block" }}
          borderRight="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.800' }}
          position="sticky"
          top="0"
          alignSelf="flex-start"
        >
          {renderSidebarContent()}
        </Box>

        {/* Mobile Drawer */}
        <Drawer.Root 
          open={isOpen} 
          onOpenChange={({ open }) => open ? onOpen() : onClose()}
          placement={{ mdDown: "end", md: "start" }}
        >
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.CloseTrigger asChild>
                <IconButton 
                  aria-label="Close Sidebar" 
                  variant="ghost" 
                  size="sm"
                  position="absolute"
                  top="4"
                  right="4"
                  zIndex={10}
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
              <Drawer.Body p={0} overflow="hidden">
                {renderSidebarContent(onClose)}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>

        {/* Main Content */}
        <Box 
          flex="1" 
          display="flex" 
          flexDirection="column"
          minH="100vh"
        >
          {/* Mobile Header */}
          <Box
            display={{ base: "block", lg: "none" }}
            position="sticky"
            top="0"
            bg="white"
            _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
            borderBottom="1px solid"
            borderColor="gray.200"
            zIndex="sticky"
          >
            <HStack 
              p="4" 
              justify="space-between"
            >
              <ColorModeButton />
              <Link href='/dashboard'>
                <HStack>
                  <Image src="/logo.png" alt="finance app logo" boxSize="32px"/>
                  <Text fontSize="lg" fontWeight="semibold">
                    Finance App
                  </Text>
                </HStack>
              </Link>
              <IconButton
                aria-label="Open menu"
                variant="ghost"
                size="md"
                onClick={onOpen}
              >
                <LuAlignRight />
              </IconButton>
            </HStack>
          </Box>

          {/* Page Content */}
          <Box flex="1">
            {children}
          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

export default SideBar;