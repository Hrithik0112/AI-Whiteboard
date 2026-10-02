"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { ArrowRight, Circle, Diamond, Eraser, Hand, Image, Minus, MousePointer, Pencil, Sparkles, Square, Type } from 'lucide-react';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import './whiteboard.css'
import FloatingProperties from './FloatingProperties';
import AIFloatingSidebar from './AIFloatingSidebar';
import { Button } from '@/components/ui/button';

const tools = [
    {
        name: 'selection',
        icon: MousePointer,
        color: 'text-gray-700',
    },
    {
        name: 'rectangle',
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

type Props = {
    onApiReady: (api: ExcalidrawImperativeAPI) => void
}

const Whiteboard = ({ onApiReady }: Props) => {

    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    const { projectId } = useParams();
    const saveTimeRef = useRef<NodeJS.Timeout | null>(null);
    const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);


    const [activeTool, setActiveTool] = useState('selection');
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [canvasState, setCanvasState] = useState<any>(null);
    const [ShowAiSidebar, setShowAiSidebar] = useState(false);

    const handleCanvasChange = (elements: readonly any[], appstate: any, files: any) => {

        // Detect selected element
        const selectedIds = Object.keys(appstate.selectedElementIds || {});
        if (selectedIds.length === 1) {
            const element = elements.find((el) => el.id === selectedIds[0]);
            console.log(element);
            setSelectedElement(element ?? null);
        } else {
            setSelectedElement(null);
        }

        setCanvasState(appstate);

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

    useEffect(() => {
        const handleMouseUp = () => {
            setTimeout(() => {
                const api = excalidrawAPIRef.current;
                if (!api) return;
                const appState = api.getAppState();
                const elements = api.getSceneElements();
                const selectedIds = Object.keys(appState.selectedElementIds || {});
                if (selectedIds.length === 1) {
                    const element = elements.find((el) => el.id === selectedIds[0]);
                    setSelectedElement(element ?? null);
                } else {
                    setSelectedElement(null);
                }
            }, 50);
        };

        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, []);

    const changeTool = (tool: any) => {
        if (!excalidrawAPI) return;
        setActiveTool(tool);
        excalidrawAPI.setActiveTool({ type: tool });
    }

    const getFloatingPosition = () => {
        if (!selectedElement || !canvasState) {
            return { left: 0, top: 0 };
        }
        const zoom = canvasState.zoom?.value ?? 1;
        const scrollX = canvasState.scrollX ?? 0;
        const scrollY = canvasState.scrollY ?? 0;
        // center of selected element
        const centerX = selectedElement.x + selectedElement.width / 2;
        // screen coordinates
        const screenX = (centerX + scrollX) * zoom;
        const centerY = selectedElement.y + selectedElement.height / 2;
        const screenY = (centerY + scrollY) * zoom;

        return {
            left: screenX,
            top: screenY - 60,
        };
    };

    const handlePropertyChange = (property: string, value: any) => {
        if (!excalidrawAPI || !selectedElement) return;
        const elements = excalidrawAPI.getSceneElements();
        const updatedElements = elements.map((el) => {
            if (el.id === selectedElement.id) {
                return {
                    ...el,
                    [property]: value,
                };
            }
            return el;
        });
        excalidrawAPI.updateScene({ elements: updatedElements });
        setSelectedElement((prev: any) => (prev ? { ...prev, [property]: value } : null));
    };

    const handleDelete = () => {
        if (!excalidrawAPI || !selectedElement) return;
        const elements = excalidrawAPI.getSceneElements();
        const updatedElements = elements.filter((el) => el.id !== selectedElement.id);
        excalidrawAPI.updateScene({ elements: updatedElements });
        setSelectedElement(null);
    };

    const handleDuplicate = () => {
        if (!excalidrawAPI || !selectedElement) return;
        const elements = excalidrawAPI.getSceneElements();
        const newElement: any = {
            ...selectedElement,
            id: `${selectedElement.id}_copy_${Date.now()}`,
            x: selectedElement.x + 20,
            y: selectedElement.y + 20,
        };

        // If linear element (arrow/line), deep clone points and clear bindings to prevent non-normalized state
        if (Array.isArray(selectedElement.points)) {
            newElement.points = selectedElement.points.map((p: any) => [...p]);
            delete newElement.startBinding;
            delete newElement.endBinding;
        }
        delete newElement.boundElements;
        excalidrawAPI.updateScene({ elements: [...elements, newElement] });
    };

    const handleLock = () => {
        if (!excalidrawAPI || !selectedElement) return;
        const isLocked = !selectedElement.isLocked;
        handlePropertyChange("isLocked", isLocked);
    };

    const handleBringToFront = () => {
        if (!excalidrawAPI || !selectedElement) return;
        const elements = excalidrawAPI.getSceneElements();
        const target = elements.find((el) => el.id === selectedElement.id);
        if (!target) return;
        const rest = elements.filter((el) => el.id !== selectedElement.id);
        excalidrawAPI.updateScene({ elements: [...rest, target] });
    };

    const handleSendToBack = () => {
        if (!excalidrawAPI || !selectedElement) return;
        const elements = excalidrawAPI.getSceneElements();
        const target = elements.find((el) => el.id === selectedElement.id);
        if (!target) return;
        const rest = elements.filter((el) => el.id !== selectedElement.id);
        excalidrawAPI.updateScene({ elements: [target, ...rest] });
    };

    const floatingPosition = getFloatingPosition();

    return (
        <div style={{ height: "90vh" }}>
            <Excalidraw excalidrawAPI={(api) => {
                excalidrawAPIRef.current = api;
                setExcalidrawAPI(api)
            }} onChange={handleCanvasChange} />
            <FloatingProperties
                selectedElement={selectedElement}
                position={floatingPosition}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onLock={handleLock}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onPropertyChange={handlePropertyChange}
            />
            <div className='absolute left-4 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-1
            rounded-xl bg-white border p-1.5 shadow-xl'>
                {
                    tools.map((tool, index) => (
                        <button key={index} onClick={() => changeTool(tool.name)} className={`p-2 rounded-lg hover:bg-gray-100 ${tool.color} hover:cursor-pointer hover:bg-primary/10 ${activeTool === tool.name ? 'bg-primary/10' : ''}`}>
                            <tool.icon size={20} />
                        </button>
                    ))
                }
            </div>
            <div className="absolute right-15  bottom-2 z-50">
                <Button size={"lg"} onClick={() => setShowAiSidebar(!ShowAiSidebar)}>
                    <Sparkles />AI
                </Button>
            </div>
            {ShowAiSidebar && <AIFloatingSidebar onClose={() => setShowAiSidebar(false)} excalidrawAPI={excalidrawAPI} />}
        </div>
    )
}

export default Whiteboard