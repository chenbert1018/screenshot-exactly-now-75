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
    let enabledContents: [String]?

    let updatedAt: String
}

struct IdolDaysProvider: TimelineProvider {

    private let appGroupID = "group.com.idoldays.app"

    func placeholder(in context: Context) -> IdolDaysEntry {
        mockEntry
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (IdolDaysEntry) -> Void
    ) {
        if context.isPreview {
            completion(mockEntry)
        } else {
            completion(loadSharedEntry() ?? mockEntry)
        }
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<IdolDaysEntry>) -> Void
    ) {
        let entry = loadSharedEntry() ?? mockEntry

        let nextUpdate =
            Calendar.current.nextDate(
                after: Date(),
                matching: DateComponents(hour: 0, minute: 5),
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

        return IdolDaysEntry(
            date: Date(),
            idolName: snapshot.idolName,
            eventTitle: snapshot.eventTitle,
            dDay: snapshot.dDay,
            eventDate: snapshot.eventDate,
            location: snapshot.location,
            quote: snapshot.quote,
            moodEmoji: snapshot.moodEmoji ?? "",
            moodLabel: snapshot.moodLabel ?? "",
            decorationEmoji: snapshot.decorationEmoji ?? "",
            decorationLabel: snapshot.decorationLabel ?? "",
            enabledContents: enabled
        )
    }

    private var mockEntry: IdolDaysEntry {
        IdolDaysEntry(
            date: Date(),
            idolName: "JENNIE",
            eventTitle: "DEADLINE WORLD TOUR",
            dDay: "D-12",
            eventDate: "SEP 21 · 19:30",
            location: "Taipei Arena",
            quote: "今天也離見面的那一天更近了一點 ♡",
            moodEmoji: "♡",
            moodLabel: "今天值得開心",
            decorationEmoji: "✦",
            decorationLabel: "平常的一天，也很好",
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
                fullBleedPhoto(
                    alignment: .top
                )
            } else {
                blush
            }

            LinearGradient(
                colors: [
                    .clear,
                    .clear,
                    Color.black.opacity(0.08),
                    Color.black.opacity(0.72)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack {
                if entry.enabled("DECORATION") {
                    HStack {
                        Spacer()

                        Text(
                            entry.decorationEmoji.trimmed.isEmpty
                                ? "♡"
                                : entry.decorationEmoji
                        )
                        .font(.system(size: 22))
                        .foregroundStyle(.white)
                        .shadow(
                            color: .black.opacity(0.25),
                            radius: 3
                        )
                    }
                }

                Spacer()

                HStack(
                    alignment: .bottom,
                    spacing: 5
                ) {
                    Spacer(minLength: 0)

                    VStack(
                        alignment: .trailing,
                        spacing: 1
                    ) {
                        if entry.enabled("IDOL"),
                           !entry.idolName.trimmed.isEmpty {
                            Text(entry.idolName.uppercased())
                                .font(
                                    .system(
                                        size: 19,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.eventTitle.trimmed.isEmpty {
                            Text(entry.eventTitle.uppercased())
                                .font(
                                    .system(
                                        size: 10,
                                        weight: .semibold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(
                                    .white.opacity(0.92)
                                )
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.dDay.trimmed.isEmpty {
                            Text(entry.dDay)
                                .font(
                                    .system(
                                        size: 26,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(
                                    Color(
                                        red: 1.0,
                                        green: 0.68,
                                        blue: 0.77
                                    )
                                )
                                .lineLimit(1)
                        }
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
            HStack(spacing: 0) {
                ZStack {
                    if entry.enabled("IDOL") {
                        photo(
                            width: geo.size.width * 0.52,
                            height: geo.size.height,
                            alignment: .top
                        )
                    } else {
                        blush.opacity(0.55)
                    }
                }
                .frame(
                    width: geo.size.width * 0.52,
                    height: geo.size.height
                )
                .clipped()

                ZStack {
                    LinearGradient(
                        colors: [
                            Color(
                                red: 1.00,
                                green: 0.91,
                                blue: 0.91
                            ),
                            Color(
                                red: 0.98,
                                green: 0.79,
                                blue: 0.84
                            )
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )

                    VStack(
                        alignment: .leading,
                        spacing: 5
                    ) {
                        Spacer(minLength: 0)

                        if entry.enabled("IDOL"),
                           !entry.idolName.trimmed.isEmpty {
                            Text(entry.idolName.uppercased())
                                .font(
                                    .system(
                                        size: 19,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(ink)
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.eventTitle.trimmed.isEmpty {
                            Text(entry.eventTitle.uppercased())
                                .font(
                                    .system(
                                        size: 12,
                                        weight: .medium,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(ink)
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.dDay.trimmed.isEmpty {
                            Text(entry.dDay)
                                .font(
                                    .system(
                                        size: 32,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(
                                    Color(
                                        red: 0.72,
                                        green: 0.36,
                                        blue: 0.46
                                    )
                                )
                                .lineLimit(1)
                        }

                        Spacer(minLength: 2)

                        if entry.enabled("COUNTDOWN"),
                           !entry.eventDate.trimmed.isEmpty {
                            HStack(spacing: 5) {
                                Text("🗓️")
                                    .font(.system(size: 14))
                                Text(entry.eventDate)
                            }
                            .font(
                                .system(
                                    size: 10,
                                    weight: .medium
                                )
                            )
                            .foregroundStyle(ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        }

                        if entry.enabled("COUNTDOWN"),
                           !entry.location.trimmed.isEmpty {
                            HStack(spacing: 5) {
                                Text("📍")
                                    .font(.system(size: 14))
                                Text(entry.location)
                            }
                            .font(
                                .system(
                                    size: 10,
                                    weight: .medium
                                )
                            )
                            .foregroundStyle(ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        }

                        if entry.enabled("DECORATION"),
                           (
                               !entry.decorationEmoji.trimmed.isEmpty
                               || !entry.decorationLabel.trimmed.isEmpty
                           ) {
                            HStack(spacing: 3) {
                                Text(entry.decorationEmoji)

                                Text(entry.decorationLabel)
                                    .lineLimit(1)
                            }
                            .font(
                                .system(
                                    size: 9,
                                    weight: .medium,
                                    design: .rounded
                                )
                            )
                            .foregroundStyle(
                                Color(
                                    red: 0.76,
                                    green: 0.42,
                                    blue: 0.54
                                )
                            )
                        }

                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .frame(
                        maxWidth: .infinity,
                        maxHeight: .infinity,
                        alignment: .leading
                    )
                }
                .frame(
                    width: geo.size.width * 0.48,
                    height: geo.size.height
                )
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
                fullBleedPhoto(
                    alignment: .top
                )
            } else {
                blush
            }

            LinearGradient(
                colors: [
                    .clear,
                    .clear,
                    Color.black.opacity(0.10),
                    Color.black.opacity(0.70)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(spacing: 0) {
                if entry.enabled("DECORATION"),
                   (
                       !entry.decorationEmoji.trimmed.isEmpty
                       || !entry.decorationLabel.trimmed.isEmpty
                   ) {
                    HStack(spacing: 8) {
                        if !entry.decorationEmoji.trimmed.isEmpty {
                            Text(prettyDecorationEmoji)
                                .font(.system(size: 30))
                                .shadow(
                                    color: Color.pink.opacity(0.35),
                                    radius: 5,
                                    x: 0,
                                    y: 2
                                )
                        }

                        if !entry.decorationLabel.trimmed.isEmpty {
                            Text(entry.decorationLabel)
                                .font(
                                    .system(
                                        size: 14,
                                        weight: .semibold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(.white)
                                .shadow(
                                    color: .black.opacity(0.28),
                                    radius: 3,
                                    x: 0,
                                    y: 1
                                )
                                .lineLimit(1)
                        }

                        Spacer()
                    }
                    .padding(.top, 17)
                    .padding(.horizontal, 18)
                }

                Spacer()

                VStack(
                    alignment: .leading,
                    spacing: 8
                ) {
                    HStack(
                        alignment: .bottom
                    ) {
                        VStack(
                            alignment: .leading,
                            spacing: 2
                        ) {
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
                                    .foregroundStyle(.white)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.65)
                            }

                            if entry.enabled("COUNTDOWN"),
                               !entry.eventTitle.trimmed.isEmpty {
                                Text(entry.eventTitle.uppercased())
                                    .font(
                                        .system(
                                            size: 15,
                                            weight: .medium,
                                            design: .rounded
                                        )
                                    )
                                    .foregroundStyle(
                                        .white.opacity(0.94)
                                    )
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
                                        size: 46,
                                        weight: .bold,
                                        design: .rounded
                                    )
                                )
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.65)
                        }
                    }

                    if entry.enabled("COUNTDOWN"),
                       (
                           !entry.eventDate.trimmed.isEmpty
                           || !entry.location.trimmed.isEmpty
                       ) {
                        HStack(spacing: 12) {
                            if !entry.eventDate.trimmed.isEmpty {
                                Label(
                                    entry.eventDate,
                                    systemImage: "calendar"
                                )
                            }

                            if !entry.location.trimmed.isEmpty {
                                Label(
                                    entry.location,
                                    systemImage: "mappin"
                                )
                            }
                        }
                        .font(
                            .system(
                                size: 12,
                                weight: .medium
                            )
                        )
                        .foregroundStyle(
                            .white.opacity(0.92)
                        )
                        .lineLimit(1)
                    }

                    if entry.enabled("MOOD"),
                       (
                           !entry.moodEmoji.trimmed.isEmpty
                           || !entry.moodLabel.trimmed.isEmpty
                       ) {
                        HStack(spacing: 4) {
                            Text(entry.moodEmoji)
                            Text(entry.moodLabel)
                        }
                        .font(
                            .system(
                                size: 12,
                                weight: .medium,
                                design: .rounded
                            )
                        )
                        .foregroundStyle(
                            .white.opacity(0.90)
                        )
                    }

                    if entry.enabled("MESSAGE"),
                       !entry.quote.trimmed.isEmpty {
                        HStack(spacing: 7) {
                            Text("💌")
                                .font(.system(size: 17))

                            Text("「\(entry.quote)」")
                                .lineLimit(1)
                                .minimumScaleFactor(0.68)
                        }
                            .font(
                                .system(
                                    size: 13,
                                    weight: .medium,
                                    design: .rounded
                                )
                            )
                            .foregroundStyle(.white)
                            .frame(
                                maxWidth: .infinity,
                                alignment: .leading
                            )
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(
                                .ultraThinMaterial.opacity(0.78)
                            )
                            .clipShape(
                                RoundedRectangle(
                                    cornerRadius: 13,
                                    style: .continuous
                                )
                            )
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 14)
            }
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
                            red: 0.98,
                            green: 0.82,
                            blue: 0.87
                        ),
                        Color(
                            red: 0.90,
                            green: 0.79,
                            blue: 0.95
                        )
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                Image(systemName: "person.fill")
                    .font(
                        .system(
                            size: min(width, height) * 0.38
                        )
                    )
                    .foregroundStyle(
                        .white.opacity(0.75)
                    )
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

#Preview("Small", as: .systemSmall) {
    IdolDaysWidget()
} timeline: {
    previewEntry
}

#Preview("Medium", as: .systemMedium) {
    IdolDaysWidget()
} timeline: {
    previewEntry
}

#Preview("Large", as: .systemLarge) {
    IdolDaysWidget()
} timeline: {
    previewEntry
}

private let previewEntry = IdolDaysEntry(
    date: .now,
    idolName: "JENNIE",
    eventTitle: "DEADLINE WORLD TOUR",
    dDay: "D-12",
    eventDate: "SEP 21 · 19:30",
    location: "Taipei Arena",
    quote: "今天也離見面的那一天更近了一點 ♡",
    moodEmoji: "♡",
    moodLabel: "今天值得開心",
    decorationEmoji: "✦",
    decorationLabel: "平常的一天，也很好",
    enabledContents: [
        "IDOL",
        "MESSAGE",
        "DECORATION",
        "MOOD",
        "COUNTDOWN"
    ]
)
