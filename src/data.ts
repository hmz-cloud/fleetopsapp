import { Vehicle, CostCenter, Driver, Transfer, Maintenance, Notification, Settings, User, AuditLog } from './types';

export const defaultSettings: Settings = {
  currency: 'SAR',
  distUnit: 'km',
  companyName: 'Fleet Ops SA',
  emailAlerts: true,
  smsAlerts: false,
  autoApprove: false,
};

export const defaultCostCenters: CostCenter[] = [
  { id: 1, name: 'Operations North', code: 'OPS-N', desc: 'Northern regional operations', active: true, budget: 50000, spent: 34200 },
  { id: 2, name: 'Logistics South', code: 'LOG-S', desc: 'Southern distribution center', active: true, budget: 40000, spent: 28700 },
  { id: 3, name: 'Executive Fleet', code: 'EXC-F', desc: 'Senior management vehicles', active: true, budget: 30000, spent: 12400 },
  { id: 4, name: 'Field Services', code: 'FLD-S', desc: 'On-site field teams', active: true, budget: 25000, spent: 18900 },
];

export const defaultDrivers: Driver[] = [
  { id: 1, name: 'Ahmed Al-Rashid', license: 'DL-44821', phone: '+966-50-111-2233', email: 'ahmed@fleetops.sa', status: 'active', vehicleId: 1, joinDate: '2022-03-15', trips: 142, color: '#4f8ef7' },
  { id: 2, name: 'Sara Al-Malik', license: 'DL-55932', phone: '+966-55-234-5678', email: 'sara@fleetops.sa', status: 'active', vehicleId: 2, joinDate: '2021-07-01', trips: 287, color: '#9b59b6' },
  { id: 3, name: 'Omar Hassan', license: 'DL-66043', phone: '+966-54-345-6789', email: 'omar@fleetops.sa', status: 'active', vehicleId: 4, joinDate: '2023-01-10', trips: 98, color: '#1abc9c' },
  { id: 4, name: 'Khalid Al-Zahrani', license: 'DL-77154', phone: '+966-58-456-7890', email: 'khalid@fleetops.sa', status: 'on_leave', vehicleId: null, joinDate: '2022-09-05', trips: 211, color: '#f39c12' },
];

export const defaultVehicles: Vehicle[] = [
  {
    id: 1,
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2022,
    plate: 'ABC-1234',
    vin: '1HG001',
    fleet: 'FL-001',
    status: 'available',
    ccId: 1,
    mileage: 12400,
    fuel: 'diesel',
    type: 'suv',
    driverId: 1,
    lastService: '2025-12-01',
    nextService: '2026-06-01',
    notes: 'Executive reserve',
    gps: { x: 30, y: 35, speed: 0, lastPing: '2026-04-07T08:00:00Z', online: true },
    docs: { insurance: '2026-12-01', registration: '2026-09-15', inspection: '2026-08-01' },
    costYTD: 4200,
    trips: 142
  },
  {
    id: 2,
    make: 'Ford',
    model: 'Transit',
    year: 2023,
    plate: 'DEF-5678',
    vin: '1HG002',
    fleet: 'FL-002',
    status: 'in_use',
    ccId: 2,
    mileage: 8700,
    fuel: 'diesel',
    type: 'van',
    driverId: 2,
    lastService: '2025-11-15',
    nextService: '2026-05-15',
    notes: '',
    gps: { x: 62, y: 48, speed: 54, lastPing: '2026-04-07T09:14:00Z', online: true },
    docs: { insurance: '2026-10-01', registration: '2026-07-20', inspection: '2026-06-15' },
    costYTD: 6800,
    trips: 287
  },
  {
    id: 3,
    make: 'Mitsubishi',
    model: 'L200',
    year: 2021,
    plate: 'GHI-9012',
    vin: '1HG003',
    fleet: 'FL-003',
    status: 'maintenance',
    ccId: 1,
    mileage: 31200,
    fuel: 'diesel',
    type: 'truck',
    driverId: null,
    lastService: '2025-09-01',
    nextService: '2026-03-01',
    notes: 'Engine belt replacement',
    gps: { x: 45, y: 62, speed: 0, lastPing: '2026-04-06T17:00:00Z', online: false },
    docs: { insurance: '2026-11-01', registration: '2026-06-20', inspection: '2026-05-30' },
    costYTD: 9100,
    trips: 165
  },
  {
    id: 4,
    make: 'Nissan',
    model: 'Patrol',
    year: 2023,
    plate: 'JKL-3456',
    vin: '1HG004',
    fleet: 'FL-004',
    status: 'available',
    ccId: 3,
    mileage: 4100,
    fuel: 'gasoline',
    type: 'suv',
    driverId: 3,
    lastService: '2026-01-10',
    nextService: '2026-07-15',
    notes: '',
    gps: { x: 72, y: 28, speed: 0, lastPing: '2026-04-07T07:30:00Z', online: true },
    docs: { insurance: '2027-01-15', registration: '2026-10-10', inspection: '2026-09-01' },
    costYTD: 2300,
    trips: 98
  },
  {
    id: 5,
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2022,
    plate: 'MNO-7890',
    vin: '1HG005',
    fleet: 'FL-005',
    status: 'available',
    ccId: 2,
    mileage: 19800,
    fuel: 'diesel',
    type: 'van',
    driverId: null,
    lastService: '2025-10-20',
    nextService: '2026-04-20',
    notes: 'Fridge unit maintenance',
    gps: { x: 38, y: 22, speed: 32, lastPing: '2026-04-07T09:10:00Z', online: true },
    docs: { insurance: '2026-09-01', registration: '2026-12-01', inspection: '2026-07-10' },
    costYTD: 5400,
    trips: 112
  },
  {
    id: 6,
    make: 'Toyota',
    model: 'Hilux',
    year: 2020,
    plate: 'PQR-1234',
    vin: '1HG006',
    fleet: 'FL-006',
    status: 'out_of_service',
    ccId: null,
    mileage: 67300,
    fuel: 'diesel',
    type: 'truck',
    driverId: null,
    lastService: '2025-07-01',
    nextService: '2025-12-01',
    notes: 'Brake parts awaited',
    gps: { x: 55, y: 75, speed: 0, lastPing: '2026-03-20T12:00:00Z', online: false },
    docs: { insurance: '2026-06-10', registration: '2026-06-05', inspection: '2026-05-15' },
    costYTD: 11200,
    trips: 340
  }
];

