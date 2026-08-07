import { formatUsdCombined } from './formatUsd';

/** Matches `job_costs.cost_type` check constraint (excluding `material`). */
export type JobOtherCostType =
  | 'helper_labor'
  | 'equipment_rental'
  | 'permit'
  | 'disposal'
  | 'travel_parking'
  | 'other';

export type JobOtherCostTypeOption = {
  id: JobOtherCostType;
  label: string;
  value: JobOtherCostType;
};

export const OTHER_COST_TYPE_OPTIONS: JobOtherCostTypeOption[] = [
  { id: 'helper_labor', label: 'Helper Labor', value: 'helper_labor' },
  { id: 'equipment_rental', label: 'Equipment Rental', value: 'equipment_rental' },
  { id: 'permit', label: 'Permit', value: 'permit' },
  { id: 'disposal', label: 'Disposal', value: 'disposal' },
  { id: 'travel_parking', label: 'Travel / Parking', value: 'travel_parking' },
  { id: 'other', label: 'Other', value: 'other' },
];

export function otherCostTypeLabel(type: JobOtherCostType): string {
  return OTHER_COST_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/** Phase 1 — local-only other cost row until API writers land in Phase 2. */
export type LocalOtherCostLine = {
  id: string;
  sessionId: string | null;
  costType: JobOtherCostType;
  description: string;
  costCents: number;
};

export type LocalOtherCostBucket = {
  id: string;
  kind: 'unassigned' | 'session';
  sessionDateLabel?: string;
  items: LocalOtherCostListItem[];
};

export type LocalOtherCostListItem = {
  id: string;
  sessionId: string | null;
  costType: JobOtherCostType;
  typeLabel: string;
  description: string;
  priceLabel: string;
  costCents: number;
};

export function buildLocalOtherCostBuckets(
  lines: LocalOtherCostLine[],
  sessionDateById: Map<string, string>,
): LocalOtherCostBucket[] {
  const unassigned: LocalOtherCostListItem[] = [];
  const bySession = new Map<string, LocalOtherCostListItem[]>();

  for (const line of lines) {
    const item: LocalOtherCostListItem = {
      id: line.id,
      sessionId: line.sessionId,
      costType: line.costType,
      typeLabel: otherCostTypeLabel(line.costType),
      description: line.description.trim(),
      priceLabel: formatUsdCombined(line.costCents),
      costCents: line.costCents,
    };
    if (line.sessionId == null) {
      unassigned.push(item);
    } else {
      const list = bySession.get(line.sessionId) ?? [];
      list.push(item);
      bySession.set(line.sessionId, list);
    }
  }

  const buckets: LocalOtherCostBucket[] = [];
  if (unassigned.length) {
    buckets.push({ id: 'oc-unassigned', kind: 'unassigned', items: unassigned });
  }
  for (const [sessionId, items] of bySession) {
    buckets.push({
      id: `oc-${sessionId}`,
      kind: 'session',
      sessionDateLabel: sessionDateById.get(sessionId),
      items,
    });
  }
  return buckets;
}
