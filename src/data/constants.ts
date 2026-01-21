/**
 * Centralized constants for business types, cuisine types, and countries with currencies.
 * All forms across the app should use these lists for consistency.
 */

export const BUSINESS_TYPES = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'bar', label: 'Bar' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'ghost_kitchen', label: 'Cocina Fantasma (Dark Kitchen)' },
  { value: 'panaderia', label: 'Panadería' },
  { value: 'pasteleria', label: 'Pastelería' },
  { value: 'heladeria', label: 'Heladería' },
  { value: 'taqueria', label: 'Taquería' },
  { value: 'pizzeria', label: 'Pizzería' },
  { value: 'catering', label: 'Catering' },
  { value: 'comedor_industrial', label: 'Comedor Industrial' },
  { value: 'cantina', label: 'Cantina' },
  { value: 'pub', label: 'Pub' },
  { value: 'otro', label: 'Otro (especificar)' },
] as const;

export const CUISINE_TYPES = [
  { value: 'mexicana', label: 'Mexicana' },
  { value: 'italiana', label: 'Italiana' },
  { value: 'japonesa', label: 'Japonesa' },
  { value: 'china', label: 'China' },
  { value: 'coreana', label: 'Coreana' },
  { value: 'tailandesa', label: 'Tailandesa' },
  { value: 'india', label: 'India' },
  { value: 'americana', label: 'Americana' },
  { value: 'francesa', label: 'Francesa' },
  { value: 'española', label: 'Española' },
  { value: 'peruana', label: 'Peruana' },
  { value: 'colombiana', label: 'Colombiana' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'arabe', label: 'Árabe' },
  { value: 'mediterranea', label: 'Mediterránea' },
  { value: 'mariscos', label: 'Mariscos' },
  { value: 'vegetariana', label: 'Vegetariana/Vegana' },
  { value: 'fusion', label: 'Fusión' },
  { value: 'cafeteria', label: 'Cafetería/Postres' },
  { value: 'otra', label: 'Otra (especificar)' },
] as const;

export interface CountryInfo {
  value: string;
  label: string;
  currency: string;
  currencySymbol: string;
  locale: string;
}

export const COUNTRIES: CountryInfo[] = [
  { value: 'México', label: 'México', currency: 'MXN', currencySymbol: '$', locale: 'es-MX' },
  { value: 'Colombia', label: 'Colombia', currency: 'COP', currencySymbol: '$', locale: 'es-CO' },
  { value: 'Argentina', label: 'Argentina', currency: 'ARS', currencySymbol: '$', locale: 'es-AR' },
  { value: 'Chile', label: 'Chile', currency: 'CLP', currencySymbol: '$', locale: 'es-CL' },
  { value: 'Perú', label: 'Perú', currency: 'PEN', currencySymbol: 'S/', locale: 'es-PE' },
  { value: 'Ecuador', label: 'Ecuador', currency: 'USD', currencySymbol: '$', locale: 'es-EC' },
  { value: 'Venezuela', label: 'Venezuela', currency: 'USD', currencySymbol: '$', locale: 'es-VE' },
  { value: 'Uruguay', label: 'Uruguay', currency: 'UYU', currencySymbol: '$', locale: 'es-UY' },
  { value: 'Paraguay', label: 'Paraguay', currency: 'PYG', currencySymbol: '₲', locale: 'es-PY' },
  { value: 'Bolivia', label: 'Bolivia', currency: 'BOB', currencySymbol: 'Bs', locale: 'es-BO' },
  { value: 'Costa Rica', label: 'Costa Rica', currency: 'CRC', currencySymbol: '₡', locale: 'es-CR' },
  { value: 'Panamá', label: 'Panamá', currency: 'USD', currencySymbol: '$', locale: 'es-PA' },
  { value: 'Guatemala', label: 'Guatemala', currency: 'GTQ', currencySymbol: 'Q', locale: 'es-GT' },
  { value: 'Honduras', label: 'Honduras', currency: 'HNL', currencySymbol: 'L', locale: 'es-HN' },
  { value: 'El Salvador', label: 'El Salvador', currency: 'USD', currencySymbol: '$', locale: 'es-SV' },
  { value: 'Nicaragua', label: 'Nicaragua', currency: 'NIO', currencySymbol: 'C$', locale: 'es-NI' },
  { value: 'República Dominicana', label: 'República Dominicana', currency: 'DOP', currencySymbol: 'RD$', locale: 'es-DO' },
  { value: 'Puerto Rico', label: 'Puerto Rico', currency: 'USD', currencySymbol: '$', locale: 'es-PR' },
  { value: 'España', label: 'España', currency: 'EUR', currencySymbol: '€', locale: 'es-ES' },
  { value: 'Estados Unidos', label: 'Estados Unidos', currency: 'USD', currencySymbol: '$', locale: 'en-US' },
  { value: 'Brasil', label: 'Brasil', currency: 'BRL', currencySymbol: 'R$', locale: 'pt-BR' },
];

/**
 * Get country info by value
 */
export function getCountryInfo(countryValue: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.value === countryValue);
}

/**
 * Format currency based on country
 */
export function formatCurrencyByCountry(
  amount: number,
  countryValue: string,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const country = getCountryInfo(countryValue);
  if (!country) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      ...options,
    }).format(amount);
  }

  return new Intl.NumberFormat(country.locale, {
    style: 'currency',
    currency: country.currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

/**
 * Get currency symbol for a country
 */
export function getCurrencySymbol(countryValue: string): string {
  return getCountryInfo(countryValue)?.currencySymbol ?? '$';
}

/**
 * Get currency code for a country
 */
export function getCurrencyCode(countryValue: string): string {
  return getCountryInfo(countryValue)?.currency ?? 'MXN';
}

/**
 * Get the label for a business type value (handles custom values)
 */
export function getBusinessTypeLabel(value: string): string {
  const found = BUSINESS_TYPES.find(t => t.value === value);
  if (found && found.value !== 'otro') return found.label;
  // If not found or is "otro", it's a custom value - return as-is
  return value || '-';
}

/**
 * Get the label for a cuisine type value (handles custom values)
 */
export function getCuisineTypeLabel(value: string): string {
  const found = CUISINE_TYPES.find(t => t.value === value);
  if (found && found.value !== 'otra') return found.label;
  // If not found or is "otra", it's a custom value - return as-is
  return value || 'No especificada';
}
