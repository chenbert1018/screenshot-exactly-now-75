import WidgetKit
import SwiftUI
import UIKit

struct IdolDaysEntry: TimelineEntry {
    let date: Date
    let idolName: String
    let eventTitle: String
    let dDay: String
    let eventDate: String
    let location: String
    let quote: String
}

struct IdolDaysProvider: TimelineProvider {

    func placeholder(in context: Context) -> IdolDaysEntry {
        mockEntry
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (IdolDaysEntry) -> Void
    ) {
        completion(mockEntry)
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<IdolDaysEntry>) -> Void
    ) {
        let nextUpdate =
            Calendar.current.nextDate(
                after: Date(),
                matching: DateComponents(hour: 0, minute: 5),
                matchingPolicy: .nextTime
            )
            ?? Date().addingTimeInterval(86400)

        let timeline = Timeline(
            entries: [mockEntry],
            policy: .after(nextUpdate)
        )

        completion(timeline)
    }

    private var mockEntry: IdolDaysEntry {
        IdolDaysEntry(
            date: Date(),
            idolName: "JENNIE",
            eventTitle: "DEADLINE WORLD TOUR",
            dDay: "D-12",
            eventDate: "SEP 21 · 19:30",
            location: "Taipei Arena",
            quote: "今天也離見面的那一天更近了一點 ♡"
        )
    }
}

struct IdolDaysWidgetEntryView: View {

    @Environment(\.widgetFamily) private var family

