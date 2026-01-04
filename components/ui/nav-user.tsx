"use client"

import {
  BadgeCheck,
  Bell,
  ChevronUpIcon,
  CreditCard,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { LogoutMenuItem } from "../auth/logout-menu-item"
import { getNameFromEmail } from "@/utils/get-name"

export function NavUser({
  user,
}: {
  user: {
    name: string | null
    email: string
    image: string | null
  }
}) {
  const { isMobile } = useSidebar()

  const proxyImage = user.image
    ? `/api/image-proxy?url=${encodeURIComponent(user.image)}`
    : "https://github.com/shadcn.png";

  const displayName = user.name || getNameFromEmail(user.email);

  return (
    <SidebarMenu className="bg-gray-900 text-white">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-gray-800 data-[state=open]:text-white hover:bg-gray-800"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={proxyImage || "https://github.com/shadcn.png"} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-gray-700 text-white">{displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-white">{displayName}</span>
                <span className="truncate text-xs text-gray-400">{user.email}</span>
              </div>
              <ChevronUpIcon className="ml-auto size-4 text-gray-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-gray-800 border-gray-700 text-white"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={proxyImage || "https://github.com/shadcn.png"} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-gray-700 text-white">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-white">{displayName}</span>
                  <span className="truncate text-xs text-gray-400">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-white hover:bg-gray-700 focus:bg-gray-700">
                <Sparkles />
                <p className="text-white">Upgrade to Pro</p>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-white hover:bg-gray-700 focus:bg-gray-700">
                <BadgeCheck />
                <p className="text-white">Account</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-gray-700 focus:bg-gray-700">
                <CreditCard />
                <p className="text-white">Billing</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-gray-700 focus:bg-gray-700">
                <Bell />
                <p className="text-white">Notifications</p>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-700" />
            <LogoutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}