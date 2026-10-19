import React, { useState } from 'react';
import { PushNotificationSimulation } from '../../types';
import { 
  Bell, 
  CheckCheck, 
  X, 
  AlertTriangle, 
  Award, 
  CreditCard, 
  Sparkles, 
  Send, 
  Inbox, 
  Users, 
  UserCheck 
} from 'lucide-react';

interface InAppNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotificationSimulation[];
  allNotifications?: PushNotificationSimulation[];
  onMarkAllAsRead: () => void;
  onSimulateNewNotification?: () => void;
  onOpenSendNotification?: () => void;
  isStaff?: boolean;
}

export const InAppNotificationCenter: React.FC<InAppNotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  allNotifications = [],
  onMarkAllAsRead,
  onOpenSendNotification,
  isStaff = false,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');

  if (!isOpen) return null;

  // For staff: incoming notifications vs notifications sent out to athletes
  const incomingStaffNotifications = notifications.filter(
    n => n.targetAudience === 'staff' || !n.targetAudience
  );

  const sentToAthletesNotifications = (allNotifications.length > 0 ? allNotifications : notifications).filter(
    n => n.targetAudience !== 'staff' && n.targetAudience !== undefined
  );

  const displayedNotifications = isStaff
    ? activeTab === 'inbox' 
      ? incomingStaffNotifications 
      : sentToAthletesNotifications
    : notifications;

  const unreadCount = displayedNotifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-end p-3 sm:p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[88vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-brand">Centro de Avisos Kinetix</h3>
              <span className="text-[10px] text-neutral-400">
                {unreadCount > 0 ? `${unreadCount} pendientes de lectura` : 'Al día'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Switcher Tabs: Separates Received Notices vs Broadcasted/Sent Notices */}
        {isStaff && (
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'inbox'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Avisos Staff ({incomingStaffNotifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviados a Atletas ({sentToAthletesNotifications.length})</span>
            </button>
          </div>
        )}

        {/* Action button inside page */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            onClick={onMarkAllAsRead}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Marcar como leídas</span>
          </button>

          {isStaff && onOpenSendNotification && (
            <button
              onClick={() => {
                onClose();
                onOpenSendNotification();
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-600/10 px-2 py-1 rounded-lg border border-blue-500/20 active:scale-95 transition-all"
              title="Emitir un nuevo aviso oficial a atletas o staff"
            >
              <Send className="w-3 h-3" />
              <span>+ Nuevo Aviso</span>
            </button>
          )}
        </div>

        {/* Payment Due Date Notice (Solo para atletas) */}
        {!isStaff ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 via-neutral-900 to-red-950/40 border border-blue-500/40 space-y-1.5 shrink-0 shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Fecha de Corte Mensual</span>
              </span>
              <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-600/30 px-2 py-0.5 rounded-full border border-blue-500/40">
                Al corriente
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-tight">
              Recuerda consultar tu fecha exacta de corte en la sección Membresía. Cuentas con 5 días naturales de gracia tras el vencimiento.
            </p>
          </div>
        ) : activeTab === 'inbox' ? (
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/40 border border-neutral-800 space-y-0.5 shrink-0 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-red-400" />
                <span>Bandeja del Staff Kinetix</span>
              </span>
              <span className="text-[10px] text-red-300 font-mono font-bold bg-red-950 px-2 py-0.5 rounded-full border border-red-800">
                Oficial
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              Aquí recibes registros de nuevos alumnos y avisos directos de la dirección.
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-blue-950/40 border border-blue-800/60 space-y-0.5 shrink-0 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Avisos Emitidos a Atletas</span>
              </span>
              <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700">
                Historial
              </span>
            </div>
            <p className="text-[10px] text-neutral-300 leading-tight">
              Avisos que los alumnos ven directamente en sus teléfonos cuando inician sesión.
            </p>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {displayedNotifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 space-y-1">
              <Bell className="w-6 h-6 mx-auto opacity-30" />
              <p>No hay avisos en esta sección.</p>
            </div>
          ) : (
            displayedNotifications.map((notif) => {
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
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`font-bold flex items-center gap-1.5 truncate ${
                      isSuspended ? 'text-red-400' : isPayment ? 'text-blue-400' : 'text-white'
                    }`}>
                      {isSuspended ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> :
                       isPayment ? <CreditCard className="w-3.5 h-3.5 shrink-0" /> :
                       <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className="truncate">{notif.title}</span>
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 shrink-0">
                      {typeof notif.timestamp === 'string' ? notif.timestamp.slice(0, 10) : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    {notif.body}
                  </p>

                  <div className="flex items-center justify-between pt-0.5 text-[9px]">
                    {notif.targetAudience && (
                      <span className="font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                        {notif.targetAudience === 'athletes' ? 'Para: Todos los atletas' :
                         notif.targetAudience === 'staff' ? 'Para: Equipo Staff' :
                         notif.targetAudience.startsWith('color_') ? `Para: Grupo Corte Día ${notif.targetAudience.replace('color_', '')}` :
                         `Para: ${notif.targetAudience}`}
                      </span>
                    )}
                    {!notif.read && (
                      <span className="text-[9px] text-blue-400 font-medium ml-auto">Nueva</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 text-center">
          Notificaciones integradas en la plataforma web · Sin apps externas
        </div>
      </div>
    </div>
  );
};
