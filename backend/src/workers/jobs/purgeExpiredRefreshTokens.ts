import type { PrismaClient } from "../../generated/prisma/client.js";

export async function purgeExpiredRefreshTokens(prisma: PrismaClient) {
  const now = new Date();
  const res = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        // { revokedAt: { not: null } }, 
        // I keep revoked refresh tokens for audit purposes.
      ],
    },
  });
  return { deleted: res.count };
}
