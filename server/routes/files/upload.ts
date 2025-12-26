import { ORPCError } from "@orpc/client";
import z from "zod";
import { base } from "@/server/context";
import {
  authMiddleware,
  protectMiddleware,
} from "@/server/lib/auth/middleware";
import { uploadFile } from "@/server/lib/files";

export const upload = base
  .use(authMiddleware)
  .use(protectMiddleware)
  .input(z.file())
  .output(
    z.object({
      id: z.string(),
      url: z.string(),
    })
  )
  .handler(async ({ context, input }) => {
    if (context.user.role !== "admin") {
      throw new ORPCError("UNAUTHORIZED");
    }

    const file = input;

    return await uploadFile(
      await file.arrayBuffer().then((buf) => Buffer.from(buf)),
      file.name,
      file.type
    );
  });
