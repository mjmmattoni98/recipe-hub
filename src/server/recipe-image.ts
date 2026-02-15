import "server-only";

import { env } from "@/env";
import { list } from "@vercel/blob";

type BlobIndex = {
  byPath: Map<string, string>;
  byFilename: Map<string, string>;
};

const BLOB_INDEX_CACHE_TTL_MS = 5 * 60 * 1000;
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

let cachedBlobIndex: BlobIndex | null = null;
let blobIndexFetchedAt = 0;

const isHttpUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const isVercelBlobUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
};

const normalizePath = (value: string) => value.trim().replace(/^\/+/, "");

const getLookupKeys = (
  image: string,
): {
  normalizedPath: string;
  filename: string;
} | null => {
  const rawValue = image.trim();
  if (!rawValue) {
    return null;
  }

  const pathFromInput = isHttpUrl(rawValue)
    ? (() => {
        try {
          return new URL(rawValue).pathname;
        } catch {
          return "";
        }
      })()
    : rawValue;

  const normalizedPath = normalizePath(pathFromInput);
  if (!normalizedPath) {
    return null;
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const filename = segments.at(-1);

  if (!filename) {
    return null;
  }

  return { normalizedPath, filename };
};

const getBlobListOptions = (cursor?: string) => {
  const token = env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    return { cursor, token };
  }

  return { cursor };
};

async function getBlobIndex() {
  const now = Date.now();
  const isFresh =
    cachedBlobIndex !== null &&
    now - blobIndexFetchedAt < BLOB_INDEX_CACHE_TTL_MS;

  if (isFresh && cachedBlobIndex) {
    return cachedBlobIndex;
  }

  const byPath = new Map<string, string>();
  const byFilename = new Map<string, string>();

  let cursor: string | undefined;

  do {
    const page = await list(getBlobListOptions(cursor));

    for (const blob of page.blobs) {
      const normalizedPath = normalizePath(blob.pathname);

      byPath.set(normalizedPath, blob.url);
      byPath.set(`/${normalizedPath}`, blob.url);

      const segments = normalizedPath.split("/").filter(Boolean);
      const filename = segments.at(-1);

      if (filename && !byFilename.has(filename)) {
        byFilename.set(filename, blob.url);
      }
    }

    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  cachedBlobIndex = {
    byPath,
    byFilename,
  };
  blobIndexFetchedAt = now;

  return cachedBlobIndex;
}

export async function resolveRecipeImageUrl(image: string): Promise<string> {
  const value = image.trim();

  if (!value) {
    throw new Error("Image is required.");
  }

  if (isHttpUrl(value)) {
    if (isVercelBlobUrl(value)) {
      return value;
    }

    throw new Error("Image URL must come from Vercel Blob storage.");
  }

  const keys = getLookupKeys(value);
  if (!keys) {
    throw new Error("Image is required.");
  }

  const { byPath, byFilename } = await getBlobIndex();

  const blobUrl =
    byPath.get(keys.normalizedPath) ??
    byPath.get(`recipes/${keys.filename}`) ??
    byFilename.get(keys.filename);

  if (blobUrl) {
    return blobUrl;
  }

  throw new Error("Image not found in Vercel Blob storage.");
}
