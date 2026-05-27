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
  AlertTriangle,
  ArrowRightLeft,
  CalendarCheck,
  Wallet,
  ShoppingCart,
  PackageX,
  Package,
  IndianRupee,
  Clock,
} from "lucide-react";
import {
  dashboardService,
  type DashboardStats,
} from "@/services/dashboardService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ─── Stat Card ────────────────────────────────────────────────────

const StatCard = ({
  title,
  total,
  sub,
  subValue,
  icon: Icon,
  color,
  path,
  loading,
}: {
  title: string;
  total: number;
  sub: string;
  subValue: number;
  icon: React.ElementType;
  color: string;
  path: string;
  loading: boolean;
}) => {
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

// ─── Alert Card ───────────────────────────────────────────────────

const AlertCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  path,
  loading,
  urgent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  path: string;
  loading: boolean;
  urgent?: boolean;
}) => {
  const navigate = useNavigate();
  if (loading) {
    return (
      <Card>
        <CardContent className='pt-4 space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-16' />
          <Skeleton className='h-3 w-28' />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all group",
        urgent && Number(value) > 0 && "border-destructive/40",
      )}
      onClick={() => navigate(path)}
    >
      <CardContent className='pt-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-medium text-muted-foreground'>{title}</p>
          <div className={cn("p-1.5 rounded-md", color)}>
            <Icon className='w-3.5 h-3.5' />
          </div>
        </div>
        <p
          className={cn(
            "text-2xl font-bold",
            urgent && Number(value) > 0
              ? "text-destructive"
              : "text-foreground",
          )}
        >
          {value}
        </p>
        <p className='text-xs text-muted-foreground'>{subtitle}</p>
      </CardContent>
    </Card>
  );
};

// ─── Main ─────────────────────────────────────────────────────────