export const defaultTransfers: Transfer[] = [
  { id: 1, vehicleId: 2, fromCcId: 1, toCcId: 2, status: 'completed', reason: 'Project reassignment', reqBy: 'Ahmed Al-Rashid', approvedBy: 'Hassan Zarroug', createdAt: '2026-04-01T09:00:00Z', completedAt: '2026-04-02T14:00:00Z' },
  { id: 2, vehicleId: 4, fromCcId: 3, toCcId: 1, status: 'pending', reason: 'Maintenance rotation', reqBy: 'Hassan Zarroug', approvedBy: null, createdAt: '2026-04-03T14:30:00Z', completedAt: null },
  { id: 3, vehicleId: 1, fromCcId: 2, toCcId: 3, status: 'in_progress', reason: 'Executive requirement', reqBy: 'Sara Al-Malik', approvedBy: 'Hassan Zarroug', createdAt: '2026-04-04T11:00:00Z', completedAt: null },
];

export const defaultMaintenance: Maintenance[] = [
  { id: 1, vehicleId: 3, type: 'Brake System Repair', status: 'in_progress', priority: 'high', scheduledDate: '2026-04-10', completedDate: null, tech: 'Ali Hassan', estimatedCost: 1200, actualCost: null, notes: 'Full brake pad and disc replacement' },
  { id: 2, vehicleId: 6, type: 'Engine Overhaul', status: 'pending', priority: 'critical', scheduledDate: '2026-04-15', completedDate: null, tech: 'Mohammed Al-Ghamdi', estimatedCost: 5500, actualCost: null, notes: 'Major engine work due to compression loss' },
  { id: 3, vehicleId: 1, type: 'Routine Service A', status: 'scheduled', priority: 'low', scheduledDate: '2026-06-01', completedDate: null, tech: 'Ali Hassan', estimatedCost: 350, actualCost: null, notes: 'Oil, filters, and standard safety check' },
];

export const defaultNotifications: Notification[] = [
  { id: 1, title: 'Maintenance Due', msg: 'FL-006 (Toyota Hilux) is overdue for service.', type: 'warning', read: false, time: '2026-04-07T08:00:00Z' },
  { id: 2, title: 'Transfer Pending', msg: 'Nissan Patrol transfer awaits approval.', type: 'info', read: false, time: '2026-04-06T14:30:00Z' },
  { id: 3, title: 'Budget Alert', msg: 'Operations North at 68% of monthly budget.', type: 'warning', read: true, time: '2026-04-04T09:00:00Z' },
];

export const defaultUsers: User[] = [
  { id: 1, email: 'admin@fleetops.sa', password: 'admin123', firstName: 'Hassan', lastName: 'Zarroug', role: 'admin', org: 'Fleet Ops SA', createdAt: '2026-01-01', color: '#4f8ef7', active: true },
  { id: 2, email: 'manager@fleetops.sa', password: 'manager123', firstName: 'Sara', lastName: 'Al-Malik', role: 'manager', org: 'Fleet Ops SA', createdAt: '2026-01-01', color: '#9b59b6', active: true },
  { id: 3, email: 'viewer@fleetops.sa', password: 'viewer123', firstName: 'Omar', lastName: 'Hassan', role: 'viewer', org: 'Fleet Ops SA', createdAt: '2026-01-01', color: '#1abc9c', active: true },
  { id: 4, email: 'ahmed@fleetops.sa', password: 'driver123', firstName: 'Ahmed', lastName: 'Al-Rashid', role: 'driver', org: 'Fleet Ops SA', createdAt: '2026-01-01', color: '#4f8ef7', active: true },
];

export const defaultAuditLogs: AuditLog[] = [
  { id: 1, action: 'Vehicle added', detail: 'Toyota Land Cruiser (FL-001) added to fleet', user: 'Hassan Zarroug', time: '2026-04-01T09:00:00Z', color: 'var(--accent2)' },
  { id: 2, action: 'Transfer approved', detail: 'Ford Transit transfer approved to Logistics South', user: 'Hassan Zarroug', time: '2026-04-02T14:00:00Z', color: 'var(--green)' },
  { id: 3, action: 'Maintenance scheduled', detail: 'Mitsubishi L200 brake system repair scheduled', user: 'Hassan Zarroug', time: '2026-04-03T10:30:00Z', color: 'var(--amber)' },
];
