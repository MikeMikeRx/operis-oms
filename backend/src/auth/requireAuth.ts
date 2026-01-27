import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    auth: { tenantId: string; userId: string; roleId: string };
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await (req as any).jwtVerify();
  } catch {
    return reply.code(401).send({ error: "unauthorized" });
  }

  const u = (req as any).user as any;
  if (!u?.tenantId || !u?.userId || !u?.roleId) {
    return reply.code(401).send({ error: "unauthorized" });
  }

  req.auth = { tenantId: u.tenantId, userId: u.userId, roleId: u.roleId };
  req.log = req.log.child({ tenantId: u.tenantId, userId: u.userId });
}
