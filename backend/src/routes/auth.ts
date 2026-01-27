import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { z } from "zod";

const LoginBody = z.object({
  tenantId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const REFRESH_COOKIE = "refreshToken";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function newRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function refreshExpiresAt() {
  const days = Number(process.env.REFRESH_EXPIRES_DAYS ?? "14");
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function setRefreshCookie(reply: any, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

function clearRefreshCookie(reply: any) {
  reply.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}

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

      const refreshToken = newRefreshToken();
      const tokenHash = sha256(refreshToken);

      await app.prisma.refreshToken.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          tokenHash,
          expiresAt: refreshExpiresAt(),
        },
      });

      setRefreshCookie(reply, refreshToken)
      return reply.send({ accessToken });
    }
  );

  app.post("/auth/refresh", async (req, reply) => {
    const token = (req.cookies as any)?.[REFRESH_COOKIE];
    if(!token) return reply.code(401).send({ error: "unauthorized "});

    const tokenHash = sha256(token);

    const existing = await app.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    await app.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const user = await app.prisma.user.findUnique({
      where: { id: existing.userId },
      select: { id: true, tenantId: true, roleId: true },
    });

    if(!user || user.tenantId !== existing.tenantId) {
      return reply.code(401).send({ error: "Unauthorized !" });
    }
    const newRt = newRefreshToken();
    const newHash = sha256(newRt);

    await app.prisma.refreshToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: newHash,
        expiresAt: refreshExpiresAt(),
      },
    });

    const accessToken = await reply.jwtSign({
      tenantId: user.tenantId,
      userId: user.id,
      roleId: user.roleId,
    });

    setRefreshCookie(reply, newRt);
    return reply.send({ accessToken });
  });

  app.post("/auth/logout", async (req, reply) => {
    const token = (req.cookies as any)?.[REFRESH_COOKIE];

    if (token) {
      const tokenHash = sha256(token);
      await app.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearRefreshCookie(reply);
    return reply.code(204).send();
  });
}
