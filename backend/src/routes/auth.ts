import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

const LoginBody = z.object({
  tenantId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["auth"],
        body: {
          type: "object",
          required: ["tenantId", "email", "password"],
          properties: {
            tenantId: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["accessToken"],
            properties: { accessToken: { type: "string" } },
          },
          401: {
            type: "object",
            required: ["error"],
            properties: { error: { type: "string" } },
          },
          422: {
            type: "object",
            required: ["error"],
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (req, reply) => {
      const parsed = LoginBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(422).send({ error: "Invalid Request !" });
      }

      const { tenantId, email, password } = parsed.data;

      const user = await app.prisma.user.findFirst({
        where: { tenantId, email },
        select: { id: true, tenantId: true, roleId: true, passwordHash: true },
      });

      if (!user) return reply.code(401).send({ error: "Invalid Credentials !" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return reply.code(401).send({ error: "Invalid Credentials !" });

      const accessToken = await reply.jwtSign({
        userId: user.id,
        tenantId: user.tenantId,
        roleId: user.roleId,
      });

      return reply.send({ accessToken });
    }
  );
}
