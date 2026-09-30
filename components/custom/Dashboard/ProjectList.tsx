"use client"
import { Button } from '@/components/ui/button'
import { Folder } from 'lucide-react'
import React, { useState } from 'react'
import CreateNewBoardDialog from './CreateNewBoardDialog'

const ProjectList = () => {
    const [projectList, setprojectList] = useState([])

    return (
        <div>
            {projectList.length === 0 ?
            //empty state
                <div className='flex flex-col items-center p-10 border rounded-xl'>
                    <Folder/>
                    <h2 className='text-2xl font-bold'>No Boards found</h2>
                    <p className='text-muted-foreground'>Create your first board to start brainstroming, Planning!</p>
                    <CreateNewBoardDialog/>
                </div> :
                <div>
                    {/* project list */}
                </div>
            }
        </div>
    )
}

export default ProjectList