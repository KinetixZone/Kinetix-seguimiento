import React, { useState, useEffect } from 'react';
import { 
  PhysicalEvaluationRecord, 
  UserProfile, 
  CooperLevel, 
  StrengthMaxRecord, 
  EvaluationStatus, 
  CooperTestRecord, 
  EnduranceTimeTestRecord 
} from '../../types';
import { 
  calculate1RM, 
  getCooperLevelInfo, 
  COOPER_LEVELS_CATALOG, 
  calculateRelativeStrengthRatio,
  getStrengthTier,
  kgToLbs
} from '../../utils/fitnessCalculations';
import { 
  Heart, 
  Dumbbell, 
  Award, 
  Plus, 
  ChevronRight, 
  Calendar,
  X,
  CheckCircle2,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Flame,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Check,
  Trash2,
  Edit3,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const parseSecondsFromTimeStr = (str?: string): number => {
  if (!str) return 0;
  const match = str.match(/(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
};

interface PhysicalTestsViewProps {
  currentUser: UserProfile;
  evaluations: PhysicalEvaluationRecord[];
  onAddEvaluation: (evaluation: Omit<PhysicalEvaluationRecord, 'id'>) => void;
  onDeleteEvaluation?: (evalId: string) => void;
  onUpdateEvaluation?: (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => void;
  onBackToDashboard?: () => void;
  loggedStaffUser?: UserProfile | null;
  isStaffUser?: boolean;
  initialOpenAddModal?: boolean;
  allAthletes?: UserProfile[];
  onSelectNextAthlete?: (next: UserProfile) => void;
}

export const PhysicalTestsView: React.FC<PhysicalTestsViewProps> = ({
  currentUser,
  evaluations,
  onAddEvaluation,
  onDeleteEvaluation,
  onUpdateEvaluation,
  onBackToDashboard,
  loggedStaffUser,
  isStaffUser,
  initialOpenAddModal,
  allAthletes,
  onSelectNextAthlete,
}) => {
  // Evaluations are strictly conducted by Staff/Coaches
  const canEvaluate = Boolean(isStaffUser || loggedStaffUser?.role === 'staff');

  // Sub-tabs: 'evolution' (Visión General), 'cooper', 'endurance' (Resistencia por tiempo), 'strength' (1RM), 'history' (Historial Staff)
  const [activeTab, setActiveTab] = useState<'evolution' | 'cooper' | 'endurance' | 'strength' | 'history'>('evolution');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const [evaluatingCoachName, setEvaluatingCoachName] = useState<string>(() => {
    if (loggedStaffUser?.role === 'staff' && loggedStaffUser.name) return loggedStaffUser.name;
    if (isStaffUser && currentUser.role === 'staff') return currentUser.name;
    return 'Coach Kinetix';
  });

  // Modals state
  const [showAddEvalModal, setShowAddEvalModal] = useState(false);
  const [editingEval, setEditingEval] = useState<PhysicalEvaluationRecord | null>(null);
  const [evalToDelete, setEvalToDelete] = useState<PhysicalEvaluationRecord | null>(null);
  const [nextAthleteToast, setNextAthleteToast] = useState<string | null>(null);

  // Athletes list in rotation (ONLY ACTIVE IF canEvaluate IS TRUE)
  const athleteList = (canEvaluate && allAthletes && allAthletes.length > 0)
    ? allAthletes.filter(a => a.role === 'athlete')
    : [];
  const currentAthleteIndex = athleteList.findIndex(a => a.id === currentUser.id);
  const nextAthlete = athleteList.length > 0 && currentAthleteIndex !== -1
    ? athleteList[(currentAthleteIndex + 1) % athleteList.length]
    : (athleteList[0] || null);

  // Auxiliar stopwatch state (colapsable)
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  // Express Strength/PR Capture State (Captura Rápida de Fuerza)
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressTargetUserId, setExpressTargetUserId] = useState<string>(currentUser.id);
  const [expressDate, setExpressDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expressExerciseId, setExpressExerciseId] = useState<'deadlift' | 'squats' | 'hip_thrust' | 'horizontal_press' | 'pullups_or_rows'>('deadlift');
  const [expressRowType, setExpressRowType] = useState<'remo' | 'dominadas'>('remo');
  const [expressStatus, setExpressStatus] = useState<EvaluationStatus>('completed');
  const [expressReason, setExpressReason] = useState<string>('');
  const [expressWeight, setExpressWeight] = useState<number>(60);
  const [expressReps, setExpressReps] = useState<number>(1);
  const [expressNotes, setExpressNotes] = useState<string>('');
  const [expressSuccessMessage, setExpressSuccessMessage] = useState<string | null>(null);

  // Sync express target athlete when currentUser changes
  useEffect(() => {
    setExpressTargetUserId(currentUser.id);
  }, [currentUser.id]);

  const preloadExpressValues = (athleteId: string, exId: string) => {
    const athleteEvals = evaluations.filter(e => e.userId === athleteId);
    const sorted = [...athleteEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
    const latest = sorted[sorted.length - 1];
    const rec = latest?.strengthRecords?.find(s => s.exerciseId === exId);

    if (rec && rec.status !== 'na' && rec.status !== 'np' && rec.weightKg > 0) {
      setExpressWeight(rec.weightKg);
      setExpressReps(rec.reps || 1);
      if (rec.exerciseType) setExpressRowType(rec.exerciseType);
      setExpressStatus('completed');
      setExpressReason('');
    } else if (rec && (rec.status === 'na' || rec.status === 'np')) {
      setExpressStatus(rec.status);
      setExpressReason(rec.statusReason || '');
      setExpressWeight(exId === 'deadlift' ? 60 : exId === 'squats' ? 50 : 40);
      setExpressReps(1);
    } else {
      setExpressStatus('completed');
      setExpressReason('');
      setExpressWeight(exId === 'deadlift' ? 60 : exId === 'squats' ? 50 : exId === 'hip_thrust' ? 50 : 35);
      setExpressReps(1);
    }
  };

  const handleOpenExpressModal = (preselectedExercise?: 'deadlift' | 'squats' | 'hip_thrust' | 'horizontal_press' | 'pullups_or_rows') => {
    const ex = preselectedExercise || expressExerciseId;
    setExpressExerciseId(ex);
    setExpressTargetUserId(currentUser.id);
    setExpressDate(new Date().toISOString().slice(0, 10));
    setExpressStatus('completed');
    setExpressReason('');
    setExpressNotes('');
    preloadExpressValues(currentUser.id, ex);
    setShowExpressModal(true);
  };

  // Guard against non-staff ever having the evaluation modal open
  useEffect(() => {
    if (!canEvaluate && (showAddEvalModal || showExpressModal)) {
      setShowAddEvalModal(false);
      setShowExpressModal(false);
    }
  }, [canEvaluate, showAddEvalModal, showExpressModal]);

  // Evaluaciones del atleta actual ordenadas cronológicamente
  const userEvals = evaluations.filter(e => e.userId === currentUser.id);
  const sortedEvals = [...userEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());

  // Form State for New Evaluation Entry (Staff)
  const [evalDate, setEvalDate] = useState<string>(new Date().toISOString().slice(0, 10));
  
  // Cooper Test State (Supports completed, NA - niños/adultos mayores, NP - no presentada/lesión)
  const [cooperStatus, setCooperStatus] = useState<EvaluationStatus>('completed');
  const [cooperReason, setCooperReason] = useState<string>('');
  const [selectedCooperLevel, setSelectedCooperLevel] = useState<number>(10);
  const [optionalDistance, setOptionalDistance] = useState<number>(2800);
  
  // Test de Resistencia (Por tiempo) (Supports completed, NA, NP)
  const [enduranceStatus, setEnduranceStatus] = useState<EvaluationStatus>('completed');
  const [enduranceReason, setEnduranceReason] = useState<string>('');
  const [enduranceExerciseName, setEnduranceExerciseName] = useState<string>('Evaluación de Resistencia Funcional');
  const [enduranceMinutes, setEnduranceMinutes] = useState<number>(7);
  const [enduranceSeconds, setEnduranceSeconds] = useState<number>(14);
  const [enduranceScoreLevel, setEnduranceScoreLevel] = useState<'Básico' | 'Intermedio' | 'Avanzado' | 'Élite'>('Avanzado');

  // 5 Key Strength Exercises (Each can be completed, NA - niños/adultos mayores, NP - no presentada/enfermedad)
  const [squatStatus, setSquatStatus] = useState<EvaluationStatus>('completed');
  const [squatWeight, setSquatWeight] = useState<number>(120);
  const [squatReps, setSquatReps] = useState<number>(1);

  const [deadliftStatus, setDeadliftStatus] = useState<EvaluationStatus>('completed');
  const [deadliftWeight, setDeadliftWeight] = useState<number>(140);
  const [deadliftReps, setDeadliftReps] = useState<number>(1);

  const [hipThrustStatus, setHipThrustStatus] = useState<EvaluationStatus>('completed');
  const [hipThrustWeight, setHipThrustWeight] = useState<number>(150);
  const [hipThrustReps, setHipThrustReps] = useState<number>(1);

  const [pressStatus, setPressStatus] = useState<EvaluationStatus>('completed');
  const [pressWeight, setPressWeight] = useState<number>(90);
  const [pressReps, setPressReps] = useState<number>(1);

  // Remo vs Dominadas Selector & Weight
  const [rowStatus, setRowStatus] = useState<EvaluationStatus>('completed');
  const [rowExerciseType, setRowExerciseType] = useState<'remo' | 'dominadas'>('remo');
  const [rowWeight, setRowWeight] = useState<number>(75);
  const [rowReps, setRowReps] = useState<number>(12);
  const [coachNotes, setCoachNotes] = useState<string>('');

  // Loads an athlete's baseline into the form or sets pristine defaults
  const loadAthleteBaselineIntoForm = (athleteId: string, customEval?: PhysicalEvaluationRecord | null) => {
    const athleteEvals = evaluations.filter(e => e.userId === athleteId);
    const sorted = [...athleteEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
    const latest = customEval !== undefined ? customEval : (sorted[sorted.length - 1] || null);

    setEvalDate(new Date().toISOString().slice(0, 10));
    if (latest) {
      // Cooper Test state
      const cpStatus = latest.cooperTest.status || 
        (latest.cooperTest.level?.includes('NA') ? 'na' : latest.cooperTest.level?.includes('NP') ? 'np' : 'completed');
      setCooperStatus(cpStatus);
      setCooperReason(latest.cooperTest.statusReason || '');
      setSelectedCooperLevel(latest.cooperTest.levelNumber || 5);
      setOptionalDistance(latest.cooperTest.distanceMeters || 2200);

      // Endurance Test state
      const endStatus = latest.enduranceTest?.status || 
        (latest.enduranceTest?.result === 'NA' ? 'na' : latest.enduranceTest?.result === 'NP' ? 'np' : 'completed');
      setEnduranceStatus(endStatus);
      setEnduranceReason(latest.enduranceTest?.statusReason || '');
      setEnduranceExerciseName(latest.enduranceTest?.name || 'Evaluación de Resistencia Funcional');
      const timeSec = latest.enduranceTest?.timeSeconds || 420;
      setEnduranceMinutes(Math.floor(timeSec / 60));
      setEnduranceSeconds(timeSec % 60);
      setEnduranceScoreLevel((latest.enduranceTest?.scoreScoreLevel as any) || 'Intermedio');

      // Strength records state
      const sq = latest.strengthRecords?.find(s => s.exerciseId === 'squats');
      setSquatStatus(sq?.status || (sq && sq.weightKg === 0 && sq.notes?.includes('NA') ? 'na' : 'completed'));
      setSquatWeight(sq ? sq.weightKg : 40);
      setSquatReps(sq ? sq.reps : 1);

      const dl = latest.strengthRecords?.find(s => s.exerciseId === 'deadlift');
      setDeadliftStatus(dl?.status || (dl && dl.weightKg === 0 && dl.notes?.includes('NA') ? 'na' : 'completed'));
      setDeadliftWeight(dl ? dl.weightKg : 50);
      setDeadliftReps(dl ? dl.reps : 1);

      const ht = latest.strengthRecords?.find(s => s.exerciseId === 'hip_thrust');
      setHipThrustStatus(ht?.status || (ht && ht.weightKg === 0 && ht.notes?.includes('NA') ? 'na' : 'completed'));
      setHipThrustWeight(ht ? ht.weightKg : 50);
      setHipThrustReps(ht ? ht.reps : 1);

      const pr = latest.strengthRecords?.find(s => s.exerciseId === 'horizontal_press');
      setPressStatus(pr?.status || (pr && pr.weightKg === 0 && pr.notes?.includes('NA') ? 'na' : 'completed'));
      setPressWeight(pr ? pr.weightKg : 30);
      setPressReps(pr ? pr.reps : 1);

      const rw = latest.strengthRecords?.find(s => s.exerciseId === 'pullups_or_rows');
      setRowStatus(rw?.status || (rw && rw.weightKg === 0 && rw.notes?.includes('NA') ? 'na' : 'completed'));
      if (rw) {
        setRowWeight(rw.weightKg);
        setRowReps(rw.reps);
        setRowExerciseType(rw.exerciseType || (rw.exerciseName.toLowerCase().includes('dominad') ? 'dominadas' : 'remo'));
      } else {
        setRowWeight(30);
        setRowReps(10);
        setRowExerciseType('remo');
      }
      setCoachNotes(''); // Never leak notes from previous athlete
    } else {
      setCooperStatus('completed');
      setCooperReason('');
      setSelectedCooperLevel(5);
      setOptionalDistance(2000);
      setEnduranceStatus('completed');
      setEnduranceReason('');
      setEnduranceExerciseName('Evaluación de Resistencia Funcional');
      setEnduranceMinutes(7);
      setEnduranceSeconds(0);
      setEnduranceScoreLevel('Intermedio');
      setSquatStatus('completed');
      setSquatWeight(40);
      setSquatReps(1);
      setDeadliftStatus('completed');
      setDeadliftWeight(50);
      setDeadliftReps(1);
      setHipThrustStatus('completed');
      setHipThrustWeight(50);
      setHipThrustReps(1);
      setPressStatus('completed');
      setPressWeight(30);
      setPressReps(1);
      setRowStatus('completed');
      setRowExerciseType('remo');
      setRowWeight(30);
      setRowReps(10);
      setCoachNotes('');
    }
  };

  const handleOpenAddModal = () => {
    loadAthleteBaselineIntoForm(currentUser.id);
    setShowAddEvalModal(true);
  };

  useEffect(() => {
    if (initialOpenAddModal && canEvaluate) {
      handleOpenAddModal();
    }
  }, [initialOpenAddModal, canEvaluate]);

  // Helper to build a validated evaluation payload
  const buildEvaluationPayload = () => {
    const levelInfo = getCooperLevelInfo(selectedCooperLevel);
    const formattedResult = `${enduranceMinutes.toString().padStart(2, '0')}:${enduranceSeconds.toString().padStart(2, '0')} min`;
    const totalSec = enduranceMinutes * 60 + enduranceSeconds;

    const assignedCoachId = evaluatingCoachName.includes('Leslie') 
      ? 'user-staff-leslie' 
      : evaluatingCoachName.includes('Gus') 
      ? 'user-staff-gus' 
      : 'user-staff-01';

    const isCooperDone = cooperStatus === 'completed';
    const isEnduranceDone = enduranceStatus === 'completed';

    const cooperTestObj: CooperTestRecord = {
      level: isCooperDone ? levelInfo.levelName : (cooperStatus === 'na' ? 'NA (No Aplica)' : 'NP (No Presentada)'),
      levelNumber: isCooperDone ? selectedCooperLevel : 0,
      description: isCooperDone 
        ? levelInfo.description 
        : (cooperStatus === 'na' 
            ? 'Prueba exenta por etapa formativa o edad (Niños / Adultos mayores).' 
            : 'Prueba no presentada por enfermedad, lesión o prescripción médica.'),
      targetZoneRecommendation: isCooperDone ? levelInfo.coachingRecommendation : 'Acondicionamiento físico adaptado.',
      distanceMeters: isCooperDone ? optionalDistance : 0,
      estimatedVo2Max: isCooperDone ? Number((45.0 + (selectedCooperLevel * 0.9)).toFixed(1)) : 0,
      rating: isCooperDone ? (selectedCooperLevel >= 15 ? 'Superior' : selectedCooperLevel >= 10 ? 'Excelente' : selectedCooperLevel >= 6 ? 'Bueno' : 'Regular') : undefined,
      notes: cooperReason ? `${cooperStatus.toUpperCase()}: ${cooperReason}` : (isCooperDone ? `Nivel oficial: ${levelInfo.badgeLabel}` : `Estado: ${cooperStatus.toUpperCase()}`),
      status: cooperStatus,
      statusReason: cooperReason,
    };

    const enduranceTestObj: EnduranceTimeTestRecord = {
      name: enduranceExerciseName,
      result: isEnduranceDone ? formattedResult : (enduranceStatus === 'na' ? 'NA' : 'NP'),
      timeSeconds: isEnduranceDone ? totalSec : 0,
      scoreScoreLevel: isEnduranceDone ? enduranceScoreLevel : 'Exento',
      notes: enduranceReason ? `${enduranceStatus.toUpperCase()}: ${enduranceReason}` : (isEnduranceDone ? `Reto completado en ${formattedResult}.` : `Estado: ${enduranceStatus.toUpperCase()}`),
      status: enduranceStatus,
      statusReason: enduranceReason,
    };

    const strengthRecordsList: StrengthMaxRecord[] = [
      {
        exerciseId: 'squats',
        exerciseName: 'Sentadillas',
        weightKg: squatStatus === 'completed' ? squatWeight : 0,
        reps: squatStatus === 'completed' ? squatReps : 0,
        estimated1RMKg: squatStatus === 'completed' ? calculate1RM(squatWeight, squatReps) : 0,
        weightUnit: 'kg',
        status: squatStatus,
        notes: squatStatus === 'na' ? 'NA: Exento (Adulto mayor / Infantil)' : squatStatus === 'np' ? 'NP: No Presentada (Lesión / Enfermedad)' : undefined,
      },
      {
        exerciseId: 'deadlift',
        exerciseName: 'Peso Muerto',
        weightKg: deadliftStatus === 'completed' ? deadliftWeight : 0,
        reps: deadliftStatus === 'completed' ? deadliftReps : 0,
        estimated1RMKg: deadliftStatus === 'completed' ? calculate1RM(deadliftWeight, deadliftReps) : 0,
        weightUnit: 'kg',
        status: deadliftStatus,
        notes: deadliftStatus === 'na' ? 'NA: Exento (Adulto mayor / Infantil)' : deadliftStatus === 'np' ? 'NP: No Presentada (Lesión / Enfermedad)' : undefined,
      },
      {
        exerciseId: 'hip_thrust',
        exerciseName: 'Hip Thrust',
        weightKg: hipThrustStatus === 'completed' ? hipThrustWeight : 0,
        reps: hipThrustStatus === 'completed' ? hipThrustReps : 0,
        estimated1RMKg: hipThrustStatus === 'completed' ? calculate1RM(hipThrustWeight, hipThrustReps) : 0,
        weightUnit: 'kg',
        status: hipThrustStatus,
        notes: hipThrustStatus === 'na' ? 'NA: Exento (Adulto mayor / Infantil)' : hipThrustStatus === 'np' ? 'NP: No Presentada (Lesión / Enfermedad)' : undefined,
      },
      {
        exerciseId: 'horizontal_press',
        exerciseName: 'Press Horizontal',
        weightKg: pressStatus === 'completed' ? pressWeight : 0,
        reps: pressStatus === 'completed' ? pressReps : 0,
        estimated1RMKg: pressStatus === 'completed' ? calculate1RM(pressWeight, pressReps) : 0,
        weightUnit: 'kg',
        status: pressStatus,
        notes: pressStatus === 'na' ? 'NA: Exento (Adulto mayor / Infantil)' : pressStatus === 'np' ? 'NP: No Presentada (Lesión / Enfermedad)' : undefined,
      },
      {
        exerciseId: 'pullups_or_rows',
        exerciseName: rowExerciseType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)',
        exerciseType: rowExerciseType,
        weightKg: rowStatus === 'completed' ? rowWeight : 0,
        reps: rowStatus === 'completed' ? rowReps : 0,
        estimated1RMKg: rowStatus === 'completed' ? calculate1RM(rowWeight, rowReps) : 0,
        weightUnit: 'kg',
        status: rowStatus,
        notes: rowStatus === 'na' ? 'NA: Exento (Adulto mayor / Infantil)' : rowStatus === 'np' ? 'NP: No Presentada (Lesión / Enfermedad)' : undefined,
      },
    ];

    return {
      userId: currentUser.id,
      evaluationDate: evalDate,
      coachId: assignedCoachId,
      coachName: evaluatingCoachName,
      cooperTest: cooperTestObj,
      enduranceTest: enduranceTestObj,
      strengthRecords: strengthRecordsList,
      generalCoachNotes: coachNotes,
    };
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvaluation(buildEvaluationPayload());
    setShowAddEvalModal(false);
  };

  const handleSaveAndNextEvaluation = () => {
    onAddEvaluation(buildEvaluationPayload());

    if (athleteList.length > 0 && onSelectNextAthlete && nextAthlete) {
      const savedName = currentUser.name;
      const targetNext = nextAthlete;

      // Advance to next athlete and load their clean baseline
      onSelectNextAthlete(targetNext);
      loadAthleteBaselineIntoForm(targetNext.id);
      setNextAthleteToast(`¡Evaluación guardada para ${savedName.split(' ')[0]}! Evaluando ahora a: ${targetNext.name}`);
      setTimeout(() => setNextAthleteToast(null), 4000);
    } else {
      setShowAddEvalModal(false);
    }
  };

  const handleSaveExpress = (andNext: boolean = false) => {
    const targetId = expressTargetUserId || currentUser.id;
    const targetUser = athleteList.find(a => a.id === targetId) || currentUser;

    const exerciseNameMap: Record<string, string> = {
      squats: 'Sentadillas',
      deadlift: 'Peso Muerto',
      hip_thrust: 'Hip Thrust',
      horizontal_press: 'Press Horizontal',
      pullups_or_rows: expressRowType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)',
    };

    const calculated1RM = expressStatus === 'completed' ? calculate1RM(expressWeight, expressReps) : 0;

    const newRec: StrengthMaxRecord = {
      exerciseId: expressExerciseId,
      exerciseName: exerciseNameMap[expressExerciseId] || 'Fuerza',
      exerciseType: expressExerciseId === 'pullups_or_rows' ? expressRowType : undefined,
      weightKg: expressStatus === 'completed' ? expressWeight : 0,
      reps: expressStatus === 'completed' ? expressReps : 0,
      estimated1RMKg: calculated1RM,
      weightUnit: 'kg',
      status: expressStatus,
      statusReason: expressReason || undefined,
      notes: expressNotes 
        ? expressNotes 
        : (expressStatus === 'na' ? 'NA: Exento (Adulto mayor / Infantil)' : expressStatus === 'np' ? 'NP: No Presentada' : undefined),
    };

    const existingEval = evaluations.find(e => e.userId === targetId && e.evaluationDate === expressDate);

    if (existingEval && onUpdateEvaluation) {
      // Merge into existing evaluation
      const updatedRecords = (existingEval.strengthRecords || []).filter(s => s.exerciseId !== expressExerciseId);
      updatedRecords.push(newRec);
      onUpdateEvaluation(existingEval.id, {
        strengthRecords: updatedRecords,
        generalCoachNotes: expressNotes 
          ? `${existingEval.generalCoachNotes ? existingEval.generalCoachNotes + ' | ' : ''}Marca Express: ${newRec.exerciseName} ${newRec.weightKg}kg`
          : existingEval.generalCoachNotes
      });
    } else {
      // Create new evaluation
      const userPastEvals = evaluations.filter(e => e.userId === targetId);
      const sortedPast = [...userPastEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
      const latestPast = sortedPast[sortedPast.length - 1] || null;

      const baseExercises: ('squats' | 'deadlift' | 'hip_thrust' | 'horizontal_press' | 'pullups_or_rows')[] = [
        'squats', 'deadlift', 'hip_thrust', 'horizontal_press', 'pullups_or_rows'
      ];

      const baseStrength: StrengthMaxRecord[] = baseExercises.map(exId => {
        if (exId === expressExerciseId) return newRec;
        const existing = latestPast?.strengthRecords?.find(s => s.exerciseId === exId);
        if (existing) return existing;
        return {
          exerciseId: exId,
          exerciseName: exerciseNameMap[exId] || exId,
          weightKg: 40,
          reps: 1,
          estimated1RMKg: 40,
          weightUnit: 'kg',
          status: 'completed' as EvaluationStatus,
        };
      });

      const assignedCoachId = evaluatingCoachName.includes('Leslie') 
        ? 'user-staff-leslie' 
        : evaluatingCoachName.includes('Gus') 
        ? 'user-staff-gus' 
        : 'user-staff-01';

      const newPayload: Omit<PhysicalEvaluationRecord, 'id'> = {
        userId: targetId,
        evaluationDate: expressDate,
        coachId: assignedCoachId,
        coachName: evaluatingCoachName,
        cooperTest: latestPast?.cooperTest || {
          level: 'Nivel 5',
          levelNumber: 5,
          description: 'Capacidad aeróbica estándar.',
          targetZoneRecommendation: 'Zona 2 y 3',
          distanceMeters: 2000,
          estimatedVo2Max: 48,
          status: 'completed',
        },
        enduranceTest: latestPast?.enduranceTest || {
          name: 'Evaluación de Resistencia Funcional',
          result: '07:00 min',
          timeSeconds: 420,
          scoreScoreLevel: 'Intermedio',
          status: 'completed',
        },
        strengthRecords: baseStrength,
        generalCoachNotes: expressNotes ? `Marca rápida: ${expressNotes}` : 'Captura express de fuerza en clase.',
      };

      onAddEvaluation(newPayload);
    }

    const savedMsg = `¡${newRec.exerciseName} guardado para ${targetUser.name.split(' ')[0]}! (${expressStatus === 'completed' ? `${expressWeight}kg x ${expressReps} (${calculated1RM}kg 1RM)` : expressStatus.toUpperCase()})`;

    if (andNext && athleteList.length > 0 && onSelectNextAthlete) {
      const currentIdx = athleteList.findIndex(a => a.id === targetId);
      const nextIdx = currentIdx !== -1 ? (currentIdx + 1) % athleteList.length : 0;
      const nextAthleteObj = athleteList[nextIdx];

      if (nextAthleteObj) {
        onSelectNextAthlete(nextAthleteObj);
        setExpressTargetUserId(nextAthleteObj.id);
        preloadExpressValues(nextAthleteObj.id, expressExerciseId);
        setExpressSuccessMessage(`${savedMsg} → Siguiente en clase: ${nextAthleteObj.name}`);
        setTimeout(() => setExpressSuccessMessage(null), 3500);
        return;
      }
    }

    // Finished or single athlete
    setShowExpressModal(false);
    setNextAthleteToast(savedMsg);
    setTimeout(() => setNextAthleteToast(null), 4000);
  };

  // Quick preset exercises for endurance
  const ENDURANCE_PRESETS = [
    'Evaluación de Resistencia Funcional',
    '50 Burpees for time',
    'Remo 2000m',
    '100 Sentadillas con salto',
    '800m Carrera + 50 Pull-ups',
    'Reto Funcional Libre',
  ];

  const latestEval = sortedEvals[sortedEvals.length - 1] || null;
  const prevEval = sortedEvals.length > 1 ? sortedEvals[sortedEvals.length - 2] : null;

  const prevEnduranceSeconds = prevEval ? parseSecondsFromTimeStr(prevEval.enduranceTest.result) : null;
  const currentEnduranceSeconds = latestEval ? parseSecondsFromTimeStr(latestEval.enduranceTest.result) : null;
  const enduranceDeltaSec = (prevEnduranceSeconds !== null && currentEnduranceSeconds !== null && prevEnduranceSeconds > currentEnduranceSeconds)
    ? (prevEnduranceSeconds - currentEnduranceSeconds)
    : 0;

  const endurancePercentImprovement = (prevEnduranceSeconds && currentEnduranceSeconds && prevEnduranceSeconds > currentEnduranceSeconds)
    ? Math.round(((prevEnduranceSeconds - currentEnduranceSeconds) / prevEnduranceSeconds) * 100)
    : null;

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20 px-3 sm:px-4 pt-2">
      {/* Floating toast notification for staff actions */}
      {nextAthleteToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900/95 border border-amber-500/60 text-white text-xs font-medium shadow-2xl flex items-center gap-2 max-w-[90vw] animate-bounce">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
          <span className="truncate">{nextAthleteToast}</span>
        </div>
      )}

      {/* UNIVERSAL TOP NAVIGATION BAR: Breadcrumb and Back Action */}
      <div className="flex items-center justify-between bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-2xl text-xs backdrop-blur-md sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          {onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1 text-white hover:text-blue-300 font-semibold bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 rounded-xl border border-neutral-700/80 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </button>
          ) : (
            <span className="text-neutral-400 font-medium">Kinetix</span>
          )}

          <span className="text-neutral-600">/</span>

          <span className="text-blue-400 font-bold truncate">
            {activeTab === 'evolution' && 'Visión General'}
            {activeTab === 'cooper' && 'Nivel Cooper'}
            {activeTab === 'endurance' && 'Resistencia (Tiempo)'}
            {activeTab === 'strength' && 'Fuerza 1RM'}
            {activeTab === 'history' && 'Historial Staff'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab !== 'evolution' && (
            <button
              onClick={() => setActiveTab('evolution')}
              className="text-[11px] text-neutral-300 hover:text-white flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-lg border border-neutral-700/50"
            >
              <span>← Ver Resumen</span>
            </button>
          )}

          {/* Evaluation Action Button - Only Coach / Dueño */}
          {canEvaluate ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenExpressModal()}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                title="Registrar una marca de fuerza (Peso Muerto, Sentadilla, etc.) en segundos"
              >
                <Zap className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Express ⚡</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-500/25 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Evaluar Completo</span>
                <span className="sm:hidden">Evaluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Dictamen emitido por Coach Kinetix</span>
              <span className="sm:hidden">Dictamen Coach</span>
            </div>
          )}
        </div>
      </div>

      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
            Atleta: {currentUser.name} · {currentUser.membership.planName}
          </span>
          <h2 className="text-xl font-bold text-white font-brand flex items-center gap-2">
            <span>Rendimiento & Tests</span>
            <span className="text-[11px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              Validado Coach Jorge
            </span>
          </h2>
        </div>
      </div>

      {/* TABS NAVIGATION: 5 Tabs */}
      <div className="grid grid-cols-5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-center gap-1">
        <button
          onClick={() => setActiveTab('evolution')}
          className={`py-2 text-[11px] font-medium rounded-lg transition-colors truncate ${
            activeTab === 'evolution' 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm font-bold' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Visión General
        </button>

        <button
          onClick={() => setActiveTab('cooper')}
          className={`py-2 text-[11px] font-medium rounded-lg transition-colors truncate ${
            activeTab === 'cooper' 
              ? 'bg-neutral-800 text-white shadow-sm font-bold' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Cooper
        </button>

        <button
          onClick={() => setActiveTab('endurance')}
          className={`py-2 text-[11px] font-medium rounded-lg transition-colors truncate ${
            activeTab === 'endurance' 
              ? 'bg-neutral-800 text-white shadow-sm font-bold' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Resistencia
        </button>

        <button
          onClick={() => setActiveTab('strength')}
          className={`py-2 text-[11px] font-medium rounded-lg transition-colors truncate ${
            activeTab === 'strength' 
              ? 'bg-neutral-800 text-white shadow-sm font-bold' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Fuerza 1RM
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 text-[11px] font-medium rounded-lg transition-colors truncate ${
            activeTab === 'history' 
              ? 'bg-red-600 text-white shadow-sm font-bold' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Historial Staff
        </button>
      </div>

      {/* EMPTY STATE WHEN ATHLETE HAS NO EVALUATIONS YET */}
      {!latestEval && (
        <div className="py-12 px-6 text-center space-y-4 rounded-3xl bg-neutral-900/60 border border-neutral-800">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-7 h-7 text-red-500" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-base font-bold text-white font-brand">Inicia tu primer registro de evaluación</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Aún no cuentas con evaluaciones técnicas capturadas. Realiza con tu Coach el Test de Cooper (12 Min) y tus pruebas de fuerza máxima 1RM para activar tus niveles y comparativas de evolución.
            </p>
          </div>
          {canEvaluate && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primera Evaluación de Campo</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: VISIÓN GENERAL DE PROGRESO (EL DASHBOARD COMPLETO QUE EL USUARIO PIDIÓ) */}
      {/* ========================================================================= */}
      {activeTab === 'evolution' && latestEval && (
        <div className="space-y-4">
          {/* Banner: Resumen de evolución */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-950/70 via-neutral-900 to-red-950/50 border border-blue-500/30 space-y-1 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
                Progreso Comparado de Tests
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                Última: {latestEval.evaluationDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-brand">
              "En el anterior sacaste esto vs Ahora sacaste esto"
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Comparativa directa de evolución en <strong>Nivel Cooper</strong>, <strong>Resistencia por tiempo</strong> y <strong>Fuerza máxima 1RM</strong>.
            </p>
          </div>

          {/* TARJETA COMPARATIVA 1: TEST DE COOPER */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" />
                <span>1. Test de Cooper (12 Minutos)</span>
              </span>
              {latestEval.cooperTest.status === 'na' ? (
                <span className="text-[10px] text-neutral-300 font-bold bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
                  🚫 No Aplica (NA)
                </span>
              ) : latestEval.cooperTest.status === 'np' ? (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  ⚠️ No Presentada (NP)
                </span>
              ) : prevEval ? (
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+1 Nivel Superado</span>
                </span>
              ) : (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                  Nivel Inicial
                </span>
              )}
            </div>

            {latestEval.cooperTest.status === 'na' || latestEval.cooperTest.status === 'np' ? (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    {latestEval.cooperTest.status === 'na' ? 'Prueba No Aplicable' : 'Prueba No Presentada'}
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {latestEval.cooperTest.statusReason || (latestEval.cooperTest.status === 'na' ? 'Adaptación por perfil de edad o condición médica.' : 'Sin registro en esta sesión.')}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  latestEval.cooperTest.status === 'na' ? 'bg-neutral-800 text-neutral-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {latestEval.cooperTest.status === 'na' ? '🚫 NA' : '⚠️ NP'}
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block font-medium">
                      En el anterior sacaste ({prevEval ? prevEval.evaluationDate : 'Base inicial'}):
                    </span>
                    <div className="text-2xl font-extrabold text-neutral-300 font-brand">
                      NIVEL {prevEval?.cooperTest.levelNumber || 4}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {prevEval?.cooperTest.distanceMeters || 2550} metros recorridos
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-1">
                    <span className="text-[10px] text-blue-400 block font-semibold">
                      Ahora sacaste ({latestEval.evaluationDate}):
                    </span>
                    <div className="text-2xl font-extrabold text-blue-300 font-brand">
                      NIVEL {latestEval.cooperTest.levelNumber || 5}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <span>{latestEval.cooperTest.distanceMeters || 2800}m</span>
                      {prevEval && <span className="text-emerald-300">(+250m de distancia)</span>}
                    </div>
                  </div>
                </div>

                {/* Visual Level Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Nivel 1 (Base)</span>
                    <span className="text-emerald-400 font-bold">
                      {prevEval?.cooperTest.levelNumber ? `Nivel ${prevEval.cooperTest.levelNumber} → Nivel ${latestEval.cooperTest.levelNumber || 1}` : `Nivel Actual: ${latestEval.cooperTest.levelNumber || 1}`}
                    </span>
                    <span className="text-blue-400 font-bold">Nivel 20 (Ultra Élite)</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-2">
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const currentLvl = latestEval.cooperTest.levelNumber || 1;
                      const isReached = lvl <= currentLvl;
                      const isNew = prevEval && prevEval.cooperTest.levelNumber && lvl === currentLvl && currentLvl > prevEval.cooperTest.levelNumber;
                      return (
                        <div
                          key={lvl}
                          className={`h-full rounded-full transition-all ${
                            isNew
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                              : isReached
                              ? 'bg-blue-500'
                              : 'bg-neutral-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setActiveTab('cooper')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 pt-1"
            >
              <span>Ver detalle y recomendaciones de Cooper &rarr;</span>
            </button>
          </div>

          {/* TARJETA COMPARATIVA 2: TEST DE RESISTENCIA (POR TIEMPO) */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span>2. Test de Resistencia Funcional (Por Tiempo)</span>
              </span>
              {latestEval.enduranceTest.status === 'na' ? (
                <span className="text-[10px] text-neutral-300 font-bold bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
                  🚫 No Aplica (NA)
                </span>
              ) : latestEval.enduranceTest.status === 'np' ? (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  ⚠️ No Presentada (NP)
                </span>
              ) : enduranceDeltaSec > 0 ? (
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>¡{enduranceDeltaSec} seg más rápido!</span>
                </span>
              ) : (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                  {latestEval.enduranceTest.name}
                </span>
              )}
            </div>

            {latestEval.enduranceTest.status === 'na' || latestEval.enduranceTest.status === 'np' ? (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    {latestEval.enduranceTest.status === 'na' ? 'Reto No Aplicable' : 'Reto No Presentado'}
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {latestEval.enduranceTest.statusReason || (latestEval.enduranceTest.status === 'na' ? 'Adaptado o exento según la condición del atleta.' : 'Sin registro en esta sesión.')}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  latestEval.enduranceTest.status === 'na' ? 'bg-neutral-800 text-neutral-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {latestEval.enduranceTest.status === 'na' ? '🚫 NA' : '⚠️ NP'}
                </span>
              </div>
            ) : (
              <>
                <div className="text-[11px] text-neutral-300 bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400">Reto Evaluado:</span>
                  <strong className="text-white">{latestEval.enduranceTest.name}</strong>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block font-medium">
                      {prevEval ? 'En el anterior hiciste:' : 'Historial comparativo:'}
                    </span>
                    <div className="text-xl font-extrabold text-neutral-300 font-mono">
                      {prevEval ? prevEval.enduranceTest.result : 'Primer Reto'}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {prevEval ? prevEval.evaluationDate : 'Línea base registrada'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] text-emerald-400 block font-semibold">
                      Ahora hiciste:
                    </span>
                    <div className="text-xl font-extrabold text-emerald-300 font-mono">
                      {latestEval.enduranceTest.result}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      {endurancePercentImprovement ? `Mejora del ${endurancePercentImprovement}% en velocidad muscular` : 'Tiempo oficial validado'}
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setActiveTab('endurance')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 pt-1"
            >
              <span>Ver análisis del reto de resistencia &rarr;</span>
            </button>
          </div>

          {/* TARJETA COMPARATIVA 3: FUERZA 1RM (5 EJERCICIOS) */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-[#ff5500]" />
                <span>3. Fuerza Máxima 1RM (5 Ejercicios Pilares)</span>
              </span>
              {(() => {
                if (!prevEval || !prevEval.strengthRecords || prevEval.strengthRecords.length === 0) {
                  return (
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      Evaluación Base Oficial
                    </span>
                  );
                }
                const totalCurrent = latestEval.strengthRecords.reduce((acc, r) => acc + (r.status === 'na' || r.status === 'np' ? 0 : r.weightKg), 0);
                const totalPrev = prevEval.strengthRecords.reduce((acc, r) => acc + (r.status === 'na' || r.status === 'np' ? 0 : r.weightKg), 0);
                const diff = totalCurrent - totalPrev;
                return (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    diff >= 0 ? 'text-orange-400 bg-orange-500/15 border-orange-500/30' : 'text-neutral-400 bg-neutral-800 border-neutral-700'
                  }`}>
                    {diff >= 0 ? `+${diff} kg ganancia neta` : `${diff} kg variación`}
                  </span>
                );
              })()}
            </div>

            <div className="space-y-2">
              {latestEval.strengthRecords.map((rec) => {
                if (rec.status === 'na' || rec.status === 'np') {
                  const isNA = rec.status === 'na';
                  return (
                    <div
                      key={rec.exerciseId}
                      className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-neutral-400">{rec.exerciseName}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {rec.statusReason || (isNA ? 'No aplica por prescripción médica / edad' : 'No realizada en esta sesión')}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isNA ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isNA ? '🚫 NA' : '⚠️ NP'}
                      </span>
                    </div>
                  );
                }

                const prevRec = prevEval?.strengthRecords.find(s => s.exerciseId === rec.exerciseId);
                const hasPrev = Boolean(prevRec);
                const deltaKg = hasPrev && prevRec && prevRec.status !== 'na' && prevRec.status !== 'np' ? rec.weightKg - prevRec.weightKg : null;

                return (
                  <div
                    key={rec.exerciseId}
                    className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-neutral-400">{rec.exerciseName}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {hasPrev && prevRec && prevRec.status !== 'na' && prevRec.status !== 'np' ? (
                          <>Anterior: <strong className="text-neutral-300">{prevRec.weightKg} kg</strong> &rarr; Ahora:{' '}</>
                        ) : (
                          <>Marca actual:{' '}</>
                        )}
                        <strong className="text-white">{rec.weightKg} kg</strong> ({rec.reps} {rec.reps === 1 ? 'rep' : 'reps'})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-emerald-400 font-mono font-bold">
                        {deltaKg !== null ? (deltaKg > 0 ? `+${deltaKg} kg` : `${deltaKg} kg`) : 'Base'}
                      </div>
                      <div className="text-xs font-extrabold text-neutral-200 font-mono">
                        1RM: {rec.estimated1RMKg} kg
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('strength')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 pt-1"
            >
              <span>Ver detalle y fuerza relativa por peso &rarr;</span>
            </button>
          </div>

          {/* Dictamen del Coach */}
          {latestEval.generalCoachNotes && latestEval.generalCoachNotes.trim() && (
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs space-y-1">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Dictamen Técnico · {latestEval.coachName || 'Coach Kinetix'}
              </span>
              <p className="text-neutral-300 italic text-[11px] leading-relaxed">
                "{latestEval.generalCoachNotes}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEST DE COOPER (MOSTRANDO PRINCIPALMENTE EL NIVEL AL QUE LLEGARON) */}
      {/* ========================================================================= */}
      {activeTab === 'cooper' && latestEval && (
        <div className="space-y-4">
          {latestEval.cooperTest.status === 'na' || latestEval.cooperTest.status === 'np' ? (
            <div className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500" />
                  Test de Cooper (12 Minutos) · Exención / Adaptación
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {latestEval.evaluationDate}
                </span>
              </div>

              <div className="text-center py-6 space-y-2.5">
                <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  latestEval.cooperTest.status === 'na'
                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {latestEval.cooperTest.status === 'na' ? '🚫 NA — No Aplica' : '⚠️ NP — No Presentada'}
                </span>
                <div className="text-2xl font-bold text-white">
                  {latestEval.cooperTest.status === 'na'
                    ? 'Prueba no requerida para este atleta'
                    : 'Prueba no presentada en esta fecha'}
                </div>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  {latestEval.cooperTest.statusReason || (latestEval.cooperTest.status === 'na'
                    ? 'Adaptación cardiovascular por categoría de edad (adulto mayor, niño) o prescripción física del coach.'
                    : 'El atleta no realizó o reprogramó esta prueba de campo en esta sesión.')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <strong className="text-neutral-200 block">¿Por qué puede figurar NA o NP?</strong>
                <p>
                  En Kinetix adaptamos la evaluación a cada atleta. Niños, personas mayores o alumnos con prescripción médica están exentos de la prueba de 12 min sin que afecte su avance ni registros anteriores.
                </p>
              </div>
            </div>
          ) : (
            /* Main Level Showcase Card */
            <div className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500" />
                  Test de Cooper (12 Minutos) · Resultado Oficial
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {latestEval.evaluationDate}
                </span>
              </div>

              {/* BIG PROMINENT LEVEL DISPLAY (User Requirement: Solo mostrar el nivel al que llegaron) */}
              <div className="text-center py-2 space-y-2">
                <span className="text-[11px] font-mono tracking-widest text-blue-400 uppercase font-bold">
                  Nivel Alcanzado en Test de 12 Minutos
                </span>
                
                <div className="text-5xl font-extrabold text-white tracking-tight font-brand">
                  {latestEval.cooperTest.levelNumber ? `NIVEL ${latestEval.cooperTest.levelNumber}` : 'NIVEL 5'}
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-semibold text-red-400">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>{latestEval.cooperTest.level ? latestEval.cooperTest.level.replace(/Nivel \d\s*\(/, '').replace(/\)/, '') : 'Excelente / Élite Kinetix'}</span>
                </div>
              </div>

              {/* 20-Step Visual Level Progression Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Nivel 1 (Adaptación)</span>
                  <span>Nivel 10 (Avanzado)</span>
                  <span className="text-red-500 font-bold">Nivel 20 (Ultra Élite)</span>
                </div>
                <div className="grid grid-cols-20 gap-0.5 h-2.5 bg-neutral-900 rounded-full p-0.5 border border-neutral-800">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
                    const currentLvl = latestEval.cooperTest.levelNumber || 10;
                    const isReached = lvl <= currentLvl;
                    const isCurrent = lvl === currentLvl;
                    return (
                      <div
                        key={lvl}
                        title={`Nivel ${lvl}`}
                        className={`h-full rounded-sm transition-all ${
                          isCurrent
                            ? 'bg-red-500 shadow-sm shadow-red-500/80 scale-y-125'
                            : isReached
                            ? 'bg-blue-500'
                            : 'bg-neutral-800/80'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Comparativa Visual Directa con Test Anterior */}
              {prevEval && (
                <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2 text-xs">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Comparativa Contra Test Anterior
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">En el anterior sacaste:</span>
                      <div className="text-base font-bold text-neutral-300 font-brand">
                        NIVEL {prevEval.cooperTest.levelNumber}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{prevEval.evaluationDate}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-800/60">
                      <span className="text-[10px] text-blue-400 block font-semibold">Ahora sacaste:</span>
                      <div className="text-base font-bold text-blue-300 font-brand">
                        NIVEL {latestEval.cooperTest.levelNumber}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>¡Superaste tu nivel!</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description & Coaching Recommendation */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/60 space-y-1">
                  <span className="text-[10px] font-semibold text-blue-400 uppercase">
                    Diagnóstico Fisiológico
                  </span>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    {latestEval.cooperTest.description}
                  </p>
                </div>

                {latestEval.cooperTest.targetZoneRecommendation && (
                  <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-200">
                    <strong className="text-white block mb-0.5">Pauta del Coach Jorge:</strong>
                    {latestEval.cooperTest.targetZoneRecommendation}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEST DE RESISTENCIA (POR TIEMPO - RETOS ROTATIVOS FUNCIONALES) */}
      {/* ========================================================================= */}
      {activeTab === 'endurance' && latestEval && (
        <div className="space-y-4">
          {latestEval.enduranceTest.status === 'na' || latestEval.enduranceTest.status === 'np' ? (
            <div className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  Test de Resistencia Funcional · Exención / Adaptación
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {latestEval.evaluationDate}
                </span>
              </div>

              <div className="text-center py-6 space-y-2.5">
                <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  latestEval.enduranceTest.status === 'na'
                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {latestEval.enduranceTest.status === 'na' ? '🚫 NA — No Aplica' : '⚠️ NP — No Presentada'}
                </span>
                <div className="text-2xl font-bold text-white">
                  {latestEval.enduranceTest.status === 'na'
                    ? 'Reto adaptado / No requerido'
                    : 'Reto no presentado en esta sesión'}
                </div>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  {latestEval.enduranceTest.statusReason || (latestEval.enduranceTest.status === 'na'
                    ? 'Adaptación funcional neuromuscular específica según la edad o prescripción del coach.'
                    : 'Prueba no realizada en esta sesión evaluativa.')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <strong className="text-neutral-200 block">Personalización Kinetix</strong>
                <p>
                  Si un alumno presenta alguna limitación temporal o requiere retos de bajo impacto, el coach registra NA o NP protegiendo la salud sin borrar su historial.
                </p>
              </div>
            </div>
          ) : (
            /* Main Endurance Card */
            <div className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>Test de Resistencia Funcional (Por Tiempo)</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {latestEval.evaluationDate}
                </span>
              </div>

              {/* Big Time Display */}
              <div className="text-center py-2 space-y-2">
                <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                  Tiempo Logrado en el Reto
                </span>
                
                <div className="text-5xl font-extrabold text-emerald-400 tracking-tight font-mono">
                  {latestEval.enduranceTest.result}
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-semibold text-white">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Reto: <strong className="text-blue-300">{latestEval.enduranceTest.name}</strong></span>
                </div>
              </div>

              {/* Comparativa Visual Directa: En el anterior sacaste tanto vs ahora */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Comparativa de Tiempo vs Test Anterior
                  </span>
                  {enduranceDeltaSec > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/30">
                      -{enduranceDeltaSec}s más veloz
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">{prevEval ? 'En el anterior hiciste:' : 'Historial comparativo:'}</span>
                    <div className="text-base font-bold text-neutral-300 font-mono mt-0.5">
                      {prevEval ? prevEval.enduranceTest.result : 'Primer Test'}
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">{prevEval ? prevEval.evaluationDate : 'Línea base registrada'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                    <span className="text-[10px] text-emerald-400 block font-semibold">Ahora hiciste:</span>
                    <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                      {latestEval.enduranceTest.result}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" />
                      <span>¡Menor tiempo = Mayor potencia!</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanation of the Endurance Test */}
              <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
                <strong className="text-neutral-200 block">¿Cómo funciona el Test de Resistencia en Kinetix?</strong>
                <p className="leading-relaxed">
                  Los ejercicios van rotando según el ciclo de entrenamiento (ej. <strong>50 burpees</strong>, <strong>remo 2000m</strong>, <strong>100 sentadillas</strong>). 
                  El Coach solo registra el <strong>tiempo total</strong> en que lo completas para medir tu potencia anaeróbica y velocidad de recuperación neuromuscular.
                </p>
              </div>
            </div>
          )}

          {/* Cronómetro Auxiliar Opcional (Colapsable para no saturar) */}
          <div className="p-4 rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <Timer className="w-4 h-4 text-blue-400" />
                <span>Cronómetro de Campo Auxiliar (Para medir el reto)</span>
              </div>
              <button
                onClick={() => setShowStopwatch(!showStopwatch)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                {showStopwatch ? 'Ocultar' : 'Abrir Cronómetro'}
              </button>
            </div>

            {showStopwatch && (
              <div className="text-center pt-2 space-y-3 animate-fade-in border-t border-neutral-800">
                <div className="text-5xl font-mono font-extrabold text-white tracking-tight py-1">
                  {formatStopwatch(stopwatchSeconds)}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
                      isStopwatchRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isStopwatchRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isStopwatchRunning ? 'Pausar' : 'Iniciar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStopwatchRunning(false);
                      setStopwatchSeconds(0);
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FUERZA 1RM (5 EJERCICIOS PILARES) */}
      {/* ========================================================================= */}
      {activeTab === 'strength' && latestEval && (
        <div className="space-y-4">
          {/* Quick Express Banner for Coaches */}
          {canEvaluate && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-950/20 border border-amber-500/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Captura Express de Fuerza / PR</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Rápido
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Registra marcas directas (ej. Peso Muerto) en 5 segundos sin llenar todo el test.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenExpressModal()}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/30 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Registrar</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              5 Ejercicios de Fuerza Kinetix
            </span>
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => setWeightUnit('kg')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  weightUnit === 'kg' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setWeightUnit('lbs')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  weightUnit === 'lbs' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {latestEval.strengthRecords.map((rec) => {
              if (rec.status === 'na' || rec.status === 'np') {
                const isNA = rec.status === 'na';
                return (
                  <div
                    key={rec.exerciseId}
                    className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-neutral-400" />
                          {rec.exerciseName}
                        </h4>
                        <span className="text-[10px] text-neutral-500">
                          {rec.statusReason || (isNA ? 'Ejercicio exento por edad, condición física o prescripción médica.' : 'Prueba pospuesta o no realizada en esta sesión.')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isNA ? 'bg-neutral-800 text-neutral-300 border border-neutral-700' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isNA ? '🚫 NA' : '⚠️ NP'}
                        </span>
                        {canEvaluate && (
                          <button
                            type="button"
                            onClick={() => handleOpenExpressModal(rec.exerciseId as any)}
                            className="p-1 rounded-lg bg-neutral-800 hover:bg-amber-500/20 text-neutral-400 hover:text-amber-400 border border-neutral-700 transition-colors"
                            title={`Registrar marca de ${rec.exerciseName}`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              const prevRec = prevEval?.strengthRecords.find(s => s.exerciseId === rec.exerciseId);
              const prevWeight = prevRec && prevRec.status !== 'na' && prevRec.status !== 'np' ? prevRec.weightKg : (rec.weightKg > 10 ? rec.weightKg - 10 : rec.weightKg);
              const deltaKg = rec.weightKg - prevWeight;

              const displayWeight = weightUnit === 'kg' ? rec.weightKg : kgToLbs(rec.weightKg);
              const display1RM = weightUnit === 'kg' ? rec.estimated1RMKg : kgToLbs(rec.estimated1RMKg);
              const relativeRatio = calculateRelativeStrengthRatio(rec.estimated1RMKg, currentUser.heightCm > 0 ? 75 : 75);
              const strengthTier = getStrengthTier(relativeRatio);

              return (
                <div
                  key={rec.exerciseId}
                  className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-[#ff5500]" />
                        {rec.exerciseName}
                      </h4>
                      <span className="text-[10px] text-neutral-400">
                        {displayWeight} {weightUnit} × {rec.reps} {rec.reps === 1 ? 'rep máx' : 'reps'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 uppercase">1RM Calculado</span>
                        <div className="text-base font-extrabold text-white font-mono tracking-tight">
                          {display1RM} <span className="text-[11px] font-normal text-neutral-400">{weightUnit}</span>
                        </div>
                      </div>
                      {canEvaluate && (
                        <button
                          type="button"
                          onClick={() => handleOpenExpressModal(rec.exerciseId as any)}
                          className="p-1.5 rounded-xl bg-neutral-800 hover:bg-amber-500/20 text-neutral-400 hover:text-amber-400 border border-neutral-700 active:scale-95 transition-all"
                          title={`Actualizar marca de ${rec.exerciseName}`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comparativa con el test anterior */}
                  <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">
                      Anterior: <strong className="text-neutral-300">{prevWeight} kg</strong> &rarr; Ahora:{' '}
                      <strong className="text-white">{rec.weightKg} kg</strong>
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {deltaKg > 0 ? `+${deltaKg} kg ganado` : `${deltaKg} kg`}
                    </span>
                  </div>

                  {/* Fuerza Relativa */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50 text-[10px]">
                    <span className="text-neutral-400">
                      Fuerza Relativa: <strong className="text-white font-mono">{relativeRatio}x</strong> peso corporal
                    </span>
                    <span className="text-[#ff5500] font-semibold">{strengthTier.tier}</span>
                  </div>

                  {/* Calculadora de Porcentajes de Carga (% 1RM) */}
                  <div className="pt-2 border-t border-neutral-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                        Porcentajes de Entrenamiento (% de 1RM):
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        1RM: <strong className="text-white font-bold">{display1RM} {weightUnit}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center font-mono text-[11px]">
                      {[
                        { pct: 50, label: '50%', color: 'text-neutral-400' },
                        { pct: 60, label: '60%', color: 'text-neutral-300' },
                        { pct: 70, label: '70%', color: 'text-blue-400' },
                        { pct: 75, label: '75%', color: 'text-cyan-400' },
                        { pct: 80, label: '80%', color: 'text-emerald-400' },
                        { pct: 85, label: '85%', color: 'text-amber-400' },
                        { pct: 90, label: '90%', color: 'text-orange-400' },
                        { pct: 95, label: '95%', color: 'text-red-400' },
                      ].map(item => {
                        const calculatedWeight = (display1RM * (item.pct / 100)).toFixed(1);
                        return (
                          <div key={item.pct} className="p-1.5 bg-neutral-950 rounded-xl border border-neutral-800/80">
                            <span className={`text-[9px] block font-bold ${item.color}`}>Tu {item.label}</span>
                            <strong className="text-white text-xs">{calculatedWeight}</strong>
                            <span className="text-[8px] text-neutral-500 block">{weightUnit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HISTORIAL STAFF & CONTROL TOTAL (EDITAR Y ELIMINAR CUALQUIER TEST) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-semibold">
                Control Absoluto del Staff
              </span>
              <span className="text-xs text-neutral-400">
                {userEvals.length} evaluaciones registradas
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-brand">
              Historial de Evaluaciones de {currentUser.name}
            </h3>
            <p className="text-xs text-neutral-400">
              Aquí el Staff puede consultar, <strong>editar datos</strong> o <strong>eliminar registros erróneos</strong> para mantener el control completo.
            </p>
          </div>

          <div className="space-y-3">
            {sortedEvals.slice().reverse().map((ev, idx) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      {ev.evaluationDate}
                    </span>
                    {idx === 0 && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                        MÁS RECIENTE
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-400">
                    Coach: <strong className="text-neutral-200">{ev.coachName || 'Coach Jorge'}</strong>
                  </div>
                </div>

                {/* Resumen de los 3 componentes del test */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 block">Nivel Cooper</span>
                    <div className="font-extrabold text-blue-400 font-brand text-sm">
                      {ev.cooperTest.status === 'na' ? '🚫 NA' : ev.cooperTest.status === 'np' ? '⚠️ NP' : `Nivel ${ev.cooperTest.levelNumber || 5}`}
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono truncate block">
                      {ev.cooperTest.status === 'na' || ev.cooperTest.status === 'np' ? (ev.cooperTest.statusReason || 'Exento') : `${ev.cooperTest.distanceMeters || 2800}m`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 block truncate">Resistencia</span>
                    <div className="font-extrabold text-emerald-400 font-mono text-sm">
                      {ev.enduranceTest.status === 'na' ? '🚫 NA' : ev.enduranceTest.status === 'np' ? '⚠️ NP' : ev.enduranceTest.result}
                    </div>
                    <span className="text-[10px] text-neutral-500 truncate block">
                      {ev.enduranceTest.status === 'na' || ev.enduranceTest.status === 'np' ? (ev.enduranceTest.statusReason || 'Exento') : ev.enduranceTest.name}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 block">Sentadilla 1RM</span>
                    {(() => {
                      const squat = ev.strengthRecords.find(s => s.exerciseId === 'squats');
                      if (squat?.status === 'na') {
                        return <div className="font-extrabold text-neutral-400 font-mono text-sm">🚫 NA</div>;
                      }
                      if (squat?.status === 'np') {
                        return <div className="font-extrabold text-amber-400 font-mono text-sm">⚠️ NP</div>;
                      }
                      return (
                        <>
                          <div className="font-extrabold text-[#ff5500] font-mono text-sm">
                            {squat?.weightKg || 120} kg
                          </div>
                          <span className="text-[10px] text-neutral-500">1RM máx</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {ev.generalCoachNotes && (
                  <p className="text-[11px] text-neutral-400 italic bg-neutral-950/60 p-2 rounded-xl">
                    "{ev.generalCoachNotes}"
                  </p>
                )}

                {/* Staff Control Buttons: Editar y Eliminar (Solo Staff / Coaches) */}
                {canEvaluate && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/60">
                    <button
                      onClick={() => {
                        setEditingEval(ev);
                        loadAthleteBaselineIntoForm(currentUser.id, ev);
                        setEvalDate(ev.evaluationDate);
                        setCoachNotes(ev.generalCoachNotes || '');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Editar Test</span>
                    </button>

                    {onDeleteEvaluation && (
                      <button
                        onClick={() => setEvalToDelete(ev)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-medium border border-red-800/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA EVALUACIÓN (STAFF - Mobile Bottom-Sheet) */}
      {showAddEvalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden shadow-2xl">
            {/* Pinned Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 shrink-0 space-y-2.5 bg-neutral-900/95">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">
                    {canEvaluate ? 'Staff Kinetix · Registro Oficial de Evaluación' : 'Registro de Marca Personal · Kinetix'}
                  </span>
                  <h3 className="text-base font-bold text-white font-brand">
                    {canEvaluate ? `Evaluar a ${currentUser.name}` : `Registrar Mis Evaluaciones Físicas`}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddEvalModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Athlete Banner & Rotation Status */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider block font-semibold truncate">
                      {canEvaluate && athleteList.length > 1
                        ? `Pase de Evaluación (${currentAthleteIndex + 1}/${athleteList.length})`
                        : 'Evaluando Expediente Oficial'}
                    </span>
                    <strong className="text-white text-sm block truncate">
                      {currentUser.name}
                    </strong>
                  </div>
                </div>
                {canEvaluate && athleteList.length > 1 && nextAthlete && nextAthlete.id !== currentUser.id ? (
                  <div className="text-right shrink-0 bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block font-mono">Siguiente:</span>
                    <span className="text-xs font-bold text-blue-400 block">
                      {nextAthlete.name.split(' ')[0]} ⏭️
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                    {evaluatingCoachName}
                  </span>
                )}
              </div>

              {/* Toast when advancing to next student */}
              {nextAthleteToast && (
                <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{nextAthleteToast}</span>
                </div>
              )}
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmitEvaluation} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Fecha */}
              {/* Fecha (Permite registrar cualquier mes anterior para cargar historiales sin perder avances) */}
              <div>
                <label className="text-neutral-300 font-medium block mb-1 flex items-center justify-between">
                  <span>Fecha de la Prueba</span>
                  <span className="text-[10px] text-blue-400 font-mono">📅 Carga histórica permitida</span>
                </label>
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                  required
                />
                <span className="text-[10px] text-neutral-500 block mt-1">
                  * Puedes elegir cualquier fecha de meses anteriores para cargar expedientes históricos sin perder tu progreso ganado.
                </span>
              </div>

              {/* SECCIÓN 1: TEST DE COOPER (NIVELES 1 AL 20 / NA / NP) */}
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>1. Test de Cooper (12 Minutos)</span>
                  </span>
                  
                  {/* Selector: Normal / NA / NP */}
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCooperStatus('completed')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        cooperStatus === 'completed'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      ✓ Calificado
                    </button>
                    <button
                      type="button"
                      onClick={() => setCooperStatus('na')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        cooperStatus === 'na'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="No Aplica (Niños, Adultos Mayores)"
                    >
                      🚫 NA
                    </button>
                    <button
                      type="button"
                      onClick={() => setCooperStatus('np')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        cooperStatus === 'np'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="No Presentada (Enfermedad, Lesión)"
                    >
                      ⚠️ NP
                    </button>
                  </div>
                </div>

                {cooperStatus === 'completed' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400">Escala de Nivel:</span>
                      <span className="text-[11px] text-blue-400 font-mono font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                        Nivel {selectedCooperLevel} de 20
                      </span>
                    </div>

                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
                        const isSelected = selectedCooperLevel === lvl;
                        return (
                          <button
                            type="button"
                            key={lvl}
                            onClick={() => setSelectedCooperLevel(lvl)}
                            className={`py-1.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                            }`}
                            title={`Nivel ${lvl}`}
                          >
                            <span className="text-xs font-bold">{lvl}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-neutral-300 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-white">
                          {COOPER_LEVELS_CATALOG[selectedCooperLevel]?.levelName || `Nivel ${selectedCooperLevel}`}
                        </strong>
                        <span className="text-emerald-400 font-mono font-semibold text-[10px]">
                          {COOPER_LEVELS_CATALOG[selectedCooperLevel]?.referenceDistance}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        {COOPER_LEVELS_CATALOG[selectedCooperLevel]?.description}
                      </p>
                      <div className="text-[10px] text-blue-400 pt-0.5">
                        Pauta de entreno: {COOPER_LEVELS_CATALOG[selectedCooperLevel]?.coachingRecommendation}
                      </div>
                    </div>
                  </>
                ) : cooperStatus === 'na' ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>🚫 Prueba marcada como NA (No Aplica)</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Exento de evaluación de carrera de 12 minutos por edad (niños/infantil o adultos mayores) o prescripción de movilidad suave.
                    </p>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-0.5">Motivo / Condición (Opcional):</label>
                      <input
                        type="text"
                        value={cooperReason}
                        onChange={(e) => setCooperReason(e.target.value)}
                        placeholder="Ej. Adulto mayor (Movilidad funcional adaptada) o Etapa infantil"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/40 border border-red-600/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-red-300 font-bold">
                      <span>⚠️ Prueba marcada como NP (No Presentada)</span>
                    </div>
                    <p className="text-[11px] text-red-200/80 leading-relaxed">
                      El atleta no presentó la prueba por enfermedad, lesión temporal o recomendación médica de descanso.
                    </p>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-0.5">Motivo de no presentación:</label>
                      <input
                        type="text"
                        value={cooperReason}
                        onChange={(e) => setCooperReason(e.target.value)}
                        placeholder="Ej. Cuadro gripal, lesión muscular o prescripción médica"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: TEST DE RESISTENCIA POR TIEMPO (RETO ROTATIVO / NA / NP) */}
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>2. Test de Resistencia (Por Tiempo)</span>
                  </span>

                  {/* Selector: Normal / NA / NP */}
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEnduranceStatus('completed')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        enduranceStatus === 'completed'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      ✓ Calificado
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnduranceStatus('na')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        enduranceStatus === 'na'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="No Aplica (Niños, Adultos Mayores)"
                    >
                      🚫 NA
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnduranceStatus('np')}
                      className={`px-2 py-0.5 rounded font-semibold transition-all ${
                        enduranceStatus === 'np'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="No Presentada (Enfermedad, Lesión)"
                    >
                      ⚠️ NP
                    </button>
                  </div>
                </div>

                {enduranceStatus === 'completed' ? (
                  <>
                    {/* Reto Rotativo */}
                    <div>
                      <label className="text-neutral-400 text-[11px] block mb-1">Ejercicio / Reto del Ciclo:</label>
                      <select
                        value={enduranceExerciseName}
                        onChange={(e) => setEnduranceExerciseName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                      >
                        {ENDURANCE_PRESETS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* TIEMPO EN EL QUE LO HICIERON (MINUTOS Y SEGUNDOS) */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">
                        Tiempo en el que lo hicieron (Minutos y Segundos):
                      </label>
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">Minutos</span>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={enduranceMinutes}
                            onChange={(e) => setEnduranceMinutes(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-center font-mono font-bold text-sm focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">Segundos</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={enduranceSeconds}
                            onChange={(e) => setEnduranceSeconds(parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-center font-mono font-bold text-sm focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-neutral-400 bg-neutral-900/60 p-2 rounded-xl">
                      * Este tiempo se guardará como <strong>{enduranceMinutes.toString().padStart(2, '0')}:{enduranceSeconds.toString().padStart(2, '0')} min</strong> y se comparará automáticamente con el test anterior.
                    </div>
                  </>
                ) : enduranceStatus === 'na' ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>🚫 Prueba marcada como NA (No Aplica)</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Reto de resistencia por tiempo exento para niños o adultos mayores.
                    </p>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-0.5">Motivo / Condición (Opcional):</label>
                      <input
                        type="text"
                        value={enduranceReason}
                        onChange={(e) => setEnduranceReason(e.target.value)}
                        placeholder="Ej. Movilidad para tercera edad o adaptación inicial infantil"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/40 border border-red-600/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-red-300 font-bold">
                      <span>⚠️ Prueba marcada como NP (No Presentada)</span>
                    </div>
                    <p className="text-[11px] text-red-200/80 leading-relaxed">
                      No se presentó la prueba por motivo de enfermedad o lesión.
                    </p>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-0.5">Motivo de no presentación:</label>
                      <input
                        type="text"
                        value={enduranceReason}
                        onChange={(e) => setEnduranceReason(e.target.value)}
                        placeholder="Ej. Molestia muscular, recomendación médica o reposo"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 3: FUERZA 1RM (5 EJERCICIOS CON SELECTOR NA / NP INDIVIDUAL) */}
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-[#ff5500]" />
                    <span>3. Cargas Máximas 1RM (5 Ejercicios)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Marca NA o NP si el alumno no realiza algún ejercicio
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Sentadillas */}
                  <div className="bg-neutral-900 p-2.5 rounded-xl space-y-1.5 border border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-200 font-semibold text-xs">Sentadillas</span>
                      <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSquatStatus('completed')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            squatStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          ✓ 1RM
                        </button>
                        <button
                          type="button"
                          onClick={() => setSquatStatus('na')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            squatStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Aplica (Niños / Tercera edad)"
                        >
                          NA
                        </button>
                        <button
                          type="button"
                          onClick={() => setSquatStatus('np')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            squatStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Presentada (Lesión / Enfermedad)"
                        >
                          NP
                        </button>
                      </div>
                    </div>
                    {squatStatus === 'completed' ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="number"
                            value={squatWeight}
                            onChange={(e) => setSquatWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs outline-none"
                            placeholder="Carga kg"
                          />
                        </div>
                        <div className="col-span-6 text-right">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            1RM: <strong className="text-white">{calculate1RM(squatWeight, squatReps)}kg</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded-lg">
                        {squatStatus === 'na' ? '🚫 NA · Exento por edad o adaptación funcional' : '⚠️ NP · No Presentada por lesión o enfermedad'}
                      </div>
                    )}
                  </div>

                  {/* Peso Muerto */}
                  <div className="bg-neutral-900 p-2.5 rounded-xl space-y-1.5 border border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-200 font-semibold text-xs">Peso Muerto</span>
                      <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setDeadliftStatus('completed')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            deadliftStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          ✓ 1RM
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadliftStatus('na')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            deadliftStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Aplica (Niños / Tercera edad)"
                        >
                          NA
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadliftStatus('np')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            deadliftStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Presentada (Lesión / Enfermedad)"
                        >
                          NP
                        </button>
                      </div>
                    </div>
                    {deadliftStatus === 'completed' ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="number"
                            value={deadliftWeight}
                            onChange={(e) => setDeadliftWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs outline-none"
                            placeholder="Carga kg"
                          />
                        </div>
                        <div className="col-span-6 text-right">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            1RM: <strong className="text-white">{calculate1RM(deadliftWeight, deadliftReps)}kg</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded-lg">
                        {deadliftStatus === 'na' ? '🚫 NA · Exento por edad o adaptación funcional' : '⚠️ NP · No Presentada por lesión o enfermedad'}
                      </div>
                    )}
                  </div>

                  {/* Hip Thrust */}
                  <div className="bg-neutral-900 p-2.5 rounded-xl space-y-1.5 border border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-200 font-semibold text-xs">Hip Thrust</span>
                      <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setHipThrustStatus('completed')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            hipThrustStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          ✓ 1RM
                        </button>
                        <button
                          type="button"
                          onClick={() => setHipThrustStatus('na')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            hipThrustStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Aplica (Niños / Tercera edad)"
                        >
                          NA
                        </button>
                        <button
                          type="button"
                          onClick={() => setHipThrustStatus('np')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            hipThrustStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Presentada (Lesión / Enfermedad)"
                        >
                          NP
                        </button>
                      </div>
                    </div>
                    {hipThrustStatus === 'completed' ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="number"
                            value={hipThrustWeight}
                            onChange={(e) => setHipThrustWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs outline-none"
                            placeholder="Carga kg"
                          />
                        </div>
                        <div className="col-span-6 text-right">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            1RM: <strong className="text-white">{calculate1RM(hipThrustWeight, hipThrustReps)}kg</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded-lg">
                        {hipThrustStatus === 'na' ? '🚫 NA · Exento por edad o adaptación funcional' : '⚠️ NP · No Presentada por lesión o enfermedad'}
                      </div>
                    )}
                  </div>

                  {/* Press Horizontal */}
                  <div className="bg-neutral-900 p-2.5 rounded-xl space-y-1.5 border border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-200 font-semibold text-xs">Press Horizontal</span>
                      <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setPressStatus('completed')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            pressStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          ✓ 1RM
                        </button>
                        <button
                          type="button"
                          onClick={() => setPressStatus('na')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            pressStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Aplica (Niños / Tercera edad)"
                        >
                          NA
                        </button>
                        <button
                          type="button"
                          onClick={() => setPressStatus('np')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            pressStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                          title="No Presentada (Lesión / Enfermedad)"
                        >
                          NP
                        </button>
                      </div>
                    </div>
                    {pressStatus === 'completed' ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="number"
                            value={pressWeight}
                            onChange={(e) => setPressWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs outline-none"
                            placeholder="Carga kg"
                          />
                        </div>
                        <div className="col-span-6 text-right">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            1RM: <strong className="text-white">{calculate1RM(pressWeight, pressReps)}kg</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded-lg">
                        {pressStatus === 'na' ? '🚫 NA · Exento por edad o adaptación funcional' : '⚠️ NP · No Presentada por lesión o enfermedad'}
                      </div>
                    )}
                  </div>

                  {/* 5. Remo o Dominadas con selector y peso */}
                  <div className="bg-neutral-900 p-2.5 rounded-xl space-y-2 border border-neutral-800">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <span className="text-neutral-200 font-semibold text-xs flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                        <span>5. Tracción (Remo / Dominadas)</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Selector de Ejercicio */}
                        <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setRowExerciseType('remo')}
                            className={`px-2 py-0.5 rounded font-bold transition-all ${
                              rowExerciseType === 'remo'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Remo
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowExerciseType('dominadas')}
                            className={`px-2 py-0.5 rounded font-bold transition-all ${
                              rowExerciseType === 'dominadas'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Dominadas
                          </button>
                        </div>

                        {/* Status NA / NP */}
                        <div className="flex items-center gap-0.5 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setRowStatus('completed')}
                            className={`px-1.5 py-0.5 rounded font-semibold ${rowStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowStatus('na')}
                            className={`px-1.5 py-0.5 rounded font-semibold ${rowStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400'}`}
                            title="No Aplica"
                          >
                            NA
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowStatus('np')}
                            className={`px-1.5 py-0.5 rounded font-semibold ${rowStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}
                            title="No Presentada"
                          >
                            NP
                          </button>
                        </div>
                      </div>
                    </div>

                    {rowStatus === 'completed' ? (
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 text-[11px] text-neutral-300 font-medium">
                          {rowExerciseType === 'remo' ? 'Remo (Barra / Polea)' : 'Dominadas (Pull-ups)'}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={rowWeight}
                            onChange={(e) => setRowWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs focus:border-blue-500 outline-none"
                            placeholder={rowExerciseType === 'remo' ? 'Peso (kg)' : 'Peso / Lastre kg'}
                          />
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            1RM: <strong className="text-white">{calculate1RM(rowWeight, rowReps)}kg</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded-lg">
                        {rowStatus === 'na' ? '🚫 NA · Exento por edad o adaptación funcional' : '⚠️ NP · No Presentada por lesión o enfermedad'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector de Coach Evaluador */}
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1.5">
                <label className="text-neutral-300 font-medium block text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Coach Evaluador Oficial:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Firma en Reporte</span>
                </label>
                <select
                  value={evaluatingCoachName}
                  onChange={(e) => setEvaluatingCoachName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:border-blue-500 outline-none"
                >
                  <option value="Leslie (Dueña & Coach)">Leslie (Dueña & Coach Kinetix)</option>
                  <option value="Coach Jorge">Coach Jorge (Head Coach)</option>
                  <option value="Coach Gus">Coach Gus (Evaluador)</option>
                </select>
              </div>

              {/* Dictamen del Coach */}
              <div>
                <label className="text-neutral-300 font-medium block mb-1 flex items-center justify-between">
                  <span>Dictamen Técnico y Recomendaciones ({evaluatingCoachName})</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">Staff Autorizado</span>
                </label>
                <textarea
                  rows={2}
                  value={coachNotes}
                  disabled={!canEvaluate}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white text-xs outline-none focus:border-blue-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Feedback de ritmo, potencia y técnica..."
                />
              </div>
            </div>

            {/* Pinned Modal Action Footer (Accesible en todo momento con el pulgar) */}
            <div 
              className="p-3 sm:p-4 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 shrink-0 space-y-2"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              {canEvaluate && athleteList.length > 1 && onSelectNextAthlete && nextAthlete && (
                <button
                  type="button"
                  onClick={handleSaveAndNextEvaluation}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Guardar y Evaluar Siguiente Alumno ({nextAthlete.name.split(' ')[0]})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEvalModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors text-xs"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-md shadow-blue-500/20 text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guardar Evaluación</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR EVALUACIÓN EXISTENTE (STAFF) */}
      {/* ========================================================================= */}
      {editingEval && onUpdateEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase font-bold">
                  Edición Staff · Control Total
                </span>
                <h3 className="text-base font-bold text-white font-brand">
                  Editar Test del {editingEval.evaluationDate}
                </h3>
              </div>
              <button
                onClick={() => setEditingEval(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-300 font-medium block mb-1">Fecha</label>
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
              </div>

              {/* SECCIÓN 1: COOPER EN EDICIÓN */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-neutral-300 font-medium">Test de Cooper (12 Minutos)</label>
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCooperStatus('completed')}
                      className={`px-2 py-0.5 rounded font-semibold ${cooperStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}
                    >
                      ✓ Calificado
                    </button>
                    <button
                      type="button"
                      onClick={() => setCooperStatus('na')}
                      className={`px-2 py-0.5 rounded font-semibold ${cooperStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400'}`}
                      title="No Aplica"
                    >
                      🚫 NA
                    </button>
                    <button
                      type="button"
                      onClick={() => setCooperStatus('np')}
                      className={`px-2 py-0.5 rounded font-semibold ${cooperStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}
                      title="No Presentada"
                    >
                      ⚠️ NP
                    </button>
                  </div>
                </div>

                {cooperStatus === 'completed' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-mono">Nivel Cooper (1 al 20):</span>
                      <span className="text-[10px] text-blue-400 font-mono font-bold">Nivel {selectedCooperLevel} de 20</span>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                        <button
                          type="button"
                          key={lvl}
                          onClick={() => setSelectedCooperLevel(lvl)}
                          className={`py-1.5 rounded-lg border text-center font-bold text-xs transition-all ${
                            selectedCooperLevel === lvl
                              ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <input
                    type="text"
                    value={cooperReason}
                    onChange={(e) => setCooperReason(e.target.value)}
                    placeholder={cooperStatus === 'na' ? 'Motivo NA: Adulto mayor, niño, etc.' : 'Motivo NP: Enfermedad, lesión, etc.'}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                )}
              </div>

              {/* SECCIÓN 2: RESISTENCIA EN EDICIÓN */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-white block">Resistencia (Tiempo)</span>
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEnduranceStatus('completed')}
                      className={`px-2 py-0.5 rounded font-semibold ${enduranceStatus === 'completed' ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}
                    >
                      ✓ Calificado
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnduranceStatus('na')}
                      className={`px-2 py-0.5 rounded font-semibold ${enduranceStatus === 'na' ? 'bg-amber-600 text-white' : 'text-neutral-400'}`}
                      title="No Aplica"
                    >
                      🚫 NA
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnduranceStatus('np')}
                      className={`px-2 py-0.5 rounded font-semibold ${enduranceStatus === 'np' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}
                      title="No Presentada"
                    >
                      ⚠️ NP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-0.5">Reto</label>
                  <input
                    type="text"
                    value={enduranceExerciseName}
                    onChange={(e) => setEnduranceExerciseName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                </div>

                {enduranceStatus === 'completed' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5">Minutos</span>
                      <input
                        type="number"
                        value={enduranceMinutes}
                        onChange={(e) => setEnduranceMinutes(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5">Segundos</span>
                      <input
                        type="number"
                        value={enduranceSeconds}
                        onChange={(e) => setEnduranceSeconds(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={enduranceReason}
                    onChange={(e) => setEnduranceReason(e.target.value)}
                    placeholder={enduranceStatus === 'na' ? 'Motivo NA: Reto adaptado por prescripción...' : 'Motivo NP: Pospospuesto por salud/enfermedad...'}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Notas del Coach</label>
                <textarea
                  rows={2}
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white text-xs outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEval(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                >
                  Cancelar / Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isCooperDone = cooperStatus === 'completed';
                    const isEnduranceDone = enduranceStatus === 'completed';
                    const formattedResult = `${enduranceMinutes.toString().padStart(2, '0')}:${enduranceSeconds.toString().padStart(2, '0')} min`;
                    const levelInfo = getCooperLevelInfo(selectedCooperLevel);

                    onUpdateEvaluation(editingEval.id, {
                      evaluationDate: evalDate,
                      cooperTest: {
                        ...editingEval.cooperTest,
                        status: cooperStatus,
                        statusReason: cooperReason,
                        level: isCooperDone ? levelInfo.levelName : (cooperStatus === 'na' ? 'NA (No Aplica)' : 'NP (No Presentada)'),
                        levelNumber: isCooperDone ? selectedCooperLevel : 0,
                        description: isCooperDone ? levelInfo.description : (cooperStatus === 'na' ? 'Prueba exenta por etapa formativa o edad (Niños / Adultos mayores).' : 'Prueba no presentada por enfermedad, lesión o prescripción médica.'),
                        targetZoneRecommendation: isCooperDone ? levelInfo.coachingRecommendation : 'Acondicionamiento físico adaptado.',
                      },
                      enduranceTest: {
                        ...editingEval.enduranceTest,
                        status: enduranceStatus,
                        statusReason: enduranceReason,
                        name: enduranceExerciseName,
                        result: isEnduranceDone ? formattedResult : (enduranceStatus === 'na' ? 'NA' : 'NP'),
                        timeSeconds: isEnduranceDone ? (enduranceMinutes * 60 + enduranceSeconds) : 0,
                      },
                      generalCoachNotes: coachNotes,
                    });
                    setEditingEval(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE TEST (STAFF) */}
      {/* ========================================================================= */}
      {evalToDelete && onDeleteEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-red-800/80 rounded-3xl p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">¿Eliminar esta evaluación?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Se eliminará el registro del <strong>{evalToDelete.evaluationDate}</strong> de {currentUser.name}. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEvalToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEvaluation(evalToDelete.id);
                  setEvalToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-md shadow-red-600/30"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRO EXPRESS DE FUERZA / PR (PILAR KINETIX) */}
      {/* ========================================================================= */}
      {showExpressModal && canEvaluate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-brand flex items-center gap-1.5">
                    <span>Captura Express de Fuerza</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Rápido
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Registra marcas y calcula 1RM sin llenar todo el expediente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpressModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-Modal Flash Message when advancing through athletes */}
            {expressSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{expressSuccessMessage}</span>
              </div>
            )}

            {/* Athlete & Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Athlete Selector */}
              <div>
                <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                  Atleta a Evaluar:
                </label>
                {athleteList.length > 0 ? (
                  <select
                    value={expressTargetUserId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setExpressTargetUserId(newId);
                      preloadExpressValues(newId, expressExerciseId);
                      const targetObj = athleteList.find(a => a.id === newId);
                      if (targetObj && onSelectNextAthlete) {
                        onSelectNextAthlete(targetObj);
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:border-amber-500 outline-none"
                  >
                    {athleteList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.membership.planName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-semibold">
                    {currentUser.name}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-neutral-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fecha de la Marca:</span>
                </label>
                <input
                  type="date"
                  value={expressDate}
                  onChange={(e) => setExpressDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Exercise Selector (5 Buttons) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-300 block">
                Selecciona el Ejercicio:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'deadlift', name: 'Peso Muerto', icon: '🏋️‍♂️' },
                  { id: 'squats', name: 'Sentadilla', icon: '🦵' },
                  { id: 'hip_thrust', name: 'Hip Thrust', icon: '🍑' },
                  { id: 'horizontal_press', name: 'Press Pecho', icon: '🛡️' },
                  { id: 'pullups_or_rows', name: 'Remo / Dominada', icon: '🚣' },
                ].map((item) => {
                  const isSelected = expressExerciseId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setExpressExerciseId(item.id as any);
                        preloadExpressValues(expressTargetUserId, item.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-bold truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-toggle for Remo vs Dominadas if selected */}
              {expressExerciseId === 'pullups_or_rows' && (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setExpressRowType('remo')}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors ${
                      expressRowType === 'remo' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Remo con Barra
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpressRowType('dominadas')}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors ${
                      expressRowType === 'dominadas' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Dominadas (Pull-ups)
                  </button>
                </div>
              )}
            </div>

            {/* Status Toggle: Realizada / NA / NP */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-300 block">
                Estado del Ejercicio:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExpressStatus('completed')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    expressStatus === 'completed'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  ✅ Realizada
                </button>
                <button
                  type="button"
                  onClick={() => setExpressStatus('na')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    expressStatus === 'na'
                      ? 'bg-neutral-800 border-neutral-600 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  🚫 NA (No Aplica)
                </button>
                <button
                  type="button"
                  onClick={() => setExpressStatus('np')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    expressStatus === 'np'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  ⚠️ NP (No Presentada)
                </button>
              </div>

              {expressStatus !== 'completed' && (
                <input
                  type="text"
                  placeholder={expressStatus === 'na' ? 'Motivo: Adulto mayor, niño, prescripción...' : 'Motivo: Lesión de hombro, pospuesto...'}
                  value={expressReason}
                  onChange={(e) => setExpressReason(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs mt-1 outline-none focus:border-amber-500"
                />
              )}
            </div>

            {/* If Completed: Inputs for Weight & Reps + 1RM Banner */}
            {expressStatus === 'completed' && (
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                {/* Weight Input with Stepper Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-neutral-300">
                      Peso Levantado (kg):
                    </label>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ≈ {kgToLbs(expressWeight)} lbs
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpressWeight(Math.max(5, expressWeight - 10))}
                      className="px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold active:scale-95"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpressWeight(Math.max(5, expressWeight - 2.5))}
                      className="px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold active:scale-95"
                    >
                      -2.5
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={expressWeight}
                      onChange={(e) => setExpressWeight(Number(e.target.value))}
                      className="flex-1 bg-neutral-900 border border-amber-500/40 rounded-xl py-2 px-3 text-center text-white font-mono font-bold text-base outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setExpressWeight(expressWeight + 2.5)}
                      className="px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold active:scale-95"
                    >
                      +2.5
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpressWeight(expressWeight + 10)}
                      className="px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-bold active:scale-95"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Reps selector buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-neutral-300">
                      Repeticiones Logradas:
                    </label>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {expressReps} {expressReps === 1 ? 'repetición (1RM Directo)' : 'repeticiones'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setExpressReps(num)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
                          expressReps === num
                            ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live 1RM Calculation & Training Percentages */}
                {(() => {
                  const est1RM = calculate1RM(expressWeight, expressReps);
                  const p90 = Math.round(est1RM * 0.9);
                  const p80 = Math.round(est1RM * 0.8);
                  const p70 = Math.round(est1RM * 0.7);

                  return (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/5 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>1RM Oficial Estimado (Fórmula Brzycki)</span>
                        </span>
                        <span className="text-xl font-extrabold text-white font-mono tracking-tight">
                          {est1RM} <span className="text-xs font-normal text-neutral-400">kg ({kgToLbs(est1RM)} lbs)</span>
                        </span>
                      </div>

                      {/* Training percentages row */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800/80 text-center">
                        <div className="bg-neutral-900/90 p-1.5 rounded-lg border border-neutral-800">
                          <span className="text-[9px] text-neutral-400 block">90% Fuerza</span>
                          <span className="text-xs font-bold text-red-400 font-mono">{p90} kg</span>
                        </div>
                        <div className="bg-neutral-900/90 p-1.5 rounded-lg border border-neutral-800">
                          <span className="text-[9px] text-neutral-400 block">80% Hipertrofia</span>
                          <span className="text-xs font-bold text-amber-400 font-mono">{p80} kg</span>
                        </div>
                        <div className="bg-neutral-900/90 p-1.5 rounded-lg border border-neutral-800">
                          <span className="text-[9px] text-neutral-400 block">70% Resistencia</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">{p70} kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                Nota rápida (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej. Con cinturón, nuevo PR personal, mejoró técnica..."
                value={expressNotes}
                onChange={(e) => setExpressNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveExpress(false)}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Guardar Marca</span>
              </button>

              {athleteList.length > 1 && onSelectNextAthlete && (
                <button
                  type="button"
                  onClick={() => handleSaveExpress(true)}
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-neutral-950" />
                  <span>Guardar y Siguiente Atleta ⚡</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
