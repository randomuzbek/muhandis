import "server-only";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Bu kullanıcının davetiyle katılan kişi sayısı.
export async function getReferralCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.referredBy, userId));
  return Number(row?.value ?? 0);
}
