import { CooperLevel, CooperRating, Gender } from '../types';

export interface CooperLevelDetail {
  levelNumber: 1 | 2 | 3 | 4 | 5;
  levelName: CooperLevel;
  badgeLabel: string;
  description: string;
  coachingRecommendation: string;
  referenceDistance: string;
  colorHex: string;
}

export const COOPER_LEVELS_CATALOG: Record<1 | 2 | 3 | 4 | 5, CooperLevelDetail> = {
  1: {
    levelNumber: 1,
    levelName: 'Nivel 1 (Inicial)',
    badgeLabel: 'NIVEL 1 · INICIAL',
    description: 'Fase de acondicionamiento básico. Capacidad aeróbica en adaptación inicial neuromuscular.',
    coachingRecommendation: 'Priorizar intervalos aeróbicos en Zona 2 (60-70% FCM) de 25 a 35 minutos.',
    referenceDistance: '< 1,800 m',
    colorHex: '#ef4444', // Red
  },
  2: {
    levelNumber: 2,
    levelName: 'Nivel 2 (Básico)',
    badgeLabel: 'NIVEL 2 · BÁSICO',
    description: 'Base funcional establecida. Tolerancia al esfuerzo cardiovascular continuo en progreso.',
    coachingRecommendation: 'Incorporar series de intervalos tempo de 400m con descansos activos.',
    referenceDistance: '1,800 m – 2,199 m',
    colorHex: '#f97316', // Orange
  },
  3: {
    levelNumber: 3,
    levelName: 'Nivel 3 (Intermedio)',
    badgeLabel: 'NIVEL 3 · INTERMEDIO',
    description: 'Nivel óptimo para el entrenamiento funcional continuo de alta intensidad (WODs y circuitos).',
    coachingRecommendation: 'Mantener volumen aeróbico e introducir trabajo de umbral anaeróbico.',
    referenceDistance: '2,200 m – 2,499 m',
    colorHex: '#eab308', // Amber/Yellow
  },
  4: {
    levelNumber: 4,
    levelName: 'Nivel 4 (Avanzado)',
    badgeLabel: 'NIVEL 4 · AVANZADO',
    description: 'Excelente potencia aeróbica y rápida recuperación entre series de fuerza pesada.',
    coachingRecommendation: 'Trabajo específico de potencia en remo y carrera en Zona 4/5.',
    referenceDistance: '2,500 m – 2,799 m',
    colorHex: '#3b82f6', // Blue
  },
  5: {
    levelNumber: 5,
    levelName: 'Nivel 5 (Excelente / Élite)',
    badgeLabel: 'NIVEL 5 · ÉLITE KINETIX',
    description: 'Capacidad cardiorrespiratoria de alto rendimiento. Eficiencia neuromuscular sobresaliente.',
    coachingRecommendation: 'Mantenimiento y preparación para competencias funcionales de resistencia.',
    referenceDistance: '≥ 2,800 m',
    colorHex: '#ff6600', // Kinetix Flame
  },
};

export function getCooperLevelInfo(levelNumber: 1 | 2 | 3 | 4 | 5): CooperLevelDetail {
  return COOPER_LEVELS_CATALOG[levelNumber] || COOPER_LEVELS_CATALOG[3];
}

/**
 * Calculates Relative Strength Ratio (Weight Lifted / Body Weight)
 */
export function calculateRelativeStrengthRatio(weightLiftedKg: number, athleteBodyWeightKg: number): number {
  if (!weightLiftedKg || !athleteBodyWeightKg || athleteBodyWeightKg <= 0) return 0;
  return Number((weightLiftedKg / athleteBodyWeightKg).toFixed(2));
}

/**
 * Categorizes athlete functional strength level based on relative ratio in Squat/Deadlift
 */
