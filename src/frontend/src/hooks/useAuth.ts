import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createActor } from "../backend";
import {
  useCallerTenantStatus,
  useInitializeAccessControl,
  useIsAdmin,
  useIsCallerAdminPhone,
  useUserRole,
} from "./useQueries";

export function useAuth() {
  const { loginStatus, login, clear, identity, isAuthenticated } =
    useInternetIdentity();
  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";

  // Ensure the caller is registered in the backend on every authenticated session.
  // _initializeAccessControl is idempotent: first caller becomes admin, rest become users.
  useInitializeAccessControl();

  // Auto-register tenant on every authenticated session (idempotent).
  // shopName and email default to empty strings; shop owners fill them in settings.
  const { actor } = useActor(createActor);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !actor) return;
    // Fire-and-forget: registerTenant is idempotent — safe to call on every login
    actor
      .registerTenant("", "")
      .then(() => {
        qc.invalidateQueries({ queryKey: ["callerTenantStatus"] });
      })
      .catch(() => {
        // Silently ignore — may fail if actor isn't ready yet; will retry on next mount
      });
  }, [isAuthenticated, actor, qc]);

  return {
    isAuthenticated,
    isLoading,
    identity,
    login,
    logout: clear,
    loginStatus,
  };
}

export function useCurrentUser() {
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: isRoleAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isPhoneAdmin, isLoading: phoneLoading } =
    useIsCallerAdminPhone();

  // isAdmin requires BOTH: backend role === admin AND phone matches ADMIN_PHONE
  const isAdmin = (isRoleAdmin ?? false) && (isPhoneAdmin ?? false);

  return {
    userRecord: null,
    role,
    isAdmin,
    isLoading: roleLoading || adminLoading || phoneLoading,
    tier: "user",
    displayName: "Practitioner",
  };
}

/** Convenience hook: returns the caller's tenant subscription status string */
export function useTenantStatus() {
  const { data: status } = useCallerTenantStatus();
  return status ?? null;
}
