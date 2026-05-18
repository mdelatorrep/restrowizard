export interface RevenueRange { value: string; label: string }

export function getRevenueRangesByCurrency(currencyCode: string, currencySymbol: string): RevenueRange[] {
  if (currencyCode === 'COP') {
    return [
      { value: '0-20m', label: `${currencySymbol}0 - ${currencySymbol}20M ${currencyCode}` },
      { value: '20m-50m', label: `${currencySymbol}20M - ${currencySymbol}50M ${currencyCode}` },
      { value: '50m-100m', label: `${currencySymbol}50M - ${currencySymbol}100M ${currencyCode}` },
      { value: '100m-500m', label: `${currencySymbol}100M - ${currencySymbol}500M ${currencyCode}` },
      { value: '500m+', label: `${currencySymbol}500M+ ${currencyCode}` },
    ];
  }
  if (currencyCode === 'ARS') {
    return [
      { value: '0-5m', label: `${currencySymbol}0 - ${currencySymbol}5M ${currencyCode}` },
      { value: '5m-20m', label: `${currencySymbol}5M - ${currencySymbol}20M ${currencyCode}` },
      { value: '20m-50m', label: `${currencySymbol}20M - ${currencySymbol}50M ${currencyCode}` },
      { value: '50m-200m', label: `${currencySymbol}50M - ${currencySymbol}200M ${currencyCode}` },
      { value: '200m+', label: `${currencySymbol}200M+ ${currencyCode}` },
    ];
  }
  if (currencyCode === 'CLP') {
    return [
      { value: '0-5m', label: `${currencySymbol}0 - ${currencySymbol}5M ${currencyCode}` },
      { value: '5m-15m', label: `${currencySymbol}5M - ${currencySymbol}15M ${currencyCode}` },
      { value: '15m-50m', label: `${currencySymbol}15M - ${currencySymbol}50M ${currencyCode}` },
      { value: '50m-150m', label: `${currencySymbol}50M - ${currencySymbol}150M ${currencyCode}` },
      { value: '150m+', label: `${currencySymbol}150M+ ${currencyCode}` },
    ];
  }
  return [
    { value: '0-100k', label: `${currencySymbol}0 - ${currencySymbol}100,000 ${currencyCode}` },
    { value: '100k-500k', label: `${currencySymbol}100,000 - ${currencySymbol}500,000 ${currencyCode}` },
    { value: '500k-1m', label: `${currencySymbol}500,000 - ${currencySymbol}1,000,000 ${currencyCode}` },
    { value: '1m-5m', label: `${currencySymbol}1M - ${currencySymbol}5M ${currencyCode}` },
    { value: '5m+', label: `${currencySymbol}5M+ ${currencyCode}` },
  ];
}

export interface LifecycleInfo {
  stage: 'pre_opening' | 'first_90_days' | 'normal_operation';
  days: number;
  label: string;
}

export function getLifecycleStage(openingDate: string): LifecycleInfo | null {
  if (!openingDate) return null;
  const opening = new Date(openingDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - opening.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) return { stage: 'pre_opening', days: Math.abs(daysDiff), label: 'Pre-Apertura' };
  if (daysDiff <= 90) return { stage: 'first_90_days', days: daysDiff, label: 'Primeros 90 Días' };
  return { stage: 'normal_operation', days: daysDiff, label: 'Operación Normal' };
}
