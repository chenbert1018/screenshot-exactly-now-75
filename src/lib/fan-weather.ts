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

  if (isExtendedTone(tone)) {
    return {
      scenario: result.scenario,
      tone,
      safetyFirst: false,
      lines: EXTENDED_TONE_LINES[result.scenario][tone],
      checklist: SCENARIO_CHECKLIST[result.scenario],
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

type ExtendedTone =
  | "RABBIT"
  | "HAMSTER"
  | "TIGER"
  | "LION"
  | "DEER"
  | "CHIPMUNK"
  | "PENGUIN"
  | "WOLF";
type NonSevereScenario = Exclude<FanWeatherScenario, "SEVERE">;

function isExtendedTone(tone: WeatherReminderTone): tone is ExtendedTone {
  return (
    tone === "RABBIT" ||
    tone === "HAMSTER" ||
    tone === "TIGER" ||
    tone === "LION" ||
    tone === "DEER" ||
    tone === "CHIPMUNK" ||
    tone === "PENGUIN" ||
    tone === "WOLF"
  );
}

const EXTENDED_TONE_LINES: Record<
  NonSevereScenario,
  Record<ExtendedTone, string[]>
> = {
  HEAVY_RAIN: {
    RABBIT: ["明天雨會有點大。", "雨具和防水袋慢慢準備好，別讓自己和珍藏淋濕 ♡"],
    WOLF: ["明天有大雨。", "雨具、防水收納和備用襪一次備齊，穩穩到場。"],
    LION: ["大雨也別慌。", "裝備準備完整、路線先確認好，自信安全地出發。"],
    HAMSTER: ["明天雨很大，腮幫子先別塞零食了。", "雨具和防水袋都放進包包，乾乾爽爽去見喜歡的人 ♡"],
    TIGER: ["明天有大雨。", "雨具、防水與路線全部確認，氣勢滿分也要安全到場。"],
    DEER: ["明天雨勢偏大。", "雨具和防水收納準備好，小心走路、平安抵達 ♡"],
    CHIPMUNK: ["明天會下大雨。", "零食可以塞，防水袋更要塞；小卡手幅一個都別淋濕。"],
    PENGUIN: ["明天有大雨。", "雨衣、防水袋和替換襪帶好，慢慢走也要穩穩到場。"],
  },
  COLD: {
    RABBIT: ["明天會冷冷的。", "外套和暖暖包帶好，把自己照顧得暖暖的 ♡"],
    WOLF: ["明天低溫。", "保暖層、暖暖包和熱飲準備好，別讓寒冷影響行程。"],
    LION: ["明天氣溫偏低。", "保暖做好再出發，精神和氣勢都要保持最佳狀態。"],
    HAMSTER: ["明天冷冷的。", "外套、暖暖包和小零食裝好，暖呼呼地出發吧 ♡"],
    TIGER: ["明天低溫。", "保暖裝備備齊，別讓寒冷削弱你的舞台應援氣勢。"],
    DEER: ["明天會冷。", "圍巾和暖暖包帶著，把自己照顧好再去赴約 ♡"],
    CHIPMUNK: ["明天很冷。", "暖暖包和熱飲記得囤好，補充體力才有力氣應援。"],
    PENGUIN: ["明天低溫，企鵝也知道要保暖。", "外套和暖暖包帶好，別真的冷到縮成一團。"],
  },
  HOT: {
    RABBIT: ["明天會很熱。", "水和防曬記得帶，累了就到陰涼處休息一下 ♡"],
    WOLF: ["明天高溫。", "補水、防曬、小風扇備齊，保存體力再進場。"],
    LION: ["明天很熱也要漂亮應戰。", "水分、防曬和休息都安排好，自信到場。"],
    HAMSTER: ["明天會很熱。", "水和小風扇帶好，零食也別放到曬壞了 ♡"],
    TIGER: ["明天高溫。", "補水、防曬、休息安排好，把體力留給最重要的舞台。"],
    DEER: ["明天陽光很強。", "水和防曬記得帶，累了就到陰涼處休息一下 ♡"],
    CHIPMUNK: ["明天超熱。", "水要帶夠、能量要補好，別還沒進場就先沒電。"],
    PENGUIN: ["明天很熱，對企鵝不太友善。", "水、防曬和小風扇備齊，找陰涼處休息。"],
  },
  WINDY: {
    RABBIT: ["明天風有點大。", "帽子、手幅和小卡都收好，別讓重要的東西飛走 ♡"],
    WOLF: ["明天強風。", "手幅與隨身物固定好，外套選防風一點的。"],
    LION: ["明天風不小。", "裝備固定好、步伐站穩，照樣帥氣出發。"],
    HAMSTER: ["明天風有點大。", "帽子、手幅和小零食都收好，別讓包包被吹亂 ♡"],
    TIGER: ["明天強風。", "裝備固定、腳步站穩，保持氣勢也保持安全。"],
    DEER: ["明天風比較大。", "外套穿好、隨身物收穩，慢慢走不要著急 ♡"],
    CHIPMUNK: ["明天風很大。", "手幅小卡全部收牢，不然就要追著自己的東西跑了。"],
    PENGUIN: ["明天強風。", "防風外套穿好、東西固定好，穩穩走別被風吹歪。"],
  },
  COMFORTABLE: {
    RABBIT: ["明天天氣很舒服。", "票券、手燈和好心情帶著，溫柔地去見喜歡的人吧 ♡"],
    WOLF: ["明天天氣狀況不錯。", "基本裝備最後確認，準時、穩穩地出發。"],
    LION: ["明天天氣很給力。", "票券、手燈、行動電源確認好，自信迎接重要日子。"],
    HAMSTER: ["明天天氣很舒服。", "票券、手燈和喜歡的小零食裝好，開心出發吧 ♡"],
    TIGER: ["明天天氣狀況很好。", "裝備確認完畢，把最強的應援留給舞台。"],
    DEER: ["明天天氣很溫柔。", "票券和手燈確認好，帶著好心情去見喜歡的人 ♡"],
    CHIPMUNK: ["明天天氣不錯。", "票、手燈、行動電源和補充體力的小點心都帶齊。"],
    PENGUIN: ["明天天氣很舒服。", "基本裝備帶好，照自己的步調可愛出發。"],
  },
};

const SCENARIO_CHECKLIST: Record<NonSevereScenario, string[]> = {
  HEAVY_RAIN: ["雨衣／雨傘", "小卡／手幅防水袋", "防水鞋／替換襪", "票券防水收納", "行動電源"],
  COLD: ["保暖外套", "暖暖包", "熱飲／保溫瓶", "護唇膏", "票券／手燈"],
  HOT: ["飲用水", "防曬用品", "小風扇", "毛巾", "行動電源"],
  WINDY: ["防風外套", "固定帽子／手幅", "小卡收納", "飲用水", "票券／證件"],
  COMFORTABLE: ["票券／入場憑證", "證件", "手燈", "小卡／應援物", "行動電源", "飲用水"],
};

const REMINDER_CONTENT: Record<
  Exclude<FanWeatherScenario, "SEVERE">,
  Record<Exclude<WeatherReminderTone, ExtendedTone>, ToneContent>
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
    Record<Exclude<WeatherReminderTone, ExtendedTone>, string>
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

  const extendedBodies: Record<
    NonSevereScenario,
    Record<ExtendedTone, string>
  > = {
    HEAVY_RAIN: {
      RABBIT: `${eventTitle} 明天可能有大雨，雨具和防水袋準備好，平安到場最重要 ♡`,
      WOLF: `${eventTitle} 明天有大雨。雨具、防水收納和備用襪一次備齊。`,
      LION: `${eventTitle} 明天大雨。裝備與路線確認好，自信也要安全地出發。`,
      HAMSTER: `${eventTitle} 明天大雨。雨具、防水袋和替換襪裝好，乾乾爽爽到場 ♡`,
      TIGER: `${eventTitle} 明天有大雨。防水裝備與路線全部確認，安全到場。`,
      DEER: `${eventTitle} 明天雨大。雨具準備好、小心走路，平安赴約 ♡`,
      CHIPMUNK: `${eventTitle} 明天大雨。小卡手幅全部防水，一個都別淋濕。`,
      PENGUIN: `${eventTitle} 明天有大雨。雨衣、防水袋和替換襪帶好，穩穩到場。`,
    },
    COLD: {
      RABBIT: `${eventTitle} 明天冷冷的，外套和暖暖包記得帶，把自己照顧暖一點 ♡`,
      WOLF: `${eventTitle} 明天低溫。保暖層、暖暖包和熱飲準備好。`,
      LION: `${eventTitle} 明天偏冷。保暖做好，精神和氣勢保持最佳狀態。`,
      HAMSTER: `${eventTitle} 明天冷冷的。外套、暖暖包和小零食裝好 ♡`,
      TIGER: `${eventTitle} 明天低溫。保暖裝備備齊，把體力留給舞台。`,
      DEER: `${eventTitle} 明天會冷。圍巾和暖暖包帶著，照顧好自己 ♡`,
      CHIPMUNK: `${eventTitle} 明天很冷。暖暖包和熱飲帶好，補滿應援體力。`,
      PENGUIN: `${eventTitle} 明天低溫。外套和暖暖包帶好，別冷到縮成一團。`,
    },
    HOT: {
      RABBIT: `${eventTitle} 明天很熱，水、防曬和小風扇要帶，累了就休息 ♡`,
      WOLF: `${eventTitle} 明天高溫。補水、防曬、小風扇備齊，保存體力。`,
      LION: `${eventTitle} 明天很熱。水分、防曬與休息安排好，自信到場。`,
      HAMSTER: `${eventTitle} 明天很熱。水和小風扇帶好，別讓自己曬暈了 ♡`,
      TIGER: `${eventTitle} 明天高溫。補水、防曬、休息安排好，保存體力。`,
      DEER: `${eventTitle} 明天陽光很強。水和防曬記得帶，累了就休息 ♡`,
      CHIPMUNK: `${eventTitle} 明天超熱。水帶夠、能量補好，進場前別先沒電。`,
      PENGUIN: `${eventTitle} 明天很熱。水、防曬和小風扇備齊，記得休息。`,
    },
    WINDY: {
      RABBIT: `${eventTitle} 明天風大，帽子、手幅和小卡都要收好 ♡`,
      WOLF: `${eventTitle} 明天強風。手幅與隨身物固定好，穿防風外套。`,
      LION: `${eventTitle} 明天風不小。裝備固定好、步伐站穩再出發。`,
      HAMSTER: `${eventTitle} 明天風大。帽子、手幅和隨身物都收好 ♡`,
      TIGER: `${eventTitle} 明天強風。裝備固定、腳步站穩，安全出發。`,
      DEER: `${eventTitle} 明天風大。外套穿好、隨身物收穩，慢慢走 ♡`,
      CHIPMUNK: `${eventTitle} 明天風很大。手幅小卡收牢，別追著東西跑。`,
      PENGUIN: `${eventTitle} 明天強風。防風外套穿好、東西固定好，穩穩走。`,
    },
    COMFORTABLE: {
      RABBIT: `${eventTitle} 明天天氣舒服，帶著票券、手燈和好心情出發吧 ♡`,
      WOLF: `${eventTitle} 明天天氣不錯。基本裝備最後確認，穩穩出發。`,
      LION: `${eventTitle} 明天天氣很給力。裝備確認好，自信迎接重要日子。`,
      HAMSTER: `${eventTitle} 明天天氣舒服。票券、手燈和小零食裝好，開心出發 ♡`,
      TIGER: `${eventTitle} 明天天氣很好。裝備確認完畢，把最強應援留給舞台。`,
      DEER: `${eventTitle} 明天天氣很溫柔。票券和手燈帶好，開心赴約 ♡`,
      CHIPMUNK: `${eventTitle} 明天天氣不錯。票、手燈、行動電源和點心都帶齊。`,
      PENGUIN: `${eventTitle} 明天天氣舒服。基本裝備帶好，照自己的步調出發。`,
    },
  };

  return {
    title,
    body: isExtendedTone(tone)
      ? extendedBodies[result.scenario][tone]
      : bodies[result.scenario][tone],
  };
}
