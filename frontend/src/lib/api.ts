import type { router } from "@backend";
import type { InferClientOutputs } from "@orpc/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
});

const client: RouterClient<typeof router> = createORPCClient(link);

export type Outputs = InferClientOutputs<typeof client>;

export const api = createTanstackQueryUtils(client);
