import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  AdminTenantView,
  CreateInvoiceArgs,
  InvoiceFilter,
  InvoiceView,
  PracticeSettingsView,
  SavePracticeSettingsArgs,
  TenantStatus,
  UpdateInvoiceArgs,
  UserRole,
} from "../backend.d";

// ─── Auth & User ───────────────────────────────────────────────────────────

/**
 * Calls _initializeAccessControl on the backend and tracks completion.
 * Returns isInitialized=true only after the call resolves successfully.
 * All invoice hooks must gate on isInitialized before firing.
 */
export function useInitializeAccessControl() {
  const { actor, isFetching } = useActor(createActor);
  const { data: isInitialized = false } = useQuery<boolean>({
    queryKey: ["accessControlInitialized"],
    queryFn: async () => {
      if (!actor) return false;
      await actor._initializeAccessControl();
      return true;
    },
    enabled: !!actor && !isFetching,
    // Never re-fetch automatically — initialization is a one-time setup
    staleTime: Number.POSITIVE_INFINITY,
    retry: 2,
  });
  return isInitialized;
}

/** Returns true once _initializeAccessControl has completed successfully. */
function useIsInitialized(): boolean {
  const qc = useQueryClient();
  const state = qc.getQueryState(["accessControlInitialized"]);
  return state?.data === true;
}

export function useUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return "guest" as UserRole;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Invoices ─────────────────────────────────────────────────────────────

export function useInvoices(filter: InvoiceFilter = {}) {
  const { actor, isFetching } = useActor(createActor);
  const isInitialized = useIsInitialized();
  return useQuery<InvoiceView[]>({
    queryKey: ["invoices", filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listInvoices(filter);
    },
    enabled: !!actor && !isFetching && isInitialized,
    staleTime: 30 * 1000,
  });
}

export function useInvoice(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  const isInitialized = useIsInitialized();
  return useQuery<InvoiceView | null>({
    queryKey: ["invoice", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getInvoice(id);
    },
    enabled: !!actor && !isFetching && id !== null && isInitialized,
  });
}

export function useInvoiceTotalCount() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<bigint>({
    queryKey: ["invoiceTotalCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getInvoiceTotalCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

/**
 * Admin-only backend call — Runtime.traps for non-admins.
 * Pass `adminEnabled=true` only when the caller is confirmed admin.
 */
export function useInvoiceStatusBreakdown(adminEnabled = false) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<{
    cancelled: bigint;
    paid: bigint;
    sent: bigint;
    draft: bigint;
  }>({
    queryKey: ["invoiceStatusBreakdown"],
    queryFn: async () => {
      if (!actor) return { cancelled: 0n, paid: 0n, sent: 0n, draft: 0n };
      return actor.getInvoiceStatusBreakdown();
    },
    enabled: !!actor && !isFetching && adminEnabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Admin-only backend call — Runtime.traps for non-admins.
 * Pass `adminEnabled=true` only when the caller is confirmed admin.
 */
export function useRevenueByMonth(adminEnabled = false) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["revenueByMonth"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRevenueByMonth();
    },
    enabled: !!actor && !isFetching && adminEnabled,
  });
}

export function useCreateInvoice() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<InvoiceView, Error, CreateInvoiceArgs>({
    mutationFn: async (args: CreateInvoiceArgs) => {
      if (!actor)
        throw new Error("Actor not ready — please wait a moment and try again");
      // Ensure access control is initialized before creating
      const isInitialized =
        qc.getQueryState(["accessControlInitialized"])?.data === true;
      if (!isInitialized) {
        // Try to initialize now if not done yet
        await actor._initializeAccessControl();
        qc.setQueryData(["accessControlInitialized"], true);
      }
      const result = await actor.createInvoice(args);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoiceTotalCount"] });
      qc.invalidateQueries({ queryKey: ["invoiceStatusBreakdown"] });
    },
  });
}

export function useUpdateInvoice() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, UpdateInvoiceArgs>({
    mutationFn: async (args: UpdateInvoiceArgs) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateInvoice(args);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", vars.id.toString()] });
      qc.invalidateQueries({ queryKey: ["invoiceStatusBreakdown"] });
    },
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, bigint>({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      const isInitialized =
        qc.getQueryState(["accessControlInitialized"])?.data === true;
      if (!isInitialized) throw new Error("Not initialized");
      return actor.deleteInvoice(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoiceTotalCount"] });
      qc.invalidateQueries({ queryKey: ["invoiceStatusBreakdown"] });
    },
  });
}

export function useDeleteAllInvoices() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const isInitialized =
        qc.getQueryState(["accessControlInitialized"])?.data === true;
      if (!isInitialized) throw new Error("Not initialized");
      await actor.deleteAllInvoices();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoiceTotalCount"] });
      qc.invalidateQueries({ queryKey: ["invoiceStatusBreakdown"] });
    },
  });
}

