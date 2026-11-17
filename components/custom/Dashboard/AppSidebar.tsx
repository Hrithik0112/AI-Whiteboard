"use client"
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenuButton } from '@/components/ui/sidebar'
import { useUser } from '@clerk/nextjs'
import { Archive, LayoutGrid, Settings, Sparkles, UserRound } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useContext } from 'react'
import CreateNewBoardDialog from './CreateNewBoardDialog'
import { UserDetailsContext } from '@/context/UserDetailsContext'
import Link from 'next/link'

const AppSidebar = () => {

    const path = usePathname()
    const {user} = useUser()
    const { userDetail } = useContext(UserDetailsContext) || {};
    const totalCredits = 3;
    const credits = userDetail?.credits !== undefined ? userDetail.credits : 3;
    const filesCreated = Math.max(0, Math.min(totalCredits, totalCredits - credits));
    const progressPercent = (filesCreated / totalCredits) * 100;
  return (
    <Sidebar>
    <SidebarHeader className='p-4'>
        <div className='flex items-center gap-2'>
            <Image src='/logo.svg' alt='user image' width={40} height={40} />
            <h2 className='text-xl font-bold'>Archflow</h2>
        </div>
    </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
            <CreateNewBoardDialog/>
        <SidebarGroup />
        <SidebarGroup>
            <SidebarGroupLabel>My Boards</SidebarGroupLabel>
            <Link href="/dashboard" className="block">
              <SidebarMenuButton className="p-5 w-full cursor-pointer" isActive={path=="/dashboard"}>
                  <LayoutGrid/>
                  <span>All Files</span>
              </SidebarMenuButton>
            </Link>
            <SidebarMenuButton className='p-5 mt-2' isActive={path === '/shared'}>
                <UserRound/>
                <span>Shared</span>
            </SidebarMenuButton>
            <Link href="/dashboard/archived" className="block">
              <SidebarMenuButton className="p-5 mt-2 w-full cursor-pointer" isActive={path=="/archived" || path=="/dashboard/archived"}>
                  <Archive/>
                  <span>Archived</span>
              </SidebarMenuButton>
            </Link>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Others</SidebarGroupLabel>
            <SidebarMenuButton className='p-5 mt-2' isActive={path === '/ai'}>
                <Sparkles/>
                <span>AI helper</span>
            </SidebarMenuButton>
            <SidebarMenuButton className='p-5 mt-2' isActive={path === '/settings'}>
                <Settings/>
                <span>Settings</span>
            </SidebarMenuButton>
            
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <CreateNewBoardDialog/>
        <div className='p-4 my-3 border rounded-md'>
            <h2 className="text-sm flex justify-between mb-1">
              {filesCreated} {filesCreated === 1 ? 'file' : 'files'} created 
              <span>total {totalCredits}</span>
            </h2>
            <Progress value={66} className='h-2 mt-2' />
        </div>
        <div className='flex items-center gap-2'>
            <Image src={user?.imageUrl ?? ''} alt='user image' width={40} height={40} className='rounded-full'/>
            <h2>{user?.firstName} {user?.lastName}</h2>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar