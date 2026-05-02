import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Pill, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InvoiceStatus } from "../backend.d";
import { useInvoice, useUpdateInvoice } from "../hooks/useQueries";
import { formatCurrency } from "../lib/format";
import type { ServiceItemForm } from "../types";

const MEDICINE_STORAGE_KEY = "medinvoice_medicines";

interface MedicineEntry {
  name: string;
  price: number;
}

function loadMedicines(): MedicineEntry[] {
  try {
    return JSON.parse(localStorage.getItem(MEDICINE_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveMedicines(list: MedicineEntry[]) {
  localStorage.setItem(MEDICINE_STORAGE_KEY, JSON.stringify(list));
}

/** Deduplicates by normalized name (case-insensitive trim); updates price if same name exists */
function upsertMedicine(
  list: MedicineEntry[],
  med: MedicineEntry,
): MedicineEntry[] {
  const key = med.name.toLowerCase();
  const exists = list.some((m) => m.name.toLowerCase() === key);
  if (exists) {
    return list.map((m) =>
      m.name.toLowerCase() === key ? { ...m, price: med.price } : m,
    );
  }
  return [...list, med];
}

/** Truncate display name to 20 chars with ellipsis */
function truncateMedName(name: string): string {
  return name.length > 20 ? `${name.slice(0, 20)}…` : name;
}

export default function EditInvoicePage() {
  const { id } = useParams({ from: "/protected/invoices/$id/edit" });
  const navigate = useNavigate();
  const {
    data: invoice,
    isLoading,
    isFetching,
  } = useInvoice(id ? BigInt(id) : null);
  const updateInvoice = useUpdateInvoice();

  const [patientName, setPatientName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.draft);
  const [services, setServices] = useState<ServiceItemForm[]>([
    { name: "", quantity: 1, unitPrice: 0 },
  ]);

  // GST state
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);

  // Medicine state
  const [medicines, setMedicines] = useState<MedicineEntry[]>(() =>
    loadMedicines(),
  );
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedPrice, setNewMedPrice] = useState<number>(0);
  const [newMedQty, setNewMedQty] = useState<number>(1);
  const medNameRef = useRef<HTMLInputElement>(null);

  // Service name error tracking
  const [serviceNameErrors, setServiceNameErrors] = useState<boolean[]>([]);

  useEffect(() => {
    if (showAddMedicine) medNameRef.current?.focus();
  }, [showAddMedicine]);

  useEffect(() => {
    if (invoice) {
      setPatientName(invoice.patientName);
      setIssueDate(
        new Date(Number(invoice.issueDate) / 1_000_000)
          .toISOString()
          .slice(0, 10),
      );
      setDueDate(
        new Date(Number(invoice.dueDate) / 1_000_000)
          .toISOString()
          .slice(0, 10),
      );
      setStatus(invoice.status);
      setServices(
        invoice.services.map((s) => ({
          name: s.name,
          quantity: Number(s.quantity),
          unitPrice: Number(s.unitPrice) / 100,
        })),
      );
      setGstEnabled(invoice.gstEnabled);
      if (invoice.gstPercentage !== undefined) {
        setGstPercentage(Number(invoice.gstPercentage));
      }
    }
  }, [invoice]);

  const addService = () =>
    setServices((s) => [...s, { name: "", quantity: 1, unitPrice: 0 }]);
  const removeService = (i: number) =>
    setServices((s) => s.filter((_, idx) => idx !== i));
  const updateService = (
    i: number,
    field: keyof ServiceItemForm,
    value: string | number,
  ) => {
    setServices((s) =>
      s.map((svc, idx) => (idx === i ? { ...svc, [field]: value } : svc)),
    );
    // Clear error on the field being typed in
    if (field === "name") {
      setServiceNameErrors((errs) => {
        const next = [...errs];
        next[i] = false;
        return next;
      });
    }
  };

  const subtotal = services.reduce(
    (sum, s) => sum + s.quantity * s.unitPrice,
    0,
  );
  const gstAmount = gstEnabled ? (subtotal * gstPercentage) / 100 : 0;
  const grandTotal = subtotal + gstAmount;

  const handleAddMedicine = () => {
    if (!newMedName.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    if (newMedPrice <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (newMedQty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    const med: MedicineEntry = { name: newMedName.trim(), price: newMedPrice };
    const updated = upsertMedicine(medicines, med);
    setMedicines(updated);
    saveMedicines(updated);
    setServices((s) => [
      ...s,
      { name: med.name, quantity: newMedQty, unitPrice: med.price },
    ]);
    setNewMedName("");
    setNewMedPrice(0);
    setNewMedQty(1);
    setShowAddMedicine(false);
    toast.success(`${med.name} added`);
  };

  const handleSelectMedicine = (med: MedicineEntry) => {
    setServices((s) => [
      ...s,
      { name: med.name, quantity: 1, unitPrice: med.price },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    if (!patientName.trim()) {
      toast.error("Patient name is required");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }
    // Trim service names and validate
    const trimmedServices = services.map((s) => ({
      ...s,
      name: s.name.trim(),
    }));
    const nameErrors = trimmedServices.map((s) => !s.name);
    if (nameErrors.some(Boolean)) {
      setServiceNameErrors(nameErrors);
      toast.error("All service names are required");
      return;
    }
    setServices(trimmedServices);

    if (gstEnabled && gstPercentage <= 0) {
      toast.error("GST percentage must be greater than 0");
      return;
    }
    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        patientName: patientName.trim(),
        issueDate: BigInt(new Date(issueDate).getTime()) * 1_000_000n,
        dueDate: BigInt(new Date(dueDate).getTime()) * 1_000_000n,
        status,
        gstEnabled,
        gstPercentage: gstEnabled
          ? BigInt(Math.round(gstPercentage))
          : undefined,
        services: trimmedServices.map((s) => ({
          name: s.name,
          quantity: BigInt(Math.max(1, Math.round(s.quantity))),
          unitPrice: BigInt(Math.round(s.unitPrice * 100)),
        })),
      });
      toast.success("Invoice updated");
      navigate({ to: "/invoices/$id", params: { id: invoice.id.toString() } });
    } catch (err) {
      console.error("Update invoice error:", err);
      toast.error("Failed to update invoice");
    }
  };

  if (isLoading || isFetching) {
    return (
      <div
        className="max-w-2xl mx-auto space-y-4"
        data-ocid="edit_invoice.loading_state"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/invoices/$id" params={{ id: id ?? "" }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-ocid="edit_invoice.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Edit Invoice
          </h1>
          <p className="text-muted-foreground text-sm">
            Update invoice details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-subtle border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold font-display">
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient" className="text-sm font-semibold">
                Patient Name
              </Label>
              <Input
                id="patient"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                data-ocid="edit_invoice.patient_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate" className="text-sm font-semibold">
                  Issue Date
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  data-ocid="edit_invoice.issue_date_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-semibold">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  data-ocid="edit_invoice.due_date_input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as InvoiceStatus)}
              >
                <SelectTrigger
                  id="status"
                  data-ocid="edit_invoice.status_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InvoiceStatus.draft}>Draft</SelectItem>
                  <SelectItem value={InvoiceStatus.sent}>Pending</SelectItem>
                  <SelectItem value={InvoiceStatus.paid}>Paid</SelectItem>
                  <SelectItem value={InvoiceStatus.cancelled}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-border">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold font-display">
              Services & Medicines
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddMedicine((v) => !v)}
                className="gap-1.5 text-xs"
                data-ocid="edit_invoice.add_medicine_toggle"
              >
                <Pill className="w-3.5 h-3.5" />
                Add Medicine
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addService}
                className="gap-2 text-xs"
                data-ocid="edit_invoice.add_service_button"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Medicine quick-add panel */}
            {showAddMedicine && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Add Medicine
                </p>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5 space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Medicine Name
                    </Label>
                    <Input
                      ref={medNameRef}
                      placeholder="e.g. Paracetamol"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      data-ocid="edit_invoice.medicine_name_input"
                    />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-xs font-semibold">Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newMedPrice || ""}
                      onChange={(e) => setNewMedPrice(Number(e.target.value))}
                      data-ocid="edit_invoice.medicine_price_input"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newMedQty}
                      onChange={(e) => setNewMedQty(Number(e.target.value))}
                      data-ocid="edit_invoice.medicine_qty_input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddMedicine}
                      className="w-full text-xs"
                      data-ocid="edit_invoice.medicine_add_button"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {medicines.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Quick-select saved medicine:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...medicines]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((med) => (
                          <button
                            key={`med-${med.name}`}
                            type="button"
                            onClick={() => handleSelectMedicine(med)}
                            title={med.name}
                            className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted transition-colors"
                          >
                            {truncateMedName(med.name)} —{" "}
                            {formatCurrency(med.price * 100)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {services.map((svc, i) => (
              <div
                key={svc.name ? `${svc.name}-${i}` : `edit-svc-${i}`}
                className="space-y-3"
              >
                {i > 0 && <Separator />}
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5 space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Service / Medicine Name
                    </Label>
                    <Input
                      value={svc.name}
                      onChange={(e) => updateService(i, "name", e.target.value)}
                      required
                      className={
                        serviceNameErrors[i]
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      data-ocid={`edit_invoice.service_name.${i + 1}`}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={svc.quantity}
                      onChange={(e) =>
                        updateService(i, "quantity", Number(e.target.value))
                      }
                      data-ocid={`edit_invoice.service_qty.${i + 1}`}
                    />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Unit Price (₹)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={svc.unitPrice}
                      onChange={(e) =>
                        updateService(i, "unitPrice", Number(e.target.value))
                      }
                      data-ocid={`edit_invoice.service_price.${i + 1}`}
                    />
                  </div>
                  <div className="col-span-1">
                    {i > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-destructive"
                        onClick={() => removeService(i)}
                        aria-label="Remove"
                        data-ocid={`edit_invoice.remove_service.${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            {/* GST toggle & totals */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  id="gstToggle"
                  type="checkbox"
                  checked={gstEnabled}
                  onChange={(e) => setGstEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  data-ocid="edit_invoice.gst_toggle"
                />
                <Label
                  htmlFor="gstToggle"
                  className="text-sm font-semibold cursor-pointer"
                >
                  Enable GST
                </Label>
                {gstEnabled && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={gstPercentage}
                      onChange={(e) => setGstPercentage(Number(e.target.value))}
                      className="w-20 h-7 text-sm"
                      data-ocid="edit_invoice.gst_percentage_input"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(subtotal * 100)}
                  </span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST ({gstPercentage}%)</span>
                    <span className="tabular-nums">
                      {formatCurrency(gstAmount * 100)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-display font-bold text-foreground">
                    {formatCurrency(grandTotal * 100)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link to="/invoices/$id" params={{ id: id ?? "" }}>
            <Button
              type="button"
              variant="outline"
              data-ocid="edit_invoice.cancel_button"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={updateInvoice.isPending}
            className="gradient-primary border-0 text-primary-foreground font-semibold"
            data-ocid="edit_invoice.submit_button"
          >
            {updateInvoice.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
