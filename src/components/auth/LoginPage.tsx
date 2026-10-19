import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { 
  ShieldCheck, 
  Dumbbell, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  X,
  MessageCircle,
  KeyRound,
  UserPlus,
  Scale
} from 'lucide-react';

interface LoginPageProps {
  users: UserProfile[];
  gymLogoUrl: string | null;
  onLogin: (user: UserProfile) => void;
  onRegisterAthlete?: (newUser: {
    name: string;
    email: string;
    password: string;
    gender: 'male' | 'female';
    heightCm: number;
  }) => void;
  onNotifyOwners?: (title: string, body: string) => void;
  onOpenPrivacyPolicy?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  gymLogoUrl,
  onLogin,
  onNotifyOwners,
  onOpenPrivacyPolicy,
}) => {
  const [roleTab, setRoleTab] = useState<'athlete' | 'staff'>('athlete');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanInput = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Look for matching user by username OR email OR first name alias
    const userFound = users.find(u => {
      const uEmail = u.email.toLowerCase();
      const uUsername = u.username?.toLowerCase();
      const uFirstName = u.name.toLowerCase().split(' ')[0];
      
      if (uEmail === cleanInput || (uUsername && uUsername === cleanInput) || uFirstName === cleanInput) {
        return true;
      }
      // Aliases for staff
      if (u.role === 'staff') {
        if (cleanInput === 'leslie' && (u.id === 'user-staff-leslie' || u.name.toLowerCase().includes('leslie'))) return true;
        if (cleanInput === 'jorge' && (u.id === 'user-staff-01' || u.name.toLowerCase().includes('jorge'))) return true;
        if (cleanInput === 'gus' && (u.id === 'user-staff-gus' || u.name.toLowerCase().includes('gus'))) return true;
      }
      return false;
    });

    if (!userFound) {
      setErrorMsg('No encontramos una cuenta con ese usuario o correo electrónico. Las altas las realizan los Coaches en recepción.');
      setIsSubmitting(false);
      return;
    }

    // Role validation:
    // Athlete can ONLY enter under "athlete"
    // Staff/Coach can enter under BOTH ("athlete" or "staff")
    if (roleTab === 'staff' && userFound.role !== 'staff') {
      setErrorMsg('Acceso exclusivo para Coaches y Dueños de Kinetix. Por favor inicia sesión en la pestaña "Soy Atleta".');
      setIsSubmitting(false);
      return;
    }

    // Check stored password (or default kinetix123 / kinetix2026 / admin123)
    let expectedPassword = userFound.password || (userFound.role === 'staff' ? 'kinetix2026' : 'kinetix123');
    try {
      const savedPwd = localStorage.getItem(`kinetix_pwd_${userFound.id}`);
      if (savedPwd) {
        expectedPassword = savedPwd;
      }
    } catch {}

    const isMatch = cleanPassword === expectedPassword || 
      (cleanPassword === 'kinetix123' && userFound.role === 'athlete') ||
      (cleanPassword === 'kinetix2026' && userFound.role === 'staff') ||
      (cleanPassword === 'admin123' && userFound.role === 'staff');

    if (!isMatch) {
      setErrorMsg('Contraseña incorrecta. Por favor verifica o solicita a tu coach el restablecimiento.');
      setIsSubmitting(false);
      return;
    }

    // Login successful
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(userFound);
    }, 350);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanNewPass = newPasswordInput.trim();

    if (!cleanNewPass || cleanNewPass.length < 4) {
      setForgotError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const userFound = users.find(u => 
      u.email.toLowerCase() === cleanEmail || 
      (u.username && u.username.toLowerCase() === cleanEmail) ||
      u.name.toLowerCase().split(' ')[0] === cleanEmail
    );

    if (!userFound) {
      setForgotError('Ese usuario o correo no se encuentra registrado en el sistema de Kinetix.');
      return;
    }

    // Save new password to localStorage
    try {
      localStorage.setItem(`kinetix_pwd_${userFound.id}`, cleanNewPass);
    } catch {}

    // Emit notification to Owners/Staff
    if (onNotifyOwners) {
      onNotifyOwners(
        'Solicitud de Contraseña Atendida',
        `El atleta ${userFound.name} (${userFound.email}) ha restablecido su contraseña de acceso exitosamente.`
      );
    }

    setForgotSuccess(true);
    setTimeout(() => {
      setEmail(cleanEmail);
      setPassword(cleanNewPass);
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail('');
      setNewPasswordInput('');
    }, 2200);
  };

  const handleWhatsAppSupport = () => {
    const text = `Hola Coach Jorge / Leslie, soy alumno de Kinetix con el correo ${forgotEmail || email || '[mi correo]'}, necesito apoyo para recuperar mi contraseña de la plataforma.`;
    const savedPhone = localStorage.getItem('kinetix_coach_whatsapp') || '525627303189';
    const cleanPhone = savedPhone.replace(/\D/g, '') || '525627303189';
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient decorative glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Gym Logo Display */}
          <div className="inline-flex items-center justify-center p-2 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl mb-1">
            {gymLogoUrl ? (
              <img
                src={gymLogoUrl}
                alt="Logo Kinetix"
                className="w-14 h-14 object-contain rounded-2xl"
              />
            ) : (
              <div className="relative w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl tracking-tighter shadow-lg shadow-blue-500/30 overflow-hidden">
                <span className="relative z-10 font-brand">KZ</span>
                <div className="absolute -right-3 -bottom-3 w-8 h-8 bg-red-600 rounded-full" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white font-brand">
            KINETIX <span className="font-light text-blue-500">Functional</span> <span className="font-bold text-red-500">Zone</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Portal Privado de Acceso · Atletas & Entrenadores
          </p>
        </div>

        {/* Login / Register Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-neutral-900/95 border border-neutral-800 shadow-2xl space-y-5">
          {/* Role Switcher: Soy Atleta vs Coach / Staff */}
          <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setRoleTab('athlete');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                roleTab === 'athlete'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Soy Atleta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab('staff');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                roleTab === 'staff'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coach / Dueño</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-xs text-red-200 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-xs text-emerald-200 flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-neutral-300 font-medium block mb-1.5 flex items-center justify-between">
                <span>Usuario o Correo</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  {roleTab === 'staff' ? 'Acceso Coach & Dueños' : 'Acceso Atletas'}
                </span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roleTab === 'staff' ? 'Ej: leslie, jorge o gus' : 'Ej: tu usuario (ej. juan, maria) o correo'}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña asignada o privada"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-blue-600 focus:ring-0"
                />
                <span>Recordar sesión</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError(null);
                  setShowForgotModal(true);
                }}
                className="text-neutral-400 hover:text-blue-400 font-medium transition-colors underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 ${
                roleTab === 'staff'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <span>{isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Coach & Owner exclusive registration notice */}
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
            <span className="text-white font-semibold block">¿Nuevo alumno en Kinetix?</span>
            <p className="leading-relaxed">
              Las cuentas y expedientes de atletas son creados exclusivamente por los Dueños y Coaches en recepción o desde su panel interno para garantizar la asignación correcta de plan y mediciones.
            </p>
          </div>

          {/* Privacy & Safe Notice */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
            <LockKeyhole className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tus datos de composición y rendimiento son privados y exclusivos de tu cuenta.</span>
          </div>
        </div>

        {/* Footer info & permanent privacy link */}
        <div className="text-center text-[11px] text-neutral-500 space-y-2">
          <p>Kinetix Functional Zone · Plataforma Deportiva Oficial</p>
          {onOpenPrivacyPolicy && (
            <div>
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-blue-400 hover:text-blue-300 underline font-semibold text-xs transition-colors inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Aviso de Privacidad Integral (LFPDPPP)</span>
              </button>
            </div>
          )}
          <p className="text-[10px] text-neutral-600">
            Diseñada para dispositivos móviles (iOS / Android) y computadoras de escritorio.
          </p>
        </div>
      </div>

      {/* MODAL: RECUPERAR / ACTUALIZAR CONTRASEÑA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-brand">Recuperar Contraseña</h3>
                  <p className="text-[11px] text-neutral-400">Cambio directo y notificación al equipo directivo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-6 text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">¡Contraseña Actualizada con Éxito!</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Se ha generado un aviso oficial en el panel de los dueños (Leslie & Coach Jorge) y tu contraseña ha sido cambiada. Ya puedes iniciar sesión.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
                {forgotError && (
                  <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">
                    Tu Correo Electrónico Registrado:
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">
                    Nueva Contraseña Deseada:
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Escribe tu nueva contraseña (mínimo 4 caracteres)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 block mt-1">
                    Al guardar, se enviará una alerta automática al buzón de Leslie y Coach Jorge para registro de seguridad.
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30 active:scale-95"
                  >
                    Guardar y Notificar
                  </button>
                </div>

                {/* Direct WhatsApp Contact */}
                <div className="pt-3 border-t border-neutral-800 text-center">
                  <span className="text-[11px] text-neutral-400 block mb-1.5">
                    ¿Prefieres que el coach te asista de inmediato en persona?
                  </span>
                  <button
                    type="button"
                    onClick={handleWhatsAppSupport}
                    className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Hablar por WhatsApp con Coach Jorge / Leslie</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
