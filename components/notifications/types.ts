export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "pending";
  expires_at: string;
  invited_by: string;
  created_at: string;
  org: {
    id: string;
    name: string;
    owner_user_id: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}