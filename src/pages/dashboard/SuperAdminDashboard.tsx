import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  UtensilsCrossed,
  GitBranch,
  Users,
  TrendingUp,
  ArrowRightLeft,
  CalendarCheck,
  IndianRupee,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  dashboardService,
  type SuperAdminStats,
  type RestaurantStat,
} from "@/services/dashboardService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";

const RestaurantCard = ({ r }: { r: RestaurantStat }) => {
  const navigate = useNavigate();
  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-all group border'
      onClick={() => navigate(`/dashboard/restaurants`)}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-lg bg-primary/10'>
              <UtensilsCrossed className='w-3.5 h-3.5 text-primary' />
            </div>
            <CardTitle className='text-sm font-semibold text-foreground'>
              {r.name}
            </CardTitle>
          </div>
          <Badge
            variant='outline'
            className={cn(
              "text-xs",
              r.is_active
                ? "text-green-600 border-green-200"
                : "text-muted-foreground",
            )}
          >
            {r.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* Quick stats */}
        <div className='grid grid-cols-2 gap-2'>
          <div className='flex items-center gap-2'>
            <GitBranch className='w-3.5 h-3.5 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>
              {r.active_branches} branches
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Users className='w-3.5 h-3.5 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>
              {r.active_users} users
            </span>
          </div>
        </div>

        <Separator />

        {/* Sales */}
        <div className='space-y-1.5'>
          <div className='flex justify-between items-center'>
            <span className='text-xs text-muted-foreground'>Today's Sales</span>
            <span className='text-sm font-semibold text-foreground'>
              ₹{Number(r.today_sales).toFixed(0)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-xs text-muted-foreground'>This Month</span>
            <span className='text-sm font-semibold text-green-600'>
              ₹{Number(r.month_sales).toFixed(0)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Alerts */}
        <div className='flex gap-3'>
          {Number(r.pending_prebookings) > 0 && (
            <div className='flex items-center gap-1'>
              <CalendarCheck className='w-3.5 h-3.5 text-yellow-600' />
              <span className='text-xs text-yellow-600 font-medium'>
                {r.pending_prebookings} bookings
              </span>
            </div>
          )}
          {Number(r.pending_transfers) > 0 && (
            <div className='flex items-center gap-1'>
              <ArrowRightLeft className='w-3.5 h-3.5 text-orange-600' />
              <span className='text-xs text-orange-600 font-medium'>
                {r.pending_transfers} transfers
              </span>
            </div>
          )}
          {Number(r.pending_prebookings) === 0 &&
            Number(r.pending_transfers) === 0 && (
              <div className='flex items-center gap-1'>
                <CheckCircle2 className='w-3.5 h-3.5 text-green-600' />
                <span className='text-xs text-green-600'>All clear</span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getSuperAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const t = stats?.totals;

  return (
    <div className='space-y-8'>
      {/* Welcome */}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <h2 className='text-2xl font-bold text-foreground'>
            Platform Overview 👋
          </h2>
          <p className='text-sm text-muted-foreground'>
            Logged in as{" "}
            <span className='font-medium text-foreground'>{user?.name}</span> —
            Super Admin
          </p>
        </div>
        <Badge className='mt-1 bg-primary/10 text-primary border-primary/20'>
          Super Admin
        </Badge>
      </div>

      {/* Platform totals */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
        {[
          {
            label: "Restaurants",
            value: t?.total_restaurants ?? 0,
            icon: UtensilsCrossed,
            color: "text-blue-600",
            path: "/dashboard/restaurants",
          },
          {
            label: "Branches",
            value: t?.total_branches ?? 0,
            icon: GitBranch,
            color: "text-violet-600",
            path: "/dashboard/branches",
          },
          {
            label: "Users",
            value: t?.total_users ?? 0,
            icon: Users,
            color: "text-green-600",
            path: "/dashboard/users",
          },
          {
            label: "Today's Sales",
            value: `₹${Number(t?.today_sales || 0).toFixed(0)}`,
            icon: IndianRupee,
            color: "text-emerald-600",
            path: "/dashboard/sales/report",
          },
          {
            label: "Pending Bookings",
            value: t?.pending_prebookings ?? 0,
            icon: CalendarCheck,
            color:
              Number(t?.pending_prebookings) > 0
                ? "text-yellow-600"
                : "text-muted-foreground",
            path: "/dashboard/prebooking/orders",
          },
          {
            label: "Pending Transfers",
            value: t?.pending_transfers ?? 0,
            icon: ArrowRightLeft,
            color:
              Number(t?.pending_transfers) > 0
                ? "text-orange-600"
                : "text-muted-foreground",
            path: "/dashboard/transfers",
          },
        ].map((item) => (
          <Card
            key={item.label}
            className='cursor-pointer hover:shadow-sm transition-shadow'
            onClick={() => navigate(item.path)}
          >
            <CardContent className='pt-4 space-y-2'>
              {loading ? (
                <Skeleton className='h-7 w-16' />
              ) : (
                <>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-muted-foreground'>
                      {item.label}
                    </p>
                    <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                  </div>
                  <p className={cn("text-xl font-bold", item.color)}>
                    {item.value}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Per restaurant cards */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-base font-semibold text-foreground'>
              Restaurants
            </h3>
            <p className='text-sm text-muted-foreground mt-0.5'>
              Click any restaurant to manage it.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/restaurants")}
            className='flex items-center gap-1 text-xs text-primary hover:underline'
          >
            Manage all <ArrowRight className='w-3 h-3' />
          </button>
        </div>

        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className='pt-4 space-y-3'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-full' />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !stats?.restaurants.length ? (
          <div className='text-center py-12 text-muted-foreground'>
            <UtensilsCrossed className='w-10 h-10 opacity-30 mx-auto mb-3' />
            <p className='text-sm'>No restaurants yet.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {stats.restaurants.map((r) => (
              <RestaurantCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Super admin notice */}
      <div className='flex items-start gap-3 p-4 rounded-lg bg-muted/50 border'>
        <AlertTriangle className='w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5' />
        <div className='space-y-1'>
          <p className='text-sm font-medium text-foreground'>
            Platform Admin Mode
          </p>
          <p className='text-xs text-muted-foreground'>
            You are logged in as Super Admin. You have read access to all
            restaurant data. For day-to-day operations like adding purchases,
            expenses or sales — log in as the respective restaurant admin.
          </p>
        </div>
      </div>
    </div>
  );
};
