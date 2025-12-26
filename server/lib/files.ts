import fs from "node:fs/promises";
import path from "node:path";
import { randomUUIDv7 } from "bun";
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

  const id = randomUUIDv7();
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
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = extension ? `${id}.${extension}` : id;
  const filePath = path.join(uploadDir, fileName);

  try {
    await fs.writeFile(filePath, fileBuffer);
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
      url: extension
        ? `/uploads/${createdFile.id}.${extension}`
        : `/uploads/${createdFile.id}`,
    };
  } catch (error) {
    await fs.unlink(filePath).catch(() => {
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
    await fs.unlink(filePath);
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
  fileId: string
): Promise<
  InferSelectModel<typeof file> & {
    name: string;
    buffer: Buffer;
  }
> => {
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

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(filePath);
  } catch (error) {
    throw new Error(
      `Failed to read file from filesystem: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return {
    ...fileRecord,
    name: extension ? `${name}.${extension}` : name,
    buffer: fileBuffer,
  };
};
