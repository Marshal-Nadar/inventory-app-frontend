import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logout } from "@/store/slices/authSlice";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UtensilsCrossed,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    // auto-open parent if current path matches a child
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((child) =>
          location.pathname.startsWith(child.path),
        );
        if (isActive) initial[item.path] = true;
      }
    });
    return initial;
  });

  const filteredNav = navItems.filter((item) => {
    if (!user) return false;
    if (item.superAdminOnly) return user.is_super_admin;
    if (item.hideForSuperAdmin && user.is_super_admin) return false;
    return item.roles.includes(user.role) || user.is_super_admin;
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleItem = (path: string) => {
    setOpenItems((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isParentActive = (item: (typeof navItems)[0]) => {
    if (item.children) {
      return item.children.some(
        (child) =>
          location.pathname === child.path ||
          location.pathname.startsWith(child.path + "/"),
      );
    }
    return location.pathname === item.path;
  };

  return (
    <Sidebar collapsible='icon'>
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <div className='flex items-center gap-2 cursor-default'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0'>
                  <UtensilsCrossed className='h-4 w-4' />
                </div>
                <div className='flex flex-col leading-none'>
                  <span className='font-bold text-sm'>Restaurant</span>
                  <span className='text-xs text-muted-foreground'>Manager</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarMenu className='px-2 gap-0.5'>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const parentActive = isParentActive(item);
            const isOpen = openItems[item.path] ?? false;

            // filter children by roles
            const visibleChildren = hasChildren
              ? item.children!.filter((child) => {
                  if (
                    child.path === "/dashboard/transfers/new" &&
                    user?.role === "storekeeper"
                  )
                    return false;
                  if (child.roles) {
                    return (
                      user?.is_super_admin ||
                      child.roles.includes(user?.role || "")
                    );
                  }
                  return true;
                })
              : [];

            if (hasChildren) {
              return (
                <Collapsible
                  key={item.path}
                  open={isOpen}
                  onOpenChange={() => toggleItem(item.path)}
                  asChild
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={parentActive}
                        className='justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <Icon className='h-4 w-4 flex-shrink-0' />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                            isOpen && "rotate-90",
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleChildren.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive =
                            location.pathname === child.path;
                          return (
                            <SidebarMenuSubItem key={child.path}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isChildActive}
                              >
                                <NavLink to={child.path} end>
                                  <ChildIcon className='h-4 w-4' />
                                  <span>{child.label}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={parentActive}
                >
                  <NavLink to={item.path} end={item.path === "/dashboard"}>
                    <Icon className='h-4 w-4 flex-shrink-0' />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer — user info + logout */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0'>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className='flex flex-col leading-none min-w-0'>
                    <span className='font-medium text-sm truncate'>
                      {user?.name}
                    </span>
                    <span className='text-xs text-muted-foreground capitalize truncate'>
                      {user?.is_super_admin ? "Super Admin" : user?.role}
                    </span>
                  </div>
                  <ChevronDown className='ml-auto h-4 w-4 flex-shrink-0' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='top' align='start' className='w-52'>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className='text-destructive focus:text-destructive gap-2'
                >
                  <LogOut className='h-4 w-4' />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
