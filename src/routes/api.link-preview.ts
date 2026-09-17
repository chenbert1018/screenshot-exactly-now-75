import { createFileRoute } from "@tanstack/react-router";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 600_000;

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const [a, b] = parts;
  if (a === undefined || b === undefined) return false;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}


function isPrivateIpv6(hostname: string) {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  // Loopback, link-local, unique-local and IPv4-mapped IPv6 addresses must
  // never be fetched by the metadata proxy. Blocking the mapped range as a
  // whole also avoids alternate IPv4 spellings bypassing the IPv4 guard.
  return (
    value === "::1" ||
    value.startsWith("fe80:") ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("::ffff:")
  );
}

function validateRemoteUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("INVALID_URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("INVALID_PROTOCOL");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname)
  ) {
    throw new Error("PRIVATE_URL");
  }

  return url;
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return "";
      }
    })
    .replace(/&#([0-9]+);/g, (_, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return "";
      }
    })
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readMeta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = escapeRegex(name);

    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
        "i",
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);

      if (match?.[1]) {
        return decodeHtml(match[1]);
      }
    }
  }

  return "";
}

function readTitle(html: string) {
  const socialTitle = readMeta(html, [
    "og:title",
    "twitter:title",
  ]);

  if (socialTitle) return socialTitle;

  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match?.[1]
    ? decodeHtml(match[1].replace(/\s+/g, " "))
    : "";
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  if (!value) return "";

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function toPreviewImageUrl(value: string, baseUrl: string) {
  const absolute = toAbsoluteUrl(value, baseUrl);

  if (!absolute) return "";

  try {
    const url = new URL(absolute);
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "cdninstagram.com" ||
      hostname.endsWith(".cdninstagram.com")
    ) {
      return `/api/link-preview-image?url=${encodeURIComponent(absolute)}`;
    }
  } catch {
    return "";
  }

  return absolute;
}

async function fetchPreviewPage(initialUrl: URL) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl.toString(), {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; IdolDaysLinkPreview/1.0)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("INVALID_REDIRECT");
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new Error("TOO_MANY_REDIRECTS");
      }

      currentUrl = validateRemoteUrl(
        new URL(location, currentUrl).toString(),
      );

      continue;
    }

    if (!response.ok) {
      throw new Error(`REMOTE_${response.status}`);
    }

    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";

    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error("NOT_HTML");
    }

    const contentLength = Number(
      response.headers.get("content-length") ?? "0",
    );

    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("TOO_LARGE");
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);

    return {
      html,
      finalUrl: currentUrl.toString(),
    };
  }

  throw new Error("FETCH_FAILED");
}

export const Route = createFileRoute("/api/link-preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const rawUrl =
          requestUrl.searchParams.get("url")?.trim() ?? "";

        if (!rawUrl) {
          return Response.json(
            {
              ok: false,
              error: "url is required",
            },
            { status: 400 },
          );
        }

        let requestedUrl: URL;

        try {
          requestedUrl = validateRemoteUrl(rawUrl);
        } catch {
          return Response.json(
            {
              ok: false,
              error: "invalid or unsafe url",
            },
            { status: 400 },
          );
        }

        try {
          const result = await fetchPreviewPage(requestedUrl);

          const title = readTitle(result.html);

          const rawImage = readMeta(result.html, [
            "og:image",
            "og:image:url",
            "twitter:image",
            "twitter:image:src",
          ]);

          const description = readMeta(result.html, [
            "og:description",
            "twitter:description",
            "description",
          ]);

          const siteName = readMeta(result.html, [
            "og:site_name",
          ]);

          return Response.json({
            ok: true,
            url: requestedUrl.toString(),
            finalUrl: result.finalUrl,
            title,
            imageUrl: toPreviewImageUrl(rawImage, result.finalUrl),
            description,
            siteName,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "FETCH_FAILED";

          return Response.json(
            {
              ok: false,
              error: message,
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
