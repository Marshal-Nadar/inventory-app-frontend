# Restaurant Management — Frontend

A modular, production-grade React dashboard for managing multi-branch restaurant operations — built with React 18, TypeScript, Vite, shadcn/ui, and Tailwind CSS v4.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Installation Steps](#installation-steps)
5. [Environment Variables](#environment-variables)
6. [State Management](#state-management)
7. [Theme System](#theme-system)
8. [Routing & Auth Guard](#routing--auth-guard)
9. [Super Admin vs Restaurant Admin](#super-admin-vs-restaurant-admin)
10. [Pages & Features](#pages--features)
11. [API Integration](#api-integration)
12. [Component Architecture](#component-architecture)
13. [Best Practices Used](#best-practices-used)
14. [Future Improvements](#future-improvements)

---

## Project Overview

A fully featured dashboard application that communicates with the Restaurant Management API. Supports multi-restaurant management, user and role administration, branch operations, and a fully configurable theme system — all controlled per-restaurant with proper role-based access.

### What it does

- JWT-based login with persistent session via localStorage
- Two-tier access — Super Admin (above all) and Restaurant Admin (scoped)
- Role-aware navigation — different sidebar items per role
- Full CRUD for Users, Restaurants, Branches, and Roles
- TanStack Table — sort, filter, search on all data tables
- Configurable appearance — light/dark, sidebar mode, scale, radius, layout
- Theme settings persisted globally via Redux + localStorage
- Protected routes — unauthenticated users redirected to login
- Impersonation support — admin logs in as any user

---

## Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Framework        | React 18 + Vite                 |
| Language         | TypeScript                      |
| UI Components    | shadcn/ui (Radix + Nova preset) |
| Styling          | Tailwind CSS v4                 |
| Routing          | React Router v6                 |
| State Management | Redux Toolkit + React Redux     |
| HTTP Client      | Axios (with auth interceptor)   |
| Table            | TanStack Table v8               |
| Icons            | Lucide React                    |
| Font             | Geist Variable                  |

---

## Project Structure

```
inventory-app-frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ThemeToggle.tsx              # Reusable light/dark toggle
│   │   │   └── DeleteConfirmDialog.tsx      # Reusable delete/deactivate modal
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx          # Sidebar + header + content shell
│   │   │   ├── Sidebar.tsx                  # Collapsible role-filtered nav
│   │   │   └── Header.tsx                   # Top bar — title, theme, user menu
│   │   └── ui/                              # shadcn auto-generated components
│   ├── config/
│   │   └── navigation.ts                    # Nav items with role + superAdminOnly config
│   ├── hooks/
│   │   ├── useAppDispatch.ts                # Typed Redux dispatch
│   │   ├── useAppSelector.ts                # Typed Redux selector
│   │   └── useThemeApplier.ts               # Applies theme to document root
│   ├── lib/
│   │   ├── axios.ts                         # Axios instance with JWT interceptor
│   │   └── utils.ts                         # shadcn cn() utility
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx                # Login form
│   │   └── dashboard/
│   │       ├── SettingsPage.tsx             # Theme settings panel
│   │       ├── branches/
│   │       │   ├── BranchesPage.tsx         # Branches CRUD table
│   │       │   └── BranchFormDialog.tsx     # Create/Edit branch modal
│   │       ├── restaurants/
│   │       │   ├── RestaurantsPage.tsx      # Restaurants CRUD table
│   │       │   └── RestaurantFormDialog.tsx # Create/Edit restaurant modal
│   │       ├── roles/
│   │       │   ├── RolesPage.tsx            # Roles CRUD table
│   │       │   └── RoleFormDialog.tsx       # Create/Edit role modal
│   │       └── users/
│   │           ├── UsersPage.tsx            # Users CRUD table
│   │           └── UserFormDialog.tsx       # Create/Edit user modal
│   ├── providers/
│   │   ├── AppProviders.tsx                 # Root provider wrapper
│   │   └── ThemeApplier.tsx                 # Mounts theme hook globally
│   ├── router/
│   │   ├── index.tsx                        # All route definitions
│   │   └── ProtectedRoute.tsx               # Auth guard
│   ├── services/
│   │   ├── branchService.ts                 # Branch API calls
│   │   ├── restaurantService.ts             # Restaurant API calls
│   │   ├── roleService.ts                   # Role API calls
│   │   └── userService.ts                   # User API calls
│   ├── store/
│   │   ├── index.ts                         # Redux store
│   │   └── slices/
│   │       ├── authSlice.ts                 # Auth state
│   │       └── themeSlice.ts                # Theme state
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                            # Tailwind v4 + shadcn CSS variables
├── components.json                          # shadcn config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Installation Steps

### Prerequisites

- Node.js v18+
- npm
- `inventory-app` backend running on port 3001

### 1. Clone and install

```bash
git clone https://github.com/your-username/inventory-app-frontend.git
cd inventory-app-frontend
npm install
```

### 2. Run

```bash
npm run dev
```

App runs on `http://localhost:5173`.

---

## Environment Variables

API base URL is set in `src/lib/axios.ts`. To make it configurable create `.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Then update `src/lib/axios.ts`:

```typescript
baseURL: import.meta.env.VITE_API_BASE_URL;
```

---

## State Management

Redux Toolkit manages two global slices.

### Auth Slice

```typescript
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  branch_id: number | null;
  restaurant_id: number | null;
  is_super_admin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}
```

Persisted in `localStorage` under `auth_token` and `auth_user`. Rehydrated on page load.

**Actions:** `setCredentials({ user, token })`, `logout()`

### Theme Slice

```typescript
interface ThemeSettings {
  colorMode: "light" | "dark";
  preset: "lake-view" | "default" | "sunset" | "forest";
  scale: "xs" | "sm" | "md" | "lg";
  radius: "sm" | "md" | "lg" | "xl";
  sidebarMode: "default" | "icon";
  contentLayout: "full" | "centered";
}
```

Persisted in `localStorage` under `theme_settings`.

**Actions:** `setColorMode`, `setPreset`, `setScale`, `setRadius`, `setSidebarMode`, `setContentLayout`, `resetTheme`, `applyTheme`

---

## Theme System

`useThemeApplier` hook applies theme state to `document.documentElement` on every change:

```typescript
root.classList.add(theme.colorMode); // 'light' or 'dark'
root.setAttribute("data-scale", theme.scale);
root.setAttribute("data-radius", theme.radius);
root.setAttribute("data-preset", theme.preset);
root.setAttribute("data-sidebar", theme.sidebarMode);
root.setAttribute("data-layout", theme.contentLayout);
```

Tailwind v4 dark mode:

```css
@custom-variant dark (&:is(.dark *));
```

### Settings Page

Located at `/dashboard/settings`. Only `admin`, `manager`, and `super_admin` can edit. Others see read-only view.

Controls: Color Mode, Theme Preset, Scale, Radius, Sidebar Mode, Content Layout, Reset to Default.

### ThemeToggle

Reusable `<ThemeToggle />` component — Sun/Moon icon button. Available on every page via Header. Also on LoginPage before authentication.

---

## Routing & Auth Guard

```
/                          → redirect to /login
/login                     → LoginPage (public)
/dashboard                 → DashboardLayout (protected)
  /dashboard               → DashboardHome
  /dashboard/restaurants   → RestaurantsPage (super admin only)
  /dashboard/branches      → BranchesPage (admin, manager)
  /dashboard/users         → UsersPage (admin, manager, super_admin)
  /dashboard/roles         → RolesPage (admin, super_admin)
  /dashboard/settings      → SettingsPage (admin, manager, super_admin)
```

### ProtectedRoute

Reads `isAuthenticated` from Redux. Redirects to `/login` if false.

---

## Super Admin vs Restaurant Admin

|                       | Super Admin                    | Restaurant Admin           |
| --------------------- | ------------------------------ | -------------------------- |
| `is_super_admin`      | true                           | false                      |
| `restaurant_id`       | null                           | their restaurant           |
| Sidebar — Restaurants | Visible                        | Hidden                     |
| Sidebar — Branches    | Hidden                         | Visible                    |
| Users list            | All restaurants                | Own restaurant only        |
| Restaurants list      | All                            | N/A                        |
| Branches list         | All                            | Own restaurant only        |
| Roles list            | All                            | Own restaurant only        |
| Header badge          | "Super Admin"                  | —                          |
| Create branch/role    | Picks restaurant from dropdown | Auto-uses their restaurant |

### Navigation filtering

```typescript
const filteredNav = navItems.filter((item) => {
  if (!user) return false;
  if (item.superAdminOnly) return user.is_super_admin;
  if (item.hideForSuperAdmin && user.is_super_admin) return false;
  return item.roles.includes(user.role);
});
```

---

## Pages & Features

### Login Page (`/login`)

- Email + password form
- Calls `POST /api/auth/login`
- Stores token + full user object in Redux + localStorage
- Redirects to `/dashboard` on success
- Theme toggle available before login

### Dashboard Layout

- **Sidebar** — collapsible (240px to 64px icon-only). Role-filtered nav. User info at bottom. Toggle button on edge.
- **Header** — page title, ThemeToggle, user avatar dropdown (settings + logout). Super Admin badge for super admin users.
- **Main content** — scrollable, respects `contentLayout` (full / centered max-w-5xl)

### Restaurants Page (`/dashboard/restaurants`) — Super Admin only

- All restaurants with status (active/inactive)
- Columns: Name, Slug, Timezone, Status, Created, Actions
- Create with auto-generated slug from name
- Edit name, slug, timezone
- Deactivate / Activate toggle
- Stats bar — Total, Active, Inactive count

### Branches Page (`/dashboard/branches`) — Admin, Manager

- Branches scoped to logged-in user's restaurant
- Columns: Branch Name, Restaurant, Address, Phone, Status, Created, Actions
- Manager sees table read-only — no edit/deactivate buttons
- Admin can create, edit, deactivate, activate
- Only active branches shown in user creation dropdown

### Users Page (`/dashboard/users`) — Admin, Manager, Super Admin

- Users scoped by restaurant (super admin sees all)
- Super admins never appear in non-super-admin user lists
- Columns: Name, Email, Role (badge), Branch, Restaurant, Status, Joined, Actions
- Search by name, email, role, branch
- Create — name, email, password, branch (active only), role dropdowns
- Edit — update name, email, branch, role (no password field)
- Delete with confirmation dialog
- Shows filtered vs total count

### Roles Page (`/dashboard/roles`) — Admin, Super Admin

- Roles scoped by restaurant (super admin sees all)
- Default roles marked with "Default" badge
- Columns: Role Name, Description, Restaurant, Created, Actions
- Create — super admin gets restaurant picker, admin auto-uses their restaurant
- Edit role name and description
- Delete with three-layer safety check:
  - Default roles blocked
  - Roles with active users blocked
  - Custom roles with no users allowed
- Stats bar — Total, Default, Custom count

### Settings Page (`/dashboard/settings`)

Full theme configuration. See [Theme System](#theme-system).

---

## API Integration

All calls go through `src/lib/axios.ts` — auto-injects JWT token:

```typescript
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Services

| File                   | Endpoints          | Methods                                           |
| ---------------------- | ------------------ | ------------------------------------------------- |
| `restaurantService.ts` | `/api/restaurants` | getAll, getById, create, update, delete, activate |
| `branchService.ts`     | `/api/branches`    | getAll, getById, create, update, delete, activate |
| `userService.ts`       | `/api/users`       | getAll, getById, create, update, delete           |
| `roleService.ts`       | `/api/roles`       | getAll, getById, create, update, delete           |

---

## Component Architecture

### Reusable Components

**`ThemeToggle`** — Sun/Moon button. Dispatches `setColorMode`. Used in Header and LoginPage.

**`DeleteConfirmDialog`** — Uses `Button` instead of `AlertDialogAction` to prevent auto-close on API error. Accepts `error` prop to show inline error inside dialog without closing it.

### Form Dialogs

| Dialog                 | Create                              | Edit              | Special                            |
| ---------------------- | ----------------------------------- | ----------------- | ---------------------------------- |
| `UserFormDialog`       | name, email, password, branch, role | no password field | filters inactive branches          |
| `BranchFormDialog`     | name, address, phone                | same fields       | restaurant auto from user          |
| `RestaurantFormDialog` | name, slug, timezone                | same fields       | slug auto-generated from name      |
| `RoleFormDialog`       | name, description                   | same fields       | super admin gets restaurant picker |

### Layout Components

**`DashboardLayout`** — `flex h-screen` with `min-w-0` on main area to prevent flex overflow right-side gap.

**`Sidebar`** — `flex-shrink-0` prevents icon compression. `w-[64px]` collapsed, `w-60` expanded. `overflow-x-hidden` prevents icon bleed.

---

## Best Practices Used

### Typed Redux Hooks

`useAppDispatch` and `useAppSelector` provide full TypeScript inference.

### Axios Interceptor

Single interceptor injects auth token for all requests. Services never manage tokens directly.

### TanStack Table Pattern

Every CRUD page follows the same structure — fetch on mount, useMemo columns, client-side search, SortingState, form dialog, confirm dialog, refetch after mutation.

### Role-Based UI

Nav items filtered by role and `is_super_admin`. Action buttons hidden for viewer roles. Settings read-only for non-admin. Dropdowns only show active records.

### Separation of Concerns

| Layer          | Responsibility                         |
| -------------- | -------------------------------------- |
| Pages          | Orchestrate state, events, composition |
| Services       | All API calls, typed interfaces        |
| Store / Slices | Global state, persistence              |
| Components     | Pure UI, props in, events out          |
| Hooks          | Reusable stateful logic                |

---

## Future Improvements

### Toast Notifications

Replace silent success states with toasts using shadcn `sonner`.

### Zod Form Validation

Field-level validation with inline error messages on all forms.

### Pagination

Server-side pagination with TanStack Table `PaginationState`.

### Refresh Token

Silent token refresh — intercept 401, call refresh endpoint, retry original request.

### Dashboard Home

Summary cards — total restaurants, branches, users. Recent activity feed.

### Menu, Orders, Inventory Pages

Remaining modules following the same CRUD page pattern.

### Docker

Docker Compose for consistent dev and deployment environments.

---

## Scripts

```bash
npm run dev      # Development server
npm run build    # TypeScript + Vite production build
npm run preview  # Preview production build
```

---

## License

ISC
