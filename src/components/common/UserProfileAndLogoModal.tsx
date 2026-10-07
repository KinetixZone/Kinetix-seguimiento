import React, { useRef, useState } from 'react';
import { UserProfile } from '../../types';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  User, 
  RotateCcw,
  Sparkles,
  Award,
  MessageCircle,
  FileText,
  ShieldAlert
} from 'lucide-react';

interface UserProfileAndLogoModalProps {
  currentUser: UserProfile;
  gymLogoUrl: string | null;
  onUpdateAvatar: (userId: string, newAvatarUrl: string) => void;
  onUpdateGymLogo: (newLogoUrl: string | null) => void;
  onLogout: () => void;
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const UserProfileAndLogoModal: React.FC<UserProfileAndLogoModalProps> = ({
  currentUser,
  gymLogoUrl,
  onUpdateAvatar,
  onUpdateGymLogo,
  onLogout,
  onClose,
  onOpenPrivacyPolicy,
}) => {
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    return localStorage.getItem('kinetix_coach_whatsapp') || '+52 56 2730 3189';
  });
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSaveWhatsApp = () => {
    const trimmed = whatsappNumber.trim();
    localStorage.setItem('kinetix_coach_whatsapp', trimmed);
    setWhatsappSaved(true);
    setTimeout(() => setWhatsappSaved(false), 2500);
  };

  const isStaff = currentUser.role === 'staff';
  const isOwner = isStaff && (currentUser.staffRole === 'owner' || !currentUser.staffRole);
  const isCoachGus = isStaff && currentUser.staffRole === 'coach';

  // Handle user uploading their own avatar
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateAvatar(currentUser.id, result);
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle gym coach uploading the gym logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('El logo no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateGymLogo(result);
        setLogoSuccess(true);
        setTimeout(() => setLogoSuccess(false), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (customLogoInput.trim()) {
      onUpdateGymLogo(customLogoInput.trim());
      setCustomLogoInput('');
      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white font-brand">
              Mi Perfil & Configuración
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: PROFILE PICTURE UPLOAD */}
        <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-200">Foto de Perfil</span>
            {avatarSuccess && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ¡Foto actualizada!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white leading-tight">{currentUser.name}</h4>
              <p className="text-xs text-neutral-400 font-mono">{currentUser.email}</p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Subir Mi Foto</span>
                </button>
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>
          <p className="text-[10px] text-neutral-500">
            Formatos JPG o PNG. Tu foto se mostrará en tus reportes, historias y tarjetas oficiales de Kinetix.
          </p>
        </div>

        {/* SECTION 2: GYM LOGO CUSTOMIZATION (EXCLUSIVA PARA DUEÑOS: LESLIE & JORGE) */}
        {isOwner && (
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-red-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-white">Logo Oficial del Gimnasio (Dueños)</span>
              </div>
              {logoSuccess && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ¡Logo actualizado!
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                {gymLogoUrl ? (
                  <img
                    src={gymLogoUrl}
                    alt="Logo Gimnasio"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                    KZ
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <span className="text-xs text-neutral-300 font-medium block">
                  {gymLogoUrl ? 'Logo personalizado activo' : 'Logo Kinetix Oficial'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Logo</span>
                  </button>

                  {gymLogoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateGymLogo(null);
                        setLogoSuccess(true);
                        setTimeout(() => setLogoSuccess(false), 2000);
                      }}
                      className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                      title="Restablecer logo predeterminado"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>

            {/* Optional URL input */}
            <div className="pt-1 flex gap-1.5">
              <input
                type="url"
                value={customLogoInput}
                onChange={(e) => setCustomLogoInput(e.target.value)}
                placeholder="O pega URL de imagen (https://...)"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleApplyLogoUrl}
                disabled={!customLogoInput.trim()}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-medium"
              >
                Aplicar
              </button>
            </div>
            <p className="text-[10px] text-neutral-500">
              Este logo reemplazará el emblema en el encabezado, pantalla de acceso, reportes PDF e historias.
            </p>
          </div>
        )}

        {/* SECTION 2.5: GYM / COACH WHATSAPP CONFIGURATION (EXCLUSIVA PARA DUEÑOS: LESLIE & JORGE) */}
        {isOwner && (
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-emerald-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">WhatsApp Oficial de Soporte (Dueños)</span>
              </div>
              {whatsappSaved && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado con éxito!
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Número al que los alumnos envían mensaje directo desde la pantalla de acceso cuando tocan <em>"Hablar por WhatsApp con Coach Jorge / Leslie"</em>:
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Ej. +52 55 5555 1234 (con lada de país)"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
              >
                Guardar Teléfono
              </button>
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Si lo dejas en blanco, WhatsApp abrirá el selector de contactos del alumno con el mensaje de recuperación pre-redactado.
            </span>
          </div>
        )}

        {/* SECTION 3: ACCOUNT DETAILS & CHANGE PASSWORD */}
        <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-xs space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-neutral-300">
              <span>Rol en la plataforma:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                isStaff ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {isStaff ? 'Coach / Staff' : 'Atleta Oficial'}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span>{isStaff ? 'Tipo de Cuenta:' : 'Membresía:'}</span>
              <span className="font-semibold text-white">{isStaff ? 'Administración & Entrenamiento Kinetix' : currentUser.membership.planName}</span>
            </div>
            {!isStaff ? (
              <div className="flex items-center justify-between text-neutral-300">
                <span>Corte de Pago:</span>
                <span className="font-mono text-blue-400 font-bold">
                  Día {currentUser.membership.billingDayOfMonth || 15} de cada mes
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-neutral-300">
                <span>Estado de Acceso:</span>
                <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  ✓ Cuenta Permanente · Sin fecha de corte
                </span>
              </div>
            )}
          </div>

          {/* Cambiar Contraseña Segura */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <span>🔐 Seguridad · Actualizar Contraseña:</span>
            </span>
            <div className="flex gap-1.5">
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Escribe tu nueva contraseña..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPasswordInput.trim()) {
                    try {
                      localStorage.setItem(`kinetix_pwd_${currentUser.id}`, newPasswordInput.trim());
                    } catch {}
                    setAvatarSuccess(true);
                    setNewPasswordInput('');
                    setTimeout(() => setAvatarSuccess(false), 2500);
                  }
                }}
                disabled={!newPasswordInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all"
              >
                Actualizar
              </button>
            </div>
            {avatarSuccess && (
              <span className="text-[10px] text-emerald-400 font-semibold block animate-fade-in">
                ✓ Contraseña actualizada correctamente en tu dispositivo.
              </span>
            )}
          </div>

          {/* Legal y Privacidad: Acceso permanente al Aviso de Privacidad Integral */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
              <span>⚖️ Legal y Privacidad:</span>
              <span className="text-[10px] text-blue-400 font-mono">LFPDPPP</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (onOpenPrivacyPolicy) {
                  onClose();
                  onOpenPrivacyPolicy();
                }
              }}
              className="w-full p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                <div>
                  <strong className="text-xs text-white block">Aviso de Privacidad Integral</strong>
                  <span className="text-[10px] text-neutral-400 block">Consulta los términos, finalidades y tu constancia de consentimiento</span>
                </div>
              </div>
              <span className="text-[10px] text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-red-300 hover:text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
