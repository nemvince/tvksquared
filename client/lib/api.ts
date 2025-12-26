import type { InferClientOutputs } from "@orpc/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { router } from "@/server/server";

const link = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
});

export const rawApi: RouterClient<typeof router> = createORPCClient(link);

export type Outputs = InferClientOutputs<typeof rawApi>;

export const api = createTanstackQueryUtils(rawApi);
