import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { runTask } from "nitro/task";
import { auth } from "@/server/lib/auth";
import { articles } from "@/server/routes/articles";
import { tags } from "@/server/routes/tags";

const { result } = await runTask("migrate");

if (result !== "ok") {
  throw new Error("Database migration failed");
}

export const router = {
  articles,
  tags,
};

const rpcHandler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError) {
        console.error(`RPC Error: [${error.code}] ${error.message}`);
      } else {
        console.error("Unexpected Error:", error);
      }
    }),
  ],
});

export default {
  // biome-ignore lint/suspicious/noConfusingVoidType: it's to shut TS up
  async fetch(req: Request): Promise<Response | void> {
    const rpc = await rpcHandler.handle(req, {
      prefix: "/api/rpc",
      context: {
        headers: req.headers,
      },
    });

    if (rpc.matched) {
      return rpc.response;
    }

    const authResponse = await auth.handler(req);

    if (authResponse.status !== 404) {
      return authResponse;
    }
  },
};
