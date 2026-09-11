"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode, MouseEvent } from "react";

export function StopPropagationLink({
  children,
  className,
  ...props
}: LinkProps & { children: ReactNode; className?: string }) {
  return (
    <Link
      {...props}
      className={className}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
      }}
    >
      {children}
    </Link>
  );
}
