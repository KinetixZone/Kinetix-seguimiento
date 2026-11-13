import React, { useState, useEffect, useRef } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { KinetixResponsiveApp } from './components/KinetixResponsiveApp';
import { LoginPage } from './components/auth/LoginPage';
import { UserProfileAndLogoModal } from './components/common/UserProfileAndLogoModal';
import { InAppNotificationCenter } from './components/common/InAppNotificationCenter';
import { SendNotificationModal } from './components/common/SendNotificationModal';
import { PrivacyConsentModal } from './components/common/PrivacyConsentModal';
import { PrivacyPolicyViewerModal } from './components/common/PrivacyPolicyViewerModal';
import { CURRENT_PRIVACY_NOTICE_VERSION } from './data/privacyNoticeContent';
import { saveConsentRecord } from './services/privacyConsentService';
import { 
  INITIAL_USERS, 
  OFFICIAL_KINETIX_ATHLETES,
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
import { 
  syncUserToSupabase, 
  syncBodyCompToSupabase, 
  syncEvaluationToSupabase, 
  syncNotificationToSupabase, 
  syncAllToSupabase,
  loadAllFromSupabase,
  deleteUserFromSupabase,
  deleteBodyCompFromSupabase,
  deleteEvaluationFromSupabase,
  deleteNotificationFromSupabase,
  importSupabaseFromUrlParams,
  ensureSharedCloudConfig,
  subscribeToRealtimeUpdates,
  isSupabaseConfigured
} from './lib/supabase';

export const KINETIX_APP_VERSION = '2026.10.23-v4';

export default function App() {
  const [brandTheme] = useState<BrandTheme>('blue');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [sentToastMsg, setSentToastMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const offlineDirtyRef = useRef<boolean>(false);
  const hasMountedDataRef = useRef<boolean>(false);

  // Automated Cache-Buster & Version Invalidation on Mobile Devices
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem('kinetix_app_build_version');
      if (storedVersion !== KINETIX_APP_VERSION) {
        localStorage.setItem('kinetix_app_build_version', KINETIX_APP_VERSION);
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((k) => caches.delete(k));
          });
        }
      }
    } catch {}
  }, []);

  // Privacy Policy & Consent State
  const [isPrivacyConsentOpen, setIsPrivacyConsentOpen] = useState<boolean>(false);
  const [isPrivacyPolicyViewerOpen, setIsPrivacyPolicyViewerOpen] = useState<boolean>(false);
  
  // Consent history records stored in localStorage (userId -> PrivacyConsentRecord[])
  const [consentHistory, setConsentHistory] = useState<Record<string, PrivacyConsentRecord[]>>(() => {
    try {
      const saved = localStorage.getItem('kinetix_privacy_consents');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Authentication State: persistent session (requires password on fresh visit or after logout)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedSession = localStorage.getItem('kinetix_auth_session');
      return savedSession === 'true';
    } catch {
      return false;
    }
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('kinetix_active_user_id');
      if (savedUser) return savedUser;
    } catch {}
    return 'user-staff-leslie';
  });

  // Custom Gym Logo (Persisted in localStorage)
  const [gymLogoUrl, setGymLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('kinetix_gym_logo');
    } catch {
      return null;
    }
  });
  
  // Data State with full local persistence (Loads official 45 Kinetix athletes & staff)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('kinetix_users_data');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        const demoIds = ['user-001', 'user-002', 'user-003', 'user-004'];
        const cleanUsers = parsed.filter(u => !demoIds.includes(u.id));
        
        const isStockPhoto = (url?: string) => {
          if (!url) return true;
          return url.includes('images.unsplash.com') || 
                 url.includes('kinetix_avatar') || 
                 url.includes('placeholder');
        };

        // Ensure official staff members always have latest profile data without stock photos
        const officialStaff = INITIAL_USERS
          .filter(s => s.role === 'staff')
          .map(s => ({ ...s, avatarUrl: isStockPhoto(s.avatarUrl) ? '' : s.avatarUrl }));
        const existingAthletes = cleanUsers.filter(u => u.role !== 'staff');

        // Merge official Kinetix athletes and clean any stock placeholder photos
        const athleteMap = new Map<string, UserProfile>();
        OFFICIAL_KINETIX_ATHLETES.forEach(a => athleteMap.set(a.id, { ...a, avatarUrl: '' }));
        existingAthletes.forEach(a => {
          const cleanedAvatar = isStockPhoto(a.avatarUrl) ? '' : a.avatarUrl;
          athleteMap.set(a.id, { ...a, avatarUrl: cleanedAvatar });
        });

        const finalUsers = [
          ...officialStaff,
          ...Array.from(athleteMap.values())
        ];
        
        localStorage.setItem('kinetix_users_data', JSON.stringify(finalUsers));
        return finalUsers;
      }
    } catch {}
    return INITIAL_USERS.map(u => ({
      ...u,
      avatarUrl: (!u.avatarUrl || u.avatarUrl.includes('images.unsplash.com') || u.avatarUrl.includes('kinetix_avatar')) ? '' : u.avatarUrl
    }));
  });

  const [bodyCompRecords, setBodyCompRecords] = useState<BodyCompositionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kinetix_body_comp_data');
      if (saved) {
        const parsed: BodyCompositionRecord[] = JSON.parse(saved);
        const demoIds = ['user-001', 'user-002', 'user-003', 'user-004'];
        // Filter out demo athletes and legacy dummy coach records
        const clean = parsed.filter(b => !demoIds.includes(b.userId) && !b.id.startsWith('bc-coach-'));
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed
            .filter(e => !e.id.startsWith('eval-coach-'))
            .map(e => ({
              ...e,
              enduranceTest: {
                ...e.enduranceTest,
                difficultyLevel: e.enduranceTest.difficultyLevel || (e.enduranceTest.scoreScoreLevel === 'Avanzado' ? 'Avanzado' : e.enduranceTest.scoreScoreLevel === 'Básico' ? 'Principiante' : 'Intermedio'),
              },
              strengthRecords: (e.strengthRecords || []).map(s => {
                if (s.exerciseId === 'pullups_or_rows' && s.weightKg === 95) {
                  return { ...s, reps: 1, estimated1RMKg: 95 };
                }
                return s;
              })
            }));
          localStorage.setItem('kinetix_evaluations_data', JSON.stringify(clean));
          return clean;
        }
      }
    } catch {}
    return ALL_INITIAL_PHYSICAL_EVALS;
  });

  const [notifications, setNotifications] = useState<PushNotificationSimulation[]>(() => {
    try {
      const saved = localStorage.getItem('kinetix_notifications_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

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

  useEffect(() => {
    try {
      localStorage.setItem('kinetix_notifications_data', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const applyCloudSnapshot = (cloud: NonNullable<Awaited<ReturnType<typeof loadAllFromSupabase>>>) => {
    if (cloud.users && cloud.users.length > 0) {
      setUsers(cloud.users);
      // Sync user passwords locally so passwords edited on computer work on mobile
      cloud.users.forEach(u => {
        if (u.password) {
          try {
            localStorage.setItem(`kinetix_pwd_${u.id}`, u.password);
          } catch {}
        }
      });
    }
    if (cloud.bodyComp && cloud.bodyComp.length > 0) setBodyCompRecords(cloud.bodyComp);
    if (cloud.evaluations && cloud.evaluations.length > 0) setEvaluations(cloud.evaluations);
    if (cloud.notifications && cloud.notifications.length > 0) setNotifications(cloud.notifications);
  };

  const handleRefreshFromCloud = async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const cloud = await loadAllFromSupabase();
      if (!cloud) {
        return {
          ok: false,
          message: 'No se pudo conectar con Supabase. Verifica la URL y la Clave Anónima.',
        };
      }
      applyCloudSnapshot(cloud);
      const uCount = cloud.users?.length || 0;
      const eCount = cloud.evaluations?.length || 0;
      const bCount = cloud.bodyComp?.length || 0;
      return {
        ok: true,
        message: `¡Sincronizado desde la nube! Cargados: ${uCount} perfiles, ${eCount} evaluaciones y ${bCount} pesajes.`,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Error al descargar datos de la nube: ${err?.message || 'Error de red'}`,
      };
    }
  };

  const usersRef = useRef(users);
  const bodyCompRef = useRef(bodyCompRecords);
  const evalsRef = useRef(evaluations);
  const notifsRef = useRef(notifications);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { bodyCompRef.current = bodyCompRecords; }, [bodyCompRecords]);
  useEffect(() => { evalsRef.current = evaluations; }, [evaluations]);
  useEffect(() => { notifsRef.current = notifications; }, [notifications]);

  // Mark pending cloud push if data is edited while offline
  useEffect(() => {
    if (!hasMountedDataRef.current) {
      hasMountedDataRef.current = true;
      return;
    }
    if (!isOnline) {
      offlineDirtyRef.current = true;
    }
  }, [users, bodyCompRecords, evaluations, notifications, isOnline]);

  // Auto-connect shared cloud config, hydrate from Supabase, subscribe to Realtime & handle offline/online reconnect
  useEffect(() => {
    let cancelled = false;
    let unsubscribeRealtime = () => {};
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const pullLatest = async () => {
      if (cancelled || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
      try {
        const cloud = await loadAllFromSupabase();
        if (!cancelled && cloud) {
          applyCloudSnapshot(cloud);
        }
      } catch (err) {
        console.warn('Cloud refresh skipped:', err);
      }
    };

    const schedulePull = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        pullLatest();
      }, 600);
    };

    async function hydrateAndSubscribe() {
      try {
        const imported = importSupabaseFromUrlParams();
        await ensureSharedCloudConfig();
        const cloud = await loadAllFromSupabase();
        if (!cancelled && cloud) {
          applyCloudSnapshot(cloud);
          if (imported) {
            setSentToastMsg('☁️ Dispositivo conectado a Kinetix Cloud en tiempo real.');
            setTimeout(() => setSentToastMsg(null), 4000);
          }
        }
        if (!cancelled && isSupabaseConfigured()) {
          unsubscribeRealtime = subscribeToRealtimeUpdates(schedulePull);
        }
      } catch (err) {
        console.warn('Hydration from Supabase skipped:', err);
      }
    }

    hydrateAndSubscribe();

    const handleOnline = async () => {
      setIsOnline(true);
      try {
        await ensureSharedCloudConfig();
        if (offlineDirtyRef.current && isSupabaseConfigured()) {
          const res = await syncAllToSupabase(
            usersRef.current,
            bodyCompRef.current,
            evalsRef.current,
            notifsRef.current
          );
          if (res.success) {
            offlineDirtyRef.current = false;
            setSentToastMsg('☁️ Internet recuperado: cambios locales sincronizados en la nube.');
            setTimeout(() => setSentToastMsg(null), 4000);
          }
        }
        await pullLatest();
        unsubscribeRealtime();
        if (isSupabaseConfigured()) {
          unsubscribeRealtime = subscribeToRealtimeUpdates(schedulePull);
        }
      } catch {}
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleFocus = () => {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        pullLatest();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeRealtime();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Helper to check if a user has consented to the current privacy notice version
  const currentUserHasConsented = (userId: string) => {
    // Check direct persistent flag
    try {
      if (localStorage.getItem(`kinetix_consent_given_${userId}`) === 'true') {
        return true;
      }
    } catch {}

    const list = consentHistory[userId] || [];
    const consented = list.some(
      (c) =>
        c.privacy_notice_version === CURRENT_PRIVACY_NOTICE_VERSION &&
        c.privacy_notice_accepted &&
        c.sensitive_data_consent
    );

    if (consented) {
      try {
        localStorage.setItem(`kinetix_consent_given_${userId}`, 'true');
      } catch {}
    }
    return consented;
  };

  // Automatically check on currentUser change (first login only, never prompts again if accepted)
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Staff members (Leslie & Jorge) have master access and are not blocked
      if (currentUser.role === 'staff') {
        setIsPrivacyConsentOpen(false);
        return;
      }
      if (!currentUserHasConsented(currentUser.id)) {
        setIsPrivacyConsentOpen(true);
      } else {
        setIsPrivacyConsentOpen(false);
      }
    }
  }, [currentUserId, isAuthenticated, consentHistory]);

  const handleConsentAccepted = (record: PrivacyConsentRecord) => {
    try {
      localStorage.setItem(`kinetix_consent_given_${record.user_id}`, 'true');
    } catch {}
    saveConsentRecord(record);
    setConsentHistory((prev) => {
      const userList = prev[record.user_id] || [];
      const updated = {
        ...prev,
        [record.user_id]: [...userList, record],
      };
      try {
        localStorage.setItem('kinetix_privacy_consents', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIsPrivacyConsentOpen(false);
  };

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
    try {
      localStorage.setItem('kinetix_auth_session', 'true');
      localStorage.setItem('kinetix_active_user_id', user.id);
    } catch {}
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsProfileModalOpen(false);
    try {
      localStorage.removeItem('kinetix_auth_session');
      localStorage.removeItem('kinetix_active_user_id');
    } catch {}
    setCurrentUserId('user-staff-leslie');
  };

  // Add or Update Body Comp Record (Updates in-place if a record already exists on the same date)
  const handleAddBodyCompRecord = (record: Omit<BodyCompositionRecord, 'id'>) => {
    const existing = bodyCompRecords.find(b => b.userId === record.userId && b.recordedAt === record.recordedAt);
    const savedRecord: BodyCompositionRecord = existing
      ? { ...existing, ...record }
      : { ...record, id: `bc-${Date.now()}` };

    setBodyCompRecords(prev => {
      const idx = prev.findIndex(b => b.id === savedRecord.id || (b.userId === record.userId && b.recordedAt === record.recordedAt));
      if (idx !== -1) {
        const updatedList = [...prev];
        updatedList[idx] = savedRecord;
        return updatedList;
      }
      return [...prev, savedRecord];
    });

    // Automatic push notification to the athlete
    const newNotif: PushNotificationSimulation = {
      id: `notif-bc-${Date.now()}`,
      title: '⚖️ Pesaje y Composición Corporal Kinetix',
      body: `Se ha registrado tu pesaje oficial (${record.weightKg} kg, ${record.bodyFatPercent}% grasa). Consulta tus avances en la pestaña Antropometría.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'test_results',
      targetUserId: record.userId,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Sync to Supabase in the background
    syncBodyCompToSupabase(savedRecord);
    syncNotificationToSupabase(newNotif);
  };

  // Delete Body Comp Record
  const handleDeleteBodyCompRecord = (recordId: string) => {
    setBodyCompRecords(prev => prev.filter(b => b.id !== recordId));
    deleteBodyCompFromSupabase(recordId);
  };

  // Update Body Comp Record
  const handleUpdateBodyCompRecord = (recordId: string, updates: Partial<BodyCompositionRecord>) => {
    setBodyCompRecords(prev => {
      const next = prev.map(b => b.id === recordId ? { ...b, ...updates } : b);
      const updated = next.find(b => b.id === recordId);
      if (updated) {
        syncBodyCompToSupabase(updated);
      }
      return next;
    });
  };

  // Add Physical Evaluation
  const handleAddEvaluation = (evalRec: Omit<PhysicalEvaluationRecord, 'id'>) => {
    const existing = evaluations.find(e => e.userId === evalRec.userId && e.evaluationDate === evalRec.evaluationDate);
    const savedEval: PhysicalEvaluationRecord = existing
      ? { ...existing, ...evalRec }
      : { ...evalRec, id: `eval-${Date.now()}` };

    setEvaluations(prev => {
      const idx = prev.findIndex(e => e.id === savedEval.id || (e.userId === evalRec.userId && e.evaluationDate === evalRec.evaluationDate));
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = savedEval;
        return updated;
      }
      return [...prev, savedEval];
    });

    // Send automatic notification to the athlete with their 1RM milestone
    const topRM = evalRec.strengthRecords?.reduce(
      (prev, curr) => (curr.estimated1RMKg > (prev?.estimated1RMKg || 0) ? curr : prev), 
      evalRec.strengthRecords[0]
    );
    const rmMention = topRM ? ` Récord 1RM estimado: ${topRM.exerciseName} ${topRM.estimated1RMKg} kg.` : '';

    const newNotif: PushNotificationSimulation = {
      id: `notif-rm-${Date.now()}`,
      title: '🏋️ Nueva Valoración Técnica y 1RM Registrada',
      body: `Tu coach ha actualizado tu expediente físico oficial.${rmMention} Revisa tu pestaña Tests para ver tus marcas y porcentajes de entrenamiento.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'test_results',
      targetUserId: evalRec.userId,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Sync to Supabase in the background
    syncEvaluationToSupabase(savedEval);
    syncNotificationToSupabase(newNotif);
  };

  // Delete Physical Evaluation
  const handleDeleteEvaluation = (evalId: string) => {
    setEvaluations(prev => prev.filter(e => e.id !== evalId));
    deleteEvaluationFromSupabase(evalId);
  };

  // Update Physical Evaluation
  const handleUpdateEvaluation = (evalId: string, updates: Partial<PhysicalEvaluationRecord>) => {
    setEvaluations(prev => {
      const next = prev.map(e => e.id === evalId ? { ...e, ...updates } : e);
      const updated = next.find(e => e.id === evalId);
      if (updated) {
        syncEvaluationToSupabase(updated);
      }
      return next;
    });
  };

  // Update Membership Status
  const handleUpdateMembershipStatus = (status: MembershipStatus, daysUntilExpiry: number) => {
    setUsers(prev => {
      const next = prev.map(u => {
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
      });
      const updated = next.find(u => u.id === currentUserId);
      if (updated) syncUserToSupabase(updated);
      return next;
    });
  };

  // Staff direct control: Update payment date, billing day, plan and access
  const handleUpdateUserMembership = (
    userId: string,
    status: MembershipStatus,
    newExpiryDate?: string,
    newPlanName?: KinetixPlanName,
    billingDayOfMonth?: number
  ) => {
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          const plan = newPlanName || u.membership.planName;
          const isFreeOrFamily = plan === 'Familia & Amigos (Sin Corte)' || plan === 'Cortesía / Beca (Sin Corte)' || billingDayOfMonth === 0;
          const fee = isFreeOrFamily
            ? 0
            : plan === 'Entrenos Personalizados (Coach Jorge)' 
            ? 149.99 
            : plan === 'Kinetix con Nutrición' 
            ? 99.99 
            : 79.99;
          const billDay = isFreeOrFamily ? 0 : (billingDayOfMonth ?? u.membership.billingDayOfMonth ?? 15);
          const expiry = isFreeOrFamily
            ? 'Permanente'
            : (newExpiryDate || (status === 'active' ? `2024-05-${billDay.toString().padStart(2, '0')}` : u.membership.expiryDate));
          const daysUntilExpiry = isFreeOrFamily ? 99999 : (status === 'suspended' ? 0 : 25);

          return {
            ...u,
            membership: {
              ...u.membership,
              status: isFreeOrFamily ? 'active' : status,
              planName: plan,
              monthlyFee: fee,
              expiryDate: expiry,
              daysUntilExpiry,
              billingDayOfMonth: billDay,
              hasNutritionPlan: plan !== 'Kinetix',
              personalCoach: plan === 'Entrenos Personalizados (Coach Jorge)' ? 'Coach Jorge' : undefined,
            }
          };
        }
        return u;
      });
      const updated = next.find(u => u.id === userId);
      if (updated) syncUserToSupabase(updated);
      return next;
    });
  };

  // Delete Athlete
  const handleDeleteAthlete = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setBodyCompRecords(prev => prev.filter(b => b.userId !== userId));
    setEvaluations(prev => prev.filter(e => e.userId !== userId));
    deleteUserFromSupabase(userId);
    if (currentUserId === userId) {
      setCurrentUserId('user-staff-01');
    }
  };

  // Helper to ensure guaranteed unique usernames across athletes and staff
  const generateUniqueUsername = (
    desired: string,
    usersList: UserProfile[],
    excludeUserId?: string
  ): string => {
    const base = desired
      .toLowerCase()
      .trim()
      .split(' ')[0]
      .replace(/[^a-z0-9_]/g, '') || 'usuario';

    let candidate = base;
    let suffix = 2;
    while (usersList.some(u => u.id !== excludeUserId && u.username?.toLowerCase() === candidate.toLowerCase())) {
      candidate = `${base}${suffix}`;
      suffix++;
    }
    return candidate;
  };

  // Update Athlete or Staff Profile and sync to Supabase
  const handleUpdateAthleteProfile = (userId: string, updates: Partial<UserProfile>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
      const userObj = updated.find(u => u.id === userId);
      if (userObj) {
        syncUserToSupabase(userObj);
      }
      return updated;
    });
  };

  // Create User by Email (Staff feature)
  const handleCreateUserByEmail = (newUser: {
    name: string;
    email?: string;
    planName: KinetixPlanName;
    gender: 'male' | 'female';
    heightCm: number;
    billingDayOfMonth?: number;
    expiryDate?: string;
    password?: string;
    switchToCreatedUser?: boolean;
  }) => {
    const isFreeOrFamily = newUser.planName === 'Familia & Amigos (Sin Corte)' || newUser.planName === 'Cortesía / Beca (Sin Corte)' || newUser.billingDayOfMonth === 0;
    const fee = isFreeOrFamily
      ? 0
      : newUser.planName === 'Entrenos Personalizados (Coach Jorge)' 
      ? 149.99 
      : newUser.planName === 'Kinetix con Nutrición' 
      ? 99.99 
      : 79.99;
    const billDay = isFreeOrFamily ? 0 : (newUser.billingDayOfMonth ?? 15);
    const defaultExpiry = isFreeOrFamily ? 'Permanente' : (newUser.expiryDate || `2024-05-${billDay.toString().padStart(2, '0')}`);
    const autoUsername = generateUniqueUsername(newUser.name, users);
    const finalEmail = newUser.email?.trim() || `${autoUsername}@kinetix.fit`;

    const createdUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: finalEmail,
      username: autoUsername,
      role: 'athlete',
      phone: '+52 (55) 0000-0000',
      avatarUrl: '',
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
        daysUntilExpiry: isFreeOrFamily ? 99999 : 30,
        lastPaymentDate: '2024-04-01',
        nextPaymentDate: defaultExpiry,
        billingDayOfMonth: billDay,
        hasNutritionPlan: newUser.planName !== 'Kinetix',
        personalCoach: newUser.planName === 'Entrenos Personalizados (Coach Jorge)' ? 'Coach Jorge' : undefined,
        paymentReminderSent: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Save initial password in localStorage
    const pwd = newUser.password || 'kinetix123';
    try {
      localStorage.setItem(`kinetix_pwd_${createdUser.id}`, pwd);
    } catch {}

    setUsers(prev => [createdUser, ...prev]);
    syncUserToSupabase(createdUser);

    if (newUser.switchToCreatedUser) {
      setCurrentUserId(createdUser.id);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('kinetix_auth_session', 'true');
        localStorage.setItem('kinetix_active_user_id', createdUser.id);
      } catch {}
      setIsPrivacyConsentOpen(true);
    }
  };

  // Athlete Self-Registration Handler (from Login portal)
  const handleRegisterAthlete = (newUser: {
    name: string;
    email: string;
    password: string;
    gender: 'male' | 'female';
    heightCm: number;
  }) => {
    const createdUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: 'athlete',
      phone: '+52 (55) 0000-0000',
      avatarUrl: '',
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
        planName: 'Kinetix',
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: '2024-05-15',
        monthlyFee: 79.99,
        currency: 'USD',
        autoRenew: true,
        gracePeriodDays: 5,
        daysUntilExpiry: 30,
        lastPaymentDate: new Date().toISOString().slice(0, 10),
        nextPaymentDate: '2024-05-15',
        billingDayOfMonth: 15,
        hasNutritionPlan: false,
        paymentReminderSent: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
      username: generateUniqueUsername(newUser.name, users),
    };

    // Save personal password in localStorage
    try {
      localStorage.setItem(`kinetix_pwd_${createdUser.id}`, newUser.password);
    } catch {}

    // Register user in the database/state. The athlete will now log in with their password
    setUsers(prev => [createdUser, ...prev]);
    syncUserToSupabase(createdUser);
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

  const handleSendNotificationFromModal = (
    title: string, 
    body: string, 
    targetUserId?: string, 
    targetAudience?: 'all' | 'athletes' | 'staff' | 'color_5' | 'color_15' | 'color_20' | 'color_30'
  ) => {
    const newNotif: PushNotificationSimulation = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'payment_reminder',
      targetUserId,
      targetAudience: targetAudience || (targetUserId ? undefined : 'athletes'),
    };
    setNotifications(prev => [newNotif, ...prev]);
    syncNotificationToSupabase(newNotif);
    setSentToastMsg(`✅ Aviso enviado: "${title}"`);
    setTimeout(() => setSentToastMsg(null), 3500);
  };

  const handleSendBatchNotification = (title: string, body: string, targetUserIds: string[]) => {
    const newNotifs: PushNotificationSimulation[] = targetUserIds.map((uid, index) => ({
      id: `notif-batch-${Date.now()}-${index}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'payment_reminder',
      targetUserId: uid,
      targetAudience: 'athletes',
    }));
    setNotifications(prev => [...newNotifs, ...prev]);
    newNotifs.forEach(n => syncNotificationToSupabase(n));
    setSentToastMsg(`✅ Aviso enviado a ${targetUserIds.length} atleta(s)`);
    setTimeout(() => setSentToastMsg(null), 3500);
  };

  const handleCreateStaffMember = (staffData: {
    name: string;
    email?: string;
    password?: string;
    staffRole: 'owner' | 'coach' | 'nutritionist';
    username?: string;
  }) => {
    const autoUsername = staffData.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || generateUniqueUsername(staffData.name, users);
    const finalEmail = staffData.email?.trim().toLowerCase() || `${autoUsername}@kinetix.fit`;
    const newStaff: UserProfile = {
      id: `user-staff-${Date.now()}`,
      name: staffData.name,
      email: finalEmail,
      password: staffData.password || 'kinetix2026',
      role: 'staff',
      staffRole: staffData.staffRole,
      phone: '55 1234 5678',
      birthDate: '1995-01-01',
      gender: 'male',
      heightCm: 175,
      weightUnit: 'kg',
      emergencyContact: {
        name: 'Staff Kinetix',
        phone: '55 1234 5678',
        relationship: 'Equipo Kinetix'
      },
      avatarUrl: '',
      membership: {
        id: `mem-staff-${Date.now()}`,
        planName: 'Kinetix',
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        expiryDate: 'Permanente',
        monthlyFee: 0,
        currency: 'USD',
        autoRenew: true,
        gracePeriodDays: 999,
        daysUntilExpiry: 99999,
        lastPaymentDate: new Date().toISOString().slice(0, 10),
        nextPaymentDate: '2099-01-01',
        paymentReminderSent: false,
      },
      createdAt: new Date().toISOString().slice(0, 10),
      username: autoUsername,
    };
    setUsers(prev => [...prev, newStaff]);
    syncUserToSupabase(newStaff);
  };

  const handleDeleteStaffMember = (staffId: string) => {
    if (staffId === 'user-staff-leslie' || staffId === currentUser.id) {
      alert('Por seguridad no puedes eliminar tu propia cuenta de dueña principal.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== staffId));
  };

  const handleSimulateNotification = (
    title: string, 
    body: string, 
    targetUserId?: string, 
    targetAudience?: 'all' | 'athletes' | 'staff' | 'color_5' | 'color_15' | 'color_20' | 'color_30'
  ) => {
    const isAthlete = currentUser?.role === 'athlete';
    const newNotif: PushNotificationSimulation = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'payment_reminder',
      targetUserId: targetUserId || (isAthlete ? currentUser?.id : undefined),
      targetAudience: targetAudience || (isAthlete ? 'athletes' : 'staff'),
    };
    setNotifications(prev => [newNotif, ...prev]);
    setIsNotificationsOpen(true);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteNotificationFromSupabase(id);
  };

  const handleClearReadNotifications = () => {
    // Dismiss all read notifications for current user
    const readIds = new Set(visibleNotifications.filter(n => n.read).map(n => n.id));
    setNotifications(prev => prev.filter(n => !readIds.has(n.id)));
  };

  // Only show notifications relevant to the logged-in user
  const visibleNotifications = notifications.filter(notif => {
    if (currentUser?.role === 'staff') {
      return notif.targetAudience === 'staff' || notif.targetAudience === 'all' || notif.targetUserId === currentUser.id;
    } else {
      if (notif.targetUserId) return notif.targetUserId === currentUser?.id;
      if (notif.targetAudience === 'staff') return false;
      if (notif.targetAudience === 'athletes' || notif.targetAudience === 'all') return true;
      if (notif.targetAudience?.startsWith('color_')) {
        const billingDay = currentUser?.membership?.billingDayOfMonth ?? 15;
        return notif.targetAudience === `color_${billingDay}`;
      }
      return !notif.targetUserId && !notif.targetAudience;
    }
  });


  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  // IF NOT AUTHENTICATED: Show the Portal de Acceso (Login Page)
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          users={users}
          gymLogoUrl={gymLogoUrl}
          onLogin={handleLogin}
          onRegisterAthlete={handleRegisterAthlete}
          onNotifyOwners={(title, body) => handleSimulateNotification(title, body)}
          onOpenPrivacyPolicy={() => setIsPrivacyPolicyViewerOpen(true)}
        />
        {/* Full Digital Privacy Notice Viewer Modal on Login Screen */}
        <PrivacyPolicyViewerModal
          currentUser={currentUser}
          consentRecord={null}
          isOpen={isPrivacyPolicyViewerOpen}
          onClose={() => setIsPrivacyPolicyViewerOpen(false)}
        />
      </>
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
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyViewerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Responsive Application (Works seamlessly on phones and computers) */}
      <main className="flex-1">
        <KinetixResponsiveApp
          currentUser={currentUser}
          users={users}
          bodyCompRecords={bodyCompRecords}
          evaluations={evaluations}
          notifications={visibleNotifications}
          onAddBodyCompRecord={handleAddBodyCompRecord}
          onDeleteBodyCompRecord={handleDeleteBodyCompRecord}
          onUpdateBodyCompRecord={handleUpdateBodyCompRecord}
          onAddEvaluation={handleAddEvaluation}
          onDeleteEvaluation={handleDeleteEvaluation}
          onUpdateEvaluation={handleUpdateEvaluation}
          onUpdateMembershipStatus={handleUpdateMembershipStatus}
          onCreateUserByEmail={handleCreateUserByEmail}
          onCreateStaffMember={handleCreateStaffMember}
          onDeleteStaffMember={handleDeleteStaffMember}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onSimulatePushNotification={handleSimulateNotification}
          onUpdateUserMembership={handleUpdateUserMembership}
          onDeleteAthlete={handleDeleteAthlete}
          onUpdateAthleteProfile={handleUpdateAthleteProfile}
          onClearDemoAthletes={handleClearDemoAthletes}
          onSwitchUser={(u) => {
            setCurrentUserId(u.id);
            try {
              localStorage.setItem('kinetix_active_user_id', u.id);
            } catch {}
          }}
          consentHistory={consentHistory}
          gymLogoUrl={gymLogoUrl}
          onSendBatchNotification={handleSendBatchNotification}
          onRefreshFromCloud={handleRefreshFromCloud}
        />
      </main>

      {/* Offline-Only Banner (shown only when device genuinely loses internet connection) */}
      {!isOnline && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:right-auto z-50 sm:max-w-md bg-amber-950/95 border border-amber-500/60 text-amber-100 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md">
          <span>🟠 Sin internet: trabajando con caché local. Se sincronizará automáticamente al reconectar.</span>
        </div>
      )}

      {/* Global Toast Confirmation for Sent Notifications & Cloud Link */}
      {sentToastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto z-50 sm:max-w-sm bg-emerald-950/95 border border-emerald-500/60 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in backdrop-blur-md">
          <span>{sentToastMsg}</span>
          <button
            type="button"
            onClick={() => setSentToastMsg(null)}
            className="text-emerald-300 hover:text-white text-[10px] underline shrink-0"
          >
            OK
          </button>
        </div>
      )}

      {/* Profile & Gym Logo Modal */}
      {isProfileModalOpen && (
        <UserProfileAndLogoModal
          currentUser={currentUser}
          gymLogoUrl={gymLogoUrl}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateGymLogo={handleUpdateGymLogo}
          onLogout={handleLogout}
          onClose={() => setIsProfileModalOpen(false)}
          onOpenPrivacyPolicy={() => setIsPrivacyPolicyViewerOpen(true)}
        />
      )}

      {/* In-Page Notification Modal Drawer */}
      <InAppNotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={visibleNotifications}
        allNotifications={notifications}
        isStaff={currentUser?.role === 'staff'}
        currentUserId={currentUser?.id}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onMarkAsRead={handleMarkNotificationAsRead}
        onDismissNotification={handleDismissNotification}
        onClearReadNotifications={handleClearReadNotifications}
        onOpenSendNotification={() => setIsSendNotificationOpen(true)}
      />

      {/* Send Notification Modal (For Coach/Staff) */}
      {isSendNotificationOpen && (
        <SendNotificationModal
          users={users}
          onSendNotification={(title, body, targetUserId, targetAudience) => {
            handleSendNotificationFromModal(title, body, targetUserId, targetAudience);
          }}
          onClose={() => setIsSendNotificationOpen(false)}
        />
      )}

      {/* Privacy Consent Modal (First-time blocking modal with 2 checkboxes) */}
      <PrivacyConsentModal
        currentUser={currentUser}
        isOpen={isPrivacyConsentOpen}
        onConsentAccepted={handleConsentAccepted}
      />

      {/* Full Digital Privacy Notice Viewer Modal (Digital document + evidence certificate + print physical format) */}
      <PrivacyPolicyViewerModal
        currentUser={currentUser}
        consentRecord={consentHistory[currentUser.id]?.slice(-1)[0] || null}
        gymLogoUrl={gymLogoUrl}
        isOpen={isPrivacyPolicyViewerOpen}
        onClose={() => setIsPrivacyPolicyViewerOpen(false)}
      />
    </div>
  );
}
