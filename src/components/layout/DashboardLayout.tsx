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
  "/dashboard/purchases/vendor-report": "Purchase Report",
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
  "/dashboard/settings": "Settings",
};

export const DashboardLayout = () => {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top header */}
        <header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
          <div className='flex flex-1 items-center justify-between'>
            <h1 className='text-sm font-semibold text-foreground'>
              {pageTitle}
            </h1>
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
        <div className='flex flex-1 flex-col p-6 overflow-auto'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
