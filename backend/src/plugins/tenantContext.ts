import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId: string;
  }
}

const PUBLIC_PATHS = ["/health", "/docs", "/docs/"];

export default fp(async function (app: FastifyInstance) {
  app.addHook("onRequest", async (req, reply) => {
    // Skip tenant check for public paths
    if (PUBLIC_PATHS.some((p) => req.url.startsWith(p))) {
      return;
    }

    const tenantId = req.headers["x-tenant-id"];
    if (typeof tenantId !== "string" || tenantId.length === 0) {
      return reply.code(400).send({
        error: "x-tenant-id header is required (temporary until auth is added)",
      });
    }
    req.tenantId = tenantId;
    req.log = req.log.child({ tenantId });
  });
});
