import { prisma } from "@/db";


export const getUserByEmail = async (email: string) => {
    const user = await prisma.user.findFirst({
        where: { email }
    });
    return user;
}

export async function getUserByEmailWithAccounts(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
            type: true,
          }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("Error fetching user by email with accounts:", error);
    return null;
  }
}

export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id }
    });
}

export const updateUser = async (id: string) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email_verified: new Date(),
        twofa_enabled: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
};
