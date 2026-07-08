export interface GPSData {
  x: number;
  y: number;
  speed: number;
  lastPing: string;
  online: boolean;
}

export interface VehicleDocs {
  insurance: string;
  registration: string;
  inspection: string;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  fleet: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  ccId: number | null;
  mileage: number;
  fuel: string;
  type: 'car' | 'suv' | 'truck' | 'van' | string;
  driverId: number | null;
  lastService: string;
  nextService: string;
  notes: string;
  gps: GPSData;
  docs: VehicleDocs;
  costYTD: number;
}

export interface CostCenter {
  id: number;
  name: string;
  code: string;
  desc: string;
  active: boolean;
  budget: number;
  spent: number;
}

export interface Driver {
  id: number;
  name: string;
  license: string;
  phone: string;
  email: string;
  status: 'active' | 'on_leave' | 'inactive';
  vehicleId: number | null;
  joinDate: string;
  trips: number;
  color: string;
}

export interface Transfer {
  id: number;
  vehicleId: number;
  fromCcId: number | null;
  toCcId: number;
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled';
  reason: string;
  reqBy: string;
  approvedBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Maintenance {
  id: number;
  vehicleId: number;
  type: string;
  status: 'pending' | 'in_progress' | 'scheduled' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  completedDate: string | null;
  tech: string;
  estimatedCost: number;
  actualCost: number | null;
  notes: string;
}

export interface Notification {
  id: number;
  title: string;
  msg: string;
  type: 'warning' | 'info' | 'success' | 'error';
  read: boolean;
  time: string;
}

export interface AuditLog {
  id: number;
  action: string;
  detail: string;
  user: string;
  time: string;
  color: string;
}

export interface Settings {
  currency: string;
  distUnit: string;
  companyName: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  autoApprove: boolean;
}

export interface User {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'viewer' | 'driver';
  org: string;
  createdAt: string;
  color: string;
  active: boolean;
}
