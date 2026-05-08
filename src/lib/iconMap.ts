import {
  Home,
  Users,
  Building2,
  Pill,
  Stethoscope,
  Smartphone,
  Truck,
  Shield,
  BarChart3,
  Activity,
  Calendar,
  FileText,
  Settings,
  Box,
  Database,
  Map,
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
  User,
  DollarSign,
  MapPin,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  home: Home,
  dashboard: Home,
  users: Users,
  patient: Users,
  patients: Users,
  building: Building2,
  companies: Building2,
  company: Building2,
  pill: Pill,
  drug: Pill,
  drugs: Pill,
  druglist: Pill,
  factor: Pill,
  factors: Pill,
  stethoscope: Stethoscope,
  treatment: Stethoscope,
  treatments: Stethoscope,
  smartphone: Smartphone,
  cellphone: Smartphone,
  'cell-phone': Smartphone,
  phone: Smartphone,
  truck: Truck,
  distribution: Truck,
  delivered: Package,
  deliver: Package,
  shield: Shield,
  roles: Shield,
  role: Shield,
  'roles-screens': Shield,
  chart: BarChart3,
  report: BarChart3,
  reports: BarChart3,
  activity: Activity,
  calendar: Calendar,
  visit: Calendar,
  visits: Calendar,
  patientvisit: Calendar,
  diagnosis: FileText,
  filetext: FileText,
  settings: Settings,
  box: Box,
  database: Database,
  map: Map,
  location: MapPin,
  clock: Clock,
  inventory: Package,
  alert: AlertTriangle,
  trending: TrendingUp,
  user: User,
  payment: DollarSign,
};

export const getIcon = (iconName?: string, fallbackName?: string) => {
  const tryMatch = (name: string) => {
    const normalized = name.toLowerCase().replace(/[-_\s]/g, '');
    for (const [key, icon] of Object.entries(iconMap)) {
      const normalizedKey = key.replace(/[-_]/g, '');
      if (normalized === normalizedKey || normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
        return icon;
      }
    }
    return null;
  };

  if (iconName) {
    const match = tryMatch(iconName);
    if (match) return match;
  }

  if (fallbackName) {
    const match = tryMatch(fallbackName);
    if (match) return match;
  }

  return Home;
};

export const getAllIcons = () => iconMap;
