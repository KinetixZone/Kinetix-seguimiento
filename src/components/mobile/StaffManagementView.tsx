import React, { useState } from 'react';
import { UserProfile, PhysicalEvaluationRecord, MembershipStatus, KinetixPlanName } from '../../types';
import { getPaymentGroup, PAYMENT_COLOR_GROUPS } from '../../utils/paymentColorCodes';
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
  Apple,
  Award,
  Trash2,
  AlertTriangle,
  UserCog,
  SlidersHorizontal,
  ArrowLeft,
  Sparkles,
  Filter
} from 'lucide-react';

interface StaffManagementViewProps {
  users: UserProfile[];
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
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  users,
  onSelectUserToInspect,
  onCreateUserByEmail,
  onOpenTestEntryForUser,
  onUpdateUserMembership,
  onDeleteAthlete,
  onUpdateAthleteProfile,
  onBackToDashboard,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const coachUser = users.find(u => u.role === 'staff' || u.id === 'user-staff-01');

  const filteredAthletes = users.filter(u => {
    if (u.role !== 'athlete') return false;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (colorFilter === 'all') return true;
    return (u.membership?.billingDayOfMonth || 15) === colorFilter;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateUserByEmail({
      name,
      email,
      gender,
      heightCm,
      planName,
      billingDayOfMonth: billingDay,
      expiryDate: `2024-05-${billingDay.toString().padStart(2, '0')}`,
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
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-red-400 uppercase tracking-wider">
            Portal del Entrenador · Staff Kinetix
          </span>
          <h2 className="text-xl font-bold text-white font-brand">
            Administración de Atletas
          </h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-500/25 active:scale-95 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Alta por Email</span>
        </button>
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

      {/* Staff Actions Quick Card */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-neutral-200 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
          <span>Privilegios de Staff Habilitados</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Puedes ingresar resultados oficiales de Test Cooper y 1RM para cualquier atleta, así como activar membresías y enviar recordatorios de pago manuales.
        </p>
      </div>

      {/* Athletes List */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
          Atletas Registrados en Kinetix ({filteredAthletes.length})
        </span>

        {filteredAthletes.map((athlete) => (
          <div
            key={athlete.id}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={athlete.avatarUrl}
                  alt={athlete.name}
                  className="w-9 h-9 rounded-xl object-cover border border-neutral-800"
                  onError={(e) => {
                    // Fallback avatar
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{athlete.name}</h4>
                  <span className="text-[10px] text-neutral-400 font-mono">{athlete.email}</span>
                </div>
              </div>

              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                athlete.membership.status === 'active' 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : athlete.membership.status === 'expiring_soon'
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  : 'bg-red-950/80 text-red-400 border border-red-800/60'
              }`}>
                {athlete.membership.status === 'active' ? 'Activo' : athlete.membership.status === 'expiring_soon' ? 'Vence Pronto' : 'Suspendido'}
              </span>
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
                <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <span>Corte:</span>
                  <span className="text-blue-400 font-mono font-bold">Día {athlete.membership.billingDayOfMonth || 15} de cada mes</span>
                  <span>· Vence:</span>
                  <span className="text-neutral-300 font-mono">{athlete.membership.expiryDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  title="Gestionar atleta (Plan, corte, datos y baja)"
                >
                  <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                  <span>Gestionar</span>
                </button>
                <button
                  onClick={() => onSelectUserToInspect(athlete)}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition-colors"
                >
                  Perfil
                </button>
                <button
                  onClick={() => onOpenTestEntryForUser(athlete)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Dumbbell className="w-3 h-3" />
                  <span>Evaluar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ALTA DE ATLETA POR CORREO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-brand">Alta de Atleta por Email</h3>
                <p className="text-xs text-neutral-400">El staff envía invitación de registro y credenciales</p>
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
                  Se ha generado la cuenta para <strong>{name}</strong> ({email}) y se envió el correo con instrucciones para activar su app.
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1">Género</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
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
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Plan Oficial Kinetix</label>
                  <select
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value as KinetixPlanName)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="Kinetix">Kinetix ($79.99 USD / mes) · Funcional & Fuerza</option>
                    <option value="Kinetix con Nutrición">Kinetix con Nutrición ($99.99 USD / mes) · Asesoría Nutricional Incluida</option>
                    <option value="Entrenos Personalizados (Coach Jorge)">Entrenos Personalizados (Coach Jorge) ($149.99 USD / mes) · 1 a 1 + Nutrición</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1">Día Habitual de Pago / Vencimiento</label>
                  <select
                    value={billingDay}
                    onChange={(e) => setBillingDay(parseInt(e.target.value) || 15)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value={15}>Día 15 de cada mes (Estándar Kinetix)</option>
                    <option value={1}>Día 1 de cada mes (Inicio de mes)</option>
                    <option value={30}>Día 30 de cada mes (Fin de mes)</option>
                    <option value={5}>Día 5 de cada mes</option>
                    <option value={10}>Día 10 de cada mes</option>
                    <option value={20}>Día 20 de cada mes</option>
                  </select>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    El atleta verá permanentemente en su app que debe pagar cada día {billingDay} del mes.
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
                    className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold transition-colors shadow-md shadow-emerald-500/20"
                  >
                    Enviar Invitación y Crear
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GESTIÓN DE FECHA DE PAGO Y CONTROL DE ACCESO */}
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
                Plan & Fechas de Corte
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
              <div className="p-4 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" />
                <div className="font-bold">¡Cambios guardados con éxito!</div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {modalTab === 'membership' && (
                  <>
                    {/* Current Status Pill */}
                    <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                      <span className="text-neutral-400">Estado de Acceso:</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                        editStatus === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : editStatus === 'expiring_soon'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {editStatus === 'active' ? 'ACTIVA (Acceso Total)' : editStatus === 'expiring_soon' ? 'VENCE PRONTO' : 'PAUSADA / SUSPENDIDA'}
                      </span>
                    </div>

                    {/* Plan Selection */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Plan Oficial Asignado:</label>
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as KinetixPlanName)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:border-blue-500 outline-none"
                      >
                        <option value="Kinetix">Kinetix · Funcional & Fuerza</option>
                        <option value="Kinetix con Nutrición">Kinetix con Nutrición · Asesoría Nutricional Incluida</option>
                        <option value="Entrenos Personalizados (Coach Jorge)">Entrenos Personalizados (Coach Jorge) · 1 a 1 + Nutrición</option>
                      </select>
                      {editPlan !== 'Kinetix' && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-400">
                          <span>✓ Incluye Plan Nutricional</span>
                          {editPlan === 'Entrenos Personalizados (Coach Jorge)' && (
                            <span className="text-red-400 font-semibold">· Entrenador: Coach Jorge</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Billing Day Shortcut Buttons */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1.5">
                        Día Habitual de Corte / Fecha de Pago:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditBillingDay(15);
                            const now = new Date();
                            const nextMonth = now.getDate() >= 15 ? now.getMonth() + 1 : now.getMonth();
                            const d = new Date(now.getFullYear(), nextMonth, 15);
                            setEditExpiryDate(d.toISOString().slice(0, 10));
                            setEditStatus('active');
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                            editBillingDay === 15 ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          Día 15 de mes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditBillingDay(1);
                            const now = new Date();
                            const nextMonth = now.getDate() >= 1 ? now.getMonth() + 1 : now.getMonth();
                            const d = new Date(now.getFullYear(), nextMonth, 1);
                            setEditExpiryDate(d.toISOString().slice(0, 10));
                            setEditStatus('active');
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                            editBillingDay === 1 ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          Día 1 de mes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditBillingDay(30);
                            const now = new Date();
                            const nextMonth = now.getDate() >= 30 ? now.getMonth() + 1 : now.getMonth();
                            const d = new Date(now.getFullYear(), nextMonth, 30);
                            setEditExpiryDate(d.toISOString().slice(0, 10));
                            setEditStatus('active');
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                            editBillingDay === 30 ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          Día 30 (Fin mes)
                        </button>
                      </div>
                    </div>

                    {/* Quick 1-click renewal buttons */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1.5">Acciones Rápidas del Coach:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 30);
                            setEditExpiryDate(d.toISOString().slice(0, 10));
                            setEditStatus('active');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-center transition-all"
                        >
                          +30 Días (Renovación)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditStatus(editStatus === 'suspended' ? 'active' : 'suspended');
                          }}
                          className={`py-2.5 px-3 rounded-xl border font-semibold text-center transition-all ${
                            editStatus === 'suspended'
                              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-red-600/20 border-red-500/40 text-red-300'
                          }`}
                        >
                          {editStatus === 'suspended' ? 'Reactivar Acceso' : 'Pausar / Suspender'}
                        </button>
                      </div>
                    </div>

                    {/* Custom Date Input */}
                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">
                        O Modificar Fecha Límite Exacta en Calendario:
                      </label>
                      <input
                        type="date"
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 outline-none"
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Esta es la fecha que el atleta verá en su pantalla de inicio como límite de pago.
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
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Correo Electrónico (Login)</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-300 font-medium block mb-1">Teléfono Móvil / WhatsApp</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-neutral-300 font-medium block mb-1">Contacto Emergencia</label>
                        <input
                          type="text"
                          value={editEmergencyName}
                          onChange={(e) => setEditEmergencyName(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-300 font-medium block mb-1">Teléfono Emergencia</label>
                        <input
                          type="tel"
                          value={editEmergencyPhone}
                          onChange={(e) => setEditEmergencyPhone(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:border-blue-500 outline-none"
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
                    className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-colors"
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
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>

                {/* DANGER ZONE: Eliminar Atleta */}
                <div className="pt-2 border-t border-neutral-800/80">
                  {!showDeleteConfirm ? (
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
    </div>
  );
};
