import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  PhysicalEvaluationRecord, 
  EvaluationStatus, 
  CooperTestVariant,
  StrengthMaxRecord,
  CooperTestRecord,
  EnduranceTimeTestRecord
} from '../../types';
import { calculate1RM, COOPER_LEVELS_CATALOG } from '../../utils/fitnessCalculations';
import { UserAvatar } from '../common/UserAvatar';
import { 
  X, 
  Save, 
  Search, 
  Filter, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Dumbbell, 
  Zap, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Pencil
} from 'lucide-react';

interface BatchEvaluationGridViewProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  evaluations: PhysicalEvaluationRecord[];
  activeStaff: UserProfile;
  globalEvalDate: string;
  onAddEvaluation?: (evaluation: Omit<PhysicalEvaluationRecord, 'id'>) => void;
  onUpdateEvaluation?: (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => void;
  onSendNotification?: (title: string, body: string, userIds?: string[]) => void;
  onOpenIndividualEdit?: (athlete: UserProfile) => void;
}

export const NA_REASON_PRESETS = [
  'Ingreso posterior a fecha de pruebas',
  'Adulto mayor / Exento por edad',
  'Etapa formativa infantil',
  'Lesión / Incapacidad médica temporal',
  'Baja temporal / Ausencia justificada',
];

interface AthleteRowState {
  userId: string;
  isModified: boolean;
  isAllNA: boolean;
  globalNAReason: string;
  // Aeróbico
  cooperStatus: EvaluationStatus;
  cooperVariant: CooperTestVariant; // 'standard' | 'laps' | 'navette'
  cooperDistance: number;
  cooperLaps: number;
  cooperTrack: 'afuera' | 'adentro';
  cooperMetersPerLap: number;
  cooperNavetteLevel: number;
  cooperReason: string;
  // Resistencia
  enduranceStatus: EvaluationStatus;
  enduranceMinutes: number;
  enduranceSeconds: number;
  enduranceDifficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  enduranceReason: string;
  // Fuerza (5 ejercicios)
  squatsWeight: number;
  squatsStatus: EvaluationStatus;
  squatsReason: string;
  deadliftWeight: number;
  deadliftStatus: EvaluationStatus;
  deadliftReason: string;
  hipThrustWeight: number;
  hipThrustStatus: EvaluationStatus;
  hipThrustReason: string;
  pressWeight: number;
  pressStatus: EvaluationStatus;
  pressReason: string;
  pullupsOrRowsType: 'remo' | 'dominadas';
  pullupsOrRowsWeight: number;
  pullupsOrRowsStatus: EvaluationStatus;
  pullupsOrRowsReason: string;
  // Notas
  coachNotes: string;
  existingEvalId?: string;
}

