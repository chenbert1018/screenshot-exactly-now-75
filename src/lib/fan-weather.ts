import type { WeatherReminderTone } from "./events";

/**
 * IdolDays Fan Weather V1
 *
 * 將一般氣象資料轉換成「追星情境」。
 * V1 使用純規則判斷，之後可直接接 CWA API。
 */

export type FanWeatherScenario =
  | "SEVERE"
  | "HEAVY_RAIN"
  | "COLD"
  | "HOT"
  | "WINDY"
  | "COMFORTABLE";

export type FanWeatherInput = {
  /** 攝氏 */
  minTemp: number;
  /** 攝氏 */
  maxTemp: number;
  /** 降雨機率 0–100 */
  rainProbability: number;
  /** 最大風速，m/s */
  windSpeed?: number;
  /** CWA 天氣描述，例如「雷雨」 */
  weatherDescription?: string;
};

export type FanWeatherResult = {
  scenario: FanWeatherScenario;
  emoji: string;
  label: string;
  safetyFirst: boolean;
};

/**
 * 判斷順序很重要：
 * 劇烈天氣永遠優先於一般追星提醒。
 */
export function classifyFanWeather(
  weather: FanWeatherInput,
): FanWeatherResult {
  const description = weather.weatherDescription ?? "";

  const severe =
    /雷|豪雨|暴雨|颱風|強風特報|大雷雨/.test(description);

  if (severe) {
    return {
      scenario: "SEVERE",
      emoji: "⛈️",
      label: "劇烈天氣",
      safetyFirst: true,
    };
  }

  if (weather.rainProbability >= 70) {
    return {
      scenario: "HEAVY_RAIN",
      emoji: "🌧️",
      label: "大雨",
      safetyFirst: false,
    };
  }

  if (weather.minTemp <= 12) {
    return {
      scenario: "COLD",
      emoji: "❄️",
      label: "低溫",
      safetyFirst: false,
    };
  }

  if (weather.maxTemp >= 33) {
    return {
      scenario: "HOT",
      emoji: "☀️",
      label: "酷熱",
      safetyFirst: false,
    };
  }

  if ((weather.windSpeed ?? 0) >= 10.8) {
    return {
      scenario: "WINDY",
      emoji: "🌬️",
      label: "強風",
      safetyFirst: false,
    };
  }

  return {
    scenario: "COMFORTABLE",
    emoji: "🍃",
    label: "舒適",
    safetyFirst: false,
  };
}

export type FanWeatherReminder = {
  scenario: FanWeatherScenario;
  tone: WeatherReminderTone;
  lines: string[];
  checklist: string[];
  safetyFirst: boolean;
};

/**
 * IdolDays 提醒語氣。
 *
 * SUNSHINE：小太陽系
 * CAT：傲嬌貓系
 * FOX：帥氣狐狸系
 *
 * 文案是 IdolDays 的提醒，不冒充偶像本人。
 */
export function generateFanWeatherReminder(
  weather: FanWeatherInput,
  tone: WeatherReminderTone = "SUNSHINE",
): FanWeatherReminder {
  const result = classifyFanWeather(weather);

  // 安全情境不套用撒嬌／微撩文案。
  if (result.scenario === "SEVERE") {
    return {
      scenario: result.scenario,
      tone,
      safetyFirst: true,
      lines: [
        "明天天氣可能不太穩定。",
        "出門前記得再確認交通和主辦單位公告。",
        "安全最重要，行程有變也不要勉強。",
      ],
      checklist: [
        "確認主辦單位最新公告",
        "確認交通與停駛資訊",
        "雨衣／雨傘",
        "小卡／票券防水收納",
        "準備備用交通或行程方案",
        "避免危險的戶外久候",
      ],
    };
  }

  const content = REMINDER_CONTENT[result.scenario][tone];

  return {
    scenario: result.scenario,
    tone,
    safetyFirst: false,
    lines: content.lines,
    checklist: content.checklist,
  };
}

type ToneContent = {
  lines: string[];
  checklist: string[];
};

const REMINDER_CONTENT: Record<
  Exclude<FanWeatherScenario, "SEVERE">,
  Record<WeatherReminderTone, ToneContent>
