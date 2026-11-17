"use client"

import { Button } from '@/components/ui/button';
import { ArrowLeft, DownloadIcon, Save } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
  projectName?: string;
  onExport: () => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
};

export default function WorkspaceHeader({ projectName, onExport, onSave, saving, disabled }: Props) {
  const router = useRouter();

  const handleBack = async () => {
    if (!disabled && !saving) await onSave();
    router.push('/dashboard');
  };

  return <header className="flex items-center justify-between gap-3 border-b p-3">
    <div className="flex min-w-0 items-center gap-3">
      <Button variant="ghost" onClick={handleBack}><ArrowLeft />Back</Button>
      <Link href="/dashboard" aria-label="Back to dashboard"><Image src="/logo.svg" alt="" width={35} height={35} /></Link>
      <h1 className="max-w-[240px] truncate text-base font-semibold">{projectName || 'Whiteboard'}</h1>
    </div>
    <div className="flex gap-2">
      <Button onClick={onSave} disabled={disabled || saving}><Save />{saving ? 'Saving…' : 'Save'}</Button>
      <Button variant="outline" onClick={onExport} disabled={disabled}><DownloadIcon />Export</Button>
    </div>
  </header>;
}
