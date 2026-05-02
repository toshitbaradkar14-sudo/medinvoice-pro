import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "../hooks/useAuth";
import {
  usePracticeSettings,
  useSavePracticeSettings,
} from "../hooks/useQueries";

export default function SettingsPage() {
  const { displayName } = useCurrentUser();
  const { data: settings, isLoading } = usePracticeSettings();
  const savePractice = useSavePracticeSettings();
  // updateDisplayName removed with subscription module — name is not editable
  const updateName = {
    mutateAsync: async (_name?: string) => {},
    isPending: false,
  };

  const [practiceName, setPracticeName] = useState(
    settings?.practiceName ?? "",
  );
  const [address, setAddress] = useState(settings?.address ?? "");
  const [name, setName] = useState(displayName);

  useEffect(() => {
    setPracticeName(settings?.practiceName ?? "");
    setAddress(settings?.address ?? "");
  }, [settings]);

  const handleSavePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePractice.mutateAsync({ practiceName, address });
      toast.success("Practice settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await updateName.mutateAsync(name.trim());
      toast.success("Display name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  if (isLoading) {
    return (
      <div
        className="max-w-2xl mx-auto space-y-4"
        data-ocid="settings.loading_state"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and practice details
        </p>
      </div>

      {/* Profile */}
      <Card className="shadow-subtle border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-semibold">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Alex Chen"
                data-ocid="settings.display_name_input"
              />
            </div>
            <Button
              type="submit"
              disabled={updateName.isPending}
              size="sm"
              className="gap-2 gradient-primary border-0 text-primary-foreground"
              data-ocid="settings.save_name_button"
            >
              <Save className="w-3.5 h-3.5" />
              {updateName.isPending ? "Saving..." : "Save Name"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Practice */}
      <Card className="shadow-subtle border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Practice Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePractice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="practiceName" className="text-sm font-semibold">
                Practice Name
              </Label>
              <Input
                id="practiceName"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder="Sunshine Medical Clinic"
                data-ocid="settings.practice_name_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold">
                Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Medical Center Dr, Suite 100"
                data-ocid="settings.address_input"
              />
            </div>
            <Separator />
            <Button
              type="submit"
              disabled={savePractice.isPending}
              size="sm"
              className="gap-2 gradient-primary border-0 text-primary-foreground"
              data-ocid="settings.save_practice_button"
            >
              <Save className="w-3.5 h-3.5" />
              {savePractice.isPending ? "Saving..." : "Save Practice Info"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
