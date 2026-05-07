import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  UtensilsCrossed,
  GitBranch,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Building2,
} from "lucide-react";
import {
  dashboardService,
  type DashboardStats,
} from "@/services/dashboardService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";

// ─── Stat Card ────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  total: number;
  sub: string;
  subValue: number;
  icon: React.ElementType;
  color: string;
  path: string;
  loading: boolean;
}

const StatCard = ({
  title,
  total,
  sub,
  subValue,
  icon: Icon,
  color,
  path,
  loading,
}: StatCardProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <Skeleton className='h-4 w-24' />
        </CardHeader>
        <CardContent className='space-y-3'>
          <Skeleton className='h-8 w-16' />
          <Skeleton className='h-3 w-32' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-shadow group'
      onClick={() => navigate(path)}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            {title}
          </CardTitle>
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className='w-4 h-4' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        <div className='text-3xl font-bold text-foreground'>{total}</div>
        <div className='flex items-center justify-between'>
          <span className='text-xs text-muted-foreground'>
            {subValue} {sub}
          </span>
          <ArrowRight className='w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Quick Action ─────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const QuickAction = ({
  label,
  description,
  icon: Icon,
  path,
}: QuickActionProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className='flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left w-full'
    >
      <div className='p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0'>
        <Icon className='w-4 h-4' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-foreground'>{label}</p>
        <p className='text-xs text-muted-foreground truncate'>{description}</p>
      </div>
      <ArrowRight className='w-4 h-4 text-muted-foreground flex-shrink-0' />
    </button>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────

export const DashboardHome = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_super_admin;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    ...(isSuperAdmin
      ? [
          {
            title: "Restaurants",
            total: stats?.restaurants.total ?? 0,
            sub: "active",
            subValue: stats?.restaurants.active ?? 0,
            icon: UtensilsCrossed,
            color: "bg-blue-500/10 text-blue-600",
            path: "/dashboard/restaurants",
          },
        ]
      : []),
    {
      title: "Branches",
      total: stats?.branches.total ?? 0,
      sub: "active",
      subValue: stats?.branches.active ?? 0,
      icon: GitBranch,
      color: "bg-violet-500/10 text-violet-600",
      path: "/dashboard/branches",
    },
    {
      title: "Users",
      total: stats?.users.total ?? 0,
      sub: "active",
      subValue: stats?.users.active ?? 0,
      icon: Users,
      color: "bg-green-500/10 text-green-600",
      path: "/dashboard/users",
    },
    {
      title: "Roles",
      total: stats?.roles.total ?? 0,
      sub: "custom",
      subValue: stats?.roles.custom ?? 0,
      icon: ShieldCheck,
      color: "bg-orange-500/10 text-orange-600",
      path: "/dashboard/roles",
    },
  ];

  const quickActions = [
    ...(isSuperAdmin
      ? [
          {
            label: "Add Restaurant",
            description: "Onboard a new restaurant to the platform",
            icon: Building2,
            path: "/dashboard/restaurants",
          },
        ]
      : []),
    {
      label: "Add Branch",
      description: "Create a new branch for your restaurant",
      icon: GitBranch,
      path: "/dashboard/branches",
    },
    {
      label: "Add User",
      description: "Invite a new staff member",
      icon: Users,
      path: "/dashboard/users",
    },
    {
      label: "Manage Roles",
      description: "Create and manage custom roles",
      icon: ShieldCheck,
      path: "/dashboard/roles",
    },
  ];

  return (
    <div className='space-y-8'>
      {/* Welcome */}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <h2 className='text-2xl font-bold text-foreground'>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className='text-muted-foreground text-sm'>
            {isSuperAdmin
              ? "Here's an overview of your entire platform."
              : `Here's what's happening at ${user?.branch ?? "your branch"}.`}
          </p>
        </div>
        {isSuperAdmin && (
          <Badge variant='secondary' className='mt-1'>
            <TrendingUp className='w-3 h-3 mr-1' />
            Super Admin
          </Badge>
        )}
      </div>

      {/* Stat Cards */}
      <div
        className={cn(
          "grid gap-4",
          isSuperAdmin
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {cards.map((card) => (
          <StatCard key={card.title} {...card} loading={loading} />
        ))}
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className='space-y-4'>
        <div>
          <h3 className='text-base font-semibold text-foreground'>
            Quick Actions
          </h3>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Jump to common tasks
          </p>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </div>

      {/* Logged in info */}
      <Separator />
      <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
        <span>
          Logged in as{" "}
          <span className='font-medium text-foreground'>{user?.name}</span>
        </span>
        <span>•</span>
        <span>
          Role:{" "}
          <span className='font-medium text-foreground capitalize'>
            {user?.role}
          </span>
        </span>
        {user?.branch && (
          <>
            <span>•</span>
            <span>
              Branch:{" "}
              <span className='font-medium text-foreground'>{user.branch}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
