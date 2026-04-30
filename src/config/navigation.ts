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
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "cashier", "kitchen"],
  },
  {
    label: "Restaurants",
    path: "/dashboard/restaurants",
    icon: UtensilsCrossed,
    roles: ["admin"],
  },
  {
    label: "Branches",
    path: "/dashboard/branches",
    icon: GitBranch,
    roles: ["admin", "manager"],
  },
  {
    label: "Users",
    path: "/dashboard/users",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    label: "Roles",
    path: "/dashboard/roles",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "manager"],
  },
];
