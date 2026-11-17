'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function AppHeader() {
  const path = usePathname();
  const title = path.includes('/settings') ? 'Settings' : path.includes('/archived') ? 'Archived' : 'All boards';
  return <header className="db-header"><div><SidebarTrigger /><span>Workspace</span><ChevronRight size={13} /><strong>{title}</strong></div><span className="db-header-note">Space for your next big idea.</span></header>;
}
