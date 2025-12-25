import "@backend/db/migrate";
import { auth } from "@backend/lib/auth";
import { articles } from "@backend/routes/articles";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { serve } from "bun";
import { padEnd } from "string-ts";

export const router = {
  articles,
};

const rpcHandler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
});

const logRequest = (req: Request, res: Response, meta: {
  handler: string;
}) => {
  console.log(`${padEnd(req.method, 6)}${padEnd(res.status.toString(), 4)} ${padEnd(meta.handler, 10)} ${req.url}`);
}

const server = serve({
  port: 3001,
  async fetch(req: Request) {
    const rpc = await rpcHandler.handle(req, {
      prefix: "/api/rpc",
      context: {
        headers: req.headers,
      },
    });

    if (rpc.matched) {
      logRequest(req, rpc.response, { handler: "rpc" });
      return rpc.response;
    }

    const authResponse = await auth.handler(req);

    if (authResponse.status !== 404) {
      logRequest(req, authResponse, { handler: "auth" });
      return authResponse;
    }

    const res = new Response(
      JSON.stringify({
        message: "Not Found",
      }),
      { status: 404 }
    );
    logRequest(req, res, { handler: "not-found" });
    return res;
  },
});

console.log(`Server running at ${server.hostname}:${server.port}`);
