import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, DetailGrid, RowCard, SearchInput } from "@/components/AdminShell";
import { adminSugar } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/sugar")({
  head: () => ({
    meta: [
      { title: "嗑糖｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台嗑糖收藏資料概覽。" },
      { property: "og:title", content: "嗑糖｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台嗑糖收藏資料概覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="嗑糖">
      <SugarContent />
    </AdminShell>
  ),
});

function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString("zh-TW") : "—";
}

function SugarContent() {
  const fn = useServerFn(adminSugar);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-sugar"],
    queryFn: () => fn(),
    retry: false,
  });

  const rows = useMemo(
    () =>
      (data ?? []).filter((s) =>
        `${s.title} ${s.idolName}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [data, q],
  );

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="搜尋標題或偶像" />
      <AdminList
        rows={rows}
        empty="沒有符合的嗑糖收藏。"
        renderRow={(s) => (
          <RowCard
            key={s.id}
            title={s.title || "（無標題）"}
            meta={`${s.date || "—"}．${s.idolName}．${s.type}．${s.userEmail}`}
            active={openId === s.id}
            onClick={() => setOpenId(openId === s.id ? null : s.id)}
          >
            {openId === s.id ? (
              <DetailGrid
                items={[
                  ["標題", s.title || "—"],
                  ["偶像", s.idolName],
                  ["日期", s.date || "—"],
                  ["類型", s.type],
                  ["筆記", s.note || "—"],
                  ["連結", s.link || "—"],
                  ["圖片", s.hasImage ? "有" : "無"],
                  ["所屬 User", s.userEmail],
                  ["建立時間", fmt(s.createdAt)],
                ]}
              />
            ) : null}
          </RowCard>
        )}
      />
    </>
  );
}
