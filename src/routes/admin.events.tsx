import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, DetailGrid, RowCard, SearchInput } from "@/components/AdminShell";
import { adminEvents } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/events")({
  head: () => ({
    meta: [
      { title: "Events｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台日子（Events）資料概覽。" },
      { property: "og:title", content: "Events｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台日子資料概覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Events">
      <EventsContent />
    </AdminShell>
  ),
});

function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString("zh-TW") : "—";
}

function EventsContent() {
  const fn = useServerFn(adminEvents);
  const [q, setQ] = useState("");
  const [asc, setAsc] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => fn(),
    retry: false,
  });

  const rows = useMemo(() => {
    const filtered = (data ?? []).filter((e) =>
      `${e.title} ${e.idolName}`.toLowerCase().includes(q.trim().toLowerCase()),
    );
    return [...filtered].sort((a, b) =>
      asc ? (a.date > b.date ? 1 : -1) : a.date < b.date ? 1 : -1,
    );
  }, [data, q, asc]);

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="搜尋活動名稱或偶像" />
      <button
        type="button"
        onClick={() => setAsc((v) => !v)}
        className="mb-3 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs"
      >
        日期排序：{asc ? "由舊到新" : "由新到舊"}
      </button>
      <AdminList
        rows={rows}
        empty="沒有符合的日子。"
        renderRow={(e) => (
          <RowCard
            key={e.id}
            title={e.title}
            meta={`${e.date}．${e.idolName}．${e.type}．${e.userEmail}`}
            active={openId === e.id}
            onClick={() => setOpenId(openId === e.id ? null : e.id)}
          >
            {openId === e.id ? (
              <DetailGrid
                items={[
                  ["活動名稱", e.title],
                  ["偶像", e.idolName],
                  ["活動類型", e.type],
                  ["日期", e.date],
                  ["備註", e.note || "—"],
                  ["所屬 User", e.userEmail],
                  ["建立時間", fmt(e.createdAt)],
                  ["Milestones 數量", e.milestones],
                ]}
              />
            ) : null}
          </RowCard>
        )}
      />
    </>
  );
}
