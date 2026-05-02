import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { UserRole } from "./backend.d";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import EditInvoicePage from "./pages/EditInvoicePage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import NewInvoicePage from "./pages/NewInvoicePage";
import SavedMedicinesPage from "./pages/SavedMedicinesPage";
import SettingsPage from "./pages/SettingsPage";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/dashboard" />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/dashboard",
  component: DashboardPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/invoices",
  component: InvoicesPage,
});

const newInvoiceRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/invoices/new",
  component: NewInvoicePage,
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/invoices/$id",
  component: InvoiceDetailPage,
});

const editInvoiceRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/invoices/$id/edit",
  component: EditInvoicePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/settings",
  component: SettingsPage,
});

const medicinesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/medicines",
  component: SavedMedicinesPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <ProtectedRoute requiredRole={UserRole.admin}>
      <Layout>
        <AdminPage />
      </Layout>
    </ProtectedRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedLayout.addChildren([
    dashboardRoute,
    invoicesRoute,
    newInvoiceRoute,
    invoiceDetailRoute,
    editInvoiceRoute,
    settingsRoute,
    medicinesRoute,
  ]),
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
