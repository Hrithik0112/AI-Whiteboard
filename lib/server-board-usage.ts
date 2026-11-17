import { db, projects } from '@/db';
import { and, count, eq, isNull, or, sql, type SQL } from 'drizzle-orm';
import { boardUsage } from './board-usage';

export async function getBoardUsage(email: string) {
  const [result] = await db.select({ total: count() }).from(projects).where(
    and(eq(projects.userEmail, email), or(eq(projects.archived, false), isNull(projects.archived)))
  );
  return boardUsage(result.total);
}

// Neon HTTP batches run in a transaction. Serialize quota-consuming writes per
// user so simultaneous create/restore requests cannot claim the same last slot.
export async function withBoardQuotaLock(email: string, statement: SQL) {
  const [, result] = await db.batch([
    db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${email}, 0))`),
    db.execute(statement),
  ]);
  return result;
}
