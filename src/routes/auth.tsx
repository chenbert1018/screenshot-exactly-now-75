import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, Section, SoftCard } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useAuth, useAuthActions, fetchMyProfile, type CloudProfile } from "@/lib/auth";
import {
  createCloudIdol,
  deleteCloudIdol,
  listCloudIdols,
  updateCloudIdol,
} from "@/lib/idols.cloud";
import { emptyDraft, MAX_IDOLS, type Idol } from "@/lib/idols";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string } => {
    const value = typeof search.returnTo === "string" ? search.returnTo : undefined;
    return value?.startsWith("/receive/") ? { returnTo: value } : {};
  },
  head: () => ({
    meta: [
      { title: "登入雲端｜IdolDays" },
      { name: "description", content: "登入 IdolDays 雲端帳號，把本命偶像收藏同步保存。" },
      { property: "og:title", content: "登入雲端｜IdolDays" },
      { property: "og:description", content: "登入 IdolDays 雲端帳號，把本命偶像收藏同步保存。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const { returnTo } = Route.useSearch();

  useEffect(() => {
    if (!loading && user && returnTo) {
      window.location.assign(returnTo);
    }
  }, [loading, returnTo, user]);

  return (
    <AppShell>
      <PageHeader
        title="把我們的日子收好 ♡"
        subtitle="登入 IdolDays，讓喜歡的日子陪你留得更久。"
      />
      {loading ? (
        <SoftCard className="px-5 py-6 text-sm text-muted-foreground">讀取中…</SoftCard>
      ) : user ? (
        <SignedIn email={user.email ?? ""} userId={user.id} />
      ) : (
        <SignedOut returnTo={returnTo} />
      )}
    </AppShell>
  );
}

function SignedOut({ returnTo }: { returnTo?: string }) {
  const { signIn, signUp } = useAuthActions();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const error = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) {
      setMessage(error);
    } else if (mode === "signup") {
      setMessage(returnTo
        ? "註冊完成。登入後會帶你回朋友送的收藏 ♡"
        : "註冊完成，如果沒有自動登入，請直接用同一組帳密登入。");
    } else if (returnTo) {
      window.location.assign(returnTo);
    }
  };

  return (
    <SoftCard className="relative overflow-hidden px-5 py-6">
      <span
        aria-hidden
        className="pointer-events-none absolute top-4 right-5 text-lg text-primary/25"
      >
        ✦
      </span>

      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary">
          IDOLDAYS CLOUD ♡
        </p>
        <p className="mt-2 font-display text-[20px] font-semibold">
          {mode === "signin" ? "歡迎回來" : "開始收藏我們的日子"}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {mode === "signin"
            ? "你的收藏與設定，都在這裡等你。"
            : "建立帳號，把重要的追星日子留在雲端。"}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-full bg-surface/70 p-1">
        <Button
          type="button"
          variant="ghost"
          className={`rounded-full ${mode === "signin" ? "bg-card text-primary shadow-soft hover:bg-card" : "text-muted-foreground"}`}
          onClick={() => setMode("signin")}
        >
          登入
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={`rounded-full ${mode === "signup" ? "bg-card text-primary shadow-soft hover:bg-card" : "text-muted-foreground"}`}
          onClick={() => setMode("signup")}
        >
          註冊
        </Button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            className="min-h-12 rounded-2xl border-border/70 bg-card/70 px-4 shadow-none"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auth-password">密碼</Label>
          <Input
            id="auth-password"
            className="min-h-12 rounded-2xl border-border/70 bg-card/70 px-4 shadow-none"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="min-h-12 w-full rounded-full shadow-soft"
          disabled={busy}
        >
          {busy ? "處理中…" : mode === "signin" ? "登入" : "建立帳號"}
        </Button>
      </form>
      {message ? (
        <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">
        登入不會刪除這台 iPhone 上原本保存的內容。
      </p>
    </SoftCard>
  );
}

function SignedIn({ email, userId }: { email: string; userId: string }) {
  const { signOut } = useAuthActions();
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [idols, setIdols] = useState<Idol[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [p, list] = await Promise.all([fetchMyProfile(userId), listCloudIdols()]);
      setProfile(p);
      setIdols(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "讀取失敗");
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createCloudIdol({ ...emptyDraft, name: name.trim() }, userId);
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗");
    }
    setBusy(false);
  };

  const rename = async (idol: Idol) => {
    const next = window.prompt("新的名字", idol.name);
    if (next === null || !next.trim()) return;
    try {
      await updateCloudIdol(idol.id, { ...idol, name: next.trim() });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    }
  };

  const remove = async (idol: Idol) => {
    if (!window.confirm(`要刪除雲端的「${idol.name}」嗎？`)) return;
    try {
      await deleteCloudIdol(idol.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  return (
    <>
      <SoftCard className="relative mb-8 overflow-hidden px-5 py-6">
        <span aria-hidden className="absolute top-4 right-5 text-primary/25">♡</span>
        <p className="text-xs font-semibold tracking-[0.14em] text-primary">
          IDOLDAYS CLOUD
        </p>
        <p className="mt-2 text-[17px] font-medium">已經替你收好 ♡</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
        {profile ? (
          <p className="mt-1 text-xs text-muted-foreground">
            個人設定已建立（{profile.language}／{profile.theme}）
          </p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="mt-5 min-h-11 w-full rounded-full"
          onClick={() => void signOut()}
        >
          登出
        </Button>
      </SoftCard>

      <Section title="雲端收藏" hint={`${idols.length}／${MAX_IDOLS}`}>
        <SoftCard className="px-5 py-5">
          <p className="text-sm text-muted-foreground">
            目前雲端收藏與這台 iPhone 的本機收藏各自保存。
          </p>
          <form onSubmit={add} className="mt-4 flex gap-2">
            <Input
              aria-label="偶像名字"
              className="min-h-11 rounded-2xl border-border/70 bg-card/70"
              placeholder="偶像名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              新增
            </Button>
          </form>
          {idols.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
              雲端還沒有偶像。
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {idols.map((idol) => (
                <li key={idol.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm">{idol.name}</span>
                  <button
                    type="button"
                    className="rounded-full px-3 py-1 text-xs text-muted-foreground"
                    onClick={() => void rename(idol)}
                  >
                    改名
                  </button>
                  <button
                    type="button"
                    aria-label={`刪除 ${idol.name}`}
                    className="rounded-full p-2 text-muted-foreground transition-transform duration-300 active:scale-90"
                    onClick={() => void remove(idol)}
                  >
                    <Trash2 className="size-4" strokeWidth={1.6} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </SoftCard>
      </Section>
    </>
  );
}
