import React from 'react';
import { Bell, LogOut, ShieldCheck, User, Camera, Upload } from 'lucide-react';
import { UserProfile } from '../types';

interface NavigationHeaderProps {
  currentUser: UserProfile;
  gymLogoUrl: string | null;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenSendNotification?: () => void;
  onOpenProfileModal: () => void;
  onOpenPrivacyPolicy?: () => void;
  onLogout: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentUser,
  gymLogoUrl,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenSendNotification,
  onOpenProfileModal,
  onOpenPrivacyPolicy,
  onLogout,
}) => {
  const isStaff = currentUser.role === 'staff';

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-3.5 sm:px-6 py-2.5 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Official Gym Brand Logo & Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenProfileModal}
            className="flex items-center gap-2.5 group text-left"
            title={isStaff ? 'Hacer clic para personalizar logo o foto de perfil' : 'Ver mi perfil'}
          >
            {/* Gym Logo Display */}
            {gymLogoUrl ? (
              <div className="relative w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <img
                  src={gymLogoUrl}
                  alt="Logo Gimnasio"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="relative w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm tracking-tighter shadow-md shadow-blue-500/30 overflow-hidden shrink-0">
                <span className="relative z-10 font-brand">KZ</span>
                <div className="absolute -right-2 -bottom-2 w-5 h-5 bg-red-600 rounded-full" />
              </div>
            )}
            
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white font-brand leading-none">
                KINETIX <span className="font-light text-blue-500">Functional</span> <span className="font-bold text-red-500">Zone</span>
              </span>
              <span className="text-[10px] text-neutral-400 hidden sm:block mt-0.5">
                {isStaff ? 'Portal del Entrenador · Coach Jorge' : 'Plataforma Oficial del Atleta'}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: User Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Privacy Link */}
          {onOpenPrivacyPolicy && (
            <button
              onClick={onOpenPrivacyPolicy}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Aviso de Privacidad Integral (LFPDPPP)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px] font-medium hidden sm:inline">Aviso de Privacidad</span>
              <span className="text-[11px] font-medium sm:hidden">Privacidad</span>
            </button>
          )}

          {/* Coach Quick Send Alert Button */}
          {isStaff && onOpenSendNotification && (
            <button
              onClick={onOpenSendNotification}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Emitir avisos y alertas a los alumnos"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Mandar Avisos</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
            title="Centro de notificaciones"
          >
            <Bell className="w-4 h-4 text-blue-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Active User Pill (Opens User Profile & Logo Modal) */}
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 transition-all text-left"
            title="Ver perfil, subir foto o personalizar logo"
          >
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-neutral-700"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              {isStaff && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border border-neutral-900 flex items-center justify-center text-[8px] text-white font-bold">
                  ★
                </span>
              )}
            </div>

            <div className="hidden sm:block text-left overflow-hidden max-w-[120px] md:max-w-[160px]">
              <span className="text-xs font-bold text-white block truncate leading-tight">
                {currentUser.name}
              </span>
              <span className={`text-[9px] font-semibold uppercase block ${
                isStaff ? 'text-red-400' : 'text-blue-400'
              }`}>
                {isStaff ? 'Coach Jorge' : 'Atleta'}
              </span>
            </div>
          </button>

          {/* Logout / Switch User */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-900/60 text-neutral-400 hover:text-red-300 transition-colors"
            title="Cerrar sesión / Cambiar usuario"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
