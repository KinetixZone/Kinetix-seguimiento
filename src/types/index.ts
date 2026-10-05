export type UserRole = 'athlete' | 'staff' | 'admin';

export type MembershipStatus = 'active' | 'expiring_soon' | 'expired' | 'suspended';

export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  heightCm: number;
  weightUnit: 'kg' | 'lbs';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  membership: MembershipInfo;
  createdAt: string;
}

export type KinetixPlanName = 
  | 'Kinetix' 
  | 'Kinetix con Nutrición' 
  | 'Entrenos Personalizados (Coach Jorge)';

export interface MembershipInfo {
  id: string;
  planName: KinetixPlanName;
  status: MembershipStatus;
  startDate: string;
  expiryDate: string;
  monthlyFee: number;
  currency: string;
  autoRenew: boolean;
  gracePeriodDays: number;
  daysUntilExpiry: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  paymentReminderSent: boolean;
  billingDayOfMonth?: number; // e.g. 15 for "cada 15 del mes"
  hasNutritionPlan?: boolean;
  personalCoach?: string;
}

export interface BodyCompositionRecord {
  id: string;
  userId: string;
  recordedAt: string; // YYYY-MM-DD
  weightKg: number;
  muscleMassPercent: number; // e.g. 45.0%
  bodyFatPercent: number; // e.g. 12.0%
  visceralFatLevel: number; // 1 to 59 scale
  bmi: number; // Calculated kg/m^2
  bmiCategory: 'Bajo Peso' | 'Normal' | 'Sobrepeso' | 'Obesidad I' | 'Obesidad II' | 'Obesidad III';
  notes?: string;
  recordedByRole: 'athlete' | 'staff';
  sourceScale?: 'Renpho' | 'InBody' | 'Manual';
  privatePhotos?: {
    front?: string;
    side?: string;
    back?: string;
  };
}

export type CooperLevel = 
  | 'Nivel 1 (Inicial)' 
  | 'Nivel 2 (Básico)' 
  | 'Nivel 3 (Intermedio)' 
  | 'Nivel 4 (Avanzado)' 
  | 'Nivel 5 (Excelente / Élite)';

export type CooperRating = 'Muy Malo' | 'Malo' | 'Regular' | 'Bueno' | 'Excelente' | 'Superior';

export interface CooperTestRecord {
  level: CooperLevel;
  levelNumber: 1 | 2 | 3 | 4 | 5;
  description: string;
  targetZoneRecommendation?: string;
  distanceMeters?: number; // Opcional de referencia para el staff
  estimatedVo2Max?: number;
  rating?: CooperRating;
  notes?: string;
}

export type BrandTheme = 'blue' | 'red';

export interface StrengthMaxRecord {
  exerciseId: 'squats' | 'deadlift' | 'hip_thrust' | 'horizontal_press' | 'pullups_or_rows';
  exerciseName: string;
  weightKg: number;
  reps: number;
  estimated1RMKg: number;
  weightUnit: 'kg' | 'lbs';
}

export interface EnduranceTimeTestRecord {
  name: string; // e.g., "Evaluación de Resistencia Funcional" o "Remo 2000m"
  result: string; // e.g., "7:14 min"
  timeSeconds?: number;
  scoreScoreLevel?: 'Básico' | 'Intermedio' | 'Avanzado' | 'Élite';
  notes?: string;
}

export interface PhysicalEvaluationRecord {
  id: string;
  userId: string;
  evaluationDate: string; // YYYY-MM-DD
  coachId: string;
  coachName: string;
  cooperTest: CooperTestRecord;
  enduranceTest: EnduranceTimeTestRecord;
  strengthRecords: StrengthMaxRecord[];
  generalCoachNotes: string;
}

export interface PushNotificationSimulation {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'payment_reminder' | 'test_results' | 'membership_suspension' | 'milestone';
  read: boolean;
}
