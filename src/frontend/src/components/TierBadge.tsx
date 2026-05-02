import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

// SubscriptionTier removed — component kept as a no-op stub for backwards compat
interface TierBadgeProps {
  tier?: unknown;
  className?: string;
}

export function TierBadge({ className }: TierBadgeProps) {
  return (
    <Badge
      className={cn(
        "badge-tier gap-1.5 transition-smooth bg-primary/10 text-primary border-primary/20",
        className,
      )}
      variant="outline"
    >
      <User className="w-3 h-3" />
      User
    </Badge>
  );
}
