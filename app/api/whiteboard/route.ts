import { db, projects, whiteboardData } from '@/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { projectId, elements, appState, files, image } = body ?? {};
  if (typeof projectId !== 'string' || !projectId || !Array.isArray(elements) ||
      !appState || typeof appState !== 'object' || Array.isArray(appState) ||
      !files || typeof files !== 'object' || Array.isArray(files) ||
      (image != null && typeof image !== 'string')) {
    return NextResponse.json({ error: 'Invalid canvas data' }, { status: 400 });
  }

  try {
    const [project] = await db.select().from(projects).where(and(eq(projects.projectId, projectId), eq(projects.userEmail, email)));
    if (!project) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (project.archived) return NextResponse.json({ error: 'Restore this archived board before editing it.' }, { status: 403 });

    const [saved] = await db.insert(whiteboardData).values({
      projectId,
      elements,
      appState,
      files,
      image: image ?? null,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: whiteboardData.projectId,
      set: { elements, appState, files, image: image ?? null, updatedAt: new Date() },
    }).returning({ updatedAt: whiteboardData.updatedAt });

    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: 'Unable to save your board. Please retry.' }, { status: 500 });
  }
}
