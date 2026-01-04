import { useSession } from "next-auth/react";
import { SessionUser } from "@/types/session";

export const useUser = (): SessionUser | null => {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session?.user?.id) return null;

  return session.user as SessionUser;
};
