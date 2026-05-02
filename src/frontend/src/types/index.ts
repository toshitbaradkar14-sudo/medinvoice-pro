import type { Principal } from "@icp-sdk/core/principal";
import type {
  InvoiceStatus,
  InvoiceView,
  TenantStatus,
  UserRole,
} from "../backend.d";
export type { InvoiceStatus, TenantStatus, UserRole };
export type SubscriptionTier = string; // removed from backend — kept as alias for compatibility

export interface Invoice {
  id: bigint;
  patientName: string;
  issueDate: bigint;
  dueDate: bigint;
  status: InvoiceStatus;
  services: ServiceItem[];
  owner: string;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface ServiceItem {
  name: string;
  quantity: bigint;
  unitPrice: bigint;
}

export interface UserRecord {
  displayName: string;
  userId: string;
  joinedAt: bigint;
  tier?: string;
}

export interface Tenant {
  id: string; // Principal as string
  shopName: string;
  phone: string;
  createdAt: bigint;
  trialEndsAt: bigint;
  subscriptionStatus: TenantStatus;
  subscriptionExpiresAt?: bigint;
  cashPaidAt?: bigint;
  cashPaidNote: string;
}

export interface AdminStats {
  totalTenants: bigint;
  activeTenants: bigint;
  trialTenants: bigint;
  suspendedTenants: bigint;
  expiredTenants: bigint;
}

export interface PracticeSettings {
  practiceName: string;
  address: string;
  owner: string;
  updatedAt: bigint;
}

export interface InvoiceFilter {
  patientName?: string;
  fromDate?: bigint;
  toDate?: bigint;
}

export type StatusFilter = "all" | InvoiceStatus;

export interface InvoiceFormData {
  patientName: string;
  issueDate: string;
  dueDate: string;
  services: ServiceItemForm[];
  status: InvoiceStatus;
}

export interface ServiceItemForm {
  name: string;
  quantity: number;
  unitPrice: number;
}

// Placeholder principal for sample data only (never sent to backend)
const PLACEHOLDER_PRINCIPAL = "principal-1" as unknown as Principal;

export const SAMPLE_INVOICES: InvoiceView[] = [
  {
    id: 4521n,
    patientName: "Sarah Jenkins",
    issueDate: BigInt(new Date("2024-10-28").getTime()) * 1_000_000n,
    dueDate: BigInt(new Date("2024-11-12").getTime()) * 1_000_000n,
    status: "paid" as InvoiceStatus,
    services: [
      { name: "General Consultation", quantity: 1n, unitPrice: 12000n },
      { name: "Blood Panel", quantity: 1n, unitPrice: 6500n },
    ],
    owner: PLACEHOLDER_PRINCIPAL,
    createdAt: BigInt(Date.now()) * 1_000_000n,
    updatedAt: BigInt(Date.now()) * 1_000_000n,
    gstEnabled: false,
    gstAmount: 0n,
    gstPercentage: undefined,
    total: 18500n,
  },
  {
    id: 4522n,
    patientName: "Robert Smith",
    issueDate: BigInt(new Date("2024-10-28").getTime()) * 1_000_000n,
    dueDate: BigInt(new Date("2024-11-12").getTime()) * 1_000_000n,
    status: "sent" as InvoiceStatus,
    services: [
      { name: "Follow-up Visit", quantity: 1n, unitPrice: 8500n },
      { name: "ECG Test", quantity: 1n, unitPrice: 9500n },
    ],
    owner: PLACEHOLDER_PRINCIPAL,
    createdAt: BigInt(Date.now()) * 1_000_000n,
    updatedAt: BigInt(Date.now()) * 1_000_000n,
    gstEnabled: false,
    gstAmount: 0n,
    gstPercentage: undefined,
    total: 18000n,
  },
  {
    id: 4523n,
    patientName: "Sarah Jenkins",
    issueDate: BigInt(new Date("2024-10-28").getTime()) * 1_000_000n,
    dueDate: BigInt(new Date("2024-11-12").getTime()) * 1_000_000n,
    status: "paid" as InvoiceStatus,
    services: [{ name: "Vaccination", quantity: 2n, unitPrice: 4500n }],
    owner: PLACEHOLDER_PRINCIPAL,
    createdAt: BigInt(Date.now()) * 1_000_000n,
    updatedAt: BigInt(Date.now()) * 1_000_000n,
    gstEnabled: false,
    gstAmount: 0n,
    gstPercentage: undefined,
    total: 9000n,
  },
  {
    id: 4524n,
    patientName: "Robert Smith",
    issueDate: BigInt(new Date("2024-10-29").getTime()) * 1_000_000n,
    dueDate: BigInt(new Date("2024-11-08").getTime()) * 1_000_000n,
    status: "cancelled" as InvoiceStatus,
    services: [{ name: "X-Ray Imaging", quantity: 1n, unitPrice: 18500n }],
    owner: PLACEHOLDER_PRINCIPAL,
    createdAt: BigInt(Date.now()) * 1_000_000n,
    updatedAt: BigInt(Date.now()) * 1_000_000n,
    gstEnabled: false,
    gstAmount: 0n,
    gstPercentage: undefined,
    total: 18500n,
  },
  {
    id: 4525n,
    patientName: "Maria Gonzalez",
    issueDate: BigInt(new Date("2024-10-30").getTime()) * 1_000_000n,
    dueDate: BigInt(new Date("2024-11-15").getTime()) * 1_000_000n,
    status: "draft" as InvoiceStatus,
    services: [
      { name: "Annual Physical", quantity: 1n, unitPrice: 15000n },
      { name: "Cholesterol Panel", quantity: 1n, unitPrice: 4800n },
    ],
    owner: PLACEHOLDER_PRINCIPAL,
    createdAt: BigInt(Date.now()) * 1_000_000n,
    updatedAt: BigInt(Date.now()) * 1_000_000n,
    gstEnabled: false,
    gstAmount: 0n,
    gstPercentage: undefined,
    total: 19800n,
  },
];
