const PRIVATE_HOST =
  /^(localhost|.*\.localhost|.*\.local|metadata\.google\.internal|metadata\.internal)$/i;

export const hostMatches = (hostname: string, suffixes: string[]) => {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return suffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
};

export const isPrivateAddress = (address: string) => {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");

  if (normalized === "::1" || normalized.startsWith("fe80:")) {
    return true;
  }

  if (normalized.includes(":")) {
    return normalized.startsWith("fc") || normalized.startsWith("fd");
  }

  const parts = normalized.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [first, second] = parts;
  if (first === undefined || second === undefined) {
    return true;
  }

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

export const isBlockedHostname = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || PRIVATE_HOST.test(host)) {
    return true;
  }

  if (host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return isPrivateAddress(host);
  }

  return false;
};
