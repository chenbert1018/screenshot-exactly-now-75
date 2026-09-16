import { createFileRoute } from "@tanstack/react-router";

type CwaElementValue = Record<string, string>;

type CwaTime = {
  DataTime?: string;
  StartTime?: string;
  EndTime?: string;
  ElementValue?: CwaElementValue[];
};

type CwaWeatherElement = {
  ElementName?: string;
  Time?: CwaTime[];
};

type CwaLocation = {
  LocationName?: string;
  WeatherElement?: CwaWeatherElement[];
};

type CwaResponse = {
  success?: string;
  records?: {
    Locations?: Array<{
      Location?: CwaLocation[];
    }>;
  };
};

type FanWeatherInput = {
  minTemp: number;
  maxTemp: number;
  rainProbability: number;
  windSpeed: number;
  weatherDescription: string;
};

function normalizeCity(city: string) {
  const aliases: Record<string, string> = {
    台北市: "臺北市",
    台中市: "臺中市",
    台南市: "臺南市",
    台東縣: "臺東縣",
  };

  return aliases[city] ?? city;
}

function getTaiwanDate(time?: string) {
  if (!time) return null;

  // CWA timestamps already include +08:00.
  // YYYY-MM-DD is therefore safe to compare directly.
  return time.slice(0, 10);
}

function getElement(
  location: CwaLocation,
  name: string,
) {
  return location.WeatherElement?.find(
    (element) => element.ElementName === name,
  );
}

function getNumericValuesForDate(
  element: CwaWeatherElement | undefined,
  date: string,
  valueKey: string,
) {
  if (!element?.Time) return [];

  return element.Time.flatMap((time) => {
    const timeDate = getTaiwanDate(
      time.DataTime ?? time.StartTime,
    );

    if (timeDate !== date) return [];

    const raw = time.ElementValue?.[0]?.[valueKey];
    const value = Number(raw);

    return Number.isFinite(value) ? [value] : [];
  });
}

function getDescriptionsForDate(
  element: CwaWeatherElement | undefined,
  date: string,
  valueKey: string,
) {
  if (!element?.Time) return [];

  return element.Time.flatMap((time) => {
    const timeDate = getTaiwanDate(
      time.DataTime ?? time.StartTime,
    );

    if (timeDate !== date) return [];

    const value = time.ElementValue?.[0]?.[valueKey];

    return value?.trim() ? [value.trim()] : [];
  });
}

function normalizeFanWeather(
  location: CwaLocation,
  date: string,
): FanWeatherInput | null {
  const temperatures = getNumericValuesForDate(
    getElement(location, "溫度"),
    date,
    "Temperature",
  );

  const rainProbabilities = getNumericValuesForDate(
    getElement(location, "3小時降雨機率"),
    date,
    "ProbabilityOfPrecipitation",
  );

  const windSpeeds = getNumericValuesForDate(
    getElement(location, "風速"),
    date,
    "WindSpeed",
  );

  const weatherDescriptions = getDescriptionsForDate(
    getElement(location, "天氣預報綜合描述"),
    date,
    "WeatherDescription",
  );

  const weatherTexts = getDescriptionsForDate(
    getElement(location, "天氣現象"),
    date,
    "Weather",
  );

  if (temperatures.length === 0) {
    return null;
  }

  return {
    minTemp: Math.min(...temperatures),
    maxTemp: Math.max(...temperatures),

    // Fan Weather cares about the worst rain/wind condition
    // during the event day.
    rainProbability:
      rainProbabilities.length > 0
        ? Math.max(...rainProbabilities)
        : 0,

    windSpeed:
      windSpeeds.length > 0
        ? Math.max(...windSpeeds)
        : 0,

    weatherDescription: Array.from(
  new Set([
    ...weatherTexts,
    ...weatherDescriptions,
  ]),
).join(" "),
  };
}

export const Route = createFileRoute("/api/weather")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);

        const rawCity =
          requestUrl.searchParams.get("city")?.trim() ?? "";

        const requestedDate =
          requestUrl.searchParams.get("date")?.trim() ?? "";

        if (!rawCity) {
          return Response.json(
            {
              ok: false,
              error: "city is required",
            },
            { status: 400 },
          );
        }

        const city = normalizeCity(rawCity);
        const apiKey = process.env.CWA_API_KEY;

        if (!apiKey) {
          return Response.json(
            {
              ok: false,
              error: "CWA_API_KEY is not configured",
            },
            { status: 500 },
          );
        }

        const cwaUrl = new URL(
          "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-089",
        );

        cwaUrl.searchParams.set("LocationName", city);

        const response = await fetch(cwaUrl.toString(), {
          headers: {
            Authorization: apiKey,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          return Response.json(
            {
              ok: false,
              error: "CWA request failed",
              status: response.status,
            },
            { status: 502 },
          );
        }

        const data =
          (await response.json()) as CwaResponse;

        const location =
          data.records?.Locations?.[0]?.Location?.find(
            (item) => item.LocationName === city,
          );

        if (!location) {
          return Response.json(
            {
              ok: false,
              error: "weather location not found",
              city,
            },
            { status: 404 },
          );
        }

        /*
         * When no date is supplied we use the first forecast date.
         * The Fan Weather page will normally supply the event date.
         */
        const firstForecastTime =
          getElement(location, "溫度")
            ?.Time?.[0]?.DataTime;

        const forecastDate =
          requestedDate ||
          getTaiwanDate(firstForecastTime) ||
          "";

        if (!forecastDate) {
          return Response.json(
            {
              ok: false,
              error: "weather forecast is unavailable",
              city,
            },
            { status: 404 },
          );
        }

        const weather = normalizeFanWeather(
          location,
          forecastDate,
        );

        if (!weather) {
          return Response.json(
            {
              ok: false,
              error: "forecast date is outside available range",
              city,
              requestedDate: forecastDate,
            },
            { status: 404 },
          );
        }

        return Response.json({
          ok: true,
          source: "CWA",
          dataset: "F-D0047-089",
          city,
          forecastDate,
          weather,
        });
      },
    },
  },
});
