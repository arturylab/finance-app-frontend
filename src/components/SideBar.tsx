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

const primaryColor = '#4DE3AF';

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon: Icon, 
  label,
  href,
  isActive = false, 
  hasDropdown = false,
  onClick 
}) => {
  const router = useRouter();

  const handleClick = () => {
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
      color={isActive ? primaryColor : 'gray.600'}
      _dark={{ color: isActive ? primaryColor : 'gray.300' }}
      _hover={{
        bg: primaryColor,
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

const SidebarContent: React.FC<{
  currentPath: string;
  onItemClick?: () => void;
}> = ({ currentPath, onItemClick }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onItemClick?.();
  };

  const menuItems = [
    { icon: LuLayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: LuPiggyBank, label: 'Accounts', href: '/dashboard/accounts' },
    { icon: LuArrowLeftRight, label: 'Transfers', href: '/dashboard/transfers' },
    { icon: LuCircleDollarSign, label: 'Transactions', href: '/dashboard/transactions' },
    { icon: LuTags, label: 'Categories', href: '/dashboard/categories' },
  ];

  const bottomMenuItems = [
    { icon: LuCircleHelp, label: 'Help Center', href: '/dashboard/help' },
  ];

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(href);
  };

  return (
    <Box
      w="280px"
      h="100vh"
      borderRight={{ base: "none", lg: "1px solid" }}
      borderColor={{ base: "none", lg: "gray.200" }}
      _dark={{ borderColor: 'gray.800' }}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={6}>
        <HStack>
          <Image src="/logo.png" alt="finance app logo" boxSize="32px"/>
          <Text fontSize="lg" fontWeight="semibold">
            Finance App
          </Text>
          <Spacer />
          <Box display={{ base: "none", lg: "block" }}>
              <ColorModeButton />
          </Box>
        </HStack>
      </Box>

      {/* Main Navigation */}
      <Box flex="1" px="4">
        <VStack align="stretch">
          {menuItems.map((item) => (
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

        {/* Bottom Navigation */}
        <VStack align="stretch">
          {bottomMenuItems.map((item) => (
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
      </Box>

      {/* User Profile */}
      <Box px="4" py="4">
        <HStack p="3" borderRadius="lg">
          <Avatar.Root bg={primaryColor}>
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
                    size="xs">
                        <LuEllipsisVertical size={16} />
                </IconButton>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content zIndex={1600}>
                        <Menu.Item value="profile" asChild>
                          <Link href='/dashboard/profile'>
                            Profile
                          </Link>
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item value="logout" onClick={handleLogout}>Logout</Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>
      </Box>
    </Box>
  );
};

// const getPageTitle = (pathname: string): string => {
//   const routes: Record<string, string> = {
//     '/dashboard': 'Dashboard',
//     '/dashboard/accounts': 'Accounts',
//     '/dashboard/transfers': 'Transfers', 
//     '/dashboard/transactions': 'Transactions',
//     '/dashboard/categories': 'Categories',
//     '/dashboard/help': 'Help Center',
//     '/dashboard/profile': 'Profile'
//   };
  
//   return routes[pathname] || 'Dashboard';
// };

interface SideBarProps {
  children: React.ReactNode;
}

const SideBar: React.FC<SideBarProps> = ({ children }) => {
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <Box display="flex" h="100vh">
        {/* Desktop Sidebar */}
        <Box display={{ base: "none", lg: "block" }}>
          <SidebarContent 
            currentPath={pathname}
          />
        </Box>

        {/* Mobile Drawer */}
        <Drawer.Root 
            open={isOpen} 
            onOpenChange={({ open }) => open ? onOpen() : onClose()}
            placement={{ mdDown: "top", md: "start" }}
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
                <SidebarContent 
                currentPath={pathname}
                onItemClick={onClose}
                />
            </Drawer.Body>
            </Drawer.Content>
        </Drawer.Positioner>
        </Drawer.Root>

        {/* Main Content */}
        <Box flex="1" display="flex" flexDirection="column">
          {/* Mobile Header */}
          <HStack 
            display={{ base: "flex", lg: "none" }} 
            p="4" 
            borderBottom="1px solid"
            borderColor="gray.200"
            _dark={{ borderColor: 'gray.800' }}
            justify="space-between"
          >
            <ColorModeButton />
            <HStack>
                <Image src="/logo.png" alt="finance app logo" boxSize="32px"/>
                <Text fontSize="lg" fontWeight="semibold">
                Finance App
                </Text>
            </HStack>
            <IconButton
                aria-label="Open menu"
                variant="ghost"
                size="md"
                onClick={onOpen}
            >
                <LuAlignRight />
            </IconButton>
            </HStack>

          {/* Page Header */}
          {/* <Flex justify={{ base: "center", lg: "space-between" }} align="center" p="4" borderBottom="1px solid" borderColor="gray.200" _dark={{ borderColor: 'gray.800' }}>
            <Heading color={primaryColor}>
              {getPageTitle(pathname)}
            </Heading>
            <Box display={{ base: "none", lg: "block" }}>
              <ColorModeButton />
            </Box>
          </Flex> */}

          {/* Page Content */}
          <Box flex="1" overflow="auto">
            {children}
          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

export default SideBar;