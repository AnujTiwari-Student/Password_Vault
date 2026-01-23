"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ChevronsUpDown, Plus, Building2, Crown, Check } from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter, useSearchParams } from "next/navigation";
import CreateOrgForm from "../auth/CreateOrgForm";
import { canCreateOrg } from "@/utils/permission-utils";

interface Organization {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  created_at: string;
  isOwner: boolean;
  vault?: {
    id: string;
    name: string;
    type: string;
  };
}

export function TeamSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useCurrentUser();
  const { isMobile } = useSidebar();

  const [showLoading, setShowLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const canUserCreateOrg = React.useMemo(() => {
    const isOwnerOrAdmin =
      // @ts-expect-error TS(2769)
      user?.account_type === "org" && user.account_type !== "personal";

    // @ts-expect-error TS(2769)
    const hasGlobalPermission = canCreateOrg(user);

    return isOwnerOrAdmin && hasGlobalPermission;
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeOrg]);

  const updateUrlWithOrg = useCallback(
    (orgId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (orgId) {
        params.set("org", orgId);
      } else {
        params.delete("org");
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router]
  );

  const fetchOrganizations = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingOrgs(true);
      const response = await axios.get("/api/orgs/data", {
        params: { userId: user?.id },
      });

      if (response.data.success) {
        const orgs = response.data.data.organizations || [];
        setOrganizations(orgs);

        const orgIdFromUrl = searchParams.get("org");
        if (!activeOrg && !orgIdFromUrl && orgs.length > 0) {
          const currentOrg =
            orgs.find((org: Organization) => org.id === user?.org?.id) ||
            orgs[0];
          if (currentOrg) {
            setActiveOrg(currentOrg);
            updateUrlWithOrg(currentOrg.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      setOrganizations([]);
    } finally {
      setIsLoadingOrgs(false);
    }
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.org?.id, searchParams]);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      const vaultId = user?.vault?.id;

      if (!vaultId) {
        setCurrentPlan("free");
        return;
      }

      try {
        setIsLoadingPlan(true);
        const response = await fetch(`/api/vault/${vaultId}/billing`);
        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.plan || "free");
        } else {
          setCurrentPlan("free");
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
        setCurrentPlan("free");
      } finally {
        setIsLoadingPlan(false);
      }
    };

    if (user?.vault?.id) {
      fetchCurrentPlan();
    }
  }, [user?.vault?.id]);

  useEffect(() => {
    const orgIdFromUrl = searchParams.get("org");
    if (orgIdFromUrl && organizations.length > 0) {
      const orgFromUrl = organizations.find((org) => org.id === orgIdFromUrl);
      if (orgFromUrl && orgFromUrl.id !== activeOrg?.id) {
        setActiveOrg(orgFromUrl);
      }
    } else if (!orgIdFromUrl) {
      setActiveOrg(null);
    }
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, organizations]);

  useEffect(() => {
    if (!user) {
      const timeoutId = setTimeout(() => {
        setShowLoading(true);
        router.replace("/auth/login");
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, router]);

  useEffect(() => {
    if (user && !user.masterPassphraseSetupComplete) {
      router.replace("/setup/master-passphrase");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.id) {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCreateOrg = (): void => {
    if (!canUserCreateOrg) {
      return;
    }
    setIsDialogOpen(true);
  };

  const handleOrgCreated = (): void => {
    fetchOrganizations();
    setIsDialogOpen(false);
  };

  const handleOrgSwitch = (org: Organization): void => {
    setActiveOrg(org);
    updateUrlWithOrg(org.id);

    window.dispatchEvent(
      new CustomEvent("organizationChanged", {
        detail: {
          organization: org,
          orgId: org.id,
          isPersonalWorkspace: false,
        },
      })
    );

    console.log("Switched to organization:", org.name);
  };

  const handlePersonalWorkspace = (): void => {
    setActiveOrg(null);
    updateUrlWithOrg(null);

    window.dispatchEvent(
      new CustomEvent("organizationChanged", {
        detail: {
          organization: null,
          orgId: null,
          isPersonalWorkspace: true,
        },
      })
    );

    console.log("Switched to personal workspace");
  };

  if (!user) {
    if (showLoading) {
      return (
        <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
          <div className="text-xl font-medium text-gray-500">Loading User Data...</div>
        </div>
      );
    }
    return null;
  }

  const hasOrganizations = organizations.length > 0;
  const displayName = activeOrg?.name
    ? `${activeOrg.name}`
    : `${user.name}`;
  const displayPlan = isLoadingPlan
    ? "Loading..."
    : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) + " Plan";
  const isPersonalWorkspace = activeOrg === null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={`
                  transition-all duration-200 ease-in-out border border-transparent
                  data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900 hover:bg-gray-100
                  ${
                    !hasOrganizations && isPersonalWorkspace
                      ? "hover:bg-transparent data-[state=open]:bg-transparent pointer-events-none"
                      : ""
                  }
                `}
              >
                <div
                  className={`flex aspect-square size-8 items-center justify-center rounded-lg border shadow-sm ${
                    activeOrg 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-gray-900">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                    {activeOrg ? activeOrg.role : 'Personal'} 
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                       {currentPlan !== "free" && (
                         <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                       )}
                       {displayPlan}
                    </span>
                  </span>
                </div>
                {isLoadingOrgs ? (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : (
                  <ChevronsUpDown
                    className={`ml-auto text-gray-400 ${
                      hasOrganizations || !isPersonalWorkspace
                        ? "block"
                        : "hidden"
                    }`}
                  />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl bg-white border border-gray-200 text-gray-900 shadow-xl"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-gray-500 text-xs font-bold uppercase tracking-wider px-2 py-1.5">
                Workspaces
              </DropdownMenuLabel>

              {user?.account_type !== "org" && (
                <DropdownMenuItem
                  onClick={handlePersonalWorkspace}
                  className={`gap-2 p-2 cursor-pointer rounded-lg mb-1 outline-none ${
                    isPersonalWorkspace 
                      ? "bg-gray-100 focus:bg-gray-200" 
                      : "focus:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg border shadow-sm ${
                      isPersonalWorkspace 
                        ? "bg-white border-gray-200 text-gray-900" 
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-sm text-gray-900">Personal Workspace</span>
                    <span className="text-xs text-gray-500">Private Vault</span>
                  </div>
                  {isPersonalWorkspace && <Check className="w-4 h-4 text-gray-900" />}
                </DropdownMenuItem>
              )}

              {hasOrganizations && (
                <>
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  <DropdownMenuLabel className="text-gray-500 text-xs font-bold uppercase tracking-wider px-2 py-1.5">
                    Organizations
                  </DropdownMenuLabel>
                </>
              )}

              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrgSwitch(org)}
                  className={`gap-2 p-2 cursor-pointer rounded-lg mb-1 outline-none ${
                    activeOrg?.id === org.id 
                      ? "bg-blue-50 focus:bg-blue-100" 
                      : "focus:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg border shadow-sm ${
                      activeOrg?.id === org.id 
                        ? "bg-blue-600 border-blue-600 text-white" 
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className={`font-semibold text-sm ${activeOrg?.id === org.id ? "text-blue-700" : "text-gray-900"}`}>
                      {org.name}
                    </div>
                    <div className={`text-xs capitalize ${activeOrg?.id === org.id ? "text-blue-600" : "text-gray-500"}`}>
                      {org.role}
                    </div>
                  </div>
                   {activeOrg?.id === org.id && <Check className="w-4 h-4 text-blue-600" />}
                </DropdownMenuItem>
              ))}

              {canUserCreateOrg && (
                <>
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  <DropdownMenuItem
                    onClick={handleCreateOrg}
                    className="gap-2 p-2 text-blue-600 focus:bg-blue-50 focus:text-blue-700 cursor-pointer rounded-lg outline-none"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-blue-200 bg-blue-50">
                      <Plus className="size-3.5" />
                    </div>
                    <div className="font-medium text-sm">
                      Create Organization
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900 sm:max-w-1.6.25 sm:rounded-2xl shadow-2xl p-0 overflow-hidden gap-0">
          <div className="px-6 py-6 border-b border-gray-100 bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                Create Organization
              </DialogTitle>
              <DialogDescription className="text-gray-500 pt-1">
                Establish a new secure workspace for your team.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <CreateOrgForm
              onSuccess={handleOrgCreated}
              onClose={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}