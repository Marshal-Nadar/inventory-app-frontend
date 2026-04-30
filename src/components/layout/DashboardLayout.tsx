import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/restaurants": "Restaurants",
  "/dashboard/branches": "Branches",
  "/dashboard/users": "Users",
  "/dashboard/roles": "Roles",
  "/dashboard/settings": "Settings",
};

export const DashboardLayout = () => {
  const location = useLocation();
  const contentLayout = useAppSelector((state) => state.theme.contentLayout);
  const title = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className='flex h-screen w-full bg-background overflow-hidden'>
      {/* Sidebar — fixed width, never shrinks */}
      <Sidebar />

      {/* Main area — takes remaining space, min-w-0 prevents overflow */}
      <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
        <Header title={title} />
        <main className='flex-1 overflow-y-auto p-6'>
          <div
            className={cn(
              "w-full",
              contentLayout === "centered" ? "max-w-5xl mx-auto" : "",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
