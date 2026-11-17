import { db, users } from '@/db';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getBoardUsage } from '@/lib/server-board-usage';

export async function POST() {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';
    await db.insert(users).values({ name, email }).onConflictDoNothing({ target: users.email });
    const [record] = await db.select().from(users).where(eq(users.email, email));
    // Stored credits may have drifted in older versions. Active boards are the
    // source of truth; archived boards never consume a slot.
    return NextResponse.json({ ...record, ...await getBoardUsage(email) });
  } catch (error) {
    console.error('Failed to load user details:', error);
    return NextResponse.json({ error: 'Failed to load user details' }, { status: 500 });
  }
}
