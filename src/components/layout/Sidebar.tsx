import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setSidebarMode } from "@/store/slices/themeSlice";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";

export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const sidebarMode = useAppSelector((state) => state.theme.sidebarMode);
  const user = useAppSelector((state) => state.auth.user);
  const isCollapsed = sidebarMode === "icon";

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const toggleSidebar = () => {
    dispatch(setSidebarMode(isCollapsed ? "default" : "icon"));
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col flex-shrink-0 h-screen bg-card border-r transition-all duration-300",
        isCollapsed ? "w-[64px]" : "w-60",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b flex-shrink-0",
          isCollapsed ? "justify-center px-0" : "gap-3 px-4",
        )}
      >
        <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground flex-shrink-0'>
          <UtensilsCrossed className='w-4 h-4 flex-shrink-0' />
        </div>
        {!isCollapsed && (
          <span className='font-bold text-sm truncate text-foreground'>
            Restaurant Manager
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className='flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden'>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return isCollapsed ? (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )
                  }
                >
                  <Icon className='w-5 h-5 flex-shrink-0' />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side='right'>{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className='w-5 h-5 flex-shrink-0' />
              <span className='truncate'>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {!isCollapsed && user && (
        <div className='border-t p-4 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0'>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium truncate text-foreground'>
                {user.name}
              </p>
              <p className='text-xs text-muted-foreground truncate capitalize'>
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <Button
        variant='outline'
        size='icon'
        onClick={toggleSidebar}
        className='absolute -right-3 top-20 w-6 h-6 rounded-full border shadow-sm bg-background z-10 flex-shrink-0'
      >
        {isCollapsed ? (
          <ChevronRight className='w-3 h-3 flex-shrink-0' />
        ) : (
          <ChevronLeft className='w-3 h-3 flex-shrink-0' />
        )}
      </Button>
    </aside>
  );
};
