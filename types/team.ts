export interface Team {
  id: string;
  name: string;
  description?: string;
  org_id: string;
  vault_id: string;
  created_at: string;
  member_count: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  added_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  invited_by: string;
  invited_at: string;
  expires_at: string;
}
