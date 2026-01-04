import { auth } from "./auth";


export const currentUser = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const user = session.user;

    if (user && user.id) {
    //   updateLastSeen(user.id).catch(error => {
    //     console.error('Error updating last seen:', error);
    //   });
    }

    return user || null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};