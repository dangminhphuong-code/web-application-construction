import * as React from "react";

import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border p-4 text-sm", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm", className)} {...props} />;
}
