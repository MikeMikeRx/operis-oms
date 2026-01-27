import type { FastifyRequest, FastifyReply } from "fastify";
import type { PrismaClient } from "../generated/prisma/client.js";

export function requirePerm(perm: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const app = req.server;
    const prisma: PrismaClient = (app as any).prisma;

    const auth = (req as any).auth;

    if (!auth?.tenantId || !auth?.userId) {
      return reply.code(401).send({ error: "unauthorized" });
    }    

    const { tenantId, userId } = (req as any).auth;

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { role: { select: { permissions: true } } },
    });

    if (!user) return reply.code(401).send({ error: "invalid user" });

    const ok = user.role.permissions.includes(perm);
    if (!ok) return reply.code(403).send({ error: "forbidden" });
  };
}
