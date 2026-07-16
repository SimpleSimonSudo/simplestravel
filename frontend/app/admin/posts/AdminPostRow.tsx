"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminPostRow({
  postId,
  children,
}: {
  postId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/admin/posts/${postId}`)}
      className="hover:bg-cream/40 active:bg-cream/60 transition-colors cursor-pointer"
    >
      {children}
    </tr>
  );
}
