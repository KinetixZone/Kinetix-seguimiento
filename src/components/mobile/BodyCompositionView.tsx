import React, { useState, useEffect } from 'react';
import { BodyCompositionRecord, UserProfile } from '../../types';
import { 
  calculateBMI, 
  getBMICategory, 
  getRenphoVisceralFatInfo, 
  getRenphoBmiInfo 
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
  Sparkles
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
  const [nextAthleteToast, setNextAthleteToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'compare' | 'history' | 'photos'>('trends');

  useEffect(() => {
    if (initialOpenAddModal) {
      setShowAddModal(true);
    }
  }, [initialOpenAddModal]);

  // New Record Form State
  const [weight, setWeight] = useState<number | ''>(() => {
    return records.length > 0 ? records[records.length - 1].weightKg : '';
  });
  const [muscle, setMuscle] = useState<number | ''>(() => {
    return records.length > 0 ? records[records.length - 1].muscleMassPercent : '';
  });
  const [bodyFat, setBodyFat] = useState<number | ''>(() => {
    return records.length > 0 ? records[records.length - 1].bodyFatPercent : '';
  });
  const [visceralFat, setVisceralFat] = useState<number>(() => {
    return records.length > 0 ? records[records.length - 1].visceralFatLevel : 1;
  });
  const [recordedDate, setRecordedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');

  // Calculate athletes in rotation for sequential weigh-in
  const athleteList = allAthletes && allAthletes.length > 0 
    ? allAthletes.filter(a => a.role === 'athlete') 
    : [];
  const currentAthleteIndex = athleteList.findIndex(a => a.id === currentUser.id);
  const nextAthlete = athleteList.length > 0 && currentAthleteIndex !== -1
    ? athleteList[(currentAthleteIndex + 1) % athleteList.length]
    : (athleteList[0] || null);

  // When currentUser changes (e.g. coach advances to next athlete)
  useEffect(() => {
    const userRecords = records.filter(r => r.userId === currentUser.id);
    if (userRecords.length > 0) {
      const last = userRecords[userRecords.length - 1];
      setWeight(last.weightKg);
      setMuscle(last.muscleMassPercent);
      setBodyFat(last.bodyFatPercent);
      setVisceralFat(last.visceralFatLevel || 1);
    } else {
      setWeight('');
      setMuscle('');
      setBodyFat('');
      setVisceralFat(3);
    }
    setNotes('');
  }, [currentUser.id]);

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
    onAddRecord({
      userId: currentUser.id,
      recordedAt: recordedDate,
      weightKg: Number(weight),
      muscleMassPercent: Number(muscle) || 0,
      bodyFatPercent: Number(bodyFat) || 0,
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

    onAddRecord({
      userId: currentUser.id,
      recordedAt: recordedDate,
      weightKg: Number(weight),
      muscleMassPercent: Number(muscle) || 0,
      bodyFatPercent: Number(bodyFat) || 0,
      visceralFatLevel: Number(visceralFat) || 1,
      bmi: liveBmi,
      bmiCategory: liveBmiCategory,
      notes: notes,
      recordedByRole: 'staff',
    });

    if (athleteList.length > 0 && onSelectNextAthlete && nextAthlete) {
      const savedName = currentUser.name;
      const targetNext = nextAthlete;

      // Reset fields for the next athlete
      setWeight('');
      setMuscle('');
      setBodyFat('');
      setVisceralFat(3);
      setNotes('');

      onSelectNextAthlete(targetNext);
      setNextAthleteToast(`¡Guardado para ${savedName.split(' ')[0]}! Ahora pesando a: ${targetNext.name}`);
      setTimeout(() => setNextAthleteToast(null), 4500);
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nuevo Registro</span>
        </button>
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
          {/* Main Chart Card */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Evolución Trimestral (Kg y %)</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Músculo %
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Grasa %
                </span>
                <span className="flex items-center gap-1 text-white">
                  <span className="w-2 h-2 rounded-full bg-white inline-block" /> Peso (kg)
                </span>
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
            ) : (
              <>
                <div className="h-44 w-full relative pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                    {/* Horizontal guide lines */}
                    <line x1="0" y1="20" x2="320" y2="20" stroke="#262626" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="320" y2="60" stroke="#262626" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="320" y2="100" stroke="#262626" strokeDasharray="3 3" />

                    {/* Plot Muscle % (Kinetix Blue Line) */}
                    <polyline
                      fill="none"
                      stroke="#0055ff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sortedRecords.map((r, i) => {
                        const x = 30 + i * (260 / (sortedRecords.length - 1 || 1));
                        const y = 95 - ((r.muscleMassPercent - 40) / 8) * 75;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Plot Body Fat % (Kinetix Red Line) */}
                    <polyline
                      fill="none"
                      stroke="#ff1e27"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sortedRecords.map((r, i) => {
                        const x = 30 + i * (260 / (sortedRecords.length - 1 || 1));
                        const y = 95 - ((r.bodyFatPercent - 10) / 10) * 75;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Render Dots & Values */}
                    {sortedRecords.map((r, i) => {
                      const x = 30 + i * (260 / (sortedRecords.length - 1 || 1));
                      const yM = 95 - ((r.muscleMassPercent - 40) / 8) * 75;
                      const yF = 95 - ((r.bodyFatPercent - 10) / 10) * 75;
                      return (
                        <g key={r.id}>
                          {/* Muscle Point */}
                          <circle cx={x} cy={yM} r="4" fill="#0055ff" stroke="#000" strokeWidth="1.5" />
                          <text x={x} y={yM - 7} fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="middle">
                            {r.muscleMassPercent}%
                          </text>
                          
                          {/* Fat Point */}
                          <circle cx={x} cy={yF} r="4" fill="#ff1e27" stroke="#000" strokeWidth="1.5" />
                          <text x={x} y={yF + 12} fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">
                            {r.bodyFatPercent}%
                          </text>

                          {/* X Axis Date Label */}
                          <text x={x} y="118" fill="#737373" fontSize="8" textAnchor="middle">
                            {r.recordedAt.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>Tendencia: Recomposición corporal</span>
                  <span className="text-blue-400 font-semibold">{deltaMuscle}% masa magra</span>
                </div>
              </>
            )}
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
                  <div className="text-[10px] text-neutral-500 font-sans">Músculo</div>
                  <div className="font-bold text-emerald-400 text-sm">{rec.muscleMassPercent}%</div>
                </div>
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <div className="text-[10px] text-neutral-500 font-sans">Grasa</div>
                  <div className="font-bold text-purple-400 text-sm">{rec.bodyFatPercent}%</div>
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

              {onDeleteRecord && (
                <div className="flex justify-end pt-1 border-t border-neutral-800/40">
                  <button
                    onClick={() => setRecordToDelete(rec)}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-950/40 border border-red-800/30 transition-colors"
                  >
                    <span>Eliminar registro</span>
                  </button>
                </div>
              )}
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

              {/* Active Athlete Banner & Progress in Rotation */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold truncate">
                      Pesando a Alumno {athleteList.length > 0 && `(${currentAthleteIndex + 1} de ${athleteList.length})`}
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

              {/* In-Modal Feedback Toast when Advancing to Next Student */}
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
                  <label className="text-neutral-300 font-medium block mb-1">Masa Muscular (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="70"
                    value={muscle}
                    onChange={(e) => setMuscle(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Grasa Corporal (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    required
                  />
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
              {/* Botón Principal: Guardar y Siguiente Alumno */}
              {athleteList.length > 1 && onSelectNextAthlete && nextAthlete && (
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
                  <span>Guardar Solo Este</span>
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
                  <strong>💡 Nota clave para atletas funcionales de Kinetix:</strong> En deportistas con elevado desarrollo de masa muscular y fuerza, el IMC puede ubicarse en rango de sobrepeso (&gt; 25) aun teniendo baja grasa corporal. Por eso en Kinetix siempre contrastamos tu IMC con tu % de masa muscular y tu nivel de Grasa Visceral.
                </div>
              </div>

              {/* SECTION 3: PASOS PARA COPIAR TU MEDICIÓN */}
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-white text-xs">
                  Pasos para sincronizar tus mediciones en Kinetix:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400">
                  <li>Súbete descalzo a tu báscula RENPHO con la app abierta en tu teléfono.</li>
                  <li>Espera a que los números se fijen y se complete el escaneo de bioimpedancia.</li>
                  <li>En Kinetix Progress pulsa <strong className="text-white">+ Nuevo Registro</strong>.</li>
                  <li>Introduce tu <strong>Peso</strong>, tu <strong>% Músculo</strong>, tu <strong>% Grasa</strong> y tu <strong>Nivel de Grasa Visceral</strong>.</li>
                  <li>Kinetix Progress calculará y graficará de inmediato tu IMC con los mismos colores de tu app Renpho.</li>
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
