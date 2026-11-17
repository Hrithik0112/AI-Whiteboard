import { db, projects , whiteboardData} from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc, or, sql } from "drizzle-orm";

import { BOARD_LIMIT } from '@/lib/board-usage';
import { withBoardQuotaLock } from '@/lib/server-board-usage';

export async function POST(req: NextRequest) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { projectName, projectId } = await req.json();
        if (typeof projectId !== 'string' || !projectId || typeof projectName !== 'string' || !projectName.trim() || projectName.trim().length > 30) {
            return NextResponse.json({ error: 'A board name of 1–30 characters and project ID are required' }, { status: 400 });
        }
        const [existing] = await db.select().from(projects).where(eq(projects.projectId, projectId));
        if (existing) {
            if (existing.userEmail !== email) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
            const [updated] = await db.update(projects).set({ projectName: projectName.trim() })
                .where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email))).returning();
            return NextResponse.json(updated);
        }
        const result = await withBoardQuotaLock(email, sql`
            insert into ${projects} ("projectId", "projectName", "userEmail", "archived")
            select ${projectId}, ${projectName.trim()}, ${email}, false
            where (select count(*) from ${projects} where "userEmail" = ${email} and "archived" is not true) < ${BOARD_LIMIT}
            on conflict ("projectId") do nothing
            returning *
        `);
        if (!result.rows.length) return NextResponse.json({ error: 'Insufficient Credits' }, { status: 409 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create board:', error);
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const isArchived = searchParams.get('archived') === 'true';

    // If no projectId is provided, return all projects for the logged-in user
    if (!projectId) {
        try {
            const user = await currentUser();
            const email = user?.primaryEmailAddress?.emailAddress || "guest@example.com";

            const userProjects = await db
                .select({
                    id: projects.id,
                    projectId: projects.projectId,
                    projectName: projects.projectName,
                    userEmail: projects.userEmail,
                    createdAt: projects.createdAt,
                    archived: projects.archived,
                    image: whiteboardData.image,
                    appState: whiteboardData.appState,
                    updatedAt: whiteboardData.updatedAt,
                })
                .from(projects)
                .leftJoin(whiteboardData, eq(projects.projectId, whiteboardData.projectId))
                .where(
                    isArchived
                        ? and(eq(projects.userEmail, email), eq(projects.archived, true))
                        : and(eq(projects.userEmail, email), or(eq(projects.archived, false), isNull(projects.archived)))
                )
                .orderBy(desc(projects.createdAt));

            const formatted = userProjects.map((p) => ({
                id: p.id,
                projectId: p.projectId,
                projectName: p.projectName,
                userEmail: p.userEmail,
                createdAt: p.createdAt,
                archived: p.archived,
                updatedAt: p.updatedAt || p.createdAt,
                image: p.image || (p.appState as any)?.image || null,
            }));

            return NextResponse.json(formatted);
        } catch (err: any) {
            console.error("GET /api/projects list error:", err);
            return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
        }
    }

    try {
        const projectResult = await db.select().from(projects).where(eq(projects.projectId, projectId));
        const project = projectResult?.[0];
        const projectName = project?.projectName || "Untitled Board";

        const result = await db.select().from(whiteboardData).where(eq(whiteboardData.projectId, projectId));

        if (result && result.length > 0) {
            return NextResponse.json({
                ...result[0],
                projectName: projectName,
                archived: project?.archived || false,
            });
        }

        // Default initial board object matching the structure in the tutorial
        const defaultBoard = {
            id: 1,
            projectId: projectId,
            projectName: projectName,
            elements: [],
            appState: { name: projectName, zoom: { value: 1 } },
            files: {},
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json(defaultBoard);
    } catch (err: any) {
        console.error("GET /api/projects error:", err);
        return NextResponse.json({
            id: 1,
            projectId: projectId,
            projectName: "Untitled Board",
            elements: [],
            appState: { name: "Untitled Board", zoom: { value: 1 } },
            files: {},
            updatedAt: new Date().toISOString()
        });
    }
}

export async function DELETE(req: NextRequest) {
    const projectId = req.nextUrl.searchParams.get('projectId');
    const permanent = req.nextUrl.searchParams.get('permanent') === 'true';
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!projectId) return NextResponse.json({ error: 'ProjectId is required' }, { status: 400 });

    try {
        const owned = and(eq(projects.projectId, projectId), eq(projects.userEmail, email));
        const [project] = await db.select().from(projects).where(owned);
        if (!project) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        if (permanent) {
            await db.batch([
                db.delete(whiteboardData).where(eq(whiteboardData.projectId, projectId)),
                db.delete(projects).where(owned),
            ]);
        } else {
            await db.update(projects).set({ archived: true }).where(owned);
        }
        // No credit increment: usage is counted from active boards. Repeated
        // archive calls and deleting archived boards cannot refund extra slots.
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete board:', error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const projectId = req.nextUrl.searchParams.get('projectId');
    const action = req.nextUrl.searchParams.get('action');
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!projectId || action !== 'restore') return NextResponse.json({ error: 'Invalid restore request' }, { status: 400 });

    try {
        const [project] = await db.select().from(projects).where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));
        if (!project) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        if (!project.archived) return NextResponse.json({ success: true });
        const result = await withBoardQuotaLock(email, sql`
            update ${projects} set "archived" = false
            where "projectId" = ${projectId} and "userEmail" = ${email}
            and ("archived" is not true or (select count(*) from ${projects} where "userEmail" = ${email} and "archived" is not true) < ${BOARD_LIMIT})
            returning "projectId"
        `);
        if (!result.rows.length) return NextResponse.json({ error: 'You already have 3 active boards. Archive a board before restoring this one.' }, { status: 409 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to restore board:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}
