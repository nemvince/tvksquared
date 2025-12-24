// client.ts

import type { App } from "@backend";
import { treaty } from "@elysiajs/eden";

export const client = treaty<App>(`${window.location.origin}/api`);
