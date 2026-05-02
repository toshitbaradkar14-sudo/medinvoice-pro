// Utility functions for formatting
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatInvoiceId(id: bigint): string {
  return `INV-${String(id).padStart(6, "0")}`;
}

export function calculateInvoiceTotal(
  services: Array<{ quantity: bigint; unitPrice: bigint }>,
): number {
  return services.reduce(
    (sum, s) => sum + Number(s.quantity) * Number(s.unitPrice),
    0,
  );
}
