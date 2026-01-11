import { auth } from "./auth";

export const currentUser = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const user = session.user;

    return user || null;
  } catch {
    return null;
  }
};