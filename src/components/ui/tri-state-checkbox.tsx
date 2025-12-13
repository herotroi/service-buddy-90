import * as React from "react"
import { cn } from "@/lib/utils"

export type TriStateValue = true | false | null;

interface TriStateCheckboxProps {
  value: TriStateValue;
  onChange: (value: TriStateValue) => void;
  className?: string;
}

export const TriStateCheckbox = React.forwardRef<
  HTMLDivElement,
  TriStateCheckboxProps
>(({ value, onChange, className }, ref) => {
  const handleClick = () => {
    // Cycle: null -> true -> false -> null
    if (value === null) {
      onChange(true);
    } else if (value === true) {
      onChange(false);
    } else {
      onChange(null);
    }
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded border-2 cursor-pointer transition-colors text-xs font-bold",
        value === null && "border-muted-foreground bg-muted text-muted-foreground",
        value === true && "border-green-500 bg-green-500 text-white",
        value === false && "border-red-500 bg-red-500 text-white",
        className
      )}
    >
      {value === null && "—"}
      {value === true && "S"}
      {value === false && "N"}
    </div>
  );
});

TriStateCheckbox.displayName = "TriStateCheckbox";
