import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/requireAuth.js";

export default fp(async function apiAuthGuard(app: FastifyInstance) {
  app.addHook("onRequest", async (req, reply) => {
    const path = req.url.split("?")[0];

    if (!path.startsWith("/api/v1/")) return;
    if (path.startsWith("/api/v1/auth/") || path === "/api/v1/auth") return;
    if (path === "/health") return;
    if (path.startsWith("/docs")) return;

    return requireAuth(req, reply);
  });
});
