import React, { useState, useMemo } from 'react';
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
  Search,
  ChevronDown,
  ChevronUp,
  Archive
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

  // Sent tab CRM-style filters, expansion, pagination, and archive
  const [sentSearch, setSentSearch] = useState('');
  const [sentAudienceFilter, setSentAudienceFilter] = useState<'all' | 'broadcast' | 'color' | 'individual'>('all');
  const [sentVisibleLimit, setSentVisibleLimit] = useState(8);
  const [expandedSentIds, setExpandedSentIds] = useState<Record<string, boolean>>({});
  const [archivedSentIds, setArchivedSentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('kinetix_archived_sent_notifs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // For staff: incoming notifications vs notifications sent out to athletes
  const incomingStaffNotifications = notifications.filter(
    n => n.targetAudience === 'staff' || n.targetAudience === 'all' || !n.targetAudience || n.targetUserId === currentUserId
  );

  const sentToAthletesNotifications = (allNotifications.length > 0 ? allNotifications : notifications).filter(
    n =>
      n.targetAudience !== 'staff' &&
      (n.targetAudience !== undefined || n.targetUserId !== undefined) &&
      !archivedSentIds.includes(n.id)
  );

  const isSentView = isStaff && activeTab === 'sent';

  // Filter inbox list
  const inboxUnread = (isStaff ? incomingStaffNotifications : notifications).filter(n => !n.read).length;
  const inboxRead = (isStaff ? incomingStaffNotifications : notifications).filter(n => n.read).length;

  const filteredInbox = (isStaff ? incomingStaffNotifications : notifications).filter(n => {
    if (statusFilter === 'unread') return !n.read;
    if (statusFilter === 'read') return n.read;
    return true;
  });

  // Filter sent list (CRM style: audience + search + pagination)
  const filteredSentAll = useMemo(() => {
    const q = sentSearch.trim().toLowerCase();
    return sentToAthletesNotifications.filter(n => {
      if (sentAudienceFilter === 'individual' && !n.targetUserId) return false;
      if (sentAudienceFilter === 'color' && !n.targetAudience?.startsWith('color_')) return false;
      if (sentAudienceFilter === 'broadcast' && (n.targetUserId || n.targetAudience?.startsWith('color_'))) return false;
      if (q) {
        const hay = `${n.title} ${n.body} ${n.targetAudience || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sentToAthletesNotifications, sentAudienceFilter, sentSearch]);

  if (!isOpen) return null;

  const paginatedSent = filteredSentAll.slice(0, sentVisibleLimit);

  const handleArchiveAllSent = () => {
    const idsToArchive = sentToAthletesNotifications.map(n => n.id);
    const merged = Array.from(new Set([...archivedSentIds, ...idsToArchive]));
    setArchivedSentIds(merged);
    try {
      localStorage.setItem('kinetix_archived_sent_notifs', JSON.stringify(merged));
    } catch {}
  };

  const toggleExpandSent = (id: string) => {
    setExpandedSentIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getAudienceLabel = (notif: PushNotificationSimulation) => {
    if (notif.targetUserId) {
      return notif.targetUserId === currentUserId ? '🔒 Privado para ti' : '👤 Individual';
    }
    if (notif.targetAudience === 'staff') return '🛡️ Equipo Staff';
    if (notif.targetAudience === 'athletes' || notif.targetAudience === 'all') return '👥 Todos los Atletas';
    if (notif.targetAudience?.startsWith('color_')) {
      return `🗓️ Corte Día ${notif.targetAudience.replace('color_', '')}`;
    }
    return 'General Kinetix';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-end p-2 sm:p-5 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-brand flex items-center gap-2">
                <span>Centro de Avisos</span>
                {inboxUnread > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 border border-red-500/40 text-red-300">
                    {inboxUnread} nuevo{inboxUnread > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                    Al día
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-neutral-400">
                {isStaff ? 'Bandeja Staff & Historial de Envíos' : 'Avisos oficiales y notificaciones'}
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

        {/* Staff Switcher Tabs */}
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
              <span>Recibidos ({incomingStaffNotifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sent');
                setSentVisibleLimit(8);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviados ({sentToAthletesNotifications.length})</span>
            </button>
          </div>
        )}

        {/* VIEW A: INBOX TOOLBAR (Athletes & Staff Received) */}
        {!isSentView ? (
          <>
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
                  Todas ({(isStaff ? incomingStaffNotifications : notifications).length})
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
                  {inboxUnread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] flex items-center justify-center font-bold">
                      {inboxUnread}
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
                  Leídas ({inboxRead})
                </button>
              </div>

              {isStaff && onOpenSendNotification && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSendNotification();
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-600/15 px-2.5 py-1.5 rounded-xl border border-blue-500/30 active:scale-95 transition-all shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>+ Nuevo</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
              {inboxUnread > 0 ? (
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

              {inboxRead > 0 && onClearReadNotifications && (
                <button
                  type="button"
                  onClick={onClearReadNotifications}
                  className="hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer text-neutral-500"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpiar leídas</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* VIEW B: SENT CRM-STYLE TOOLBAR (Compact Search, Audience Pills & Archive) */
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sentSearch}
                  onChange={(e) => setSentSearch(e.target.value)}
                  placeholder="Buscar aviso enviado..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                />
              </div>
              {onOpenSendNotification && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSendNotification();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-sm active:scale-95"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                {([
                  { id: 'all', label: 'Todos' },
                  { id: 'broadcast', label: 'Masivos' },
                  { id: 'color', label: 'Cortes' },
                  { id: 'individual', label: '1 a 1' },
                ] as const).map(pill => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setSentAudienceFilter(pill.id);
                      setSentVisibleLimit(8);
                    }}
                    className={`px-2 py-1 rounded-lg font-medium border transition-colors ${
                      sentAudienceFilter === pill.id
                        ? 'bg-blue-600/25 border-blue-500/50 text-blue-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {sentToAthletesNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleArchiveAllSent}
                  className="text-[10px] text-neutral-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                  title="Archivar historial de esta vista sin borrar alertas no leídas de tus alumnos"
                >
                  <Archive className="w-3 h-3" />
                  <span>Limpiar vista</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* LIST AREA */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {isSentView ? (
            /* COMPACT EXPANDABLE CRM SENT LOG */
            paginatedSent.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-500 space-y-1.5">
                <Users className="w-6 h-6 mx-auto opacity-30" />
                <p className="font-semibold text-neutral-300">Historial de envíos limpio</p>
                <p className="text-[10px] text-neutral-500">
                  Los nuevos avisos que envíes aparecerán aquí organizados de forma compacta.
                </p>
              </div>
            ) : (
              <>
                {paginatedSent.map((notif) => {
                  const isExpanded = !!expandedSentIds[notif.id];
                  const dateLabel = typeof notif.timestamp === 'string'
                    ? notif.timestamp.slice(0, 16).replace('T', ' ')
                    : '';
                  return (
                    <div
                      key={notif.id}
                      className="rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-all text-xs overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpandSent(notif.id)}
                        className="w-full p-2.5 flex items-center justify-between gap-2 text-left"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="font-bold text-white truncate text-[11px]">{notif.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-neutral-400">
                            <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded font-mono">
                              {getAudienceLabel(notif)}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-neutral-500">{dateLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                            Enviado
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-neutral-800/70 space-y-2 bg-neutral-900/40">
                          <p className="text-[11px] text-neutral-300 leading-relaxed select-text">
                            {notif.body}
                          </p>
                          {onDismissNotification && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => onDismissNotification(notif.id)}
                                className="text-[10px] text-neutral-500 hover:text-red-400 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar permanentemente</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredSentAll.length > sentVisibleLimit && (
                  <button
                    type="button"
                    onClick={() => setSentVisibleLimit(prev => prev + 10)}
                    className="w-full py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-blue-400 font-semibold transition-colors"
                  >
                    Ver más ({filteredSentAll.length - sentVisibleLimit} anteriores)
                  </button>
                )}
              </>
            )
          ) : (
            /* INBOX CARDS (Athletes & Staff Received) */
            filteredInbox.length === 0 ? (
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
              filteredInbox.map((notif) => {
                const isPayment = notif.type === 'payment_reminder';
                const isSuspended = notif.type === 'membership_suspension';
                const isMilestone = notif.type === 'milestone';
                const isPrivateForUser = Boolean(notif.targetUserId);

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

                    <p className="text-[11px] text-neutral-300 leading-relaxed font-sans select-text">
                      {notif.body}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/70 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] border ${
                        isPrivateForUser 
                          ? 'bg-amber-950/70 border-amber-800/70 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}>
                        {getAudienceLabel(notif)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {!notif.read ? (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                            className="px-2.5 py-1 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
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
                          >
                            Descartar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 text-center flex items-center justify-between">
          <span>Kinetix Functional Zone</span>
          <span>{isSentView ? `${filteredSentAll.length} registro(s)` : 'Avisos directos en la app'}</span>
        </div>
      </div>
    </div>
  );
};
