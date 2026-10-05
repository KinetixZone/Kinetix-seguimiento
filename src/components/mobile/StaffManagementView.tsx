import React, { useState } from 'react';
import { UserProfile, BodyCompositionRecord, PhysicalEvaluationRecord, MembershipStatus, KinetixPlanName } from '../../types';
import { getPaymentGroup, PAYMENT_COLOR_GROUPS, PaymentColorCode } from '../../utils/paymentColorCodes';
import { ExcelExportModal } from '../common/ExcelExportModal';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Dumbbell, 
  Search, 
  Mail, 
  ShieldCheck, 
  Calendar,
  X,
  CreditCard,
  Award,
  Trash2,
  AlertTriangle,
  UserCog,
  SlidersHorizontal,
  ArrowLeft,
  Sparkles,
  Filter,
  Play,
  Pause,
  Scale,
  Activity,
  Flame,
  UserCheck,
  ShieldAlert,
  Clock,
  TrendingUp,
  Info,
  FileSpreadsheet
} from 'lucide-react';

interface StaffManagementViewProps {
  users: UserProfile[];
  bodyCompRecords?: BodyCompositionRecord[];
  evaluations?: PhysicalEvaluationRecord[];
  onSelectUserToInspect: (user: UserProfile) => void;
  onCreateUserByEmail: (newUser: { 
    name: string; 
    email: string; 
    planName: KinetixPlanName; 
    gender: 'male' | 'female'; 
    heightCm: number;
    billingDayOfMonth?: number;
    expiryDate?: string;
  }) => void;
  onOpenTestEntryForUser: (user: UserProfile) => void;
  onOpenBodyCompForUser?: (user: UserProfile) => void;
  onUpdateUserMembership?: (
    userId: string, 
    status: MembershipStatus, 
    newExpiryDate?: string,
    newPlanName?: KinetixPlanName,
    billingDayOfMonth?: number
  ) => void;
  onDeleteAthlete?: (userId: string) => void;
  onUpdateAthleteProfile?: (userId: string, updates: Partial<UserProfile>) => void;
  onBackToDashboard?: () => void;
  currentUser?: UserProfile;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  users,
  bodyCompRecords = [],
  evaluations = [],
  onSelectUserToInspect,
  onCreateUserByEmail,
  onOpenTestEntryForUser,
  onOpenBodyCompForUser,
  onUpdateUserMembership,
  onDeleteAthlete,
  onUpdateAthleteProfile,
  onBackToDashboard,
  currentUser,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment date and profile edit modal state
  const [selectedAthleteForPayment, setSelectedAthleteForPayment] = useState<UserProfile | null>(null);
  const [modalTab, setModalTab] = useState<'membership' | 'profile'>('membership');
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<MembershipStatus>('active');
  const [editPlan, setEditPlan] = useState<KinetixPlanName>('Kinetix');
  const [editBillingDay, setEditBillingDay] = useState<number>(15);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmergencyName, setEditEmergencyName] = useState<string>('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [savePaymentSuccess, setSavePaymentSuccess] = useState<boolean>(false);
  
  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [planName, setPlanName] = useState<KinetixPlanName>('Kinetix');
  const [billingDay, setBillingDay] = useState<number>(15);
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState(false);

  // Payment color filter state: 'all' | 5 | 15 | 20 | 30
  const [colorFilter, setColorFilter] = useState<'all' | 5 | 15 | 20 | 30>('all');

  const activeStaff = currentUser && currentUser.role === 'staff' 
    ? currentUser 
    : (users.find(u => u.role === 'staff' || u.id === 'user-staff-leslie' || u.id === 'user-staff-01') || users[0]);

  const isOwner = activeStaff.staffRole === 'owner' || activeStaff.id === 'user-staff-leslie' || activeStaff.id === 'user-staff-01' || !activeStaff.staffRole;
  const isCoachGus = activeStaff.staffRole === 'coach' || activeStaff.id === 'user-staff-gus';
  const staffMembers = users.filter(u => u.role === 'staff');

  const filteredAthletes = users.filter(u => {
    if (u.role !== 'athlete') return false;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (colorFilter === 'all') return true;
    return (u.membership?.billingDayOfMonth || 15) === colorFilter;
  });

  // Calculate next date helper based on day of month
  const calculateNextExpiryFromDay = (day: number): string => {
    const now = new Date();
    const currentDay = now.getDate();
    const nextMonth = currentDay >= day ? now.getMonth() + 1 : now.getMonth();
    const d = new Date(now.getFullYear(), nextMonth, day);
    return d.toISOString().slice(0, 10);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expiry = calculateNextExpiryFromDay(billingDay);
    onCreateUserByEmail({
      name,
      email,
      gender,
      heightCm,
      planName,
      billingDayOfMonth: billingDay,
      expiryDate: expiry,
    });
    setCreatedSuccessMsg(true);
    setTimeout(() => {
      setCreatedSuccessMsg(false);
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPlanName('Kinetix');
      setBillingDay(15);
    }, 1800);
  };

  // Toggle quick access directly from list
  const handleQuickToggleAccess = (athlete: UserProfile) => {
    if (!onUpdateUserMembership) return;
    const isCurrentlySuspended = athlete.membership.status === 'suspended';
    const nextStatus: MembershipStatus = isCurrentlySuspended ? 'active' : 'suspended';
    onUpdateUserMembership(
      athlete.id,
      nextStatus,
      athlete.membership.expiryDate,
      athlete.membership.planName,
      athlete.membership.billingDayOfMonth
    );
  };

  // 4 Official Color Codes Data for Easy Rendering
  const OFFICIAL_COLORS = [
    { day: 5, colorName: 'Azul', emoji: '🔵', code: 'blue', desc: 'Pago día 5 de cada mes', btnActive: 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-blue-500/30 hover:border-blue-500/60' },
    { day: 15, colorName: 'Rojo', emoji: '🔴', code: 'red', desc: 'Pago día 15 de cada mes', btnActive: 'bg-red-600 text-white border-red-400 ring-2 ring-red-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-red-500/30 hover:border-red-500/60' },
    { day: 20, colorName: 'Rosa', emoji: '🌸', code: 'pink', desc: 'Pago día 20 de cada mes', btnActive: 'bg-pink-600 text-white border-pink-400 ring-2 ring-pink-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-pink-500/30 hover:border-pink-500/60' },
    { day: 30, colorName: 'Verde', emoji: '🟢', code: 'green', desc: 'Pago día 30 de cada mes', btnActive: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/50', btnInactive: 'bg-neutral-900 text-neutral-300 border-emerald-500/30 hover:border-emerald-500/60' },
  ];

  return (
    <div className="space-y-4 pb-20 px-3 sm:px-4 pt-2">
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
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Portal del Entrenador · Staff Kinetix</span>
          </span>
          <h2 className="text-xl font-bold text-white font-brand">
            Control de Atletas & Pagos
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Exportar datos completos a Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar a Excel</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-500/25 active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Alta por Email</span>
          </button>
        </div>
      </div>

      {/* COACH'S OWN PERSONAL PROGRESS PANEL (Progreso Personal del Coach en Sesión) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-red-950/30 border border-red-900/40 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={activeStaff.avatarUrl}
              alt={activeStaff.name}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-red-500/50 shadow-md"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{activeStaff.name}</h3>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm ${
                  isOwner ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {isOwner ? 'Dueño/a · Control Total' : 'Coach / Profe'}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                {isOwner 
                  ? 'Acceso total a finanzas, logo, membresías y atletas'
                  : 'Acceso a evaluaciones 1RM, Cooper, pesajes y clases'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectUserToInspect(activeStaff)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition-all flex items-center gap-1"
            title="Ver mi panel personal de atleta y entrenador"
          >
            <span>Ver Mi Panel</span>
          </button>
        </div>

        {/* Coach Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Mi Peso Actual</span>
            <span className="text-base font-extrabold text-white font-mono">83.5 kg</span>
            <span className="text-[10px] text-emerald-400 block font-semibold">-1.5kg grasa</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">% Grasa / Músculo</span>
            <span className="text-base font-extrabold text-blue-400 font-mono">9.8%</span>
            <span className="text-[10px] text-blue-300 block font-medium">49.2% masa muscular</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Nivel Cooper</span>
            <span className="text-base font-extrabold text-amber-400 font-mono">Nivel 5</span>
            <span className="text-[10px] text-neutral-400 block font-mono">3,120 m (Élite)</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Sentadilla 1RM</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">165 kg</span>
            <span className="text-[10px] text-neutral-400 block font-mono">Resistencia: 05:48 min</span>
          </div>
        </div>

        {/* Coach Quick Actions for Himself */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/60">
          <button
            onClick={() => onOpenBodyCompForUser ? onOpenBodyCompForUser(activeStaff) : onSelectUserToInspect(activeStaff)}
            className="flex-1 min-w-[140px] py-1.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Registrar Mi Peso / Grasa</span>
          </button>

          <button
            onClick={() => onOpenTestEntryForUser(activeStaff)}
            className="flex-1 min-w-[140px] py-1.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Dumbbell className="w-3.5 h-3.5 text-red-400" />
            <span>Registrar Mi Test Físico</span>
          </button>
        </div>
      </div>

      {/* EQUIPO DE COACHES & DIRECCIÓN KINETIX (Permisos Diferenciados) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span>Equipo Oficial de Coaches Kinetix ({staffMembers.length})</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {isOwner ? '👑 Tienes Control Total' : '🏋️ Permisos Operativos de Profe'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {staffMembers.map(staff => {
            const isStaffOwner = staff.staffRole === 'owner' || staff.id === 'user-staff-leslie' || staff.id === 'user-staff-01';
            return (
              <div 
                key={staff.id}
                className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={staff.avatarUrl}
                    alt={staff.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-neutral-700"
                  />
                  <div className="overflow-hidden">
                    <strong className="text-xs text-white block truncate">{staff.name}</strong>
                    <span className="text-[10px] text-neutral-400 block truncate font-mono">{staff.email}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  isStaffOwner 
                    ? 'bg-red-950 text-red-400 border border-red-800' 
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {isStaffOwner ? 'Dueño/a' : 'Profe'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SYSTEM DE CÓDIGOS DE COLOR DE PAGO (Información & Filtro Rápido) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>Códigos de Color de Pago (Vencimientos Mensuales)</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Filtro por fecha de corte:</span>
        </div>

        {/* Color buttons filter */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <button
            onClick={() => setColorFilter('all')}
            className={`py-2 px-2.5 rounded-xl text-center border font-semibold transition-all flex items-center justify-center gap-1.5 ${
              colorFilter === 'all'
                ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] bg-neutral-900 px-1.5 py-0.2 rounded-full border border-neutral-700">
              {users.filter(u => u.role === 'athlete').length}
            </span>
          </button>

          {OFFICIAL_COLORS.map(c => {
            const count = users.filter(u => u.role === 'athlete' && (u.membership?.billingDayOfMonth || 15) === c.day).length;
            const isSelected = colorFilter === c.day;
            return (
              <button
                key={c.day}
                onClick={() => setColorFilter(c.day as any)}
                className={`py-2 px-2 rounded-xl text-center border font-semibold transition-all flex items-center justify-between gap-1 text-[11px] ${
                  isSelected ? c.btnActive : c.btnInactive
                }`}
                title={c.desc}
              >
                <div className="flex items-center gap-1">
                  <span>{c.emoji}</span>
                  <span>{c.colorName} ({c.day})</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar atleta por nombre o email..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Staff Management Notice: Control Manual vs Automático */}
      <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-neutral-200">Control Manual de Acceso:</strong> Recomendamos el control manual por el Coach con el botón directo de <em>Pausar / Reactivar</em>. Esto te da flexibilidad total para autorizar prórrogas o pagos en efectivo sin que un corte automático interrumpa la app del alumno.
        </p>
      </div>

      {/* Athletes List */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
          Atletas en Lista ({filteredAthletes.length})
        </span>

        {filteredAthletes.map((athlete) => {
          const pg = getPaymentGroup(athlete.membership.billingDayOfMonth);
          const isSuspended = athlete.membership.status === 'suspended';
          const isExpiringSoon = athlete.membership.status === 'expiring_soon';

          return (
            <div
              key={athlete.id}
              className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                isSuspended
                  ? 'bg-red-950/30 border-red-900/50 hover:border-red-700/60'
                  : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={athlete.avatarUrl}
                    alt={athlete.name}
                    className="w-9 h-9 rounded-xl object-cover border border-neutral-800"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{athlete.name}</span>
                      {isSuspended && (
                        <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                          Pausado
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-mono">{athlete.email}</span>
                  </div>
                </div>

                {/* Color Code Badge & Status */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${pg.badgeBg} ${pg.badgeBorder} ${pg.badgeText}`}>
                    <span>{pg.dotEmoji}</span>
                    <span>{pg.colorName} ({athlete.membership.billingDayOfMonth || 15})</span>
                  </span>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isSuspended 
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : isExpiringSoon 
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {isSuspended ? 'Acceso Pausado' : isExpiringSoon ? 'Vence Pronto' : 'Al Día'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-neutral-800/60 gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-300 flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-400">Plan:</span>
                    <strong className="text-white font-semibold">{athlete.membership.planName}</strong>
                    {athlete.membership.hasNutritionPlan && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">
                        🥗 Nutrición
                      </span>
                    )}
                    {athlete.membership.personalCoach && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-medium">
                        🏋️ Coach Jorge
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 flex-wrap">
                    <span>Pago vence:</span>
                    <strong className="text-white font-mono">{athlete.membership.expiryDate}</strong>
                    <span>·</span>
                    <span className={`${pg.badgeText} font-semibold`}>Corte Día {athlete.membership.billingDayOfMonth || 15} de cada mes</span>
                  </div>
                </div>

                {/* Staff Actions for this Athlete */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* Direct 1-Click Access Toggle (Pausar / Reactivar) */}
                  <button
                    onClick={() => handleQuickToggleAccess(athlete)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                      isSuspended
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-red-950/70 hover:bg-red-900 border border-red-800/60 text-red-300'
                    }`}
                    title={isSuspended ? 'Reactivar acceso a la app' : 'Pausar acceso por pago pendiente'}
                  >
                    {isSuspended ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Reactivar</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pausar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAthleteForPayment(athlete);
                      setEditExpiryDate(athlete.membership.expiryDate);
                      setEditStatus(athlete.membership.status);
                      setEditPlan(athlete.membership.planName);
                      setEditBillingDay(athlete.membership.billingDayOfMonth || 15);
                      setEditName(athlete.name);
                      setEditEmail(athlete.email);
                      setEditPhone(athlete.phone);
                      setEditEmergencyName(athlete.emergencyContact?.name || '');
                      setEditEmergencyPhone(athlete.emergencyContact?.phone || '');
                      setModalTab('membership');
                      setShowDeleteConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/70 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    title="Editar fecha de corte, color, plan o datos personales"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => onSelectUserToInspect(athlete)}
                    className="px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium transition-colors"
                  >
                    Perfil
                  </button>

                  <button
                    onClick={() => onOpenTestEntryForUser(athlete)}
                    className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                  >
                    <Dumbbell className="w-3 h-3" />
                    <span>Evaluar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ALTA DE ATLETA POR CORREO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-brand">Alta de Atleta por Email</h3>
                <p className="text-xs text-neutral-400">Asigna plan, código de color de pago y credenciales</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdSuccessMsg ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">¡Invitación Enviada con Éxito!</h4>
                <p className="text-xs text-neutral-400">
                  Se ha generado la cuenta para <strong>{name}</strong> ({email}) con fecha de corte día {billingDay} de cada mes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Nombre Completo del Atleta</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Rodrigo Silva"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Correo Electrónico (Para Login)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rodrigo.silva@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Género</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Estatura (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value) || 170)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Plan Oficial Kinetix</label>
                  <select
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value as KinetixPlanName)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                  >
                    <option value="Kinetix">Kinetix · Funcional & Fuerza</option>
                    <option value="Kinetix con Nutrición">Kinetix con Nutrición · Asesoría Nutricional Incluida</option>
                    <option value="Entrenos Personalizados (Coach Jorge)">Entrenos Personalizados (Coach Jorge) · 1 a 1 + Nutrición</option>
                  </select>
                </div>

                {/* HORARIO / CÓDIGOS DE COLOR DE PAGO INTERACTIVOS */}
                <div>
                  <label className="text-neutral-300 font-medium block mb-1.5 flex items-center justify-between">
                    <span>Horario de Pago · Código de Color:</span>
                    <span className="text-[10px] text-blue-400 font-semibold font-mono">
                      Seleccionado: Día {billingDay} ({getPaymentGroup(billingDay).colorName})
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {OFFICIAL_COLORS.map(c => {
                      const isSelected = billingDay === c.day;
                      return (
                        <button
                          key={c.day}
                          type="button"
                          onClick={() => setBillingDay(c.day)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected ? c.btnActive : c.btnInactive
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{c.emoji}</span>
                            <span>{c.colorName} (Día {c.day})</span>
                          </div>
                          <span className="text-[10px] opacity-80 block mt-0.5">
                            Pago vence día {c.day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-neutral-500 leading-tight">
                    El atleta y el coach verán este código de color y la fecha fija de vencimiento en su app oficial.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-md shadow-red-500/25 active:scale-95"
                  >
                    Generar Alta y Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONTROL TOTAL DEL ATLETA (EDICIÓN MANUAL COMPLETA & PAUSA DE ACCESO) */}
      {selectedAthleteForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-brand flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-500" />
                  <span>Control Total del Atleta</span>
                </h3>
                <p className="text-xs text-neutral-400">Atleta: <strong className="text-white">{selectedAthleteForPayment.name}</strong></p>
              </div>
              <button
                onClick={() => setSelectedAthleteForPayment(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setModalTab('membership')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === 'membership' ? 'bg-neutral-800 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Plan, Corte & Acceso
              </button>
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  modalTab === 'profile' ? 'bg-neutral-800 text-white shadow-sm font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Editar Datos Personales
              </button>
            </div>

            {savePaymentSuccess ? (
              <div className="p-6 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                <div className="font-bold text-base">¡Cambios guardados con éxito!</div>
                <p className="text-xs text-neutral-400">Los datos y permisos del atleta han sido actualizados en la plataforma.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {modalTab === 'membership' && (
                  <>
                    {/* CONTROL MANUAL DE ACCESO (PAUSAR / REACTIVAR) */}
                    <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                      editStatus === 'suspended'
                        ? 'bg-red-950/40 border-red-800'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {editStatus === 'suspended' ? (
                            <ShieldAlert className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="font-bold text-white text-xs">Estado de Acceso a la Plataforma:</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          editStatus === 'suspended'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {editStatus === 'suspended' ? 'ACCESO PAUSADO' : 'ACCESO ACTIVO'}
                        </span>
                      </div>

                      {/* Direct Manual Switch Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditStatus('active')}
                          className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                            editStatus !== 'suspended'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/50'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Acceso Activo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditStatus('suspended')}
                          className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                            editStatus === 'suspended'
                              ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-500/50'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pausar Acceso</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-neutral-400 leading-relaxed pt-1">
                        Si pausas el acceso, el atleta verá en su celular una pantalla clara de <em>"Acceso pausado por el staff"</em> invitándole a ponerse al día con su mensualidad.
                      </p>
                    </div>

                    {/* ASIGNACIÓN DE HORARIO DE PAGO POR CÓDIGO DE COLOR */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-neutral-300 font-medium block">
                          Horario de Pago · Código de Color Asignado:
                        </label>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">
                          Día {editBillingDay} ({getPaymentGroup(editBillingDay).colorName})
                        </span>
                      </div>

                      {/* 4 Official Color Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {OFFICIAL_COLORS.map(c => {
                          const isSelected = editBillingDay === c.day;
                          return (
                            <button
                              key={c.day}
                              type="button"
                              onClick={() => {
                                setEditBillingDay(c.day);
                                const newExpiry = calculateNextExpiryFromDay(c.day);
                                setEditExpiryDate(newExpiry);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected ? c.btnActive : c.btnInactive
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold">
                                <span>{c.emoji}</span>
                                <span>{c.colorName}</span>
                              </div>
                              <div className="text-[10px] opacity-80 mt-0.5">
                                Pago vence día {c.day} de cada mes
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Plan Selection */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Plan Oficial Asignado:</label>
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as KinetixPlanName)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:border-red-500 outline-none"
                      >
                        <option value="Kinetix">Kinetix · Funcional & Fuerza</option>
                        <option value="Kinetix con Nutrición">Kinetix con Nutrición · Asesoría Nutricional Incluida</option>
                        <option value="Entrenos Personalizados (Coach Jorge)">Entrenos Personalizados (Coach Jorge) · 1 a 1 + Nutrición</option>
                      </select>
                    </div>

                    {/* Quick 1-click renewal */}
                    <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <label className="text-neutral-300 font-medium block">Fecha Límite de Pago en Calendario:</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={editExpiryDate}
                          onChange={(e) => setEditExpiryDate(e.target.value)}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-red-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 30);
                            setEditExpiryDate(d.toISOString().slice(0, 10));
                            setEditStatus('active');
                          }}
                          className="py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs transition-all whitespace-nowrap"
                        >
                          +30 Días
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Esta fecha se muestra en el widget permanente de la app del atleta.
                      </p>
                    </div>
                  </>
                )}

                {modalTab === 'profile' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Nombre Completo del Atleta</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Correo Electrónico (Login)</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Teléfono Móvil / WhatsApp</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Ej. +52 55 1234 5678"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-neutral-300 font-medium block mb-1">Contacto Emergencia</label>
                        <input
                          type="text"
                          value={editEmergencyName}
                          onChange={(e) => setEditEmergencyName(e.target.value)}
                          placeholder="Nombre familiar"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-300 font-medium block mb-1">Teléfono Emergencia</label>
                        <input
                          type="tel"
                          value={editEmergencyPhone}
                          onChange={(e) => setEditEmergencyPhone(e.target.value)}
                          placeholder="Teléfono"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-red-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Save and Cancel buttons */}
                <div className="flex gap-2 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setSelectedAthleteForPayment(null)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateUserMembership) {
                        onUpdateUserMembership(
                          selectedAthleteForPayment.id, 
                          editStatus, 
                          editExpiryDate,
                          editPlan,
                          editBillingDay
                        );
                      }
                      if (onUpdateAthleteProfile) {
                        onUpdateAthleteProfile(selectedAthleteForPayment.id, {
                          name: editName,
                          email: editEmail,
                          phone: editPhone,
                          emergencyContact: {
                            ...selectedAthleteForPayment.emergencyContact,
                            name: editEmergencyName,
                            phone: editEmergencyPhone,
                          }
                        });
                      }
                      setSavePaymentSuccess(true);
                      setTimeout(() => {
                        setSavePaymentSuccess(false);
                        setSelectedAthleteForPayment(null);
                      }, 1200);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-500/25 active:scale-95 transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>

                {/* DANGER ZONE: Eliminar Atleta (Solo Dueños: Leslie & Jorge) */}
                <div className="pt-2 border-t border-neutral-800/80">
                  {!isOwner ? (
                    <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>La baja permanente y eliminación de atletas está restringida a los dueños (Leslie & Jorge).</span>
                    </div>
                  ) : !showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2 rounded-xl bg-red-950/30 hover:bg-red-950/70 border border-red-900/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dar de Baja y Eliminar Atleta</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-red-950/90 border border-red-800 text-xs space-y-2 animate-fade-in">
                      <div className="text-red-200 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>¿Confirmas eliminar permanentemente a {selectedAthleteForPayment.name}?</span>
                      </div>
                      <p className="text-[11px] text-red-300/80 leading-relaxed">
                        Esta acción borrará al atleta de la base de datos de Kinetix, junto con sus fotos privadas, pesajes y evaluaciones. No se puede deshacer.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteAthlete) {
                              onDeleteAthlete(selectedAthleteForPayment.id);
                            }
                            setSelectedAthleteForPayment(null);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-md"
                        >
                          Sí, Eliminar Atleta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL: EXPORTAR A EXCEL / CSV */}
      {showExportModal && (
        <ExcelExportModal
          users={users}
          bodyCompRecords={bodyCompRecords}
          evaluations={evaluations}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
