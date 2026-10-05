import React, { useState } from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { getPaymentGroup } from '../../utils/paymentColorCodes';
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
  Table
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
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');
  const [reportType, setReportType] = useState<'consolidated' | 'body_comp' | 'evaluations' | 'memberships'>('consolidated');
  const [dateFilter, setDateFilter] = useState<'all' | 'current_month' | 'last_30_days' | 'current_year'>('all');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const athletes = users.filter(u => u.role === 'athlete');

  // Filter athletes based on selection
  const targetAthletes = selectedAthleteId === 'all' 
    ? athletes 
    : athletes.filter(a => a.id === selectedAthleteId);

  // Helper to filter dates
  const isDateInFilter = (dateStr: string): boolean => {
    if (dateFilter === 'all') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'current_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'last_30_days') {
      const diffMs = now.getTime() - itemDate.getTime();
      return diffMs <= 30 * 24 * 60 * 60 * 1000 && diffMs >= 0;
    }
    if (dateFilter === 'current_year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Helper to escape CSV values
  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const generateAndDownloadCsv = () => {
    let rows: string[][] = [];
    let filename = 'Kinetix_Exportacion.csv';
    const timestamp = new Date().toISOString().slice(0, 10);

    if (reportType === 'consolidated') {
      filename = `Kinetix_Reporte_Consolidado_${timestamp}.csv`;
      rows.push([
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
        'Nivel Cooper (1-5)',
        'Metros Cooper',
        'Sentadilla 1RM (kg)',
        'Peso Muerto 1RM (kg)',
        'Press Horizontal 1RM (kg)',
        'Resistencia Funcional Reto',
        'Tiempo Resistencia',
        'Fecha Última Evaluación'
      ]);

      targetAthletes.forEach(ath => {
        const athComps = bodyCompRecords.filter(b => b.userId === ath.id && isDateInFilter(b.recordedAt));
        const latestComp = athComps[athComps.length - 1];

        const athEvals = evaluations.filter(e => e.userId === ath.id && isDateInFilter(e.evaluationDate));
        const latestEval = athEvals[athEvals.length - 1];

        const pg = getPaymentGroup(ath.membership.billingDayOfMonth);

        const squat = latestEval?.strengthRecords.find(s => s.exerciseId === 'squats')?.estimated1RMKg || 'N/A';
        const deadlift = latestEval?.strengthRecords.find(s => s.exerciseId === 'deadlift')?.estimated1RMKg || 'N/A';
        const press = latestEval?.strengthRecords.find(s => s.exerciseId === 'horizontal_press')?.estimated1RMKg || 'N/A';

        rows.push([
          ath.id,
          ath.name,
          ath.email,
          ath.phone,
          ath.membership.planName,
          ath.membership.status === 'active' ? 'Activo' : ath.membership.status === 'suspended' ? 'Pausado' : 'Por Vencer',
          `${pg.colorName} (Día ${pg.day})`,
          String(ath.membership.billingDayOfMonth || 15),
          ath.membership.expiryDate,
          latestComp ? String(latestComp.weightKg) : 'Sin registro',
          latestComp ? String(latestComp.bmi) : 'N/A',
          latestComp ? latestComp.bmiCategory : 'N/A',
          latestComp ? `${latestComp.bodyFatPercent}%` : 'N/A',
          latestComp ? `${latestComp.muscleMassPercent}%` : 'N/A',
          latestComp ? String(latestComp.visceralFatLevel) : 'N/A',
          latestEval ? `Nivel ${latestEval.cooperTest.levelNumber}` : 'Sin test',
          latestEval ? `${latestEval.cooperTest.distanceMeters} m` : 'N/A',
          String(squat),
          String(deadlift),
          String(press),
          latestEval ? latestEval.enduranceTest.name : 'N/A',
          latestEval ? latestEval.enduranceTest.result : 'N/A',
          latestEval ? latestEval.evaluationDate : 'N/A'
        ]);
      });
    } else if (reportType === 'body_comp') {
      filename = `Kinetix_Antropometria_Composicion_${timestamp}.csv`;
      rows.push([
        'Fecha Medición',
        'ID Atleta',
        'Nombre Atleta',
        'Correo',
        'Peso Corporal (kg)',
        'IMC',
        'Clasificación IMC',
        '% Grasa Corporal',
        '% Masa Muscular',
        'Nivel Grasa Visceral',
        'Registrado Por',
        'Notas de Medición'
      ]);

      targetAthletes.forEach(ath => {
        const athComps = bodyCompRecords.filter(b => b.userId === ath.id && isDateInFilter(b.recordedAt));
        athComps.forEach(c => {
          rows.push([
            c.recordedAt,
            ath.id,
            ath.name,
            ath.email,
            String(c.weightKg),
            String(c.bmi),
            c.bmiCategory,
            `${c.bodyFatPercent}%`,
            `${c.muscleMassPercent}%`,
            String(c.visceralFatLevel),
            c.recordedByRole === 'staff' ? 'Coach' : 'Atleta',
            c.notes || ''
          ]);
        });
      });
    } else if (reportType === 'evaluations') {
      filename = `Kinetix_Evaluaciones_Cooper_1RM_${timestamp}.csv`;
      rows.push([
        'Fecha Evaluación',
        'ID Atleta',
        'Nombre Atleta',
        'Coach Evaluador',
        'Nivel Cooper (1-5)',
        'Clasificación Cooper',
        'Metros Recorridos Cooper',
        'Notas Cooper',
        'Reto de Resistencia',
        'Tiempo Resistencia',
        'Nivel Resistencia',
        'Sentadilla Trasera 1RM (kg)',
        'Peso Muerto 1RM (kg)',
        'Press Horizontal 1RM (kg)',
        'Dominadas Lastradas 1RM (kg)',
        'Hip Thrust 1RM (kg)',
        'Observaciones del Coach'
      ]);

      targetAthletes.forEach(ath => {
        const athEvals = evaluations.filter(e => e.userId === ath.id && isDateInFilter(e.evaluationDate));
        athEvals.forEach(ev => {
          const sq = ev.strengthRecords.find(s => s.exerciseId === 'squats')?.estimated1RMKg || 0;
          const dl = ev.strengthRecords.find(s => s.exerciseId === 'deadlift')?.estimated1RMKg || 0;
          const pr = ev.strengthRecords.find(s => s.exerciseId === 'horizontal_press')?.estimated1RMKg || 0;
          const pu = ev.strengthRecords.find(s => s.exerciseId === 'pullups_or_rows')?.estimated1RMKg || 0;
          const ht = ev.strengthRecords.find(s => s.exerciseId === 'hip_thrust')?.estimated1RMKg || 0;

          rows.push([
            ev.evaluationDate,
            ath.id,
            ath.name,
            ev.coachName,
            String(ev.cooperTest.levelNumber || 5),
            ev.cooperTest.level,
            String(ev.cooperTest.distanceMeters),
            ev.cooperTest.notes || '',
            ev.enduranceTest.name,
            ev.enduranceTest.result,
            ev.enduranceTest.scoreScoreLevel || 'Avanzado',
            String(sq),
            String(dl),
            String(pr),
            String(pu),
            String(ht),
            ev.generalCoachNotes || ''
          ]);
        });
      });
    } else if (reportType === 'memberships') {
      filename = `Kinetix_Padron_Membresias_Pagos_${timestamp}.csv`;
      rows.push([
        'ID Atleta',
        'Nombre Completo',
        'Correo Electrónico',
        'Teléfono',
        'Plan Oficial',
        'Estado de Acceso',
        'Código de Color',
        'Día de Corte Mensual',
        'Fecha Límite de Pago',
        'Cuota Mensual ($)',
        'Plan de Nutrición Incluido',
        'Entrenador Personal Asignado'
      ]);

      targetAthletes.forEach(ath => {
        const pg = getPaymentGroup(ath.membership.billingDayOfMonth);
        rows.push([
          ath.id,
          ath.name,
          ath.email,
          ath.phone,
          ath.membership.planName,
          ath.membership.status === 'active' ? 'Activo' : ath.membership.status === 'suspended' ? 'Pausado' : 'Por Vencer',
          `${pg.colorName} (Día ${pg.day})`,
          String(ath.membership.billingDayOfMonth || 15),
          ath.membership.expiryDate,
          `$${ath.membership.monthlyFee}`,
          ath.membership.hasNutritionPlan ? 'Sí' : 'No',
          ath.membership.personalCoach || 'General'
        ]);
      });
    }

    // Convert to CSV with commas and quotes
    const csvContent = rows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
    
    // Add UTF-8 BOM so Microsoft Excel opens Spanish characters and accents properly
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Exportar Datos a Excel / CSV
              </h3>
              <p className="text-xs text-neutral-400">Descarga reportes listos para abrir en Microsoft Excel o Sheets</p>
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
          <div className="p-6 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-white">¡Archivo Excel Descargado con Éxito!</h4>
            <p className="text-xs text-neutral-400">
              El archivo CSV con codificación UTF-8 se ha guardado en tus descargas. Puedes abrirlo directamente en Microsoft Excel, Google Sheets o Numbers.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Filter 1: Report Type */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Selecciona el Tipo de Información:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('consolidated')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reportType === 'consolidated'
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <strong className="block font-bold text-xs">📊 Reporte Integral</strong>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Todos los datos consolidados: peso, grasa, Cooper, 1RM y corte de pago.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('body_comp')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reportType === 'body_comp'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <strong className="block font-bold text-xs">⚖️ Composición & Bioimpedancia</strong>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Historial de peso, IMC, % grasa, masa muscular y grasa visceral.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('evaluations')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reportType === 'evaluations'
                      ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <strong className="block font-bold text-xs">⚡ Evaluaciones Cooper & 1RM</strong>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Resultados de fuerza máxima, metros en Cooper y retos de resistencia.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('memberships')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reportType === 'memberships'
                      ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <strong className="block font-bold text-xs">💳 Membresías & Códigos de Color</strong>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Padrón de cobros: día de corte (Azul, Rojo, Rosa, Verde) y estatus.
                  </span>
                </button>
              </div>
            </div>

            {/* Filter 2: Athlete Selector */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Atletas a Incluir:</span>
              </label>

              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-blue-500"
              >
                <option value="all">👥 Todos los Atletas ({athletes.length} alumnos registrados)</option>
                {athletes.map(ath => (
                  <option key={ath.id} value={ath.id}>
                    👤 {ath.name} ({ath.email}) · Corte Día {ath.membership.billingDayOfMonth || 15}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Date Range / Month */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>3. Rango de Fechas / Período:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    dateFilter === 'all'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Historial Completo
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('current_month')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    dateFilter === 'current_month'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Mes Actual
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('last_30_days')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    dateFilter === 'last_30_days'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Últimos 30 días
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('current_year')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    dateFilter === 'current_year'
                      ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Año Actual
                </button>
              </div>
            </div>

            {/* Preview Summary */}
            <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <span className="font-semibold text-neutral-200 block">Resumen del archivo a generar:</span>
              <p>
                Se exportarán los datos de <strong>{selectedAthleteId === 'all' ? `todos los ${athletes.length} atletas` : targetAthletes[0]?.name}</strong> para el período <strong>{dateFilter === 'all' ? 'completo' : dateFilter === 'current_month' ? 'mes actual' : dateFilter === 'last_30_days' ? 'últimos 30 días' : 'año actual'}</strong>.
              </p>
            </div>

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
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar para Excel (.csv)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