export const BatchEvaluationGridView: React.FC<BatchEvaluationGridViewProps> = ({
  isOpen,
  onClose,
  users,
  evaluations,
  activeStaff,
  globalEvalDate,
  onAddEvaluation,
  onUpdateEvaluation,
  onSendNotification,
  onOpenIndividualEdit,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(globalEvalDate || new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<'all' | 5 | 15 | 20 | 30>('all');
  const [rows, setRows] = useState<Record<string, AthleteRowState>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);
  
  // Modal de NA General rápido por fila
  const [activeNAModalUserId, setActiveNAModalUserId] = useState<string | null>(null);
  const [customNAReason, setCustomNAReason] = useState<string>('');

  // Modal de NA General masivo para todos los visibles
  const [showBatchNAModal, setShowBatchNAModal] = useState<boolean>(false);
  const [batchNAReason, setBatchNAReason] = useState<string>('Ingreso posterior a fecha de pruebas');

  const athletes = useMemo(() => {
    return users.filter(u => u.role === 'athlete');
  }, [users]);

  // Inicializar o sincronizar el estado de las filas según la fecha seleccionada
  useEffect(() => {
    if (!isOpen) return;

    const newRows: Record<string, AthleteRowState> = {};

    athletes.forEach(ath => {
      // 1. Buscar si ya existe una evaluación en esa fecha exacta
      const existingInDate = evaluations.find(e => e.userId === ath.id && e.evaluationDate === selectedDate);
      
      // 2. Si no, buscar la última evaluación anterior para sugerir valores
      const userPastEvals = evaluations.filter(e => e.userId === ath.id);
      const sortedPast = [...userPastEvals].sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
      const latest = existingInDate || sortedPast[0];

      const isFemale = ath.gender === 'female';

      if (existingInDate) {
        // Precargar con los datos existentes
        const coop = existingInDate.cooperTest;
        const end = existingInDate.enduranceTest;
        const sq = existingInDate.strengthRecords?.find(r => r.exerciseId === 'squats');
        const dl = existingInDate.strengthRecords?.find(r => r.exerciseId === 'deadlift');
        const ht = existingInDate.strengthRecords?.find(r => r.exerciseId === 'hip_thrust');
        const hp = existingInDate.strengthRecords?.find(r => r.exerciseId === 'horizontal_press');
        const rw = existingInDate.strengthRecords?.find(r => r.exerciseId === 'pullups_or_rows');

        const isLaps = coop?.variant === 'laps' || (typeof coop?.lapsCount === 'number' && coop.lapsCount > 0);
        const isNavette = coop?.variant === 'navette';

        const totalSec = typeof end?.timeSeconds === 'number' ? end.timeSeconds : 180;

        const isAllNA = coop?.status === 'na' && end?.status === 'na' &&
          sq?.status === 'na' && dl?.status === 'na' && ht?.status === 'na' &&
          hp?.status === 'na' && rw?.status === 'na';

        newRows[ath.id] = {
          userId: ath.id,
          isModified: false,
          isAllNA,
          globalNAReason: coop?.statusReason || '',
          cooperStatus: coop?.status || 'completed',
          cooperVariant: isNavette ? 'navette' : isLaps ? 'laps' : 'standard',
          cooperDistance: coop?.distanceMeters || (isFemale ? 1800 : 2200),
          cooperLaps: coop?.lapsCount || 5.5,
          cooperTrack: coop?.lapLocation === 'inside' ? 'adentro' : 'afuera',
          cooperMetersPerLap: coop?.metersPerLap || (coop?.lapLocation === 'inside' ? 250 : 400),
          cooperNavetteLevel: coop?.levelNumber || 5,
          cooperReason: coop?.statusReason || '',
          enduranceStatus: end?.status || 'completed',
          enduranceMinutes: Math.floor(totalSec / 60),
          enduranceSeconds: totalSec % 60,
          enduranceDifficulty: end?.difficultyLevel || 'Intermedio',
          enduranceReason: end?.statusReason || '',
          squatsWeight: sq?.weightKg || (isFemale ? 45 : 60),
          squatsStatus: sq?.status || 'completed',
          squatsReason: sq?.statusReason || '',
          deadliftWeight: dl?.weightKg || (isFemale ? 60 : 80),
          deadliftStatus: dl?.status || 'completed',
          deadliftReason: dl?.statusReason || '',
          hipThrustWeight: ht?.weightKg || (isFemale ? 65 : 70),
          hipThrustStatus: ht?.status || 'completed',
          hipThrustReason: ht?.statusReason || '',
          pressWeight: hp?.weightKg || (isFemale ? 30 : 50),
          pressStatus: hp?.status || 'completed',
          pressReason: hp?.statusReason || '',
          pullupsOrRowsType: rw?.exerciseType === 'dominadas' ? 'dominadas' : 'remo',
          pullupsOrRowsWeight: rw?.weightKg || (isFemale ? 35 : 50),
          pullupsOrRowsStatus: rw?.status || 'completed',
          pullupsOrRowsReason: rw?.statusReason || '',
          coachNotes: existingInDate.generalCoachNotes || '',
          existingEvalId: existingInDate.id,
        };
      } else if (latest) {
        // Sugerir datos de su último ciclo pero como nuevo registro a guardar
        const coop = latest.cooperTest;
        const end = latest.enduranceTest;
        const sq = latest.strengthRecords?.find(r => r.exerciseId === 'squats');
        const dl = latest.strengthRecords?.find(r => r.exerciseId === 'deadlift');
        const ht = latest.strengthRecords?.find(r => r.exerciseId === 'hip_thrust');
        const hp = latest.strengthRecords?.find(r => r.exerciseId === 'horizontal_press');
        const rw = latest.strengthRecords?.find(r => r.exerciseId === 'pullups_or_rows');

        const totalSec = typeof end?.timeSeconds === 'number' ? end.timeSeconds : 180;

        newRows[ath.id] = {
          userId: ath.id,
          isModified: false,
          isAllNA: false,
          globalNAReason: '',
          cooperStatus: 'completed',
          cooperVariant: coop?.variant || 'standard',
          cooperDistance: coop?.distanceMeters || (isFemale ? 1800 : 2200),
          cooperLaps: coop?.lapsCount || 5.5,
          cooperTrack: coop?.lapLocation === 'inside' ? 'adentro' : 'afuera',
          cooperMetersPerLap: coop?.metersPerLap || 400,
          cooperNavetteLevel: coop?.levelNumber || 5,
          cooperReason: '',
          enduranceStatus: 'completed',
          enduranceMinutes: Math.floor(totalSec / 60),
          enduranceSeconds: totalSec % 60,
          enduranceDifficulty: end?.difficultyLevel || 'Intermedio',
          enduranceReason: '',
          squatsWeight: sq?.weightKg || (isFemale ? 45 : 60),
          squatsStatus: 'completed',
          squatsReason: '',
          deadliftWeight: dl?.weightKg || (isFemale ? 60 : 80),
          deadliftStatus: 'completed',
          deadliftReason: '',
          hipThrustWeight: ht?.weightKg || (isFemale ? 65 : 70),
          hipThrustStatus: 'completed',
          hipThrustReason: '',
          pressWeight: hp?.weightKg || (isFemale ? 30 : 50),
          pressStatus: 'completed',
          pressReason: '',
          pullupsOrRowsType: rw?.exerciseType === 'dominadas' ? 'dominadas' : 'remo',
          pullupsOrRowsWeight: rw?.weightKg || (isFemale ? 35 : 50),
          pullupsOrRowsStatus: 'completed',
          pullupsOrRowsReason: '',
          coachNotes: '',
        };
      } else {
        // Atleta nuevo sin historial
        newRows[ath.id] = {
          userId: ath.id,
          isModified: false,
          isAllNA: false,
          globalNAReason: '',
          cooperStatus: 'completed',
          cooperVariant: 'standard',
          cooperDistance: isFemale ? 1800 : 2200,
          cooperLaps: 5.5,
          cooperTrack: 'afuera',
          cooperMetersPerLap: 400,
          cooperNavetteLevel: 5,
          cooperReason: '',
          enduranceStatus: 'completed',
          enduranceMinutes: 3,
          enduranceSeconds: 0,
          enduranceDifficulty: 'Intermedio',
          enduranceReason: '',
          squatsWeight: isFemale ? 45 : 60,
          squatsStatus: 'completed',
          squatsReason: '',
          deadliftWeight: isFemale ? 60 : 80,
          deadliftStatus: 'completed',
          deadliftReason: '',
          hipThrustWeight: isFemale ? 65 : 70,
          hipThrustStatus: 'completed',
          hipThrustReason: '',
          pressWeight: isFemale ? 30 : 50,
          pressStatus: 'completed',
          pressReason: '',
          pullupsOrRowsType: 'remo',
          pullupsOrRowsWeight: isFemale ? 35 : 50,
          pullupsOrRowsStatus: 'completed',
          pullupsOrRowsReason: '',
          coachNotes: '',
        };
      }
    });

    setRows(newRows);
  }, [isOpen, selectedDate, athletes, evaluations]);

  // Filtrado de atletas visibles
  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (colorFilter === 'all') return true;
      return (a.membership?.billingDayOfMonth || 15) === colorFilter;
    });
  }, [athletes, searchQuery, colorFilter]);

  // Actualizar un campo de la fila
  const updateRow = (userId: string, updates: Partial<AthleteRowState>) => {
    setRows(prev => {
      const current = prev[userId];
      if (!current) return prev;
      return {
        ...prev,
        [userId]: {
          ...current,
          ...updates,
          isModified: true,
        }
      };
    });
  };

  // Aplicar NA General a un atleta individual
  const applyAthleteGlobalNA = (userId: string, reason: string = 'Ingreso posterior a fecha de pruebas') => {
    updateRow(userId, {
      isAllNA: true,
      globalNAReason: reason,
      cooperStatus: 'na',
      cooperReason: reason,
      enduranceStatus: 'na',
      enduranceReason: reason,
      squatsStatus: 'na',
      squatsReason: reason,
      deadliftStatus: 'na',
      deadliftReason: reason,
      hipThrustStatus: 'na',
      hipThrustReason: reason,
      pressStatus: 'na',
      pressReason: reason,
      pullupsOrRowsStatus: 'na',
      pullupsOrRowsReason: reason,
      coachNotes: reason ? `NA General: ${reason}` : 'Periodo exento con NA General.',
    });
    setActiveNAModalUserId(null);
  };

  // Restaurar pruebas de un atleta a completadas
  const restoreAthleteToCompleted = (userId: string) => {
    updateRow(userId, {
      isAllNA: false,
      globalNAReason: '',
      cooperStatus: 'completed',
      cooperReason: '',
      enduranceStatus: 'completed',
      enduranceReason: '',
      squatsStatus: 'completed',
      squatsReason: '',
      deadliftStatus: 'completed',
      deadliftReason: '',
      hipThrustStatus: 'completed',
      hipThrustReason: '',
      pressStatus: 'completed',
      pressReason: '',
      pullupsOrRowsStatus: 'completed',
      pullupsOrRowsReason: '',
      coachNotes: '',
    });
  };

  // Aplicar NA General a todos los atletas visibles
  const applyBatchGlobalNA = (reason: string) => {
    filteredAthletes.forEach(ath => {
      applyAthleteGlobalNA(ath.id, reason);
    });
    setShowBatchNAModal(false);
  };

  // Calcular nivel y detalles de Cooper a partir de distancia o modo
  const calculateCooperDetails = (row: AthleteRowState) => {
    if (row.cooperStatus !== 'completed') {
      return {
        level: row.cooperStatus === 'na' ? 'NA (No Aplica)' : 'NP (No Presentada)',
        levelNumber: 0,
        description: row.cooperReason || 'Prueba exenta este ciclo.',
        targetZoneRecommendation: 'Acondicionamiento físico general adaptado.',
        distanceMeters: 0,
        estimatedVo2Max: 0,
        rating: undefined,
      };
    }

    if (row.cooperVariant === 'navette') {
      const lvl = Math.max(1, Math.min(20, row.cooperNavetteLevel || 5));
      const catalog = COOPER_LEVELS_CATALOG[lvl] || COOPER_LEVELS_CATALOG[5];
      return {
        level: `Nivel ${lvl} (Course Navette)`,
        levelNumber: lvl,
        description: `Rendimiento aeróbico en Course Navette: ${catalog.description}`,
        targetZoneRecommendation: catalog.coachingRecommendation,
        distanceMeters: lvl * 140,
        estimatedVo2Max: Number((lvl * 3.5 + 20).toFixed(1)),
        rating: undefined,
      };
    }

    let dist = row.cooperDistance;
    if (row.cooperVariant === 'laps') {
      dist = Math.round((row.cooperLaps || 0) * (row.cooperMetersPerLap || 400));
    }

    // Determinar nivel 1 al 20
    let levelNum = 1;
    if (dist < 1500) levelNum = 1;
    else if (dist < 1650) levelNum = 2;
    else if (dist < 1800) levelNum = 3;
    else if (dist < 1950) levelNum = 4;
    else if (dist < 2100) levelNum = 5;
    else if (dist < 2250) levelNum = 6;
    else if (dist < 2350) levelNum = 7;
    else if (dist < 2450) levelNum = 8;
    else if (dist < 2550) levelNum = 9;
    else if (dist < 2650) levelNum = 10;
    else if (dist < 2750) levelNum = 11;
    else if (dist < 2850) levelNum = 12;
    else if (dist < 2950) levelNum = 13;
    else if (dist < 3050) levelNum = 14;
    else if (dist < 3150) levelNum = 15;
    else if (dist < 3250) levelNum = 16;
    else if (dist < 3350) levelNum = 17;
    else if (dist < 3450) levelNum = 18;
    else if (dist < 3550) levelNum = 19;
    else levelNum = 20;

    const catalog = COOPER_LEVELS_CATALOG[levelNum] || COOPER_LEVELS_CATALOG[5];
    const vo2max = Number(((dist - 504.9) / 44.73).toFixed(1));

    return {
      level: row.cooperVariant === 'laps' ? `Cooper 2 · Nivel ${levelNum}` : catalog.levelName,
      levelNumber: levelNum,
      description: catalog.description,
      targetZoneRecommendation: catalog.coachingRecommendation,
      distanceMeters: dist,
      estimatedVo2Max: Math.max(0, vo2max),
      rating: undefined,
    };
  };

  // Guardar todas las evaluaciones de la grilla
  const handleSaveAllEvaluations = async () => {
    if (!onAddEvaluation && !onUpdateEvaluation) return;
    setIsSaving(true);

    let savedCount = 0;

    for (const ath of athletes) {
      const row = rows[ath.id];
      if (!row) continue;

      // Calcular detalles de Cooper
      const coopDetails = calculateCooperDetails(row);
      const cooperRecord: CooperTestRecord = {
        level: coopDetails.level,
        levelNumber: coopDetails.levelNumber,
        description: coopDetails.description,
        targetZoneRecommendation: coopDetails.targetZoneRecommendation,
        distanceMeters: coopDetails.distanceMeters,
        estimatedVo2Max: coopDetails.estimatedVo2Max,
        rating: coopDetails.rating,
        status: row.cooperStatus,
        statusReason: row.cooperReason || undefined,
        variant: row.cooperVariant,
        lapLocation: row.cooperVariant === 'laps' ? (row.cooperTrack === 'afuera' ? 'outside' : 'inside') : undefined,
        lapsCount: row.cooperVariant === 'laps' ? row.cooperLaps : undefined,
        metersPerLap: row.cooperVariant === 'laps' ? row.cooperMetersPerLap : undefined,
        notes: row.cooperVariant === 'laps' 
          ? `Cooper 2 por Vueltas: ${row.cooperLaps} vueltas en circuito ${row.cooperTrack} (${row.cooperMetersPerLap}m/v = ${coopDetails.distanceMeters}m).`
          : undefined,
      };

      // Resistencia
      const totalSec = row.enduranceMinutes * 60 + row.enduranceSeconds;
      const minStr = String(row.enduranceMinutes).padStart(2, '0');
      const secStr = String(row.enduranceSeconds).padStart(2, '0');
      const enduranceRecord: EnduranceTimeTestRecord = {
        name: 'Evaluación de Resistencia Funcional',
        result: row.enduranceStatus === 'completed' ? `${minStr}:${secStr} min` : (row.enduranceStatus === 'na' ? 'NA' : 'NP'),
        timeSeconds: row.enduranceStatus === 'completed' ? totalSec : 0,
        difficultyLevel: row.enduranceDifficulty,
        status: row.enduranceStatus,
        statusReason: row.enduranceReason || undefined,
      };

      // Fuerza 1RM (5 ejercicios)
      const strengthRecords: StrengthMaxRecord[] = [
        {
          exerciseId: 'squats',
          exerciseName: 'Sentadillas',
          weightKg: row.squatsStatus === 'completed' ? row.squatsWeight : 0,
          reps: row.squatsStatus === 'completed' ? 1 : 0,
          estimated1RMKg: row.squatsStatus === 'completed' ? calculate1RM(row.squatsWeight, 1) : 0,
          weightUnit: 'kg',
          status: row.squatsStatus,
          statusReason: row.squatsReason || undefined,
        },
        {
          exerciseId: 'deadlift',
          exerciseName: 'Peso Muerto',
          weightKg: row.deadliftStatus === 'completed' ? row.deadliftWeight : 0,
          reps: row.deadliftStatus === 'completed' ? 1 : 0,
          estimated1RMKg: row.deadliftStatus === 'completed' ? calculate1RM(row.deadliftWeight, 1) : 0,
          weightUnit: 'kg',
          status: row.deadliftStatus,
          statusReason: row.deadliftReason || undefined,
        },
        {
          exerciseId: 'hip_thrust',
          exerciseName: 'Hip Thrust',
          weightKg: row.hipThrustStatus === 'completed' ? row.hipThrustWeight : 0,
          reps: row.hipThrustStatus === 'completed' ? 1 : 0,
          estimated1RMKg: row.hipThrustStatus === 'completed' ? calculate1RM(row.hipThrustWeight, 1) : 0,
          weightUnit: 'kg',
          status: row.hipThrustStatus,
          statusReason: row.hipThrustReason || undefined,
        },
        {
          exerciseId: 'horizontal_press',
          exerciseName: 'Press Horizontal',
          weightKg: row.pressStatus === 'completed' ? row.pressWeight : 0,
          reps: row.pressStatus === 'completed' ? 1 : 0,
          estimated1RMKg: row.pressStatus === 'completed' ? calculate1RM(row.pressWeight, 1) : 0,
          weightUnit: 'kg',
          status: row.pressStatus,
          statusReason: row.pressReason || undefined,
        },
        {
          exerciseId: 'pullups_or_rows',
          exerciseName: row.pullupsOrRowsType === 'remo' ? 'Remo con Barra' : 'Dominadas (Pull-ups)',
          exerciseType: row.pullupsOrRowsType,
          weightKg: row.pullupsOrRowsStatus === 'completed' ? row.pullupsOrRowsWeight : 0,
          reps: row.pullupsOrRowsStatus === 'completed' ? 1 : 0,
          estimated1RMKg: row.pullupsOrRowsStatus === 'completed' ? calculate1RM(row.pullupsOrRowsWeight, 1) : 0,
          weightUnit: 'kg',
          status: row.pullupsOrRowsStatus,
          statusReason: row.pullupsOrRowsReason || undefined,
        },
      ];

      const payload = {
        userId: ath.id,
        evaluationDate: selectedDate,
        coachId: activeStaff.id,
        coachName: activeStaff.name,
        cooperTest: cooperRecord,
        enduranceTest: enduranceRecord,
        strengthRecords,
        generalCoachNotes: row.coachNotes.trim(),
      };

      if (row.existingEvalId && onUpdateEvaluation) {
        onUpdateEvaluation(row.existingEvalId, payload);
      } else if (onAddEvaluation) {
        onAddEvaluation(payload);
      }
      savedCount++;
    }

    setIsSaving(false);
    setSaveSuccessMsg(`¡Se guardaron y actualizaron las evaluaciones de ${savedCount} atletas en la fecha ${selectedDate}!`);

    if (onSendNotification) {
      onSendNotification(
        '📊 Resultados Oficiales de Pruebas Físicas Kinetix',
        `El equipo de coaches ha actualizado las evaluaciones oficiales del ciclo (${selectedDate}). Entra a tu perfil para ver tus niveles, PRs y recomendaciones.`,
        athletes.map(a => a.id)
      );
    }

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  const modifiedCount = useMemo(() => {
    return Object.values(rows).filter(r => r.isModified).length;
  }, [rows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fadeIn">
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR FIJA: TITULO, FECHA, BUSCADOR Y BOTONES CLAVE */}
      {/* ========================================================================= */}
      <header className="bg-neutral-900 border-b border-neutral-800 p-3 sm:p-4 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Título & Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-white font-brand">
                    Sábana de Evaluación Masiva Kinetix
                  </h2>
                  <span className="text-[10px] bg-amber-500 text-neutral-950 font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    Evaluar a Todos ⚡
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Ingresa marcas de todos los atletas de un solo jalón sin ir alumno por alumno.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="md:hidden text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Selector de Fecha + Botón NA Masivo + Guardar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Fecha Oficial */}
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-700">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px] text-neutral-400 font-semibold">Fecha:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs font-bold outline-none cursor-pointer"
              />
            </div>

            {/* Botón NA Masivo para visibles */}
            <button
              type="button"
              onClick={() => setShowBatchNAModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
              title="Marcar todos los alumnos mostrados en NA General"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span>NA Masivo ({filteredAthletes.length})</span>
            </button>

            {/* Botón Guardar Todos */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAllEvaluations}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : `Guardar Todos (${athletes.length} Alumnos)`}</span>
              {modifiedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                  {modifiedCount} editados
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors"
              title="Cerrar Sábana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 pt-2.5 border-t border-neutral-800/80 mt-2.5 flex-wrap">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre de alumno..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por fecha de corte */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <span className="text-[10px] text-neutral-500 shrink-0 font-medium">Corte de Pago:</span>
            <button
              type="button"
              onClick={() => setColorFilter('all')}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                colorFilter === 'all'
                  ? 'bg-neutral-700 text-white border-neutral-600'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({athletes.length})
            </button>
            {([5, 15, 20, 30] as const).map(day => {
              const count = athletes.filter(a => (a.membership?.billingDayOfMonth || 15) === day).length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setColorFilter(day)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                    colorFilter === day
                      ? day === 5 ? 'bg-amber-500 text-black border-amber-400' :
                        day === 15 ? 'bg-blue-600 text-white border-blue-400' :
                        day === 20 ? 'bg-red-600 text-white border-red-400' :
                        'bg-purple-600 text-white border-purple-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Día {day} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Alerta de Éxito al Guardar */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950/90 border-b border-emerald-500 p-3 text-center text-xs font-bold text-emerald-200 flex items-center justify-center gap-2 animate-fadeIn shadow-lg shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUERPO PRINCIPAL: TABLA / LISTA DE SÁBANA INTERACTIVA */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        <div className="max-w-7xl mx-auto space-y-3">
          {filteredAthletes.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900 rounded-3xl border border-neutral-800 text-neutral-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-white">No se encontraron atletas</p>
              <p className="text-xs">Prueba cambiando el término de búsqueda o el filtro de corte.</p>
            </div>
          ) : (
            filteredAthletes.map((athlete) => {
              const row = rows[athlete.id];
              if (!row) return null;

              const isFemale = athlete.gender === 'female';
              const isExpanded = expandedAthleteId === athlete.id;

              return (
                <div
                  key={athlete.id}
                  className={`rounded-2xl border transition-all ${
                    row.isAllNA
                      ? 'bg-amber-950/20 border-amber-800/60 shadow-sm'
                      : row.isModified
                      ? 'bg-neutral-900 border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Fila Encabezado de Atleta */}
                  <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800/70">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={athlete.name}
                        avatarUrl={athlete.avatarUrl}
                        role={athlete.role}
                        sizeClassName="w-10 h-10"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm text-white font-bold">{athlete.name}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            ({isFemale ? 'Mujer' : 'Hombre'})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            (athlete.membership?.billingDayOfMonth || 15) === 5 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            (athlete.membership?.billingDayOfMonth || 15) === 15 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            (athlete.membership?.billingDayOfMonth || 15) === 20 ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}>
                            Corte Día {athlete.membership?.billingDayOfMonth || 15}
                          </span>
                          {row.existingEvalId ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                              Registro Existente
                            </span>
                          ) : (
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold">
                              Nuevo Registro
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate max-w-sm">
                          {athlete.email}
                        </p>
                      </div>
                    </div>

                    {/* Acciones Rápidas de Fila: NA General & Acordeón Móvil */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {row.isAllNA ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-1 rounded-xl border border-amber-500/30 font-bold flex items-center gap-1">
                            <span>🚫 NA General</span>
                            {row.globalNAReason && (
                              <span className="text-[10px] text-neutral-300 font-normal">({row.globalNAReason})</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => restoreAthleteToCompleted(athlete.id)}
                            className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 active:scale-95 transition-all"
                            title="Restaurar pruebas a calificadas"
                          >
                            Restaurar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveNAModalUserId(athlete.id)}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                          title="Marcar todas las pruebas de este atleta como NA (No Aplica)"
                        >
                          <Zap className="w-3 h-3 fill-amber-400" />
                          <span>🚫 Marcar NA General</span>
                        </button>
                      )}

                      {onOpenIndividualEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenIndividualEdit(athlete);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                          title="Abrir ficha individual completa para editar o corregir cualquier marca de este alumno"
                        >
                          <Pencil className="w-3 h-3 text-blue-400" />
                          <span>Editar Ficha</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedAthleteId(isExpanded ? null : athlete.id)}
                        className="md:hidden p-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Columnas de Datos (Siempre visibles en desktop, colapsables en móvil) */}
                  <div className={`p-3 sm:p-4 space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                      {/* ========================================== */}
                      {/* 1. AERÓBICO: COOPER / NAVETTE (Cols 4) */}
                      {/* ========================================== */}
                      <div className="md:col-span-4 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-white text-xs flex items-center gap-1 font-bold">
                            <span>🏃 Aeróbico</span>
                          </strong>
                          {/* Status buttons */}
                          <div className="flex items-center gap-1">
                            {(['completed', 'na', 'np'] as const).map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => updateRow(athlete.id, { cooperStatus: st })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  row.cooperStatus === st
                                    ? st === 'completed'
                                      ? 'bg-blue-600 text-white'
                                      : st === 'na'
                                      ? 'bg-amber-500 text-neutral-950'
                                      : 'bg-red-700 text-white'
                                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {st === 'completed' ? 'Ok' : st.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {row.cooperStatus === 'completed' ? (
                          <div className="space-y-2">
                            {/* Variant selector */}
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800">
                              <button
                                type="button"
                                onClick={() => updateRow(athlete.id, { cooperVariant: 'standard' })}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  row.cooperVariant === 'standard' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Cooper 12m
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRow(athlete.id, { cooperVariant: 'laps' })}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  row.cooperVariant === 'laps' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Cooper 2 (Vueltas)
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRow(athlete.id, { cooperVariant: 'navette' })}
                                className={`flex-1 py-1 rounded text-[10px] font-bold ${
                                  row.cooperVariant === 'navette' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Navette
                              </button>
                            </div>

                            {/* Inputs según variante */}
                            {row.cooperVariant === 'standard' && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-neutral-400">Metros recorridos:</span>
                                <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-700">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={row.cooperDistance === 0 ? '' : row.cooperDistance}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      updateRow(athlete.id, { cooperDistance: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-16 bg-transparent text-right font-mono font-bold text-white text-xs outline-none"
                                  />
                                  <span className="text-[10px] text-neutral-400">m</span>
                                </div>
                              </div>
                            )}

                            {row.cooperVariant === 'laps' && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-neutral-400">Vueltas:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={row.cooperLaps === 0 ? '' : row.cooperLaps}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      updateRow(athlete.id, { cooperLaps: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-14 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded text-center font-mono font-bold text-white text-xs outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] text-neutral-400">Pista:</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => updateRow(athlete.id, { cooperTrack: 'afuera', cooperMetersPerLap: 400 })}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${row.cooperTrack === 'afuera' ? 'bg-emerald-600 text-white font-bold' : 'bg-neutral-900 text-neutral-400'}`}
                                    >
                                      Afuera (400m)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateRow(athlete.id, { cooperTrack: 'adentro', cooperMetersPerLap: 250 })}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${row.cooperTrack === 'adentro' ? 'bg-emerald-600 text-white font-bold' : 'bg-neutral-900 text-neutral-400'}`}
                                    >
                                      Adentro (250m)
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400 pt-0.5">
                                  <span>Metros/vuelta:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={row.cooperMetersPerLap === 0 ? '' : row.cooperMetersPerLap}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                      updateRow(athlete.id, { cooperMetersPerLap: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-12 bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-center font-mono text-white text-[10px] outline-none"
                                  />
                                  <span className="font-mono text-emerald-400 font-bold">
                                    Total: {Math.round((row.cooperLaps || 0) * (row.cooperMetersPerLap || 400))}m
                                  </span>
                                </div>
                              </div>
                            )}

                            {row.cooperVariant === 'navette' && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-neutral-400">Nivel Navette (1 al 20):</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={row.cooperNavetteLevel}
                                  onChange={(e) => updateRow(athlete.id, { cooperNavetteLevel: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                                  className="w-14 bg-neutral-900 border border-neutral-700 px-2 py-1 rounded-lg text-center font-mono font-bold text-white text-xs outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={row.cooperReason}
                            onChange={(e) => updateRow(athlete.id, { cooperReason: e.target.value })}
                            placeholder="Motivo (o dejar en blanco)..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[10px] text-white outline-none"
                          />
                        )}
                      </div>

                      {/* ========================================== */}
                      {/* 2. RESISTENCIA FUNCIONAL (Cols 3) */}
                      {/* ========================================== */}
                      <div className="md:col-span-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-white text-xs flex items-center gap-1 font-bold">
                            <span>⏱️ Resistencia</span>
                          </strong>
                          <div className="flex items-center gap-1">
                            {(['completed', 'na', 'np'] as const).map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => updateRow(athlete.id, { enduranceStatus: st })}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  row.enduranceStatus === st
                                    ? st === 'completed'
                                      ? 'bg-blue-600 text-white'
                                      : st === 'na'
                                      ? 'bg-amber-500 text-neutral-950'
                                      : 'bg-red-700 text-white'
                                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {st === 'completed' ? 'Ok' : st.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {row.enduranceStatus === 'completed' ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-neutral-400">Tiempo:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={row.enduranceMinutes}
                                  onChange={(e) => updateRow(athlete.id, { enduranceMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                                  className="w-10 bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-center font-mono font-bold text-white text-xs outline-none"
                                />
                                <span className="text-neutral-400 font-mono">:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={row.enduranceSeconds}
                                  onChange={(e) => updateRow(athlete.id, { enduranceSeconds: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)) })}
                                  className="w-10 bg-neutral-900 border border-neutral-700 px-1 py-0.5 rounded text-center font-mono font-bold text-white text-xs outline-none"
                                />
                                <span className="text-[10px] text-neutral-400">min</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="text-neutral-400">Nivel:</span>
                              <select
                                value={row.enduranceDifficulty}
                                onChange={(e) => updateRow(athlete.id, { enduranceDifficulty: e.target.value as any })}
                                className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] text-white outline-none font-bold"
                              >
                                <option value="Principiante">Principiante</option>
                                <option value="Intermedio">Intermedio</option>
                                <option value="Avanzado">Avanzado</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={row.enduranceReason}
                            onChange={(e) => updateRow(athlete.id, { enduranceReason: e.target.value })}
                            placeholder="Motivo (o dejar en blanco)..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[10px] text-white outline-none"
                          />
                        )}
                      </div>

                      {/* ========================================== */}
                      {/* 3. FUERZA 1RM (5 EJERCICIOS) (Cols 5) */}
                      {/* ========================================== */}
                      <div className="md:col-span-5 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-white text-xs flex items-center gap-1 font-bold">
                            <span>🏋️ Fuerza 1RM (5 Ejercicios)</span>
                          </strong>
                          <span className="text-[10px] text-neutral-400 font-mono">Pesos en kg</span>
                        </div>

                        {/* Fila de 5 ejercicios compactos */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                          {/* 1. Sentadillas */}
                          <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                            <span className="text-[9px] text-neutral-400 block font-semibold truncate">Sentadilla</span>
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={row.squatsStatus !== 'completed' ? '' : (row.squatsWeight === 0 ? '' : row.squatsWeight)}
                                placeholder={row.squatsStatus !== 'completed' ? row.squatsStatus.toUpperCase() : '0'}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  updateRow(athlete.id, { squatsWeight: isNaN(val) ? 0 : val });
                                }}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
                              />
                            </div>
                          </div>

                          {/* 2. Peso Muerto */}
                          <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                            <span className="text-[9px] text-neutral-400 block font-semibold truncate">P. Muerto</span>
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={row.deadliftStatus !== 'completed' ? '' : (row.deadliftWeight === 0 ? '' : row.deadliftWeight)}
                                placeholder={row.deadliftStatus !== 'completed' ? row.deadliftStatus.toUpperCase() : '0'}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  updateRow(athlete.id, { deadliftWeight: isNaN(val) ? 0 : val });
                                }}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
                              />
                            </div>
                          </div>

                          {/* 3. Hip Thrust */}
                          <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                            <span className="text-[9px] text-neutral-400 block font-semibold truncate">Hip Thrust</span>
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={row.hipThrustStatus !== 'completed' ? '' : (row.hipThrustWeight === 0 ? '' : row.hipThrustWeight)}
                                placeholder={row.hipThrustStatus !== 'completed' ? row.hipThrustStatus.toUpperCase() : '0'}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  updateRow(athlete.id, { hipThrustWeight: isNaN(val) ? 0 : val });
                                }}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
                              />
                            </div>
                          </div>

                          {/* 4. Press Horizontal */}
                          <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                            <span className="text-[9px] text-neutral-400 block font-semibold truncate">Press Bco</span>
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={row.pressStatus !== 'completed' ? '' : (row.pressWeight === 0 ? '' : row.pressWeight)}
                                placeholder={row.pressStatus !== 'completed' ? row.pressStatus.toUpperCase() : '0'}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  updateRow(athlete.id, { pressWeight: isNaN(val) ? 0 : val });
                                }}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
                              />
                            </div>
                          </div>

                          {/* 5. Tracción: Remo vs Dominadas (Toggle explícito solicitado por Leslie) */}
                          <div className="p-1.5 rounded-lg bg-neutral-900 border border-amber-500/40 space-y-1">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => updateRow(athlete.id, {
                                  pullupsOrRowsType: row.pullupsOrRowsType === 'remo' ? 'dominadas' : 'remo'
                                })}
                                className="text-[9px] font-bold text-amber-300 hover:text-amber-200 underline truncate flex items-center gap-0.5"
                                title="Haz clic para alternar entre Remo con Barra y Dominadas para este atleta"
                              >
                                <span>{row.pullupsOrRowsType === 'remo' ? 'Remo 🔄' : 'Dominadas 🔄'}</span>
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={row.pullupsOrRowsStatus !== 'completed' ? '' : (row.pullupsOrRowsWeight === 0 ? '' : row.pullupsOrRowsWeight)}
                                placeholder={row.pullupsOrRowsStatus !== 'completed' ? row.pullupsOrRowsStatus.toUpperCase() : '0'}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  updateRow(athlete.id, { pullupsOrRowsWeight: isNaN(val) ? 0 : val });
                                }}
                                className="w-full bg-neutral-950 border border-neutral-700 rounded px-1 py-0.5 text-center font-mono font-bold text-amber-300 text-xs outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notas individuales del coach */}
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/60">
                      <span className="text-[10px] text-neutral-400 font-medium shrink-0">Observaciones del Coach:</span>
                      <input
                        type="text"
                        value={row.coachNotes}
                        onChange={(e) => updateRow(athlete.id, { coachNotes: e.target.value })}
                        placeholder="Comentarios u observaciones específicas para el informe de este alumno..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-600 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR FLOTANTE: CONTADOR Y BOTÓN DE GUARDAR EN 1 CLIC */}
      {/* ========================================================================= */}
      <footer className="bg-neutral-900 border-t border-neutral-800 p-3 sm:p-4 shrink-0 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Al guardar, los {athletes.length} alumnos verán inmediatamente sus gráficos, PRs y recomendaciones en sus celulares.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-all"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAllEvaluations}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando Evaluaciones...' : `Guardar Sábana (${athletes.length} Alumnos) 💾`}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL RÁPIDO: NA GENERAL PARA UN ATLETA INDIVIDUAL */}
      {/* ========================================================================= */}
      {activeNAModalUserId && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  NA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Marcar NA General (Todo el Periodo)</h3>
                  <p className="text-[11px] text-neutral-400">
                    Atleta: {users.find(u => u.id === activeNAModalUserId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNAModalUserId(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-300 block">
                Selecciona el motivo rápido:
              </span>
              <div className="space-y-1.5">
                {NA_REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyAthleteGlobalNA(activeNAModalUserId, preset)}
                    className="w-full text-left p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800 text-xs text-neutral-200 transition-all font-medium flex items-center justify-between"
                  >
                    <span>{preset}</span>
                    <span className="text-[10px] text-amber-400 font-bold">Aplicar &rarr;</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-neutral-300 block">
                  O escribe un motivo personalizado (o déjalo en blanco):
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customNAReason}
                    onChange={(e) => setCustomNAReason(e.target.value)}
                    placeholder="Motivo específico (opcional)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => applyAthleteGlobalNA(activeNAModalUserId, customNAReason)}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                  >
                    Marcar NA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NA GENERAL MASIVO PARA TODOS LOS ATLETAS VISIBLES */}
      {/* ========================================================================= */}
      {showBatchNAModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">NA General Masivo</h3>
                  <p className="text-[11px] text-neutral-400">
                    Se aplicará a los <strong>{filteredAthletes.length} atletas</strong> visibles actualmente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchNAModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-neutral-300 block">
                Selecciona la causa para todo el grupo:
              </span>
              <div className="space-y-1.5">
                {NA_REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBatchNAReason(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all font-medium flex items-center justify-between ${
                      batchNAReason === preset
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{preset}</span>
                    {batchNAReason === preset && <span className="text-amber-400 font-bold">✓</span>}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={batchNAReason}
                  onChange={(e) => setBatchNAReason(e.target.value)}
                  placeholder="O escribe una causa personalizada..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchNAModal(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => applyBatchGlobalNA(batchNAReason)}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs shadow-md"
                >
                  Confirmar NA Masivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
