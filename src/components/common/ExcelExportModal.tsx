import React, { useState } from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { OFFICIAL_COLORS, getPaymentGroup } from '../../utils/paymentColorCodes';
import { 
  FileSpreadsheet, 
  Download, 
  X, 
  Calendar, 
  Users, 
  Filter, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Table,
  Search,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface ExcelExportModalProps {
  users: UserProfile[];
  bodyCompRecords: BodyCompositionRecord[];
  evaluations: PhysicalEvaluationRecord[];
  onClose: () => void;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  users,
  bodyCompRecords,
  evaluations,
  onClose,
}) => {
  const [athleteScope, setAthleteScope] = useState<'all' | 'single' | 'color'>('all');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedColorDay, setSelectedColorDay] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [reportType, setReportType] = useState<'consolidated' | 'credentials' | 'body_comp' | 'evaluations'>('consolidated');
  const [dateFilter, setDateFilter] = useState<'all' | 'current_month' | 'specific_month' | 'current_year'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [includePasswords, setIncludePasswords] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const athletes = users.filter(u => u.role === 'athlete');
  const staff = users.filter(u => u.role === 'staff');

  const filteredAthletesList = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Target athletes based on filters
  let targetAthletes = athletes;
  if (athleteScope === 'single' && selectedAthleteId) {
    targetAthletes = athletes.filter(a => a.id === selectedAthleteId);
  } else if (athleteScope === 'color') {
    targetAthletes = athletes.filter(a => (a.membership.billingDayOfMonth || 15) === selectedColorDay);
  }

  const isDateInFilter = (dateStr: string): boolean => {
    if (dateFilter === 'all') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'current_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'specific_month') {
      return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'current_year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const generateAndDownloadCsv = () => {
    let rows: string[][] = [];
    let filename = 'Kinetix_Exportacion.csv';
    const timestamp = new Date().toISOString().slice(0, 10);

    if (reportType === 'credentials') {
      filename = `Kinetix_Credenciales_y_Control_${timestamp}.csv`;
      rows.push([
        'Tipo de Usuario',
        'ID Usuario',
        'Nombre Completo',
        'Correo Electrónico',
        'Clave de Acceso (Password)',
        'Teléfono',
        'Plan Kinetix',
        'Estado Membresía',
        'Día de Corte',
        'Fecha Vencimiento',
        'Fecha Alta / Registro'
      ]);

      // Export staff and target athletes
      staff.forEach(st => {
        rows.push([
          `Staff (${st.staffRole === 'owner' ? 'Dueño/a' : 'Coach'})`,
          st.id,
          st.name,
          st.email,
          st.password || 'kinetix2026',
          st.phone || 'N/A',
          'Acceso Permanente Staff',
          'Permanente (Sin cobro)',
          'N/A',
          'Permanente',
          st.createdAt || '2024-01-01'
        ]);
      });

      targetAthletes.forEach(ath => {
        rows.push([
          'Atleta',
          ath.id,
          ath.name,
          ath.email,
          ath.password || 'kinetix123',
          ath.phone || 'N/A',
          ath.membership.planName,
          ath.membership.status === 'active' ? 'Activo' : 'Suspendido/Vencido',
          String(ath.membership.billingDayOfMonth || 15),
          ath.membership.expiryDate,
          ath.createdAt || '2024-01-01'
        ]);
      });

    } else if (reportType === 'consolidated') {
      filename = `Kinetix_Reporte_Consolidado_${timestamp}.csv`;
      const headers = [
        'ID Atleta',
        'Nombre Completo',
        'Correo Electrónico',
        'Teléfono',
        'Plan Kinetix',
        'Estado de Acceso',
        'Código de Color Pago',
        'Día de Corte Mensual',
        'Próximo Vencimiento',
        'Último Peso (kg)',
        'IMC',
        'Categoría IMC',
        '% Grasa Corporal',
        '% Masa Muscular',
        'Grasa Visceral',
        'Nivel Cooper (1-20)',
        'Sentadilla 1RM (kg)',
        'Peso Muerto 1RM (kg)',
        'Press Horizontal 1RM (kg)',
        'Resistencia Funcional Reto',
        'Tiempo Resistencia'
      ];
      if (includePasswords) {
        headers.push('Clave de Acceso (Password)');
      }
      rows.push(headers);

      targetAthletes.forEach(ath => {
        const athComps = bodyCompRecords.filter(b => b.userId === ath.id && isDateInFilter(b.recordedAt));
        const latestComp = athComps[athComps.length - 1];

        const athEvals = evaluations.filter(e => e.userId === ath.id && isDateInFilter(e.evaluationDate));
        const latestEval = athEvals[athEvals.length - 1];

        const pg = getPaymentGroup(ath.membership.billingDayOfMonth);

        const squat = latestEval?.strengthRecords.find(s => s.exerciseId === 'squats')?.estimated1RMKg || 'N/A';
        const deadlift = latestEval?.strengthRecords.find(s => s.exerciseId === 'deadlift')?.estimated1RMKg || 'N/A';
        const press = latestEval?.strengthRecords.find(s => s.exerciseId === 'horizontal_press')?.estimated1RMKg || 'N/A';

        const row = [
          ath.id,
          ath.name,
          ath.email,
          ath.phone,
          ath.membership.planName,
          ath.membership.status === 'active' ? 'Activo' : 'Suspendido',
          `${pg.colorName} (Día ${ath.membership.billingDayOfMonth || 15})`,
          String(ath.membership.billingDayOfMonth || 15),
          ath.membership.expiryDate,
          latestComp ? String(latestComp.weightKg) : 'Sin mediciones',
          latestComp ? String(latestComp.bmi) : 'N/A',
          latestComp ? latestComp.bmiCategory : 'N/A',
          latestComp ? `${latestComp.bodyFatPercent}%` : 'N/A',
          latestComp ? `${latestComp.muscleMassPercent}%` : 'N/A',
          latestComp ? `Nivel ${latestComp.visceralFatLevel}` : 'N/A',
          latestEval ? `Nivel ${latestEval.cooperTest.levelNumber || 1}` : 'Sin evaluar',
          String(squat),
          String(deadlift),
          String(press),
          latestEval ? latestEval.enduranceTest.name : 'N/A',
          latestEval ? latestEval.enduranceTest.result : 'N/A'
        ];

        if (includePasswords) {
          row.push(ath.password || 'kinetix123');
        }

        rows.push(row);
      });

    } else if (reportType === 'body_comp') {
      filename = `Kinetix_Antropometria_${timestamp}.csv`;
      rows.push([
        'ID Medición',
        'ID Atleta',
        'Nombre Atleta',
        'Fecha Medición',
        'Peso (kg)',
        'Masa Muscular (%)',
        'Grasa Corporal (%)',
        'Grasa Visceral (Nivel)',
        'IMC',
        'Categoría IMC',
        'Notas del Entrenador'
      ]);

      targetAthletes.forEach(ath => {
        const comps = bodyCompRecords.filter(b => b.userId === ath.id && isDateInFilter(b.recordedAt));
        comps.forEach(c => {
          rows.push([
            c.id,
            ath.id,
            ath.name,
            c.recordedAt,
            String(c.weightKg),
            String(c.muscleMassPercent),
            String(c.bodyFatPercent),
            String(c.visceralFatLevel),
            String(c.bmi),
            c.bmiCategory,
            c.notes || ''
          ]);
        });
      });

    } else {
      // Evaluations
      filename = `Kinetix_Pruebas_Fisicas_${timestamp}.csv`;
      rows.push([
        'ID Evaluación',
        'ID Atleta',
        'Nombre Atleta',
        'Fecha Evaluación',
        'Coach Responsable',
        'Nivel Cooper',
        'Distancia Cooper (m)',
        'Reto Resistencia',
        'Tiempo Resistencia',
        'Sentadilla 1RM (kg)',
        'Peso Muerto 1RM (kg)',
        'Hip Thrust 1RM (kg)',
        'Press Horizontal 1RM (kg)',
        'Remo/Dominadas 1RM (kg)',
        'Observaciones Coach'
      ]);

      targetAthletes.forEach(ath => {
        const evals = evaluations.filter(e => e.userId === ath.id && isDateInFilter(e.evaluationDate));
        evals.forEach(ev => {
          const sq = ev.strengthRecords.find(s => s.exerciseId === 'squats')?.estimated1RMKg || 'N/A';
          const dl = ev.strengthRecords.find(s => s.exerciseId === 'deadlift')?.estimated1RMKg || 'N/A';
          const ht = ev.strengthRecords.find(s => s.exerciseId === 'hip_thrust')?.estimated1RMKg || 'N/A';
          const pr = ev.strengthRecords.find(s => s.exerciseId === 'horizontal_press')?.estimated1RMKg || 'N/A';
          const rw = ev.strengthRecords.find(s => s.exerciseId === 'pullups_or_rows')?.estimated1RMKg || 'N/A';

          rows.push([
            ev.id,
            ath.id,
            ath.name,
            ev.evaluationDate,
            ev.coachName,
            `Nivel ${ev.cooperTest.levelNumber || 1}`,
            String(ev.cooperTest.distanceMeters || 'N/A'),
            ev.enduranceTest.name,
            ev.enduranceTest.result,
            String(sq),
            String(dl),
            String(ht),
            String(pr),
            String(rw),
            ev.generalCoachNotes || ''
          ]);
        });
      });
    }

    const csvContent = '\uFEFF' + rows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1600);
  };

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Exportar a Excel / CSV Kinetix
              </h3>
              <p className="text-xs text-neutral-400">Filtra atletas, meses, credenciales y reportes oficiales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess ? (
          <div className="p-8 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">¡Archivo Excel Descargado!</h4>
            <p className="text-xs text-neutral-400">
              El reporte CSV compatible con Microsoft Excel y Google Sheets se ha guardado en tu dispositivo.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Report Type */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block">
                Tipo de Archivo a Generar:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('consolidated')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'consolidated'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reporte Consolidado</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Perfil + IMC + Cooper + 1RM
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('credentials')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'credentials'
                      ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Claves y Control Staff</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Lista de contraseñas y contactos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('body_comp')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'body_comp'
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Bioimpedancia Renpho</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Historial de peso, grasa y músculo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('evaluations')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    reportType === 'evaluations'
                      ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    <span>Pruebas Físicas (1RM)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Sentadilla, muerto, press, Cooper
                  </span>
                </button>
              </div>
            </div>

            {/* Athlete Scope Filter */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center justify-between">
                <span>¿De qué atletas exportar?</span>
                <span className="text-[10px] text-neutral-500 font-mono">Filtro de Selección</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setAthleteScope('all'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'all'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">👥 Todos ({athletes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAthleteScope('single')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'single'
                      ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-1 ring-purple-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">👤 1 Alumno</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAthleteScope('color'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    athleteScope === 'color'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">📅 Por Corte</span>
                </button>
              </div>
            </div>

            {/* If Single Athlete Selected */}
            {athleteScope === 'single' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-700/60">
                  <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar atleta por nombre o correo..."
                    className="w-full bg-transparent text-white text-xs outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm('')} className="text-neutral-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {filteredAthletesList.map(ath => (
                    <button
                      key={ath.id}
                      type="button"
                      onClick={() => setSelectedAthleteId(ath.id)}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors ${
                        selectedAthleteId === ath.id
                          ? 'bg-blue-600/30 border border-blue-500 text-white font-bold'
                          : 'hover:bg-neutral-900 border border-transparent text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{ath.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{ath.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* If Color Group Selected */}
            {athleteScope === 'color' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  {OFFICIAL_COLORS.map(c => {
                    const count = athletes.filter(a => (a.membership.billingDayOfMonth || 15) === c.day).length;
                    const isSelected = selectedColorDay === c.day;
                    return (
                      <button
                        key={c.day}
                        type="button"
                        onClick={() => setSelectedColorDay(c.day)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected ? c.btnActive : c.btnInactive
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span>{c.emoji} {c.colorName}</span>
                          <span className="text-[10px] font-mono">{count}</span>
                        </div>
                        <span className="text-[9px] opacity-80 block">Corte día {c.day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date / Month Range Filter */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rango de Fecha:</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Filtro Temporal</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'all'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Historial Total</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('current_month')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'current_month'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Mes Actual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('specific_month')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'specific_month'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Elegir Mes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('current_year')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    dateFilter === 'current_year'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Año 2026</span>
                </button>
              </div>

              {dateFilter === 'specific_month' && (
                <div className="pt-2 animate-fade-in">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx}>
                        Mes de {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Checkbox: Include credentials in consolidated */}
            {reportType === 'consolidated' && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePasswords}
                  onChange={(e) => setIncludePasswords(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-neutral-300 text-xs">
                  Incluir columna de <strong>Contraseña / Clave de Acceso</strong> (Control exclusivo para Dueños)
                </span>
              </label>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={generateAndDownloadCsv}
                disabled={athleteScope === 'single' && !selectedAthleteId}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
