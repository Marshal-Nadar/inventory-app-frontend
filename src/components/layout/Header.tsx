import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { logout } from "@/store/slices/authSlice";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { Badge } from "../ui/badge";

interface HeaderProps {
  title?: string;
}

export const Header = ({ title = "Dashboard" }: HeaderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className='h-16 border-b bg-card flex items-center justify-between px-6'>
      {/* Page title */}
      <h1 className='text-lg font-semibold'>{title}</h1>

      {/* Right side */}
      <div className='flex items-center gap-3'>
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='relative h-9 w-9 rounded-full'>
              <Avatar className='h-9 w-9'>
                <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>
              <div className='flex flex-col space-y-1'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-medium'>{user?.name}</p>
                  {user?.is_super_admin && (
                    <Badge variant='secondary' className='text-xs px-1.5 py-0'>
                      Super Admin
                    </Badge>
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
              <Settings className='mr-2 h-4 w-4' />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className='text-destructive focus:text-destructive'
            >
              <LogOut className='mr-2 h-4 w-4' />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
