import React, { useState } from 'react';
import { UserProfile, MembershipStatus } from '../../types';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  Clock, 
  ShieldAlert, 
  DollarSign, 
  Send, 
  Zap, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface MembershipViewProps {
  currentUser: UserProfile;
  onUpdateMembershipStatus: (status: MembershipStatus, daysUntilExpiry: number) => void;
  onSimulatePushNotification: (title: string, body: string) => void;
  onBackToDashboard?: () => void;
}

export const MembershipView: React.FC<MembershipViewProps> = ({
  currentUser,
  onUpdateMembershipStatus,
  onSimulatePushNotification,
  onBackToDashboard,
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const mem = currentUser.membership;

  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      onUpdateMembershipStatus('active', 30);
      onSimulatePushNotification(
        'Pago Registrado Exitosamente',
        `Hemos recibido el pago de $${mem.monthlyFee} ${mem.currency}. Tu membresía de Kinetix está activa hasta el 30 de Mayo, 2024.`
      );
      setTimeout(() => setPaymentSuccess(false), 4000);
    }, 1200);
  };

  const handleTriggerSuspension = () => {
    onUpdateMembershipStatus('suspended', -6);
    onSimulatePushNotification(
      'Membresía Suspendida por Falta de Pago',
      `Estimado(a) ${currentUser.name}, tu membresía de Kinetix Functional Zone ha sido suspendida al superar los 5 días de gracia reglamentarios.`
    );
  };

  const handleTriggerSarahReminder = () => {
    onSimulatePushNotification(
      'Recordatorio de Pago Kinetix',
      `Hola ${currentUser.name.split(' ')[0]}, tu membresía vence el ${mem.expiryDate}. Monto a Pagar: $${mem.monthlyFee}. Por favor contacta al gimnasio para renovar tu membresía.`
    );
  };

  const getStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4" /> Membresía Activa
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="text-amber-400 font-semibold flex items-center gap-1.5 text-xs">
            <Clock className="w-4 h-4" /> Vencimiento Próximo
          </span>
        );
      case 'expired':
        return (
          <span className="text-orange-400 font-semibold flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4" /> Vencida (En Gracia)
          </span>
        );
      case 'suspended':
        return (
          <span className="text-red-400 font-semibold flex items-center gap-1.5 text-xs">
            <ShieldAlert className="w-4 h-4" /> Suspendida por Impago
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 px-4 pt-2">
      {/* Back to Dashboard Navigation Breadcrumb */}
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </button>
      )}

      {/* Header */}
      <div>
        <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
          Administración & Facturación
        </span>
        <h2 className="text-xl font-bold text-white font-brand">
          Membresía Kinetix
        </h2>
      </div>

      {/* Main Membership Status Card */}
      <div className={`p-4 rounded-3xl border transition-all ${
        mem.status === 'suspended'
          ? 'bg-red-950/40 border-red-800/80'
          : mem.status === 'expiring_soon'
          ? 'bg-amber-950/30 border-amber-800/70'
          : 'bg-neutral-900/80 border-neutral-800'
      }`}>
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">{mem.planName}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {mem.hasNutritionPlan && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                  🥗 Asesoría Nutricional
                </span>
              )}
              {mem.personalCoach && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-medium">
                  🏋️ Personalizado: {mem.personalCoach}
                </span>
              )}
              <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                Día {mem.billingDayOfMonth || 15} de corte
              </span>
            </div>
          </div>
          <div>{getStatusBadge(mem.status)}</div>
        </div>

        {/* Plan Details & Expiry Date */}
        <div className="grid grid-cols-2 gap-3 py-3 border-b border-neutral-800/80 text-xs">
          <div>
            <span className="text-neutral-400">Modalidad Activa</span>
            <div className="text-xs font-bold text-white font-brand mt-1 leading-snug">
              {mem.planName}
            </div>
            <span className="text-[10px] text-emerald-400">
              {mem.hasNutritionPlan ? '🥗 Plan Nutrición Incluido' : 'Entrenamiento Funcional'}
            </span>
          </div>

          <div>
            <span className="text-neutral-400">Fecha Límite de Pago</span>
            <div className="text-sm font-bold text-blue-400 font-mono mt-1">
              {mem.expiryDate}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              {mem.daysUntilExpiry > 0 
                ? `${mem.daysUntilExpiry} días restantes` 
                : `${Math.abs(mem.daysUntilExpiry)} días en mora`}
            </span>
          </div>
        </div>

        {/* Suspension Rule Explainer */}
        <div className="pt-3 text-[11px] text-neutral-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Regla Oficial de Suspensión por Falta de Pago:</span>
          </div>
          <p className="leading-relaxed">
            Se otorga un período de gracia de <strong>{mem.gracePeriodDays} días naturales</strong> tras la fecha de vencimiento. 
            Al 6º día sin registrar pago a las 00:01 AM, el sistema suspende automáticamente la cuenta y las reservas del atleta.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessingPayment}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-98 transition-all disabled:opacity-50"
          >
            {isProcessingPayment ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Procesando Renovación...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Registrar Pago / Regularizar Membresía</span>
              </>
            )}
          </button>

          {paymentSuccess && (
            <div className="mt-2 text-center text-xs text-emerald-400 font-medium animate-fade-in">
              ✓ ¡Membresía renovada con éxito por 30 días!
            </div>
          )}
        </div>
      </div>

      {/* In-App Notifications & State Test Bench */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-blue-400" />
            Simulador de Avisos en la Misma Página
          </span>
          <span className="text-[10px] font-mono text-neutral-500">In-App</span>
        </div>

        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Las notificaciones se reciben directamente en la página web / app sin intermediarios externos:
        </p>

        <div className="space-y-2">
          {/* Sarah Prompt Example */}
          <button
            onClick={handleTriggerSarahReminder}
            className="w-full text-left p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center justify-between text-xs"
          >
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Send className="w-3 h-3 text-blue-400" />
                <span>Disparar Recordatorio de Pago (Ejemplo Oficial Sarah)</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                "Hola Sarah, tu membresía vence el 30 de Abril, 2024. Monto a Pagar: $89.99..."
              </div>
            </div>
            <span className="text-[10px] text-blue-400 shrink-0 font-medium">Lanzar Aviso &rarr;</span>
          </button>

          {/* Trigger Auto Suspension Test */}
          <button
            onClick={handleTriggerSuspension}
            className="w-full text-left p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center justify-between text-xs"
          >
            <div>
              <div className="font-semibold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-red-500" />
                <span>Simular Corte por Falta de Pago (Suspensión Automática)</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                Aplica la regla de suspensión tras superar los 5 días de gracia.
              </div>
            </div>
            <span className="text-[10px] text-red-400 shrink-0 font-medium">Suspender &rarr;</span>
          </button>

          {/* Reset to Active */}
          <button
            onClick={() => onUpdateMembershipStatus('active', 25)}
            className="w-full text-left p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center justify-between text-xs"
          >
            <div className="font-medium text-neutral-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Restablecer Membresía Activa (25 días restantes)</span>
            </div>
            <span className="text-[10px] text-emerald-400 shrink-0">Reset &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
