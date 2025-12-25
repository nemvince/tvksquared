/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: is a script, who cares */
import { db } from "@backend/db";
import { user as userTable } from "@backend/db/schema/auth";
import { article, articleTag, comment, tag } from "@backend/db/schema/blog";
import { faker } from "@faker-js/faker";
import type { User } from "better-auth";
import { kebabCase } from "string-ts";

import "@backend/db/migrate";

const TAGS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Vue",
  "Angular",
  "Svelte",
  "Node.js",
  "Bun",
  "Deno",
  "Database",
  "PostgreSQL",
  "MongoDB",
  "Performance",
  "Optimization",
  "Security",
  "Authentication",
  "Testing",
  "DevOps",
  "CI/CD",
  "Docker",
  "Architecture",
  "Design Patterns",
  "API",
  "GraphQL",
  "REST",
  "Tutorial",
  "Guide",
  "Best Practices",
  "Web Development",
  "Frontend",
  "Backend",
  "Full Stack",
];

const createTags = async () => {
  console.log("📌 Creating tags...");

  const tagIds: string[] = [];
  for (const name of TAGS) {
    const id = faker.string.nanoid();
    const slug = kebabCase(name);

    await db
      .insert(tag)
      .values({
        id,
        name,
        slug,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    tagIds.push(id);
  }
  return tagIds;
};

const createArticles = async (user: User, tagIds: string[]) => {
  console.log("📝 Creating articles...");
  const articleIds: string[] = [];
  const articleCount = faker.number.int({ min: 40, max: 60 });

  const titlePrefixes = [
    "Building",
    "Understanding",
    "Mastering",
    "A Deep Dive into",
    "Getting Started with",
    "Advanced",
    "Introduction to",
    "The Complete Guide to",
    "How to",
    "Why You Should Use",
    "Best Practices for",
    "Common Mistakes in",
    "Optimizing",
    "Debugging",
    "Testing",
    "Scaling",
  ];

  const titleTopics = [
    "Microservices Architecture",
    "API Design",
    "Database Optimization",
    "Authentication Systems",
    "Real-time Applications",
    "Serverless Functions",
    "State Management",
    "Performance Monitoring",
    "Code Quality",
    "CI/CD Pipelines",
    "Web Security",
    "Type Safety",
    "Async Programming",
    "Component Design",
    "Data Structures",
    "Algorithm Complexity",
    "Modern JavaScript",
    "Reactive Programming",
    "GraphQL APIs",
    "Docker Containers",
  ];

  for (let i = 0; i < articleCount; i++) {
    const id = faker.string.nanoid();
    const prefix = faker.helpers.arrayElement(titlePrefixes);
    const topic = faker.helpers.arrayElement(titleTopics);
    const title = `${prefix} ${topic}`;
    const slug = kebabCase(title);
    const published = faker.datatype.boolean({ probability: 0.85 });
    const createdAt = faker.date.past({ years: 2 });
    const publishedAt = published
      ? faker.date.between({ from: createdAt, to: new Date() })
      : null;

    const paragraphCount = faker.number.int({ min: 8, max: 20 });
    const contentParagraphs: string[] = [];

    for (let j = 0; j < paragraphCount; j++) {
      const sentenceCount = faker.number.int({ min: 3, max: 8 });
      contentParagraphs.push(faker.lorem.paragraph(sentenceCount));
    }

    const content = contentParagraphs.join("\n\n");
    const excerpt = faker.lorem.sentences(faker.number.int({ min: 2, max: 3 }));

    await db.insert(article).values({
      id,
      title,
      slug,
      content,
      excerpt,
      published,
      publishedAt,
      authorId: user.id,
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    });

    articleIds.push(id);

    const tagCount = faker.number.int({ min: 1, max: 5 });
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

const createComments = async (user: User) => {
  console.log("💬 Creating comments...");
  const commentIds: string[] = [];

  // Only published articles would have comments
  const publishedArticles = await db.query.article.findMany({
    where: { published: true },
    columns: { id: true },
  });

  for (const article of publishedArticles) {
    // Create 2-12 top-level comments per article with varied engagement
    const commentCount = faker.number.int({ min: 2, max: 12 });

    for (let i = 0; i < commentCount; i++) {
      const id = faker.string.nanoid();
      const commentDate = faker.date.past({ years: 1 });

      await db.insert(comment).values({
        id,
        articleId: article.id,
        authorId: user.id,
        parentId: null,
        content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
        deleted: faker.datatype.boolean({ probability: 0.03 }),
        createdAt: commentDate,
        updatedAt: faker.datatype.boolean({ probability: 0.15 })
          ? faker.date.between({ from: commentDate, to: new Date() })
          : commentDate,
      });

      commentIds.push(id);

      // Add 0-4 nested replies to some comments
      if (faker.datatype.boolean({ probability: 0.5 })) {
        const replyCount = faker.number.int({ min: 1, max: 4 });

        for (let j = 0; j < replyCount; j++) {
          const replyId = faker.string.nanoid();
          const replyDate = faker.date.between({
            from: commentDate,
            to: new Date(),
          });

          await db.insert(comment).values({
            id: replyId,
            articleId: article.id,
            authorId: user.id,
            parentId: id,
            content: faker.lorem.sentences(
              faker.number.int({ min: 1, max: 5 })
            ),
            deleted: faker.datatype.boolean({ probability: 0.02 }),
            createdAt: replyDate,
            updatedAt: faker.datatype.boolean({ probability: 0.1 })
              ? faker.date.between({ from: replyDate, to: new Date() })
              : replyDate,
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
  await createArticles(user, tagIds);

  // Create comments
  await createComments(user);

  console.log("✨ Seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
