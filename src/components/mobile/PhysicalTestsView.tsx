import React, { useState, useEffect } from 'react';
import { PhysicalEvaluationRecord, UserProfile, CooperLevel, StrengthMaxRecord } from '../../types';
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
  const canEvaluate = Boolean(currentUser.role === 'staff' || loggedStaffUser?.role === 'staff' || isStaffUser);

  // Sub-tabs: 'evolution' (Visión General), 'cooper', 'endurance' (Resistencia por tiempo), 'strength' (1RM), 'history' (Historial Staff)
  const [activeTab, setActiveTab] = useState<'evolution' | 'cooper' | 'endurance' | 'strength' | 'history'>('evolution');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const [evaluatingCoachName, setEvaluatingCoachName] = useState<string>(() => {
    if (loggedStaffUser?.name) return loggedStaffUser.name;
    if (currentUser.role === 'staff') return currentUser.name;
    return 'Leslie (Dueña & Coach)';
  });

  // Modals state
  const [showAddEvalModal, setShowAddEvalModal] = useState(false);
  const [editingEval, setEditingEval] = useState<PhysicalEvaluationRecord | null>(null);
  const [evalToDelete, setEvalToDelete] = useState<PhysicalEvaluationRecord | null>(null);

  // Auxiliar stopwatch state (colapsable)
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(sec => sec + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatStopwatch = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Form State for New Evaluation Entry (Staff)
  const [evalDate, setEvalDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedCooperLevel, setSelectedCooperLevel] = useState<number>(10);
  const [optionalDistance, setOptionalDistance] = useState<number>(2800);
  
  // Test de Resistencia (Por tiempo)
  const [enduranceExerciseName, setEnduranceExerciseName] = useState<string>('Evaluación de Resistencia Funcional');
  const [enduranceMinutes, setEnduranceMinutes] = useState<number>(7);
  const [enduranceSeconds, setEnduranceSeconds] = useState<number>(14);
  const [enduranceScoreLevel, setEnduranceScoreLevel] = useState<'Básico' | 'Intermedio' | 'Avanzado' | 'Élite'>('Avanzado');

  // 5 Key Strength Exercises
  const [squatWeight, setSquatWeight] = useState<number>(120);
  const [squatReps, setSquatReps] = useState<number>(1);
  const [deadliftWeight, setDeadliftWeight] = useState<number>(140);
  const [deadliftReps, setDeadliftReps] = useState<number>(1);
  const [hipThrustWeight, setHipThrustWeight] = useState<number>(150);
  const [hipThrustReps, setHipThrustReps] = useState<number>(1);
  const [pressWeight, setPressWeight] = useState<number>(90);
  const [pressReps, setPressReps] = useState<number>(1);
  // Remo vs Dominadas Selector & Weight
  const [rowExerciseType, setRowExerciseType] = useState<'remo' | 'dominadas'>('remo');
  const [rowWeight, setRowWeight] = useState<number>(75);
  const [rowReps, setRowReps] = useState<number>(12);
  const [coachNotes, setCoachNotes] = useState<string>('');

  // Evaluaciones del atleta actual ordenadas cronológicamente
  const userEvals = evaluations.filter(e => e.userId === currentUser.id);
  const sortedEvals = [...userEvals].sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());

  // Respaldo robusto para evitar pantallas negras en atletas nuevos sin evaluaciones previas
  const fallbackEval: PhysicalEvaluationRecord = {
    id: `fallback-${currentUser.id}`,
    userId: currentUser.id,
    evaluationDate: new Date().toISOString().slice(0, 10),
    coachId: 'user-staff-01',
    coachName: 'Coach Jorge',
    cooperTest: {
      level: 'Nivel 5 (Excelente / Élite)',
      levelNumber: 5,
      description: 'Capacidad aeróbica funcional excelente y ritmo constante.',
      targetZoneRecommendation: 'Zona 4 - 5 de alta intensidad funcional.',
      distanceMeters: 2800,
      estimatedVo2Max: 56.0,
      rating: 'Excelente',
      notes: 'Evaluación base',
    },
    enduranceTest: {
      name: 'Evaluación de Resistencia Funcional',
      result: '07:14 min',
      timeSeconds: 434,
      scoreScoreLevel: 'Avanzado',
      notes: 'Completado con excelente ritmo.',
    },
    strengthRecords: [
      { exerciseId: 'squats', exerciseName: 'Sentadillas', weightKg: 120, reps: 1, estimated1RMKg: 120, weightUnit: 'kg' },
      { exerciseId: 'deadlift', exerciseName: 'Peso Muerto', weightKg: 140, reps: 1, estimated1RMKg: 140, weightUnit: 'kg' },
      { exerciseId: 'hip_thrust', exerciseName: 'Hip Thrust', weightKg: 160, reps: 1, estimated1RMKg: 160, weightUnit: 'kg' },
      { exerciseId: 'horizontal_press', exerciseName: 'Press Horizontal', weightKg: 95, reps: 1, estimated1RMKg: 95, weightUnit: 'kg' },
      { exerciseId: 'pullups_or_rows', exerciseName: 'Dominadas / Remo', weightKg: 85, reps: 1, estimated1RMKg: 85, weightUnit: 'kg' },
    ],
    generalCoachNotes: 'Listo para registrar su primera sesión oficial de evaluación.',
  };

  const latestEval = sortedEvals[sortedEvals.length - 1] || null;
  const prevEval = sortedEvals.length > 1 ? sortedEvals[sortedEvals.length - 2] : null;

  // Helpers para parsear tiempos de resistencia (ej. "7:14 min" o "07:14")
  const parseSecondsFromTimeStr = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d:]/g, '');
    const parts = clean.split(':');
    if (parts.length === 2) {
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return 0;
  };

  const latestEnduranceSec = latestEval?.enduranceTest?.result ? parseSecondsFromTimeStr(latestEval.enduranceTest.result) : 0;
  const prevEnduranceSec = prevEval?.enduranceTest?.result ? parseSecondsFromTimeStr(prevEval.enduranceTest.result) : 0;
  const enduranceDeltaSec = prevEnduranceSec > 0 && latestEnduranceSec > 0 ? prevEnduranceSec - latestEnduranceSec : 0;
  const endurancePercentImprovement = prevEnduranceSec > 0 && enduranceDeltaSec > 0 ? ((enduranceDeltaSec / prevEnduranceSec) * 100).toFixed(1) : null;

  // Reset Form for New Evaluation
  const handleOpenAddModal = () => {
    if (loggedStaffUser?.name) {
      setEvaluatingCoachName(loggedStaffUser.name);
    } else if (currentUser.role === 'staff') {
      setEvaluatingCoachName(currentUser.name);
    }
    setEvalDate(new Date().toISOString().slice(0, 10));
    setSelectedCooperLevel(latestEval ? (latestEval.cooperTest.levelNumber || 3) : 3);
    setOptionalDistance(latestEval?.cooperTest.distanceMeters || 2200);
    setEnduranceExerciseName(latestEval?.enduranceTest?.name || 'Evaluación de Resistencia Funcional');
    setEnduranceMinutes(7);
    setEnduranceSeconds(0);
    setEnduranceScoreLevel('Intermedio');
    
    // Copy latest 1RMs as baseline or set clean starting weights
    if (latestEval?.strengthRecords) {
      const sq = latestEval.strengthRecords.find(s => s.exerciseId === 'squats');
      if (sq) { setSquatWeight(sq.weightKg); setSquatReps(sq.reps); }
      const dl = latestEval.strengthRecords.find(s => s.exerciseId === 'deadlift');
      if (dl) { setDeadliftWeight(dl.weightKg); setDeadliftReps(dl.reps); }
      const ht = latestEval.strengthRecords.find(s => s.exerciseId === 'hip_thrust');
      if (ht) { setHipThrustWeight(ht.weightKg); setHipThrustReps(ht.reps); }
      const pr = latestEval.strengthRecords.find(s => s.exerciseId === 'horizontal_press');
      if (pr) { setPressWeight(pr.weightKg); setPressReps(pr.reps); }
      const rw = latestEval.strengthRecords.find(s => s.exerciseId === 'pullups_or_rows');
      if (rw) {
        setRowWeight(rw.weightKg);
        setRowReps(rw.reps);
        if (rw.exerciseType) {
          setRowExerciseType(rw.exerciseType);
        } else if (rw.exerciseName.toLowerCase().includes('dominad')) {
          setRowExerciseType('dominadas');
        } else {
          setRowExerciseType('remo');
        }
      }
      setCoachNotes(latestEval.generalCoachNotes || '');
    } else {
      setSquatWeight(40);
      setSquatReps(1);
      setDeadliftWeight(50);
      setDeadliftReps(1);
      setHipThrustWeight(50);
      setHipThrustReps(1);
      setPressWeight(30);
      setPressReps(1);
      setRowWeight(30);
      setRowReps(10);
      setCoachNotes('');
    }
    setShowAddEvalModal(true);
  };

  const [nextAthleteToast, setNextAthleteToast] = useState<string | null>(null);

  const athleteList = allAthletes && allAthletes.length > 0
    ? allAthletes.filter(a => a.role === 'athlete')
    : [];
  const currentAthleteIndex = athleteList.findIndex(a => a.id === currentUser.id);
  const nextAthlete = athleteList.length > 0 && currentAthleteIndex !== -1
    ? athleteList[(currentAthleteIndex + 1) % athleteList.length]
    : (athleteList[0] || null);

  const handleSaveAndNextEvaluation = () => {
    const levelInfo = getCooperLevelInfo(selectedCooperLevel);
    const formattedResult = `${enduranceMinutes.toString().padStart(2, '0')}:${enduranceSeconds.toString().padStart(2, '0')} min`;
    const totalSec = enduranceMinutes * 60 + enduranceSeconds;

    const assignedCoachId = evaluatingCoachName.includes('Leslie') 
      ? 'user-staff-leslie' 
      : evaluatingCoachName.includes('Gus') 
      ? 'user-staff-gus' 
      : 'user-staff-01';

    onAddEvaluation({
      userId: currentUser.id,
      evaluationDate: evalDate,
      coachId: assignedCoachId,
      coachName: evaluatingCoachName,
      cooperTest: {
        level: levelInfo.levelName,
        levelNumber: selectedCooperLevel,
        description: levelInfo.description,
        targetZoneRecommendation: levelInfo.coachingRecommendation,
        distanceMeters: optionalDistance,
        estimatedVo2Max: Number((45.0 + (selectedCooperLevel * 0.9)).toFixed(1)),
        rating: selectedCooperLevel >= 15 ? 'Superior' : selectedCooperLevel >= 10 ? 'Excelente' : selectedCooperLevel >= 6 ? 'Bueno' : 'Regular',
        notes: `Nivel asignado por evaluación técnica oficial: ${levelInfo.badgeLabel}`,
      },
      enduranceTest: {
        name: enduranceExerciseName,
        result: formattedResult,
        timeSeconds: totalSec,
        scoreScoreLevel: enduranceScoreLevel,
        notes: `Reto completado en ${formattedResult}.`,
      },
      strengthRecords: [
        {
          exerciseId: 'squats',
          exerciseName: 'Sentadillas',
          weightKg: squatWeight,
          reps: squatReps,
          estimated1RMKg: calculate1RM(squatWeight, squatReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'deadlift',
          exerciseName: 'Peso Muerto',
          weightKg: deadliftWeight,
          reps: deadliftReps,
          estimated1RMKg: calculate1RM(deadliftWeight, deadliftReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'hip_thrust',
          exerciseName: 'Hip Thrust',
          weightKg: hipThrustWeight,
          reps: hipThrustReps,
          estimated1RMKg: calculate1RM(hipThrustWeight, hipThrustReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'horizontal_press',
          exerciseName: 'Press Horizontal',
          weightKg: pressWeight,
          reps: pressReps,
          estimated1RMKg: calculate1RM(pressWeight, pressReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'pullups_or_rows',
          exerciseName: rowExerciseType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)',
          exerciseType: rowExerciseType,
          weightKg: rowWeight,
          reps: rowReps,
          estimated1RMKg: calculate1RM(rowWeight, rowReps),
          weightUnit: 'kg',
        },
      ],
      generalCoachNotes: coachNotes,
    });

    if (athleteList.length > 0 && onSelectNextAthlete && nextAthlete) {
      const savedName = currentUser.name;
      const targetNext = nextAthlete;
      onSelectNextAthlete(targetNext);
      setNextAthleteToast(`¡Evaluación guardada para ${savedName.split(' ')[0]}! Ahora evaluando a: ${targetNext.name}`);
      setTimeout(() => setNextAthleteToast(null), 4500);
    } else {
      setShowAddEvalModal(false);
    }
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const levelInfo = getCooperLevelInfo(selectedCooperLevel);
    const formattedResult = `${enduranceMinutes.toString().padStart(2, '0')}:${enduranceSeconds.toString().padStart(2, '0')} min`;
    const totalSec = enduranceMinutes * 60 + enduranceSeconds;

    const assignedCoachId = evaluatingCoachName.includes('Leslie') 
      ? 'user-staff-leslie' 
      : evaluatingCoachName.includes('Gus') 
      ? 'user-staff-gus' 
      : 'user-staff-01';

    onAddEvaluation({
      userId: currentUser.id,
      evaluationDate: evalDate,
      coachId: assignedCoachId,
      coachName: evaluatingCoachName,
      cooperTest: {
        level: levelInfo.levelName,
        levelNumber: selectedCooperLevel,
        description: levelInfo.description,
        targetZoneRecommendation: levelInfo.coachingRecommendation,
        distanceMeters: optionalDistance,
        estimatedVo2Max: Number((45.0 + (selectedCooperLevel * 0.9)).toFixed(1)),
        rating: selectedCooperLevel >= 15 ? 'Superior' : selectedCooperLevel >= 10 ? 'Excelente' : selectedCooperLevel >= 6 ? 'Bueno' : 'Regular',
        notes: `Nivel asignado por evaluación técnica oficial: ${levelInfo.badgeLabel}`,
      },
      enduranceTest: {
        name: enduranceExerciseName,
        result: formattedResult,
        timeSeconds: totalSec,
        scoreScoreLevel: enduranceScoreLevel,
        notes: `Reto completado en ${formattedResult}.`,
      },
      strengthRecords: [
        {
          exerciseId: 'squats',
          exerciseName: 'Sentadillas',
          weightKg: squatWeight,
          reps: squatReps,
          estimated1RMKg: calculate1RM(squatWeight, squatReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'deadlift',
          exerciseName: 'Peso Muerto',
          weightKg: deadliftWeight,
          reps: deadliftReps,
          estimated1RMKg: calculate1RM(deadliftWeight, deadliftReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'hip_thrust',
          exerciseName: 'Hip Thrust',
          weightKg: hipThrustWeight,
          reps: hipThrustReps,
          estimated1RMKg: calculate1RM(hipThrustWeight, hipThrustReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'horizontal_press',
          exerciseName: 'Press Horizontal',
          weightKg: pressWeight,
          reps: pressReps,
          estimated1RMKg: calculate1RM(pressWeight, pressReps),
          weightUnit: 'kg',
        },
        {
          exerciseId: 'pullups_or_rows',
          exerciseName: rowExerciseType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)',
          exerciseType: rowExerciseType,
          weightKg: rowWeight,
          reps: rowReps,
          estimated1RMKg: calculate1RM(rowWeight, rowReps),
          weightUnit: 'kg',
        },
      ],
      generalCoachNotes: coachNotes,
    });
    setShowAddEvalModal(false);
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

  return (
    <div className="space-y-4 pb-20 px-3 sm:px-4 pt-2">
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
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Evaluar Atleta (Staff)</span>
            </button>
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
              {prevEval ? (
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
              {enduranceDeltaSec > 0 ? (
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
                const totalCurrent = latestEval.strengthRecords.reduce((acc, r) => acc + r.weightKg, 0);
                const totalPrev = prevEval.strengthRecords.reduce((acc, r) => acc + r.weightKg, 0);
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
                const prevRec = prevEval?.strengthRecords.find(s => s.exerciseId === rec.exerciseId);
                const hasPrev = Boolean(prevRec);
                const deltaKg = hasPrev && prevRec ? rec.weightKg - prevRec.weightKg : null;

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
                        {hasPrev && prevRec ? (
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
          {/* Main Level Showcase Card */}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEST DE RESISTENCIA (POR TIEMPO - RETOS ROTATIVOS FUNCIONALES) */}
      {/* ========================================================================= */}
      {activeTab === 'endurance' && latestEval && (
        <div className="space-y-4">
          {/* Main Endurance Card */}
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
              const prevRec = prevEval?.strengthRecords.find(s => s.exerciseId === rec.exerciseId);
              const prevWeight = prevRec ? prevRec.weightKg : (rec.weightKg > 10 ? rec.weightKg - 10 : rec.weightKg);
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

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 uppercase">1RM Calculado</span>
                      <div className="text-base font-extrabold text-white font-mono tracking-tight">
                        {display1RM} <span className="text-[11px] font-normal text-neutral-400">{weightUnit}</span>
                      </div>
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
                      Nivel {ev.cooperTest.levelNumber || 5}
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">{ev.cooperTest.distanceMeters || 2800}m</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 block truncate">Resistencia</span>
                    <div className="font-extrabold text-emerald-400 font-mono text-sm">
                      {ev.enduranceTest.result}
                    </div>
                    <span className="text-[10px] text-neutral-500 truncate block">{ev.enduranceTest.name}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 block">Sentadilla 1RM</span>
                    <div className="font-extrabold text-[#ff5500] font-mono text-sm">
                      {ev.strengthRecords.find(s => s.exerciseId === 'squats')?.weightKg || 120} kg
                    </div>
                    <span className="text-[10px] text-neutral-500">1RM máx</span>
                  </div>
                </div>

                {ev.generalCoachNotes && (
                  <p className="text-[11px] text-neutral-400 italic bg-neutral-950/60 p-2 rounded-xl">
                    "{ev.generalCoachNotes}"
                  </p>
                )}

                {/* Staff Control Buttons: Editar y Eliminar */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/60">
                  <button
                    onClick={() => {
                      setEditingEval(ev);
                      setEvalDate(ev.evaluationDate);
                      setSelectedCooperLevel(ev.cooperTest.levelNumber || 5);
                      setOptionalDistance(ev.cooperTest.distanceMeters || 2800);
                      setEnduranceExerciseName(ev.enduranceTest.name || 'Evaluación de Resistencia Funcional');
                      const sec = parseSecondsFromTimeStr(ev.enduranceTest.result);
                      setEnduranceMinutes(Math.floor(sec / 60));
                      setEnduranceSeconds(sec % 60);
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVA EVALUACIÓN (STAFF) */}
      {/* ========================================================================= */}
      {showAddEvalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
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
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Athlete Banner & Progress in Rotation */}
            {canEvaluate && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold truncate">
                      Evaluando a Alumno {athleteList.length > 0 && `(${currentAthleteIndex + 1} de ${athleteList.length})`}
                    </span>
                    <strong className="text-white text-sm block truncate">
                      {currentUser.name}
                    </strong>
                  </div>
                </div>
                {nextAthlete && athleteList.length > 1 && (
                  <div className="text-right shrink-0 bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block font-mono">Siguiente Alumno:</span>
                    <span className="text-xs font-bold text-red-400 block">
                      {nextAthlete.name.split(' ')[0]} ⏭️
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* In-Modal Feedback Toast when Advancing to Next Student */}
            {nextAthleteToast && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{nextAthleteToast}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
              {/* Fecha */}
              <div>
                <label className="text-neutral-300 font-medium block mb-1">Fecha de la Prueba</label>
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                  required
                />
              </div>

              {/* SECCIÓN 1: TEST DE COOPER (NIVELES 1 AL 20) */}
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>1. Nivel en Test de Cooper (12 Minutos) — Escala 1 al 20</span>
                  </span>
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
              </div>

              {/* SECCIÓN 2: TEST DE RESISTENCIA POR TIEMPO (RETO ROTATIVO) */}
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>2. Test de Resistencia (Por Tiempo)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {enduranceMinutes.toString().padStart(2, '0')}:{enduranceSeconds.toString().padStart(2, '0')} min
                  </span>
                </div>

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
              </div>

              {/* SECCIÓN 3: FUERZA 1RM (5 EJERCICIOS) */}
              <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span>3. Cargas Máximas 1RM (5 Ejercicios)</span>
                </span>

                <div className="space-y-1.5">
                  {/* Sentadillas */}
                  <div className="grid grid-cols-3 gap-2 items-center bg-neutral-900 p-2 rounded-xl">
                    <span className="text-neutral-300 font-medium text-xs">Sentadillas</span>
                    <input
                      type="number"
                      value={squatWeight}
                      onChange={(e) => setSquatWeight(parseFloat(e.target.value) || 0)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                      placeholder="kg"
                    />
                    <span className="text-[10px] text-neutral-400 text-right">
                      1RM: {calculate1RM(squatWeight, squatReps)}kg
                    </span>
                  </div>

                  {/* Peso Muerto */}
                  <div className="grid grid-cols-3 gap-2 items-center bg-neutral-900 p-2 rounded-xl">
                    <span className="text-neutral-300 font-medium text-xs">Peso Muerto</span>
                    <input
                      type="number"
                      value={deadliftWeight}
                      onChange={(e) => setDeadliftWeight(parseFloat(e.target.value) || 0)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                      placeholder="kg"
                    />
                    <span className="text-[10px] text-neutral-400 text-right">
                      1RM: {calculate1RM(deadliftWeight, deadliftReps)}kg
                    </span>
                  </div>

                  {/* Hip Thrust */}
                  <div className="grid grid-cols-3 gap-2 items-center bg-neutral-900 p-2 rounded-xl">
                    <span className="text-neutral-300 font-medium text-xs">Hip Thrust</span>
                    <input
                      type="number"
                      value={hipThrustWeight}
                      onChange={(e) => setHipThrustWeight(parseFloat(e.target.value) || 0)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                      placeholder="kg"
                    />
                    <span className="text-[10px] text-neutral-400 text-right">
                      1RM: {calculate1RM(hipThrustWeight, hipThrustReps)}kg
                    </span>
                  </div>

                  {/* Press Horizontal */}
                  <div className="grid grid-cols-3 gap-2 items-center bg-neutral-900 p-2 rounded-xl">
                    <span className="text-neutral-300 font-medium text-xs">Press Horiz.</span>
                    <input
                      type="number"
                      value={pressWeight}
                      onChange={(e) => setPressWeight(parseFloat(e.target.value) || 0)}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                      placeholder="kg"
                    />
                    <span className="text-[10px] text-neutral-400 text-right">
                      1RM: {calculate1RM(pressWeight, pressReps)}kg
                    </span>
                  </div>

                  {/* Remo / Dominadas */}
                  {/* 5. Remo o Dominadas con selector y peso */}
                  <div className="bg-neutral-900 p-2.5 rounded-xl space-y-2 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                        <span>5. Tracción (Remo o Dominadas)</span>
                      </span>

                      {/* Selector de Ejercicio */}
                      <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setRowExerciseType('remo')}
                          className={`px-2.5 py-1 rounded font-bold transition-all ${
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
                          className={`px-2.5 py-1 rounded font-bold transition-all ${
                            rowExerciseType === 'dominadas'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Dominadas
                        </button>
                      </div>
                    </div>

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

              {/* Action Buttons */}
              <div className="pt-3 space-y-2">
                {/* Botón Principal Solicitado: Guardar y Siguiente Alumno */}
                {canEvaluate && athleteList.length > 1 && onSelectNextAthlete && nextAthlete && (
                  <button
                    type="button"
                    onClick={handleSaveAndNextEvaluation}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-95 transition-all"
                  >
                    <span>Guardar y Evaluar Siguiente Alumno</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-medium text-red-100">
                      👉 Evaluar a: {nextAthlete.name.split(' ')[0]}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEvalModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors text-xs"
                  >
                    Cancelar / Volver
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-md shadow-blue-500/20 text-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardar Este Solo</span>
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-medium">Nivel Cooper (1 al 20)</label>
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
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="font-bold text-white block">Resistencia (Tiempo)</span>
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-0.5">Reto</label>
                  <input
                    type="text"
                    value={enduranceExerciseName}
                    onChange={(e) => setEnduranceExerciseName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                </div>
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
                    const formattedResult = `${enduranceMinutes.toString().padStart(2, '0')}:${enduranceSeconds.toString().padStart(2, '0')} min`;
                    const levelInfo = getCooperLevelInfo(selectedCooperLevel);
                    onUpdateEvaluation(editingEval.id, {
                      evaluationDate: evalDate,
                      cooperTest: {
                        ...editingEval.cooperTest,
                        level: levelInfo.levelName,
                        levelNumber: selectedCooperLevel,
                        description: levelInfo.description,
                      },
                      enduranceTest: {
                        ...editingEval.enduranceTest,
                        name: enduranceExerciseName,
                        result: formattedResult,
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
    </div>
  );
};
