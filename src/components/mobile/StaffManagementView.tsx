import React, { useState } from 'react';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  MembershipStatus, 
  KinetixPlanName, 
  PrivacyConsentRecord,
  EvaluationStatus,
  StrengthMaxRecord,
  CooperTestRecord,
  EnduranceTimeTestRecord
} from '../../types';
import { calculate1RM } from '../../utils/fitnessCalculations';
import { CURRENT_PRIVACY_NOTICE_VERSION } from '../../data/privacyNoticeContent';
import { getPaymentGroup, PAYMENT_COLOR_GROUPS, PaymentColorCode } from '../../utils/paymentColorCodes';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Dumbbell, 
  Search, 
  Mail, 
  ShieldCheck, 
  Calendar,
  X,
  CreditCard,
  Award,
  Trash2,
  AlertTriangle,
  UserCog,
  SlidersHorizontal,
  ArrowLeft,
  Sparkles,
  Filter,
  Play,
  Pause,
  Scale,
  Activity,
  Flame,
  UserCheck,
  ShieldAlert,
  Clock,
  TrendingUp,
  Info,
  FileSpreadsheet,
  Bell,
  RotateCcw,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Database,
  Copy,
  Cloud,
  Check,
  CheckCheck,
  RefreshCw,
  Download,
  Pencil,
  Zap
} from 'lucide-react';
import { 
  KINETIX_OFFICIAL_SUPABASE_SQL, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  syncAllToSupabase,
  isSupabaseConfigured 
} from '../../lib/supabase';

