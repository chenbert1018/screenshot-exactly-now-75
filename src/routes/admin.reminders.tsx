import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, RowCard, SearchInput } from "@/components/AdminShell";
import { adminReminders } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台提醒設定概覽。" },
      { property: "og:title", content: "Reminders｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台提醒設定概覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Reminders">
      <RemindersContent />
    </AdminShell>
  ),
});

function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString("zh-TW") : "—";
}

function RemindersContent() {
  const fn = useServerFn(adminReminders);
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reminders"],
    queryFn: () => fn(),
    retry: false,
  });

  const rows = useMemo(
    () =>
      (data ?? []).filter((r) =>
        `${r.userEmail} ${r.target} ${r.type}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [data, q],
  );

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="搜尋 User／對象／類型" />
      <AdminList
        rows={rows}
        empty="沒有符合的提醒。"
        renderRow={(r) => (
          <RowCard
            key={r.id}
            title={`${r.target}（${r.type}）`}
            meta={`${r.userEmail}．${r.daysBefore} 天前．${r.enabled ? "啟用中" : "已關閉"}．建立於 ${fmt(r.createdAt)}`}
          />
        )}
      />
    </>
  );
}
