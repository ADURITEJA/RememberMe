import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * Accessible, high-contrast label with an optional helper hint.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "mb-2 block text-[15px] font-medium text-[#1d1d1f]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";

export { Label };
