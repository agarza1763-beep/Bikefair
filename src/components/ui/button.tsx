import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import clsx from "clsx";

type Variant = "primary" | "accent" | "secondary" | "outline" | "outline-inverse" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-charcoal-900 text-white hover:bg-charcoal-700",
  accent: "bg-accent-500 text-charcoal-950 hover:bg-accent-600",
  secondary: "bg-green-700 text-white hover:bg-green-800",
  outline: "border border-charcoal-200 text-charcoal-900 hover:border-charcoal-900 bg-white",
  // For use on dark backgrounds (hero, dark bands). Kept as its own variant rather than
  // overriding `outline` via className — Tailwind's generated CSS order (not JSX class order)
  // decides which of two conflicting utilities (e.g. text-white vs text-charcoal-900) wins, so
  // layering a color override on top of `outline` is unreliable and previously rendered as
  // invisible text on some pages.
  "outline-inverse": "border border-white/30 text-white bg-transparent hover:border-white",
  ghost: "text-charcoal-700 hover:bg-charcoal-50",
  danger: "bg-red-500 text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3.5 py-1.5",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  )
);
Button.displayName = "Button";

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link href={href} className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}
