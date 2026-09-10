import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  useEffect,
  useState,
} from "react";
import {
  ChevronLeft,
  CloudRain,
  MapPin,
} from "lucide-react";

import {
  AppShell,
  SoftCard,
} from "@/components/AppShell";
import {
  eventCountdown,
  eventTypeMeta,
} from "@/lib/events";
import { useEventSource } from "@/lib/events.source";
import { useIdolSource } from "@/lib/idols.source";
import {
  classifyFanWeather,
  generateFanWeatherReminder,
  type FanWeatherInput,
} from "@/lib/fan-weather";

type WeatherApiSuccess = {
  ok: true;
  source: "CWA";
  dataset: string;
  city: string;
  forecastDate: string;
  weather: FanWeatherInput;
};

type WeatherApiError = {
  ok: false;
  error?: string;
};

type WeatherApiResponse =
  | WeatherApiSuccess
  | WeatherApiError;

export const Route = createFileRoute("/weather/$eventId")({
  head: () => ({
    meta: [
      { title: "追星天氣｜IdolDays" },
      {
        name: "description",
        content: "重要日子，也幫你看看天氣 ♡",
      },
    ],
  }),

  component: FanWeatherPage,
});

function FanWeatherPage() {
  const { eventId } = Route.useParams();

  const { events, ready } = useEventSource();
  const { findIdol } = useIdolSource();

  const event = events.find(
    (item) => item.id === eventId,
  );

  const [weatherInput, setWeatherInput] =
    useState<FanWeatherInput | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!ready || !event) {
      return;
    }

    if (!event.city) {
      setWeatherInput(null);
      setWeatherError("這個重要日子還沒有設定城市");
      return;
    }

    let cancelled = false;

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError(null);
      setWeatherInput(null);

      try {
        const params = new URLSearchParams({
          city: event.city ?? "",
          date: event.date.slice(0, 10),
        });

        const response = await fetch(
          `/api/weather?${params.toString()}`,
          {
            headers: {
              "Cache-Control": "no-cache",
            },
          },
        );

        const data =
          (await response.json()) as WeatherApiResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.ok) {
          if (
            "error" in data &&
            data.error ===
              "forecast date is outside available range"
          ) {
            setWeatherError(
              "這個重要日子還超出目前可查詢的天氣預報範圍",
            );
          } else {
            setWeatherError(
              "目前暫時無法取得這個地點的天氣",
            );
          }

          return;
        }

        setWeatherInput(data.weather);
      } catch {
        if (!cancelled) {
          setWeatherError(
            "目前暫時無法取得天氣，晚點再看看 ♡",
          );
        }
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    }

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, [
    ready,
    event?.id,
    event?.city,
    event?.date,
  ]);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40" />
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            找不到這個重要日子
          </p>

          <Link
            to="/events"
            className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
          >
            回到我的日子
          </Link>
        </div>
      </AppShell>
    );
  }

  const idol = findIdol(event.idolId);
  const countdown = eventCountdown(event.date);
  const eventMeta = eventTypeMeta(event.type);

  const weather = weatherInput
    ? classifyFanWeather(weatherInput)
    : null;

  const reminder = weatherInput
    ? generateFanWeatherReminder(
        weatherInput,
        event.weatherTone ?? "SUNSHINE",
      )
    : null;

  return (
    <AppShell>
      <div className="pb-12">
        <Link
          to="/events"
          className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft
            className="size-4"
            strokeWidth={1.8}
          />
          我的日子
        </Link>

        <section className="overflow-hidden rounded-[30px] border border-border/60 bg-card shadow-soft">
          <div className="px-6 pb-6 pt-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary">
                  ☁️ 追星天氣
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  重要日子，也幫你看看天氣 ♡
                </p>
              </div>

              {countdown && (
                <span className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-primary">
                  {countdown.ddayLabel}
                </span>
              )}
            </div>

            <div className="mt-7">
              <p className="text-xs tracking-wide text-muted-foreground">
                {idol?.name ?? "我的偶像"}
              </p>

              <h1 className="mt-1 font-display text-[27px] font-semibold leading-tight">
                {event.title}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {eventMeta.emoji} {eventMeta.label}
                {countdown
                  ? ` · ${countdown.dotDate}`
                  : ""}
              </p>

              {event.locationName && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin
                    className="size-4"
                    strokeWidth={1.7}
                  />

                  {event.locationName}

                  {event.city
                    ? ` · ${event.city}`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </section>

        {weatherLoading && (
          <SoftCard className="mt-4 px-5 py-6">
            <p className="text-sm font-medium">
              ☁️ 正在看看活動那天的天氣…
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              幫你確認出門前要準備什麼 ♡
            </p>
          </SoftCard>
        )}

        {!weatherLoading && weatherError && (
          <SoftCard className="mt-4 px-5 py-6">
            <p className="text-sm font-medium">
              ☁️ 天氣還看不到
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {weatherError}
            </p>
          </SoftCard>
        )}

        {!weatherLoading &&
          !weatherError &&
          weather &&
          weatherInput && (
            <>
              <SoftCard className="mt-4 px-5 py-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <CloudRain
                        className="size-5 text-primary"
                        strokeWidth={1.7}
                      />

                      <p className="font-medium">
                        {weather.emoji}{" "}
                        {weather.label}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      活動當天的天氣
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold">
                      {weatherInput.minTemp}–
                      {weatherInput.maxTemp}°C
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      降雨{" "}
                      {weatherInput.rainProbability}%
                    </p>
                  </div>
                </div>
              </SoftCard>

              {reminder && (
                <>
                  <section className="mt-6">
                    <div className="mb-3 px-1">
                      <p className="text-xs tracking-wide text-muted-foreground">
                        IdolDays 提醒
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {reminder.lines.map(
                        (line, index) => (
                          <div
                            key={`${line}-${index}`}
                            className="max-w-[88%] rounded-[22px] rounded-bl-md bg-surface px-4 py-3 text-[15px] leading-6"
                          >
                            {line}
                          </div>
                        ),
                      )}
                    </div>
                  </section>

                  <SoftCard className="mt-7 px-5 py-5">
                    <div>
                      <p className="font-medium">
                        🎒 出門別忘了
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        出門前再確認一次 ♡
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {reminder.checklist.map(
                        (item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0"
                          >
                            <span className="flex size-5 shrink-0 rounded-md border border-border" />

                            <span className="text-sm">
                              {item}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </SoftCard>
                </>
              )}

              <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
                天氣資料來自中央氣象署
                <br />
                實際天氣仍可能隨時間變化
              </p>
            </>
          )}
      </div>
    </AppShell>
  );
}