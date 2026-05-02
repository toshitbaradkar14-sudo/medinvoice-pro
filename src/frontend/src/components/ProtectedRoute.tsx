import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigate } from "@tanstack/react-router";
import { AlertCircle, Clock } from "lucide-react";
import type { ReactNode } from "react";
import { UserRole } from "../backend.d";
import { useAuth, useCurrentUser } from "../hooks/useAuth";
import { useCallerTenantStatus } from "../hooks/useQueries";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isAdmin, isLoading: userLoading } = useCurrentUser();
  const { data: tenantStatus, isLoading: statusLoading } =
    useCallerTenantStatus();

  if (authLoading || userLoading || statusLoading) {
    return (
      <div className="p-8 space-y-4" data-ocid="auth.loading_state">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Admin users bypass subscription status checks
  if (!isAdmin && tenantStatus === "suspended") {
    return <Navigate to="/login" search={{ reason: "suspended" }} />;
  }

  if (!isAdmin && tenantStatus === "expired") {
    return <Navigate to="/login" search={{ reason: "expired" }} />;
  }

  if (!isAdmin && tenantStatus === "pending") {
    // Attempt to read approvalCode from extended tenant data if available
    const approvalCode = (tenantStatus as unknown as { approvalCode?: string })
      ?.approvalCode;
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-8"
        data-ocid="auth.pending.panel"
      >
        <div className="max-w-md text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-yellow-600" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Awaiting Admin Approval
          </h2>
          <p className="text-muted-foreground text-sm">
            Your account is pending admin approval. Please wait.
          </p>
          {approvalCode && (
            <div
              className="rounded-lg border border-yellow-300/60 bg-yellow-500/8 px-4 py-3 space-y-1"
              data-ocid="auth.pending.approval_code.panel"
            >
              <p className="text-xs text-muted-foreground">
                Your approval code is:
              </p>
              <p
                className="text-2xl font-mono font-bold tracking-widest text-foreground"
                data-ocid="auth.pending.approval_code.value"
              >
                {approvalCode}
              </p>
              <p className="text-xs text-muted-foreground">
                Share this code with the admin to get approved.
              </p>
            </div>
          )}
          <Button
            variant="outline"
            onClick={logout}
            className="mt-2"
            data-ocid="auth.pending.logout_button"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin && tenantStatus === "rejected") {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-8"
        data-ocid="auth.rejected.panel"
      >
        <div className="max-w-md text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Registration Rejected
          </h2>
          <p className="text-muted-foreground text-sm">
            Your account registration was rejected.
          </p>
          <Button
            variant="outline"
            onClick={logout}
            className="mt-2"
            data-ocid="auth.rejected.logout_button"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (requiredRole === UserRole.admin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}
