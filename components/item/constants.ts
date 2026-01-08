import { Lock, FileText, Shield } from "lucide-react";
import { ItemTypeConfig } from './types';
import { ItemTypeEnum } from "@/schema/zod-schema";

export const ITEM_TYPE_CONFIG: Record<ItemTypeEnum, ItemTypeConfig> = {
  login: {
    label: "Login Credentials",
    icon: Lock,
    description: "Store usernames, passwords, and login URLs",
    color: "bg-blue-900/20 text-blue-300 border-blue-700/50",
    examples: ["Username + Password", "Email + Password + URL"],
  },
  note: {
    label: "Secure Note",
    icon: FileText,
    description: "Store sensitive text with optional context",
    color: "bg-purple-900/20 text-purple-300 border-purple-700/50",
    examples: ["Recovery codes + Username", "Server details + Login info"],
  },
  totp: {
    label: "Two-Factor Auth",
    icon: Shield,
    description: "Store 2FA keys with context information",
    color: "bg-green-900/20 text-green-300 border-green-700/50",
    examples: ["TOTP + Username", "TOTP + URL + Account info"],
  },
};
