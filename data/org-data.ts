import { prisma } from "@/db";
import { getUserById } from "./users-data";




export const getOrgById = async (id: string) => {
    const user = getUserById(id);

    if (!user) {
        return null;
    }

    const org = await prisma.org.findFirst({
        where: { owner_user_id: id }
    });

    return org;

}