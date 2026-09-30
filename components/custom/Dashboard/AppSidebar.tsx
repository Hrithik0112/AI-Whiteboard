"use client"
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenuButton } from '@/components/ui/sidebar'
import { useUser } from '@clerk/nextjs'
import { Archive, LayoutGrid, Settings, Sparkles, UserRound } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react'

const AppSidebar = () => {

    const path = usePathname()
    const {user} = useUser()
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
            <Button>+ Create New Board</Button>
        <SidebarGroup />
        <SidebarGroup>
            <SidebarGroupLabel>My Board</SidebarGroupLabel>
            <SidebarMenuButton className='p-5' isActive={path === '/dashboard'}>
                <LayoutGrid/>
                <span>All files</span>
            </SidebarMenuButton>
            <SidebarMenuButton className='p-5 mt-2' isActive={path === '/shared'}>
                <UserRound/>
                <span>Shared</span>
            </SidebarMenuButton>
            <SidebarMenuButton className='p-5 mt-2' isActive={path === '/Archived'}>
                <Archive/>
                <span>Archived</span>
            </SidebarMenuButton>
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
        <Button>
            + Create New Board
        </Button>
        <div className='p-4 my-3 border rounded-md'>
            <h2 className='text-sm flex justify-between mb-1'>2 files created</h2>
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