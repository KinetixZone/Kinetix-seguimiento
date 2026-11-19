import React, { useMemo, useState } from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { exportYearBackupExcelXml } from './ExcelExportModal';
import { getLocalTodayDateStr, isAerobicOmittedEval, resolveLatestStrengthPillars } from '../../utils/evaluationHelpers';
import { Archive, CheckCircle2, Download, ShieldCheck, AlertTriangle, X, Trash2 } from 'lucide-react';

interface AnnualArchiveModalProps {
  users: UserProfile[];
  bodyCompRecords: BodyCompositionRecord[];
  evaluations: PhysicalEvaluationRecord[];
  onArchiveOldYearRecords?: (year: string) => Promise<{ deletedEvals: number; deletedBody: number; deletedNotifs: number }>;
  onClose: () => void;
}

export const AnnualArchiveModal: React.FC<AnnualArchiveModalProps> = ({
  users,
  bodyCompRecords,
  evaluations,
  onArchiveOldYearRecords,
  onClose,
}) => {
  const currentYear = getLocalTodayDateStr().slice(0, 4);

  const priorYears = useMemo(() => {
    const yrs = new Set<string>();
    bodyCompRecords.forEach(b => {
      const y = (b.recordedAt || '').slice(0, 4);
      if (y && y < currentYear) yrs.add(y);
    });
    evaluations.forEach(e => {
      const y = (e.evaluationDate || '').slice(0, 4);
      if (y && y < currentYear) yrs.add(y);
    });
    return Array.from(yrs).sort((a, b) => b.localeCompare(a));
  }, [bodyCompRecords, evaluations, currentYear]);

  const [selectedYear, setSelectedYear] = useState<string>(() => priorYears[0] || String(Number(currentYear) - 1));
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<{ deletedEvals: number; deletedBody: number; deletedNotifs: number } | null>(null);

  // Calculate exact protected baselines vs archivable records for preview
  const stats = useMemo(() => {
    const protectedBodyIds = new Set<string>();
    const protectedEvalIds = new Set<string>();

    users.forEach(u => {
      const athB = bodyCompRecords.filter(b => b.userId === u.id).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      if (athB.length > 0) protectedBodyIds.add(athB[athB.length - 1].id);

      const athE = evaluations.filter(e => e.userId === u.id).sort((a, b) => a.evaluationDate.localeCompare(b.evaluationDate));
      if (athE.length > 0) {
        protectedEvalIds.add(athE[athE.length - 1].id);
        const aero = [...athE].reverse().find(e => !isAerobicOmittedEval(e));
        if (aero) protectedEvalIds.add(aero.id);
        resolveLatestStrengthPillars(athE).forEach(p => {
          if (p.evaluationId) protectedEvalIds.add(p.evaluationId);
        });
      }
    });

    const totalYearBody = bodyCompRecords.filter(b => (b.recordedAt || '').startsWith(selectedYear)).length;
    const totalYearEval = evaluations.filter(e => (e.evaluationDate || '').startsWith(selectedYear)).length;
    const prunableBody = bodyCompRecords.filter(b => (b.recordedAt || '').startsWith(selectedYear) && !protectedBodyIds.has(b.id)).length;
    const prunableEval = evaluations.filter(e => (e.evaluationDate || '').startsWith(selectedYear) && !protectedEvalIds.has(e.id)).length;

    return {
      totalYearBody,
      totalYearEval,
      prunableBody,
      prunableEval,
      protectedCount: (totalYearBody - prunableBody) + (totalYearEval - prunableEval),
    };
  }, [users, bodyCompRecords, evaluations, selectedYear]);

  const handleDownloadBackup = () => {
    exportYearBackupExcelXml(users, bodyCompRecords, evaluations, selectedYear);
    setBackupDownloaded(true);
  };

  const handleConfirmPrune = async () => {
    if (!onArchiveOldYearRecords || !backupDownloaded) return;
    setIsPruning(true);
    try {
      const res = await onArchiveOldYearRecords(selectedYear);
      setPruneResult(res);
    } finally {
      setIsPruning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">Cierre Anual & Depuración Segura</h3>
              <p className="text-xs text-neutral-400">Mantén Supabase ligero sin perder las marcas actuales de ningún atleta</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pruneResult ? (
          <div className="p-6 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">¡Año {selectedYear} Depurado con Éxito!</h4>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Se limpiaron <strong>{pruneResult.deletedEvals}</strong> evaluaciones históricas,{' '}
              <strong>{pruneResult.deletedBody}</strong> pesajes antiguos y{' '}
              <strong>{pruneResult.deletedNotifs}</strong> avisos leídos de app y Supabase.
              El último registro vigente de cada atleta permanece 100% protegido.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {priorYears.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-white">Base de datos del año {currentYear} al día</p>
                <p className="text-[11px] text-neutral-400">
                  Aún no hay registros de años anteriores a {currentYear} para depurar. Cuando cambie de año podrás descargar el Excel completo de {currentYear} y limpiar registros históricos antiguos de forma segura.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold block">Selecciona el año anterior a cerrar:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setBackupDownloaded(false);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                  >
                    {priorYears.map(yr => (
                      <option key={yr} value={yr}>Año {yr}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 block">Evaluaciones {selectedYear}</span>
                    <strong className="text-base font-mono text-white">{stats.prunableEval}</strong>
                    <span className="text-[9px] text-neutral-500 block">por archivar</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 block">Pesajes {selectedYear}</span>
                    <strong className="text-base font-mono text-white">{stats.prunableBody}</strong>
                    <span className="text-[9px] text-neutral-500 block">por archivar</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 text-center">
                    <span className="text-[10px] text-emerald-300 block">Últimas Marcas</span>
                    <strong className="text-base font-mono text-emerald-400">{stats.protectedCount}</strong>
                    <span className="text-[9px] text-emerald-400/80 block">protegidas</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/50 flex items-start gap-2.5 text-[11px] text-blue-200 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Protección Kinetix:</strong> El último pesaje, último Cooper/Navette y los 5 pilares 1RM vigentes de cada atleta <strong>NUNCA se borran</strong> aunque hayan sido en {selectedYear}. Solo se depura el historial repetido antiguo tras descargar tu respaldo.
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      backupDownloaded
                        ? 'bg-emerald-950/60 border border-emerald-600/60 text-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {backupDownloaded
                        ? `✓ 1. Respaldo Excel Año ${selectedYear} Descargado`
                        : `1. Descargar Respaldo Excel Completo (${selectedYear})`}
                    </span>
                  </button>

                  {!backupDownloaded && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 px-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Primero descarga el respaldo Excel para habilitar la depuración en nube.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!backupDownloaded || isPruning || (stats.prunableBody === 0 && stats.prunableEval === 0)}
                    onClick={handleConfirmPrune}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {isPruning
                        ? 'Depurando registros antiguos...'
                        : `2. Depurar Historial Antiguo de ${selectedYear}`}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
