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
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Flame,
  Zap
} from 'lucide-react';

interface LoginPageProps {
  users: UserProfile[];
  gymLogoUrl: string | null;
  onLogin: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  gymLogoUrl,
  onLogin,
}) => {
  const [roleTab, setRoleTab] = useState<'athlete' | 'staff'>('athlete');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const coachUser = users.find(u => u.role === 'staff' || u.id === 'user-staff-01') || users[0];
  const athletes = users.filter(u => u.role === 'athlete');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const userFound = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!userFound) {
      setErrorMsg('No encontramos una cuenta con ese correo electrónico.');
      return;
    }

    if (roleTab === 'staff' && userFound.role !== 'staff') {
      setErrorMsg('Este usuario no tiene privilegios de Coach/Staff. Selecciona la pestaña "Soy Atleta".');
      return;
    }

    // Success login
    onLogin(userFound);
  };

  const handleQuickLogin = (user: UserProfile) => {
    setErrorMsg(null);
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient decorative glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Gym Logo (Custom uploaded or official KZ badge) */}
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
            Portal Oficial de Acceso para Atletas & Entrenadores
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-5">
          {/* Role Switcher Tabs */}
          <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setRoleTab('athlete');
                setErrorMsg(null);
                if (roleTab === 'staff') setEmail('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                if (roleTab === 'athlete') setEmail('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'staff'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Soy Coach / Staff</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-xs text-red-300 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-neutral-300 font-medium block mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roleTab === 'staff' ? 'jorge.coach@kinetix.com' : 'tu-correo@ejemplo.com'}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-medium block mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
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
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-blue-600 focus:ring-0"
                />
                <span>Recordar mi sesión</span>
              </label>
              <a href="#" className="text-neutral-500 hover:text-blue-400 transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                roleTab === 'staff'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <span>Ingresar a mi Cuenta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Strip */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block text-center">
              Acceso Rápido de Prueba (1 Clic)
            </span>

            {roleTab === 'staff' ? (
              <div className="space-y-2">
                {users.filter(u => u.role === 'staff').map((staff) => {
                  const isOwner = staff.staffRole === 'owner' || staff.id === 'user-staff-leslie' || staff.id === 'user-staff-01';
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleQuickLogin(staff)}
                      className="w-full p-2.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-red-500/50 transition-all flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="w-9 h-9 rounded-xl object-cover border border-red-500/50"
                        />
                        <div>
                          <strong className="text-xs text-white block group-hover:text-red-400 transition-colors">
                            {staff.name}
                          </strong>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {isOwner ? '👑 Dueño/a · Control Total (Finanzas & Logo)' : '🏋️ Profe / Coach · Evaluaciones 1RM & Clases'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOwner
                          ? 'text-red-400 bg-red-950/80 border-red-800/60'
                          : 'text-amber-400 bg-amber-950/80 border-amber-800/60'
                      }`}>
                        Entrar
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {athletes.slice(0, 4).map((ath) => (
                  <button
                    key={ath.id}
                    type="button"
                    onClick={() => handleQuickLogin(ath)}
                    className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-blue-500/50 transition-all flex items-center gap-2 text-left group"
                  >
                    <img
                      src={ath.avatarUrl}
                      alt={ath.name}
                      className="w-7 h-7 rounded-lg object-cover shrink-0 border border-neutral-700"
                    />
                    <div className="overflow-hidden">
                      <strong className="text-[11px] text-white block truncate group-hover:text-blue-400 transition-colors">
                        {ath.name}
                      </strong>
                      <span className="text-[9px] text-neutral-400 font-mono block truncate">
                        {ath.membership.planName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-neutral-500 space-y-1">
          <p>Kinetix Functional Zone · Plataforma Deportiva Oficial</p>
          <p className="text-[10px] text-neutral-600">
            Diseñada para dispositivos móviles (iOS / Android) y computadoras de escritorio.
          </p>
        </div>
      </div>
    </div>
  );
};
