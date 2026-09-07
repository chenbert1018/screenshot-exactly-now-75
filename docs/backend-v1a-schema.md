# IdolDays Backend V1-A｜Supabase Schema 規格（僅規格，未實作）

狀態：**規格文件**。本階段沒有建立 Supabase / Lovable Cloud、沒有 migration、沒有前端修改。
App 目前的正式資料來源仍然是 localStorage，所有 key 與格式維持不變。

---

## 1. 已實際檢查的既有檔案

`src/lib/idols.ts`、`src/lib/events.ts`、`src/lib/milestones.ts`、`src/lib/memories.ts`、
`src/lib/memory-folders.ts`、`src/lib/reminders.ts`、`src/lib/heart.ts`、
`src/lib/widget.ts`、`src/lib/settings.ts`。

### 與規格文件不同、以現有程式碼為準的地方

| 規格文件假設 | 現有實際狀況 |
| --- | --- |
| memory folders key = `idoldays.memory-folders.v1` | 實際是 `idoldays.memoryFolders.v1` |
| idols 欄位只有 name/image/birthday/debut_date | 實際還有 `groupName`、`fanName`、`favoriteColor`、`sinceDate`，且照片欄位叫 `photo` |
| memory folder 封面叫 `cover` | 實際是 `coverPhoto` |
| memories 圖片叫 `image` | 實際是 `photo` |
| widget preferences 為五個布林欄位 | 實際是 `{ idolId?, enabledContents: WidgetContentType[] }` |
| profiles 的 date_format 為 `YYYY-MM-DD` 等 | 現有 settings 為 `dot` / `slash` / `zh`；language 只有 `zh-TW` / `en` |
| milestones/events 的 `createdAt` | 為 number（epoch ms）；memories/heart/reminders 為 ISO 字串 |

**結論：保留現有前端 model 不動**，Backend 欄位以下表對照。

---

## 2. 資料表清單（Backend V1）

`profiles`、`idols`、`events`、`milestones`、`memory_folders`、`memories`、
`reminders`、`sugar_items`、`widget_preferences`。

共通規則：`id uuid primary key default gen_random_uuid()`、
`created_at timestamptz not null default now()`、`updated_at timestamptz not null default now()`、
使用者私有表一律有 `user_id uuid not null references auth.users(id) on delete cascade`。
純日期一律 `date`，需要時間才 `timestamptz`。不使用 email 作為 FK。

### profiles
| 欄位 | 型別 | 備註 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid unique NOT NULL | → auth.users |
| display_name | text | |
| main_idol_id | uuid NULL | → idols.id，ON DELETE SET NULL |
| date_format | text NOT NULL default 'dot' | CHECK in ('dot','slash','zh')；未來要支援 `YYYY-MM-DD` 等再擴充 |
| language | text NOT NULL default 'zh-TW' | CHECK in ('zh-TW','en','ko')（ko 先保留，前端尚未提供） |
| theme | text NOT NULL default 'system' | CHECK in ('system','light','dark') |

### idols
`id`、`user_id`、`name text NOT NULL`、`group_name text`、`birthday date`、`debut_date date`、
`fan_name text`、`favorite_color text`、`since_date date`、`photo text`（暫存 data URL，未來換 Storage path）。

### events
`id`、`user_id`、`idol_id uuid NOT NULL → idols.id`、`title text NOT NULL`、
`type text NOT NULL` CHECK in (BIRTHDAY, CONCERT, COMEBACK, TICKETING, VOTING, MERCH, FAN_MEETING, TRAVEL, SUPPORT, CUSTOM)、
`date date NOT NULL`、`note text`。

### milestones
`id`、`user_id`、`event_id uuid NOT NULL → events.id`、`title text NOT NULL`、`date date`、
`emoji text`、`completed boolean NOT NULL default false`。

### memory_folders
`id`、`user_id`、`idol_id uuid NULL → idols.id`、`title text NOT NULL`、`description text`、
`cover_photo text`、`start_date date`、`end_date date`。

### memories
`id`、`user_id`、`folder_id uuid NOT NULL → memory_folders.id`、`idol_id uuid NULL → idols.id`、
`title text`、`note text`、`photo text`、`date date`。

### reminders
`id`、`user_id`、`event_id uuid NULL → events.id`、`idol_id uuid NULL → idols.id`、
`type text NOT NULL` CHECK in ('EVENT','BIRTHDAY','ANNIVERSARY')、
`days_before int NOT NULL default 3` CHECK (days_before >= 0)、`enabled boolean NOT NULL default true`。

### sugar_items（對外名稱；前端仍叫 heart）
`id`、`user_id`、`idol_id uuid NOT NULL → idols.id`、`title text NOT NULL`、`date date`、
`type text NOT NULL` CHECK in ('PHOTO','MOMENT','STAGE','SWEET','CUSTOM')、`note text`、`link text`、`image text`。
不新增 `partner_id`，不做 CP 配對。

