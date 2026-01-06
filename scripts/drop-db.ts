import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function dropDatabase() {
  try {
    console.log("Dropping all collections...");

    // Delete all data from all models
    await prisma.subscription.deleteMany({});
    await prisma.logs.deleteMany({});
    await prisma.audit.deleteMany({});
    await prisma.share.deleteMany({});
    await prisma.item.deleteMany({});
    await prisma.invite.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.vault.deleteMany({});
    await prisma.membership.deleteMany({});
    await prisma.org.deleteMany({});
    await prisma.orgVaultKey.deleteMany({});
    await prisma.personalVaultKey.deleteMany({});
    await prisma.planConfiguration.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ All data deleted successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

dropDatabase();
