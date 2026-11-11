import React, { useState, useEffect } from 'react';
import { BodyCompositionRecord, UserProfile } from '../../types';
import { 
  calculateBMI, 
  getBMICategory, 
  getRenphoVisceralFatInfo, 
  getRenphoBmiInfo,
  getRenphoMuscleInfo
} from '../../utils/fitnessCalculations';
import { PrivateProgressPhotosView } from './PrivateProgressPhotosView';
import { 
  Scale, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Info, 
  ArrowRight, 
  SlidersHorizontal,
  CheckCircle2,
  X,
  Camera,
  Lock,
  ArrowLeft,
  HelpCircle,
  Activity,
  Sparkles,
  Edit2,
  Trash2,
  Flame
} from 'lucide-react';

interface BodyCompositionViewProps {
  currentUser: UserProfile;
  records: BodyCompositionRecord[];
  onAddRecord: (record: Omit<BodyCompositionRecord, 'id'>) => void;
  onDeleteRecord?: (recordId: string) => void;
  onUpdateRecord?: (recordId: string, updates: Partial<BodyCompositionRecord>) => void;
  onBackToDashboard?: () => void;
  loggedStaffUser?: UserProfile | null;
  isStaffUser?: boolean;
  initialOpenAddModal?: boolean;
  allAthletes?: UserProfile[];
  onSelectNextAthlete?: (next: UserProfile) => void;
}

