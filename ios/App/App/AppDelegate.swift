import UIKit
import Capacitor
import WidgetKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        runWidgetBridgeDiagnostics()

        return true
    }

    private func runWidgetBridgeDiagnostics() {
        let appGroupID = "group.com.idoldays.app"

        var log: [String] = []

        log.append("WIDGET_BRIDGE_START")
        log.append("DATE=\(Date())")

        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else {
            log.append("APP_GROUP_FOUND=NO")
            log.append("RESULT=FAILED_APP_GROUP")
            printLog(log)
            return
        }

        log.append("APP_GROUP_FOUND=YES")
        log.append("APP_GROUP_PATH=\(containerURL.path)")

        guard let image = UIImage(named: "WidgetTestPhoto") else {
            log.append("PHOTO_FOUND=NO")
            log.append("RESULT=FAILED_PHOTO_NOT_FOUND")

            writeLog(
                log,
                to: containerURL
            )

            printLog(log)
            return
        }

        log.append("PHOTO_FOUND=YES")
        log.append(
            "PHOTO_SIZE=\(Int(image.size.width))x\(Int(image.size.height))"
        )

        guard let imageData = image.jpegData(
            compressionQuality: 0.9
        ) else {
            log.append("JPEG_CREATED=NO")
            log.append("RESULT=FAILED_JPEG")

            writeLog(
                log,
                to: containerURL
            )

            printLog(log)
            return
        }

        log.append("JPEG_CREATED=YES")
        log.append("PHOTO_BYTES=\(imageData.count)")

        let imageURL =
            containerURL.appendingPathComponent("idol-photo.jpg")

        do {
            try imageData.write(
                to: imageURL,
                options: .atomic
            )

            log.append("PHOTO_WRITTEN=YES")
            log.append("PHOTO_PATH=\(imageURL.path)")

        } catch {
            log.append("PHOTO_WRITTEN=NO")
            log.append(
                "PHOTO_WRITE_ERROR=\(error.localizedDescription)"
            )
            log.append("RESULT=FAILED_WRITE")

            writeLog(
                log,
                to: containerURL
            )

            printLog(log)
            return
        }

        if FileManager.default.fileExists(
            atPath: imageURL.path
        ) {
            log.append("PHOTO_FILE_EXISTS=YES")
        } else {
            log.append("PHOTO_FILE_EXISTS=NO")
        }

        if
            let savedData = try? Data(contentsOf: imageURL),
            UIImage(data: savedData) != nil
        {
            log.append("PHOTO_CAN_READ_BACK=YES")
        } else {
            log.append("PHOTO_CAN_READ_BACK=NO")
        }

        log.append("RESULT=SUCCESS")

        writeLog(
            log,
            to: containerURL
        )

        printLog(log)

        WidgetCenter.shared.reloadTimelines(
            ofKind: "IdolDaysWidget"
        )

        WidgetCenter.shared.reloadAllTimelines()
    }

    private func writeLog(
        _ log: [String],
        to containerURL: URL
    ) {

        let text = log.joined(
            separator: "\n"
        )

        let fileURL =
            containerURL.appendingPathComponent(
                "widget-diagnostics.txt"
            )

        do {
            try text.write(
                to: fileURL,
                atomically: true,
                encoding: .utf8
            )

            print(
                "✅ widget-diagnostics.txt written:",
                fileURL.path
            )

        } catch {
            print(
                "❌ diagnostics write failed:",
                error.localizedDescription
            )
        }
    }

    private func printLog(
        _ log: [String]
    ) {

        print("")
        print("==============================")
        print("IDOLDAYS WIDGET BRIDGE")
        print("==============================")

        for line in log {
            print(line)
        }

        print("==============================")
        print("")
    }

    func applicationWillResignActive(
        _ application: UIApplication
    ) {
    }

    func applicationDidEnterBackground(
        _ application: UIApplication
    ) {
    }

    func applicationWillEnterForeground(
        _ application: UIApplication
    ) {
    }

    func applicationDidBecomeActive(
        _ application: UIApplication
    ) {
    }

    func applicationWillTerminate(
        _ application: UIApplication
    ) {
    }

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {

        return ApplicationDelegateProxy.shared.application(
            app,
            open: url,
            options: options
        )
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {

        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}
