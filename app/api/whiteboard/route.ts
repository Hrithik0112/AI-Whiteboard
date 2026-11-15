import { db, whiteboardData, projects  } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {

        const { projectId, elements, appState, files } = await req.json();
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress || "guest@example.com";

        if (!projectId) {
            return NextResponse.json({ error: "ProjectId is required" }, { status: 400 });
        }

        // Ensure project exists in projects table to satisfy foreign key constraint
        const existingProject = await db.select().from(projects).where(eq(projects.projectId, projectId));
        if (!existingProject || existingProject.length === 0) {
            await db.insert(projects).values({
                projectId: projectId,
                projectName: "Untitled Board",
                userEmail: email
            });
        }
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
    } catch (error: any) {
        console.error("Whiteboard save error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}       

