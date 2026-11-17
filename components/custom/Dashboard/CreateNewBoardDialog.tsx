"use client"
import React, { useContext, useId, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { UserDetailsContext } from '@/context/UserDetailsContext'

interface CreateNewBoardDialogProps {
    children?: React.ReactElement;
}

const CreateNewBoardDialog = ({ children }: CreateNewBoardDialogProps) => {

    const nameId = useId();
    const [workspaceName, setWorkspaceName] = useState('')
    const [loading, setLoading] = useState(false)
    const [dailogOpen, setDialogOpen] = useState(false)

    const router = useRouter()

    const { refreshUserDetails } = useContext(UserDetailsContext) || {}

    const handleCreateBoard = async () => {
        if (workspaceName.trim() === "" || workspaceName.length > 30) {
            toast.add({
                type: "error",
                title: "Invalid Workspace Name",
                description: "Please enter a valid workspace name"
            })
            return;
        }
        setLoading(true)
        try {
            const projectId = crypto.randomUUID()
            await axios.post('/api/projects', {
                projectName: workspaceName.trim(),
                projectId: projectId
            })
            await refreshUserDetails?.();
            toast.add({
                type: "success",
                title: "New Workspace Created"
            })
            // Close dialog first, then navigate after it fully unmounts
            setDialogOpen(false);
            setWorkspaceName('');
            setTimeout(() => {
                router.push('/workspace/' + projectId)
            }, 150)
        } catch (error: any) {
            void refreshUserDetails?.();
            console.error(error);
            const msg = error?.response?.data?.error;
      if (msg === 'Insufficient Credits') {
        setDialogOpen(false);
        setWorkspaceName('');
        toast.add({
          type: "error",
          title: "Board limit reached",
          description: "You already have 3 active boards. Archive a board to make room for a new one."
        });
      } else {
        toast.add({
          type: "error",
          title: "Failed to create board",
          description: "Something went wrong. Please try again."
        });
    }
        } finally {
            setLoading(false);
        }
    }
    return (
        <Dialog open={dailogOpen} onOpenChange={(isOpen) => {
            setDialogOpen(isOpen);
            if (!isOpen) setWorkspaceName('');
        }}>
            <DialogTrigger render={children ?? <button className="db-button"><Plus size={16} />New board</button>} />
            <DialogContent className="db-dialog">
                <form onSubmit={(event) => { event.preventDefault(); if (!loading) handleCreateBoard(); }} className="db-create-form">
                    <DialogHeader>
                        <DialogTitle>A fresh space for your ideas.</DialogTitle>
                        <DialogDescription>Give your board a name. Make it your own.</DialogDescription>
                    </DialogHeader>
                    <div className="db-field">
                        <label htmlFor={nameId}>Board name</label>
                        <Input id={nameId} placeholder="e.g. My next big idea" value={workspaceName} maxLength={30} disabled={loading}
                            onChange={(event) => setWorkspaceName(event.target.value)} autoFocus />
                        <span>Up to 30 characters.</span>
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" type="button" disabled={loading} />}>Cancel</DialogClose>
                        <button className="db-button" type="submit" disabled={!workspaceName.trim() || loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {loading ? 'Creating…' : 'Create board'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateNewBoardDialog;
