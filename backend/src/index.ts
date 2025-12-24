import { auth } from "@backend/lib/auth";
import { Elysia, t } from "elysia";
import "@backend/db/migrate";

const app = new Elysia({
  prefix: "/api",
})
  .mount("/auth", auth.handler)
  .get("/", () => "Hi Elysia")
  .get("/id/:id", ({ params: { id } }) => id)
  .post("/mirror", ({ body }) => body, {
    body: t.Object({
      id: t.Number(),
      name: t.String(),
    }),
  })
  .listen(3001);

console.log(`Server running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
