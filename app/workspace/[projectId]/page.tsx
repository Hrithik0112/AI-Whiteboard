"use client"

import { generatePreviewBase64, normalizeAppState } from '@/utils/helper';
import Whiteboard from '@/components/custom/Workspace/Whiteboard';
import WorkspaceHeader from '@/components/custom/Workspace/WorkspaceHeader';
import { toast } from '@/components/ui/toast';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [projectName, setProjectName] = useState('');
  const [boardData, setBoardData] = useState<any>(null);
  const [loadingError, setLoadingError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleApiReady = useCallback((newApi: ExcalidrawImperativeAPI) => setApi(newApi), []);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    setBoardData(null);
    setLoadingError('');
    axios.get(`/api/projects?projectId=${encodeURIComponent(projectId)}`, { signal: controller.signal })
      .then(({ data }) => {
        if (data.archived) {
          setLoadingError('This board is archived. Restore it from your dashboard before editing.');
          return;
        }
        setProjectName(data.projectName || data.appState?.name || '');
        setBoardData(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadingError(error.response?.data?.error || 'Could not load this board. Please try again.');
      });
    return () => controller.abort();
  }, [projectId, loadAttempt]);

  const handleSaveCanvas = async () => {
    if (!api || !projectId) return;
    setSaving(true);
    try {
      const preview = await generatePreviewBase64(api);
      await axios.post('/api/whiteboard', {
        projectId,
        elements: api.getSceneElements(),
        appState: api.getAppState(),
        files: api.getFiles(),
        image: preview,
      });
      toast.add({ title: 'Canvas saved', type: 'success' });
    } catch {
      toast.add({ title: 'Failed to save whiteboard', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportImage = async () => {
    if (!api) return;
    try {
      const { exportToBlob } = await import('@excalidraw/excalidraw');
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: true },
        files: api.getFiles(),
        mimeType: 'image/png',
        quality: 1,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.add({ title: 'Could not export the canvas', type: 'error' });
    }
  };

  return <div>
    <WorkspaceHeader projectName={projectName} onExport={handleExportImage} onSave={handleSaveCanvas} saving={saving} disabled={!api || !boardData} />
    {loadingError ? (
      <div role="alert" className="flex flex-col items-center gap-5 p-12">
        <p>{loadingError}</p>
        <button className="rounded border px-4 py-2" onClick={() => setLoadAttempt(value => value + 1)}>Retry loading</button>
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
    ) : !boardData ? (
      <p role="status" className="p-12 text-center">Loading your board…</p>
    ) : (
      <Whiteboard
        key={projectId}
        onApiReady={handleApiReady}
        initialData={{
          elements: boardData.elements || [],
          appState: normalizeAppState(boardData.appState),
          files: boardData.files || {},
        } as ExcalidrawInitialDataState}
      />
    )}
  </div>;
}
