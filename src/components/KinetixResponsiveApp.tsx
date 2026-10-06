import React, { useState } from 'react';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  PushNotificationSimulation,
  MembershipStatus,
  KinetixPlanName
} from '../types';
import { AthleteDashboard } from './mobile/AthleteDashboard';
import { BodyCompositionView } from './mobile/BodyCompositionView';
import { PhysicalTestsView } from './mobile/PhysicalTestsView';
import { MembershipView } from './mobile/MembershipView';
import { StaffManagementView } from './mobile/StaffManagementView';
import { ProgressReportModal } from './mobile/ProgressReportModal';
import { ShareableStoryModal } from './mobile/ShareableStoryModal';
import { SendNotificationModal } from './common/SendNotificationModal';
import { 
  Home, 
  Activity, 
  Dumbbell, 
  CreditCard, 
  ShieldCheck, 
  Instagram, 
  Bell, 
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  Scale,
  Send,
  UserCheck
} from 'lucide-react';

interface KinetixResponsiveAppProps {
  currentUser: UserProfile;
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
  onSimulatePushNotification: (title: string, body: string, targetUserId?: string) => void;
  onUpdateUserMembership?: (
    userId: string, 
    status: MembershipStatus, 
    newExpiryDate?: string, 
    newPlanName?: KinetixPlanName, 
    billingDayOfMonth?: number
  ) => void;
  onDeleteAthlete?: (userId: string) => void;
  onUpdateAthleteProfile?: (userId: string, updates: Partial<UserProfile>) => void;
  onSwitchUser: (user: UserProfile) => void;
}

