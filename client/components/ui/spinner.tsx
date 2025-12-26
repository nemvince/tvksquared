import { SpinnerBallIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { cn } from "@/client/lib/utils";

function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <SpinnerBallIcon
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      role="status"
      {...props}
    />
  );
}

export { Spinner };