    let entry: IdolDaysEntry

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
            LinearGradient(
                colors: [
                    Color(red: 1.00, green: 0.92, blue: 0.95),
                    Color(red: 0.96, green: 0.90, blue: 1.00)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var smallWidget: some View {
        ZStack(alignment: .topTrailing) {

            decorativeStars

            VStack(alignment: .leading, spacing: 7) {

                HStack(spacing: 8) {

                    idolAvatar(size: 42)

                    VStack(alignment: .leading, spacing: 1) {

                        Text(entry.idolName)
                            .font(
                                .system(
                                    size: 14,
                                    weight: .bold,
                                    design: .rounded
                                )
                            )
                            .lineLimit(1)

                        Text("MY IDOL")
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundStyle(.secondary)
                            .tracking(1)
                    }
                }

                Spacer(minLength: 2)

                Text(entry.eventTitle)
                    .font(
                        .system(
                            size: 11,
                            weight: .semibold,
                            design: .rounded
                        )
                    )
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Text(entry.dDay)
                    .font(
                        .system(
                            size: 34,
                            weight: .black,
                            design: .rounded
                        )
                    )
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)

                Text(entry.eventDate)
                    .font(
                        .system(
                            size: 9,
                            weight: .medium,
                            design: .rounded
                        )
                    )
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(
                maxWidth: .infinity,
                maxHeight: .infinity,
                alignment: .leading
            )
        }
    }

    private var mediumWidget: some View {
        HStack(spacing: 14) {

            VStack(spacing: 6) {

                idolAvatar(size: 92)

                Text(entry.idolName)
                    .font(
                        .system(
                            size: 15,
                            weight: .bold,
                            design: .rounded
                        )
                    )
                    .lineLimit(1)
            }
            .frame(width: 100)

            VStack(alignment: .leading, spacing: 6) {

                Text("NEXT MOMENT")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(1.3)

                Text(entry.eventTitle)
                    .font(
                        .system(
                            size: 15,
                            weight: .bold,
                            design: .rounded
                        )
                    )
                    .lineLimit(2)

                Text(entry.dDay)
                    .font(
                        .system(
                            size: 36,
                            weight: .black,
                            design: .rounded
                        )
                    )
                    .lineLimit(1)

                Spacer(minLength: 0)

                Label(
                    entry.eventDate,
                    systemImage: "calendar"
                )
                .font(.system(size: 10, weight: .medium))

                Label(
                    entry.location,
                    systemImage: "mappin.and.ellipse"
                )
                .font(.system(size: 10, weight: .medium))
                .lineLimit(1)
            }

            Spacer(minLength: 0)
        }
    }

    private var largeWidget: some View {
        VStack(alignment: .leading, spacing: 12) {

            HStack(alignment: .top) {

                idolAvatar(size: 108)

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {

                    Text(entry.dDay)
                        .font(
                            .system(
                                size: 42,
                                weight: .black,
                                design: .rounded
                            )
                        )

                    Text("UNTIL WE MEET")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(.secondary)
                        .tracking(1.2)
                }
            }

            VStack(alignment: .leading, spacing: 3) {

                Text(entry.idolName)
                    .font(
                        .system(
                            size: 23,
                            weight: .black,
                            design: .rounded
                        )
                    )

                Text(entry.eventTitle)
                    .font(
                        .system(
                            size: 16,
                            weight: .bold,
                            design: .rounded
                        )
                    )
                    .lineLimit(2)
            }

            HStack(spacing: 16) {

                Label(
                    entry.eventDate,
                    systemImage: "calendar"
                )

                Label(
                    entry.location,
                    systemImage: "mappin.and.ellipse"
                )
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(.secondary)

            Spacer()

            HStack(alignment: .top, spacing: 8) {

                Image(systemName: "quote.opening")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.pink)

                Text(entry.quote)
                    .font(
                        .system(
                            size: 13,
                            weight: .semibold,
                            design: .rounded
                        )
                    )
                    .lineLimit(3)
            }
            .padding(12)
            .background(
                Color.white.opacity(0.45),
                in: RoundedRectangle(cornerRadius: 16)
            )
        }
    }

    @ViewBuilder
    private func idolAvatar(size: CGFloat) -> some View {

        if let image = loadSharedIdolImage() {

            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(
                    width: size,
                    height: size
                )
                .clipped()
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: size * 0.28
                    )
                )
                .overlay(
                    RoundedRectangle(
                        cornerRadius: size * 0.28
                    )
                    .stroke(
                        Color.white.opacity(0.65),
                        lineWidth: 1.5
                    )
                )
                .shadow(
                    color: Color.black.opacity(0.08),
                    radius: 5,
                    x: 0,
                    y: 3
                )

        } else {

            ZStack {

                LinearGradient(
                    colors: [
                        Color.pink.opacity(0.75),
                        Color.purple.opacity(0.65)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                Image(systemName: "person.fill")
                    .font(
                        .system(
                            size: size * 0.46,
                            weight: .medium
                        )
                    )
                    .foregroundStyle(.white.opacity(0.92))
                    .offset(y: size * 0.07)
            }
            .frame(
                width: size,
                height: size
            )
            .clipShape(
                RoundedRectangle(
                    cornerRadius: size * 0.28
                )
            )
        }
    }

    private func loadSharedIdolImage() -> UIImage? {
        let appGroupID = "group.com.idoldays.app"

        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else {
            return nil
        }

        let imageURL =
            containerURL.appendingPathComponent("idol-photo.jpg")

        guard
            let data = try? Data(contentsOf: imageURL),
            let image = UIImage(data: data)
        else {
            return nil
        }

        return image
    }

    private var decorativeStars: some View {
        HStack(spacing: 5) {
            Image(systemName: "sparkle")
            Image(systemName: "heart.fill")
        }
        .font(.system(size: 8))
        .foregroundStyle(.pink.opacity(0.65))
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
        .description("把與偶像見面的倒數日放在你的主畫面。")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge
        ])
    }
}

#Preview("Small", as: .systemSmall) {
    IdolDaysWidget()
} timeline: {
    IdolDaysEntry(
        date: .now,
        idolName: "JENNIE",
        eventTitle: "DEADLINE WORLD TOUR",
        dDay: "D-12",
        eventDate: "SEP 21 · 19:30",
        location: "Taipei Arena",
        quote: "今天也離見面的那一天更近了一點 ♡"
    )
}

#Preview("Medium", as: .systemMedium) {
    IdolDaysWidget()
} timeline: {
    IdolDaysEntry(
        date: .now,
        idolName: "JENNIE",
        eventTitle: "DEADLINE WORLD TOUR",
        dDay: "D-12",
        eventDate: "SEP 21 · 19:30",
        location: "Taipei Arena",
        quote: "今天也離見面的那一天更近了一點 ♡"
    )
}

#Preview("Large", as: .systemLarge) {
    IdolDaysWidget()
} timeline: {
    IdolDaysEntry(
        date: .now,
        idolName: "JENNIE",
        eventTitle: "DEADLINE WORLD TOUR",
        dDay: "D-12",
        eventDate: "SEP 21 · 19:30",
        location: "Taipei Arena",
        quote: "今天也離見面的那一天更近了一點 ♡"
    )
}
