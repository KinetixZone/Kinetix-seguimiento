import React, { useState } from 'react';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  PushNotificationSimulation,
  MembershipStatus,
  KinetixPlanName
} from '../../types';
import { AthleteDashboard } from '../mobile/AthleteDashboard';
import { BodyCompositionView } from '../mobile/BodyCompositionView';
import { PhysicalTestsView } from '../mobile/PhysicalTestsView';
import { MembershipView } from '../mobile/MembershipView';
import { StaffManagementView } from '../mobile/StaffManagementView';
import { ProgressReportModal } from '../mobile/ProgressReportModal';
import { ShareableStoryModal } from '../mobile/ShareableStoryModal';
import { 
  Home, 
  Activity, 
  Dumbbell, 
  CreditCard, 
  Users, 
  Bell, 
  Globe, 
  CheckCircle2, 
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Award,
  Instagram,
  Share2,
  ArrowLeft
} from 'lucide-react';

interface KinetixWebPortalProps {
  users: UserProfile[];
  bodyCompRecords: BodyCompositionRecord[];
  evaluations: PhysicalEvaluationRecord[];
  notifications: PushNotificationSimulation[];
  onAddBodyCompRecord: (record: Omit<BodyCompositionRecord, 'id'>) => void;
  onDeleteBodyCompRecord?: (recordId: string) => void;
  onUpdateBodyCompRecord?: (recordId: string, updates: Partial<BodyCompositionRecord>) => void;
  onAddEvaluation: (evalRec: Omit<PhysicalEvaluationRecord, 'id'>) => void;
  onDeleteEvaluation?: (evalId: string) => void;
  onUpdateEvaluation?: (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => void;
  onUpdateMembershipStatus: (status: MembershipStatus, daysUntilExpiry: number) => void;
  onCreateUserByEmail: (newUser: { 
    name: string; 
    email: string; 
    planName: KinetixPlanName; 
    gender: 'male' | 'female'; 
    heightCm: number;
    billingDayOfMonth?: number;
    expiryDate?: string;
  }) => void;
  onOpenNotifications: () => void;
  onSimulatePushNotification: (title: string, body: string) => void;
  onUpdateUserMembership?: (
    userId: string, 
    status: MembershipStatus, 
    newExpiryDate?: string, 
    newPlanName?: KinetixPlanName, 
    billingDayOfMonth?: number
  ) => void;
  onDeleteAthlete?: (userId: string) => void;
  onUpdateAthleteProfile?: (userId: string, updates: Partial<UserProfile>) => void;
}

export const KinetixWebPortal: React.FC<KinetixWebPortalProps> = ({
  users,
  bodyCompRecords,
  evaluations,
  notifications,
  onAddBodyCompRecord,
  onDeleteBodyCompRecord,
  onUpdateBodyCompRecord,
  onAddEvaluation,
  onDeleteEvaluation,
  onUpdateEvaluation,
  onUpdateMembershipStatus,
  onCreateUserByEmail,
  onOpenNotifications,
  onSimulatePushNotification,
  onUpdateUserMembership,
  onDeleteAthlete,
  onUpdateAthleteProfile,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('user-001');
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'body' | 'tests' | 'membership' | 'staff'>('dashboard');
  const [isInspectingAthlete, setIsInspectingAthlete] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showShareStoryModal, setShowShareStoryModal] = useState<boolean>(false);

  const currentUser = users.find(u => u.id === selectedUserId) || users[0];
  const isStaff = currentUser.role === 'staff';
  const userBodyComps = bodyCompRecords.filter(b => b.userId === currentUser.id);
  const userEvals = evaluations.filter(e => e.userId === currentUser.id);
  const latestBodyComp = userBodyComps[userBodyComps.length - 1] || bodyCompRecords[0];
  const latestEval = userEvals[userEvals.length - 1] || evaluations[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Kinetix Executive Management Portal Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>PORTAL DE GESTIÓN & RENDIMIENTO FÍSICO</span>
            <span>·</span>
            <span className="text-red-400 font-bold">KINETIX FUNCTIONAL ZONE</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-brand flex items-center gap-2.5">
            <span>Panel Oficial del Atleta & Entrenador</span>
            <span className="text-xs font-medium text-neutral-300 bg-neutral-950 px-2.5 py-0.5 rounded-full border border-neutral-800">
              {currentUser.name} ({currentUser.membership.planName})
            </span>
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Supervisa en tiempo real el progreso de fuerza 1RM, nivel cardiorrespiratorio en Cooper, evaluaciones de resistencia y estados de pago codificados por color.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowShareStoryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 hover:opacity-90 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
            title="Crear tarjeta historia para Instagram o WhatsApp"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Crear Historia</span>
          </button>

          <button
            onClick={() => {
              if (isStaff) {
                onSimulatePushNotification(
                  'Aviso del Coach Kinetix',
                  'Atención atletas: Mañana tendremos entrenamiento especial de técnica y fuerza funcional. ¡No falten!'
                );
              } else {
                onSimulatePushNotification(
                  'Recordatorio de Pago Kinetix',
                  `Hola ${currentUser.name.split(' ')[0]}, tu membresía vence pronto. Por favor contacta al gimnasio para renovar tu membresía.`
                );
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs border border-neutral-700/80 transition-colors flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-blue-400" />
            <span>{isStaff ? 'Simular Aviso General' : 'Simular Aviso'}</span>
          </button>
        </div>
      </div>

      {/* Main Web Portal Dashboard Layout: Sidebar + Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Web Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Active User Card & Switcher */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Usuario en sesión:</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                currentUser.role === 'staff' ? 'bg-red-950 text-red-400 border border-red-800/60' : 'bg-blue-950 text-blue-400 border border-blue-800/60'
              }`}>
                {currentUser.role === 'staff' ? 'Staff / Coach' : 'Atleta'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-blue-500/40"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                <span className="text-[11px] text-neutral-400 font-mono truncate block">{currentUser.email}</span>
              </div>
            </div>

            {/* Quick User Dropdown */}
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                const u = users.find(x => x.id === e.target.value);
                if (u?.role === 'staff') {
                  setCurrentSection('staff');
                } else {
                  setCurrentSection('dashboard');
                }
              }}
              className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded-xl p-2 outline-none focus:border-blue-500 font-medium"
            >
              <option value="user-001">Atleta: Juan Pérez (75kg · 45% músculo)</option>
              <option value="user-002">Atleta: María García (15 Marzo · Cooper 2400m)</option>
              <option value="user-003">Atleta: Sarah Connor (Recordatorio de Pago)</option>
              <option value="user-staff-01">Staff: Coach Roberto Sánchez</option>
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1 text-xs">
            <button
              onClick={() => setCurrentSection('dashboard')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                currentSection === 'dashboard'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" />
                <span>Dashboard General</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentSection('body')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                currentSection === 'body'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Composición Corporal & IMC</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentSection('tests')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                currentSection === 'tests'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Dumbbell className="w-4 h-4" />
                <span>Test Cooper (Niveles) & 1RM</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentSection('membership')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                currentSection === 'membership'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Membresías & Pagos</span>
              </div>
              <span className={`text-[10px] px-2 py-0.2 rounded font-mono ${
                isStaff ? 'text-emerald-400 font-bold' : currentUser.membership.status === 'active' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isStaff ? 'Sin Corte' : currentUser.membership.status === 'active' ? 'Al día' : 'Pendiente'}
              </span>
            </button>

            <button
              onClick={() => setCurrentSection('staff')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                currentSection === 'staff'
                  ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Panel de Staff (Altas & Evaluaciones)</span>
              </div>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">Coach</span>
            </button>
          </nav>

          {/* In-Page Notification Bell Trigger */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Bell className="w-4 h-4 text-blue-400" />
              <span>Buzón en Página</span>
            </div>
            <button
              onClick={onOpenNotifications}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>{unreadCount} Avisos</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
          </div>
        </aside>

        {/* Right Main Web Content Canvas */}
        <main className="lg:col-span-9 bg-neutral-900/40 border border-neutral-800 rounded-3xl p-4 sm:p-6 min-h-[600px]">
          {isInspectingAthlete && (
            <div className="bg-red-950/80 border border-red-800/80 rounded-2xl p-3 mb-5 flex items-center justify-between shadow-lg shadow-red-950/40 animate-fade-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsInspectingAthlete(false);
                    setCurrentSection('staff');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Volver a Lista de Atletas (Staff)</span>
                </button>
                <div className="text-xs text-neutral-300">
                  Inspeccionando atleta: <strong className="text-white font-bold">{currentUser.name}</strong> · Plan: <span className="text-red-300 font-medium">{currentUser.membership.planName}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsInspectingAthlete(false);
                  setCurrentSection('staff');
                }}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Cerrar vista de atleta
              </button>
            </div>
          )}

          {currentSection === 'dashboard' && (
            <AthleteDashboard
              currentUser={currentUser}
              latestBodyComp={latestBodyComp}
              latestEval={latestEval}
              onNavigateTab={(tab) => setCurrentSection(tab as any)}
              onOpenReport={() => setShowReportModal(true)}
              onOpenShareStory={() => setShowShareStoryModal(true)}
            />
          )}

          {currentSection === 'body' && (
            <BodyCompositionView
              currentUser={currentUser}
              records={userBodyComps}
              onAddRecord={onAddBodyCompRecord}
              onDeleteRecord={onDeleteBodyCompRecord}
              onUpdateRecord={onUpdateBodyCompRecord}
              onBackToDashboard={() => setCurrentSection('dashboard')}
            />
          )}

          {currentSection === 'tests' && (
            <PhysicalTestsView
              currentUser={currentUser}
              evaluations={userEvals}
              onAddEvaluation={onAddEvaluation}
              onDeleteEvaluation={onDeleteEvaluation}
              onUpdateEvaluation={onUpdateEvaluation}
              onBackToDashboard={() => setCurrentSection('dashboard')}
            />
          )}

          {currentSection === 'membership' && (
            <MembershipView
              currentUser={currentUser}
              onUpdateMembershipStatus={onUpdateMembershipStatus}
              onSimulatePushNotification={onSimulatePushNotification}
              onBackToDashboard={() => setCurrentSection('dashboard')}
            />
          )}

          {currentSection === 'staff' && (
            <StaffManagementView
              users={users}
              onSelectUserToInspect={(u) => {
                setSelectedUserId(u.id);
                setIsInspectingAthlete(true);
                setCurrentSection('dashboard');
              }}
              onCreateUserByEmail={onCreateUserByEmail}
              onOpenTestEntryForUser={(u) => {
                setSelectedUserId(u.id);
                setIsInspectingAthlete(true);
                setCurrentSection('tests');
              }}
              onOpenBodyCompForUser={(u) => {
                setSelectedUserId(u.id);
                setIsInspectingAthlete(true);
                setCurrentSection('body');
              }}
              onUpdateUserMembership={onUpdateUserMembership}
              onDeleteAthlete={onDeleteAthlete}
              onUpdateAthleteProfile={onUpdateAthleteProfile}
              onBackToDashboard={() => setCurrentSection('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Progress Report Modal */}
      {showReportModal && (
        <ProgressReportModal
          athlete={currentUser}
          latestBodyComp={latestBodyComp}
          latestEval={latestEval}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Shareable Story Modal (Instagram / WhatsApp) */}
      {showShareStoryModal && (
        <ShareableStoryModal
          athlete={currentUser}
          latestBodyComp={latestBodyComp}
          latestEval={latestEval}
          onClose={() => setShowShareStoryModal(false)}
        />
      )}
    </div>
  );
};
