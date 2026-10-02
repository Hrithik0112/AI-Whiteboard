"use client"
import Doc from '@/components/custom/Workspace/Doc';
import Whiteboard from '@/components/custom/Workspace/Whiteboard';
import WorkspaceHeader from '@/components/custom/Workspace/WorkspaceHeader'
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import React, { useState } from 'react'

const WorkspacePage = () => {

    const [activeTab, setActiveTab] = useState<string>('whiteboard');
    const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

    const handleExportImage = async () => {
        if (!api) return;
        const { exportToBlob } = await import("@excalidraw/excalidraw");
        const blob = await exportToBlob({
            elements: api.getSceneElements(),
            appState: {
                ...api.getAppState(),
                exportBackground: true
            },
            files: api.getFiles(),
            mimeType: 'image/png',
            quality: 1
        })
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

    }
    return (
        <div>
            <WorkspaceHeader selectedTab={(value: string) => setActiveTab(value)}
                onExport={() => handleExportImage()} />
            {activeTab === 'whiteboard' ? (
                <Whiteboard
                    onApiReady={(api) => {
                        setApi(api);

                    }}
                />
            ) : (
                <Doc />
            )}
        </div>
    )
}

export default WorkspacePage