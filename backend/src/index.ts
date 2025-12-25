import { auth } from "@backend/lib/auth";
import { Elysia } from "elysia";
import "@backend/db/migrate";
import { articles } from "@backend/routes/articles";

const app = new Elysia({
  prefix: "/api",
})
  .mount(auth.handler)
  .use(articles)
  .listen(3001);

console.log(`Server running at ${app.server?.hostname}:${app.server?.port}`);
export type App = typeof app;
