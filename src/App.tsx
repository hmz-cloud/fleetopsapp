import React, { useState, useEffect } from 'react';
import { 
  Vehicle, Driver, CostCenter, Transfer, Maintenance, 
  Notification, Settings, User, AuditLog, Subscription, VehicleDocs 
} from './types';
import { 
  defaultSettings, defaultCostCenters, defaultDrivers, 
  defaultVehicles, defaultTransfers, defaultMaintenance, 
  defaultNotifications, defaultUsers, defaultAuditLogs 
} from './data';
import { dbGetCollection, dbSetDoc, dbDeleteDoc, authenticateFirebaseUser } from './firebase';


// Components
import AuthScreen from './components/AuthScreen';
import DashboardView from './components/DashboardView';
import FleetView from './components/FleetView';
import AnalyticsView from './components/AnalyticsView';
import TrackingView from './components/TrackingView';
import TransfersView from './components/TransfersView';
import MaintenanceView from './components/MaintenanceView';
import DriversAndCCView from './components/DriversAndCCView';
import AdminAndAuditView from './components/AdminAndAuditView';
import BulkImportModal from './components/BulkImportModal';
import SettingsView from './components/SettingsView';
import ComplianceView from './components/ComplianceView';
import DriverDashboardView from './components/DriverDashboardView';
import BillingPortal from './components/BillingPortal';

