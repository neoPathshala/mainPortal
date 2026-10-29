import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "emerald";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const slots = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.99] border border-transparent",
      emerald:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.99] border border-transparent",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.99] border border-rose-500/40",
      outline:
        "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost:
        "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
      link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-[11px]",
      lg: "h-11 px-6 text-sm font-semibold",
      icon: "h-9 w-9",
    };

    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          slots[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
