import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { UsersPage } from "@/pages/dashboard/users/UsersPage";

const DashboardHome = () => (
  <div className='space-y-4'>
    <h2 className='text-2xl font-bold text-foreground'>Welcome back 👋</h2>
    <p className='text-muted-foreground'>
      Dashboard home — coming in next step.
    </p>
  </div>
);

const PlaceholderPage = ({ name }: { name: string }) => (
  <div className='space-y-4'>
    <h2 className='text-2xl font-bold text-foreground'>{name}</h2>
    <p className='text-muted-foreground'>This page is coming soon.</p>
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
      { path: "restaurants", element: <PlaceholderPage name='Restaurants' /> },
      { path: "branches", element: <PlaceholderPage name='Branches' /> },
      // { path: "users", element: <PlaceholderPage name='Users' /> },
      { path: "roles", element: <PlaceholderPage name='Roles' /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
  {
    path: "/",
    element: <Navigate to='/login' replace />,
  },
]);
