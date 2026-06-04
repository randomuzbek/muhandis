// Gönderi türleri — hem client hem server tarafından kullanılır
// (bu yüzden server-only feed.ts'ten ayrı tutuluyor).
export const POST_TYPES = ["post", "question", "project"] as const;
export type PostType = (typeof POST_TYPES)[number];
