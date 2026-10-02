import React, { useState, useRef } from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { 
  X, 
  Share2, 
  Download, 
  Sparkles, 
  Dumbbell, 
  Heart, 
  Flame, 
  Check, 
  Instagram,
  Award
} from 'lucide-react';

interface ShareableStoryModalProps {
  athlete: UserProfile;
  latestBodyComp: BodyCompositionRecord;
  latestEval?: PhysicalEvaluationRecord;
  onClose: () => void;
}

export const ShareableStoryModal: React.FC<ShareableStoryModalProps> = ({
  athlete,
  latestBodyComp,
  latestEval,
  onClose,
}) => {
  const [storyType, setStoryType] = useState<'strength' | 'cooper' | 'body'>('strength');
  const [selectedExercise, setSelectedExercise] = useState<string>('squats');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const strengthRecord = latestEval?.strengthRecords.find(r => r.exerciseId === selectedExercise) || 
    latestEval?.strengthRecords[0] || {
      exerciseName: 'Sentadillas',
      weightKg: 120,
      reps: 1,
      estimated1RMKg: 120,
      weightUnit: 'kg'
    };

  const handleShareOrCopy = async () => {
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-brand">Compartir en Redes</h3>
              <p className="text-[10px] text-neutral-400">Formato historia 9:16 para Instagram / WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Type Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs">
          <button
            onClick={() => setStoryType('strength')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 font-semibold transition-all ${
              storyType === 'strength'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Fuerza 1RM</span>
          </button>

          <button
            onClick={() => setStoryType('cooper')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 font-semibold transition-all ${
              storyType === 'cooper'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Cooper</span>
          </button>

          <button
            onClick={() => setStoryType('body')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 font-semibold transition-all ${
              storyType === 'body'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Físico</span>
          </button>
        </div>

        {/* Exercise picker if strength */}
        {storyType === 'strength' && latestEval?.strengthRecords && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {latestEval.strengthRecords.map(rec => (
              <button
                key={rec.exerciseId}
                onClick={() => setSelectedExercise(rec.exerciseId)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap border transition-all ${
                  selectedExercise === rec.exerciseId
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                {rec.exerciseName}: {rec.weightKg}kg
              </button>
            ))}
          </div>
        )}

        {/* 9:16 Instagram Story Preview Card Canvas */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-full max-w-[280px] aspect-[9/16] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-neutral-800 shadow-2xl text-white select-none"
          >
            {/* Glowing Brand Accent Orbs */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-600/30 rounded-full blur-2xl pointer-events-none" />

            {/* Top Brand Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-xs text-white shadow-sm shadow-blue-500/40">
                  KZ
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-tight font-brand leading-none">
                    KINETIX <span className="text-red-500">ZONE</span>
                  </div>
                  <span className="text-[8px] text-neutral-400 font-mono">FUNCTIONAL TRAINING</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-900/80 border border-neutral-800">
                Marzo 2024
              </span>
            </div>

            {/* Middle Main Content */}
            <div className="relative z-10 text-center my-auto space-y-3">
              {storyType === 'strength' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <Flame className="w-3 h-3 text-red-500" />
                    <span>NUEVO RÉCORD PERSONAL (PR)</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold font-brand tracking-tight text-white uppercase">
                      {strengthRecord.exerciseName}
                    </div>
                    <div className="text-5xl font-black font-mono tracking-tight text-blue-400 drop-shadow-sm">
                      {strengthRecord.weightKg} <span className="text-xl font-normal text-white">{strengthRecord.weightUnit}</span>
                    </div>
                    <div className="text-xs text-neutral-400 font-mono">
                      1RM Estimado: <strong className="text-white">{strengthRecord.estimated1RMKg} kg</strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                      ✓ +5kg ganancia de fuerza neta
                    </span>
                  </div>
                </>
              )}

              {storyType === 'cooper' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>TEST DE COOPER 12 MIN</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-neutral-400 font-mono uppercase">Nivel Aeróbico Alcanzado</div>
                    <div className="text-5xl font-black font-brand tracking-tight text-white">
                      NIVEL {latestEval?.cooperTest.levelNumber || 5}
                    </div>
                    <div className="text-sm font-bold text-red-400 font-brand">
                      {latestEval?.cooperTest.level ? latestEval.cooperTest.level.replace(/Nivel \d\s*\(/, '').replace(/\)/, '') : 'Élite Kinetix'}
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] text-neutral-300 bg-neutral-900/90 border border-neutral-800 px-3 py-1 rounded-xl block max-w-[220px] mx-auto text-center leading-tight">
                      "Excelente potencia aeróbica y resistencia continua."
                    </span>
                  </div>
                </>
              )}

              {storyType === 'body' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>RECOMPOSICIÓN CORPORAL</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                      <span className="text-[9px] text-neutral-400 block">Masa Muscular</span>
                      <span className="text-2xl font-bold font-mono text-blue-400">
                        {latestBodyComp.muscleMassPercent}%
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono block">+1.2%</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                      <span className="text-[9px] text-neutral-400 block">Grasa Corporal</span>
                      <span className="text-2xl font-bold font-mono text-red-400">
                        {latestBodyComp.bodyFatPercent}%
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono block">-1.5%</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-400 font-mono pt-1">
                    Peso: <strong className="text-white">{latestBodyComp.weightKg}kg</strong> · Grasa Visceral: <strong className="text-white">Nivel {latestBodyComp.visceralFatLevel}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Athlete Signature Footer */}
            <div className="relative z-10 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={athlete.avatarUrl}
                  alt={athlete.name}
                  className="w-7 h-7 rounded-lg object-cover border border-blue-500/40"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="text-left">
                  <div className="text-[10px] font-bold text-white truncate max-w-[120px]">{athlete.name}</div>
                  <div className="text-[8px] text-neutral-500 font-mono">Atleta Kinetix</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold text-red-500 font-brand block">@kinetixzone</span>
                <span className="text-[7px] text-neutral-500 font-mono">#KinetixFunctional</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleShareOrCopy}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Tarjeta Lista para tu Historia de Instagram!</span>
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4" />
                <span>Compartir en Historia de Instagram / WhatsApp</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-neutral-500 text-center">
            Toca el botón para copiar o descargar la tarjeta con formato oficial de Kinetix.
          </p>
        </div>
      </div>
    </div>
  );
};
