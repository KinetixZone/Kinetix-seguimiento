import React from 'react';
import { PushNotificationSimulation } from '../../types';
import { Bell, CheckCheck, X, AlertTriangle, Award, CreditCard, Sparkles } from 'lucide-react';

interface InAppNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotificationSimulation[];
  onMarkAllAsRead: () => void;
  onSimulateNewNotification: () => void;
  isStaff?: boolean;
}

export const InAppNotificationCenter: React.FC<InAppNotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSimulateNewNotification,
  isStaff,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-end p-3 sm:p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-brand">Notificaciones Kinetix</h3>
              <span className="text-[10px] text-neutral-400">
                {unreadCount > 0 ? `${unreadCount} pendientes de lectura` : 'Al día'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button inside page */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onMarkAllAsRead}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Marcar todas como leídas</span>
          </button>

          <button
            onClick={onSimulateNewNotification}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
          >
            + Simular Aviso
          </button>
        </div>

        {/* Pinned Permanent Payment Due Date Notice (Solo para atletas; Staff/Coaches cuentan con Acceso Permanente sin cobros) */}
        {!isStaff ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 via-neutral-900 to-red-950/40 border border-blue-500/40 space-y-1.5 shrink-0 shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Aviso Permanente de Pago</span>
              </span>
              <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-600/30 px-2 py-0.5 rounded-full border border-blue-500/40">
                30 de Mayo, 2024
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-tight">
              Tu membresía se renueva mensualmente. Cuentas con 5 días naturales de gracia tras el vencimiento.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/40 border border-neutral-800 space-y-1 shrink-0 shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-red-400" />
                <span>Equipo Kinetix · Staff & Coach</span>
              </span>
              <span className="text-[10px] text-red-300 font-mono font-bold bg-red-950 px-2 py-0.5 rounded-full border border-red-800">
                Permanente
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              Sin fecha de corte ni cobros. Tienes acceso oficial ilimitado a todas las herramientas.
            </p>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.map((notif) => {
            const isPayment = notif.type === 'payment_reminder';
            const isSuspended = notif.type === 'membership_suspension';
            const isMilestone = notif.type === 'milestone';

            return (
              <div
                key={notif.id}
                className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                  !notif.read
                    ? isSuspended
                      ? 'bg-red-950/40 border-red-800/80'
                      : isPayment
                      ? 'bg-blue-950/40 border-blue-800/60'
                      : 'bg-neutral-800/80 border-neutral-700'
                    : 'bg-neutral-950/50 border-neutral-800/80 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold flex items-center gap-1.5 ${
                    isSuspended ? 'text-red-400' : isPayment ? 'text-blue-400' : 'text-white'
                  }`}>
                    {isSuspended ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     isPayment ? <CreditCard className="w-3.5 h-3.5" /> :
                     <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    {notif.title}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  {notif.body}
                </p>

                {!notif.read && (
                  <div className="flex items-center justify-end">
                    <span className="text-[9px] text-blue-400 font-medium">Nueva</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 text-center">
          Notificaciones integradas en la plataforma web · Sin apps externas
        </div>
      </div>
    </div>
  );
};
