import { useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAppSelector } from "@/hooks/useAppSelector";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Outlet } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setSidebarMode } from "@/store/slices/themeSlice";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/restaurants": "Restaurants",
  "/dashboard/branches": "Branches",
  "/dashboard/users": "Users",
  "/dashboard/roles": "Roles",
  "/dashboard/raw-materials": "All Raw Materials",
  "/dashboard/raw-materials/add": "Add Raw Materials",
  "/dashboard/vendors": "Vendors",
  "/dashboard/purchases": "All Purchases",
  "/dashboard/purchases/new": "New Purchase",
  "/dashboard/purchases/stock-summary": "Stock Summary",
  "/dashboard/purchases/stock-dashboard": "Stock Dashboard",
  "/dashboard/purchases/vendor-report": "Vendor Report",
  "/dashboard/purchases/stock-ledger": "Stock Ledger",
  "/dashboard/transfers": "Transfer Requests",
  "/dashboard/transfers/new": "New Transfer Request",
  "/dashboard/transfers/branch-stock": "Branch Stock View",
  "/dashboard/payments/vendors": "Vendor Payments",
  "/dashboard/payments/receipts": "Payment Receipt",
  "/dashboard/payments/pending": "Pending Payments",
  "/dashboard/misc-expense/add": "Add Expense",
  "/dashboard/misc-expense/list": "Expense List",
  "/dashboard/misc-expense/report": "Expense Report",
  "/dashboard/misc-expense/types": "Manage Expense Types",
  "/dashboard/prebooking/new": "Create Pre-Booking",
  "/dashboard/prebooking/orders": "All Pre-Booking Orders",
  "/dashboard/prebooking/products": "Pre-Booking Products",
  "/dashboard/prebooking/report": "Product-Wise Pre-Booking Report",
  "/dashboard/sales/add": "Daily Sales Entry",
  "/dashboard/sales/report": "Sales Report",
  "/dashboard/settings/print": "Print Settings",
  "/dashboard/settings/appearance": "Appearance Settings",
  "/dashboard/settings/change-password": "Change Password",
};

export const DashboardLayout = () => {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  const dispatch = useAppDispatch();
  const sidebarMode = useAppSelector((state) => state.theme.sidebarMode);
  const contentLayout = useAppSelector((state) => state.theme.contentLayout);

  const isOpen = sidebarMode === "default";

  const handleOpenChange = (open: boolean) => {
    dispatch(setSidebarMode(open ? "default" : "icon"));
  };

  return (
    <SidebarProvider open={isOpen} onOpenChange={handleOpenChange}>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-14 shrink-0 items-center gap-2 border-b border-border/20 px-4 sticky top-0 z-10 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <div className='flex flex-1 items-center justify-between'>
            <h2 className='text-sm font-semibold text-foreground !mb-0'>
              {pageTitle}
            </h2>
            <div className='flex items-center gap-3'>
              {user && (
                <span className='text-xs text-muted-foreground hidden sm:block'>
                  {user.name} ·{" "}
                  <span className='capitalize'>
                    {user.is_super_admin ? "Super Admin" : user.role}
                  </span>
                </span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>
        {/* Page content */}
        <div className='flex flex-1 flex-col p-6 overflow-auto overflow-x-hidden'>
          <div
            className={cn(
              "w-full",
              contentLayout === "centered" ? "max-w-4xl mx-auto" : "",
            )}
          >
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
