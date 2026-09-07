import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, DetailGrid, RowCard, SearchInput } from "@/components/AdminShell";
import { adminMemories } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/memories")({
  head: () => ({
    meta: [
      { title: "Memories｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台回憶資料概覽。" },
      { property: "og:title", content: "Memories｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台回憶資料概覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Memories">
      <MemoriesContent />
    </AdminShell>
  ),
});

function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString("zh-TW") : "—";
}

function MemoriesContent() {
  const fn = useServerFn(adminMemories);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-memories"],
    queryFn: () => fn(),
    retry: false,
  });

  const rows = useMemo(
    () =>
      (data ?? []).filter((m) =>
        `${m.title} ${m.folder} ${m.idolName}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [data, q],
  );

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="搜尋回憶標題／資料夾／偶像" />
      <AdminList
        rows={rows}
        empty="沒有符合的回憶。"
        renderRow={(m) => (
          <RowCard
            key={m.id}
            title={m.title || "（無標題）"}
            meta={`${m.date || "—"}．${m.folder}．${m.idolName}．${m.userEmail}`}
            active={openId === m.id}
            onClick={() => setOpenId(openId === m.id ? null : m.id)}
          >
            {openId === m.id ? (
              <DetailGrid
                items={[
                  ["標題", m.title || "—"],
                  ["資料夾", m.folder],
                  ["偶像", m.idolName],
                  ["日期", m.date || "—"],
                  ["備註", m.note || "—"],
                  ["照片", m.hasPhoto ? "有" : "無"],
                  ["所屬 User", m.userEmail],
                  ["建立時間", fmt(m.createdAt)],
                ]}
              />
            ) : null}
          </RowCard>
        )}
      />
    </>
  );
}
