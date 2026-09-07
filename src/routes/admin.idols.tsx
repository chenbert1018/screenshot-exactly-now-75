import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, DetailGrid, RowCard, SearchInput } from "@/components/AdminShell";
import { adminIdols } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/idols")({
  head: () => ({
    meta: [
      { title: "Idols｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台偶像資料概覽。" },
      { property: "og:title", content: "Idols｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台偶像資料概覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Idols">
      <IdolsContent />
    </AdminShell>
  ),
});

function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString("zh-TW") : "—";
}

function IdolsContent() {
  const fn = useServerFn(adminIdols);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-idols"],
    queryFn: () => fn(),
    retry: false,
  });

  const rows = useMemo(
    () => (data ?? []).filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())),
    [data, q],
  );

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="搜尋偶像名稱" />
      <AdminList
        rows={rows}
        empty="沒有符合的偶像。"
        renderRow={(i) => (
          <RowCard
            key={i.id}
            title={`${i.name}${i.isMain ? " ★ 本命" : ""}`}
            meta={`${i.group || "—"}．${i.userEmail}．${i.hasPhoto ? "有照片" : "無照片"}`}
            active={openId === i.id}
            onClick={() => setOpenId(openId === i.id ? null : i.id)}
          >
            {openId === i.id ? (
              <DetailGrid
                items={[
                  ["Name", i.name],
                  ["Group", i.group || "—"],
                  ["Birthday", i.birthday || "—"],
                  ["Debut date", i.debutDate || "—"],
                  ["Fan name", i.fanName || "—"],
                  ["Fan color", i.fanColor || "—"],
                  ["認識日期", i.sinceDate || "—"],
                  ["Main idol", i.isMain ? "是" : "否"],
                  ["照片", i.hasPhoto ? "有" : "無"],
                  ["所屬 User", i.userEmail],
                  ["建立時間", fmt(i.createdAt)],
                ]}
              />
            ) : null}
          </RowCard>
        )}
      />
    </>
  );
}
