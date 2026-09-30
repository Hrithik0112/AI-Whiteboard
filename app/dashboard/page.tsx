import ProjectList from '@/components/custom/Dashboard/ProjectList'
import WelcomeBanner from '@/components/custom/Dashboard/WelcomeBanner'
import React from 'react'

const DashboardPage = () => {
  return (
    <div>
        <WelcomeBanner/>
        <ProjectList/>
    </div>
  )
}

export default DashboardPage