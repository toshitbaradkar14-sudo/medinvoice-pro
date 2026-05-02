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
import { Edit2, Pill, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "../lib/format";

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

function persistMedicines(list: MedicineEntry[]) {
  localStorage.setItem(MEDICINE_STORAGE_KEY, JSON.stringify(list));
}

export default function SavedMedicinesPage() {
  const [medicines, setMedicines] = useState<MedicineEntry[]>(() =>
    loadMedicines(),
  );

  // Edit modal state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);

  const openEdit = (index: number) => {
    const med = medicines[index];
    setEditIndex(index);
    setEditName(med.name);
    setEditPrice(med.price);
  };

  const handleEditSave = () => {
    if (editIndex === null) return;
    if (!editName.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    if (editPrice <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    const updated = medicines.map((m, i) =>
      i === editIndex ? { name: editName.trim(), price: editPrice } : m,
    );
    setMedicines(updated);
    persistMedicines(updated);
    setEditIndex(null);
    toast.success("Medicine updated");
  };

  const handleDelete = (index: number) => {
    const med = medicines[index];
    if (!window.confirm(`Delete "${med.name}"? This cannot be undone.`)) return;
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
    persistMedicines(updated);
    toast.success(`"${med.name}" removed`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Saved Medicines
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Medicines saved from invoice creation — reusable for quick billing
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-semibold">
          {medicines.length} saved
        </Badge>
      </div>

      <Card className="shadow-subtle border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            Medicine List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicines.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-3 text-center"
              data-ocid="medicines.empty_state"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Pill className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">
                No saved medicines yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Medicines are saved automatically when you add them during
                invoice creation.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border" data-ocid="medicines.list">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 pb-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-1">#</span>
                <span className="col-span-6">Medicine Name</span>
                <span className="col-span-3 text-right">Price (₹)</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {[...medicines]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((med, idx) => {
                  const originalIndex = medicines.indexOf(med);
                  return (
                    <div
                      key={`${med.name}-${idx}`}
                      className="grid grid-cols-12 gap-3 items-center py-3 px-1 hover:bg-muted/30 transition-colors rounded-md"
                      data-ocid={`medicines.item.${idx + 1}`}
                    >
                      <span className="col-span-1 text-xs text-muted-foreground tabular-nums">
                        {idx + 1}
                      </span>
                      <span
                        className="col-span-6 font-medium text-sm text-foreground truncate"
                        title={med.name}
                      >
                        {med.name}
                      </span>
                      <span className="col-span-3 text-right tabular-nums text-sm font-semibold text-foreground">
                        {formatCurrency(med.price * 100)}
                      </span>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(originalIndex)}
                          aria-label={`Edit ${med.name}`}
                          data-ocid={`medicines.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(originalIndex)}
                          aria-label={`Delete ${med.name}`}
                          data-ocid={`medicines.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editIndex !== null} onOpenChange={() => setEditIndex(null)}>
        <DialogContent className="sm:max-w-sm" data-ocid="medicines.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-med-name" className="text-sm font-semibold">
                Medicine Name
              </Label>
              <Input
                id="edit-med-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Paracetamol"
                data-ocid="medicines.edit_name_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-med-price" className="text-sm font-semibold">
                Price (₹)
              </Label>
              <Input
                id="edit-med-price"
                type="number"
                min="0"
                step="0.01"
                value={editPrice || ""}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                placeholder="0.00"
                data-ocid="medicines.edit_price_input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditIndex(null)}
              data-ocid="medicines.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditSave}
              className="gradient-primary border-0 text-primary-foreground font-semibold"
              data-ocid="medicines.save_button"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
