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

        registerIdolDaysWidgetBridge()

        return true
    }

    private func registerIdolDaysWidgetBridge(
        attempt: Int = 0
    ) {
        DispatchQueue.main.asyncAfter(
            deadline: .now() + (attempt == 0 ? 0.1 : 0.25)
        ) { [weak self] in
            guard let self else {
                return
            }

            guard
                let bridgeViewController =
                    self.window?.rootViewController
                        as? CAPBridgeViewController,
                let bridge = bridgeViewController.bridge
            else {
                if attempt < 12 {
                    self.registerIdolDaysWidgetBridge(
                        attempt: attempt + 1
                    )
                } else {
                    print(
                        "❌ IdolDaysWidgetBridge: Capacitor bridge not found"
                    )
                }
                return
            }

            bridge.registerPluginInstance(
                IdolDaysWidgetBridgePlugin()
            )

            print(
                "✅ IdolDaysWidgetBridge native plugin registered"
            )
        }
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
