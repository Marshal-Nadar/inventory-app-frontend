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
  CalendarCheck,
  ShoppingBag,
  PlusCircle,
  TrendingUp,
  FileText,
  PlusSquare,
  type LucideIcon,
  Palette,
  Printer,
  BookOpen,
  Lock,
} from "lucide-react";

export interface NavChild {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: string[]; // if undefined = visible to all
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
    roles: [
      "admin",
      "manager",
      "storekeeper",
      "cashier",
      "kitchen",
      "super_admin",
    ],
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
    label: "Daily Sales",
    path: "/dashboard/sales",
    icon: TrendingUp,
    roles: ["admin", "manager", "cashier", "storekeeper", "super_admin"],
    children: [
      {
        label: "Add Sales",
        path: "/dashboard/sales/add",
        icon: PlusSquare,
      },
      {
        label: "Sales Report",
        path: "/dashboard/sales/report",
        icon: FileText,
        // roles: ["admin", "storekeeper", "super_admin"],
      },
    ],
  },

  {
    label: "Pre-Booking",
    path: "/dashboard/prebooking",
    icon: CalendarCheck,
    roles: ["admin", "storekeeper", "manager", "super_admin"],
    children: [
      {
        label: "New Order",
        path: "/dashboard/prebooking/new",
        icon: PlusCircle,
      },
      {
        label: "All Orders",
        path: "/dashboard/prebooking/orders",
        icon: List,
      },
      {
        label: "Products",
        path: "/dashboard/prebooking/products",
        icon: Package,
        roles: ["admin", "storekeeper", "super_admin"],
      },
      {
        label: "Product Report",
        path: "/dashboard/prebooking/report",
        icon: BarChart2,
        roles: ["admin", "storekeeper", "super_admin"],
      },
    ],
  },
  {
    label: "Users",
    path: "/dashboard/users",
    icon: Users,
    roles: ["admin", "super_admin"],
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
        label: "Expense Report",
        path: "/dashboard/misc-expense/report",
        icon: BarChart2,
        roles: ["admin", "storekeeper", "super_admin"],
      },
      {
        label: "Manage Types",
        path: "/dashboard/misc-expense/types",
        icon: Tags,
        roles: ["admin", "storekeeper", "super_admin"],
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
        roles: ["admin", "storekeeper", "super_admin"],
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
    roles: ["admin", "storekeeper", "super_admin"],
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
        label: "Vendor Report",
        path: "/dashboard/purchases/vendor-report",
        icon: FileText,
      },
    ],
  },
  {
    label: "Inventory",
    path: "/dashboard/inventory",
    icon: Package,
    roles: ["admin", "storekeeper", "super_admin"],
    children: [
      {
        label: "Stock Dashboard",
        path: "/dashboard/purchases/stock-dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Stock Summary",
        path: "/dashboard/purchases/stock-summary",
        icon: BarChart2,
      },
      {
        label: "Stock Ledger",
        path: "/dashboard/purchases/stock-ledger",
        icon: BookOpen,
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
    children: [
      {
        label: "Appearance",
        path: "/dashboard/settings/appearance",
        icon: Palette,
      },
      {
        label: "Print Settings",
        path: "/dashboard/settings/print",
        icon: Printer,
        roles: ["admin", "super_admin"],
      },
      {
        label: "Change Password",
        path: "/dashboard/settings/change-password",
        icon: Lock,
      },
    ],
  },
];
