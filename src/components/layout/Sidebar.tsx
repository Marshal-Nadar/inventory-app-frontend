import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UtensilsCrossed,
} from "lucide-react";

export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const sidebarMode = useAppSelector((state) => state.theme.sidebarMode);
  const user = useAppSelector((state) => state.auth.user);
  const isCollapsed = sidebarMode === "icon";

  // track which parent nav items are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "/dashboard/purchases": true,
  });

  const filteredNav = navItems.filter((item) => {
    if (!user) return false;
    if (item.superAdminOnly) return user.is_super_admin;
    if (item.hideForSuperAdmin && user.is_super_admin) return false;
    return item.roles.includes(user.role);
  });

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isParentActive = (item: (typeof navItems)[0]) => {
    if (item.children) {
      return item.children.some((child) =>
        location.pathname.startsWith(child.path),
      );
    }
    return location.pathname === item.path;
  };

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
          const hasChildren = !!item.children;
          const isExpanded = expanded[item.path];
          const parentActive = isParentActive(item);

          if (isCollapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={hasChildren ? item.children![1].path : item.path}
                    end={item.path === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-colors",
                        isActive || parentActive
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
            );
          }

          return (
            <div key={item.path}>
              {hasChildren ? (
                // expandable parent
                <button
                  onClick={() => toggleExpand(item.path)}
                  className={cn(
                    "flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors w-full",
                    parentActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className='w-5 h-5 flex-shrink-0' />
                  <span className='flex-1 truncate text-left'>
                    {item.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                      isExpanded ? "rotate-180" : "",
                    )}
                  />
                </button>
              ) : (
                // regular nav link
                <NavLink
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
              )}

              {/* Children */}
              {hasChildren && (
                <div
                  className={cn(
                    "ml-4 border-l pl-3 overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded
                      ? "max-h-40 opacity-100 mt-1 space-y-1"
                      : "max-h-0 opacity-0",
                  )}
                >
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        end={child.path === "/dashboard/purchases"}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )
                        }
                      >
                        <ChildIcon className='w-4 h-4 flex-shrink-0' />
                        <span className='truncate'>{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
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
                {user.is_super_admin ? "Super Admin" : user.role}
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
