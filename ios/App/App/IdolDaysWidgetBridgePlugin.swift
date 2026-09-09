import Foundation
import Capacitor
import WidgetKit
import UIKit

@objc(IdolDaysWidgetBridgePlugin)
public class IdolDaysWidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "IdolDaysWidgetBridgePlugin"
    public let jsName = "IdolDaysWidgetBridge"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidget", returnType: CAPPluginReturnPromise)
    ]

    private let appGroupID = "group.com.idoldays.app"
    private let widgetKind = "IdolDaysWidget"

    @objc func updateWidget(_ call: CAPPluginCall) {

        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else {
            call.reject("Unable to access IdolDays App Group")
            return
        }

        let idolName = call.getString("idolName") ?? ""
        let eventTitle = call.getString("eventTitle") ?? ""
        let dDay = call.getString("dDay") ?? ""
        let eventDate = call.getString("eventDate") ?? ""
        let location = call.getString("location") ?? ""
        let quote = call.getString("quote") ?? ""
        let moodEmoji = call.getString("moodEmoji") ?? ""
        let moodLabel = call.getString("moodLabel") ?? ""
        let decorationEmoji = call.getString("decorationEmoji") ?? ""
        let decorationLabel = call.getString("decorationLabel") ?? ""
        let enabledContents = call.getArray("enabledContents", String.self) ?? []

        guard !idolName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("idolName is required")
            return
        }

        let snapshot: [String: Any] = [
            "version": 1,
            "idolName": idolName,
            "eventTitle": eventTitle,
            "dDay": dDay,
            "eventDate": eventDate,
            "location": location,
            "quote": quote,
            "moodEmoji": moodEmoji,
            "moodLabel": moodLabel,
            "decorationEmoji": decorationEmoji,
            "decorationLabel": decorationLabel,
            "enabledContents": enabledContents,
            "updatedAt": ISO8601DateFormatter().string(from: Date())
        ]

        do {
            let data = try JSONSerialization.data(
                withJSONObject: snapshot,
                options: [.prettyPrinted, .sortedKeys]
            )

            let snapshotURL = containerURL
                .appendingPathComponent("widget-snapshot.json")

            try data.write(
                to: snapshotURL,
                options: .atomic
            )

            if let imageDataString = call.getString("imageData"),
               !imageDataString.isEmpty {
                try writeImage(
                    imageDataString,
                    containerURL: containerURL
                )
            }

            WidgetCenter.shared.reloadTimelines(
                ofKind: widgetKind
            )

            call.resolve([
                "success": true,
                "snapshotPath": snapshotURL.path
            ])

        } catch {
            call.reject(
                "Failed to update IdolDays Widget: \(error.localizedDescription)"
            )
        }
    }

    private func writeImage(
        _ input: String,
        containerURL: URL
    ) throws {

        var base64 = input

        if let commaIndex = base64.firstIndex(of: ","),
           base64.hasPrefix("data:") {
            base64 = String(
                base64[base64.index(after: commaIndex)...]
            )
        }

        guard let data = Data(
            base64Encoded: base64,
            options: .ignoreUnknownCharacters
        ),
        let image = UIImage(data: data),
        let jpeg = image.jpegData(compressionQuality: 0.9)
        else {
            throw NSError(
                domain: "IdolDaysWidgetBridge",
                code: 1,
                userInfo: [
                    NSLocalizedDescriptionKey:
                        "Invalid idol image data"
                ]
            )
        }

        let imageURL = containerURL
            .appendingPathComponent("idol-photo.jpg")

        try jpeg.write(
            to: imageURL,
            options: .atomic
        )
    }
}
