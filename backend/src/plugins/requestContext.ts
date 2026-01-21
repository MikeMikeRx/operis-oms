import fp from "fastify-plugin";
import requestContext from "@fastify/request-context";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";

declare module "@fastify/request-context" {
    interface RequestContextData {
        requestId: string;
    }
}

export default fp(async function (app: FastifyInstance) {
    await app.register(requestContext, {
        hook: "onRequest",
        defaultStoreValues: (req) => {
            const existing = req.headers["x-request-id"];
            const requestId =
                typeof existing === "string" && existing.length > 0
                    ? existing
                    : crypto.randomUUID();

            return { requestId };
        },
    });

    app.addHook("onRequest", async (req, reply) => {
        const requestId = req.requestContext.get("requestId") ?? crypto.randomUUID();
        reply.header("x-request-id", requestId);

        // Attach to every log line automatically
        // TODO: add tenantId/userId once auth exists
        req.log = req.log.child({ requestId });
    });
});