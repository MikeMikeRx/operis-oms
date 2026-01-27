import request from "supertest";
import bcrypt from "bcrypt";
import { prisma } from "../src/db/prisma.js";
import { buildApp } from "../src/app.js";

let app: any;
let tenantId: string;
let token: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  const password = "password123"
  const passwordHash = await bcrypt.hash(password, 12);

  const tenant = await prisma.tenant.create({
    data: { name: "Test tenant" },
  });

  const role = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "TEST",
      permissions: ["product:read", "product:write", "audit:read"],
    },
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: role.id,
      email: "test@example.com",
      passwordHash,
    },
  });

  tenantId = tenant.id;
  
  const loginRes = await request(app.server)
    .post("/api/v1/auth/login")
    .set("Idempotency-Key", "login-test-1")
    .send({ tenantId, email: "test@example.com", password })
    .expect(200);

    token = loginRes.body.accessToken;
    if(!token) throw new Error("Login did not return a token !")
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

it("creates a product", async () => {
  await request(app.server)
    .post("/api/v1/products")
    .set("Authorization", `Bearer ${token}`)
    .set("Idempotency-Key", "test-key-123")
    .send({ name: "Test", sku: "SKU-1" })
    .expect(201);
});
