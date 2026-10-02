"use client"
import { SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

const AppHeader = () => {
  return (
    <div className='w-full border-b p-4'>
      <SidebarTrigger />
    </div>
  )
}

export default AppHeader