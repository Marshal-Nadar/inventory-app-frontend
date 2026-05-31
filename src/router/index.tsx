import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { UsersPage } from "@/pages/dashboard/users/UsersPage";
import { RestaurantsPage } from "@/pages/dashboard/restaurants/RestaurantsPage";
import { BranchesPage } from "@/pages/dashboard/branches/BranchesPage";
import { RolesPage } from "@/pages/dashboard/roles/RolesPage";
import { DashboardHome } from "@/pages/dashboard/DashboardHome";
import { RawMaterialsPage } from "@/pages/dashboard/rawMaterials/RawMaterialsPage";
import { VendorsPage } from "@/pages/dashboard/vendors/VendorsPage";
import { PurchasesPage } from "@/pages/dashboard/purchases/PurchasesPage";
import { PurchaseForm } from "@/pages/dashboard/purchases/PurchaseForm";
import { PurchaseDetailPage } from "@/pages/dashboard/purchases/PurchaseDetailPage";
import { PurchaseReportPage } from "@/pages/dashboard/purchases/PurchaseReportPage";
import { AddRawMaterialsPage } from "@/pages/dashboard/rawMaterials/AddRawMaterialsPage";
import { StockSummaryPage } from "@/pages/dashboard/purchases/StockSummaryPage";
import { TransferRequestsPage } from "@/pages/dashboard/transfers/TransferRequestsPage";
import { NewTransferRequestPage } from "@/pages/dashboard/transfers/NewTransferRequestPage";
import { StockDashboardPage } from "@/pages/dashboard/purchases/StockDashboardPage";
import { BranchStockViewPage } from "@/pages/dashboard/transfers/BranchStockViewPage";
import { VendorPaymentsPage } from "@/pages/dashboard/payments/VendorPaymentsPage";
import { PaymentReceiptPage } from "@/pages/dashboard/payments/PaymentReceiptPage";
import { PendingPaymentsPage } from "@/pages/dashboard/payments/PendingPaymentsPage";
import { ManageExpenseTypesPage } from "@/pages/dashboard/miscExpense/ManageExpenseTypesPage";
import { AddMiscExpensePage } from "@/pages/dashboard/miscExpense/AddMiscExpensePage";
import { ExpenseListPage } from "@/pages/dashboard/miscExpense/ExpenseListPage";
import { ExpenseReportPage } from "@/pages/dashboard/miscExpense/ExpenseReportPage";
import { ProductsPage } from "@/pages/dashboard/prebooking/ProductsPage";
import { CreatePreBookingPage } from "@/pages/dashboard/prebooking/CreatePreBookingPage";
import { PreBookingDetailPage } from "@/pages/dashboard/prebooking/PreBookingDetailPage";
import { PreBookingOrdersPage } from "@/pages/dashboard/prebooking/PreBookingOrdersPage";
import { ProductReportPage } from "@/pages/dashboard/prebooking/ProductReportPage";
import { AddSalesPage } from "@/pages/sales/AddSalesPage";
import { SalesReportPage } from "@/pages/sales/SalesReportPage";
import { PrintSettingsPage } from "@/pages/dashboard/settings/PrintSettingsPage";
import { StockLedgerPage } from "@/pages/dashboard/stockLedger/StockLedgerPage";
import { VendorReportPage } from "@/pages/dashboard/purchases/VendorReportPage";
import { ChangePasswordPage } from "@/pages/dashboard/settings/ChangePasswordPage";

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
      { path: "misc-expense/add", element: <AddMiscExpensePage /> },
      { path: "misc-expense/list", element: <ExpenseListPage /> },
      { path: "misc-expense/report", element: <ExpenseReportPage /> },
      { path: "misc-expense/types", element: <ManageExpenseTypesPage /> },
      { path: "raw-materials", element: <RawMaterialsPage /> },
      { path: "raw-materials/add", element: <AddRawMaterialsPage /> },
      { path: "vendors", element: <VendorsPage /> },
      { path: "purchases", element: <PurchasesPage /> },
      { path: "purchases/new", element: <PurchaseForm /> },
      { path: "purchases/stock-dashboard", element: <StockDashboardPage /> },
      { path: "purchases/:id", element: <PurchaseDetailPage /> },
      { path: "purchases/purchase-report", element: <PurchaseReportPage /> },
      { path: "purchases/stock-summary", element: <StockSummaryPage /> },
      { path: "purchases/stock-ledger", element: <StockLedgerPage /> },
      { path: "purchases/vendor-report", element: <VendorReportPage /> },
      { path: "transfers", element: <TransferRequestsPage /> },
      { path: "transfers/new", element: <NewTransferRequestPage /> },
      { path: "transfers/branch-stock", element: <BranchStockViewPage /> },
      { path: "payments/vendors", element: <VendorPaymentsPage /> },
      { path: "payments/receipts", element: <PaymentReceiptPage /> },
      { path: "payments/pending", element: <PendingPaymentsPage /> },
      { path: "prebooking/products", element: <ProductsPage /> },
      { path: "prebooking/new", element: <CreatePreBookingPage /> },
      { path: "prebooking/orders", element: <PreBookingOrdersPage /> },
      { path: "prebooking/orders/:id", element: <PreBookingDetailPage /> },
      { path: "prebooking/report", element: <ProductReportPage /> },
      { path: "sales/add", element: <AddSalesPage /> },
      { path: "sales/report", element: <SalesReportPage /> },
      { path: "settings/appearance", element: <SettingsPage /> },
      { path: "settings/print", element: <PrintSettingsPage /> },
      { path: "settings/change-password", element: <ChangePasswordPage /> },
    ],
  },
  {
    path: "/",
    element: <Navigate to='/login' replace />,
  },
]);
