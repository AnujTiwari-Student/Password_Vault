import { Team } from "@/types/team";

export interface OrganizationMember {
  id: string;
  user_id: string;
  org_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  ovk_wrapped_for_user: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  teams?: Team[];
}

export interface TeamWithMembers extends Team {
  members: OrganizationMember[];
  member_count: number;
}

export interface MembersResponse {
  members: OrganizationMember[];
}

export interface TeamsResponse {
  teams: TeamWithMembers[];
}