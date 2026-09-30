import AppHeader from '@/components/custom/Dashboard/AppHeader'
import AppSidebar from '@/components/custom/Dashboard/AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'

const Dashboardlayout = ({children } : {children : React.ReactNode}) => {
  return (
    <SidebarProvider>
        <AppSidebar/>
        <div className='flex flex-1 flex-col'>
            <AppHeader/>
            {children}
        </div>
    </SidebarProvider>
  )
}

export default Dashboardlayout