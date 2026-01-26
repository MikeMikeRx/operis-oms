import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export default fp(async function (app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "OPERIS OSM API",
        description: "Backend-first Operations Management API",
        version: "v1",
      },
      // servers: [],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });
});
