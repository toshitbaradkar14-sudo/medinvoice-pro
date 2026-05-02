import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { InvoiceStatus } from "../backend.d";
import type { InvoiceView } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import {
  useDeleteAllInvoices,
  useDeleteInvoice,
  useInvoices,
} from "../hooks/useQueries";
import {
  calculateInvoiceTotal,
  formatCurrency,
  formatDate,
  formatInvoiceId,
} from "../lib/format";
import { useDownloadInvoice, usePrintInvoice } from "../lib/print";
import { useDebounce } from "../lib/utils";
import type { StatusFilter } from "../types";

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Paid", value: InvoiceStatus.paid },
  { label: "Pending", value: InvoiceStatus.sent },
  { label: "Overdue", value: InvoiceStatus.cancelled },
  { label: "Draft", value: InvoiceStatus.draft },
];

const PAGE_SIZE = 20;

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const { data: invoices, isLoading } = useInvoices({});
  const deleteInvoice = useDeleteInvoice();
  const deleteAllInvoices = useDeleteAllInvoices();
  const downloadInvoice = useDownloadInvoice();
  const printInvoice = usePrintInvoice();

  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 when debounced search or filter changes (no useEffect to avoid biome lint)
  const prevSearchRef = useRef(debouncedSearch);
  const prevFilterRef = useRef(filter);
  if (
    prevSearchRef.current !== debouncedSearch ||
    prevFilterRef.current !== filter
  ) {
    prevSearchRef.current = debouncedSearch;
    prevFilterRef.current = filter;
    if (page !== 1) setPage(1);
  }

  const allInvoices: InvoiceView[] = invoices ?? [];

  const filtered = allInvoices.filter((inv) => {
    const matchSearch =
      !debouncedSearch ||
      inv.patientName.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleDelete = async (id: bigint) => {
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success("Invoice deleted");
    } catch (err) {
      console.error("Delete invoice error:", err);
      toast.error("Failed to delete invoice");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            {allInvoices.length} total invoices
          </p>
        </div>
        <Link to="/invoices/new">
          <Button
            className="gap-2 gradient-primary border-0 text-primary-foreground font-semibold shadow-subtle"
            data-ocid="invoices.new_invoice_button"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
        {allInvoices.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                data-ocid="invoices.delete_all_button"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="invoices.delete_all_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Invoices</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete ALL {allInvoices.length}{" "}
                  invoices? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="invoices.delete_all_cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      await deleteAllInvoices.mutateAsync();
                      toast.success("All invoices deleted");
                    } catch (err) {
                      console.error("Delete all invoices error:", err);
                      toast.error("Failed to delete all invoices");
                    }
                  }}
                  className="bg-destructive text-destructive-foreground"
                  data-ocid="invoices.delete_all_confirm_button"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            data-ocid="invoices.search_input"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as StatusFilter)}
        >
          <TabsList className="h-9" data-ocid="invoices.filter.tab">
            {FILTERS.map((f) => (
              <TabsTrigger
                key={f.value}
                value={f.value}
                className="text-xs px-3"
                data-ocid={`invoices.filter_${f.value}`}
              >
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="shadow-subtle border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="invoices.loading_state">
              {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
                <Skeleton key={key} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="invoices.empty_state"
            >
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="font-semibold text-foreground">No invoices found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {search
                  ? `No results for "${search}"`
                  : "Create your first invoice to get started"}
              </p>
              <Link to="/invoices/new">
                <Button
                  size="sm"
                  className="gap-2 gradient-primary border-0 text-primary-foreground"
                  data-ocid="invoices.empty_create_button"
                >
                  <Plus className="w-4 h-4" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Invoice #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Patient
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Service Date
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Due Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody data-ocid="invoices.table">
                  {paginated.map((inv, idx) => {
                    const amount = inv.gstEnabled
                      ? Number(inv.total)
                      : calculateInvoiceTotal(inv.services);
                    const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr
                        key={inv.id.toString()}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-smooth cursor-pointer"
                        onClick={() =>
                          navigate({
                            to: "/invoices/$id",
                            params: { id: inv.id.toString() },
                          })
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          navigate({
                            to: "/invoices/$id",
                            params: { id: inv.id.toString() },
                          })
                        }
                        data-ocid={`invoices.item.${rowNum}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                          {formatInvoiceId(inv.id)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {inv.patientName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3">
                          <fieldset className="flex items-center gap-1 border-0 p-0 m-0">
                            <Link
                              to="/invoices/$id"
                              params={{ id: inv.id.toString() }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                aria-label="View"
                                data-ocid={`invoices.view_button.${rowNum}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hidden md:inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium"
                              aria-label="Print"
                              onClick={(e) => {
                                e.stopPropagation();
                                printInvoice(inv);
                              }}
                              data-ocid={`invoices.print_button.${rowNum}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                              aria-label="Download"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadInvoice(inv);
                              }}
                              data-ocid={`invoices.download_button.${rowNum}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Link
                              to="/invoices/$id/edit"
                              params={{ id: inv.id.toString() }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                aria-label="Edit"
                                data-ocid={`invoices.edit_button.${rowNum}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 text-destructive hover:text-destructive"
                                  aria-label="Delete"
                                  onClick={(e) => e.stopPropagation()}
                                  data-ocid={`invoices.delete_button.${rowNum}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-ocid="invoices.dialog">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Invoice
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    {formatInvoiceId(inv.id)} for{" "}
                                    {inv.patientName}? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-ocid="invoices.cancel_button">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(inv.id)}
                                    className="bg-destructive text-destructive-foreground"
                                    data-ocid="invoices.confirm_button"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </fieldset>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Page {safePage} of {totalPages} &nbsp;·&nbsp;{" "}
                    {filtered.length} invoices
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 gap-1 text-xs"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      data-ocid="invoices.pagination_prev"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 gap-1 text-xs"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      data-ocid="invoices.pagination_next"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
