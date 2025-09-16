// app/dashboard/layout.tsx
import SideBar from '@/components/SideBar';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SideBar>
      {children}
    </SideBar>
  );
};

export default DashboardLayout;