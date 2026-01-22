"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Sparkles,
  CreditCard
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
  onTabChange, // FIXED: Changed from onTabChangeAction to match AppSidebar
}: {
  user: {
    name: string | null
    email: string
    image: string | null
  }
  onTabChange?: (tab: string) => void 
}) {
  const { isMobile } = useSidebar()

  const proxyImage = user.image
    ? `/api/image-proxy?url=${encodeURIComponent(user.image)}`
    : "https://github.com/shadcn.png";

  const displayName = user.name || getNameFromEmail(user.email);

  const handleMenuItemClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900 hover:bg-gray-100 transition-all duration-200 ease-in-out border border-transparent"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm">
                <AvatarImage src={proxyImage || "https://github.com/shadcn.png"} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-gray-100 text-gray-600 font-bold">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-gray-900">{displayName}</span>
                <span className="truncate text-xs text-gray-500 font-medium">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl bg-white border border-gray-200 text-gray-900 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border border-gray-200">
                  <AvatarImage src={proxyImage || "https://github.com/shadcn.png"} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-gray-100 text-gray-600">
                    {displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-gray-900">{displayName}</span>
                  <span className="truncate text-xs text-gray-500">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator className="bg-gray-100 my-1" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="gap-2 p-2 focus:bg-gray-50 text-gray-700 focus:text-gray-900 cursor-pointer rounded-lg"
                onClick={() => handleMenuItemClick("Settings")}
              >
                <Sparkles className="size-4 text-amber-500 fill-amber-500/10" />
                <p className="font-medium">Upgrade to Pro</p>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-gray-100 my-1" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="gap-2 p-2 focus:bg-gray-50 text-gray-700 focus:text-gray-900 cursor-pointer rounded-lg"
                onClick={() => handleMenuItemClick("Dashboard")}
              >
                <BadgeCheck className="size-4" />
                <p>Account Overview</p>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="gap-2 p-2 focus:bg-gray-50 text-gray-700 focus:text-gray-900 cursor-pointer rounded-lg"
                onClick={() => handleMenuItemClick("Settings")}
              >
                <CreditCard className="size-4" />
                <p>Billing</p>
              </DropdownMenuItem>

              <DropdownMenuItem 
                className="gap-2 p-2 focus:bg-gray-50 text-gray-700 focus:text-gray-900 cursor-pointer rounded-lg"
                onClick={() => handleMenuItemClick("Active")}
              >
                <Bell className="size-4" />
                <p>Notifications</p>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-gray-100 my-1" />
            
            <div className="text-gray-700 hover:text-red-600">
               <LogoutMenuItem />
            </div>
            
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}