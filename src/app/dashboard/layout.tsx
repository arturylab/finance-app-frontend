// app/dashboard/layout.tsx
import SideBar from '@/components/SideBar';
import Footer from '@/components/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SideBar>
      {children}
      <Footer />
    </SideBar>
  );
};

export default DashboardLayout;