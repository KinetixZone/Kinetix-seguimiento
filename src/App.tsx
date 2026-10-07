import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { KinetixResponsiveApp } from './components/KinetixResponsiveApp';
import { LoginPage } from './components/auth/LoginPage';
import { UserProfileAndLogoModal } from './components/common/UserProfileAndLogoModal';
import { InAppNotificationCenter } from './components/common/InAppNotificationCenter';
import { SendNotificationModal } from './components/common/SendNotificationModal';
import { PrivacyConsentModal } from './components/common/PrivacyConsentModal';
import { PrivacyPolicyViewerModal } from './components/common/PrivacyPolicyViewerModal';
import { CURRENT_PRIVACY_NOTICE_VERSION } from './data/privacyNoticeContent';
import { 
  INITIAL_USERS, 
  DEMO_ATHLETES,
  ALL_INITIAL_BODY_COMP,
  ALL_INITIAL_PHYSICAL_EVALS,
  INITIAL_NOTIFICATIONS 
} from './data/mockData';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  MembershipStatus,
  KinetixPlanName,
  PushNotificationSimulation,
  BrandTheme,
  PrivacyConsentRecord
} from './types';

export default function App() {
  const [brandTheme] = useState<BrandTheme>('blue');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Authentication State: default authenticated to Leslie (Dueña & Coach)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string>('user-staff-leslie');

  // Custom Gym Logo (Persisted in localStorage)
  const [gymLogoUrl, setGymLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('kinetix_gym_logo');
    } catch {
      return null;
    }
  });
  
  // Data State with full local persistence (Sanitizes legacy demo profiles automatically)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('kinetix_users_data');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const demoIds = ['user-001', 'user-002', 'user-003', 'user-004'];
        const cleanUsers = parsed.filter(u => !demoIds.includes(u.id));
        
        // Ensure official staff members always have latest profile data
        const officialStaff = INITIAL_USERS.filter(s => s.role === 'staff');
        const finalUsers = [
          ...officialStaff,
          ...cleanUsers.filter(u => u.role !== 'staff')
        ];
        
        localStorage.setItem('kinetix_users_data', JSON.stringify(finalUsers));
        return finalUsers;
      }
    } catch {}
    return INITIAL_USERS;
  });

  const [bodyCompRecords, setBodyCompRecords] = useState<BodyCompositionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kinetix_body_comp_data');
      if (saved) {
        const parsed: BodyCompositionRecord[] = JSON.parse(saved);
        const demoIds = ['user-001', 'user-002', 'user-003', 'user-004'];
        const clean = parsed.filter(b => !demoIds.includes(b.userId));
        localStorage.setItem('kinetix_body_comp_data', JSON.stringify(clean));
        return clean;
      }
    } catch {}
    return ALL_INITIAL_BODY_COMP;
  });

  const [evaluations, setEvaluations] = useState<PhysicalEvaluationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kinetix_evaluations_data');
      if (saved) {
        const parsed: PhysicalEvaluationRecord[] = JSON.parse(saved);
        const demoIds = ['user-001', 'user-002', 'user-003', 'user-004'];
        const clean = parsed.filter(e => !demoIds.includes(e.userId));
        localStorage.setItem('kinetix_evaluations_data', JSON.stringify(clean));
        return clean;
      }
    } catch {}
    return ALL_INITIAL_PHYSICAL_EVALS;
  });

  const [notifications, setNotifications] = useState<PushNotificationSimulation[]>(INITIAL_NOTIFICATIONS);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kinetix_users_data', JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('kinetix_body_comp_data', JSON.stringify(bodyCompRecords));
    } catch {}
  }, [bodyCompRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('kinetix_evaluations_data', JSON.stringify(evaluations));
    } catch {}
  }, [evaluations]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Update user avatar (Atletas & Coach)
  const handleUpdateAvatar = (userId: string, newAvatarUrl: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl: newAvatarUrl } : u));
    try {
      localStorage.setItem(`kinetix_avatar_${userId}`, newAvatarUrl);
    } catch {}
  };

  // Update Gym Logo (Coach/Staff)
  const handleUpdateGymLogo = (newLogoUrl: string | null) => {
    setGymLogoUrl(newLogoUrl);
    try {
      if (newLogoUrl) {
        localStorage.setItem('kinetix_gym_logo', newLogoUrl);
      } else {
        localStorage.removeItem('kinetix_gym_logo');
      }
    } catch {}
  };

  // Login handler
  const handleLogin = (user: UserProfile) => {
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setIsProfileModalOpen(false);
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsProfileModalOpen(false);
  };

  // Add Body Comp Record
  const handleAddBodyCompRecord = (record: Omit<BodyCompositionRecord, 'id'>) => {
    const newRecord: BodyCompositionRecord = {
      ...record,
      id: `bc-${Date.now()}`,
    };
    setBodyCompRecords(prev => [...prev, newRecord]);
  };

  // Delete Body Comp Record
  const handleDeleteBodyCompRecord = (recordId: string) => {
    setBodyCompRecords(prev => prev.filter(b => b.id !== recordId));
  };

  // Update Body Comp Record
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

  // Delete Physical Evaluation
  const handleDeleteEvaluation = (evalId: string) => {
    setEvaluations(prev => prev.filter(e => e.id !== evalId));
  };

  // Update Physical Evaluation
  const handleUpdateEvaluation = (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => {
    setEvaluations(prev => prev.map(e => e.id === evalId ? { ...e, ...updates } : e));
  };

  // Update Membership Status
  const handleUpdateMembershipStatus = (status: MembershipStatus, daysUntilExpiry: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUserId) {
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

  // Staff direct control: Update payment date, billing day, plan and access
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

  // Delete Athlete
  const handleDeleteAthlete = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setBodyCompRecords(prev => prev.filter(b => b.userId !== userId));
    setEvaluations(prev => prev.filter(e => e.userId !== userId));
    if (currentUserId === userId) {
      setCurrentUserId('user-staff-01');
    }
  };

  // Update Athlete Profile
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
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=400&q=80`,
      birthDate: '1998-01-01',
      gender: newUser.gender,
      heightCm: newUser.heightCm,
      weightUnit: 'kg',
      emergencyContact: {
        name: 'Pendiente',
        phone: 'Pendiente',
        relationship: 'Familiar',
      },
      membership: {
        id: `mem-${Date.now()}`,
        planName: newUser.planName,
        status: 'active',
        startDate: '2024-04-01',
        expiryDate: defaultExpiry,
        monthlyFee: fee,
        currency: 'USD',
        autoRenew: true,
        gracePeriodDays: 5,
        daysUntilExpiry: 30,
        lastPaymentDate: '2024-04-01',
        nextPaymentDate: defaultExpiry,
        billingDayOfMonth: billDay,
        hasNutritionPlan: newUser.planName !== 'Kinetix',
        personalCoach: newUser.planName === 'Entrenos Personalizados (Coach Jorge)' ? 'Coach Jorge' : undefined,
        paymentReminderSent: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers(prev => [createdUser, ...prev]);
  };

  const handleClearDemoAthletes = () => {
    // Keep only official staff members (Leslie, Coach Jorge, Coach Gus)
    const demoIds = ['user-001', 'user-002', 'user-003', 'user-004'];
    setUsers(prev => prev.filter(u => u.role === 'staff' || !demoIds.includes(u.id)));
    setBodyCompRecords(prev => prev.filter(b => !demoIds.includes(b.userId)));
    setEvaluations(prev => prev.filter(e => !demoIds.includes(e.userId)));
  };

  const handleRestoreDemoAthletes = () => {
    setUsers(prev => {
      const staffOnly = prev.filter(u => u.role === 'staff');
      return [...staffOnly, ...DEMO_ATHLETES];
    });
  };

  const handleSimulateNotification = (title: string, body: string) => {
    const newNotif: PushNotificationSimulation = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'payment_reminder',
    };
    setNotifications(prev => [newNotif, ...prev]);
    setIsNotificationsOpen(true);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // IF NOT AUTHENTICATED: Show the Portal de Acceso (Login Page)
  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        gymLogoUrl={gymLogoUrl}
        onLogin={handleLogin}
        onNotifyOwners={(title, body) => handleSimulateNotification(title, body)}
      />
    );
  }

  // IF AUTHENTICATED: Render the full responsive application
  return (
    <div data-theme={brandTheme} className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header with Kinetix Blue & Red Identity (No switcher buttons) */}
      <NavigationHeader
        currentUser={currentUser}
        gymLogoUrl={gymLogoUrl}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSendNotification={() => setIsSendNotificationOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Responsive Application (Works seamlessly on phones and computers) */}
      <main className="flex-1">
        <KinetixResponsiveApp
          currentUser={currentUser}
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
          onClearDemoAthletes={handleClearDemoAthletes}
          onRestoreDemoAthletes={handleRestoreDemoAthletes}
          onSwitchUser={(u) => setCurrentUserId(u.id)}
        />
      </main>

      {/* Profile & Gym Logo Modal */}
      {isProfileModalOpen && (
        <UserProfileAndLogoModal
          currentUser={currentUser}
          gymLogoUrl={gymLogoUrl}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateGymLogo={handleUpdateGymLogo}
          onLogout={handleLogout}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* In-Page Notification Modal Drawer */}
      <InAppNotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        isStaff={currentUser?.role === 'staff'}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onSimulateNewNotification={() => handleSimulateNotification(
          'Recordatorio de Pago Kinetix',
          'Hola, tu membresía vence pronto. Por favor contacta al gimnasio para renovar tu membresía.'
        )}
      />

      {/* Send Notification Modal (For Coach/Staff) */}
      {isSendNotificationOpen && (
        <SendNotificationModal
          users={users}
          onSendNotification={(title, body, targetUserId) => {
            handleSimulateNotification(title, body);
          }}
          onClose={() => setIsSendNotificationOpen(false)}
        />
      )}
    </div>
  );
}
