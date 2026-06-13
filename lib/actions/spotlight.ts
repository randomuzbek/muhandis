"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { spotlights } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/isAdmin";

type Result = { ok: true } | { ok: false; error: string };

function clean(v: FormDataEntryValue | null, max: number): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
}

// Yeni "Haftaning muhandisi" yayınla — yalnızca admin.
export async function createSpotlight(formData: FormData): Promise<Result> {
  const me = await getSessionUser();
  if (!(await isAdmin(me?.id))) return { ok: false, error: "FORBIDDEN" };

  const userId = clean(formData.get("userId"), 64);
  if (!userId) return { ok: false, error: "NO_USER" };

  await db.insert(spotlights).values({
    userId,
    quote: clean(formData.get("quote"), 500),
    blurb: clean(formData.get("blurb"), 800),
  });

  // Landing'deki kart ve admin listesi tüm dillerde tazelensin.
  revalidatePath("/", "layout");
  return { ok: true };
}

// Bir spotlight kaydını kaldır — yalnızca admin.
export async function deleteSpotlight(id: number): Promise<Result> {
  const me = await getSessionUser();
  if (!(await isAdmin(me?.id))) return { ok: false, error: "FORBIDDEN" };

  await db.delete(spotlights).where(eq(spotlights.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}
