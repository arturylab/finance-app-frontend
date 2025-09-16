'use client';

import { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import SideBar from '@/components/SideBar';
import Footer from '@/components/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [height, setHeight] = useState('100vh');

  // Dynamically update the viewport height on mobile devices
  useEffect(() => {
    const updateHeight = () => setHeight(`${window.innerHeight}px`);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <SideBar>
      {/* Main container with dynamic height */}
      <Flex
        direction="column"
        minH={height}
        overflow="hidden" // Prevent body from scrolling
      >
        {/* Scrollable content area */}
        <Box flex="1" overflowY="auto">
          {children}
        </Box>

        {/* Footer fixed at the bottom of the layout */}
        <Box
          as="footer"
          w="100%"
          py="4"
          px="6"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} // Safe area for iOS devices
        >
          <Footer />
        </Box>
      </Flex>
    </SideBar>
  );
};

export default DashboardLayout;
