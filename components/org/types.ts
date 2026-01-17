import { Team } from "@/types/team";

export interface OrganizationMember {
  id: string;
  user_id: string;
  org_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string | Date;
  ovk_wrapped_for_user?: string;
  org_name?: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  org?: {
    id: string;
    name: string;
    owner_user_id: string;
  };
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