export const BodyCompositionView: React.FC<BodyCompositionViewProps> = ({
  currentUser,
  records,
  onAddRecord,
  onDeleteRecord,
  onUpdateRecord,
  onBackToDashboard,
  loggedStaffUser,
  isStaffUser,
  initialOpenAddModal,
  allAthletes,
  onSelectNextAthlete,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenphoGuide, setShowRenphoGuide] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<BodyCompositionRecord | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<BodyCompositionRecord | null>(null);
  const [editWeight, setEditWeight] = useState<number | ''>('');
  const [editMuscleKg, setEditMuscleKg] = useState<number | ''>('');
  const [editBodyFat, setEditBodyFat] = useState<number | ''>('');
  const [editVisceralFat, setEditVisceralFat] = useState<number>(3);
  const [editRecordedDate, setEditRecordedDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'compare' | 'history' | 'photos'>('trends');
  const [chartMetric, setChartMetric] = useState<'all' | 'muscle' | 'fat' | 'weight'>('all');

  const handleOpenEditModal = (rec: BodyCompositionRecord) => {
    setRecordToEdit(rec);
    setEditWeight(rec.weightKg);
    const initialMuscleKg = rec.muscleMassKg ?? (rec.weightKg && rec.muscleMassPercent ? parseFloat(((rec.weightKg * rec.muscleMassPercent) / 100).toFixed(2)) : '');
    setEditMuscleKg(initialMuscleKg);
    setEditBodyFat(rec.bodyFatPercent);
    setEditVisceralFat(rec.visceralFatLevel || 3);
    setEditRecordedDate(rec.recordedAt);
    setEditNotes(rec.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordToEdit || !editWeight || !onUpdateRecord) return;

    const numWeight = Number(editWeight);
    const numMuscleKg = Number(editMuscleKg) || 0;
    const computedMusclePercent = (numWeight > 0 && numMuscleKg > 0)
      ? parseFloat(((numMuscleKg / numWeight) * 100).toFixed(1))
      : (recordToEdit.muscleMassPercent || 0);

    const numBodyFat = Number(editBodyFat) || 0;
    const computedBodyFatKg = (numWeight > 0 && numBodyFat > 0)
      ? parseFloat(((numWeight * numBodyFat) / 100).toFixed(2))
      : undefined;

    const numVisceral = Number(editVisceralFat) || 1;
    const updatedBmi = calculateBMI(numWeight, currentUser.heightCm);
    const updatedBmiCategory = getBMICategory(updatedBmi);

    onUpdateRecord(recordToEdit.id, {
      weightKg: numWeight,
      muscleMassKg: numMuscleKg > 0 ? numMuscleKg : undefined,
      muscleMassPercent: computedMusclePercent,
      bodyFatPercent: numBodyFat,
      bodyFatKg: computedBodyFatKg,
      visceralFatLevel: numVisceral,
      recordedAt: editRecordedDate || recordToEdit.recordedAt,
      bmi: updatedBmi,
      bmiCategory: updatedBmiCategory,
      notes: editNotes.trim(),
    });

    setRecordToEdit(null);
    setEditSuccessToast('¡Registro de peso corregido exitosamente!');
    setTimeout(() => setEditSuccessToast(null), 3000);
  };

  useEffect(() => {
    if (initialOpenAddModal) {
      setShowAddModal(true);
    }
  }, [initialOpenAddModal]);

  // Permissions check: Is the person interacting a coach/staff member?
  const isStaffActing = Boolean(isStaffUser || loggedStaffUser?.role === 'staff');

  // New Record Form State (Initialized clean to prevent cross-account cache leakage)
  const [weight, setWeight] = useState<number | ''>('');
  const [muscleKg, setMuscleKg] = useState<number | ''>('');
  const [bodyFat, setBodyFat] = useState<number | ''>('');
  const [visceralFat, setVisceralFat] = useState<number>(3);
  const [recordedDate, setRecordedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [nextAthleteToast, setNextAthleteToast] = useState<string | null>(null);

  // Athletes list in rotation (ONLY ACTIVE IF isStaffActing IS TRUE)
  const athleteList = (isStaffActing && allAthletes && allAthletes.length > 0)
    ? allAthletes.filter(a => a.role === 'athlete') 
    : [];
  const currentAthleteIndex = athleteList.findIndex(a => a.id === currentUser.id);
  const nextAthlete = athleteList.length > 0 && currentAthleteIndex !== -1
    ? athleteList[(currentAthleteIndex + 1) % athleteList.length]
    : (athleteList[0] || null);

  // When currentUser or records change, sync form fields strictly for this athlete
  useEffect(() => {
    const userRecords = records.filter(r => r.userId === currentUser.id);
    if (userRecords.length > 0) {
      const last = userRecords[userRecords.length - 1];
      setWeight(last.weightKg);
      const mKg = last.muscleMassKg ?? (last.weightKg && last.muscleMassPercent ? parseFloat(((last.weightKg * last.muscleMassPercent) / 100).toFixed(2)) : '');
      setMuscleKg(mKg);
      setBodyFat(last.bodyFatPercent);
      setVisceralFat(last.visceralFatLevel || 3);
    } else {
      setWeight('');
      setMuscleKg('');
      setBodyFat('');
      setVisceralFat(3);
    }
    setNotes('');
  }, [currentUser.id, records]);

  // Live calculated BMI
  const liveBmi = weight ? calculateBMI(Number(weight), currentUser.heightCm) : 0;
  const liveBmiCategory = weight ? getBMICategory(liveBmi) : 'Normal';

  // Sorting records chronologically
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const initialRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;
  const latestRecord = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1] : null;
  const hasRecords = sortedRecords.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    const numWeight = Number(weight);
    const numMuscleKg = Number(muscleKg) || 0;
    const computedMusclePercent = (numWeight > 0 && numMuscleKg > 0)
      ? parseFloat(((numMuscleKg / numWeight) * 100).toFixed(1))
      : 0;

    const numBodyFat = Number(bodyFat) || 0;
    const computedBodyFatKg = (numWeight > 0 && numBodyFat > 0)
      ? parseFloat(((numWeight * numBodyFat) / 100).toFixed(2))
      : undefined;

    onAddRecord({
      userId: currentUser.id,
      recordedAt: recordedDate,
      weightKg: numWeight,
      muscleMassKg: numMuscleKg > 0 ? numMuscleKg : undefined,
      muscleMassPercent: computedMusclePercent,
      bodyFatPercent: numBodyFat,
      bodyFatKg: computedBodyFatKg,
      visceralFatLevel: Number(visceralFat) || 1,
      bmi: liveBmi,
      bmiCategory: liveBmiCategory,
      notes: notes,
      recordedByRole: (currentUser.role === 'staff' || isStaffUser || loggedStaffUser?.role === 'staff') ? 'staff' : 'athlete',
    });
    setShowAddModal(false);
  };

  const handleSaveAndNext = () => {
    if (!weight) {
      alert('Por favor ingresa el peso corporal antes de continuar con el siguiente alumno.');
      return;
    }

    const numWeight = Number(weight);
    const numMuscleKg = Number(muscleKg) || 0;
    const computedMusclePercent = (numWeight > 0 && numMuscleKg > 0)
      ? parseFloat(((numMuscleKg / numWeight) * 100).toFixed(1))
      : 0;

    const numBodyFat = Number(bodyFat) || 0;
    const computedBodyFatKg = (numWeight > 0 && numBodyFat > 0)
      ? parseFloat(((numWeight * numBodyFat) / 100).toFixed(2))
      : undefined;

    onAddRecord({
      userId: currentUser.id,
      recordedAt: recordedDate,
      weightKg: numWeight,
      muscleMassKg: numMuscleKg > 0 ? numMuscleKg : undefined,
      muscleMassPercent: computedMusclePercent,
      bodyFatPercent: numBodyFat,
      bodyFatKg: computedBodyFatKg,
      visceralFatLevel: Number(visceralFat) || 1,
      bmi: liveBmi,
      bmiCategory: liveBmiCategory,
      notes: notes,
      recordedByRole: 'staff',
    });

    if (athleteList.length > 0 && onSelectNextAthlete && nextAthlete) {
      const savedName = currentUser.name;
      const targetNext = nextAthlete;

      // Reset fields for the next athlete so no cache leaks
      setWeight('');
      setMuscleKg('');
      setBodyFat('');
      setVisceralFat(3);
      setNotes('');

      onSelectNextAthlete(targetNext);
      setNextAthleteToast(`¡Guardado para ${savedName.split(' ')[0]}! Ahora pesando a: ${targetNext.name}`);
      setTimeout(() => setNextAthleteToast(null), 4000);
    } else {
      setShowAddModal(false);
    }
  };

  // Deltas between initial and latest
  const deltaWeight = latestRecord && initialRecord ? (latestRecord.weightKg - initialRecord.weightKg).toFixed(1) : '0.0';
  const deltaMuscle = latestRecord && initialRecord ? (latestRecord.muscleMassPercent - initialRecord.muscleMassPercent).toFixed(1) : '0.0';
  const deltaFat = latestRecord && initialRecord ? (latestRecord.bodyFatPercent - initialRecord.bodyFatPercent).toFixed(1) : '0.0';

  return (
    <div className="space-y-4 pb-20 px-4 pt-2">
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

      {/* Header and Add Action */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
              Antropometría & Bioimpedancia
            </span>
            <button
              onClick={() => setShowRenphoGuide(true)}
              className="text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
              title="Ver cómo mide la báscula RENPHO el IMC y Grasa Visceral"
            >
              <HelpCircle className="w-3 h-3 text-emerald-400" />
              <span>Guía RENPHO</span>
            </button>
          </div>
          <h2 className="text-xl font-bold text-white font-brand">
            Composición Corporal
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {latestRecord && onUpdateRecord && (
            <button
              type="button"
              onClick={() => handleOpenEditModal(latestRecord)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-blue-300 hover:text-white border border-neutral-700/80 text-xs font-semibold shadow-sm active:scale-95 transition-all"
              title="Corregir y editar mi último pesaje registrado"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Editar Mi Peso</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (latestRecord) {
                setWeight(latestRecord.weightKg);
                setMuscleKg(latestRecord.muscleMassKg ?? (latestRecord.weightKg && latestRecord.muscleMassPercent ? parseFloat(((latestRecord.weightKg * latestRecord.muscleMassPercent) / 100).toFixed(2)) : ''));
                setBodyFat(latestRecord.bodyFatPercent);
                setVisceralFat(latestRecord.visceralFatLevel || 3);
                setRecordedDate(new Date().toISOString().slice(0, 10));
                setNotes(latestRecord.notes || '');
              }
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Nuevo</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Trends, Before/After, History, Private Photos */}
      <div className="flex items-center bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'trends' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Tendencias
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'compare' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Comparativa
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'history' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Historial
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'photos' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Camera className="w-3 h-3 text-blue-400" />
          <span>Fotos Privadas</span>
        </button>
      </div>

      {/* Back to Trends Navigation Breadcrumb */}
      {activeTab !== 'trends' && (
        <button
          onClick={() => setActiveTab('trends')}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold px-1 py-0.5 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>← Volver a Tendencias</span>
        </button>
      )}

      {/* VIEW 1: TREND CHARTS */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {/* Latest Weigh-in Summary Banner with direct Edit Button */}
          {latestRecord && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-neutral-900/90 to-purple-950/30 border border-neutral-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">
                      Último Pesaje Registrado
                    </span>
                    <span className="text-xs text-white font-bold font-mono">
                      {latestRecord.recordedAt}
                    </span>
                  </div>
                </div>

                {onUpdateRecord && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(latestRecord)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold active:scale-95 transition-all shadow-sm"
                    title="Editar y corregir este pesaje si hubo una equivocación"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Editar mi Peso</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                <div className="bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/60">
                  <div className="text-[10px] text-neutral-400 font-sans">Peso</div>
                  <div className="font-extrabold text-white text-base">{latestRecord.weightKg}kg</div>
                  <div className="text-[9px] text-neutral-500 font-sans">IMC {latestRecord.bmi}</div>
                </div>

                <div className="bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/60">
                  <div className="text-[10px] text-emerald-400 font-sans flex items-center justify-center gap-0.5">
                    <span>Músculo</span>
                  </div>
                  <div className="font-extrabold text-emerald-400 text-base">
                    {latestRecord.muscleMassKg ? `${latestRecord.muscleMassKg}kg` : `${((latestRecord.weightKg * latestRecord.muscleMassPercent) / 100).toFixed(1)}kg`}
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">{latestRecord.muscleMassPercent}%</div>
                </div>

                <div className="bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/60">
                  <div className="text-[10px] text-purple-400 font-sans">Grasa</div>
                  <div className="font-extrabold text-purple-400 text-base">{latestRecord.bodyFatPercent}%</div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    {((latestRecord.weightKg * latestRecord.bodyFatPercent) / 100).toFixed(1)}kg
                  </div>
                </div>

                <div className="bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/60">
                  <div className="text-[10px] text-amber-400 font-sans">Visceral</div>
                  <div className="font-extrabold text-amber-300 text-base">Nivel {latestRecord.visceralFatLevel}</div>
                  <div className="text-[9px] text-neutral-500 font-sans">1–59</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Chart Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <h4 className="font-semibold text-white">Evolución de Composición Corporal</h4>
                <span className="text-[10px] text-neutral-400">Tendencia histórica en el tiempo</span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMetric('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    chartMetric === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('muscle')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    chartMetric === 'muscle' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-blue-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Músculo
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('fat')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    chartMetric === 'fat' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-red-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Grasa
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('weight')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    chartMetric === 'weight' ? 'bg-neutral-200 text-black font-bold' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Peso
                </button>
              </div>
            </div>

            {/* Custom Interactive SVG Line Chart or Empty State */}
            {!hasRecords ? (
              <div className="py-8 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Scale className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white font-brand">Inicia tu primer registro</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Aún no cuentas con registros de composición corporal. Registra tu peso, % de músculo, % de grasa y grasa visceral (Báscula Renpho) para activar tus gráficas de evolución física.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Iniciar Primer Registro Antropométrico</span>
                </button>
              </div>
            ) : (() => {
              const isWeightMode = chartMetric === 'weight';
              const muscleVals = sortedRecords.map(r => r.muscleMassPercent).filter(v => v > 0);
              const fatVals = sortedRecords.map(r => r.bodyFatPercent).filter(v => v > 0);
              const weightVals = sortedRecords.map(r => r.weightKg).filter(v => v > 0);

              const minVal = isWeightMode
                ? Math.max(20, Math.floor(Math.min(...weightVals, 50) - 2))
                : Math.max(0, Math.floor(Math.min(...muscleVals, ...fatVals, 12) - 4));

              const maxVal = isWeightMode
                ? Math.ceil(Math.max(...weightVals, 70) + 2)
                : Math.min(100, Math.ceil(Math.max(...muscleVals, ...fatVals, 42) + 6));

              const rangeVal = Math.max(maxVal - minVal, isWeightMode ? 4 : 10);

              const cLeft = 38;
              const cRight = 330;
              const cTop = 22;
              const cBottom = 118;
              const cWidth = cRight - cLeft;
              const cHeight = cBottom - cTop;

              const getX = (idx: number, len: number) => {
                if (len <= 1) return cLeft + cWidth / 2;
                return Number((cLeft + idx * (cWidth / (len - 1))).toFixed(1));
              };

              const getY = (val: number) => {
                const clamped = Math.min(Math.max(val, minVal), maxVal);
                const ratio = (clamped - minVal) / rangeVal;
                return Number((cBottom - ratio * cHeight).toFixed(1));
              };

              const showMuscle = chartMetric === 'all' || chartMetric === 'muscle';
              const showFat = chartMetric === 'all' || chartMetric === 'fat';
              const showWeight = chartMetric === 'weight';

              const midVal = Math.round((maxVal + minVal) / 2);
              const midY = (cTop + cBottom) / 2;

              return (
                <div className="w-full max-w-full overflow-hidden rounded-2xl bg-neutral-950/80 border border-neutral-800/80 p-2 sm:p-3">
                  <div className="h-44 sm:h-48 w-full relative">
                    <svg className="w-full h-full block" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0055ff" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0055ff" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff1e27" stopOpacity="0.30" />
                          <stop offset="100%" stopColor="#ff1e27" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal guide lines */}
                      <line x1={cLeft} y1={cTop} x2={cRight} y2={cTop} stroke="#262626" strokeDasharray="3 3" />
                      <line x1={cLeft} y1={midY} x2={cRight} y2={midY} stroke="#262626" strokeDasharray="3 3" />
                      <line x1={cLeft} y1={cBottom} x2={cRight} y2={cBottom} stroke="#262626" strokeDasharray="3 3" />

                      {/* Y-Axis Value Labels on Left */}
                      <text x={cLeft - 6} y={cTop + 3} fill="#525252" fontSize="8" className="font-mono" textAnchor="end">
                        {maxVal}{isWeightMode ? 'kg' : '%'}
                      </text>
                      <text x={cLeft - 6} y={midY + 3} fill="#525252" fontSize="8" className="font-mono" textAnchor="end">
                        {midVal}{isWeightMode ? 'kg' : '%'}
                      </text>
                      <text x={cLeft - 6} y={cBottom + 3} fill="#525252" fontSize="8" className="font-mono" textAnchor="end">
                        {minVal}{isWeightMode ? 'kg' : '%'}
                      </text>

                      {/* Muscle Area Fill */}
                      {showMuscle && sortedRecords.length > 1 && (
                        <polygon
                          fill="url(#muscleGrad)"
                          points={`${getX(0, sortedRecords.length)},${cBottom} ${sortedRecords.map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.muscleMassPercent)}`).join(' ')} ${getX(sortedRecords.length - 1, sortedRecords.length)},${cBottom}`}
                        />
                      )}

                      {/* Fat Area Fill */}
                      {showFat && sortedRecords.length > 1 && (
                        <polygon
                          fill="url(#fatGrad)"
                          points={`${getX(0, sortedRecords.length)},${cBottom} ${sortedRecords.map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.bodyFatPercent)}`).join(' ')} ${getX(sortedRecords.length - 1, sortedRecords.length)},${cBottom}`}
                        />
                      )}

                      {/* Weight Area Fill */}
                      {showWeight && sortedRecords.length > 1 && (
                        <polygon
                          fill="url(#weightGrad)"
                          points={`${getX(0, sortedRecords.length)},${cBottom} ${sortedRecords.map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.weightKg)}`).join(' ')} ${getX(sortedRecords.length - 1, sortedRecords.length)},${cBottom}`}
                        />
                      )}

                      {/* Plot Muscle % (Kinetix Blue Line) */}
                      {showMuscle && sortedRecords.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#0055ff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sortedRecords.map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.muscleMassPercent)}`).join(' ')}
                        />
                      )}

                      {/* Plot Body Fat % (Kinetix Red Line) */}
                      {showFat && sortedRecords.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#ff1e27"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sortedRecords.map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.bodyFatPercent)}`).join(' ')}
                        />
                      )}

                      {/* Plot Weight (White Line) */}
                      {showWeight && sortedRecords.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sortedRecords.map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.weightKg)}`).join(' ')}
                        />
                      )}

                      {/* Render Dots, Value Badges & Dates */}
                      {sortedRecords.map((r, i) => {
                        const x = getX(i, sortedRecords.length);
                        const ym = getY(r.muscleMassPercent);
                        const yf = getY(r.bodyFatPercent);
                        const yw = getY(r.weightKg);

                        return (
                          <g key={r.id}>
                            {/* Muscle Point */}
                            {showMuscle && (
                              <>
                                <circle cx={x} cy={ym} r="4" fill="#0055ff" stroke="#000" strokeWidth="1.5" />
                                <text x={x} y={ym - 7} fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="middle">
                                  {r.muscleMassPercent}%
                                </text>
                              </>
                            )}

                            {/* Fat Point */}
                            {showFat && (
                              <>
                                <circle cx={x} cy={yf} r="4" fill="#ff1e27" stroke="#000" strokeWidth="1.5" />
                                <text x={x} y={yf + 12} fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">
                                  {r.bodyFatPercent}%
                                </text>
                              </>
                            )}

                            {/* Weight Point */}
                            {showWeight && (
                              <>
                                <circle cx={x} cy={yw} r="4" fill="#ffffff" stroke="#000" strokeWidth="1.5" />
                                <text x={x} y={yw - 7} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                                  {r.weightKg}kg
                                </text>
                              </>
                            )}

                            {/* X Axis Date Label */}
                            <text x={x} y="140" fill="#a3a3a3" fontSize="8" textAnchor="middle">
                              {r.recordedAt.slice(5)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Recomposición Kinetix:</span>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {Number(deltaMuscle) >= 0 ? `+${deltaMuscle}%` : `${deltaMuscle}%`} masa magra
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Current Body Metrics Summary with Official RENPHO Indicators (Only displayed once the athlete registers measurements) */}
          {latestRecord && (() => {
            const renphoVisceral = getRenphoVisceralFatInfo(latestRecord.visceralFatLevel);
            const renphoBmi = getRenphoBmiInfo(latestRecord.bmi);

            // Calculate percentage position for Visceral Fat marker (scale 1 to 25 visual max)
            const visceralPercent = Math.min(Math.max(((latestRecord.visceralFatLevel - 1) / 24) * 100, 4), 96);
            // Calculate percentage position for BMI marker (scale 15 to 35 visual range)
            const bmiPercent = Math.min(Math.max(((latestRecord.bmi - 15) / 20) * 100, 4), 96);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* RENPHO Visceral Fat Gauge Card */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span>Grasa Visceral</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${renphoVisceral.badgeBg} ${renphoVisceral.badgeText}`}>
                      {renphoVisceral.category}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-white font-mono">
                      Nivel {latestRecord.visceralFatLevel}
                    </div>
                    <button
                      onClick={() => setShowRenphoGuide(true)}
                      className="text-[10px] text-neutral-500 hover:text-emerald-400 underline font-mono"
                    >
                      Escala 1–59 Renpho
                    </button>
                  </div>

                  {/* Renpho Segmented Scale Bar */}
                  <div className="space-y-1">
                    <div className="relative h-2 w-full rounded-full bg-neutral-950 overflow-hidden flex">
                      <div className="w-[36%] bg-emerald-500" title="1-9 Estándar / Saludable" />
                      <div className="w-[24%] bg-amber-500" title="10-14 Alto / Precaución" />
                      <div className="w-[40%] bg-rose-500" title="15+ Excesivo / Peligro" />
                    </div>
                    {/* Visual indicator pin */}
                    <div className="relative h-2 w-full">
                      <div
                        className="absolute -top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md border-2 border-black"
                        style={{ left: `${visceralPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                      <span className="text-emerald-400">1–9 Saludable</span>
                      <span className="text-amber-400">10–14 Alto</span>
                      <span className="text-rose-400">15+ Crítico</span>
                    </div>
                  </div>
                </div>

                {/* RENPHO BMI (IMC) Gauge Card */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-blue-400" />
                      <span>IMC (Índice Masa Corporal)</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${renphoBmi.badgeBg} ${renphoBmi.badgeText}`}>
                      {renphoBmi.category}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-white font-mono">
                      {latestRecord.bmi}
                    </div>
                    <button
                      onClick={() => setShowRenphoGuide(true)}
                      className="text-[10px] text-neutral-500 hover:text-blue-400 underline font-mono"
                    >
                      OMS / Báscula Renpho
                    </button>
                  </div>

                  {/* Renpho Segmented Scale Bar */}
                  <div className="space-y-1">
                    <div className="relative h-2 w-full rounded-full bg-neutral-950 overflow-hidden flex">
                      <div className="w-[20%] bg-sky-500" title="<18.5 Bajo Peso" />
                      <div className="w-[35%] bg-emerald-500" title="18.5-24.9 Estándar" />
                      <div className="w-[25%] bg-amber-500" title="25.0-29.9 Sobrepeso" />
                      <div className="w-[20%] bg-rose-500" title=">=30.0 Obesidad" />
                    </div>
                    {/* Visual indicator pin */}
                    <div className="relative h-2 w-full">
                      <div
                        className="absolute -top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md border-2 border-black"
                        style={{ left: `${bmiPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                      <span className="text-sky-400">&lt;18.5 Bajo</span>
                      <span className="text-emerald-400">18.5–24.9 Normal</span>
                      <span className="text-amber-400">25–29.9</span>
                      <span className="text-rose-400">&ge;30 Obesidad</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 2: BEFORE & AFTER COMPARISON */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {!initialRecord || !latestRecord || sortedRecords.length < 2 ? (
            <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
                <SlidersHorizontal className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-white font-brand">Comparativa Antes vs Después</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Necesitas tener al menos 2 mediciones registradas en diferentes fechas para comparar tu recomposición corporal y evolución física.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Nueva Medición</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
              <span className="font-semibold text-white">Comparativa Antes vs Después</span>
              <span className="text-neutral-500 font-mono text-[11px]">
                {initialRecord.recordedAt} &rarr; {latestRecord.recordedAt}
              </span>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="space-y-3">
              {/* Weight Comparison */}
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Peso Total</span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 line-through font-mono">{initialRecord.weightKg} kg</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500" />
                  <span className="text-white font-bold font-mono">{latestRecord.weightKg} kg</span>
                  <span className="text-emerald-400 font-bold font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded">
                    {Number(deltaWeight) > 0 ? `+${deltaWeight}` : deltaWeight} kg
                  </span>
                </div>
              </div>

              {/* Muscle % Comparison */}
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Masa Muscular</span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 font-mono">{initialRecord.muscleMassPercent}%</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500" />
                  <span className="text-white font-bold font-mono">{latestRecord.muscleMassPercent}%</span>
                  <span className="text-emerald-400 font-bold font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded">
                    +{deltaMuscle}%
                  </span>
                </div>
              </div>

              {/* Body Fat % Comparison */}
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-400">Grasa Corporal</span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 font-mono">{initialRecord.bodyFatPercent}%</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500" />
                  <span className="text-white font-bold font-mono">{latestRecord.bodyFatPercent}%</span>
                  <span className="text-purple-400 font-bold font-mono text-[11px] bg-purple-950/60 px-2 py-0.5 rounded">
                    {deltaFat}%
                  </span>
                </div>
              </div>

              {/* Visceral Fat Comparison */}
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-neutral-400">Grasa Visceral</span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 font-mono">Nivel {initialRecord.visceralFatLevel}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500" />
                  <span className="text-white font-bold font-mono">Nivel {latestRecord.visceralFatLevel}</span>
                  <span className="text-emerald-400 font-bold font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded">
                    -{initialRecord.visceralFatLevel - latestRecord.visceralFatLevel} niveles
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* VIEW 3: FULL HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          {sortedRecords.length === 0 ? (
            <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-white font-brand">Historial de Mediciones</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Aún no tienes registros en tu historial. Al capturar tu primera medición aparecerá aquí con fecha y detalle de composición.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Iniciar Primer Registro</span>
              </button>
            </div>
          ) : (
            sortedRecords.slice().reverse().map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{rec.recordedAt}</span>
                </div>
                <span className="text-[10px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                  {rec.recordedByRole === 'staff' ? 'Validado Staff' : 'Ingreso Atleta'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <div className="text-[10px] text-neutral-500 font-sans">Peso</div>
                  <div className="font-bold text-white text-sm">{rec.weightKg}kg</div>
                </div>
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <div className="text-[10px] text-neutral-500 font-sans flex items-center justify-center gap-0.5">
                    <span>Músculo</span>
                    <span className="text-[8px] text-emerald-400 font-bold">Renpho</span>
                  </div>
                  <div className="font-bold text-emerald-400 text-sm">
                    {rec.muscleMassKg ? `${rec.muscleMassKg}kg` : `${((rec.weightKg * rec.muscleMassPercent) / 100).toFixed(1)}kg`}
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    {rec.muscleMassPercent}%
                  </div>
                </div>
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <div className="text-[10px] text-neutral-500 font-sans">Grasa</div>
                  <div className="font-bold text-purple-400 text-sm">{rec.bodyFatPercent}%</div>
                  <div className="text-[9px] text-purple-400/80 font-mono">
                    {((rec.weightKg * rec.bodyFatPercent) / 100).toFixed(1)}kg
                  </div>
                </div>
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <div className="text-[10px] text-neutral-500 font-sans">IMC</div>
                  <div className="font-bold text-white text-sm">{rec.bmi}</div>
                </div>
              </div>

              {rec.notes && (
                <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-800/40">
                  "{rec.notes}"
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/40">
                {onUpdateRecord && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(rec)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40 transition-colors font-semibold"
                    title="Editar y corregir este pesaje si hubo una equivocación"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar pesaje</span>
                  </button>
                )}

                {onDeleteRecord && (isStaffActing || rec.recordedByRole !== 'staff') && (
                  <button
                    type="button"
                    onClick={() => setRecordToDelete(rec)}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-950/40 border border-red-800/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          )))
        }
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && onDeleteRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-red-800/80 rounded-3xl p-5 space-y-4 text-center shadow-2xl">
            <h3 className="text-base font-bold text-white">¿Eliminar registro antropométrico?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Se eliminará el peso de <strong>{recordToDelete.weightKg} kg</strong> del <strong>{recordToDelete.recordedAt}</strong>.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Éxito al Editar */}
      {editSuccessToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-semibold text-xs shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{editSuccessToast}</span>
        </div>
      )}

      {/* Edit Record Modal (Permite corregir si se equivocaron al capturar peso, grasa o fecha) */}
      {recordToEdit && onUpdateRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Corregir Registro de Peso</h3>
                  <p className="text-[10px] text-neutral-400">Corrige cualquier valor si hubo un error al capturar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecordToEdit(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Peso Corporal (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="300"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej. 70.5"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm font-bold font-mono focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-300 font-medium flex items-center gap-1">
                      <span>Masa Muscular (kg)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        📱 Renpho en kg
                      </span>
                    </label>
                    {editWeight && editMuscleKg ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {((Number(editMuscleKg) / Number(editWeight)) * 100).toFixed(1)}%
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="10"
                    max="150"
                    value={editMuscleKg}
                    onChange={(e) => setEditMuscleKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej. 44.00"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm font-bold font-mono focus:border-emerald-500 outline-none"
                  />
                  {editMuscleKg ? (
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-neutral-400">Escala Renpho:</span>
                      {(() => {
                        const info = getRenphoMuscleInfo(Number(editMuscleKg), currentUser.gender);
                        return (
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${info.badgeBg} ${info.badgeText}`}>
                            {info.category}
                          </span>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-500 block mt-0.5">
                      Ingresa el valor en kg como aparece en tu app Renpho (ej. 44.00 kg)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Grasa Corporal (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    value={editBodyFat}
                    onChange={(e) => setEditBodyFat(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej. 18.5"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm font-bold font-mono focus:border-purple-500 outline-none"
                  />
                  {editWeight && editBodyFat ? (
                    <span className="text-[9px] text-purple-400 font-mono block mt-0.5">
                      ≈ {((Number(editWeight) * Number(editBodyFat)) / 100).toFixed(1)} kg de grasa
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Grasa Visceral (1 - 59)</label>
                  <input
                    type="number"
                    min="1"
                    max="59"
                    value={editVisceralFat}
                    onChange={(e) => setEditVisceralFat(parseInt(e.target.value) || 3)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm font-bold font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Fecha de Medición</label>
                <input
                  type="date"
                  value={editRecordedDate}
                  onChange={(e) => setEditRecordedDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Notas de la Sesión</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ej. Pesaje en ayunas, pre-entreno, etc."
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {editWeight ? (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">IMC Recalculado:</span>
                  <span className="font-mono font-bold text-white">
                    {calculateBMI(Number(editWeight), currentUser.heightCm)} ({getBMICategory(calculateBMI(Number(editWeight), currentUser.heightCm))})
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setRecordToEdit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Corrección</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 4: PRIVATE PROGRESS PHOTOS */}
      {activeTab === 'photos' && (
        <PrivateProgressPhotosView
          athlete={currentUser}
          bodyCompRecords={records}
        />
      )}

      {/* MODAL: REGISTRAR NUEVA MEDICIÓN */}
      {/* MODAL: REGISTRAR NUEVA MEDICIÓN (Bottom-sheet ergonómico en celular) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Pinned Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 shrink-0 space-y-2.5 bg-neutral-900/95">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-brand">Registro de Antropometría & Bioimpedancia</h3>
                  <p className="text-xs text-neutral-400">Captura de peso y métricas de báscula Renpho</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Athlete Banner */}
              {isStaffActing && athleteList.length > 0 ? (
                <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold truncate">
                        Pesando a Alumno ({currentAthleteIndex + 1} de {athleteList.length})
                      </span>
                      <strong className="text-white text-sm block truncate">
                        {currentUser.name}
                      </strong>
                    </div>
                  </div>
                  {nextAthlete && athleteList.length > 1 && (
                    <div className="text-right shrink-0 bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-neutral-800">
                      <span className="text-[9px] text-neutral-400 block font-mono">Siguiente:</span>
                      <span className="text-xs font-bold text-blue-400 block">
                        {nextAthlete.name.split(' ')[0]} ⏭️
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 sm:p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2.5 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-blue-400 uppercase tracking-wider block font-semibold">
                        Mi Medición Personal
                      </span>
                      <strong className="text-white text-sm block truncate">
                        {currentUser.name}
                      </strong>
                    </div>
                  </div>
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                    Báscula Renpho
                  </span>
                </div>
              )}

              {/* Toast when advancing to next student */}
              {nextAthleteToast && (
                <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{nextAthleteToast}</span>
                </div>
              )}
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                {/* Helper Card for RENPHO Scale Workflow */}
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5">
                    R
                  </div>
                  <div>
                    <strong className="text-white block">Sincronización con Báscula RENPHO</strong>
                    <p className="text-[11px] text-blue-300/80 leading-relaxed">
                      Abre la app de Renpho en tu teléfono y copia aquí tus 4 valores: Peso, Masa Muscular, Grasa Corporal y Grasa Visceral.
                    </p>
                  </div>
                </div>
              <div>
                <label className="text-neutral-300 font-medium block mb-1">Fecha de Medición</label>
                <input
                  type="date"
                  value={recordedDate}
                  onChange={(e) => setRecordedDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {(() => {
                const existingForDate = records.find(r => r.recordedAt === recordedDate);
                if (!existingForDate) return null;
                return (
                  <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-blue-200 text-xs flex items-start gap-2 shadow-sm">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Corrección de pesaje en esta fecha ({recordedDate})</span>
                      <span className="text-[11px] text-blue-300/90 leading-snug block mt-0.5">
                        Ya existe un registro guardado ({existingForDate.weightKg} kg, {existingForDate.muscleMassPercent}% músculo). Al guardar, se <strong>actualizarán tus valores</strong> en este registro sin crear duplicados.
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Weight with dynamic IMC preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-medium">Peso Corporal (kg)</label>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    IMC Calculado: {liveBmi} ({liveBmiCategory})
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-300 font-medium text-xs flex items-center gap-1">
                      <span>Músculo (kg)</span>
                      <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        📱 Renpho
                      </span>
                    </label>
                    {weight && muscleKg ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {((Number(muscleKg) / Number(weight)) * 100).toFixed(1)}%
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="10"
                    max="150"
                    value={muscleKg}
                    onChange={(e) => setMuscleKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej. 44.00"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    required
                  />
                  {muscleKg ? (
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className="text-neutral-400">Renpho:</span>
                      {(() => {
                        const info = getRenphoMuscleInfo(Number(muscleKg), currentUser.gender);
                        return (
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] ${info.badgeBg} ${info.badgeText}`}>
                            {info.category}
                          </span>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-[9px] text-neutral-500 block mt-0.5">
                      Ingresa en kg como en Renpho (ej. 44.00)
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1 text-xs">Grasa Corporal (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej. 18.5"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    required
                  />
                  {weight && bodyFat ? (
                    <div className="mt-1 text-right text-[9px] text-purple-400/90 font-mono">
                      ≈ {((Number(weight) * Number(bodyFat)) / 100).toFixed(1)} kg grasa
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-medium">Nivel de Grasa Visceral (Escala 1 a 59)</label>
                  <span className="text-neutral-400 font-mono text-[11px]">Nivel {visceralFat}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={visceralFat}
                  onChange={(e) => setVisceralFat(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 pt-0.5">
                  <span>1 (Excelente)</span>
                  <span>9 (Límite Saludable)</span>
                  <span>15+ (Exceso)</span>
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-medium block mb-1">Observaciones / Notas Clínicas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Pesaje matutino en ayunas tras hidratación..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white text-xs focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Pinned Modal Action Footer (Accesible en todo momento con el pulgar) */}
            <div 
              className="p-3 sm:p-4 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 shrink-0 space-y-2"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              {/* Botón Principal: Guardar y Siguiente Alumno (EXCLUSIVO PARA STAFF EVALUANDO ATLETAS) */}
              {isStaffActing && athleteList.length > 1 && onSelectNextAthlete && nextAthlete && (
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                >
                  <span>Guardar y Siguiente Alumno</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-medium text-blue-100">
                    👉 Pesar a: {nextAthlete.name.split(' ')[0]}
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors text-xs"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold transition-colors shadow-md shadow-emerald-500/20 text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {(() => {
                      const hasExisting = records.some(r => r.recordedAt === recordedDate);
                      if (hasExisting) return 'Actualizar Pesaje de Hoy';
                      return isStaffActing ? 'Guardar Solo Este' : 'Guardar Mi Medición';
                    })()}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}
      {/* RENPHO OFFICIAL MEASUREMENT GUIDE MODAL */}
      {showRenphoGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-blue-950/50 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold font-mono">
                  R
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                    Báscula Inteligente RENPHO · Bioimpedancia
                  </span>
                  <h3 className="text-base font-bold text-white font-brand">
                    Cómo se miden el IMC y la Grasa Visceral
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowRenphoGuide(false)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-5 overflow-y-auto text-xs text-neutral-300 leading-relaxed">
              {/* Introduction Pill */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <p className="font-semibold text-white">
                  ¿Cómo interpreta Kinetix Progress tus mediciones de la app RENPHO?
                </p>
                <p className="text-[11px] text-neutral-400">
                  La báscula Renpho utiliza electrodos de bioimpedancia eléctrica para estimar tu composición corporal a partir de la resistencia del tejido muscular y adiposo. A continuación te mostramos la escala exacta que utiliza Renpho para clasificar cada métrica:
                </p>
              </div>

              {/* SECTION 1: GRASA VISCERAL */}
              <div className="space-y-2.5 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>1. Grasa Visceral (Escala 1 a 59)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Marcador Clave
                  </span>
                </div>
                
                <p className="text-[11px] text-neutral-400">
                  Es la grasa que se almacena en la cavidad intra-abdominal rodeando los órganos vitales (hígado, estómago e intestinos). A diferencia de la grasa subcutánea (debajo de la piel), un exceso de grasa visceral aumenta el riesgo cardiovascular y la resistencia a la insulina.
                </p>

                {/* Renpho Visceral Scale Visual */}
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start justify-between">
                    <div>
                      <strong className="text-emerald-400 block text-[11px]">Nivel 1 a 9 · Estándar / Saludable (Verde)</strong>
                      <span className="text-[10px] text-neutral-300">
                        Nivel fisiológico óptimo. La grasa protege los órganos vitales sin inducir sobrecarga metabólica.
                      </span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 font-bold ml-2">ÓPTIMO</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start justify-between">
                    <div>
                      <strong className="text-amber-400 block text-[11px]">Nivel 10 a 14 · Alto / Alerta (Amarillo / Naranja)</strong>
                      <span className="text-[10px] text-neutral-300">
                        Señal de advertencia. Acumulación adiposa en el abdomen que requiere ajuste en la ingesta calórica y mayor volumen de ejercicio aeróbico/funcional.
                      </span>
                    </div>
                    <span className="font-mono text-xs text-amber-400 font-bold ml-2">ALERTA</span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start justify-between">
                    <div>
                      <strong className="text-rose-400 block text-[11px]">Nivel 15 a 59 · Excesivo / Peligro (Rojo)</strong>
                      <span className="text-[10px] text-neutral-300">
                        Nivel crítico severo en la app Renpho. Riesgo de hígado graso e hipertensión. Es prioridad absoluta reducirlo con el coach y plan nutricional.
                      </span>
                    </div>
                    <span className="font-mono text-xs text-rose-400 font-bold ml-2">PELIGRO</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: IMC (ÍNDICE DE MASA CORPORAL) */}
              <div className="space-y-2.5 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <span>2. IMC (Índice de Masa Corporal / BMI)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Peso / Altura²
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Renpho calcula automáticamente tu IMC con la fórmula <code className="text-white font-mono bg-neutral-900 px-1 py-0.5 rounded">Peso (kg) / [Estatura (m)]²</code> y lo colorea en la barra según los estándares de la OMS:
                </p>

                {/* Renpho BMI Scale Visual */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30">
                    <span className="text-sky-400 font-bold block">&lt; 18.5 · Bajo Peso</span>
                    <span className="text-neutral-400 font-sans">Color Azul Renpho</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block">18.5 – 24.9 · Estándar</span>
                    <span className="text-neutral-400 font-sans">Color Verde Renpho (Saludable)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
                    <span className="text-amber-400 font-bold block">25.0 – 29.9 · Sobrepeso</span>
                    <span className="text-neutral-400 font-sans">Color Amarillo Renpho</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                    <span className="text-rose-400 font-bold block">&ge; 30.0 · Obesidad</span>
                    <span className="text-neutral-400 font-sans">Color Rojo Renpho</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[10px] text-blue-300">
                  <strong>💡 Nota clave para atletas funcionales de Kinetix:</strong> En deportistas con elevado desarrollo de masa muscular y fuerza, el IMC puede ubicarse en rango de sobrepeso (&gt; 25) aun teniendo baja grasa corporal. Por eso en Kinetix siempre contrastamos tu IMC con tu masa muscular en kg y tu nivel de Grasa Visceral.
                </div>
              </div>

              {/* SECTION 2.5: MASA MUSCULAR EN KG (RENPHO) */}
              <div className="space-y-2.5 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>3. Masa Muscular en Kilogramos (kg)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Báscula en kg
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400">
                  En la pantalla de tu app Renpho Health, la métrica principal de <strong>Masa Muscular</strong> se muestra directamente en <strong>kilogramos (kg)</strong>. Kinetix toma ese valor directo en kg y calcula automáticamente el porcentaje sobre tu peso total, clasificándote en:
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30">
                    <span className="text-sky-400 font-bold block">&lt; 32.90 kg</span>
                    <span className="text-neutral-400 font-sans">Por debajo del promedio</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block">32.90 – 37.50 kg</span>
                    <span className="text-neutral-400 font-sans">Promedio</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-400/40">
                    <span className="text-emerald-300 font-bold block">&gt; 37.50 kg</span>
                    <span className="text-emerald-400 font-sans font-semibold">Excelente ★</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PASOS PARA COPIAR TU MEDICIÓN */}
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-white text-xs">
                  Pasos para sincronizar tus mediciones en Kinetix:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400">
                  <li>Súbete descalzo a tu báscula RENPHO con la app abierta en tu teléfono.</li>
                  <li>Espera a que los números se fijen y se complete el escaneo de bioimpedancia.</li>
                  <li>En Kinetix Progress pulsa <strong className="text-white">+ Nuevo Registro</strong>.</li>
                  <li>Introduce tu <strong>Peso (kg)</strong>, tu <strong>Masa Muscular en kg</strong> (ej. 44.00 kg tal como aparece en tu app Renpho), tu <strong>% Grasa</strong> y tu <strong>Nivel de Grasa Visceral</strong>.</li>
                  <li>Kinetix Progress calculará de inmediato tu IMC, el % de músculo y tu rango [Excelente / Promedio].</li>
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowRenphoGuide(false)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