// ─── Subscription ─────────────────────────────────────────────────────────
// Subscription module removed — hooks kept as stubs for backwards compat

export function useChangeSubscription() {
  return useMutation<void, Error, string>({
    mutationFn: async () => {
      /* subscription removed */
    },
  });
}

// ─── Practice Settings ────────────────────────────────────────────────────

export function usePracticeSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PracticeSettingsView | null>({
    queryKey: ["practiceSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerPracticeSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePracticeSettings() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, SavePracticeSettingsArgs>({
    mutationFn: async (args: SavePracticeSettingsArgs) => {
      if (!actor) throw new Error("Not connected");
      return actor.savePracticeSettings(args);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practiceSettings"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────

export function useListAllUsers() {
  // listAllUsers removed from backend with subscription module
  return useQuery<[]>({
    queryKey: ["allUsers"],
    queryFn: async () => [],
  });
}

export function useAssignUserRole() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, { userId: string; role: UserRole }>({
    mutationFn: async ({ userId, role }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.assignCallerUserRole(Principal.fromText(userId), role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAdminChangeTier() {
  // adminChangeTier removed with subscription module
  return useMutation<void, Error, { userId: string; tier: string }>({
    mutationFn: async () => {
      /* subscription removed */
    },
  });
}

// ─── Tenant / Multi-Tenant ────────────────────────────────────────────────

export function useRegisterTenant(shopName: string, phone: string) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.registerTenant(shopName, phone);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerTenantStatus"] });
    },
  });
}

export function useCallerTenantStatus() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<TenantStatus | null>({
    queryKey: ["callerTenantStatus"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerTenantStatus();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

export function useAdminListTenants(search?: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminTenantView[]>({
    queryKey: ["adminTenants", search ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminListTenants(search ?? null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useAdminGetTenant(tenantId: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminTenantView | null>({
    queryKey: ["adminTenant", tenantId],
    queryFn: async () => {
      if (!actor || !tenantId) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.adminGetTenant(Principal.fromText(tenantId));
    },
    enabled: !!actor && !isFetching && !!tenantId,
  });
}

export function useAdminSetTenantStatus() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    AdminTenantView,
    Error,
    { tenantId: string; status: TenantStatus }
  >({
    mutationFn: async ({ tenantId, status }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.adminSetTenantStatus(
        Principal.fromText(tenantId),
        status,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminTenant"] });
    },
  });
}

export function useAdminExtendTenantExpiry() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    AdminTenantView,
    Error,
    { tenantId: string; newExpiresAt: bigint }
  >({
    mutationFn: async ({ tenantId, newExpiresAt }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.adminExtendTenantExpiry(
        Principal.fromText(tenantId),
        newExpiresAt,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminTenant"] });
    },
  });
}

export function useAdminDeleteTenant() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (tenantId: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.adminDeleteTenant(
        Principal.fromText(tenantId),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminMarkCashPaid() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    AdminTenantView,
    Error,
    { tenantId: string; note: string }
  >({
    mutationFn: async ({ tenantId, note }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.adminMarkCashPaid(
        Principal.fromText(tenantId),
        note,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminTenant"] });
    },
  });
}

export function useIsCallerAdminPhone() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: ["isCallerAdminPhone"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdminPhone();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

export function useApproveTenant() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.approveTenant(Principal.fromText(tenantId));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useRejectTenant() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.rejectTenant(Principal.fromText(tenantId));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminGetAllStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<{
    suspendedTenants: bigint;
    totalTenants: bigint;
    activeTenants: bigint;
    trialTenants: bigint;
    expiredTenants: bigint;
    pendingTenants: bigint;
    rejectedTenants: bigint;
  }>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor)
        return {
          suspendedTenants: 0n,
          totalTenants: 0n,
          activeTenants: 0n,
          trialTenants: 0n,
          expiredTenants: 0n,
          pendingTenants: 0n,
          rejectedTenants: 0n,
        };
      return actor.adminGetAllStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

// ─── Activation & Slot Hooks ───────────────────────────────────────────────

type ActivationSlotView = { phone: string; code: string };

export function useActivateWithCode() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    AdminTenantView,
    Error,
    { phone: string; code: string; shopName: string }
  >({
    mutationFn: async ({ phone, code, shopName }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        activateWithCode: (
          p: string,
          c: string,
          s: string,
        ) => Promise<
          | { __kind__: "ok"; ok: AdminTenantView }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.activateWithCode(
        phone.trim(),
        code.trim(),
        shopName.trim(),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerTenantStatus"] });
    },
  });
}

export function useAdminApprove() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const a = actor as unknown as {
        adminApprove: (
          id: ReturnType<typeof Principal.fromText>,
        ) => Promise<
          | { __kind__: "ok"; ok: AdminTenantView }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminApprove(Principal.fromText(tenantId));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminReject() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const a = actor as unknown as {
        adminReject: (
          id: ReturnType<typeof Principal.fromText>,
        ) => Promise<
          | { __kind__: "ok"; ok: AdminTenantView }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminReject(Principal.fromText(tenantId));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminSuspend() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const a = actor as unknown as {
        adminSuspend: (
          id: ReturnType<typeof Principal.fromText>,
        ) => Promise<
          | { __kind__: "ok"; ok: AdminTenantView }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminSuspend(Principal.fromText(tenantId));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminReactivate() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const a = actor as unknown as {
        adminReactivate: (
          id: ReturnType<typeof Principal.fromText>,
        ) => Promise<
          | { __kind__: "ok"; ok: AdminTenantView }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminReactivate(Principal.fromText(tenantId));
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminToggleSubscription() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<AdminTenantView, Error, string>({
    mutationFn: async (tenantId) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const a = actor as unknown as {
        adminToggleSubscription: (
          id: ReturnType<typeof Principal.fromText>,
        ) => Promise<
          | { __kind__: "ok"; ok: AdminTenantView }
          | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminToggleSubscription(
        Principal.fromText(tenantId),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useAdminGenerateCode() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (phone) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        adminGenerateCode: (
          phone: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminGenerateCode(phone.trim());
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}

export function useAdminResetCode() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (phone) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        adminResetCode: (
          phone: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminResetCode(phone.trim());
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}

export function useAdminCreateSlot() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, { phone: string; code: string }>({
    mutationFn: async ({ phone, code }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        adminCreateActivationSlot: (
          p: string,
          c: string,
        ) => Promise<
          { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminCreateActivationSlot(
        phone.trim(),
        code.trim(),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}

export function useAdminListSlots() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ActivationSlotView[]>({
    queryKey: ["adminSlots"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as unknown as {
        adminListSlots: () => Promise<ActivationSlotView[]>;
      };
      return a.adminListSlots();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useAdminClearAllTenants() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        adminClearAllTenants: () => Promise<
          { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
        >;
      };
      const result = await a.adminClearAllTenants();
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}
