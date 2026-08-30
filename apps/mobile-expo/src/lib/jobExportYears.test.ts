import { describe, expect, it } from '@jest/globals';

import {
  buildJobExportYears,
  calendarYearInTimeZone,
} from './jobExportYears';

describe('job export year options', () => {
  it('includes only the creation year when the account and current year match', () => {
    expect(buildJobExportYears('2026-02-01T12:00:00.000Z', 'America/Chicago', new Date('2026-08-29T12:00:00.000Z'))).toEqual([2026]);
  });

  it('includes each year through the current year, newest first', () => {
    expect(buildJobExportYears('2026-12-31T23:30:00.000Z', 'America/Chicago', new Date('2027-01-01T06:30:00.000Z'))).toEqual([2027, 2026]);
  });

  it('uses the reporting timezone at year boundaries', () => {
    const instant = new Date('2027-01-01T00:30:00.000Z');
    expect(calendarYearInTimeZone(instant, 'America/Los_Angeles')).toBe(2026);
    expect(calendarYearInTimeZone(instant, 'America/Chicago')).toBe(2026);
    expect(calendarYearInTimeZone(instant, 'Asia/Tokyo')).toBe(2027);
  });

  it('rejects invalid dates and a future creation year', () => {
    expect(() => buildJobExportYears('not-a-date', 'UTC', new Date('2026-01-01T00:00:00Z'))).toThrow();
    expect(() => buildJobExportYears('2027-01-01T00:00:00Z', 'UTC', new Date('2026-01-01T00:00:00Z'))).toThrow();
  });
});
