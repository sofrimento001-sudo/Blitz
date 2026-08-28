/**
 * Brazilian locale formatting utilities for numbers, percentages, and dates.
 */

// Formats a number with thousand separators (e.g. 1.250.400)
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Formats a percentage with 1 or 2 decimals (e.g. 12,4% or 3,25%)
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '0,0%';
  return (
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) + '%'
  );
}

/**
 * Normalizes ANY date input (DD/MM/AAAA, YYYY-MM-DD, ISO string, Date object)
 * into canonical standard YYYY-MM-DD string.
 */
export function normalizeDateToIso(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'nan' || str.toLowerCase() === 'undefined') return '';

  // Clean time components if present ("T12:00:00" or " 12:00:00")
  const dateOnly = str.split('T')[0].split(' ')[0].trim();

  // Match DD/MM/AAAA or DD-MM-AAAA or DD.MM.AAAA
  const brMatch = dateOnly.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Match YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD
  const isoMatch = dateOnly.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback to standard JavaScript Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return dateOnly;
}

// Formats date from YYYY-MM-DD, ISO or DD/MM/AAAA to DD/MM/AAAA
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.includes('NaN') || dateStr.includes('undefined')) return '-';
  const iso = normalizeDateToIso(dateStr);
  if (!iso) return dateStr;
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
}

// Formats date to short DD/MM
export function formatDateShortBR(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.includes('NaN') || dateStr.includes('undefined')) return '-';
  const iso = normalizeDateToIso(dateStr);
  if (!iso) return dateStr;
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
  }
  return dateStr;
}

// Calculates difference in days between two dates (Data Bloqueio - Data Chegada)
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const startIso = normalizeDateToIso(startDateStr);
  const endIso = normalizeDateToIso(endDateStr);
  if (!startIso || !endIso) return 0;
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}
