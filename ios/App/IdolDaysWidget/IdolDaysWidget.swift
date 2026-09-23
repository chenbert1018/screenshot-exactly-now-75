import WidgetKit
import SwiftUI
import UIKit


private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

struct IdolDaysEntry: TimelineEntry {
    let date: Date
    let idolName: String
    let eventTitle: String
    let dDay: String
    let eventDate: String
    let location: String
    let quote: String
    let moodEmoji: String
    let moodLabel: String
    let decorationEmoji: String
    let decorationLabel: String
    let songTitle: String
    let songArtist: String
    let enabledContents: [String]

    func enabled(_ type: String) -> Bool {
        enabledContents.contains(type)
    }
}

struct WidgetSnapshot: Codable {
    let version: Int
    let idolName: String
    let eventTitle: String
    let dDay: String
    let eventDate: String
    let location: String
    let quote: String

    let moodEmoji: String?
    let moodLabel: String?
    let decorationEmoji: String?
    let decorationLabel: String?
    let songTitle: String?
    let songArtist: String?
    let enabledContents: [String]?

    let updatedAt: String
}

struct IdolDaysProvider: TimelineProvider {

    private let appGroupID = "group.com.idoldays.app"

    private func parseEventDate(_ value: String) -> Date? {
        let raw = value.trimmed

        guard !raw.isEmpty else {
            return nil
        }

        let datePart = String(raw.prefix(10))

        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = Calendar.current.timeZone
        formatter.dateFormat = "yyyy-MM-dd"

        return formatter.date(from: datePart)
    }

    private func refreshedCountdown(
        eventDate: String,
        fallback: String,
        now: Date = Date()
    ) -> String {
        guard let target = parseEventDate(eventDate) else {
            return fallback
        }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)
        let eventDay = calendar.startOfDay(for: target)

        guard let days = calendar.dateComponents(
            [.day],
            from: today,
            to: eventDay
        ).day else {
            return fallback
        }

        if days < 0 {
            return ""
        }

        if days == 0 {
            return "今天見 ♡"
        }

        return "D-\(days)"
    }

    private func refreshedDecoration(
        eventDate: String,
        emoji: String,
        label: String,
        now: Date = Date()
    ) -> (emoji: String, label: String) {
        guard let target = parseEventDate(eventDate) else {
            return (emoji, label)
        }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)
        let eventDay = calendar.startOfDay(for: target)

        if eventDay < today {
            return ("", "")
        }

        return (emoji, label)
    }


    func placeholder(in context: Context) -> IdolDaysEntry {
        emptyEntry
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (IdolDaysEntry) -> Void
    ) {
        if context.isPreview {
            completion(emptyEntry)
        } else {
            completion(loadSharedEntry() ?? emptyEntry)
        }
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<IdolDaysEntry>) -> Void
    ) {
        let entry = loadSharedEntry() ?? emptyEntry

        let nextUpdate =
            Calendar.current.nextDate(
                after: Date(),
                matching: DateComponents(hour: 0, minute: 2),
                matchingPolicy: .nextTime
            )
            ?? Date().addingTimeInterval(86400)

        completion(
            Timeline(
                entries: [entry],
                policy: .after(nextUpdate)
            )
        )
    }

    private func loadSharedEntry() -> IdolDaysEntry? {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else {
            return nil
        }

        let snapshotURL =
            containerURL.appendingPathComponent(
                "widget-snapshot.json"
            )

        guard
            let data = try? Data(contentsOf: snapshotURL),
            let snapshot = try? JSONDecoder().decode(
                WidgetSnapshot.self,
                from: data
            ),
            !snapshot.idolName
                .trimmingCharacters(
                    in: .whitespacesAndNewlines
                )
                .isEmpty
        else {
            return nil
        }

        // 舊 snapshot 沒有 enabledContents 時，
        // 暫時視為全部顯示，確保向下相容。
        let enabled =
            snapshot.enabledContents
            ?? [
                "IDOL",
                "MESSAGE",
                "DECORATION",
                "MOOD",
                "COUNTDOWN"
            ]

        let now = Date()

        let countdown = refreshedCountdown(
            eventDate: snapshot.eventDate,
            fallback: snapshot.dDay,
            now: now
        )

        let decoration = refreshedDecoration(
            eventDate: snapshot.eventDate,
            emoji: snapshot.decorationEmoji ?? "",
            label: snapshot.decorationLabel ?? "",
            now: now
        )

        let eventHasPassed =
            parseEventDate(snapshot.eventDate)
                .map {
                    Calendar.current.startOfDay(for: $0)
                        < Calendar.current.startOfDay(for: now)
                }
            ?? false

        return IdolDaysEntry(
            date: now,
            idolName: snapshot.idolName,
            eventTitle: eventHasPassed ? "" : snapshot.eventTitle,
            dDay: countdown,
            eventDate: eventHasPassed ? "" : snapshot.eventDate,
            location: eventHasPassed ? "" : snapshot.location,
            quote: snapshot.quote,
            moodEmoji: snapshot.moodEmoji ?? "",
            moodLabel: snapshot.moodLabel ?? "",
            decorationEmoji: decoration.emoji,
            decorationLabel: decoration.label,
            songTitle: snapshot.songTitle ?? "",
            songArtist: snapshot.songArtist ?? "",
            enabledContents: enabled
        )
    }

    private var emptyEntry: IdolDaysEntry {
        IdolDaysEntry(
            date: Date(),
            idolName: "",
            eventTitle: "",
            dDay: "",
            eventDate: "",
            location: "",
            quote: "",
            moodEmoji: "",
            moodLabel: "",
            decorationEmoji: "",
            decorationLabel: "",
            songTitle: "",
            songArtist: "",
            enabledContents: [
                "IDOL",
                "MESSAGE",
                "DECORATION",
                "MOOD",
                "COUNTDOWN"
            ]
        )
    }
}

