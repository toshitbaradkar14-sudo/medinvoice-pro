import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InvoiceFilter {
    toDate?: Timestamp;
    fromDate?: Timestamp;
    patientName?: string;
}
export type Timestamp = bigint;
export interface InvoiceView {
    id: InvoiceId;
    issueDate: Timestamp;
    status: InvoiceStatus;
    total: bigint;
    owner: UserId;
    createdAt: Timestamp;
    gstEnabled: boolean;
    dueDate: Timestamp;
    gstAmount: bigint;
    updatedAt: Timestamp;
    patientName: string;
    gstPercentage?: bigint;
    services: Array<ServiceItem>;
}
export type UserId = Principal;
export interface PracticeSettingsView {
    owner: UserId;
    practiceName: string;
    updatedAt: Timestamp;
    address: string;
}
export interface UpdateInvoiceArgs {
    id: InvoiceId;
    issueDate: Timestamp;
    status: InvoiceStatus;
    gstEnabled: boolean;
    dueDate: Timestamp;
    patientName: string;
    gstPercentage?: bigint;
    services: Array<ServiceItem>;
}
export interface ActivationSlotView {
    code: string;
    claimed: boolean;
    phone: string;
}
export interface AdminTenantView {
    id: UserId;
    createdAt: Timestamp;
    approvalCode: string;
    subscriptionStatus: TenantStatus;
    shopName: string;
    cashPaidNote: string;
    subscriptionExpiresAt?: Timestamp;
    phone: string;
    trialEndsAt: Timestamp;
    cashPaidAt?: Timestamp;
}
export type InvoiceId = bigint;
export interface ServiceItem {
    name: string;
    quantity: bigint;
    unitPrice: bigint;
}
export interface CreateInvoiceArgs {
    issueDate: Timestamp;
    gstEnabled: boolean;
    dueDate: Timestamp;
    patientName: string;
    gstPercentage?: bigint;
    services: Array<ServiceItem>;
}
export interface SavePracticeSettingsArgs {
    practiceName: string;
    address: string;
}
export enum InvoiceStatus {
    cancelled = "cancelled",
    paid = "paid",
    sent = "sent",
    draft = "draft"
}
export enum TenantStatus {
    trial = "trial",
    active = "active",
    expired = "expired",
    pending = "pending",
    rejected = "rejected",
    suspended = "suspended"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateWithCode(phone: string, code: string, shopName: string): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminApprove(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminClearAllTenants(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminCreateActivationSlot(phone: string, code: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminDeleteTenant(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminExtendTenantExpiry(tenantId: UserId, newExpiresAt: Timestamp): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminGenerateCode(phone: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminGetAllStats(): Promise<{
        rejectedTenants: bigint;
        suspendedTenants: bigint;
        pendingTenants: bigint;
        totalTenants: bigint;
        activeTenants: bigint;
        trialTenants: bigint;
        expiredTenants: bigint;
    }>;
    adminGetTenant(tenantId: UserId): Promise<AdminTenantView | null>;
    adminListSlots(): Promise<Array<ActivationSlotView>>;
    adminListTenants(search: string | null): Promise<Array<AdminTenantView>>;
    adminMarkCashPaid(tenantId: UserId, note: string): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminReactivate(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminReject(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminResetCode(phone: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminSetTenantStatus(tenantId: UserId, status: TenantStatus): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminSuspend(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminSuspendAndInvalidate(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminToggleSubscription(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveTenant(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createInvoice(args: CreateInvoiceArgs): Promise<InvoiceView>;
    deleteAllInvoices(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteInvoice(id: InvoiceId): Promise<void>;
    getCallerPracticeSettings(): Promise<PracticeSettingsView | null>;
    getCallerTenantStatus(): Promise<TenantStatus | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInvoice(id: InvoiceId): Promise<InvoiceView | null>;
    getInvoiceStatusBreakdown(): Promise<{
        cancelled: bigint;
        paid: bigint;
        sent: bigint;
        draft: bigint;
    }>;
    getInvoiceTotalCount(): Promise<bigint>;
    getPracticeSettings(owner: UserId): Promise<PracticeSettingsView | null>;
    getRevenueByMonth(): Promise<Array<[string, bigint]>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerAdminPhone(): Promise<boolean>;
    listInvoices(filter: InvoiceFilter): Promise<Array<InvoiceView>>;
    registerTenant(shopName: string, phone: string): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectTenant(tenantId: UserId): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
    savePracticeSettings(args: SavePracticeSettingsArgs): Promise<void>;
    updateInvoice(args: UpdateInvoiceArgs): Promise<void>;
    verifyAndApproveTenant(tenantId: UserId, code: string): Promise<{
        __kind__: "ok";
        ok: AdminTenantView;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
