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
      <SidebarGroupLabel className="text-gray-500 text-xs font-bold uppercase tracking-wider px-2 mb-2">
        Platform
      </SidebarGroupLabel>
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
                <SidebarMenuButton 
                  tooltip={item.title} 
                  className="group/button text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 ease-in-out font-medium"
                >
                  {item.icon && (
                    <item.icon className="text-gray-500 group-hover/button:text-gray-800 transition-colors w-4 h-4" />
                  )}
                  <span className="relative flex-1">
                    {item.title}
                    {item.hasNotification && (
                      <span className="absolute top-0.5 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </span>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover/button:text-gray-600" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="border-l-gray-200 mr-0 pr-0 ml-3.5 pl-3">
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activeTab === subItem.title}
                        onClick={() => setActiveTab(subItem.title)}
                        className={`
                          group/subitem transition-all duration-200 cursor-pointer h-9
                          ${activeTab === subItem.title
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }
                        `}
                      >
                        <a href={subItem.url} onClick={(e) => e.preventDefault()}>
                          <span>
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