import React from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { Printer, Download, X, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ProgressReportModalProps {
  athlete: UserProfile;
  latestBodyComp?: BodyCompositionRecord | null;
  latestEval?: PhysicalEvaluationRecord | null;
  gymLogoUrl?: string | null;
  onClose: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  athlete,
  latestBodyComp,
  latestEval,
  gymLogoUrl,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Defensive validation: ensure records belong exclusively to this athlete
  const validBodyComp = latestBodyComp && latestBodyComp.userId === athlete.id ? latestBodyComp : null;
  const validEval = latestEval && latestEval.userId === athlete.id ? latestEval : null;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const currentYear = now.getFullYear();
  const currentQuarter = `Trimestre Q${Math.floor(now.getMonth() / 3) + 1} ${currentYear}`;
  const folioCode = `KZ-EVAL-${currentYear}-${(athlete.id || '001').replace('user-', '').slice(-4).toUpperCase()}`;

  return (
    <div className="printable-modal-overlay fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:block print:overflow-visible">
      {/* Print styles injection to ensure perfect non-truncated printing */}
      <style>{`
        @media print {
          @page {
            margin: 12mm 15mm;
            size: letter portrait;
          }
          html, body {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-modal-overlay {
            display: block !important;
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
          #kinetix-printable-report {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111827 !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print-area {
            display: none !important;
          }
          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12pt !important;
            background: #ffffff !important;
            color: #111827 !important;
            border: 1px solid #e5e7eb !important;
          }
          .print-card * {
            color: #111827 !important;
          }
          .print-text-muted {
            color: #4b5563 !important;
          }
        }
      `}</style>

      <div 
        id="kinetix-printable-report"
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 text-neutral-100 max-h-[95vh] overflow-y-auto shadow-2xl print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white print:p-0 print:space-y-4"
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 no-print no-print-area">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-brand">
              Informe Oficial de Rendimiento y Composición Corporal
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Sheet */}
        <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 space-y-6 print:border-none print:p-0 print:bg-white print:text-black">
          {/* Header with Gym Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-800 pb-5 gap-4">
            <div className="flex items-center gap-3">
              {gymLogoUrl ? (
                <img
                  src={gymLogoUrl}
                  alt="Logo Kinetix"
                  className="w-12 h-12 object-contain rounded-xl border border-neutral-800 bg-neutral-900 p-1"
                />
              ) : (
                <span className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md">
                  KZ
                </span>
              )}
              <div>
                <span className="text-xl font-bold tracking-tight text-white font-brand">
                  KINETIX <span className="font-light text-neutral-400">Functional Zone</span>
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Departamento de Fisiología del Ejercicio & Evaluación Funcional
                </p>
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <span className="font-mono text-emerald-400 font-semibold">Folio: {folioCode}</span>
              <div className="text-neutral-400 text-[11px]">Fecha de Emisión: {formattedDate}</div>
              <div className="text-neutral-500 text-[10px]">Validez: {currentQuarter}</div>
            </div>
          </div>

          {/* Athlete Data Card */}
          <div className="print-card grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Atleta</span>
              <strong className="text-white text-sm">{athlete.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Plan de Membresía</span>
              <span className="text-neutral-300">{athlete.membership.planName}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Estatura / Edad</span>
              <span className="text-neutral-300 font-mono">{athlete.heightCm} cm · 28 años</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Entrenador Responsable</span>
              <span className="text-emerald-400 font-medium">{validEval?.coachName || 'Leslie (Dueña & Coach)'}</span>
            </div>
          </div>

          {/* Section 1: Body Composition Table */}
          <div className="print-card space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Resultados de Composición Corporal (Bioimpedancia Eléctrica)
            </h4>

            {!validBodyComp ? (
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center text-xs text-neutral-400">
                Aún no se han capturado mediciones antropométricas para este atleta. Inicia tu primer registro para generar la tabla de composición corporal.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Peso Total</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{validBodyComp.weightKg} kg</div>
                  <span className="text-[10px] text-neutral-400">Medición oficial</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Masa Muscular</span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{validBodyComp.muscleMassPercent}%</div>
                  <span className="text-[10px] text-emerald-400">Tejido magro</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Grasa Corporal</span>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">{validBodyComp.bodyFatPercent}%</div>
                  <span className="text-[10px] text-purple-400">Porcentaje graso</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Grasa Visceral</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">Nivel {validBodyComp.visceralFatLevel}</div>
                  <span className="text-[10px] text-neutral-400">Escala Renpho</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-neutral-400">IMC (OMS)</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{validBodyComp.bmi}</div>
                  <span className="text-[10px] text-emerald-400">{validBodyComp.bmiCategory}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Physical Performance & 1RM */}
          <div className="print-card space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              2. Capacidad Aeróbica (Test Cooper) & Fuerza Máxima (1RM)
            </h4>

            {!validEval ? (
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center text-xs text-neutral-400">
                Aún no se han capturado evaluaciones de capacidad física (Test de Cooper o Pruebas de Fuerza 1RM) para este atleta. Inicia tu primera evaluación técnica con el Coach.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Test de Cooper (12 Minutos)</span>
                    <span className="text-[#ff5500] font-bold bg-orange-950/80 border border-orange-800/60 px-2 py-0.5 rounded text-[10px]">
                      NIVEL {validEval.cooperTest.levelNumber || 1} DE 20
                    </span>
                  </div>
                  <div className="text-sm font-mono text-neutral-300">
                    Nivel Asignado: <strong className="text-white">{validEval.cooperTest.level}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Diagnóstico Staff: {validEval.cooperTest.description}
                  </div>
                  {validEval.enduranceTest && (
                    <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                      Resistencia específica: {validEval.enduranceTest.name} ({validEval.enduranceTest.result})
                    </div>
                  )}
                </div>

                <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-2">
                  <span className="font-semibold text-white block">Evaluación de Cargas Máximas (1RM)</span>
                  <div className="space-y-1 text-[11px] font-mono">
                    {validEval.strengthRecords.map(rec => (
                      <div key={rec.exerciseId} className="flex justify-between py-0.5 border-b border-neutral-800/40 last:border-none">
                        <span className="text-neutral-400 font-sans">{rec.exerciseName}:</span>
                        <span className="text-white font-bold">{rec.estimated1RMKg} kg ({rec.weightKg}kg × {rec.reps})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coach Conclusion */}
          {validEval?.generalCoachNotes && validEval.generalCoachNotes.trim() ? (
            <div className="print-card pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">Observaciones del Entrenador</span>
                <p className="text-neutral-300 text-xs italic mt-0.5 leading-relaxed bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                  {validEval.generalCoachNotes}
                </p>
              </div>
            </div>
          ) : (
            <div className="print-card pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">Observaciones del Entrenador</span>
                <div className="min-h-[36px] bg-neutral-950 p-3 rounded-2xl border border-neutral-800/60 text-neutral-600 text-xs italic">
                  {/* Espacio reservado para dictamen oficial o firma en físico */}
                </div>
              </div>
            </div>
          )}

          {/* Institutional Signature & Stamp (Printable) */}
          <div className="print-card pt-4 border-t border-neutral-800/80 grid grid-cols-2 gap-6 text-[11px] text-neutral-400 font-mono">
            <div className="space-y-1">
              <div className="text-[10px] uppercase text-neutral-500 font-sans">Validación Técnica Oficial</div>
              <div className="font-bold text-white">{validEval?.coachName || 'Leslie (Dueña & Coach)'}</div>
              <div className="text-[10px] text-neutral-400">Head Coach & Dirección Kinetix</div>
              <div className="pt-3 border-b border-neutral-700 w-36"></div>
              <div className="text-[9px] text-neutral-500">Firma de Conformidad</div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-[10px] uppercase text-neutral-500 font-sans">Sello de Certificación</div>
              <div className="text-emerald-400 font-bold">KINETIX PROGRESS VERIFIED</div>
              <div className="text-[9px] text-neutral-400">ID Folio: {folioCode}</div>
              <div className="text-[9px] text-neutral-400">Fecha: {formattedDate}</div>
              <div className="text-[9px] text-neutral-400">CDMX · Gustavo A. Madero</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
