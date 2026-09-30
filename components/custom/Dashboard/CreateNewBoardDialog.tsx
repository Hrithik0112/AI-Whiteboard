import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const CreateNewBoardDialog = () => {

     const [workspaceName, setWorkspaceName] = useState('')
     const [loading, setLoading] = useState(false)
     const [dailogOpen, setDialogOpen] = useState(false)


     const router = useRouter()

     const handleCreateBoard = async () => {
        if(workspaceName.trim() === '' || workspaceName.length > 30) {
            toast.add({
                type: 'error',
                title: 'Invalid workspace name',
                description: 'Please enter a valid workspace name (max 30 characters)',
            })
            return
        }
        setLoading(true)
        const projectId = crypto.randomUUID()
        const result = await axios.post('/api/projects', {
            projectName: workspaceName,
            projectId: projectId
        })

        console.log(result?.data)
        toast.add({
            type: 'success',
            title: 'New Workspace Created',
            description: `Workspace ${workspaceName} created successfully`,
        })
        setLoading(false)
        setDialogOpen(false)
        router.push(`/workspace/${projectId}`)
     }
  return (
    <Dialog open={dailogOpen} onOpenChange={setDialogOpen}>
  <DialogTrigger>
    <Button className="w-full">
        <Plus/>
        Create New Board
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Whiteboard Workspace Title</DialogTitle>
      
    </DialogHeader>
    <div>
        <label>
            Enter whiteboard workspace name
        </label>
        <Input placeholder='workspace name' 
        onChange={(e) => setWorkspaceName(e.target.value)} />
    </div>
    <DialogFooter>
    <DialogClose>
        <Button variant="outline">
            Close
        </Button>
    </DialogClose>
    <Button onClick={handleCreateBoard} disabled={workspaceName.length === 0 || loading}>
        {loading && <Loader2 className="animate-spin" />}
        Create
    </Button>
  </DialogFooter>
  </DialogContent>
  
</Dialog>
  )
}

export default CreateNewBoardDialog