import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "../backend.d";

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; classes: string }> =
  {
    [InvoiceStatus.paid]: {
      label: "Paid",
      classes:
        "bg-[color:var(--status-paid-bg)] text-[color:var(--status-paid-text)] border-[color:var(--status-paid-border)]",
    },
    [InvoiceStatus.sent]: {
      label: "Pending",
      classes:
        "bg-[color:var(--status-pending-bg)] text-[color:var(--status-pending-text)] border-[color:var(--status-pending-border)]",
    },
    [InvoiceStatus.cancelled]: {
      label: "Overdue",
      classes:
        "bg-[color:var(--status-overdue-bg)] text-[color:var(--status-overdue-text)] border-[color:var(--status-overdue-border)]",
    },
    [InvoiceStatus.draft]: {
      label: "Draft",
      classes: "bg-muted text-muted-foreground border-border",
    },
  };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[InvoiceStatus.draft];
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
        config.classes,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
