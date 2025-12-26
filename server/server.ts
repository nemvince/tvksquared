import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { runTask } from "nitro/task";
import { auth } from "@/server/lib/auth";
import { getFile } from "@/server/lib/files";
import { articles } from "@/server/routes/articles";
import { files } from "@/server/routes/files";
import { tags } from "@/server/routes/tags";

const { result } = await runTask("migrate");

if (result !== "ok") {
  throw new Error("Database migration failed");
}

export const router = {
  articles,
  tags,
  files,
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

    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname.startsWith("/uploads/")) {
      const file = await getFile(url.pathname.replace("/uploads/", ""));
      if (file) {
        return new Response(file.file.stream(), {
          status: 200,
          headers: {
            "Content-Type": file.mimeType,
            "Content-Disposition": `inline; filename="${file.name}"`,
          },
        });
      }
      // no need to return 404 here, let frontend handle it
    }
  },
};
