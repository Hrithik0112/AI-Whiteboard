"use client"
import React, {useRef, useState} from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { ArrowRight, Circle, Diamond, Eraser, Hand, Image, Minus, MousePointer, Pencil, Square, Type } from 'lucide-react';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import './whiteboard.css'

const tools = [
    {
        name: 'selection',
        icon: MousePointer,
        color: 'text-gray-700',
    },
    {
        name : 'rectangle',
        icon: Square,
        color: 'text-gray-700',
    },
    {
        name: 'hand',
        icon: Hand,
        color: 'text-gray-700',
    },
    {
        name: 'diamond',
        icon: Diamond,
        color: 'text-gray-700',
    },
    {
        name: 'ellipse',
        icon: Circle,
        color: 'text-gray-700',
    },
    {
        name: 'freedraw',
        icon: Pencil,
        color: 'text-gray-700',
    },
    {
        name: 'text',
        icon: Type,
        color: 'text-gray-700',
    },
    {
        name: 'image',
        icon: Image,
        color: 'text-gray-700',
    },
    {
        name: 'line',
        icon: Minus,
        color: 'text-gray-700',
    },
    {
        name: 'arrow',
        icon: ArrowRight,
        color: 'text-gray-700',
    },
    {
        name: 'eraser',
        icon: Eraser,
        color: 'text-gray-700',
    }
]

const Whiteboard = () => {

    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    const { projectId } = useParams();
    const saveTimeRef = useRef<NodeJS.Timeout | null>(null);

    const [activeTool, setActiveTool] = useState('selection');

    const handleCanvasChange = (elements: readonly any[], appstate: any, files: any) => {
        // cnacel previous save timeout if it exists
        if (saveTimeRef?.current) {
            clearTimeout(saveTimeRef.current);
        }

        // save new changes after 10 seconds of inactivity
        saveTimeRef.current = setTimeout(() => {
            // save method here
            // SaveCanvasChanges(elements, appstate, files);
            // toast.add({
            //     type: "success",
            //     title: "Changes Saved",
            // });
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

    const changeTool = (tool: any) => {
        if (!excalidrawAPI) return;
            setActiveTool(tool);
            excalidrawAPI.setActiveTool({  type: tool  });
    }

  return (
    <div style={{ height: "90vh" }}>
        <Excalidraw excalidrawAPI={(api)=> setExcalidrawAPI(api)} onChange={handleCanvasChange} />
            <div className='absolute left-4 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-1
            rounded-xl bg-white border p-1.5 shadow-xl'>
                {
                    tools.map((tool, index) => (
                        <button key={index} onClick={()=> changeTool(tool.name)} className={`p-2 rounded-lg hover:bg-gray-100 ${tool.color} hover:cursor-pointer hover:bg-primary/10 ${activeTool === tool.name ? 'bg-primary/10' : ''}`}>
                            <tool.icon size={20}/>
                        </button>
                    ))
                }
            </div>
      </div>
  )
}

export default Whiteboard