### widget_preferences
`id`、`user_id unique`、`idol_id uuid NULL → idols.id`、
`show_idol`、`show_daily_message`、`show_decoration`、`show_mood`、`show_important_date`
（皆 boolean NOT NULL default true）。
對應前端 `enabledContents` 陣列的五個內容模組，寫入時以布林欄位展開、讀取時再組回陣列。

---

## 3. Foreign Key 與刪除行為

```
auth.users ── profiles
              └── main_idol_id → idols.id (SET NULL)
idols ── events / memory_folders / memories / reminders / sugar_items / widget_preferences
events ── milestones / reminders
memory_folders ── memories
```

| 來源刪除 | 目標 | 行為 | 理由 |
| --- | --- | --- | --- |
| auth.users | 所有私有表 | CASCADE | 帳號刪除即清空個人資料 |
| events | milestones | CASCADE | 規格明訂 |
| events | reminders.event_id | CASCADE | 提醒依附於事件 |
| memory_folders | memories | CASCADE | 規格明訂 |
| idols | events / sugar_items | **RESTRICT** | 會連帶影響大量使用者資料，改由 App 顯式確認後刪除 |
| idols | memory_folders / memories / reminders.idol_id / widget_preferences.idol_id / profiles.main_idol_id | **SET NULL** | 資料本身仍有保存價值，不因偶像刪除而消失 |

（目前前端刪除偶像時不會連鎖刪除，其他模組顯示「已刪除的偶像」；上述規劃與該行為一致。）

---

## 4. RLS 規劃

九張表全部 `ENABLE ROW LEVEL SECURITY`，且每張表：

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT ALL ON public.<table> TO service_role;
-- 不授予 anon

CREATE POLICY "own rows select" ON public.<table>
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rows insert" ON public.<table>
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows update" ON public.<table>
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows delete" ON public.<table>
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

本階段沒有公開內容，因此沒有任何 public / anon read policy。

---

## 5. LocalStorage → Backend mapping

| localStorage key | Backend table | 欄位對照 |
| --- | --- | --- |
| `idoldays.idols.v1` | idols | id→id、name→name、groupName→group_name、birthday→birthday、debutDate→debut_date、fanName→fan_name、favoriteColor→favorite_color、sinceDate→since_date、photo→photo（新增 user_id / created_at / updated_at） |
| `idoldays.events.v1` | events | id、idolId→idol_id、title、type、date、note、createdAt(number)→created_at(timestamptz) |
| `idoldays.milestones.v1` | milestones | id、eventId→event_id、title、date、emoji、completed、createdAt(number)→created_at |
| `idoldays.memoryFolders.v1` | memory_folders | id、idolId→idol_id、title、description、coverPhoto→cover_photo、startDate→start_date、endDate→end_date、createdAt(ISO)→created_at |
| `idoldays.memories.v1` | memories | id、folderId→folder_id、idolId→idol_id、title、date、note、photo、createdAt→created_at |
| `idoldays.reminders.v1` | reminders | id、eventId→event_id、idolId→idol_id、type、daysBefore→days_before、enabled、createdAt→created_at |
| `idoldays.heart.v1` | sugar_items | id、idolId→idol_id、title、date、type、note、link、image、createdAt→created_at |
| `idoldays.widget.preferences.v1` | widget_preferences | idolId→idol_id；enabledContents 陣列 → 五個 show_* 布林欄位 |
| `idoldays.settings.v1` | profiles | primaryIdolId→main_idol_id、dateFormat→date_format、language→language、theme→theme |

本機 id 目前可能不是 UUID（fallback 為 `idol_...` 這類字串），未來搬移時需重新產生 UUID 並保留 `legacy_id text` 對照欄位。

---

## 6. 需要未來 Storage / Push / Native 才能完成的欄位

- `idols.photo`、`memories.photo`、`memory_folders.cover_photo`、`sugar_items.image`：
  目前是 data URL，未來應改存 Supabase Storage 路徑（欄位型別不變，內容改為 object path）。
- `reminders`：目前只是設定資料，真正推播需要 push token 表與 Native/WidgetKit 支援，本階段不建立。
- `widget_preferences`：真正桌面小工具需 WidgetKit，目前僅供 `/widget` 預覽使用。

---

## 7. 驗收

1. 檢查過的檔案：見第 1 節。
2. 資料表清單、欄位、FK、刪除行為、RLS、mapping：見第 2–5 節。
3. TypeScript：未改任何程式碼，型別狀態不變。
4. Build：未改任何程式碼，建置不受影響。
5. 既有功能修改：**無**（未動 UI、BottomNav、Home、Widget、嗑糖、localStorage）。
6. Supabase / Lovable Cloud：本階段未建立、未重試。
