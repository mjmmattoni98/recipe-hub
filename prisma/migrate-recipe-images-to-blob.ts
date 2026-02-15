import { PrismaPg } from "@prisma/adapter-pg";
import { list } from "@vercel/blob";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const isHttpUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const getBlobListOptions = (cursor?: string) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    return { cursor, token };
  }

  return { cursor };
};

const extractFilename = (value: string) => {
  const source = value.trim();
  if (!source) {
    return null;
  }

  const path = isHttpUrl(source)
    ? (() => {
        try {
          return new URL(source).pathname;
        } catch {
          return "";
        }
      })()
    : source;

  const segments = path.split("/").filter(Boolean);
  return segments.at(-1) ?? null;
};

async function getBlobImagesByFilename() {
  const byFilename = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const page = await list(getBlobListOptions(cursor));

    for (const blob of page.blobs) {
      const segments = blob.pathname.split("/").filter(Boolean);
      const filename = segments.at(-1);

      if (filename && !byFilename.has(filename)) {
        byFilename.set(filename, blob.url);
      }
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return byFilename;
}

async function main() {
  console.log("Migrating recipe image paths to Vercel Blob URLs...");

  const blobImagesByFilename = await getBlobImagesByFilename();
  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      title: true,
      image: true,
    },
  });

  let updated = 0;
  let alreadyUpToDate = 0;
  const missing: string[] = [];

  for (const recipe of recipes) {
    const filename = extractFilename(recipe.image);

    if (!filename) {
      missing.push(`${recipe.title}: invalid image value`);
      continue;
    }

    const blobUrl = blobImagesByFilename.get(filename);
    if (!blobUrl) {
      missing.push(`${recipe.title}: ${filename}`);
      continue;
    }

    if (recipe.image === blobUrl) {
      alreadyUpToDate += 1;
      continue;
    }

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { image: blobUrl },
    });
    updated += 1;
  }

  console.log(`Updated: ${updated}`);
  console.log(`Already up-to-date: ${alreadyUpToDate}`);

  if (missing.length > 0) {
    console.log(`Missing images: ${missing.length}`);
    for (const entry of missing) {
      console.log(` - ${entry}`);
    }

    throw new Error("Some recipes could not be mapped to Vercel Blob URLs.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
