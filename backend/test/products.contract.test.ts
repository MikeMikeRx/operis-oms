import request from "supertest";
import { prisma } from "../src/db/prisma.js";
import { buildApp } from "../src/app.js";

// const prisma = new PrismaClient();

let app: any;
let tenantId: string;
let userId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  const tenant = await prisma.tenant.create({
    data: { name: "Test tenant" },
  });

  const role = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "owner",
      permissions: ["product:read", "product:write"],
    },
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: role.id,
      email: "test@example.com",
    },
  });

  tenantId = tenant.id;
  userId = user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

it("creates a product", async () => {
  await request(app.server)
    .post("/api/v1/products")
    .set("x-tenant-id", tenantId)
    .set("x-user-id", userId)
    .set("Idempotency-Key", "test-key-12345678")
    .send({ name: "Test", sku: "SKU-1" })
    .expect(201);
});
