import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, RowCard, StatCard } from "@/components/AdminShell";
import { adminWidget } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/widget")({
  head: () => ({
    meta: [
      { title: "Widget｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台桌面陪伴設定使用概況。" },
      { property: "og:title", content: "Widget｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台桌面陪伴設定使用概況。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Widget">
      <WidgetContent />
    </AdminShell>
  ),
});

function WidgetContent() {
  const fn = useServerFn(adminWidget);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-widget"],
    queryFn: () => fn(),
    retry: false,
  });

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError || !data) return <AdminNotice>暫無資料</AdminNotice>;

  const contents = Object.entries(data.contentCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="有 Widget 設定的 User" value={data.total} />
        <StatCard label="已指定主要偶像" value={data.withMainIdol} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-background px-4 py-4">
        <p className="text-xs text-muted-foreground">Enabled contents 使用統計</p>
        {contents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">暫無資料</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {contents.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminList
        rows={data.rows}
        empty="還沒有使用者設定 Widget。"
        renderRow={(r) => (
          <RowCard
            key={r.userId}
            title={r.userEmail || r.userId}
            meta={`主要偶像：${r.idolName}．內容：${r.enabledContents.join("、") || "—"}`}
          />
        )}
      />
    </div>
  );
}
