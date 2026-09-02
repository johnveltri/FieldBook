/** Local calendar date YYYY-MM-DD → Date at local midnight. */
export function localDateStringToDate(date: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

export function dateToLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function combineDateAndTime(dateSource: Date, timeSource: Date): Date {
  const out = new Date(dateSource);
  out.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return out;
}