export const DashboardHome = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_super_admin;
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  const canManageStore = user?.can_manage_store || isSuperAdmin;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const orgCards = [
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

  const ops = stats?.operations;
  const todaySales = stats?.today_sales;

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

      {/* Today's Sales Summary */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-foreground'>
            Today's Sales
          </h3>
          <Button
            variant='ghost'
            size='sm'
            className='gap-1 text-xs h-7'
            onClick={() => navigate("/dashboard/sales/add")}
          >
            Add Sales <ArrowRight className='w-3 h-3' />
          </Button>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <Card>
            <CardContent className='pt-4 space-y-1'>
              <div className='flex items-center gap-2'>
                <IndianRupee className='w-4 h-4 text-muted-foreground' />
                <p className='text-xs text-muted-foreground'>Net Sales</p>
              </div>
              {loading ? (
                <Skeleton className='h-7 w-24' />
              ) : (
                <p className='text-2xl font-bold text-foreground'>
                  ₹{Number(todaySales?.total_net_sales || 0).toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4 space-y-1'>
              <div className='flex items-center gap-2'>
                <IndianRupee className='w-4 h-4 text-muted-foreground' />
                <p className='text-xs text-muted-foreground'>Net Counter</p>
              </div>
              {loading ? (
                <Skeleton className='h-7 w-24' />
              ) : (
                <p className='text-2xl font-bold text-foreground'>
                  ₹{Number(todaySales?.total_net_counter || 0).toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4 space-y-1'>
              <div className='flex items-center gap-2'>
                <GitBranch className='w-4 h-4 text-muted-foreground' />
                <p className='text-xs text-muted-foreground'>
                  Branches Reported
                </p>
              </div>
              {loading ? (
                <Skeleton className='h-7 w-16' />
              ) : (
                <p className='text-2xl font-bold text-foreground'>
                  {todaySales?.branches_reported || 0}
                  <span className='text-sm font-normal text-muted-foreground ml-1'>
                    / {stats?.branches.active || 0}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Operational Alerts */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground'>
          Operational Alerts
        </h3>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
          <AlertCard
            title='Pending Transfers'
            value={ops?.pending_transfers ?? 0}
            subtitle='awaiting approval'
            icon={ArrowRightLeft}
            color='bg-yellow-500/10 text-yellow-600'
            path='/dashboard/transfers'
            loading={loading}
            urgent
          />

          <AlertCard
            title='Out of Stock'
            value={ops?.out_of_stock ?? 0}
            subtitle='raw materials'
            icon={PackageX}
            color='bg-red-500/10 text-red-600'
            path='/dashboard/purchases/stock-dashboard'
            loading={loading}
            urgent
          />

          <AlertCard
            title='Low Stock'
            value={ops?.low_stock ?? 0}
            subtitle='need restocking'
            icon={Package}
            color='bg-orange-500/10 text-orange-600'
            path='/dashboard/purchases/stock-dashboard'
            loading={loading}
            urgent
          />

          <AlertCard
            title='Pending Pre-Bookings'
            value={ops?.pending_prebookings ?? 0}
            subtitle='need confirmation'
            icon={CalendarCheck}
            color='bg-blue-500/10 text-blue-600'
            path='/dashboard/prebooking/orders'
            loading={loading}
            urgent
          />

          <AlertCard
            title="Today's Deliveries"
            value={ops?.today_deliveries ?? 0}
            subtitle='pre-bookings due today'
            icon={Clock}
            color='bg-violet-500/10 text-violet-600'
            path='/dashboard/prebooking/orders'
            loading={loading}
          />

          <AlertCard
            title='Confirmed Orders'
            value={ops?.confirmed_prebookings ?? 0}
            subtitle='pre-bookings confirmed'
            icon={CalendarCheck}
            color='bg-green-500/10 text-green-600'
            path='/dashboard/prebooking/orders'
            loading={loading}
          />

          <AlertCard
            title='Vendor Outstanding'
            value={`₹${Number(ops?.vendor_outstanding || 0).toFixed(0)}`}
            subtitle='pending payments'
            icon={Wallet}
            color='bg-pink-500/10 text-pink-600'
            path='/dashboard/payments/pending'
            loading={loading}
            urgent
          />
        </div>
      </div>

      <Separator />

      {/* Org Stats */}
      {(isAdmin || isSuperAdmin) && (
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold text-foreground'>
            Organisation
          </h3>
          <div
            className={cn(
              "grid gap-4",
              isSuperAdmin
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-3",
            )}
          >
            {orgCards.map((card) => (
              <StatCard key={card.title} {...card} loading={loading} />
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Recent Purchases */}
      {(isAdmin || canManageStore) && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold text-foreground'>
              Recent Purchases
            </h3>
            <Button
              variant='ghost'
              size='sm'
              className='gap-1 text-xs h-7'
              onClick={() => navigate("/dashboard/purchases")}
            >
              View all <ArrowRight className='w-3 h-3' />
            </Button>
          </div>

          {loading ? (
            <div className='space-y-2'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : !stats?.recent_purchases?.length ? (
            <div className='text-center py-8 text-muted-foreground text-sm'>
              No purchases yet.
            </div>
          ) : (
            <Card>
              <CardContent className='p-0'>
                <div className='divide-y'>
                  {stats.recent_purchases.map((p) => (
                    <div
                      key={p.id}
                      className='flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors'
                      onClick={() => navigate(`/dashboard/purchases/${p.id}`)}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='p-1.5 rounded-md bg-primary/10'>
                          <ShoppingCart className='w-3.5 h-3.5 text-primary' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-foreground'>
                            {p.vendor_name}
                          </p>
                          <p className='text-xs text-muted-foreground font-mono'>
                            {p.invoice_number}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-semibold text-foreground'>
                          ₹{Number(p.total_cost).toFixed(2)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {format(
                            new Date(`${p.purchase_date}T00:00:00`),
                            "dd MMM yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Separator />

      {/* Quick Actions */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground'>Quick Actions</h3>
        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            {
              label: "New Purchase",
              desc: "Record a vendor purchase",
              icon: ShoppingCart,
              path: "/dashboard/purchases/new",
            },
            {
              label: "New Pre-Booking",
              desc: "Create a customer order",
              icon: CalendarCheck,
              path: "/dashboard/prebooking/new",
            },
            {
              label: "Add Sales",
              desc: "Enter today's daily sales",
              icon: TrendingUp,
              path: "/dashboard/sales/add",
            },
            {
              label: "Stock Transfer",
              desc: "Request stock from store",
              icon: ArrowRightLeft,
              path: "/dashboard/transfers/new",
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className='flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left'
            >
              <div className='p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0'>
                <action.icon className='w-4 h-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-foreground'>
                  {action.label}
                </p>
                <p className='text-xs text-muted-foreground truncate'>
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <Separator />
      <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground pb-4'>
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
