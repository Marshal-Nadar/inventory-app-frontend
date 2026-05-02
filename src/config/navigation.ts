import {
  LayoutDashboard,
  UtensilsCrossed,
  GitBranch,
  Users,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: string[];
  superAdminOnly?: boolean;
  hideForSuperAdmin?: boolean;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "cashier", "kitchen", "super_admin"],
  },
  {
    label: "Restaurants",
    path: "/dashboard/restaurants",
    icon: UtensilsCrossed,
    roles: ["super_admin"],
    superAdminOnly: true,
  },
  {
    label: "Branches",
    path: "/dashboard/branches",
    icon: GitBranch,
    roles: ["admin", "manager"],
    hideForSuperAdmin: true,
  },
  {
    label: "Users",
    path: "/dashboard/users",
    icon: Users,
    roles: ["admin", "manager", "super_admin"],
  },
  {
    label: "Roles",
    path: "/dashboard/roles",
    icon: ShieldCheck,
    roles: ["admin", "super_admin"],
  },
  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "manager", "super_admin"],
  },
];
