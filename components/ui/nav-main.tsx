"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    hasNotification?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function NavMain({ items, activeTab, setActiveTab }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} className="group/button">
                  {item.icon && <item.icon className="text-white group-hover/button:text-black transition-colors" />}
                  <span className="relative text-white font-semibold group-hover/button:text-black transition-colors">
                    {item.title}
                    {item.hasNotification && (
                      <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-white group-hover/button:text-black" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activeTab === subItem.title}
                        onClick={() => setActiveTab(subItem.title)}
                        className="group/subitem"
                      >
                        <a href={subItem.url}>
                          <span className={activeTab === subItem.title ? "text-black font-semibold" : "text-gray-200 group-hover/subitem:text-black transition-colors"}>
                            {subItem.title}
                          </span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}