import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { UsersPage } from "@/pages/dashboard/users/UsersPage";
import { RestaurantsPage } from "@/pages/dashboard/restaurants/RestaurantsPage";
import { BranchesPage } from "@/pages/dashboard/branches/BranchesPage";
import { RolesPage } from "@/pages/dashboard/roles/RolesPage";

const DashboardHome = () => (
  <div className='space-y-4'>
    <h2 className='text-2xl font-bold text-foreground'>Welcome back 👋</h2>
    <p className='text-muted-foreground'>
      Dashboard home — coming in next step.
    </p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "restaurants", element: <RestaurantsPage /> },
      { path: "branches", element: <BranchesPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "roles", element: <RolesPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/",
    element: <Navigate to='/login' replace />,
  },
]);
