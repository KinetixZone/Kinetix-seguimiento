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
  ExternalLink,
  Send,
  CheckCircle2
} from 'lucide-react';

interface ShareableStoryModalProps {
  athlete: UserProfile;
  latestBodyComp?: BodyCompositionRecord | null;
  latestEval?: PhysicalEvaluationRecord | null;
  gymLogoUrl?: string | null;
  onClose: () => void;
}

export const ShareableStoryModal: React.FC<ShareableStoryModalProps> = ({
  athlete,
  latestBodyComp,
  latestEval,
  gymLogoUrl,
  onClose,
}) => {
  const [storyType, setStoryType] = useState<'strength' | 'cooper' | 'body'>('strength');
  const [selectedExercise, setSelectedExercise] = useState<string>('squats');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [instagramStepActive, setInstagramStepActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const strengthRecord = latestEval?.strengthRecords.find(r => r.exerciseId === selectedExercise) || 
    latestEval?.strengthRecords[0] || null;

  // Preformatted text for sharing
  const generateShareText = () => {
    if (storyType === 'strength') {
      if (!strengthRecord) {
        return `🔥 ¡Entrenando en Kinetix Functional Zone! 🏋️ Atleta: ${athlete.name} 📍 @kinetixzone #KinetixFunctional #Fuerza`;
      }
      return `🔥 ¡Nuevo Récord Personal (PR) en Kinetix Functional Zone!
🏋️ Ejercicio: ${strengthRecord.exerciseName}
💪 Carga Levantada: ${strengthRecord.weightKg} ${strengthRecord.weightUnit} (${strengthRecord.reps} ${strengthRecord.reps === 1 ? 'rep' : 'reps'})
⚡ 1RM Estimado Oficial: ${strengthRecord.estimated1RMKg} kg
👤 Atleta: ${athlete.name}
📍 @kinetixzone · Validación Coach Jorge #KinetixFunctional #PR #Power`;
    } else if (storyType === 'cooper') {
      if (!latestEval?.cooperTest) {
        return `🏃‍♂️ ¡Entrenando en Kinetix Functional Zone! 👤 Atleta: ${athlete.name} 📍 @kinetixzone #KinetixFunctional`;
      }
      return `🏃‍♂️ ¡Test de Cooper 12 Min superado en Kinetix Functional Zone!
⚡ Nivel Alcanzado: Nivel ${latestEval.cooperTest.levelNumber} (${latestEval.cooperTest.level})
🎯 Distancia Recorrida: ${latestEval.cooperTest.distanceMeters} metros
👤 Atleta: ${athlete.name}
📍 @kinetixzone #CooperTest #KinetixFunctional #Resistencia`;
    } else {
      if (!latestBodyComp) {
        return `✨ ¡Entrenando en Kinetix Functional Zone! 🏋️ Atleta: ${athlete.name} 📍 @kinetixzone #KinetixFunctional`;
      }
      return `✨ ¡Progreso y Recomposición Corporal en Kinetix!
⚖️ Peso Actual: ${latestBodyComp.weightKg} kg (IMC: ${latestBodyComp.bmi})
💪 Masa Muscular: ${latestBodyComp.muscleMassPercent}%
🔥 Grasa Corporal: ${latestBodyComp.bodyFatPercent}%
👤 Atleta: ${athlete.name}
📍 @kinetixzone #FitnessJourney #KinetixFunctional`;
    }
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    } catch {
      // Fallback
    }
  };

  // Helper to wrap text on Canvas
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
    return currentY + lineHeight;
  };

  // Download Card as high-res PNG image (1080x1920 Instagram Story format)
  const handleDownloadImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background Gradient (Dark Sports Aesthetic)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGradient.addColorStop(0, '#0a0a0c');
    bgGradient.addColorStop(0.5, '#12131a');
    bgGradient.addColorStop(1, '#050507');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing Orbs
    const blueGlow = ctx.createRadialGradient(200, 300, 50, 200, 300, 500);
    blueGlow.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
    blueGlow.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = blueGlow;
    ctx.fillRect(0, 0, 1080, 1920);

    const redGlow = ctx.createRadialGradient(880, 1600, 50, 880, 1600, 500);
    redGlow.addColorStop(0, 'rgba(220, 38, 38, 0.4)');
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

      if (strengthRecord) {
        // Multi-line wrapped exercise name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 68px sans-serif';
        drawWrappedText(ctx, strengthRecord.exerciseName.toUpperCase(), 100, 610, 880, 80);

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 140px monospace';
        ctx.fillText(`${strengthRecord.weightKg} ${strengthRecord.weightUnit}`, 100, 820);

        ctx.fillStyle = '#ffffff';
        ctx.font = '46px monospace';
        ctx.fillText(`1RM Estimado: ${strengthRecord.estimated1RMKg} kg · ${strengthRecord.reps} reps`, 100, 930);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 38px monospace';
        ctx.fillText('✓ Fuerza Máxima Validada por Coach Jorge', 100, 1050);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px sans-serif';
        drawWrappedText(ctx, 'EVALUACIÓN DE FUERZA PENDIENTE', 100, 610, 880, 80);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '40px monospace';
        drawWrappedText(ctx, 'Inicia tu primer registro con el Coach para desbloquear tu tarjeta.', 100, 750, 880, 60);
      }
    } else if (storyType === 'cooper') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('❤️ TEST DE COOPER 12 MINUTOS', 100, 500);

      if (latestEval?.cooperTest) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 68px sans-serif';
        drawWrappedText(ctx, 'POTENCIA AERÓBICA Y RESISTENCIA', 100, 610, 880, 80);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 140px monospace';
        ctx.fillText(`NIVEL ${latestEval.cooperTest.levelNumber}`, 100, 820);

        ctx.fillStyle = '#ffffff';
        ctx.font = '46px monospace';
        ctx.fillText(`${latestEval.cooperTest.level} · ${latestEval.cooperTest.distanceMeters} metros`, 100, 930);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px sans-serif';
        drawWrappedText(ctx, 'TEST DE COOPER PENDIENTE', 100, 610, 880, 80);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '40px monospace';
        drawWrappedText(ctx, 'Inicia tu primer test de 12 minutos para medir tu nivel aeróbico.', 100, 750, 880, 60);
      }
    } else {
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('✨ COMPOSICIÓN & SALUD', 100, 500);

      if (latestBodyComp) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 68px sans-serif';
        drawWrappedText(ctx, 'RECOMPOSICIÓN CORPORAL', 100, 610, 880, 80);

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 120px monospace';
        ctx.fillText(`${latestBodyComp.weightKg} kg`, 100, 820);

        ctx.fillStyle = '#ffffff';
        ctx.font = '46px monospace';
        ctx.fillText(`Masa Muscular: ${latestBodyComp.muscleMassPercent}% · Grasa: ${latestBodyComp.bodyFatPercent}%`, 100, 930);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px sans-serif';
        drawWrappedText(ctx, 'COMPOSICIÓN CORPORAL', 100, 610, 880, 80);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '40px monospace';
        drawWrappedText(ctx, 'Inicia tu primer registro antropométrico para activar tu tarjeta.', 100, 750, 880, 60);
      }
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

    // Download file
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Kinetix_Historia_${athlete.name.replace(/\s+/g, '_')}_${storyType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
    return dataUrl;
  };

  // 1. WhatsApp Direct Share
  const handleOpenWhatsApp = () => {
    const text = generateShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 2. Telegram Direct Share
  const handleOpenTelegram = () => {
    const text = generateShareText();
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 3. Instagram Direct Workflow (Download HD card + copy text + open Instagram + instruction banner)
  const handleInstagramShare = () => {
    handleDownloadImage();
    handleCopyText();
    setInstagramStepActive(true);
    // Open Instagram in new window/tab
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
    }, 400);
  };

  // 4. X (Twitter) Direct Share
  const handleOpenTwitter = () => {
    const text = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 5. Facebook Direct Share
  const handleOpenFacebook = () => {
    const text = generateShareText();
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 6. Native Share Sheet (Works when supported on mobile)
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
        // Fallback to copy
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 space-y-4 max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">Compartir en Redes Sociales</h3>
              <p className="text-xs text-neutral-400">Tarjetas oficiales para Instagram Stories, WhatsApp y Redes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
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

        {/* Exercise picker if strength (Clean wrap so Sentadillas and all exercises are 100% visible) */}
        {storyType === 'strength' && latestEval?.strengthRecords && (
          <div className="space-y-1.5 bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-300 block font-semibold">
              Selecciona el ejercicio evaluado:
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {latestEval.strengthRecords.map(rec => (
                <button
                  key={rec.exerciseId}
                  type="button"
                  onClick={() => setSelectedExercise(rec.exerciseId)}
                  className={`px-3 py-1.5 rounded-xl border text-left transition-all ${
                    selectedExercise === rec.exerciseId
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <span className="block leading-tight">{rec.exerciseName}</span>
                  <span className="text-[10px] text-blue-400 font-mono font-bold block">{rec.weightKg} {rec.weightUnit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VISUAL STORY PREVIEW CARD (Responsive, never truncates text!) */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-full max-w-[360px] min-h-[440px] rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-neutral-800 shadow-2xl text-white select-none"
          >
            {/* Glowing Brand Accent Orbs */}
            <div className="absolute -top-12 -left-12 w-44 h-44 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {gymLogoUrl ? (
                  <img
                    src={gymLogoUrl}
                    alt="Logo Kinetix"
                    className="w-8 h-8 object-contain rounded-xl bg-neutral-900 border border-neutral-700 p-0.5 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-sm text-white shadow-md shadow-blue-500/40 shrink-0">
                    KZ
                  </div>
                )}
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

            {/* Middle Main Content with Safe Full Text Display */}
            <div className="relative z-10 text-center my-auto py-3 space-y-3">
              {storyType === 'strength' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>NUEVO RÉCORD PERSONAL (PR)</span>
                  </div>

                  {!latestEval || !latestEval.strengthRecords || latestEval.strengthRecords.length === 0 || !strengthRecord ? (
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center space-y-1">
                      <p className="text-xs text-neutral-300 font-medium">Aún no hay marcas de fuerza registradas</p>
                      <p className="text-[10px] text-neutral-500">Inicia tu primera evaluación técnica con el Coach para generar tu tarjeta de 1RM.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <div className="text-xl sm:text-2xl font-extrabold font-brand tracking-tight text-white uppercase break-words leading-tight px-2 min-h-[2.5rem] flex items-center justify-center">
                          {strengthRecord.exerciseName}
                        </div>

                        <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-blue-400 drop-shadow-md">
                          {strengthRecord.weightKg} <span className="text-2xl font-normal text-white">{strengthRecord.weightUnit}</span>
                        </div>

                        <div className="text-xs text-neutral-300 font-mono">
                          1RM Estimado: <strong className="text-white font-bold">{strengthRecord.estimated1RMKg} kg</strong> ({strengthRecord.reps} {strengthRecord.reps === 1 ? 'rep' : 'reps'})
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-full inline-block">
                          ✓ Marca Verificada por Coach Jorge
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {storyType === 'cooper' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>TEST DE COOPER 12 MIN</span>
                  </div>

                  {!latestEval?.cooperTest ? (
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center space-y-1">
                      <p className="text-xs text-neutral-300 font-medium">Aún no hay Test de Cooper registrado</p>
                      <p className="text-[10px] text-neutral-500">Realiza tu test de 12 minutos con el Coach para desbloquear tu tarjeta de nivel aeróbico.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <div className="text-xs text-neutral-400 font-mono uppercase">Potencia Aeróbica Alcanzada</div>
                        <div className="text-4xl sm:text-5xl font-black font-brand tracking-tight text-white">
                          NIVEL {latestEval.cooperTest.levelNumber}
                        </div>
                        <div className="text-base font-bold text-red-400 font-brand">
                          {latestEval.cooperTest.level}
                        </div>
                        <div className="text-xs text-neutral-300 font-mono">
                          Distancia Recorrida: <strong className="text-white">{latestEval.cooperTest.distanceMeters} m</strong>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] text-neutral-300 bg-neutral-900/90 border border-neutral-800 px-3 py-1 rounded-xl block max-w-[260px] mx-auto text-center leading-tight">
                          "{latestEval.cooperTest.notes || 'Excelente resistencia cardiorrespiratoria y ritmo constante.'}"
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {storyType === 'body' && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>RECOMPOSICIÓN CORPORAL</span>
                  </div>

                  {!latestBodyComp ? (
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center space-y-1">
                      <p className="text-xs text-neutral-300 font-medium">Aún no hay mediciones registradas</p>
                      <p className="text-[10px] text-neutral-500">Inicia tu primer registro para compartir tus métricas de composición corporal.</p>
                    </div>
                  ) : (
                    <>
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

                      <div className="text-xs text-neutral-300 font-mono pt-1">
                        Peso: <strong className="text-white">{latestBodyComp.weightKg} kg</strong> · IMC: <strong className="text-white">{latestBodyComp.bmi}</strong>
                      </div>
                    </>
                  )}
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

        {/* INSTAGRAM WORKFLOW BANNER (Step-by-step indicator) */}
        {instagramStepActive && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 to-pink-950/80 border border-pink-500/50 text-xs space-y-1 animate-fade-in">
            <div className="flex items-center gap-1.5 text-pink-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-pink-400" />
              <span>¡Tarjeta Descargada y Texto Copiado con Éxito!</span>
            </div>
            <p className="text-[11px] text-neutral-200 leading-tight">
              1. Abre Instagram ➡️ 2. Selecciona crear Historia con la imagen descargada en tu galería ➡️ 3. Pega el texto copiado con tus marcas oficiales.
            </p>
          </div>
        )}

        {/* REAL WORKING DIRECT APPS BUTTONS */}
        <div className="space-y-2.5 pt-1">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
            Compartir Directo en Redes:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. WhatsApp Button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              title="Abrir WhatsApp directamente con el mensaje"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            {/* 2. Telegram Button */}
            <button
              type="button"
              onClick={handleOpenTelegram}
              className="py-2.5 px-3 rounded-2xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              title="Abrir Telegram con el mensaje preparado"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>Telegram</span>
            </button>

            {/* 3. Instagram Stories Button */}
            <button
              type="button"
              onClick={handleInstagramShare}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-amber-600/30 hover:from-purple-600/40 hover:to-pink-600/40 border border-pink-500/50 text-pink-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              title="Descargar imagen y abrir Instagram"
            >
              <Instagram className="w-4 h-4 text-pink-400" />
              <span>Instagram</span>
            </button>

            {/* 4. Twitter / X Button */}
            <button
              type="button"
              onClick={handleOpenTwitter}
              className="py-2.5 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              title="Publicar en X / Twitter"
            >
              <span className="font-brand font-black text-xs">𝕏</span>
              <span>Twitter / X</span>
            </button>
          </div>

          {/* Secondary Utilities: Download PNG & Copy Text */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Download High-Res PNG */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Imagen Descargada!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Bajar Tarjeta PNG</span>
                </>
              )}
            </button>

            {/* Copy Formatted Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          </div>

          {/* System Share (Mobile Native Sheet) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Abrir Menú Compartir del Celular</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
