import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, SoftCard } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "隱私權政策｜IdolDays" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="隱私權政策" subtitle="最後更新：2026 年 9 月 15 日" />
      <SoftCard className="space-y-5 px-5 py-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="font-medium text-foreground">我們保存的資料</h2>
          <p>
            使用帳號同步時，IdolDays
            會保存你的帳號識別資料、偶像、日子、提醒、回憶、考古收藏、嗑糖內容及你主動上傳的圖片。
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">資料用途與分享</h2>
          <p>
            資料僅用於提供 App
            功能、跨裝置同步及你主動啟用的相簿分享。我們不出售個人資料；公開分享連結中的內容可由持有連結的人查看。
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">通知、天氣與購買</h2>
          <p>
            提醒由 iPhone 本機通知提供；天氣查詢會傳送活動城市與日期；訂閱付款及交易權益由 Apple
            StoreKit 處理，IdolDays 不接收完整付款卡資料。
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">你的選擇</h2>
          <p>
            你可以關閉通知、停止相簿分享、刪除 App 內內容，或透過 App
            內帳號頁登出。帳號與雲端資料刪除功能將在正式上架前提供。
          </p>
        </section>
      </SoftCard>
      <Link to="/profile" className="mt-6 block text-center text-sm text-primary underline">
        回到我的設定
      </Link>
    </AppShell>
  );
}
