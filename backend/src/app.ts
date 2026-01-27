import Fastify from "fastify";

// Plugins
import requestContextPlugin from "./plugins/requestContext.js";
import idempotencyPlugin from "./plugins/idempotency.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import swaggerPlugin from "./plugins/swagger.js";
import dbPlugin from "./plugins/db.js";
import jwtPlugin from "./plugins/jwt.js";

// Routes
import { productsRoutes } from "./routes/products.js";
import { authRoutes } from "./routes/auth.js";

// App factory for server and tests
export function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  // --- Core plugins ---
  app.register(requestContextPlugin); // request ID, base logger
  app.register(dbPlugin);             // Prisma client

  // --- Security & protection ---
  app.register(rateLimitPlugin);      // per-tenant rate limits
  app.register(idempotencyPlugin);    // safe write retries
  app.register(jwtPlugin);

  // --- Documentation ---
  app.register(swaggerPlugin);        // OpenAPI docs at /docs

  // --- Business routes ---
  app.register(productsRoutes, { prefix: "/api/v1" });
  app.register(authRoutes);

  // --- System routes ---
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: { ok: { type: "boolean" } },
            required: ["ok"],
          },
        },
      },
    },
    async () => ({ ok: true }),
  );

  app.get(
    "/api/v1/meta", async () => ({
      version: "v1",
      commit: process.env.GIT_COMMIT ?? "unknown",
      builtAt: process.env.BUILD_TIME ?? "unknown",
    })
  );

  return app;
}
