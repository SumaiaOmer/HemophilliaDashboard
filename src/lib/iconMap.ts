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
  patients: Users,
  building: Building2,
  companies: Building2,
  pill: Pill,
  drugs: Pill,
  stethoscope: Stethoscope,
  treatment: Stethoscope,
  treatments: Stethoscope,
  smartphone: Smartphone,
  cellphone: Smartphone,
  'cell-phone': Smartphone,
  truck: Truck,
  distribution: Truck,
  shield: Shield,
  roles: Shield,
  'roles-screens': Shield,
  chart: BarChart3,
  reports: BarChart3,
  activity: Activity,
  calendar: Calendar,
  visit: Calendar,
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

export const getIcon = (iconName?: string) => {
  if (!iconName) return Home;

  const normalized = iconName.toLowerCase().replace(/[-_\s]/g, '');

  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalized.includes(key.replace(/[-_]/g, '')) || key.replace(/[-_]/g, '') === normalized) {
      return icon;
    }
  }

  return Home;
};

export const getAllIcons = () => iconMap;
