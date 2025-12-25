import type { router } from "@backend";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import {
  createTanstackQueryUtils
} from '@orpc/tanstack-query';

const link = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
});

const client: RouterClient<typeof router> = createORPCClient(link);

export const api = createTanstackQueryUtils(client);
