import {
  LayoutDashboard,
  UtensilsCrossed,
  GitBranch,
  Users,
  ShieldCheck,
  Settings,
  PackageSearch,
  Truck,
  ShoppingCart,
  Plus,
  List,
  BarChart2,
  Package,
  ArrowLeftRight,
  ClipboardList,
  BarChart,
  GitMerge,
  Wallet,
  CreditCard,
  Receipt,
  Clock,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: string[];
  superAdminOnly?: boolean;
  hideForSuperAdmin?: boolean;
  children?: NavChild[];
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
    label: "Misc Expense",
    path: "/dashboard/misc-expense",
    icon: Receipt,
    roles: [
      "admin",
      "manager",
      "cashier",
      "kitchen",
      "supervisor",
      "storekeeper",
      "super_admin",
    ],
    children: [
      {
        label: "Add Expense",
        path: "/dashboard/misc-expense/add",
        icon: Plus,
      },
      {
        label: "Expense List",
        path: "/dashboard/misc-expense/list",
        icon: List,
      },
      {
        label: "Manage Types",
        path: "/dashboard/misc-expense/types",
        icon: Tags,
      },
    ],
  },
  {
    label: "Raw Materials",
    path: "/dashboard/raw-materials",
    icon: PackageSearch,
    roles: ["admin", "manager", "supervisor", "super_admin"],
    children: [
      {
        label: "Add Raw Materials",
        path: "/dashboard/raw-materials/add",
        icon: Plus,
      },
      {
        label: "All Raw Materials",
        path: "/dashboard/raw-materials",
        icon: List,
      },
    ],
  },
  {
    label: "Vendors",
    path: "/dashboard/vendors",
    icon: Truck,
    roles: ["admin", "manager", "supervisor", "super_admin"],
  },
  {
    label: "Purchases",
    path: "/dashboard/purchases",
    icon: ShoppingCart,
    roles: ["admin", "manager", "supervisor", "super_admin"],
    children: [
      {
        label: "New Purchase",
        path: "/dashboard/purchases/new",
        icon: Plus,
      },
      {
        label: "All Purchases",
        path: "/dashboard/purchases",
        icon: List,
      },
      {
        label: "Purchase Report",
        path: "/dashboard/purchases/purchase-report",
        icon: BarChart2,
      },
      {
        label: "Stock Summary",
        path: "/dashboard/purchases/stock-summary",
        icon: Package,
      },
      {
        label: "Stock Dashboard",
        path: "/dashboard/purchases/stock-dashboard",
        icon: BarChart,
      },
    ],
  },
  {
    label: "Stock Transfer",
    path: "/dashboard/transfers",
    icon: ArrowLeftRight,
    roles: [
      "admin",
      "manager",
      "cashier",
      "kitchen",
      "supervisor",
      "storekeeper",
      "super_admin",
    ],
    children: [
      {
        label: "New Request",
        path: "/dashboard/transfers/new",
        icon: Plus,
      },
      {
        label: "All Requests",
        path: "/dashboard/transfers",
        icon: ClipboardList,
      },
      {
        label: "Branch Stock View",
        path: "/dashboard/transfers/branch-stock",
        icon: GitMerge,
      },
    ],
  },
  {
    label: "Payments",
    path: "/dashboard/payments",
    icon: Wallet,
    roles: ["admin", "manager", "storekeeper", "super_admin"],
    children: [
      {
        label: "Vendor Payments",
        path: "/dashboard/payments/vendors",
        icon: CreditCard,
      },
      {
        label: "Payment Receipt",
        path: "/dashboard/payments/receipts",
        icon: Receipt,
      },
      {
        label: "Pending Payments",
        path: "/dashboard/payments/pending",
        icon: Clock,
      },
    ],
  },
  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "manager", "super_admin"],
  },
];
