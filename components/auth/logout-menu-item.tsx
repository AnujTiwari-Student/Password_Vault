"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import React from "react";

export function LogoutMenuItem() {
  const [isPending, startTransition] = React.useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/auth/login" }); 
    });
  };

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={isPending}
      className={`
        gap-2 p-2 cursor-pointer rounded-lg transition-colors duration-200
        text-gray-700 hover:text-red-600 hover:bg-red-50 
        focus:bg-red-50 focus:text-red-600
        ${isPending ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <LogOut className="size-4" />
      <span className="font-medium text-sm">
        {isPending ? "Logging out..." : "Log out"}
      </span>
    </DropdownMenuItem>
  );
}