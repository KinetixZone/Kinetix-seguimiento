import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { 
  Bell, 
  X, 
  Send, 
  CheckCircle2, 
  CreditCard, 
  Dumbbell, 
  Sparkles, 
  Users, 
  MessageSquare
} from 'lucide-react';

interface SendNotificationModalProps {
  users: UserProfile[];
  onSendNotification: (title: string, body: string, targetUserId?: string) => void;
  onClose: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  users,
  onSendNotification,
  onClose,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [presetType, setPresetType] = useState<'payment' | 'evaluation' | 'milestone' | 'custom'>('payment');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const athletes = users.filter(u => u.role === 'athlete');
  const targetUser = athletes.find(a => a.id === selectedUserId);
  const targetName = targetUser ? targetUser.name.split(' ')[0] : 'atleta';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = '';
    let finalBody = '';

    if (presetType === 'payment') {
      finalTitle = 'Recordatorio de Renovación Kinetix';
      finalBody = selectedUserId === 'all'
        ? 'Estimados atletas, les recordamos que su fecha de corte mensual se acerca. Por favor acérquense a recepción o contacten a su coach para renovar su membresía.'
        : `Hola ${targetName}, tu fecha de corte mensual se acerca. Por favor acércate a recepción o contacta a tu coach para renovar tu membresía.`;
    } else if (presetType === 'evaluation') {
      finalTitle = 'Nuevos Resultados de Evaluación Física';
      finalBody = selectedUserId === 'all'
        ? 'Tus resultados actualizados del Test Cooper y Fuerza 1RM ya se encuentran disponibles en tu expediente de Kinetix.'
        : `Hola ${targetName}, tus marcas del Test Cooper y Fuerza 1RM han sido registradas en tu expediente oficial.`;
    } else if (presetType === 'milestone') {
      finalTitle = '¡Hito de Rendimiento Alcanzado!';
      finalBody = selectedUserId === 'all'
        ? '¡Excelente constancia y esfuerzo de todo el equipo en las sesiones funcionales de esta semana!'
        : `¡Felicidades ${targetName}! Tu constancia y superación de marcas personales han sido sobresalientes.`;
    } else {
      finalTitle = customTitle.trim() || 'Aviso de Kinetix Functional Zone';
      finalBody = customBody.trim() || 'Aviso general del equipo de entrenadores.';
    }

    onSendNotification(finalTitle, finalBody, selectedUserId === 'all' ? undefined : selectedUserId);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Emitir Aviso a Alumnos
              </h3>
              <p className="text-xs text-neutral-400">Envía alertas y avisos oficiales sin precios visibles</p>
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
          <div className="p-6 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-white">¡Aviso Emitido con Éxito!</h4>
            <p className="text-xs text-neutral-400">
              La notificación oficial ha sido entregada al buzón del alumno en la plataforma Kinetix.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target Selector */}
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Destinatario del Aviso:</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-blue-500"
              >
                <option value="all">👥 Todos los Alumnos del Gimnasio</option>
                {athletes.map(ath => (
                  <option key={ath.id} value={ath.id}>
                    👤 {ath.name} ({ath.email}) · Corte Día {ath.membership.billingDayOfMonth || 15}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium block">
                Tipo de Notificación:
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
                    Resultados de Cooper y fuerza
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
                    Hito de fuerza o asistencia
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

            {/* Custom Inputs if selected */}
            {presetType === 'custom' && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Título del Aviso:</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ej. Cambio de horario clase funcional"
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
                    placeholder="Escribe el aviso para el alumno..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500 resize-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Preview of message (Clean without prices!) */}
            <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-300 space-y-1">
              <span className="text-[10px] text-neutral-400 font-mono block">Vista previa del mensaje (sin montos de precio):</span>
              <p className="italic text-neutral-200 leading-relaxed">
                {presetType === 'payment' && (
                  `"Hola ${targetName}, tu fecha de corte mensual se acerca. Por favor acércate a recepción o contacta a tu coach para renovar tu membresía."`
                )}
                {presetType === 'evaluation' && (
                  `"Hola ${targetName}, tus marcas del Test Cooper y Fuerza 1RM han sido registradas en tu expediente oficial."`
                )}
                {presetType === 'milestone' && (
                  `"¡Felicidades ${targetName}! Tu constancia y superación de marcas personales han sido sobresalientes."`
                )}
                {presetType === 'custom' && (
                  customBody || '"Escribe tu mensaje arriba..."'
                )}
              </p>
            </div>

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
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
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