> = {
  HEAVY_RAIN: {
    SUNSHINE: {
      lines: [
        "明天雨真的有點大ㅠㅠ",
        "小卡手幅先全部套好防水拜託",
        "外場如果要排很久，雨傘也帶著～",
        "人跟周邊都要平安到場 ♡",
      ],
      checklist: ["雨衣／雨傘", "小卡／手幅防水袋", "防水鞋／替換襪", "行動電源防水", "毛巾", "票券防水收納"],
    },
    CAT: {
      lines: [
        "明天大雨",
        "對 就是很大",
        "小卡先收好",
        "防水袋不要又想說「應該還好」",
        "到時候濕掉真的不要哭ㅋㅋ",
        "你自己也顧一下",
      ],
      checklist: ["雨衣／雨傘", "小卡／手幅防水袋", "防水鞋／替換襪", "行動電源防水", "毛巾", "票券防水收納"],
    },
    FOX: {
      lines: [
        "明天雨不小",
        "小卡、手燈先做好防水",
        "外場久待的話帶傘",
        "東西別濕",
        "你也一樣",
      ],
      checklist: ["雨衣／雨傘", "小卡／手幅防水袋", "防水鞋／替換襪", "手燈防水", "行動電源防水", "票券防水收納"],
    },
  },

  COLD: {
    SUNSHINE: {
      lines: [
        "明天好像會冷很多ㅠㅠ",
        "如果要在外面排隊，外套真的要穿暖一點",
        "暖暖包也塞幾個進包包～",
        "追星可以很熱血，但本人不要冷到發抖ㅋㅋ",
      ],
      checklist: ["保暖外套", "暖暖包", "圍巾／手套", "熱飲", "口罩", "行動電源"],
    },
    CAT: {
      lines: [
        "明天很冷",
        "不要只顧穿漂亮",
        "外套帶著",
        "暖暖包也帶",
        "冷到發抖我可不管你",
        "……還是穿暖一點",
      ],
      checklist: ["保暖外套", "暖暖包", "圍巾／手套", "熱飲", "口罩", "行動電源"],
    },
    FOX: {
      lines: [
        "明天溫度很低",
        "外場待久的話會冷",
        "外套跟暖暖包帶著",
        "別著涼",
      ],
      checklist: ["保暖外套", "暖暖包", "圍巾／手套", "熱飲", "口罩", "行動電源"],
    },
  },

  HOT: {
    SUNSHINE: {
      lines: [
        "明天真的會很熱🥹",
        "水拜託一定要帶",
        "外場排隊記得找時間去陰涼的地方休息",
        "防曬也補一下～不要還沒見到人就先融化ㅋㅋ",
      ],
      checklist: ["飲用水", "防曬", "小風扇", "帽子／遮陽用品", "毛巾", "行動電源"],
    },
    CAT: {
      lines: [
        "明天超熱",
        "水帶著",
        "防曬擦好",
        "不要硬站在太陽下面",
        "中暑真的一點都不好笑",
      ],
      checklist: ["飲用水", "防曬", "小風扇", "帽子／遮陽用品", "毛巾", "行動電源"],
    },
    FOX: {
      lines: [
        "明天很熱",
        "水帶夠",
        "防曬記得補",
        "排隊太久就找地方休息",
        "別逞強",
      ],
      checklist: ["飲用水", "防曬", "小風扇", "帽子／遮陽用品", "毛巾", "行動電源"],
    },
  },

  WINDY: {
    SUNSHINE: {
      lines: [
        "明天風好像有點大～",
        "手幅帽子真的要顧好ㅋㅋ",
        "外場東西不要一放下就被吹走",
        "雨傘如果不好撐也別硬撐喔",
      ],
      checklist: ["固定手幅", "收好帽子", "小卡安全收納", "固定隨身物品", "避免大型鬆散應援物", "注意雨傘"],
    },
    CAT: {
      lines: [
        "明天風很大",
        "手幅抓好",
        "帽子抓好",
        "東西不要亂放",
        "不然追的可能不是偶像 是你的東西",
      ],
      checklist: ["固定手幅", "收好帽子", "小卡安全收納", "固定隨身物品", "避免大型鬆散應援物", "注意雨傘"],
    },
    FOX: {
      lines: [
        "明天風不小",
        "手幅跟帽子固定好",
        "東西收好再走",
        "別讓它們先去追星",
      ],
      checklist: ["固定手幅", "收好帽子", "小卡安全收納", "固定隨身物品", "避免大型鬆散應援物", "注意雨傘"],
    },
  },

  COMFORTABLE: {
    SUNSHINE: {
      lines: [
        "明天天氣看起來很可以耶 ♡",
        "沒有什麼特別需要擔心的～",
        "手燈、小卡、行動電源最後再確認一次",
        "然後就開開心心出發吧ㅠㅠ",
      ],
      checklist: ["票券／入場憑證", "證件", "手燈", "小卡／應援物", "行動電源", "飲用水"],
    },
    CAT: {
      lines: [
        "明天天氣不錯",
        "很好",
        "至少不用跟天氣打架",
        "票跟手燈自己記得帶",
        "這個總不能也要提醒吧ㅋㅋ",
      ],
      checklist: ["票券／入場憑證", "證件", "手燈", "小卡／應援物", "行動電源", "飲用水"],
    },
    FOX: {
      lines: [
        "明天天氣不錯",
        "基本裝備確認一下",
        "票、手燈、行動電源",
        "剩下的就好好玩",
      ],
      checklist: ["票券／入場憑證", "證件", "手燈", "小卡／應援物", "行動電源", "飲用水"],
    },
  },
};
/* ---------------- Fan Weather notification copy ---------------- */

