export type UserRole = 'athlete' | 'staff' | 'admin';

export type StaffRole = 'owner' | 'coach'; // 'owner': Leslie & Jorge (Control Total) | 'coach': Gus (Evaluador & Seguimiento)

export type MembershipStatus = 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'canceled';

export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  staffRole?: StaffRole; // 'owner' (Leslie & Jorge) vs 'coach' (Gus)
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
  password?: string;
  username?: string;
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

export type CooperLevel = string;

export type CooperRating = 'Muy Malo' | 'Malo' | 'Regular' | 'Bueno' | 'Excelente' | 'Superior';

export type EvaluationStatus = 'completed' | 'na' | 'np';

export type CooperTestVariant = 'standard' | 'laps'; // Test Cooper normal vs Test Cooper 2 (por vueltas)
export type CooperLapLocation = 'outside' | 'inside'; // Circuito afuera o adentro

export interface CooperTestRecord {
  level: string; // e.g., 'Nivel 1 (Adaptación Inicial)' to 'Nivel 20 (Ultra Élite Kinetix)' o 'NA (No Aplica)'
  levelNumber: number; // 1 to 20 (or 0 if NA/NP)
  description: string;
  targetZoneRecommendation?: string;
  distanceMeters?: number; // Opcional de referencia para el staff
  estimatedVo2Max?: number;
  rating?: CooperRating;
  notes?: string;
  status?: EvaluationStatus; // 'completed' | 'na' | 'np'
  statusReason?: string; // Motivo: Adulto mayor, Niños, Lesión, Enfermedad
  variant?: CooperTestVariant; // 'standard' (Test Cooper Normal) o 'laps' (Test Cooper 2 por vueltas)
  lapLocation?: CooperLapLocation; // 'outside' (Afuera) o 'inside' (Adentro)
  lapsCount?: number; // Número de vueltas completadas
  metersPerLap?: number; // Metros que mide cada vuelta (ej. 400m afuera o 180m adentro)
}

export type BrandTheme = 'blue' | 'red';

export interface StrengthMaxRecord {
  exerciseId: 'squats' | 'deadlift' | 'hip_thrust' | 'horizontal_press' | 'pullups_or_rows';
  exerciseName: string;
  exerciseType?: 'remo' | 'dominadas'; // Selector explícito solicitado por el usuario
  weightKg: number;
  reps: number;
  estimated1RMKg: number;
  weightUnit: 'kg' | 'lbs';
  notes?: string;
  status?: EvaluationStatus; // 'completed' | 'na' | 'np'
  statusReason?: string;
}

export interface EnduranceTimeTestRecord {
  name: string; // e.g., "Evaluación de Resistencia Funcional" o "Remo 2000m"
  result: string; // e.g., "7:14 min" o "NA" / "NP"
  timeSeconds?: number;
  scoreScoreLevel?: 'Básico' | 'Intermedio' | 'Avanzado' | 'Élite' | 'Exento';
  notes?: string;
  status?: EvaluationStatus; // 'completed' | 'na' | 'np'
  statusReason?: string;
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
  targetUserId?: string;
  targetAudience?: 'all' | 'athletes' | 'staff' | 'color_5' | 'color_15' | 'color_20' | 'color_30';
}

export interface PrivacyConsentRecord {
  consent_id: string;
  user_id: string;
  user_email: string;
  privacy_notice_version: string;
  privacy_notice_accepted: boolean;
  sensitive_data_consent: boolean;
  accepted_at: string; // ISO timestamp
  consent_date?: string; // Formato dd/mm/aaaa
  consent_time?: string; // Formato hh:mm
  consent_method: string; // e.g. 'authenticated_user_checkbox'
  medio?: string; // 'Kinetix Progress'
  platform: string; // 'Kinetix Progress'
}
