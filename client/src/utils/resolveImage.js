const IMAGE_MAP = {
  // "naruto.jpg": naruto,
};
 
// ── Resolver ──────────────────────────────────────────────────────
export function resolveImage(value) {
  if (!value || value.trim() === "") return null;
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return IMAGE_MAP[v] ?? null;
}