import React, { useState, useMemo } from 'react';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  Smartphone, 
  Calendar, 
  ShieldCheck, 
  Dumbbell, 
  Scale, 
  Bell, 
  Share2, 
  Pencil, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../../types';
import { getPaymentGroup } from '../../utils/paymentColorCodes';
import { buildCloudConnectUrl } from '../../lib/supabase';

interface ShareCredentialsWhatsAppModalProps {
  athlete: UserProfile;
  initialPassword?: string;
  onClose: () => void;
  onUpdatePhone?: (newPhone: string) => void;
}

export const ShareCredentialsWhatsAppModal: React.FC<ShareCredentialsWhatsAppModalProps> = ({
  athlete,
  initialPassword,
  onClose,
  onUpdatePhone,
}) => {
  // Password detection
  const currentPassword = useMemo(() => {
    if (initialPassword) return initialPassword;
    try {
      const stored = localStorage.getItem(`kinetix_pwd_${athlete.id}`);
      if (stored) return stored;
    } catch {
      // ignore
    }
    return athlete.password || 'kinetix123';
  }, [athlete.id, athlete.password, initialPassword]);

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState(athlete.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // App Origin URL (auto-includes cloud sync token if Supabase is configured)
  const appUrl = typeof window !== 'undefined' ? buildCloudConnectUrl(window.location.origin) : 'https://kinetix-app.fit';
  const username = athlete.username || athlete.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9_]/g, '');
  const billingDay = athlete.membership?.billingDayOfMonth ?? 15;
  const isNoCutoff = billingDay === 0 || athlete.membership?.planName?.includes('Sin Corte');
  const paymentInfo = getPaymentGroup(billingDay);

  // Default pre-written message
  const defaultMessage = useMemo(() => {
    const firstName = athlete.name.split(' ')[0];
    
    const cutOffText = isNoCutoff
      ? '🌟 *Plan Especial:* Sin fecha de corte mensual (Acceso Permanente).'
      : `🗓️ *Fecha de Corte Mensual:* Día *${billingDay} de cada mes* (Grupo ${paymentInfo.colorName} ${paymentInfo.dotEmoji}).`;

    return `¡Hola, *${firstName}*! 👋 Bienvenido(a) a la familia *Kinetix Functional Zone* 🏋️‍♂️🔥

Ya tienes lista tu cuenta en nuestra plataforma oficial para dar seguimiento a todo tu rendimiento:

📲 *TUS DATOS DE ACCESO:*
🌐 *Enlace de la app:* ${appUrl}
👤 *Usuario:* @${username}
${athlete.email && !athlete.email.includes('@kinetix.fit') ? `📧 *Correo:* ${athlete.email}\n` : ''}🔐 *Contraseña:* ${currentPassword}

---
🎯 *¿QUÉ ENCONTRARÁS EN TU APP KINETIX?*
💪 *Tus Récords de Fuerza (1RM):* Podrás ver tus marcas en Peso Muerto, Sentadilla, Press de Pecho y Dominadas.
🏃‍♂️ *Test de Cooper y Resistencia:* Tu nivel aeróbico oficial de 12 minutos y tus evaluaciones físicas periódicas.
⚖️ *Composición Corporal Renpho:* Historial de tus pesajes de bioimpedancia con porcentaje de masa muscular (en kg), porcentaje de grasa y grasa visceral.
🔔 *Avisos y Mensajes de Kinetix:* En tu bandeja recibirás felicitaciones por tus nuevos récords, correcciones técnicas y avisos importantes.
💳 *Estatus de Membresía:* En la pestaña *"Plan"* podrás ver tus días restantes y tu corte mensual.
${cutOffText}

---
⚠️ *IMPORTANTE & AMISTOSO:*
Tu acceso a las gráficas, pesajes y retos se mantiene activo mientras tu mensualidad esté al corriente. Si se acerca tu día ${isNoCutoff ? '' : billingDay}, te recordamos con tiempo para que no pierdas ningún registro de tus avances.

💡 *Tip Pro:* Al abrir el enlace en tu navegador (Safari o Chrome), pulsa *"Compartir"* o el menú y selecciona *"Agregar a Pantalla de Inicio"* para usarla como una aplicación instalada en tu celular 📱.

¡A darlo todo en cada entrenamiento! 💪⚡
— *Kinetix Functional Zone*`;
  }, [athlete.name, athlete.email, username, currentPassword, appUrl, billingDay, isNoCutoff, paymentInfo]);

  const [customMessage, setCustomMessage] = useState(defaultMessage);

  // Clean phone for direct wa.me
  const cleanPhoneDigits = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) return '';
    // If Mexican 10-digit number without country code, prepend 52
    if (digits.length === 10) return `52${digits}`;
    return digits;
  }, [phoneNumber]);

  // Handle direct open WhatsApp (choose contact or direct phone)
  const handleOpenWhatsApp = (useDirectPhone = false) => {
    const textToSend = isCustomizing ? customMessage : defaultMessage;
    const encoded = encodeURIComponent(textToSend);

    let url: string;
    if (useDirectPhone && cleanPhoneDigits) {
      url = `https://wa.me/${cleanPhoneDigits}?text=${encoded}`;
    } else {
      // Standard click-to-chat without number: opens WhatsApp and triggers contact picker
      url = `https://wa.me/?text=${encoded}`;
    }

    // Attempt to open in a new tab / native WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Web Share API fallback (native mobile share sheet)
  const handleWebShare = async () => {
    const textToSend = isCustomizing ? customMessage : defaultMessage;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Acceso a Kinetix App - ${athlete.name}`,
          text: textToSend,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleOpenWhatsApp(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const textToSend = isCustomizing ? customMessage : defaultMessage;
    try {
      await navigator.clipboard.writeText(textToSend);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = textToSend;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSavePhone = () => {
    setIsEditingPhone(false);
    if (onUpdatePhone) {
      onUpdatePhone(phoneNumber.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand flex items-center gap-2">
                <span>Compartir Acceso por WhatsApp</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  1 Toque
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Para: <strong className="text-white">{athlete.name}</strong> (@{username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Credentials Summary Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-950 to-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 font-semibold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Credenciales Oficiales:</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">Listas para enviar</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
              <span className="text-[10px] text-neutral-400 block mb-0.5">Usuario:</span>
              <span className="text-white font-mono font-bold text-sm">@{username}</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
              <span className="text-[10px] text-neutral-400 block mb-0.5">Contraseña:</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">{currentPassword}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Corte: <strong>{isNoCutoff ? 'Sin Corte' : `Día ${billingDay}`}</strong></span>
            </span>
            <span className="text-neutral-500 font-mono text-[10px] truncate max-w-[190px]">
              {appUrl}
            </span>
          </div>
        </div>

        {/* Athlete Phone Setting (Optional) */}
        <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Número de WhatsApp del Alumno:</span>
            </label>
            <button
              type="button"
              onClick={() => setIsEditingPhone(!isEditingPhone)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              {isEditingPhone ? 'Cancelar' : (phoneNumber ? 'Editar' : '+ Agregar')}
            </button>
          </div>

          {isEditingPhone ? (
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej. 5512345678 o +52 55..."
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:border-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleSavePhone}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Guardar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-neutral-400">
              <span className="font-mono text-white text-xs">
                {phoneNumber ? phoneNumber : 'Sin teléfono registrado (se abrirá WhatsApp para que elijas al contacto)'}
              </span>
              {cleanPhoneDigits && (
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Directo
                </span>
              )}
            </div>
          )}
        </div>

        {/* Message Preview & Customization Accordion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
              <span>Vista Previa del Mensaje</span>
              <span className="text-[10px] text-neutral-500 font-normal">
                (Formato para WhatsApp con negritas y emojis)
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (isCustomizing) {
                  setCustomMessage(defaultMessage);
                }
                setIsCustomizing(!isCustomizing);
              }}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
            >
              {isCustomizing ? (
                <>
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Predeterminado</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3 text-neutral-400" />
                  <span>Personalizar Texto</span>
                </>
              )}
            </button>
          </div>

          {isCustomizing ? (
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-white text-xs font-mono leading-relaxed focus:border-emerald-500 outline-none"
            />
          ) : (
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/90 max-h-48 overflow-y-auto text-xs text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {defaultMessage}
            </div>
          )}

          <div className="flex items-center gap-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-red-400" />
              <span>Explica 1RM & Cooper</span>
            </span>
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-400" />
              <span>Masa Muscular Renpho</span>
            </span>
            <span className="flex items-center gap-1">
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Avisos de Coaches</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Corte Amistoso</span>
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          {/* Main WhatsApp Button */}
          <button
            type="button"
            onClick={() => handleOpenWhatsApp(Boolean(cleanPhoneDigits))}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>
              {cleanPhoneDigits 
                ? `Enviar a ${phoneNumber} por WhatsApp` 
                : 'Abrir WhatsApp y Elegir Contacto'}
            </span>
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* If phone is registered, also allow choosing any contact */}
            {cleanPhoneDigits ? (
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(false)}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Abre WhatsApp para elegir otro contacto o grupo"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Elegir Otro Chat</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleWebShare}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Compartir mediante el menú de compartir de tu celular"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Compartir en Celular</span>
              </button>
            )}

            {/* Copy message button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Copiar Mensaje</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-neutral-500 text-center leading-tight pt-1">
            💡 En tu celular, al presionar <strong>Abrir WhatsApp</strong> se abrirá tu aplicación de WhatsApp directamente para que selecciones el chat del alumno y se envíe el mensaje pre-redactado.
          </p>
        </div>
      </div>
    </div>
  );
};
