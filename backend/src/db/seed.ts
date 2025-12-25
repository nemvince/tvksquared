import { db } from "@backend/db";
import { user as userTable } from "@backend/db/schema/auth";
import { article, articleTag, comment, tag } from "@backend/db/schema/blog";
import { faker } from "@faker-js/faker";
import type { User } from "better-auth";
import { kebabCase } from "string-ts";

import "@backend/db/migrate";

const TAGS = [
  "TypeScript",
  "React",
  "Node.js",
  "Database",
  "Performance",
  "Security",
  "Testing",
  "DevOps",
  "Architecture",
  "Tutorial",
];

const createTags = async () => {
  console.log("📌 Creating tags...");

  const tagIds: string[] = [];
  for (const name of TAGS) {
    const id = faker.string.nanoid();
    const slug = kebabCase(name);

    await db.insert(tag).values({
      id,
      name,
      slug,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    tagIds.push(id);
  }
  return tagIds;
};

const createArticles = async (user: User, tagIds: string[]) => {
  console.log("📝 Creating articles...");
  const articleIds: string[] = [];
  const articleCount = 15;

  for (let i = 0; i < articleCount; i++) {
    const id = faker.string.nanoid();
    const title = faker.lorem.sentence({ min: 3, max: 8 });
    const slug = kebabCase(title.replace(/[^\w\s-]/g, ""));
    const published = faker.datatype.boolean({ probability: 0.6 });
    const createdAt = faker.date.past({ years: 1 });
    const publishedAt = published
      ? faker.date.between({ from: createdAt, to: new Date() })
      : null;

    await db.insert(article).values({
      id,
      title,
      slug,
      content: faker.lorem.paragraphs({ min: 5, max: 15 }, ""),
      excerpt: faker.lorem.paragraph(),
      published,
      publishedAt,
      authorId: user.id,
      createdAt,
      updatedAt: new Date(),
    });

    articleIds.push(id);

    const tagCount = faker.number.int({ min: 2, max: 4 });
    const selectedTags = faker.helpers.arrayElements(tagIds, tagCount);

    for (const tagId of selectedTags) {
      await db.insert(articleTag).values({
        articleId: id,
        tagId,
        createdAt: new Date(),
      });
    }
  }
  return articleIds;
};

const createComments = async (user: User, articleIds: string[]) => {
  console.log("💬 Creating comments...");
  const commentIds: string[] = [];

  for (const articleId of articleIds) {
    // Create 3-8 top-level comments per article
    const commentCount = faker.number.int({ min: 3, max: 8 });

    for (let i = 0; i < commentCount; i++) {
      const id = faker.string.nanoid();

      await db.insert(comment).values({
        id,
        articleId,
        authorId: user.id,
        parentId: null,
        content: faker.lorem.paragraph(),
        deleted: faker.datatype.boolean({ probability: 0.05 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      });

      commentIds.push(id);

      // Add 0-3 nested replies to some comments
      if (faker.datatype.boolean({ probability: 0.4 })) {
        const replyCount = faker.number.int({ min: 1, max: 3 });

        for (let j = 0; j < replyCount; j++) {
          const replyId = faker.string.nanoid();

          await db.insert(comment).values({
            id: replyId,
            articleId,
            authorId: user.id,
            parentId: id,
            content: faker.lorem.paragraph(),
            deleted: faker.datatype.boolean({ probability: 0.05 }),
            createdAt: faker.date.past({ years: 1 }),
            updatedAt: new Date(),
          });

          commentIds.push(replyId);
        }
      }
    }
  }
  return commentIds;
};

async function seed() {
  console.log("🌱 Starting seed process...");

  // Check if users exist
  const [user] = await db.select().from(userTable).limit(1);
  if (!user) {
    throw new Error(
      "No users found in the database. Please create at least one user before running the seed script."
    );
  }
  console.log(`✅ Found user: ${user.name} (${user.id})`);

  // Create tags
  const tagIds = await createTags();

  // Create articles
  const articleIds = await createArticles(user, tagIds);

  // Create comments
  await createComments(user, articleIds);

  console.log("✨ Seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
