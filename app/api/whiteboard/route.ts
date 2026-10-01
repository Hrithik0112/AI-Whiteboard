import { db, whiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { projectId, elements, appState, files } = await req.json();

    const user = await currentUser();

    if( !user ) {
        return NextResponse.json('Unauthorized user', { status: 401 });
    }

    if(projectId) {
        try {
        const result = await db.insert(whiteboardData).values({
            projectId,
            elements,
            appState,
            files
        }).onConflictDoUpdate({
            target: whiteboardData.projectId,
            set: {
                elements,
                appState,
                files,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json('Error saving whiteboard changes', { status: 500 });
    }       
}

    return NextResponse.json('Project information is missing', { status: 400 });
}   