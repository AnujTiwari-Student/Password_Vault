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
      className={`flex items-center gap-2 text-white transition ${
        isPending
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-700 focus:bg-gray-700"
      }`}
    >
      <LogOut className="w-4 h-4" />
      <p className="text-white">
        {isPending ? "Logging out..." : "Log out"}
      </p>
    </DropdownMenuItem>
  );
}
