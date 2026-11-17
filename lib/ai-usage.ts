import { db, aiDailyUsage } from '@/db';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { AI_DAILY_LIMIT } from '@/lib/ai-limits';

export async function reserveAiAttempt(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const [usage] = await db.insert(aiDailyUsage)
    .values({ userId, day, requests: 1 })
    .onConflictDoUpdate({
      target: [aiDailyUsage.userId, aiDailyUsage.day],
      set: { requests: sql`${aiDailyUsage.requests} + 1` },
      setWhere: lt(aiDailyUsage.requests, AI_DAILY_LIMIT),
    })
    .returning({ requests: aiDailyUsage.requests });

  return usage ? AI_DAILY_LIMIT - usage.requests : null;
}

export async function refundAiAttempt(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  const [usage] = await db.update(aiDailyUsage)
    .set({ requests: sql`${aiDailyUsage.requests} - 1` })
    .where(and(
      eq(aiDailyUsage.userId, userId),
      eq(aiDailyUsage.day, day),
      gt(aiDailyUsage.requests, 0),
    ))
    .returning({ requests: aiDailyUsage.requests });

  return usage ? AI_DAILY_LIMIT - usage.requests : null;
}
