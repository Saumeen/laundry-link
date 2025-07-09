/**
 * Unit conversion and formatting utilities for Laundry Link
 */

/**
 * Format a number as Bahraini Dinar (BD) currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatBDCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BH', {
    style: 'currency',
    currency: 'BHD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
}

/**
 * Convert pounds to kilograms
 * @param lb - Weight in pounds
 * @returns Weight in kilograms
 */
export function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

/**
 * Convert kilograms to pounds
 * @param kg - Weight in kilograms
 * @returns Weight in pounds
 */
export function kgToLb(kg: number): number {
  return kg * 2.20462262185;
}

/**
 * Format weight in kilograms
 * @param kg - Weight in kilograms
 * @returns Formatted weight string
 */
export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}
