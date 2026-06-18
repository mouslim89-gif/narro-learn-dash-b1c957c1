import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [-webkit-tap-highlight-color:transparent] [touch-action:manipulation]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground btn-relief active:bg-primary/95 active:translate-y-[1px]",
        destructive: "bg-destructive text-destructive-foreground btn-relief active:bg-destructive/95 active:translate-y-[1px]",
        outline: "border border-input bg-background btn-relief active:bg-accent/5 active:translate-y-[1px]",
        secondary: "bg-secondary text-secondary-foreground btn-relief active:bg-secondary/90 active:translate-y-[1px]",
        ghost: "active:bg-foreground/10 active:scale-[0.965]",
        link: "text-primary underline-offset-4 active:opacity-70",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };