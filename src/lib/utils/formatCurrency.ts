/**
 * Format a number as currency in Bahraini Dinar (BD)
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'BD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'BD'): string {
  if (isNaN(amount)) {
    return `0.000 ${currency}`;
  }
  
  return `${amount.toFixed(3)} ${currency}`;
}

/**
 * Format a number as currency without the currency symbol
 * @param amount - The amount to format
 * @returns Formatted amount string
 */
export function formatAmount(amount: number): string {
  if (isNaN(amount)) {
    return '0.000';
  }
  
  return amount.toFixed(3);
}

/**
 * Parse a currency string to a number
 * @param currencyString - The currency string to parse
 * @returns The parsed number or 0 if invalid
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
} 