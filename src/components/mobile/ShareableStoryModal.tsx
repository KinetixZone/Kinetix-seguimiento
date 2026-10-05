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
  MessageCircle,
  Copy,
  ExternalLink
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
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const strengthRecord = latestEval?.strengthRecords.find(r => r.exerciseId === selectedExercise) || 
    latestEval?.strengthRecords[0] || {
      exerciseName: 'Sentadillas',
      weightKg: 120,
      reps: 1,
      estimated1RMKg: 120,
      weightUnit: 'kg'
    };

  // Preformatted text for sharing
  const generateShareText = () => {
    if (storyType === 'strength') {
      return `🔥 ¡Nuevo Récord Personal en Kinetix Functional Zone!
🏋️ Ejercicio: ${strengthRecord.exerciseName}
💪 Peso Levantado: ${strengthRecord.weightKg} ${strengthRecord.weightUnit} (${strengthRecord.reps} reps)
⚡ 1RM Estimado: ${strengthRecord.estimated1RMKg} kg
👤 Atleta: ${athlete.name}
📍 @kinetixzone #KinetixFunctional #PR`;
    } else if (storyType === 'cooper') {
      return `🏃‍♂️ ¡Test de Cooper 12 Min superado en Kinetix!
⚡ Nivel Alcanzado: Nivel ${latestEval?.cooperTest.levelNumber || 5} (${latestEval?.cooperTest.level || 'Élite'})
🎯 Distancia: ${latestEval?.cooperTest.distanceMeters || 2800} metros
👤 Atleta: ${athlete.name}
📍 @kinetixzone #CooperTest #KinetixFunctional`;
    } else {
      return `✨ ¡Progreso y Recomposición Corporal en Kinetix!
⚖️ Peso: ${latestBodyComp.weightKg} kg (IMC: ${latestBodyComp.bmi})
💪 Masa Muscular: ${latestBodyComp.muscleMassPercent}%
🔥 Grasa Corporal: ${latestBodyComp.bodyFatPercent}%
👤 Atleta: ${athlete.name}
📍 @kinetixzone #FitnessJourney #KinetixFunctional`;
    }
  };

  // 1. Share directly via Web Share API (Triggers native Instagram, WhatsApp, Stories menu on mobile)
  const handleNativeShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Progreso Oficial Kinetix · ${athlete.name}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  // 2. Open WhatsApp directly with prefilled message
  const handleOpenWhatsApp = () => {
    const text = generateShareText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // 3. Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {}
  };

  // 4. Download Card as high-res PNG image
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Dark Sports Aesthetic)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, '#0a0a0c');
    bgGradient.addColorStop(0.5, '#12131a');
    bgGradient.addColorStop(1, '#050507');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing Orbs
    const blueGlow = ctx.createRadialGradient(200, 300, 50, 200, 300, 500);
    blueGlow.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
    blueGlow.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = blueGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    const redGlow = ctx.createRadialGradient(880, 1600, 50, 880, 1600, 500);
    redGlow.addColorStop(0, 'rgba(220, 38, 38, 0.35)');
    redGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = redGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    // Border Frame
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 12;
    ctx.strokeRect(60, 60, 960, 1800);

    // Top Brand Logo
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(100, 120, 90, 90, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('KZ', 115, 182);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('KINETIX FUNCTIONAL ZONE', 215, 175);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '32px monospace';
    ctx.fillText('HISTORIA OFICIAL DE RENDIMIENTO', 215, 215);

    // Middle Content
    if (storyType === 'strength') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('🔥 NUEVO RÉCORD PERSONAL (PR)', 100, 500);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px sans-serif';
      ctx.fillText(strengthRecord.exerciseName.toUpperCase(), 100, 620);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 150px monospace';
      ctx.fillText(`${strengthRecord.weightKg} ${strengthRecord.weightUnit}`, 100, 800);

      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.fillText(`1RM Estimado: ${strengthRecord.estimated1RMKg} kg · ${strengthRecord.reps} repetición(es)`, 100, 920);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 40px monospace';
      ctx.fillText('✓ Fuerza Máxima Verificada por el Coach', 100, 1040);
    } else if (storyType === 'cooper') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('❤️ TEST DE COOPER 12 MINUTOS', 100, 500);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px sans-serif';
      ctx.fillText('POTENCIA AERÓBICA', 100, 620);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 150px monospace';
      ctx.fillText(`NIVEL ${latestEval?.cooperTest.levelNumber || 5}`, 100, 800);

      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.fillText(`${latestEval?.cooperTest.level || 'Élite'} · ${latestEval?.cooperTest.distanceMeters || 2800} metros`, 100, 920);
    } else {
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('✨ COMPOSICIÓN & SALUD', 100, 500);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px sans-serif';
      ctx.fillText('RECOMPOSICIÓN CORPORAL', 100, 620);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 120px monospace';
      ctx.fillText(`${latestBodyComp.weightKg} kg`, 100, 800);

      ctx.fillStyle = '#ffffff';
      ctx.font = '48px monospace';
      ctx.fillText(`Masa Muscular: ${latestBodyComp.muscleMassPercent}% · Grasa: ${latestBodyComp.bodyFatPercent}%`, 100, 920);
    }

    // Bottom Athlete Signature
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 1650);
    ctx.lineTo(980, 1650);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(athlete.name, 100, 1730);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '36px monospace';
    ctx.fillText(`${athlete.membership.planName} · @kinetixzone`, 100, 1785);

    // Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Kinetix_Historia_${athlete.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[94vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">Compartir en Redes</h3>
              <p className="text-xs text-neutral-400">Tarjeta para Instagram Stories, WhatsApp y Redes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Type Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setStoryType('strength')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all ${
              storyType === 'strength'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Fuerza 1RM</span>
          </button>

          <button
            type="button"
            onClick={() => setStoryType('cooper')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all ${
              storyType === 'cooper'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Cooper</span>
          </button>

          <button
            type="button"
            onClick={() => setStoryType('body')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all ${
              storyType === 'body'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Composición</span>
          </button>
        </div>

        {/* Exercise picker if strength */}
        {storyType === 'strength' && latestEval?.strengthRecords && (
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 block font-medium">Selecciona el ejercicio:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {latestEval.strengthRecords.map(rec => (
                <button
                  key={rec.exerciseId}
                  type="button"
                  onClick={() => setSelectedExercise(rec.exerciseId)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all ${
                    selectedExercise === rec.exerciseId
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {rec.exerciseName}: {rec.weightKg}kg
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VISUAL STORY PREVIEW CARD (Never truncates text!) */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-full max-w-[340px] min-h-[460px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-neutral-800 shadow-2xl text-white select-none"
          >
            {/* Glowing Brand Accent Orbs */}
            <div className="absolute -top-12 -left-12 w-44 h-44 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-sm text-white shadow-md shadow-blue-500/40 shrink-0">
                  KZ
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight font-brand leading-none">
                    KINETIX <span className="text-red-500">FUNCTIONAL ZONE</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">TARJETA OFICIAL</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-800">
                {new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Middle Main Content with Safe Text Wrap */}
            <div className="relative z-10 text-center my-auto py-4 space-y-3">
              {storyType === 'strength' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>NUEVO RÉCORD PERSONAL (PR)</span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Exercise Name (Full display with break-words so Sentadilla Trasera is always visible) */}
                    <div className="text-2xl sm:text-3xl font-extrabold font-brand tracking-tight text-white uppercase break-words leading-tight px-1">
                      {strengthRecord.exerciseName}
                    </div>

                    <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-blue-400 drop-shadow-md">
                      {strengthRecord.weightKg} <span className="text-2xl font-normal text-white">{strengthRecord.weightUnit}</span>
                    </div>

                    <div className="text-xs text-neutral-300 font-mono">
                      1RM Estimado: <strong className="text-white font-bold">{strengthRecord.estimated1RMKg} kg</strong> ({strengthRecord.reps} reps)
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-full inline-block">
                      ✓ Marca Verificada en Gimnasio
                    </span>
                  </div>
                </>
              )}

              {storyType === 'cooper' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>TEST DE COOPER 12 MIN</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-neutral-400 font-mono uppercase">Potencia Aeróbica Alcanzada</div>
                    <div className="text-4xl sm:text-5xl font-black font-brand tracking-tight text-white">
                      NIVEL {latestEval?.cooperTest.levelNumber || 5}
                    </div>
                    <div className="text-base font-bold text-red-400 font-brand">
                      {latestEval?.cooperTest.level || 'Nivel 5 (Élite)'}
                    </div>
                    <div className="text-xs text-neutral-300 font-mono">
                      Distancia Recorrida: <strong className="text-white">{latestEval?.cooperTest.distanceMeters || 2800} m</strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] text-neutral-300 bg-neutral-900/90 border border-neutral-800 px-3 py-1 rounded-xl block max-w-[260px] mx-auto text-center leading-tight">
                      "Excelente resistencia cardiorrespiratoria y ritmo constante."
                    </span>
                  </div>
                </>
              )}

              {storyType === 'body' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>RECOMPOSICIÓN CORPORAL</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 text-center">
                    <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block font-medium">Masa Muscular</span>
                      <span className="text-3xl font-black font-mono text-blue-400 block my-0.5">
                        {latestBodyComp.muscleMassPercent}%
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold">+Ganancia</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block font-medium">Grasa Corporal</span>
                      <span className="text-3xl font-black font-mono text-red-400 block my-0.5">
                        {latestBodyComp.bodyFatPercent}%
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold">-Reducción</span>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-300 font-mono pt-2">
                    Peso: <strong className="text-white">{latestBodyComp.weightKg} kg</strong> · IMC: <strong className="text-white">{latestBodyComp.bmi}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Athlete Signature Footer */}
            <div className="relative z-10 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <img
                  src={athlete.avatarUrl}
                  alt={athlete.name}
                  className="w-8 h-8 rounded-xl object-cover border border-blue-500/50"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-white truncate max-w-[140px]">{athlete.name}</div>
                  <div className="text-[9px] text-neutral-400 font-mono">{athlete.membership.planName}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-red-500 font-brand block">@kinetixzone</span>
                <span className="text-[8px] text-neutral-500 font-mono">#KinetixZone</span>
              </div>
            </div>
          </div>
        </div>

        {/* REAL WORKING SHARE BUTTONS (WhatsApp, Instagram, Download PNG, Copy) */}
        <div className="space-y-2 pt-2">
          {/* Main Action: Native Share Sheet (Triggers Instagram, WhatsApp, Stories menu) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir en Apps (Instagram / WhatsApp / Historias)</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp direct button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="py-2 px-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-800/80 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="Abrir WhatsApp directamente"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            {/* Download PNG image */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="py-2 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="Descargar imagen lista para historias"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Guardada!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bajar PNG</span>
                </>
              )}
            </button>

            {/* Copy text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
