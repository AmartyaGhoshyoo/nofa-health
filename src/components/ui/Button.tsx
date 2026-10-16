import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "light" | "dark";
type Size = "md" | "sm";

const base =
  "group relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-teal text-white hover:bg-teal-hover",
  dark: "bg-ink text-white hover:bg-ocean",
  ghost: "border border-line-strong bg-surface/60 text-ink backdrop-blur hover:border-teal/40 hover:bg-surface",
  light: "bg-white text-ocean hover:bg-canvas-soft", // for the dark ocean sections
};

const sizes: Record<Size, string> = {
  md: "h-12 px-6 text-[0.98rem]",
  sm: "h-10 px-4 text-[0.9rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  arrow?: boolean;
}

type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; as?: "a" };
type NativeProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { as: "button" };

function Arrow() {
  return (
    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
      →
    </span>
  );
}

export default function Button(props: LinkProps | NativeProps) {
  const { variant = "primary", size = "md", className = "", children, arrow = false } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (props.as === "button") {
    const { as: _a, variant: _v, size: _s, className: _c, children: _ch, arrow: _ar, ...rest } = props;
    return (
      <button className={classes} {...rest}>
        {children}
        {arrow && <Arrow />}
      </button>
    );
  }
  const { href, as: _a, variant: _v, size: _s, className: _c, children: _ch, arrow: _ar, ...rest } = props as LinkProps;
  return (
    <a href={href} className={classes} {...rest}>
      {children}
      {arrow && <Arrow />}
    </a>
  );
}
