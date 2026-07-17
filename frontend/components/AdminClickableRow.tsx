"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function AdminClickableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-cream/40 active:bg-cream/60 transition-colors cursor-pointer"
    >
      {children}
    </tr>
  );
}
