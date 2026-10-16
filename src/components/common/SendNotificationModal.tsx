import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { OFFICIAL_COLORS, getPaymentGroup } from '../../utils/paymentColorCodes';
import { 
  Bell, 
  X, 
  Send, 
  CheckCircle2, 
  CreditCard, 
  Dumbbell, 
  Sparkles, 
  Users, 
  MessageSquare,
  Search,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface SendNotificationModalProps {
  users: UserProfile[];
  onSendNotification: (
    title: string, 
    body: string, 
    targetUserId?: string, 
    targetAudience?: 'all' | 'athletes' | 'staff' | 'color_5' | 'color_15' | 'color_20' | 'color_30'
  ) => void;
  onClose: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  users,
  onSendNotification,
  onClose,
}) => {
  const [recipientScope, setRecipientScope] = useState<'all' | 'single' | 'staff' | 'color'>('all');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedColorDay, setSelectedColorDay] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [presetType, setPresetType] = useState<'payment' | 'evaluation' | 'milestone' | 'custom'>('payment');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const athletes = users.filter(u => u.role === 'athlete');
  const staffUsers = users.filter(u => u.role === 'staff');

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const targetAthlete = athletes.find(a => a.id === selectedAthleteId);
  const targetName = targetAthlete ? targetAthlete.name.split(' ')[0] : 'atleta';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = '';
    let finalBody = '';
    let targetUserId: string | undefined = undefined;
    let targetAudience: 'all' | 'athletes' | 'staff' | 'color_5' | 'color_15' | 'color_20' | 'color_30' | undefined = undefined;

    if (recipientScope === 'single') {
      if (!selectedAthleteId) return;
      targetUserId = selectedAthleteId;
    } else if (recipientScope === 'staff') {
      targetAudience = 'staff';
    } else if (recipientScope === 'color') {
      targetAudience = `color_${selectedColorDay}` as any;
    } else {
      targetAudience = 'athletes';
    }

    if (presetType === 'payment') {
      finalTitle = 'Recordatorio de Renovación Kinetix';
      if (recipientScope === 'single') {
        finalBody = `Hola ${targetName}, tu fecha de corte mensual se acerca. Por favor acércate a recepción o contacta a tu coach para renovar tu membresía.`;
      } else if (recipientScope === 'color') {
        finalBody = `Atletas con corte el día ${selectedColorDay}: Les recordamos que su renovación mensual se aproxima. Gracias por mantener al día su membresía Kinetix.`;
      } else {
        finalBody = 'Estimados atletas, les recordamos consultar su fecha de corte mensual en la sección Membresía de la app para mantenerse al corriente.';
      }
    } else if (presetType === 'evaluation') {
      finalTitle = 'Nuevos Resultados de Evaluación Técnica';
      finalBody = recipientScope === 'single'
        ? `Hola ${targetName}, tus resultados oficiales del Test Cooper y Fuerza 1RM ya están disponibles en tu expediente de Kinetix.`
        : 'Tus resultados y marcas actualizadas de rendimiento físico han sido validados por el equipo de coaches.';
    } else if (presetType === 'milestone') {
      finalTitle = '¡Reconocimiento y Hito Funcional!';
      finalBody = recipientScope === 'single'
        ? `¡Muchas felicidades ${targetName}! Tu constancia y superación de marcas personales han sido sobresalientes esta semana.`
        : '¡Excelente disciplina y entrega de toda la comunidad Kinetix en las sesiones de entrenamiento de este ciclo!';
    } else {
      finalTitle = customTitle.trim() || 'Aviso Oficial Kinetix';
      finalBody = customBody.trim() || 'Aviso emitido por la dirección de Kinetix Functional Zone.';
    }

    onSendNotification(finalTitle, finalBody, targetUserId, targetAudience);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Emitir Aviso Oficial Kinetix
              </h3>
              <p className="text-xs text-neutral-400">Dirige mensajes a atletas, grupos de pago o solo al Staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-8 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">¡Aviso Emitido con Éxito!</h4>
            <p className="text-xs text-neutral-400">
              La notificación fue entregada a los destinatarios seleccionados sin saturar el buzón del coach.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Destinatario Filter Buttons */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>¿A quién deseas enviar el aviso?</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Filtro de Audiencia</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setRecipientScope('all'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    recipientScope === 'all'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">👥 A Todos</span>
                  <span className="text-[9px] text-neutral-400">Todos los alumnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientScope('single')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    recipientScope === 'single'
                      ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-1 ring-purple-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">👤 1 Alumno</span>
                  <span className="text-[9px] text-neutral-400">Elegir con buscador</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setRecipientScope('staff'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    recipientScope === 'staff'
                      ? 'bg-red-600/20 border-red-500 text-white font-bold ring-1 ring-red-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">🛡️ Solo Staff</span>
                  <span className="text-[9px] text-neutral-400">Coaches & dueños</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setRecipientScope('color'); setSelectedAthleteId(''); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    recipientScope === 'color'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="block text-xs">📅 Por Corte</span>
                  <span className="text-[9px] text-neutral-400">Grupo de pago</span>
                </button>
              </div>
            </div>

            {/* If Single Athlete Selected: Instant Search & Selection */}
            {recipientScope === 'single' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-700/60">
                  <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar atleta por nombre o email para no scrollear..."
                    className="w-full bg-transparent text-white text-xs outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm('')} className="text-neutral-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredAthletes.length === 0 ? (
                    <div className="text-center py-3 text-neutral-500 text-[11px]">
                      No se encontraron atletas con ese nombre o email.
                    </div>
                  ) : (
                    filteredAthletes.map(ath => {
                      const isSelected = selectedAthleteId === ath.id;
                      return (
                        <button
                          key={ath.id}
                          type="button"
                          onClick={() => setSelectedAthleteId(ath.id)}
                          className={`w-full p-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-blue-600/30 border border-blue-500 text-white font-semibold'
                              : 'hover:bg-neutral-900 border border-transparent text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            <span className="truncate">{ath.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono truncate">{ath.email}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                            Corte: Día {ath.membership.billingDayOfMonth || 15}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* If Color Group Selected */}
            {recipientScope === 'color' && (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 animate-fade-in">
                <span className="text-[11px] text-neutral-300 font-medium block">
                  Selecciona la fecha de corte mensual:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {OFFICIAL_COLORS.map(c => {
                    const count = athletes.filter(a => (a.membership.billingDayOfMonth || 15) === c.day).length;
                    const isSelected = selectedColorDay === c.day;
                    return (
                      <button
                        key={c.day}
                        type="button"
                        onClick={() => setSelectedColorDay(c.day)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected ? c.btnActive : c.btnInactive
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{c.emoji} {c.colorName}</span>
                          <span className="text-[10px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-full">
                            {count} {count === 1 ? 'atleta' : 'atletas'}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-80 block mt-0.5 font-mono">
                          Vencimiento día {c.day} de cada mes
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block">
                Tipo de Aviso:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPresetType('payment')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    presetType === 'payment'
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Corte de Pago</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Recordatorio sin precios
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPresetType('evaluation')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    presetType === 'evaluation'
                      ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Dumbbell className="w-3.5 h-3.5 text-red-400" />
                    <span>Pruebas 1RM</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Cooper y marcas de fuerza
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPresetType('milestone')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    presetType === 'milestone'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Felicitación</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Constancia y nuevos PRs
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPresetType('custom')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    presetType === 'custom'
                      ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Personalizado</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Mensaje libre del coach
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Inputs */}
            {presetType === 'custom' && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Título del Aviso:</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ej. Anuncio importante de clases de fuerza"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Mensaje:</label>
                  <textarea
                    rows={3}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="Escribe el mensaje oficial..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500 resize-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={recipientScope === 'single' && !selectedAthleteId}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Emitir Aviso</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
