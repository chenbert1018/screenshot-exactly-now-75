import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理後台｜IdolDays Admin" },
      { name: "description", content: "IdolDays 管理後台：使用者、偶像、日子與資料概覽。" },
      { property: "og:title", content: "管理後台｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 管理後台：使用者、偶像、日子與資料概覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
