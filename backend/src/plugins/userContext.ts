import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

const PUBLIC_PATHS = ["/health", "/docs", "/docs/"];

export default fp(async function (app: FastifyInstance) {
  app.addHook("onRequest", async (req, reply) => {
    if (PUBLIC_PATHS.some((p) => req.url.startsWith(p))) {
      return;
    }

    const userId = req.headers["x-user-id"];
    if (typeof userId !== "string" || userId.length === 0) {
      return reply.code(400).send({
        error: "x-user-id header is required (temporary until auth is added)",
      });
    }
    req.userId = userId;
    req.log = req.log.child({ userId });
  });
});
