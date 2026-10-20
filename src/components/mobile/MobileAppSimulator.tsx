import React, { useState } from 'react';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  PushNotificationSimulation,
  MembershipStatus,
  KinetixPlanName
} from '../../types';
import { AthleteDashboard } from './AthleteDashboard';
import { BodyCompositionView } from './BodyCompositionView';
import { PhysicalTestsView } from './PhysicalTestsView';
import { MembershipView } from './MembershipView';
import { StaffManagementView } from './StaffManagementView';
import { ProgressReportModal } from './ProgressReportModal';
import { ShareableStoryModal } from './ShareableStoryModal';
import { 
  Home, 
  Activity, 
  Dumbbell, 
  CreditCard, 
  Users, 
  Wifi, 
  WifiOff, 
  Battery, 
  Bell, 
  UserCheck,
  Smartphone,
  CheckCircle2,
  X,
  ArrowLeft
} from 'lucide-react';

interface MobileAppSimulatorProps {
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
    password?: string;
  }) => void;
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

export const MobileAppSimulator: React.FC<MobileAppSimulatorProps> = ({
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
  onUpdateUserMembership,
  onDeleteAthlete,
  onUpdateAthleteProfile,
}) => {
  // Device Frame State: 'iphone' | 'pixel' | 'fluid'
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'pixel' | 'fluid'>('iphone');
  
  // Active Simulated User (Defaults to active user or first staff)
  const [selectedUserId, setSelectedUserId] = useState<string>(() => users[0]?.id || 'user-staff-leslie');
  
  // Offline Simulation State
  const [isOffline, setIsOffline] = useState<boolean>(false);
  
  // Navigation Tab inside mobile app
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'body' | 'tests' | 'membership' | 'staff' | 'privacy'>('dashboard');
  const [isInspectingAthlete, setIsInspectingAthlete] = useState<boolean>(false);

  // Interactive Push Banner Popup
  const [activeBannerNotification, setActiveBannerNotification] = useState<{ title: string; body: string } | null>(null);

  // Modal Report View
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showShareStoryModal, setShowShareStoryModal] = useState<boolean>(false);

  const currentUser = users.find(u => u.id === selectedUserId) || users[0];
  const userBodyComps = bodyCompRecords.filter(b => b.userId === currentUser.id);
  const userEvals = evaluations.filter(e => e.userId === currentUser.id);
  const latestBodyComp = userBodyComps.length > 0 ? userBodyComps[userBodyComps.length - 1] : null;
  const latestEval = userEvals.length > 0 ? userEvals[userEvals.length - 1] : undefined;

  const handleTriggerPushBanner = (title: string, body: string) => {
    setActiveBannerNotification({ title, body });
    setTimeout(() => {
      setActiveBannerNotification(null);
    }, 6000);
  };

  const handleOpenEvaluationForUser = (user: UserProfile) => {
    setSelectedUserId(user.id);
    setIsInspectingAthlete(true);
    setCurrentTab('tests');
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 space-y-6">
      {/* Top Device & Environment Controls */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800 text-xs">
        {/* Device Frame Selection */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setDeviceModel('iphone')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              deviceModel === 'iphone' ? 'bg-neutral-800 text-white font-medium shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>iPhone 16 Pro</span>
          </button>
          <button
            onClick={() => setDeviceModel('pixel')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              deviceModel === 'pixel' ? 'bg-neutral-800 text-white font-medium shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Pixel 9</span>
          </button>
          <button
            onClick={() => setDeviceModel('fluid')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              deviceModel === 'fluid' ? 'bg-neutral-800 text-white font-medium shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Fluido</span>
          </button>
        </div>

        {/* Role & User Selector */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 text-[11px]">Rol activo:</span>
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              const targetUser = users.find(u => u.id === e.target.value);
              if (targetUser?.role === 'staff') {
                setCurrentTab('staff');
              } else {
                setCurrentTab('dashboard');
              }
            }}
            className="bg-neutral-950 border border-neutral-800 text-white text-xs rounded-xl px-2.5 py-1 outline-none focus:border-emerald-500 font-medium"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.role === 'staff' ? '👑 Staff' : '🏃 Atleta'}: {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Offline Toggle Simulator */}
        <button
          onClick={() => setIsOffline(!isOffline)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
            isOffline
              ? 'bg-amber-950/80 border border-amber-800 text-amber-300'
              : 'bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300'
          }`}
          title="Simular pérdida de conexión y funcionamiento offline-first con SQLite"
        >
          {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isOffline ? 'Modo Offline (SQLite Activo)' : 'En Línea (Cloud)'}</span>
        </button>
      </div>

      {/* SMARTPHONE DEVICE CONTAINER */}
      <div 
        className={`relative transition-all duration-300 ${
          deviceModel === 'fluid'
            ? 'w-full max-w-md h-[840px]'
            : deviceModel === 'pixel'
            ? 'w-[390px] h-[844px] rounded-[48px] border-[10px] border-neutral-800 ring-1 ring-neutral-700/50 shadow-2xl shadow-black/80'
            : 'w-[400px] h-[852px] rounded-[55px] border-[12px] border-neutral-800 ring-1 ring-neutral-700/50 shadow-2xl shadow-black/90'
        } bg-neutral-950 flex flex-col overflow-hidden`}
      >
        {/* Notch / Dynamic Island for iPhone */}
        {deviceModel === 'iphone' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse inline-block" />
          </div>
        )}

        {/* Pixel Pin-hole Camera */}
        {deviceModel === 'pixel' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 border border-neutral-800" />
        )}

        {/* Status Bar */}
        <div className="pt-3 px-6 pb-1 flex items-center justify-between text-[11px] font-mono font-semibold text-neutral-400 z-40 select-none">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <span className="text-[10px] text-amber-400 font-sans font-medium flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            ) : (
              <Wifi className="w-3.5 h-3.5 text-neutral-300" />
            )}
            <span className="text-[10px]">5G</span>
            <Battery className="w-4 h-4 text-neutral-300" />
          </div>
        </div>

        {/* Offline Banner Inside App */}
        {isOffline && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-1 text-[11px] text-center font-medium flex items-center justify-center gap-1.5 animate-fade-in z-30">
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span>Sin conexión. Datos cargados desde SQLite local.</span>
          </div>
        )}

        {/* Dynamic Push Notification Banner (Slide down from top) */}
        {activeBannerNotification && (
          <div className="absolute top-12 left-3 right-3 z-50 animate-slide-down">
            <div className="bg-neutral-900/95 backdrop-blur-xl border border-blue-500/50 p-3.5 rounded-2xl shadow-2xl shadow-black space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[9px] font-extrabold relative overflow-hidden">
                    <span className="relative z-10">KZ</span>
                    <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
                  </div>
                  <span>{activeBannerNotification.title}</span>
                </div>
                <button
                  onClick={() => setActiveBannerNotification(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-300 leading-snug">
                {activeBannerNotification.body}
              </p>
            </div>
          </div>
        )}

        {/* App Top Brand Header Bar */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-extrabold relative overflow-hidden shadow-sm">
              <span className="relative z-10">KZ</span>
              <span className="absolute -right-1 -bottom-1 w-3 h-3 bg-red-600 rounded-full" />
            </div>
            <span className="font-bold text-sm text-white font-brand">
              KINETIX <span className="font-light text-blue-400">Zone</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTriggerPushBanner(
                currentUser.role === 'staff'
                  ? 'Aviso Oficial de Coach'
                  : 'Recordatorio de Pago Kinetix',
                currentUser.role === 'staff'
                  ? 'Atención atletas: Mañana sesión de fuerza y técnica funcional a las 07:00 AM.'
                  : `Hola ${currentUser.name.split(' ')[0]}, tu membresía vence pronto. Por favor contacta al gimnasio para renovar tu membresía.`
              )}
              className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
              title="Probar notificación push"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-800">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-4 h-4 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="text-[11px] font-medium text-neutral-200 truncate max-w-[80px]">
                {currentUser.name.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE MAIN APP CONTENT AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Back to Staff Inspection Header */}
          {isInspectingAthlete && currentTab !== 'staff' && (
            <div className="bg-red-950/95 border-b border-red-800/90 px-3 py-2 flex items-center justify-between text-xs sticky top-0 z-30 shadow-md">
              <button
                onClick={() => {
                  setIsInspectingAthlete(false);
                  setCurrentTab('staff');
                }}
                className="flex items-center gap-1.5 text-white font-bold text-[11px] bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded-lg border border-red-500/50 shadow-sm active:scale-95 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Volver a Staff</span>
              </button>
              <div className="text-right truncate pl-2">
                <span className="text-[10px] text-red-300 block leading-tight">Viendo a:</span>
                <span className="text-[11px] text-white font-bold truncate block">{currentUser.name}</span>
              </div>
            </div>
          )}

          {/* Universal Back Navigation Bar when not on Dashboard */}
          {!isInspectingAthlete && currentTab !== 'dashboard' && (
            <div className="bg-neutral-900/90 border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between text-xs sticky top-0 z-20 backdrop-blur-md">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold text-[11px] active:scale-95 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>← Volver al Inicio</span>
              </button>
              <span className="text-[10px] text-neutral-400 font-medium capitalize">
                Sección: {currentTab === 'body' ? 'Composición Corporal' : currentTab === 'tests' ? 'Pruebas & Tests' : currentTab === 'membership' ? 'Membresía' : 'Directorio Staff'}
              </span>
            </div>
          )}

          {currentTab === 'dashboard' && (
            <AthleteDashboard
              currentUser={currentUser}
              latestBodyComp={latestBodyComp}
              latestEval={latestEval}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenReport={() => setShowReportModal(true)}
              onOpenShareStory={() => setShowShareStoryModal(true)}
            />
          )}

          {currentTab === 'body' && (
            <BodyCompositionView
              currentUser={currentUser}
              records={userBodyComps}
              onAddRecord={onAddBodyCompRecord}
              onDeleteRecord={onDeleteBodyCompRecord}
              onUpdateRecord={onUpdateBodyCompRecord}
              onBackToDashboard={() => setCurrentTab('dashboard')}
              loggedStaffUser={users.find(u => u.role === 'staff') || null}
              isStaffUser={currentUser.role === 'staff' || isInspectingAthlete}
              allAthletes={users.filter(u => u.role === 'athlete')}
              onSelectNextAthlete={(next) => setSelectedUserId(next.id)}
            />
          )}

          {currentTab === 'tests' && (
            <PhysicalTestsView
              currentUser={currentUser}
              evaluations={userEvals}
              onAddEvaluation={onAddEvaluation}
              onDeleteEvaluation={onDeleteEvaluation}
              onUpdateEvaluation={onUpdateEvaluation}
              onBackToDashboard={() => setCurrentTab('dashboard')}
              loggedStaffUser={users.find(u => u.role === 'staff') || null}
              isStaffUser={currentUser.role === 'staff' || isInspectingAthlete}
              allAthletes={users.filter(u => u.role === 'athlete')}
              onSelectNextAthlete={(next) => setSelectedUserId(next.id)}
            />
          )}

          {currentTab === 'membership' && (
            <MembershipView
              currentUser={currentUser}
              onUpdateMembershipStatus={onUpdateMembershipStatus}
              onSimulatePushNotification={handleTriggerPushBanner}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'staff' && (
            <StaffManagementView
              users={users}
              currentUser={users.find(u => u.role === 'staff') || currentUser}
              onSelectUserToInspect={(u) => {
                setSelectedUserId(u.id);
                setIsInspectingAthlete(true);
                setCurrentTab('dashboard');
              }}
              onCreateUserByEmail={onCreateUserByEmail}
              onOpenTestEntryForUser={handleOpenEvaluationForUser}
              onOpenBodyCompForUser={(u) => {
                setSelectedUserId(u.id);
                setIsInspectingAthlete(true);
                setCurrentTab('body');
              }}
              onOpenReportForUser={(u) => {
                setSelectedUserId(u.id);
                setShowReportModal(true);
              }}
              onUpdateUserMembership={onUpdateUserMembership}
              onDeleteAthlete={onDeleteAthlete}
              onUpdateAthleteProfile={onUpdateAthleteProfile}
              onBackToDashboard={() => setCurrentTab('dashboard')}
            />
          )}
        </div>

        {/* FIXED BOTTOM APP TAB BAR (Pattern 1 from Mobile Reference) */}
        <div className="h-16 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800/80 grid grid-cols-5 items-center px-1 z-40">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-tight mt-1">Inicio</span>
          </button>

          <button
            onClick={() => setCurrentTab('body')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'body' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-tight mt-1">Cuerpo</span>
          </button>

          <button
            onClick={() => setCurrentTab('tests')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'tests' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-tight mt-1">Pruebas</span>
          </button>

          <button
            onClick={() => setCurrentTab('membership')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'membership' ? 'text-blue-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-tight mt-1">Membresía</span>
          </button>

          <button
            onClick={() => setCurrentTab('staff')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'staff' ? 'text-red-500 font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-tight mt-1">Staff</span>
          </button>
        </div>
      </div>

      {/* Modal Report Viewer */}
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
