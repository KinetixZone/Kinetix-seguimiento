import React, { useState } from 'react';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  PushNotificationSimulation,
  MembershipStatus,
  KinetixPlanName,
  PrivacyConsentRecord
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
  UserCheck,
  Lock,
  FileText,
  Printer
} from 'lucide-react';
import { 
  OFFICIAL_PRIVACY_NOTICE_DOCUMENT, 
  CURRENT_PRIVACY_NOTICE_VERSION 
} from '../data/privacyNoticeContent';

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
  onCreateStaffMember?: (staffData: {
    name: string;
    email: string;
    password: string;
    staffRole: 'owner' | 'coach';
  }) => void;
  onDeleteStaffMember?: (staffId: string) => void;
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
  onClearDemoAthletes?: () => void;
  onRestoreDemoAthletes?: () => void;
  onSwitchUser: (user: UserProfile) => void;
  onOpenPrivacyPolicy?: () => void;
  consentHistory?: Record<string, PrivacyConsentRecord[]>;
  gymLogoUrl?: string | null;
  onSendBatchNotification?: (title: string, body: string, targetUserIds: string[]) => void;
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
  onCreateStaffMember,
  onDeleteStaffMember,
  onOpenNotifications,
  onSimulatePushNotification,
  onUpdateUserMembership,
  onDeleteAthlete,
  onUpdateAthleteProfile,
  onClearDemoAthletes,
  onRestoreDemoAthletes,
  onSwitchUser,
  onOpenPrivacyPolicy,
  consentHistory,
  gymLogoUrl,
  onSendBatchNotification,
}) => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'body' | 'tests' | 'membership' | 'staff' | 'privacy'>('dashboard');
  const [tabHistory, setTabHistory] = useState<('dashboard' | 'body' | 'tests' | 'membership' | 'staff' | 'privacy')[]>(['dashboard']);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showShareStoryModal, setShowShareStoryModal] = useState<boolean>(false);
  const [showSendNotificationModal, setShowSendNotificationModal] = useState<boolean>(false);
  const [inspectedAthlete, setInspectedAthlete] = useState<UserProfile | null>(null);
  const [autoOpenEvalModal, setAutoOpenEvalModal] = useState<boolean>(false);
  const [autoOpenBodyModal, setAutoOpenBodyModal] = useState<boolean>(false);

  const isStaff = currentUser.role === 'staff';
  const effectiveUser = inspectedAthlete || currentUser;

  const userBodyComps = bodyCompRecords.filter(b => b.userId === effectiveUser.id);
  const userEvals = evaluations.filter(e => e.userId === effectiveUser.id);
  const latestBodyComp = userBodyComps.length > 0 ? userBodyComps[userBodyComps.length - 1] : null;
  const latestEval = userEvals.length > 0 ? userEvals[userEvals.length - 1] : undefined;

  // Navigation handlers with History Stack
  const handleNavigateTab = (tab: 'dashboard' | 'body' | 'tests' | 'membership' | 'staff' | 'privacy') => {
    if (tab === currentTab) return;
    if (tab === 'staff' && !isStaff) return; // Strict role-based guard
    if (tab !== 'tests') setAutoOpenEvalModal(false);
    if (tab !== 'body') setAutoOpenBodyModal(false);
    setTabHistory(prev => [...prev, tab]);
    setCurrentTab(tab);
  };

  const handleGoBack = () => {
    setAutoOpenEvalModal(false);
    setAutoOpenBodyModal(false);
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
    setAutoOpenEvalModal(false);
    setAutoOpenBodyModal(false);
    if (inspectedAthlete) {
      setInspectedAthlete(null);
    }
    setCurrentTab('dashboard');
    setTabHistory(['dashboard']);
  };

  const handleSelectUserToInspect = (user: UserProfile) => {
    setInspectedAthlete(user);
    setAutoOpenEvalModal(false);
    setAutoOpenBodyModal(false);
    setTabHistory(prev => [...prev, 'dashboard']);
    setCurrentTab('dashboard');
  };

  const handleOpenEvaluationForUser = (user: UserProfile) => {
    setInspectedAthlete(user);
    setAutoOpenEvalModal(true);
    setAutoOpenBodyModal(false);
    setTabHistory(prev => [...prev, 'tests']);
    setCurrentTab('tests');
  };

  const handleOpenBodyCompForUser = (user: UserProfile) => {
    setInspectedAthlete(user);
    setAutoOpenBodyModal(true);
    setAutoOpenEvalModal(false);
    setTabHistory(prev => [...prev, 'body']);
    setCurrentTab('body');
  };

  const handleOpenReportForUser = (user: UserProfile) => {
    setInspectedAthlete(user);
    setShowReportModal(true);
  };

  const getTabTitle = (tab: 'dashboard' | 'body' | 'tests' | 'membership' | 'staff' | 'privacy') => {
    switch (tab) {
      case 'dashboard': return 'Inicio · Rendimiento';
      case 'body': return 'Composición Corporal & IMC';
      case 'tests': return 'Pruebas Físicas & Fuerza 1RM';
      case 'membership': return 'Membresía & Pagos';
      case 'staff': return 'Panel del Entrenador (Staff)';
      case 'privacy': return 'Aviso de Privacidad Integral';
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

            {/* Desktop Privacy Tab */}
            <button
              onClick={() => handleNavigateTab('privacy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                currentTab === 'privacy'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Aviso de Privacidad</span>
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

      {/* MAIN VIEW CONTENT CONTAINER (Con espacio inferior amplio para la barra móvil y safe-area) */}
      <main className="flex-1 max-w-6xl w-full mx-auto pb-28 sm:pb-24 md:pb-8 pt-2">
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
            loggedStaffUser={currentUser}
            isStaffUser={isStaff}
            initialOpenAddModal={autoOpenBodyModal}
            allAthletes={users.filter(u => u.role === 'athlete')}
            onSelectNextAthlete={(next) => setInspectedAthlete(next)}
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
            loggedStaffUser={currentUser}
            isStaffUser={isStaff}
            initialOpenAddModal={autoOpenEvalModal}
            allAthletes={users.filter(u => u.role === 'athlete')}
            onSelectNextAthlete={(next) => setInspectedAthlete(next)}
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

        {currentTab === 'staff' && isStaff && (
          <StaffManagementView
            currentUser={currentUser}
            users={users}
            bodyCompRecords={bodyCompRecords}
            evaluations={evaluations}
            onSelectUserToInspect={handleSelectUserToInspect}
            onCreateUserByEmail={onCreateUserByEmail}
            onCreateStaffMember={onCreateStaffMember}
            onDeleteStaffMember={onDeleteStaffMember}
            onOpenTestEntryForUser={handleOpenEvaluationForUser}
            onOpenBodyCompForUser={handleOpenBodyCompForUser}
            onOpenReportForUser={handleOpenReportForUser}
            onOpenSendNotification={() => setShowSendNotificationModal(true)}
            onSendBatchNotification={onSendBatchNotification}
            onUpdateUserMembership={onUpdateUserMembership}
            onDeleteAthlete={onDeleteAthlete}
            onUpdateAthleteProfile={onUpdateAthleteProfile}
            onClearDemoAthletes={onClearDemoAthletes}
            onRestoreDemoAthletes={onRestoreDemoAthletes}
            onBackToDashboard={handleGoHome}
            onSwitchUser={onSwitchUser}
            consentHistory={consentHistory}
          />
        )}

        {/* VIEW 6: AVISO DE PRIVACIDAD INTEGRAL DIGITAL (Permanent Tab) */}
        {currentTab === 'privacy' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-950/70 via-neutral-900 to-red-950/40 rounded-3xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      LFPDPPP · México
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {CURRENT_PRIVACY_NOTICE_VERSION}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-brand mt-1">
                    Aviso de Privacidad Integral
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Imprimir versión con formato físico de firma"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Imprimir Formato Físico</span>
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-5 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-6 text-xs text-neutral-300 leading-relaxed shadow-xl">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2 font-mono text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                  <span className="font-bold text-white">KINETIX FUNCTIONAL ZONE</span>
                  <span className="text-blue-400">Versión Oficial: {CURRENT_PRIVACY_NOTICE_VERSION}</span>
                </div>
                <div className="text-neutral-400">
                  Genovevo Rivas 3-81, San Felipe de Jesús Nte., Gustavo A. Madero, C.P. 07510, CDMX.
                </div>
                <div className="text-[10px] text-neutral-500">
                  Contacto de Privacidad y Ejercicio ARCO: <strong className="text-blue-400">kinetix.zone@gmail.com</strong>
                </div>
              </div>

              <div className="space-y-5 text-xs font-sans text-neutral-300 leading-relaxed">
                {OFFICIAL_PRIVACY_NOTICE_DOCUMENT.sections.map((section) => (
                  <div key={section.id} className="space-y-2 p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/60">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-1.5">
                      {section.number && (
                        <span className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                          {section.number}
                        </span>
                      )}
                      <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                        {section.title}
                      </h3>
                    </div>

                    {section.paragraphs?.map((p, idx) => (
                      <p key={idx} className="text-neutral-300 text-xs leading-relaxed">{p}</p>
                    ))}

                    {section.subsections?.map((sub, sIdx) => (
                      <div key={sIdx} className="pl-2 border-l-2 border-blue-500/40 space-y-1 my-1.5">
                        <span className="text-xs font-semibold text-blue-300 block">{sub.letter ? `${sub.letter}) ` : ''}{sub.title}</span>
                        {sub.items && (
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-neutral-400">
                            {sub.items.map((it, iIdx) => <li key={iIdx}>{it}</li>)}
                          </ul>
                        )}
                        {sub.note && (
                          <p className="text-[10px] text-neutral-500 italic pl-1">{sub.note}</p>
                        )}
                      </div>
                    ))}

                    {section.numberedList && (
                      <ol className="list-decimal pl-5 space-y-1 text-xs text-neutral-400">
                        {section.numberedList.map((it, nIdx) => <li key={nIdx}>{it}</li>)}
                      </ol>
                    )}

                    {section.highlight && (
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 font-medium leading-relaxed">
                        {section.highlight}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Physical Print Signature Box (Visible on print) */}
              <div className="hidden print:block pt-8 border-t-2 border-black space-y-6 text-black">
                <h4 className="font-bold text-sm uppercase">
                  CONSENTIMIENTO POR ESCRITO (FORMATO IMPRESO)
                </h4>
                <p className="text-xs leading-relaxed">
                  Manifiesto que he leído y conozco el contenido del presente Aviso de Privacidad Integral y que he sido informado sobre el tratamiento y las finalidades de mis datos personales. Asimismo, otorgo expresamente mi consentimiento para el tratamiento de mis datos personales sensibles.
                </p>
                <div className="pt-6 space-y-6 text-xs">
                  <div>Nombre completo del titular: ____________________________________________________</div>
                  <div>Firma autógrafa del titular: _____________________________________________________</div>
                  <div>Fecha: __________________________________________________________________________</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Page Footer (Legal & Privacidad LFPDPPP) */}
      <footer className="mt-auto py-6 px-4 border-t border-neutral-900 bg-neutral-950/90 text-center text-xs text-neutral-400 no-print pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white font-brand">KINETIX Functional Zone</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-500 font-mono text-[10px]">Kinetix Progress {CURRENT_PRIVACY_NOTICE_VERSION}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => {
                if (onOpenPrivacyPolicy) {
                  onOpenPrivacyPolicy();
                } else {
                  handleNavigateTab('privacy');
                }
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Aviso de Privacidad Integral</span>
            </button>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <span className="text-neutral-500 font-mono text-[10px]">
              Ejercicio ARCO: kinetix.zone@gmail.com
            </span>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR (Optimizada ergonómica: 5 pestañas para Staff, 4 para Atletas con Safe-Area) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 shadow-[0_-4px_24px_rgba(0,0,0,0.6)] transition-all"
        style={{
          paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
          paddingTop: '0.4rem',
        }}
      >
        <div 
          className="grid items-center px-1.5"
          style={{
            gridTemplateColumns: isStaff ? 'repeat(5, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))'
          }}
        >
          {/* Tab 1: Inicio / Resumen */}
          <button
            type="button"
            onClick={() => handleNavigateTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-90 ${
              currentTab === 'dashboard' 
                ? 'text-blue-400 font-bold bg-blue-950/40 shadow-inner' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Inicio</span>
          </button>

          {/* Tab 2 (Staff): Panel de Dueños & Coaches con badge de vencimientos */}
          {isStaff && (
            <button
              type="button"
              onClick={() => handleNavigateTab('staff')}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-90 ${
                currentTab === 'staff' 
                  ? 'text-red-400 font-bold bg-red-950/50 shadow-inner border border-red-900/40' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <ShieldCheck className="w-5 h-5 stroke-[2.2] text-red-500" />
                {users.some(u => u.role === 'athlete' && (u.membership.status === 'expired' || u.membership.daysUntilExpiry <= 3)) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse border border-neutral-950" />
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5 text-red-300">Staff</span>
            </button>
          )}

          {/* Tab 3: Antropometría / Pesajes */}
          <button
            type="button"
            onClick={() => handleNavigateTab('body')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-90 ${
              currentTab === 'body' 
                ? 'text-blue-400 font-bold bg-blue-950/40 shadow-inner' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Scale className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              {isStaff ? 'Pesaje' : 'Cuerpo'}
            </span>
          </button>

          {/* Tab 4: Pruebas Físicas / Tests 1RM & Cooper */}
          <button
            type="button"
            onClick={() => handleNavigateTab('tests')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-90 ${
              currentTab === 'tests' 
                ? 'text-blue-400 font-bold bg-blue-950/40 shadow-inner' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Dumbbell className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Pruebas</span>
          </button>

          {/* Tab 5: Membresía / Pagos */}
          <button
            type="button"
            onClick={() => handleNavigateTab('membership')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-90 ${
              currentTab === 'membership' 
                ? 'text-blue-400 font-bold bg-blue-950/40 shadow-inner' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              {isStaff ? 'Cuenta' : 'Plan'}
            </span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showReportModal && (
        <ProgressReportModal
          athlete={effectiveUser}
          latestBodyComp={latestBodyComp}
          latestEval={latestEval}
          gymLogoUrl={gymLogoUrl}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showShareStoryModal && (
        <ShareableStoryModal
          athlete={effectiveUser}
          latestBodyComp={latestBodyComp}
          latestEval={latestEval}
          gymLogoUrl={gymLogoUrl}
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