interface StaffManagementViewProps {
  users: UserProfile[];
  bodyCompRecords?: BodyCompositionRecord[];
  evaluations?: PhysicalEvaluationRecord[];
  onSelectUserToInspect: (user: UserProfile) => void;
  onCreateUserByEmail: (newUser: { 
    name: string; 
    email: string; 
    planName: KinetixPlanName; 
    gender: 'male' | 'female'; 
    heightCm: number;
    billingDayOfMonth?: number;
    expiryDate?: string;
    password?: string;
    switchToCreatedUser?: boolean;
  }) => void;
  onCreateStaffMember?: (staffData: {
    name: string;
    email: string;
    password: string;
    staffRole: 'owner' | 'coach';
  }) => void;
  onDeleteStaffMember?: (staffId: string) => void;
  onOpenTestEntryForUser: (user: UserProfile) => void;
  onOpenBodyCompForUser?: (user: UserProfile) => void;
  onOpenReportForUser?: (user: UserProfile) => void;
  onUpdateUserMembership?: (
    userId: string, 
    status: MembershipStatus, 
    newExpiryDate?: string,
    newPlanName?: KinetixPlanName,
    billingDayOfMonth?: number
  ) => void;
  onDeleteAthlete?: (userId: string) => void;
  onUpdateAthleteProfile?: (userId: string, updates: Partial<UserProfile>) => void;
  onClearDemoAthletes?: () => void;
  onRestoreDemoAthletes?: () => void;
  onBackToDashboard?: () => void;
  onOpenSendNotification?: () => void;
  onSendBatchNotification?: (title: string, body: string, targetUserIds: string[]) => void;
  currentUser?: UserProfile;
  onSwitchUser?: (user: UserProfile) => void;
  consentHistory?: Record<string, PrivacyConsentRecord[]>;
  onAddEvaluation?: (evaluation: Omit<PhysicalEvaluationRecord, 'id'>) => void;
  onUpdateEvaluation?: (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  users,
  bodyCompRecords = [],
  evaluations = [],
  onSelectUserToInspect,
  onCreateUserByEmail,
  onCreateStaffMember,
  onDeleteStaffMember,
  onOpenTestEntryForUser,
  onOpenBodyCompForUser,
  onOpenReportForUser,
  onUpdateUserMembership,
  onDeleteAthlete,
  onUpdateAthleteProfile,
  onClearDemoAthletes,
  onRestoreDemoAthletes,
  onBackToDashboard,
  onOpenSendNotification,
  onSendBatchNotification,
  currentUser,
  onSwitchUser,
  consentHistory,
  onAddEvaluation,
  onUpdateEvaluation,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('kinetix2026');
  const [newStaffRole, setNewStaffRole] = useState<'owner' | 'coach'>('coach');
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Supabase Cloud Configuration States
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(() => getSupabaseCredentials().key);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const backupData = {
      plataforma: 'Kinetix Functional Zone',
      fechaExportacion: new Date().toISOString(),
      usuariosTotales: users.length,
      usuarios: users,
      registrosComposicionCorporal: bodyCompRecords,
      evaluacionesFisicas: evaluations,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetix_respaldo_oficial_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Payment date and profile edit modal state
  const [selectedAthleteForPayment, setSelectedAthleteForPayment] = useState<UserProfile | null>(null);
  const [modalTab, setModalTab] = useState<'membership' | 'profile' | 'security'>('membership');
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<MembershipStatus>('active');
  const [editPlan, setEditPlan] = useState<KinetixPlanName>('Kinetix');
  const [editBillingDay, setEditBillingDay] = useState<number>(15);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editStaffRole, setEditStaffRole] = useState<'owner' | 'coach'>('coach');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmergencyName, setEditEmergencyName] = useState<string>('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [savePaymentSuccess, setSavePaymentSuccess] = useState<boolean>(false);

  // Athlete password inspection & update state for Coaches/Owners
  const [athletePassword, setAthletePassword] = useState<string>('');
  const [showAthletePassword, setShowAthletePassword] = useState<boolean>(false);
  const [newPasswordForAthlete, setNewPasswordForAthlete] = useState<string>('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<boolean>(false);
  
  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [planName, setPlanName] = useState<KinetixPlanName>('Kinetix');
  const [billingDay, setBillingDay] = useState<number>(15);
  const [initialPassword, setInitialPassword] = useState('kinetix123');
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Payment color filter state: 'all' | 5 | 15 | 20 | 30 | 'due_soon'
  const [colorFilter, setColorFilter] = useState<'all' | 5 | 15 | 20 | 30 | 'due_soon'>('all');
  const [batchSentSuccess, setBatchSentSuccess] = useState<boolean>(false);
  const [isBatchSending, setIsBatchSending] = useState<boolean>(false);

  // EXPRESS STRENGTH EVALUATION MODULE STATE (Staff / Entrenador)
  const [showExpressModal, setShowExpressModal] = useState<boolean>(false);
  const [expressMode, setExpressMode] = useState<'single' | 'multiple' | 'all'>('single');
  const [expressExerciseId, setExpressExerciseId] = useState<'deadlift' | 'squats' | 'hip_thrust' | 'horizontal_press' | 'pullups_or_rows'>('deadlift');
  const [expressRowType, setExpressRowType] = useState<'remo' | 'dominadas'>('remo');
  const [expressDate, setExpressDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [expressTargetSingleId, setExpressTargetSingleId] = useState<string>('');
  const [expressSingleWeight, setExpressSingleWeight] = useState<number>(60);
  const [expressSingleReps, setExpressSingleReps] = useState<number>(1);
  const [expressSingleStatus, setExpressSingleStatus] = useState<EvaluationStatus>('completed');
  const [expressSingleReason, setExpressSingleReason] = useState<string>('');
  const [expressNotes, setExpressNotes] = useState<string>('');
  const [expressApplyAllCycleSingle, setExpressApplyAllCycleSingle] = useState<boolean>(false);

  // Multiple and All-Athletes batch mode state
  const [selectedAthleteIdsForExpress, setSelectedAthleteIdsForExpress] = useState<string[]>([]);
  const [expressAthleteInputs, setExpressAthleteInputs] = useState<Record<string, { weightKg: number; reps: number; status: EvaluationStatus; statusReason: string }>>({});
  const [commonBatchWeight, setCommonBatchWeight] = useState<number>(60);
  const [commonBatchReps, setCommonBatchReps] = useState<number>(1);
  const [expressSaveSuccessMsg, setExpressSaveSuccessMsg] = useState<string | null>(null);
  const [expressSearchTerm, setExpressSearchTerm] = useState<string>('');

  // Helper to retrieve latest recorded strength data for an athlete in a specific exercise
  const getLatestAthleteExerciseData = (athleteId: string, exId: string) => {
    const userEvals = evaluations.filter(e => e.userId === athleteId);
    const sorted = [...userEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
    const latest = sorted[sorted.length - 1];
    return latest?.strengthRecords?.find(s => s.exerciseId === exId);
  };

  const handleOpenExpressForStaff = (initialMode: 'single' | 'multiple' | 'all' = 'single', targetAthleteId?: string) => {
    const athleteList = users.filter(u => u.role === 'athlete');
    const allCandidates = [activeStaff, ...athleteList];
    const firstId = targetAthleteId || (athleteList[0]?.id || activeStaff.id);

    setExpressMode(initialMode === 'all' ? 'multiple' : initialMode);
    setExpressSearchTerm('');
    setExpressDate(new Date().toISOString().slice(0, 10));
    setExpressNotes('');
    setExpressApplyAllCycleSingle(false);
    setExpressSaveSuccessMsg(null);
    setExpressTargetSingleId(firstId);

    // Default values for single mode
    if (firstId) {
      const rec = getLatestAthleteExerciseData(firstId, expressExerciseId);
      if (rec && rec.status === 'completed' && rec.weightKg > 0) {
        setExpressSingleWeight(rec.weightKg);
        setExpressSingleReps(rec.reps || 1);
        setExpressSingleStatus('completed');
        setExpressSingleReason('');
      } else if (rec && (rec.status === 'na' || rec.status === 'np')) {
        setExpressSingleStatus(rec.status);
        setExpressSingleReason(rec.statusReason || '');
        setExpressSingleWeight(expressExerciseId === 'deadlift' ? 60 : expressExerciseId === 'squats' ? 50 : 40);
        setExpressSingleReps(1);
      } else {
        setExpressSingleWeight(expressExerciseId === 'deadlift' ? 60 : expressExerciseId === 'squats' ? 50 : expressExerciseId === 'hip_thrust' ? 50 : 35);
        setExpressSingleReps(1);
        setExpressSingleStatus('completed');
        setExpressSingleReason('');
      }
    }

    // Set batch athlete IDs
    if (initialMode === 'all') {
      setSelectedAthleteIdsForExpress(athleteList.map(a => a.id));
    } else if (initialMode === 'multiple') {
      setSelectedAthleteIdsForExpress(targetAthleteId ? [targetAthleteId] : athleteList.map(a => a.id));
    } else {
      setSelectedAthleteIdsForExpress([firstId]);
    }

    // Build inputs map for all candidates
    const inputsMap: Record<string, { weightKg: number; reps: number; status: EvaluationStatus; statusReason: string }> = {};
    allCandidates.forEach(ath => {
      const rec = getLatestAthleteExerciseData(ath.id, expressExerciseId);
      if (rec && rec.status === 'completed' && rec.weightKg > 0) {
        inputsMap[ath.id] = { weightKg: rec.weightKg, reps: rec.reps || 1, status: 'completed', statusReason: '' };
      } else if (rec && (rec.status === 'na' || rec.status === 'np')) {
        inputsMap[ath.id] = { weightKg: 50, reps: 1, status: rec.status, statusReason: rec.statusReason || '' };
      } else {
        inputsMap[ath.id] = { weightKg: expressExerciseId === 'deadlift' ? 60 : 50, reps: 1, status: 'completed', statusReason: '' };
      }
    });
    setExpressAthleteInputs(inputsMap);
    setShowExpressModal(true);
  };

  const handleSaveExpressRecord = (targetAthleteIds: string[]) => {
    if (!onAddEvaluation && !onUpdateEvaluation) {
      return;
    }
    if (targetAthleteIds.length === 0) return;

    const exerciseNameMap: Record<string, string> = {
      squats: 'Sentadillas',
      deadlift: 'Peso Muerto',
      hip_thrust: 'Hip Thrust',
      horizontal_press: 'Press Horizontal',
      pullups_or_rows: expressRowType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)',
    };

    let countSaved = 0;

    targetAthleteIds.forEach(athId => {
      let weight = 0;
      let reps = 0;
      let status: EvaluationStatus = 'completed';
      let reason = '';

      if (expressMode === 'single') {
        weight = expressSingleWeight;
        reps = expressSingleReps;
        status = expressSingleStatus;
        reason = expressSingleReason;
      } else {
        const inp = expressAthleteInputs[athId];
        weight = inp ? inp.weightKg : commonBatchWeight;
        reps = inp ? inp.reps : commonBatchReps;
        status = inp ? inp.status : 'completed';
        reason = inp ? inp.statusReason : '';
      }

      // Check NA general cycle option in single mode
      if (expressMode === 'single' && expressApplyAllCycleSingle) {
        const genReason = reason || 'Ingreso posterior a fecha de pruebas';
        const allNAStrength: StrengthMaxRecord[] = [
          { exerciseId: 'squats', exerciseName: 'Sentadillas', weightKg: 0, reps: 0, estimated1RMKg: 0, weightUnit: 'kg', status: 'na', statusReason: genReason, notes: `NA: ${genReason}` },
          { exerciseId: 'deadlift', exerciseName: 'Peso Muerto', weightKg: 0, reps: 0, estimated1RMKg: 0, weightUnit: 'kg', status: 'na', statusReason: genReason, notes: `NA: ${genReason}` },
          { exerciseId: 'hip_thrust', exerciseName: 'Hip Thrust', weightKg: 0, reps: 0, estimated1RMKg: 0, weightUnit: 'kg', status: 'na', statusReason: genReason, notes: `NA: ${genReason}` },
          { exerciseId: 'horizontal_press', exerciseName: 'Press Horizontal', weightKg: 0, reps: 0, estimated1RMKg: 0, weightUnit: 'kg', status: 'na', statusReason: genReason, notes: `NA: ${genReason}` },
          { exerciseId: 'pullups_or_rows', exerciseName: expressRowType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)', exerciseType: expressRowType, weightKg: 0, reps: 0, estimated1RMKg: 0, weightUnit: 'kg', status: 'na', statusReason: genReason, notes: `NA: ${genReason}` },
        ];
        const naCooper: CooperTestRecord = {
          level: 'NA (No Aplica)',
          levelNumber: 0,
          description: 'Prueba exenta este ciclo.',
          targetZoneRecommendation: 'Acondicionamiento físico general adaptado.',
          distanceMeters: 0,
          estimatedVo2Max: 0,
          status: 'na',
          statusReason: genReason,
          notes: `NA: ${genReason}`,
        };
        const naEndurance: EnduranceTimeTestRecord = {
          name: 'Evaluación de Resistencia Funcional',
          result: 'NA',
          timeSeconds: 0,
          scoreScoreLevel: 'Exento',
          status: 'na',
          statusReason: genReason,
          notes: `NA: ${genReason}`,
        };

        const existingEval = evaluations.find(e => e.userId === athId && e.evaluationDate === expressDate);
        if (existingEval && onUpdateEvaluation) {
          onUpdateEvaluation(existingEval.id, {
            cooperTest: naCooper,
            enduranceTest: naEndurance,
            strengthRecords: allNAStrength,
            generalCoachNotes: `NA General (${genReason}) registrado en Staff.`,
          });
        } else if (onAddEvaluation) {
          onAddEvaluation({
            userId: athId,
            evaluationDate: expressDate,
            coachId: activeStaff.id,
            coachName: activeStaff.name,
            cooperTest: naCooper,
            enduranceTest: naEndurance,
            strengthRecords: allNAStrength,
            generalCoachNotes: `NA General (${genReason}) registrado en Staff.`,
          });
        }
        countSaved++;
        return;
      }

      const calculated1RM = status === 'completed' ? calculate1RM(weight, reps) : 0;
      const newRec: StrengthMaxRecord = {
        exerciseId: expressExerciseId,
        exerciseName: exerciseNameMap[expressExerciseId] || 'Fuerza',
        exerciseType: expressExerciseId === 'pullups_or_rows' ? expressRowType : undefined,
        weightKg: status === 'completed' ? weight : 0,
        reps: status === 'completed' ? reps : 0,
        estimated1RMKg: calculated1RM,
        weightUnit: 'kg',
        status,
        statusReason: reason || undefined,
        notes: expressNotes ? expressNotes : (status === 'na' ? `NA: ${reason || 'Exento'}` : status === 'np' ? `NP: ${reason || 'No Presentada'}` : undefined),
      };

      const existingEval = evaluations.find(e => e.userId === athId && e.evaluationDate === expressDate);
      if (existingEval && onUpdateEvaluation) {
        const existingRecs = existingEval.strengthRecords || [];
        const idx = existingRecs.findIndex(r => r.exerciseId === expressExerciseId);
        let updatedRecs: StrengthMaxRecord[];
        if (idx >= 0) {
          updatedRecs = [...existingRecs];
          updatedRecs[idx] = newRec;
        } else {
          updatedRecs = [...existingRecs, newRec];
        }
        onUpdateEvaluation(existingEval.id, {
          strengthRecords: updatedRecs,
        });
      } else if (onAddEvaluation) {
        const pastEvals = evaluations.filter(e => e.userId === athId);
        const sortedPast = [...pastEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
        const latestPast = sortedPast[sortedPast.length - 1];

        const defaultCooper: CooperTestRecord = latestPast?.cooperTest || {
          level: 'Nivel 5',
          levelNumber: 5,
          description: 'Capacidad aeróbica estándar.',
          targetZoneRecommendation: 'Zona 2 y 3',
          distanceMeters: 2000,
          estimatedVo2Max: 48,
          status: 'completed',
        };

        const defaultEndurance: EnduranceTimeTestRecord = latestPast?.enduranceTest || {
          name: 'Evaluación de Resistencia Funcional',
          result: '07:00 min',
          timeSeconds: 420,
          scoreScoreLevel: 'Intermedio',
          status: 'completed',
        };

        const baseStrength: StrengthMaxRecord[] = latestPast?.strengthRecords?.map(s => {
          if (s.exerciseId === expressExerciseId) return newRec;
          return s;
        }) || [newRec];

        if (!baseStrength.some(s => s.exerciseId === expressExerciseId)) {
          baseStrength.push(newRec);
        }

        onAddEvaluation({
          userId: athId,
          evaluationDate: expressDate,
          coachId: activeStaff.id,
          coachName: activeStaff.name,
          cooperTest: defaultCooper,
          enduranceTest: defaultEndurance,
          strengthRecords: baseStrength,
          generalCoachNotes: expressNotes || `Marca Express de ${newRec.exerciseName} registrada en clase.`,
        });
      }
      countSaved++;
    });

    const msg = countSaved === 1 
      ? `¡Evaluación Express guardada correctamente!`
      : `¡Evaluación Express guardada para ${countSaved} atletas!`;
    setExpressSaveSuccessMsg(msg);
    setTimeout(() => {
      setExpressSaveSuccessMsg(null);
      setShowExpressModal(false);
    }, 1800);
  };

  const handleSaveAndNextSingleExpress = () => {
    const athleteList = users.filter(u => u.role === 'athlete');
    handleSaveExpressRecord([expressTargetSingleId]);

    const currentIdx = athleteList.findIndex(a => a.id === expressTargetSingleId);
    const nextIdx = currentIdx !== -1 ? (currentIdx + 1) % athleteList.length : 0;
    const nextAth = athleteList[nextIdx];
    if (nextAth) {
      setExpressTargetSingleId(nextAth.id);
      const rec = getLatestAthleteExerciseData(nextAth.id, expressExerciseId);
      if (rec && rec.status === 'completed' && rec.weightKg > 0) {
        setExpressSingleWeight(rec.weightKg);
        setExpressSingleReps(rec.reps || 1);
        setExpressSingleStatus('completed');
        setExpressSingleReason('');
      } else {
        setExpressSingleWeight(50);
        setExpressSingleReps(1);
        setExpressSingleStatus('completed');
        setExpressSingleReason('');
      }
      setExpressSaveSuccessMsg(`¡Guardado! Evaluando ahora a: ${nextAth.name}`);
      setTimeout(() => setExpressSaveSuccessMsg(null), 2500);
    }
  };

  const activeStaff = currentUser && currentUser.role === 'staff' 
    ? currentUser 
    : (users.find(u => u.role === 'staff' || u.id === 'user-staff-leslie' || u.id === 'user-staff-01') || users[0]);

  const isOwner = activeStaff.staffRole === 'owner' || activeStaff.id === 'user-staff-leslie' || activeStaff.id === 'user-staff-01' || !activeStaff.staffRole;
  const isCoachGus = activeStaff.staffRole === 'coach' || activeStaff.id === 'user-staff-gus';
  const staffMembers = users.filter(u => u.role === 'staff');

  // Helper to determine if an athlete's membership expires in the next 3 days or is overdue
  const isExpiringInNext3Days = (athlete: UserProfile): boolean => {
    if (athlete.role !== 'athlete') return false;

    // Check if membership is expired or marked expiring soon
    if (athlete.membership?.status === 'expired' || athlete.membership?.status === 'expiring_soon') {
      return true;
    }

    const today = new Date();
    const currentDay = today.getDate();
    const billingDay = athlete.membership?.billingDayOfMonth || 15;
    
    // Check explicit daysUntilExpiry if set
    if (typeof athlete.membership?.daysUntilExpiry === 'number') {
      if (athlete.membership.daysUntilExpiry <= 3) return true;
    }
    
    // Difference between billingDay and currentDay (accounting for month rollover)
    let diff = billingDay - currentDay;
    if (diff < 0) {
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      diff = (daysInCurrentMonth - currentDay) + billingDay;
    }
    
    return diff >= 0 && diff <= 3;
  };

  const dueSoonAthletes = users.filter(u => u.role === 'athlete' && isExpiringInNext3Days(u));

  const filteredAthletes = users.filter(u => {
    if (u.role !== 'athlete') return false;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (colorFilter === 'due_soon') return isExpiringInNext3Days(u);
    if (colorFilter === 'all') return true;
    return (u.membership?.billingDayOfMonth || 15) === colorFilter;
  });

  const handleSendBatchReminderToDueSoon = () => {
    if (dueSoonAthletes.length === 0) return;
    setIsBatchSending(true);
    
    if (onSendBatchNotification) {
      dueSoonAthletes.forEach(athlete => {
        const billingDay = athlete.membership?.billingDayOfMonth || 15;
        const title = 'Recordatorio de Renovación Kinetix';
        const body = `Hola ${athlete.name.split(' ')[0]}, tu fecha de corte mensual (Día ${billingDay}) vence en los próximos días. Acércate a recepción o contacta a tu coach para renovar tu membresía y continuar sin interrupciones.`;
        onSendBatchNotification(title, body, [athlete.id]);
      });
    }

    setIsBatchSending(false);
    setBatchSentSuccess(true);
    setTimeout(() => setBatchSentSuccess(false), 4000);
  };

  // Calculate next date helper based on day of month
  const calculateNextExpiryFromDay = (day: number): string => {
    const now = new Date();
    const currentDay = now.getDate();
    const nextMonth = currentDay >= day ? now.getMonth() + 1 : now.getMonth();
    const d = new Date(now.getFullYear(), nextMonth, day);
    return d.toISOString().slice(0, 10);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setCreateError('Por favor ingresa el nombre del atleta.');
      return;
    }

    if (!cleanEmail) {
      setCreateError('Por favor ingresa el correo electrónico del atleta.');
      return;
    }

    // Check duplicate name
    const nameExists = users.some(
      u => u.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (nameExists) {
      setCreateError(`Ya existe un atleta registrado con el nombre "${cleanName}". Por favor agrega un apellido o identificador para evitar perfiles duplicados.`);
      return;
    }

    // Check duplicate email
    const emailExists = users.some(
      u => u.email.trim().toLowerCase() === cleanEmail
    );
    if (emailExists) {
      setCreateError(`El correo "${cleanEmail}" ya está registrado en Kinetix. Cada alumno debe tener un correo único.`);
      return;
    }

    // Check duplicate username if provided
    const cleanUser = customUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUser) {
      const userExists = users.some(u => u.username?.toLowerCase() === cleanUser);
      if (userExists) {
        setCreateError(`El nombre de usuario "@${cleanUser}" ya está en uso. Por favor elige otro.`);
        return;
      }
    }

    const expiry = calculateNextExpiryFromDay(billingDay);
    const pass = initialPassword.trim() || 'kinetix123';

    onCreateUserByEmail({
      name: cleanName,
      email: cleanEmail,
      gender,
      heightCm,
      planName,
      billingDayOfMonth: billingDay,
      expiryDate: expiry,
      password: pass,
      switchToCreatedUser: false, // El dueño / coach se queda en su panel administrativo
    });

    setCreatedSuccessMsg(true);
    setTimeout(() => {
      setCreatedSuccessMsg(false);
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setCustomUsername('');
      setPlanName('Kinetix');
      setBillingDay(15);
      setInitialPassword('kinetix123');
    }, 1800);
  };

  // Owner/Coach password updater for athlete
  const handleOwnerUpdatePassword = (newPass: string) => {
    if (!selectedAthleteForPayment || !newPass.trim()) return;
    const clean = newPass.trim();
    try {
      localStorage.setItem(`kinetix_pwd_${selectedAthleteForPayment.id}`, clean);
    } catch {}
    setAthletePassword(clean);
    setNewPasswordForAthlete('');
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  const handleGenerateRandomPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const gen = `kz${randomNum}`;
    handleOwnerUpdatePassword(gen);
  };

  // Toggle quick access directly from list
  const handleQuickToggleAccess = (athlete: UserProfile) => {
    if (!onUpdateUserMembership) return;
    const isCurrentlySuspended = athlete.membership.status === 'suspended';
    const nextStatus: MembershipStatus = isCurrentlySuspended ? 'active' : 'suspended';
    onUpdateUserMembership(
      athlete.id,
      nextStatus,
      athlete.membership.expiryDate,
      athlete.membership.planName,
      athlete.membership.billingDayOfMonth
    );
  };

  // 4 Official Color Codes Data for Easy Rendering
  const OFFICIAL_COLORS = [
    { day: 5, colorName: 'Azul', emoji: '🔵', code: 'blue', desc: 'Pago día 5 de cada mes', btnActive: 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-blue-500/30 hover:border-blue-500/60' },
    { day: 15, colorName: 'Rojo', emoji: '🔴', code: 'red', desc: 'Pago día 15 de cada mes', btnActive: 'bg-red-600 text-white border-red-400 ring-2 ring-red-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-red-500/30 hover:border-red-500/60' },
    { day: 20, colorName: 'Rosa', emoji: '🌸', code: 'pink', desc: 'Pago día 20 de cada mes', btnActive: 'bg-pink-600 text-white border-pink-400 ring-2 ring-pink-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-pink-500/30 hover:border-pink-500/60' },
    { day: 30, colorName: 'Verde', emoji: '🟢', code: 'green', desc: 'Pago día 30 de cada mes', btnActive: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-emerald-500/30 hover:border-emerald-500/60' },
  ];

  return (
    <div className="space-y-4 pb-20 px-3 sm:px-4 pt-2">
      {/* Back to Dashboard Navigation Breadcrumb */}
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Portal del Entrenador · Staff Kinetix</span>
          </span>
          <h2 className="text-xl font-bold text-white font-brand">
            Control de Atletas & Pagos
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSendNotification && (
            <button
              onClick={onOpenSendNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Emitir avisos y recordatorios oficiales a los alumnos"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span>Mandar Avisos</span>
            </button>
          )}

          {isOwner && users.some(u => u.role === 'athlete') && onClearDemoAthletes && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas eliminar los alumnos de prueba y dejar la plataforma limpia únicamente con el Staff oficial (Leslie, Coach Jorge y Gus)?')) {
                  onClearDemoAthletes();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/70 border border-neutral-700/80 hover:border-red-700/80 text-neutral-300 hover:text-red-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Eliminar perfiles de prueba y dejar la base de datos limpia"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Limpiar Atletas Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenExpressForStaff('single')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            title="Registrar una marca de fuerza (Peso Muerto, Sentadilla, etc.) en segundos"
          >
            <Zap className="w-3.5 h-3.5 fill-neutral-950" />
            <span>Evaluar Express ⚡</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Exportar datos completos a Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar a Excel</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-500/25 active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Alta por Email</span>
          </button>
        </div>
      </div>

      {/* COACH'S OWN PERSONAL PROGRESS PANEL (Progreso Personal del Coach en Sesión) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-red-950/30 border border-red-900/40 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              name={activeStaff.name}
              avatarUrl={activeStaff.avatarUrl}
              role={activeStaff.role}
              staffRole={activeStaff.staffRole}
              sizeClassName="w-10 h-10"
              textClassName="text-sm"
              className="rounded-2xl border-2 border-red-500/50 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{activeStaff.name}</h3>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm ${
                  isOwner ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {isOwner ? 'Dueño/a · Control Total' : 'Coach / Profe'}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                {isOwner 
                  ? 'Acceso total a finanzas, logo, membresías y atletas'
                  : 'Acceso a evaluaciones 1RM, Cooper, pesajes y clases'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectUserToInspect(activeStaff)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition-all flex items-center gap-1"
            title="Ver mi panel personal de atleta y entrenador"
          >
            <span>Ver Mi Panel</span>
          </button>
        </div>

        {/* Coach Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Mi Peso Actual</span>
            <span className="text-base font-extrabold text-white font-mono">83.5 kg</span>
            <span className="text-[10px] text-emerald-400 block font-semibold">-1.5kg grasa</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">% Grasa / Músculo</span>
            <span className="text-base font-extrabold text-blue-400 font-mono">9.8%</span>
            <span className="text-[10px] text-blue-300 block font-medium">49.2% masa muscular</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Nivel Cooper</span>
            <span className="text-base font-extrabold text-amber-400 font-mono">Nivel 5</span>
            <span className="text-[10px] text-neutral-400 block font-mono">3,120 m (Élite)</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Sentadilla 1RM</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">165 kg</span>
            <span className="text-[10px] text-neutral-400 block font-mono">Resistencia: 05:48 min</span>
          </div>
        </div>

        {/* Coach Quick Actions for Himself */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/60">
          <button
            type="button"
            onClick={() => handleOpenExpressForStaff('single', activeStaff.id)}
            className="flex-1 min-w-[140px] py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            title="Registrar una marca de 1RM personal en segundos (Express)"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Evaluarme Express ⚡ (1RM)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTestEntryForUser(activeStaff)}
            className="flex-1 min-w-[140px] py-1.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            title="Evaluar mi Test Físico Completo (Cooper, Resistencia y 1RM)"
          >
            <Dumbbell className="w-3.5 h-3.5 text-red-400" />
            <span>Evaluar Mi Test Completo</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenBodyCompForUser ? onOpenBodyCompForUser(activeStaff) : onSelectUserToInspect(activeStaff)}
            className="flex-1 min-w-[140px] py-1.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            title="Registrar mi peso, porcentaje de grasa y masa muscular"
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Registrar Mi Peso / Grasa</span>
          </button>
        </div>
      </div>

      {/* EQUIPO DE COACHES & DIRECCIÓN KINETIX (Control Total para Dueños) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span>Equipo Oficial de Coaches Kinetix ({staffMembers.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowCreateStaffModal(true)}
                className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm active:scale-95"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Agregar Coach / Profe</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSupabaseModal(true)}
              className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Información de Base de Datos y Script SQL"
            >
              <Database className="w-3 h-3 text-blue-400" />
              <span>Base de Datos Supabase</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {staffMembers.map(staff => {
            const isStaffOwner = staff.staffRole === 'owner' || staff.id === 'user-staff-leslie' || staff.id === 'user-staff-01';
            const isSelf = staff.id === activeStaff.id || staff.id === 'user-staff-leslie';
            return (
              <div 
                key={staff.id}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col justify-between gap-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <UserAvatar
                      name={staff.name}
                      avatarUrl={staff.avatarUrl}
                      role={staff.role}
                      staffRole={staff.staffRole}
                      sizeClassName="w-9 h-9"
                    />
                    <div className="overflow-hidden">
                      <strong className="text-xs text-white block truncate">{staff.name}</strong>
                      <span className="text-[10px] text-neutral-400 block truncate font-mono">{staff.email}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    isStaffOwner 
                      ? 'bg-red-950 text-red-400 border border-red-800' 
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {isStaffOwner ? 'Dueño/a' : 'Profe'}
                  </span>
                </div>

                {/* Staff controls for owner */}
                {isOwner && (
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/70 text-[11px] gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAthleteForPayment(staff);
                        setEditName(staff.name);
                        setEditUsername(staff.username || staff.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9_]/g, ''));
                        setEditEmail(staff.email);
                        setEditPhone(staff.phone || '');
                        setEditStaffRole(staff.staffRole || 'coach');
                        try {
                          const saved = localStorage.getItem(`kinetix_pwd_${staff.id}`) || staff.password || 'kinetix2026';
                          setAthletePassword(saved);
                        } catch {
                          setAthletePassword(staff.password || 'kinetix2026');
                        }
                        setUsernameError(null);
                        setModalTab('profile');
                        setShowDeleteConfirm(false);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-neutral-900 transition-colors"
                      title="Editar nombre, usuario, correo y permisos de este coach o dueño"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar Perfil & Rol</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAthleteForPayment(staff);
                        setModalTab('security');
                        try {
                          const saved = localStorage.getItem(`kinetix_pwd_${staff.id}`) || staff.password || 'kinetix2026';
                          setAthletePassword(saved);
                        } catch {
                          setAthletePassword(staff.password || 'kinetix2026');
                        }
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                      title="Ver o editar contraseña de acceso"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Clave</span>
                    </button>

                    {!isSelf && onDeleteStaffMember && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Estás segura de eliminar a "${staff.name}" y revocarle su acceso de entrenador/a en Kinetix?`)) {
                            onDeleteStaffMember(staff.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold px-1.5 py-0.5 rounded-lg hover:bg-red-950/50 transition-colors flex items-center gap-1 ml-auto"
                        title="Eliminar coach del sistema"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Baja</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTÓN RÁPIDO Y PANEL DE CONTROL: VENCEN EN LOS PRÓXIMOS 3 DÍAS */}
      <div className={`p-4 rounded-3xl border transition-all ${
        colorFilter === 'due_soon'
          ? 'bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 border-amber-500 shadow-xl shadow-amber-500/20 ring-1 ring-amber-500/30'
          : 'bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-amber-800/50 hover:border-amber-600/70'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              colorFilter === 'due_soon' 
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm font-brand">
                  Vencimientos Próximos (Próximos 3 Días)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500 text-black shadow-sm">
                  {dueSoonAthletes.length} {dueSoonAthletes.length === 1 ? 'atleta' : 'atletas'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Alumnos con fecha de corte entre hoy y el fin de semana. Filtra y notifícalos en lote sin revisar uno por uno.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === 'due_soon' ? 'all' : 'due_soon')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                colorFilter === 'due_soon'
                  ? 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/25'
              }`}
            >
              <span>{colorFilter === 'due_soon' ? '✕ Ver Todos los Alumnos' : '⚡ Filtrar Vencimientos (3 Días)'}</span>
            </button>

            {dueSoonAthletes.length > 0 && (
              <button
                type="button"
                onClick={handleSendBatchReminderToDueSoon}
                disabled={isBatchSending}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                title="Emitir recordatorio de corte a las bandejas de entrada de todos los atletas que vencen pronto"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isBatchSending ? 'Enviando avisos...' : batchSentSuccess ? '¡Avisos Enviados!' : `📢 Avisar en Lote (${dueSoonAthletes.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {batchSentSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Notificación masiva enviada con éxito a las bandejas de entrada de los atletas!</span>
          </div>
        )}
      </div>

      {/* SYSTEM DE CÓDIGOS DE COLOR DE PAGO (Información & Filtro Rápido) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>Códigos de Color de Pago (Vencimientos Mensuales)</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Filtro por fecha de corte:</span>
        </div>

        {/* Color buttons filter */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          <button
            onClick={() => setColorFilter('all')}
            className={`py-2 px-2.5 rounded-xl text-center border font-semibold transition-all flex items-center justify-center gap-1.5 ${
              colorFilter === 'all'
                ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] bg-neutral-900 px-1.5 py-0.2 rounded-full border border-neutral-700">
              {users.filter(u => u.role === 'athlete').length}
            </span>
          </button>

          {/* Botón Rápido: Vencen en 3 Días */}
          <button
            onClick={() => setColorFilter(colorFilter === 'due_soon' ? 'all' : 'due_soon')}
            className={`py-2 px-2 rounded-xl text-center border font-bold transition-all flex items-center justify-between gap-1 text-[11px] ${
              colorFilter === 'due_soon'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-amber-950/30 text-amber-300 border-amber-900/60 hover:bg-amber-950/60'
            }`}
            title="Filtrar alumnos cuyo corte vence en los próximos 3 días"
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>⚡ En 3 Días</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              colorFilter === 'due_soon' ? 'bg-black text-amber-300' : 'bg-amber-900/80 text-amber-200'
            }`}>
              {dueSoonAthletes.length}
            </span>
          </button>

          {OFFICIAL_COLORS.map(c => {
            const count = users.filter(u => u.role === 'athlete' && (u.membership?.billingDayOfMonth || 15) === c.day).length;
            const isSelected = colorFilter === c.day;
            return (
              <button
                key={c.day}
                onClick={() => setColorFilter(c.day as any)}
                className={`py-2 px-2 rounded-xl text-center border font-semibold transition-all flex items-center justify-between gap-1 text-[11px] ${
                  isSelected ? c.btnActive : c.btnInactive
                }`}
                title={c.desc}
              >
                <div className="flex items-center gap-1.5">
                  <span>{c.emoji}</span>
                  <span className="font-semibold">{c.colorName} · Día {c.day}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 font-mono font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-neutral-400 pt-1 flex items-center gap-1.5 border-t border-neutral-800/60">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>El número de cada código representa el <strong>día de corte mensual</strong> de pago (Día 5, 15, 20 o 30). Usa el botón amarillo ⚡ para ver quién vence esta semana.</span>
        </div>
      </div>

      {/* BANNER COACH: EVALUACIÓN EXPRESS DE PRUEBAS & FUERZA */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/40 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <strong className="text-white text-xs sm:text-sm font-brand">Evaluación Express de Fuerza (1RM & PRs)</strong>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full font-bold">
                  Coach Móvil ⚡
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Registra marcas de Peso Muerto, Sentadilla, Banco, etc. para <strong>1 atleta</strong>, un <strong>grupo seleccionado</strong> o <strong>todos los alumnos</strong> en segundos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenExpressForStaff('single')}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-neutral-950" />
              <span>1 Atleta</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenExpressForStaff('multiple')}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Elegir Varios</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenExpressForStaff('all')}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Todos ({users.filter(u => u.role === 'athlete').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input con botón de borrado rápido para celular */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar atleta por nombre o email..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded-full bg-neutral-800 active:scale-95 transition-all"
            title="Borrar búsqueda"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* BANNER DE ACCIÓN MASIVA: VENCEN EN 3 DÍAS */}
      {colorFilter === 'due_soon' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-neutral-900 to-red-950/50 border border-amber-500/50 space-y-2.5 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white text-xs block">
                  {filteredAthletes.length} {filteredAthletes.length === 1 ? 'Atleta con corte' : 'Atletas con corte'} en los próximos 3 días
                </strong>
                <p className="text-[11px] text-amber-300/80">
                  Emitir recordatorio masivo de renovación a sus bandejas de entrada
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendBatchReminderToDueSoon}
              disabled={filteredAthletes.length === 0 || isBatchSending}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isBatchSending ? 'Enviando...' : batchSentSuccess ? '¡Avisos Enviados!' : '📢 Enviar Aviso en Lote a Todos'}</span>
            </button>
          </div>
          {batchSentSuccess && (
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Se envió la notificación de renovación oficial a los atletas filtrados.</span>
            </div>
          )}
        </div>
      )}

      {/* Staff Management Notice: Control Manual vs Automático */}
      <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-neutral-200">Control Manual de Acceso:</strong> Recomendamos el control manual por el Coach con el botón directo de <em>Pausar / Reactivar</em>. Esto te da flexibilidad total para autorizar prórrogas o pagos en efectivo sin que un corte automático interrumpa la app del alumno.
        </p>
      </div>

      {/* Athletes List */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
          Atletas en Lista ({filteredAthletes.length})
        </span>

        {filteredAthletes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <strong className="text-white text-sm block font-brand">Base de Datos Lista (Solo Staff Oficial)</strong>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                No hay alumnos registrados. La plataforma está limpia para comenzar a registrar a tus atletas reales de Kinetix con su correo y plan.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Alta de Primer Alumno</span>
              </button>
              {isOwner && onRestoreDemoAthletes && (
                <button
                  onClick={onRestoreDemoAthletes}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all"
                  title="Cargar los 4 alumnos demo si deseas realizar pruebas visuales"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Cargar Alumnos Demo (Pruebas)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredAthletes.map((athlete) => {
          const pg = getPaymentGroup(athlete.membership.billingDayOfMonth);
          const isSuspended = athlete.membership.status === 'suspended';
          const isExpiringSoon = athlete.membership.status === 'expiring_soon';

          return (
            <div
              key={athlete.id}
              className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                isSuspended
                  ? 'bg-red-950/30 border-red-900/50 hover:border-red-700/60'
                  : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={athlete.name}
                    avatarUrl={athlete.avatarUrl}
                    role={athlete.role}
                    sizeClassName="w-9 h-9"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{athlete.name}</span>
                      {isSuspended && (
                        <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                          Pausado
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-mono">{athlete.email}</span>
                  </div>
                </div>

                {/* Color Code Badge & Status */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${pg.badgeBg} ${pg.badgeBorder} ${pg.badgeText}`}>
                    <span>{pg.dotEmoji}</span>
                    <span>{pg.colorName} · Corte Día {athlete.membership.billingDayOfMonth || 15}</span>
                  </span>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isSuspended 
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : isExpiringSoon 
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {isSuspended ? 'Acceso Pausado' : isExpiringSoon ? 'Vence Pronto' : 'Al Día'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-neutral-800/60 gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-300 flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-400">Plan:</span>
                    <strong className="text-white font-semibold">{athlete.membership.planName}</strong>
                    {athlete.membership.hasNutritionPlan && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                        🥗 Nutrición
                      </span>
                    )}
                    {athlete.membership.personalCoach && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-medium">
                        🏋️ Coach Jorge
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 flex-wrap">
                    <span>Pago vence:</span>
                    <strong className="text-white font-mono">{athlete.membership.expiryDate}</strong>
                    <span>·</span>
                    <span className={`${pg.badgeText} font-semibold`}>Corte Día {athlete.membership.billingDayOfMonth || 15} de cada mes</span>
                    {isExpiringInNext3Days(athlete) && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Vence en ≤ 3 días</span>
                      </span>
                    )}
                  </div>
                  {/* LFPDPPP Consent Status Indicator */}
                  <div className="text-[10px] flex items-center gap-1.5 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-neutral-400">Privacidad:</span>
                    {consentHistory?.[athlete.id]?.some(c => c.privacy_notice_version === CURRENT_PRIVACY_NOTICE_VERSION && c.privacy_notice_accepted && c.sensitive_data_consent) ? (
                      <span className="text-emerald-400 font-semibold">✓ Aceptado ({CURRENT_PRIVACY_NOTICE_VERSION})</span>
                    ) : (
                      <span className="text-amber-400 font-medium">⚠️ Pendiente (1er acceso)</span>
                    )}
                  </div>
                </div>

                {/* Staff Actions for this Athlete */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* Direct 1-Click Access Toggle (Pausar / Reactivar) */}
                  <button
                    onClick={() => handleQuickToggleAccess(athlete)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                      isSuspended
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-red-950/70 hover:bg-red-900 border border-red-800/60 text-red-300'
                    }`}
                    title={isSuspended ? 'Reactivar acceso a la app' : 'Pausar acceso por pago pendiente'}
                  >
                    {isSuspended ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Reactivar</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pausar</span>
                      </>
                    )}
                  </button>

                  {isExpiringInNext3Days(athlete) && onSendBatchNotification && (
                    <button
                      onClick={() => {
                        const billingDay = athlete.membership?.billingDayOfMonth || 15;
                        onSendBatchNotification(
                          'Recordatorio de Renovación Kinetix',
                          `Hola ${athlete.name.split(' ')[0]}, tu fecha de corte mensual (Día ${billingDay}) vence en los próximos días. Acércate a recepción o contacta a tu coach para renovar tu membresía.`,
                          [athlete.id]
                        );
                        setBatchSentSuccess(true);
                        setTimeout(() => setBatchSentSuccess(false), 3500);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                      title="Enviar aviso de corte directo a la bandeja de este alumno"
                    >
                      <Bell className="w-3 h-3 text-amber-400" />
                      <span>Avisar Corte</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedAthleteForPayment(athlete);
                      setEditExpiryDate(athlete.membership.expiryDate);
                      setEditStatus(athlete.membership.status);
                      setEditPlan(athlete.membership.planName);
                      setEditBillingDay(athlete.membership.billingDayOfMonth || 15);
                      setEditName(athlete.name);
                      setEditUsername(athlete.username || athlete.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9_]/g, ''));
                      setEditStaffRole('coach');
                      setUsernameError(null);
                      setEditEmail(athlete.email);
                      setEditPhone(athlete.phone);
                      setEditEmergencyName(athlete.emergencyContact?.name || '');
                      setEditEmergencyPhone(athlete.emergencyContact?.phone || '');
                      try {
                        const saved = localStorage.getItem(`kinetix_pwd_${athlete.id}`) || 'kinetix123';
                        setAthletePassword(saved);
                      } catch {
                        setAthletePassword('kinetix123');
                      }
                      setNewPasswordForAthlete('');
                      setShowAthletePassword(false);
                      setPasswordChangeSuccess(false);
                      setModalTab('membership');
                      setShowDeleteConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/70 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    title="Editar fecha de corte, color, contraseña o datos personales"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                    <span>Editar & Clave</span>
                  </button>

                  <button
                    onClick={() => onSelectUserToInspect(athlete)}
                    className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 text-[11px] font-medium transition-colors flex items-center gap-1 active:scale-95"
                    title="Ver la app exactamente como la ve este alumno (Modo Alumno)"
                  >
                    <Eye className="w-3 h-3 text-blue-400" />
                    <span>Ver como Alumno</span>
                  </button>

                  {onOpenBodyCompForUser && (
                    <button
                      onClick={() => onOpenBodyCompForUser(athlete)}
                      className="px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 text-blue-300 text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                      title="Registrar o consultar Bioimpedancia Renpho"
                    >
                      <Scale className="w-3 h-3 text-blue-400" />
                      <span>Cuerpo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenExpressForStaff('single', athlete.id)}
                    className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                    title="Captura Express de Fuerza (1RM) para este alumno"
                  >
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Express</span>
                  </button>

                  <button
                    onClick={() => onOpenTestEntryForUser(athlete)}
                    className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                    title="Registrar Test de Cooper (12 Min) y 1RM Máximos"
                  >
                    <Dumbbell className="w-3 h-3" />
                    <span>Evaluar</span>
                  </button>

                  {onOpenReportForUser && (
                    <button
                      onClick={() => onOpenReportForUser(athlete)}
                      className="px-2 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/70 text-emerald-300 text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                      title="Generar e imprimir Informe Oficial"
                    >
                      <Award className="w-3 h-3 text-emerald-400" />
                      <span>Reporte</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* MODAL: ALTA DE ATLETA POR CORREO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-brand">Alta de Atleta por Email</h3>
                <p className="text-xs text-neutral-400">Asigna plan, código de color de pago y credenciales</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdSuccessMsg ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">¡Invitación Enviada con Éxito!</h4>
                <p className="text-xs text-neutral-400">
                  Se ha generado la cuenta para <strong>{name}</strong> ({email}) con fecha de corte día {billingDay} de cada mes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                {createError && (
                  <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{createError}</span>
                  </div>
                )}
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Nombre Completo del Atleta</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Rodrigo Silva"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1 flex items-center justify-between">
                    <span>Nombre de Usuario (Opcional)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Autogenerado si está vacío</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="rodrigo"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Correo Electrónico (Para Login)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rodrigo.silva@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-300 font-medium block">Contraseña Inicial de Acceso</label>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">Fácil y Segura</span>
                  </div>
                  <input
                    type="text"
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    placeholder="kinetix123"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                    required
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                    💡 Dale esta contraseña al alumno. Podrá ingresar de inmediato desde su celular y cambiarla en cualquier momento desde su perfil sin depender de correos.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Género</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Estatura (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value) || 170)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Plan Oficial Kinetix</label>
                  <select
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value as KinetixPlanName)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                  >
                    <option value="Kinetix">Kinetix · Funcional & Fuerza</option>
                    <option value="Kinetix con Nutrición">Kinetix con Nutrición · Asesoría Nutricional Incluida</option>
                    <option value="Entrenos Personalizados (Coach Jorge)">Entrenos Personalizados (Coach Jorge) · 1 a 1 + Nutrición</option>
                  </select>
                </div>

                {/* HORARIO / CÓDIGOS DE COLOR DE PAGO INTERACTIVOS */}
                <div>
                  <label className="text-neutral-300 font-medium block mb-1.5 flex items-center justify-between">
                    <span>Horario de Pago · Código de Color:</span>
                    <span className="text-[10px] text-blue-400 font-semibold font-mono">
                      Seleccionado: Día {billingDay} ({getPaymentGroup(billingDay).colorName})
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {OFFICIAL_COLORS.map(c => {
                      const isSelected = billingDay === c.day;
                      return (
                        <button
                          key={c.day}
                          type="button"
                          onClick={() => setBillingDay(c.day)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected ? c.btnActive : c.btnInactive
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{c.emoji}</span>
                            <span>{c.colorName} (Día {c.day})</span>
                          </div>
                          <span className="text-[10px] opacity-80 block mt-0.5">
                            Pago vence día {c.day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-neutral-500 leading-tight">
                    El atleta y el coach verán este código de color y la fecha fija de vencimiento en su app oficial.
                  </p>
                </div>

                {/* Legal Consent Preview Notice */}
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200 space-y-1">
                  <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Aviso Previo de Consentimiento LFPDPPP</span>
                  </div>
                  <p className="text-neutral-300 text-[10px] leading-relaxed">
                    Al completar el alta, la cuenta queda creada. Al primer acceso del alumno, el sistema le desplegará de forma obligatoria e ineludible la pantalla de consentimiento del <strong>Aviso de Privacidad Integral</strong> para autorizar el tratamiento de sus datos sensibles antes de capturar datos de composición corporal o salud.
                  </p>
                </div>

                {/* Staff admin session preservation notice */}
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Al guardar, el atleta se añadirá a la lista oficial y permanecerás dentro de tu panel de Coach/Staff.</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-md shadow-red-500/25 active:scale-95"
                  >
                    Generar Alta y Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONTROL TOTAL DEL ATLETA (EDICIÓN MANUAL COMPLETA & PAUSA DE ACCESO) */}
      {selectedAthleteForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-brand flex items-center gap-2">
                  {selectedAthleteForPayment.role === 'staff' ? (
                    <>
                      <UserCog className="w-4 h-4 text-amber-500" />
                      <span>Editar Perfil de Coach / Dueño</span>
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="w-4 h-4 text-red-500" />
                      <span>Control Total del Atleta</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-neutral-400">
                  {selectedAthleteForPayment.role === 'staff' ? 'Staff: ' : 'Atleta: '}
                  <strong className="text-white">{selectedAthleteForPayment.name}</strong>
                  {selectedAthleteForPayment.username && (
                    <span className="text-neutral-500 ml-1 font-mono">(@{selectedAthleteForPayment.username})</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedAthleteForPayment(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
              {selectedAthleteForPayment.role === 'athlete' && (
                <button
                  type="button"
                  onClick={() => setModalTab('membership')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    modalTab === 'membership' ? 'bg-neutral-800 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Plan & Acceso
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === 'profile' ? 'bg-neutral-800 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {selectedAthleteForPayment.role === 'staff' ? 'Datos & Rol' : 'Datos Personales'}
              </button>
              <button
                type="button"
                onClick={() => setModalTab('security')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === 'security' ? 'bg-neutral-800 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                🔐 Contraseña
              </button>
            </div>

            {savePaymentSuccess ? (
              <div className="p-6 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                <div className="font-bold text-base">¡Cambios guardados con éxito!</div>
                <p className="text-xs text-neutral-400">Los datos y permisos del atleta han sido actualizados en la plataforma.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {modalTab === 'membership' && (
                  <>
                    {/* CONTROL MANUAL DE ACCESO (PAUSAR TEMPORAL / CANCELAR / REACTIVAR) */}
                    <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                      editStatus === 'suspended'
                        ? 'bg-amber-950/40 border-amber-800'
                        : editStatus === 'canceled'
                        ? 'bg-neutral-900 border-neutral-700'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {editStatus === 'suspended' ? (
                            <Pause className="w-4 h-4 text-amber-400" />
                          ) : editStatus === 'canceled' ? (
                            <X className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="font-bold text-white text-xs">Estado de Cuenta & Acceso:</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          editStatus === 'suspended'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : editStatus === 'canceled'
                            ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {editStatus === 'suspended' ? 'PAUSADO (1 MES / RETOMA)' : editStatus === 'canceled' ? 'CANCELADO' : 'ACCESO ACTIVO'}
                        </span>
                      </div>

                      {/* 3 Clear Status Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditStatus('active')}
                          className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-[11px] transition-all ${
                            editStatus === 'active'
                              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/50'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Activo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditStatus('suspended')}
                          className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-[11px] transition-all ${
                            editStatus === 'suspended'
                              ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/50'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                          title="Para alumnos que pausan por viaje o 1 mes y volverán (conserva todos sus datos)"
                        >
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pausar (1 mes)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditStatus('canceled')}
                          className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-[11px] transition-all ${
                            editStatus === 'canceled'
                              ? 'bg-neutral-700 text-white shadow-md ring-2 ring-neutral-500/50'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                          title="Baja administrativa de membresía"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-neutral-400 leading-relaxed pt-0.5">
                        💡 <strong>Pausar</strong> preserva todo el historial de pesajes, Cooper y fotos del alumno intactos para cuando regrese. <strong>Eliminar definitivamente</strong> (abajo) solo se usa para borrar la cuenta de raíz.
                      </p>
                    </div>

                    {/* ASIGNACIÓN DE HORARIO DE PAGO POR CÓDIGO DE COLOR */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-neutral-300 font-medium block">
                          Horario de Pago · Código de Color Asignado:
                        </label>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">
                          Día {editBillingDay} ({getPaymentGroup(editBillingDay).colorName})
                        </span>
                      </div>

                      {/* 4 Official Color Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {OFFICIAL_COLORS.map(c => {
                          const isSelected = editBillingDay === c.day;
                          return (
                            <button
                              key={c.day}
                              type="button"
                              onClick={() => {
                                setEditBillingDay(c.day);
                                const newExpiry = calculateNextExpiryFromDay(c.day);
                                setEditExpiryDate(newExpiry);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected ? c.btnActive : c.btnInactive
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold">
                                <span>{c.emoji}</span>
                                <span>{c.colorName}</span>
                              </div>
                              <div className="text-[10px] opacity-80 mt-0.5">
                                Pago vence día {c.day} de cada mes
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Plan Selection */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Plan Oficial Asignado:</label>
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as KinetixPlanName)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:border-red-500 outline-none"
                      >
                        <option value="Kinetix">Kinetix · Funcional & Fuerza</option>
                        <option value="Kinetix con Nutrición">Kinetix con Nutrición · Asesoría Nutricional Incluida</option>
                        <option value="Entrenos Personalizados (Coach Jorge)">Entrenos Personalizados (Coach Jorge) · 1 a 1 + Nutrición</option>
                      </select>
                    </div>

                    {/* Quick 1-click renewal */}
                    <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <label className="text-neutral-300 font-medium block">Fecha Límite de Pago en Calendario:</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={editExpiryDate}
                          onChange={(e) => setEditExpiryDate(e.target.value)}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 30);
                            setEditExpiryDate(d.toISOString().slice(0, 10));
                            setEditStatus('active');
                          }}
                          className="py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all whitespace-nowrap"
                        >
                          +30 Días
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Esta fecha se muestra en el widget permanente de la app del atleta.
                      </p>
                    </div>

                    {/* Quick Access to Technical Tools for this athlete */}
                    <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                        Herramientas Técnicas Directas:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedAthleteForPayment) {
                              const athlete = selectedAthleteForPayment;
                              setSelectedAthleteForPayment(null);
                              onOpenTestEntryForUser(athlete);
                            }
                          }}
                          className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-semibold text-[11px] flex flex-col items-center justify-center gap-1 transition-all"
                          title="Registrar Test de Cooper o Fuerza 1RM"
                        >
                          <Dumbbell className="w-3.5 h-3.5 text-red-400" />
                          <span>Evaluar Tests</span>
                        </button>

                        {onOpenBodyCompForUser && (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedAthleteForPayment) {
                                const athlete = selectedAthleteForPayment;
                                setSelectedAthleteForPayment(null);
                                onOpenBodyCompForUser(athlete);
                              }
                            }}
                            className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-[11px] flex flex-col items-center justify-center gap-1 transition-all"
                            title="Registrar o ver Bioimpedancia Renpho"
                          >
                            <Scale className="w-3.5 h-3.5 text-blue-400" />
                            <span>Bioimpedancia</span>
                          </button>
                        )}

                        {onOpenReportForUser && (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedAthleteForPayment) {
                                const athlete = selectedAthleteForPayment;
                                setSelectedAthleteForPayment(null);
                                onOpenReportForUser(athlete);
                              }
                            }}
                            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px] flex flex-col items-center justify-center gap-1 transition-all"
                            title="Generar e imprimir Informe Oficial"
                          >
                            <Award className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ver Dictamen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {modalTab === 'profile' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">
                        {selectedAthleteForPayment.role === 'staff' ? 'Nombre Completo del Coach / Dueño' : 'Nombre Completo del Atleta'}
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1 flex items-center justify-between">
                        <span>Nombre de Usuario (Para Iniciar Sesión)</span>
                        <span className="text-[10px] text-neutral-500 font-mono">Único · Sin espacios</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">@</span>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => {
                            setUsernameError(null);
                            setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                          }}
                          placeholder="ej. juan / leslie"
                          className={`w-full bg-neutral-950 border rounded-xl pl-7 pr-3 py-2 text-white text-xs font-mono outline-none ${
                            usernameError ? 'border-red-500' : 'border-neutral-800 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {usernameError ? (
                        <p className="text-[11px] text-red-400 mt-1 font-semibold">{usernameError}</p>
                      ) : (
                        <p className="text-[10px] text-neutral-500 mt-1">
                          El usuario podrá ingresar con este alias o con su correo en el portal.
                        </p>
                      )}
                    </div>

                    {selectedAthleteForPayment.role === 'staff' && (
                      <div>
                        <label className="text-neutral-300 font-medium block mb-1">Rol de Permisos en Kinetix</label>
                        <select
                          value={editStaffRole}
                          onChange={(e) => setEditStaffRole(e.target.value as 'owner' | 'coach')}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                        >
                          <option value="owner">Dueño/a (Control Total: Finanzas, Base de Datos, Atletas y Coaches)</option>
                          <option value="coach">Entrenador/a (Gestión de Tests Físicos, 1RM y Pesajes)</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Correo Electrónico (Login)</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Teléfono Móvil / WhatsApp</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Ej. +52 55 1234 5678"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      />
                    </div>

                    {selectedAthleteForPayment.role === 'athlete' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-neutral-300 font-medium block mb-1">Contacto Emergencia</label>
                          <input
                            type="text"
                            value={editEmergencyName}
                            onChange={(e) => setEditEmergencyName(e.target.value)}
                            placeholder="Nombre familiar"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-neutral-300 font-medium block mb-1">Teléfono Emergencia</label>
                          <input
                            type="tel"
                            value={editEmergencyPhone}
                            onChange={(e) => setEditEmergencyPhone(e.target.value)}
                            placeholder="Teléfono"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {modalTab === 'security' && (
                  <div className="space-y-4">
                    {/* Current Password Reveal Card */}
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-blue-400" />
                          <span>Contraseña Actual del Alumno:</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                          Acceso Dueños
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="font-mono text-sm tracking-wider text-white font-bold">
                          {showAthletePassword ? athletePassword : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAthletePassword(!showAthletePassword)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                        >
                          {showAthletePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showAthletePassword ? 'Ocultar' : 'Revelar Clave'}</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-neutral-400 leading-tight">
                        Si el alumno olvidó su contraseña o no puede ingresar, puedes leérsela directamente o asignarle una nueva a continuación.
                      </p>
                    </div>

                    {/* Change or Reset Password Card */}
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                      <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-red-400" />
                        <span>Asignar Nueva Contraseña al Alumno:</span>
                      </span>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPasswordForAthlete}
                          onChange={(e) => setNewPasswordForAthlete(e.target.value)}
                          placeholder="Escribe nueva clave (ej. kz2026)"
                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleOwnerUpdatePassword(newPasswordForAthlete)}
                          disabled={!newPasswordForAthlete.trim()}
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md active:scale-95 shrink-0"
                        >
                          Guardar Clave
                        </button>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleGenerateRandomPassword}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                        >
                          <span>🎲 Generar contraseña aleatoria (ej. kz4812)</span>
                        </button>
                      </div>

                      {passwordChangeSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>¡Contraseña actualizada con éxito! La nueva clave es: <strong className="text-white font-mono">{athletePassword}</strong></span>
                        </div>
                      )}

                      {onSwitchUser && selectedAthleteForPayment.role === 'athlete' && (
                        <div className="pt-2 border-t border-neutral-800">
                          <button
                            type="button"
                            onClick={() => {
                              const target = selectedAthleteForPayment;
                              setSelectedAthleteForPayment(null);
                              onSwitchUser(target);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                            <span>Iniciar Sesión como este Alumno (Modo Prueba)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Save and Cancel buttons */}
                <div className="flex gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameError(null);
                      setSelectedAthleteForPayment(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                      if (cleanUsername) {
                        const isTaken = users.some(
                          u => u.id !== selectedAthleteForPayment.id && u.username?.toLowerCase() === cleanUsername
                        );
                        if (isTaken) {
                          setUsernameError(`El nombre de usuario "@${cleanUsername}" ya pertenece a otro miembro. Debe ser único.`);
                          setModalTab('profile');
                          return;
                        }
                      }

                      if (selectedAthleteForPayment.role === 'athlete' && onUpdateUserMembership) {
                        onUpdateUserMembership(
                          selectedAthleteForPayment.id, 
                          editStatus, 
                          editExpiryDate,
                          editPlan,
                          editBillingDay
                        );
                      }

                      if (onUpdateAthleteProfile) {
                        onUpdateAthleteProfile(selectedAthleteForPayment.id, {
                          name: editName.trim(),
                          email: editEmail.trim().toLowerCase(),
                          phone: editPhone.trim(),
                          username: cleanUsername || undefined,
                          staffRole: selectedAthleteForPayment.role === 'staff' ? editStaffRole : undefined,
                          emergencyContact: selectedAthleteForPayment.role === 'athlete' ? {
                            ...selectedAthleteForPayment.emergencyContact,
                            name: editEmergencyName,
                            phone: editEmergencyPhone,
                          } : undefined
                        });
                      }

                      setSavePaymentSuccess(true);
                      setTimeout(() => {
                        setSavePaymentSuccess(false);
                        setSelectedAthleteForPayment(null);
                      }, 1200);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-500/25 active:scale-95 transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>

                {/* DANGER ZONE: Eliminar Atleta (Solo Dueños: Leslie & Jorge) */}
                <div className="pt-2 border-t border-neutral-800/80">
                  {!isOwner ? (
                    <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>La baja permanente y eliminación de atletas está restringida a los dueños (Leslie & Jorge).</span>
                    </div>
                  ) : !showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2 rounded-xl bg-red-950/30 hover:bg-red-950/70 border border-red-900/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dar de Baja y Eliminar Atleta</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-red-950/90 border border-red-800 text-xs space-y-2 animate-fade-in">
                      <div className="text-red-200 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>¿Confirmas eliminar permanentemente a {selectedAthleteForPayment.name}?</span>
                      </div>
                      <p className="text-[11px] text-red-300/80 leading-relaxed">
                        Esta acción borrará al atleta de la base de datos de Kinetix, junto con sus fotos privadas, pesajes y evaluaciones. No se puede deshacer.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteAthlete) {
                              onDeleteAthlete(selectedAthleteForPayment.id);
                            }
                            setSelectedAthleteForPayment(null);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-md"
                        >
                          Sí, Eliminar Atleta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL: EXPORTAR A EXCEL / CSV */}
      {showExportModal && (
        <ExcelExportModal
          users={users}
          bodyCompRecords={bodyCompRecords}
          evaluations={evaluations}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* MODAL: CREAR NUEVO COACH / STAFF */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-brand">Nuevo Miembro del Staff</h3>
                  <p className="text-xs text-neutral-400">Alta de entrenador/a o socio/a Kinetix</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateStaffModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStaffName.trim() || !newStaffEmail.trim()) return;
                if (onCreateStaffMember) {
                  onCreateStaffMember({
                    name: newStaffName.trim(),
                    email: newStaffEmail.trim(),
                    password: newStaffPassword.trim() || 'kinetix2026',
                    staffRole: newStaffRole,
                  });
                }
                setNewStaffName('');
                setNewStaffEmail('');
                setNewStaffPassword('kinetix2026');
                setShowCreateStaffModal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-neutral-300 font-medium block mb-1">Nombre Completo del Coach / Profe</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ej. Coach Gus / Gustavo Ramírez"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Correo Electrónico (Para Iniciar Sesión)</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="gus.coach@kinetix.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Contraseña de Acceso</label>
                <input
                  type="text"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="kinetix2026"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                  required
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  Podrá iniciar sesión con este correo y contraseña de inmediato.
                </span>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Nivel de Permisos / Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('coach')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newStaffRole === 'coach'
                        ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <strong className="block text-xs">🏋️ Profe / Coach</strong>
                    <span className="text-[10px] text-neutral-400">Evaluar 1RM, pesajes y Cooper</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStaffRole('owner')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newStaffRole === 'owner'
                        ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <strong className="block text-xs">👑 Dueño/a Kinetix</strong>
                    <span className="text-[10px] text-neutral-400">Control total, finanzas y bajas</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-600/25 active:scale-95 transition-all"
                >
                  Crear Perfil de Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ESTADO DE SUPABASE & SCRIPT SQL DE CREACIÓN DE TABLAS */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-brand flex items-center gap-2">
                    <span>Base de Datos en la Nube (Supabase Cloud)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isSupabaseConfigured()
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {isSupabaseConfigured() ? '🟢 Conectado' : '🟡 Modo Local'}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">Respaldo permanente, sincronización en tiempo real y script SQL oficial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              {/* Card 1: Seguridad y Almacenamiento Actual */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5 text-emerald-200">
                <strong className="block text-white text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tus datos NO se pierden: Doble Capa de Seguridad Kinetix</span>
                </strong>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Actualmente todos los atletas ({users.length}), pesajes ({bodyCompRecords.length}) y evaluaciones ({evaluations.length}) están guardados de forma permanente en el almacenamiento local del dispositivo. Cuando configures tu proyecto en Supabase, los datos se sincronizarán también en la nube de PostgreSQL automáticamente.
                </p>
              </div>

              {/* Card 2: Capacidad para 30 alumnos o más */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>¿Aguantará 30 alumnos en Supabase? (Análisis de Capacidad)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block font-mono">Almacenamiento BD</span>
                    <strong className="text-white text-xs">500 MB Gratis</strong>
                    <p className="text-[10px] text-emerald-400 mt-0.5">30 alumnos usan menos de 6 MB (&lt;1.2%)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block font-mono">Usuarios Activos</span>
                    <strong className="text-white text-xs">50,000 / mes</strong>
                    <p className="text-[10px] text-emerald-400 mt-0.5">30 alumnos = 0.06% del límite</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block font-mono">Velocidad</span>
                    <strong className="text-white text-xs">PostgreSQL 15</strong>
                    <p className="text-[10px] text-emerald-400 mt-0.5">Respuestas en menos de 40ms</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Credenciales de Supabase en Vivo */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conectar con tu Proyecto Supabase</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500">Configuración directa desde el panel</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                      URL del Proyecto Supabase (Project URL)
                    </label>
                    <input
                      type="text"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      placeholder="https://xyzabcdefghijklmnop.supabase.co"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                      Clave Anónima Pública (Anon Key)
                    </label>
                    <input
                      type="password"
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Status message */}
                {supabaseTestStatus && (
                  <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                    supabaseTestStatus.ok
                      ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                      : 'bg-red-950/50 border-red-800/80 text-red-200'
                  }`}>
                    {supabaseTestStatus.ok ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                    <span>{supabaseTestStatus.message}</span>
                  </div>
                )}

                {syncResult && (
                  <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-800/80 text-blue-200 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{syncResult}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isTestingSupabase}
                    onClick={async () => {
                      setIsTestingSupabase(true);
                      setSupabaseTestStatus(null);
                      saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                      const res = await testSupabaseConnection();
                      setSupabaseTestStatus(res);
                      setIsTestingSupabase(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isTestingSupabase ? 'Verificando...' : 'Guardar y Probar Conexión'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncingAll}
                    onClick={async () => {
                      setIsSyncingAll(true);
                      setSyncResult(null);
                      saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                      const res = await syncAllToSupabase(users, bodyCompRecords, evaluations, []);
                      if (res.success) {
                        setSyncResult(`¡Sincronización completada! Subidos: ${res.syncedCount.users} atletas, ${res.syncedCount.bodyComp} pesajes, ${res.syncedCount.evals} tests.`);
                      } else {
                        setSyncResult(`No se pudo sincronizar: ${res.error}. Recuerda ejecutar el script SQL oficial abajo en Supabase.`);
                      }
                      setIsSyncingAll(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAll ? 'Sincronizando...' : 'Subir Todos los Datos a Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                    title="Guarda una copia de seguridad local en archivo .json"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Descargar Respaldo JSON</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Script SQL Oficial Kinetix */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>Script SQL Oficial Kinetix (Para ejecutar en Supabase)</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500">Ejecutar 1 sola vez en SQL Editor</span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  Copia este código y pégalo en tu panel de Supabase (<strong>supabase.com &rarr; tu proyecto &rarr; SQL Editor &rarr; New Query &rarr; Run</strong>). Creará todas las tablas con sus tipos, llaves foráneas y permisos seguros:
                </p>

                <div className="relative">
                  <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-mono text-neutral-300 overflow-x-auto max-h-56 leading-relaxed select-all">
{KINETIX_OFFICIAL_SUPABASE_SQL}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(KINETIX_OFFICIAL_SUPABASE_SQL);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar SQL Completo'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">Kinetix Functional Zone · Base de datos en la nube</span>
              <button
                type="button"
                onClick={() => setShowSupabaseModal(false)}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COACH: EVALUACIÓN EXPRESS DE FUERZA (1RM & PRs) */}
      {showExpressModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-brand flex items-center gap-1.5">
                    <span>Captura Express de Fuerza</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      1RM & PR
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Registra marcas de forma ágil para un alumno, grupo o todos en la clase
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExpressModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification / Success Feedback */}
            {expressSaveSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{expressSaveSuccessMsg}</span>
              </div>
            )}

            {/* STEP 1: SELECTOR DE MODO DE EVALUACIÓN (Pregunta del usuario: ¿A todos o solo elegir unos?) */}
            {/* STEP 1: SELECTOR DE MODO DE EVALUACIÓN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block">
                1. ¿A quiénes deseas evaluar?
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setExpressMode('single')}
                  className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    expressMode === 'single'
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>1 Atleta (o Yo Misma)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExpressMode('multiple');
                    if (selectedAthleteIdsForExpress.length === 0) {
                      const athList = users.filter(u => u.role === 'athlete');
                      setSelectedAthleteIdsForExpress(athList.map(a => a.id));
                    }
                  }}
                  className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    expressMode === 'multiple' || expressMode === 'all'
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Evaluar Grupo ({selectedAthleteIdsForExpress.length} seleccionados)</span>
                </button>
              </div>
            </div>

            {/* STEP 2: SELECTOR DE EJERCICIO DE FUERZA */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block">
                2. Ejercicio de Fuerza Oficial
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                {[
                  { id: 'deadlift', name: 'Peso Muerto', emoji: '🏋️' },
                  { id: 'squats', name: 'Sentadilla', emoji: '🦵' },
                  { id: 'hip_thrust', name: 'Hip Thrust', emoji: '🍑' },
                  { id: 'horizontal_press', name: 'Press Banco', emoji: '🏋️‍♂️' },
                  { id: 'pullups_or_rows', name: expressRowType === 'remo' ? 'Remo con Barra' : 'Dominadas', emoji: '💪' },
                ].map((ex) => {
                  const isSelected = expressExerciseId === ex.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        setExpressExerciseId(ex.id as any);
                        if (expressTargetSingleId) {
                          const rec = getLatestAthleteExerciseData(expressTargetSingleId, ex.id);
                          if (rec && rec.status === 'completed' && rec.weightKg > 0) {
                            setExpressSingleWeight(rec.weightKg);
                            setExpressSingleReps(rec.reps || 1);
                          }
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-red-600 text-white border-red-500 shadow-md font-bold ring-2 ring-red-500/40'
                          : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-base">{ex.emoji}</span>
                      <span className="text-[11px] font-semibold">{ex.name}</span>
                    </button>
                  );
                })}
              </div>

              {expressExerciseId === 'pullups_or_rows' && (
                <div className="flex items-center gap-2 pt-1 pl-1">
                  <span className="text-[11px] text-neutral-400">Variante:</span>
                  <button
                    type="button"
                    onClick={() => setExpressRowType('remo')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      expressRowType === 'remo'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Remo con Barra
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpressRowType('dominadas')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      expressRowType === 'dominadas'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Dominadas (Pull-ups)
                  </button>
                </div>
              )}
            </div>

            {/* STEP 3: FECHA DE EVALUACIÓN (Permite cargar fechas anteriores sin alterar registros ganados) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Fecha del Registro:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={expressDate}
                  onChange={(e) => setExpressDate(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setExpressDate(new Date().toISOString().slice(0, 10))}
                  className="text-[10px] text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700"
                >
                  Hoy
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* MODO 1: UN ATLETA INDIVIDUAL */}
            {/* ============================================================== */}
            {expressMode === 'single' && (
              <div className="space-y-4 p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800">
                {/* Athlete Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block">
                    Seleccionar Alumno
                  </label>
                  <select
                    value={expressTargetSingleId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setExpressTargetSingleId(newId);
                      const rec = getLatestAthleteExerciseData(newId, expressExerciseId);
                      if (rec && rec.status === 'completed' && rec.weightKg > 0) {
                        setExpressSingleWeight(rec.weightKg);
                        setExpressSingleReps(rec.reps || 1);
                        setExpressSingleStatus('completed');
                        setExpressSingleReason('');
                      } else if (rec && (rec.status === 'na' || rec.status === 'np')) {
                        setExpressSingleStatus(rec.status);
                        setExpressSingleReason(rec.statusReason || '');
                      }
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-500"
                  >
                    <optgroup label="⭐ Mi Perfil Personal (Coach / Dueña)">
                      <option value={activeStaff.id}>
                        ⭐ {activeStaff.name} (Mi Perfil Personal - Coach)
                      </option>
                    </optgroup>
                    <optgroup label="Alumnos del Gimnasio">
                      {users.filter(u => u.role === 'athlete').map((ath) => (
                        <option key={ath.id} value={ath.id}>
                          {ath.name} ({ath.membership.planName}) · Corte Día {ath.membership.billingDayOfMonth || 15}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Status Toggle: Válido, NA, NP */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block">
                    Estado de la Prueba
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExpressSingleStatus('completed');
                        setExpressSingleReason('');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        expressSingleStatus === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      ✓ Marca Válida
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setExpressSingleStatus('na');
                        if (!expressSingleReason) setExpressSingleReason('Ingreso posterior a fecha de pruebas');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        expressSingleStatus === 'na'
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      NA (No Aplica)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setExpressSingleStatus('np');
                        if (!expressSingleReason) setExpressSingleReason('Lesión o Molestia');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        expressSingleStatus === 'np'
                          ? 'bg-red-600 text-white border-red-400 shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      NP (No Presentada)
                    </button>
                  </div>
                </div>

                {/* Weight and Reps (If completed) */}
                {expressSingleStatus === 'completed' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Weight */}
                      <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                        <span className="text-[11px] text-neutral-400 block font-medium">Peso Levantado (kg)</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="500"
                            step="0.5"
                            value={expressSingleWeight}
                            onChange={(e) => setExpressSingleWeight(Number(e.target.value))}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-lg font-extrabold text-white text-center font-mono outline-none focus:border-amber-500"
                          />
                          <span className="text-xs text-neutral-400 font-bold">kg</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[-5, -2.5, +2.5, +5].map((delta) => (
                            <button
                              key={delta}
                              type="button"
                              onClick={() => setExpressSingleWeight(w => Math.max(0, Number((w + delta).toFixed(1))))}
                              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-mono font-bold"
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reps */}
                      <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                        <span className="text-[11px] text-neutral-400 block font-medium">Repeticiones Realizadas</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={expressSingleReps}
                            onChange={(e) => setExpressSingleReps(Math.max(1, Number(e.target.value)))}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-lg font-extrabold text-white text-center font-mono outline-none focus:border-amber-500"
                          />
                          <span className="text-xs text-neutral-400 font-bold">reps</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {[1, 3, 5, 8, 10].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setExpressSingleReps(r)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                                expressSingleReps === r 
                                  ? 'bg-amber-500 text-black' 
                                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 1RM Calculated Preview */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-neutral-900 to-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-neutral-300 font-medium">1RM Máximo Estimado (Fórmula Epley):</span>
                      </div>
                      <span className="text-base font-extrabold text-amber-400 font-mono">
                        {calculate1RM(expressSingleWeight, expressSingleReps)} kg
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Reason Selector for NA / NP */
                  <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                    <span className="text-[11px] text-neutral-400 block font-medium">
                      Motivo de {expressSingleStatus === 'na' ? 'Exención (NA)' : 'Inasistencia (NP)'}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Ingreso posterior a fecha de pruebas',
                        'Niño / Adulto mayor (Exento)',
                        'Lesión o Molestia articular',
                        'Prescripción médica',
                        'Falta / Inasistencia a clase'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setExpressSingleReason(preset)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                            expressSingleReason === preset
                              ? 'bg-blue-600 text-white border-blue-400 font-bold'
                              : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={expressSingleReason}
                      onChange={(e) => setExpressSingleReason(e.target.value)}
                      placeholder="O escribe un motivo personalizado..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                    />

                    {/* NA General Cycle Checkbox */}
                    {expressSingleStatus === 'na' && (
                      <label className="flex items-center gap-2 pt-1 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expressApplyAllCycleSingle}
                          onChange={(e) => setExpressApplyAllCycleSingle(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-neutral-950 border-neutral-700"
                        />
                        <span>
                          Aplicar <strong>NA General</strong> a todas las pruebas de este mes (Sentadilla, Banco, Cooper, etc.)
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {/* Optional Coach Notes */}
                <input
                  type="text"
                  value={expressNotes}
                  onChange={(e) => setExpressNotes(e.target.value)}
                  placeholder="Observaciones técnicas (opcional, ej. muy buena postura, subió 5kg)..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-500"
                />

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveExpressRecord([expressTargetSingleId])}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Registro</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndNextSingleExpress}
                    className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-neutral-700 active:scale-95 transition-all"
                    title="Guardar este atleta y pasar inmediatamente al siguiente"
                  >
                    <span>Guardar y Siguiente</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-amber-400" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* MODO 2 Y 3: ELEGIR GRUPO DE ATLETAS O TODOS */}
            {/* ============================================================== */}
            {(expressMode === 'multiple' || expressMode === 'all') && (
              <div className="space-y-4">
                {/* 1. SELECCIONAR ATLETAS CON BUSCADOR Y CHECKBOXES */}
                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>1. Elige qué atletas están en la estación:</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {selectedAthleteIdsForExpress.length} seleccionados
                    </span>
                  </div>

                  {/* Buscador de alumnos */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={expressSearchTerm}
                      onChange={(e) => setExpressSearchTerm(e.target.value)}
                      placeholder="Buscar alumno por nombre para incluir o quitar..."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-500"
                    />
                    {expressSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setExpressSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtros rápidos */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedAthleteIdsForExpress(users.filter(u => u.role === 'athlete').map(a => a.id))}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold border border-neutral-700 transition-all active:scale-95"
                    >
                      ✓ Todos los Alumnos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAthleteIdsForExpress([])}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[11px] border border-neutral-700 transition-all active:scale-95"
                    >
                      ✕ Ninguno
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAthleteIdsForExpress(prev => 
                          prev.includes(activeStaff.id) ? prev.filter(id => id !== activeStaff.id) : [...prev, activeStaff.id]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 ${
                        selectedAthleteIdsForExpress.includes(activeStaff.id)
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      ⭐ {selectedAthleteIdsForExpress.includes(activeStaff.id) ? 'Quitarme a mí' : `Incluirme a mí (${activeStaff.name.split(' ')[0]})`}
                    </button>
                    {[5, 15, 20, 30].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const groupIds = users.filter(u => u.role === 'athlete' && (u.membership?.billingDayOfMonth || 15) === day).map(a => a.id);
                          setSelectedAthleteIdsForExpress(groupIds);
                        }}
                        className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-mono border border-neutral-800 transition-all"
                      >
                        Corte {day}
                      </button>
                    ))}
                  </div>

                  {/* Lista de Checkboxes interactivos de Atletas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {/* Opción Coach Leslie si pasa el filtro */}
                    {(!expressSearchTerm || activeStaff.name.toLowerCase().includes(expressSearchTerm.toLowerCase())) && (
                      <div
                        onClick={() => {
                          setSelectedAthleteIdsForExpress(prev =>
                            prev.includes(activeStaff.id) ? prev.filter(id => id !== activeStaff.id) : [...prev, activeStaff.id]
                          );
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          selectedAthleteIdsForExpress.includes(activeStaff.id)
                            ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/40'
                            : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={selectedAthleteIdsForExpress.includes(activeStaff.id)}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 cursor-pointer"
                          />
                          <UserAvatar name={activeStaff.name} role="staff" sizeClassName="w-6 h-6" />
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold block truncate text-amber-300">⭐ {activeStaff.name}</span>
                            <span className="text-[10px] text-neutral-400 block font-mono">Coach / Dueña (Mi Perfil)</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          selectedAthleteIdsForExpress.includes(activeStaff.id) ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500'
                        }`}>
                          {selectedAthleteIdsForExpress.includes(activeStaff.id) ? '✓ Elegido' : '+ Elegir'}
                        </span>
                      </div>
                    )}

                    {/* Alumnos filtrados */}
                    {users
                      .filter(u => u.role === 'athlete')
                      .filter(u => !expressSearchTerm || u.name.toLowerCase().includes(expressSearchTerm.toLowerCase()))
                      .map((ath) => {
                        const isSelected = selectedAthleteIdsForExpress.includes(ath.id);
                        return (
                          <div
                            key={ath.id}
                            onClick={() => {
                              setSelectedAthleteIdsForExpress(prev =>
                                isSelected ? prev.filter(id => id !== ath.id) : [...prev, ath.id]
                              );
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/40'
                                : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 cursor-pointer"
                              />
                              <UserAvatar name={ath.name} avatarUrl={ath.avatarUrl} role="athlete" sizeClassName="w-6 h-6" />
                              <div className="overflow-hidden">
                                <span className="text-xs font-bold block truncate text-white">{ath.name}</span>
                                <span className="text-[10px] text-neutral-400 block font-mono">Corte Día {ath.membership?.billingDayOfMonth || 15}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500'
                            }`}>
                              {isSelected ? '✓ Elegido' : '+ Elegir'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 2. PESO COMÚN DE LA ESTACIÓN (BARRA RÁPIDA) */}
                {selectedAthleteIdsForExpress.length > 0 && (
                  <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-neutral-300 font-medium">Peso en la Barra / Máquina:</span>
                      <input
                        type="number"
                        value={commonBatchWeight}
                        onChange={(e) => setCommonBatchWeight(Number(e.target.value))}
                        className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center font-bold"
                      />
                      <span className="text-xs text-neutral-400">kg</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...expressAthleteInputs };
                        selectedAthleteIdsForExpress.forEach(id => {
                          updated[id] = {
                            ...(updated[id] || { reps: 1, status: 'completed', statusReason: '' }),
                            weightKg: commonBatchWeight,
                            status: 'completed',
                          };
                        });
                        setExpressAthleteInputs(updated);
                        setExpressSaveSuccessMsg(`¡${commonBatchWeight} kg aplicado a todos los ${selectedAthleteIdsForExpress.length} atletas seleccionados!`);
                        setTimeout(() => setExpressSaveSuccessMsg(null), 2500);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Copiar a los {selectedAthleteIdsForExpress.length} seleccionados</span>
                    </button>
                  </div>
                )}

                {/* 3. CARGA DE MARCAS SOLO PARA LOS ATLETAS SELECCIONADOS */}
                {selectedAthleteIdsForExpress.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-neutral-950/60 border border-dashed border-neutral-800 text-center space-y-2">
                    <Users className="w-8 h-8 text-neutral-500 mx-auto" />
                    <span className="text-xs font-semibold text-neutral-300 block">
                      No has seleccionado atletas para evaluar
                    </span>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                      Toca los nombres o checkboxes de arriba para elegir quiénes están realizando la prueba en esta estación.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[activeStaff, ...users.filter(u => u.role === 'athlete')]
                      .filter(u => selectedAthleteIdsForExpress.includes(u.id))
                      .map((ath) => {
                        const isCoach = ath.id === activeStaff.id;
                        const currentInput = expressAthleteInputs[ath.id] || {
                          weightKg: 60,
                          reps: 1,
                          status: 'completed',
                          statusReason: ''
                        };

                        return (
                          <div
                            key={ath.id}
                            className={`p-3 rounded-2xl border space-y-2 ${
                              isCoach 
                                ? 'bg-gradient-to-r from-neutral-950 to-blue-950/20 border-blue-500/40' 
                                : 'bg-neutral-950 border-neutral-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAthleteIdsForExpress(prev => prev.filter(id => id !== ath.id))}
                                  className="w-5 h-5 rounded-md bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-red-300 flex items-center justify-center text-xs shrink-0"
                                  title="Quitar de este lote"
                                >
                                  ✕
                                </button>
                                <UserAvatar
                                  name={ath.name}
                                  avatarUrl={ath.avatarUrl}
                                  role={isCoach ? 'staff' : 'athlete'}
                                  sizeClassName="w-7 h-7"
                                />
                                <div className="overflow-hidden">
                                  <strong className="text-xs text-white block truncate">
                                    {isCoach ? `⭐ ${ath.name} (Coach / Dueña)` : ath.name}
                                  </strong>
                                  <span className="text-[10px] text-neutral-400 block font-mono">
                                    {isCoach ? 'Mi Perfil Personal' : `${ath.membership?.planName} · Corte Día ${ath.membership?.billingDayOfMonth || 15}`}
                                  </span>
                                </div>
                              </div>

                              {/* Status Quick Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpressAthleteInputs(prev => ({
                                      ...prev,
                                      [ath.id]: { ...(prev[ath.id] || { weightKg: 60, reps: 1, statusReason: '' }), status: 'completed' }
                                    }));
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                    currentInput.status === 'completed'
                                      ? 'bg-emerald-600 text-white border-emerald-400'
                                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                                  }`}
                                >
                                  ✓ Válido
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpressAthleteInputs(prev => ({
                                      ...prev,
                                      [ath.id]: { ...(prev[ath.id] || { weightKg: 0, reps: 1 }), status: 'na', statusReason: 'Ingreso posterior a fecha de pruebas' }
                                    }));
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                    currentInput.status === 'na'
                                      ? 'bg-blue-600 text-white border-blue-400'
                                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                                  }`}
                                >
                                  NA
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpressAthleteInputs(prev => ({
                                      ...prev,
                                      [ath.id]: { ...(prev[ath.id] || { weightKg: 0, reps: 1 }), status: 'np', statusReason: 'No presentada' }
                                    }));
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                    currentInput.status === 'np'
                                      ? 'bg-red-600 text-white border-red-400'
                                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                                  }`}
                                >
                                  NP
                                </button>
                              </div>
                            </div>

                            {/* Inputs Row */}
                            {currentInput.status === 'completed' ? (
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-900 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-neutral-400">Peso:</span>
                                  <input
                                    type="number"
                                    value={currentInput.weightKg}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setExpressAthleteInputs(prev => ({
                                        ...prev,
                                        [ath.id]: { ...(prev[ath.id] || { reps: 1, status: 'completed', statusReason: '' }), weightKg: val }
                                      }));
                                    }}
                                    className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center font-bold"
                                  />
                                  <span className="text-neutral-400 text-[11px]">kg</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-neutral-400">Reps:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={currentInput.reps}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setExpressAthleteInputs(prev => ({
                                        ...prev,
                                        [ath.id]: { ...(prev[ath.id] || { weightKg: 60, status: 'completed', statusReason: '' }), reps: val }
                                      }));
                                    }}
                                    className="w-12 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center font-bold"
                                  />
                                </div>

                                <div className="text-[11px] font-mono font-bold text-amber-400">
                                  1RM: {calculate1RM(currentInput.weightKg, currentInput.reps)} kg
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pt-1 border-t border-neutral-900 text-xs">
                                <span className="text-[11px] text-blue-400">Motivo:</span>
                                <input
                                  type="text"
                                  value={currentInput.statusReason}
                                  onChange={(e) => {
                                    const reason = e.target.value;
                                    setExpressAthleteInputs(prev => ({
                                      ...prev,
                                      [ath.id]: { ...(prev[ath.id] || { weightKg: 0, reps: 1, status: currentInput.status }), statusReason: reason }
                                    }));
                                  }}
                                  placeholder="Ingreso posterior, niño/adulto mayor, etc."
                                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-white"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Batch Action Submit */}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-3">
                  <div className="text-xs text-neutral-400">
                    Atletas a guardar: <strong className="text-white font-mono">{selectedAthleteIdsForExpress.length}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveExpressRecord(selectedAthleteIdsForExpress)}
                    disabled={selectedAthleteIdsForExpress.length === 0}
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Evaluación ({selectedAthleteIdsForExpress.length} Atletas)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
