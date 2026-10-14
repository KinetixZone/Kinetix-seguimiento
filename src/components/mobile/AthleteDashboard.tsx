import React from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord } from '../../types';
import { getPaymentGroup } from '../../utils/paymentColorCodes';
import { 
  TrendingUp, 
  Activity, 
  Dumbbell, 
  Heart, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  Award, 
  ShieldCheck, 
  Scale,
  Share2,
  Instagram,
  CreditCard,
  Flame,
  ShieldAlert
} from 'lucide-react';

interface AthleteDashboardProps {
  currentUser: UserProfile;
  latestBodyComp?: BodyCompositionRecord | null;
  latestEval?: PhysicalEvaluationRecord;
  onNavigateTab: (tab: 'dashboard' | 'body' | 'tests' | 'membership' | 'staff' | 'privacy') => void;
  onOpenReport: () => void;
  onOpenShareStory?: () => void;
}

import { calculateDaysUntilExpiry } from '../../utils/fitnessCalculations';

export const AthleteDashboard: React.FC<AthleteDashboardProps> = ({
  currentUser,
  latestBodyComp,
  latestEval,
  onNavigateTab,
  onOpenReport,
  onOpenShareStory,
}) => {
  const daysRemaining = currentUser.membership?.expiryDate && currentUser.membership.expiryDate !== 'Permanente'
    ? calculateDaysUntilExpiry(currentUser.membership.expiryDate)
    : 999;

  // The warning banner ONLY triggers when 15 days or less remain (15 to 0 days)
  const isExpiringSoon = currentUser.role !== 'staff' && 
    currentUser.membership.status !== 'suspended' &&
    (currentUser.membership.status === 'expiring_soon' || (daysRemaining <= 15 && daysRemaining >= 0));

  const isSuspended = currentUser.membership.status === 'suspended';

  const currentMonthFormatted = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const displayMonth = currentMonthFormatted.charAt(0).toUpperCase() + currentMonthFormatted.slice(1);

  return (
    <div className="space-y-4 pb-20 px-4 pt-2">
      {/* Top Welcome & Month Kicker */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
            Mes Actual · {displayMonth}
          </span>
          <h2 className="text-xl font-bold text-white font-brand">
            {currentUser.name}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenShareStory && (
            <button
              onClick={onOpenShareStory}
              className="text-[11px] font-medium text-white bg-gradient-to-r from-blue-600 to-red-600 hover:opacity-90 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-95"
              title="Crear historia para Instagram o WhatsApp"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir</span>
            </button>
          )}
          <button
            onClick={onOpenReport}
            className="text-[11px] font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-red-500/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-red-500" />
            <span>Ficha</span>
          </button>
        </div>
      </div>

      {/* Paused Access Alert Banner */}
      {isSuspended && (
        <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-800 flex items-center justify-between text-xs text-red-200 shadow-xl shadow-red-950/50">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <strong className="block text-white font-bold">ACCESO PAUSADO POR EL STAFF</strong>
              <span className="text-[11px] text-red-300/90">Tu membresía se encuentra pausada. Contacta a Coach Jorge para reactivar tu acceso y reservas.</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('membership')}
            className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs whitespace-nowrap active:scale-95 transition-all"
          >
            Ver Detalle
          </button>
        </div>
      )}

      {/* PERMANENT PAYMENT DUE DATE WIDGET (Solo para atletas; Staff/Coaches cuentan con Acceso Permanente Ilimitado sin fecha de corte) */}
      {currentUser.role === 'staff' ? (
        <div className="p-3.5 rounded-2xl border bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/40 border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>Acceso Maestro Staff & Coach</span>
                <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Ilimitado
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-emerald-400 font-medium">✓ Sin fecha de corte ni cobros</span>
                <span>·</span>
                <span className="text-neutral-300">Cuenta Permanente Kinetix</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('staff')}
            className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/80 border border-red-800/80 px-2.5 py-1.5 rounded-xl transition-colors shrink-0 shadow"
          >
            Panel Staff &rarr;
          </button>
        </div>
      ) : (
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isSuspended
            ? 'bg-red-950/60 border-red-800/80'
            : isExpiringSoon
            ? 'bg-amber-950/60 border-amber-800/70'
            : 'bg-neutral-900/90 border-neutral-800 hover:border-blue-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isSuspended
                  ? 'bg-red-500/20 text-red-400'
                  : isExpiringSoon
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span>Tu Próxima Fecha de Pago:</span>
                  <span className={`font-mono ${
                    isSuspended ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-blue-400 font-extrabold'
                  }`}>
                    {currentUser.membership.expiryDate}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>Plan: <strong className="text-neutral-200">{currentUser.membership.planName}</strong></span>
                  <span>·</span>
                  {(() => {
                    const pg = getPaymentGroup(currentUser.membership.billingDayOfMonth);
                    return (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${pg.badgeBg} ${pg.badgeBorder} ${pg.badgeText}`}>
                        <span>{pg.dotEmoji}</span>
                        <span>{pg.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {currentUser.membership.hasNutritionPlan && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                      🥗 Plan Nutricional
                    </span>
                  )}
                  {currentUser.membership.personalCoach && (
                    <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-medium">
                      🏋️ {currentUser.membership.personalCoach}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className={`text-xs font-mono font-bold ${
                isSuspended 
                  ? 'text-red-400' 
                  : isExpiringSoon 
                  ? 'text-amber-400' 
                  : 'text-emerald-400'
              }`}>
                {isSuspended
                  ? 'SUSPENDIDA'
                  : currentUser.membership.daysUntilExpiry > 0
                  ? `${currentUser.membership.daysUntilExpiry} días restantes`
                  : 'En período de gracia'}
              </div>
              <button
                onClick={() => onNavigateTab('membership')}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium block"
              >
                Ver estado &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner when user has no body composition records yet */}
      {!latestBodyComp && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <strong className="text-xs text-white block">Inicia tu primer registro</strong>
              <span className="text-[11px] text-neutral-400 block">Registra tu peso y grasa visceral (Báscula Renpho) para activar tus métricas</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('body')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-md transition-all active:scale-95"
          >
            Registrar
          </button>
        </div>
      )}

      {/* Monthly Highlight Stat Cards (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Weight & BMI Card */}
        <div 
          onClick={() => onNavigateTab('body')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer space-y-1 relative group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              Peso Corporal
            </span>
            <span className="text-[10px] text-neutral-500 group-hover:text-blue-400 transition-colors">
              Historial &rarr;
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums font-mono">
              {latestBodyComp ? latestBodyComp.weightKg : '--'}
            </span>
            {latestBodyComp && <span className="text-xs text-neutral-400">kg</span>}
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 pt-1">
            {latestBodyComp ? (
              <>
                <span>IMC {latestBodyComp.bmi}</span>
                <span>·</span>
                <span className="text-blue-400 font-medium">{latestBodyComp.bmiCategory}</span>
              </>
            ) : (
              <span className="text-neutral-500">Pendiente de pesaje</span>
            )}
          </div>
        </div>

        {/* Muscle Mass Card */}
        <div 
          onClick={() => onNavigateTab('body')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
              Masa Muscular
            </span>
            <span className="text-[10px] text-neutral-500 group-hover:text-cyan-400 transition-colors">
              Métricas &rarr;
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums font-mono">
              {latestBodyComp ? `${latestBodyComp.muscleMassPercent}%` : '--'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 pt-1">
            <span>Grasa Visceral: {latestBodyComp ? `Nivel ${latestBodyComp.visceralFatLevel}` : '--'}</span>
          </div>
        </div>

        {/* Body Fat Card */}
        <div 
          onClick={() => onNavigateTab('body')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Grasa Corporal
            </span>
            <span className="text-[10px] text-neutral-500 group-hover:text-purple-400 transition-colors">
              Báscula &rarr;
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums font-mono">
              {latestBodyComp ? `${latestBodyComp.bodyFatPercent}%` : '--'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 pt-1">
            <span>{latestBodyComp ? 'Medición oficial Renpho' : 'Sin registro de bioimpedancia'}</span>
          </div>
        </div>

        {/* Cooper Aerobic Capacity Card - SHOW ONLY THE LEVEL REACHED */}
        <div 
          onClick={() => onNavigateTab('tests')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-blue-500/40 transition-all cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              Test Cooper
            </span>
            <span className="text-[10px] text-red-500 font-bold uppercase">
              {latestEval?.cooperTest.level ? `Nivel ${latestEval.cooperTest.levelNumber || 1} / 20` : 'Sin evaluar'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums font-brand">
              {latestEval?.cooperTest ? `NIVEL ${latestEval.cooperTest.levelNumber}` : '--'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 pt-1 flex items-center justify-between">
            <span className="text-blue-400 font-medium">{latestEval ? 'Evaluación Coach Jorge' : 'Pendiente de evaluar'}</span>
            <span className="text-[10px] text-neutral-500 group-hover:text-blue-400 transition-colors">Detalle &rarr;</span>
          </div>
        </div>
      </div>

      {/* Test de Resistencia (Por Tiempo) Highlight Card */}
      {latestEval?.enduranceTest && (
        <div 
          onClick={() => onNavigateTab('tests')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/40 transition-all cursor-pointer space-y-1.5 group shadow-sm"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Test de Resistencia Funcional (Por Tiempo)</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold group-hover:text-emerald-300">
              Ver Progreso &rarr;
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div>
              <span className="text-[10px] text-neutral-400 block">Reto del Ciclo Actual:</span>
              <strong className="text-white text-xs">{latestEval.enduranceTest.name}</strong>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase block">Tiempo Logrado</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {latestEval.enduranceTest.result}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Achievement Banner (From Reference: "+5kg ganancia de fuerza este mes") */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/50 via-neutral-900 to-red-950/40 border border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Progreso Mensual Destacado</span>
              <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-mono font-bold">KINETIX</span>
            </div>
            <div className="text-[11px] text-blue-400 font-medium">
              +5kg ganancia de fuerza neta este mes
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenShareStory && (
            <button
              onClick={onOpenShareStory}
              className="text-[10px] font-bold text-white bg-blue-600/80 hover:bg-blue-600 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Share2 className="w-3 h-3" />
              <span>Historia</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('tests')}
            className="text-xs text-neutral-400 hover:text-white p-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Physical Tests Summary (From Reference) */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
            Pruebas Recientes de Fuerza Máxima
          </h3>
          <span className="text-[11px] font-mono text-neutral-500">{displayMonth}</span>
        </div>

        {(!latestEval || !latestEval.strengthRecords || latestEval.strengthRecords.length === 0) ? (
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-400">
            Aún no se han capturado pruebas de fuerza ni test de Cooper. Tu coach registrará tu primera evaluación en pista.
          </div>
        ) : (
          <div className="space-y-2">
            {latestEval.strengthRecords.slice(0, 4).map((rec) => (
              <div 
                key={rec.exerciseId}
                className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0 text-xs"
              >
                <span className="text-neutral-300 font-medium">{rec.exerciseName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold tabular-nums">
                    {rec.weightKg} {rec.weightUnit}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    (1RM {rec.estimated1RMKg}kg)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onNavigateTab('tests')}
          className="w-full text-center text-xs text-neutral-400 hover:text-blue-400 pt-2 transition-colors font-medium flex items-center justify-center gap-1"
        >
          <span>Ver todas las 5 pruebas de fuerza y resistencia</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Action Button to Register Monthly Data */}
      <div className="pt-2">
        <button
          onClick={() => onNavigateTab('body')}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-98"
        >
          <Scale className="w-4 h-4 text-white" />
          <span>Registrar Medición Antropométrica Mensual</span>
        </button>
      </div>
    </div>
  );
};
