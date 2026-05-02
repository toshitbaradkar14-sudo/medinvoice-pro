import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  ClockIcon,
  Eye,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  ShoppingBag,
  Trash2,
  UserX,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { AdminTenantView } from "../backend.d";
import { TenantStatus } from "../backend.d";

// ─── Local hooks (inline) ────────────────────────────────────────────────────

function useAdminGetAllStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.adminGetAllStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

function useAdminListTenants(search: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminTenantView[]>({
    queryKey: ["adminTenants", search],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminListTenants(search.trim() || null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

function useAdminExtendTenantExpiry() {
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
      const res = await actor.adminExtendTenantExpiry(
        Principal.fromText(tenantId),
        newExpiresAt,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminDeleteTenant() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (tenantId) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const res = await actor.adminDeleteTenant(Principal.fromText(tenantId));
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminMarkCashPaid() {
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
      const res = await actor.adminMarkCashPaid(
        Principal.fromText(tenantId),
        note,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useApproveTenant() {
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
      const res = await a.adminApprove(Principal.fromText(tenantId));
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useRejectTenant() {
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
      const res = await a.adminReject(Principal.fromText(tenantId));
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminGenerateCodeLocal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        adminGenerateCode: (
          phone: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const res = await a.adminGenerateCode(phone.trim());
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}

function useAdminResetCodeLocal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as {
        adminResetCode: (
          phone: string,
        ) => Promise<
          { __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }
        >;
      };
      const res = await a.adminResetCode(phone.trim());
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}

function useAdminClearAllTenantsLocal() {
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
      const res = await a.adminClearAllTenants();
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
      qc.invalidateQueries({ queryKey: ["adminSlots"] });
    },
  });
}

function useAdminToggleSubscription() {
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
      const res = await a.adminToggleSubscription(Principal.fromText(tenantId));
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminReactivate() {
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
      const res = await a.adminReactivate(Principal.fromText(tenantId));
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

function useAdminSuspendDirect() {
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
      const res = await a.adminSuspend(Principal.fromText(tenantId));
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminTenants"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

type ActivationSlotView = { phone: string; code: string };

function useAdminListSlotsLocal() {
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
    staleTime: 30_000,
  });
}

function formatDate(ts: bigint | undefined): string {
  if (!ts) return "—";
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: TenantStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type StatusBadgeProps = { status: TenantStatus };

function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<TenantStatus, string> = {
    [TenantStatus.active]:
      "bg-green-500/10 text-green-700 border-green-300/50 dark:text-green-400",
    [TenantStatus.trial]:
      "bg-blue-500/10 text-blue-700 border-blue-300/50 dark:text-blue-400",
    [TenantStatus.suspended]:
      "bg-red-500/10 text-red-700 border-red-300/50 dark:text-red-400",
    [TenantStatus.expired]: "bg-muted text-muted-foreground border-border",
    [TenantStatus.pending]:
      "bg-yellow-500/10 text-yellow-700 border-yellow-300/50 dark:text-yellow-400",
    [TenantStatus.rejected]:
      "bg-orange-500/10 text-orange-700 border-orange-300/50 dark:text-orange-400",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${map[status] ?? ""}`}
    >
      {statusLabel(status)}
    </Badge>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: bigint | number | undefined;
  icon: React.ReactNode;
  loading: boolean;
}

function StatCard({ label, value, icon, loading }: StatCardProps) {
  return (
    <Card className="shadow-subtle border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent-foreground">
            {icon}
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold font-display text-foreground">
            {value?.toString() ?? "0"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

interface CashPaidModalProps {
  tenant: AdminTenantView | null;
  onClose: () => void;
  onSubmit: (note: string) => void;
  isPending: boolean;
}

function CashPaidModal({
  tenant,
  onClose,
  onSubmit,
  isPending,
}: CashPaidModalProps) {
  const [note, setNote] = useState("");
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-ocid="admin.cash_paid.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Mark Cash Paid</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">
            Shop:{" "}
            <span className="font-semibold text-foreground">
              {tenant?.shopName}
            </span>
          </p>
          <div className="space-y-1">
            <Label htmlFor="cash-note" className="text-sm">
              Payment Note
            </Label>
            <Input
              id="cash-note"
              data-ocid="admin.cash_paid.input"
              placeholder={`e.g. Cash ₹999 received on ${today}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-ocid="admin.cash_paid.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(note)}
            disabled={isPending || !note.trim()}
            data-ocid="admin.cash_paid.confirm_button"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Mark Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExtendExpiryModalProps {
  tenant: AdminTenantView | null;
  onClose: () => void;
  onSubmit: (date: string) => void;
  isPending: boolean;
}

function ExtendExpiryModal({
  tenant,
  onClose,
  onSubmit,
  isPending,
}: ExtendExpiryModalProps) {
  const [date, setDate] = useState("");

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-ocid="admin.extend_expiry.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            Extend Subscription Expiry
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">
            Shop:{" "}
            <span className="font-semibold text-foreground">
              {tenant?.shopName}
            </span>
          </p>
          <div className="space-y-1">
            <Label htmlFor="expiry-date" className="text-sm">
              New Expiry Date
            </Label>
            <Input
              id="expiry-date"
              type="date"
              data-ocid="admin.extend_expiry.input"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-ocid="admin.extend_expiry.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(date)}
            disabled={isPending || !date}
            data-ocid="admin.extend_expiry.confirm_button"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmModalProps {
  tenant: AdminTenantView | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteConfirmModal({
  tenant,
  onClose,
  onConfirm,
  isPending,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-ocid="admin.delete.dialog">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Shop Account
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-1">
          This will permanently delete all data for{" "}
          <span className="font-semibold text-foreground">
            {tenant?.shopName}
          </span>
          . This action cannot be undone.
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-ocid="admin.delete.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="admin.delete.confirm_button"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cashPaidTenant, setCashPaidTenant] = useState<AdminTenantView | null>(
    null,
  );
  const [extendTenant, setExtendTenant] = useState<AdminTenantView | null>(
    null,
  );
  const [deleteTenant, setDeleteTenant] = useState<AdminTenantView | null>(
    null,
  );
  const [suspendTenant, setSuspendTenant] = useState<AdminTenantView | null>(
    null,
  );

  const { data: stats, isLoading: statsLoading } = useAdminGetAllStats();
  const { data: tenants, isLoading: tenantsLoading } =
    useAdminListTenants(debouncedSearch);
  const reactivateMut = useAdminReactivate();
  const suspendMut = useAdminSuspendDirect();
  const extendExpiry = useAdminExtendTenantExpiry();
  const deleteMut = useAdminDeleteTenant();
  const cashPaidMut = useAdminMarkCashPaid();
  const approveMut = useApproveTenant();
  const rejectMut = useRejectTenant();
  const toggleSubMut = useAdminToggleSubscription();
  const generateCodeMut = useAdminGenerateCodeLocal();
  const resetCodeMut = useAdminResetCodeLocal();
  const clearAllMut = useAdminClearAllTenantsLocal();
  const { data: slots } = useAdminListSlotsLocal();

  const [slotPhone, setSlotPhone] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(
      (handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t,
    );
    (handleSearchChange as { _t?: ReturnType<typeof setTimeout> })._t =
      setTimeout(() => {
        setDebouncedSearch(val);
      }, 400);
  }, []);

  const handleActivate = async (tenant: AdminTenantView) => {
    try {
      await reactivateMut.mutateAsync(tenant.id.toString());
      toast.success(`${tenant.shopName} activated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to activate");
    }
  };

  const handleGenerateCode = async () => {
    if (!slotPhone.trim()) return;
    try {
      const code = await generateCodeMut.mutateAsync(slotPhone);
      setGeneratedCode(code);
      setSlotPhone("");
      toast.success("Code generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate code");
    }
  };

  const handleResetCode = async (phone: string) => {
    try {
      const code = await resetCodeMut.mutateAsync(phone);
      toast.success(`New code for ${phone}: ${code}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset code");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMut.mutateAsync();
      toast.success("All shops cleared");
      setShowClearConfirm(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clear shops");
    }
  };

  const handleSuspendConfirm = async () => {
    if (!suspendTenant) return;
    try {
      await suspendMut.mutateAsync(suspendTenant.id.toString());
      toast.success(`${suspendTenant.shopName} suspended`);
      setSuspendTenant(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to suspend");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTenant) return;
    try {
      await deleteMut.mutateAsync(deleteTenant.id.toString());
      toast.success(`${deleteTenant.shopName} deleted`);
      setDeleteTenant(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleCashPaid = async (note: string) => {
    if (!cashPaidTenant) return;
    try {
      await cashPaidMut.mutateAsync({
        tenantId: cashPaidTenant.id.toString(),
        note,
      });
      toast.success(`Payment recorded for ${cashPaidTenant.shopName}`);
      setCashPaidTenant(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    }
  };

  const handleExtendExpiry = async (date: string) => {
    if (!extendTenant) return;
    try {
      const ms = new Date(date).getTime();
      const ns = BigInt(ms) * 1_000_000n;
      await extendExpiry.mutateAsync({
        tenantId: extendTenant.id.toString(),
        newExpiresAt: ns,
      });
      toast.success(`Expiry extended for ${extendTenant.shopName}`);
      setExtendTenant(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to extend expiry");
    }
  };

  const handleLoginAs = (tenant: AdminTenantView) => {
    toast.info(
      `To impersonate this tenant, use their Principal ID: ${tenant.id.toString()}. Admin impersonation requires backend support.`,
      { duration: 7000 },
    );
  };

  const handleToggleSub = async (tenant: AdminTenantView) => {
    try {
      await toggleSubMut.mutateAsync(tenant.id.toString());
      toast.success(`Subscription toggled for ${tenant.shopName}`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to toggle subscription",
      );
    }
  };

  const handleApprove = async (tenant: AdminTenantView) => {
    try {
      await approveMut.mutateAsync(tenant.id.toString());
      toast.success(`${tenant.shopName} approved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    }
  };

  const handleReject = async (tenant: AdminTenantView) => {
    try {
      await rejectMut.mutateAsync(tenant.id.toString());
      toast.success(`${tenant.shopName} rejected`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
    }
  };

  const pendingTenants = tenants?.filter(
    (t) => t.subscriptionStatus === TenantStatus.pending,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3" data-ocid="admin.page">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Tenant Management
          </h1>
          <p className="text-muted-foreground text-sm">Admin-only dashboard</p>
        </div>
        <Badge
          className="ml-auto bg-accent/20 text-accent-foreground border-accent/30 text-xs"
          variant="outline"
        >
          Admin Only
        </Badge>
      </div>

      {/* Stats Row */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        data-ocid="admin.stats.section"
      >
        <StatCard
          label="Total Shops"
          value={stats?.totalTenants}
          icon={<ShoppingBag className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="Active"
          value={stats?.activeTenants}
          icon={<BadgeCheck className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="On Trial"
          value={stats?.trialTenants}
          icon={<ClockIcon className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="Suspended"
          value={stats?.suspendedTenants}
          icon={<Activity className="w-4 h-4" />}
          loading={statsLoading}
        />
      </div>

      {/* Activation Codes Section */}
      <Card
        className="shadow-subtle border-border"
        data-ocid="admin.activation_codes.section"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Activation Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate new code */}
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Phone number"
              value={slotPhone}
              onChange={(e) => setSlotPhone(e.target.value)}
              className="h-8 text-sm w-48"
              data-ocid="admin.activation_codes.phone_input"
            />
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleGenerateCode}
              disabled={!slotPhone.trim() || generateCodeMut.isPending}
              data-ocid="admin.activation_codes.generate_button"
            >
              {generateCodeMut.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              Generate Code
            </Button>
            {generatedCode && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1">
                <span className="text-xs text-muted-foreground">New code:</span>
                <span
                  className="font-mono font-bold text-sm text-foreground"
                  data-ocid="admin.activation_codes.generated_value"
                >
                  {generatedCode}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground ml-1"
                  onClick={() => setGeneratedCode(null)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          {/* Existing slots */}
          {slots && slots.length > 0 && (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="admin.activation_codes.table"
              >
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                      Phone
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                      Code
                    </th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, idx) => (
                    <tr
                      key={slot.phone}
                      className="border-b border-border last:border-0"
                      data-ocid={`admin.slot_row.${idx + 1}`}
                    >
                      <td className="py-2 px-3 text-xs text-foreground">
                        {slot.phone}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-sm text-foreground">
                        {slot.code}
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleResetCode(slot.phone)}
                          disabled={resetCodeMut.isPending}
                          data-ocid={`admin.reset_code_button.${idx + 1}`}
                        >
                          {resetCodeMut.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Reset Code
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {pendingTenants && pendingTenants.length > 0 && (
        <Card
          className="shadow-subtle border-yellow-300/50 bg-yellow-500/5"
          data-ocid="admin.pending_approvals.section"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-yellow-600" />
              Pending Approvals
              <Badge
                variant="outline"
                className="ml-1 bg-yellow-500/10 text-yellow-700 border-yellow-300/50 text-xs"
              >
                {pendingTenants.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingTenants.map((tenant, idx) => (
                <div
                  key={tenant.id.toString()}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3"
                  data-ocid={`admin.pending_row.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {tenant.shopName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tenant.phone || "—"} · Registered{" "}
                      {formatDate(tenant.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs border-green-400/50 text-green-700 hover:bg-green-500/10"
                      onClick={() => handleApprove(tenant)}
                      disabled={approveMut.isPending || rejectMut.isPending}
                      data-ocid={`admin.approve_button.${idx + 1}`}
                    >
                      {approveMut.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <BadgeCheck className="w-3 h-3 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(tenant)}
                      disabled={approveMut.isPending || rejectMut.isPending}
                      data-ocid={`admin.reject_button.${idx + 1}`}
                    >
                      {rejectMut.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <UserX className="w-3 h-3 mr-1" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenant Table */}
      <Card className="shadow-subtle border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base font-semibold font-display flex items-center gap-2 flex-1">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Shop Owners
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                data-ocid="admin.search_input"
                placeholder="Search by shop name or phone…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8 text-sm w-full sm:w-64"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 whitespace-nowrap"
                onClick={() => setShowClearConfirm(true)}
                data-ocid="admin.clear_all_button"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tenantsLoading ? (
            <div
              className="p-6 space-y-3"
              data-ocid="admin.tenants.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !tenants || tenants.length === 0 ? (
            <div
              className="py-14 text-center"
              data-ocid="admin.tenants.empty_state"
            >
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-semibold text-foreground">
                No shop owners found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {debouncedSearch
                  ? "Try a different search term"
                  : "Registered tenants will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="admin.tenants.table">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Shop
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      Phone
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Expiry / Trial
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant, idx) => {
                    const id = tenant.id.toString();
                    const expiryDate = tenant.subscriptionExpiresAt
                      ? formatDate(tenant.subscriptionExpiresAt)
                      : formatDate(tenant.trialEndsAt);
                    return (
                      <tr
                        key={id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        data-ocid={`admin.tenant_row.${idx + 1}`}
                      >
                        <td className="px-4 py-3 min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[160px]">
                            {tenant.shopName || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                            {id.slice(0, 18)}…
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-muted-foreground text-xs truncate max-w-[180px] block">
                            {tenant.phone || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tenant.subscriptionStatus} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {expiryDate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleActivate(tenant)}
                              disabled={
                                tenant.subscriptionStatus ===
                                  TenantStatus.active || reactivateMut.isPending
                              }
                              data-ocid={`admin.activate_button.${idx + 1}`}
                              title="Activate"
                            >
                              <BadgeCheck className="w-3 h-3 mr-1" />
                              Activate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                              onClick={() => setSuspendTenant(tenant)}
                              disabled={
                                tenant.subscriptionStatus ===
                                  TenantStatus.suspended || suspendMut.isPending
                              }
                              data-ocid={`admin.suspend_button.${idx + 1}`}
                              title="Suspend"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Suspend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setCashPaidTenant(tenant)}
                              data-ocid={`admin.cash_paid_button.${idx + 1}`}
                              title="Mark Cash Paid"
                            >
                              <IndianRupee className="w-3 h-3 mr-1" />
                              Cash
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleToggleSub(tenant)}
                              disabled={toggleSubMut.isPending}
                              data-ocid={`admin.toggle_sub_button.${idx + 1}`}
                              title="Toggle Subscription"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Toggle Sub
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setExtendTenant(tenant)}
                              data-ocid={`admin.extend_button.${idx + 1}`}
                              title="Extend Expiry"
                            >
                              <CalendarClock className="w-3 h-3 mr-1" />
                              Extend
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleLoginAs(tenant)}
                              data-ocid={`admin.login_as_button.${idx + 1}`}
                              title="Login As"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTenant(tenant)}
                              data-ocid={`admin.delete_button.${idx + 1}`}
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CashPaidModal
        tenant={cashPaidTenant}
        onClose={() => setCashPaidTenant(null)}
        onSubmit={handleCashPaid}
        isPending={cashPaidMut.isPending}
      />
      <ExtendExpiryModal
        tenant={extendTenant}
        onClose={() => setExtendTenant(null)}
        onSubmit={handleExtendExpiry}
        isPending={extendExpiry.isPending}
      />
      <DeleteConfirmModal
        tenant={deleteTenant}
        onClose={() => setDeleteTenant(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMut.isPending}
      />
      {/* Suspend Confirm (reuse DeleteConfirmModal pattern inline) */}
      <Dialog
        open={!!suspendTenant}
        onOpenChange={(o) => !o && setSuspendTenant(null)}
      >
        <DialogContent data-ocid="admin.suspend.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              Suspend Shop Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-1">
            This will suspend{" "}
            <span className="font-semibold text-foreground">
              {suspendTenant?.shopName}
            </span>{" "}
            and disable their access. You can reactivate them later.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSuspendTenant(null)}
              disabled={suspendMut.isPending}
              data-ocid="admin.suspend.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendConfirm}
              disabled={suspendMut.isPending}
              data-ocid="admin.suspend.confirm_button"
            >
              {suspendMut.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Clear All Confirm */}
      <Dialog
        open={showClearConfirm}
        onOpenChange={(o) => !o && setShowClearConfirm(false)}
      >
        <DialogContent data-ocid="admin.clear_all.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Clear All Shop Accounts
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-1">
            This will permanently delete ALL shop accounts and their data. This
            action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              disabled={clearAllMut.isPending}
              data-ocid="admin.clear_all.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={clearAllMut.isPending}
              data-ocid="admin.clear_all.confirm_button"
            >
              {clearAllMut.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete All Shops
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
