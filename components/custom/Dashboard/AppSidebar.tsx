'use client';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserButton, useUser } from '@clerk/nextjs';
import { Archive, ArrowUpRight, Gauge, Home, LayoutGrid, Settings, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useContext } from 'react';
import { UserDetailsContext } from '@/context/UserDetailsContext';
import { BOARD_LIMIT } from '@/lib/board-usage';
import { usePathname } from 'next/navigation';

export default function AppSidebar() {
  const path = usePathname();
  const { userDetail, userDetailsError, refreshUserDetails } = useContext(UserDetailsContext) || {};
  const { user } = useUser();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const collapsed = !isMobile && state === 'collapsed';
  const usageLabel = userDetail ? `${userDetail.boardCount} of ${userDetail.boardLimit} active boards` : userDetailsError ? 'Board count unavailable. Open settings to retry.' : 'Loading board usage';
  const navigation = [
    { href: '/dashboard', label: 'All boards', Icon: LayoutGrid },
    { href: '/dashboard/archived', label: 'Archived', Icon: Archive },
    { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <TooltipProvider delay={150}>
      <Sidebar collapsible="icon" className={`dashboard-sidebar${collapsed ? ' is-collapsed' : ''}`}>
        <SidebarHeader className="db-sidebar-header">
          <Link href="/" className="db-brand" aria-label="Archflow home"><Image src="/logo.svg" alt="" width={30} height={22} /><span className="db-brand-name">archflow<span>.</span></span></Link>
          {isMobile && <button className="db-icon-button" onClick={() => setOpenMobile(false)} aria-label="Close navigation"><X size={18} /></button>}
        </SidebarHeader>
        <SidebarContent className="db-sidebar-content">
          <span className="db-eyebrow">WORKSPACE</span>
          <nav className="db-nav" aria-label="Workspace navigation">
            {navigation.map(({ href, label, Icon }) => <Tooltip key={href}>
              <TooltipTrigger render={<Link href={href} aria-label={label} aria-current={path === href ? 'page' : undefined} onClick={() => setOpenMobile(false)} />}><Icon size={19} /><span>{label}</span></TooltipTrigger>
              {collapsed && <TooltipContent side="right" sideOffset={12}>{label}</TooltipContent>}
            </Tooltip>)}
          </nav>
          <div className="db-sidebar-note"><span>A little room to think.</span><p>All your ideas, in one place.</p></div>
        </SidebarContent>
        <SidebarFooter className="db-sidebar-footer">
          {collapsed ? <Tooltip><TooltipTrigger render={<Link href="/dashboard/settings" className="db-usage-icon" aria-label={usageLabel} />}><Gauge size={19} /><span>{userDetail?.boardCount ?? '—'}</span></TooltipTrigger><TooltipContent side="right" sideOffset={12}>{usageLabel}</TooltipContent></Tooltip> : <div className="db-board-usage" aria-live="polite">
            <div><span>Active boards</span><strong>{userDetail ? `${userDetail.boardCount} / ${userDetail.boardLimit}` : `— / ${BOARD_LIMIT}`}</strong></div>
            {userDetail ? <>
              <progress aria-label="Active board usage" value={Math.min(userDetail.boardCount, userDetail.boardLimit)} max={userDetail.boardLimit} />
              <p>{userDetail.credits > 0 ? `${userDetail.credits} ${userDetail.credits === 1 ? 'board' : 'boards'} available` : 'Limit reached. Archive a board to make room.'}</p>
            </> : userDetailsError ? <p>Count unavailable. <button onClick={() => void refreshUserDetails?.()}>Retry</button></p> : <p>Loading board usage…</p>}
          </div>}
          <Tooltip><TooltipTrigger render={<Link href="/" className="db-home-link" aria-label="Back to home" />}><Home size={18} /><span>Back to home</span>{!collapsed && <ArrowUpRight size={14} />}</TooltipTrigger>{collapsed && <TooltipContent side="right" sideOffset={12}>Back to home</TooltipContent>}</Tooltip>
          <div className="db-account"><UserButton /><div className="db-account-details"><strong title={user?.fullName || user?.username || 'Your workspace'}>{user?.fullName || user?.username || 'Your workspace'}</strong><span>Personal workspace</span></div></div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
