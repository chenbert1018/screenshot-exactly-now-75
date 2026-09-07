import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminList, AdminNotice, AdminShell, DetailGrid, RowCard, SearchInput } from "@/components/AdminShell";
import { adminUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users｜IdolDays Admin" },
      { name: "description", content: "IdolDays 後台使用者清單與資料數量概覽。" },
      { property: "og:title", content: "Users｜IdolDays Admin" },
      { property: "og:description", content: "IdolDays 後台使用者清單。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Users">
      <UsersContent />
    </AdminShell>
  ),
});

function fmt(v: string | null | undefined) {
  return v ? new Date(v).toLocaleString("zh-TW") : "—";
}

function UsersContent() {
  const fn = useServerFn(adminUsers);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fn(),
    retry: false,
  });

  const rows = useMemo(
    () => (data ?? []).filter((u) => u.email.toLowerCase().includes(q.trim().toLowerCase())),
    [data, q],
  );

  if (isLoading) return <AdminNotice>載入中…</AdminNotice>;
  if (isError) return <AdminNotice>暫無資料</AdminNotice>;

  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder="搜尋 Email" />
      <AdminList
        rows={rows}
        empty="沒有符合的使用者。"
        renderRow={(u) => (
          <RowCard
            key={u.id}
            title={u.email || u.id}
            meta={`建立於 ${fmt(u.createdAt)}．偶像 ${u.idols}．日子 ${u.events}`}
            active={openId === u.id}
            onClick={() => setOpenId(openId === u.id ? null : u.id)}
          >
            {openId === u.id ? (
              <DetailGrid
                items={[
                  ["Email", u.email || "—"],
                  ["建立時間", fmt(u.createdAt)],
                  ["最後登入", fmt(u.lastSignInAt)],
                  ["狀態", u.confirmed ? "已驗證" : "未驗證"],
                  ["Idol 數量", u.idols],
                  ["Event 數量", u.events],
                  ["Memory 數量", u.memories],
                  ["嗑糖數量", u.sugar],
                  ["Reminder 數量", u.reminders],
                ]}
              />
            ) : null}
          </RowCard>
        )}
      />
    </>
  );
}