export function getStrengthTier(ratio: number): { tier: string; color: string } {
  if (ratio < 1.0) return { tier: 'Nivel Bronce (Funcional Base)', color: '#cd7f32' };
  if (ratio < 1.5) return { tier: 'Nivel Plata (Fuerza Adaptativa)', color: '#94a3b8' };
  if (ratio < 2.0) return { tier: 'Nivel Oro (Fuerza Avanzada)', color: '#f59e0b' };
  return { tier: 'Nivel Titanio (Élite Kinetix)', color: '#ff6600' };
}

/**
 * Calculates BMI (Body Mass Index) given weight in kg and height in cm.
 * Formula: weight (kg) / (height (m))^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
}

/**
 * Classifies BMI according to WHO (OMS) standards.
 */
export function getBMICategory(bmi: number): 'Bajo Peso' | 'Normal' | 'Sobrepeso' | 'Obesidad I' | 'Obesidad II' | 'Obesidad III' {
  if (bmi < 18.5) return 'Bajo Peso';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Sobrepeso';
  if (bmi < 35.0) return 'Obesidad I';
  if (bmi < 40.0) return 'Obesidad II';
  return 'Obesidad III';
}

export interface RenphoVisceralFatInfo {
  level: number;
  category: 'Estándar / Saludable' | 'Alto / Precaución' | 'Excesivo / Peligro';
  rangeLabel: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

/**
 * Evaluates Visceral Fat level according to official RENPHO smart scale standards:
 * - 1 to 9: Estándar (Saludable) - Verde
 * - 10 to 14: Alto (Alerta / Precaución) - Amarillo / Naranja
 * - 15 to 59: Excesivo (Peligro) - Rojo
 */
export function getRenphoVisceralFatInfo(level: number): RenphoVisceralFatInfo {
  if (level <= 9) {
    return {
      level,
      category: 'Estándar / Saludable',
      rangeLabel: '1 – 9',
      colorHex: '#10b981',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-400',
      description: 'Nivel óptimo y saludable. La grasa protege los órganos vitales sin acumulación de riesgo metabólico.',
    };
  }
  if (level <= 14) {
    return {
      level,
      category: 'Alto / Precaución',
      rangeLabel: '10 – 14',
      colorHex: '#f59e0b',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      badgeText: 'text-amber-400',
      description: 'Nivel elevado en zona intra-abdominal. Alerta de precaución para salud cardiovascular y metabólica.',
    };
  }
  return {
    level,
    category: 'Excesivo / Peligro',
    rangeLabel: '15 – 59',
    colorHex: '#ef4444',
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
    badgeText: 'text-rose-400',
    description: 'Nivel crítico excesivo según la báscula RENPHO. Requiere plan de nutrición y reestructuración de entrenamiento funcional.',
  };
}

export interface RenphoBmiInfo {
  bmi: number;
  category: 'Bajo Peso' | 'Estándar / Saludable' | 'Sobrepeso' | 'Obesidad';
  rangeLabel: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

/**
 * Evaluates BMI (IMC) according to RENPHO smart scale classification:
 * - < 18.5: Bajo Peso (Azul)
 * - 18.5 to 24.9: Estándar / Saludable (Verde)
 * - 25.0 to 29.9: Sobrepeso (Amarillo)
 * - >= 30.0: Obesidad (Rojo)
 */
export function getRenphoBmiInfo(bmi: number): RenphoBmiInfo {
  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Bajo Peso',
      rangeLabel: '< 18.5',
      colorHex: '#38bdf8',
      badgeBg: 'bg-sky-500/10 border-sky-500/30',
      badgeText: 'text-sky-400',
      description: 'Por debajo del estándar sugerido en la app RENPHO. Evaluar masa muscular e ingesta energética.',
    };
  }
  if (bmi < 25.0) {
    return {
      bmi,
      category: 'Estándar / Saludable',
      rangeLabel: '18.5 – 24.9',
      colorHex: '#10b981',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-400',
      description: 'Rango estándar óptimo según la escala RENPHO y lineamientos de la OMS.',
    };
  }
  if (bmi < 30.0) {
    return {
      bmi,
      category: 'Sobrepeso',
      rangeLabel: '25.0 – 29.9',
      colorHex: '#f59e0b',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      badgeText: 'text-amber-400',
      description: 'Rango superior al estándar. En atletas funcionales, cotejar con el % de masa muscular antes de restringir calorías.',
    };
  }
  return {
    bmi,
    category: 'Obesidad',
    rangeLabel: '≥ 30.0',
    colorHex: '#ef4444',
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
    badgeText: 'text-rose-400',
    description: 'Elevado según la báscula RENPHO. Priorizar recomposición corporal con entrenamiento de fuerza funcional.',
  };
}

