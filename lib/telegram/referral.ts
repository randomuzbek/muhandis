// Davet (referans) yük (payload) biçimi: "ref_<userId>".
// Hem bot /start deep-link'inde (?start=ref_...) hem de Mini App
// start_param'ında (?startapp=ref_...) aynı biçim kullanılır.

export const REF_PREFIX = "ref_";

export function parseRefPayload(payload?: string | null): string | null {
  if (!payload) return null;
  if (!payload.startsWith(REF_PREFIX)) return null;
  const id = payload.slice(REF_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

export function buildRefPayload(userId: string): string {
  return `${REF_PREFIX}${userId}`;
}
