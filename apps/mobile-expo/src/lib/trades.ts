/**
 * Single source of truth for the trade dropdown presets and the
 * comma-joined display formatter used in the Profile screen.
 *
 * Trades are stored as `text[]` on `public.profiles` so users can pick more
 * than one. Custom values entered via the trade picker's free-text input
 * are appended to the same array verbatim.
 */

export type TradePreset = {
  id: string;
  label: string;
  /** Stored value — keeps the human label so the DB rows are self-describing. */
  value: string;
};

export const TRADE_PRESETS: ReadonlyArray<TradePreset> = [
  { id: 'plumbing', label: 'Plumbing', value: 'Plumbing' },
  { id: 'electrical', label: 'Electrical', value: 'Electrical' },
  { id: 'hvac', label: 'HVAC', value: 'HVAC' },
  { id: 'handyman', label: 'Handyman', value: 'Handyman' },
  { id: 'carpentry', label: 'Carpentry', value: 'Carpentry' },
  { id: 'contractor', label: 'Contractor', value: 'Contractor' },
  { id: 'painting', label: 'Painting', value: 'Painting' },
  { id: 'roofing', label: 'Roofing', value: 'Roofing' },
  { id: 'flooring', label: 'Flooring', value: 'Flooring' },
  { id: 'drywall', label: 'Drywall', value: 'Drywall' },
  { id: 'landscaping', label: 'Landscaping', value: 'Landscaping' },
  { id: 'appliances', label: 'Appliances', value: 'Appliances' },
  { id: 'auto-repair', label: 'Auto Repair', value: 'Auto Repair' },
];

/** Joins selected trades with ", " for the Trade row in the profile card. */
export function formatTradesForDisplay(trades: string[] | null | undefined): string {
  if (!trades || trades.length === 0) return '—';
  return trades.join(', ');
}
