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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Download, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useDeleteInvoice, useInvoice } from "../hooks/useQueries";
import {
  calculateInvoiceTotal,
  formatCurrency,
  formatDate,
  formatInvoiceId,
} from "../lib/format";
import { useDownloadInvoice, usePrintInvoice } from "../lib/print";

export default function InvoiceDetailPage() {
  const { id } = useParams({ from: "/protected/invoices/$id" });
  const navigate = useNavigate();
  const {
    data: invoice,
    isLoading,
    isFetching,
  } = useInvoice(id ? BigInt(id) : null);
  const deleteInvoice = useDeleteInvoice();
  const downloadInvoice = useDownloadInvoice();
  const printInvoice = usePrintInvoice();

  // Load medicine names from localStorage for display labeling
  const medicineNames = (() => {
    try {
      const list = JSON.parse(
        localStorage.getItem("medinvoice_medicines") ?? "[]",
      ) as { name: string }[];
      return new Set(list.map((m) => m.name.toLowerCase().trim()));
    } catch {
      return new Set<string>();
    }
  })();

  const handleDelete = async () => {
    if (!invoice) return;
    try {
      await deleteInvoice.mutateAsync(invoice.id);
      toast.success("Invoice deleted");
      navigate({ to: "/invoices" });
    } catch (err) {
      console.error("Delete invoice error:", err);
      toast.error("Failed to delete invoice");
    }
  };

  if (isLoading || isFetching || (!invoice && id)) {
    return (
      <div
        className="max-w-2xl mx-auto space-y-6"
        data-ocid="invoice_detail.loading_state"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div
        className="max-w-2xl mx-auto text-center py-16"
        data-ocid="invoice_detail.error_state"
      >
        <p className="text-lg font-semibold text-foreground">
          Invoice not found
        </p>
        <Link to="/invoices">
          <Button variant="outline" className="mt-4">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = calculateInvoiceTotal(invoice.services);
  const displayTotal = invoice.gstEnabled ? Number(invoice.total) : subtotal;
  const gstPct =
    invoice.gstEnabled && invoice.gstPercentage !== undefined
      ? Number(invoice.gstPercentage)
      : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/invoices">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-ocid="invoice_detail.back_button"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground font-mono">
              {formatInvoiceId(invoice.id)}
            </h1>
            <StatusBadge status={invoice.status} className="mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInvoice(invoice)}
            className="hidden md:inline-flex gap-2 text-xs"
            data-ocid="invoice_detail.print_button"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInvoice(invoice)}
            className="gap-2 text-xs"
            data-ocid="invoice_detail.download_button"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <Link to="/invoices/$id/edit" params={{ id: invoice.id.toString() }}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              data-ocid="invoice_detail.edit_button"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                data-ocid="invoice_detail.delete_button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="invoice_detail.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {formatInvoiceId(invoice.id)}.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="invoice_detail.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                  data-ocid="invoice_detail.confirm_button"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="shadow-subtle border-border">
        <CardContent className="p-6 space-y-6">
          {/* Patient & dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Bill To
              </p>
              <p className="font-semibold text-foreground text-lg">
                {invoice.patientName}
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Issue Date
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Due Date
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Services table */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Services
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 text-xs font-semibold text-muted-foreground">
                    Service
                  </th>
                  <th className="text-right pb-2 text-xs font-semibold text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-right pb-2 text-xs font-semibold text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="text-right pb-2 text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.services.map((svc, i) => (
                  <tr
                    key={`${svc.name}-${i}`}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2.5 font-medium text-foreground">
                      {medicineNames.has(svc.name.toLowerCase().trim()) && (
                        <span className="text-xs font-normal text-muted-foreground mr-1">
                          (Med)
                        </span>
                      )}
                      {svc.name}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {svc.quantity.toString()}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {formatCurrency(Number(svc.unitPrice))}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {formatCurrency(
                        Number(svc.quantity) * Number(svc.unitPrice),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* GST breakdown + total */}
          <div className="space-y-2 text-sm">
            {invoice.gstEnabled && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST ({gstPct}%)</span>
                  <span className="tabular-nums">
                    {formatCurrency(Number(invoice.gstAmount))}
                  </span>
                </div>
                <Separator />
              </>
            )}
            <div className="flex justify-between items-center">
              <p className="font-semibold text-foreground">
                {invoice.gstEnabled ? "Total (incl. GST)" : "Total"}
              </p>
              <p className="text-2xl font-display font-bold text-foreground">
                {formatCurrency(displayTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
