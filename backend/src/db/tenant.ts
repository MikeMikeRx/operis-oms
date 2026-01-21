import { type PrismaClient, Prisma } from "@prisma/client";

export function tenantDb(prisma: PrismaClient, tenantId: string) {
  return {
    product: {
      findMany: (args?: Prisma.ProductFindManyArgs) =>
        prisma.product.findMany({
          ...args,
          where: { ...args?.where, tenantId, deletedAt: null },
        }),
      findUniqueBySku: (sku: string) =>
        prisma.product.findUnique({ where: { tenantId_sku: { tenantId, sku } } }),
      create: (data: Omit<Prisma.ProductUncheckedCreateInput, "tenantId">) =>
        prisma.product.create({ data: { ...data, tenantId } }),
    },
    // will expand this object per model over time
  };
}
