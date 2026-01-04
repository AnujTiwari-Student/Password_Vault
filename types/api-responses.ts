export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: {
    _form?: string[];
    [key: string]: string[] | undefined;
  };
}

export interface CreateTeamResponse {
  team: {
    id: string;
    name: string;
    description: string;
    org_id: string;
    vault_id: string;
    created_at: string;
    member_count: number;
  };
}

export interface InviteResponse {
  invitation: {
    id: string;
    team_id: string;
    email: string;
    role: 'member' | 'admin';
    status: 'pending';
    invited_by: string;
    invited_at: string;
    expires_at: string;
  };
}
