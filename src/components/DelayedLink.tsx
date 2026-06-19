import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useDelayedNav } from "@/hooks/use-delayed-nav";

/**
 * Drop-in replacement for react-router-dom's <Link> that delays navigation
 * by ~120ms so the press animation has time to render before the page
 * unmounts. Falls back to native behavior for modifier-clicks / middle-click.
 */
export const DelayedLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, onClick, replace, state, ...rest }, ref) => {
    const goTo = useDelayedNav();
    return (
      <Link
        ref={ref}
        to={to}
        replace={replace}
        state={state}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          if (typeof to !== "string") return;
          goTo(to, e, { replace, state });
        }}
        {...rest}
      />
    );
  },
);
DelayedLink.displayName = "DelayedLink";
