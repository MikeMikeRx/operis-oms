import Fastify from "fastify";
import requestContextPlugin from "./plugins/requestContext.js";
import swaggerPlugin from "./plugins/swagger.js";

const app = Fastify({
  logger: {
    level: "info",
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
  },
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

// Register plugins before routes
await app.register(requestContextPlugin);
await app.register(swaggerPlugin);

// Routes
app.get("/health", {
  schema: {
    description: "Health check",
    tags: ["system"],
    response: {
      200: {
        type: "object",
        required: ["ok"],
        properties: {
          ok: { type: "boolean" },
        },
      },
    },
  },
}, async () => ({ ok: true }));

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