export type FanWeatherNotificationCopy = {
  title: string;
  body: string;
};

/**
 * Local Notification 使用的短版文案。
 *
 * 詳細提醒仍留在 Fan Weather 頁面，
 * notification 只負責告訴使用者最重要的天氣狀況。
 */
export function generateFanWeatherNotificationCopy(
  weather: FanWeatherInput,
  eventTitle: string,
  tone: WeatherReminderTone = "SUNSHINE",
): FanWeatherNotificationCopy {
  const result = classifyFanWeather(weather);

  // 劇烈天氣永遠安全優先，不套角色語氣。
  if (result.scenario === "SEVERE") {
    return {
      title: "⛈️ 明天天氣可能不太穩定",
      body: `${eventTitle} 出門前記得確認交通和主辦單位公告，安全最重要。`,
    };
  }

  const title = "☁️ 明天的追星天氣準備好了";

  const bodies: Record<
    Exclude<FanWeatherScenario, "SEVERE">,
    Record<WeatherReminderTone, string>
  > = {
    HEAVY_RAIN: {
      SUNSHINE: `${eventTitle} 可能有大雨，小卡、手幅和雨具都先準備好，人跟周邊都不要淋濕 ♡`,
      CAT: `${eventTitle} 明天大雨。防水袋跟雨具帶好，不要又覺得「應該還好」ㅋㅋ`,
      FOX: `${eventTitle} 明天雨不小。小卡、手幅和雨具先準備好，別淋濕。`,
    },
    COLD: {
      SUNSHINE: `${eventTitle} 明天會冷，外套和暖暖包記得帶著，追星也要暖暖的 ♡`,
      CAT: `${eventTitle} 明天很冷。外套跟暖暖包帶著，不要只顧穿漂亮。`,
      FOX: `${eventTitle} 明天偏冷。外套、暖暖包帶好，別著涼。`,
    },
    HOT: {
      SUNSHINE: `${eventTitle} 明天很熱，水、防曬和小風扇記得帶，不要先被太陽融化了 ♡`,
      CAT: `${eventTitle} 明天超熱。水跟防曬帶好，不要硬站在太陽下面。`,
      FOX: `${eventTitle} 明天很熱。水帶夠、防曬補好，累了就休息。`,
    },
    WINDY: {
      SUNSHINE: `${eventTitle} 明天風有點大，手幅、帽子和小卡都顧好，別讓它們先飛走ㅋㅋ`,
      CAT: `${eventTitle} 明天風很大。手幅帽子抓好，不然等等追的是自己的東西。`,
      FOX: `${eventTitle} 明天風不小。手幅、帽子和隨身物品固定好再出發。`,
    },
    COMFORTABLE: {
      SUNSHINE: `${eventTitle} 明天天氣看起來很可以 ♡ 票券、手燈和行動電源最後確認一次就出發吧～`,
      CAT: `${eventTitle} 明天天氣不錯。票跟手燈自己記得帶，這個總不能也忘吧ㅋㅋ`,
      FOX: `${eventTitle} 明天天氣不錯。票、手燈、行動電源確認好，剩下的就好好玩。`,
    },
  };

  return {
    title,
    body: bodies[result.scenario][tone],
  };
}
