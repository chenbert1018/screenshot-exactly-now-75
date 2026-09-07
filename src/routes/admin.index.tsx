import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminNotice, AdminShell, StatCard } from "@/components/AdminShell";
import { adminDashboard } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台總覽：使用者、偶像、日子等即時統計。" },
      { property: "og:title", content: "Dashboard｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台總覽統計。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <DashboardContent />
    </AdminShell>
  );
}

function DashboardContent() {
  const fn = useServerFn(adminDashboard);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fn(),
    retry: false,
  });

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError || !data) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="使用者總數" value={data.users} />
      <StatCard label="偶像總數" value={data.idols} />
      <StatCard label="日子總數" value={data.events} />
      <StatCard label="回憶總數" value={data.memories} />
      <StatCard label="回憶資料夾" value={data.memoryFolders} />
      <StatCard label="嗑糖總數" value={data.sugar} />
      <StatCard label="啟用中的提醒" value={data.remindersEnabled} />
      <StatCard label="Widget 設定使用者" value={data.widgetUsers} />
    </div>
  );
}
