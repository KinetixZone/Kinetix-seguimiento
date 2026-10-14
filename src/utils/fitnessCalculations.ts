import { CooperLevel, CooperRating, Gender } from '../types';

export interface CooperLevelDetail {
  levelNumber: number;
  levelName: string;
  badgeLabel: string;
  description: string;
  coachingRecommendation: string;
  referenceDistance: string;
  colorHex: string;
}

export const COOPER_LEVELS_CATALOG: Record<number, CooperLevelDetail> = {
  1: {
    levelNumber: 1,
    levelName: 'Nivel 1 (Adaptación Inicial)',
    badgeLabel: 'NIVEL 1 · ADAPTACIÓN INICIAL',
    description: 'Fase de adaptación neuromuscular básica. Iniciando acondicionamiento cardiovascular.',
    coachingRecommendation: 'Caminata rápida y trote ligero en Zona 1-2 (50-60% FCM) de 20 a 25 min.',
    referenceDistance: '< 1,500 m',
    colorHex: '#ef4444',
  },
  2: {
    levelNumber: 2,
    levelName: 'Nivel 2 (Acondicionamiento Base)',
    badgeLabel: 'NIVEL 2 · ACONDICIONAMIENTO BASE',
    description: 'Tolerancia al esfuerzo continuo en progreso gradual.',
    coachingRecommendation: 'Intervalos aeróbicos suaves con descansos completos.',
    referenceDistance: '1,500 m – 1,649 m',
    colorHex: '#f87171',
  },
  3: {
    levelNumber: 3,
    levelName: 'Nivel 3 (Iniciación Funcional)',
    badgeLabel: 'NIVEL 3 · INICIACIÓN FUNCIONAL',
    description: 'Capacidad para sostener cadencia constante en carrera continua.',
    coachingRecommendation: 'Series de 300m continuos manteniendo ritmo aeróbico controlado.',
    referenceDistance: '1,650 m – 1,799 m',
    colorHex: '#fb923c',
  },
  4: {
    levelNumber: 4,
    levelName: 'Nivel 4 (Básico 1)',
    badgeLabel: 'NIVEL 4 · BÁSICO 1',
    description: 'Base funcional establecida. Respiración y pulsaciones en control.',
    coachingRecommendation: 'Trote continuo en Zona 2 (60-70% FCM) durante 30 minutos.',
    referenceDistance: '1,800 m – 1,949 m',
    colorHex: '#f97316',
  },
  5: {
    levelNumber: 5,
    levelName: 'Nivel 5 (Básico 2)',
    badgeLabel: 'NIVEL 5 · BÁSICO 2',
    description: 'Consistencia aeróbica adecuada para entrenamientos funcionales grupales.',
    coachingRecommendation: 'Introducir cambios de ritmo de 1 minuto rápido por 2 suaves.',
    referenceDistance: '1,950 m – 2,099 m',
    colorHex: '#ea580c',
  },
  6: {
    levelNumber: 6,
    levelName: 'Nivel 6 (Intermedio Inicial)',
    badgeLabel: 'NIVEL 6 · INTERMEDIO INICIAL',
    description: 'Buena resistencia muscular periférica durante la carrera.',
    coachingRecommendation: 'Carrera tempo sostenida a ritmo de 6:00 min/km.',
    referenceDistance: '2,100 m – 2,249 m',
    colorHex: '#facc15',
  },
  7: {
    levelNumber: 7,
    levelName: 'Nivel 7 (Intermedio Regular)',
    badgeLabel: 'NIVEL 7 · INTERMEDIO REGULAR',
    description: 'Capacidad para acelerar en el último tercio de la prueba.',
    coachingRecommendation: 'Series en Zona 3 (70-80% FCM) combinadas con ejercicios de peso corporal.',
    referenceDistance: '2,250 m – 2,349 m',
    colorHex: '#eab308',
  },
  8: {
    levelNumber: 8,
    levelName: 'Nivel 8 (Intermedio Sólido)',
    badgeLabel: 'NIVEL 8 · INTERMEDIO SÓLIDO',
    description: 'Eficiencia cardiovascular óptima para los WODs de Kinetix.',
    coachingRecommendation: 'Trabajo de umbral aeróbico y potencia en remo concept2.',
    referenceDistance: '2,350 m – 2,449 m',
    colorHex: '#ca8a04',
  },
  9: {
    levelNumber: 9,
    levelName: 'Nivel 9 (Intermedio Superior)',
    badgeLabel: 'NIVEL 9 · INTERMEDIO SUPERIOR',
    description: 'Umbral anaeróbico elevado; excelente tolerancia al ácido láctico.',
    coachingRecommendation: 'Intervalos cortos de alta intensidad (HIIT) 30s max / 30s rec.',
    referenceDistance: '2,450 m – 2,549 m',
    colorHex: '#a3e635',
  },
  10: {
    levelNumber: 10,
    levelName: 'Nivel 10 (Avanzado 1)',
    badgeLabel: 'NIVEL 10 · AVANZADO 1',
    description: 'Rendimiento aeróbico destacado. Ritmo estable por debajo de 4:50 min/km.',
    coachingRecommendation: 'Series de 800m fraccionadas a ritmo competitivo con descansos cortos.',
    referenceDistance: '2,550 m – 2,649 m',
    colorHex: '#84cc16',
  },
  11: {
    levelNumber: 11,
    levelName: 'Nivel 11 (Avanzado 2)',
    badgeLabel: 'NIVEL 11 · AVANZADO 2',
    description: 'Alta capacidad glucolítica y rápida disipación de la fatiga.',
    coachingRecommendation: 'Entrenamiento en Zona 4 (80-90% FCM) sostenido.',
    referenceDistance: '2,650 m – 2,749 m',
    colorHex: '#65a30d',
  },
  12: {
    levelNumber: 12,
    levelName: 'Nivel 12 (Avanzado Superior)',
    badgeLabel: 'NIVEL 12 · AVANZADO SUPERIOR',
    description: 'Condición física sobresaliente; supera los estándares promedio de atletas funcionales.',
    coachingRecommendation: 'Simulacros de competencia Hyrox / CrossTraining con carrera pesada.',
    referenceDistance: '2,750 m – 2,849 m',
    colorHex: '#10b981',
  },
  13: {
    levelNumber: 13,
    levelName: 'Nivel 13 (Pre-Élite 1)',
    badgeLabel: 'NIVEL 13 · PRE-ÉLITE 1',
    description: 'VO2Max estimado superior a 52 ml/kg/min. Excelente economía de carrera.',
    coachingRecommendation: 'Mantenimiento de potencia máxima con transiciones de fuerza.',
    referenceDistance: '2,850 m – 2,949 m',
    colorHex: '#059669',
  },
  14: {
    levelNumber: 14,
    levelName: 'Nivel 14 (Pre-Élite 2)',
    badgeLabel: 'NIVEL 14 · PRE-ÉLITE 2',
    description: 'Dominio de esfuerzos aeróbicos de alta intensidad sin caída de cadencia.',
    coachingRecommendation: 'Bloques de ritmo sostenido en Zona 4/5 con chaleco lastrado opcional.',
    referenceDistance: '2,950 m – 3,049 m',
    colorHex: '#06b6d4',
  },
  15: {
    levelNumber: 15,
    levelName: 'Nivel 15 (Élite Kinetix)',
    badgeLabel: 'NIVEL 15 · ÉLITE KINETIX',
    description: 'Nivel de competencia deportiva. Resistencia cardiorrespiratoria de alto nivel.',
    coachingRecommendation: 'Periodización específica para eventos y carreras de resistencia.',
    referenceDistance: '3,050 m – 3,149 m',
    colorHex: '#0284c7',
  },
  16: {
    levelNumber: 16,
    levelName: 'Nivel 16 (Élite Superior)',
    badgeLabel: 'NIVEL 16 · ÉLITE SUPERIOR',
    description: 'Capacidad de sostener menos de 3:55 min/km en los 12 minutos completos.',
    coachingRecommendation: 'Potencia metabólica pura y resistencia anaeróbica láctica.',
    referenceDistance: '3,150 m – 3,249 m',
    colorHex: '#3b82f6',
  },
  17: {
    levelNumber: 17,
    levelName: 'Nivel 17 (Master Competidor)',
    badgeLabel: 'NIVEL 17 · MASTER COMPETIDOR',
    description: 'Nivel de podio en competencias funcionales regionales.',
    coachingRecommendation: 'Optimización de recuperación neuromuscular y nutrición deportiva avanzada.',
    referenceDistance: '3,250 m – 3,349 m',
    colorHex: '#6366f1',
  },
  18: {
    levelNumber: 18,
    levelName: 'Nivel 18 (Pro Athlete 1)',
    badgeLabel: 'NIVEL 18 · PRO ATHLETE 1',
    description: 'Consumo máximo de oxígeno privilegiado. Eficiencia biomecánica superior.',
    coachingRecommendation: 'Entrenamiento de precisión por vatios y zonas individualizadas.',
    referenceDistance: '3,350 m – 3,449 m',
    colorHex: '#8b5cf6',
  },
  19: {
    levelNumber: 19,
    levelName: 'Nivel 19 (Pro Athlete 2)',
    badgeLabel: 'NIVEL 19 · PRO ATHLETE 2',
    description: 'Rendimiento extraordinario; marca de calibre profesional.',
    coachingRecommendation: 'Microciclos de pico de rendimiento competitivo.',
    referenceDistance: '3,450 m – 3,549 m',
    colorHex: '#ec4899',
  },
  20: {
    levelNumber: 20,
    levelName: 'Nivel 20 (Ultra Élite Kinetix)',
    badgeLabel: 'NIVEL 20 · ULTRA ÉLITE KINETIX',
    description: 'Récord histórico de resistencia en Kinetix Functional Zone. Capacidad cardiorrespiratoria insuperable.',
    coachingRecommendation: 'Mantenimiento del estatus de Atleta Leyenda en Kinetix.',
    referenceDistance: '≥ 3,550 m',
    colorHex: '#ff5500',
  },
};

export function getCooperLevelInfo(levelNumber: number): CooperLevelDetail {
  const num = Math.max(1, Math.min(20, Math.round(levelNumber || 10)));
  return COOPER_LEVELS_CATALOG[num] || COOPER_LEVELS_CATALOG[10];
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
export function calculateDaysUntilExpiry(expiryDateStr: string, referenceDateStr?: string): number {
  if (!expiryDateStr) return 0;
  const expiry = new Date(expiryDateStr);
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  
  // Set both to midnight to count pure calendar days
  expiry.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - ref.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * The warning banner "Tu membresía vence pronto" should ONLY display when
 * there are 15 days or less remaining until expiry (15 to 0 days).
 * If more than 15 days remain, the user is in good standing and no warning is shown.
 */
export function isMembershipExpiringSoon(daysRemaining: number): boolean {
  return daysRemaining <= 15 && daysRemaining >= 0;
}
