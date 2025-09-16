// app/dashboard/layout.tsx
'use client';

import SideBar from '@/components/SideBar';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [height, setHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => setHeight(`${window.innerHeight}px`);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <SideBar>
      <Box
        minH={height}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Box flex="1" overflowY="auto">
          {children}
        </Box>
        <Footer />
      </Box>
    </SideBar>
  );
};

export default DashboardLayout;
