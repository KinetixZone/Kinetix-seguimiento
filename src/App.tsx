import React, { useState } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { TechnicalSpecViewer } from './components/spec/TechnicalSpecViewer';
import { MobileAppSimulator } from './components/mobile/MobileAppSimulator';
import { KinetixWebPortal } from './components/web/KinetixWebPortal';
import { InAppNotificationCenter } from './components/common/InAppNotificationCenter';
import { 
  INITIAL_USERS, 
  ALL_INITIAL_BODY_COMP,
  ALL_INITIAL_PHYSICAL_EVALS,
  INITIAL_NOTIFICATIONS 
} from './data/mockData';
import { TECHNICAL_SPEC_SECTIONS } from './data/technicalSpecContent';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  MembershipStatus,
  KinetixPlanName,
  PushNotificationSimulation,
  BrandTheme
} from './types';

export default function App() {
  // Default to 'web' as requested by user (Web page gratis como https://kinetix-control.vercel.app/)
  const [viewMode, setViewMode] = useState<'web' | 'simulator' | 'spec' | 'split'>('web');
  const [brandTheme, setBrandTheme] = useState<BrandTheme>('blue');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  
  // Data State
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [bodyCompRecords, setBodyCompRecords] = useState<BodyCompositionRecord[]>(ALL_INITIAL_BODY_COMP);
  const [evaluations, setEvaluations] = useState<PhysicalEvaluationRecord[]>(ALL_INITIAL_PHYSICAL_EVALS);
  const [notifications, setNotifications] = useState<PushNotificationSimulation[]>(INITIAL_NOTIFICATIONS);

  // Add Body Comp Record
  const handleAddBodyCompRecord = (record: Omit<BodyCompositionRecord, 'id'>) => {
    const newRecord: BodyCompositionRecord = {
      ...record,
      id: `bc-${Date.now()}`,
    };
    setBodyCompRecords(prev => [...prev, newRecord]);
  };

  // Delete Body Comp Record (Staff control)
  const handleDeleteBodyCompRecord = (recordId: string) => {
    setBodyCompRecords(prev => prev.filter(b => b.id !== recordId));
  };

  // Update Body Comp Record (Staff control)
  const handleUpdateBodyCompRecord = (recordId: string, updates: Partial<BodyCompositionRecord>) => {
    setBodyCompRecords(prev => prev.map(b => b.id === recordId ? { ...b, ...updates } : b));
  };

  // Add Physical Evaluation
  const handleAddEvaluation = (evalRec: Omit<PhysicalEvaluationRecord, 'id'>) => {
    const newEval: PhysicalEvaluationRecord = {
      ...evalRec,
      id: `eval-${Date.now()}`,
    };
    setEvaluations(prev => [...prev, newEval]);
  };

  // Delete Physical Evaluation (Staff control)
  const handleDeleteEvaluation = (evalId: string) => {
    setEvaluations(prev => prev.filter(e => e.id !== evalId));
  };

  // Update Physical Evaluation (Staff control)
  const handleUpdateEvaluation = (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => {
    setEvaluations(prev => prev.map(e => e.id === evalId ? { ...e, ...updates } : e));
  };

  // Update Membership Status (e.g. suspension, renewal)
  const handleUpdateMembershipStatus = (status: MembershipStatus, daysUntilExpiry: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === 'user-001') {
        return {
          ...u,
          membership: {
            ...u.membership,
            status,
            daysUntilExpiry,
            expiryDate: status === 'active' ? '2024-05-30' : u.membership.expiryDate,
          }
        };
      }
      return u;
    }));
  };

  // Staff/Owner direct control: Update payment date, billing day, plan and access for ANY user
  const handleUpdateUserMembership = (
    userId: string,
    status: MembershipStatus,
    newExpiryDate?: string,
    newPlanName?: KinetixPlanName,
    billingDayOfMonth?: number
  ) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const plan = newPlanName || u.membership.planName;
        const fee = plan === 'Entrenos Personalizados (Coach Jorge)' 
          ? 149.99 
          : plan === 'Kinetix con Nutrición' 
          ? 99.99 
          : 79.99;
        const billDay = billingDayOfMonth ?? u.membership.billingDayOfMonth ?? 15;
        const expiry = newExpiryDate || (status === 'active' ? `2024-05-${billDay.toString().padStart(2, '0')}` : u.membership.expiryDate);

        return {
          ...u,
          membership: {
            ...u.membership,
            status,
            planName: plan,
            monthlyFee: fee,
            expiryDate: expiry,
            daysUntilExpiry: status === 'suspended' ? 0 : 25,
            billingDayOfMonth: billDay,
            hasNutritionPlan: plan !== 'Kinetix',
            personalCoach: plan === 'Entrenos Personalizados (Coach Jorge)' ? 'Coach Jorge' : undefined,
          }
        };
      }
      return u;
    }));
  };

  // Staff/Owner direct control: Delete Athlete and cascade delete records
  const handleDeleteAthlete = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setBodyCompRecords(prev => prev.filter(b => b.userId !== userId));
    setEvaluations(prev => prev.filter(e => e.userId !== userId));
  };

  // Staff/Owner direct control: Update Athlete Profile info
  const handleUpdateAthleteProfile = (userId: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  // Create User by Email (Staff feature)
  const handleCreateUserByEmail = (newUser: {
    name: string;
    email: string;
    planName: KinetixPlanName;
    gender: 'male' | 'female';
    heightCm: number;
    billingDayOfMonth?: number;
    expiryDate?: string;
  }) => {
    const fee = newUser.planName === 'Entrenos Personalizados (Coach Jorge)' 
      ? 149.99 
      : newUser.planName === 'Kinetix con Nutrición' 
      ? 99.99 
      : 79.99;
    const billDay = newUser.billingDayOfMonth || 15;
    const defaultExpiry = newUser.expiryDate || `2024-05-${billDay.toString().padStart(2, '0')}`;

    const createdUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: 'athlete',
      phone: '+52 (55) 0000-0000',
      avatarUrl: newUser.gender === 'male' 
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      birthDate: '1998-01-01',
      gender: newUser.gender,
      heightCm: newUser.heightCm,
      weightUnit: 'kg',
      emergencyContact: {
        name: 'Contacto Primario',
        phone: '+52 (55) 0000-1111',
        relationship: 'Familiar',
      },
      membership: {
        id: `mem-${Date.now()}`,
        planName: newUser.planName,
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: defaultExpiry,
        monthlyFee: fee,
        currency: 'USD',
        autoRenew: true,
        gracePeriodDays: 5,
        daysUntilExpiry: 30,
        lastPaymentDate: new Date().toISOString().slice(0, 10),
        nextPaymentDate: defaultExpiry,
        billingDayOfMonth: billDay,
        hasNutritionPlan: newUser.planName !== 'Kinetix',
        personalCoach: newUser.planName === 'Entrenos Personalizados (Coach Jorge)' ? 'Coach Jorge' : undefined,
        paymentReminderSent: false,
      },
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setUsers(prev => [createdUser, ...prev]);
  };

  // Push / In-page notification simulation
  const handleSimulateNotification = (title: string, body: string) => {
    const newNotif: PushNotificationSimulation = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: 'Justo ahora',
      type: title.toLowerCase().includes('suspendida') ? 'membership_suspension' : 'payment_reminder',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Export full technical specification as Markdown file
  const handleExportMarkdown = () => {
    let fullMarkdown = `# ESPECIFICACIÓN TÉCNICA Y ARQUITECTURA DE SISTEMA\n`;
    fullMarkdown += `## Proyecto: Kinetix Functional Zone (Web & Mobile PWA Platform)\n`;
    fullMarkdown += `Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    fullMarkdown += `--------------------------------------------------\n\n`;

    TECHNICAL_SPEC_SECTIONS.forEach(sec => {
      fullMarkdown += `# ${sec.title}\n\n`;
      fullMarkdown += `> ${sec.summary}\n\n`;
      fullMarkdown += `${sec.contentMarkdown}\n\n`;
      fullMarkdown += `--------------------------------------------------\n\n`;
    });

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Kinetix_Functional_Zone_Especificacion_Tecnica.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div data-theme={brandTheme} className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header with Kinetix Blue & Red Identity */}
      <NavigationHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        brandTheme={brandTheme}
        setBrandTheme={setBrandTheme}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onPrint={handlePrint}
        onExportMarkdown={handleExportMarkdown}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {/* VIEW 1: Modern Web Platform (Vercel Style / Responsive Web App) */}
        {viewMode === 'web' && (
          <div className="animate-fade-in">
            <KinetixWebPortal
              users={users}
              bodyCompRecords={bodyCompRecords}
              evaluations={evaluations}
              notifications={notifications}
              onAddBodyCompRecord={handleAddBodyCompRecord}
              onDeleteBodyCompRecord={handleDeleteBodyCompRecord}
              onUpdateBodyCompRecord={handleUpdateBodyCompRecord}
              onAddEvaluation={handleAddEvaluation}
              onDeleteEvaluation={handleDeleteEvaluation}
              onUpdateEvaluation={handleUpdateEvaluation}
              onUpdateMembershipStatus={handleUpdateMembershipStatus}
              onCreateUserByEmail={handleCreateUserByEmail}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onSimulatePushNotification={handleSimulateNotification}
              onUpdateUserMembership={handleUpdateUserMembership}
              onDeleteAthlete={handleDeleteAthlete}
              onUpdateAthleteProfile={handleUpdateAthleteProfile}
            />
          </div>
        )}

        {/* VIEW 2: Mobile Touch Simulator */}
        {viewMode === 'simulator' && (
          <div className="animate-fade-in py-4">
            <MobileAppSimulator
              users={users}
              bodyCompRecords={bodyCompRecords}
              evaluations={evaluations}
              notifications={notifications}
              onAddBodyCompRecord={handleAddBodyCompRecord}
              onDeleteBodyCompRecord={handleDeleteBodyCompRecord}
              onUpdateBodyCompRecord={handleUpdateBodyCompRecord}
              onAddEvaluation={handleAddEvaluation}
              onDeleteEvaluation={handleDeleteEvaluation}
              onUpdateEvaluation={handleUpdateEvaluation}
              onUpdateMembershipStatus={handleUpdateMembershipStatus}
              onCreateUserByEmail={handleCreateUserByEmail}
              onUpdateUserMembership={handleUpdateUserMembership}
              onDeleteAthlete={handleDeleteAthlete}
              onUpdateAthleteProfile={handleUpdateAthleteProfile}
            />
          </div>
        )}

        {/* VIEW 3: Full Technical Specification Document */}
        {viewMode === 'spec' && (
          <div className="animate-fade-in">
            <TechnicalSpecViewer onOpenSimulator={() => setViewMode('web')} />
          </div>
        )}

        {/* VIEW 4: Split View (Spec + Mobile Phone Simulator) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-[1720px] mx-auto animate-fade-in">
            <div className="lg:col-span-7 xl:col-span-8 overflow-y-auto">
              <TechnicalSpecViewer onOpenSimulator={() => setViewMode('web')} />
            </div>

            <div className="lg:col-span-5 xl:col-span-4 sticky top-20 self-start">
              <div className="border border-neutral-800 rounded-3xl p-3 bg-neutral-900/30 backdrop-blur-md">
                <div className="text-center pb-2">
                  <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
                    Simulador Móvil Conectado en Tiempo Real
                  </span>
                </div>
                <MobileAppSimulator
                  users={users}
                  bodyCompRecords={bodyCompRecords}
                  evaluations={evaluations}
                  notifications={notifications}
                  onAddBodyCompRecord={handleAddBodyCompRecord}
                  onDeleteBodyCompRecord={handleDeleteBodyCompRecord}
                  onUpdateBodyCompRecord={handleUpdateBodyCompRecord}
                  onAddEvaluation={handleAddEvaluation}
                  onDeleteEvaluation={handleDeleteEvaluation}
                  onUpdateEvaluation={handleUpdateEvaluation}
                  onUpdateMembershipStatus={handleUpdateMembershipStatus}
                  onCreateUserByEmail={handleCreateUserByEmail}
                  onUpdateUserMembership={handleUpdateUserMembership}
                  onDeleteAthlete={handleDeleteAthlete}
                  onUpdateAthleteProfile={handleUpdateAthleteProfile}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* In-Page Notification Modal Drawer */}
      <InAppNotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onSimulateNewNotification={() => handleSimulateNotification(
          'Recordatorio de Pago Kinetix',
          'Hola Sarah, tu membresía vence el 30 de Abril, 2024. Monto a Pagar: $89.99. Por favor contacta al gimnasio para renovar tu membresía.'
        )}
      />

      {/* Executive Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 px-4 md:px-8 text-neutral-500 text-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-extrabold text-[10px]">
              KZ
            </span>
            <span className="text-neutral-200 font-bold font-brand">KINETIX Functional Zone</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">Plataforma Web Oficial & PWA Gratuita (Vercel)</span>
          </div>

          <div className="text-neutral-500 text-[11px] flex items-center gap-4">
            <span className="text-blue-400">Azul & Rojo Oficial</span>
            <span>·</span>
            <span>Fórmulas: OMS / Cooper (Niveles 1-5) / 1RM</span>
            <span>·</span>
            <span>https://kinetix-control.vercel.app/</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
