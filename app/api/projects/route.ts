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
    } catch {
        return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const projectId = req.nextUrl.searchParams.get('projectId');
    const archived = req.nextUrl.searchParams.get('archived') === 'true';
    try {
        if (!projectId) {
            const rows = await db.select({
                id: projects.id, projectId: projects.projectId, projectName: projects.projectName,
                userEmail: projects.userEmail, createdAt: projects.createdAt, archived: projects.archived,
                updatedAt: whiteboardData.updatedAt, image: whiteboardData.image,
            }).from(projects).leftJoin(whiteboardData, eq(projects.projectId, whiteboardData.projectId))
              .where(and(eq(projects.userEmail, email), archived ? eq(projects.archived, true) : or(eq(projects.archived, false), isNull(projects.archived))))
              .orderBy(desc(projects.createdAt));
            return NextResponse.json(rows.map(row => ({ ...row, updatedAt: row.updatedAt || row.createdAt })), { headers: { 'Cache-Control': 'no-store' } });
        }
        const [project] = await db.select().from(projects).where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));
        if (!project) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        const [canvas] = await db.select().from(whiteboardData).where(eq(whiteboardData.projectId, projectId));
        return NextResponse.json({
            projectId, projectName: project.projectName, archived: !!project.archived,
            elements: canvas?.elements ?? [], appState: canvas?.appState ?? {}, files: canvas?.files ?? {},
            updatedAt: canvas?.updatedAt ?? project.createdAt,
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return NextResponse.json({ error: 'Unable to load your board. Please try again.' }, { status: 500 });
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
    } catch {
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
    } catch {
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}
