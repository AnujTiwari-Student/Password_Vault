"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ChevronsUpDown, Plus, Building2, Crown } from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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

  const fetchVaultForOrg = useCallback(async (orgId: string) => {
    try {
      const response = await axios.get(`/api/org/${orgId}/vault`);
      if (response.data.success && response.data.vault) {
        return response.data.vault.id;
      }
    } catch (error) {
      console.error("Failed to fetch org vault:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      let vaultId = null;

      if (activeOrg?.id) {
        vaultId = await fetchVaultForOrg(activeOrg.id);
      } else if (user?.vault?.id) {
        vaultId = user.vault.id;
      }

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

    fetchCurrentPlan();
  }, [user?.vault?.id, activeOrg?.id, fetchVaultForOrg]);

  // Sync activeOrg with URL - removed activeOrg from dependencies to prevent infinite loop
  useEffect(() => {
    const orgIdFromUrl = searchParams.get("org");
    if (orgIdFromUrl && organizations.length > 0) {
      const orgFromUrl = organizations.find((org) => org.id === orgIdFromUrl);
      if (orgFromUrl && orgFromUrl.id !== activeOrg?.id) {
        setActiveOrg(orgFromUrl);
      }
    } else if (!orgIdFromUrl) {
      // Only set to null if URL has no org param
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
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-xl">Loading User Data...</div>
        </div>
      );
    }
    return null;
  }

  const hasOrganizations = organizations.length > 0;
  const displayName = activeOrg?.name
    ? `${activeOrg.name}`
    : `${user.name} (Personal Workspace)`;
  const displayPlan = isLoadingPlan
    ? "Loading..."
    : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) + " Plan";
  const isPersonalWorkspace = activeOrg === null;

  return (
    <>
      <SidebarMenu className="bg-gray-900 text-white">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={`
                  transition-colors duration-150 ease-in-out
                  data-[state=open]:bg-gray-800 data-[state=open]:text-white hover:bg-gray-800
                  ${
                    !hasOrganizations && isPersonalWorkspace
                      ? "hover:bg-transparent data-[state=open]:bg-transparent"
                      : "data-[state=open]:bg-transparent"
                  }
                `}
              >
                <div
                  className={`${
                    activeOrg ? "bg-blue-600" : "bg-gray-600"
                  } text-white flex aspect-square size-8 items-center justify-center rounded-lg`}
                >
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-white">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-gray-400 flex items-center gap-1">
                    {activeOrg && `${activeOrg.role} • `}
                    {currentPlan !== "free" && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                    {displayPlan}
                  </span>
                </div>
                {isLoadingOrgs ? (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
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
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg bg-gray-800 border border-gray-700 text-white"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-gray-400 text-xs">
                Workspaces
              </DropdownMenuLabel>

              {user?.account_type !== "org" && (
                <DropdownMenuItem
                  onClick={handlePersonalWorkspace}
                  className={`gap-2 p-2 text-white hover:bg-gray-700 focus:bg-gray-700 ${
                    isPersonalWorkspace ? "bg-gray-700/50" : ""
                  }`}
                >
                  <div
                    className={`flex size-6 items-center justify-center rounded-md border border-gray-600 ${
                      isPersonalWorkspace ? "bg-gray-600" : "bg-gray-900"
                    }`}
                  >
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  <div className="text-white hover:text-white font-medium">
                    Personal Workspace
                  </div>
                  <DropdownMenuShortcut className="text-gray-400">
                    ⌘1
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              )}

              {hasOrganizations && (
                <>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuLabel className="text-gray-400 text-xs">
                    Organizations
                  </DropdownMenuLabel>
                </>
              )}

              {organizations.map((org, index) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrgSwitch(org)}
                  className={`gap-2 p-2 text-white hover:bg-gray-700 focus:bg-gray-700 ${
                    activeOrg?.id === org.id ? "bg-gray-700/50" : ""
                  }`}
                >
                  <div
                    className={`flex size-6 items-center justify-center rounded-md border border-gray-600 ${
                      activeOrg?.id === org.id ? "bg-blue-600" : "bg-gray-900"
                    }`}
                  >
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="text-white hover:text-white font-medium">
                      {org.name}
                    </div>
                    <div className="text-xs text-gray-400">{org.role}</div>
                  </div>
                  <DropdownMenuShortcut className="text-gray-400">
                    ⌘{index + 2}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}

              {/* Only show Create Organization button when user has permission */}
              {canUserCreateOrg && (
                <>
                  <DropdownMenuSeparator className="bg-gray-700" />

                  <DropdownMenuItem
                    onClick={handleCreateOrg}
                    className="gap-2 p-2 text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border border-gray-600 bg-transparent">
                      <Plus className="size-4" />
                    </div>
                    <div className="text-blue-400 font-medium">
                      Create organization
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Create Organization
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new organization with its own vault to collaborate with
              your team.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
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
