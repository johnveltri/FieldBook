/** Integer cents → `$` / `-$` + formatted digits (single string for right-aligned money columns). */
export function formatUsdParts(cents: number): { prefix: string; amount: string } {
  const negative = cents < 0;
  const dollars = Math.abs(cents) / 100;
  const formattedDollars = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  return {
    prefix: negative ? '-$' : '$',
    amount: formattedDollars,
  };
}

export function formatUsdCombined(cents: number): string {
  const { prefix, amount } = formatUsdParts(cents);
  return `${prefix}${amount}`;
}
