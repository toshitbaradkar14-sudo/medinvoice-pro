import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import type { InvoiceView } from "../backend.d";
import { InvoiceStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import { TierBadge } from "../components/TierBadge";
import { useCurrentUser } from "../hooks/useAuth";
import {
  useInvoiceStatusBreakdown,
  useInvoices,
  useIsAdmin,
  useListAllUsers,
  useRevenueByMonth,
} from "../hooks/useQueries";
import { formatCurrency, formatInvoiceId } from "../lib/format";
import { useDownloadInvoice } from "../lib/print";
import { SAMPLE_INVOICES } from "../types";

export default function DashboardPage() {
  const { displayName, tier } = useCurrentUser();
  const { data: isAdminData } = useIsAdmin();
  const isAdmin = isAdminData ?? false;
  const { data: invoices, isLoading } = useInvoices({});
  // Admin-only backend calls — only enabled when caller is confirmed admin
  const { data: breakdown } = useInvoiceStatusBreakdown(isAdmin);
  const { data: revenueByMonth } = useRevenueByMonth(isAdmin);
  const { data: allUsers } = useListAllUsers();

  const displayInvoices: InvoiceView[] =
    invoices && invoices.length > 0
      ? invoices
      : (SAMPLE_INVOICES as unknown as InvoiceView[]);
  const recentInvoices = displayInvoices.slice(0, 6);

  const totalAmount = displayInvoices.reduce((sum, inv) => {
    return (
      sum +
      inv.services.reduce(
        (s, srv) => s + Number(srv.quantity) * Number(srv.unitPrice),
        0,
      )
    );
  }, 0);

  // For non-admins, compute status breakdown locally from their invoice list.
  // For admins, use the backend aggregate (admin-only call).
  const localPaidCount = displayInvoices.filter(
    (i) => i.status === InvoiceStatus.paid,
  ).length;
  const localPendingCount = displayInvoices.filter(
    (i) => i.status === InvoiceStatus.sent,
  ).length;
  const localOverdueCount = displayInvoices.filter(
    (i) => i.status === InvoiceStatus.cancelled,
  ).length;

  const paidCount = breakdown?.paid ? Number(breakdown.paid) : localPaidCount;
  const pendingCount = breakdown?.sent
    ? Number(breakdown.sent)
    : localPendingCount;
  const overdueCount = breakdown?.cancelled
    ? Number(breakdown.cancelled)
    : localOverdueCount;

  // Calculate total revenue: admin gets backend aggregate, others sum locally
  const totalRevenue = revenueByMonth
    ? revenueByMonth.reduce((sum, [, amount]) => sum + Number(amount), 0)
    : totalAmount;

  const downloadInvoice = useDownloadInvoice();

  const STATS = [
    {
      label: "Total Invoiced",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      sub: "All time revenue",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Paid Invoices",
      value: paidCount,
      icon: CheckCircle,
      sub: `${displayInvoices.length > 0 ? Math.round((paidCount / displayInvoices.length) * 100) : 0}% of total`,
      color: "text-[color:var(--status-paid-text)]",
      bg: "bg-[color:var(--status-paid-bg)]",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      sub: "Awaiting payment",
      color: "text-[color:var(--status-pending-text)]",
      bg: "bg-[color:var(--status-pending-bg)]",
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: AlertCircle,
      sub: "Needs attention",
      color: "text-[color:var(--status-overdue-text)]",
      bg: "bg-[color:var(--status-overdue-bg)]",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your practice billing overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} />
          <Link to="/invoices/new">
            <Button
              className="gap-2 gradient-primary border-0 text-primary-foreground font-semibold shadow-subtle"
              data-ocid="dashboard.new_invoice_button"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.stats_section"
      >
        {STATS.map((stat) => (
          <Card
            key={stat.label}
            className="shadow-subtle border-border hover:shadow-elevated transition-smooth"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-24 mb-1" />
              ) : (
                <p className="text-2xl font-display font-bold text-foreground">
                  {stat.value}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
        {isAdmin && (
          <Card className="shadow-subtle border-border hover:shadow-elevated transition-smooth">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">
                {allUsers?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent invoices */}
        <Card className="lg:col-span-2 shadow-subtle border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Invoices
            </CardTitle>
            <Link to="/invoices">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary gap-1 text-xs"
                data-ocid="dashboard.view_all_link"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Invoice
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Patient
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from(
                        { length: 4 },
                        (_, idx) => `skel-row-${idx}`,
                      ).map((key) => (
                        <tr key={key} className="border-b border-border">
                          <td className="px-4 py-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                          <td className="px-4 py-3" />
                        </tr>
                      ))
                    : recentInvoices.map((inv, idx) => {
                        const amount = inv.services.reduce(
                          (s, srv) =>
                            s + Number(srv.quantity) * Number(srv.unitPrice),
                          0,
                        );
                        return (
                          <tr
                            key={inv.id.toString()}
                            className="border-b border-border hover:bg-muted/30 transition-smooth"
                            data-ocid={`dashboard.invoice_row.${idx + 1}`}
                          >
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                              {formatInvoiceId(inv.id)}
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              {inv.patientName}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                              {formatCurrency(amount)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Link
                                  to="/invoices/$id"
                                  params={{ id: inv.id.toString() }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-7 h-7"
                                    aria-label="View invoice"
                                    data-ocid={`dashboard.view_invoice.${idx + 1}`}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7"
                                  aria-label="Download invoice"
                                  onClick={() => downloadInvoice(inv)}
                                  data-ocid={`dashboard.download_invoice.${idx + 1}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Account overview sidebar */}
        <div className="space-y-4">
          {/* Quick stats */}
          <Card className="shadow-subtle border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-display">
                Billing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  Total invoiced
                </span>
                <span className="font-bold font-display text-foreground">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Paid</span>
                <Badge
                  className="bg-[color:var(--status-paid-bg)] text-[color:var(--status-paid-text)] border-[color:var(--status-paid-border)] text-xs"
                  variant="outline"
                >
                  {displayInvoices.length > 0
                    ? Math.round((paidCount / displayInvoices.length) * 100)
                    : 0}
                  %
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">
                  Total invoices
                </span>
                <span className="font-semibold text-foreground">
                  {displayInvoices.length}
                </span>
              </div>
            </CardContent>
          </Card>
          {/* Revenue by month — admin only */}
          {isAdmin && revenueByMonth && revenueByMonth.length > 0 && (
            <Card className="shadow-subtle border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold font-display">
                  Revenue by Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {revenueByMonth.slice(-4).map(([month, amount]) => (
                  <div
                    key={month}
                    className="flex justify-between items-center py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {month}
                    </span>
                    <span className="font-semibold text-foreground text-sm tabular-nums">
                      {formatCurrency(Number(amount))}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
