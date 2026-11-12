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
  Trash2,
  Check,
  Eye,
  Lock,
  Filter
} from 'lucide-react';

interface InAppNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotificationSimulation[];
  allNotifications?: PushNotificationSimulation[];
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (id: string) => void;
  onDismissNotification?: (id: string) => void;
  onClearReadNotifications?: () => void;
  onSimulateNewNotification?: () => void;
  onOpenSendNotification?: () => void;
  isStaff?: boolean;
  currentUserId?: string;
}

export const InAppNotificationCenter: React.FC<InAppNotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  allNotifications = [],
  onMarkAllAsRead,
  onMarkAsRead,
  onDismissNotification,
  onClearReadNotifications,
  onOpenSendNotification,
  isStaff = false,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  if (!isOpen) return null;

  // For staff: incoming notifications vs notifications sent out to athletes
  const incomingStaffNotifications = notifications.filter(
    n => n.targetAudience === 'staff' || n.targetAudience === 'all' || !n.targetAudience || n.targetUserId === currentUserId
  );

  const sentToAthletesNotifications = (allNotifications.length > 0 ? allNotifications : notifications).filter(
    n => n.targetAudience !== 'staff' && (n.targetAudience !== undefined || n.targetUserId !== undefined)
  );

  const baseList = isStaff
    ? activeTab === 'inbox' 
      ? incomingStaffNotifications 
      : sentToAthletesNotifications
    : notifications;

  // Filter by read/unread status
  const displayedNotifications = baseList.filter(n => {
    if (statusFilter === 'unread') return !n.read;
    if (statusFilter === 'read') return n.read;
    return true;
  });

  const totalUnread = baseList.filter(n => !n.read).length;
  const totalRead = baseList.filter(n => n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-end p-2 sm:p-5 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-brand flex items-center gap-2">
                <span>Centro de Avisos</span>
                {totalUnread > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 border border-red-500/40 text-red-300">
                    {totalUnread} nuevo{totalUnread > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                    Al día
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-neutral-400">
                {isStaff ? 'Panel Administrativo & Avisos Kinetix' : 'Avisos oficiales y notificaciones'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Switcher Tabs: Separates Received Notices vs Broadcasted/Sent Notices */}
        {isStaff && (
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('inbox');
                setStatusFilter('all');
              }}
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
              onClick={() => {
                setActiveTab('sent');
                setStatusFilter('all');
              }}
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

        {/* Status Filter Pills: Todas | No Leídas | Leídas */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Todas ({baseList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                statusFilter === 'unread'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>No Leídas</span>
              {totalUnread > 0 && (
                <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] flex items-center justify-center font-bold">
                  {totalUnread}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('read')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'read'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Leídas ({totalRead})
            </button>
          </div>

          {/* Quick Staff Broadcast trigger */}
          {isStaff && onOpenSendNotification && (
            <button
              onClick={() => {
                onClose();
                onOpenSendNotification();
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-600/15 px-2.5 py-1.5 rounded-xl border border-blue-500/30 active:scale-95 transition-all shrink-0"
              title="Emitir un nuevo aviso oficial a atletas o staff"
            >
              <Send className="w-3 h-3" />
              <span>+ Nuevo Aviso</span>
            </button>
          )}
        </div>

        {/* Action Toolbar: Marcar todas como leídas & Limpiar leídas */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
          {totalUnread > 0 ? (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer text-blue-400 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como leídas</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
              <Check className="w-3 h-3" />
              <span>Sin avisos pendientes</span>
            </span>
          )}

          {totalRead > 0 && onClearReadNotifications && (
            <button
              type="button"
              onClick={onClearReadNotifications}
              className="hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer text-neutral-500 hover:text-red-300"
              title="Eliminar todos los avisos que ya leíste para despejar la bandeja"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar leídas</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
          {displayedNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-center mx-auto text-neutral-400">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="font-semibold text-neutral-300">
                {statusFilter === 'unread' ? '¡Todo leído!' : 'Bandeja despejada'}
              </p>
              <p className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                {statusFilter === 'unread' 
                  ? 'No tienes notificaciones pendientes. Cambia a "Todas" para ver tu historial.'
                  : 'No hay avisos en esta sección.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((notif) => {
              const isPayment = notif.type === 'payment_reminder';
              const isSuspended = notif.type === 'membership_suspension';
              const isMilestone = notif.type === 'milestone';

              // Target Audience label
              let audienceLabel = 'General Kinetix';
              let isPrivateForUser = false;

              if (notif.targetUserId) {
                audienceLabel = notif.targetUserId === currentUserId ? '🔒 Privado para ti' : '🔒 Mensaje Directo';
                isPrivateForUser = true;
              } else if (notif.targetAudience === 'staff') {
                audienceLabel = '🛡️ Equipo Staff';
              } else if (notif.targetAudience === 'athletes') {
                audienceLabel = '👥 Atletas Kinetix';
              } else if (notif.targetAudience?.startsWith('color_')) {
                audienceLabel = `🗓️ Grupo Corte Día ${notif.targetAudience.replace('color_', '')}`;
              }

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                    !notif.read
                      ? isSuspended
                        ? 'bg-red-950/40 border-red-700/70 shadow-sm'
                        : isPayment
                        ? 'bg-blue-950/40 border-blue-600/60 shadow-sm'
                        : 'bg-neutral-800/90 border-neutral-700 shadow-sm'
                      : 'bg-neutral-950/60 border-neutral-800/80 opacity-75'
                  }`}
                >
                  {/* Card Header: Icon, Title, Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isSuspended ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : isPayment ? (
                          <CreditCard className="w-4 h-4 text-blue-400" />
                        ) : isMilestone ? (
                          <Award className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold leading-tight ${
                          isSuspended ? 'text-red-300' : isPayment ? 'text-blue-300' : 'text-white'
                        }`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] font-mono text-neutral-500 block mt-0.5">
                          {typeof notif.timestamp === 'string' 
                            ? notif.timestamp.slice(0, 16).replace('T', ' ')
                            : ''}
                        </span>
                      </div>
                    </div>

                    {/* Quick Dismiss / Delete from view */}
                    {onDismissNotification && (
                      <button
                        type="button"
                        onClick={() => onDismissNotification(notif.id)}
                        className="text-neutral-500 hover:text-red-400 p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                        title="Descartar y no volver a ver este aviso"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Body text */}
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans select-text">
                    {notif.body}
                  </p>

                  {/* Card Footer: Audience badge and 'Ya la leí' button */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/70 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] border ${
                      isPrivateForUser 
                        ? 'bg-amber-950/70 border-amber-800/70 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}>
                      {audienceLabel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!notif.read ? (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                          className="px-2.5 py-1 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                          title="Marcar como leída para no tenerla pendiente"
                        >
                          <Check className="w-3 h-3 text-blue-400" />
                          <span>✓ Ya la leí</span>
                        </button>
                      ) : (
                        <span className="text-neutral-500 flex items-center gap-1 text-[9px]">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Leída</span>
                        </span>
                      )}

                      {onDismissNotification && (
                        <button
                          type="button"
                          onClick={() => onDismissNotification(notif.id)}
                          className="text-neutral-500 hover:text-red-400 text-[10px] px-1.5 py-1 rounded hover:bg-neutral-800 transition-colors"
                          title="Descartar aviso"
                        >
                          Descartar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 text-center flex items-center justify-between">
          <span>Kinetix Functional Zone</span>
          <span>Avisos directos en la app</span>
        </div>
      </div>
    </div>
  );
};
