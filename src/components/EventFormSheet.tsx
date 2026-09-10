import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPES, emptyEventDraft, type EventDraft, type EventType } from "@/lib/events";
import type { Idol } from "@/lib/idols";

export function EventFormSheet({
  open,
  onOpenChange,
  idols,
  initial,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idols: Idol[];
  initial?: EventDraft | undefined;
  title: string;
  submitLabel: string;
  onSubmit: (draft: EventDraft) => void;
}) {
  const [draft, setDraft] = useState<EventDraft>(initial ?? emptyEventDraft);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      const base = initial ?? emptyEventDraft;
      setDraft({ ...base, idolId: base.idolId || (idols[0]?.id ?? "") });
      setError("");
    }
  }, [open, initial, idols]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.idolId) return setError("請先選擇一位偶像");
    if (!draft.title.trim()) return setError("請幫這個日子取一個名字");
    if (!draft.date) return setError("請選擇日期");
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      note: draft.note.trim(),
      locationName: draft.locationName?.trim() ?? "",
      city: draft.city?.trim() ?? "",
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>把值得期待的日子留下來</SheetDescription>
        </SheetHeader>

        {idols.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[15px]">請先新增一位偶像</p>
            <Link
              to="/idols"
              onClick={() => onOpenChange(false)}
              className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
            >
              前往我的偶像
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label>選擇偶像</Label>
              <div className="flex flex-wrap gap-2">
                {idols.map((idol) => {
                  const active = draft.idolId === idol.id;
                  return (
                    <button
                      key={idol.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, idolId: idol.id }))}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-surface/50 text-muted-foreground"
                      }`}
                    >
                      {idol.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-title">
                日子名稱<span className="ml-1 text-primary">*</span>
              </Label>
              <Input
                id="event-title"
                value={draft.title}
                placeholder="例如：台北演唱會"
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label>類型</Label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((t) => {
                  const active = draft.type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, type: t.value as EventType }))}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/70 bg-surface/50 text-muted-foreground"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-date">
                日期<span className="ml-1 text-primary">*</span>
              </Label>
              <Input
                id="event-date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-location">活動地點</Label>
              <Input
                id="event-location"
                value={draft.locationName ?? ""}
                placeholder="例如：台北大巨蛋"
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    locationName: e.target.value,
                  }))
                }
                className="rounded-xl bg-surface/50"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                演唱會、Fan Meeting、應援或追星旅行可以加入地點
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-city">城市／縣市</Label>
              <Input
                id="event-city"
                value={draft.city ?? ""}
                placeholder="例如：臺北市"
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    city: e.target.value,
                  }))
                }
                className="rounded-xl bg-surface/50"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                追星天氣會依這個地區取得活動當地的天氣
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface/40 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">
                    ☁️ 追星天氣
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    重要日前依照當地天氣提醒我
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(draft.weatherEnabled)}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      weatherEnabled: !d.weatherEnabled,
                    }))
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    draft.weatherEnabled
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${
                      draft.weatherEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {draft.weatherEnabled &&
              (!draft.locationName?.trim() || !draft.city?.trim()) ? (
                <p className="mt-3 rounded-xl bg-card px-3 py-2 text-xs leading-5 text-muted-foreground">
                  📍 加入活動地點與城市後即可使用追星天氣
                </p>
              ) : null}

              {draft.weatherEnabled &&
              draft.locationName?.trim() &&
              draft.city?.trim() ? (
                <p className="mt-3 rounded-xl bg-card px-3 py-2 text-xs leading-5 text-muted-foreground">
                  ♡ 會為這個重要日子準備當地的追星天氣提醒
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-note">備註</Label>
              <Textarea
                id="event-note"
                value={draft.note}
                placeholder="想記住什麼？"
                rows={3}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                className="rounded-xl bg-surface/50"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-full border border-border/70 py-3 text-sm transition-transform duration-300 active:scale-95"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 active:scale-95"
              >
                {submitLabel}
              </button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
