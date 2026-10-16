export type PaymentColorCode = 'blue' | 'red' | 'pink' | 'green' | 'custom';

export interface PaymentGroupConfig {
  day: number;
  colorName: string;
  code: PaymentColorCode;
  label: string;
  shortLabel: string;
  dotEmoji: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  activeBtnClass: string;
}

export const PAYMENT_COLOR_GROUPS: Record<number, PaymentGroupConfig> = {
  5: {
    day: 5,
    colorName: 'Azul',
    code: 'blue',
    label: 'Corte Día 5 · Código Azul',
    shortLabel: 'Día 5 (Azul)',
    dotEmoji: '🔵',
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-400',
    dotColor: 'bg-blue-500',
    activeBtnClass: 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30',
  },
  15: {
    day: 15,
    colorName: 'Rojo',
    code: 'red',
    label: 'Corte Día 15 · Código Rojo',
    shortLabel: 'Día 15 (Rojo)',
    dotEmoji: '🔴',
    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/40',
    badgeText: 'text-red-400',
    dotColor: 'bg-red-500',
    activeBtnClass: 'bg-red-600 text-white border-red-400 shadow-md shadow-red-500/30',
  },
  20: {
    day: 20,
    colorName: 'Rosa',
    code: 'pink',
    label: 'Corte Día 20 · Código Rosa',
    shortLabel: 'Día 20 (Rosa)',
    dotEmoji: '🌸',
    badgeBg: 'bg-pink-500/15',
    badgeBorder: 'border-pink-500/40',
    badgeText: 'text-pink-400',
    dotColor: 'bg-pink-500',
    activeBtnClass: 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-500/30',
  },
  30: {
    day: 30,
    colorName: 'Verde',
    code: 'green',
    label: 'Corte Día 30 · Código Verde',
    shortLabel: 'Día 30 (Verde)',
    dotEmoji: '🟢',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    activeBtnClass: 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/30',
  },
};

export function getPaymentGroup(day?: number): PaymentGroupConfig {
  if (day && PAYMENT_COLOR_GROUPS[day]) {
    return PAYMENT_COLOR_GROUPS[day];
  }

  // Fallback for custom or undefined day
  const effectiveDay = day || 15;
  if (PAYMENT_COLOR_GROUPS[effectiveDay]) {
    return PAYMENT_COLOR_GROUPS[effectiveDay];
  }

  return {
    day: effectiveDay,
    colorName: 'Personalizado',
    code: 'custom',
    label: `Corte Día ${effectiveDay}`,
    shortLabel: `Día ${effectiveDay}`,
    dotEmoji: '⚪',
    badgeBg: 'bg-neutral-800',
    badgeBorder: 'border-neutral-700',
    badgeText: 'text-neutral-300',
    dotColor: 'bg-neutral-400',
    activeBtnClass: 'bg-neutral-700 text-white border-neutral-500',
  };
}

export const OFFICIAL_COLORS = [
  { day: 5, colorName: 'Azul', emoji: '🔵', code: 'blue', desc: 'Pago día 5 de cada mes', btnActive: 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-blue-500/30 hover:border-blue-500/60' },
  { day: 15, colorName: 'Rojo', emoji: '🔴', code: 'red', desc: 'Pago día 15 de cada mes', btnActive: 'bg-red-600 text-white border-red-400 ring-2 ring-red-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-red-500/30 hover:border-red-500/60' },
  { day: 20, colorName: 'Rosa', emoji: '🌸', code: 'pink', desc: 'Pago día 20 de cada mes', btnActive: 'bg-pink-600 text-white border-pink-400 ring-2 ring-pink-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-pink-500/30 hover:border-pink-500/60' },
  { day: 30, colorName: 'Verde', emoji: '🟢', code: 'green', desc: 'Pago día 30 de cada mes', btnActive: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-emerald-500/30 hover:border-emerald-500/60' },
];

