import path from "node:path";
import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/server/db";
import { file } from "@/server/db/schema/blog";
import { env } from "@/server/lib/env";

const parseFileName = (
  originalName: string
): { name: string; extension: string } => {
  // handle special case of files like ".env"
  if (originalName.startsWith(".") && !originalName.includes(".", 1)) {
    return { name: originalName, extension: "" };
  }

  const lastDotIndex = originalName.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { name: originalName, extension: "" };
  }

  return {
    name: originalName.slice(0, lastDotIndex),
    extension: originalName.slice(lastDotIndex + 1),
  };
};

export const uploadFile = async (
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ id: string; url: string }> => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer is empty");
  }

  if (!originalName || originalName.length === 0) {
    throw new Error("File name is required");
  }

  const id = Bun.randomUUIDv7();
  const { name, extension } = parseFileName(originalName);
  const sanitizedName = name
    .replace(/[/\\]/g, "_") // Path traversal
    .replace(/\.\./g, "_") // Path traversal
    // biome-ignore lint/suspicious/noControlCharactersInRegex: this is intentional
    .replace(/[<>:"|?*\x00-\x1F]/g, "_") // Special chars
    .replace(/[\r\n]/g, "_") // Header injection
    .slice(0, 255) // Length limit
    .trim();

  if (sanitizedName.length === 0) {
    throw new Error("Invalid file name");
  }

  const uploadDir = path.join(env.uploadsPath, id.slice(0, 2));
  const fileName = extension ? `${id}.${extension}` : id;
  const filePath = path.join(uploadDir, fileName);

  try {
    await Bun.write(filePath, fileBuffer);
  } catch (error) {
    throw new Error(
      `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  try {
    const [createdFile] = await db
      .insert(file)
      .values({
        id,
        mimeType,
        name: sanitizedName,
        extension: extension || null,
        size: fileBuffer.length,
        uploadedAt: new Date(),
      })
      .returning();

    if (!createdFile) {
      throw new Error("Failed to create file record");
    }

    return {
      id: createdFile.id,
      url: `${env.baseUrl}/uploads/${createdFile.id}/${sanitizedName}${
        extension ? `.${extension}` : ""
      }`,
    };
  } catch (error) {
    await Bun.file(filePath)
      .unlink()
      .catch(() => {
        // ignore errors
      });
    throw new Error(
      `Failed to create file record: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  const [fileRecord] = await db.select().from(file).where(eq(file.id, fileId));

  if (!fileRecord) {
    throw new Error("File not found");
  }

  const uploadDir = path.join(env.uploadsPath, fileRecord.id.slice(0, 2));
  const fileName = fileRecord.extension
    ? `${fileRecord.id}.${fileRecord.extension}`
    : fileRecord.id;
  const filePath = path.join(uploadDir, fileName);

  try {
    await Bun.file(filePath).unlink();
  } catch (error) {
    // ignore file not found errors
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new Error(
        `Failed to delete file from filesystem: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  try {
    await db.delete(file).where(eq(file.id, fileId));
  } catch (error) {
    throw new Error(
      `Failed to delete file record: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getFile = async (
  query: string
): Promise<
  InferSelectModel<typeof file> & {
    name: string;
    file: Bun.BunFile;
  }
> => {
  const fileId = query.includes("/") ? query.split("/")[0] : query;

  if (!fileId || fileId.length === 0) {
    throw new Error("File ID is required");
  }

  const [fileRecord] = await db.select().from(file).where(eq(file.id, fileId));

  if (!fileRecord) {
    throw new Error("File not found");
  }

  const { name, extension } = parseFileName(
    fileRecord.extension
      ? `${fileRecord.name}.${fileRecord.extension}`
      : fileRecord.name
  );

  const uploadDir = path.join(env.uploadsPath, fileRecord.id.slice(0, 2));
  const fileName = fileRecord.extension
    ? `${fileRecord.id}.${fileRecord.extension}`
    : fileRecord.id;
  const filePath = path.join(uploadDir, fileName);
  const fileItem = Bun.file(filePath);

  if (!fileItem.exists()) {
    throw new Error("File not found on filesystem");
  }

  return {
    ...fileRecord,
    name: extension ? `${name}.${extension}` : name,
    file: fileItem,
  };
};
