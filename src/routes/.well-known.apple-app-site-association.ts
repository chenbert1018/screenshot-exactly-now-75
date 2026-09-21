import { createFileRoute } from "@tanstack/react-router";

const association = {
  applinks: {
    details: [
      {
        appIDs: ["6AZ9K269DA.com.idoldays.app"],
        components: [
          {
            "/": "/receive/*",
            comment: "Open IdolDays gift receive links in the iOS app",
          },
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/.well-known/apple-app-site-association")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(association), {
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=300",
          },
        }),
    },
  },
});
