import AppHeader from '@/components/custom/Dashboard/AppHeader';
import AppSidebar from '@/components/custom/Dashboard/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import '@/components/custom/Dashboard/dashboard.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="dashboard-shell" style={{ '--sidebar-width': '18rem', '--sidebar-width-icon': '4.5rem' } as React.CSSProperties}>
      <AppSidebar />
      <div className="dashboard-main">
        <AppHeader />
        <main id="dashboard-content" className="dashboard-content">{children}</main>
      </div>
    </SidebarProvider>
  );
}
