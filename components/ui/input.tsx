import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, error, id, "aria-describedby": ariaDescribedby, ...props },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = error ? errorId : ariaDescribedby;

    return (
      <>
        <input
          id={id}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </>
    );
  }
);

Input.displayName = "Input";

export { Input };