export const KinetixResponsiveApp: React.FC<KinetixResponsiveAppProps> = ({
  currentUser,
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
  onSwitchUser,
}) => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'body' | 'tests' | 'membership' | 'staff'>('dashboard');
  const [tabHistory, setTabHistory] = useState<('dashboard' | 'body' | 'tests' | 'membership' | 'staff')[]>(['dashboard']);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showShareStoryModal, setShowShareStoryModal] = useState<boolean>(false);
  const [showSendNotificationModal, setShowSendNotificationModal] = useState<boolean>(false);
  const [inspectedAthlete, setInspectedAthlete] = useState<UserProfile | null>(null);

  const isStaff = currentUser.role === 'staff';
  const effectiveUser = inspectedAthlete || currentUser;

  const userBodyComps = bodyCompRecords.filter(b => b.userId === effectiveUser.id);
  const userEvals = evaluations.filter(e => e.userId === effectiveUser.id);
  const latestBodyComp = userBodyComps[userBodyComps.length - 1] || bodyCompRecords[0];
  const latestEval = userEvals[userEvals.length - 1] || evaluations[0];

  // Navigation handlers with History Stack
  const handleNavigateTab = (tab: 'dashboard' | 'body' | 'tests' | 'membership' | 'staff') => {
    if (tab === currentTab) return;
    setTabHistory(prev => [...prev, tab]);
    setCurrentTab(tab);
  };

  const handleGoBack = () => {
    if (inspectedAthlete) {
      if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
        return;
      } else {
        // Exit inspection back to Staff athletes list
        setInspectedAthlete(null);
        setCurrentTab('staff');
        return;
      }
    }

    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // remove current active
      const previous = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory);
      setCurrentTab(previous);
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleGoHome = () => {
    if (inspectedAthlete) {
      setInspectedAthlete(null);
    }
    setCurrentTab('dashboard');
    setTabHistory(['dashboard']);
  };

  const handleSelectUserToInspect = (user: UserProfile) => {
    setInspectedAthlete(user);
    setTabHistory(prev => [...prev, 'dashboard']);
    setCurrentTab('dashboard');
  };

  const handleOpenEvaluationForUser = (user: UserProfile) => {
    setInspectedAthlete(user);
    setTabHistory(prev => [...prev, 'tests']);
    setCurrentTab('tests');
  };

  const handleOpenBodyCompForUser = (user: UserProfile) => {
    setInspectedAthlete(user);
    setTabHistory(prev => [...prev, 'body']);
    setCurrentTab('body');
  };

  const getTabTitle = (tab: 'dashboard' | 'body' | 'tests' | 'membership' | 'staff') => {
    switch (tab) {
      case 'dashboard': return 'Inicio · Rendimiento';
      case 'body': return 'Composición Corporal & IMC';
      case 'tests': return 'Pruebas Físicas & Fuerza 1RM';
      case 'membership': return 'Membresía & Pagos';
      case 'staff': return 'Panel del Entrenador (Staff)';
      default: return 'Inicio';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-61px)] flex flex-col bg-neutral-950 text-neutral-100">
      {/* Top Banner if Coach is inspecting an Athlete */}
      {inspectedAthlete && (
        <div className="bg-red-950/90 border-b border-red-800/80 px-4 py-2 flex items-center justify-between text-xs animate-fade-in sticky top-0 z-40">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>
              Inspeccionando expediente de: <strong>{inspectedAthlete.name}</strong> ({inspectedAthlete.membership.planName})
            </span>
          </div>
          <button
            onClick={() => {
              setInspectedAthlete(null);
              setCurrentTab('staff');
            }}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold transition-colors flex items-center gap-1 shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3 h-3 text-red-400" />
            <span>Volver a Lista de Atletas</span>
          </button>
        </div>
      )}

      {/* DESKTOP / TABLET PRIMARY NAVIGATION TABS (Visible on md and up) */}
      <div className="hidden md:block border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => handleNavigateTab('body')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                currentTab === 'body'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Composición Corporal</span>
            </button>

            <button
              onClick={() => handleNavigateTab('tests')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                currentTab === 'tests'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Pruebas Físicas</span>
            </button>

            <button
              onClick={() => handleNavigateTab('membership')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                currentTab === 'membership'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Membresía & Pagos</span>
            </button>

            {isStaff && (
              <button
                onClick={() => handleNavigateTab('staff')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                  currentTab === 'staff'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                    : 'text-red-400 hover:text-white hover:bg-red-950/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel del Entrenador (Staff)</span>
              </button>
            )}
          </nav>

          {/* Quick Actions for Coach & Athlete */}
          <div className="flex items-center gap-2">
            {isStaff && (
              <button
                onClick={() => setShowSendNotificationModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Emitir avisos y alertas a los alumnos"
              >
                <Bell className="w-3.5 h-3.5 text-blue-400" />
                <span>Mandar Avisos</span>
              </button>
            )}

            <button
              onClick={() => setShowShareStoryModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 hover:opacity-90 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Crear Historia</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Ficha General</span>
            </button>
          </div>
        </div>
      </div>

      {/* UNIVERSAL BREADCRUMB & BACK / HOME NAVIGATION BAR (Visible on mobile & desktop) */}
      <div className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-6 py-2 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Volver a pantalla anterior + Ir al Inicio + Breadcrumb */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleGoBack}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/80 hover:border-blue-500/50 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Volver a la pantalla anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Volver</span>
            </button>

            <button
              onClick={handleGoHome}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                currentTab === 'dashboard' && !inspectedAthlete
                  ? 'bg-blue-600/25 border-blue-500/60 text-blue-300 font-bold'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700/80 hover:text-white'
              }`}
              title="Ir a la pantalla principal (Inicio)"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Inicio</span>
            </button>

            {/* Breadcrumb Display */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 ml-1 overflow-hidden">
              <span className="text-neutral-600 hidden sm:inline">/</span>
              <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-xs">
                {inspectedAthlete ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <span className="hidden sm:inline">Expediente:</span>
                    <strong className="text-white">{inspectedAthlete.name}</strong>
                    <span className="text-[10px] text-neutral-400 font-normal">({getTabTitle(currentTab)})</span>
                  </span>
                ) : (
                  getTabTitle(currentTab)
                )}
              </span>
            </div>
          </div>

          {/* Right: Coach Mandar Avisos & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isStaff && (
              <button
                onClick={() => setShowSendNotificationModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95 transition-all"
                title="Emitir avisos y alertas a los alumnos"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mandar Avisos</span>
              </button>
            )}

            <button
              onClick={() => setShowShareStoryModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 hover:opacity-90 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Crear historia para Instagram o WhatsApp"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs flex items-center gap-1.5 transition-all"
              title="Ver ficha técnica de progreso"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Ficha</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto pb-20 md:pb-8 pt-2">
        {currentTab === 'dashboard' && (
          <AthleteDashboard
            currentUser={effectiveUser}
            latestBodyComp={latestBodyComp}
            latestEval={latestEval}
            onNavigateTab={(tab) => handleNavigateTab(tab)}
            onOpenReport={() => setShowReportModal(true)}
            onOpenShareStory={() => setShowShareStoryModal(true)}
          />
        )}

        {currentTab === 'body' && (
          <BodyCompositionView
            currentUser={effectiveUser}
            records={userBodyComps}
            onAddRecord={onAddBodyCompRecord}
            onDeleteRecord={onDeleteBodyCompRecord}
            onUpdateRecord={onUpdateBodyCompRecord}
            onBackToDashboard={handleGoHome}
          />
        )}

        {currentTab === 'tests' && (
          <PhysicalTestsView
            currentUser={effectiveUser}
            evaluations={userEvals}
            onAddEvaluation={onAddEvaluation}
            onDeleteEvaluation={onDeleteEvaluation}
            onUpdateEvaluation={onUpdateEvaluation}
            onBackToDashboard={handleGoHome}
          />
        )}

        {currentTab === 'membership' && (
          <MembershipView
            currentUser={effectiveUser}
            onUpdateMembershipStatus={onUpdateMembershipStatus}
            onSimulatePushNotification={onSimulatePushNotification}
            onBackToDashboard={handleGoHome}
          />
        )}

        {currentTab === 'staff' && (
          <StaffManagementView
            currentUser={effectiveUser}
            users={users}
            bodyCompRecords={bodyCompRecords}
            evaluations={evaluations}
            onSelectUserToInspect={handleSelectUserToInspect}
            onCreateUserByEmail={onCreateUserByEmail}
            onOpenTestEntryForUser={handleOpenEvaluationForUser}
            onOpenBodyCompForUser={handleOpenBodyCompForUser}
            onOpenSendNotification={() => setShowSendNotificationModal(true)}
            onUpdateUserMembership={onUpdateUserMembership}
            onDeleteAthlete={onDeleteAthlete}
            onUpdateAthleteProfile={onUpdateAthleteProfile}
            onBackToDashboard={handleGoHome}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on mobile screens < md) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800/80 grid items-center px-1 z-40 transition-all"
        style={{
          gridTemplateColumns: isStaff ? 'repeat(5, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))'
        }}
      >
        <button
          onClick={() => handleNavigateTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1">Inicio</span>
        </button>

        <button
          onClick={() => handleNavigateTab('body')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'body' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1">Cuerpo</span>
        </button>

        <button
          onClick={() => handleNavigateTab('tests')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'tests' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1">Pruebas</span>
        </button>

        <button
          onClick={() => handleNavigateTab('membership')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'membership' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-tight mt-1">{isStaff ? 'Cuenta' : 'Pagos'}</span>
        </button>

        {isStaff && (
          <button
            onClick={() => handleNavigateTab('staff')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'staff' ? 'text-red-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span className="text-[9px] font-bold tracking-tight mt-1 text-red-400">Staff</span>
          </button>
        )}
      </div>

      {/* MODALS */}
      {showReportModal && (
        <ProgressReportModal
          athlete={effectiveUser}
          latestBodyComp={latestBodyComp}
          latestEval={latestEval}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showShareStoryModal && (
        <ShareableStoryModal
          athlete={effectiveUser}
          latestBodyComp={latestBodyComp}
          latestEval={latestEval}
          onClose={() => setShowShareStoryModal(false)}
        />
      )}

      {showSendNotificationModal && (
        <SendNotificationModal
          users={users}
          onSendNotification={(title, body, targetUserId) => {
            onSimulatePushNotification(title, body, targetUserId);
          }}
          onClose={() => setShowSendNotificationModal(false)}
        />
      )}
    </div>
  );
};
