import { color } from '@fieldsolo/design-system/lib/tokens';

/** Net / net-per-hour on job cards and job detail. */
export function financialPositiveNegativeColor(cents: number | null | undefined): string {
  const c = cents ?? 0;
  return c >= 0
    ? color('Semantic/Financial/Positive')
    : color('Semantic/Financial/Negative');
}

/** Earnings snapshot and ranked rows (success green when non-negative). */
export function earningsSuccessNegativeColor(cents: number | null | undefined): string {
  const c = cents ?? 0;
  return c >= 0
    ? color('Semantic/Status/Success/Text')
    : color('Semantic/Financial/Negative');
}
