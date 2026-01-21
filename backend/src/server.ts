import Fastify from "fastify";
import requestContextPlugin from "./plugins/requestContext.js";

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

// Routes
app.get("/health", async () => ({ ok: true }));

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
