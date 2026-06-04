import { auth } from "@/auth";

// Geçerli oturumdaki kullanıcıyı döner (yoksa null).
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  return user.id;
}
