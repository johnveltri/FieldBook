/** Returns the calendar year for an instant in an IANA time zone. */
export function calendarYearInTimeZone(date: Date, timeZone: string): number {
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  if (!Number.isInteger(year)) throw new Error('Could not resolve calendar year');
  return year;
}

/** Resolves the device's current IANA time zone, if the runtime exposes one. */
export function resolveReportingTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof timeZone === 'string' && timeZone.length > 0 ? timeZone : null;
  } catch {
    return null;
  }
}

/**
 * Builds the selectable export years from account creation through now,
 * inclusive, newest first. This is intentionally independent of job data.
 */
export function buildJobExportYears(
  createdAt: string,
  timeZone: string,
  now: Date = new Date(),
): number[] {
  const createdDate = new Date(createdAt);
  const firstYear = calendarYearInTimeZone(createdDate, timeZone);
  const currentYear = calendarYearInTimeZone(now, timeZone);
  if (firstYear > currentYear) throw new Error('Account creation is in the future');

  const years: number[] = [];
  for (let year = currentYear; year >= firstYear; year -= 1) years.push(year);
  return years;
}

