"use client"
import React, {useRef, useState} from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';

const Whiteboard = () => {

    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const { projectId } = useParams();
    const saveTimeRef = useRef<NodeJS.Timeout | null>(null);

    const handleCanvasChange = (elements: readonly any[], appstate: any, files: any) => {
        // cnacel previous save timeout if it exists
        if (saveTimeRef?.current) {
            clearTimeout(saveTimeRef.current);
        }

        // save new changes after 10 seconds of inactivity
        saveTimeRef.current = setTimeout(() => {
            // save method here
            SaveCanvasChanges(elements, appstate, files);
            toast.add({
                type: "success",
                title: "Changes Saved",
            });
        }, 10000);
    }

    const SaveCanvasChanges = async (elements: readonly any[], appstate: any, files: any) => {
            const result = await axios.post('/api/whiteboard', {
                projectId,
                elements,
                appState: appstate,
                files
            }); 
    }
  return (
    <div style={{ height: "90vh" }}>
        <Excalidraw excalidrawAPI={(api)=> setExcalidrawAPI(api)} onChange={handleCanvasChange} />
      </div>
  )
}

export default Whiteboard