struct IdolDaysWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family

    let entry: IdolDaysEntry

    private let blush = Color(
        red: 0.98,
        green: 0.87,
        blue: 0.89
    )

    private let ink = Color(
        red: 0.10,
        green: 0.12,
        blue: 0.22
    )

    private var widgetTheme: String {
        UserDefaults(
            suiteName: "group.com.idoldays.app"
        )?.string(forKey: "widgetTheme") ?? "sky"
    }

    private var mediumBackgroundColors: [Color] {
        switch widgetTheme {
        case "dark":
            return [
                Color(red: 0.10, green: 0.12, blue: 0.18),
                Color(red: 0.16, green: 0.19, blue: 0.28)
            ]

        case "light":
            return [
                Color(red: 1.00, green: 0.95, blue: 0.94),
                Color(red: 0.98, green: 0.86, blue: 0.88)
            ]

        case "sky":
            return [
                Color(red: 0.91, green: 0.96, blue: 1.00),
                Color(red: 0.76, green: 0.88, blue: 0.98)
            ]

        default:
            return [
                Color(red: 0.91, green: 0.96, blue: 1.00),
                Color(red: 0.76, green: 0.88, blue: 0.98)
            ]
        }
    }

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                smallWidget

            case .systemMedium:
                mediumWidget

            case .systemLarge:
                largeWidget

            default:
                smallWidget
            }
        }
        .containerBackground(for: .widget) {
            Color.clear
        }
    }

    // MARK: - Small
    //
    // 設計稿：
    // 偶像照片滿版
    // 名字 / 活動 / D-Day 在右下
    //




    private var smallWidget: some View {
        ZStack {
            if entry.enabled("IDOL") {
                fullBleedPhoto(alignment: .top)
            } else {
                LinearGradient(
                    colors: mediumBackgroundColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }

            LinearGradient(
                colors: [
                    .clear,
                    .clear,
                    Color.black.opacity(0.10),
                    Color.black.opacity(0.78)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("IDOLDAYS")
                        .font(
                            .system(
                                size: 10,
                                weight: .bold,
                                design: .rounded
                            )
                        )
                        .tracking(1.6)
                        .foregroundStyle(.white.opacity(0.82))

                    Spacer()

                    if entry.enabled("DECORATION"),
                       !entry.decorationEmoji.trimmed.isEmpty {
                        Text(prettyDecorationEmoji)
                            .font(.system(size: 15))
                    }
                }

                Spacer()

                VStack(alignment: .leading, spacing: 3) {
                    if entry.enabled("IDOL"),
                       !entry.idolName.trimmed.isEmpty {
                        Text(entry.idolName.uppercased())
                            .font(
                                .system(
                                    size: 20,
                                    weight: .bold,
                                    design: .rounded
                                )
                            )
                            .tracking(-0.3)
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                    }

                    if entry.enabled("COUNTDOWN"),
                       !entry.dDay.trimmed.isEmpty {
                        Text(entry.dDay)
                            .font(
                                .system(
                                    size: 32,
                                    weight: .heavy,
                                    design: .rounded
                                )
                            )
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }

                    if entry.enabled("COUNTDOWN"),
                       !entry.eventTitle.trimmed.isEmpty {
                        Text(entry.eventTitle.uppercased())
                            .font(
                                .system(
                                    size: 8,
                                    weight: .semibold,
                                    design: .rounded
                                )
                            )
                            .tracking(0.5)
                            .foregroundStyle(.white.opacity(0.78))
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                    }

                    if hasSongOfDay {
                        HStack(spacing: 4) {
                            Image(systemName: "music.note")
                                .font(.system(size: 8, weight: .bold))

                            Text(entry.songTitle)
                                .lineLimit(1)
                        }
                        .font(
                            .system(
                                size: 10,
                                weight: .medium,
                                design: .rounded
                            )
                        )
                        .foregroundStyle(.white.opacity(0.88))
                        .padding(.top, 3)
                    }
                }
            }
            .padding(12)
        }
        .clipped()
    }

    // MARK: - Medium
    //
    // 設計稿：
    // 左約 52% 是偶像照片
    // 右邊粉色資訊區
    //




    private var mediumWidget: some View {
        GeometryReader { geo in
            ZStack {
                LinearGradient(
                    colors: mediumBackgroundColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                HStack(spacing: 0) {
                    ZStack(alignment: .bottomLeading) {
                        if entry.enabled("IDOL") {
                            photo(
                                width: geo.size.width * 0.58,
                                height: geo.size.height,
                                alignment: .top
                            )
                        } else {
                            Color.white.opacity(0.18)
                        }

                        LinearGradient(
                            colors: [
                                .clear,
                                Color.black.opacity(0.08),
                                Color.black.opacity(0.50)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )

                        if entry.enabled("IDOL"),
                           !entry.idolName.trimmed.isEmpty {
                            Text(entry.idolName.uppercased())
                                .font(
                                    .system(
                                        size: 17,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .tracking(0.2)
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.65)
                                .padding(12)
                        }
                    }
                    .frame(
                        width: geo.size.width * 0.58,
                        height: geo.size.height
                    )
                    .clipped()

                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("IDOLDAYS")
                                .font(
                                    .system(
                                        size: 10,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .tracking(1.5)
                                .foregroundStyle(ink.opacity(0.55))

                            Spacer()

                            Text("OUR DAYS")
                                .font(
                                    .system(
                                        size: 9,
                                        weight: .semibold,
                                        design: .rounded
                                    )
                                )
                                .tracking(0.8)
                                .foregroundStyle(ink.opacity(0.38))
                        }

                        Spacer(minLength: 3)

                        if entry.enabled("COUNTDOWN"),
                           !entry.dDay.trimmed.isEmpty {
                            Text(entry.dDay)
                                .font(
                                    .system(
                                        size: 30,
                                        weight: .heavy,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(ink)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.eventTitle.trimmed.isEmpty {
                            Text(entry.eventTitle.uppercased())
                                .font(
                                    .system(
                                        size: 12,
                                        weight: .semibold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(ink.opacity(0.80))
                                .lineLimit(2)
                                .minimumScaleFactor(0.7)
                                .padding(.top, 1)
                        }

                        Spacer(minLength: 4)

                        Rectangle()
                            .fill(ink.opacity(0.12))
                            .frame(height: 1)

                        VStack(alignment: .leading, spacing: 3) {
                            if entry.enabled("COUNTDOWN"),
                               !entry.eventDate.trimmed.isEmpty {
                                Label(
                                    entry.eventDate,
                                    systemImage: "calendar"
                                )
                            }

                            if entry.enabled("COUNTDOWN"),
                               !entry.location.trimmed.isEmpty {
                                Label(
                                    entry.location,
                                    systemImage: "mappin.and.ellipse"
                                )
                            }

                            if hasSongOfDay {
                                Label(
                                    entry.songTitle,
                                    systemImage: "music.note"
                                )
                            }
                        }
                        .font(
                            .system(
                                size: 10,
                                weight: .medium,
                                design: .rounded
                            )
                        )
                        .foregroundStyle(ink.opacity(0.67))
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                        .padding(.top, 5)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 11)
                    .frame(
                        width: geo.size.width * 0.42,
                        height: geo.size.height,
                        alignment: .leading
                    )
                }
            }
        }
        .clipped()
    }

    // MARK: - Large
    //
    // 設計稿：
    // 100% 大照片
    // 人物為主
    // 左下名字 / 活動
    // 右下 D-Day
    // 最底日期地點 + 每日一句
    //




    private var largeWidget: some View {
        ZStack {
            if entry.enabled("IDOL") {
                fullBleedPhoto(alignment: .top)
            } else {
                LinearGradient(
                    colors: mediumBackgroundColors,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }

            LinearGradient(
                colors: [
                    Color.black.opacity(0.08),
                    .clear,
                    .clear,
                    Color.black.opacity(0.82)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("IDOLDAYS")
                            .font(
                                .system(
                                    size: 12,
                                    weight: .bold,
                                    design: .rounded
                                )
                            )
                            .tracking(2)
                            .foregroundStyle(.white)

                        Text("FAN ARCHIVE")
                            .font(
                                .system(
                                    size: 9,
                                    weight: .semibold,
                                    design: .rounded
                                )
                            )
                            .tracking(1.4)
                            .foregroundStyle(.white.opacity(0.62))
                    }

                    Spacer()

                    if entry.enabled("DECORATION"),
                       !entry.decorationEmoji.trimmed.isEmpty {
                        Text(prettyDecorationEmoji)
                            .font(.system(size: 19))
                    }
                }

                Spacer()

                VStack(alignment: .leading, spacing: 7) {
                    HStack(alignment: .bottom, spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            if entry.enabled("IDOL"),
                               !entry.idolName.trimmed.isEmpty {
                                Text(entry.idolName.uppercased())
                                    .font(
                                        .system(
                                            size: 28,
                                            weight: .bold,
                                            design: .rounded
                                        )
                                    )
                                    .tracking(-0.4)
                                    .foregroundStyle(.white)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.65)
                            }

                            if entry.enabled("COUNTDOWN"),
                               !entry.eventTitle.trimmed.isEmpty {
                                Text(entry.eventTitle.uppercased())
                                    .font(
                                        .system(
                                            size: 13,
                                            weight: .semibold,
                                            design: .rounded
                                        )
                                    )
                                    .tracking(0.3)
                                    .foregroundStyle(.white.opacity(0.78))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.65)
                            }
                        }

                        Spacer()

                        if entry.enabled("COUNTDOWN"),
                           !entry.dDay.trimmed.isEmpty {
                            Text(entry.dDay)
                                .font(
                                    .system(
                                        size: 38,
                                        weight: .heavy,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.65)
                        }
                    }

                    Rectangle()
                        .fill(.white.opacity(0.28))
                        .frame(height: 1)

                    HStack(spacing: 13) {
                        if entry.enabled("COUNTDOWN"),
                           !entry.eventDate.trimmed.isEmpty {
                            Label(
                                entry.eventDate,
                                systemImage: "calendar"
                            )
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.location.trimmed.isEmpty {
                            Label(
                                entry.location,
                                systemImage: "mappin.and.ellipse"
                            )
                        }
                    }
                    .font(
                        .system(
                            size: 12,
                            weight: .medium,
                            design: .rounded
                        )
                    )
                    .foregroundStyle(.white.opacity(0.78))
                    .lineLimit(1)

                    HStack(spacing: 8) {
                        if hasSongOfDay {
                            HStack(spacing: 4) {
                                Image(systemName: "music.note")
                                Text(entry.songTitle)
                                    .lineLimit(1)
                            }
                        }

                        if entry.enabled("MOOD"),
                           !entry.moodLabel.trimmed.isEmpty {
                            Text("·")
                                .opacity(0.45)

                            Text(entry.moodEmoji)

                            Text(entry.moodLabel)
                                .lineLimit(1)
                        }
                    }
                    .font(
                        .system(
                            size: 12,
                            weight: .medium,
                            design: .rounded
                        )
                    )
                    .foregroundStyle(.white.opacity(0.86))

                    if entry.enabled("MESSAGE"),
                       !entry.quote.trimmed.isEmpty {
                        Text("「\(entry.quote)」")
                            .font(
                                .system(
                                    size: 12,
                                    weight: .medium,
                                    design: .rounded
                                )
                            )
                            .foregroundStyle(.white.opacity(0.72))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                }
            }
            .padding(17)
        }
        .clipped()
    }

    // MARK: - Pretty Decoration

    private var prettyDecorationEmoji: String {
        let label = entry.decorationLabel.lowercased()
        let emoji = entry.decorationEmoji

        if label.contains("生日") {
            return "🎂"
        }

        if label.contains("見面")
            || label.contains("concert")
            || label.contains("演唱會") {
            return "🎫"
        }

        if label.contains("回歸")
            || label.contains("舞台") {
            return "✨"
        }

        if label.contains("紀念") {
            return "💝"
        }

        if emoji == "✦"
            || emoji == "★"
            || emoji == "☆" {
            return "✨"
        }

        return emoji.isEmpty ? "💗" : emoji
    }

    private var hasSongOfDay: Bool {
        entry.enabled("SONG") && !entry.songTitle.trimmed.isEmpty
    }

    @ViewBuilder
    private func songOfDayLine(compact: Bool) -> some View {
        HStack(spacing: compact ? 4 : 6) {
            Image(systemName: "music.note")
                .font(.system(size: compact ? 10 : 13, weight: .bold))

            Text(entry.songTitle)
                .lineLimit(1)

            if !entry.songArtist.trimmed.isEmpty {
                Text("· \(entry.songArtist)")
                    .lineLimit(1)
                    .opacity(0.78)
            }
        }
        .font(
            .system(
                size: compact ? 9 : 12,
                weight: .semibold,
                design: .rounded
            )
        )
        .foregroundStyle(.white)
        .padding(.horizontal, compact ? 7 : 10)
        .padding(.vertical, compact ? 4 : 6)
        .background(.black.opacity(compact ? 0.22 : 0.20))
        .clipShape(
            Capsule()
        )
    }

    // MARK: - Shared Photo

    @ViewBuilder
    private func fullBleedPhoto(
        alignment: Alignment
    ) -> some View {
        GeometryReader { geo in
            photo(
                width: geo.size.width,
                height: geo.size.height,
                alignment: alignment
            )
        }
    }

    @ViewBuilder
    private func photo(
        width: CGFloat,
        height: CGFloat,
        alignment: Alignment
    ) -> some View {
        if let image = loadSharedIdolImage() {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(
                    width: width,
                    height: height,
                    alignment: alignment
                )
                .clipped()
        } else {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(
                            red: 0.96,
                            green: 0.91,
                            blue: 0.95
                        ),
                        Color(
                            red: 0.88,
                            green: 0.91,
                            blue: 0.98
                        )
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                VStack(spacing: 6) {
                    Text("IDOLDAYS")
                        .font(
                            .system(
                                size: 12,
                                weight: .bold,
                                design: .rounded
                            )
                        )
                        .tracking(1.8)

                    Text("在 App 選擇偶像與照片")
                        .font(
                            .system(
                                size: 10,
                                weight: .medium,
                                design: .rounded
                            )
                        )
                        .opacity(0.65)
                }
                .foregroundStyle(.white)
            }
            .frame(
                width: width,
                height: height
            )
        }
    }

    private func loadSharedIdolImage() -> UIImage? {
        let appGroupID = "group.com.idoldays.app"

        guard let containerURL =
                FileManager.default.containerURL(
                    forSecurityApplicationGroupIdentifier:
                        appGroupID
                )
        else {
            return nil
        }

        let imageURL =
            containerURL.appendingPathComponent(
                "idol-photo.jpg"
            )

        guard
            let data = try? Data(
                contentsOf: imageURL
            ),
            let image = UIImage(data: data)
        else {
            return nil
        }

        return image
    }
}

struct IdolDaysWidget: Widget {

    let kind: String = "IdolDaysWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: IdolDaysProvider()
        ) { entry in
            IdolDaysWidgetEntryView(
                entry: entry
            )
        }
        .configurationDisplayName("IdolDays")
        .description(
            "把喜歡的偶像與重要日子放在你的主畫面。"
        )
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge
        ])
        .contentMarginsDisabled()
    }
}