// Icons
import { 
  LayoutDashboard, BarChart3, Truck, Compass, 
  ArrowLeftRight, Wrench, ShieldCheck, Users, 
  FolderKanban, FileSpreadsheet, Settings as SettingsIcon, 
  LogOut, Bell, Plus, Menu, X, CheckCircle, Search, HelpCircle,
  Clock, CreditCard, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// KEYS
const PERSIST_KEY = 'fleet_ops_storage_v31';

export default function App() {
  // --- APP STATE ENGINE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('fleet_ops_current_user_v31');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const u = localStorage.getItem('fleet_ops_users_v31');
      return u ? JSON.parse(u) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  // Main operational database states
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(defaultDrivers);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(defaultCostCenters);
  const [transfers, setTransfers] = useState<Transfer[]>(defaultTransfers);
  const [maintenance, setMaintenance] = useState<Maintenance[]>(defaultMaintenance);
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(defaultAuditLogs);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);

  // Layout navigation states
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Load Operational state from Firestore with Multi-Tenant Partitioning
  useEffect(() => {
    if (!currentUser) return;

    async function initFirestoreData() {
      try {
        // Ensure active user session is authenticated in Firebase Auth
        await authenticateFirebaseUser(currentUser!.email, currentUser!.password || "DefaultPassword123!");

        const orgName = currentUser!.org || 'Default_Tenant';
        console.log(`Fetching operational data from Cloud Firestore for Tenant: ${orgName}...`);
        
        const dbVehicles = await dbGetCollection<Vehicle>('vehicles', orgName);
        const dbDrivers = await dbGetCollection<Driver>('drivers', orgName);
        const dbCostCenters = await dbGetCollection<CostCenter>('costCenters', orgName);
        const dbTransfers = await dbGetCollection<Transfer>('transfers', orgName);
        const dbMaintenance = await dbGetCollection<Maintenance>('maintenance', orgName);
        const dbNotifications = await dbGetCollection<Notification>('notifications', orgName);
        const dbAuditLogs = await dbGetCollection<AuditLog>('auditLogs', orgName);
        const dbSettingsList = await dbGetCollection<Settings>('settings', orgName);
        const dbSubs = await dbGetCollection<Subscription>('subscription', orgName);

        if (dbVehicles.length === 0) {
          // SEEDING ENGINE: Seed Firestore for first-time setup under tenant space
          console.log(`No tenant data found in Cloud Firestore for ${orgName}. Seeding default database...`);
          for (const v of defaultVehicles) {
            await dbSetDoc('vehicles', v.id.toString(), v, orgName);
          }
          for (const d of defaultDrivers) {
            await dbSetDoc('drivers', d.id.toString(), d, orgName);
          }
          for (const cc of defaultCostCenters) {
            await dbSetDoc('costCenters', cc.id.toString(), cc, orgName);
          }
          for (const t of defaultTransfers) {
            await dbSetDoc('transfers', t.id.toString(), t, orgName);
          }
          for (const m of defaultMaintenance) {
            await dbSetDoc('maintenance', m.id.toString(), m, orgName);
          }
          for (const n of defaultNotifications) {
            await dbSetDoc('notifications', n.id.toString(), n, orgName);
          }
          for (const l of defaultAuditLogs) {
            await dbSetDoc('auditLogs', l.id.toString(), l, orgName);
          }
          await dbSetDoc('settings', 'global', defaultSettings, orgName);
          
          // Seed default Trial Subscription
          const initialSub: Subscription = {
            status: 'trialing',
            plan: 'free_trial',
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            billingEmail: currentUser!.email,
          };
          await dbSetDoc('subscription', 'config', initialSub, orgName);
          setSubscription(initialSub);

          setVehicles(defaultVehicles);
          setDrivers(defaultDrivers);
          setCostCenters(defaultCostCenters);
          setTransfers(defaultTransfers);
          setMaintenance(defaultMaintenance);
          setNotifications(defaultNotifications);
          setAuditLogs(defaultAuditLogs);
          setSettings(defaultSettings);
        } else {
          // LOAD SUCCESS: Load directly from live Cloud Firestore
          console.log("Operational data fetched from Cloud Firestore successfully.");
          setVehicles(dbVehicles.sort((a, b) => b.id - a.id));
          setDrivers(dbDrivers.sort((a, b) => a.id - b.id));
          setCostCenters(dbCostCenters.sort((a, b) => a.id - b.id));
          setTransfers(dbTransfers.sort((a, b) => b.id - a.id));
          setMaintenance(dbMaintenance.sort((a, b) => b.id - a.id));
          setNotifications(dbNotifications.sort((a, b) => b.id - a.id));
          setAuditLogs(dbAuditLogs.sort((a, b) => b.id - a.id));
          
          if (dbSettingsList.length > 0) {
            const s = dbSettingsList.find((x: any) => x.companyName) || dbSettingsList[0];
            if (s) setSettings(s);
          }

          if (dbSubs.length > 0) {
            setSubscription(dbSubs[0]);
          } else {
            const initialSub: Subscription = {
              status: 'trialing',
              plan: 'free_trial',
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              billingEmail: currentUser!.email,
            };
            await dbSetDoc('subscription', 'config', initialSub, orgName);
            setSubscription(initialSub);
          }
        }
      } catch (err) {
        console.error("Firestore connection/load failed. Falling back to Local Storage.", err);
        // Fallback to localStorage if offline or blocked
        try {
          const saved = localStorage.getItem(PERSIST_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.vehicles) setVehicles(parsed.vehicles);
            if (parsed.drivers) setDrivers(parsed.drivers);
            if (parsed.costCenters) setCostCenters(parsed.costCenters);
            if (parsed.transfers) setTransfers(parsed.transfers);
            if (parsed.maintenance) setMaintenance(parsed.maintenance);
            if (parsed.notifications) setNotifications(parsed.notifications);
            if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
            if (parsed.settings) setSettings(parsed.settings);
            if (parsed.subscription) setSubscription(parsed.subscription);
          }
        } catch {}
      }
    }

    initFirestoreData();
  }, [currentUser]);

  // Save Operational state to both Firestore & local backup with Tenant routing
  const saveAllData = (
    newVehicles: Vehicle[],
    newDrivers: Driver[],
    newCCs: CostCenter[],
    newTransfers: Transfer[],
    newMaint: Maintenance[],
    newNotifs: Notification[],
    newLogs: AuditLog[],
    newSettings: Settings,
    onboardDismissed: boolean
  ) => {
    const data = {
      vehicles: newVehicles,
      drivers: newDrivers,
      costCenters: newCCs,
      transfers: newTransfers,
      maintenance: newMaint,
      notifications: newNotifs,
      auditLogs: newLogs,
      settings: newSettings,
      subscription: subscription,
      dismissedOnboarding: onboardDismissed
    };
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
      
      const orgName = currentUser?.org || 'Default_Tenant';
      // Async write to Cloud Firestore under tenant path
      newVehicles.forEach(v => dbSetDoc('vehicles', v.id.toString(), v, orgName));
      newDrivers.forEach(d => dbSetDoc('drivers', d.id.toString(), d, orgName));
      newCCs.forEach(cc => dbSetDoc('costCenters', cc.id.toString(), cc, orgName));
      newTransfers.forEach(t => dbSetDoc('transfers', t.id.toString(), t, orgName));
      newMaint.forEach(m => dbSetDoc('maintenance', m.id.toString(), m, orgName));
      newNotifs.forEach(n => dbSetDoc('notifications', n.id.toString(), n, orgName));
      newLogs.forEach(l => dbSetDoc('auditLogs', l.id.toString(), l, orgName));
      dbSetDoc('settings', 'global', newSettings, orgName);
    } catch (e) {
      console.error("Failed to persist state", e);
    }
  };


  // Toast Messaging state
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' | 'info' }>([]);
  
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Persist Users list when altered
  useEffect(() => {
    try {
      localStorage.setItem('fleet_ops_users_v31', JSON.stringify(users));
    } catch {}
  }, [users]);

  // Persist current session user
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('fleet_ops_current_user_v31', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('fleet_ops_current_user_v31');
      }
    } catch {}
  }, [currentUser]);

  // ── SERVICE DUE NOTIFICATION TRIGGER EFFECT ──
  const [lastCheckedVehicles, setLastCheckedVehicles] = useState<string>('');

  useEffect(() => {
    if (!vehicles.length || !currentUser) return;

    // Create a signature to avoid running on every irrelevant change
    const signature = vehicles.map(v => `${v.id}:${v.nextService}`).join('|');
    if (signature === lastCheckedVehicles) return;

    let updated = false;
    const addedNotifs: Notification[] = [];

    vehicles.forEach(v => {
      if (!v.nextService) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const serviceDate = new Date(v.nextService);
      serviceDate.setHours(0, 0, 0, 0);

      const diffTime = serviceDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Trigger warning when exactly 7 days before next service
      if (diffDays === 7) {
        const title = 'Service Due Alert';
        const msg = `Vehicle ${v.fleet} (${v.make} ${v.model}) is due for scheduled service in 7 days on ${v.nextService}.`;

        // Check if a similar notification already exists in the current state to prevent duplicates
        const exists = notifications.some(n => 
          n.title === title && 
          n.msg.includes(v.fleet) && 
          n.msg.includes(v.nextService)
        );

        if (!exists) {
          addedNotifs.push({
            id: Date.now() + Math.floor(Math.random() * 100000) + addedNotifs.length,
            title,
            msg,
            type: 'warning',
            read: false,
            time: new Date().toISOString()
          });
          updated = true;
        }
      }
    });

    if (updated && addedNotifs.length > 0) {
      setNotifications(prev => {
        // Double-check against latest prev notifications array
        const filteredAdded = addedNotifs.filter(an => 
          !prev.some(p => p.title === an.title && p.msg === an.msg)
        );
        if (filteredAdded.length === 0) return prev;
        const merged = [...filteredAdded, ...prev];
        saveAllData(vehicles, drivers, costCenters, transfers, maintenance, merged, auditLogs, settings, dismissedOnboarding);
        return merged;
      });
    }

    setLastCheckedVehicles(signature);
  }, [vehicles, notifications, currentUser, drivers, costCenters, transfers, maintenance, auditLogs, settings, dismissedOnboarding, lastCheckedVehicles]);

  // Unified logging helper
  const addAuditLog = (action: string, detail: string, logColor = 'var(--accent2)') => {
    const freshLog: AuditLog = {
      id: Date.now(),
      action,
      detail,
      user: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Agent',
      time: new Date().toISOString(),
      color: logColor
    };
    const nextLogs = [freshLog, ...auditLogs].slice(0, 100);
    setAuditLogs(nextLogs);
    saveAllData(vehicles, drivers, costCenters, transfers, maintenance, notifications, nextLogs, settings, dismissedOnboarding);
  };

  // ── CORE PIPELINES ──

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`Logged in as ${user.firstName} ${user.lastName}`, 'info');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSubscription(null);
    showToast('Successfully signed out');
  };

  const handleSignup = async (user: User) => {
    const nextUsers = [...users, user];
    setUsers(nextUsers);
    setCurrentUser(user);
    showToast(`Account created for ${user.firstName}! Welcome to Fleet Ops.`, 'success');

    // Persist new user to global Firestore users collection mapped by email
    try {
      await dbSetDoc('users', user.email.toLowerCase(), user);
    } catch (e) {
      console.error("Failed to sync new user to Firestore", e);
    }
  };

  const handleUpdateSubscription = async (nextSub: Subscription) => {
    setSubscription(nextSub);
    const orgName = currentUser?.org || 'Default_Tenant';
    await dbSetDoc('subscription', 'config', nextSub, orgName);
    addAuditLog('Billing Plan Change', `Workspace subscription status updated to ${nextSub.plan.toUpperCase()}`, 'var(--emerald)');
    showToast(`Successfully upgraded to ${nextSub.plan.toUpperCase()}!`);
  };

  const isBillingBlocked = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'driver') return false; // Drivers don't get blocked from working
    if (!subscription) return false;
    if (subscription.plan === 'free_trial' || subscription.status === 'active' || subscription.status === 'trialing') {
      const end = new Date(subscription.currentPeriodEnd);
      const today = new Date();
      return today > end; // Expired trial/subscription!
    }
    return true; // Expired/Canceled/Past Due!
  };

  // Driver action handlers
  const handleUpdateVehicleMileage = (vehicleId: number, newMileage: number) => {
    const nextVehicles = vehicles.map(v => v.id === vehicleId ? { ...v, mileage: newMileage } : v);
    setVehicles(nextVehicles);
    showToast(`Vehicle mileage updated to ${newMileage.toLocaleString()} ${settings.distUnit}`);
    const v = vehicles.find(x => x.id === vehicleId);
    addAuditLog('Mileage Logged', `${v?.make} ${v?.model} (${v?.fleet}) odometer updated to ${newMileage.toLocaleString()} ${settings.distUnit}`, 'var(--accent2)');
    saveAllData(nextVehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleUpdateDriverStatus = (driverId: number, status: 'active' | 'on_leave' | 'inactive') => {
    const nextDrivers = drivers.map(d => d.id === driverId ? { ...d, status } : d);
    setDrivers(nextDrivers);
    showToast(`Shift status updated to ${status}`);
    const d = drivers.find(x => x.id === driverId);
    addAuditLog('Operator Duty Shift', `Driver ${d?.name} changed status to ${status}`, 'var(--purple)');
    saveAllData(vehicles, nextDrivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // Driver-specific routing block
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'driver') {
        setCurrentPage('driver_dashboard');
      } else if (currentPage === 'driver_dashboard') {
        setCurrentPage('dashboard');
      }
    }
  }, [currentUser]);

  // 1. Vehicles Pipelines
  const handleAddVehicle = (payload: Omit<Vehicle, 'id' | 'gps' | 'docs' | 'costYTD'> & { docs?: VehicleDocs }) => {
    const nextId = vehicles.length ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
    const newVeh: Vehicle = {
      ...payload,
      id: nextId,
      gps: {
        x: Math.floor(Math.random() * 60) + 15,
        y: Math.floor(Math.random() * 60) + 15,
        speed: 0,
        lastPing: new Date().toISOString(),
        online: Math.random() > 0.3
      },
      docs: payload.docs || {
        insurance: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        registration: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        inspection: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      costYTD: 0
    };

    const nextVehicles = [newVeh, ...vehicles];
    setVehicles(nextVehicles);
    showToast(`Vehicle ${newVeh.make} ${newVeh.model} registered under ${newVeh.fleet}`);
    
    // Audit Log
    addAuditLog('Vehicle Added', `${newVeh.make} ${newVeh.model} (${newVeh.fleet}) registered successfully`, 'var(--accent2)');
    saveAllData(nextVehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleEditVehicle = (id: number, payload: Partial<Vehicle>) => {
    const nextVehicles = vehicles.map(v => v.id === id ? { ...v, ...payload } : v);
    setVehicles(nextVehicles);
    showToast('Vehicle configuration updated');

    const v = vehicles.find(x => x.id === id);
    addAuditLog('Vehicle Modified', `${v?.make} ${v?.model} (${v?.fleet}) profile updated`, 'var(--purple)');
    saveAllData(nextVehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleDeleteVehicle = (id: number) => {
    const target = vehicles.find(v => v.id === id);
    const nextVehicles = vehicles.filter(v => v.id !== id);
    setVehicles(nextVehicles);

    // Unassign related drivers
    const nextDrivers = drivers.map(d => d.vehicleId === id ? { ...d, vehicleId: null } : d);
    setDrivers(nextDrivers);

    showToast(`Vehicle ${target?.fleet} removed from database`, 'info');
    addAuditLog('Vehicle Removed', `${target?.make} ${target?.model} (${target?.fleet}) permanently deleted`, 'var(--red)');
    dbDeleteDoc('vehicles', id.toString(), currentUser?.org);
    saveAllData(nextVehicles, nextDrivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // 2. Relocations / Transfers Pipelines
  const handleAddTransfer = (payload: Omit<Transfer, 'id' | 'status' | 'approvedBy' | 'createdAt' | 'completedAt'>) => {
    const nextId = transfers.length ? Math.max(...transfers.map(t => t.id)) + 1 : 1;
    const isAuto = settings.autoApprove;

    const newTransfer: Transfer = {
      ...payload,
      id: nextId,
      status: isAuto ? 'completed' : 'pending',
      approvedBy: isAuto ? 'Auto-Approve Engine' : null,
      createdAt: new Date().toISOString(),
      completedAt: isAuto ? new Date().toISOString() : null
    };

    const nextTransfers = [newTransfer, ...transfers];
    setTransfers(nextTransfers);

    let nextVehicles = vehicles;
    if (isAuto) {
      nextVehicles = vehicles.map(v => v.id === payload.vehicleId ? { ...v, ccId: payload.toCcId } : v);
      setVehicles(nextVehicles);
    }

    showToast(isAuto ? 'Transfer approved instantly via auto-rule' : 'Relocation request filed for approval', 'info');
    
    const v = vehicles.find(x => x.id === payload.vehicleId);
    addAuditLog('Transfer Registered', `${v?.make} ${v?.model} reloc request registered to target CC`, 'var(--amber)');
    saveAllData(nextVehicles, drivers, costCenters, nextTransfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleApproveTransfer = (id: number, approver: string) => {
    const target = transfers.find(t => t.id === id);
    if (!target) return;

    const nextTransfers = transfers.map(t => t.id === id ? { 
      ...t, 
      status: 'completed' as const, 
      approvedBy: approver, 
      completedAt: new Date().toISOString() 
    } : t);
    setTransfers(nextTransfers);

    // Apply the actual CC change on the vehicle
    const nextVehicles = vehicles.map(v => v.id === target.vehicleId ? { ...v, ccId: target.toCcId } : v);
    setVehicles(nextVehicles);

    showToast('Relocation transfer approved and applied');
    const v = vehicles.find(x => x.id === target.vehicleId);
    addAuditLog('Transfer Approved', `${v?.make} ${v?.model} relocation was signed off by ${approver}`, 'var(--green)');
    saveAllData(nextVehicles, drivers, costCenters, nextTransfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleCancelTransfer = (id: number) => {
    const target = transfers.find(t => t.id === id);
    if (!target) return;

    const nextTransfers = transfers.map(t => t.id === id ? { ...t, status: 'cancelled' as const } : t);
    setTransfers(nextTransfers);

    showToast('Transfer relocation cancelled', 'error');
    const v = vehicles.find(x => x.id === target.vehicleId);
    addAuditLog('Transfer Cancelled', `${v?.make} ${v?.model} relocation was cancelled or declined`, 'var(--red)');
    saveAllData(vehicles, drivers, costCenters, nextTransfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // 3. Maintenance workshop pipelines
  const handleAddMaintenance = (payload: Omit<Maintenance, 'id' | 'status' | 'completedDate' | 'actualCost'>) => {
    const nextId = maintenance.length ? Math.max(...maintenance.map(m => m.id)) + 1 : 1;
    const newMaint: Maintenance = {
      ...payload,
      id: nextId,
      status: 'scheduled',
      completedDate: null,
      actualCost: null
    };

    const nextMaint = [newMaint, ...maintenance];
    setMaintenance(nextMaint);

    // Update vehicle status state to maintenance if critical
    let nextVehicles = vehicles;
    if (payload.priority === 'critical' || payload.priority === 'high') {
      nextVehicles = vehicles.map(v => v.id === payload.vehicleId ? { ...v, status: 'maintenance' as const } : v);
      setVehicles(nextVehicles);
    }

    showToast('Maintenance scheduled inside Workshop logs');
    const v = vehicles.find(x => x.id === payload.vehicleId);
    addAuditLog('Service Scheduled', `Scheduled repair on ${v?.make} ${v?.model}: ${payload.type}`, 'var(--amber)');
    saveAllData(nextVehicles, drivers, costCenters, transfers, nextMaint, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleCompleteMaintenance = (id: number, cost: number) => {
    const target = maintenance.find(m => m.id === id);
    if (!target) return;

    const nextMaint = maintenance.map(m => m.id === id ? { 
      ...m, 
      status: 'completed' as const, 
      completedDate: new Date().toISOString().split('T')[0],
      actualCost: cost
    } : m);
    setMaintenance(nextMaint);

    // Re-assign vehicle back to available if it was in workshop
    const nextVehicles = vehicles.map(v => v.id === target.vehicleId ? { ...v, status: 'available' as const } : v);
    setVehicles(nextVehicles);

    // Charge the cost center spend
    const targetCcId = vehicles.find(v => v.id === target.vehicleId)?.ccId;
    let nextCCs = costCenters;
    if (targetCcId) {
      nextCCs = costCenters.map(cc => cc.id === targetCcId ? { ...cc, spent: cc.spent + cost } : cc);
      setCostCenters(nextCCs);
    }

    showToast('Workshop repair item marked as COMPLETED');
    const v = vehicles.find(x => x.id === target.vehicleId);
    addAuditLog('Service Completed', `Repair complete on ${v?.make} ${v?.model} (${cost} cost loaded to CC)`, 'var(--green)');
    saveAllData(nextVehicles, drivers, nextCCs, transfers, nextMaint, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleDeleteMaintenance = (id: number) => {
    const target = maintenance.find(m => m.id === id);
    const nextMaint = maintenance.filter(m => m.id !== id);
    setMaintenance(nextMaint);

    showToast('Servicing log deleted', 'info');
    const v = vehicles.find(x => x.id === target?.vehicleId);
    addAuditLog('Service Log Removed', `Deleted repair entry for ${v?.make} ${v?.model}`, 'var(--red)');
    dbDeleteDoc('maintenance', id.toString(), currentUser?.org);
    saveAllData(vehicles, drivers, costCenters, transfers, nextMaint, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // 4. Operator Drivers Pipelines
  const handleAddDriver = (payload: Omit<Driver, 'id' | 'trips'>) => {
    const nextId = drivers.length ? Math.max(...drivers.map(d => d.id)) + 1 : 1;
    const newDriver: Driver = {
      ...payload,
      id: nextId,
      trips: 0
    };

    const nextDrivers = [newDriver, ...drivers];
    setDrivers(nextDrivers);

    // Update vehicle's assigned driver as well
    let nextVehicles = vehicles;
    if (payload.vehicleId) {
      nextVehicles = vehicles.map(v => v.id === payload.vehicleId ? { ...v, driverId: nextId } : v);
      setVehicles(nextVehicles);
    }

    showToast(`Driver ${newDriver.name} registered on duty`);
    addAuditLog('Operator Registered', `Licensed driver ${newDriver.name} added to roster`, 'var(--accent2)');
    saveAllData(nextVehicles, nextDrivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleEditDriver = (id: number, payload: Partial<Driver>) => {
    const nextDrivers = drivers.map(d => d.id === id ? { ...d, ...payload } : d);
    setDrivers(nextDrivers);

    // If driver's vehicle assignments are updated, update vehicle as well
    let nextVehicles = vehicles;
    if (payload.vehicleId !== undefined) {
      // Clear old vehicle with this driver
      nextVehicles = vehicles.map(v => v.driverId === id ? { ...v, driverId: null } : v);
      // Assign new vehicle
      if (payload.vehicleId !== null) {
        nextVehicles = nextVehicles.map(v => v.id === payload.vehicleId ? { ...v, driverId: id } : v);
      }
      setVehicles(nextVehicles);
    }

    showToast('Driver configuration updated');
    const d = drivers.find(x => x.id === id);
    addAuditLog('Operator Updated', `Modified operator dossier for ${d?.name}`, 'var(--purple)');
    saveAllData(nextVehicles, nextDrivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleDeleteDriver = (id: number) => {
    const target = drivers.find(d => d.id === id);
    const nextDrivers = drivers.filter(d => d.id !== id);
    setDrivers(nextDrivers);

    // Clear driver assignments in vehicles
    const nextVehicles = vehicles.map(v => v.driverId === id ? { ...v, driverId: null } : v);
    setVehicles(nextVehicles);

    showToast(`Driver ${target?.name} removed from active roster`, 'info');
    addAuditLog('Operator Retired', `Retired driver ${target?.name} and updated vehicle links`, 'var(--red)');
    dbDeleteDoc('drivers', id.toString(), currentUser?.org);
    saveAllData(nextVehicles, nextDrivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // 5. Cost center setups
  const handleAddCostCenter = (payload: Omit<CostCenter, 'id'>) => {
    const nextId = costCenters.length ? Math.max(...costCenters.map(c => c.id)) + 1 : 1;
    const newCC: CostCenter = {
      ...payload,
      id: nextId
    };

    const nextCCs = [...costCenters, newCC];
    setCostCenters(nextCCs);

    showToast(`Cost center ${newCC.name} successfully created`);
    addAuditLog('CC Created', `Established cost center ${newCC.name} (${newCC.code}) with budget ${newCC.budget}`, 'var(--accent2)');
    saveAllData(vehicles, drivers, nextCCs, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleEditCostCenter = (id: number, payload: Partial<CostCenter>) => {
    const nextCCs = costCenters.map(cc => cc.id === id ? { ...cc, ...payload } : cc);
    setCostCenters(nextCCs);

    showToast('Cost center parameters modified');
    const cc = costCenters.find(x => x.id === id);
    addAuditLog('CC Parameters Updated', `Modified configurations for ${cc?.name}`, 'var(--purple)');
    saveAllData(vehicles, drivers, nextCCs, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  const handleDeleteCostCenter = (id: number) => {
    const target = costCenters.find(cc => cc.id === id);
    if (vehicles.some(v => v.ccId === id)) {
      showToast('Cannot delete — Active vehicles remain assigned to this center.', 'error');
      return;
    }

    const nextCCs = costCenters.filter(cc => cc.id !== id);
    setCostCenters(nextCCs);

    showToast(`Cost center ${target?.name} deleted`, 'info');
    addAuditLog('CC Deleted', `Permanently removed cost center ${target?.name} (${target?.code})`, 'var(--red)');
    dbDeleteDoc('costCenters', id.toString(), currentUser?.org);
    saveAllData(vehicles, drivers, nextCCs, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // 6. Security profile users management
  const handleToggleUserSuspended = async (id: number) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
    setUsers(updatedUsers);
    
    const u = users.find(x => x.id === id);
    showToast(u?.active ? `Suspended account access for ${u.firstName}` : `Activated account for ${u?.firstName}`);
    addAuditLog('Security Tier Action', `Toggled suspension state for ${u?.firstName} ${u?.lastName}`, 'var(--amber)');

    if (u) {
      try {
        await dbSetDoc('users', u.email.toLowerCase(), { ...u, active: !u.active });
      } catch (e) {
        console.error("Failed to sync user status update to Firestore", e);
      }
    }
  };

  const handleAddUser = async (payload: Omit<User, 'id' | 'createdAt' | 'color' | 'active'>) => {
    const newUser: User = {
      ...payload,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      color: '#9b59b6',
      active: true
    };
    setUsers([...users, newUser]);
    showToast(`User ${newUser.firstName} invited to team!`);
    addAuditLog('Security Tier Added', `Invited staff credentials for ${newUser.firstName} ${newUser.lastName}`, 'var(--green)');

    try {
      await dbSetDoc('users', newUser.email.toLowerCase(), newUser);
    } catch (e) {
      console.error("Failed to add user to global Firestore collection", e);
    }
  };

  const handleDeleteUser = async (id: number) => {
    const target = users.find(u => u.id === id);
    setUsers(users.filter(u => u.id !== id));
    showToast(`User account deleted`, 'info');
    addAuditLog('Security Tier Removed', `Permanently removed credential access for ${target?.firstName} ${target?.lastName}`, 'var(--red)');

    if (target) {
      try {
        await dbDeleteDoc('users', target.email.toLowerCase());
      } catch (e) {
        console.error("Failed to remove user from global Firestore collection", e);
      }
    }
  };

  // 7. General settings overrides
  const handleUpdateSettings = (payload: Partial<Settings>) => {
    const nextSettings = { ...settings, ...payload };
    setSettings(nextSettings);
    showToast('Platform parameters saved successfully');
    saveAllData(vehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, nextSettings, dismissedOnboarding);
  };

  // Document renewals
  const handleRenewDocument = (vehicleId: number, type: 'insurance' | 'registration' | 'inspection', newDate: string) => {
    const nextVehicles = vehicles.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          docs: {
            ...v.docs,
            [type]: newDate
          }
        };
      }
      return v;
    });

    setVehicles(nextVehicles);
    showToast(`Successfully renewed ${type.toUpperCase()} paper!`);
    const v = vehicles.find(x => x.id === vehicleId);
    addAuditLog('Document Renewed', `Extended ${type.toUpperCase()} compliance date for ${v?.fleet} to ${newDate}`, 'var(--green)');
    saveAllData(nextVehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
  };

  // Bulk Importing engine
  const handleBulkImport = (type: 'vehicles' | 'costcenters' | 'drivers', parsedList: any[]) => {
    let imported = 0;
    let skipped = 0;

    if (type === 'vehicles') {
      const addedVehicles: Vehicle[] = [];
      parsedList.forEach(row => {
        const duplicate = vehicles.some(v => v.plate.toLowerCase() === (row.plate || '').toLowerCase());
        if (duplicate) {
          skipped++;
          return;
        }

        const nextIdValue = vehicles.length + addedVehicles.length + 1;
        const newV: Vehicle = {
          id: nextIdValue,
          make: row.make || 'Toyota',
          model: row.model || 'Commercial',
          year: parseInt(row.year) || 2024,
          plate: (row.plate || `PL-${Date.now()}`).toUpperCase(),
          vin: row.vin || `VIN-${Date.now()}-${imported}`,
          fleet: (row.fleet || `FL-${String(nextIdValue).padStart(3, '0')}`).toUpperCase(),
          status: (row.status || 'available') as any,
          ccId: null,
          mileage: parseInt(row.mileage) || 0,
          fuel: row.fuel || 'diesel',
          type: row.type || 'truck',
          driverId: null,
          lastService: '',
          nextService: '',
          notes: row.notes || 'Bulk imported item',
          gps: {
            x: Math.floor(Math.random() * 60) + 15,
            y: Math.floor(Math.random() * 60) + 15,
            speed: 0,
            lastPing: new Date().toISOString(),
            online: true
          },
          docs: {
            insurance: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            registration: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            inspection: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          costYTD: 0,
          trips: parseInt(row.trips) || 0
        };
        addedVehicles.push(newV);
        imported++;
      });

      const nextVehicles = [...addedVehicles, ...vehicles];
      setVehicles(nextVehicles);
      addAuditLog('Bulk Ingestion', `Imported ${imported} vehicles via CSV pipeline`, 'var(--accent2)');
      saveAllData(nextVehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);

    } else if (type === 'costcenters') {
      const addedCCs: CostCenter[] = [];
      parsedList.forEach(row => {
        const duplicate = costCenters.some(c => c.code.toLowerCase() === (row.code || '').toLowerCase());
        if (duplicate) {
          skipped++;
          return;
        }

        const newCC: CostCenter = {
          id: costCenters.length + addedCCs.length + 1,
          name: row.name || 'Operations Unit',
          code: (row.code || 'OPS-MOCK').toUpperCase(),
          desc: row.desc || 'Bulk imported cost center',
          active: row.active !== 'false',
          budget: parseFloat(row.budget) || 40000,
          spent: parseFloat(row.spent) || 0
        };
        addedCCs.push(newCC);
        imported++;
      });

      const nextCCs = [...costCenters, ...addedCCs];
      setCostCenters(nextCCs);
      addAuditLog('Bulk Ingestion', `Imported ${imported} cost centers via CSV pipeline`, 'var(--accent2)');
      saveAllData(vehicles, drivers, nextCCs, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);

    } else if (type === 'drivers') {
      const addedDrivers: Driver[] = [];
      parsedList.forEach(row => {
        const duplicate = drivers.some(d => d.license.toLowerCase() === (row.license || '').toLowerCase());
        if (duplicate) {
          skipped++;
          return;
        }

        const newD: Driver = {
          id: drivers.length + addedDrivers.length + 1,
          name: row.name || 'Operator name',
          license: (row.license || 'DL-TEMP').toUpperCase(),
          phone: row.phone || '',
          email: (row.email || 'operator@company.sa').toLowerCase(),
          status: (row.status || 'active') as any,
          vehicleId: null,
          joinDate: row.joinDate || new Date().toISOString().split('T')[0],
          trips: 0,
          color: '#4f8ef7'
        };
        addedDrivers.push(newD);
        imported++;
      });

      const nextDrivers = [...addedDrivers, ...drivers];
      setDrivers(nextDrivers);
      addAuditLog('Bulk Ingestion', `Imported ${imported} operator profiles via CSV pipeline`, 'var(--accent2)');
      saveAllData(vehicles, nextDrivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, dismissedOnboarding);
    }

    showToast(`Bulk file imported successfully. ${imported} profiles ingested, ${skipped} skipped.`, 'success');
  };

  const handleResetData = () => {
    localStorage.removeItem(PERSIST_KEY);
    localStorage.removeItem('fleet_ops_users_v31');
    localStorage.removeItem('fleet_ops_current_user_v31');
    showToast('Platform reset to original blueprint seed. Page reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Mark all unread alarms as read
  const handleMarkAllRead = () => {
    const nextNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(nextNotifs);
    showToast('Notifications marked as read');
    saveAllData(vehicles, drivers, costCenters, transfers, maintenance, nextNotifs, auditLogs, settings, dismissedOnboarding);
  };

  const handleDismissOnboarding = () => {
    setDismissedOnboarding(true);
    saveAllData(vehicles, drivers, costCenters, transfers, maintenance, notifications, auditLogs, settings, true);
  };

  // Nav mapping list helper
  const isViewer = currentUser?.role === 'viewer';

  // --- AUTH ROUTER GUARD ---
  if (!currentUser) {
    return <AuthScreen users={users} onLogin={handleLogin} onSignup={handleSignup} />;
  }

  // Active page selection rendering
  const renderActiveView = () => {
    switch (currentPage) {
      case 'driver_dashboard':
        return (
          <DriverDashboardView 
            currentUser={currentUser}
            vehicles={vehicles}
            drivers={drivers}
            costCenters={costCenters}
            transfers={transfers}
            maintenance={maintenance}
            onUpdateVehicleMileage={handleUpdateVehicleMileage}
            onAddMaintenance={handleAddMaintenance}
            onAddTransfer={handleAddTransfer}
            onUpdateDriverStatus={handleUpdateDriverStatus}
            currency={settings.currency}
            distUnit={settings.distUnit}
          />
        );
      case 'dashboard':
        return (
          <DashboardView 
            vehicles={vehicles}
            transfers={transfers}
            maintenance={maintenance}
            costCenters={costCenters}
            dismissedOnboarding={dismissedOnboarding}
            onDismissOnboarding={handleDismissOnboarding}
            onNavigate={(page) => setCurrentPage(page)}
            currency={settings.currency}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            vehicles={vehicles}
            costCenters={costCenters}
            drivers={drivers}
            maintenance={maintenance}
            currency={settings.currency}
          />
        );
      case 'fleet':
        return (
          <FleetView 
            vehicles={vehicles}
            drivers={drivers}
            costCenters={costCenters}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            userRole={currentUser.role}
            currency={settings.currency}
          />
        );
      case 'tracking':
        return <TrackingView vehicles={vehicles} drivers={drivers} />;
      case 'transfers':
        return (
          <TransfersView 
            transfers={transfers}
            vehicles={vehicles}
            costCenters={costCenters}
            onAddTransfer={handleAddTransfer}
            onApproveTransfer={handleApproveTransfer}
            onCancelTransfer={handleCancelTransfer}
            userRole={currentUser.role}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceView 
            maintenance={maintenance}
            vehicles={vehicles}
            onAddMaintenance={handleAddMaintenance}
            onCompleteMaintenance={handleCompleteMaintenance}
            onDeleteMaintenance={handleDeleteMaintenance}
            userRole={currentUser.role}
            currency={settings.currency}
          />
        );
      case 'compliance':
        return (
          <ComplianceView 
            vehicles={vehicles}
            drivers={drivers}
            onRenewDocument={handleRenewDocument}
            userRole={currentUser.role}
          />
        );
      case 'drivers':
        return (
          <DriversAndCCView 
            viewType="drivers"
            drivers={drivers}
            costCenters={costCenters}
            vehicles={vehicles}
            onAddDriver={handleAddDriver}
            onEditDriver={handleEditDriver}
            onDeleteDriver={handleDeleteDriver}
            onAddCostCenter={handleAddCostCenter}
            onEditCostCenter={handleEditCostCenter}
            onDeleteCostCenter={handleDeleteCostCenter}
            userRole={currentUser.role}
            currency={settings.currency}
          />
        );
      case 'costcenters':
        return (
          <DriversAndCCView 
            viewType="costcenters"
            drivers={drivers}
            costCenters={costCenters}
            vehicles={vehicles}
            onAddDriver={handleAddDriver}
            onEditDriver={handleEditDriver}
            onDeleteDriver={handleDeleteDriver}
            onAddCostCenter={handleAddCostCenter}
            onEditCostCenter={handleEditCostCenter}
            onDeleteCostCenter={handleDeleteCostCenter}
            userRole={currentUser.role}
            currency={settings.currency}
          />
        );
      case 'users':
        return (
          <AdminAndAuditView 
            viewType="users"
            users={users}
            auditLogs={auditLogs}
            onToggleUserSuspended={handleToggleUserSuspended}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        );
      case 'auditlog':
        return (
          <AdminAndAuditView 
            viewType="auditlog"
            users={users}
            auditLogs={auditLogs}
            onToggleUserSuspended={handleToggleUserSuspended}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        );
      case 'billing':
        return (
          <BillingPortal 
            subscription={subscription}
            onUpdateSubscription={handleUpdateSubscription}
            currentUser={currentUser}
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            currentUser={currentUser}
            vehiclesCount={vehicles.length}
            driversCount={drivers.length}
            usersCount={users.length}
            transfersCount={transfers.length}
            onResetData={handleResetData}
            vehicles={vehicles}
            drivers={drivers}
            costCenters={costCenters}
            transfers={transfers}
            maintenance={maintenance}
            auditLogs={auditLogs}
          />
        );
      default:
        return <div className="text-center py-10">Page under construction</div>;
    }
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0b0d14] text-[#e2e5f3] flex flex-col md:flex-row relative">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#12151f] border-r border-[#252a3d] flex flex-col justify-between transform transition-transform duration-200 md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Logo Frame */}
          <div className="flex items-center gap-3 p-5 border-b border-[#252a3d]">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4f8ef7] to-[#7b5ea7] rounded-xl flex items-center justify-center shadow-lg shadow-[#4f8ef7]/20 shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white leading-none">Fleet<span className="text-[#7aaeff]">Ops</span></div>
              <span className="text-[10px] text-[#555e84] font-semibold font-mono tracking-wide mt-1 block">v3.1 Pro Control</span>
            </div>
          </div>

          {/* Navigation items lists */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[70vh] scrollbar-thin">
            {currentUser.role === 'driver' ? (
              <>
                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider px-3 block mb-1">Driver Portal</span>
                {[
                  { id: 'driver_dashboard', label: 'My Dashboard', icon: LayoutDashboard },
                  { id: 'tracking', label: 'Telemetry Map', icon: Compass },
                  { id: 'compliance', label: 'Compliance Docs', icon: ShieldCheck }
                ].map(navItem => {
                  const Icon = navItem.icon;
                  const isActive = currentPage === navItem.id;
                  return (
                    <button
                      key={navItem.id}
                      onClick={() => { setCurrentPage(navItem.id); setMobileSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition border ${isActive ? 'bg-[#4f8ef7]/10 border-[#4f8ef7]/20 text-[#7aaeff]' : 'bg-transparent border-transparent hover:bg-[#181c29] text-[#8b92b8] hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{navItem.label}</span>
                    </button>
                  );
                })}

                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider px-3 block pt-4 mb-1">Administration</span>
                {[
                  { id: 'settings', label: 'Configurations', icon: SettingsIcon }
                ].map(navItem => {
                  const Icon = navItem.icon;
                  const isActive = currentPage === navItem.id;
                  return (
                    <button
                      key={navItem.id}
                      onClick={() => { setCurrentPage(navItem.id); setMobileSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition border ${isActive ? 'bg-[#4f8ef7]/10 border-[#4f8ef7]/20 text-[#7aaeff]' : 'bg-transparent border-transparent hover:bg-[#181c29] text-[#8b92b8] hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{navItem.label}</span>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider px-3 block mb-1">Operations</span>
                
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'analytics', label: 'Analytics Insights', icon: BarChart3 },
                  { id: 'fleet', label: 'Fleet Register', icon: Truck },
                  { id: 'tracking', label: 'Telemetry Map', icon: Compass },
                  { id: 'transfers', label: 'Relocations', icon: ArrowLeftRight, badge: transfers.filter(t=>t.status==='pending').length },
                  { id: 'maintenance', label: 'Workshop Jobs', icon: Wrench, badge: maintenance.filter(m=>m.status==='scheduled'||m.status==='in_progress').length, badgeColor: 'bg-[#f39c12]' },
                  { id: 'compliance', label: 'Compliance Docs', icon: ShieldCheck }
                ].map(navItem => {
                  const Icon = navItem.icon;
                  const isActive = currentPage === navItem.id;
                  return (
                    <button
                      key={navItem.id}
                      onClick={() => { setCurrentPage(navItem.id); setMobileSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition border ${isActive ? 'bg-[#4f8ef7]/10 border-[#4f8ef7]/20 text-[#7aaeff]' : 'bg-transparent border-transparent hover:bg-[#181c29] text-[#8b92b8] hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{navItem.label}</span>
                      {navItem.badge && navItem.badge > 0 ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0 ${navItem.badgeColor || 'bg-[#e74c3c]'}`}>
                          {navItem.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider px-3 block pt-4 mb-1">Dossiers</span>
                
                {[
                  { id: 'drivers', label: 'Operators', icon: Users },
                  { id: 'costcenters', label: 'Cost Centers', icon: FolderKanban }
                ].map(navItem => {
                  const Icon = navItem.icon;
                  const isActive = currentPage === navItem.id;
                  return (
                    <button
                      key={navItem.id}
                      onClick={() => { setCurrentPage(navItem.id); setMobileSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition border ${isActive ? 'bg-[#4f8ef7]/10 border-[#4f8ef7]/20 text-[#7aaeff]' : 'bg-transparent border-transparent hover:bg-[#181c29] text-[#8b92b8] hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{navItem.label}</span>
                    </button>
                  );
                })}

                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider px-3 block pt-4 mb-1">Administration</span>
                
                {[
                  { id: 'users', label: 'Security Profiles', icon: Users, adminOnly: true },
                  { id: 'auditlog', label: 'Audit Trail', icon: Clock },
                  { id: 'billing', label: 'Stripe Billing', icon: CreditCard },
                  { id: 'settings', label: 'Configurations', icon: SettingsIcon }
                ].map(navItem => {
                  if (navItem.adminOnly && currentUser.role !== 'admin') return null;
                  const Icon = navItem.icon;
                  const isActive = currentPage === navItem.id;
                  return (
                    <button
                      key={navItem.id}
                      onClick={() => { setCurrentPage(navItem.id); setMobileSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition border ${isActive ? 'bg-[#4f8ef7]/10 border-[#4f8ef7]/20 text-[#7aaeff]' : 'bg-transparent border-transparent hover:bg-[#181c29] text-[#8b92b8] hover:text-white'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{navItem.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        {/* User Card inside Sidebar */}
        <div className="p-3 border-t border-[#252a3d]">
          <div className="bg-[#181c29] border border-[#252a3d] hover:border-[#313757] rounded-xl p-3 flex items-center gap-3 relative group">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
              style={{ background: `linear-gradient(135deg, ${currentUser.color || '#4f8ef7'}, #7b5ea7)` }}
            >
              {(currentUser.firstName[0] || '') + (currentUser.lastName[0] || '')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser.firstName} {currentUser.lastName}</div>
              <span className="text-[9px] text-[#555e84] uppercase tracking-wider font-bold block mt-0.5">{currentUser.role} Level</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-[#555e84] hover:text-[#e74c3c] p-1.5 hover:bg-[#252a3d] rounded-lg transition"
              title="Sign Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#0b0d14]/80 backdrop-blur-sm md:hidden" 
        />
      )}

      {/* 2. MAIN HUB WORKSPACE */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen pb-16 md:pb-0">
        
        {/* TOP COCKPIT BAR */}
        <header className="sticky top-0 z-20 h-14 bg-[#12151f] border-b border-[#252a3d] px-4 md:px-6 flex items-center justify-between gap-4">
          
          {/* Left panel Mobile items */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 hover:bg-[#181c29] border border-[#252a3d] rounded-lg text-[#8b92b8] md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider capitalize">{currentPage.replace('_', ' ')} Control</div>
              <span className="text-[10px] text-[#555e84] font-semibold hidden md:inline-block">Logged in under {settings.companyName}</span>
            </div>
          </div>

          {/* Right panel Cockpit tools */}
          <div className="flex items-center gap-2">
            
            {/* CSV Bulk parsing trigger */}
            {['fleet', 'costcenters', 'drivers'].includes(currentPage) && !isViewer && (
              <button 
                onClick={() => setIsBulkOpen(true)}
                className="hidden md:flex bg-[#f39c12]/10 hover:bg-[#f39c12]/20 border border-[#f39c12]/30 text-[#f39c12] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Bulk Import
              </button>
            )}

            {/* Notification center */}
            <div className="relative">
              <button 
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                className={`p-2 rounded-lg border transition ${unreadNotifsCount > 0 ? 'bg-[#4f8ef7]/10 border-[#4f8ef7]/30 text-[#7aaeff]' : 'bg-transparent border-[#252a3d] text-[#8b92b8] hover:text-white'}`}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e74c3c]" />
                )}
              </button>

              {/* NOTIFICATION FLOATING CONTAINER */}
              <AnimatePresence>
                {notifPanelOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-72 bg-[#12151f] border border-[#252a3d] rounded-xl p-4 shadow-2xl space-y-3 z-50 text-xs"
                  >
                    <div className="flex justify-between items-center border-b border-[#252a3d] pb-2">
                      <span className="font-bold text-white">System notifications</span>
                      {unreadNotifsCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-[#7aaeff] hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-[#555e84]">All logs are clear.</div>
                      ) : (
                        notifications.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
                              setNotifications(updated);
                              saveAllData(vehicles, drivers, costCenters, transfers, maintenance, updated, auditLogs, settings, dismissedOnboarding);
                            }}
                            className={`p-2.5 rounded-lg border transition cursor-pointer ${item.read ? 'bg-transparent border-[#252a3d] text-[#8b92b8]' : 'bg-[#4f8ef7]/5 border-[#4f8ef7]/20 text-white'}`}
                          >
                            <div className="font-semibold">{item.title}</div>
                            <p className="text-[10px] text-[#8b92b8] leading-normal mt-0.5">{item.msg}</p>
                            <span className="text-[9px] text-[#555e84] mt-1 block font-mono">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </header>

        {/* WORKSPACE PAGES VIEW WRAPPER */}
        <main className="p-4 md:p-6 flex-1 max-w-7xl w-full mx-auto">
          {isBillingBlocked() && currentPage !== 'billing' ? (
            <div className="bg-[#12151f] border border-red-500/20 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 mt-8 shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">SaaS Trial Expired / Subscription Required</h3>
                <p className="text-xs text-[#8b92b8] leading-relaxed">
                  Your billing or operational trial period has expired for organization <span className="text-white font-bold">{currentUser?.org}</span>. To unlock full tenant read/write capabilities on vehicle fleets, cost center logs, and active compliance dossiers, please upgrade to a subscription.
                </p>
              </div>
              <button
                onClick={() => setCurrentPage('billing')}
                className="w-full bg-gradient-to-r from-[#4f8ef7] to-[#7b5ea7] hover:from-[#7aaeff] hover:to-[#9b59b6] text-white py-3 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-[#4f8ef7]/10 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                Go to Stripe Billing Portal
              </button>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#12151f] border-t border-[#252a3d] py-1.5 px-3 md:hidden flex justify-around items-center">
        {[
          { id: 'dashboard', label: 'Cockpit', icon: LayoutDashboard },
          { id: 'fleet', label: 'Fleet', icon: Truck },
          { id: 'tracking', label: 'Live Map', icon: Compass },
          { id: 'transfers', label: 'Relocate', icon: ArrowLeftRight }
        ].map(bItem => {
          const Icon = bItem.icon;
          const isActive = currentPage === bItem.id;
          return (
            <button
              key={bItem.id}
              onClick={() => { setCurrentPage(bItem.id); setMobileMoreMenuOpen(false); }}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold transition ${isActive ? 'text-[#7aaeff]' : 'text-[#555e84] hover:text-[#8b92b8]'}`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{bItem.label}</span>
            </button>
          );
        })}

        {/* Mobile Toggle More options */}
        <div className="relative">
          <button 
            onClick={() => setMobileMoreMenuOpen(!mobileMoreMenuOpen)}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold transition ${['maintenance', 'compliance', 'drivers', 'costcenters', 'users', 'settings', 'auditlog'].includes(currentPage) ? 'text-[#7aaeff]' : 'text-[#555e84]'}`}
          >
            <Menu className="w-4.5 h-4.5" />
            <span>More</span>
          </button>

          {/* More actions overlay popup */}
          <AnimatePresence>
            {mobileMoreMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full right-0 mb-2 w-48 bg-[#12151f] border border-[#252a3d] rounded-xl overflow-hidden shadow-2xl py-1 z-50 text-xs"
              >
                {[
                  { id: 'maintenance', label: 'Workshop Reps', icon: Wrench },
                  { id: 'compliance', label: 'Doc Compliance', icon: ShieldCheck },
                  { id: 'drivers', label: 'Operators list', icon: Users },
                  { id: 'costcenters', label: 'Cost Centers', icon: FolderKanban },
                  { id: 'auditlog', label: 'Operation Logs', icon: Clock },
                  { id: 'settings', label: 'Configurations', icon: SettingsIcon }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setCurrentPage(item.id); setMobileMoreMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-[#181c29] flex items-center gap-2.5 transition ${isActive ? 'text-[#7aaeff] bg-[#4f8ef7]/5' : 'text-[#8b92b8]'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* 4. FLOATING SYSTEM TOAST MESSAGES */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border text-xs text-white max-w-sm flex items-center gap-2.5 bg-[#12151f] ${t.type === 'error' ? 'border-[#e74c3c]/30' : t.type === 'info' ? 'border-[#4f8ef7]/30' : 'border-[#2ecc71]/30'}`}
          >
            <CheckCircle className={`w-4 h-4 shrink-0 ${t.type === 'error' ? 'text-[#e74c3c]' : t.type === 'info' ? 'text-[#7aaeff]' : 'text-[#2ecc71]'}`} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* 5. BULK CSV SYSTEM PARSER MODAL */}
      {isBulkOpen && (
        <BulkImportModal 
          onClose={() => setIsBulkOpen(false)} 
          onImport={handleBulkImport} 
          costCenters={costCenters}
        />
      )}

    </div>
  );
}
