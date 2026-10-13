import React from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { Printer, Download, X, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ProgressReportModalProps {
  athlete: UserProfile;
  latestBodyComp?: BodyCompositionRecord | null;
  latestEval?: PhysicalEvaluationRecord | null;
  onClose: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  athlete,
  latestBodyComp,
  latestEval,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 text-neutral-100 max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 no-print">
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
        <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 space-y-6 print:border-none print:p-0">
          {/* Header with Gym Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-800 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">
                  KZ
                </span>
                <span className="text-xl font-bold tracking-tight text-white font-brand">
                  KINETIX <span className="font-light text-neutral-400">Functional Zone</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Departamento de Fisiología del Ejercicio & Evaluación Funcional
              </p>
            </div>

            <div className="text-right text-xs space-y-0.5">
              <span className="font-mono text-emerald-400 font-semibold">Folio: KZ-EVAL-2024-039</span>
              <div className="text-neutral-400 text-[11px]">Fecha de Emisión: 25 de Marzo, 2024</div>
              <div className="text-neutral-500 text-[10px]">Validez: Trimestre Q1 2024</div>
            </div>
          </div>

          {/* Athlete Data Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80 text-xs">
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
              <span className="text-emerald-400 font-medium">{latestEval?.coachName || 'Coach Jorge'}</span>
            </div>
          </div>

          {/* Section 1: Body Composition Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Resultados de Composición Corporal (Bioimpedancia Eléctrica)
            </h4>

            {!latestBodyComp ? (
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center text-xs text-neutral-400">
                Aún no se han capturado mediciones antropométricas para este atleta. Inicia tu primer registro para generar la tabla de composición corporal.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Peso Total</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{latestBodyComp.weightKg} kg</div>
                  <span className="text-[10px] text-neutral-400">Medición oficial</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Masa Muscular</span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{latestBodyComp.muscleMassPercent}%</div>
                  <span className="text-[10px] text-emerald-400">Tejido magro</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Grasa Corporal</span>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">{latestBodyComp.bodyFatPercent}%</div>
                  <span className="text-[10px] text-purple-400">Porcentaje graso</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400">Grasa Visceral</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">Nivel {latestBodyComp.visceralFatLevel}</div>
                  <span className="text-[10px] text-neutral-400">Escala Renpho</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-neutral-400">IMC (OMS)</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{latestBodyComp.bmi}</div>
                  <span className="text-[10px] text-emerald-400">{latestBodyComp.bmiCategory}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Physical Performance & 1RM */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              2. Capacidad Aeróbica (Test Cooper) & Fuerza Máxima (1RM)
            </h4>

            {!latestEval ? (
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center text-xs text-neutral-400">
                Aún no se han capturado evaluaciones de capacidad física (Test de Cooper o Pruebas de Fuerza 1RM) para este atleta. Inicia tu primera evaluación técnica con el Coach.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Test de Cooper (12 Minutos)</span>
                    <span className="text-[#ff5500] font-bold bg-orange-950/80 border border-orange-800/60 px-2 py-0.5 rounded text-[10px]">
                      NIVEL {latestEval.cooperTest.levelNumber}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-neutral-300">
                    Nivel Asignado: <strong className="text-white">{latestEval.cooperTest.level}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Diagnóstico Staff: {latestEval.cooperTest.description}
                  </div>
                  {latestEval.enduranceTest && (
                    <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                      Resistencia específica: {latestEval.enduranceTest.name} ({latestEval.enduranceTest.result})
                    </div>
                  )}
                </div>

                <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-2">
                  <span className="font-semibold text-white block">Evaluación de Cargas Máximas (1RM)</span>
                  <div className="space-y-1 text-[11px] font-mono">
                    {latestEval.strengthRecords.map(rec => (
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
          <div className="pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">Observaciones del Entrenador</span>
              <p className="text-neutral-300 text-xs italic mt-0.5 leading-relaxed bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                {latestEval?.generalCoachNotes || (latestBodyComp ? 
                  `Seguimiento activo en Kinetix Functional Zone. Continúa con el plan de entrenamiento asignado para el ciclo actual.` : 
                  `Perfil dado de alta en Kinetix Progress. Pendiente de registro de primera valoración antropométrica y test físico.`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
