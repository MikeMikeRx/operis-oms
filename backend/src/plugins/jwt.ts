import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";

export default fp(async function (app: FastifyInstance) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" },
  });
});
