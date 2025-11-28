/**
 * Konfigurasi grouping kabupaten/kota untuk filter
 * Digunakan untuk mengelompokkan kabupaten/kota berdasarkan pulau/wilayah
 * 
 * Menggunakan pattern matching untuk handle variasi penulisan
 * (misalnya: KLU = Lombok Utara, dll)
 */

export interface KabupatenGroup {
  groupName: string;
  // Pattern/keywords untuk match kabupaten dari database
  // Bisa berupa exact match atau partial match (case-insensitive)
  patterns: string[];
}

export const kabupatenGroups: KabupatenGroup[] = [
  {
    groupName: 'Pulau Lombok',
    patterns: [
      'Lombok Barat',
      'Kanwil',
      'Kanwil NTB',
      'PROVINSI NTB', // Format di database
      'Mataram',
      'Lombok Timur',
      'Lombok Tengah',
      'KLU',
      'Lombok Utara' // Handle variasi penulisan
    ]
  },
  {
    groupName: 'Sumbawa',
    patterns: [
      // Semua kabupaten/kota lainnya yang tidak masuk Lombok
      // Akan diisi secara dinamis dari database
    ]
  }
];

/**
 * Normalize kabupaten name untuk matching
 * - Convert to lowercase
 * - Remove extra spaces
 * - Remove common prefixes (KABUPATEN, KOTA, etc)
 */
export function normalizeKabupatenName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(kabupaten|kota|kab\.|kab)\s*/i, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Check if kabupaten name matches any pattern in a group
 * Uses case-insensitive partial matching
 */
export function matchesKabupatenPattern(kabupatenName: string, patterns: string[]): boolean {
  const normalized = normalizeKabupatenName(kabupatenName);
  
  for (const pattern of patterns) {
    const normalizedPattern = normalizeKabupatenName(pattern);
    
    // Exact match setelah normalize
    if (normalized === normalizedPattern) {
      return true;
    }
    
    // Partial match - check if pattern contains in name or vice versa
    if (normalized.includes(normalizedPattern) || normalizedPattern.includes(normalized)) {
      return true;
    }
    
    // Special case: KLU = Lombok Utara
    if ((pattern === 'KLU' || pattern === 'klu') && normalized.includes('lombok utara')) {
      return true;
    }
    if ((normalized === 'klu' || normalized.includes('klu')) && pattern.toLowerCase().includes('lombok utara')) {
      return true;
    }
    
    // Special case: Kanwil = PROVINSI NTB (format di database)
    if ((pattern.toLowerCase().includes('kanwil') || normalized.includes('kanwil')) && 
        (normalized.includes('provinsi ntb') || pattern.toLowerCase().includes('provinsi ntb'))) {
      return true;
    }
    // Match "Kanwil" dengan "PROVINSI NTB" atau sebaliknya
    if (normalized.includes('kanwil') && (normalized.includes('ntb') || normalized.includes('provinsi'))) {
      return true;
    }
    if (normalized.includes('provinsi ntb') && pattern.toLowerCase().includes('kanwil')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all kabupaten names from database that match a specific group
 * This function should be called with actual kabupaten list from DB
 */
export function getKabupatenByGroupFromDB(
  groupName: string, 
  allKabupatenFromDB: string[]
): string[] {
  const group = kabupatenGroups.find(g => g.groupName === groupName);
  if (!group) return [];
  
  // For Sumbawa group, return all that don't match Lombok patterns
  if (groupName === 'Sumbawa') {
    const lombokGroup = kabupatenGroups.find(g => g.groupName === 'Pulau Lombok');
    const lombokPatterns = lombokGroup?.patterns || [];
    
    return allKabupatenFromDB.filter(kab => {
      return !matchesKabupatenPattern(kab, lombokPatterns);
    });
  }
  
  // For other groups, match against patterns
  return allKabupatenFromDB.filter(kab => {
    return matchesKabupatenPattern(kab, group.patterns);
  });
}

/**
 * Get group name for a specific kabupaten (from DB)
 */
export function getGroupByKabupatenFromDB(
  kabupaten: string,
  allKabupatenFromDB: string[]
): string | null {
  for (const group of kabupatenGroups) {
    if (group.groupName === 'Sumbawa') continue; // Skip Sumbawa, handled separately
    
    if (matchesKabupatenPattern(kabupaten, group.patterns)) {
      return group.groupName;
    }
  }
  
  // If not matched, it's Sumbawa
  return 'Sumbawa';
}

/**
 * Get all patterns from all groups (for exclusion logic)
 */
export function getAllGroupPatterns(): string[] {
  return kabupatenGroups.flatMap(group => group.patterns);
}

