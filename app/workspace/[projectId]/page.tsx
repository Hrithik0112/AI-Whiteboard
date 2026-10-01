"use client"
import Doc from '@/components/custom/Workspace/Doc';
import Whiteboard from '@/components/custom/Workspace/Whiteboard';
import WorkspaceHeader from '@/components/custom/Workspace/WorkspaceHeader'
import React, { useState }  from 'react'

const WorkspacePage = () => {

    const [activeTab, setActiveTab] = useState<string>('whiteboard');
  return (
    <div>
        <WorkspaceHeader selectedTab={(value: string) => setActiveTab(value)} />
        {activeTab === 'whiteboard' ? (
            <Whiteboard/>
        ) : (
            <Doc/>
        )}
    </div>
  )
}

export default WorkspacePage