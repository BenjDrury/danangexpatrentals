import Link from "next/link";
import { btnBase, btnSizes, btnVariants } from "./styles";

type Variant = keyof typeof btnVariants;
type Size = keyof typeof btnSizes;

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = Common &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = Common & {
  href: string;
  type?: never;
  disabled?: boolean;
};

function classes(variant: Variant, size: Size, className: string) {
  return `${btnBase} ${btnSizes[size]} ${btnVariants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: ButtonProps | LinkProps) {
  const cls = classes(variant, size, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonProps)}>
      {children}
    </button>
  );
}
