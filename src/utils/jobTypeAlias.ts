export function normalizeJobTypeName(rawName: string | null | undefined): string | null {
  if (!rawName) return rawName ?? null;
  const name = String(rawName).trim();

  // Centralized alias mapping for legacy/renamed job types
  const aliasMap: Record<string, string> = {
    // Legacy -> Current
    'Fungsional Lain': 'Jabatan Lain',
  };

  // Exact match first
  if (aliasMap[name]) return aliasMap[name];

  // Case-insensitive fallback
  const lower = name.toLowerCase();
  for (const [legacy, current] of Object.entries(aliasMap)) {
    if (legacy.toLowerCase() === lower) return current;
  }

  return name;
}