/**
 * Estimated VO2Max from Cooper Test (12 minutes run in meters)
 * Formula: VO2Max (ml/kg/min) = (Distance in meters - 504.9) / 44.73
 */
export function calculateCooperVo2Max(distanceMeters: number): number {
  if (!distanceMeters || distanceMeters <= 505) return 0;
  const vo2max = (distanceMeters - 504.9) / 44.73;
  return Number(vo2max.toFixed(1));
}

/**
 * Evaluates Cooper Test rating based on age, gender and distance in meters.
 * Standard Cooper Institute 12-minute run norms.
 */
export function getCooperRating(distanceMeters: number, age: number = 28, gender: Gender = 'male'): CooperRating {
  if (gender === 'male') {
    if (age <= 29) {
      if (distanceMeters < 1600) return 'Muy Malo';
      if (distanceMeters < 2200) return 'Malo';
      if (distanceMeters < 2400) return 'Regular';
      if (distanceMeters < 2800) return 'Bueno';
      return 'Excelente';
    } else if (age <= 39) {
      if (distanceMeters < 1500) return 'Muy Malo';
      if (distanceMeters < 1900) return 'Malo';
      if (distanceMeters < 2300) return 'Regular';
      if (distanceMeters < 2700) return 'Bueno';
      return 'Excelente';
    } else {
      if (distanceMeters < 1400) return 'Muy Malo';
      if (distanceMeters < 1700) return 'Malo';
      if (distanceMeters < 2100) return 'Regular';
      if (distanceMeters < 2500) return 'Bueno';
      return 'Excelente';
    }
  } else {
    // Female norms
    if (age <= 29) {
      if (distanceMeters < 1500) return 'Muy Malo';
      if (distanceMeters < 1800) return 'Malo';
      if (distanceMeters < 2200) return 'Regular';
      if (distanceMeters < 2700) return 'Bueno';
      return 'Excelente';
    } else if (age <= 39) {
      if (distanceMeters < 1400) return 'Muy Malo';
      if (distanceMeters < 1700) return 'Malo';
      if (distanceMeters < 2000) return 'Regular';
      if (distanceMeters < 2500) return 'Bueno';
      return 'Excelente';
    } else {
      if (distanceMeters < 1300) return 'Muy Malo';
      if (distanceMeters < 1600) return 'Malo';
      if (distanceMeters < 1900) return 'Regular';
      if (distanceMeters < 2400) return 'Bueno';
      return 'Excelente';
    }
  }
}

/**
 * Calculates 1RM (One Rep Max) using Brzycki formula.
 * 1RM = Weight / (1.0278 - (0.0278 * Reps))
 * Valid for reps between 1 and 10. If reps === 1, 1RM = Weight.
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  if (reps > 15) reps = 15; // cap to avoid mathematical distortion
  const oneRm = weightKg / (1.0278 - 0.0278 * reps);
  return Number(oneRm.toFixed(1));
}

/**
 * Convert kg to lbs and vice versa
 */
export function kgToLbs(kg: number): number {
  return Number((kg * 2.20462).toFixed(1));
}

export function lbsToKg(lbs: number): number {
  return Number((lbs / 2.20462).toFixed(1));
}

/**
 * Calculates days remaining or days past due for a membership
 */
export function calculateDaysUntilExpiry(expiryDateStr: string, referenceDateStr: string = '2024-04-15'): number {
  const expiry = new Date(expiryDateStr);
  const ref = new Date(referenceDateStr);
  const diffTime = expiry.getTime() - ref.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
