import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type='text'
        inputMode='decimal'
        value={value}
        onChange={(e) => {
          // only allow numbers, decimal point, minus sign
          const val = e.target.value;
          if (val === "" || val === "-" || /^-?\d*\.?\d*$/.test(val)) {
            onChange(val);
          }
        }}
        onWheel={(e) => {
          // prevent any wheel interaction
          e.currentTarget.blur();
        }}
        className={cn(className)}
        {...props}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";
