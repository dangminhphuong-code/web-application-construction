import { Badge } from "@/components/ui/badge";

type CapacityBadgeProps = {
  enrolledCount: number;
  capacity: number;
  status: string;
};

export function CapacityBadge({
  enrolledCount,
  capacity,
  status
}: CapacityBadgeProps) {
  const isFull = enrolledCount >= capacity;

  if (isFull) {
    return <Badge variant="destructive">Hết chỗ</Badge>;
  }

  if (status.toLowerCase() !== "open") {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <Badge variant="outline">
      Còn chỗ: {enrolledCount}/{capacity}
    </Badge>
  );
}
