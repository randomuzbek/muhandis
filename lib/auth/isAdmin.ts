import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// ADMIN_TELEGRAM_IDS: virgülle ayrılmış Telegram id listesi
function adminIds(): Set<number> {
  const raw = process.env.ADMIN_TELEGRAM_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n)),
  );
}

export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const ids = adminIds();
  if (ids.size === 0) return false;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { telegramId: true },
  });
  return user?.telegramId ? ids.has(user.telegramId) : false;
}
