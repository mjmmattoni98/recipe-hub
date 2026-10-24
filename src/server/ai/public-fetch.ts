import "server-only";

import { lookup } from "node:dns/promises";

import {
  hostMatches,
  isBlockedHostname,
  isPrivateAddress,
} from "@/server/ai/public-url";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

type FetchTextOptions = {
  allowedHostSuffixes?: string[];
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  accept?: string;
};

export class PublicFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicFetchError";
  }
}

const hostIsAllowed = (hostname: string, suffixes: string[] | undefined) => {
  if (isBlockedHostname(hostname)) {
    return false;
  }

  if (!suffixes) {
    return true;
  }

  return hostMatches(hostname, suffixes);
};

const assertPublicUrl = async (url: URL, suffixes: string[] | undefined) => {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new PublicFetchError("No se ha podido abrir el enlace.");
  }

  if (!hostIsAllowed(url.hostname, suffixes)) {
    throw new PublicFetchError("No se ha podido abrir el enlace.");
  }

  const addresses = await lookup(url.hostname, { all: true });
  if (
    addresses.length === 0 ||
    addresses.some((entry) => isPrivateAddress(entry.address))
  ) {
    throw new PublicFetchError("No se ha podido abrir el enlace.");
  }
};

const readLimited = async (response: Response, maxBytes: number) => {
  const reader = response.body?.getReader();
  if (!reader) {
    return new Uint8Array();
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new PublicFetchError("La página es demasiado grande.");
    }

    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
};

export const fetchPublicText = async (
  startUrl: string,
  options: FetchTextOptions = {},
) => {
  const maxBytes = options.maxBytes ?? 2_000_000;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxRedirects = options.maxRedirects ?? 4;
  let current = startUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      throw new PublicFetchError("No se ha podido abrir el enlace.");
    }

    await assertPublicUrl(url, options.allowedHostSuffixes);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        headers: {
          Accept:
            options.accept ?? "text/html,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "es,en;q=0.8",
          "User-Agent": BROWSER_USER_AGENT,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof PublicFetchError) {
        throw error;
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        throw new PublicFetchError("El enlace ha tardado demasiado.");
      }

      throw new PublicFetchError("No se ha podido abrir el enlace.");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new PublicFetchError("No se ha podido abrir el enlace.");
      }

      current = new URL(location, url).toString();
      continue;
    }

    if (response.status === 404) {
      throw new PublicFetchError("No se ha encontrado esa publicación.");
    }

    if (response.status === 429) {
      throw new PublicFetchError(
        "La plataforma ha limitado la lectura. Espera un poco e inténtalo de nuevo.",
      );
    }

    if (!response.ok) {
      throw new PublicFetchError("No se ha podido abrir el enlace.");
    }

    const body = await readLimited(response, maxBytes);
    return {
      finalUrl: url.toString(),
      text: new TextDecoder().decode(body),
      bytes: body,
      contentType: response.headers.get("content-type") ?? "",
    };
  }

  throw new PublicFetchError("No se ha podido abrir el enlace.");
};

const IMAGE_HOST_SUFFIXES = [
  "ytimg.com",
  "ggpht.com",
  "googleusercontent.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokcdn-eu.com",
  "ibyteimg.com",
  "muscdn.com",
  "cdninstagram.com",
  "fbcdn.net",
];

export const fetchPublicImage = async (imageUrl: string) => {
  const result = await fetchPublicText(imageUrl, {
    allowedHostSuffixes: IMAGE_HOST_SUFFIXES,
    maxBytes: 8_000_000,
    timeoutMs: 8_000,
    maxRedirects: 3,
    accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  });
  const type = result.contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const sniffed = sniffImage(result.bytes);

  if (!type.startsWith("image/") && !sniffed) {
    throw new PublicFetchError("La imagen del enlace no es válida.");
  }

  return {
    bytes: Buffer.from(result.bytes),
    contentType: sniffed ?? type,
  };
};

const sniffImage = (bytes: Uint8Array) => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return "image/png";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45
  ) {
    return "image/webp";
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }

  return null;
};
