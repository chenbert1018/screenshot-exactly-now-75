import { createFileRoute } from "@tanstack/react-router";

function validateImageUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error("INVALID_PROTOCOL");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname !== "cdninstagram.com" &&
    !hostname.endsWith(".cdninstagram.com")
  ) {
    throw new Error("UNSUPPORTED_HOST");
  }

  return url;
}

export const Route = createFileRoute("/api/link-preview-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const rawUrl = requestUrl.searchParams.get("url")?.trim() ?? "";

        if (!rawUrl) {
          return new Response("Missing image URL", { status: 400 });
        }

        let imageUrl: URL;

        try {
          imageUrl = validateImageUrl(rawUrl);
        } catch {
          return new Response("Invalid image URL", { status: 400 });
        }

        try {
          const response = await fetch(imageUrl.toString(), {
            headers: {
              Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
              "User-Agent":
                "Mozilla/5.0 (compatible; IdolDaysLinkPreview/1.0)",
            },
          });

          if (!response.ok) {
            return new Response("Image unavailable", {
              status: response.status,
            });
          }

          const contentType =
            response.headers.get("content-type") ?? "";

          if (!contentType.toLowerCase().startsWith("image/")) {
            return new Response("Not an image", { status: 415 });
          }

          return new Response(response.body, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch {
          return new Response("Image fetch failed", { status: 502 });
        }
      },
    },
  },
});
