import type { FastifyRequest, FastifyReply } from "fastify";

export function requirePerm(perm: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const { prisma } = req.server;
    const { auth } = req;

    if (!auth?.tenantId || !auth?.userId) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const { tenantId, userId } = auth;

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { role: { select: { permissions: true } } },
    });

    if (!user) return reply.code(401).send({ error: "invalid user" });

    const ok = user.role.permissions.includes(perm);
    if (!ok) return reply.code(403).send({ error: "forbidden" });
  };
}
