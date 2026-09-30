import { db, projects } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const {projectName, projectId} = await request.json()

    const user = await currentUser()

    if(!projectName || !projectId) {
        return NextResponse.json({error: 'Project information missing'}, {status: 400})
    }

    const result = await db.insert(projects).values({
        projectId,
        projectName,
        userEmail: user?.emailAddresses[0].emailAddress ?? '',
    }).returning()

    return NextResponse.json(result[0])
}